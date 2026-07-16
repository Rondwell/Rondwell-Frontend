/**
 * FE-P4-01 (P4-01) — Daily reconciliation admin dashboard.
 *
 * Backend reference: three nightly recon jobs (wallet replay, gateway
 * settlement, disbursement recon) write to a `ReconReport` collection.
 * Drift > 0 freezes the affected wallet via `FREEZE_WALLET`.
 *
 * Endpoints (super-admin only):
 *   - GET    /api/v1/payment/admin/recon/runs                       (paginated list)
 *   - GET    /api/v1/payment/admin/recon/runs/:runId                (run detail + findings)
 *   - GET    /api/v1/payment/admin/recon/wallets/:walletId          (wallet detail w/ frozen flag)
 *   - POST   /api/v1/payment/admin/recon/wallets/:walletId/unfreeze (super-admin only)
 *   - GET    /api/v1/payment/admin/recon/backfill                   (P4-07 — backfill runs)
 *   - POST   /api/v1/payment/admin/recon/backfill/:runId/approve    (P4-07 — sign-off)
 */

import { adminFetch } from '$lib/services/admin.fetch';
import { throwApiError } from '$lib/utils/errorMessage';

const BASE_URL = import.meta.env.VITE_API_URL;

export type ReconJobType = 'WALLET_REPLAY' | 'GATEWAY_SETTLEMENT' | 'DISBURSEMENT';
export type ReconRunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';
export type ReconAction = 'NO_ACTION' | 'FREEZE_WALLET' | 'COMPENSATING_ENTRY' | 'ALERT_OPS';

export interface ReconRun {
	id: string;
	jobType: ReconJobType;
	status: ReconRunStatus;
	startedAt: string;
	completedAt?: string | null;
	driftCount: number;
	totalChecked: number;
	actionsTaken: ReconAction[];
	summary?: string | null;
}

export interface ReconFinding {
	id: string;
	walletId?: string;
	transactionId?: string;
	category: string;
	driftKobo?: number;
	currency?: string;
	previousValue?: any;
	expectedValue?: any;
	action: ReconAction;
	notes?: string;
	createdAt: string;
}

export interface ReconRunDetail extends ReconRun {
	findings: ReconFinding[];
	rawReport?: any;
}

export interface ReconWalletDetail {
	walletId: string;
	userId: string;
	userEmail?: string;
	userName?: string;
	frozen: boolean;
	frozenReason?: string | null;
	frozenAt?: string | null;
	balance: Record<string, number>;
	reservedBalance?: Record<string, number>;
	disputedReserve?: Record<string, number>;
	availableBalance?: Record<string, number>;
	lastReconAt?: string | null;
	lastReconStatus?: 'OK' | 'DRIFT' | null;
	lastDriftKobo?: number | null;
}

export interface ReconBackfillRun {
	id: string;
	scope: string; // e.g. "subscription-orphans 2025-Q3"
	status: 'DRY_RUN' | 'AWAITING_SIGNOFF' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
	createdAt: string;
	createdBy?: string;
	approvedBy?: string;
	approvedAt?: string;
	findings: number;
	dryRunOutputUrl?: string | null;
	notes?: string;
}

// ─── List recon runs ─────────────────────────────────────────────────────

export async function listReconRuns(opts?: {
	jobType?: ReconJobType;
	status?: ReconRunStatus;
	cursor?: string | null;
	limit?: number;
}): Promise<{ items: ReconRun[]; nextCursor: string | null }> {
	const params = new URLSearchParams();
	if (opts?.jobType) params.set('jobType', opts.jobType);
	if (opts?.status) params.set('status', opts.status);
	if (opts?.cursor) params.set('cursor', opts.cursor);
	if (opts?.limit) params.set('limit', String(opts.limit));
	const res = await adminFetch(`${BASE_URL}/api/v1/payment/admin/recon/runs?${params.toString()}`);
	if (!res.ok) await throwApiError(res, 'Failed to load recon runs');
	const data = await res.json();
	const d = data?.data ?? data ?? {};
	return { items: Array.isArray(d.items) ? d.items : [], nextCursor: d.nextCursor ?? null };
}

export async function getReconRun(runId: string): Promise<ReconRunDetail> {
	const res = await adminFetch(`${BASE_URL}/api/v1/payment/admin/recon/runs/${runId}`);
	if (!res.ok) await throwApiError(res, 'Failed to load run');
	const data = await res.json();
	const d = data?.data ?? data ?? {};
	return {
		...d,
		findings: Array.isArray(d.findings) ? d.findings : [],
	} as ReconRunDetail;
}

// ─── Wallet detail / freeze controls ─────────────────────────────────────

export async function getReconWallet(walletId: string): Promise<ReconWalletDetail> {
	const res = await adminFetch(`${BASE_URL}/api/v1/payment/admin/recon/wallets/${walletId}`);
	if (!res.ok) await throwApiError(res, 'Failed to load wallet');
	const data = await res.json();
	const d = data?.data ?? data ?? {};
	return {
		walletId: d.walletId ?? walletId,
		userId: d.userId ?? '',
		userEmail: d.userEmail,
		userName: d.userName,
		frozen: Boolean(d.frozen),
		frozenReason: d.frozenReason ?? null,
		frozenAt: d.frozenAt ?? null,
		balance: d.balance ?? {},
		reservedBalance: d.reservedBalance ?? {},
		disputedReserve: d.disputedReserve ?? d.disputedBalance ?? {},
		availableBalance: d.availableBalance ?? {},
		lastReconAt: d.lastReconAt ?? null,
		lastReconStatus: d.lastReconStatus ?? null,
		lastDriftKobo: d.lastDriftKobo ?? null,
	};
}

export async function unfreezeWallet(walletId: string, note?: string): Promise<void> {
	const res = await adminFetch(
		`${BASE_URL}/api/v1/payment/admin/recon/wallets/${walletId}/unfreeze`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ note: note ?? '' }),
		}
	);
	if (!res.ok) await throwApiError(res, 'Failed to unfreeze wallet');
}

// ─── P4-07 — Backfill admin ──────────────────────────────────────────────

export async function listReconBackfills(opts?: {
	cursor?: string | null;
	limit?: number;
}): Promise<{ items: ReconBackfillRun[]; nextCursor: string | null }> {
	const params = new URLSearchParams();
	if (opts?.cursor) params.set('cursor', opts.cursor);
	if (opts?.limit) params.set('limit', String(opts.limit));
	const res = await adminFetch(
		`${BASE_URL}/api/v1/payment/admin/recon/backfill?${params.toString()}`
	);
	if (!res.ok) await throwApiError(res, 'Failed to load backfill runs');
	const data = await res.json();
	const d = data?.data ?? data ?? {};
	return { items: Array.isArray(d.items) ? d.items : [], nextCursor: d.nextCursor ?? null };
}

export async function getBackfillRun(runId: string): Promise<ReconBackfillRun & { rawOutput?: any }> {
	const res = await adminFetch(`${BASE_URL}/api/v1/payment/admin/recon/backfill/${runId}`);
	if (!res.ok) await throwApiError(res, 'Failed to load backfill run');
	const data = await res.json();
	return data?.data ?? data;
}

export async function approveBackfillRun(runId: string, note?: string): Promise<void> {
	const res = await adminFetch(
		`${BASE_URL}/api/v1/payment/admin/recon/backfill/${runId}/approve`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ note: note ?? '' }),
		}
	);
	if (!res.ok) await throwApiError(res, 'Failed to approve run');
}

export async function rejectBackfillRun(runId: string, reason: string): Promise<void> {
	const res = await adminFetch(
		`${BASE_URL}/api/v1/payment/admin/recon/backfill/${runId}/reject`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ reason }),
		}
	);
	if (!res.ok) await throwApiError(res, 'Failed to reject run');
}
