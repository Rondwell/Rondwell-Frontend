/**
 * FE-P4-03 (P4-03 / NEW-10.6) — VAT module + organizer TIN.
 *
 * Backend reference: NG VAT 7.5% applied per taxable transaction. Per-organizer
 * `taxId` (TIN) is required before publishing paid events. The backend
 * exposes:
 *
 *   - GET    /api/v1/profile/organizer/tax           (read TIN + status)
 *   - PUT    /api/v1/profile/organizer/tax           (update TIN)
 *   - GET    /api/v1/payment/vat/quarterly?period=YYYY-Qn   (FIRS CSV export)
 *   - GET    /api/v1/payment/vat/summary?from=&to=          (aggregate VAT collected)
 *
 * Nigerian TIN formats accepted by the backend:
 *   - Old format: 8 digits (NNNNNNNN)
 *   - New format: 10 or 14 digits (corporate) including dashes
 *
 * The frontend's regex validates the canonical 8-14 digit numeric form
 * (after stripping whitespace and dashes).
 */

import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';

const BASE_URL = import.meta.env.VITE_API_URL;

export interface OrganizerTaxInfo {
	taxId: string | null;
	taxIdStatus: 'NOT_SET' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'INVALID';
	country: string;
	vatRate?: number; // e.g. 0.075 for NG
	taxIdVerifiedAt?: string | null;
	canPublishPaidEvents?: boolean;
}

export async function getOrganizerTaxInfo(): Promise<OrganizerTaxInfo> {
	const res = await authFetch(`${BASE_URL}/api/v1/profile/organizer/tax`);
	if (!res.ok) await throwApiError(res, 'Failed to load tax info');
	const data = await res.json();
	const d = data?.data ?? data ?? {};
	return {
		taxId: d.taxId ?? null,
		taxIdStatus: d.taxIdStatus ?? (d.taxId ? 'VERIFIED' : 'NOT_SET'),
		country: d.country ?? 'NG',
		vatRate: d.vatRate ?? undefined,
		taxIdVerifiedAt: d.taxIdVerifiedAt ?? null,
		canPublishPaidEvents: d.canPublishPaidEvents ?? false,
	};
}

export async function updateOrganizerTaxId(taxId: string): Promise<OrganizerTaxInfo> {
	const res = await authFetch(`${BASE_URL}/api/v1/profile/organizer/tax`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ taxId }),
	});
	if (!res.ok) await throwApiError(res, 'Failed to update tax ID');
	const data = await res.json();
	return data?.data ?? data;
}

export interface VatSummary {
	periodStart: string;
	periodEnd: string;
	currency: string;
	taxableTransactions: number;
	taxableAmountKobo: number;
	vatCollectedKobo: number;
	remittedKobo: number;
	outstandingKobo: number;
}

export async function getVatSummary(opts?: { from?: string; to?: string }): Promise<VatSummary> {
	const params = new URLSearchParams();
	if (opts?.from) params.set('from', opts.from);
	if (opts?.to) params.set('to', opts.to);
	const res = await authFetch(`${BASE_URL}/api/v1/payment/vat/summary?${params.toString()}`);
	if (!res.ok) await throwApiError(res, 'Failed to load VAT summary');
	const data = await res.json();
	return data?.data ?? data;
}

/**
 * Download a quarterly VAT report (FIRS-compatible CSV).
 * `period` should be in `YYYY-Qn` form (e.g. `2026-Q1`).
 */
export async function downloadVatReport(period: string): Promise<Blob> {
	const params = new URLSearchParams();
	params.set('period', period);
	const res = await authFetch(`${BASE_URL}/api/v1/payment/vat/quarterly?${params.toString()}`);
	if (!res.ok) await throwApiError(res, 'Failed to download report');
	return await res.blob();
}

/**
 * Validate a Nigerian TIN. Strips whitespace + dashes and checks for an
 * 8-14 digit numeric run. Final authority is the backend.
 */
export function isValidNigerianTin(input: string): boolean {
	const stripped = (input || '').replace(/[\s-]/g, '');
	return /^\d{8,14}$/.test(stripped);
}
