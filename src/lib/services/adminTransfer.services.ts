/**
 * Admin-assisted wallet → bank transfers (HQ → admin-service).
 *
 * Support flow for when a user cannot complete a withdrawal themselves. Every
 * call goes to admin-service, which verifies the admin JWT, enforces the
 * `super_admin` role on anything that moves money, and forwards the acting
 * admin's identity to payment-service. The browser holds no internal keys.
 *
 * The two-step shape (`initiate` then `confirm`) is the OTP challenge: the
 * code is emailed to the acting admin and authorises exactly one
 * (user, amount, destination) triple.
 */
import { browser } from '$app/environment';
import { throwApiError } from '$lib/utils/errorMessage';

const API_URL = import.meta.env.VITE_API_URL;
const BASE = `${API_URL}/api/v1/admin/finance/transfers`;

export type TransferStatus =
	| 'PENDING_OTP'
	| 'PROCESSING'
	| 'COMPLETED'
	| 'FAILED'
	| 'REVERSED'
	| 'CANCELLED'
	| 'EXPIRED';

export interface AdminTransfer {
	id: string;
	_id?: string;
	userId: string;
	userEmail: string;
	userName?: string;
	amountKobo: number;
	currency: string;
	destination: {
		accountNumber: string;
		accountNumberMasked: string;
		accountName: string;
		bankCode: string;
		bankName: string;
	};
	reason: string;
	status: TransferStatus;
	failureReason?: string | null;
	initiatedByAdminEmail: string;
	confirmedAt?: string | null;
	reference?: string | null;
	balanceSnapshot?: WalletSnapshot | null;
	createdAt: string;
	updatedAt: string;
}

export interface WalletSnapshot {
	balanceKobo: number;
	reservedKobo: number;
	disputedKobo: number;
	payoutReserveKobo: number;
	withdrawableKobo: number;
	currency?: string;
	walletId?: string;
	status?: string;
	/**
	 * Identity of the wallet owner, resolved by admin-service from the user
	 * database. Present so the operator can confirm WHOSE money they are about
	 * to move rather than trusting a pasted ObjectId.
	 */
	userName?: string;
	userEmail?: string;
	userStatus?: string;
	/** False when the id resolved to no user row at all. */
	userFound?: boolean;
}

export interface Bank {
	name: string;
	code: string;
}

function authHeaders(): Headers {
	const headers = new Headers({ 'Content-Type': 'application/json' });
	const token = browser ? localStorage.getItem('admin_token') : null;
	if (!token) throw new Error('Not authenticated');
	headers.set('Authorization', `Bearer ${token}`);
	return headers;
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
	const res = await fetch(`${BASE}${path}`, { ...options, headers: authHeaders() });

	if (res.status === 401 && browser) {
		localStorage.removeItem('admin_token');
		localStorage.removeItem('admin_user');
		window.location.href = '/hq/login';
		throw new Error('Session expired');
	}

	if (!res.ok) {
		// Surface the backend's structured `code` (OTP_INVALID,
		// AMOUNT_EXCEEDS_WITHDRAWABLE, …) so the UI can react specifically
		// rather than only showing a message.
		let body: any = null;
		try {
			body = await res.clone().json();
		} catch {
			/* fall through to the generic handler */
		}
		if (body?.code) {
			const err: any = new Error(body.message || 'Request failed');
			err.code = body.code;
			err.meta = body.meta;
			throw err;
		}
		await throwApiError(res, 'Request failed');
	}

	return res.json();
}

/**
 * Banks for the destination picker.
 *
 * Shape handling mirrors `PaymentMethods.svelte` (the user-facing bank picker
 * that has been working in production): the payload has arrived as both a bare
 * array and a `{ data: [...] }` envelope depending on the layer, and the field
 * names have appeared as both `name`/`code` and `bankName`/`bankCode`. Being
 * permissive here is what stops one upstream change emptying the dropdown.
 */
export async function getBanks(): Promise<Bank[]> {
	const payload = await request('/banks');
	const list = Array.isArray(payload) ? payload : (payload?.data ?? []);
	return list
		.map((b: any) => ({
			name: String(b?.name ?? b?.bankName ?? ''),
			code: String(b?.code ?? b?.bankCode ?? '')
		}))
		.filter((b: Bank) => b.name && b.code)
		.sort((a: Bank, b: Bank) => a.name.localeCompare(b.name));
}

/**
 * Preview the account holder's name before committing to a transfer.
 *
 * Returns the echoed `accountNumber`/`bankCode` alongside the name so the
 * caller can drop a response that has been overtaken by newer input.
 */
export async function resolveAccount(
	accountNumber: string,
	bankCode: string
): Promise<{ accountName: string; accountNumber: string; bankCode: string }> {
	const payload = await request('/resolve-account', {
		method: 'POST',
		body: JSON.stringify({ accountNumber, bankCode })
	});
	const d = payload?.data ?? payload;
	return {
		accountName: String(d?.accountName ?? d?.account_name ?? ''),
		accountNumber: String(d?.accountNumber ?? accountNumber),
		bankCode: String(d?.bankCode ?? bankCode)
	};
}

/** Total / reserved / disputed / held / withdrawable for a user's wallet. */
export async function getWalletSnapshot(
	userId: string,
	currency = 'NGN'
): Promise<WalletSnapshot> {
	const data = await request(`/wallet/${encodeURIComponent(userId)}?currency=${currency}`);
	return data.data;
}

/**
 * Step 1. Validates the amount against the withdrawable balance, resolves the
 * destination with the bank, and emails an authorisation code to you.
 * Nothing is debited at this point.
 */
export async function initiateTransfer(body: {
	userId: string;
	amount: number;
	currency?: string;
	accountNumber: string;
	bankCode: string;
	reason: string;
	idempotencyKey?: string;
}): Promise<AdminTransfer> {
	const data = await request('/initiate', { method: 'POST', body: JSON.stringify(body) });
	return data.data;
}

/** Step 2. Verifies the code and sends the money. */
export async function confirmTransfer(transferId: string, otp: string): Promise<AdminTransfer> {
	const data = await request(`/${transferId}/confirm`, {
		method: 'POST',
		body: JSON.stringify({ otp })
	});
	return data.data;
}

export async function resendTransferOtp(transferId: string): Promise<{ expiresAt: string }> {
	const data = await request(`/${transferId}/resend-otp`, { method: 'POST', body: '{}' });
	return data.data;
}

export async function cancelTransfer(transferId: string): Promise<AdminTransfer> {
	const data = await request(`/${transferId}/cancel`, { method: 'POST', body: '{}' });
	return data.data;
}

export async function listTransfers(
	params: { skip?: number; limit?: number; status?: string; search?: string; userId?: string } = {}
): Promise<{ items: AdminTransfer[]; total: number; skip: number; limit: number }> {
	const query = new URLSearchParams(
		Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '') as [
			string,
			string
		][]
	).toString();
	const data = await request(`/?${query}`);
	return data.data;
}

export async function getTransfer(transferId: string): Promise<AdminTransfer> {
	const data = await request(`/${transferId}`);
	return data.data;
}

// ── Presentation helpers ─────────────────────────────────────────────────

/** Kobo → "₦1,234.56". All monetary values from this API are integer kobo. */
export function formatKobo(kobo: number, currency = 'NGN'): string {
	const symbol = currency === 'USD' ? '$' : '₦';
	return `${symbol}${(Number(kobo || 0) / 100).toLocaleString('en-NG', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})}`;
}

export const STATUS_STYLES: Record<TransferStatus, { label: string; class: string }> = {
	PENDING_OTP: { label: 'Awaiting code', class: 'bg-amber-50 text-amber-700 ring-amber-200' },
	PROCESSING: { label: 'Processing', class: 'bg-blue-50 text-blue-700 ring-blue-200' },
	COMPLETED: { label: 'Completed', class: 'bg-green-50 text-green-700 ring-green-200' },
	FAILED: { label: 'Failed', class: 'bg-red-50 text-red-700 ring-red-200' },
	REVERSED: { label: 'Reversed', class: 'bg-orange-50 text-orange-700 ring-orange-200' },
	CANCELLED: { label: 'Cancelled', class: 'bg-gray-100 text-gray-600 ring-gray-200' },
	EXPIRED: { label: 'Expired', class: 'bg-gray-100 text-gray-600 ring-gray-200' }
};
