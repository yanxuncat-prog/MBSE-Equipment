"""AI report generation with rule-based fallback and optional LLM support."""
import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.equipment import Equipment
from app.models.configuration import Configuration, ConfigEquipment
from app.models.do160 import DO160Record
from app.models.ai_report import AIReport
from app.api.deps import get_current_user

router = APIRouter(prefix="/ai-reports", tags=["ai-reports"])


# ── Pydantic schemas ────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    config_id: str
    template_text: str | None = None
    report_title: str


# ── Helpers ──────────────────────────────────────────────────────────

async def _load_equipment_data(db: AsyncSession, config_id: str) -> list[dict]:
    """Load all equipment data for a configuration."""
    q = (
        select(ConfigEquipment, Equipment)
        .join(Equipment, ConfigEquipment.equipment_id == Equipment.id)
        .where(ConfigEquipment.config_id == config_id)
    )
    result = await db.execute(q)
    rows = result.all()
    items = []
    for ce, eq in rows:
        items.append({
            "name": eq.name,
            "part_number": eq.part_number,
            "ata": eq.ata_chapter,
            "equipment_type": eq.equipment_type,
            "weight_kg": ce.mass_kg,
            "power_normal_kw": ce.power_kva_normal,
            "power_emergency_kw": ce.power_kva_emergency,
            "power_max_kw": ce.power_kva_max,
            "is_electrical": eq.is_electrical,
            "dimensions_mm": eq.dimensions_mm,
            "dal": eq.dal,
            "status": eq.status,
        })
    return items


async def _get_config_name(db: AsyncSession, config_id: str) -> str:
    result = await db.execute(select(Configuration).where(Configuration.id == config_id))
    config = result.scalar_one_or_none()
    if config:
        return f"{config.version}"
    return config_id


async def _get_do160_summary(db: AsyncSession, config_id: str) -> dict:
    total_result = await db.execute(
        select(func.count()).select_from(DO160Record).where(DO160Record.config_id == config_id)
    )
    total = total_result.scalar() or 0
    compliant_result = await db.execute(
        select(func.count()).select_from(DO160Record).where(
            DO160Record.config_id == config_id,
            DO160Record.compliance_status == "compliant",
        )
    )
    compliant = compliant_result.scalar() or 0
    return {"total": total, "compliant": compliant, "non_compliant": total - compliant}


def _generate_rule_based_report(
    config_name: str,
    items: list[dict],
    do160: dict,
    template: str | None,
) -> str:
    """Generate a structured report using rule-based logic (no LLM)."""
    total_count = len(items)
    total_weight = sum(i["weight_kg"] or 0 for i in items)
    total_power_normal = sum(i["power_normal_kw"] or 0 for i in items)
    total_power_emergency = sum(i["power_emergency_kw"] or 0 for i in items)
    total_power_max = sum(i["power_max_kw"] or 0 for i in items)
    electrical_count = sum(1 for i in items if i["is_electrical"])

    # Group by ATA
    ata_groups: dict[str, list[dict]] = {}
    for item in items:
        ata = item["ata"] or "未分类"
        ata_groups.setdefault(ata, []).append(item)

    # If a template is provided, do keyword replacement
    if template:
        report = template
        replacements = {
            "{{设备总数}}": str(total_count),
            "{{总重量}}": f"{total_weight:.2f}",
            "{{构型名称}}": config_name,
            "{{电设备数量}}": str(electrical_count),
            "{{总功耗_正常}}": f"{total_power_normal:.2f}",
            "{{总功耗_应急}}": f"{total_power_emergency:.2f}",
            "{{总功耗_峰值}}": f"{total_power_max:.2f}",
            "{{ATA章节数}}": str(len(ata_groups)),
            "{{DO160_总数}}": str(do160["total"]),
            "{{DO160_合规}}": str(do160["compliant"]),
            "{{DO160_不合规}}": str(do160["non_compliant"]),
        }
        for key, value in replacements.items():
            report = report.replace(key, value)
        return report

    # Default: generate a standard equipment summary report
    lines = [
        f"# {config_name} 设备综合报告",
        "",
        f"*生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M')}*",
        "",
        "---",
        "",
        "## 一、概览统计",
        "",
        f"| 指标 | 数值 |",
        f"|------|------|",
        f"| 设备总数 | {total_count} |",
        f"| 总重量 | {total_weight:.2f} kg |",
        f"| 电设备数量 | {electrical_count} |",
        f"| ATA 章节数 | {len(ata_groups)} |",
        "",
        "## 二、重量统计（按 ATA 章节）",
        "",
        "| ATA 章节 | 设备数 | 总重量 (kg) | 平均重量 (kg) |",
        "|----------|--------|-------------|---------------|",
    ]

    for ata in sorted(ata_groups.keys()):
        group = ata_groups[ata]
        count = len(group)
        weight = sum(i["weight_kg"] or 0 for i in group)
        avg = weight / count if count > 0 else 0
        lines.append(f"| {ata} | {count} | {weight:.2f} | {avg:.2f} |")

    lines.extend([
        "",
        "## 三、电气功耗汇总",
        "",
        "| 工况 | 总功耗 (kW) |",
        "|------|-------------|",
        f"| 正常 | {total_power_normal:.2f} |",
        f"| 应急 | {total_power_emergency:.2f} |",
        f"| 峰值 | {total_power_max:.2f} |",
        "",
    ])

    # Electrical details by equipment
    elec_items = [i for i in items if i["is_electrical"]]
    if elec_items:
        lines.extend([
            "### 电设备明细",
            "",
            "| 设备名称 | 件号 | 正常 (kW) | 应急 (kW) | 峰值 (kW) |",
            "|----------|------|-----------|-----------|-----------|",
        ])
        for item in elec_items:
            lines.append(
                f"| {item['name']} | {item['part_number']} "
                f"| {item['power_normal_kw'] or 0:.2f} "
                f"| {item['power_emergency_kw'] or 0:.2f} "
                f"| {item['power_max_kw'] or 0:.2f} |"
            )
        lines.append("")

    lines.extend([
        "## 四、DO-160 环境鉴定合规概览",
        "",
        "| 指标 | 数值 |",
        "|------|------|",
        f"| 鉴定记录总数 | {do160['total']} |",
        f"| 合规 | {do160['compliant']} |",
        f"| 不合规 | {do160['non_compliant']} |",
        f"| 合规率 | {(do160['compliant'] / do160['total'] * 100) if do160['total'] > 0 else 0:.1f}% |",
        "",
        "---",
        "",
        "*本报告由 AeroEquip 平台自动生成*",
    ])

    return "\n".join(lines)


def _to_dict(r: AIReport) -> dict:
    return {
        "id": r.id,
        "config_id": r.config_id,
        "title": r.title,
        "template": r.template,
        "content": r.content,
        "generated_at": r.generated_at.isoformat() if r.generated_at else None,
    }


# ── Endpoints ────────────────────────────────────────────────────────

@router.post("/generate")
async def generate_report(
    body: GenerateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Load data
    items = await _load_equipment_data(db, body.config_id)
    config_name = await _get_config_name(db, body.config_id)
    do160 = await _get_do160_summary(db, body.config_id)

    ai_api_key = os.environ.get("AI_API_KEY")

    if ai_api_key:
        # Build context for LLM
        context_lines = [f"构型: {config_name}", f"设备数量: {len(items)}", ""]
        for item in items:
            context_lines.append(
                f"- {item['name']} (件号: {item['part_number']}, ATA: {item['ata']}, "
                f"重量: {item['weight_kg'] or '未知'}kg, "
                f"功耗: {item['power_normal_kw'] or 0}kW)"
            )
        context = "\n".join(context_lines)
        prompt = f"""请基于以下设备数据生成一份专业的航空设备管理报告。

报告标题: {body.report_title}

设备数据:
{context}

DO-160合规: {do160['compliant']}/{do160['total']} 合规

"""
        if body.template_text:
            prompt += f"请按照以下模板格式生成报告:\n{body.template_text}\n"
        else:
            prompt += "请包含: 概览统计、重量汇总(按ATA)、电气汇总、DO-160合规概览。\n"
        prompt += "\n请用Markdown格式输出。"

        try:
            import httpx
            async with httpx.AsyncClient(timeout=60) as http_client:
                resp = await http_client.post(
                    os.environ.get("AI_API_URL", "https://api.openai.com/v1/chat/completions"),
                    headers={"Authorization": f"Bearer {ai_api_key}", "Content-Type": "application/json"},
                    json={
                        "model": os.environ.get("AI_MODEL", "gpt-4o-mini"),
                        "messages": [
                            {"role": "system", "content": "你是航空设备管理专家，擅长生成专业的设备分析报告。"},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.3,
                    },
                )
                resp.raise_for_status()
                content = resp.json()["choices"][0]["message"]["content"]
        except Exception:
            # Fallback to rule-based if LLM fails
            content = _generate_rule_based_report(config_name, items, do160, body.template_text)
    else:
        # Rule-based fallback
        content = _generate_rule_based_report(config_name, items, do160, body.template_text)

    # Save to database
    report = AIReport(
        id=str(uuid.uuid4()),
        config_id=body.config_id,
        title=body.report_title,
        template=body.template_text,
        content=content,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return _to_dict(report)


@router.get("")
async def list_reports(
    config_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = (
        select(AIReport)
        .where(AIReport.config_id == config_id)
        .order_by(AIReport.generated_at.desc())
    )
    result = await db.execute(q)
    reports = result.scalars().all()
    return [_to_dict(r) for r in reports]


@router.get("/{report_id}")
async def get_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(AIReport).where(AIReport.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return _to_dict(report)


@router.delete("/{report_id}", status_code=204)
async def delete_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(AIReport).where(AIReport.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    await db.delete(report)
    await db.commit()
