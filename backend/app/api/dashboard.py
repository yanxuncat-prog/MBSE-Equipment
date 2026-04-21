import uuid
from collections import Counter
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Equipment, Installation, WeightBalance, Zone, Configuration
from app.models.configuration import config_equipment
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    config_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    cid = uuid.UUID(config_id)

    # Equipment in this config with sub-tables
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Equipment)
        .join(config_equipment, config_equipment.c.equipment_id == Equipment.id)
        .where(config_equipment.c.config_id == cid)
        .options(
            selectinload(Equipment.installation),
            selectinload(Equipment.weight_balance),
        )
    )
    equipment_list = list(result.scalars().unique().all())

    # ATA distribution
    ata_counter = Counter()
    for e in equipment_list:
        ata_counter[e.ata_chapter] += 1
    ata_distribution = [{"ata": k, "count": v} for k, v in ata_counter.most_common(10)]

    # Zone distribution
    zone_counter = Counter()
    zone_result = await db.execute(select(Zone))
    zone_map = {z.id: z.name for z in zone_result.scalars().all()}
    for e in equipment_list:
        if e.installation and e.installation.zone_id:
            zone_name = zone_map.get(e.installation.zone_id, "未知")
            zone_counter[zone_name] += 1
        else:
            zone_counter["未知"] += 1
    zone_distribution = [{"zone": k, "count": v} for k, v in zone_counter.most_common()]

    # Weight distribution by ATA
    weight_by_ata = Counter()
    total_weight = 0.0
    weight_count = 0
    for e in equipment_list:
        if e.weight_balance:
            weight_by_ata[e.ata_chapter] += e.weight_balance.mass_kg
            total_weight += e.weight_balance.mass_kg
            weight_count += 1
    weight_distribution = [{"ata": k, "weight_kg": round(v, 1)} for k, v in weight_by_ata.most_common(10)]

    # Config count for this series
    config = await db.get(Configuration, cid)
    config_count_result = await db.execute(
        select(func.count(Configuration.id)).where(Configuration.series_id == config.series_id)
    )
    config_count = config_count_result.scalar() or 0

    return {
        "equipment_count": len(equipment_list),
        "weight_total_kg": round(total_weight, 1),
        "weight_equipped_count": weight_count,
        "config_count": config_count,
        "ata_distribution": ata_distribution,
        "zone_distribution": zone_distribution,
        "weight_distribution": weight_distribution,
    }
