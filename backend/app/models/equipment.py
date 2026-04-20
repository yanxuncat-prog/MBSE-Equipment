import uuid
from datetime import datetime

from sqlalchemy import String, Text, Enum as SAEnum, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

EQUIPMENT_TYPES = ("LRU", "SRU", "structural", "cable")
EQUIPMENT_STATUS = ("in_development", "qualifying", "approved", "discontinued")


class Equipment(Base):
    __tablename__ = "equipment"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    part_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    ata_chapter: Mapped[str] = mapped_column(String(20), index=True)
    equipment_type: Mapped[str] = mapped_column(SAEnum(*EQUIPMENT_TYPES, name="equipment_type_enum"))
    supplier_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("suppliers.id"))
    status: Mapped[str] = mapped_column(SAEnum(*EQUIPMENT_STATUS, name="equipment_status_enum"), default="in_development")
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    supplier: Mapped["Supplier | None"] = relationship(back_populates="equipment_list")
    installation: Mapped["Installation | None"] = relationship(back_populates="equipment", uselist=False, cascade="all, delete-orphan")
    weight_balance: Mapped["WeightBalance | None"] = relationship(back_populates="equipment", uselist=False, cascade="all, delete-orphan")
    electrical_load: Mapped["ElectricalLoad | None"] = relationship(back_populates="equipment", uselist=False, cascade="all, delete-orphan")
