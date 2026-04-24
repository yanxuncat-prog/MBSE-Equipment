import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

EQUIPMENT_TYPES = ("LRU", "SRU", "structural", "cable")


class Equipment(Base):
    __tablename__ = "equipment"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    part_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    ata_chapter: Mapped[str] = mapped_column(String(20), index=True)
    equipment_type: Mapped[str] = mapped_column(String(20))
    supplier_id: Mapped[str | None] = mapped_column(ForeignKey("suppliers.id"))
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # --- Identity ---
    name_en: Mapped[str | None] = mapped_column(String(300), comment="英文名称")
    abbreviation_en: Mapped[str | None] = mapped_column(String(50), comment="英文缩写")
    supplier_part_number: Mapped[str | None] = mapped_column(String(100), comment="供应商件号")

    # --- Safety & Classification ---
    dal: Mapped[str | None] = mapped_column(String(5), comment="设计保证等级 A/B/C/D")
    is_electrical: Mapped[bool | None] = mapped_column(comment="是否是电设备")
    is_primary_electrical: Mapped[bool | None] = mapped_column(comment="是否一级用电设备")
    has_eicd: Mapped[bool | None] = mapped_column(comment="是否有EICD")

    # --- Physical characteristics ---
    dimensions_mm: Mapped[str | None] = mapped_column(String(100), comment="长×高×宽(mm)")
    is_metal_shell: Mapped[bool | None] = mapped_column(comment="壳体是否金属")
    metal_shell_non_conductive: Mapped[str | None] = mapped_column(String(200), comment="金属壳体是否经特殊处理不易导电")
    internal_grounding: Mapped[str | None] = mapped_column(String(200), comment="设备内共地情况")
    connector_count: Mapped[int | None] = mapped_column(Integer, comment="连接器或接线柱数量")

    # --- Electrical ---
    voltage_range: Mapped[str | None] = mapped_column(String(100), comment="正常工作电压范围(V)")
    power_redundancy: Mapped[str | None] = mapped_column(String(100), comment="供电余度")
    power_voltage: Mapped[str | None] = mapped_column(String(50), comment="供电电压")
    power_watts: Mapped[str | None] = mapped_column(String(50), comment="用电功率")

    # --- Grounding ---
    shell_grounding_method: Mapped[str | None] = mapped_column(String(100), comment="壳体接地方式")
    shell_grounding_fault_path: Mapped[str | None] = mapped_column(String(200), comment="壳体接地是否故障电流路径")
    grounding_special_requirements: Mapped[str | None] = mapped_column(Text, comment="其他接地特殊要求")

    # --- Notes ---
    notes: Mapped[str | None] = mapped_column(Text, comment="备注")

    # --- Relationships ---
    supplier: Mapped["Supplier | None"] = relationship(back_populates="equipment_list")
    weight_balance: Mapped["WeightBalance | None"] = relationship(back_populates="equipment", uselist=False, cascade="all, delete-orphan")
    electrical_load: Mapped["ElectricalLoad | None"] = relationship(back_populates="equipment", uselist=False, cascade="all, delete-orphan")
