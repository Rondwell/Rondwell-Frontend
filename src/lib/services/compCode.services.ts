/**
 * FE-P2-11 (P2-11 / NEW-10.5) — Comp/freebie code management.
 *
 * Wraps the payment-service comp-code routes:
 *   - POST  /api/v1/payment/comp-codes/                (organizer create)
 *   - GET   /api/v1/payment/comp-codes?eventId=...      (organizer list)
 *   - POST  /api/v1/payment/comp-codes/:id/disable      (organizer disable)
 *   - POST  /api/v1/payment/comp-codes/redeem           (attendee redeem)
 *
 * On successful redemption the registration is created with
 * `transactionType: 'COMP_TICKET'` and skips the gateway entirely.
 */

import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';

const BASE_URL = import.meta.env.VITE_API_URL;

export interface CompCode {
	id: string;
	code: string;
	eventId: string;
	ticketTypeIds?: string[];
	allowedEmails?: string[];
	usageLimit?: number | null;
	timesUsed: number;
	perUserCap?: number | null;
	expiresAt?: string | null;
	isActive: boolean;
	createdAt: string;
}

export interface CreateCompCodeBody {
	code: string;
	eventId: string;
	ticketTypeIds?: string[];
	allowedEmails?: string[];
	usageLimit?: number | null;
	perUserCap?: number | null;
	expiresAt?: string | null;
}

export async function createCompCode(body: CreateCompCodeBody): Promise<CompCode> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/comp-codes`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	if (!res.ok) await throwApiError(res, 'Failed to create comp code');
	const data = await res.json();
	return data.data ?? data;
}

export async function listCompCodes(eventId: string): Promise<CompCode[]> {
	const params = new URLSearchParams({ eventId });
	const res = await authFetch(`${BASE_URL}/api/v1/payment/comp-codes?${params.toString()}`);
	if (!res.ok) await throwApiError(res, 'Failed to list comp codes');
	const data = await res.json();
	const p = data.data ?? data;
	return p.items ?? p ?? [];
}

export async function disableCompCode(compCodeId: string): Promise<CompCode> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/comp-codes/${compCodeId}/disable`, {
		method: 'POST',
	});
	if (!res.ok) await throwApiError(res, 'Failed to disable comp code');
	const data = await res.json();
	return data.data ?? data;
}

export interface RedeemCompCodeBody {
	code: string;
	eventId: string;
	ticketTypeId: string;
	attendeeEmail: string;
	attendeeName?: string;
	registrationToken?: string;
}

export interface RedeemCompCodeResponse {
	registrationId: string;
	transactionType: 'COMP_TICKET';
	registrationToken?: string;
	qrCode?: string;
	passcode?: string;
}

/**
 * Public attendee endpoint — auth is OPTIONAL. Server validates code +
 * email + ticket scope before creating the registration.
 */
export async function redeemCompCode(body: RedeemCompCodeBody): Promise<RedeemCompCodeResponse> {
	let res: Response;
	try {
		res = await authFetch(`${BASE_URL}/api/v1/payment/comp-codes/redeem`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
	} catch {
		res = await fetch(`${BASE_URL}/api/v1/payment/comp-codes/redeem`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
	}
	if (!res.ok) await throwApiError(res, 'Failed to redeem code');
	const data = await res.json();
	return data.data ?? data;
}
