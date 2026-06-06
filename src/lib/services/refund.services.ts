/**
 * FE-P2-01 (P2-01 / FA-7.1 / NEW-5.1) — Refund pipeline.
 *
 * Wraps the payment-service refund routes:
 *   - POST /api/v1/payment/refunds/ticket/:ticketPaymentId   (organizer / super-admin)
 *   - POST /api/v1/payment/refunds/admin/:transactionId       (super-admin only)
 *   - GET  /api/v1/payment/refunds?eventId=...                (organizer view)
 *   - GET  /api/v1/payment/refunds/me                          (attendee view)
 *
 * Refund states: `INITIATED → GATEWAY_PROCESSING → COMPLETED | FAILED`.
 * The cascade (server-side) invalidates the registration, voids the QR,
 * frees the seat, decrements analytics, and notifies both sides.
 *
 * Refund policy is enforced server-side: blocked after `event.startDate +
 * 24h` (configurable per event via `Event.refundPolicy`). Super-admin
 * bypasses the window.
 */

import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';

const BASE_URL = import.meta.env.VITE_API_URL;

export type RefundStatus = 'INITIATED' | 'GATEWAY_PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Refund {
	id: string;
	ticketPaymentId?: string;
	transactionId?: string;
	registrationId?: string;
	eventId?: string;
	eventName?: string;
	ticketTypeName?: string;
	attendeeName?: string;
	attendeeEmail?: string;
	amountKobo: number;
	currency: string;
	status: RefundStatus;
	reason?: string;
	gateway?: string;
	gatewayReference?: string;
	createdAt: string;
	completedAt?: string;
	failureReason?: string;
	receiptUrl?: string;
}

export interface InitiateTicketRefundBody {
	/** Optional partial-refund amount in minor units (kobo). Omit for full refund. */
	amountKobo?: number;
	/** 3-char minimum reason copied to the attendee email. */
	reason: string;
}

/**
 * Organizer (or super-admin) initiates a ticket refund. The cascade is
 * fully driven server-side.
 */
export async function initiateTicketRefund(
	ticketPaymentId: string,
	body: InitiateTicketRefundBody
): Promise<Refund> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/refunds/ticket/${ticketPaymentId}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	if (!res.ok) await throwApiError(res, 'Failed to initiate refund');
	const data = await res.json();
	return data.data ?? data;
}

/** Super-admin generic transaction refund. Used by the admin queue. */
export async function adminRefundTransaction(
	transactionId: string,
	body: InitiateTicketRefundBody
): Promise<Refund> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/refunds/admin/${transactionId}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	if (!res.ok) await throwApiError(res, 'Failed to initiate refund');
	const data = await res.json();
	return data.data ?? data;
}

export interface ListRefundsOptions {
	eventId?: string;
	status?: RefundStatus | string;
	cursor?: string;
	limit?: number;
}

export interface RefundListResponse {
	items: Refund[];
	nextCursor?: string | null;
	total?: number;
}

/** Organizer view of refunds across an event. */
export async function listEventRefunds(
	eventId: string,
	opts: Omit<ListRefundsOptions, 'eventId'> = {}
): Promise<RefundListResponse> {
	const params = new URLSearchParams({ eventId });
	if (opts.status) params.set('status', String(opts.status));
	if (opts.cursor) params.set('cursor', opts.cursor);
	if (opts.limit) params.set('limit', String(opts.limit));
	const res = await authFetch(`${BASE_URL}/api/v1/payment/refunds?${params.toString()}`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch refunds');
	const data = await res.json();
	const payload = data.data ?? data;
	return {
		items: payload.items ?? payload ?? [],
		nextCursor: payload.nextCursor ?? null,
		total: payload.total ?? undefined,
	};
}

/** Attendee view of their own refunds — used by `/account/refunds`. */
export async function listMyRefunds(opts: ListRefundsOptions = {}): Promise<RefundListResponse> {
	const params = new URLSearchParams();
	if (opts.status) params.set('status', String(opts.status));
	if (opts.cursor) params.set('cursor', opts.cursor);
	if (opts.limit) params.set('limit', String(opts.limit));
	const res = await authFetch(`${BASE_URL}/api/v1/payment/refunds/me?${params.toString()}`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch your refunds');
	const data = await res.json();
	const payload = data.data ?? data;
	return {
		items: payload.items ?? payload ?? [],
		nextCursor: payload.nextCursor ?? null,
		total: payload.total ?? undefined,
	};
}
