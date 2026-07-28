/**
 * FE-P5-07 — Admin refund tracker client.
 *
 * Wraps the admin-service proxy at `/api/v1/admin/finance/refunds`, which
 * forwards to the payment-service (the only service that owns the ledger).
 *
 * ── Why this exists ──────────────────────────────────────────────────────
 *
 * Every refund is money leaving the platform, but admin-side it was visible only
 * as an aggregate `refundRate` percentage on the finance dashboard. There was no
 * way to see which refunds happened, to whom, initiated by whom, for what stated
 * reason, whether they were full or seat-scoped — or, critically, whether any had
 * FAILED at the gateway and were sitting in a broken state needing manual
 * intervention. A failed refund means the organizer has been debited and the
 * attendee has not been paid; that must be visible.
 *
 * Auth: admin JWT only. The internal API key stays server-side in the proxy
 * (see the note in `kyc.services.ts` about `VITE_ADMIN_ACCESS_KEY` leaking into
 * the client bundle).
 */

import { browser } from '$app/environment';
import { throwApiError } from '$lib/utils/errorMessage';

const API_URL = import.meta.env.VITE_API_URL;

export type RefundStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
export type RefundKind = 'TICKET' | 'VENDOR_INVOICE' | 'WALLET_TOPUP';

export interface AdminRefund {
	id: string;
	status: RefundStatus;
	refundKind: RefundKind;
	refundAmountKobo: number;
	platformFeeRefundedKobo: number;
	currency: string;
	isFull: boolean;
	reason: string;
	failureReason: string | null;
	eventId: string | null;
	organizerId: string | null;
	attendeeId: string | null;
	/** Set when this refund resolved to a group purchase. */
	groupId: string | null;
	/** The exact seats released. Empty for a single-ticket refund. */
	registrationIds: string[];
	seatCount: number;
	ticketPaymentId: string | null;
	originalTransactionId: string;
	refundGatewayId: string | null;
	initiatorId: string;
	initiatorRole: string | null;
	createdAt: string;
	refundedAt: string;
}

export interface AdminRefundTotals {
	count: number;
	refundedKobo: number;
	platformFeeReturnedKobo: number;
	byStatus: Record<string, number>;
}

export interface AdminRefundListResult {
	items: AdminRefund[];
	nextCursor: string | null;
	totals: AdminRefundTotals;
}

export interface AdminRefundDetail extends AdminRefund {
	updatedAt: string;
	original: {
		transactionId: string;
		amountKobo: number;
		gateway: string;
		reference: string;
		attendeeEmail: string;
		attendeeName: string;
		organizerEmail: string;
		organizerName: string;
		settledAt: string | null;
	} | null;
	ticket: {
		status: string;
		totalAmountKobo: number;
		isGroupPurchase: boolean;
		groupMembersCount: number;
		partialRefundsKobo: number;
	} | null;
}

export interface RefundFilters {
	status?: RefundStatus | '';
	refundKind?: RefundKind | '';
	eventId?: string;
	organizerId?: string;
	attendeeId?: string;
	groupId?: string;
	currency?: string;
	search?: string;
	from?: string;
	to?: string;
	cursor?: string | null;
	limit?: number;
}

function adminHeaders(): Record<string, string> {
	const token = browser ? localStorage.getItem('admin_token') : null;
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (token) headers['Authorization'] = `Bearer ${token}`;
	return headers;
}

function toQuery(filters: RefundFilters): string {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(filters)) {
		if (value === undefined || value === null || value === '') continue;
		params.set(key, String(value));
	}
	return params.toString();
}

async function adminFetch(path: string): Promise<any> {
	const res = await fetch(`${API_URL}/api/v1/admin/finance/refunds${path}`, {
		headers: adminHeaders()
	});
	if (res.status === 401) {
		if (browser) {
			localStorage.removeItem('admin_token');
			localStorage.removeItem('admin_user');
			window.location.href = '/hq/login';
		}
		throw new Error('Session expired');
	}
	if (!res.ok) await throwApiError(res, 'Failed to load refunds');
	const data = await res.json();
	return data.data ?? data;
}

export async function listRefunds(filters: RefundFilters = {}): Promise<AdminRefundListResult> {
	const payload = await adminFetch(`?${toQuery(filters)}`);
	return {
		items: payload?.items ?? [],
		nextCursor: payload?.nextCursor ?? null,
		totals:
			payload?.totals ?? { count: 0, refundedKobo: 0, platformFeeReturnedKobo: 0, byStatus: {} }
	};
}

export async function getRefund(id: string): Promise<AdminRefundDetail> {
	return adminFetch(`/${encodeURIComponent(id)}`);
}

/**
 * Download the filtered refund set as CSV.
 *
 * Fetched (rather than a plain anchor href) because the endpoint needs the
 * Authorization header — a bare link would arrive unauthenticated and bounce to
 * the login page.
 */
export async function downloadRefundsCsv(filters: RefundFilters = {}): Promise<void> {
	const res = await fetch(
		`${API_URL}/api/v1/admin/finance/refunds/export.csv?${toQuery({ ...filters, cursor: null })}`,
		{ headers: adminHeaders() }
	);
	if (!res.ok) await throwApiError(res, 'Failed to export refunds');
	const blob = await res.blob();
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `rondwell-refunds-${new Date().toISOString().slice(0, 10)}.csv`;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
