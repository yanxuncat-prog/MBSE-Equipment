from __future__ import annotations
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class ConfigEquipmentData(BaseModel):
    """Config-specific attributes for an equipment item."""
    zone_id: UUID | None = None
    zone_name: str | None = None
    sta: float | None = None
    wl: float | None = None
    bl: float | None = None
    rack_position: str | None = None
    bus_id: UUID | None = None
    bus_name: str | None = None
    notes: str | None = None


class WeightBalanceData(BaseModel):
    mass_kg: float


class ElectricalLoadData(BaseModel):
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
    weight_balance: WeightBalanceData | None = None
    electrical_load: ElectricalLoadData | None = None


class EquipmentUpdate(BaseModel):
    name: str | None = None
    ata_chapter: str | None = None
    equipment_type: str | None = None
    supplier_id: str | None = None
    status: str | None = None
    description: str | None = None
    weight_balance: WeightBalanceData | None = None
    electrical_load: ElectricalLoadData | None = None


class _ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class WeightBalanceResponse(_ORMBase):
    mass_kg: float


class ElectricalLoadResponse(_ORMBase):
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
    supplier_name: str | None = None
    status: str
    description: str | None = None
    weight_balance: WeightBalanceResponse | None = None
    electrical_load: ElectricalLoadResponse | None = None
    config_data: ConfigEquipmentData | None = None  # populated when queried with config_id


class EquipmentListResponse(BaseModel):
    items: list[EquipmentResponse]
    total: int
    offset: int
    limit: int
