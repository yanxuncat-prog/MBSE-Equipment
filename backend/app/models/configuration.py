import uuid
from datetime import date, datetime

from sqlalchemy import String, Text, Float, Date, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

CONFIG_STATUS = ("draft", "baseline", "frozen", "archived")


class ConfigEquipment(Base):
    __tablename__ = "config_equipment"

    config_id: Mapped[str] = mapped_column(String(36), ForeignKey("configurations.id"), primary_key=True)
    equipment_id: Mapped[str] = mapped_column(String(36), ForeignKey("equipment.id"), primary_key=True)

    # Installation position (config-specific)
    zone_id: Mapped[str | None] = mapped_column(ForeignKey("zones.id"))
    sta: Mapped[float | None] = mapped_column(Float, comment="Fuselage Station")
    wl: Mapped[float | None] = mapped_column(Float, comment="Waterline")
    bl: Mapped[float | None] = mapped_column(Float, comment="Buttline")
    rack_position: Mapped[str | None] = mapped_column(String(100))

    # Bus assignment (config-specific)
    bus_id: Mapped[str | None] = mapped_column(ForeignKey("bus_definitions.id"))

    notes: Mapped[str | None] = mapped_column(String(500))

    # Display name override (may differ from Equipment.name per config)
    config_name: Mapped[str | None] = mapped_column(String(200), comment="构型中的设备名称(可与设备库名称不同)")

    # --- Per-config weight & CG ---
    mass_kg: Mapped[float | None] = mapped_column(Float, comment="设备实测重量(kg)")
    cg_x: Mapped[float | None] = mapped_column(Float, comment="重心X坐标(mm,全机坐标系)")
    cg_y: Mapped[float | None] = mapped_column(Float, comment="重心Y坐标(mm)")
    cg_z: Mapped[float | None] = mapped_column(Float, comment="重心Z坐标(mm)")
    inertia_ix: Mapped[float | None] = mapped_column(Float, comment="转动惯量Ix(kg·m²)")
    inertia_iy: Mapped[float | None] = mapped_column(Float, comment="转动惯量Iy(kg·m²)")
    inertia_iz: Mapped[float | None] = mapped_column(Float, comment="转动惯量Iz(kg·m²)")
    inertia_ixy: Mapped[float | None] = mapped_column(Float, comment="转动惯量Ixy(kg·m²)")
    inertia_ixz: Mapped[float | None] = mapped_column(Float, comment="转动惯量Ixz(kg·m²)")
    inertia_iyz: Mapped[float | None] = mapped_column(Float, comment="转动惯量Iyz(kg·m²)")
    weight_target_kg: Mapped[float | None] = mapped_column(Float, comment="重量指标(PACE分配,kg)")
    overweight_risk: Mapped[str | None] = mapped_column(String(200), comment="超重风险说明")

    # --- Per-config electrical load ---
    power_kva_normal: Mapped[float | None] = mapped_column(Float, comment="正常功耗(kW)")
    power_kva_emergency: Mapped[float | None] = mapped_column(Float, comment="应急功耗(kW)")
    power_kva_max: Mapped[float | None] = mapped_column(Float, comment="峰值功耗(kW)")

    # Bonding/grounding (config-specific because installation method varies)
    install_method: Mapped[str | None] = mapped_column(String(200), comment="安装方式")
    bonding_method: Mapped[str | None] = mapped_column(String(50), comment="电搭接方式")
    bonding_type: Mapped[str | None] = mapped_column(String(100), comment="电搭接类型")
    bonding_resistance: Mapped[str | None] = mapped_column(String(50), comment="电搭接阻值要求(mΩ)")
    bonding_position: Mapped[str | None] = mapped_column(String(200), comment="搭接位置(结构零件号)")
    in_pace_drawing: Mapped[bool | None] = mapped_column(comment="是否已在PACE图纸中体现")
    layout_adjustment: Mapped[str | None] = mapped_column(String(500), comment="总体布置调整需求")
    use_batch0_device: Mapped[bool | None] = mapped_column(comment="是否使用0号机设备")

    # Procurement tracking
    procurement_status: Mapped[str | None] = mapped_column(String(20), comment="采购状态: inquiry/contracted/producing/inspecting/shipping/delivered")
    procurement_location: Mapped[str | None] = mapped_column(String(50), comment="设备当前位置城市")
    planned_delivery_date: Mapped[date | None] = mapped_column(Date, comment="计划交付日期")
    estimated_delivery_date: Mapped[date | None] = mapped_column(Date, comment="预计/实际交付日期")
    procurement_notes: Mapped[str | None] = mapped_column(Text, comment="采购备注")

    # Physical asset lifecycle (8-step checklist)
    actual_arrival_date: Mapped[date | None] = mapped_column(Date, comment="实际到货日期")
    micd_confirmed: Mapped[bool | None] = mapped_column(comment="MICD是否已签署确认")
    structure_ready: Mapped[bool | None] = mapped_column(comment="实物是否已开口(结构准备完成)")
    installation_ready: Mapped[bool | None] = mapped_column(comment="设备是否达到安装要求")
    planned_install_date: Mapped[date | None] = mapped_column(Date, comment="计划上机日期")
    actual_install_date: Mapped[date | None] = mapped_column(Date, comment="实际上机日期")

    # Relationships
    equipment: Mapped["Equipment"] = relationship()
    zone: Mapped["Zone | None"] = relationship()
    bus: Mapped["BusDefinition | None"] = relationship()


class Configuration(Base):
    __tablename__ = "configurations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    program_id: Mapped[str] = mapped_column(ForeignKey("programs.id"))
    version: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default="draft")
    description: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    frozen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), comment="基线冻结时间，非空表示已冻结")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    program: Mapped["Program"] = relationship(back_populates="configurations")
    config_equipment_entries: Mapped[list["ConfigEquipment"]] = relationship(cascade="all, delete-orphan")
