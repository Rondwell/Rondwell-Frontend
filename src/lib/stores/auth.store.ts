import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';

export interface AuthUser {
  id: string;
  email?: string;
  phoneNumber?: string;
  defaultProfileId?: string;
  activeProfileId?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}

export interface ActiveProfile {
  _id: string;
  role: 'ORGANIZER' | 'VENDOR' | 'EXHIBITOR' | 'SPEAKER';
  name: string;
  profilePictureUrl?: string;
  onboardingStatus: 'INCOMPLETE' | 'COMPLETED';
}

interface AuthState {
  loading: boolean;
  error: string;
  email: string;
  verified: boolean;
  user: AuthUser | null;
  token: string | null;
  activeProfile: ActiveProfile | null;
}

/**
 * H-13 — `refreshToken` is deliberately NOT part of client state any more.
 *
 * It lives in the httpOnly `rw_session` cookie and is spent only by
 * `/api/session/refresh`. Keeping a second copy here is what revoked people's
 * sessions: upstream rotates on use and flags a replayed token as theft, so two
 * holders meant the second one to spend looked like an attacker.
 */
function loadFromStorage(): Partial<AuthState> {
  if (!browser) return {};
  try {
    // Legacy: sessions created before H-13 left a refresh token here. It is
    // dead weight at best and an XSS target at worst, so drop it on sight.
    localStorage.removeItem('auth_refresh_token');

    const token = localStorage.getItem('auth_token');
    const userRaw = localStorage.getItem('auth_user');
    const profileRaw = localStorage.getItem('auth_active_profile');
    const user = userRaw ? JSON.parse(userRaw) : null;
    const activeProfile = profileRaw ? JSON.parse(profileRaw) : null;
    return { token, user, activeProfile };
  } catch {
    return {};
  }
}

const initial: AuthState = {
  loading: false,
  error: '',
  email: '',
  verified: false,
  user: null,
  token: null,
  activeProfile: null,
  ...loadFromStorage(),
};

export const authState = writable<AuthState>(initial);

export const isAuthenticated = derived(authState, ($s) => !!$s.token && !!$s.user);

export function setLoading(loading: boolean) {
  authState.update((s) => ({ ...s, loading }));
}

export function setError(error: string) {
  authState.update((s) => ({ ...s, error }));
}

export function setVerified() {
  authState.update((s) => ({ ...s, verified: true, error: '' }));
}

export function setEmail(email: string) {
  authState.update((s) => ({ ...s, email }));
}

export async function setUser(
  user: AuthUser,
  token: string,
  refreshToken: string
): Promise<void> {
  if (browser) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));

    /**
     * H-13 — hand the REFRESH token to the SvelteKit server so it lands in an
     * `httpOnly` cookie the page's own scripts cannot read, and keep NO copy.
     *
     * The refresh token is the credential worth stealing: it mints new access
     * tokens indefinitely, so an XSS (C-09's class) that reached it owned the
     * account rather than a 15-minute window. It is handed over here, once, and
     * from this point the browser cannot read it back — renewals go through
     * `/api/session/refresh`. The short-lived ACCESS token stays in
     * `localStorage` because the API client has to attach it to every request
     * from script.
     *
     * **Awaited, not fire-and-forget.** Callers navigate to a guarded route the
     * instant this resolves, and that render asks `hooks.server.ts` whether the
     * cookie is valid. Racing the two meant arriving before the cookie existed
     * and being bounced straight back to /auth.
     *
     * A failure still must not block a successful sign-in: the access token is
     * already stored, so the SPA works. What is lost is SSR route guarding for
     * this session, and the ability to renew — the user is signed in until the
     * access token expires.
     */
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.error(
          `[H-13] could not establish the session cookie (${res.status}). ` +
            'Signed in, but this session cannot be renewed and will end when the ' +
            'access token expires.'
        );
      }
    } catch {
      /* the app still works from the access token; SSR degrades to CSR */
    }
  }
  authState.update((s) => ({ ...s, user, token, verified: true, error: '' }));
}

export function setActiveProfile(profile: ActiveProfile) {
  if (browser) {
    localStorage.setItem('auth_active_profile', JSON.stringify(profile));
  }
  authState.update((s) => ({ ...s, activeProfile: profile }));
}

/** Wipe this browser's auth state. Does not touch the server. */
function clearLocalAuthState() {
  if (browser) {
    localStorage.removeItem('auth_token');
    // Legacy pre-H-13 key; harmless to remove, dangerous to leave.
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_active_profile');
    localStorage.removeItem('post_auth_redirect');
  }
  authState.update((s) => ({
    ...s,
    user: null,
    token: null,
    verified: false,
    email: '',
    activeProfile: null,
  }));
}

/**
 * Drop this browser's session, local and cookie.
 *
 * Used for involuntary sign-outs (an expired or revoked session discovered by
 * `api.client.ts`). No `Authorization` header is sent, so `/api/session`'s
 * DELETE only clears the cookie and skips the upstream logout call — there is
 * nothing left to invalidate in that case, and the access token is typically
 * dead already. Deliberate sign-out goes through `logout()` below.
 */
export function clearUser() {
  if (browser) {
    // Clear the cookie too, or `hooks.server.ts` keeps treating the browser as
    // signed in and the route guard lets it through.
    void fetch('/api/session', { method: 'DELETE' }).catch(() => {});
  }
  clearLocalAuthState();
}

/**
 * H-02 — the logout that actually logs out.
 *
 * `handleLogout()` was `clearUser(); goto('/auth');`, and `clearUser()` is five
 * `localStorage.removeItem` calls. **There was no `fetch` and no reference to
 * `/auth/logout` anywhere in the frontend** — the endpoint existed and was
 * never invoked. So logging out deleted the refresh token from one browser and
 * left it valid server-side for its full 30-day sliding window: an attacker who
 * had exfiltrated it via any XSS finding was entirely unaffected by the victim
 * logging out.
 *
 * The server call comes FIRST, because after the local wipe there is no token
 * left to authenticate it with.
 *
 * H-13 — it now goes through `DELETE /api/session` rather than calling the user
 * service directly. The session row is keyed on the REFRESH token, and the
 * browser no longer has one: it lives in the httpOnly cookie, which only the
 * SvelteKit server can read. That endpoint pairs the cookie with the access
 * token forwarded here, calls the upstream logout, and clears the cookie in the
 * same round trip.
 *
 * Local state is cleared regardless of whether the network call succeeds — a
 * user who clicks "log out" on a flaky connection must still be logged out of
 * this browser. The failure is logged rather than swallowed so it is
 * diagnosable, and the caller can surface it.
 */
export async function logout(): Promise<{ serverInvalidated: boolean }> {
  let serverInvalidated = false;

  if (browser) {
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch('/api/session', {
        method: 'DELETE',
        // Authenticates the upstream logout. Absent means "just drop the
        // cookie", which is the involuntary-signout path in `clearUser()`.
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        serverInvalidated = Boolean(data?.serverInvalidated);
      }
      if (!serverInvalidated) {
        console.error('[logout] server-side invalidation did not confirm');
      }
    } catch (err) {
      console.error('[logout] server-side invalidation failed:', err);
    }
  }

  clearLocalAuthState();
  return { serverInvalidated };
}

export function getToken(): string | null {
  if (browser) return localStorage.getItem('auth_token');
  return null;
}
