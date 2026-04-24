from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.equipment_constraint import EquipmentConstraint, CONSTRAINT_TYPES
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/equipment-constraints", tags=["equipment-constraints"])


class ConstraintOut(BaseModel):
    id: str
    config_id: str
    equipment_a_id: str
    equipment_b_id: str
    constraint_type: str
    description: str | None = None
    created_by: str | None = None
    created_at: str

    class Config:
        from_attributes = True


class ConstraintCreate(BaseModel):
    config_id: str
    equipment_a_id: str
    equipment_b_id: str
    constraint_type: str
    description: str | None = None


@router.get("", response_model=list[ConstraintOut])
async def list_constraints(
    config_id: str | None = Query(None),
    equipment_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    stmt = select(EquipmentConstraint)
    if config_id:
        stmt = stmt.where(EquipmentConstraint.config_id == config_id)
    if equipment_id:
        stmt = stmt.where(
            or_(
                EquipmentConstraint.equipment_a_id == equipment_id,
                EquipmentConstraint.equipment_b_id == equipment_id,
            )
        )
    stmt = stmt.order_by(EquipmentConstraint.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=ConstraintOut, status_code=status.HTTP_201_CREATED)
async def create_constraint(
    body: ConstraintCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.constraint_type not in CONSTRAINT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid constraint_type. Must be one of: {', '.join(CONSTRAINT_TYPES)}",
        )

    constraint = EquipmentConstraint(
        config_id=body.config_id,
        equipment_a_id=body.equipment_a_id,
        equipment_b_id=body.equipment_b_id,
        constraint_type=body.constraint_type,
        description=body.description,
        created_by=current_user.id,
    )
    db.add(constraint)
    await db.commit()
    await db.refresh(constraint)
    return constraint


@router.delete("/{constraint_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_constraint(
    constraint_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(EquipmentConstraint).where(EquipmentConstraint.id == constraint_id)
    )
    constraint = result.scalar_one_or_none()
    if constraint is None:
        raise HTTPException(status_code=404, detail="Constraint not found")
    await db.delete(constraint)
    await db.commit()
