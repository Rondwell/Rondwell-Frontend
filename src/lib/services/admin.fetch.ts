/**
 * Authenticated fetch wrapper for admin HQ pages.
 *
 * Uses `admin_token` (from admin login) rather than `auth_token` (user login).
 *
 * ── Why there is no internal API key here any more ───────────────────────
 *
 * This wrapper used to attach `x-internal-api-key` from
 * `import.meta.env.VITE_ADMIN_ACCESS_KEY`. Vite inlines every `VITE_`-prefixed
 * variable into the client bundle, so the platform's master internal key was
 * shipped as a literal in public JavaScript — readable by anyone who loaded the
 * site, logged in or not. Since payment-service admin endpoints authorise on
 * that key ALONE, publishing it handed out full finance, AML, reconciliation
 * and wallet-audit access to the internet.
 *
 * Calls to payment-service admin endpoints are now rewritten to travel through
 * admin-service's allowlisted proxy, which verifies the admin JWT and attaches
 * the internal key server-side. Callers keep using the same payment-service
 * URLs; `toAdminUrl` does the redirection, so no page or service file had to
 * change its endpoint strings.
 */
import { browser } from '$app/environment';

function getAdminToken(): string | null {
	if (!browser) return null;
	return localStorage.getItem('admin_token');
}

/**
 * Rewrite a direct payment-service admin URL onto the admin-service proxy.
 * Anything else is passed through untouched.
 */
export function toAdminUrl(url: string): string {
	const marker = '/api/v1/payment/';
	const at = url.indexOf(marker);
	if (at === -1) return url;
	const origin = url.slice(0, at);
	const rest = url.slice(at + marker.length);
	return `${origin}/api/v1/admin/proxy/payment/${rest}`;
}

/**
 * Fetch wrapper for admin pages. Attaches `Authorization: Bearer <admin_token>`
 * and routes payment-service admin calls through the server-side proxy.
 *
 * Throws "Not authenticated" if no admin token is stored.
 */
export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
	const token = getAdminToken();
	if (!token) throw new Error('Not authenticated');

	const headers = new Headers(options.headers);
	headers.set('Authorization', `Bearer ${token}`);
	if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
		headers.set('Content-Type', 'application/json');
	}

	const res = await fetch(toAdminUrl(url), { ...options, headers });

	// A rejected admin token means the session is gone — bounce to login rather
	// than letting every page render its own "failed to load" state.
	if (res.status === 401 && browser) {
		localStorage.removeItem('admin_token');
		localStorage.removeItem('admin_user');
		window.location.href = '/hq/login';
	}

	return res;
}
