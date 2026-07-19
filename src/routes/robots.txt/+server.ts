import type { RequestHandler } from './$types';

const SITE = 'https://rondwell.com';

// Keep crawl budget on public content; block private/dashboard + auth areas.
const body = `User-agent: *
Allow: /
Disallow: /create-event
Disallow: /subscription
Disallow: /onboarding

Sitemap: ${SITE}/sitemap.xml
`;

export const GET: RequestHandler = async () => {
	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=0, s-maxage=86400'
		}
	});
};
