import client from './client';

export interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  user_name: string;
  reason: string | null;
  timestamp: string;
}

export async function listAuditLogs(params: {
  entity_type?: string;
  entity_id?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditLogEntry[]> {
  const { data } = await client.get('/audit-logs', { params });
  return data.items;
}
