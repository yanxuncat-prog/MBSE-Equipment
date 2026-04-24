from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/users", tags=["users"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

VALID_ROLES = ("pmo", "system_integrator", "config_admin", "discipline_lead", "discipline_engineer", "readonly")

ROLE_LABELS = [
    {"value": "pmo", "label": "项目管理办公室"},
    {"value": "system_integrator", "label": "系统集成工程师"},
    {"value": "config_admin", "label": "构型管理员"},
    {"value": "discipline_lead", "label": "专业主管"},
    {"value": "discipline_engineer", "label": "专业工程师"},
    {"value": "readonly", "label": "只读用户"},
]


# ── Schemas ───────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: str
    username: str
    display_name: str
    role: str
    specialty: str | None = None
    ata_chapters: dict | None = None
    is_active: bool

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    username: str
    password: str
    display_name: str
    role: str
    specialty: str | None = None
    ata_chapters: dict | None = None


class UserUpdate(BaseModel):
    display_name: str | None = None
    role: str | None = None
    specialty: str | None = None
    ata_chapters: dict | None = None
    is_active: bool | None = None


# ── Endpoints ─────────────────────────────────────────────────────────

@router.get("/roles")
async def list_roles(_: User = Depends(get_current_user)):
    return ROLE_LABELS


@router.get("", response_model=list[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(User).order_by(User.created_at))
    return result.scalars().all()


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if body.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}")

    # Check duplicate username
    existing = await db.execute(select(User).where(User.username == body.username))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Username already exists")

    user = User(
        username=body.username,
        hashed_password=pwd_context.hash(body.password),
        display_name=body.display_name,
        role=body.role,
        specialty=body.specialty,
        ata_chapters=body.ata_chapters,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: str,
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = body.model_dump(exclude_unset=True)

    if "role" in update_data and update_data["role"] not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}")

    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return user
