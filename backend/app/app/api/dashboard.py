import uuid
from collections import Counter
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Equipment, WeightBalance, Zone, Configuration, ConfigEquipment
from app.models.configuration import ConfigEquipment as ConfigEquipmentModel
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

    # Load config equipment entries with zone info
    result = await db.execute(
        select(ConfigEquipmentModel)
        .options(
            selectinload(ConfigEquipmentModel.equipment).selectinload(Equipment.weight_balance),
            selectinload(ConfigEquipmentModel.zone),
        )
        .where(ConfigEquipmentModel.config_id == cid)
    )
    ce_list = list(result.scalars().unique().all())

    # ATA distribution
    ata_counter = Counter()
    for ce in ce_list:
        ata_counter[ce.equipment.ata_chapter] += 1
    ata_distribution = [{"ata": k, "count": v} for k, v in ata_counter.most_common(10)]

    # Zone distribution (zone is now on ConfigEquipment, not on Installation)
    zone_counter = Counter()
    for ce in ce_list:
        if ce.zone:
            zone_counter[ce.zone.name] += 1
        else:
            zone_counter["未知"] += 1
    zone_distribution = [{"zone": k, "count": v} for k, v in zone_counter.most_common()]

    # Weight distribution by ATA
    weight_by_ata = Counter()
    total_weight = 0.0
    weight_count = 0
    for ce in ce_list:
        e = ce.equipment
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
        "equipment_count": len(ce_list),
        "weight_total_kg": round(total_weight, 1),
        "weight_equipped_count": weight_count,
        "config_count": config_count,
        "ata_distribution": ata_distribution,
        "zone_distribution": zone_distribution,
        "weight_distribution": weight_distribution,
    }
