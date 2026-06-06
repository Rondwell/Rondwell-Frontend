/**
 * FE-P3-08 (NEW-10.3) — Attendee ticket / transfer service.
 *
 * Backend reference:
 *   GET    /api/v1/events/registrations/me                      — my tickets
 *   POST   /api/v1/events/registrations/:id/transfer            — initiate transfer
 *   POST   /api/v1/events/registrations/:id/transfer/cancel     — cancel transfer
 *   GET    /api/v1/events/registrations/:id/transfer/preview    — fee preview
 *
 * Transfer error codes the FE maps via `mapFinancialError`:
 *   - TICKET_REFUNDED            — refunded tickets cannot transfer
 *   - TICKET_REFUND_IN_PROGRESS  — same
 *   - TRANSFER_CUTOFF_PASSED     — last-minute block
 *   - 403 (allowResale = false)  — organizer disabled resale
 */

import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';

const EVENT_URL = import.meta.env.VITE_EVENT_API_URL;

export interface MyTicket {
	id: string;
	eventId: string;
	eventTitle: string;
	eventStartDate: string;
	ticketTypeId: string;
	ticketTypeName: string;
	currency: string;
	priceKobo: number;
	status: string; // ATTENDING / UNAPPROVED / REFUNDED / TRANSFERRED / etc.
	allowResale?: boolean;
	resalePlatformFeePercent?: number;
	transferCutoffHoursBeforeStart?: number;
	passcode?: string;
	qrCodeUrl?: string;
}

/** Fetch the authenticated user's tickets. Returns an empty array on failure so the UI can render an empty state. */
export async function getMyTickets(): Promise<MyTicket[]> {
	try {
		const res = await authFetch(`${EVENT_URL}/api/v1/events/registrations/me`);
		if (!res.ok) return [];
		const data = await res.json();
		const items = Array.isArray(data) ? data : data?.data ?? data?.items ?? [];
		return items as MyTicket[];
	} catch {
		return [];
	}
}

export async function getMyTicket(registrationId: string): Promise<MyTicket | null> {
	try {
		const res = await authFetch(
			`${EVENT_URL}/api/v1/events/registrations/me/${registrationId}`
		);
		if (!res.ok) return null;
		const data = await res.json();
		return data?.data ?? data ?? null;
	} catch {
		return null;
	}
}

export interface TransferPreview {
	platformFeeKobo: number;
	platformFeePercent: number;
	youReceiveKobo: number;
	currency: string;
}

export async function previewTicketTransfer(
	registrationId: string,
	resalePriceKobo: number
): Promise<TransferPreview> {
	const res = await authFetch(
		`${EVENT_URL}/api/v1/events/registrations/${registrationId}/transfer/preview`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ resalePriceKobo }),
		}
	);
	if (!res.ok) await throwApiError(res, 'Failed to preview transfer');
	const data = await res.json();
	const d = data?.data ?? data ?? {};
	return {
		platformFeeKobo: Number(d.platformFeeKobo ?? 0),
		platformFeePercent: Number(d.platformFeePercent ?? 0),
		youReceiveKobo: Number(d.youReceiveKobo ?? 0),
		currency: d.currency ?? 'NGN',
	};
}

export interface TransferRequest {
	recipientEmail: string;
	recipientName?: string;
	resalePriceKobo?: number;
	message?: string;
}

export async function transferTicket(
	registrationId: string,
	body: TransferRequest
): Promise<{ transferId: string; status: string }> {
	const res = await authFetch(
		`${EVENT_URL}/api/v1/events/registrations/${registrationId}/transfer`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		}
	);
	if (!res.ok) await throwApiError(res, 'Failed to transfer ticket');
	const data = await res.json();
	const d = data?.data ?? data ?? {};
	return { transferId: d.transferId ?? '', status: d.status ?? 'PENDING' };
}

export async function cancelTicketTransfer(registrationId: string): Promise<void> {
	const res = await authFetch(
		`${EVENT_URL}/api/v1/events/registrations/${registrationId}/transfer/cancel`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({}),
		}
	);
	if (!res.ok) await throwApiError(res, 'Failed to cancel transfer');
}
