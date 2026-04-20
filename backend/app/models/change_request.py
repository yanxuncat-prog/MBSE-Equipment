import uuid
from datetime import datetime

from sqlalchemy import String, Text, ForeignKey, DateTime, Enum as SAEnum, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

CR_STATUS = ("draft", "validating", "reviewing", "approved", "rejected", "withdrawn")


class ChangeRequest(Base):
    __tablename__ = "change_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    config_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("configurations.id"))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    equipment_adds: Mapped[dict | None] = mapped_column(JSONB)
    equipment_dels: Mapped[dict | None] = mapped_column(JSONB)
    equipment_mods: Mapped[dict | None] = mapped_column(JSONB)
    impact_summary: Mapped[dict | None] = mapped_column(JSONB)
    status: Mapped[str] = mapped_column(SAEnum(*CR_STATUS, name="cr_status_enum"), default="draft")
    submitted_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
