import { authFetch } from '$lib/services/api.client';

const BASE_URL = import.meta.env.VITE_API_URL || '';
const DEV_API = `${BASE_URL}/api/v1/developers`;

async function requestJson<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await authFetch(`${DEV_API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.detail || body?.message || body?.error || `Request failed (${res.status})`);
  }
  return (body?.data ?? body) as T;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  description?: string;
  keyType: 'SECRET' | 'PUBLISHABLE';
  environment: 'live' | 'test';
  keyPrefix: string;
  maskedKey: string;
  scopes: string[];
  ipAllowlist: string[];
  allowedOrigins: string[];
  rateLimitPerMinute: number;
  monthlyQuota: number;
  status: 'ACTIVE' | 'ROLLING' | 'REVOKED';
  graceUntil?: string;
  expiresAt?: string;
  lastUsedAt?: string;
  lastUsedIp?: string;
  usageCount: number;
  createdAt: string;
  rawKey?: string;
}

export interface WebhookEndpointItem {
  id: string;
  url: string;
  description?: string;
  events: string[];
  secretPrefix: string;
  enabled: boolean;
  consecutiveFailures: number;
  disabledAt?: string;
  lastDeliveryAt?: string;
  lastStatusCode?: number;
  createdAt: string;
  signingSecret?: string;
}

export async function getDeveloperOverview() {
  return requestJson('/overview');
}

export async function listApiKeys(): Promise<ApiKeyItem[]> {
  return requestJson<ApiKeyItem[]>('/keys');
}

export async function createApiKey(payload: {
  name: string;
  description?: string;
  keyType: 'SECRET' | 'PUBLISHABLE';
  environment: 'live' | 'test';
  scopes?: string[];
  ipAllowlist?: string[];
  allowedOrigins?: string[];
  rateLimitPerMinute?: number;
  expiresInDays?: number;
}): Promise<ApiKeyItem> {
  return requestJson<ApiKeyItem>('/keys', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateApiKey(
  keyId: string,
  payload: {
    name?: string;
    description?: string;
    scopes?: string[];
    ipAllowlist?: string[];
    allowedOrigins?: string[];
    rateLimitPerMinute?: number;
  },
): Promise<ApiKeyItem> {
  return requestJson<ApiKeyItem>(`/keys/${encodeURIComponent(keyId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function rollApiKey(keyId: string, graceHours = 24): Promise<ApiKeyItem> {
  return requestJson<ApiKeyItem>(`/keys/${encodeURIComponent(keyId)}/roll`, {
    method: 'POST',
    body: JSON.stringify({ graceHours }),
  });
}

export async function revokeApiKey(keyId: string): Promise<ApiKeyItem> {
  return requestJson<ApiKeyItem>(`/keys/${encodeURIComponent(keyId)}`, {
    method: 'DELETE',
  });
}

export async function listWebhooks(): Promise<WebhookEndpointItem[]> {
  return requestJson<WebhookEndpointItem[]>('/webhooks');
}

export async function createWebhook(payload: {
  url: string;
  description?: string;
  events: string[];
}): Promise<WebhookEndpointItem> {
  return requestJson<WebhookEndpointItem>('/webhooks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateWebhook(
  id: string,
  payload: { url?: string; description?: string; events?: string[]; enabled?: boolean },
): Promise<WebhookEndpointItem> {
  return requestJson<WebhookEndpointItem>(`/webhooks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteWebhook(id: string) {
  return requestJson(`/webhooks/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function rotateWebhookSecret(id: string): Promise<WebhookEndpointItem> {
  return requestJson<WebhookEndpointItem>(`/webhooks/${encodeURIComponent(id)}/rotate-secret`, {
    method: 'POST',
  });
}

export async function sendTestWebhook(id: string) {
  return requestJson(`/webhooks/${encodeURIComponent(id)}/test`, { method: 'POST' });
}

export async function listWebhookDeliveries(id: string) {
  return requestJson(`/webhooks/${encodeURIComponent(id)}/deliveries`);
}

export async function replayWebhookDelivery(id: string, deliveryId: string) {
  return requestJson(`/webhooks/${encodeURIComponent(id)}/deliveries/${encodeURIComponent(deliveryId)}/replay`, {
    method: 'POST',
  });
}

export async function listApiLogs(params: { page?: number; limit?: number; status?: string; method?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.status) qs.set('status', params.status);
  if (params.method) qs.set('method', params.method);
  const res = await authFetch(`${DEV_API}/logs?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load API logs');
  return res.json();
}

export async function getApiUsage() {
  return requestJson('/usage');
}
