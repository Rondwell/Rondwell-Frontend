import { redirect, isRedirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { SITE, buildEventSeo } from '$lib/seo';

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;
	if (!slug) return { eventId: null, seo: null };

	try {
		// 1. Resolve slug → eventId (use global fetch, not SvelteKit's)
		const slugRes = await globalThis.fetch(
			`${SITE.api}/api/v1/events/by-slug/${encodeURIComponent(slug)}`
		);
		if (!slugRes.ok) return { eventId: null, seo: null };
		const slugData = await slugRes.json();

		// Retired slug → 301 to the current canonical slug so old links, emails
		// and QR codes keep working and SEO equity consolidates on the new URL.
		if (slugData.redirect && slugData.canonicalSlug && slugData.canonicalSlug !== slug) {
			throw redirect(301, `/e/${slugData.canonicalSlug}`);
		}

		const eventId = slugData.event?._id || slugData.event?.id || slugData.eventId;
		if (!eventId) return { eventId: null, seo: null };

		// 2. Fetch full event data for rich SEO
		const eventRes = await globalThis.fetch(`${SITE.api}/api/v1/events/${eventId}/public`);
		if (!eventRes.ok) return { eventId, seo: null };
		const eventData = await eventRes.json();
		const event = eventData.event;
		if (!event) return { eventId, seo: null };

		return {
			eventId,
			seo: buildEventSeo(event, `/e/${slug}`, eventData.attendeeCount ?? 0)
		};
	} catch (err) {
		// Never swallow the 301 redirect thrown for retired slugs.
		if (isRedirect(err)) throw err;
		console.error('[SEO] e/[slug] load failed:', err);
		return { eventId: null, seo: null };
	}
};
