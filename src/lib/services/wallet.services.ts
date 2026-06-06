import { authFetch } from '$lib/services/api.client';

import { throwApiError } from '$lib/utils/errorMessage';
import { getBrowserTz } from '$lib/utils/tz';
const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * FE-P0-04 note — wallet flows do NOT use the ticket-payment HMAC
 * `verificationToken` / `x-verification-token` header. That header is
 * specific to the Paystack-inline `verify-and-settle` callback in
 * `RegistrationModal`. When future wallet-pays-for-ticket helpers land in
 * this file, do NOT add the header — the wallet path is server-authenticated
 * by the JWT and settles on the spot. See `payment.services.ts` for the
 * gateway-callback flow.
 */

// ==================== WALLET ====================

export async function getWalletBalance(): Promise<any> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/wallet/balance`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch wallet balance');
	const data = await res.json();
	return data.data ?? data;
}

// ==================== BANK / BENEFICIARY ====================

export async function getBankList(): Promise<any[]> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/transaction/bank/`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch bank list');
	const data = await res.json();
	return data.data ?? data ?? [];
}

export async function resolveBankAccount(accountNumber: string, bankCode: string): Promise<any> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/transaction/bank/resolve-account/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ accountNumber, bankCode })
	});
	if (!res.ok) await throwApiError(res, 'Failed to resolve bank account');
	const data = await res.json();
	return data.data ?? data;
}

export async function addBankAccount(accountNumber: string, bankCode: string, bankName: string): Promise<any> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/beneficiary/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ accountNumber, bankCode, bankName })
	});
	if (!res.ok) await throwApiError(res, 'Failed to add bank account');
	const data = await res.json();
	return data.data ?? data;
}

export async function getBankAccounts(): Promise<any[]> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/beneficiary/`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch bank accounts');
	const data = await res.json();
	return data.data ?? data ?? [];
}

export async function removeBankAccount(beneficiaryId: string): Promise<void> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/beneficiary/${beneficiaryId}/`, {
		method: 'DELETE'
	});
	if (!res.ok) await throwApiError(res, 'Failed to remove bank account');
}

// ==================== WALLET TOPUP ====================

/**
 * FE-P1-09 (FA-8.1) — Initiate a wallet top-up checkout.
 *
 * The backend accepts an `Idempotency-Key` header on this route. Pass a
 * stable key per logical intent (see `$lib/utils/idempotency`) so a flaky
 * network or mid-flight refresh re-uses the same in-flight transaction
 * instead of opening a duplicate.
 */
export async function topUpWallet(
	amount: number,
	currency: string,
	idempotencyKey?: string
): Promise<any> {
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
	const res = await authFetch(`${BASE_URL}/api/v1/payment/wallet/topup/checkout-url`, {
		method: 'POST',
		headers,
		body: JSON.stringify({ amount, currency, payment_gateway: 'PAYSTACK' })
	});
	if (!res.ok) await throwApiError(res, 'Failed to start wallet top-up');
	const data = await res.json();
	return data.data ?? data;
}

// ==================== WITHDRAWAL ====================

/**
 * FE-P1-07 — Request a withdrawal OTP. Server-side rate limit is 3/hour per
 * `ip+userId`; 11th request returns 429 with code `OTP_REQUEST_RATE_LIMIT`.
 * The thrown Error from `throwApiError` carries `.status` and `.code` so the
 * caller can branch on the rate-limit case.
 */
export async function requestWithdrawalOtp(amount: number): Promise<void> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/wallet/withdrawal/request-otp`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ amount })
	});
	if (!res.ok) await throwApiError(res, 'Failed to send OTP');
	await res.json().catch(() => ({}));
}

/**
 * FE-P1-07 / FE-P1-08 — Verify withdrawal OTP and process the withdrawal.
 *
 * The backend (P1-07 step 4) rejects any verify-otp call without a `userPin`
 * with a structured 400 (`code: 'PIN_REQUIRED'`). PIN is verified atomically
 * (P1-08); 5 wrong tries lock the row and the next call returns 423 with
 * `code: 'PIN_LOCKED'`. OTP failures return their own reason codes
 * (`NO_OTP / EXPIRED / LOCKED / INVALID / ALREADY_USED`).
 *
 * Callers should pipe the thrown Error through `mapWithdrawalError(...)` from
 * `$lib/utils/withdrawalErrors` to render specific copy per code.
 */
export async function verifyWithdrawalOtp(
	otp: string,
	amount: number,
	currency: string,
	beneficiaryId: string,
	userPin: string
): Promise<any> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/wallet/withdrawal/verify-otp`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ otp, amount, currency, beneficiaryId, userPin })
	});
	if (!res.ok) await throwApiError(res, 'Withdrawal failed');
	return await res.json();
}

export async function withdrawFunds(
	amount: number,
	currency: string,
	beneficiaryId: string,
	userPin: string
): Promise<any> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/transaction/disbursement/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ amount, currency, beneficiaryId, userPin, reason: 'Wallet withdrawal' })
	});
	if (!res.ok) await throwApiError(res, 'Withdrawal failed');
	const data = await res.json();
	return data;
}

// ==================== TRANSACTIONS ====================

export async function getEarningsSummary(opts?: { tz?: string }): Promise<any[]> {
	const params = new URLSearchParams();
	params.set('tz', opts?.tz ?? getBrowserTz());
	const res = await authFetch(`${BASE_URL}/api/v1/payment/wallet/earnings-summary?${params.toString()}`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch earnings summary');
	const data = await res.json();
	return data.data ?? [];
}

export async function getUserTransactions(options?: {
	skip?: number;
	limit?: number;
	status?: string;
	type?: string;
	startDate?: string;
	endDate?: string;
	tz?: string;
}): Promise<any> {
	const params = new URLSearchParams();
	if (options?.skip !== undefined) params.set('skip', String(options.skip));
	if (options?.limit !== undefined) params.set('limit', String(options.limit));
	if (options?.status) params.set('status', options.status);
	if (options?.type) params.set('type', options.type);
	if (options?.startDate) params.set('startDate', options.startDate);
	if (options?.endDate) params.set('endDate', options.endDate);
	// FE-P3-07: pass the resolved zone so day-buckets match the org's locale.
	params.set('tz', options?.tz ?? getBrowserTz());

	const res = await authFetch(`${BASE_URL}/api/v1/payment/transaction/list?${params.toString()}`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch transactions');
	const data = await res.json();
	return data;
}

// ==================== EVENT EARNINGS ====================

export async function getEventEarnings(
	eventId: string,
	options?: {
		skip?: number;
		limit?: number;
		status?: string;
		search?: string;
		startDate?: string;
		endDate?: string;
		tz?: string;
	}
): Promise<any> {
	const params = new URLSearchParams();
	if (options?.skip !== undefined) params.set('skip', String(options.skip));
	if (options?.limit !== undefined) params.set('limit', String(options.limit));
	if (options?.status) params.set('status', options.status);
	if (options?.search) params.set('search', options.search);
	if (options?.startDate) params.set('startDate', options.startDate);
	if (options?.endDate) params.set('endDate', options.endDate);
	// FE-P3-07: tz drives day-bucket boundaries on the server.
	params.set('tz', options?.tz ?? getBrowserTz());

	const res = await authFetch(
		`${BASE_URL}/api/v1/payment/transaction/event/${eventId}/earnings?${params.toString()}`
	);
	if (!res.ok) await throwApiError(res, 'Failed to fetch event earnings');
	const data = await res.json();
	return data;
}

// ==================== SUBSCRIPTION ====================

/**
 * FE-P1-12 (FA-5.5) — Returns the user's live tier + fee rates from the
 * backend. `calculatePlatformFee` is the single source of truth on the
 * server, so this endpoint always reflects the actual plan configuration
 * (not a frontend-side hardcoded ladder).
 *
 * The fallback below exists only for graceful degradation on a flaky
 * network — we emit a `console.warn` so devs notice when production traffic
 * is silently routing through the FREE-tier defaults.
 */
export async function getUserSubscriptionInfo(): Promise<{ tier: string; feeRate: number; feePercent: number; withdrawalFeeRate: number; withdrawalFeeCap: number }> {
	try {
		const res = await authFetch(`${BASE_URL}/api/v1/payment/subscription/my-tier`);
		if (!res.ok) await throwApiError(res, 'Failed to fetch subscription info');
		const data = await res.json();
		const d = data.data ?? {};
		return {
			tier: d.tier ?? 'FREE',
			feeRate: d.feeRate ?? 0.06,
			feePercent: d.feePercent ?? 6,
			withdrawalFeeRate: d.withdrawalFeeRate ?? 0.03,
			withdrawalFeeCap: d.withdrawalFeeCap ?? 500
		};
	} catch (err) {
		// FE-P1-12 — network failed. The hardcoded FREE-tier ladder below is a
		// last-ditch fallback; log loudly so we notice when production isn't
		// reading the live plan.
		console.warn('[wallet.services] getUserSubscriptionInfo fell back to FREE defaults:', (err as any)?.message);
		return { tier: 'FREE', feeRate: 0.06, feePercent: 6, withdrawalFeeRate: 0.03, withdrawalFeeCap: 500 };
	}
}


// ==================== FE-P3-12 — UNIFIED SALES + WALLET FEEDS ====================

/**
 * FE-P3-12 (NEW-1.4 / FA-9.1) — Event sales summary.
 *
 * Backend reference: GET /api/v1/payment/events/:eventId/sales-summary
 *
 * Returns the ledger-backed truth for an event's revenue, replacing the
 * three-endpoint client-side merge that the old earnings page used. The
 * response shape:
 *
 *   {
 *     gross, gatewayFee, platformFee, refunded, net,           // kobo
 *     currency,
 *     ticketsSold, ticketsRefunded, ticketsAvailable,
 *     byTicketType: [{ ticketTypeId, name, sold, refunded, gross, net, currency }],
 *     timeline:     [{ day: 'YYYY-MM-DD', gross, net, count }]
 *   }
 *
 * `tz` controls the boundary the server uses to bucket the timeline rows
 * (defaults to the browser's IANA zone via `getBrowserTz`). `from` / `to`
 * are ISO-8601 timestamps; the server treats them as UTC instants.
 */
export interface SalesSummary {
	gross: number;
	gatewayFee: number;
	platformFee: number;
	refunded: number;
	net: number;
	currency: string;
	ticketsSold: number;
	ticketsRefunded: number;
	ticketsAvailable: number;
	byTicketType: Array<{
		ticketTypeId: string;
		name: string;
		sold: number;
		refunded: number;
		gross: number;
		net: number;
		currency: string;
	}>;
	timeline: Array<{ day: string; gross: number; net: number; count: number }>;
}

export async function getEventSalesSummary(
	eventId: string,
	opts?: { tz?: string; from?: string; to?: string }
): Promise<SalesSummary> {
	const params = new URLSearchParams();
	params.set('tz', opts?.tz ?? getBrowserTz());
	if (opts?.from) params.set('from', opts.from);
	if (opts?.to) params.set('to', opts.to);
	const res = await authFetch(
		`${BASE_URL}/api/v1/payment/events/${eventId}/sales-summary?${params.toString()}`
	);
	if (!res.ok) await throwApiError(res, 'Failed to fetch sales summary');
	const data = await res.json();
	const d = data?.data ?? data ?? {};
	return {
		gross: Number(d.gross ?? 0),
		gatewayFee: Number(d.gatewayFee ?? 0),
		platformFee: Number(d.platformFee ?? 0),
		refunded: Number(d.refunded ?? 0),
		net: Number(d.net ?? 0),
		currency: d.currency ?? 'NGN',
		ticketsSold: Number(d.ticketsSold ?? 0),
		ticketsRefunded: Number(d.ticketsRefunded ?? 0),
		ticketsAvailable: Number(d.ticketsAvailable ?? 0),
		byTicketType: Array.isArray(d.byTicketType) ? d.byTicketType : [],
		timeline: Array.isArray(d.timeline) ? d.timeline : [],
	};
}

/**
 * FE-P3-12 (NEW-2.1 / FA-9.3) — Cursor-paginated wallet transactions.
 *
 * Backend reference: GET /api/v1/payment/wallet/me/transactions
 *
 * Replaces the legacy skip/limit `getUserTransactions` for the account
 * wallet. Returns ledger entries (the canonical source) instead of the
 * old transaction-list view. Cursor-paginated so very long histories
 * stay responsive.
 */
export interface WalletTransactionPage {
	items: any[];
	nextCursor: string | null;
	hasMore: boolean;
}

export async function getMyWalletTransactions(opts?: {
	cursor?: string | null;
	limit?: number;
	type?: string;
	from?: string;
	to?: string;
	currency?: string;
	tz?: string;
}): Promise<WalletTransactionPage> {
	const params = new URLSearchParams();
	if (opts?.cursor) params.set('cursor', opts.cursor);
	if (opts?.limit) params.set('limit', String(opts.limit));
	if (opts?.type) params.set('type', opts.type);
	if (opts?.from) params.set('from', opts.from);
	if (opts?.to) params.set('to', opts.to);
	if (opts?.currency) params.set('currency', opts.currency);
	params.set('tz', opts?.tz ?? getBrowserTz());

	const res = await authFetch(
		`${BASE_URL}/api/v1/payment/wallet/me/transactions?${params.toString()}`
	);
	if (!res.ok) await throwApiError(res, 'Failed to fetch wallet transactions');
	const data = await res.json();
	const d = data?.data ?? data ?? {};
	return {
		items: Array.isArray(d.items) ? d.items : Array.isArray(d) ? d : [],
		nextCursor: d.nextCursor ?? null,
		hasMore: Boolean(d.hasMore ?? d.nextCursor),
	};
}

// ==================== FE-P3-09 — HASH-CHAINED AUDIT LOG (admin) ====================

/**
 * FE-P3-09 (NEW-9.1) — Wallet audit log.
 *
 * Backend reference:
 *   GET  /api/v1/payment/admin/wallet/:walletId/audit
 *   POST /api/v1/payment/admin/wallet/:walletId/audit/verify?fromGenesis=true
 *
 * Each entry carries `{ previousHash, entryHash, ... }`. The verify call
 * walks the chain from genesis and reports tampering at the entry level.
 * Super-admin only.
 */
export interface WalletAuditEntry {
	id: string;
	walletId: string;
	type: string;
	amountKobo: number;
	currency: string;
	balanceAfterKobo: number;
	previousHash: string;
	entryHash: string;
	createdAt: string;
	createdBy?: string;
	context?: Record<string, any>;
}

export interface WalletAuditPage {
	items: WalletAuditEntry[];
	nextCursor: string | null;
	chainStatus: 'VERIFIED' | 'TAMPERED' | 'UNKNOWN';
	checkpoint?: { entryId: string; verifiedAt: string } | null;
}

export async function getWalletAudit(
	walletId: string,
	opts?: { from?: string; to?: string; tz?: string; cursor?: string | null; limit?: number }
): Promise<WalletAuditPage> {
	const params = new URLSearchParams();
	if (opts?.from) params.set('from', opts.from);
	if (opts?.to) params.set('to', opts.to);
	params.set('tz', opts?.tz ?? getBrowserTz());
	if (opts?.cursor) params.set('cursor', opts.cursor);
	if (opts?.limit) params.set('limit', String(opts.limit));
	const res = await authFetch(
		`${BASE_URL}/api/v1/payment/admin/wallet/${walletId}/audit?${params.toString()}`
	);
	if (!res.ok) await throwApiError(res, 'Failed to fetch audit log');
	const data = await res.json();
	const d = data?.data ?? data ?? {};
	return {
		items: Array.isArray(d.items) ? d.items : [],
		nextCursor: d.nextCursor ?? null,
		chainStatus: d.chainStatus ?? 'UNKNOWN',
		checkpoint: d.checkpoint ?? null,
	};
}

export async function verifyWalletAuditChain(
	walletId: string,
	fromGenesis = true
): Promise<{ status: 'VERIFIED' | 'TAMPERED'; tamperedAt?: string | null; entriesChecked: number }> {
	const url = `${BASE_URL}/api/v1/payment/admin/wallet/${walletId}/audit/verify?fromGenesis=${fromGenesis}`;
	const res = await authFetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({}),
	});
	if (!res.ok) await throwApiError(res, 'Failed to verify audit chain');
	const data = await res.json();
	const d = data?.data ?? data ?? {};
	return {
		status: d.status ?? 'VERIFIED',
		tamperedAt: d.tamperedAt ?? null,
		entriesChecked: Number(d.entriesChecked ?? 0),
	};
}

// ==================== FE-P3-10 — SOFT-DELETE / ANONYMISE ====================

/**
 * FE-P3-10 (NEW-9.2) — Self-service account deletion request.
 *
 * Schedules a soft-delete on a 30-day grace window. The user keeps access
 * during the grace window and can cancel. After 30 days the backend cron
 * runs the anonymise job (PII scrubbed; financial history retained 7y).
 *
 * The endpoint is mounted under user-service when present; the FE talks to
 * it through the api gateway. The `cancel` and `status` endpoints share
 * the same surface.
 */
export async function requestAccountDeletion(reason?: string): Promise<{ scheduledFor: string }> {
	const res = await authFetch(`${BASE_URL}/api/v1/profile/me/deletion/request`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ reason: reason ?? '' }),
	});
	if (!res.ok) await throwApiError(res, 'Failed to schedule account deletion');
	const data = await res.json();
	const d = data?.data ?? data ?? {};
	return { scheduledFor: d.scheduledFor ?? '' };
}

export async function cancelAccountDeletion(): Promise<void> {
	const res = await authFetch(`${BASE_URL}/api/v1/profile/me/deletion/cancel`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({}),
	});
	if (!res.ok) await throwApiError(res, 'Failed to cancel deletion request');
}

export async function getAccountDeletionStatus(): Promise<{
	scheduledFor: string | null;
	canCancel: boolean;
} | null> {
	try {
		const res = await authFetch(`${BASE_URL}/api/v1/profile/me/deletion/status`);
		if (!res.ok) return null;
		const data = await res.json();
		const d = data?.data ?? data ?? {};
		return {
			scheduledFor: d.scheduledFor ?? null,
			canCancel: Boolean(d.canCancel),
		};
	} catch {
		return null;
	}
}

/** Super-admin: anonymise a user's PII immediately (P3-10). */
export async function adminAnonymiseUser(userId: string): Promise<void> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/admin/users/${userId}/anonymise`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({}),
	});
	if (!res.ok) await throwApiError(res, 'Failed to anonymise user');
}
