import type { LayoutServerLoad } from './$types';

export const prerender = false;

const API_BASE = 'https://api.rondwell.com';

export const load: LayoutServerLoad = async ({ params }) => {
	const { id } = params;
	try {
		const res = await globalThis.fetch(`${API_BASE}/api/v1/events/${id}/public`);
		if (!res.ok) return { serverThemeColor: null, slug: null };
		const data = await res.json();
		return {
			serverThemeColor: data.event?.themeColor ?? null,
			// Expose the pretty slug so the layout can rewrite sub-tab URLs
			// consistently — even on a cold refresh where the overview page
			// (the only other place that sets the slug map) never ran.
			slug: data.event?.customLinkSlug ?? null,
			/**
			 * Celebration-layer flags, RESOLVED server-side.
			 *
			 * Loaded HERE rather than in the page so the tab bar renders the
			 * right tabs on first paint. A Gifts tab that pops in a beat late —
			 * or worse, a Memories tab that shows for an event without it —
			 * is exactly the kind of flicker that makes a public page feel
			 * broken.
			 */
			features: data.features ?? null
		};
	} catch {
		return { serverThemeColor: null, slug: null, features: null };
	}
};
