import type { RequestHandler } from './$types';

// Canonical public origins (match the SEO loaders in /e/[slug]).
const SITE = 'https://rondwell.com';
const API = 'https://api.rondwell.com';

interface SitemapEntry {
	slug: string;
	updatedAt?: string;
}

// Public marketing / discovery pages that should always be indexed.
const STATIC_PATHS: Array<{ path: string; changefreq: string; priority: string }> = [
	{ path: '/', changefreq: 'daily', priority: '1.0' },
	{ path: '/discover', changefreq: 'daily', priority: '0.9' }
];

function xmlEscape(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function toLastmod(value?: string): string | null {
	if (!value) return null;
	const d = new Date(value);
	return isNaN(d.getTime()) ? null : d.toISOString();
}

function urlNode(loc: string, lastmod: string | null, changefreq: string, priority: string): string {
	return (
		'  <url>\n' +
		`    <loc>${xmlEscape(loc)}</loc>\n` +
		(lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : '') +
		`    <changefreq>${changefreq}</changefreq>\n` +
		`    <priority>${priority}</priority>\n` +
		'  </url>'
	);
}

export const GET: RequestHandler = async () => {
	let events: SitemapEntry[] = [];
	let collections: SitemapEntry[] = [];

	try {
		const res = await globalThis.fetch(`${API}/api/v1/events/sitemap`);
		if (res.ok) {
			const data = await res.json();
			events = Array.isArray(data.events) ? data.events : [];
			collections = Array.isArray(data.collections) ? data.collections : [];
		}
	} catch {
		// On API failure still return a valid sitemap with the static pages.
	}

	const nodes: string[] = [];

	for (const s of STATIC_PATHS) {
		nodes.push(urlNode(`${SITE}${s.path}`, null, s.changefreq, s.priority));
	}
	for (const e of events) {
		if (!e.slug) continue;
		nodes.push(urlNode(`${SITE}/e/${e.slug}`, toLastmod(e.updatedAt), 'weekly', '0.8'));
	}
	for (const c of collections) {
		if (!c.slug) continue;
		nodes.push(urlNode(`${SITE}/c/${c.slug}`, toLastmod(c.updatedAt), 'weekly', '0.7'));
	}

	const xml =
		'<?xml version="1.0" encoding="UTF-8"?>\n' +
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
		nodes.join('\n') +
		'\n</urlset>';

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			// Cache at the edge/CDN for an hour; browsers revalidate.
			'Cache-Control': 'public, max-age=0, s-maxage=3600'
		}
	});
};
