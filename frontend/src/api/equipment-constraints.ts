import client from './client';

export interface EquipmentConstraint {
  id: string;
  config_id: string;
  equipment_a_id: string;
  equipment_b_id: string;
  constraint_type: string;
  description: string | null;
  created_at: string;
}

export async function listConstraints(params: {
  config_id: string;
  equipment_id?: string;
}): Promise<EquipmentConstraint[]> {
  const { data } = await client.get('/equipment-constraints', { params });
  return data;
}

export async function createConstraint(body: {
  config_id: string;
  equipment_a_id: string;
  equipment_b_id: string;
  constraint_type: string;
  description?: string;
}): Promise<EquipmentConstraint> {
  const { data } = await client.post('/equipment-constraints', body);
  return data;
}

export async function deleteConstraint(id: string): Promise<void> {
  await client.delete(`/equipment-constraints/${id}`);
}
