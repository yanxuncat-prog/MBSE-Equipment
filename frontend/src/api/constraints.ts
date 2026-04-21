import client from './client';
import type { ValidationReport } from '../types';

export async function validateConfig(body: {
  config_id: string;
  hypothetical_adds?: string[];
  hypothetical_removes?: string[];
  phase?: string;
}): Promise<ValidationReport> {
  const { data } = await client.post('/constraints/validate', body);
  return data;
}
