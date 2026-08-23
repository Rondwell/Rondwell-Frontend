import type { PageServerLoad } from './$types';
import { SITE, buildEventSeo, fallbackSeo, fetchSeoJson } from '$lib/seo';

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;
	const path = `/event-page/${id}`;

	try {
		const data = await fetchSeoJson(`${SITE.api}/api/v1/events/${id}/public`);
		const event = data?.event;
		if (!event) return { seo: fallbackSeo(path) };

		// Prefer the pretty /e/<slug> canonical when the organiser has set one;
		// otherwise fall back to the /event-page/<id> URL.
		const canonicalPath = event.customLinkSlug ? `/e/${event.customLinkSlug}` : path;

		return { seo: buildEventSeo(event, canonicalPath, data.attendeeCount ?? 0) };
	} catch (err) {
		console.error('[SEO] event-page/[id] load failed:', err);
		return { seo: fallbackSeo(path) };
	}
};
