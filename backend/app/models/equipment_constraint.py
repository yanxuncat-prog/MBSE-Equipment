import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

CONSTRAINT_TYPES = ("spatial_dependency", "spatial_conflict", "power_dependency", "thermal_adjacency")


class EquipmentConstraint(Base):
    __tablename__ = "equipment_constraints"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    config_id: Mapped[str] = mapped_column(String(36), index=True)
    equipment_a_id: Mapped[str] = mapped_column(String(36), index=True)
    equipment_b_id: Mapped[str] = mapped_column(String(36), index=True)
    constraint_type: Mapped[str] = mapped_column(String(30))
    description: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[str | None] = mapped_column(String(36))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
