import client from './client';
import type { DO160Record, DO160Category, DO160Summary } from '@/types';

export async function listDO160Categories(): Promise<DO160Category[]> {
  const { data } = await client.get('/do160/categories');
  return data;
}
export async function listDO160(params: { config_id: string; lin_number?: string; test_category?: string; limit?: number }): Promise<{ items: DO160Record[]; total: number }> {
  const { data } = await client.get('/do160', { params });
  return data;
}
export async function createDO160(body: Partial<DO160Record>): Promise<DO160Record> {
  const { data } = await client.post('/do160', body);
  return data;
}
export async function updateDO160(id: string, body: Partial<DO160Record>): Promise<DO160Record> {
  const { data } = await client.patch(`/do160/${id}`, body);
  return data;
}
export async function deleteDO160(id: string): Promise<void> {
  await client.delete(`/do160/${id}`);
}
export async function getDO160Summary(configId: string): Promise<DO160Summary> {
  const { data } = await client.get('/do160/summary', { params: { config_id: configId } });
  return data;
}
