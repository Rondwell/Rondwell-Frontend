export { SITE, OG_IMAGE } from './config';
export type { SeoMeta } from './types';
export {
	stripHtml,
	truncate,
	resolveOgImage,
	ogImageUrl,
	ogImageType,
	buildDescription,
	canonical
} from './utils';
export { fallbackSeo } from './fallback';
export { fetchSeoJson, SEO_FETCH_TIMEOUT_MS } from './fetch';
export {
	buildEventSeo,
	buildCollectionSeo,
	buildVendorSeo,
	buildSpeakerSeo,
	buildExhibitorSeo,
	buildProductSeo,
	buildPortfolioSeo,
	buildBoothSeo,
	// Celebration layer — WhatsApp-first share surfaces.
	buildWishlistSeo,
	buildGiftLinkSeo
} from './builders';
