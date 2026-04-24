import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, JSON, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(20), default="engineer")
    specialty: Mapped[str | None] = mapped_column(String(50), comment="专业方向: weight/electrical/environment/layout/procurement")
    ata_chapters: Mapped[dict | None] = mapped_column(JSON, comment="负责的ATA章节列表")
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
