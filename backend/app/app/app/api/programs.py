import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Program, Series
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.program import ProgramCreate, ProgramResponse, SeriesCreate, SeriesResponse

router = APIRouter(tags=["programs"])


@router.get("/programs", response_model=list[ProgramResponse])
async def list_programs(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Program).order_by(Program.name))
    return list(result.scalars().all())


@router.post("/programs", response_model=ProgramResponse, status_code=201)
async def create_program(
    data: ProgramCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    prog = Program(
        name=data.name,
        aircraft_type=data.aircraft_type,
        description=data.description,
    )
    db.add(prog)
    await db.commit()
    await db.refresh(prog)
    return prog


@router.get("/series", response_model=list[SeriesResponse])
async def list_series(
    program_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Series)
        .where(Series.program_id == uuid.UUID(program_id))
        .order_by(Series.variant_name)
    )
    return list(result.scalars().all())


@router.post("/series", response_model=SeriesResponse, status_code=201)
async def create_series(
    data: SeriesCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    s = Series(
        program_id=uuid.UUID(data.program_id),
        variant_name=data.variant_name,
        description=data.description,
    )
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return s
