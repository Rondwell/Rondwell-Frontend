import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { verifySession, SESSION_COOKIE } from '$lib/server/session';

/**
 * H-13 — server-side route protection and session.
 *
 * **This file did not exist.** Every authenticated page was protected only by a
 * client-side check, because the token lived in `localStorage` where the server
 * cannot read it. Protected pages were served to anyone; the only enforcement
 * was the API returning 401 *after* the shell had rendered, so content flashed
 * before the redirect, every dashboard load was a client-side data waterfall,
 * and no per-request CSP nonce was possible (which is what **M-07** needs).
 *
 * The API remains the authority on data. What this adds is that an
 * unauthenticated request for an authenticated page never gets a rendered shell
 * back.
 */

/**
 * Path prefixes that require a session.
 *
 * A DENY-list of protected prefixes rather than an allow-list of public ones,
 * deliberately: the public surface (event pages, storefronts, collections,
 * `/discover`, the auth flow, invitation links) is large, varied and growing,
 * and an allow-list that fell behind would take a *public* page offline —
 * visible immediately and damaging. A protected prefix that fell behind leaves
 * a page guarded only by the API, which is where it was before this change.
 * Every entry below is a page whose entire purpose requires a session.
 */
const PROTECTED_PREFIXES = [
	'/dashboard',
	'/settings',
	'/account',
	'/wallet',
	'/my-events',
	'/my-tickets',
	'/create-event',
	'/manage',
	'/organizer',
	'/vendor',
	'/speaker',
	'/exhibitor',
	'/collection-admin'
];

/**
 * `/hq` is the admin console and has its own admin-token session, issued by the
 * admin service rather than the user service. Guarding it with the user session
 * here would lock every admin out, so it is deliberately excluded and left to
 * its own client-side check until the admin session moves to a cookie too.
 */
const EXCLUDED_PREFIXES = ['/hq'];

function isProtected(pathname: string): boolean {
	if (EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
		return false;
	}
	return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE);
	const secure = event.url.protocol === 'https:';

	if (token) {
		const session = await verifySession(token);
		event.locals.user = session.user ?? undefined;

		// A refresh token the service has revoked (H-02's logout invalidation) or
		// that has expired must not keep being presented on every request.
		if (!session.user) {
			event.cookies.delete(SESSION_COOKIE, { path: '/', httpOnly: true, secure, sameSite: 'lax' });
		}
	}

	if (!event.locals.user && isProtected(event.url.pathname)) {
		// Carry the destination so the user lands where they were going after
		// signing in. `pathname + search` only — never a caller-supplied absolute
		// URL, which is the open-redirect shape H-73 covers on `/welcome`.
		const returnTo = `${event.url.pathname}${event.url.search}`;
		throw redirect(302, `/auth?returnUrl=${encodeURIComponent(returnTo)}`);
	}

	const response = await resolve(event);

	/**
	 * M-07 — the security headers a CSP does not cover.
	 *
	 * The `Content-Security-Policy` itself is generated per request by
	 * SvelteKit from `svelte.config.js` (`kit.csp`, nonce mode) — it is not set
	 * here, because SvelteKit has to know the nonce it stamped into the page.
	 * These are the rest, and before this change the app sent none of them.
	 */

	// Belt and braces with `frame-ancestors 'none'`, for browsers that predate
	// CSP Level 2.
	response.headers.set('X-Frame-Options', 'DENY');

	// Stops a browser MIME-sniffing a JSON or text response into something
	// executable — the classic way an upload endpoint becomes an XSS vector.
	response.headers.set('X-Content-Type-Options', 'nosniff');

	// `strict-origin-when-cross-origin`: full URL on same-origin navigations,
	// origin only cross-origin, nothing at all on HTTPS→HTTP. Rondwell URLs
	// carry event, invoice and registration ids, and those should not travel
	// to third-party sites in a Referer header.
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	/**
	 * Deny the powerful APIs this app never uses, so an injected script cannot
	 * reach for them either.
	 *
	 * `geolocation` and `payment` are NOT among them, and denying them broke two
	 * shipped features silently:
	 *
	 *   - `geolocation=()` denies the API to every origin **including this one**,
	 *     so `navigator.geolocation.getCurrentPosition` never even prompts. Three
	 *     live call sites depend on it — the Create Event region/timezone
	 *     prefill, `AddressAutocomplete`'s proximity bias, and
	 *     `ExternalEventModal`. The permission prompt simply stopped appearing,
	 *     which reads as "the location picker is broken".
	 *   - `payment=()` disables the Payment Request API, which is how Paystack
	 *     and Stripe offer Apple Pay / Google Pay inside their checkout frames.
	 *
	 * Both are now `(self ...)` rather than open: this origin may use them, and
	 * for `payment` the two payment frames may too. Everything the app genuinely
	 * never touches stays denied.
	 *
	 * `interest-cohort` is dropped. FLoC was removed from Chrome, and naming a
	 * feature the browser does not know logs
	 * `Error with Permissions-Policy header: Unrecognized feature` on every
	 * response — noise that trains people to ignore the console.
	 */
	response.headers.set(
		'Permissions-Policy',
		[
			'camera=()',
			'microphone=()',
			'usb=()',
			'geolocation=(self)',
			'payment=(self "https://js.paystack.co" "https://js.stripe.com")'
		].join(', ')
	);

	// HSTS only over HTTPS. Sending it over plain HTTP is meaningless, and in
	// local development it would pin `localhost` to HTTPS in the developer's
	// browser — a genuinely annoying thing to undo.
	if (event.url.protocol === 'https:') {
		response.headers.set(
			'Strict-Transport-Security',
			'max-age=31536000; includeSubDomains'
		);
	}

	return response;
};
