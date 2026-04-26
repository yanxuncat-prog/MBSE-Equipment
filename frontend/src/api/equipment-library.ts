import client from './client';

export interface LibraryEquipment {
  id: string;
  library_status: string;
  // 组1: 标识与分类
  part_number: string;
  name: string;
  name_en: string | null;
  abbreviation_en: string | null;
  ata_chapter: string;
  equipment_type: string;
  dal: string | null;
  supplier_part_number: string | null;
  description: string | null;
  notes: string | null;
  // 组2: 物理特性
  dimensions_mm: string | null;
  connector_count: number | null;
  is_metal_shell: boolean | null;
  metal_shell_non_conductive: string | null;
  // 组3: 电气特性
  is_electrical: boolean | null;
  is_primary_electrical: boolean | null;
  has_eicd: boolean | null;
  power_voltage: string | null;
  voltage_range: string | null;
  power_redundancy: string | null;
  power_watts: string | null;
  power_kva_normal: number | null;
  power_kva_emergency: number | null;
  power_kva_max: number | null;
  soft_start: string | null;
  peak_power_time_s: string | null;
  dissimilar_supply: string | null;
  emergency_sheddable: string | null;
  // 组4: 接地与搭接
  internal_grounding: string | null;
  shell_grounding_method: string | null;
  shell_grounding_fault_path: string | null;
  grounding_special_requirements: string | null;
  grounding_terminal_diameter: string | null;
  bonding_method: string | null;
  bonding_type: string | null;
  bonding_resistance: string | null;
  // 组5: 机械接口
  screw_spec: string | null;
  bracket_delegated_158: boolean | null;
  has_tolerance_drawing: boolean | null;
}

export interface LibraryListResponse {
  items: LibraryEquipment[];
  total: number;
  offset: number;
  limit: number;
}

export async function listLibraryEquipment(params: {
  search?: string;
  ata_chapters?: string;
  library_status?: string;
  offset?: number;
  limit?: number;
}): Promise<LibraryListResponse> {
  const { data } = await client.get('/equipment-library', { params });
  return data;
}

export interface ATAOption { ata: string; count: number; }

export async function getATAOptions(): Promise<ATAOption[]> {
  const { data } = await client.get('/equipment-library/ata-options');
  return data;
}

export async function validateEquipment(id: string): Promise<void> {
  await client.post(`/equipment-library/${id}/validate`);
}

export async function validateBatch(ids: string[]): Promise<{ validated_count: number }> {
  const { data } = await client.post('/equipment-library/validate-batch', { ids });
  return data;
}
