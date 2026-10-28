/**
 * Conferencing-platform recognition and branding, client side.
 *
 * ── Why a second copy exists ─────────────────────────────────────────────
 *
 * The canonical implementation is `shared/libs/meetingPlatform.ts` in the
 * backend, and it stays canonical: it runs on every write, so the stored
 * `platformKey` is always its answer. This module exists because the frontend
 * is a separate deployment that cannot import from the backend repo, and
 * because it needs two things the backend does not have — brand colours and
 * icons.
 *
 * Detection here is a **fallback**, used only for events created before
 * `platformKey` was stored. When the API returns a `platformKey`, trust it;
 * `resolvePlatform` below does exactly that.
 *
 * ── What this replaces ───────────────────────────────────────────────────
 *
 * `create-event/+page.svelte` decided the platform with:
 *
 *     location.includes('zoom.us') ? 'Zoom'
 *       : location.includes('meet.google.com') ? 'Google Meet' : 'Other'
 *
 * which matched on the raw string (so `evil.com/?x=zoom.us` was "Zoom") and
 * knew nothing of Teams.
 */

export type MeetingPlatform = 'GOOGLE_MEET' | 'ZOOM' | 'MS_TEAMS' | 'WEBEX' | 'OTHER';

export interface PlatformBrand {
	key: MeetingPlatform;
	label: string;
	/** Iconify id, matching the `@iconify/svelte` usage elsewhere in the app. */
	icon: string;
	/**
	 * The vendor's own brand colour, used only for the small platform glyph.
	 *
	 * Deliberately NOT used for the Join button: that takes the organizer's
	 * theme `button` colour like every other primary action on the page, so a
	 * Zoom event does not suddenly sprout a blue CTA in the middle of a
	 * carefully themed page. Vendor colour appears at glyph scale only, which
	 * is enough to be recognisable without hijacking the palette.
	 */
	brandColor: string;
	/** Wording for the primary action. */
	joinLabel: string;
}

export const PLATFORM_BRANDS: Record<MeetingPlatform, PlatformBrand> = {
	GOOGLE_MEET: {
		key: 'GOOGLE_MEET',
		label: 'Google Meet',
		icon: 'logos:google-meet',
		brandColor: '#00897B',
		joinLabel: 'Join on Google Meet'
	},
	ZOOM: {
		key: 'ZOOM',
		label: 'Zoom',
		icon: 'logos:zoom-icon',
		brandColor: '#2D8CFF',
		joinLabel: 'Join on Zoom'
	},
	MS_TEAMS: {
		key: 'MS_TEAMS',
		label: 'Microsoft Teams',
		icon: 'logos:microsoft-teams',
		brandColor: '#5059C9',
		joinLabel: 'Join on Teams'
	},
	WEBEX: {
		key: 'WEBEX',
		label: 'Webex',
		icon: 'logos:webex',
		brandColor: '#00BCEB',
		joinLabel: 'Join on Webex'
	},
	OTHER: {
		key: 'OTHER',
		label: 'Online',
		icon: 'mdi:video-outline',
		brandColor: '#6E6F7A',
		joinLabel: 'Join the event'
	}
};

/** `true` when `host` is `domain` or a subdomain of it. */
function hostMatches(host: string, domain: string): boolean {
	return host === domain || host.endsWith(`.${domain}`);
}

const MATCHERS: Array<{ platform: MeetingPlatform; domains: string[] }> = [
	{ platform: 'GOOGLE_MEET', domains: ['meet.google.com'] },
	{ platform: 'ZOOM', domains: ['zoom.us', 'zoomgov.com', 'zoom.com'] },
	{ platform: 'MS_TEAMS', domains: ['teams.microsoft.com', 'teams.live.com'] },
	{ platform: 'WEBEX', domains: ['webex.com', 'webex.com.cn'] }
];

export interface DetectedMeeting {
	platform: MeetingPlatform;
	label: string;
	joinUrl: string;
	meetingId?: string;
}

/**
 * Recognise a meeting URL.
 *
 * Returns `null` for anything that is not usable http(s) — including a
 * `javascript:` payload, which must never reach an `href`. Matching is on the
 * parsed hostname, never on the raw string.
 */
export function detectMeetingPlatform(raw: string | null | undefined): DetectedMeeting | null {
	if (!raw || typeof raw !== 'string') return null;
	const trimmed = raw.trim();
	if (!trimmed) return null;

	let url: URL;
	try {
		url = new URL(trimmed);
	} catch {
		// Organizers paste `meet.google.com/abc-defg-hij` without a scheme
		// constantly. Retry with https, but only when there is no scheme at all,
		// so a hostile one is never rescued into something clickable.
		if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null;
		try {
			url = new URL(`https://${trimmed}`);
		} catch {
			return null;
		}
	}

	if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
	if (!url.hostname) return null;

	const host = url.hostname.toLowerCase();
	const matched = MATCHERS.find((m) => m.domains.some((d) => hostMatches(host, d)));
	const platform: MeetingPlatform = matched?.platform ?? 'OTHER';

	const out: DetectedMeeting = {
		platform,
		label: PLATFORM_BRANDS[platform].label,
		joinUrl: url.toString()
	};

	const id = extractMeetingId(platform, url);
	if (id) out.meetingId = id;
	return out;
}

function extractMeetingId(platform: MeetingPlatform, url: URL): string | undefined {
	const path = url.pathname;
	if (platform === 'GOOGLE_MEET') {
		return path.match(/^\/([a-z]{3,4}-[a-z]{3,4}-[a-z]{3,4})/i)?.[1];
	}
	if (platform === 'ZOOM') {
		return path.match(/^\/(?:j|w|s)\/(\d+)/)?.[1] ?? path.match(/^\/my\/([^/]+)/)?.[1];
	}
	if (platform === 'WEBEX') {
		return path.match(/^\/meet\/([^/]+)/)?.[1];
	}
	return undefined;
}

/**
 * The brand for a virtual block, preferring the server's stored `platformKey`
 * and falling back to detecting from the link.
 */
export function resolvePlatform(virtual: {
	platformKey?: string | null;
	platform?: string | null;
	meetingLink?: string | null;
} | null | undefined): PlatformBrand {
	if (!virtual) return PLATFORM_BRANDS.OTHER;

	const key = virtual.platformKey as MeetingPlatform | undefined;
	if (key && PLATFORM_BRANDS[key]) return PLATFORM_BRANDS[key];

	const detected = detectMeetingPlatform(virtual.meetingLink);
	if (detected) return PLATFORM_BRANDS[detected.platform];

	return PLATFORM_BRANDS.OTHER;
}

/**
 * The label to show when the platform is known but the link is withheld.
 *
 * An organizer's own label ("Our Weekly Zoom") wins over the generic one, which
 * is why `platform` is consulted before the brand's own name.
 */
export function platformDisplayName(
	virtual: { platform?: string | null; platformKey?: string | null; meetingLink?: string | null } | null | undefined
): string {
	if (virtual?.platform && virtual.platform !== 'Other' && virtual.platform !== 'OTHER') {
		return virtual.platform;
	}
	return resolvePlatform(virtual).label;
}
