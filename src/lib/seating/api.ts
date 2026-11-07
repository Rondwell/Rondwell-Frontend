/**
 * Seating API client.
 *
 * Typed wrappers for the seat-layout and seat endpoints. Kept beside the
 * rest of the seating domain rather than in the 1,000-line
 * `event.services.ts` because these calls carry structured results the
 * builder renders directly — a publish returns a materialization report,
 * not just an ok.
 */

import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';
import type {
	SeatLayout,
	MaterializationReport,
	InventorySummary,
	PublicSeatMap,
	Seat
} from './types';

const EVENT_URL = import.meta.env.VITE_EVENT_API_URL;

/**
 * NOTE on the env var: `VITE_EVENT_API_URL` is the only prefix this app
 * ever has at runtime. A `PUBLIC_`/`PRIVATE_`-prefixed lookup silently
 * resolves to undefined and the request falls back to localhost, which
 * has caused login-loop outages here before. Do not rename it.
 */

function layoutBase(eventId: string): string {
	return `${EVENT_URL}/api/v1/events/${eventId}/seat-layouts`;
}

function seatBase(eventId: string): string {
	return `${EVENT_URL}/api/v1/events/${eventId}/seats`;
}

// ── Publish errors carry a report ──────────────────────────────────────

/**
 * A 422 from publish, or a 400 from validation, with the server's
 * structured detail attached.
 *
 * `throwApiError` flattens a body to a message string, which is right
 * for a toast and wrong here: the organizer needs the list of duplicate
 * labels, not "Materialization failed". The builder renders
 * `report`/`issues` as an actionable checklist.
 */
export class PublishValidationError extends Error {
	report: MaterializationReport | null;
	issues: Array<{ path: string; message: string }> | null;
	code: string;
	constructor(
		message: string,
		code: string,
		report: MaterializationReport | null,
		issues: Array<{ path: string; message: string }> | null
	) {
		super(message);
		this.name = 'PublishValidationError';
		this.code = code;
		this.report = report;
		this.issues = issues;
	}
}

/** Parse a layout-mutation failure, preserving structured detail. */
async function throwLayoutError(res: Response, fallback: string): Promise<never> {
	let body: any = null;
	try {
		body = await res.clone().json();
	} catch {
		/* fall through to the generic path */
	}

	if (body && (body.report || body.issues)) {
		throw new PublishValidationError(
			body.message || fallback,
			body.code || 'INVALID_LAYOUT',
			body.report ?? null,
			body.issues ?? null
		);
	}

	await throwApiError(res, fallback);
	// `throwApiError` always throws; this satisfies the `never` return.
	throw new Error(fallback);
}

// ── Layouts ────────────────────────────────────────────────────────────

export async function listLayouts(eventId: string): Promise<SeatLayout[]> {
	const res = await authFetch(layoutBase(eventId));
	if (!res.ok) await throwApiError(res, 'Could not load your seating designs.');
	return (await res.json()) as SeatLayout[];
}

export async function getLayout(eventId: string, layoutId: string): Promise<SeatLayout> {
	const res = await authFetch(`${layoutBase(eventId)}/${layoutId}`);
	if (!res.ok) await throwApiError(res, 'Could not load that seating design.');
	return (await res.json()) as SeatLayout;
}

export type LayoutWritePayload = Partial<
	Pick<
		SeatLayout,
		| 'title'
		| 'layoutType'
		| 'canvasWidth'
		| 'canvasHeight'
		| 'elements'
		| 'seatTypes'
		| 'numbering'
		| 'stageView'
		| 'defaultView'
		| 'thumbnail'
	>
>;

export async function createLayout(
	eventId: string,
	payload: LayoutWritePayload & { title: string }
): Promise<SeatLayout> {
	const res = await authFetch(layoutBase(eventId), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) await throwLayoutError(res, 'Could not create the seating design.');
	return (await res.json()) as SeatLayout;
}

export async function updateLayout(
	eventId: string,
	layoutId: string,
	payload: LayoutWritePayload
): Promise<SeatLayout> {
	const res = await authFetch(`${layoutBase(eventId)}/${layoutId}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) await throwLayoutError(res, 'Could not save the seating design.');
	return (await res.json()) as SeatLayout;
}

/**
 * Validate without writing. Safe to call on a debounce — the organizer
 * sees problems while editing rather than at publish time.
 *
 * Returns the report on success *and* on a 422: an unpublishable design
 * is the normal case for this call, so a rejected promise would make
 * every caller wrap it in try/catch just to read the errors.
 */
export async function previewPublish(
	eventId: string,
	layoutId: string
): Promise<MaterializationReport> {
	const res = await authFetch(`${layoutBase(eventId)}/${layoutId}/preview-publish`, {
		method: 'POST'
	});

	if (res.ok) return (await res.json()) as MaterializationReport;

	let body: any = null;
	try {
		body = await res.clone().json();
	} catch {
		/* ignore */
	}
	if (body?.report) return body.report as MaterializationReport;

	await throwLayoutError(res, 'Could not validate the seating design.');
	throw new Error('unreachable');
}

/** Materializes inventory then publishes. Throws `PublishValidationError` on a bad design. */
export async function publishLayout(
	eventId: string,
	layoutId: string
): Promise<SeatLayout & { report: MaterializationReport }> {
	const res = await authFetch(`${layoutBase(eventId)}/${layoutId}/publish`, {
		method: 'PATCH'
	});
	if (!res.ok) await throwLayoutError(res, 'Could not publish the seating design.');
	return (await res.json()) as SeatLayout & { report: MaterializationReport };
}

export async function deleteLayout(eventId: string, layoutId: string): Promise<void> {
	const res = await authFetch(`${layoutBase(eventId)}/${layoutId}`, { method: 'DELETE' });
	if (!res.ok) await throwLayoutError(res, 'Could not delete the seating design.');
}

export async function getInventorySummary(eventId: string): Promise<InventorySummary> {
	const res = await authFetch(`${layoutBase(eventId)}/inventory-summary`);
	if (!res.ok) await throwApiError(res, 'Could not load seat inventory.');
	return (await res.json()) as InventorySummary;
}

// ── Organizer seat operations ──────────────────────────────────────────

/** Withhold seats from sale, or return them. */
export async function setSeatsBlocked(
	eventId: string,
	seatIds: string[],
	blocked: boolean,
	reason?: string
): Promise<{ updated: number; skipped: string[]; message: string }> {
	const res = await authFetch(`${seatBase(eventId)}/block`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ seatIds, blocked, reason })
	});
	if (!res.ok) await throwApiError(res, 'Could not update those seats.');
	return await res.json();
}

export async function listSeats(eventId: string): Promise<Seat[]> {
	const res = await authFetch(seatBase(eventId));
	if (!res.ok) await throwApiError(res, 'Could not load seats.');
	return (await res.json()) as Seat[];
}

// ── Attendee-facing (no auth) ──────────────────────────────────────────

/**
 * The public seat map. Unauthenticated by design — the registration
 * modal runs for guests.
 */
export async function getPublicSeatMap(
	eventId: string,
	ticketTypeId?: string
): Promise<PublicSeatMap> {
	const url = ticketTypeId
		? `${EVENT_URL}/api/v1/events/${eventId}/public/seats?ticketTypeId=${encodeURIComponent(ticketTypeId)}`
		: `${EVENT_URL}/api/v1/events/${eventId}/public/seats`;
	const res = await fetch(url);
	if (!res.ok) return { layout: null, seats: [] };
	return (await res.json()) as PublicSeatMap;
}

export interface BestAvailableResult {
	requested: number;
	found: number;
	/** True when the suggestion could not be seated together. */
	split: boolean;
	seats: Array<
		Pick<
			Seat,
			| 'seatId'
			| 'seatNumber'
			| 'rowLabel'
			| 'seatIndex'
			| 'section'
			| 'ticketTypeId'
			| 'seatTypeId'
			| 'x'
			| 'y'
			| 'z'
		>
	>;
}

/**
 * Ask the server for the best `quantity` seats together.
 *
 * Suggest-only: nothing is held until the attendee confirms, so a
 * browsing visitor cannot tie up inventory just by changing the party
 * size.
 */
export async function getBestAvailable(
	eventId: string,
	quantity: number,
	opts: { ticketTypeId?: string; seatTypeId?: string } = {}
): Promise<BestAvailableResult> {
	const params = new URLSearchParams({ quantity: String(quantity) });
	if (opts.ticketTypeId) params.set('ticketTypeId', opts.ticketTypeId);
	if (opts.seatTypeId) params.set('seatTypeId', opts.seatTypeId);

	const res = await fetch(`${seatBase(eventId)}/best-available?${params.toString()}`);
	if (!res.ok) return { requested: quantity, found: 0, split: false, seats: [] };
	return (await res.json()) as BestAvailableResult;
}
