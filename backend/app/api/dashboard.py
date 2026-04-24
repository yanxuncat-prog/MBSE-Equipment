from collections import Counter
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Equipment, Zone, Configuration, ConfigEquipment
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
    cid = config_id

    result = await db.execute(
        select(ConfigEquipmentModel)
        .options(
            selectinload(ConfigEquipmentModel.equipment),
            selectinload(ConfigEquipmentModel.zone),
        )
        .where(ConfigEquipmentModel.config_id == cid)
    )
    ce_list = list(result.scalars().unique().all())

    # --- ATA distribution ---
    ata_counter = Counter()
    for ce in ce_list:
        ata_counter[ce.equipment.ata_chapter] += 1
    ata_distribution = [{"ata": k, "count": v} for k, v in ata_counter.most_common(10)]

    # --- Zone distribution ---
    zone_counter = Counter()
    for ce in ce_list:
        if ce.zone:
            zone_counter[ce.zone.name] += 1
        else:
            zone_counter["未知"] += 1
    zone_distribution = [{"zone": k, "count": v} for k, v in zone_counter.most_common()]

    # --- Weight distribution by ATA (from per-config weight) ---
    weight_by_ata = Counter()
    total_weight = 0.0
    weight_count = 0
    for ce in ce_list:
        if ce.mass_kg is not None:
            weight_by_ata[ce.equipment.ata_chapter] += ce.mass_kg
            total_weight += ce.mass_kg
            weight_count += 1
    weight_distribution = [{"ata": k, "weight_kg": round(v, 1)} for k, v in weight_by_ata.most_common(10)]

    # --- CG summary (from per-config CG fields) ---
    cg_items = [ce for ce in ce_list if ce.cg_x is not None and ce.mass_kg is not None and ce.mass_kg > 0]
    if cg_items:
        total_cg_mass = sum(ce.mass_kg for ce in cg_items)
        cg_x_weighted = sum(ce.cg_x * ce.mass_kg for ce in cg_items) / total_cg_mass
        cg_y_weighted = sum((ce.cg_y or 0) * ce.mass_kg for ce in cg_items) / total_cg_mass
        cg_z_weighted = sum((ce.cg_z or 0) * ce.mass_kg for ce in cg_items) / total_cg_mass
        cg_summary = {
            "cg_x": round(cg_x_weighted, 1),
            "cg_y": round(cg_y_weighted, 1),
            "cg_z": round(cg_z_weighted, 1),
            "total_mass_kg": round(total_cg_mass, 1),
            "item_count": len(cg_items),
        }
    else:
        cg_summary = None

    # --- Config count ---
    config = await db.get(Configuration, cid)
    config_count_result = await db.execute(
        select(func.count(Configuration.id)).where(Configuration.program_id == config.program_id)
    )
    config_count = config_count_result.scalar() or 0

    # --- Data completeness ---
    total = len(ce_list)
    completeness = {}
    if total > 0:
        # Electrical/EICD: only count among electrical equipment
        electrical_items = [ce for ce in ce_list if ce.equipment.is_electrical is True]
        elec_total = len(electrical_items) if electrical_items else total  # fallback to all if is_electrical not populated

        has_weight = sum(1 for ce in ce_list if ce.mass_kg is not None)
        has_elec_load = sum(1 for ce in electrical_items if ce.power_kva_normal is not None) if electrical_items else sum(1 for ce in ce_list if ce.power_kva_normal is not None)
        has_eicd = sum(1 for ce in electrical_items if ce.equipment.has_eicd is not None) if electrical_items else sum(1 for ce in ce_list if ce.equipment.has_eicd is not None)
        has_do160 = 0  # DO-160 data now lives in do160_records table
        has_bonding = sum(1 for ce in (electrical_items or ce_list) if ce.bonding_type and ce.bonding_type.strip())
        has_install = sum(1 for ce in ce_list if ce.install_method and ce.install_method.strip())

        completeness = {
            "weight":    {"filled": has_weight, "total": total, "pct": round(has_weight / total * 100, 1)},
            "electrical":{"filled": has_elec_load, "total": elec_total, "pct": round(has_elec_load / elec_total * 100, 1) if elec_total > 0 else 0},
            "eicd":      {"filled": has_eicd, "total": elec_total, "pct": round(has_eicd / elec_total * 100, 1) if elec_total > 0 else 0},
            "do160":     {"filled": has_do160, "total": total, "pct": round(has_do160 / total * 100, 1)},
            "bonding":   {"filled": has_bonding, "total": elec_total, "pct": round(has_bonding / elec_total * 100, 1) if elec_total > 0 else 0},
            "install":   {"filled": has_install, "total": total, "pct": round(has_install / total * 100, 1)},
        }

    # --- Onboard status (fields removed from equipment model) ---
    onboard = {
        "first_flight": {"yes": 0, "no": 0, "unknown": total},
        "phase2":       {"yes": 0, "no": 0, "unknown": total},
    }

    # --- Electrical load by ATA (split propulsion vs avionics, from per-config fields) ---
    elec_by_ata = {}
    propulsion_kva = 0.0
    avionics_kva = 0.0
    for ce in ce_list:
        pwr = ce.power_kva_normal
        if pwr:
            ata = ce.equipment.ata_chapter
            elec_by_ata.setdefault(ata, 0.0)
            elec_by_ata[ata] += pwr
            if ata == "86":
                propulsion_kva += pwr
            else:
                avionics_kva += pwr
    elec_ata_sorted = sorted(
        [{"ata": k, "kva": round(v, 3)} for k, v in elec_by_ata.items() if k != "86"],
        key=lambda x: x["kva"], reverse=True
    )[:8]
    electrical_summary = {
        "propulsion_kva": round(propulsion_kva, 1),
        "avionics_kva": round(avionics_kva, 3),
        "avionics_by_ata": elec_ata_sorted,
    }

    return {
        "equipment_count": total,
        "weight_total_kg": round(total_weight, 1),
        "weight_equipped_count": weight_count,
        "config_count": config_count,
        "ata_distribution": ata_distribution,
        "zone_distribution": zone_distribution,
        "weight_distribution": weight_distribution,
        "cg_summary": cg_summary,
        "completeness": completeness,
        "onboard": onboard,
        "electrical_summary": electrical_summary,
    }
