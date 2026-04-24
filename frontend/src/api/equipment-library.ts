import client from './client';

export interface LibraryEquipment {
  id: string;
  part_number: string;
  name: string;
  ata_chapter: string;
  equipment_type: string;
  status: string;
  is_electrical: boolean | null;
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
  is_frozen: boolean;
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
