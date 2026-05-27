import { api } from './axios';

export interface Notification {
  id: string;
  type: 'new_material' | 'comment_on_material';
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  data: Notification[];
  meta: { count: number; unread: number };
}

export async function listNotifications(): Promise<NotificationsResponse> {
  const { data } = await api.get<NotificationsResponse>('/me/notifications');
  return data;
}

export async function markRead(id: string): Promise<void> {
  await api.patch(`/me/notifications/${id}/read`);
}

export async function markAllRead(): Promise<void> {
  await api.patch('/me/notifications/read-all');
}
