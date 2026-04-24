import uuid

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class WeightBalance(Base):
    __tablename__ = "weight_balances"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    equipment_id: Mapped[str] = mapped_column(ForeignKey("equipment.id"), unique=True)
    mass_kg: Mapped[float] = mapped_column(Float)

    equipment: Mapped["Equipment"] = relationship(back_populates="weight_balance")
