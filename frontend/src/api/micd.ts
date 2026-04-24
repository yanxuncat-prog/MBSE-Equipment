import client from './client';
import type { MICDRecord } from '@/types';

export async function listMICD(params: { config_id: string; equipment_id?: string; limit?: number }): Promise<{ items: MICDRecord[]; total: number }> {
  const { data } = await client.get('/micd', { params });
  return data;
}
export async function createMICD(body: Partial<MICDRecord>): Promise<MICDRecord> {
  const { data } = await client.post('/micd', body);
  return data;
}
export async function updateMICD(id: string, body: Partial<MICDRecord>): Promise<MICDRecord> {
  const { data } = await client.patch(`/micd/${id}`, body);
  return data;
}
export async function confirmMICD(id: string, confirmedBy: string): Promise<MICDRecord> {
  const { data } = await client.post(`/micd/${id}/confirm`, { confirmed_by: confirmedBy });
  return data;
}
export async function deleteMICD(id: string): Promise<void> {
  await client.delete(`/micd/${id}`);
}
export async function getMICDStats(params: { config_id: string; start_date?: string; end_date?: string }) {
  const { data } = await client.get('/micd/stats', { params });
  return data;
}
