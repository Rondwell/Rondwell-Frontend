/**
 * FE-P0-04 — Centralised payment-service helpers.
 *
 * Until this file existed, every callsite called `fetch` against the payment
 * service directly. That made it hard to enforce the new contracts:
 *
 *   - P0-01 / FE-P0-01 — public initiate must NOT include `unitPrice`,
 *     `price`, `amount`, or `discountAmount` in the body. The server is the
 *     source of price.
 *   - P0-04 / FE-P0-04 — `verify-and-settle` requires the HMAC
 *     `verificationToken` returned by initiate, forwarded as
 *     `x-verification-token`. Without it the route returns 401.
 *   - P1-15 / FE-P1-15 — `attendee-ticket-purchase` only trusts the HMAC
 *     `registrationToken` issued by event-service. Sending a raw `attendeeId`
 *     is rejected under STRICT_REGISTRATION_TOKEN.
 *
 * All public ticket-payment HTTP traffic should go through the helpers here.
 */

import type {
	AttendeePaymentInitiateResponse,
	VerifyAndSettleResponse,
} from '$lib/types/payment';

const PAYMENT_URL =
	import.meta.env.VITE_PAYMENT_API_URL ||
	import.meta.env.VITE_API_URL ||
	import.meta.env.VITE_EVENT_API_URL;

/**
 * Body shape for `POST /api/v1/payment/ticketPayment/attendee-ticket-purchase`.
 *
 * Notice the absence of `unitPrice`, `price`, `amount`, and `discountAmount`
 * on `ticketDetails` — those are server-resolved (P0-01). The backend rejects
 * any of them with HTTP 400 under `STRICT_TICKET_PRICE_ENABLED=true`.
 */
export interface AttendeePaymentInitiateBody {
	attendeeName: string;
	attendeeEmail: string;
	eventId: string;
	organizerId: string;
	/** P1-15: HMAC token issued by event-service. The payment service trusts only this. */
	registrationToken?: string;
	ticketDetails: {
		ticketTypeId: string;
		quantity: number;
	};
	paymentMethodDetails: {
		payment_gateway: 'PAYSTACK';
		cardToken?: string;
		currency: string;
	};
	isGroupPurchase?: boolean;
	groupMembersEmails?: string[];
	successCallbackUrl: string;
	failureCallbackUrl: string;
	returnWalletPaymentLink?: boolean;
	registrationIds?: string[];
}

/**
 * Initiate an attendee ticket purchase. Returns the typed response shape
 * including the canonical `totalAmount` + `currency` + HMAC `verificationToken`.
 *
 * In dev mode this also enforces FE-P0-01: if a developer accidentally
 * tries to send any banned price field, we throw early with a clear message
 * rather than letting the backend return a confusing 400.
 */
export async function attendeePaymentInitiate(
	body: AttendeePaymentInitiateBody,
): Promise<AttendeePaymentInitiateResponse> {
	// FE-P0-01 dev-time regression assertion: the public route rejects any
	// `unitPrice`/`price`/`amount`/`discountAmount` on `ticketDetails`.
	// Catching this here gives a clearer error than a server-side 400.
	if (import.meta.env.DEV) {
		const banned = ['unitPrice', 'price', 'amount', 'discountAmount'] as const;
		for (const key of banned) {
			if (body.ticketDetails && key in (body.ticketDetails as Record<string, unknown>)) {
				throw new Error(
					`[attendeePaymentInitiate] FE-P0-01 violation: ticketDetails.${key} is server-resolved and must not be sent from the client.`,
				);
			}
		}
	}

	const res = await fetch(
		`${PAYMENT_URL}/api/v1/payment/ticketPayment/attendee-ticket-purchase/`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		},
	);
	const data = await res.json();
	if (!res.ok) {
		throw new Error(data?.message ?? data?.error ?? 'Payment initiation failed');
	}
	return data as AttendeePaymentInitiateResponse;
}

/**
 * Settle a Paystack-inline ticket payment. Used only by the inline callback
 * path; the webhook is the canonical settlement (P0-05) and is safe to
 * race against — the server is end-to-end idempotent via `WebhookEvent`.
 *
 * `verificationToken` must be the value returned by
 * `attendeePaymentInitiate(...)`. Without it the route returns 401 (P0-04).
 */
export async function verifyAndSettleTicketPayment(
	reference: string,
	verificationToken: string,
): Promise<VerifyAndSettleResponse> {
	const res = await fetch(
		`${PAYMENT_URL}/api/v1/payment/ticketPayment/verify-and-settle/${reference}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(verificationToken ? { 'x-verification-token': verificationToken } : {}),
			},
		},
	);
	// Settlement may legitimately fail if the webhook beat us to it — the
	// caller treats that as success. We surface the parsed body either way.
	const data = await res.json().catch(() => ({}));
	return {
		status: res.ok,
		message: data?.message,
		settled: data?.settled ?? res.ok,
		transactionId: data?.transactionId,
	};
}
