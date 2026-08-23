import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

/**
 * H-13 — the server-side half of the session.
 *
 * ── What was wrong ───────────────────────────────────────────────────────
 *
 * There was **no `hooks.server.ts` at all**, and the two `+layout.server.ts`
 * files that existed were one line each (`export const prerender = false`).
 * Every authenticated page — event management, collections, the dashboard, all
 * five collection modules and all seven event-management modules — was
 * protected only by a client-side check, because the token lived in
 * `localStorage` where the server cannot read it.
 *
 * Four consequences, and the fourth is the one that blocks other work:
 *
 *   1. Protected pages were SERVED to anyone; the only real enforcement was the
 *      API returning 401 after the shell had already rendered.
 *   2. No SSR for authenticated pages → a client-side data waterfall on every
 *      dashboard load.
 *   3. Content flashed before the redirect.
 *   4. **No per-request CSP nonce was possible**, which is what M-07 needs.
 *
 * ── The design ───────────────────────────────────────────────────────────
 *
 * The **refresh token** moves to an `httpOnly; Secure; SameSite=Lax` cookie,
 * set by `/api/session` (a SvelteKit endpoint, so the browser never holds it in
 * script-readable storage). The short-lived **access token** stays in memory /
 * `localStorage` for the API client — it is the refresh token that is worth
 * stealing, and it is now unreachable from `document`.
 *
 * `SameSite=Lax` rather than `Strict`: `Strict` would drop the cookie on the
 * top-level navigation back from Google sign-in and from every emailed link
 * into an authenticated page, logging the user out at exactly the moments they
 * arrive. `Lax` still blocks the cross-site POST that CSRF needs.
 *
 * ── How the cookie is VERIFIED ───────────────────────────────────────────
 *
 * By asking the service that issued it. The frontend server does **not** hold
 * `JWT_SECRET` — putting the platform's signing key in a Netlify build
 * environment to save a network hop would be trading a real secret for
 * latency.
 *
 * The endpoint is `POST /api/v1/auth/session/introspect`, which validates the
 * token and returns the user **without rotating it**.
 *
 * This used to call `POST /api/v1/auth/refresh-token`, and that was the defect
 * that made signing in useless. The user service rotates on every refresh:
 * the presented token dies and a new one is issued. So each render of a guarded
 * page silently spent the user's refresh token while the browser kept the old
 * copy — and a rotated-away token is M-15's *stolen credential* signal, so the
 * next genuine refresh revoked every session the user had. The symptom was
 * landing on a dashboard and being bounced to /auth a moment later.
 *
 * Introspection is a read, so it is safe to repeat on every request. Answers
 * are still cached per token for `SESSION_CACHE_TTL_MS` so a burst of requests
 * for one page render costs one upstream call.
 */

const USER_API =
	env.PRIVATE_USER_SERVICE_URL || env.PUBLIC_API_URL || 'http://localhost:3001';

export const SESSION_COOKIE = 'rw_session';

/** One page render fans out to several requests; do not verify each one. */
const SESSION_CACHE_TTL_MS = 15_000;

export interface SessionUser {
	id: string;
	email: string;
	name?: string;
	role?: string;
}

interface CacheEntry {
	user: SessionUser | null;
	at: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(token: string): string {
	// The token is a bearer credential; key on a prefix + length rather than
	// holding the whole value as a map key that could surface in a heap dump.
	return `${token.slice(0, 24)}:${token.length}`;
}

/**
 * Verify a refresh token with the user service and return the user it belongs
 * to, or `null`.
 *
 * Never throws: a page render must not 500 because the auth service is
 * briefly unreachable. An unverifiable session is treated as signed out, which
 * fails closed for the route guard.
 */
export async function verifySession(token: string): Promise<CacheEntry> {
	if (!token) return { user: null, at: Date.now() };

	const key = cacheKey(token);
	const hit = cache.get(key);
	if (hit && Date.now() - hit.at < SESSION_CACHE_TTL_MS) return hit;

	try {
		const res = await fetch(`${USER_API}/api/v1/auth/session/introspect`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refreshToken: token }),
			signal: AbortSignal.timeout(4000)
		});

		if (!res.ok) {
			const miss: CacheEntry = { user: null, at: Date.now() };
			cache.set(key, miss);
			return miss;
		}

		const data = await res.json();
		const raw = data?.user ?? data?.data?.user;
		const entry: CacheEntry = {
			user: raw
				? {
						id: String(raw._id ?? raw.id ?? ''),
						email: String(raw.email ?? ''),
						name: raw.name ?? undefined,
						role: raw.role ?? undefined
					}
				: null,
			at: Date.now()
		};
		cache.set(key, entry);
		return entry;
	} catch {
		// Do NOT cache a transport failure — a blip must not sign everyone out
		// for the full TTL.
		return { user: null, at: Date.now() };
	}
}

/** Options shared by set and clear, so the two cannot drift. */
function cookieOptions(secure: boolean) {
	return {
		path: '/',
		httpOnly: true,
		secure,
		sameSite: 'lax' as const
	};
}

export function setSessionCookie(cookies: Cookies, token: string, secure: boolean): void {
	cookies.set(SESSION_COOKIE, token, {
		...cookieOptions(secure),
		// 30 days — matches the refresh token's own lifetime. A shorter cookie
		// would sign users out while their token was still valid; a longer one
		// would keep sending a token the API rejects.
		maxAge: 60 * 60 * 24 * 30
	});
}

export function clearSessionCookie(cookies: Cookies, secure: boolean): void {
	cookies.delete(SESSION_COOKIE, cookieOptions(secure));
}

/** Test seam / invalidation after logout. */
export function clearSessionCache(): void {
	cache.clear();
}

/**
 * Drop one token's cached verdict.
 *
 * Called when `/api/session/refresh` rotates a token: the old value is dead the
 * instant the upstream issues its replacement, and a cached "live" verdict for
 * it would otherwise keep `hooks.server.ts` treating a spent credential as a
 * valid session for the rest of the TTL.
 */
export function invalidateSessionToken(token: string): void {
	if (token) cache.delete(cacheKey(token));
}

/**
 * The user service origin, for endpoints that need to call it directly rather
 * than through `verifySession`. Exported so `/api/session/refresh` cannot drift
 * onto a different host than the one the session was verified against.
 */
export function userServiceUrl(): string {
	return USER_API;
}
