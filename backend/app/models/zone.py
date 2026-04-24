import uuid

from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Zone(Base):
    __tablename__ = "zones"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    program_id: Mapped[str] = mapped_column(ForeignKey("programs.id"))
    zone_code: Mapped[str] = mapped_column(String(20), index=True)
    name: Mapped[str] = mapped_column(String(100))
    sta_from: Mapped[float] = mapped_column(Float)
    sta_to: Mapped[float] = mapped_column(Float)
    wl_from: Mapped[float | None] = mapped_column(Float)
    wl_to: Mapped[float | None] = mapped_column(Float)
    bl_from: Mapped[float | None] = mapped_column(Float)
    bl_to: Mapped[float | None] = mapped_column(Float)
    env_category: Mapped[str | None] = mapped_column(String(50))
