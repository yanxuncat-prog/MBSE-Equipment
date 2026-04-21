from __future__ import annotations
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class InstallationData(BaseModel):
    zone_id: str | None = None
    sta: float | None = None
    wl: float | None = None
    bl: float | None = None
    rack_position: str | None = None


class WeightBalanceData(BaseModel):
    mass_kg: float
    arm_sta: float
    arm_bl: float = 0.0
    arm_wl: float = 0.0


class ElectricalLoadData(BaseModel):
    bus_id: str
    power_kva_normal: float
    power_kva_emergency: float | None = None
    power_kva_max: float | None = None


class EquipmentCreate(BaseModel):
    part_number: str
    name: str
    ata_chapter: str
    equipment_type: str
    supplier_id: str | None = None
    status: str = "in_development"
    description: str | None = None
    installation: InstallationData | None = None
    weight_balance: WeightBalanceData | None = None
    electrical_load: ElectricalLoadData | None = None


class EquipmentUpdate(BaseModel):
    name: str | None = None
    ata_chapter: str | None = None
    equipment_type: str | None = None
    supplier_id: str | None = None
    status: str | None = None
    description: str | None = None
    installation: InstallationData | None = None
    weight_balance: WeightBalanceData | None = None
    electrical_load: ElectricalLoadData | None = None


class _ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class InstallationResponse(_ORMBase):
    zone_id: UUID | None = None
    sta: float | None = None
    wl: float | None = None
    bl: float | None = None
    rack_position: str | None = None


class WeightBalanceResponse(_ORMBase):
    mass_kg: float
    arm_sta: float
    arm_bl: float
    arm_wl: float


class ElectricalLoadResponse(_ORMBase):
    bus_id: UUID
    power_kva_normal: float
    power_kva_emergency: float | None = None
    power_kva_max: float | None = None


class EquipmentResponse(_ORMBase):
    id: UUID
    part_number: str
    name: str
    ata_chapter: str
    equipment_type: str
    supplier_id: UUID | None = None
    status: str
    description: str | None = None
    installation: InstallationResponse | None = None
    weight_balance: WeightBalanceResponse | None = None
    electrical_load: ElectricalLoadResponse | None = None


class EquipmentListResponse(BaseModel):
    items: list[EquipmentResponse]
    total: int
    offset: int
    limit: int
