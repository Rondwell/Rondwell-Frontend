/**
 * Authenticated fetch wrapper for admin HQ pages.
 *
 * Uses `admin_token` (from admin login) instead of `auth_token` (user login).
 * Also attaches the `x-internal-api-key` header required by payment-service
 * admin endpoints (AML, Beneficiaries, Finance, Wallet Audit, etc).
 */
import { browser } from '$app/environment';

const ADMIN_ACCESS_KEY = import.meta.env.VITE_ADMIN_ACCESS_KEY || '';

function getAdminToken(): string | null {
	if (!browser) return null;
	return localStorage.getItem('admin_token');
}

/**
 * Fetch wrapper for admin pages. Attaches:
 * - `Authorization: Bearer <admin_token>` (JWT from admin login)
 * - `x-internal-api-key` (static key for payment-service admin gates)
 *
 * Throws "Not authenticated" if no admin token is stored.
 */
export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
	const token = getAdminToken();
	if (!token) throw new Error('Not authenticated');

	const headers = new Headers(options.headers);
	headers.set('Authorization', `Bearer ${token}`);
	if (ADMIN_ACCESS_KEY) {
		headers.set('x-internal-api-key', ADMIN_ACCESS_KEY);
	}
	if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
		headers.set('Content-Type', 'application/json');
	}

	const res = await fetch(url, { ...options, headers });
	return res;
}
