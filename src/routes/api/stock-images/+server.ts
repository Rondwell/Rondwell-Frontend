import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

/**
 * Server-side proxy for the Unsplash API.
 *
 * WHY a proxy (and not calling Unsplash from the browser):
 *  - Keeps the Unsplash access key server-side (it must never ship to the client).
 *  - Lets us honour Unsplash API guidelines centrally: the required
 *    "trigger download" ping (POST) and consistent attribution metadata.
 *  - Normalises the payload so the modal only deals with what it needs.
 *
 * Configure `UNSPLASH_ACCESS_KEY` in the environment. If it's missing the
 * endpoint degrades gracefully (empty results + `disabled: true`) so the image
 * picker still works as an upload-only dialog.
 */

const UNSPLASH_API = 'https://api.unsplash.com';
const PER_PAGE = 24;

// Human-facing category → Unsplash search query. "Featured" has no query and
// falls back to a curated, event-flavoured search.
const CATEGORY_QUERIES: Record<string, string> = {
	Featured: 'event celebration party',
	'Previous Events': 'conference event crowd',
	Halloween: 'halloween party',
	Food: 'food catering',
	Party: 'party celebration',
	Drinks: 'cocktails drinks bar',
	Sports: 'sports game stadium',
	Games: 'esports gaming'
};

function getAccessKey(): string | null {
	return env.UNSPLASH_ACCESS_KEY?.trim() || null;
}

function normalize(photo: any) {
	return {
		id: photo.id,
		thumb: photo.urls?.small ?? photo.urls?.thumb,
		// `regular` (~1080px wide) is plenty for a cover image and much lighter
		// than `full`/`raw`, keeping S3 storage and load times reasonable.
		full: photo.urls?.regular ?? photo.urls?.full,
		downloadLocation: photo.links?.download_location ?? null,
		alt: photo.alt_description || photo.description || 'Stock photo',
		author: photo.user?.name ?? 'Unsplash',
		authorUrl: photo.user?.links?.html ?? 'https://unsplash.com'
	};
}

export const GET: RequestHandler = async ({ url, fetch }) => {
	const accessKey = getAccessKey();
	if (!accessKey) {
		return json({ results: [], disabled: true });
	}

	const category = url.searchParams.get('category') ?? 'Featured';
	const rawQuery = url.searchParams.get('q')?.trim();
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
	const query = rawQuery || CATEGORY_QUERIES[category] || CATEGORY_QUERIES.Featured;

	const search = new URL(`${UNSPLASH_API}/search/photos`);
	search.searchParams.set('query', query);
	search.searchParams.set('per_page', String(PER_PAGE));
	search.searchParams.set('page', String(page));
	search.searchParams.set('content_filter', 'high');
	search.searchParams.set('orientation', 'landscape');

	try {
		const res = await fetch(search.toString(), {
			headers: { Authorization: `Client-ID ${accessKey}`, 'Accept-Version': 'v1' }
		});
		if (!res.ok) {
			throw error(res.status === 403 ? 429 : 502, 'Stock image provider error');
		}
		const data = await res.json();
		const results = Array.isArray(data.results) ? data.results.map(normalize) : [];
		return json({ results, total: data.total ?? results.length, page });
	} catch (err: any) {
		if (err?.status) throw err;
		throw error(502, 'Failed to reach stock image provider');
	}
};

/**
 * Unsplash's API guidelines REQUIRE pinging a photo's `download_location`
 * whenever it is actually used (selected/downloaded). This endpoint performs
 * that server-side so the access key stays private.
 */
export const POST: RequestHandler = async ({ request, fetch }) => {
	const accessKey = getAccessKey();
	if (!accessKey) return json({ ok: true, disabled: true });

	let downloadLocation: string | undefined;
	try {
		({ downloadLocation } = await request.json());
	} catch {
		throw error(400, 'Invalid body');
	}

	// Only allow official Unsplash download-tracking URLs (defence against SSRF).
	if (!downloadLocation || !/^https:\/\/api\.unsplash\.com\//.test(downloadLocation)) {
		throw error(400, 'Invalid download location');
	}

	try {
		await fetch(downloadLocation, {
			headers: { Authorization: `Client-ID ${accessKey}`, 'Accept-Version': 'v1' }
		});
	} catch {
		// Best-effort — never block image selection on the tracking ping.
	}
	return json({ ok: true });
};
