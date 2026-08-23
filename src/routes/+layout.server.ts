import type { LayoutServerLoad } from './$types';

/**
 * H-13 — make the server-side session available to every page.
 *
 * `locals.user` is set by `hooks.server.ts` from a verified `httpOnly` cookie.
 * Returning it here means an authenticated page can render its shell with the
 * user already known, instead of the client-side waterfall that ran on every
 * dashboard load: render empty → read localStorage → fetch → re-render.
 */
export const prerender = false;
// SSR is enabled globally — individual routes opt out via their own +layout.ts

export const load: LayoutServerLoad = async ({ locals }) => {
	return { user: locals.user ?? null };
};
