import uuid

from sqlalchemy import String, Float, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class BusDefinition(Base):
    __tablename__ = "bus_definitions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    series_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("series.id"))
    bus_name: Mapped[str] = mapped_column(String(50))
    bus_type: Mapped[str] = mapped_column(SAEnum("AC", "DC", name="bus_type_enum"))
    rated_capacity_kva: Mapped[float] = mapped_column(Float)
    redundancy_group: Mapped[str | None] = mapped_column(String(50))
