import uuid
from datetime import datetime

from sqlalchemy import String, Text, ForeignKey, DateTime, Table, Column, Enum as SAEnum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

CONFIG_STATUS = ("draft", "baseline", "frozen", "archived")

config_equipment = Table(
    "config_equipment",
    Base.metadata,
    Column("config_id", UUID(as_uuid=True), ForeignKey("configurations.id"), primary_key=True),
    Column("equipment_id", UUID(as_uuid=True), ForeignKey("equipment.id"), primary_key=True),
)


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
    equipment_list: Mapped[list["Equipment"]] = relationship(secondary=config_equipment)
