/**
 * ════════════════════════════════════════════════════════════════════════
 *  BUILDER TOOL PALETTE
 * ════════════════════════════════════════════════════════════════════════
 *
 * The old palette offered ten sprites — `CHAIR`, `BIG_CHAIR`, two tables,
 * a door, a stage and four shapes — each placing exactly one thing. A
 * 500-seat theatre meant 500 separate placements, and the `SEAT_ROW` type
 * the schema already defined was not in the palette at all, so it could
 * never be created.
 *
 * Every seating tool here is a **generator**: one placement describes a
 * row, a block, an arc or a table of n. That single change is most of the
 * difference between a toy and a tool.
 *
 * Defaults are venue-realistic rather than round numbers, because the
 * first thing an organizer does is place a block and look at it — and a
 * block with 100px seat spacing looks like a car park.
 */

import type { LayoutElement, SeatElementType } from './types';
import { newElementId } from './builderStore';

export interface Tool {
	type: SeatElementType;
	label: string;
	icon: string;
	group: 'seating' | 'fixtures' | 'shapes';
	/** One-line explanation shown in the palette and on hover. */
	hint: string;
	/** Seats this tool creates with its defaults. 0 for fixtures. */
	defaultSeats: number;
	make(x: number, y: number, seatTypeId: string | null): LayoutElement;
}

const SEAT_SPACING = 34;
const ROW_SPACING = 40;
const SEAT_SIZE = 28;

function base(
	type: SeatElementType,
	x: number,
	y: number,
	width: number,
	height: number
): LayoutElement {
	return {
		id: newElementId(),
		type,
		x: Math.round(x - width / 2),
		y: Math.round(y - height / 2),
		width,
		height,
		z: 0,
		rotation: 0,
		locked: false,
		zIndex: 0
	};
}

// ── Seating generators ─────────────────────────────────────────────────

const seatingTools: Tool[] = [
	{
		type: 'SEAT_BLOCK',
		label: 'Seat block',
		icon: 'mdi:view-grid',
		group: 'seating',
		hint: 'A grid of rows and seats. The fastest way to fill a room.',
		defaultSeats: 100,
		make(x, y, seatTypeId) {
			const rows = 10;
			const cols = 10;
			const el = base('SEAT_BLOCK', x, y, cols * SEAT_SPACING, rows * ROW_SPACING);
			return {
				...el,
				rows,
				cols,
				seatSpacing: SEAT_SPACING,
				rowSpacing: ROW_SPACING,
				seatSize: SEAT_SIZE,
				elevationStep: 0,
				curvature: 0,
				seatTypeId,
				model: 'CHAIR'
			};
		}
	},
	{
		type: 'SEAT_ROW',
		label: 'Seat row',
		icon: 'mdi:dots-horizontal',
		group: 'seating',
		hint: 'A single row of seats.',
		defaultSeats: 12,
		make(x, y, seatTypeId) {
			const cols = 12;
			const el = base('SEAT_ROW', x, y, cols * SEAT_SPACING, ROW_SPACING);
			return {
				...el,
				rows: 1,
				cols,
				seatSpacing: SEAT_SPACING,
				rowSpacing: ROW_SPACING,
				seatSize: SEAT_SIZE,
				curvature: 0,
				seatTypeId,
				model: 'CHAIR'
			};
		}
	},
	{
		type: 'SEAT_ARC',
		label: 'Curved row',
		icon: 'mdi:vector-curve',
		group: 'seating',
		hint: 'A row bowed around the stage, so every seat faces it.',
		defaultSeats: 16,
		make(x, y, seatTypeId) {
			const cols = 16;
			const el = base('SEAT_ARC', x, y, cols * SEAT_SPACING, ROW_SPACING * 2);
			return {
				...el,
				rows: 1,
				cols,
				seatSpacing: SEAT_SPACING,
				rowSpacing: ROW_SPACING,
				seatSize: SEAT_SIZE,
				// 30° reads clearly as curved without distorting the block.
				curvature: 30,
				seatTypeId,
				model: 'CHAIR'
			};
		}
	},
	{
		type: 'ROUND_TABLE',
		label: 'Round table',
		icon: 'mdi:circle-outline',
		group: 'seating',
		hint: 'A table with seats around it. Seats are labelled by table.',
		defaultSeats: 8,
		make(x, y, seatTypeId) {
			const el = base('ROUND_TABLE', x, y, 96, 96);
			return {
				...el,
				cols: 8,
				seatSize: 26,
				seatTypeId,
				label: 'T1',
				rowLabel: 'T1',
				numbering: { pattern: '{row}-{seat}' },
				model: 'CHAIR'
			};
		}
	},
	{
		type: 'SQUARE_TABLE',
		label: 'Square table',
		icon: 'mdi:square-outline',
		group: 'seating',
		hint: 'A square or banquet table with seats on all four sides.',
		defaultSeats: 8,
		make(x, y, seatTypeId) {
			const el = base('SQUARE_TABLE', x, y, 100, 100);
			return {
				...el,
				cols: 8,
				seatSize: 26,
				seatTypeId,
				label: 'T1',
				rowLabel: 'T1',
				numbering: { pattern: '{row}-{seat}' },
				model: 'CHAIR'
			};
		}
	},
	{
		type: 'SEAT',
		label: 'Single seat',
		icon: 'mdi:seat',
		group: 'seating',
		hint: 'One seat, for filling gaps or placing an accessible space.',
		defaultSeats: 1,
		make(x, y, seatTypeId) {
			const el = base('SEAT', x, y, 34, 34);
			return { ...el, rows: 1, cols: 1, seatSize: 30, seatTypeId, model: 'CHAIR' };
		}
	}
];

// ── Fixtures ───────────────────────────────────────────────────────────

interface FixtureSpec {
	type: SeatElementType;
	label: string;
	icon: string;
	width: number;
	height: number;
	hint: string;
}

const fixtureSpecs: FixtureSpec[] = [
	{ type: 'STAGE', label: 'Stage', icon: 'mdi:podium', width: 400, height: 90, hint: 'Orients the whole map and the 3D camera.' },
	{ type: 'SCREEN', label: 'Screen', icon: 'mdi:projector-screen-outline', width: 220, height: 24, hint: 'A projector screen or LED wall.' },
	{ type: 'DANCEFLOOR', label: 'Dancefloor', icon: 'mdi:music-note', width: 240, height: 160, hint: 'Open floor with no seating.' },
	{ type: 'BAR', label: 'Bar', icon: 'mdi:glass-cocktail', width: 200, height: 70, hint: '' },
	{ type: 'BUFFET', label: 'Buffet', icon: 'mdi:food', width: 200, height: 70, hint: '' },
	{ type: 'ENTRANCE', label: 'Entrance', icon: 'mdi:login', width: 80, height: 50, hint: 'Where attendees come in.' },
	{ type: 'EXIT', label: 'Exit', icon: 'mdi:logout', width: 80, height: 50, hint: 'Fire exit.' },
	{ type: 'DOOR', label: 'Door', icon: 'mdi:door', width: 60, height: 40, hint: '' },
	{ type: 'RESTROOM', label: 'Restroom', icon: 'mdi:toilet', width: 90, height: 70, hint: '' },
	{ type: 'AISLE', label: 'Aisle', icon: 'mdi:arrow-up-down', width: 120, height: 400, hint: 'A walkway. Marks space; creates no seats.' },
	{ type: 'WALL', label: 'Wall', icon: 'mdi:wall', width: 400, height: 20, hint: '' },
	{ type: 'PILLAR', label: 'Pillar', icon: 'mdi:circle', width: 50, height: 50, hint: 'Obstructs sightlines — pair it with blocked seats.' },
	{ type: 'BOOTH', label: 'Booth', icon: 'mdi:store', width: 120, height: 90, hint: 'Exhibitor or vendor stand.' }
];

const fixtureTools: Tool[] = fixtureSpecs.map((f) => ({
	type: f.type,
	label: f.label,
	icon: f.icon,
	group: 'fixtures',
	hint: f.hint,
	defaultSeats: 0,
	make(x, y) {
		const el = base(f.type, x, y, f.width, f.height);
		return { ...el, label: f.label === 'Stage' ? 'Stage' : f.label };
	}
}));

// ── Shapes and labels ──────────────────────────────────────────────────

const shapeTools: Tool[] = [
	{
		type: 'TEXT',
		label: 'Label',
		icon: 'mdi:format-text',
		group: 'shapes',
		hint: 'A text note, e.g. a section name.',
		defaultSeats: 0,
		make(x, y) {
			const el = base('TEXT', x, y, 160, 28);
			return { ...el, label: 'Label' };
		}
	},
	{
		type: 'RECTANGLE',
		label: 'Rectangle',
		icon: 'mdi:rectangle-outline',
		group: 'shapes',
		hint: '',
		defaultSeats: 0,
		make(x, y) {
			return base('RECTANGLE', x, y, 140, 80);
		}
	},
	{
		type: 'CIRCLE',
		label: 'Circle',
		icon: 'mdi:circle-outline',
		group: 'shapes',
		hint: '',
		defaultSeats: 0,
		make(x, y) {
			return base('CIRCLE', x, y, 100, 100);
		}
	},
	{
		type: 'TRIANGLE',
		label: 'Triangle',
		icon: 'mdi:triangle-outline',
		group: 'shapes',
		hint: '',
		defaultSeats: 0,
		make(x, y) {
			return base('TRIANGLE', x, y, 100, 90);
		}
	},
	{
		type: 'STRAIGHT',
		label: 'Line',
		icon: 'mdi:minus',
		group: 'shapes',
		hint: '',
		defaultSeats: 0,
		make(x, y) {
			return base('STRAIGHT', x, y, 200, 4);
		}
	}
];

export const TOOLS: Tool[] = [...seatingTools, ...fixtureTools, ...shapeTools];

export function getTool(type: string): Tool | undefined {
	return TOOLS.find((t) => t.type === type);
}

export function toolsByGroup(group: Tool['group'], query = ''): Tool[] {
	const q = query.trim().toLowerCase();
	return TOOLS.filter(
		(t) => t.group === group && (!q || t.label.toLowerCase().includes(q))
	);
}

/**
 * Human-readable summary of what an element contributes.
 *
 * Shown on the element and in the inspector so "a 10×10 block" is legible
 * as "100 seats" without counting. `seatCount` previously existed in the
 * schema and was never surfaced anywhere.
 */
export function describeElement(el: LayoutElement, seatCount: number): string {
	switch (el.type) {
		case 'SEAT_BLOCK':
			return `${el.rows ?? 1} rows × ${el.cols ?? 1} · ${seatCount} seats`;
		case 'SEAT_ROW':
		case 'SEAT_ARC':
			return `${seatCount} seats`;
		case 'ROUND_TABLE':
		case 'SQUARE_TABLE':
			return `${el.label ?? 'Table'} · ${seatCount} seats`;
		case 'SEAT':
			return '1 seat';
		default:
			return el.label || el.type.replace(/_/g, ' ').toLowerCase();
	}
}
