/**
 * FE-P0-05 — Replay-safe payment callback parser.
 *
 * The backend webhook (`services/payment/src/services/WebhookService.ts`) is
 * the canonical settlement path. Webhooks are fully idempotent end-to-end via
 * `WebhookEvent`, so a user double-clicking "Pay" or refreshing the success
 * page no longer double-credits anything.
 *
 * This helper exists so that "I came back from a gateway" pages parse the
 * query string in exactly one place. The parsed shape is read-only — pages
 * MUST NOT call `verify-and-settle` based on URL params alone. The Paystack
 * inline callback in RegistrationModal is the only frontend caller of
 * `verify-and-settle`, and it has the HMAC verification token (P0-04) needed
 * to hit that route.
 */

export type PaymentCallbackStatus = 'success' | 'failed' | null;

export interface PaymentCallbackParams {
	/** Settlement status reported by the redirect target. `null` if the URL has no `payment` param. */
	status: PaymentCallbackStatus;
	/** Registration id the user was paying for, if present. */
	registrationId?: string;
	/** Gateway reference, if forwarded back. */
	reference?: string;
}

/**
 * Parse the URL query string for a payment callback. Pure, side-effect free.
 *
 * Example:
 *   /event-page/abc?payment=success&reg=reg_123 → { status: 'success', registrationId: 'reg_123' }
 *   /event-page/abc                              → { status: null }
 */
export function parsePaymentCallback(search: string | URLSearchParams): PaymentCallbackParams {
	const params = typeof search === 'string' ? new URLSearchParams(search) : search;
	const raw = params.get('payment');
	const status: PaymentCallbackStatus =
		raw === 'success' ? 'success' : raw === 'failed' ? 'failed' : null;
	return {
		status,
		registrationId: params.get('reg') ?? undefined,
		reference: params.get('reference') ?? params.get('trxref') ?? undefined,
	};
}

/**
 * Strip the `payment=*&reg=*&reference=*&trxref=*` keys from the current URL
 * without reloading the page. Call this AFTER a banner has been rendered so a
 * refresh doesn't replay the banner state.
 */
export function clearPaymentCallbackFromUrl(): void {
	if (typeof window === 'undefined') return;
	const url = new URL(window.location.href);
	['payment', 'reg', 'reference', 'trxref'].forEach((k) => url.searchParams.delete(k));
	window.history.replaceState({}, '', url.pathname + (url.search ? `?${url.searchParams}` : '') + url.hash);
}
