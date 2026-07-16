/**
 * FE-P4-05 (P4-05 / NEW-5.2) — Chargeback / dispute handling.
 *
 * Backend reference: webhook handlers for Paystack/Stripe `charge.dispute.*`
 * mark `Transaction.disputed = true` and freeze the recipient wallet's
 * `disputedReserve` for the disputed amount. Endpoints:
 *
 *   - GET  /api/v1/payment/disputes/me                          (recipient view)
 *   - GET  /api/v1/payment/disputes/:id                         (detail)
 *   - POST /api/v1/payment/disputes/:id/evidence                (multipart)
 *   - GET  /api/v1/payment/admin/finance/disputes               (admin queue)
 *   - POST /api/v1/payment/admin/finance/disputes/:id/resolve   (admin resolve)
 */

import { adminFetch } from '$lib/services/admin.fetch';
import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';

const BASE_URL = import.meta.env.VITE_API_URL;

export type DisputeStatus =
	| 'OPEN'
	| 'NEEDS_RESPONSE'
	| 'UNDER_REVIEW'
	| 'WON'
	| 'LOST'
	| 'WITHDRAWN';

export interface Dispute {
	id: string;
	transactionId: string;
	gateway: string;
	gatewayDisputeId?: string;
	reason?: string | null;
	status: DisputeStatus;
	amountKobo: number;
	currency: string;
	openedAt: string;
	deadlineAt?: string | null;
	resolvedAt?: string | null;
	evidenceSubmittedAt?: string | null;
	evidenceCount?: number;
	disputedReserveKobo?: number;
	customerEmail?: string;
	customerName?: string;
	eventName?: string;
	productName?: string;
	resolution?: 'WON' | 'LOST' | 'PARTIAL' | null;
	resolutionNotes?: string | null;
}

export interface DisputeEvidence {
	id: string;
	disputeId: string;
	type: 'PHOTO' | 'RECEIPT' | 'COMMUNICATION_LOG' | 'OTHER';
	url: string;
	mimeType?: string;
	uploadedAt: string;
	note?: string;
}

export interface DisputeDetail extends Dispute {
	evidence: DisputeEvidence[];
	timeline: Array<{ at: string; action: string; note?: string }>;
}

export async function listMyDisputes(opts?: {
	cursor?: string | null;
	status?: DisputeStatus;
	limit?: number;
}): Promise<{ items: Dispute[]; nextCursor: string | null }> {
	const params = new URLSearchParams();
	if (opts?.cursor) params.set('cursor', opts.cursor);
	if (opts?.status) params.set('status', opts.status);
	if (opts?.limit) params.set('limit', String(opts.limit));
	const res = await authFetch(`${BASE_URL}/api/v1/payment/disputes/me?${params.toString()}`);
	if (!res.ok) await throwApiError(res, 'Failed to load disputes');
	const data = await res.json();
	const d = data?.data ?? data ?? {};
	return { items: Array.isArray(d.items) ? d.items : [], nextCursor: d.nextCursor ?? null };
}

export async function getDispute(disputeId: string): Promise<DisputeDetail> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/disputes/${disputeId}`);
	if (!res.ok) await throwApiError(res, 'Failed to load dispute');
	const data = await res.json();
	const d = data?.data ?? data ?? {};
	return {
		...(d as DisputeDetail),
		evidence: Array.isArray(d.evidence) ? d.evidence : [],
		timeline: Array.isArray(d.timeline) ? d.timeline : [],
	};
}

export async function submitEvidence(
	disputeId: string,
	files: File[],
	note?: string,
	type: DisputeEvidence['type'] = 'OTHER'
): Promise<{ uploaded: number }> {
	const formData = new FormData();
	for (const f of files) formData.append('files', f);
	formData.append('type', type);
	if (note) formData.append('note', note);
	const res = await authFetch(`${BASE_URL}/api/v1/payment/disputes/${disputeId}/evidence`, {
		method: 'POST',
		body: formData,
	});
	if (!res.ok) await throwApiError(res, 'Failed to upload evidence');
	const data = await res.json();
	const d = data?.data ?? data ?? {};
	return { uploaded: Number(d.uploaded ?? files.length) };
}

// ─── Admin queue ─────────────────────────────────────────────────────────

export async function listAllDisputes(opts?: {
	cursor?: string | null;
	status?: DisputeStatus;
	limit?: number;
}): Promise<{ items: Dispute[]; nextCursor: string | null }> {
	const params = new URLSearchParams();
	if (opts?.cursor) params.set('cursor', opts.cursor);
	if (opts?.status) params.set('status', opts.status);
	if (opts?.limit) params.set('limit', String(opts.limit));
	const res = await adminFetch(
		`${BASE_URL}/api/v1/payment/admin/finance/disputes?${params.toString()}`
	);
	if (!res.ok) await throwApiError(res, 'Failed to load disputes');
	const data = await res.json();
	const d = data?.data ?? data ?? {};
	return { items: Array.isArray(d.items) ? d.items : [], nextCursor: d.nextCursor ?? null };
}

export async function resolveDispute(
	disputeId: string,
	resolution: 'WON' | 'LOST',
	note?: string
): Promise<Dispute> {
	const res = await adminFetch(
		`${BASE_URL}/api/v1/payment/admin/finance/disputes/${disputeId}/resolve`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ resolution, note: note ?? '' }),
		}
	);
	if (!res.ok) await throwApiError(res, 'Failed to resolve dispute');
	const data = await res.json();
	return data?.data ?? data;
}
