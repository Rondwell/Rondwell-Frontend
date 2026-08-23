import { browser } from '$app/environment';
import { clearUser } from '$lib/stores/auth.store';
import { setPostAuthRedirect } from '$lib/utils/redirect';


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
let refreshPromise: Promise<string | null> | null = null;

function getStoredToken(): string | null {
  if (!browser) return null;
  return localStorage.getItem('auth_token');
}

function setStoredToken(token: string) {
  if (!browser) return;
  localStorage.setItem('auth_token', token);
}

/**
 * H-13 — renew the access token via the server, which owns the refresh token.
 *
 * This used to POST the refresh token straight from `localStorage` to the user
 * service. That is what made every login self-destruct: the SvelteKit server
 * held the same token in its session cookie, upstream rotates on every use, and
 * a replayed rotated token is M-15's stolen-credential signal — so whichever
 * side spent second revoked all of the user's sessions.
 *
 * The refresh token is no longer in script at all. `/api/session/refresh` reads
 * the httpOnly cookie, spends it, re-cookies the rotated replacement, and hands
 * back only a fresh access token. One holder, one spender.
 *
 * A 503 is a transport problem at the server hop, NOT an invalid session, so it
 * returns null WITHOUT signing the user out — the caller surfaces a failed
 * request and the next attempt can succeed. Only a 401 ends the session.
 */
async function refreshAccessToken(): Promise<string | null> {
  if (!browser) return null;

  try {
    const res = await fetch('/api/session/refresh', { method: 'POST' });

    if (res.status === 503) {
      // Auth service unreachable. Keep the session; fail this request only.
      return null;
    }

    if (!res.ok) {
      clearUser();
      bounceToAuth();
      return null;
    }

    const data = await res.json().catch(() => null);
    const newToken = data?.token;

    if (!newToken) {
      // eslint-disable-next-line no-console
      console.error(
        '[H-13] /api/session/refresh responded ok without an access token. ' +
          'Signing out rather than continuing with a stale credential.'
      );
      clearUser();
      bounceToAuth();
      return null;
    }

    setStoredToken(newToken);
    return newToken;
  } catch {
    // Same-origin fetch failed outright (offline, page unloading). Not evidence
    // the session is invalid — do not sign the user out over it.
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
    /**
     * Deduplicate concurrent refreshes.
     *
     * The check and the capture happen in the same synchronous step, and the
     * captured promise is what gets awaited. Reading `refreshPromise` again
     * after the await was a race: an in-flight refresh nulls the field in its
     * own `.finally`, so a second caller that arrived just after it settled
     * awaited `null`, got `null`, and threw "Session expired" even though the
     * refresh had just succeeded. A page firing two requests at once — which
     * `/collection` does — could fail one of them for no reason.
     */
    const pending =
      refreshPromise ??
      (refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      }));

    const newToken = await pending;
    if (!newToken) {
      const err: any = new Error('Session expired. Please log in again.');
      err.status = 401;
      throw err;
    }

    // Retry original request with new token
    headers.set('Authorization', `Bearer ${newToken}`);
    res = await fetch(url, { ...options, headers });

    /**
     * A second 401 after a successful refresh means the credential was never
     * the problem — the endpoint is refusing this user for some other reason.
     * The response is returned as-is rather than treated as a dead session:
     * signing the user out here is what turned one misbehaving endpoint into a
     * logout loop nothing could escape.
     */
  }

  return res;
}
