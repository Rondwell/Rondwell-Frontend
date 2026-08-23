/**
 * GAP 5 — event budget.
 *
 * Wraps `/api/v1/events/:eventId/budget`. Gated on BUDGET_VIEW / BUDGET_MANAGE
 * server-side; deliberately unavailable to SUPPORT_MANAGER because the budget
 * exposes what the organizer agreed to pay each vendor.
 *
 * The differentiator is auto-reconciliation: a line item with
 * `autoCreated: true` (or an expense with a `transactionId`) came from a REAL
 * settled invoice. Those are read-only for `actualKobo` — the server refuses
 * to let the UI overwrite a number the ledger already knows.
 */

import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';

const EVENT_URL = import.meta.env.VITE_EVENT_API_URL;

export const BUDGET_CATEGORIES = [
	'VENUE',
	'CATERING',
	'DRINKS',
	'DECOR',
	'ENTERTAINMENT',
	'PHOTOGRAPHY',
	'RENTALS',
	'LOGISTICS',
	'GIFTS',
	'STAFF',
	'MARKETING',
	'OTHER'
] as const;

export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export interface BudgetLineItem {
	_id: string;
	eventId: string;
	budgetId: string;
	category: BudgetCategory;
	label: string;
	estimatedKobo: number;
	actualKobo: number;
	currency: string;
	vendorId?: string;
	collaborationId?: string;
	status: 'PLANNED' | 'COMMITTED' | 'PAID';
	paidAt?: string;
	notes?: string;
	sortOrder: number;
	/** True when the reconcile consumer created it from a settled invoice. */
	autoCreated: boolean;
}

export interface EventBudget {
	_id: string;
	eventId: string;
	currency: 'NGN' | 'USD';
	estimatedTotalKobo: number;
	expectedGuestCount?: number;
	status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
	totals: {
		estimatedKobo: number;
		committedKobo: number;
		paidKobo: number;
		/** SIGNED — negative means over budget. */
		varianceKobo: number;
	};
}

export interface BudgetSummary {
	totals: EventBudget['totals'];
	currency: string;
	expectedGuestCount: number | null;
	perGuestKobo: number | null;
	perGuestEstimatedKobo: number | null;
	byCategory: Array<{
		category: BudgetCategory;
		estimatedKobo: number;
		actualKobo: number;
		varianceKobo: number;
		count: number;
	}>;
}

function api(eventId: string) {
	return `${EVENT_URL}/api/v1/events/${eventId}/budget`;
}

/** Returns `{ budget: null }` when budgeting was never enabled — not an error. */
export async function getEventBudget(
	eventId: string
): Promise<{ budget: EventBudget | null; lineItems: BudgetLineItem[] }> {
	try {
		const res = await authFetch(api(eventId));
		if (!res.ok) return { budget: null, lineItems: [] };
		const data = await res.json();
		return { budget: data.budget ?? null, lineItems: data.lineItems ?? [] };
	} catch {
		return { budget: null, lineItems: [] };
	}
}

export async function createBudget(
	eventId: string,
	payload: { currency?: 'NGN' | 'USD'; expectedGuestCount?: number; estimatedTotalKobo?: number } = {}
): Promise<EventBudget> {
	const res = await authFetch(api(eventId), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) await throwApiError(res, 'Could not create the budget');
	const data = await res.json();
	return data.budget;
}

export async function updateBudget(
	eventId: string,
	patch: Partial<EventBudget>
): Promise<EventBudget> {
	const res = await authFetch(api(eventId), {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(patch)
	});
	if (!res.ok) await throwApiError(res, 'Could not update the budget');
	const data = await res.json();
	return data.budget;
}

export async function getBudgetSummary(eventId: string): Promise<BudgetSummary | null> {
	try {
		const res = await authFetch(`${api(eventId)}/summary`);
		if (!res.ok) return null;
		const data = await res.json();
		return data.summary ?? null;
	} catch {
		return null;
	}
}

export async function addBudgetLineItem(
	eventId: string,
	item: { label: string; category?: BudgetCategory; estimatedKobo?: number; notes?: string; vendorId?: string }
): Promise<BudgetLineItem> {
	const res = await authFetch(`${api(eventId)}/line-items`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(item)
	});
	if (!res.ok) await throwApiError(res, 'Could not add the line item');
	const data = await res.json();
	return data.lineItem;
}

export async function updateBudgetLineItem(
	eventId: string,
	lineItemId: string,
	patch: Partial<BudgetLineItem>
): Promise<BudgetLineItem> {
	const res = await authFetch(`${api(eventId)}/line-items/${lineItemId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(patch)
	});
	if (!res.ok) await throwApiError(res, 'Could not update the line item');
	const data = await res.json();
	return data.lineItem;
}

export async function deleteBudgetLineItem(eventId: string, lineItemId: string): Promise<void> {
	const res = await authFetch(`${api(eventId)}/line-items/${lineItemId}`, { method: 'DELETE' });
	// A 409 means the line came from a real payment. Surface that message —
	// it tells the organizer to re-categorise instead.
	if (!res.ok) await throwApiError(res, 'Could not remove the line item');
}

export async function reorderBudgetLineItems(eventId: string, orderedIds: string[]): Promise<void> {
	const res = await authFetch(`${api(eventId)}/line-items/reorder`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ orderedIds })
	});
	if (!res.ok) await throwApiError(res, 'Could not save the order');
}

export async function addBudgetExpense(
	eventId: string,
	lineItemId: string,
	expense: { amountKobo: number; paidAt?: string; reference?: string; receiptUrl?: string; note?: string }
): Promise<any> {
	const res = await authFetch(`${api(eventId)}/line-items/${lineItemId}/expenses`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(expense)
	});
	if (!res.ok) await throwApiError(res, 'Could not record the expense');
	const data = await res.json();
	return data.expense;
}

export async function getBudgetExpenses(eventId: string, lineItemId: string): Promise<any[]> {
	try {
		const res = await authFetch(`${api(eventId)}/line-items/${lineItemId}/expenses`);
		if (!res.ok) return [];
		const data = await res.json();
		return data.expenses ?? [];
	} catch {
		return [];
	}
}

export async function deleteBudgetExpense(eventId: string, expenseId: string): Promise<void> {
	const res = await authFetch(`${api(eventId)}/expenses/${expenseId}`, { method: 'DELETE' });
	if (!res.ok) await throwApiError(res, 'Could not remove the expense');
}

/** Streams a CSV download. The artifact an organizer takes to their accountant. */
export function budgetExportUrl(eventId: string): string {
	return `${api(eventId)}/export`;
}
