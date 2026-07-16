/**
 * FE-P2-09 (P2-09 / NEW-3.3) — AML thresholds, alerts, CTR/STR.
 *
 * Admin endpoints for the compliance dashboard:
 *   - GET  /api/v1/payment/aml/admin/reviews/pending
 *   - GET  /api/v1/payment/aml/admin/alerts/open
 *   - POST /api/v1/payment/aml/admin/:reviewId/approve
 *   - POST /api/v1/payment/aml/admin/:reviewId/reject
 *   - POST /api/v1/payment/aml/admin/:alertId/clear
 *   - GET  /api/v1/payment/aml/admin/ctr-str/:month   (CSV download)
 */

import { adminFetch } from '$lib/services/admin.fetch';
import { throwApiError } from '$lib/utils/errorMessage';

const BASE_URL = import.meta.env.VITE_API_URL;

export interface AmlReview {
	id: string;
	userId: string;
	userEmail?: string;
	userName?: string;
	transactionId?: string;
	amountKobo: number;
	currency: string;
	threshold: 'SINGLE_TRANSACTION' | 'DAILY_AGGREGATE' | 'VELOCITY';
	openedAt: string;
	status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface AmlAlert {
	id: string;
	userId: string;
	userEmail?: string;
	userName?: string;
	type: string;
	severity: 'LOW' | 'MEDIUM' | 'HIGH';
	openedAt: string;
	context?: Record<string, any>;
	status: 'OPEN' | 'CLEARED';
}

export async function listPendingReviews(opts: { cursor?: string; limit?: number } = {}): Promise<{
	items: AmlReview[];
	nextCursor?: string | null;
}> {
	const params = new URLSearchParams();
	if (opts.cursor) params.set('cursor', opts.cursor);
	if (opts.limit) params.set('limit', String(opts.limit));
	const res = await adminFetch(`${BASE_URL}/api/v1/payment/aml/admin/reviews/pending?${params.toString()}`);
	if (!res.ok) await throwApiError(res, 'Failed to load AML reviews');
	const data = await res.json();
	const p = data.data ?? data;
	return { items: p.items ?? p ?? [], nextCursor: p.nextCursor ?? null };
}

export async function listOpenAlerts(opts: { cursor?: string; limit?: number } = {}): Promise<{
	items: AmlAlert[];
	nextCursor?: string | null;
}> {
	const params = new URLSearchParams();
	if (opts.cursor) params.set('cursor', opts.cursor);
	if (opts.limit) params.set('limit', String(opts.limit));
	const res = await adminFetch(`${BASE_URL}/api/v1/payment/aml/admin/alerts/open?${params.toString()}`);
	if (!res.ok) await throwApiError(res, 'Failed to load AML alerts');
	const data = await res.json();
	const p = data.data ?? data;
	return { items: p.items ?? p ?? [], nextCursor: p.nextCursor ?? null };
}

export async function approveAmlReview(reviewId: string, note?: string): Promise<AmlReview> {
	const res = await adminFetch(`${BASE_URL}/api/v1/payment/aml/admin/${reviewId}/approve`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ note }),
	});
	if (!res.ok) await throwApiError(res, 'Failed to approve review');
	const data = await res.json();
	return data.data ?? data;
}

export async function rejectAmlReview(reviewId: string, reason: string): Promise<AmlReview> {
	const res = await adminFetch(`${BASE_URL}/api/v1/payment/aml/admin/${reviewId}/reject`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ reason }),
	});
	if (!res.ok) await throwApiError(res, 'Failed to reject review');
	const data = await res.json();
	return data.data ?? data;
}

export async function clearAlert(alertId: string, note?: string): Promise<AmlAlert> {
	const res = await adminFetch(`${BASE_URL}/api/v1/payment/aml/admin/${alertId}/clear`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ note }),
	});
	if (!res.ok) await throwApiError(res, 'Failed to clear alert');
	const data = await res.json();
	return data.data ?? data;
}

/**
 * Download the CTR / STR report for a given month (`YYYY-MM`). Returns a
 * Blob so the caller can wire it to a download link.
 */
export async function downloadCtrStrReport(monthYYYYMM: string): Promise<Blob> {
	const res = await adminFetch(`${BASE_URL}/api/v1/payment/aml/admin/ctr-str/${monthYYYYMM}`);
	if (!res.ok) await throwApiError(res, 'Failed to download report');
	return await res.blob();
}
