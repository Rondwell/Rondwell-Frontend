import { env } from '$env/dynamic/private';

/**
 * M-84 — server-side verification of an HQ admin token.
 *
 * The console's only guard was
 * `$: if (browser && !isAdminAuthenticated()) goto('/hq/login')`, where
 * `isAdminAuthenticated()` was `!!getAdminToken()` — a presence check on a
 * localStorage value with no signature, expiry or issuer validation. With SSR
 * on globally, an unauthenticated `GET /hq/finance` returned 200 with the
 * rendered admin shell and the redirect fired only after hydration.
 *
 * Verification is done by ASKING THE ADMIN SERVICE, for the same reason H-13's
 * user session does: the frontend server does not hold the signing key, and
 * putting the admin service's key in a Netlify build environment to save a
 * network hop is not a trade worth making for the console that fronts finance,
 * wallets, AML and KYC.
 */

/**
 * Where to ask.
 *
 * `VITE_API_URL` (the gateway) is in the chain because it is the only one of
 * these that is actually SET, in both `.env` and `.env.production` — without it
 * every deploy fell through to `http://localhost:3009`, which on Netlify is
 * nothing at all, so `verifyAdminToken` returned `null` for every token and the
 * console redirected every admin back to the login page they had just used.
 * The gateway proxies `/api/v1/admin` to the admin service (`ROUTE_MAP` in
 * `services/gateway/src/app.ts`), so the same path works through either.
 */
const ADMIN_API =
	env.PRIVATE_ADMIN_SERVICE_URL ||
	env.PUBLIC_API_URL ||
	env.VITE_API_URL ||
	// Build-time fallback. `$env/dynamic/private` reads `process.env` at RUNTIME,
	// and on Netlify that holds only what is configured in the site's
	// environment — a repo `.env.production` never reaches it. Vite inlines this
	// one at build, so the deployed function has a real gateway URL even when
	// nothing was set in the Netlify UI.
	import.meta.env.VITE_API_URL ||
	'http://localhost:3009';

export const HQ_SESSION_COOKIE = 'rw_hq_session';

/** Admin sessions are short and high-privilege; verify often. */
const CACHE_TTL_MS = 10_000;

export interface AdminSessionUser {
	id: string;
	email?: string;
	role?: string;
}

const cache = new Map<string, { admin: AdminSessionUser | null; at: number }>();

/**
 * Key the cache on a HASH of the token, not a prefix.
 *
 * This was `${token.slice(0, 24)}:${token.length}` — and the first 24
 * characters of EVERY HS256 JWT are the same 36-character header,
 * `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`, so the prefix contributed nothing
 * and the key was effectively the token's LENGTH. Admin payloads are
 * `{ id, email, role, iat, exp }` with a 24-hex id, so two admins whose email
 * addresses are the same length produced the same key — and a positive entry
 * cached under it was returned for ANY token of that length, including an
 * expired or forged one. That is an authentication bypass on the console
 * guard, not just a mis-attribution.
 *
 * SHA-256 keeps the raw bearer credential out of the map key (the reason the
 * prefix was chosen) while actually distinguishing tokens.
 */
async function cacheKey(token: string): Promise<string> {
	// SHA-256 via the Web Crypto global rather than `node:crypto`: this project
	// has no `@types/node`, and `crypto.subtle` is present in both the dev
	// server and the deployed Netlify function.
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
	return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Returns the admin the token belongs to, or `null`.
 *
 * Never throws: a layout load must not 500 because the admin service blinked.
 * An unverifiable token is treated as signed out, which fails closed.
 */
export async function verifyAdminToken(token: string): Promise<AdminSessionUser | null> {
	if (!token) return null;

	const key = await cacheKey(token);
	const hit = cache.get(key);
	if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.admin;

	try {
		// `/api/v1/admin/me` — NOT `/auth/me`. The admin service mounts one router
		// at `/api/v1/admin` (`services/admin/src/index.ts`) and its profile route
		// is `router.get("/me", adminAuth, …)`; there is no `auth` segment anywhere
		// in it. `/auth/me` fell through to the 404 handler, `res.ok` was false, and
		// every token verified as `null`.
		const res = await fetch(`${ADMIN_API}/api/v1/admin/me`, {
			headers: { Authorization: `Bearer ${token}` },
			signal: AbortSignal.timeout(4000)
		});

		if (!res.ok) {
			cache.set(key, { admin: null, at: Date.now() });
			return null;
		}

		const data = await res.json();
		const raw = data?.data ?? data?.admin ?? data;
		const admin: AdminSessionUser | null = raw?.id || raw?._id
			? { id: String(raw.id ?? raw._id), email: raw.email, role: raw.role }
			: null;

		cache.set(key, { admin, at: Date.now() });
		return admin;
	} catch {
		// Do NOT cache a transport failure — a blip must not lock every admin
		// out for the full TTL.
		return null;
	}
}
