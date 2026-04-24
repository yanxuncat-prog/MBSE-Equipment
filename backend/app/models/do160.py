import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

DO160_CATEGORIES = (
    "sec4_temperature", "sec5_altitude", "sec6_temp_variation", "sec7_humidity",
    "sec8_shock", "sec9_vibration", "sec10_explosion", "sec11_waterproof",
    "sec12_fluids", "sec13_sand_dust", "sec14_fungus", "sec15_salt_spray",
    "sec16_magnetic", "sec17_grounding", "sec18_ac_power", "sec19_induced_signal",
    "sec20_rf_susceptibility", "sec21_rf_emission", "sec22_lightning_direct",
    "sec23_lightning_indirect", "sec24_icing", "sec25_esd", "sec26_fire", "sec27_smoke",
)

DO160_CATEGORY_LABELS = {
    "sec4_temperature": "温度(第4章)", "sec5_altitude": "高度(第5章)",
    "sec6_temp_variation": "温度变化(第6章)", "sec7_humidity": "湿度(第7章)",
    "sec8_shock": "冲击(第8章)", "sec9_vibration": "振动(第9章)",
    "sec10_explosion": "防爆(第10章)", "sec11_waterproof": "防水(第11章)",
    "sec12_fluids": "流体敏感性(第12章)", "sec13_sand_dust": "沙尘(第13章)",
    "sec14_fungus": "霉菌(第14章)", "sec15_salt_spray": "盐雾(第15章)",
    "sec16_magnetic": "磁效应(第16章)", "sec17_grounding": "接地(第17章)",
    "sec18_ac_power": "交流供电(第18章)", "sec19_induced_signal": "感应信号敏感度(第19章)",
    "sec20_rf_susceptibility": "射频敏感度(第20章)", "sec21_rf_emission": "射频发射(第21章)",
    "sec22_lightning_direct": "雷电直接效应(第22章)", "sec23_lightning_indirect": "雷电间接效应(第23章)",
    "sec24_icing": "结冰(第24章)", "sec25_esd": "静电放电(第25章)",
    "sec26_fire": "防火(第26章)", "sec27_smoke": "烟雾(第27章)",
}

class DO160Record(Base):
    __tablename__ = "do160_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    config_id: Mapped[str] = mapped_column(String(36), index=True, comment="所属构型ID")
    equipment_id: Mapped[str] = mapped_column(String(36), index=True, comment="所属设备ID")

    test_category: Mapped[str] = mapped_column(String(30), index=True, comment="DO-160测试类别")
    design_level: Mapped[str | None] = mapped_column(String(50), comment="设计要求等级(如A1, B2)")
    qual_level: Mapped[str | None] = mapped_column(String(50), comment="鉴定等级")
    compliance_status: Mapped[str] = mapped_column(String(20), default="pending", comment="compliant/non_compliant/pending/not_applicable")
    qual_report_number: Mapped[str | None] = mapped_column(String(200), comment="鉴定报告编号")
    notes: Mapped[str | None] = mapped_column(Text, comment="备注")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
