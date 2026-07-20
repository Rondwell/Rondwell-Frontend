import type { PageServerLoad } from './$types';
import { SITE, buildEventSeo } from '$lib/seo';

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;
	try {
		const res = await globalThis.fetch(`${SITE.api}/api/v1/events/${id}/public`);
		if (!res.ok) return { seo: null };
		const data = await res.json();
		const event = data.event;
		if (!event) return { seo: null };

		// Prefer the pretty /e/<slug> canonical when the organiser has set one;
		// otherwise fall back to the /event-page/<id> URL.
		const canonicalPath = event.customLinkSlug ? `/e/${event.customLinkSlug}` : `/event-page/${id}`;

		return { seo: buildEventSeo(event, canonicalPath, data.attendeeCount ?? 0) };
	} catch (err) {
		console.error('[SEO] event-page/[id] load failed:', err);
		return { seo: null };
	}
};
