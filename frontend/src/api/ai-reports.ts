import client from './client';

export interface AIReport {
  id: string;
  config_id: string;
  title: string;
  template: string | null;
  content: string;
  generated_at: string;
}

export async function generateReport(body: {
  config_id: string;
  template_text?: string;
  report_title: string;
}): Promise<AIReport> {
  const { data } = await client.post('/ai-reports/generate', body);
  return data;
}

export async function listReports(configId: string): Promise<AIReport[]> {
  const { data } = await client.get('/ai-reports', { params: { config_id: configId } });
  return data;
}

export async function getReport(id: string): Promise<AIReport> {
  const { data } = await client.get(`/ai-reports/${id}`);
  return data;
}

export async function deleteReport(id: string): Promise<void> {
  await client.delete(`/ai-reports/${id}`);
}
