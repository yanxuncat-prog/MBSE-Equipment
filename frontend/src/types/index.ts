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
  impact_summary: Record<string, any>;
}
