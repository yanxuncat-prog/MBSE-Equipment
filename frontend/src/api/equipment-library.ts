import client from './client';

export interface LibraryEquipment {
  id: string;
  part_number: string;
  name: string;
  name_en: string | null;
  ata_chapter: string;
  equipment_type: string;
  library_status: string;
  dal: string | null;
  is_electrical: boolean | null;
  is_primary_electrical: boolean | null;
  has_eicd: boolean | null;
  dimensions_mm: string | null;
  power_voltage: string | null;
  power_kva_normal: number | null;
  supplier_part_number: string | null;
}

export interface LibraryListResponse {
  items: LibraryEquipment[];
  total: number;
  offset: number;
  limit: number;
}

export async function listLibraryEquipment(params: {
  search?: string;
  ata_chapter?: string;
  library_status?: string;
  offset?: number;
  limit?: number;
}): Promise<LibraryListResponse> {
  const { data } = await client.get('/equipment-library', { params });
  return data;
}

export async function validateEquipment(id: string): Promise<void> {
  await client.post(`/equipment-library/${id}/validate`);
}

export async function validateBatch(ids: string[]): Promise<{ validated_count: number }> {
  const { data } = await client.post('/equipment-library/validate-batch', { ids });
  return data;
}
