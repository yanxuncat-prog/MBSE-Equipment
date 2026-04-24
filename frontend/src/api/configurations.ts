import client from './client';
import type { Configuration, ConfigDiffResponse, Program } from '../types';

export async function listPrograms(): Promise<Program[]> {
  const { data } = await client.get('/programs');
  return data;
}

export async function listConfigs(programId: string): Promise<Configuration[]> {
  const { data } = await client.get('/configurations', { params: { program_id: programId } });
  return data;
}

export async function createConfig(body: { program_id: string; version: string; description?: string }): Promise<Configuration> {
  const { data } = await client.post('/configurations', body);
  return data;
}

export async function cloneConfig(id: string, version: string): Promise<Configuration> {
  const { data } = await client.post(`/configurations/${id}/clone`, { version });
  return data;
}

export async function lockBaseline(id: string): Promise<Configuration> {
  const { data } = await client.post(`/configurations/${id}/lock`);
  return data;
}

export async function freezeConfig(id: string): Promise<Configuration> {
  const { data } = await client.post(`/configurations/${id}/freeze`);
  return data;
}

export async function unfreezeConfig(id: string): Promise<Configuration> {
  const { data } = await client.post(`/configurations/${id}/unfreeze`);
  return data;
}

export async function diffConfigs(aId: string, bId: string): Promise<ConfigDiffResponse> {
  const { data } = await client.get(`/configurations/${aId}/diff/${bId}`);
  return data;
}
