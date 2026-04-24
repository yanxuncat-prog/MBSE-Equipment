import client from './client';

export interface NotificationItem {
  id: string;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

export async function listNotifications(params?: {
  unread_only?: boolean;
  limit?: number;
}): Promise<NotificationItem[]> {
  const { data } = await client.get('/notifications', { params });
  return data;
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await client.get('/notifications/count');
  return data.unread;
}

export async function markRead(id: string): Promise<void> {
  await client.post(`/notifications/${id}/read`);
}

export async function markAllRead(): Promise<void> {
  await client.post('/notifications/read-all');
}
