import { redirect, isRedirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { SITE, buildEventSeo, fallbackSeo, fetchSeoJson } from '$lib/seo';

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;
	if (!slug) return { eventId: null, seo: fallbackSeo('/') };

	const path = `/e/${slug}`;

	try {
		// 1. Resolve slug → eventId (use global fetch, not SvelteKit's)
		const slugData = await fetchSeoJson(
			`${SITE.api}/api/v1/events/by-slug/${encodeURIComponent(slug)}`
		);
		if (!slugData) return { eventId: null, seo: fallbackSeo(path) };

		// Retired slug → 301 to the current canonical slug so old links, emails
		// and QR codes keep working and SEO equity consolidates on the new URL.
		if (slugData.redirect && slugData.canonicalSlug && slugData.canonicalSlug !== slug) {
			throw redirect(301, `/e/${slugData.canonicalSlug}`);
		}

		const eventId = slugData.event?._id || slugData.event?.id || slugData.eventId;
		if (!eventId) return { eventId: null, seo: fallbackSeo(path) };

		// 2. Fetch full event data for rich SEO
		const eventData = await fetchSeoJson(`${SITE.api}/api/v1/events/${eventId}/public`);
		const event = eventData?.event;
		if (!event) return { eventId, seo: fallbackSeo(path) };

		return {
			eventId,
			seo: buildEventSeo(event, path, eventData.attendeeCount ?? 0)
		};
	} catch (err) {
		// Never swallow the 301 redirect thrown for retired slugs.
		if (isRedirect(err)) throw err;
		console.error('[SEO] e/[slug] load failed:', err);
		return { eventId: null, seo: fallbackSeo(path) };
	}
};
