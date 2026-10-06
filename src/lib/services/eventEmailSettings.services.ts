/**
 * Automated event emails — the messages Rondwell sends on the organizer's
 * behalf without them pressing a button.
 *
 * Distinct from `event.services.ts`'s blast helpers, which are one-off
 * messages an organizer composes and sends. These are configured once and then
 * fire from a scheduler: countdown reminders before the event, a thank-you
 * after it, and a feedback request at a chosen time.
 */
import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';

const EVENT_URL = import.meta.env.VITE_EVENT_API_URL;

export type ReminderKey = 'D7' | 'D3' | 'D1' | 'H12' | 'H1';

export interface ReminderSlot {
	key: ReminderKey;
	offsetMinutes: number;
	enabled: boolean;
	customMessage?: string;
	/** Non-null once this reminder has gone out — it can no longer be changed. */
	sentAt?: string | null;
	recipientCount?: number;
}

export interface ReminderCatalogEntry {
	key: ReminderKey;
	label: string;
	offsetMinutes: number;
	defaultEnabled: boolean;
}

export interface EventEmailSettings {
	_id: string;
	eventId: string;
	organizerId: string;
	remindersEnabled: boolean;
	reminders: ReminderSlot[];
	thankYou: {
		enabled: boolean;
		customMessage?: string;
		sentAt?: string | null;
		recipientCount?: number;
	};
	feedback: {
		enabled: boolean;
		scheduledAt?: string | null;
		subject: string;
		customMessage?: string;
		question?: string;
		sentAt?: string | null;
		recipientCount?: number;
	};
}

export interface FeedbackSummary {
	total: number;
	averageRating: number | null;
	/** Count per rating, index 0 = 1 star. */
	distribution: number[];
	withComments: number;
}

export interface FeedbackResponse {
	_id: string;
	attendeeEmail: string;
	attendeeName?: string;
	rating: number;
	comment?: string;
	submittedAt: string;
}

export interface EmailSettingsPayload {
	remindersEnabled?: boolean;
	reminders?: Array<{ key: string; enabled?: boolean; customMessage?: string | null }>;
	thankYou?: { enabled?: boolean; customMessage?: string | null };
	feedback?: {
		enabled?: boolean;
		scheduledAt?: string | null;
		subject?: string;
		customMessage?: string | null;
		question?: string | null;
	};
}

/**
 * The five faces, worst to best. Kept here rather than in each component so
 * the composer preview, the email and the response page cannot drift apart.
 */
export const FEEDBACK_RATINGS: Array<{ value: number; emoji: string; label: string }> = [
	{ value: 1, emoji: '😠', label: 'Poor' },
	{ value: 2, emoji: '😔', label: 'Not great' },
	{ value: 3, emoji: '😐', label: 'Okay' },
	{ value: 4, emoji: '😊', label: 'Good' },
	{ value: 5, emoji: '🤩', label: 'Loved it' }
];

/**
 * Where the post-event thank-you stands, computed server-side from the event's
 * end time and the send stamp. `MISSED` means the automatic window closed
 * without a send; `canSendNow` says the organizer may still send it by hand.
 */
export type ThankYouState = 'SCHEDULED' | 'DUE' | 'SENT' | 'MISSED' | 'OFF' | 'UNAVAILABLE';

export interface ThankYouStatus {
	state: ThankYouState;
	scheduledFor: string | null;
	autoWindowClosesAt: string | null;
	manualWindowClosesAt: string | null;
	eventEndsAt: string | null;
	canSendNow: boolean;
}

export async function getEventEmailSettings(eventId: string): Promise<{
	settings: EventEmailSettings;
	reminderCatalog: ReminderCatalogEntry[];
	feedbackSummary: FeedbackSummary;
	thankYouStatus?: ThankYouStatus;
}> {
	const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/email-settings`);
	if (!res.ok) await throwApiError(res, 'Failed to load email settings');
	return res.json();
}

export async function updateEventEmailSettings(
	eventId: string,
	payload: EmailSettingsPayload
): Promise<EventEmailSettings> {
	const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/email-settings`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) await throwApiError(res, 'Failed to update email settings');
	const data = await res.json();
	return data.settings;
}

/**
 * Send the post-event thank-you right now — the recovery path when the
 * automatic send was missed, or simply sooner than the scheduled time. The
 * optional note is saved as part of the same request.
 */
export async function sendThankYouNow(
	eventId: string,
	customMessage?: string | null
): Promise<{
	message: string;
	queued: number;
	recipients: number;
	settings: EventEmailSettings;
	thankYouStatus: ThankYouStatus;
}> {
	const res = await authFetch(
		`${EVENT_URL}/api/v1/events/${eventId}/email-settings/thank-you/send`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(customMessage === undefined ? {} : { customMessage })
		}
	);
	if (!res.ok) await throwApiError(res, 'Failed to send the thank-you email');
	return res.json();
}

export async function getFeedbackResponses(
	eventId: string,
	params: { page?: number; limit?: number } = {}
): Promise<{
	responses: FeedbackResponse[];
	total: number;
	page: number;
	totalPages: number;
	summary: FeedbackSummary;
}> {
	const query = new URLSearchParams(
		Object.entries(params)
			.filter(([, v]) => v !== undefined)
			.map(([k, v]) => [k, String(v)])
	).toString();
	const res = await authFetch(
		`${EVENT_URL}/api/v1/events/${eventId}/email-settings/feedback/responses?${query}`
	);
	if (!res.ok) await throwApiError(res, 'Failed to load feedback');
	return res.json();
}

// ── Public, token-authenticated (the emailed link) ───────────────────────

export interface FeedbackLinkContext {
	eventId: string;
	eventName: string;
	eventImageUrl?: string;
	organizerName?: string;
	question?: string;
	attendeeEmail: string;
	attendeeName?: string;
	existing?: { rating: number; comment?: string };
}

/**
 * These two use plain `fetch`, not `authFetch`: the recipient may have no
 * Rondwell account at all. The signed token in the URL is the credential.
 */
export async function resolveFeedbackLink(token: string): Promise<FeedbackLinkContext> {
	const res = await fetch(`${EVENT_URL}/api/v1/events/feedback/${encodeURIComponent(token)}`);
	if (!res.ok) await throwApiError(res, 'That feedback link is not valid');
	return res.json();
}

export async function submitFeedback(
	token: string,
	payload: { rating: number; comment?: string }
): Promise<void> {
	const res = await fetch(`${EVENT_URL}/api/v1/events/feedback/${encodeURIComponent(token)}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) await throwApiError(res, 'Could not record your feedback');
}
