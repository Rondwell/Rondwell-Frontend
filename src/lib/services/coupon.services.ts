import { authFetch } from '$lib/services/api.client';

/**
 * Coupon / discount-code service helpers (payment-service).
 *
 * Organizers create and manage coupons; attendees validate a code before
 * checkout via `applyCouponPreview`. All money values are in MINOR units
 * (kobo for NGN, cent for USD) on the wire — the UI converts for display.
 */

const PAYMENT_URL =
	import.meta.env.VITE_PAYMENT_API_URL ||
	import.meta.env.VITE_API_URL ||
	import.meta.env.VITE_EVENT_API_URL;

const BASE = `${PAYMENT_URL}/api/v1/payment/coupons`;

export type DiscountType = 'PERCENTAGE' | 'AMOUNT';
export type CouponCurrency = 'NGN' | 'USD';

export interface Coupon {
	id: string;
	organizerId: string;
	collectionId?: string | null;
	eventId?: string | null;
	ticketTypeIds?: string[] | null;
	code: string;
	discountType: DiscountType;
	discountValue: number;
	currency: CouponCurrency;
	usageLimit?: number | null;
	timesUsed: number;
	pendingUses?: number;
	maxUsesPerUser?: number | null;
	startDate: string;
	endDate: string;
	isActive?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface CreateCouponPayload {
	code: string;
	discountType: DiscountType;
	/** Percentage (0-100) for PERCENTAGE; minor units (kobo) for AMOUNT. */
	discountValue: number;
	currency: CouponCurrency;
	startDate: string;
	endDate: string;
	/** Scope: omit both eventId & collectionId for "all events", set collectionId for the whole calendar, or eventId for a single event. */
	eventId?: string | null;
	collectionId?: string | null;
	ticketTypeIds?: string[] | null;
	usageLimit?: number | null;
	maxUsesPerUser?: number | null;
	isActive?: boolean;
}

async function asJson(res: Response) {
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		throw new Error(data?.message ?? data?.error ?? 'Request failed');
	}
	return data;
}

export async function createCoupon(payload: CreateCouponPayload): Promise<Coupon> {
	const res = await authFetch(`${BASE}/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	const data = await asJson(res);
	return data.data as Coupon;
}

export async function listCoupons(params: {
	collectionId?: string;
	eventId?: string;
	skip?: number;
	limit?: number;
} = {}): Promise<{ items: Coupon[]; total: number; skip: number; limit: number }> {
	const q = new URLSearchParams();
	if (params.collectionId) q.set('collectionId', params.collectionId);
	if (params.eventId) q.set('eventId', params.eventId);
	q.set('skip', String(params.skip ?? 0));
	q.set('limit', String(params.limit ?? 50));
	const res = await authFetch(`${BASE}/?${q.toString()}`, { method: 'GET' });
	const data = await asJson(res);
	return data.data;
}

export async function updateCoupon(
	couponId: string,
	patch: Partial<CreateCouponPayload>
): Promise<Coupon> {
	const res = await authFetch(`${BASE}/${couponId}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(patch)
	});
	const data = await asJson(res);
	return data.data as Coupon;
}

export async function deleteCoupon(couponId: string): Promise<void> {
	const res = await authFetch(`${BASE}/${couponId}/`, { method: 'DELETE' });
	await asJson(res);
}

export async function activateCoupon(code: string): Promise<void> {
	const res = await authFetch(`${BASE}/activate/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ code })
	});
	await asJson(res);
}

export async function deactivateCoupon(couponId: string, code: string): Promise<void> {
	const res = await authFetch(`${BASE}/${couponId}/deactivate/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ code })
	});
	await asJson(res);
}

export interface CouponPreview {
	finalPrice: number;
	discountAmount: number;
	originalLineTotal: number;
	discountType: DiscountType;
	discountValue: number;
	couponId: string;
	couponCode: string;
	numberOfTickets: number;
}

/**
 * Validate/preview a coupon against a ticket line WITHOUT charging.
 * `originalPrice` is the per-ticket unit price in minor units (kobo).
 */
export async function applyCouponPreview(input: {
	quantity: number;
	originalPrice: number;
	couponCode: string;
	eventId?: string;
	collectionId?: string;
	ticketTypeId?: string;
	currency?: CouponCurrency;
}): Promise<CouponPreview> {
	const res = await authFetch(`${BASE}/apply/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input)
	});
	const data = await asJson(res);
	return data.data as CouponPreview;
}
