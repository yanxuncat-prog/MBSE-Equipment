import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class AIReport(Base):
    __tablename__ = "ai_reports"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    config_id: Mapped[str] = mapped_column(String(36), index=True)
    title: Mapped[str] = mapped_column(String(200))
    template: Mapped[str | None] = mapped_column(Text, comment="用户提供的模板文本")
    content: Mapped[str] = mapped_column(Text, comment="生成的报告内容(Markdown)")
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
