/**
 * Bounded JSON fetch for server-side SEO loads.
 *
 * Crawlers do not wait. WhatsApp's scraper allots only a few seconds to fetch
 * and parse the HTML before it abandons the preview, and it then caches that
 * failure for days. Our SSR load calls the API before it can emit any tags, so
 * an API request that hangs takes the whole preview down with it.
 *
 * These helpers cap how long the page render can be held up. If the API has
 * not answered in time we abandon that request and let the caller fall back to
 * generic-but-valid metadata, which is always better than a page with no tags.
 */

/** Ceiling for a single API call made during a crawler-facing render. */
export const SEO_FETCH_TIMEOUT_MS = 3500;

/**
 * GET a JSON payload with a hard timeout.
 *
 * Returns `null` on timeout, network error or non-2xx rather than throwing, so
 * loaders can stay linear and always produce metadata.
 */
export async function fetchSeoJson<T = any>(
	url: string,
	timeoutMs = SEO_FETCH_TIMEOUT_MS
): Promise<T | null> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await globalThis.fetch(url, {
			signal: controller.signal,
			headers: { accept: 'application/json' }
		});
		if (!res.ok) return null;
		return (await res.json()) as T;
	} catch (err) {
		// An abort here is an expected outcome under load, not an exception.
		const aborted = err instanceof Error && err.name === 'AbortError';
		console.error(`[SEO] ${aborted ? 'timed out' : 'failed'} fetching ${url}`);
		return null;
	} finally {
		clearTimeout(timer);
	}
}
