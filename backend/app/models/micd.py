import uuid
from datetime import datetime, date
from sqlalchemy import String, Text, Float, Boolean, Date, ForeignKey, DateTime, func, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class MICDRecord(Base):
    __tablename__ = "micd_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    config_id: Mapped[str] = mapped_column(String(36), index=True, comment="所属构型ID")
    equipment_id: Mapped[str] = mapped_column(String(36), index=True, comment="所属设备ID")

    installation_structure_id: Mapped[str | None] = mapped_column(String(100), comment="安装结构件编号")
    bonding_surface: Mapped[str | None] = mapped_column(String(200), comment="电搭接面")
    fastener_brand: Mapped[str | None] = mapped_column(String(100), comment="紧固件牌号")
    fastener_count: Mapped[int | None] = mapped_column(Integer, comment="紧固件数量")
    fastener_team: Mapped[str | None] = mapped_column(String(100), comment="紧固件归属团队")
    bracket_model: Mapped[str | None] = mapped_column(String(100), comment="设备托架型号")
    bracket_source: Mapped[str | None] = mapped_column(String(20), comment="托架来源: 自制/外购")
    bracket_mass_kg: Mapped[float | None] = mapped_column(Float, comment="托架重量(kg)")
    screw_spec: Mapped[str | None] = mapped_column(String(100), comment="螺钉规格")
    wire_bonding_size: Mapped[str | None] = mapped_column(String(100), comment="线搭接接口尺寸")
    model_config: Mapped[str | None] = mapped_column(String(100), comment="数模采用构型")
    has_tolerance_drawing: Mapped[bool | None] = mapped_column(Boolean, comment="是否包含公差尺寸工程图")
    tolerance_drawing_url: Mapped[str | None] = mapped_column(String(500), comment="公差尺寸工程图附件路径")

    is_confirmed: Mapped[bool] = mapped_column(Boolean, default=False, comment="是否已签字确认MICD")
    confirmed_at: Mapped[date | None] = mapped_column(Date, comment="确认日期")
    confirmed_by: Mapped[str | None] = mapped_column(String(50), comment="确认人")

    notes: Mapped[str | None] = mapped_column(Text, comment="备注")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
