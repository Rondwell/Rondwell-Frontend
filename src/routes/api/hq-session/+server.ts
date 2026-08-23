import { json, type RequestHandler } from '@sveltejs/kit';
import { HQ_SESSION_COOKIE, verifyAdminToken } from '$lib/server/hqSession';

/**
 * M-84 — the HQ console's server-side session cookie.
 *
 * The admin console had no `+layout.server.ts` at all and SSR is on globally,
 * so an unauthenticated `GET /hq/finance` returned **200 with the rendered
 * admin shell** — the whole structure and inventory of an 18-section console
 * covering finance, wallets, AML, KYC and reconciliation. No data leaked
 * (`adminFetch` bounces on 401/403), but the layer was simply absent.
 *
 * Notable because the codebase clearly knows the pattern: 17
 * `+page.server.ts` / `+layout.server.ts` files exist for PUBLIC pages, and
 * none for the console.
 *
 * The token lives in `localStorage` for `adminFetch` to attach; this mirrors it
 * into an `httpOnly` cookie the server can read. Same shape as H-13's
 * `/api/session`, kept separate because the two sessions are issued by
 * different services and must never be interchangeable.
 */
export const POST: RequestHandler = async ({ request, cookies, url }) => {
	const body = await request.json().catch(() => null);
	const token = typeof body?.token === 'string' ? body.token : '';
	if (!token) return json({ success: false, message: 'token is required' }, { status: 400 });

	// Verified before it is stored: otherwise anyone could POST a string and
	// have the server hand it back as a session cookie on every request.
	const admin = await verifyAdminToken(token);
	if (!admin) return json({ success: false, message: 'Invalid admin session' }, { status: 401 });

	cookies.set(HQ_SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		secure: url.protocol === 'https:',
		sameSite: 'lax',
		// Short: an admin session is high-privilege and should not outlive the
		// working day the way a user session reasonably can.
		maxAge: 60 * 60 * 12
	});

	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ cookies, url }) => {
	cookies.delete(HQ_SESSION_COOKIE, {
		path: '/',
		httpOnly: true,
		secure: url.protocol === 'https:',
		sameSite: 'lax'
	});
	return json({ success: true });
};
