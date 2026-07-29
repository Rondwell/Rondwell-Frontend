/**
 * Canonical event categories.
 *
 * Events store the emoji-prefixed label the organizer picked (e.g. "🎨 Art").
 * The discover API filters on the plain label ("Art") so URLs stay readable and
 * both emoji variants of the same label collapse onto one filter option.
 *
 * Keep this list in sync with the create-event category picker.
 */

export interface EventCategory {
	/** Filter value + display label, without emoji. */
	label: string;
	emoji: string;
	group: string;
}

export const EVENT_CATEGORY_GROUPS = [
	'Business & Career',
	'Arts & Culture',
	'Music & Nightlife',
	'Sports & Wellness',
	'Learning & Tech',
	'Community & Life'
] as const;

export type EventCategoryGroup = (typeof EVENT_CATEGORY_GROUPS)[number];

export const EVENT_CATEGORIES: EventCategory[] = [
	// Business & Career
	{ label: 'Business', emoji: '💼', group: 'Business & Career' },
	{ label: 'Career', emoji: '📈', group: 'Business & Career' },
	{ label: 'Networking', emoji: '🤝', group: 'Business & Career' },
	{ label: 'Workshop', emoji: '🛠', group: 'Business & Career' },
	{ label: 'Trade Show', emoji: '🛍', group: 'Business & Career' },
	{ label: 'Expo', emoji: '🏟', group: 'Business & Career' },
	{ label: 'Startup', emoji: '🚀', group: 'Business & Career' },
	{ label: 'Speaker', emoji: '📣', group: 'Business & Career' },

	// Arts & Culture
	{ label: 'Art', emoji: '🎨', group: 'Arts & Culture' },
	{ label: 'Culture', emoji: '🎭', group: 'Arts & Culture' },
	{ label: 'Performance', emoji: '🩰', group: 'Arts & Culture' },
	{ label: 'Film', emoji: '🎬', group: 'Arts & Culture' },
	{ label: 'Screening', emoji: '👀', group: 'Arts & Culture' },
	{ label: 'Comedy', emoji: '😂', group: 'Arts & Culture' },

	// Music & Nightlife
	{ label: 'Concert', emoji: '🎵', group: 'Music & Nightlife' },
	{ label: 'DJ', emoji: '🎧', group: 'Music & Nightlife' },
	{ label: 'Festival', emoji: '🎉', group: 'Music & Nightlife' },
	{ label: 'Party', emoji: '🎊', group: 'Music & Nightlife' },

	// Sports & Wellness
	{ label: 'Sports', emoji: '🏅', group: 'Sports & Wellness' },
	{ label: 'Fitness', emoji: '🏋️', group: 'Sports & Wellness' },
	{ label: 'Race', emoji: '🏃', group: 'Sports & Wellness' },
	{ label: 'Retreat', emoji: '🧘', group: 'Sports & Wellness' },
	{ label: 'Wellness', emoji: '🌿', group: 'Sports & Wellness' },
	{ label: 'Health', emoji: '❤️', group: 'Sports & Wellness' },

	// Learning & Tech
	{ label: 'Education', emoji: '🎓', group: 'Learning & Tech' },
	{ label: 'Science', emoji: '🔬', group: 'Learning & Tech' },
	{ label: 'Technology', emoji: '💡', group: 'Learning & Tech' },
	{ label: 'Gaming', emoji: '🎮', group: 'Learning & Tech' },

	// Community & Life
	{ label: 'Community', emoji: '🤝', group: 'Community & Life' },
	{ label: 'Charity', emoji: '🎗', group: 'Community & Life' },
	{ label: 'Family', emoji: '👨‍👩‍👧‍👦', group: 'Community & Life' },
	{ label: 'Kids', emoji: '🧒', group: 'Community & Life' },
	{ label: 'Religion', emoji: '🛐', group: 'Community & Life' },
	{ label: 'Travel', emoji: '🧳', group: 'Community & Life' }
];

const BY_LABEL = new Map(EVENT_CATEGORIES.map((c) => [c.label.toLowerCase(), c]));

/** "🎨 Art" → "Art". Also trims stray whitespace and zero-width joiners. */
export function stripCategoryEmoji(raw: string): string {
	if (!raw) return '';
	return raw
		.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}]/gu, '')
		.trim();
}

export function findCategory(label: string): EventCategory | undefined {
	return BY_LABEL.get(stripCategoryEmoji(label).toLowerCase());
}

/** Emoji for a label, falling back to a neutral marker for unknown values. */
export function categoryEmoji(label: string): string {
	return findCategory(label)?.emoji ?? '🏷️';
}

export const EVENT_TYPE_OPTIONS = [
	{ value: 'PHYSICAL', label: 'In person', icon: 'mdi:map-marker-outline', hint: 'Venue-based events' },
	{ value: 'VIRTUAL', label: 'Virtual', icon: 'mdi:video-outline', hint: 'Join from anywhere' },
	{ value: 'HYBRID', label: 'Hybrid', icon: 'mdi:television-play', hint: 'On-site and online' }
] as const;

export type EventTypeValue = (typeof EVENT_TYPE_OPTIONS)[number]['value'];
