import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Same-origin byte proxy for a chosen stock photo.
 *
 * When an organizer picks an Unsplash photo, the create page imports it into
 * our own storage by downloading the bytes and uploading them as the event
 * cover. That download used to go straight to `images.unsplash.com` from the
 * browser — which the CSP's `connect-src` does not allow — so the fetch was
 * blocked, the upload was skipped, and the event was created WITHOUT the
 * photo the organizer had just picked (the preview still showed it, because
 * `img-src` allows any https image).
 *
 * Routing the download through this endpoint keeps `connect-src` tight
 * ('self') and removes any dependency on the CDN's CORS headers.
 *
 * Guard rails: only `https://images.unsplash.com/…` is fetched (no SSRF to
 * arbitrary hosts), redirects are refused, only `image/*` is returned, and
 * the body is capped.
 */

const ALLOWED_HOSTS = new Set(['images.unsplash.com']);
const MAX_BYTES = 12 * 1024 * 1024;
const TIMEOUT_MS = 15_000;

export const GET: RequestHandler = async ({ url, fetch }) => {
	const raw = url.searchParams.get('url');
	if (!raw) throw error(400, 'Missing url');

	let target: URL;
	try {
		target = new URL(raw);
	} catch {
		throw error(400, 'Invalid url');
	}
	if (target.protocol !== 'https:' || !ALLOWED_HOSTS.has(target.hostname)) {
		throw error(400, 'Unsupported image host');
	}

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
	let upstream: Response;
	try {
		upstream = await fetch(target.toString(), { redirect: 'error', signal: controller.signal });
	} catch {
		throw error(502, 'Could not download the image');
	} finally {
		clearTimeout(timer);
	}

	if (!upstream.ok) throw error(502, 'Could not download the image');

	const contentType = upstream.headers.get('content-type') ?? '';
	if (!contentType.startsWith('image/')) throw error(502, 'The file is not an image');

	const declared = Number(upstream.headers.get('content-length') ?? '0');
	if (declared > MAX_BYTES) throw error(413, 'Image is too large');

	const body = await upstream.arrayBuffer();
	if (body.byteLength > MAX_BYTES) throw error(413, 'Image is too large');

	return new Response(body, {
		headers: {
			'content-type': contentType,
			'cache-control': 'public, max-age=86400, immutable',
			'x-content-type-options': 'nosniff'
		}
	});
};
