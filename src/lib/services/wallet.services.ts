import { authFetch } from '$lib/services/api.client';

import { throwApiError } from '$lib/utils/errorMessage';
const BASE_URL = import.meta.env.VITE_API_URL;

// ==================== WALLET ====================

export async function getWalletBalance(): Promise<any> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/wallet/balance`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch wallet balance');
	const data = await res.json();
	return data.data ?? data;
}

// ==================== BANK / BENEFICIARY ====================

export async function getBankList(): Promise<any[]> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/transaction/bank/`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch bank list');
	const data = await res.json();
	return data.data ?? data ?? [];
}

export async function resolveBankAccount(accountNumber: string, bankCode: string): Promise<any> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/transaction/bank/resolve-account/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ accountNumber, bankCode })
	});
	if (!res.ok) await throwApiError(res, 'Failed to resolve bank account');
	const data = await res.json();
	return data.data ?? data;
}

export async function addBankAccount(accountNumber: string, bankCode: string, bankName: string): Promise<any> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/beneficiary/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ accountNumber, bankCode, bankName })
	});
	if (!res.ok) await throwApiError(res, 'Failed to add bank account');
	const data = await res.json();
	return data.data ?? data;
}

export async function getBankAccounts(): Promise<any[]> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/beneficiary/`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch bank accounts');
	const data = await res.json();
	return data.data ?? data ?? [];
}

export async function removeBankAccount(beneficiaryId: string): Promise<void> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/beneficiary/${beneficiaryId}/`, {
		method: 'DELETE'
	});
	if (!res.ok) await throwApiError(res, 'Failed to remove bank account');
}

// ==================== WITHDRAWAL ====================

export async function requestWithdrawalOtp(amount: number): Promise<void> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/wallet/withdrawal/request-otp`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ amount })
	});
	if (!res.ok) await throwApiError(res, 'Failed to send OTP');
	const data = await res.json();
}

export async function verifyWithdrawalOtp(
	otp: string,
	amount: number,
	currency: string,
	beneficiaryId: string
): Promise<any> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/wallet/withdrawal/verify-otp`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ otp, amount, currency, beneficiaryId })
	});
	if (!res.ok) await throwApiError(res, 'Withdrawal failed');
	const data = await res.json();
	return data;
}

export async function withdrawFunds(
	amount: number,
	currency: string,
	beneficiaryId: string,
	userPin: string
): Promise<any> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/transaction/disbursement/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ amount, currency, beneficiaryId, userPin, reason: 'Wallet withdrawal' })
	});
	if (!res.ok) await throwApiError(res, 'Withdrawal failed');
	const data = await res.json();
	return data;
}

// ==================== TRANSACTIONS ====================

export async function getEarningsSummary(): Promise<any[]> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/wallet/earnings-summary`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch earnings summary');
	const data = await res.json();
	return data.data ?? [];
}

export async function getUserTransactions(options?: {
	skip?: number;
	limit?: number;
	status?: string;
	type?: string;
	startDate?: string;
	endDate?: string;
}): Promise<any> {
	const params = new URLSearchParams();
	if (options?.skip !== undefined) params.set('skip', String(options.skip));
	if (options?.limit !== undefined) params.set('limit', String(options.limit));
	if (options?.status) params.set('status', options.status);
	if (options?.type) params.set('type', options.type);
	if (options?.startDate) params.set('startDate', options.startDate);
	if (options?.endDate) params.set('endDate', options.endDate);

	const res = await authFetch(`${BASE_URL}/api/v1/payment/transaction/list?${params.toString()}`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch transactions');
	const data = await res.json();
	return data;
}

// ==================== EVENT EARNINGS ====================

export async function getEventEarnings(
	eventId: string,
	options?: {
		skip?: number;
		limit?: number;
		status?: string;
		search?: string;
		startDate?: string;
		endDate?: string;
	}
): Promise<any> {
	const params = new URLSearchParams();
	if (options?.skip !== undefined) params.set('skip', String(options.skip));
	if (options?.limit !== undefined) params.set('limit', String(options.limit));
	if (options?.status) params.set('status', options.status);
	if (options?.search) params.set('search', options.search);
	if (options?.startDate) params.set('startDate', options.startDate);
	if (options?.endDate) params.set('endDate', options.endDate);

	const res = await authFetch(
		`${BASE_URL}/api/v1/payment/transaction/event/${eventId}/earnings?${params.toString()}`
	);
	if (!res.ok) await throwApiError(res, 'Failed to fetch event earnings');
	const data = await res.json();
	return data;
}

// ==================== SUBSCRIPTION ====================

export async function getUserSubscriptionInfo(): Promise<{ tier: string; feeRate: number; feePercent: number; withdrawalFeeRate: number; withdrawalFeeCap: number }> {
	try {
		const res = await authFetch(`${BASE_URL}/api/v1/payment/subscription/my-tier`);
		if (!res.ok) await throwApiError(res, 'Failed to fetch subscription info');
		const data = await res.json();
		const d = data.data ?? {};
		return {
			tier: d.tier ?? 'FREE',
			feeRate: d.feeRate ?? 0.06,
			feePercent: d.feePercent ?? 6,
			withdrawalFeeRate: d.withdrawalFeeRate ?? 0.03,
			withdrawalFeeCap: d.withdrawalFeeCap ?? 500
		};
	} catch {
		return { tier: 'FREE', feeRate: 0.06, feePercent: 6, withdrawalFeeRate: 0.03, withdrawalFeeCap: 500 };
	}
}
