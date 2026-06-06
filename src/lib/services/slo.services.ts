/**
 * FE-P4-06 — Operational SLO + alerts admin dashboard.
 *
 * Backend reference: P4-06 ships SLO instrumentation for webhook processing,
 * withdrawal initiation, and refund cascade, plus synthetic alerts on
 * thresholds (signature failures, stuck PENDING transactions, drift,
 * withdrawal failure rate, subscription dunning, AML hits).
 *
 * Endpoints:
 *   - GET /api/v1/payment/admin/slo                (current p50/p95/p99 + targets)
 *   - GET /api/v1/payment/admin/alerts             (recent ops alerts)
 *   - POST /api/v1/payment/admin/alerts/:id/ack    (acknowledge)
 */

import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';

const BASE_URL = import.meta.env.VITE_API_URL;

export type SloStatus = 'OK' | 'WARN' | 'BREACH';

export interface SloMetric {
	id: string;
	label: string;
	target: string; // e.g. "p99 ≤ 2s"
	p50Ms: number;
	p95Ms: number;
	p99Ms: number;
	status: SloStatus;
	since: string;
	notes?: string;
}

export interface OpsAlert {
	id: string;
	severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
	title: string;
	body: string;
	openedAt: string;
	source: string; // e.g. "withdrawal-failure-rate"
	acknowledgedAt?: string | null;
	acknowledgedBy?: string | null;
	resolvedAt?: string | null;
}

export async function getSloDashboard(): Promise<SloMetric[]> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/admin/slo`);
	if (!res.ok) await throwApiError(res, 'Failed to load SLO dashboard');
	const data = await res.json();
	const d = data?.data ?? data ?? [];
	return Array.isArray(d) ? d : Array.isArray(d.items) ? d.items : [];
}

export async function listOpsAlerts(opts?: {
	cursor?: string | null;
	severity?: OpsAlert['severity'];
	resolved?: boolean;
	limit?: number;
}): Promise<{ items: OpsAlert[]; nextCursor: string | null }> {
	const params = new URLSearchParams();
	if (opts?.cursor) params.set('cursor', opts.cursor);
	if (opts?.severity) params.set('severity', opts.severity);
	if (opts?.resolved != null) params.set('resolved', String(opts.resolved));
	if (opts?.limit) params.set('limit', String(opts.limit));
	const res = await authFetch(`${BASE_URL}/api/v1/payment/admin/alerts?${params.toString()}`);
	if (!res.ok) await throwApiError(res, 'Failed to load alerts');
	const data = await res.json();
	const d = data?.data ?? data ?? {};
	return { items: Array.isArray(d.items) ? d.items : [], nextCursor: d.nextCursor ?? null };
}

export async function acknowledgeAlert(alertId: string, note?: string): Promise<void> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/admin/alerts/${alertId}/ack`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ note: note ?? '' }),
	});
	if (!res.ok) await throwApiError(res, 'Failed to acknowledge alert');
}
