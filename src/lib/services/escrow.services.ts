/**
 * FE-P2-03 (P2-03 / NEW-2.4 / FA-4.2) — Vendor invoice escrow + dispute window.
 *
 * Wraps the payment-service escrow routes. On vendor-invoice payment success,
 * funds land in escrow. After `releaseDueAt` (default 7 days, per-event
 * override 1..14) the cron releases to the vendor. Organizer can dispute
 * within the window; super-admin resolves.
 *
 * Endpoints:
 *   - GET  /api/v1/payment/escrow/me                         (vendor or organizer)
 *   - GET  /api/v1/payment/escrow/vendor/pending             (vendor only)
 *   - GET  /api/v1/payment/escrow/:id                        (detail)
 *   - POST /api/v1/payment/escrow/:id/dispute                (organizer)
 *   - POST /api/v1/payment/escrow/disputes/:id/resolve       (super-admin)
 */

import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';

const BASE_URL = import.meta.env.VITE_API_URL;

export type EscrowStatus = 'HELD' | 'DISPUTED' | 'RELEASED' | 'REVERSED';

export interface Escrow {
	id: string;
	collaborationId?: string;
	invoiceNumber?: string;
	vendorUserId?: string;
	vendorName?: string;
	organizerUserId?: string;
	organizerName?: string;
	eventId?: string;
	eventName?: string;
	amountKobo: number;
	platformFeeKobo?: number;
	netToVendorKobo?: number;
	currency: string;
	status: EscrowStatus;
	heldAt: string;
	releaseDueAt: string;
	releasedAt?: string;
	reversedAt?: string;
	dispute?: EscrowDispute | null;
}

export interface EscrowDispute {
	id: string;
	escrowId: string;
	openedBy: string;
	reason: string;
	evidenceUrls?: string[];
	status: 'OPEN' | 'RESOLVED_VENDOR_FAVOUR' | 'RESOLVED_ORGANIZER_FAVOUR' | 'WITHDRAWN';
	openedAt: string;
	resolvedAt?: string;
	resolutionNote?: string;
}

export interface ListEscrowsOptions {
	status?: EscrowStatus | string;
	cursor?: string;
	limit?: number;
}

interface ListEscrowsResponse {
	items: Escrow[];
	nextCursor?: string | null;
	total?: number;
}

function buildParams(opts: ListEscrowsOptions): string {
	const params = new URLSearchParams();
	if (opts.status) params.set('status', String(opts.status));
	if (opts.cursor) params.set('cursor', opts.cursor);
	if (opts.limit) params.set('limit', String(opts.limit));
	return params.toString();
}

/** Combined feed for the current user (whichever side they're on). */
export async function listMyEscrows(opts: ListEscrowsOptions = {}): Promise<ListEscrowsResponse> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/escrow/me?${buildParams(opts)}`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch escrows');
	const data = await res.json();
	const payload = data.data ?? data;
	return { items: payload.items ?? payload ?? [], nextCursor: payload.nextCursor ?? null, total: payload.total };
}

/** Vendor view — pending payouts (status=HELD or DISPUTED). */
export async function listVendorPendingEscrows(opts: ListEscrowsOptions = {}): Promise<ListEscrowsResponse> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/escrow/vendor/pending?${buildParams(opts)}`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch pending payouts');
	const data = await res.json();
	const payload = data.data ?? data;
	return { items: payload.items ?? payload ?? [], nextCursor: payload.nextCursor ?? null, total: payload.total };
}

export async function getEscrow(escrowId: string): Promise<Escrow> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/escrow/${escrowId}`);
	if (!res.ok) await throwApiError(res, 'Escrow not found');
	const data = await res.json();
	return data.data ?? data;
}

export interface OpenDisputeBody {
	/** 3-char minimum reason. Surfaced to the vendor and to super-admin. */
	reason: string;
	evidenceUrls?: string[];
}

/** Organizer opens a dispute against a HELD escrow. */
export async function openEscrowDispute(escrowId: string, body: OpenDisputeBody): Promise<Escrow> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/escrow/${escrowId}/dispute`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	if (!res.ok) await throwApiError(res, 'Failed to open dispute');
	const data = await res.json();
	return data.data ?? data;
}

export interface ResolveDisputeBody {
	resolution: 'RESOLVED_VENDOR_FAVOUR' | 'RESOLVED_ORGANIZER_FAVOUR';
	resolutionNote?: string;
}

/** Super-admin only: resolve an open dispute. */
export async function resolveDispute(disputeId: string, body: ResolveDisputeBody): Promise<EscrowDispute> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/escrow/disputes/${disputeId}/resolve`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	if (!res.ok) await throwApiError(res, 'Failed to resolve dispute');
	const data = await res.json();
	return data.data ?? data;
}
