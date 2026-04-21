import uuid
from datetime import datetime

from sqlalchemy import String, Text, Float, ForeignKey, DateTime, Enum as SAEnum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

CONFIG_STATUS = ("draft", "baseline", "frozen", "archived")


class ConfigEquipment(Base):
    __tablename__ = "config_equipment"

    config_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("configurations.id"), primary_key=True)
    equipment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("equipment.id"), primary_key=True)

    # Installation position (config-specific)
    zone_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("zones.id"))
    sta: Mapped[float | None] = mapped_column(Float, comment="Fuselage Station")
    wl: Mapped[float | None] = mapped_column(Float, comment="Waterline")
    bl: Mapped[float | None] = mapped_column(Float, comment="Buttline")
    rack_position: Mapped[str | None] = mapped_column(String(100))

    # Bus assignment (config-specific)
    bus_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("bus_definitions.id"))

    notes: Mapped[str | None] = mapped_column(String(500))

    # Relationships
    equipment: Mapped["Equipment"] = relationship()
    zone: Mapped["Zone | None"] = relationship()
    bus: Mapped["BusDefinition | None"] = relationship()


class Configuration(Base):
    __tablename__ = "configurations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    series_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("series.id"))
    version: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(SAEnum(*CONFIG_STATUS, name="config_status_enum"), default="draft")
    description: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    series: Mapped["Series"] = relationship(back_populates="configurations")
    config_equipment_entries: Mapped[list["ConfigEquipment"]] = relationship(cascade="all, delete-orphan")
