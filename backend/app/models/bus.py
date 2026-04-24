import uuid

from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class BusDefinition(Base):
    __tablename__ = "bus_definitions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    program_id: Mapped[str] = mapped_column(ForeignKey("programs.id"))
    bus_name: Mapped[str] = mapped_column(String(50))
    bus_type: Mapped[str] = mapped_column(String(10))
    rated_capacity_kva: Mapped[float] = mapped_column(Float)
    redundancy_group: Mapped[str | None] = mapped_column(String(50))
