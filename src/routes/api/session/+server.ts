import { json, type RequestHandler } from '@sveltejs/kit';
import {
	clearSessionCache,
	clearSessionCookie,
	invalidateSessionToken,
	SESSION_COOKIE,
	setSessionCookie,
	userServiceUrl,
	verifySession
} from '$lib/server/session';

/**
 * H-13 — the endpoint that moves the refresh token out of `localStorage`.
 *
 * The auth flow talks to the user service directly from the browser, so the
 * refresh token arrives in JavaScript exactly once, at sign-in. This hands it to
 * the SvelteKit server, which stores it in an `httpOnly` cookie the page's own
 * scripts cannot read — so an XSS (C-09's class of bug) can no longer walk off
 * with the credential that mints new sessions.
 *
 * After this call the browser **forgets** the refresh token. It is never read
 * back into script again: renewals go through `/api/session/refresh`, which
 * spends the cookie's copy server-side and returns only a fresh access token.
 * That single-holder rule is not a nicety — the user service rotates refresh
 * tokens on use and treats a replayed one as theft (M-15), so two copies of the
 * same token in two places is a guaranteed session revocation as soon as both
 * are used.
 *
 * The token is **verified before the cookie is set**, via
 * `/api/v1/auth/session/introspect`. Without verification anyone could POST an
 * arbitrary string and have the server hand it back as a session cookie on every
 * subsequent request — not an authentication bypass, since the API still checks
 * it, but it would let an attacker plant a chosen value in a victim's browser
 * (session fixation) and would make `locals.user` unreliable for the route
 * guard. Introspection is used rather than a refresh precisely because it does
 * not consume what it is checking.
 */
export const POST: RequestHandler = async ({ request, cookies, url }) => {
	const body = await request.json().catch(() => null);
	const refreshToken = typeof body?.refreshToken === 'string' ? body.refreshToken : '';

	if (!refreshToken) {
		return json({ success: false, message: 'refreshToken is required' }, { status: 400 });
	}

	const session = await verifySession(refreshToken);
	if (!session.user) {
		return json({ success: false, message: 'Invalid session' }, { status: 401 });
	}

	// The SAME token the client sent — introspection did not rotate it, so this
	// is still the live credential for the session.
	setSessionCookie(cookies, refreshToken, url.protocol === 'https:');
	return json({ success: true, user: session.user });
};

/**
 * Sign out: invalidate server-side, then drop the browser's copy.
 *
 * The refresh token now lives only in the cookie, so the browser can no longer
 * call the user service's logout itself — it has nothing to identify the session
 * row with. This endpoint owns that call.
 *
 * The access token still comes from the client (it is what authenticates the
 * logout), forwarded as `Authorization`. The cookie is cleared regardless of
 * what the upstream says: a user who clicks "log out" on a flaky connection must
 * still be logged out of this browser.
 */
export const DELETE: RequestHandler = async ({ request, cookies, url }) => {
	const refreshToken = cookies.get(SESSION_COOKIE) ?? '';
	const authorization = request.headers.get('authorization') ?? '';
	let serverInvalidated = false;

	if (authorization) {
		try {
			const res = await fetch(`${userServiceUrl()}/api/v1/auth/logout`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: authorization
				},
				// The session row is keyed on the refresh token for refresh-flow
				// sessions, so the server needs it to find the row to delete.
				body: JSON.stringify({ refreshToken }),
				signal: AbortSignal.timeout(4000)
			});
			serverInvalidated = res.ok;
		} catch {
			// Logged-out-locally is still logged out; H-02's server-side
			// invalidation is reported back so the caller can surface it.
		}
	}

	if (refreshToken) await invalidateSessionToken(refreshToken);
	clearSessionCookie(cookies, url.protocol === 'https:');
	clearSessionCache();
	return json({ success: true, serverInvalidated });
};
