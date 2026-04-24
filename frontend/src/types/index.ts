export type ConstraintStatus = 'pass' | 'warning' | 'blocked';

export interface ConfigEquipmentData {
  zone_id: string | null;
  zone_name: string | null;
  sta: number | null;
  wl: number | null;
  bl: number | null;
  rack_position: string | null;
  bus_id: string | null;
  bus_name: string | null;
  notes: string | null;

  // Display name override
  config_name: string | null;

  // Per-config weight & CG
  mass_kg: number | null;
  cg_x: number | null;
  cg_y: number | null;
  cg_z: number | null;
  inertia_ix: number | null;
  inertia_iy: number | null;
  inertia_iz: number | null;
  inertia_ixy: number | null;
  inertia_ixz: number | null;
  inertia_iyz: number | null;
  weight_target_kg: number | null;
  overweight_risk: string | null;

  // Per-config electrical
  power_kva_normal: number | null;
  power_kva_emergency: number | null;
  power_kva_max: number | null;

  install_method: string | null;
  bonding_method: string | null;
  bonding_type: string | null;
  bonding_resistance: string | null;
  bonding_position: string | null;
  in_pace_drawing: boolean | null;
  layout_adjustment: string | null;
  use_batch0_device: boolean | null;
  procurement_status: string | null;
  procurement_location: string | null;
  planned_delivery_date: string | null;
  estimated_delivery_date: string | null;
  procurement_notes: string | null;

  // Physical asset lifecycle
  actual_arrival_date: string | null;
  micd_confirmed: boolean | null;
  structure_ready: boolean | null;
  installation_ready: boolean | null;
  planned_install_date: string | null;
  actual_install_date: string | null;
}

export interface WeightBalance {
  mass_kg: number;
}

export interface ElectricalLoad {
  power_kva_normal: number;
  power_kva_emergency: number | null;
  power_kva_max: number | null;
}

export interface Equipment {
  id: string;
  part_number: string;
  name: string;
  ata_chapter: string;
  equipment_type: string;
  supplier_id: string | null;
  supplier_name: string | null;
  status: string;
  description: string | null;
  weight_balance: WeightBalance | null;
  electrical_load: ElectricalLoad | null;
  config_data: ConfigEquipmentData | null;

  // Identity
  name_en: string | null;
  abbreviation_en: string | null;
  internal_number: string | null;
  lin_number: string | null;
  supplier_part_number: string | null;

  // Safety & Classification
  dal: string | null;
  equipment_level: string | null;
  is_optional: boolean | null;
  is_electrical: boolean | null;
  is_primary_electrical: boolean | null;
  has_eicd: boolean | null;
  has_special_wiring: boolean | null;

  // Physical characteristics
  dimensions_mm: string | null;
  is_metal_shell: boolean | null;
  metal_shell_non_conductive: string | null;
  internal_grounding: string | null;
  physical_characteristics: string | null;
  connector_count: number | null;

  // Electrical
  voltage_range: string | null;
  power_redundancy: string | null;
  power_voltage: string | null;
  power_watts: string | null;

  // Grounding
  shell_grounding_method: string | null;
  shell_grounding_fault_path: string | null;
  grounding_special_requirements: string | null;

  // Assignment
  responsible_person: string | null;
  aircraft_batch: string | null;
  config_category: string | null;

  // DO-160 Temperature qualification
  do160_temp_design_level: string | null;
  do160_temp_qual_level: string | null;
  do160_temp_qual_range: string | null;
  do160_temp_compliance: string | null;
  normal_operating_temp: string | null;
  short_term_temp: string | null;
  ground_storage_temp: string | null;
  operating_altitude: string | null;
  qual_report_number: string | null;
  first_flight_onboard: boolean | null;
  phase2_onboard: boolean | null;

  // Notes
  notes: string | null;
}

export interface EquipmentListResponse {
  items: Equipment[];
  total: number;
  offset: number;
  limit: number;
}

export interface Program {
  id: string;
  name: string;
  aircraft_type: string;
  description: string | null;
}

export interface Series {
  id: string;
  program_id: string;
  variant_name: string;
  description: string | null;
}

export interface Configuration {
  id: string;
  series_id: string;
  version: string;
  status: string;
  description: string | null;
  created_by: string | null;
  locked_at: string | null;
  is_frozen: boolean;
  created_at: string;
  equipment_count: number;
}

export interface Zone {
  id: string;
  zone_code: string;
  name: string;
  sta_from: number;
  sta_to: number;
  wl_from: number | null;
  wl_to: number | null;
  bl_from: number | null;
  bl_to: number | null;
}

export interface BusDefinition {
  id: string;
  bus_name: string;
  bus_type: string;
  rated_capacity_kva: number;
}

export interface EngineResult {
  engine_name: string;
  status: ConstraintStatus;
  summary: string;
  details: Record<string, any>;
}

export interface ValidationReport {
  config_id: string;
  overall_status: ConstraintStatus;
  engines: EngineResult[];
}

export interface DiffItem {
  equipment_id: string;
  part_number: string;
  name: string;
  ata_chapter: string;
  change_type: string;
  changes: Record<string, any> | null;
}

export interface ConfigDiffResponse {
  config_a_id: string;
  config_a_version: string;
  config_b_id: string;
  config_b_version: string;
  added: DiffItem[];
  removed: DiffItem[];
  modified: DiffItem[];
  unchanged: DiffItem[];
  impact_summary: Record<string, any>;
}

// MICD Record
export interface MICDRecord {
  id: string;
  config_id: string;
  equipment_id: string;
  installation_structure_id: string | null;
  bonding_surface: string | null;
  fastener_brand: string | null;
  fastener_count: number | null;
  fastener_team: string | null;
  bracket_model: string | null;
  bracket_source: string | null;
  bracket_mass_kg: number | null;
  screw_spec: string | null;
  wire_bonding_size: string | null;
  digital_model_config: string | null;
  has_tolerance_drawing: boolean | null;
  tolerance_drawing_url: string | null;
  is_confirmed: boolean;
  confirmed_at: string | null;
  confirmed_by: string | null;
  notes: string | null;
  created_at: string | null;
}

// DO-160 Record
export interface DO160Record {
  id: string;
  config_id: string;
  equipment_id: string;
  test_category: string;
  category_label: string;
  design_level: string | null;
  qual_level: string | null;
  compliance_status: string;
  qual_report_number: string | null;
  notes: string | null;
}

export interface DO160Category {
  key: string;
  label: string;
}

export interface DO160Summary {
  total_records: number;
  categories: Array<{
    key: string;
    label: string;
    total: number;
    compliant: number;
    non_compliant: number;
    pending: number;
  }>;
}

// Weight Reduction
export interface WeightReductionItem {
  part_number: string;
  name: string;
  ata_chapter: string;
  base_mass_kg: number | null;
  compare_mass_kg: number | null;
  diff_kg: number | null;
  in_base_only: boolean;
  in_compare_only: boolean;
}

export interface WeightReductionResult {
  base_config_id: string;
  compare_config_id: string;
  total_base_mass_kg: number;
  total_compare_mass_kg: number;
  total_reduction_kg: number;
  matched_count: number;
  base_only_count: number;
  compare_only_count: number;
  items: WeightReductionItem[];
}
