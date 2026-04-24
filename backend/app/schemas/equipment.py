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
    install_method: str | None = None

    # Display name override
    config_name: str | None = None

    # Per-config weight & CG
    mass_kg: float | None = None
    cg_x: float | None = None
    cg_y: float | None = None
    cg_z: float | None = None
    inertia_ix: float | None = None
    inertia_iy: float | None = None
    inertia_iz: float | None = None
    inertia_ixy: float | None = None
    inertia_ixz: float | None = None
    inertia_iyz: float | None = None
    weight_target_kg: float | None = None
    overweight_risk: str | None = None

    # Per-config electrical
    power_kva_normal: float | None = None
    power_kva_emergency: float | None = None
    power_kva_max: float | None = None

    bonding_method: str | None = None
    bonding_type: str | None = None
    bonding_resistance: str | None = None
    bonding_position: str | None = None
    in_pace_drawing: bool | None = None
    layout_adjustment: str | None = None
    use_batch0_device: bool | None = None
    procurement_status: str | None = None
    procurement_location: str | None = None
    planned_delivery_date: str | None = None
    estimated_delivery_date: str | None = None
    procurement_notes: str | None = None

    # Physical asset lifecycle
    actual_arrival_date: str | None = None
    micd_confirmed: bool | None = None
    structure_ready: bool | None = None
    installation_ready: bool | None = None
    planned_install_date: str | None = None
    actual_install_date: str | None = None


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


class ConfigEquipmentUpdate(BaseModel):
    """Update config-specific fields (STA/BL/WL, bonding, procurement, weight/CG/electrical)."""
    sta: float | None = None
    wl: float | None = None
    bl: float | None = None
    rack_position: str | None = None
    install_method: str | None = None

    # Display name override
    config_name: str | None = None

    # Per-config weight & CG
    mass_kg: float | None = None
    cg_x: float | None = None
    cg_y: float | None = None
    cg_z: float | None = None
    inertia_ix: float | None = None
    inertia_iy: float | None = None
    inertia_iz: float | None = None
    inertia_ixy: float | None = None
    inertia_ixz: float | None = None
    inertia_iyz: float | None = None
    weight_target_kg: float | None = None
    overweight_risk: str | None = None

    # Per-config electrical
    power_kva_normal: float | None = None
    power_kva_emergency: float | None = None
    power_kva_max: float | None = None

    bonding_method: str | None = None
    bonding_type: str | None = None
    bonding_resistance: str | None = None
    bonding_position: str | None = None
    in_pace_drawing: bool | None = None
    layout_adjustment: str | None = None
    use_batch0_device: bool | None = None
    notes: str | None = None

    # Physical asset lifecycle
    actual_arrival_date: str | None = None
    micd_confirmed: bool | None = None
    structure_ready: bool | None = None
    installation_ready: bool | None = None
    planned_install_date: str | None = None
    actual_install_date: str | None = None


class EquipmentFullUpdate(BaseModel):
    """Combined update payload: equipment + config_equipment + weight + electrical."""
    equipment: 'EquipmentUpdate | None' = None
    config_equipment: ConfigEquipmentUpdate | None = None
    weight_balance: WeightBalanceData | None = None
    electrical_load: ElectricalLoadData | None = None


class EquipmentUpdate(BaseModel):
    name: str | None = None
    ata_chapter: str | None = None
    equipment_type: str | None = None
    supplier_id: str | None = None
    status: str | None = None
    description: str | None = None
    # Identity
    name_en: str | None = None
    abbreviation_en: str | None = None
    internal_number: str | None = None
    lin_number: str | None = None
    supplier_part_number: str | None = None
    # Safety & Classification
    dal: str | None = None
    equipment_level: str | None = None
    is_optional: bool | None = None
    is_electrical: bool | None = None
    is_primary_electrical: bool | None = None
    has_eicd: bool | None = None
    has_special_wiring: bool | None = None
    # Physical
    dimensions_mm: str | None = None
    is_metal_shell: bool | None = None
    connector_count: int | None = None
    # Electrical
    voltage_range: str | None = None
    power_redundancy: str | None = None
    power_voltage: str | None = None
    power_watts: str | None = None
    shell_grounding_method: str | None = None
    # Assignment
    responsible_person: str | None = None
    config_category: str | None = None
    # DO-160
    do160_temp_design_level: str | None = None
    do160_temp_qual_level: str | None = None
    do160_temp_qual_range: str | None = None
    do160_temp_compliance: str | None = None
    normal_operating_temp: str | None = None
    short_term_temp: str | None = None
    ground_storage_temp: str | None = None
    operating_altitude: str | None = None
    qual_report_number: str | None = None
    first_flight_onboard: bool | None = None
    phase2_onboard: bool | None = None
    # Notes
    notes: str | None = None
    # Legacy (for backward compat with old form)
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

    # Identity
    name_en: str | None = None
    abbreviation_en: str | None = None
    internal_number: str | None = None
    lin_number: str | None = None
    supplier_part_number: str | None = None

    # Safety & Classification
    dal: str | None = None
    equipment_level: str | None = None
    is_optional: bool | None = None
    is_electrical: bool | None = None
    is_primary_electrical: bool | None = None
    has_eicd: bool | None = None
    has_special_wiring: bool | None = None

    # Physical characteristics
    dimensions_mm: str | None = None
    is_metal_shell: bool | None = None
    metal_shell_non_conductive: str | None = None
    internal_grounding: str | None = None
    physical_characteristics: str | None = None
    connector_count: int | None = None

    # Electrical
    voltage_range: str | None = None
    power_redundancy: str | None = None
    power_voltage: str | None = None
    power_watts: str | None = None

    # Grounding
    shell_grounding_method: str | None = None
    shell_grounding_fault_path: str | None = None
    grounding_special_requirements: str | None = None

    # Assignment
    responsible_person: str | None = None
    aircraft_batch: str | None = None
    config_category: str | None = None

    # DO-160 Temperature qualification
    do160_temp_design_level: str | None = None
    do160_temp_qual_level: str | None = None
    do160_temp_qual_range: str | None = None
    do160_temp_compliance: str | None = None
    normal_operating_temp: str | None = None
    short_term_temp: str | None = None
    ground_storage_temp: str | None = None
    operating_altitude: str | None = None
    qual_report_number: str | None = None
    first_flight_onboard: bool | None = None
    phase2_onboard: bool | None = None

    # Notes
    notes: str | None = None


class EquipmentListResponse(BaseModel):
    items: list[EquipmentResponse]
    total: int
    offset: int
    limit: int
