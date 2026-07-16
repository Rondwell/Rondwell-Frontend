/**
 * FE-P2-07 (P2-07 / NEW-3.1 / NEW-3.3) — KYC v1.
 *
 * Wraps the user-service KYC routes:
 *   - GET    /api/v1/profile/kyc/me                       (current tier + status)
 *   - POST   /api/v1/profile/kyc/submit                   (multi-step submission)
 *   - POST   /api/v1/profile/kyc/upload                   (S3 presigned upload)
 *   - Admin: /api/v1/profile/kyc/admin/pending            (super-admin queue)
 *            /api/v1/profile/kyc/admin/:id/approve
 *            /api/v1/profile/kyc/admin/:id/reject
 *
 * Tiers:
 *   - UNVERIFIED (no withdrawal)
 *   - BASIC     (BVN matched, ₦50k/day cap)
 *   - VERIFIED  (full KYC, no daily cap, AML threshold ₦5M)
 */

import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';

const BASE_URL = import.meta.env.VITE_API_URL;

export type KycTier = 'UNVERIFIED' | 'BASIC' | 'VERIFIED';
export type KycReviewStatus = 'NOT_SUBMITTED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export type IdType = 'BVN' | 'NIN' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'NATIONAL_ID';

export interface KycAddress {
	street?: string;
	city?: string;
	state?: string;
	postalCode?: string;
	country?: string;
	formatted?: string;
	lat?: number;
	lng?: number;
}

export interface MyKyc {
	tier: KycTier;
	status: KycReviewStatus;
	idType?: IdType | null;
	idNumber?: string | null;
	idDocumentUrl?: string | null;
	address?: KycAddress | null;
	bvn?: string | null;
	nin?: string | null;
	dailyLimitKobo?: number | null;
	dailyUsageKobo?: number | null;
	amlThresholdKobo?: number | null;
	rejectedReason?: string | null;
	submittedAt?: string | null;
	reviewedAt?: string | null;
}

export async function getMyKyc(): Promise<MyKyc> {
	const res = await authFetch(`${BASE_URL}/api/v1/profile/kyc/me`);
	if (!res.ok) await throwApiError(res, 'Failed to load KYC status');
	const data = await res.json();
	const d = data.data ?? data ?? {};
	return {
		tier: d.tier ?? 'UNVERIFIED',
		status: d.status ?? 'NOT_SUBMITTED',
		idType: d.idType ?? null,
		idNumber: d.idNumber ?? null,
		idDocumentUrl: d.idDocumentUrl ?? null,
		address: d.address ?? null,
		bvn: d.bvn ?? null,
		nin: d.nin ?? null,
		dailyLimitKobo: d.dailyLimitKobo ?? null,
		dailyUsageKobo: d.dailyUsageKobo ?? null,
		amlThresholdKobo: d.amlThresholdKobo ?? null,
		rejectedReason: d.rejectedReason ?? null,
		submittedAt: d.submittedAt ?? null,
		reviewedAt: d.reviewedAt ?? null,
	};
}

export interface SubmitKycBody {
	idType: IdType;
	idNumber: string;
	idDocumentUrl?: string; // S3 URL after upload
	bvn?: string;
	nin?: string;
	address: KycAddress;
}

export async function submitKyc(body: SubmitKycBody): Promise<MyKyc> {
	// Map the frontend address object to the backend's flat field names
	const payload: Record<string, any> = {
		idType: body.idType,
		idNumber: body.idNumber,
		idDocumentUrl: body.idDocumentUrl,
		bvn: body.bvn,
		nin: body.nin,
		addressLine1: body.address?.street || body.address?.formatted || '',
		city: body.address?.city || '',
		state: body.address?.state || '',
		country: body.address?.country || '',
		postalCode: body.address?.postalCode || undefined,
	};
	const res = await authFetch(`${BASE_URL}/api/v1/profile/kyc/submit`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});
	if (!res.ok) await throwApiError(res, 'Failed to submit KYC');
	const data = await res.json();
	return data.data ?? data;
}

/** Upload an ID document to S3 via the gateway-side presigned URL helper. */
export async function uploadKycDocument(file: File): Promise<{ url: string }> {
	const formData = new FormData();
	formData.append('file', file);
	const res = await authFetch(`${BASE_URL}/api/v1/profile/kyc/upload`, {
		method: 'POST',
		body: formData,
	});
	if (!res.ok) await throwApiError(res, 'Failed to upload document');
	const data = await res.json();
	const payload = data.data ?? data;
	return { url: payload.url ?? payload.documentUrl };
}

// ─── Admin queue ─────────────────────────────────────────────────────────

/** Get the admin auth headers (admin JWT + internal API key) */
function getAdminHeaders(): Record<string, string> {
	const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
	const apiKey = import.meta.env.VITE_ADMIN_ACCESS_KEY || '';
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
	};
	if (token) headers['Authorization'] = `Bearer ${token}`;
	if (apiKey) headers['x-internal-api-key'] = apiKey;
	return headers;
}

export interface KycReviewItem {
	id: string;
	_id?: string;
	userId: string;
	userEmail?: string;
	userName?: string;
	userProfilePicture?: string;
	idType: IdType;
	idNumber: string;
	idDocumentUrl?: string;
	bvn?: string | null;
	nin?: string | null;
	address?: KycAddress | null;
	addressLine1?: string;
	city?: string;
	state?: string;
	country?: string;
	postalCode?: string;
	submittedAt: string;
	status: KycReviewStatus;
}

export async function listPendingKyc(opts: { cursor?: string; limit?: number } = {}): Promise<{
	items: KycReviewItem[];
	nextCursor?: string | null;
}> {
	const params = new URLSearchParams();
	if (opts.cursor) params.set('cursor', opts.cursor);
	if (opts.limit) params.set('limit', String(opts.limit));
	const res = await fetch(`${BASE_URL}/api/v1/profile/kyc/admin/pending?${params.toString()}`, {
		headers: getAdminHeaders(),
	});
	if (!res.ok) await throwApiError(res, 'Failed to load KYC queue');
	const data = await res.json();
	const payload = data.data ?? data;
	const rawItems = Array.isArray(payload) ? payload : (payload.items ?? []);
	// Normalize: backend returns flat address fields, map to address object
	const items: KycReviewItem[] = rawItems.map((r: any) => ({
		...r,
		id: r.id || r._id,
		address: r.address ?? {
			street: r.addressLine1,
			formatted: [r.addressLine1, r.city, r.state, r.country].filter(Boolean).join(', '),
			city: r.city,
			state: r.state,
			country: r.country,
			postalCode: r.postalCode,
		},
	}));
	return { items, nextCursor: payload.nextCursor ?? null };
}

export async function listApprovedKyc(opts: { cursor?: string; limit?: number } = {}): Promise<{
	items: KycReviewItem[];
	nextCursor?: string | null;
}> {
	const params = new URLSearchParams();
	if (opts.cursor) params.set('cursor', opts.cursor);
	if (opts.limit) params.set('limit', String(opts.limit));
	const res = await fetch(`${BASE_URL}/api/v1/profile/kyc/admin/approved?${params.toString()}`, {
		headers: getAdminHeaders(),
	});
	if (!res.ok) await throwApiError(res, 'Failed to load approved KYC list');
	const data = await res.json();
	const payload = data.data ?? data;
	const rawItems = Array.isArray(payload) ? payload : (payload.items ?? []);
	const items: KycReviewItem[] = rawItems.map((r: any) => ({
		...r,
		id: r.id || r._id,
		address: r.address ?? {
			street: r.addressLine1,
			formatted: [r.addressLine1, r.city, r.state, r.country].filter(Boolean).join(', '),
			city: r.city,
			state: r.state,
			country: r.country,
			postalCode: r.postalCode,
		},
	}));
	return { items, nextCursor: payload.nextCursor ?? null };
}

export async function approveKyc(submissionId: string, note?: string): Promise<KycReviewItem> {
	const res = await fetch(`${BASE_URL}/api/v1/profile/kyc/admin/${submissionId}/approve`, {
		method: 'POST',
		headers: getAdminHeaders(),
		body: JSON.stringify({ note }),
	});
	if (!res.ok) await throwApiError(res, 'Failed to approve');
	const data = await res.json();
	return data.data ?? data;
}

export async function rejectKyc(submissionId: string, reason: string): Promise<KycReviewItem> {
	const res = await fetch(`${BASE_URL}/api/v1/profile/kyc/admin/${submissionId}/reject`, {
		method: 'POST',
		headers: getAdminHeaders(),
		body: JSON.stringify({ reason }),
	});
	if (!res.ok) await throwApiError(res, 'Failed to reject');
	const data = await res.json();
	return data.data ?? data;
}
