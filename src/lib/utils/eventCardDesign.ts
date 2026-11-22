import { stripCategoryEmoji } from '$lib/constants/eventCategories';
import {
	findTheme,
	resolveTheme,
	type Color
} from '$lib/utils/colors';
import {
	resolveThemeFont,
	type ThemeFont
} from '$lib/utils/themeFonts';

export type ImageCardArchetype =
	| 'full-bleed'
	| 'spotlight-cutout'
	| 'arch-frame'
	| 'editorial-split';

export type ProceduralCardArchetype =
	| 'lattice'
	| 'tech-grid'
	| 'vinyl'
	| 'solar-dial';

export type EventCardArchetype = ImageCardArchetype | ProceduralCardArchetype;

export interface SmartTitleParts {
	full: string;
	display: string;
	line1: string;
	line2?: string;
	subtitle?: string;
	sizeTier: 'hero' | 'balanced' | 'compact';
	wasShortened: boolean;
}

export interface SmartLocationResult {
	short: string;
	full: string;
	isVirtual: boolean;
	isHybrid: boolean;
}

export interface EventStubDates {
	month: string;
	day: string;
	weekday: string;
	timeShort: string;
	fullDate: string;
	compactLabel: string;
}

export interface EventCardDesign {
	archetype: EventCardArchetype;
	hasImage: boolean;
	imageUrl: string | null;
	palette: Color;
	font: ThemeFont;
	isDarkSurface: boolean;
	surfaceBg: string;
	stubBg: string;
	inkPrimary: string;
	inkMuted: string;
	accentColor: string;
	accentText: string;
	borderColor: string;
	pillBg: string;
	pillText: string;
	qrFg: string;
	qrBg: string;
	codeLabel: string;
	categoryLabel: string;
	priceBadge: string;
}

const IMAGE_ARCHETYPES: ImageCardArchetype[] = [
	'full-bleed',
	'spotlight-cutout',
	'arch-frame',
	'editorial-split'
];

const PROCEDURAL_ARCHETYPES: ProceduralCardArchetype[] = [
	'lattice',
	'tech-grid',
	'vinyl',
	'solar-dial'
];

const PLACEHOLDER_IMAGE_PATTERNS = [
	'rondwell-attendee.png',
	'events.png',
	'placeholder',
	'default-event',
	'default-cover'
];

const LOCATION_NOISE_WORDS = new Set([
	'street',
	'st',
	'st.',
	'road',
	'rd',
	'rd.',
	'avenue',
	'ave',
	'ave.',
	'boulevard',
	'blvd',
	'drive',
	'dr',
	'lane',
	'ln',
	'way',
	'close',
	'crescent',
	'plot',
	'no',
	'no.',
	'suite',
	'floor',
	'building',
	'bldg',
	'phase',
	'block',
	'unit',
	'near',
	'opposite',
	'beside',
	'off',
	'along',
	'the',
	'and',
	'of',
	'in',
	'at'
]);

const COUNTRY_ABBREVIATIONS: Record<string, string> = {
	nigeria: 'NG',
	'united states': 'US',
	'united states of america': 'US',
	usa: 'US',
	'united kingdom': 'UK',
	uk: 'UK',
	england: 'UK',
	canada: 'CA',
	germany: 'DE',
	france: 'FR',
	ghana: 'GH',
	kenya: 'KE',
	'south africa': 'ZA',
	australia: 'AU',
	india: 'IN',
	netherlands: 'NL',
	singapore: 'SG',
	'united arab emirates': 'UAE',
	uae: 'UAE',
	japan: 'JP',
	brazil: 'BR'
};

export function hashEventSeed(seed: string): number {
	let h = 2166136261;
	for (let i = 0; i < seed.length; i++) {
		h ^= seed.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

/**
 * Determines whether the event has an authentic custom cover/display image
 * rather than a missing URL or generic platform placeholder asset.
 */
export function hasCustomEventImage(url?: string | null): boolean {
	if (!url || typeof url !== 'string') return false;
	const trimmed = url.trim();
	if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
	const lower = trimmed.toLowerCase();
	return !PLACEHOLDER_IMAGE_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function pickEventImageUrl(event: any): string | null {
	const candidates = [
		event?.displayPictureUrl,
		event?.coverPictureUrl,
		event?.image,
		event?.bannerUrl,
		event?.flyerUrl
	];
	for (const candidate of candidates) {
		if (hasCustomEventImage(candidate)) {
			return String(candidate).trim();
		}
	}
	return null;
}

/**
 * Formats an event title cleanly so long organizer headlines fit beautifully
 * inside compact cards without awkward wrapping or jagged CSS ellipses.
 */
export function formatSmartTitle(rawTitle?: string | null): SmartTitleParts {
	const cleaned = String(rawTitle || 'Untitled Event').replace(/\s+/g, ' ').trim();
	if (!cleaned) {
		return {
			full: 'Untitled Event',
			display: 'Untitled Event',
			line1: 'Untitled',
			line2: 'Event',
			sizeTier: 'hero',
			wasShortened: false
		};
	}

	// Short titles render intact in hero editorial scale
	if (cleaned.length <= 20) {
		const words = cleaned.split(' ');
		if (words.length >= 2) {
			const mid = Math.ceil(words.length / 2);
			return {
				full: cleaned,
				display: cleaned,
				line1: words.slice(0, mid).join(' '),
				line2: words.slice(mid).join(' '),
				sizeTier: 'hero',
				wasShortened: false
			};
		}
		return {
			full: cleaned,
			display: cleaned,
			line1: cleaned,
			sizeTier: 'hero',
			wasShortened: false
		};
	}

	// Medium titles stay intact at balanced scale
	if (cleaned.length <= 36) {
		const words = cleaned.split(' ');
		const splitIdx = findBalancedWordSplit(words);
		return {
			full: cleaned,
			display: cleaned,
			line1: words.slice(0, splitIdx).join(' '),
			line2: words.slice(splitIdx).join(' ') || undefined,
			sizeTier: 'balanced',
			wasShortened: false
		};
	}

	// Long titles: try natural clause separators first (e.g. "Headline: Subtitle")
	const separatorMatch = cleaned.match(/^(.{8,34}?)\s*(?::|—|–|\||•|\s-\s)\s*(.+)$/);
	if (separatorMatch) {
		const primary = separatorMatch[1].trim();
		const subtitle = separatorMatch[2].trim();
		const words = primary.split(' ');
		const splitIdx = words.length > 1 ? findBalancedWordSplit(words) : 1;
		return {
			full: cleaned,
			display: primary,
			line1: words.slice(0, splitIdx).join(' '),
			line2: words.length > 1 ? words.slice(splitIdx).join(' ') : undefined,
			subtitle: subtitle.length <= 42 ? subtitle : undefined,
			sizeTier: primary.length <= 22 ? 'hero' : 'balanced',
			wasShortened: true
		};
	}

	// Otherwise select a natural whole-word prefix up to ~32 chars
	const words = cleaned.split(' ');
	const chosen: string[] = [];
	let accLen = 0;
	for (const word of words) {
		const nextLen = accLen + (chosen.length > 0 ? 1 : 0) + word.length;
		if (nextLen > 32 && chosen.length >= 2) break;
		if (chosen.length >= 5) break;
		chosen.push(word);
		accLen = nextLen;
	}
	// Avoid ending cleanly on a dangling preposition/conjunction
	const dangling = new Set(['&', 'and', 'for', 'the', 'of', 'in', 'to', 'with', 'at', 'by', 'on']);
	while (chosen.length > 2 && dangling.has(chosen[chosen.length - 1].toLowerCase())) {
		chosen.pop();
	}

	const compacted = chosen.join(' ').replace(/[,:;—–-]+$/, '');
	const splitIdx = chosen.length > 1 ? findBalancedWordSplit(chosen) : 1;

	return {
		full: cleaned,
		display: compacted,
		line1: chosen.slice(0, splitIdx).join(' '),
		line2: chosen.length > 1 ? chosen.slice(splitIdx).join(' ') : undefined,
		sizeTier: 'compact',
		wasShortened: compacted.length < cleaned.length
	};
}

function findBalancedWordSplit(words: string[]): number {
	if (words.length <= 1) return 1;
	const full = words.join(' ');
	let bestIdx = 1;
	let bestDiff = Infinity;
	for (let i = 1; i < words.length; i++) {
		const left = words.slice(0, i).join(' ').length;
		const right = full.length - left - 1;
		const diff = Math.abs(left - right);
		if (diff < bestDiff) {
			bestDiff = diff;
			bestIdx = i;
		}
	}
	return bestIdx;
}

/**
 * Extracts a crisp 1–2 word destination (or concise City, CC) so event cards stay
 * scannable even when the organizer saved a 12-word full street address.
 */
export function formatSmartLocation(event: any): SmartLocationResult {
	const rawType = String(event?.eventType || '').toUpperCase();
	const details = event?.locationDetails || {};
	const phys = details?.physical || {};
	const virt = details?.virtual || {};

	const cityRaw = cleanLocationToken(details?.city || phys?.city);
	const venueRaw = cleanLocationToken(details?.venueName || phys?.venueName);
	const stateRaw = cleanLocationToken(details?.state || phys?.state);
	const countryRaw = cleanLocationToken(details?.country || phys?.country);
	const physicalRaw = cleanLocationToken(
		details?.physicalAddress ||
			details?.formattedAddress ||
			details?.address ||
			phys?.resolvedAddress ||
			phys?.address
	);
	const virtualPlatform = cleanLocationToken(virt?.platform);
	const legacyLocation = cleanLocationToken(
		typeof event?.location === 'string' ? event.location : ''
	);

	const fullParts = [venueRaw, physicalRaw, cityRaw, stateRaw, countryRaw].filter(Boolean);
	const full =
		legacyLocation ||
		Array.from(new Set(fullParts)).join(', ') ||
		(rawType === 'VIRTUAL' ? virtualPlatform || 'Virtual Event' : 'Location TBA');

	const isVirtual =
		rawType === 'VIRTUAL' ||
		/\b(virtual|online|zoom|google meet|youtube live|livestream|remote)\b/i.test(full);
	const isHybrid = rawType === 'HYBRID';

	if (isVirtual && !cityRaw && !venueRaw) {
		return {
			short: virtualPlatform ? firstMeaningfulWords(virtualPlatform, 2) : 'Online Live',
			full,
			isVirtual: true,
			isHybrid: false
		};
	}

	if (isHybrid) {
		const cityWord = firstMeaningfulWords(cityRaw || venueRaw || legacyLocation, 1);
		return {
			short: cityWord ? `${cityWord} · Live` : 'Hybrid Live',
			full,
			isVirtual: false,
			isHybrid: true
		};
	}

	// Best case: structured city (+ short country or single-word city)
	if (cityRaw) {
		const cityWords = cityRaw.split(/\s+/).filter(Boolean);
		if (cityWords.length >= 2) {
			return {
				short: cityWords.slice(0, 2).join(' '),
				full,
				isVirtual: false,
				isHybrid: false
			};
		}
		const countryCode = countryRaw
			? COUNTRY_ABBREVIATIONS[countryRaw.toLowerCase()] || ''
			: '';
		if (countryCode) {
			return {
				short: `${cityWords[0]}, ${countryCode}`,
				full,
				isVirtual: false,
				isHybrid: false
			};
		}
		if (stateRaw && stateRaw.toLowerCase() !== cityRaw.toLowerCase() && stateRaw.length <= 4) {
			return {
				short: `${cityWords[0]}, ${stateRaw}`,
				full,
				isVirtual: false,
				isHybrid: false
			};
		}
		return { short: cityWords[0], full, isVirtual: false, isHybrid: false };
	}

	if (venueRaw) {
		return {
			short: firstMeaningfulWords(venueRaw, 2) || 'Venue TBA',
			full,
			isVirtual: false,
			isHybrid: false
		};
	}

	if (physicalRaw || legacyLocation) {
		const source = physicalRaw || legacyLocation;
		const segments = source
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);

		// Prefer the city-like segment (often second from end before country/postal code)
		if (segments.length >= 2) {
			const last = segments[segments.length - 1];
			const lastIsCountryOrZip =
				Boolean(COUNTRY_ABBREVIATIONS[last.toLowerCase()]) || /\d{4,}/.test(last);
			const candidate = lastIsCountryOrZip ? segments[segments.length - 2] : last;
			const cleanedCandidate = firstMeaningfulWords(
				candidate.replace(/\b\d{4,}\b/g, '').trim(),
				2
			);
			if (cleanedCandidate) {
				const countryCode = COUNTRY_ABBREVIATIONS[last.toLowerCase()] || '';
				if (countryCode && cleanedCandidate.split(/\s+/).length === 1) {
					return {
						short: `${cleanedCandidate}, ${countryCode}`,
						full,
						isVirtual: false,
						isHybrid: false
					};
				}
				return { short: cleanedCandidate, full, isVirtual: false, isHybrid: false };
			}
		}

		const fallback = firstMeaningfulWords(source, 2);
		if (fallback) {
			return { short: fallback, full, isVirtual: false, isHybrid: false };
		}
	}

	return {
		short: isVirtual ? 'Online Live' : 'Location TBA',
		full,
		isVirtual,
		isHybrid
	};
}

function cleanLocationToken(value: unknown): string {
	if (typeof value !== 'string') return '';
	const t = value.replace(/\s+/g, ' ').trim();
	if (!t || /^tba$/i.test(t) || /^location tba$/i.test(t) || /^undefined$/i.test(t)) return '';
	return t;
}

function firstMeaningfulWords(text: string, maxWords: number): string {
	const tokens = text
		.replace(/[#@()]/g, ' ')
		.split(/[\s,;/]+/)
		.map((t) => t.trim())
		.filter((t) => {
			if (!t) return false;
			if (/^\d+[a-zA-Z]?$/.test(t)) return false;
			return !LOCATION_NOISE_WORDS.has(t.toLowerCase());
		});

	if (tokens.length === 0) {
		const rawTokens = text.split(/\s+/).filter(Boolean);
		return rawTokens.slice(0, maxWords).join(' ');
	}
	return tokens.slice(0, maxWords).join(' ');
}

/**
 * Safely parses event dates & times into stub-friendly parts without ever showing "Invalid Date".
 */
export function formatEventStubDates(
	startRaw?: string | null,
	endRaw?: string | null,
	legacyDate?: string | null,
	legacyTime?: string | null
): EventStubDates {
	const raw = startRaw || legacyDate || '';
	const parsed = raw ? new Date(raw) : null;
	const hasValidIso = parsed && !Number.isNaN(parsed.getTime()) && /\d{4}-\d{2}-\d{2}|T/.test(String(raw));

	if (hasValidIso && parsed) {
		const month = parsed.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
		const day = String(parsed.getDate()).padStart(2, '0');
		const weekday = parsed.toLocaleDateString('en-US', { weekday: 'short' });
		const timeFromStart = parsed.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
		const timeShort = legacyTime || timeFromStart;
		return {
			month,
			day,
			weekday,
			timeShort,
			fullDate: `${weekday}, ${month} ${day}`,
			compactLabel: `${month} ${day} · ${timeShort}`
		};
	}

	// Fallback if `legacyDate` is already formatted like "Fri, May 21"
	const legacy = String(legacyDate || startRaw || '').trim();
	const monthMatch = legacy.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b/i);
	const dayMatch = legacy.match(/\b(\d{1,2})\b/);
	const month = monthMatch ? monthMatch[1].slice(0, 3).toUpperCase() : 'UPCOMING';
	const day = dayMatch ? dayMatch[1].padStart(2, '0') : 'LIVE';
	const weekdayMatch = legacy.match(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/i);
	const weekday = weekdayMatch ? weekdayMatch[1] : 'Event';
	const timeShort = String(legacyTime || '').trim() || (endRaw ? 'All Day' : 'Doors Open');

	return {
		month,
		day,
		weekday,
		timeShort,
		fullDate: legacy || 'Date TBA',
		compactLabel: legacy ? `${legacy}${legacyTime ? ` · ${legacyTime}` : ''}` : 'Date TBA'
	};
}

/**
 * Picks an image-driven or procedural visual archetype using category/title
 * affinity + deterministic hash so every event card looks bespoke.
 */
export function resolveEventCardArchetype(event: any, hasImage: boolean): EventCardArchetype {
	const text = [
		event?.category,
		...(Array.isArray(event?.tags) ? event.tags : []),
		event?.title,
		event?.eventType
	]
		.filter(Boolean)
		.join(' ')
		.toLowerCase();

	const seed = String(event?._id || event?.id || event?.slug || event?.customLinkSlug || event?.title || 'rondwell');
	const h = hashEventSeed(seed);

	if (hasImage) {
		if (/\b(concert|music|dj|festival|afrobeat|rave|party|night|club|vinyl|tour)\b/.test(text)) {
			return h % 4 === 0 ? 'editorial-split' : 'full-bleed';
		}
		if (/\b(talk|summit|podcast|keynote|mic|fireside|workshop|meetup|panel|creator)\b/.test(text)) {
			return h % 4 === 0 ? 'editorial-split' : 'spotlight-cutout';
		}
		if (/\b(wedding|gala|fashion|art|gallery|exhibition|ceramic|atelier|brunch|runway|wellness)\b/.test(text)) {
			return h % 4 === 0 ? 'full-bleed' : 'arch-frame';
		}
		if (/\b(tech|ai|startup|motorsport|racing|hack|dev|summit|conference|supper|culinary|food)\b/.test(text)) {
			return h % 4 === 0 ? 'spotlight-cutout' : 'editorial-split';
		}
		return IMAGE_ARCHETYPES[h % IMAGE_ARCHETYPES.length];
	}

	if (/\b(concert|music|dj|festival|afrobeat|party|night|audio|sound)\b/.test(text)) {
		return h % 4 === 0 ? 'solar-dial' : 'vinyl';
	}
	if (/\b(tech|ai|code|hack|startup|saas|dev|cloud|web3|fintech|virtual)\b/.test(text)) {
		return h % 4 === 0 ? 'vinyl' : 'tech-grid';
	}
	if (/\b(wedding|art|gallery|fashion|gala|design|luxury|culture|community)\b/.test(text)) {
		return h % 4 === 0 ? 'solar-dial' : 'lattice';
	}
	if (/\b(sports|fitness|run|food|outdoor|wellness|summer|festival)\b/.test(text)) {
		return h % 4 === 0 ? 'lattice' : 'solar-dial';
	}
	return PROCEDURAL_ARCHETYPES[h % PROCEDURAL_ARCHETYPES.length];
}

const PROCEDURAL_DEFAULT_THEMES: Record<ProceduralCardArchetype, { bg: string; stub: string; ink: string; muted: string; accent: string; accentText: string }> = {
	lattice: {
		bg: '#F7F2EB',
		stub: '#EFE6DA',
		ink: '#1F1B18',
		muted: '#6E6359',
		accent: '#8B3A2B',
		accentText: '#FFFDFB'
	},
	'tech-grid': {
		bg: '#101426',
		stub: '#171D35',
		ink: '#F8FAFC',
		muted: '#94A3B8',
		accent: '#A855F7',
		accentText: '#FFFFFF'
	},
	vinyl: {
		bg: '#18131E',
		stub: '#221A2C',
		ink: '#FAF5FF',
		muted: '#C4B5FD',
		accent: '#DB3E6C',
		accentText: '#FFFFFF'
	},
	'solar-dial': {
		bg: '#FFF6EB',
		stub: '#FCE8D0',
		ink: '#24170D',
		muted: '#7C5A3E',
		accent: '#E05A2B',
		accentText: '#FFFFFF'
	}
};

/**
 * Resolves the complete visual & typographic styling for any Rondwell event card,
 * blending the organizer's chosen `themeColor` & `themeFont` seamlessly with a dynamic archetype.
 */
export function resolveEventCardDesign(
	event: any,
	options?: {
		themeOverride?: Color | null;
		forceNoImage?: boolean;
	}
): EventCardDesign {
	const rawImageUrl = options?.forceNoImage ? null : pickEventImageUrl(event);
	const hasImage = Boolean(rawImageUrl);
	const archetype = resolveEventCardArchetype(event, hasImage);

	const explicitPalette =
		options?.themeOverride || findTheme(event?.themeColor) || null;
	const fallbackPalette = resolveTheme(event?.themeColor);
	const font = resolveThemeFont(event?.themeFont);

	const palette = explicitPalette || fallbackPalette;
	const hasCustomPalette = Boolean(explicitPalette && explicitPalette.name !== 'Default');
	const isPaletteDark = palette.scheme === 'dark';

	// Resolve surface colors safely with high contrast guarantees
	let isDarkSurface = isPaletteDark || archetype === 'full-bleed';
	let surfaceBg = '#FFFFFF';
	let stubBg = '#F8F7FA';
	let inkPrimary = '#17171B';
	let inkMuted = '#6B6A75';
	let accentColor = palette.button || '#DB3E6C';
	let accentText = palette.buttonText || '#FFFFFF';
	let borderColor = 'rgba(23, 23, 27, 0.09)';

	if (hasCustomPalette) {
		if (isPaletteDark) {
			isDarkSurface = true;
			surfaceBg = '#141418';
			stubBg = '#1C1C22';
			inkPrimary = '#F7F7FA';
			inkMuted = '#A8A8B3';
			borderColor = 'rgba(255, 255, 255, 0.12)';
		} else if (archetype === 'full-bleed') {
			isDarkSurface = true;
			surfaceBg = '#14111B';
			stubBg = '#1D1826';
			inkPrimary = '#FFFFFF';
			inkMuted = 'rgba(255, 255, 255, 0.72)';
			borderColor = 'rgba(255, 255, 255, 0.14)';
		} else {
			isDarkSurface = false;
			surfaceBg = palette.bg || '#FFFFFF';
			stubBg = palette.cover || '#FFFFFF';
			inkPrimary = palette.text || '#17171B';
			inkMuted = palette.lightText || '#6B6A75';
			borderColor = 'rgba(23, 23, 27, 0.09)';
		}
	} else if (!hasImage) {
		const procTheme =
			PROCEDURAL_DEFAULT_THEMES[archetype as ProceduralCardArchetype] ||
			PROCEDURAL_DEFAULT_THEMES.lattice;
		isDarkSurface = archetype === 'tech-grid' || archetype === 'vinyl';
		surfaceBg = procTheme.bg;
		stubBg = procTheme.stub;
		inkPrimary = procTheme.ink;
		inkMuted = procTheme.muted;
		accentColor = procTheme.accent;
		accentText = procTheme.accentText;
		borderColor = isDarkSurface
			? 'rgba(255, 255, 255, 0.12)'
			: 'rgba(23, 23, 27, 0.09)';
	} else {
		// Default palette with cover image
		if (archetype === 'full-bleed') {
			isDarkSurface = true;
			surfaceBg = '#13111C';
			stubBg = '#1B1726';
			inkPrimary = '#FFFFFF';
			inkMuted = 'rgba(255, 255, 255, 0.74)';
			accentColor = '#AB46DD';
			borderColor = 'rgba(255, 255, 255, 0.14)';
		} else if (archetype === 'arch-frame') {
			surfaceBg = '#FCF9F4';
			stubBg = '#F4ECE1';
			inkPrimary = '#1E1A16';
			inkMuted = '#73685C';
			accentColor = '#DB3E6C';
			borderColor = 'rgba(139, 110, 78, 0.18)';
		} else if (archetype === 'spotlight-cutout') {
			surfaceBg = '#FAF8FF';
			stubBg = '#F2EDFB';
			inkPrimary = '#171522';
			inkMuted = '#6A657A';
			accentColor = '#7C3AED';
			borderColor = 'rgba(124, 58, 237, 0.14)';
		} else {
			// editorial-split
			surfaceBg = '#FFFFFF';
			stubBg = '#F6F5F9';
			inkPrimary = '#141418';
			inkMuted = '#676670';
			accentColor = '#E03165';
			borderColor = 'rgba(20, 20, 24, 0.10)';
		}
	}

	const rawCategory = event?.category || event?.tag || (Array.isArray(event?.tags) ? event.tags[0] : '');
	const cleanedCat = stripCategoryEmoji(String(rawCategory || ''));
	const categoryLabel =
		cleanedCat && cleanedCat.length <= 18
			? cleanedCat
			: event?.eventType === 'VIRTUAL'
				? 'Virtual'
				: event?.eventType === 'HYBRID'
					? 'Hybrid'
					: 'Featured';

	const priceRaw = String(event?.price || event?.registrationType || '').trim();
	let priceBadge = 'Free';
	if (/paid|ticket/i.test(priceRaw)) priceBadge = 'Paid';
	else if (/free/i.test(priceRaw)) priceBadge = 'Free';
	else if (/donat/i.test(priceRaw)) priceBadge = 'Donation';
	else if (priceRaw) priceBadge = priceRaw.slice(0, 12);

	const rawSeed = String(event?._id || event?.id || event?.slug || event?.title || 'RW').toUpperCase();
	const shortCode = rawSeed.replace(/[^A-Z0-9]/g, '').slice(-4) || '0042';
	const codeLabel = `RW·${shortCode}`;

	return {
		archetype,
		hasImage,
		imageUrl: rawImageUrl,
		palette,
		font,
		isDarkSurface,
		surfaceBg,
		stubBg,
		inkPrimary,
		inkMuted,
		accentColor,
		accentText,
		borderColor,
		pillBg: isDarkSurface ? 'rgba(255, 255, 255, 0.12)' : 'rgba(20, 20, 24, 0.06)',
		pillText: isDarkSurface ? '#F8FAFC' : inkPrimary,
		qrFg: isDarkSurface ? '#FFFFFF' : '#151519',
		qrBg: isDarkSurface ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
		codeLabel,
		categoryLabel,
		priceBadge
	};
}
