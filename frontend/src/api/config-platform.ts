import client from './client';

export async function getPlatformStatus(): Promise<{ connected: boolean; message: string }> {
  const { data } = await client.get('/config-platform/status');
  return data;
}

export async function fetchModels(equipmentIds: string[]): Promise<{ status: string; message: string }> {
  const { data } = await client.post('/config-platform/fetch-models', { equipment_ids: equipmentIds });
  return data;
}
