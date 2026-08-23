import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { HQ_SESSION_COOKIE, verifyAdminToken } from '$lib/server/hqSession';

/**
 * M-84 — server-side protection for the HQ admin console.
 *
 * **This file did not exist.** `routes/hq/` had a `+layout.svelte` and no
 * `+layout.server.ts`, so with SSR on globally an unauthenticated
 * `GET /hq/finance` returned **200 with the rendered admin shell** — the full
 * structure and section inventory of a console covering finance, wallets, AML,
 * KYC and reconciliation. The redirect fired only after hydration.
 *
 * No data leaked, because `adminFetch` bounces on 401/403. This is the missing
 * layer, not a data breach — and it is notable precisely because the codebase
 * knows the pattern: 17 `+page.server.ts` / `+layout.server.ts` files exist for
 * PUBLIC pages, and none existed for the console.
 *
 * `/hq/login` is excluded, or an admin could never reach the page that issues
 * the session.
 *
 * The API remains the authority on every individual action. What this adds is
 * that an unauthenticated request for an admin page never receives a rendered
 * shell.
 */
export const load: LayoutServerLoad = async ({ cookies, url }) => {
	if (url.pathname === '/hq/login' || url.pathname.startsWith('/hq/login/')) {
		return { admin: null };
	}

	const token = cookies.get(HQ_SESSION_COOKIE);
	const admin = token ? await verifyAdminToken(token) : null;

	if (!admin) {
		// 303 so the browser re-issues as GET regardless of the original method.
		throw redirect(303, '/hq/login');
	}

	return { admin };
};
