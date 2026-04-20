import uuid

from sqlalchemy import Float, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Installation(Base):
    __tablename__ = "installations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("equipment.id"), unique=True)
    zone_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("zones.id"))
    sta: Mapped[float | None] = mapped_column(Float, comment="Fuselage Station")
    wl: Mapped[float | None] = mapped_column(Float, comment="Waterline")
    bl: Mapped[float | None] = mapped_column(Float, comment="Buttline")
    rack_position: Mapped[str | None] = mapped_column(String(50))

    equipment: Mapped["Equipment"] = relationship(back_populates="installation")
    zone: Mapped["Zone | None"] = relationship()
