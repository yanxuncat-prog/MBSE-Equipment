"""负载电气特性 + 飞行阶段定义 + 负载工作模式 三张表的模型。"""
import uuid

from sqlalchemy import String, Text, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ElectricalDetail(Base):
    """负载电气特性 — 每条负载记录的完整电气参数。"""
    __tablename__ = "electrical_details"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    config_id: Mapped[str] = mapped_column(String(36), ForeignKey("configurations.id"))
    load_id: Mapped[str] = mapped_column(String(100))            # 负载ID
    equipment_name: Mapped[str] = mapped_column(String(200))      # 设备名称
    lin_number: Mapped[str | None] = mapped_column(String(50))
    ata_chapter: Mapped[str | None] = mapped_column(String(100))  # 系统章节
    part_number: Mapped[str | None] = mapped_column(String(50))   # 设备编号
    voltage_level: Mapped[str | None] = mapped_column(String(20)) # 正常工作电压等级(V)
    voltage_range: Mapped[str | None] = mapped_column(String(50)) # 正常工作电压范围(V)
    soft_start: Mapped[str | None] = mapped_column(String(10))    # 是否需要软启动
    peak_power_kw: Mapped[str | None] = mapped_column(String(20)) # 峰值功率(kW)
    peak_power_time_s: Mapped[str | None] = mapped_column(String(20)) # 峰值功率时间(s)
    supply_channels: Mapped[str | None] = mapped_column(String(50))  # 供电路数
    dissimilar_supply: Mapped[str | None] = mapped_column(String(20)) # 有无供电非相似需求
    emergency_sheddable: Mapped[str | None] = mapped_column(String(10)) # 应急是否可卸载
    working_power_kw: Mapped[str | None] = mapped_column(String(20))  # 工作功率(kW)
    actual_power_kw: Mapped[str | None] = mapped_column(String(20))   # 实际功率(kW)
    power_margin: Mapped[str | None] = mapped_column(String(20))      # 功率余量
    measured_current_a: Mapped[str | None] = mapped_column(String(20))# 实测电流(A)
    peak_to_working_ratio: Mapped[str | None] = mapped_column(String(20)) # 峰值功率/工作功率


class FlightPhase(Base):
    """飞行阶段定义 — G0~G8 共9个阶段。"""
    __tablename__ = "flight_phases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    program_id: Mapped[str] = mapped_column(String(36), ForeignKey("programs.id"), comment="所属型号")
    phase_code: Mapped[str] = mapped_column(String(10))     # 阶段编号 G0~G8
    phase_name: Mapped[str] = mapped_column(String(50))     # 阶段名称
    original_phase: Mapped[str | None] = mapped_column(String(100)) # 原统计运行阶段
    duration_min: Mapped[str | None] = mapped_column(String(20))    # 时长(min)
    phase_definition: Mapped[str | None] = mapped_column(Text)      # 阶段定义
    control_surface: Mapped[str | None] = mapped_column(String(200))# 舵面情况
    speed_tas: Mapped[str | None] = mapped_column(String(50))       # 飞行速度TAS
    altitude: Mapped[str | None] = mapped_column(String(50))        # 飞行高度
    peak_simultaneity: Mapped[str | None] = mapped_column(String(20))  # 峰值最大功率同时系数
    emergency_simultaneity: Mapped[str | None] = mapped_column(String(20)) # 应急最大功率同时系数
    power_source_270v: Mapped[str | None] = mapped_column(String(100))  # 270V主要功率来源


class LoadWorkMode(Base):
    """负载工作模式 — 每个负载在每个飞行阶段的工作状态。"""
    __tablename__ = "load_work_modes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    config_id: Mapped[str] = mapped_column(String(36), ForeignKey("configurations.id"))
    load_id: Mapped[str] = mapped_column(String(100))            # 负载ID
    work_mode: Mapped[str] = mapped_column(String(50))           # 工作模式
    equipment_name: Mapped[str | None] = mapped_column(String(200))
    lin_number: Mapped[str | None] = mapped_column(String(50))
    ata_chapter: Mapped[str | None] = mapped_column(String(100))
    part_number: Mapped[str | None] = mapped_column(String(50))
    voltage_level: Mapped[str | None] = mapped_column(String(20))
    emergency_sheddable: Mapped[str | None] = mapped_column(String(10))
    load_type: Mapped[str | None] = mapped_column(String(50))    # 负载类型
    power_demand_kw: Mapped[str | None] = mapped_column(String(20)) # 功率需求(kW)
    g0: Mapped[str | None] = mapped_column(String(10))
    g1: Mapped[str | None] = mapped_column(String(10))
    g2: Mapped[str | None] = mapped_column(String(10))
    g3: Mapped[str | None] = mapped_column(String(10))
    g4: Mapped[str | None] = mapped_column(String(10))
    g5: Mapped[str | None] = mapped_column(String(10))
    g6: Mapped[str | None] = mapped_column(String(10))
    g7: Mapped[str | None] = mapped_column(String(10))
    g8: Mapped[str | None] = mapped_column(String(10))
