import client from './client';

export interface LibraryEquipment {
  id: string;
  part_number: string;
  name: string;
  name_en: string | null;
  ata_chapter: string;
  equipment_type: string;
  dal: string | null;
  is_electrical: boolean | null;
  is_primary_electrical: boolean | null;
  has_eicd: boolean | null;
  dimensions_mm: string | null;
  power_voltage: string | null;
  power_kva_normal: number | null;
  supplier_part_number: string | null;
  config_count: number;
}

export interface LibraryListResponse {
  items: LibraryEquipment[];
  total: number;
  offset: number;
  limit: number;
}

export interface LibraryConfigUsage {
  config_id: string;
  config_version: string;
  config_name: string;
  mass_kg: number | null;
  frozen_at: string | null;
}

export interface LibraryEquipmentDetail {
  equipment: {
    id: string;
    part_number: string;
    master_name: string;
    ata_chapter: string;
    equipment_type: string;
  };
  configs: LibraryConfigUsage[];
}

export async function listLibraryEquipment(params: {
  search?: string;
  ata_chapter?: string;
  offset?: number;
  limit?: number;
}): Promise<LibraryListResponse> {
  const { data } = await client.get('/equipment-library', { params });
  return data;
}

export async function getEquipmentConfigs(equipmentId: string): Promise<LibraryEquipmentDetail> {
  const { data } = await client.get(`/equipment-library/${equipmentId}/configs`);
  return data;
}
