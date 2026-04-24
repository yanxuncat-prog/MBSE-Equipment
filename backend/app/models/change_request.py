import uuid
from datetime import datetime

from sqlalchemy import String, Text, ForeignKey, DateTime, JSON, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

CR_STATUS = ("draft", "validating", "reviewing", "approved", "rejected", "withdrawn")


class ChangeRequest(Base):
    __tablename__ = "change_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    config_id: Mapped[str] = mapped_column(ForeignKey("configurations.id"))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    equipment_adds: Mapped[dict | None] = mapped_column(JSON)
    equipment_dels: Mapped[dict | None] = mapped_column(JSON)
    equipment_mods: Mapped[dict | None] = mapped_column(JSON)
    impact_summary: Mapped[dict | None] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    submitted_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
