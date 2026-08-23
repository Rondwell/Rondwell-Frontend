/**
 * C-13 — the single source of truth for event visibility.
 *
 * The defect this exists to prevent: `VisibilityModal` held its own options
 * array keyed on a capitalised DISPLAY LABEL ('Public'), assigned that label
 * into the shared `visibility` state, and the create-event payload compared
 * against a lowercase STRING ('public'). The comparison failed, so selecting
 * "Public" produced `visibility: "PRIVATE"` — an event absent from /discover,
 * excluded from collection listings and ineligible to be featured, while the
 * UI pill still read "Public".
 *
 * The rule that prevents the whole class:
 *
 *   **The value that is stored and transported is the WIRE ENUM. Display text
 *   and icons are DERIVED from it. Nothing derives the wire value from display
 *   text.**
 *
 * `EventVisibility` is exactly what the backend accepts — the event service
 * stores `visibility` verbatim — so there is no mapping step left in which the
 * two can disagree.
 */

export type EventVisibility = 'PUBLIC' | 'PRIVATE';

export interface VisibilityOption {
	/** The wire value. This is what gets bound, stored and sent. */
	value: EventVisibility;
	/** Display text. Derived from `value`; never the other way round. */
	label: string;
	icon: string;
	description: string;
}

export const VISIBILITY_OPTIONS: readonly VisibilityOption[] = [
	{
		value: 'PUBLIC',
		label: 'Public',
		icon: 'mdi:web',
		description: 'Shown on your collection and eligible to be featured.'
	},
	{
		value: 'PRIVATE',
		label: 'Private',
		icon: 'mdi:sparkles',
		description: 'Unlisted. Only people with the link can register.'
	}
] as const;

export const DEFAULT_VISIBILITY: EventVisibility = 'PUBLIC';

function optionFor(value: EventVisibility | string | undefined | null): VisibilityOption {
	return VISIBILITY_OPTIONS.find((o) => o.value === value) ?? VISIBILITY_OPTIONS[0];
}

/** Display text for a wire value. */
export function visibilityLabel(value: EventVisibility | string | undefined | null): string {
	return optionFor(value).label;
}

/** Icon for a wire value. */
export function visibilityIcon(value: EventVisibility | string | undefined | null): string {
	return optionFor(value).icon;
}

/**
 * Coerce anything that reaches the client — an API response, a draft restored
 * from storage, an AI prefill — to a valid wire value.
 *
 * Deliberately case-insensitive on INPUT only: legacy drafts may carry
 * 'public'. The OUTPUT is always the canonical enum, so a legacy value is
 * normalised once here rather than being compared loosely at each use site,
 * which is how the original divergence survived.
 */
export function toEventVisibility(value: unknown): EventVisibility {
	return String(value ?? '').toUpperCase() === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';
}
