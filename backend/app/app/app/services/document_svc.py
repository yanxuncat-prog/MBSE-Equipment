import io
import uuid
from datetime import datetime, timezone
from collections import defaultdict

from jinja2 import Environment, FileSystemLoader
from openpyxl import Workbook

# WeasyPrint requires system libraries (pango/glib) -- lazy import to avoid crash if missing
def _get_weasyprint_html():
    from weasyprint import HTML
    return HTML
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Equipment, Configuration, BusDefinition, Zone, ConfigEquipment
from app.models.configuration import ConfigEquipment as ConfigEquipmentModel
from app.services.constraint_svc import validate_config


TEMPLATE_DIR = "templates"
jinja_env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))


async def _load_config_equipment(db: AsyncSession, config_id: str) -> tuple[Configuration, list[dict]]:
    """Load config and its equipment with config-level position/bus data."""
    config = await db.get(Configuration, uuid.UUID(config_id))
    result = await db.execute(
        select(ConfigEquipmentModel)
        .options(
            selectinload(ConfigEquipmentModel.equipment).selectinload(Equipment.weight_balance),
            selectinload(ConfigEquipmentModel.equipment).selectinload(Equipment.electrical_load),
            selectinload(ConfigEquipmentModel.equipment).selectinload(Equipment.supplier),
            selectinload(ConfigEquipmentModel.zone),
            selectinload(ConfigEquipmentModel.bus),
        )
        .where(ConfigEquipmentModel.config_id == uuid.UUID(config_id))
    )
    ce_list = list(result.scalars().unique().all())

    # Build enriched dicts for each equipment
    items = []
    for ce in ce_list:
        e = ce.equipment
        items.append({
            "equipment": e,
            "zone_id": ce.zone_id,
            "zone_code": ce.zone.zone_code if ce.zone else None,
            "zone_name": ce.zone.name if ce.zone else None,
            "sta": ce.sta,
            "wl": ce.wl,
            "bl": ce.bl,
            "rack_position": ce.rack_position,
            "bus_id": ce.bus_id,
            "bus_name": ce.bus.bus_name if ce.bus else None,
        })

    return config, items


async def generate_equipment_list_pdf(db: AsyncSession, config_id: str) -> bytes:
    config, items = await _load_config_equipment(db, config_id)

    grouped = defaultdict(list)
    total_mass = 0.0
    for item in items:
        e = item["equipment"]
        row = {
            "part_number": e.part_number, "name": e.name, "equipment_type": e.equipment_type,
            "status": e.status,
            "mass_kg": f"{e.weight_balance.mass_kg:.1f}" if e.weight_balance else None,
            "zone_code": item["zone_code"],
            "sta": f"{item['sta']:.0f}" if item["sta"] is not None else None,
            "bus_name": item["bus_name"],
            "power_kva": f"{e.electrical_load.power_kva_normal:.2f}" if e.electrical_load else None,
        }
        ata = e.ata_chapter.split("-")[0] if "-" in e.ata_chapter else e.ata_chapter
        grouped[ata].append(row)
        if e.weight_balance:
            total_mass += e.weight_balance.mass_kg

    template = jinja_env.get_template("equipment_list.html")
    html_str = template.render(
        config_version=config.version,
        generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        grouped_by_ata=dict(sorted(grouped.items())),
        total_count=len(items),
        total_mass_kg=f"{total_mass:.1f}",
    )
    return _get_weasyprint_html()(string=html_str).write_pdf()


async def generate_equipment_list_xlsx(db: AsyncSession, config_id: str) -> bytes:
    config, items = await _load_config_equipment(db, config_id)

    wb = Workbook()
    ws = wb.active
    ws.title = "设备清单"
    ws.append(["件号", "名称", "ATA章节", "类型", "重量(kg)", "区域", "STA", "母线", "功耗(kVA)", "状态"])

    sorted_items = sorted(items, key=lambda x: (x["equipment"].ata_chapter, x["equipment"].part_number))
    for item in sorted_items:
        e = item["equipment"]
        ws.append([
            e.part_number, e.name, e.ata_chapter, e.equipment_type,
            e.weight_balance.mass_kg if e.weight_balance else None,
            item["zone_code"],
            item["sta"],
            item["bus_name"],
            e.electrical_load.power_kva_normal if e.electrical_load else None,
            e.status,
        ])

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


async def generate_weight_report_pdf(db: AsyncSession, config_id: str) -> bytes:
    config, items = await _load_config_equipment(db, config_id)
    report = await validate_config(db, config_id)

    wb_engine_result = next((e for e in report.engines if e.engine_name == "weight_balance"), None)
    details = wb_engine_result.details if wb_engine_result else {}

    equipment_rows = []
    sorted_items = sorted(items, key=lambda x: x["equipment"].ata_chapter)
    for item in sorted_items:
        e = item["equipment"]
        if e.weight_balance:
            arm_sta = item["sta"] if item["sta"] is not None else 0.0
            equipment_rows.append({
                "part_number": e.part_number, "name": e.name, "ata_chapter": e.ata_chapter,
                "mass_kg": f"{e.weight_balance.mass_kg:.1f}",
                "arm_sta": f"{arm_sta:.0f}",
                "moment": f"{e.weight_balance.mass_kg * arm_sta:.0f}",
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
    return _get_weasyprint_html()(string=html_str).write_pdf()


async def generate_eload_report_pdf(db: AsyncSession, config_id: str, phase: str = "normal") -> bytes:
    config, items = await _load_config_equipment(db, config_id)
    report = await validate_config(db, config_id, phase=phase)

    eload_result = next((e for e in report.engines if e.engine_name == "electrical_load"), None)
    bus_details = eload_result.details.get("buses", {}) if eload_result else {}

    bus_result = await db.execute(select(BusDefinition).where(BusDefinition.series_id == config.series_id))
    bus_defs = {str(b.id): b for b in bus_result.scalars().all()}

    # Build a lookup: bus_id -> list of equipment items assigned to that bus in this config
    bus_equip_map = defaultdict(list)
    for item in items:
        if item["bus_id"] and item["equipment"].electrical_load:
            bus_equip_map[str(item["bus_id"])].append(item)

    buses = []
    for bid, info in bus_details.items():
        bdef = bus_defs.get(bid)
        ratio = info.get("load_ratio_pct", 0)
        status_class = "blocked" if ratio > 100 else "warning" if ratio > 85 else "pass"
        status_text = "过载" if ratio > 100 else "接近满载" if ratio > 85 else "正常"

        bus_equip = []
        for item in bus_equip_map.get(bid, []):
            e = item["equipment"]
            el = e.electrical_load
            bus_equip.append({
                "part_number": e.part_number, "name": e.name, "ata_chapter": e.ata_chapter,
                "power_normal": f"{el.power_kva_normal:.2f}",
                "power_emergency": f"{el.power_kva_emergency:.2f}" if el.power_kva_emergency else None,
                "power_max": f"{el.power_kva_max:.2f}" if el.power_kva_max else None,
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
    return _get_weasyprint_html()(string=html_str).write_pdf()
