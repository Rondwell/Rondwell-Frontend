import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const API_BASE = 'https://api.rondwell.com';

// The public event page renders under `/event-page/[id]/*`, but the browser
// shows the pretty `/e/{slug}/{tab}` URL (rewritten client-side after
// navigation). On a cold refresh the browser hits this route directly, so we
// resolve the slug → eventId here and redirect to the canonical route. The
// event-page layout then rewrites the visible URL back to `/e/{slug}/{tab}`.
const VALID_TABS = new Set(['agenda', 'participant', 'media', 'community']);

export const load: PageServerLoad = async ({ params }) => {
	const { slug, tab } = params;

	if (!slug || !VALID_TABS.has(tab)) {
		throw error(404, 'Page not found');
	}

	let eventId: string | null = null;
	let canonicalSlug: string | null = null;
	let isLegacy = false;
	try {
		const res = await globalThis.fetch(
			`${API_BASE}/api/v1/events/by-slug/${encodeURIComponent(slug)}`
		);
		if (res.ok) {
			const d = await res.json();
			eventId = d.event?._id || d.event?.id || d.eventId || null;
			canonicalSlug = d.canonicalSlug ?? null;
			isLegacy = !!d.redirect;
		}
	} catch {
		// Network failure — fall through to 404 below.
	}

	if (!eventId) {
		throw error(404, 'Event not found');
	}

	// Retired slug → 301 to the canonical `/e/{slug}/{tab}` (SEO + old links).
	if (isLegacy && canonicalSlug && canonicalSlug !== slug) {
		throw redirect(301, `/e/${canonicalSlug}/${tab}`);
	}

	throw redirect(302, `/event-page/${eventId}/${tab}`);
};
