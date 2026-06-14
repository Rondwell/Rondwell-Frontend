import { authFetch } from '$lib/services/api.client';

const BASE_URL = import.meta.env.VITE_API_URL;
const ROOT = `${BASE_URL}/api/v1/notifications/in-app`;

export type InAppCategory =
  | 'security'
  | 'event'
  | 'ticket'
  | 'wallet'
  | 'payout'
  | 'subscription'
  | 'kyc'
  | 'collaboration'
  | 'product'
  | 'admin'
  | 'system'
  | 'marketing';

export interface InAppNotification {
  _id: string;
  userId: string;
  category: InAppCategory;
  templateName?: string;
  title: string;
  body: string;
  icon?: string;
  link?: string;
  data?: Record<string, any>;
  priority: 'high' | 'normal' | 'low';
  read: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResult {
  items: InAppNotification[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  unreadCount: number;
}

export async function listNotifications(opts: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  category?: string;
} = {}): Promise<NotificationListResult> {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.unreadOnly) params.set('unreadOnly', 'true');
  if (opts.category) params.set('category', opts.category);

  const res = await authFetch(`${ROOT}?${params.toString()}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to load notifications');
  return json.data as NotificationListResult;
}

export async function getUnreadCount(): Promise<number> {
  const res = await authFetch(`${ROOT}/unread-count`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to load unread count');
  return json.data?.count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await authFetch(`${ROOT}/${id}/read`, { method: 'PATCH' });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message ?? 'Failed to mark as read');
  }
}

export async function markAllNotificationsRead(): Promise<number> {
  const res = await authFetch(`${ROOT}/read-all`, { method: 'PATCH' });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to mark all as read');
  return json.data?.modified ?? 0;
}

export async function deleteNotification(id: string): Promise<void> {
  const res = await authFetch(`${ROOT}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message ?? 'Failed to delete notification');
  }
}
