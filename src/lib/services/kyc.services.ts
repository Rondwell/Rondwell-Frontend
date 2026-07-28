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
/**
 * FE-P5-08 — Status values now match the BACKEND.
 *
 * The backend `KycStatus` enum is `UNVERIFIED | PENDING_REVIEW | VERIFIED |
 * REJECTED`. This type previously declared `NOT_SUBMITTED | PENDING_REVIEW |
 * APPROVED | REJECTED`, so two of the four values could never occur:
 *
 *   - Every `status === 'APPROVED'` branch was DEAD. A verified user hit no
 *     branch at all on `/account/kyc` and `/account/kyc/status`, so they saw an
 *     empty card with no button.
 *   - A never-submitted user gets `UNVERIFIED`, not `NOT_SUBMITTED`, so that
 *     branch was dead too.
 *
 * The legacy names are kept in the union and normalised by `normaliseKycStatus`
 * so any component still comparing against them keeps working.
 */
export type KycReviewStatus =
	| 'UNVERIFIED'
	| 'PENDING_REVIEW'
	| 'VERIFIED'
	| 'REJECTED'
	// Legacy aliases — normalised on read, retained so older comparisons don't break.
	| 'NOT_SUBMITTED'
	| 'APPROVED';

/**
 * Normalise any status (legacy or current) to the backend's canonical value.
 * Use this instead of comparing raw strings.
 */
export function normaliseKycStatus(s: string | null | undefined): KycReviewStatus {
	switch (s) {
		case 'APPROVED':
		case 'VERIFIED':
			return 'VERIFIED';
		case 'NOT_SUBMITTED':
		case 'UNVERIFIED':
		case null:
		case undefined:
		case '':
			return 'UNVERIFIED';
		case 'PENDING_REVIEW':
			return 'PENDING_REVIEW';
		case 'REJECTED':
			return 'REJECTED';
		default:
			return 'UNVERIFIED';
	}
}

/**
 * FE-P5-08 — `NATIONAL_ID` is now a valid backend enum value.
 *
 * The submission form has always offered "National ID card" and sent
 * `NATIONAL_ID`, but the mongoose enum only allowed
 * `NIN | BVN | PASSPORT | DRIVERS_LICENSE | VOTERS_CARD | OTHER` — so selecting
 * the third option in the picker failed schema validation and the user could not
 * submit at all. The backend enum now includes it.
 */
export type IdType =
	| 'BVN'
	| 'NIN'
	| 'PASSPORT'
	| 'DRIVERS_LICENSE'
	| 'NATIONAL_ID'
	| 'VOTERS_CARD'
	| 'OTHER';

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
	/** FE-P5-08 — reviewer's internal note, when they chose to share one. */
	reviewerNotes?: string | null;
	/** FE-P5-08 — true when a previously VERIFIED profile was withdrawn. */
	wasRevoked?: boolean;
	/** FE-P5-08 — how many times this user has submitted. */
	resubmissionCount?: number;
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
		// FE-P5-08 — normalise so 'VERIFIED' from the backend is never compared
		// against a dead 'APPROVED' branch (and vice-versa).
		status: normaliseKycStatus(d.status),
		idType: d.idType ?? null,
		idNumber: d.idNumber ?? null,
		idDocumentUrl: d.idDocumentUrl ?? null,
		// The backend stores a FLAT address; reassemble it so the review and
		// re-submission screens can render and prefill it.
		address:
			d.address ??
			(d.addressLine1 || d.city || d.state || d.country
				? {
						street: d.addressLine1 ?? undefined,
						city: d.city ?? undefined,
						state: d.state ?? undefined,
						country: d.country ?? undefined,
						postalCode: d.postalCode ?? undefined,
						formatted: [d.addressLine1, d.city, d.state, d.country]
							.filter(Boolean)
							.join(', ')
					}
				: null),
		bvn: d.bvn ?? null,
		nin: d.nin ?? null,
		dailyLimitKobo: d.dailyLimitKobo ?? null,
		dailyUsageKobo: d.dailyUsageKobo ?? null,
		amlThresholdKobo: d.amlThresholdKobo ?? null,
		/**
		 * FE-P5-08 — THE FIELD-NAME BUG.
		 *
		 * The backend has always returned `rejectionReason`; this client read
		 * `rejectedReason`. The names never matched, so `$kycStore.rejectedReason`
		 * was permanently `null` and the rejected-status page ALWAYS fell through
		 * to the generic "We couldn't verify your submission" copy. The reason was
		 * persisted in the database and included in the rejection email — it was
		 * only ever lost in this mapping.
		 *
		 * Both keys are read so the fix works regardless of deploy order.
		 */
		rejectedReason: d.rejectionReason ?? d.rejectedReason ?? null,
		reviewerNotes: d.reviewerNotes ?? null,
		wasRevoked: !!d.revokedAt,
		resubmissionCount: d.resubmissionCount ?? 0,
		submittedAt: d.submittedAt ?? null,
		reviewedAt: d.reviewedAt ?? null
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

/**
 * FE-P5-08 — Admin KYC calls now go through the ADMIN-SERVICE proxy.
 *
 * They previously hit the user-service directly and supplied
 * `x-internal-api-key` from `import.meta.env.VITE_ADMIN_ACCESS_KEY`. Vite inlines
 * any `VITE_`-prefixed variable into the client bundle, so the platform's
 * internal admin key was shipped to every browser that loaded the app — readable
 * out of the JS by anyone, authenticated or not, and usable against every
 * internal admin endpoint on every service.
 *
 * Going through `/api/v1/admin/kyc/*` means the browser only ever carries its own
 * admin JWT; the internal key stays server-side. The proxy also forwards the
 * acting admin's identity as `x-admin-actor`, which is what makes the review
 * trail attributable — previously every proxied decision was recorded as the
 * literal string "system".
 */
function adminKycHeaders(): Record<string, string> {
	const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (token) headers['Authorization'] = `Bearer ${token}`;
	return headers;
}

async function adminKycFetch(path: string, init: RequestInit = {}): Promise<any> {
	const res = await fetch(`${BASE_URL}/api/v1/admin/kyc${path}`, {
		...init,
		headers: { ...adminKycHeaders(), ...(init.headers ?? {}) }
	});
	if (res.status === 401) {
		if (typeof window !== 'undefined') {
			localStorage.removeItem('admin_token');
			localStorage.removeItem('admin_user');
			window.location.href = '/hq/login';
		}
		throw new Error('Session expired');
	}
	if (!res.ok) await throwApiError(res, 'KYC request failed');
	const data = await res.json();
	return data.data ?? data;
}

/** Normalise a review row: flat backend address → nested object, id aliasing. */
function normaliseReviewItem(r: any): KycReviewItem {
	return {
		...r,
		id: r.id || r._id,
		status: normaliseKycStatus(r.status),
		address:
			r.address ??
			({
				street: r.addressLine1,
				formatted: [r.addressLine1, r.city, r.state, r.country].filter(Boolean).join(', '),
				city: r.city,
				state: r.state,
				country: r.country,
				postalCode: r.postalCode
			} as KycAddress)
	};
}

export interface KycReviewHistoryEntry {
	at: string;
	type: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REVOKED';
	actor: string;
	reason?: string | null;
	reviewerNotes?: string | null;
	fromStatus?: string;
	toStatus?: string;
	attempt?: number;
	idType?: string;
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
	// FE-P5-08 — review outcome + trail, for the rejected tab and the drawer.
	rejectedAt?: string | null;
	revokedAt?: string | null;
	wasRevocation?: boolean;
	rejectionReason?: string | null;
	reviewerNotes?: string | null;
	resubmissionCount?: number;
	reviewHistory?: KycReviewHistoryEntry[];
}

export type KycQueue = 'pending' | 'approved' | 'rejected';

export interface KycListResult {
	items: KycReviewItem[];
	nextCursor?: string | null;
	total?: number;
	page?: number;
	totalPages?: number;
}

/**
 * Unified list for any of the three review queues.
 *
 * `rejected` is new — there was previously no endpoint returning
 * `status: 'REJECTED'`, and the admin UI removed a row from the pending list the
 * moment it was rejected, so a rejection could not be reviewed or audited from
 * the product at all.
 */
export async function listKycQueue(
	queue: KycQueue,
	opts: { page?: number; pageSize?: number; cursor?: string; limit?: number } = {}
): Promise<KycListResult> {
	const params = new URLSearchParams();
	if (opts.page) params.set('page', String(opts.page));
	if (opts.pageSize) params.set('pageSize', String(opts.pageSize));
	if (opts.cursor) params.set('cursor', opts.cursor);
	if (opts.limit) params.set('limit', String(opts.limit));

	const payload = await adminKycFetch(`/${queue}?${params.toString()}`);
	const rawItems = Array.isArray(payload) ? payload : (payload.items ?? []);
	return {
		items: rawItems.map(normaliseReviewItem),
		nextCursor: payload?.nextCursor ?? null,
		total: payload?.total,
		page: payload?.page,
		totalPages: payload?.totalPages
	};
}

export const listPendingKyc = (opts: { page?: number; pageSize?: number; cursor?: string; limit?: number } = {}) =>
	listKycQueue('pending', opts);
export const listApprovedKyc = (opts: { page?: number; pageSize?: number; cursor?: string; limit?: number } = {}) =>
	listKycQueue('approved', opts);
export const listRejectedKyc = (opts: { page?: number; pageSize?: number; cursor?: string; limit?: number } = {}) =>
	listKycQueue('rejected', opts);

export async function approveKyc(submissionId: string, note?: string): Promise<KycReviewItem> {
	// Send BOTH spellings. The backend historically read `notes` while this
	// client sent `note`, so every reviewer note was silently discarded.
	const row = await adminKycFetch(`/${submissionId}/approve`, {
		method: 'POST',
		body: JSON.stringify({ note, notes: note })
	});
	return normaliseReviewItem(row);
}

export async function rejectKyc(
	submissionId: string,
	reason: string,
	notes?: string
): Promise<KycReviewItem> {
	const row = await adminKycFetch(`/${submissionId}/reject`, {
		method: 'POST',
		body: JSON.stringify({ reason, notes })
	});
	return normaliseReviewItem(row);
}

/**
 * FE-P5-08 — Withdraw verification from an already-VERIFIED profile.
 *
 * This action had no backend endpoint and no UI: `reject` filters on
 * `PENDING_REVIEW`, so once a profile was verified there was no way to downgrade
 * it. If a document later proved forged, the account kept uncapped withdrawal
 * rights and compliance had no remedy short of editing the database.
 */
export async function revokeKyc(
	submissionId: string,
	reason: string,
	notes?: string
): Promise<KycReviewItem> {
	const row = await adminKycFetch(`/${submissionId}/revoke`, {
		method: 'POST',
		body: JSON.stringify({ reason, notes })
	});
	return normaliseReviewItem(row);
}
