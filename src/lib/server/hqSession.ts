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

const ADMIN_API = env.PRIVATE_ADMIN_SERVICE_URL || env.PUBLIC_API_URL || 'http://localhost:3009';

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
 * Returns the admin the token belongs to, or `null`.
 *
 * Never throws: a layout load must not 500 because the admin service blinked.
 * An unverifiable token is treated as signed out, which fails closed.
 */
export async function verifyAdminToken(token: string): Promise<AdminSessionUser | null> {
	if (!token) return null;

	const key = `${token.slice(0, 24)}:${token.length}`;
	const hit = cache.get(key);
	if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.admin;

	try {
		const res = await fetch(`${ADMIN_API}/api/v1/admin/auth/me`, {
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
