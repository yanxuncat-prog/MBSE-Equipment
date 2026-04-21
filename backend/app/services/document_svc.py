import io
import uuid
from datetime import datetime, timezone
from collections import defaultdict

from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
from openpyxl import Workbook
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Equipment, Configuration, BusDefinition, Zone
from app.models.configuration import config_equipment
from app.services.constraint_svc import validate_config


TEMPLATE_DIR = "templates"
jinja_env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))


async def _load_config_equipment(db: AsyncSession, config_id: str) -> tuple[Configuration, list[Equipment]]:
    config = await db.get(Configuration, uuid.UUID(config_id))
    result = await db.execute(
        select(Equipment)
        .join(config_equipment, config_equipment.c.equipment_id == Equipment.id)
        .where(config_equipment.c.config_id == uuid.UUID(config_id))
        .options(
            selectinload(Equipment.installation),
            selectinload(Equipment.weight_balance),
            selectinload(Equipment.electrical_load),
        )
    )
    equip_list = list(result.scalars().unique().all())
    return config, equip_list


async def generate_equipment_list_pdf(db: AsyncSession, config_id: str) -> bytes:
    config, equip_list = await _load_config_equipment(db, config_id)

    # Load zone names
    zone_result = await db.execute(select(Zone))
    zone_map = {z.id: z.zone_code for z in zone_result.scalars().all()}

    # Load bus names
    bus_result = await db.execute(select(BusDefinition))
    bus_map = {b.id: b.bus_name for b in bus_result.scalars().all()}

    grouped = defaultdict(list)
    total_mass = 0.0
    for e in equip_list:
        item = {
            "part_number": e.part_number, "name": e.name, "equipment_type": e.equipment_type,
            "status": e.status,
            "mass_kg": f"{e.weight_balance.mass_kg:.1f}" if e.weight_balance else None,
            "zone_code": zone_map.get(e.installation.zone_id) if e.installation and e.installation.zone_id else None,
            "sta": f"{e.installation.sta:.0f}" if e.installation and e.installation.sta else None,
            "bus_name": bus_map.get(e.electrical_load.bus_id) if e.electrical_load else None,
            "power_kva": f"{e.electrical_load.power_kva_normal:.2f}" if e.electrical_load else None,
        }
        ata = e.ata_chapter.split("-")[0] if "-" in e.ata_chapter else e.ata_chapter
        grouped[ata].append(item)
        if e.weight_balance:
            total_mass += e.weight_balance.mass_kg

    template = jinja_env.get_template("equipment_list.html")
    html_str = template.render(
        config_version=config.version,
        generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        grouped_by_ata=dict(sorted(grouped.items())),
        total_count=len(equip_list),
        total_mass_kg=f"{total_mass:.1f}",
    )
    return HTML(string=html_str).write_pdf()


async def generate_equipment_list_xlsx(db: AsyncSession, config_id: str) -> bytes:
    config, equip_list = await _load_config_equipment(db, config_id)

    zone_result = await db.execute(select(Zone))
    zone_map = {z.id: z.zone_code for z in zone_result.scalars().all()}
    bus_result = await db.execute(select(BusDefinition))
    bus_map = {b.id: b.bus_name for b in bus_result.scalars().all()}

    wb = Workbook()
    ws = wb.active
    ws.title = "设备清单"
    ws.append(["件号", "名称", "ATA章节", "类型", "重量(kg)", "区域", "STA", "母线", "功耗(kVA)", "状态"])

    for e in sorted(equip_list, key=lambda x: (x.ata_chapter, x.part_number)):
        ws.append([
            e.part_number, e.name, e.ata_chapter, e.equipment_type,
            e.weight_balance.mass_kg if e.weight_balance else None,
            zone_map.get(e.installation.zone_id) if e.installation and e.installation.zone_id else None,
            e.installation.sta if e.installation else None,
            bus_map.get(e.electrical_load.bus_id) if e.electrical_load else None,
            e.electrical_load.power_kva_normal if e.electrical_load else None,
            e.status,
        ])

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


async def generate_weight_report_pdf(db: AsyncSession, config_id: str) -> bytes:
    config, equip_list = await _load_config_equipment(db, config_id)
    report = await validate_config(db, config_id)

    wb_engine_result = next((e for e in report.engines if e.engine_name == "weight_balance"), None)
    details = wb_engine_result.details if wb_engine_result else {}

    equipment_rows = []
    for e in sorted(equip_list, key=lambda x: x.ata_chapter):
        if e.weight_balance:
            equipment_rows.append({
                "part_number": e.part_number, "name": e.name, "ata_chapter": e.ata_chapter,
                "mass_kg": f"{e.weight_balance.mass_kg:.1f}",
                "arm_sta": f"{e.weight_balance.arm_sta:.0f}",
                "moment": f"{e.weight_balance.mass_kg * e.weight_balance.arm_sta:.0f}",
            })

    status = wb_engine_result.status if wb_engine_result else "pass"
    template = jinja_env.get_template("weight_report.html")
    html_str = template.render(
        config_version=config.version,
        generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        total_mass_kg=f"{details.get('total_mass_kg', 0):.1f}",
        cg_sta=f"{details.get('cg_sta', 0):.1f}",
        cg_pct_mac=f"{details.get('cg_pct_mac', 0):.1f}",
        mtow_margin_kg=f"{details.get('mtow_margin_kg', 0):.1f}",
        mtow_ratio_pct=f"{details.get('mtow_ratio_pct', 0):.1f}",
        status_class=status,
        status_text={"pass": "✓ 包线内", "warning": "⚠ 接近限值", "blocked": "✗ 超限"}.get(status, status),
        equipment=equipment_rows,
    )
    return HTML(string=html_str).write_pdf()


async def generate_eload_report_pdf(db: AsyncSession, config_id: str, phase: str = "normal") -> bytes:
    config, equip_list = await _load_config_equipment(db, config_id)
    report = await validate_config(db, config_id, phase=phase)

    eload_result = next((e for e in report.engines if e.engine_name == "electrical_load"), None)
    bus_details = eload_result.details.get("buses", {}) if eload_result else {}

    bus_result = await db.execute(select(BusDefinition).where(BusDefinition.series_id == config.series_id))
    bus_defs = {str(b.id): b for b in bus_result.scalars().all()}

    buses = []
    for bid, info in bus_details.items():
        bdef = bus_defs.get(bid)
        ratio = info.get("load_ratio_pct", 0)
        status_class = "blocked" if ratio > 100 else "warning" if ratio > 85 else "pass"
        status_text = "过载" if ratio > 100 else "接近满载" if ratio > 85 else "正常"

        bus_equip = []
        for e in equip_list:
            if e.electrical_load and str(e.electrical_load.bus_id) == bid:
                bus_equip.append({
                    "part_number": e.part_number, "name": e.name, "ata_chapter": e.ata_chapter,
                    "power_normal": f"{e.electrical_load.power_kva_normal:.2f}",
                    "power_emergency": f"{e.electrical_load.power_kva_emergency:.2f}" if e.electrical_load.power_kva_emergency else None,
                    "power_max": f"{e.electrical_load.power_kva_max:.2f}" if e.electrical_load.power_kva_max else None,
                })

        buses.append({
            "bus_name": info.get("bus_name", ""), "bus_type": bdef.bus_type if bdef else "",
            "capacity_kva": f"{info.get('capacity_kva', 0):.1f}",
            "load_kva": f"{info.get('load_kva', 0):.1f}",
            "load_ratio_pct": f"{ratio:.1f}",
            "margin_kva": f"{info.get('margin_kva', 0):.1f}",
            "status_class": status_class, "status_text": status_text,
            "equipment": bus_equip,
        })

    template = jinja_env.get_template("eload_report.html")
    html_str = template.render(
        config_version=config.version, phase=phase,
        generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        buses=buses,
    )
    return HTML(string=html_str).write_pdf()
