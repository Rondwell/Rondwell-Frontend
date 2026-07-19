/**
 * Client for the server-side Unsplash proxy (`/api/stock-images`).
 *
 * The proxy keeps the Unsplash access key server-side and handles the
 * provider's required download-tracking. If the provider isn't configured the
 * search simply returns an empty, `disabled` result so callers can fall back
 * to upload-only behaviour.
 */

export interface StockImage {
	id: string;
	thumb: string;
	full: string;
	downloadLocation: string | null;
	alt: string;
	author: string;
	authorUrl: string;
}

export interface StockImageSearchResult {
	results: StockImage[];
	total: number;
	page: number;
	disabled: boolean;
}

export async function searchStockImages(
	category: string,
	query = '',
	page = 1
): Promise<StockImageSearchResult> {
	const params = new URLSearchParams({ category, page: String(page) });
	if (query.trim()) params.set('q', query.trim());

	const res = await fetch(`/api/stock-images?${params.toString()}`);
	if (!res.ok) {
		throw new Error('Could not load stock images. Please try again.');
	}
	const data = await res.json();
	return {
		results: Array.isArray(data.results) ? data.results : [],
		total: data.total ?? 0,
		page: data.page ?? page,
		disabled: Boolean(data.disabled)
	};
}

/**
 * Fire-and-forget: notify Unsplash (via our proxy) that a photo was used, as
 * required by their API guidelines. Never throws.
 */
export async function triggerStockImageDownload(downloadLocation: string | null): Promise<void> {
	if (!downloadLocation) return;
	try {
		await fetch('/api/stock-images', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ downloadLocation })
		});
	} catch {
		/* best-effort */
	}
}

/**
 * Download a remote (stock) image and wrap it in a `File` so it can be pushed
 * through the existing S3 upload pipeline. Returns `null` if the fetch fails
 * (e.g. CORS/network), letting the caller decide how to degrade.
 */
export async function stockImageToFile(imageUrl: string, filename = 'event-cover'): Promise<File | null> {
	try {
		const res = await fetch(imageUrl);
		if (!res.ok) return null;
		const blob = await res.blob();
		const ext = (blob.type.split('/')[1] || 'jpg').split('+')[0];
		return new File([blob], `${filename}.${ext}`, { type: blob.type || 'image/jpeg' });
	} catch {
		return null;
	}
}
