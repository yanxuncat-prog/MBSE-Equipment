import uuid

from sqlalchemy import Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ElectricalLoad(Base):
    __tablename__ = "electrical_loads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("equipment.id"), unique=True)
    power_kva_normal: Mapped[float] = mapped_column(Float, comment="Normal mode power draw (kVA)")
    power_kva_emergency: Mapped[float | None] = mapped_column(Float, comment="Emergency mode (kVA)")
    power_kva_max: Mapped[float | None] = mapped_column(Float, comment="Max/transient (kVA)")

    equipment: Mapped["Equipment"] = relationship(back_populates="electrical_load")
