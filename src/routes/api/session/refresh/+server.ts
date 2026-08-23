import { json, type RequestHandler } from '@sveltejs/kit';
import {
	clearSessionCookie,
	invalidateSessionToken,
	SESSION_COOKIE,
	setSessionCookie,
	userServiceUrl
} from '$lib/server/session';

/**
 * H-13 — renew the access token using the httpOnly session cookie.
 *
 * This is the **only** place a refresh token is ever spent. That is the whole
 * point of the endpoint.
 *
 * ── Why a single spender is mandatory ────────────────────────────────────
 *
 * The user service rotates refresh tokens on every use: the presented token is
 * invalidated and a replacement is issued (`AuthService.refreshToken`). It also
 * records the token it rotated away from, and treats a replay of one as a
 * **stolen credential**, revoking every session the user has (M-15).
 *
 * So a refresh token cannot be held in two places. Before this endpoint existed
 * it was held in two: `localStorage` (for `api.client.ts`) and the session
 * cookie. Whichever spent first left the other holding a token that, on its next
 * use, looked exactly like theft — sign in, load a page, get signed out of
 * everything. Concentrating the spend here means there is only ever one copy and
 * only one spender.
 *
 * ── What the browser gets back ───────────────────────────────────────────
 *
 * The new **access** token, and nothing else. The rotated refresh token goes
 * straight back into the cookie and is never exposed to script — which is what
 * finally takes the credential worth stealing out of reach of an XSS.
 *
 * ── Failure ──────────────────────────────────────────────────────────────
 *
 * Any non-2xx from upstream means this session is over (expired, revoked, or
 * reuse-detected). The cookie is cleared so the next render does not present a
 * dead token again, and the caller gets a 401 to act on. A *transport* failure
 * is reported as 503 and deliberately leaves the cookie intact: a brief network
 * blip must not sign anyone out.
 */
export const POST: RequestHandler = async ({ cookies, url }) => {
	const secure = url.protocol === 'https:';
	const current = cookies.get(SESSION_COOKIE) ?? '';

	if (!current) {
		return json({ success: false, message: 'No session' }, { status: 401 });
	}

	let res: Response;
	try {
		res = await fetch(`${userServiceUrl()}/api/v1/auth/refresh-token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refreshToken: current }),
			signal: AbortSignal.timeout(6000)
		});
	} catch {
		// Transport failure — the session may well be fine. Keep the cookie and
		// let the client retry rather than destroying a valid login.
		return json(
			{ success: false, message: 'Auth service unreachable' },
			{ status: 503 }
		);
	}

	if (!res.ok) {
		invalidateSessionToken(current);
		clearSessionCookie(cookies, secure);
		return json({ success: false, message: 'Session expired' }, { status: 401 });
	}

	const data = await res.json().catch(() => null);
	const token = data?.token ?? data?.data?.token;
	const rotated = data?.refreshToken ?? data?.data?.refreshToken;

	/**
	 * M-82 — a 200 without a complete pair is a PROTOCOL ERROR, not something to
	 * paper over by re-persisting what we sent. Upstream rotates on every use, so
	 * the token in the cookie is already dead by the time we are reading this
	 * response; keeping it would guarantee a reuse-detection revocation on the
	 * next call. Fail closed instead.
	 */
	if (!token || !rotated) {
		console.error(
			'[H-13] refresh-token responded 200 without a complete token pair ' +
				`(token: ${Boolean(token)}, refreshToken: ${Boolean(rotated)}). ` +
				'The cookie now holds a spent token, so the session is ended rather ' +
				'than left to trip M-15 reuse detection on its next use.'
		);
		invalidateSessionToken(current);
		clearSessionCookie(cookies, secure);
		return json({ success: false, message: 'Session expired' }, { status: 401 });
	}

	// The old value is dead the moment upstream issued its replacement — drop any
	// cached "live" verdict for it before the next render reads the cache.
	invalidateSessionToken(current);
	setSessionCookie(cookies, rotated, secure);

	// Only the access token crosses back into script.
	return json({ success: true, token, user: data?.user ?? data?.data?.user ?? null });
};
