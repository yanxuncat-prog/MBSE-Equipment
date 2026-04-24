import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Program
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.program import ProgramCreate, ProgramResponse

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
