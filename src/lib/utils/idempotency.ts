/**
 * FE-P1-09 (FA-8.1) — Idempotency-Key helper.
 *
 * Backend reference: payment-service accepts an `Idempotency-Key` header on
 * the retryable initiate paths:
 *   - `POST /api/v1/payment/wallet/topup/checkout-url`
 *   - `POST /api/v1/payment/invoicePayment/initiate`
 *   - `POST /api/v1/payment/subscription/initiate`
 *
 * The server derives a default key when the client omits one, so paying users
 * never duplicate-fund. The frontend supplying a stable per-intent key is the
 * canonical safe path — a flaky network or a mid-flight refresh re-uses the
 * same key, which the server collapses into the same in-flight transaction.
 *
 * Storage strategy:
 *   - We persist the key in `sessionStorage` keyed by a stable scope.
 *   - On a hard refresh during checkout, the same scope produces the same key.
 *   - When the user explicitly starts a *new* intent (e.g. clicks a different
 *     plan), call `resetIdempotencyKey(scope)` first so the next click gets
 *     a fresh UUID.
 *
 * The scope should encode whatever uniquely identifies the user's intent:
 *   - `topup:NGN:50000` → "I'm topping up NGN ₦500"
 *   - `invoice:<collaborationId>:<invoiceNumber>`
 *   - `subscription:<plan>:<billingCycle>:<currency>`
 */

import { browser } from '$app/environment';

const STORAGE_PREFIX = 'rondwell:idempotency:';

/**
 * Returns the existing key for `scope`, or generates a fresh UUID and stores
 * it. Same scope → same key across refreshes within the session.
 *
 * Falls back to an in-memory random when `sessionStorage` isn't available
 * (SSR, private mode). The fallback won't survive a refresh — accept that,
 * because the alternative is failing the action entirely.
 */
export function getOrCreateIdempotencyKey(scope: string): string {
	if (!scope) throw new Error('[idempotency] scope is required');
	const storageKey = STORAGE_PREFIX + scope;

	if (browser && typeof sessionStorage !== 'undefined') {
		try {
			const existing = sessionStorage.getItem(storageKey);
			if (existing) return existing;
			const fresh = generateUuid();
			sessionStorage.setItem(storageKey, fresh);
			return fresh;
		} catch {
			// sessionStorage may throw in private mode — fall through.
		}
	}
	return generateUuid();
}

/**
 * Drop the key for `scope`. Call when the user starts a *new* intent that
 * should NOT collapse into the previous one — e.g. they bumped the topup
 * amount, switched plans, or restarted a vendor invoice payment.
 */
export function resetIdempotencyKey(scope: string): void {
	if (!scope || !browser) return;
	try {
		sessionStorage.removeItem(STORAGE_PREFIX + scope);
	} catch {
		/* ignore */
	}
}

/**
 * RFC 4122 v4 UUID. Uses `crypto.randomUUID` when available (every modern
 * browser since 2022) and a Web Crypto fallback otherwise.
 */
function generateUuid(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
		const bytes = new Uint8Array(16);
		crypto.getRandomValues(bytes);
		bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
		bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
		const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
		return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
	}
	// Last-ditch fallback. Not cryptographically random — but the server still
	// derives its own canonical key, so duplication is safe in the worst case.
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = Math.floor(Math.random() * 16);
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}
