/**
 * Last-resort metadata.
 *
 * Previously, any failure in a server load returned `seo: null` and the page
 * rendered with no Open Graph tags whatsoever. That is the worst possible
 * outcome for a share link: WhatsApp caches the empty result for days, so a
 * single slow API response could kill a link's preview long after the API
 * recovered — the other half of why previews came and went.
 *
 * A generic card is strictly better than no card, so loaders now degrade to
 * this instead of to nothing. It carries the site's default artwork and a
 * correct canonical URL, and is marked so callers can tell it apart from a
 * fully-resolved entity.
 */

import { OG_IMAGE, SITE } from './config';
import type { SeoMeta } from './types';
import { canonical, ogImageUrl } from './utils';

export function fallbackSeo(
	path: string,
	overrides: Partial<SeoMeta> = {}
): SeoMeta & { degraded: true } {
	return {
		title: SITE.name,
		description: `Discover and share events, vendors, speakers and exhibitors on ${SITE.name}.`,
		image: ogImageUrl(SITE.defaultImage),
		imageType: OG_IMAGE.mime,
		url: canonical(path),
		ogType: 'website',
		imageAlt: SITE.name,
		...overrides,
		degraded: true
	};
}
