/**
 * FE-P4-02 (P4-02 / FA-9.2 / FA-9.3) — Platform revenue rollup admin dashboard.
 *
 * Backend reference: daily snapshot collection `PlatformRevenue` aggregated
 * from `WalletEntry` reasons (PLATFORM_FEE, PLATFORM_FX_REVENUE, SUBSCRIPTION,
 * GATEWAY_FEE, REFUND_RETURN). Admin dashboard endpoints:
 *
 *   - GET /api/v1/payment/admin/finance/overview?from=&to=&currency=
 *   - GET /api/v1/payment/admin/finance/timeseries?bucket=day|week|month
 *   - GET /api/v1/payment/admin/finance/top/events?from=&to=&limit=
 *   - GET /api/v1/payment/admin/finance/top/vendors?from=&to=&limit=
 *   - GET /api/v1/payment/admin/finance/top/organizers?from=&to=&limit=
 *   - GET /api/v1/payment/admin/finance/disputes?status=&cursor=
 *   - GET /api/v1/payment/admin/finance/export?type=overview|events|vendors|organizers
 */

import { adminFetch } from '$lib/services/admin.fetch';
import { throwApiError } from '$lib/utils/errorMessage';

const BASE_URL = import.meta.env.VITE_API_URL;

export interface RevenueOverview {
	currency: string;
	from: string;
	to: string;
	ticketCommissionKobo: number;
	vendorCommissionKobo: number;
	fxRevenueKobo: number;
	subscriptionRevenueKobo: number;
	gatewayFeesPaidKobo: number;
	refundReturnsKobo: number;
	netKobo: number;
	// Optional comparison block: same window, previous year.
	previousYear?: {
		ticketCommissionKobo: number;
		vendorCommissionKobo: number;
		fxRevenueKobo: number;
		subscriptionRevenueKobo: number;
		gatewayFeesPaidKobo: number;
		refundReturnsKobo: number;
		netKobo: number;
	} | null;
}

export interface RevenueTimeseriesPoint {
	bucket: string; // 'YYYY-MM-DD' for day, 'YYYY-WW' for week, 'YYYY-MM' for month
	ticketCommissionKobo: number;
	vendorCommissionKobo: number;
	fxRevenueKobo: number;
	subscriptionRevenueKobo: number;
	gatewayFeesPaidKobo: number;
	refundReturnsKobo: number;
	netKobo: number;
}

export type FinanceBucket = 'day' | 'week' | 'month';

export async function getRevenueOverview(opts?: {
	from?: string;
	to?: string;
	currency?: string;
	includePreviousYear?: boolean;
}): Promise<RevenueOverview> {
	const params = new URLSearchParams();
	if (opts?.from) params.set('from', opts.from.slice(0, 10));
	if (opts?.to) params.set('to', opts.to.slice(0, 10));
	if (opts?.currency) params.set('currency', opts.currency);
	if (opts?.includePreviousYear) params.set('includePreviousYear', 'true');
	const res = await adminFetch(
		`${BASE_URL}/api/v1/payment/admin/finance/summary?${params.toString()}`
	);
	if (!res.ok) await throwApiError(res, 'Failed to load revenue');
	const data = await res.json();
	const d = data?.data ?? data ?? {};
	// Backend returns { period, currency, totals: {...}, rates, rollupCoverage }
	const totals = d.totals ?? d;
	return {
		currency: d.currency ?? 'NGN',
		from: d.period?.from ?? d.from ?? opts?.from ?? '',
		to: d.period?.to ?? d.to ?? opts?.to ?? '',
		ticketCommissionKobo: Number(totals.ticketCommissionKobo ?? 0),
		vendorCommissionKobo: Number(totals.vendorCommissionKobo ?? 0),
		fxRevenueKobo: Number(totals.fxRevenueKobo ?? 0),
		subscriptionRevenueKobo: Number(totals.subscriptionRevenueKobo ?? 0),
		gatewayFeesPaidKobo: Number(totals.gatewayFeesPaidKobo ?? 0),
		refundReturnsKobo: Number(totals.refundReturnsKobo ?? 0),
		netKobo: Number(totals.netKobo ?? 0),
		previousYear: d.previousYear ?? null,
	};
}

export async function getRevenueTimeseries(opts: {
	bucket?: FinanceBucket;
	from?: string;
	to?: string;
	currency?: string;
}): Promise<RevenueTimeseriesPoint[]> {
	const params = new URLSearchParams();
	params.set('bucket', opts.bucket ?? 'day');
	if (opts.from) params.set('from', opts.from.slice(0, 10));
	if (opts.to) params.set('to', opts.to.slice(0, 10));
	if (opts.currency) params.set('currency', opts.currency);
	const res = await adminFetch(
		`${BASE_URL}/api/v1/payment/admin/finance/timeseries?${params.toString()}`
	);
	if (!res.ok) await throwApiError(res, 'Failed to load timeseries');
	const data = await res.json();
	const d = data?.data ?? data ?? [];
	const raw = Array.isArray(d) ? d : Array.isArray(d.items) ? d.items : [];
	// Backend returns PlatformRevenue docs with `date` field; FE expects `bucket`
	return raw.map((r: any) => ({
		bucket: r.bucket ?? r.date ?? r._id ?? '',
		ticketCommissionKobo: Number(r.ticketCommissionKobo ?? 0),
		vendorCommissionKobo: Number(r.vendorCommissionKobo ?? 0),
		fxRevenueKobo: Number(r.fxRevenueKobo ?? 0),
		subscriptionRevenueKobo: Number(r.subscriptionRevenueKobo ?? 0),
		gatewayFeesPaidKobo: Number(r.gatewayFeesPaidKobo ?? 0),
		refundReturnsKobo: Number(r.refundReturnsKobo ?? 0),
		netKobo: Number(r.netKobo ?? 0),
	}));
}

export interface TopRow {
	id: string;
	name: string;
	commissionKobo: number;
	grossKobo: number;
	currency: string;
	transactions: number;
	[k: string]: any;
}

export async function getTopEvents(opts?: { from?: string; to?: string; limit?: number }) {
	return fetchTop('events', opts);
}
export async function getTopVendors(opts?: { from?: string; to?: string; limit?: number }) {
	return fetchTop('vendors', opts);
}
export async function getTopOrganizers(opts?: { from?: string; to?: string; limit?: number }) {
	return fetchTop('organizers', opts);
}

async function fetchTop(
	scope: 'events' | 'vendors' | 'organizers',
	opts?: { from?: string; to?: string; limit?: number }
): Promise<TopRow[]> {
	const params = new URLSearchParams();
	if (opts?.from) params.set('from', opts.from.slice(0, 10));
	if (opts?.to) params.set('to', opts.to.slice(0, 10));
	if (opts?.limit) params.set('limit', String(opts.limit));
	const res = await adminFetch(
		`${BASE_URL}/api/v1/payment/admin/finance/top/${scope}?${params.toString()}`
	);
	if (!res.ok) await throwApiError(res, `Failed to load top ${scope}`);
	const data = await res.json();
	const d = data?.data ?? data ?? [];
	return Array.isArray(d) ? d : Array.isArray(d.items) ? d.items : [];
}

// ─── CSV export ──────────────────────────────────────────────────────────

export async function exportFinanceCsv(
	scope: 'overview' | 'events' | 'vendors' | 'organizers' | 'disputes',
	opts?: { from?: string; to?: string; currency?: string }
): Promise<Blob> {
	const params = new URLSearchParams();
	params.set('type', scope);
	if (opts?.from) params.set('from', opts.from.slice(0, 10));
	if (opts?.to) params.set('to', opts.to.slice(0, 10));
	if (opts?.currency) params.set('currency', opts.currency);
	const res = await adminFetch(
		`${BASE_URL}/api/v1/payment/admin/finance/export.csv?${params.toString()}`
	);
	if (!res.ok) await throwApiError(res, 'Failed to export CSV');
	return await res.blob();
}

/** Browser-side download helper. */
export function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 5000);
}
