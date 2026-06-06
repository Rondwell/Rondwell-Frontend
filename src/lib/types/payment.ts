/**
 * FE-P0-04 — Typed payment-service response shapes.
 *
 * Mirrors the public ticket-payment initiate / verify-and-settle contract
 * from `services/payment/src/api/controllers/TicketPaymentController.ts`.
 * Every monetary number on the wire is in minor units (kobo/cents) and is
 * accompanied by an explicit currency.
 */

import type { SupportedCurrency } from '$lib/utils/money';

/**
 * Response body for `POST /api/v1/payment/ticketPayment/attendee-ticket-purchase`.
 *
 * The server is the source of price (P0-01 / FE-P0-01). `totalAmount` is the
 * canonical kobo total resolved from event-service — never trust a
 * client-side `ticket.price * qty`.
 *
 * `verificationToken` (P0-04) is an HMAC token bound to the transaction with
 * a 30-minute TTL. The follow-up `verify-and-settle` POST MUST echo it in the
 * `x-verification-token` header.
 */
export interface AttendeePaymentInitiateResponse {
	/** Hosted checkout URL (Paystack hosted) — fallback when inline isn't used. */
	checkoutUrl: string;
	/** Canonical total in minor units (kobo / cents). Always trust this number. */
	totalAmount: number;
	/** ISO currency code the backend resolved — drive `formatMoney(...)` from it. */
	currency: SupportedCurrency | string;
	/** Gateway reference (`paystackReference`). Used by the inline modal + verify route. */
	reference: string;
	/** Public Paystack key for the inline popup. Falls back to the env public key. */
	paystackPublicKey?: string;
	/** P0-04 HMAC verification token. Echo as `x-verification-token` on settle. */
	verificationToken?: string;
	/** Verification token expiry (epoch seconds). For UX hints only. */
	verificationTokenExpiresAt?: number;
	/** Internal transaction id. */
	transactionId?: string;
}

/**
 * Response body for `POST /api/v1/payment/ticketPayment/verify-and-settle/:reference`.
 *
 * The webhook is the canonical settlement path (P0-05). This endpoint exists
 * only for the Paystack-inline success callback, where the gateway has
 * confirmed payment client-side and we want to settle without waiting for the
 * webhook. Calling it more than once for the same reference is safe — the
 * server is idempotent end-to-end via `WebhookEvent`.
 */
export interface VerifyAndSettleResponse {
	status: boolean;
	message?: string;
	/** Whether settlement actually executed this call (vs already-settled). */
	settled?: boolean;
	transactionId?: string;
}
