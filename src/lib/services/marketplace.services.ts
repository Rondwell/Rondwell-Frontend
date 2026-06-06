/**
 * FE-P2-02 (P2-02 / FA-4.1 / NEW-2.3) — Vendor marketplace direct sales.
 *
 * Wraps the products-service marketplace routes:
 *   - GET  /api/v1/products/marketplace             (public, paginated)
 *   - GET  /api/v1/products/marketplace/:productId   (public detail)
 *   - POST /api/v1/products/:productId/purchase      (auth optional)
 *   - POST /api/v1/products/:productId/book          (booking slot, auth optional)
 *   - GET  /api/v1/products/:productId/availability  (public booking availability)
 *   - GET  /api/v1/products/me/orders                (vendor)
 *   - GET  /api/v1/products/me/purchases             (customer)
 *   - PATCH /api/v1/products/orders/:id/fulfill       (vendor mark-as-fulfilled)
 *
 * Money is integer minor units (kobo / cents) end-to-end. The server is
 * the source of price — the FE never sends a `priceKobo`.
 */

import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';

const BASE_URL = import.meta.env.VITE_API_URL;
const PRODUCTS_API = `${BASE_URL}/api/v1/products`;

export interface MarketplaceProduct {
	id: string;
	productName: string;
	description?: string;
	priceKobo: number;
	currency: string;
	stockQuantity?: number;
	unlimited?: boolean;
	salesStartDate?: string | null;
	salesEndDate?: string | null;
	requiresShipping?: boolean;
	marketplaceCategory?: string;
	pricingType?: 'FIXED' | 'BOOKING' | 'QUOTE';
	media?: Array<{ url: string; type: 'IMAGE' | 'VIDEO' }>;
	vendorId?: string;
	vendorName?: string;
	vendorSlug?: string;
	[key: string]: any;
}

export interface MarketplaceListOptions {
	page?: number;
	limit?: number;
	search?: string;
	category?: string;
	currency?: string;
	minPriceKobo?: number;
	maxPriceKobo?: number;
}

/** Public marketplace browse. No auth required. */
export async function listMarketplaceProducts(
	opts: MarketplaceListOptions = {}
): Promise<{ items: MarketplaceProduct[]; total: number; page: number; pageSize: number }> {
	const params = new URLSearchParams();
	if (opts.page) params.set('page', String(opts.page));
	if (opts.limit) params.set('limit', String(opts.limit));
	if (opts.search) params.set('search', opts.search);
	if (opts.category) params.set('category', opts.category);
	if (opts.currency) params.set('currency', opts.currency);
	if (opts.minPriceKobo) params.set('minPriceKobo', String(opts.minPriceKobo));
	if (opts.maxPriceKobo) params.set('maxPriceKobo', String(opts.maxPriceKobo));
	const res = await fetch(`${PRODUCTS_API}/marketplace?${params.toString()}`);
	if (!res.ok) await throwApiError(res, 'Failed to load marketplace');
	const data = await res.json();
	const payload = data.data ?? data;
	return {
		items: payload.items ?? payload ?? [],
		total: payload.total ?? 0,
		page: payload.page ?? 1,
		pageSize: payload.pageSize ?? payload.limit ?? 20,
	};
}

/** Public product detail. No auth required. */
export async function getMarketplaceProduct(productId: string): Promise<MarketplaceProduct> {
	const res = await fetch(`${PRODUCTS_API}/marketplace/${productId}`);
	if (!res.ok) await throwApiError(res, 'Product not found');
	const data = await res.json();
	return data.data ?? data;
}

export interface PurchaseProductBody {
	quantity?: number;
	customerEmail?: string;
	customerName?: string;
	successCallbackUrl: string;
	failureCallbackUrl: string;
	paymentGateway?: 'PAYSTACK' | 'STRIPE' | 'FLUTTERWAVE';
}

export interface PurchaseProductResponse {
	checkoutUrl?: string;
	reference?: string;
	totalAmountKobo?: number;
	currency?: string;
	orderId?: string;
}

/** Initiate a marketplace product purchase. Auth is optional — guests pass `customerEmail`. */
export async function purchaseProduct(
	productId: string,
	body: PurchaseProductBody
): Promise<PurchaseProductResponse> {
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	let res: Response;
	try {
		res = await authFetch(`${PRODUCTS_API}/${productId}/purchase`, {
			method: 'POST',
			headers,
			body: JSON.stringify(body),
		});
	} catch {
		// Not authenticated — fall back to plain fetch.
		res = await fetch(`${PRODUCTS_API}/${productId}/purchase`, {
			method: 'POST',
			headers,
			body: JSON.stringify(body),
		});
	}
	if (!res.ok) await throwApiError(res, 'Failed to start checkout');
	const data = await res.json();
	return data.data ?? data;
}

export interface BookProductBody {
	slotStart: string; // ISO timestamp
	slotEnd?: string;
	customerEmail?: string;
	customerName?: string;
	notes?: string;
	successCallbackUrl: string;
	failureCallbackUrl: string;
}

/** Reserve a booking slot. Slot is RESERVED until checkout completes (TTL 30m). */
export async function bookProductSlot(
	productId: string,
	body: BookProductBody
): Promise<PurchaseProductResponse & { holdToken?: string; expiresAt?: string }> {
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	let res: Response;
	try {
		res = await authFetch(`${PRODUCTS_API}/${productId}/book`, {
			method: 'POST',
			headers,
			body: JSON.stringify(body),
		});
	} catch {
		res = await fetch(`${PRODUCTS_API}/${productId}/book`, {
			method: 'POST',
			headers,
			body: JSON.stringify(body),
		});
	}
	if (!res.ok) await throwApiError(res, 'Failed to reserve slot');
	const data = await res.json();
	return data.data ?? data;
}

/** Release a held booking slot (e.g. user closed the modal). */
export async function releaseBookingSlot(productId: string, holdToken: string): Promise<void> {
	const res = await fetch(`${PRODUCTS_API}/${productId}/book/release`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ holdToken }),
	});
	if (!res.ok) await throwApiError(res, 'Failed to release slot');
}

export interface AvailabilitySlot {
	start: string;
	end: string;
	available: boolean;
}

/** Public availability for a service product over a date range. */
export async function getProductAvailability(
	productId: string,
	fromIso: string,
	toIso: string
): Promise<AvailabilitySlot[]> {
	const params = new URLSearchParams({ from: fromIso, to: toIso });
	const res = await fetch(`${PRODUCTS_API}/${productId}/availability?${params.toString()}`);
	if (!res.ok) await throwApiError(res, 'Failed to load availability');
	const data = await res.json();
	const payload = data.data ?? data;
	return payload.slots ?? payload ?? [];
}

// ─── Vendor's own orders ────────────────────────────────────────────────

export type ProductOrderStatus =
	| 'PENDING'
	| 'PAID'
	| 'FULFILLED'
	| 'REFUNDED'
	| 'CANCELED'
	| 'RESERVED'
	| 'BOOKED';

export interface ProductOrder {
	id: string;
	productId: string;
	productName: string;
	customerName?: string;
	customerEmail?: string;
	status: ProductOrderStatus;
	amountKobo: number;
	currency: string;
	quantity?: number;
	bookingSlotStart?: string;
	bookingSlotEnd?: string;
	createdAt: string;
	paidAt?: string;
	fulfilledAt?: string;
	receiptUrl?: string;
}

export async function listMyVendorOrders(opts: {
	status?: ProductOrderStatus | string;
	cursor?: string;
	limit?: number;
} = {}): Promise<{ items: ProductOrder[]; nextCursor?: string | null; total?: number }> {
	const params = new URLSearchParams();
	if (opts.status) params.set('status', String(opts.status));
	if (opts.cursor) params.set('cursor', opts.cursor);
	if (opts.limit) params.set('limit', String(opts.limit));
	const res = await authFetch(`${PRODUCTS_API}/me/orders?${params.toString()}`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch orders');
	const data = await res.json();
	const payload = data.data ?? data;
	return {
		items: payload.items ?? payload ?? [],
		nextCursor: payload.nextCursor ?? null,
		total: payload.total ?? undefined,
	};
}

export async function getMyVendorOrder(orderId: string): Promise<ProductOrder> {
	const res = await authFetch(`${PRODUCTS_API}/me/orders/${orderId}`);
	if (!res.ok) await throwApiError(res, 'Order not found');
	const data = await res.json();
	return data.data ?? data;
}

/** Vendor marks an order as fulfilled (notifies customer). */
export async function markOrderFulfilled(orderId: string): Promise<ProductOrder> {
	const res = await authFetch(`${PRODUCTS_API}/orders/${orderId}/fulfill`, { method: 'PATCH' });
	if (!res.ok) await throwApiError(res, 'Failed to mark as fulfilled');
	const data = await res.json();
	return data.data ?? data;
}

// ─── Customer's purchases ────────────────────────────────────────────────

export interface CustomerPurchase {
	id: string;
	productId: string;
	productName: string;
	vendorName?: string;
	vendorSlug?: string;
	status: ProductOrderStatus;
	amountKobo: number;
	currency: string;
	createdAt: string;
	paidAt?: string;
	fulfilledAt?: string;
	receiptUrl?: string;
	bookingSlotStart?: string;
	bookingSlotEnd?: string;
}

export async function listMyPurchases(opts: {
	status?: ProductOrderStatus | string;
	cursor?: string;
	limit?: number;
} = {}): Promise<{ items: CustomerPurchase[]; nextCursor?: string | null; total?: number }> {
	const params = new URLSearchParams();
	if (opts.status) params.set('status', String(opts.status));
	if (opts.cursor) params.set('cursor', opts.cursor);
	if (opts.limit) params.set('limit', String(opts.limit));
	const res = await authFetch(`${PRODUCTS_API}/me/purchases?${params.toString()}`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch your purchases');
	const data = await res.json();
	const payload = data.data ?? data;
	return {
		items: payload.items ?? payload ?? [],
		nextCursor: payload.nextCursor ?? null,
		total: payload.total ?? undefined,
	};
}

export async function getMyPurchase(orderId: string): Promise<CustomerPurchase> {
	const res = await authFetch(`${PRODUCTS_API}/me/purchases/${orderId}`);
	if (!res.ok) await throwApiError(res, 'Order not found');
	const data = await res.json();
	return data.data ?? data;
}
