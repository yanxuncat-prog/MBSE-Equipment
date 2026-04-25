import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.do160 import DO160Record, DO160_CATEGORIES, DO160_CATEGORY_LABELS
from app.api.deps import get_current_user

router = APIRouter(prefix="/do160", tags=["do160"])


# ── Pydantic schemas ────────────────────────────────────────────────

class DO160Create(BaseModel):
    config_id: str
    lin_number: str
    test_category: str
    design_level: str | None = None
    qual_level: str | None = None
    compliance_status: str = "pending"
    qual_report_number: str | None = None
    notes: str | None = None


class DO160Update(BaseModel):
    design_level: str | None = None
    qual_level: str | None = None
    compliance_status: str | None = None
    qual_report_number: str | None = None
    notes: str | None = None


# ── Helpers ──────────────────────────────────────────────────────────

def _to_dict(r: DO160Record) -> dict:
    return {
        "id": r.id,
        "config_id": r.config_id,
        "lin_number": r.lin_number,
        "test_category": r.test_category,
        "category_label": DO160_CATEGORY_LABELS.get(r.test_category, r.test_category),
        "design_level": r.design_level,
        "qual_level": r.qual_level,
        "compliance_status": r.compliance_status,
        "qual_report_number": r.qual_report_number,
        "notes": r.notes,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
    }


# ── Endpoints ────────────────────────────────────────────────────────

@router.get("/categories")
async def list_categories(
    user: User = Depends(get_current_user),
):
    return [
        {"key": cat, "label": DO160_CATEGORY_LABELS.get(cat, cat)}
        for cat in DO160_CATEGORIES
    ]


@router.get("/summary")
async def do160_summary(
    config_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    total_result = await db.execute(
        select(func.count()).select_from(DO160Record).where(DO160Record.config_id == config_id)
    )
    total_records = total_result.scalar() or 0

    categories = []
    for cat in DO160_CATEGORIES:
        cat_base = select(DO160Record).where(
            DO160Record.config_id == config_id,
            DO160Record.test_category == cat,
        )

        total_r = await db.execute(
            select(func.count()).select_from(cat_base.subquery())
        )
        cat_total = total_r.scalar() or 0

        compliant_r = await db.execute(
            select(func.count()).select_from(DO160Record).where(
                DO160Record.config_id == config_id,
                DO160Record.test_category == cat,
                DO160Record.compliance_status == "compliant",
            )
        )
        compliant = compliant_r.scalar() or 0

        non_compliant_r = await db.execute(
            select(func.count()).select_from(DO160Record).where(
                DO160Record.config_id == config_id,
                DO160Record.test_category == cat,
                DO160Record.compliance_status == "non_compliant",
            )
        )
        non_compliant = non_compliant_r.scalar() or 0

        pending = cat_total - compliant - non_compliant

        categories.append({
            "key": cat,
            "label": DO160_CATEGORY_LABELS.get(cat, cat),
            "total": cat_total,
            "compliant": compliant,
            "non_compliant": non_compliant,
            "pending": pending,
        })

    return {
        "total_records": total_records,
        "categories": categories,
    }


@router.get("")
async def list_do160(
    config_id: str = Query(...),
    lin_number: str | None = Query(None),
    test_category: str | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = select(DO160Record).where(DO160Record.config_id == config_id)
    count_q = select(func.count()).select_from(DO160Record).where(DO160Record.config_id == config_id)

    if lin_number:
        q = q.where(DO160Record.lin_number == lin_number)
        count_q = count_q.where(DO160Record.lin_number == lin_number)
    if test_category:
        q = q.where(DO160Record.test_category == test_category)
        count_q = count_q.where(DO160Record.test_category == test_category)

    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    q = q.order_by(DO160Record.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(q)
    records = result.scalars().all()

    return {
        "items": [_to_dict(r) for r in records],
        "total": total,
        "offset": offset,
        "limit": limit,
    }


@router.post("")
async def create_do160(
    body: DO160Create,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if body.test_category not in DO160_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid test_category '{body.test_category}'. Must be one of: {', '.join(DO160_CATEGORIES)}",
        )

    record = DO160Record(
        id=str(uuid.uuid4()),
        config_id=body.config_id,
        lin_number=body.lin_number,
        test_category=body.test_category,
        design_level=body.design_level,
        qual_level=body.qual_level,
        compliance_status=body.compliance_status,
        qual_report_number=body.qual_report_number,
        notes=body.notes,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return _to_dict(record)


@router.patch("/{record_id}")
async def update_do160(
    record_id: str,
    body: DO160Update,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(DO160Record).where(DO160Record.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="DO-160 record not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(record, key, value)

    await db.commit()
    await db.refresh(record)
    return _to_dict(record)


@router.delete("/{record_id}", status_code=204)
async def delete_do160(
    record_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(DO160Record).where(DO160Record.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="DO-160 record not found")

    await db.delete(record)
    await db.commit()
