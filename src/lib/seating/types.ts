/**
 * Seating domain types, shared by the organizer builder, the 2D
 * renderer, the 3D renderer and the attendee picker.
 *
 * These mirror the event service's `seat-layout.model.ts` and
 * `seat.model.ts`. They are intentionally structural rather than
 * generated: the four consumers above all want slightly different
 * subsets, and `any` was what previously let the builder write
 * `seatCount` while nothing read it and the picker read a `'HELD'`
 * status the backend could never produce.
 */

// ── Elements ───────────────────────────────────────────────────────────

/** Element kinds that expand into bookable seats. */
export const SEAT_GENERATING_TYPES = [
	'SEAT',
	'SEAT_ROW',
	'SEAT_BLOCK',
	'SEAT_ARC',
	'ROUND_TABLE',
	'SQUARE_TABLE',
	'CHAIR',
	'BIG_CHAIR'
] as const;

/** Venue furniture. Renders, orients the attendee, never sells. */
export const FIXTURE_TYPES = [
	'STAGE',
	'SCREEN',
	'DANCEFLOOR',
	'BAR',
	'BUFFET',
	'DOOR',
	'ENTRANCE',
	'EXIT',
	'RESTROOM',
	'AISLE',
	'WALL',
	'PILLAR',
	'BOOTH'
] as const;

export const ANNOTATION_TYPES = [
	'TEXT',
	'RECTANGLE',
	'CIRCLE',
	'TRIANGLE',
	'POLYGON',
	'STRAIGHT',
	'SQUARE'
] as const;

export type SeatElementType =
	| (typeof SEAT_GENERATING_TYPES)[number]
	| (typeof FIXTURE_TYPES)[number]
	| (typeof ANNOTATION_TYPES)[number];

const SEAT_GENERATING_SET = new Set<string>(SEAT_GENERATING_TYPES);
const FIXTURE_SET = new Set<string>(FIXTURE_TYPES);

export function isSeatGenerating(type: string): boolean {
	return SEAT_GENERATING_SET.has(type);
}

export function isFixture(type: string): boolean {
	return FIXTURE_SET.has(type);
}

/** Element kinds whose seat count comes from rows × cols. */
export function isMultiSeat(type: string): boolean {
	return (
		type === 'SEAT_ROW' ||
		type === 'SEAT_BLOCK' ||
		type === 'SEAT_ARC' ||
		type === 'ROUND_TABLE' ||
		type === 'SQUARE_TABLE'
	);
}

export interface SeatNumbering {
	rowLabelStyle?: 'ALPHA' | 'ALPHA_LOWER' | 'NUMERIC';
	rowLabelStart?: string;
	rowOrder?: 'ASC' | 'DESC';
	skipLabels?: string[];
	seatNumberStart?: number;
	seatOrder?: 'LTR' | 'RTL';
	seatStep?: number;
	pattern?: string;
}

/**
 * A single seat's departure from what its element would otherwise
 * generate, keyed by `seatKey` ("rowIdx:colIdx").
 *
 * A block is parametric — `rows × cols` with one pitch and one tier —
 * which is what makes it fast to author. But real venues are not
 * uniform: one seat in the middle is a wheelchair space, four at the end
 * of a row are premium, two behind a pillar do not exist, one is pulled
 * out of line to clear a doorway.
 *
 * Without overrides the only way to express any of that is to explode
 * the block into individual seats, which throws away the parametric
 * structure and makes the next edit miserable. The override map keeps
 * the block intact and records only the exceptions.
 *
 * `undefined` and `null` differ for `seatTypeId`: absent means "inherit
 * the element's tier", `null` means "explicitly no tier".
 */
export interface SeatOverride {
	seatTypeId?: string | null;
	/** Suppressed — generates no seat at all. */
	removed?: boolean;
	/** Replaces the generated label outright. */
	label?: string;
	/** Nudge from the generated position, in world units. */
	dx?: number;
	dy?: number;
}

export interface LayoutElement {
	id: string;
	type: SeatElementType;

	x: number;
	y: number;
	width: number;
	height: number;
	z?: number;
	rotation?: number;

	rows?: number;
	cols?: number;
	seatSpacing?: number;
	rowSpacing?: number;
	seatSize?: number;
	elevationStep?: number;
	curvature?: number;
	aisleAfter?: number[];
	/**
	 * @deprecated Superseded by `seatOverrides[key].removed`, which can
	 * carry the rest of a seat's exceptions too. Still honoured on read so
	 * layouts saved before overrides existed keep their removed seats.
	 */
	removedSeats?: string[];
	/** Per-seat exceptions, keyed by "rowIdx:colIdx". */
	seatOverrides?: Record<string, SeatOverride>;

	seatTypeId?: string | null;
	section?: string;
	rowLabel?: string;
	numbering?: SeatNumbering;

	label?: string;
	color?: string;
	locked?: boolean;
	zIndex?: number;
	model?: 'CHAIR' | 'ARMCHAIR' | 'BENCH' | 'STOOL' | 'SOFA';

	// Legacy fields kept so layouts saved by the previous builder
	// round-trip unchanged rather than losing data on first save.
	seatNumber?: string;
	ticketTypeId?: string;
	ticketColor?: string;
	seatCount?: number;
	row?: string;
}

// ── Seat types ─────────────────────────────────────────────────────────

export interface SeatType {
	seatTypeId: string;
	name: string;
	color: string;
	ticketTypeId?: string | null;
	priceOverride?: number | null;
	isAccessible?: boolean;
	isCompanion?: boolean;
	description?: string;
	rank?: number;
}

// ── 3D framing ─────────────────────────────────────────────────────────

export interface StageView {
	cameraX?: number;
	cameraY?: number;
	cameraZ?: number;
	targetX?: number;
	targetY?: number;
	targetZ?: number;
	floor?: 'CARPET' | 'WOOD' | 'CONCRETE' | 'GRASS' | 'NONE';
	environment?: 'INDOOR' | 'OUTDOOR_DAY' | 'OUTDOOR_NIGHT' | 'STUDIO';
	showRoof?: boolean;
}

// ── Layout ─────────────────────────────────────────────────────────────

export type LayoutType =
	| 'STADIUM'
	| 'THEATRE'
	| 'ROUND_TABLE'
	| 'CONFERENCE'
	| 'CLASSROOM'
	| 'BANQUET'
	| 'GENERAL_ADMISSION'
	| 'CUSTOM';

export interface SeatLayout {
	layoutId: string;
	eventId: string;
	title: string;
	layoutType: LayoutType;
	status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
	canvasWidth: number;
	canvasHeight: number;
	elements: LayoutElement[];
	seatTypes: SeatType[];
	numbering?: SeatNumbering;
	stageView?: StageView | null;
	defaultView?: '2D' | '3D';
	thumbnail?: string;
	materializedSeatCount?: number;
	materializedAt?: string | null;
	revision?: number;
	createdAt?: string;
	updatedAt?: string;
}

/** The shape the builder holds before a layout has been saved once. */
export type DraftLayout = Omit<
	SeatLayout,
	'layoutId' | 'eventId' | 'status' | 'createdAt' | 'updatedAt'
> & { layoutId?: string | null };

// ── Seats (materialized inventory) ─────────────────────────────────────

/**
 * Seat statuses the server can actually produce.
 *
 * The old picker branched on `'HELD'`, which the backend enum never
 * emitted — so the amber "held by someone else" state was unreachable
 * and those seats fell through to a grey "taken". `RESERVED` is the real
 * name for that state.
 */
export type SeatStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'BLOCKED';

export interface Seat {
	seatId: string;
	seatNumber: string;
	rowLabel?: string;
	seatIndex?: number;
	section?: string;
	status: SeatStatus;
	ticketTypeId?: string | null;
	seatTypeId?: string | null;
	isAccessible?: boolean;
	isCompanion?: boolean;
	x?: number;
	y?: number;
	z?: number;
	elementId?: string | null;
	seatKey?: string | null;
}

/** What the attendee-facing endpoint returns. */
export interface PublicSeatMap {
	layout:
		| (Pick<
				SeatLayout,
				| 'layoutId'
				| 'title'
				| 'layoutType'
				| 'canvasWidth'
				| 'canvasHeight'
				| 'defaultView'
				| 'stageView'
				| 'seatTypes'
		  > & { elements: LayoutElement[] })
		| null;
	seats: Seat[];
}

// ── Publish validation ─────────────────────────────────────────────────

export interface MaterializationError {
	code:
		| 'DUPLICATE_LABELS'
		| 'LABEL_CONFLICT_WITH_BOOKED'
		| 'NO_SEATS'
		| 'TOO_MANY_SEATS'
		| 'SEAT_TYPE_WITHOUT_TICKET_TYPE'
		| 'UNKNOWN_SEAT_TYPE';
	message: string;
	detail?: string[];
}

/**
 * What publishing did, or would do. The builder renders this as a
 * pre-flight checklist — the organizer sees "412 seats · 8 new · 2
 * problems" before committing, instead of discovering a bad design when
 * an attendee cannot book.
 */
export interface MaterializationReport {
	layoutId: string;
	eventId: string;
	revision: number;
	generated: number;
	created: number;
	updated: number;
	removed: number;
	orphanedButBooked: Array<{ seatId: string; seatNumber: string }>;
	preserved: number;
	errors: MaterializationError[];
	warnings: string[];
	dryRun: boolean;
}

export interface InventorySummary {
	total: number;
	available: number;
	reserved: number;
	occupied: number;
	blocked: number;
	byTicketType: Array<{
		ticketTypeId: string | null;
		total: number;
		available: number;
	}>;
}
