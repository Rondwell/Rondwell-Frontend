/**
 * FE-P3-04 (NEW-1.3) — Seat hold / release service.
 *
 * Backend reference:
 *   POST /api/v1/events/:eventId/seats/:seatId/hold     → { holdToken, expiresAt }
 *   POST /api/v1/events/:eventId/seats/:seatId/release  (token-gated)
 *
 * Hold lifecycle (10-minute TTL by default):
 *   AVAILABLE → HELD (this user)            via /hold     — returns holdToken
 *   HELD      → AVAILABLE                    via /release  — token-gated
 *   HELD      → OCCUPIED                     via webhook on payment success
 *
 * Errors:
 *   409 SEAT_UNAVAILABLE — another user grabbed the seat first
 *
 * The endpoints accept guest callers (no auth) so the public registration
 * modal can hold a seat before the user signs up.
 */

import { throwApiError } from '$lib/utils/errorMessage';

const EVENT_URL = import.meta.env.VITE_EVENT_API_URL;

export interface SeatHoldResponse {
	holdToken: string;
	expiresAt: string; // ISO-8601
	seatId: string;
}

/**
 * Place a 10-minute hold on a seat. Throws on 409 with `code:
 * 'SEAT_UNAVAILABLE'` so callers can map to specific copy via
 * `mapFinancialError`.
 */
export async function holdSeat(eventId: string, seatId: string): Promise<SeatHoldResponse> {
	const res = await fetch(`${EVENT_URL}/api/v1/events/${eventId}/seats/${seatId}/hold`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({}),
	});
	if (!res.ok) await throwApiError(res, 'This seat is no longer available.');
	const data = await res.json();
	const d = data?.data ?? data ?? {};
	return {
		holdToken: d.holdToken ?? '',
		expiresAt: d.expiresAt ?? new Date(Date.now() + 10 * 60_000).toISOString(),
		seatId: d.seatId ?? seatId,
	};
}

/**
 * Release a hold. Idempotent — calling it for an already-released seat is
 * a no-op on the server.
 */
export async function releaseHold(eventId: string, seatId: string, holdToken: string): Promise<void> {
	if (!holdToken) return; // nothing to release
	try {
		await fetch(`${EVENT_URL}/api/v1/events/${eventId}/seats/${seatId}/release`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ holdToken }),
		});
	} catch {
		// Swallow — release is best-effort. The 10-minute TTL is the
		// authoritative cleanup mechanism on the backend.
	}
}
