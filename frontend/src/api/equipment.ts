import client from './client';
import type { Equipment, EquipmentListResponse } from '../types';

export async function listEquipment(params: {
  config_id?: string;
  ata_chapter?: string;
  zone_id?: string;
  search?: string;
  offset?: number;
  limit?: number;
}): Promise<EquipmentListResponse> {
  const { data } = await client.get('/equipment', { params });
  return data;
}

export async function getEquipment(id: string): Promise<Equipment> {
  const { data } = await client.get(`/equipment/${id}`);
  return data;
}

export async function createEquipment(body: any): Promise<Equipment> {
  const { data } = await client.post('/equipment', body);
  return data;
}

export async function updateEquipment(id: string, body: any): Promise<Equipment> {
  const { data } = await client.put(`/equipment/${id}`, body);
  return data;
}

export async function deleteEquipment(id: string): Promise<void> {
  await client.delete(`/equipment/${id}`);
}
