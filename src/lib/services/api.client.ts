import { browser } from '$app/environment';
import { clearUser } from '$lib/stores/auth.store';
import { setPostAuthRedirect } from '$lib/utils/redirect';

const USER_URL = import.meta.env.VITE_API_URL;

/**
 * Sends an expired session back to /auth WITHOUT losing where they were going.
 *
 * `clearUser()` deliberately wipes `post_auth_redirect` (correct for an
 * explicit logout), and this handler then did a bare
 * `window.location.href = '/auth'`. That combination is what silently broke the
 * admin-invitation flow: an invitee with a stale token clicked "Accept", the
 * refresh failed, their pending destination was erased, and after logging in
 * they were dropped on the default landing page instead of completing the
 * acceptance. We now re-arm the redirect (after the clear) and also pass it as
 * a query param so it survives even if storage is unavailable.
 */
function bounceToAuth(): void {
  if (!browser) return;
  const current = `${window.location.pathname}${window.location.search}`;
  // Never bounce back to /auth itself, and don't try to return to a page that
  // isn't a legitimate post-auth destination.
  setPostAuthRedirect(current);
  const target = current.startsWith('/auth')
    ? '/auth'
    : `/auth?returnUrl=${encodeURIComponent(current)}`;
  window.location.href = target;
}

/**
 * FE-P1-09 (FA-8.1) — Idempotency-Key convention.
 *
 * Any new payment-service write endpoint that may legitimately be retried
 * (wallet topup, vendor invoice payment, subscription initiate, etc.)
 * accepts an `Idempotency-Key` header. Service helpers that wrap such
 * endpoints SHOULD accept an optional `idempotencyKey` parameter and
 * forward it as the `Idempotency-Key` request header.
 *
 * Use `getOrCreateIdempotencyKey(scope)` from `$lib/utils/idempotency` to
 * generate a stable per-intent UUID — the same scope returns the same key
 * across refreshes within the session. Reset the scope when the user
 * starts a new intent that should not collapse with the previous one.
 */
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
      bounceToAuth();
      return null;
    }

    const data = await res.json();
    const newToken = data.token ?? data.accessToken;
    const newRefresh = data.refreshToken ?? refreshToken;
    setStoredTokens(newToken, newRefresh);
    return newToken;
  } catch {
    clearUser();
    bounceToAuth();
    return null;
  }
}

/**
 * Authenticated fetch wrapper with automatic token refresh on 401.
 * Deduplicates concurrent refresh attempts.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  if (!token) {
    // Tagged with a status so callers (e.g. invitation pages) can tell an
    // auth problem apart from a generic failure and bounce to login instead of
    // showing "something went wrong".
    const err: any = new Error('Not authenticated');
    err.status = 401;
    throw err;
  }

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
    if (!newToken) {
      const err: any = new Error('Session expired. Please log in again.');
      err.status = 401;
      throw err;
    }

    // Retry original request with new token
    headers.set('Authorization', `Bearer ${newToken}`);
    res = await fetch(url, { ...options, headers });
  }

  return res;
}
