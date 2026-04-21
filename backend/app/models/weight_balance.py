import uuid

from sqlalchemy import Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class WeightBalance(Base):
    __tablename__ = "weight_balances"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("equipment.id"), unique=True)
    mass_kg: Mapped[float] = mapped_column(Float)

    equipment: Mapped["Equipment"] = relationship(back_populates="weight_balance")
