from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.equipment import Equipment
from app.models.configuration import ConfigEquipment
from app.api.deps import get_current_user

router = APIRouter(prefix="/weight-reduction", tags=["weight-reduction"])


async def _load_config_items(db: AsyncSession, config_id: str) -> dict:
    """Load all ConfigEquipment + Equipment for a config, keyed by part_number."""
    result = await db.execute(
        select(
            ConfigEquipment,
            Equipment.part_number,
            Equipment.name,
            Equipment.ata_chapter,
        )
        .join(Equipment, ConfigEquipment.equipment_id == Equipment.id)
        .where(ConfigEquipment.config_id == config_id)
    )
    rows = result.all()

    items = {}
    for ce, part_number, name, ata_chapter in rows:
        items[part_number] = {
            "part_number": part_number,
            "name": name,
            "ata_chapter": ata_chapter,
            "mass_kg": ce.mass_kg,
        }
    return items


@router.get("")
async def weight_reduction(
    base_config_id: str = Query(...),
    compare_config_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    base_items = await _load_config_items(db, base_config_id)
    compare_items = await _load_config_items(db, compare_config_id)

    all_part_numbers = set(base_items.keys()) | set(compare_items.keys())

    result_items = []
    total_base_mass = 0.0
    total_compare_mass = 0.0

    for pn in all_part_numbers:
        in_base = pn in base_items
        in_compare = pn in compare_items

        base_info = base_items.get(pn, {})
        compare_info = compare_items.get(pn, {})

        base_mass = base_info.get("mass_kg") or 0.0
        compare_mass = compare_info.get("mass_kg") or 0.0
        diff_kg = base_mass - compare_mass

        total_base_mass += base_mass
        total_compare_mass += compare_mass

        name = base_info.get("name") or compare_info.get("name") or ""
        ata_chapter = base_info.get("ata_chapter") or compare_info.get("ata_chapter") or ""

        result_items.append({
            "part_number": pn,
            "name": name,
            "ata_chapter": ata_chapter,
            "base_mass_kg": base_mass,
            "compare_mass_kg": compare_mass,
            "diff_kg": round(diff_kg, 4),
            "in_base_only": in_base and not in_compare,
            "in_compare_only": in_compare and not in_base,
        })

    # Sort by diff_kg descending (largest reduction first)
    result_items.sort(key=lambda x: x["diff_kg"], reverse=True)

    base_only = sum(1 for it in result_items if it["in_base_only"])
    compare_only = sum(1 for it in result_items if it["in_compare_only"])
    matched = len(result_items) - base_only - compare_only

    return {
        "base_config_id": base_config_id,
        "compare_config_id": compare_config_id,
        "total_base_mass_kg": round(total_base_mass, 4),
        "total_compare_mass_kg": round(total_compare_mass, 4),
        "total_reduction_kg": round(total_base_mass - total_compare_mass, 4),
        "matched_count": matched,
        "base_only_count": base_only,
        "compare_only_count": compare_only,
        "items": result_items,
    }
