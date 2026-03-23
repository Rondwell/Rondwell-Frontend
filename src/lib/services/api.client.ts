import { browser } from '$app/environment';
import { clearUser } from '$lib/stores/auth.store';

const USER_URL = import.meta.env.VITE_API_URL;

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

function getStoredToken(): string | null {
  if (!browser) return null;
  return localStorage.getItem('auth_token');
}

function getStoredRefreshToken(): string | null {
  if (!browser) return null;
  return localStorage.getItem('auth_refresh_token');
}

function setStoredTokens(token: string, refreshToken: string) {
  if (!browser) return;
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_refresh_token', refreshToken);
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${USER_URL}/api/v1/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearUser();
      if (browser) window.location.href = '/login';
      return null;
    }

    const data = await res.json();
    const newToken = data.token ?? data.accessToken;
    const newRefresh = data.refreshToken ?? refreshToken;
    setStoredTokens(newToken, newRefresh);
    return newToken;
  } catch {
    clearUser();
    if (browser) window.location.href = '/login';
    return null;
  }
}

/**
 * Authenticated fetch wrapper with automatic token refresh on 401.
 * Deduplicates concurrent refresh attempts.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  if (!token) throw new Error('Not authenticated');

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    // Deduplicate: if already refreshing, wait for that one
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (!newToken) throw new Error('Session expired. Please log in again.');

    // Retry original request with new token
    headers.set('Authorization', `Bearer ${newToken}`);
    res = await fetch(url, { ...options, headers });
  }

  return res;
}
