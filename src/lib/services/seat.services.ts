/**
 * ════════════════════════════════════════════════════════════════════════
 *  SEAT HOLD / RELEASE
 * ════════════════════════════════════════════════════════════════════════
 *
 * Backend reference:
 *   POST /api/v1/events/:eventId/seats/:seatId/hold     → { holdToken, expiresAt }
 *   POST /api/v1/events/:eventId/seats/:seatId/release  (token-gated)
 *   POST /api/v1/events/:eventId/seats/hold-many        → { holds[], expiresAt }
 *
 * Hold lifecycle (10-minute TTL by default):
 *   AVAILABLE → RESERVED (this holder)   via /hold      — returns holdToken
 *   RESERVED  → AVAILABLE                 via /release   — token-gated
 *   RESERVED  → OCCUPIED                  via webhook on payment success
 *
 * ── The auth bug this file used to have ─────────────────────────────────
 *
 * This module called bare `fetch` with no Authorization header, and its
 * docblock asserted the endpoints "accept guest callers (no auth)". The
 * route required `authMiddleware` + `requireEventAccess`, so **every
 * hold returned 401** — including a signed-in attendee's. The picker
 * caught the failure and rendered it as "Someone else just picked that
 * seat", so a total outage of seat selection looked like ordinary
 * contention.
 *
 * Both halves are now fixed. The route accepts guests on public events
 * (`softAuthMiddleware` + `requireSeatHoldAccess`), and this module
 * sends whichever identity it actually has:
 *
 *   signed in → Bearer token; the server uses the verified user id
 *   guest     → `guestId` in the body
 *
 * `authFetch` is deliberately not used: it *throws* when no token is
 * stored, which is the normal state for the guest checkout these
 * endpoints exist to serve.
 *
 * Errors (all carry a `code`):
 *   409 SEAT_UNAVAILABLE  — genuine race, somebody else got it
 *   409 SEAT_SOLD         — already booked
 *   409 SEAT_BLOCKED      — withheld by the organizer
 *   404 SEAT_NOT_FOUND    — no such seat on this event
 *   429 TOO_MANY_HOLDS    — holder is at the concurrent-hold cap
 */

import { browser } from '$app/environment';

const EVENT_URL = import.meta.env.VITE_EVENT_API_URL;

export interface SeatHoldResponse {
	holdToken: string;
	expiresAt: string; // ISO-8601
	seatId: string;
	seatNumber?: string;
}

export interface SeatHoldError extends Error {
	code?: string;
	status?: number;
}

// ── Guest identity ─────────────────────────────────────────────────────

const GUEST_KEY = 'rondwell_seat_guest_id';

/**
 * A stable-per-tab id for an anonymous seat holder.
 *
 * Not a credential — it only groups one holder's holds so the server can
 * apply its concurrent-hold cap, and authority to release comes from the
 * server-minted `holdToken`. Claiming someone else's guest id therefore
 * grants nothing.
 *
 * `sessionStorage`, not `localStorage`: it must survive a page reload
 * mid-checkout but not outlive the visit. A permanent id would let a
 * returning visitor inherit a cap already spent weeks ago.
 *
 * The shape matches the server's `/^[A-Za-z0-9_-]{8,64}$/` check.
 */
export function getGuestHolderId(): string {
	if (!browser) return '';
	try {
		const existing = sessionStorage.getItem(GUEST_KEY);
		if (existing && /^[A-Za-z0-9_-]{8,64}$/.test(existing)) return existing;

		const bytes = new Uint8Array(16);
		crypto.getRandomValues(bytes);
		const id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
		sessionStorage.setItem(GUEST_KEY, id);
		return id;
	} catch {
		// Private browsing with storage disabled. Fall back to a
		// per-call id: the cap degrades to per-request, which is looser
		// than intended but never blocks a legitimate purchase.
		const bytes = new Uint8Array(16);
		crypto.getRandomValues(bytes);
		return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
	}
}

function storedToken(): string | null {
	if (!browser) return null;
	try {
		return localStorage.getItem('auth_token');
	} catch {
		return null;
	}
}

/**
 * POST with whatever identity is available.
 *
 * A stored token is attached when present; the guest id always rides in
 * the body. The server prefers the verified token identity, so a signed-in
 * caller cannot downgrade itself to dodge the per-user cap by also
 * sending a guest id.
 */
async function postWithIdentity(url: string, body: Record<string, unknown>): Promise<Response> {
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	const token = storedToken();
	if (token) headers.Authorization = `Bearer ${token}`;

	return await fetch(url, {
		method: 'POST',
		headers,
		body: JSON.stringify({ guestId: getGuestHolderId(), ...body })
	});
}

/** Build a typed error from a hold/release failure response. */
async function holdError(res: Response, fallback: string): Promise<SeatHoldError> {
	let body: any = null;
	try {
		body = await res.json();
	} catch {
		/* non-JSON body */
	}
	const err = new Error(body?.message || fallback) as SeatHoldError;
	err.code = body?.code;
	err.status = res.status;
	return err;
}

// ── Single seat ────────────────────────────────────────────────────────

/**
 * Place a hold on one seat.
 *
 * Throws a `SeatHoldError` whose `code` distinguishes a genuine race
 * from a sold seat, a blocked seat, an unknown seat id, or the holder's
 * own cap. The picker shows different copy for each — previously all
 * five produced the same "someone else took it", which sent attendees
 * hunting for a seat that was never purchasable.
 */
export async function holdSeat(eventId: string, seatId: string): Promise<SeatHoldResponse> {
	const res = await postWithIdentity(
		`${EVENT_URL}/api/v1/events/${eventId}/seats/${seatId}/hold`,
		{}
	);
	if (!res.ok) throw await holdError(res, 'This seat is no longer available.');

	const data = await res.json();
	const d = data?.data ?? data ?? {};
	return {
		holdToken: d.holdToken ?? '',
		expiresAt: d.expiresAt ?? new Date(Date.now() + 10 * 60_000).toISOString(),
		seatId: d.seatId ?? seatId,
		seatNumber: d.seatNumber
	};
}

/**
 * Release a hold. Idempotent — releasing an already-released seat is a
 * no-op on the server.
 *
 * Deliberately swallows failures: release is best-effort and the
 * server's hold expiry is the authoritative cleanup. Surfacing an error
 * here would block the UI from moving on when the user simply changed
 * their mind.
 */
export async function releaseHold(
	eventId: string,
	seatId: string,
	holdToken: string
): Promise<void> {
	if (!holdToken) return;
	try {
		await postWithIdentity(`${EVENT_URL}/api/v1/events/${eventId}/seats/${seatId}/release`, {
			holdToken
		});
	} catch {
		/* best-effort */
	}
}

/**
 * Release on page unload.
 *
 * `fetch` is cancelled when the document goes away, so an attendee who
 * closes the tab mid-checkout leaves a zombie hold for the full window.
 * `sendBeacon` survives unload. It cannot set an Authorization header,
 * which is fine: release is authorised by the `holdToken` in the body.
 *
 * Returns false when the beacon could not be queued, so the caller can
 * fall back to a normal release during a soft navigation.
 */
export function releaseHoldOnUnload(
	eventId: string,
	seatId: string,
	holdToken: string
): boolean {
	if (!browser || !holdToken || typeof navigator.sendBeacon !== 'function') return false;
	try {
		return navigator.sendBeacon(
			`${EVENT_URL}/api/v1/events/${eventId}/seats/${seatId}/release`,
			new Blob([JSON.stringify({ holdToken, guestId: getGuestHolderId() })], {
				type: 'application/json'
			})
		);
	} catch {
		return false;
	}
}

// ── Multiple seats ─────────────────────────────────────────────────────

export interface MultiHoldResponse {
	holds: Array<{ seatId: string; seatNumber: string; holdToken: string }>;
	expiresAt: string;
}

/**
 * Hold several seats for one party, all or nothing.
 *
 * The server releases any partial set before throwing, so a failed call
 * leaves no seats held. Group registration needs that: a party of four
 * given three seats has to start over, and the fourth would otherwise
 * sit held against nobody for ten minutes.
 */
export async function holdSeats(
	eventId: string,
	seatIds: string[],
	holdSeconds?: number
): Promise<MultiHoldResponse> {
	const res = await postWithIdentity(`${EVENT_URL}/api/v1/events/${eventId}/seats/hold-many`, {
		seatIds,
		...(holdSeconds ? { holdSeconds } : {})
	});
	if (!res.ok) throw await holdError(res, 'Those seats are no longer available together.');

	const data = await res.json();
	return {
		holds: data?.holds ?? [],
		expiresAt: data?.expiresAt ?? new Date(Date.now() + 10 * 60_000).toISOString()
	};
}

/** Release every hold in a set. Best-effort, in parallel. */
export async function releaseHolds(
	eventId: string,
	holds: Array<{ seatId: string; holdToken: string }>
): Promise<void> {
	await Promise.allSettled(holds.map((h) => releaseHold(eventId, h.seatId, h.holdToken)));
}

// ── Copy ───────────────────────────────────────────────────────────────

/**
 * Attendee-facing copy per failure code.
 *
 * Each case tells the attendee something different about what to do
 * next, which is the point of having distinct codes: "pick another" and
 * "this one was never for sale" are not the same instruction.
 */
export function seatHoldErrorCopy(err: SeatHoldError | null | undefined): string {
	switch (err?.code) {
		case 'SEAT_SOLD':
			return 'That seat has already been booked. Please choose another.';
		case 'SEAT_BLOCKED':
			return err.message || 'That seat is not available for sale.';
		case 'SEAT_NOT_FOUND':
			return 'That seat is not part of this event’s seating plan. Try refreshing the map.';
		case 'TOO_MANY_HOLDS':
			return (
				err.message ||
				'You are holding the maximum number of seats. Release one before choosing another.'
			);
		case 'SEAT_UNAVAILABLE':
			return 'Someone else just picked that seat. Please choose another.';
		case 'HOLDER_REQUIRED':
			return 'We could not identify your session. Please reload the page and try again.';
		default:
			return err?.message || 'We could not hold that seat. Please try again.';
	}
}
