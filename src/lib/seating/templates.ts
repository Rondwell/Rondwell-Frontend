/**
 * ════════════════════════════════════════════════════════════════════════
 *  VENUE TEMPLATES
 * ════════════════════════════════════════════════════════════════════════
 *
 * ── What was here before ────────────────────────────────────────────────
 *
 * Four PNG screenshots of seat maps in a modal, each with a "Use
 * Template" button that had **no click handler at all**. Picking one did
 * nothing. An organizer's only real option was to place every chair by
 * hand — a 500-seat theatre as 500 drag-and-drops.
 *
 * ── What a template is now ──────────────────────────────────────────────
 *
 * A function returning real geometry: generator elements, seat types,
 * canvas size, 3D camera framing. Applying one produces a complete,
 * publishable venue the organizer then adjusts, so the first useful
 * layout is one click rather than an afternoon.
 *
 * The numbers are not decorative. Row pitch, seat width, aisle placement
 * and rake all sit in the range real venues use, because the 3D view
 * makes bad proportions obvious and because a seat map that misrepresents
 * the room is worse than none:
 *
 *   seat width   460–560mm  → 32–38px at ~14px/100mm
 *   row pitch    850–1100mm → 38–44px
 *   rake         ~120mm rise per row in a stepped house
 *   aisles       every 8–16 seats; most codes cap a bank at 16 without
 *                a side aisle, and 100+ with one at each end
 */

import type { LayoutElement, SeatType, StageView, LayoutType, SeatNumbering } from './types';

export interface VenueTemplate {
	id: string;
	name: string;
	description: string;
	/** Iconify name for the picker. */
	icon: string;
	/** Approximate seat count, shown on the card before applying. */
	approxSeats: number;
	tags: string[];
	build(): {
		layoutType: LayoutType;
		canvasWidth: number;
		canvasHeight: number;
		elements: LayoutElement[];
		seatTypes: SeatType[];
		stageView: StageView;
		defaultView: '2D' | '3D';
		numbering?: SeatNumbering;
	};
}

let uid = 0;
/** Deterministic within a build, unique within a layout. */
function id(prefix: string): string {
	uid += 1;
	return `${prefix}-${Date.now().toString(36)}-${uid.toString(36)}`;
}

// ── Element builders ───────────────────────────────────────────────────

/**
 * A seat block whose bounding box matches the seats it generates.
 *
 * Deriving width/height from rows × cols × pitch rather than taking them
 * as input is what keeps selection outlines, marquee hit-testing and
 * zoom-to-fit honest. An element whose box disagrees with its seats
 * looks fine until you try to click it.
 */
function seatBlock(over: Partial<LayoutElement> & { x: number; y: number }): LayoutElement {
	const rows = over.rows ?? 1;
	const cols = over.cols ?? 10;
	const seatSpacing = over.seatSpacing ?? 34;
	const rowSpacing = over.rowSpacing ?? 40;
	const aisles = (over.aisleAfter ?? []).length;

	return {
		id: id('blk'),
		type: 'SEAT_BLOCK',
		width: (cols + aisles) * seatSpacing,
		height: rows * rowSpacing,
		rotation: 0,
		z: 0,
		seatSize: 28,
		elevationStep: 0,
		curvature: 0,
		locked: false,
		zIndex: 1,
		model: 'CHAIR',
		...over,
		rows,
		cols,
		seatSpacing,
		rowSpacing
	};
}

function fixture(
	type: LayoutElement['type'],
	x: number,
	y: number,
	width: number,
	height: number,
	label?: string
): LayoutElement {
	return {
		id: id('fx'),
		type,
		x,
		y,
		width,
		height,
		rotation: 0,
		z: 0,
		label,
		locked: false,
		zIndex: 0
	};
}

function roundTable(
	x: number,
	y: number,
	seats: number,
	label: string,
	seatTypeId: string
): LayoutElement {
	const d = 96;
	return {
		id: id('tbl'),
		type: 'ROUND_TABLE',
		x,
		y,
		width: d,
		height: d,
		rotation: 0,
		z: 0,
		cols: seats,
		seatSize: 26,
		rowLabel: label,
		label,
		seatTypeId,
		locked: false,
		zIndex: 1,
		numbering: { pattern: '{row}-{seat}' }
	};
}

// ── Shared seat-type palettes ──────────────────────────────────────────

/**
 * `ticketTypeId` is null throughout: a template cannot know the
 * organizer's ticket types. The materializer warns about every unbound
 * tier before publish, so this is a prompt rather than a trap.
 */
function tieredSeatTypes(): SeatType[] {
	return [
		{ seatTypeId: 'premium', name: 'Premium', color: '#F5A623', ticketTypeId: null, rank: 1 },
		{ seatTypeId: 'standard', name: 'Standard', color: '#6366F1', ticketTypeId: null, rank: 2 },
		{ seatTypeId: 'economy', name: 'Economy', color: '#64748B', ticketTypeId: null, rank: 3 },
		{
			seatTypeId: 'accessible',
			name: 'Accessible',
			color: '#10B981',
			ticketTypeId: null,
			isAccessible: true,
			rank: 4
		}
	];
}

function flatSeatTypes(): SeatType[] {
	return [
		{ seatTypeId: 'standard', name: 'Standard', color: '#6366F1', ticketTypeId: null, rank: 1 },
		{ seatTypeId: 'vip', name: 'VIP', color: '#F5A623', ticketTypeId: null, rank: 2 },
		{
			seatTypeId: 'accessible',
			name: 'Accessible',
			color: '#10B981',
			ticketTypeId: null,
			isAccessible: true,
			rank: 3
		}
	];
}

// ── Templates ──────────────────────────────────────────────────────────

/**
 * Proscenium theatre: curved, raked stalls split by two aisles, plus a
 * raised circle.
 *
 * Rows are labelled DESC so row A is nearest the stage, which is the
 * convention in almost every playhouse — and the opposite of what naive
 * generation produces.
 */
const theatre: VenueTemplate = {
	id: 'theatre',
	name: 'Theatre / Auditorium',
	description:
		'Curved, raked stalls with centre and side aisles, plus a raised circle. Row A nearest the stage.',
	icon: 'mdi:theater',
	approxSeats: 516,
	tags: ['indoor', 'raked', 'curved', 'tiered'],
	build() {
		const canvasWidth = 1600;
		const canvasHeight = 1200;

		const stageW = 620;
		const stage = fixture('STAGE', (canvasWidth - stageW) / 2, 60, stageW, 110, 'Stage');

		const stallsCols = 26;
		const stallsSpacing = 34;
		const stallsAisles = [8, 18];
		const stallsW = (stallsCols + stallsAisles.length) * stallsSpacing;
		const stalls = seatBlock({
			x: (canvasWidth - stallsW) / 2,
			y: 260,
			rows: 14,
			cols: stallsCols,
			seatSpacing: stallsSpacing,
			rowSpacing: 40,
			aisleAfter: stallsAisles,
			curvature: 26,
			elevationStep: 11,
			section: 'Stalls',
			seatTypeId: 'premium',
			numbering: { rowOrder: 'DESC', pattern: '{row}{seat}' }
		});

		// The circle sits behind and above, with its own shallower curve.
		const circleCols = 30;
		const circleAisles = [10, 20];
		const circleW = (circleCols + circleAisles.length) * 34;
		const circle = seatBlock({
			x: (canvasWidth - circleW) / 2,
			y: 880,
			rows: 6,
			cols: circleCols,
			seatSpacing: 34,
			rowSpacing: 42,
			aisleAfter: circleAisles,
			curvature: 18,
			elevationStep: 16,
			z: 220,
			section: 'Circle',
			seatTypeId: 'standard',
			numbering: { rowOrder: 'DESC', rowLabelStart: 'A', pattern: '{section}-{row}{seat}' }
		});

		/**
		 * Wheelchair spaces at the end of a level row by a door — not
		 * mid-rake, where there is a step. Putting them in the template
		 * means the accessible provision exists by default rather than
		 * being remembered.
		 */
		const accLeft = seatBlock({
			x: 190,
			y: 820,
			rows: 1,
			cols: 3,
			seatSpacing: 44,
			section: 'Stalls',
			seatTypeId: 'accessible',
			rowLabel: 'W',
			numbering: { pattern: '{row}{seat}' }
		});
		const accRight = seatBlock({
			x: canvasWidth - 190 - 3 * 44,
			y: 820,
			rows: 1,
			cols: 3,
			seatSpacing: 44,
			section: 'Stalls',
			seatTypeId: 'accessible',
			rowLabel: 'X',
			numbering: { pattern: '{row}{seat}' }
		});

		return {
			layoutType: 'THEATRE',
			canvasWidth,
			canvasHeight,
			elements: [
				stage,
				fixture('DOOR', 120, 760, 56, 40, 'Exit'),
				fixture('DOOR', canvasWidth - 176, 760, 56, 40, 'Exit'),
				fixture('RESTROOM', 110, 1030, 90, 70, 'WC'),
				fixture('BAR', canvasWidth - 230, 1030, 140, 70, 'Bar'),
				stalls,
				accLeft,
				accRight,
				circle
			],
			seatTypes: tieredSeatTypes(),
			stageView: {
				cameraX: 0,
				cameraY: 520,
				cameraZ: 1180,
				targetX: 0,
				targetY: 60,
				targetZ: -380,
				floor: 'CARPET',
				environment: 'INDOOR',
				showRoof: false
			},
			defaultView: '3D',
			numbering: { skipLabels: ['I', 'O'], pattern: '{row}{seat}' }
		};
	}
};

/**
 * Arena in the round: four raked stands facing a central floor.
 *
 * Each stand is rotated to face inward, which is what the per-element
 * `rotation` is for — rotation is applied to generated seat positions
 * about the element's centre, so a rotated stand's seats really do face
 * the pitch rather than just being drawn sideways.
 */
const stadium: VenueTemplate = {
	id: 'stadium',
	name: 'Stadium / Arena',
	description:
		'Four raked stands around a central floor, each facing inward. Lower and upper tiers priced separately.',
	icon: 'mdi:stadium',
	approxSeats: 1680,
	tags: ['outdoor', 'in-the-round', 'tiered', 'large'],
	build() {
		const canvasWidth = 1800;
		const canvasHeight = 1500;
		const cx = canvasWidth / 2;
		const cy = canvasHeight / 2;

		const pitchW = 620;
		const pitchH = 380;
		const pitch = fixture(
			'DANCEFLOOR',
			cx - pitchW / 2,
			cy - pitchH / 2,
			pitchW,
			pitchH,
			'Floor'
		);

		const sideCols = 24;
		const sideSpacing = 34;
		const sideW = (sideCols + 2) * sideSpacing;

		// North and south stands run along the long sides.
		const north = seatBlock({
			x: cx - sideW / 2,
			y: cy - pitchH / 2 - 60 - 10 * 40,
			rows: 10,
			cols: sideCols,
			seatSpacing: sideSpacing,
			rowSpacing: 40,
			aisleAfter: [8, 16],
			elevationStep: 14,
			rotation: 180,
			section: 'North Stand',
			seatTypeId: 'premium',
			numbering: { rowOrder: 'ASC', pattern: '{section}-{row}{seat}' }
		});
		const south = seatBlock({
			x: cx - sideW / 2,
			y: cy + pitchH / 2 + 60,
			rows: 10,
			cols: sideCols,
			seatSpacing: sideSpacing,
			rowSpacing: 40,
			aisleAfter: [8, 16],
			elevationStep: 14,
			section: 'South Stand',
			seatTypeId: 'premium',
			numbering: { rowOrder: 'ASC', pattern: '{section}-{row}{seat}' }
		});

		// East and west are rotated a quarter turn to face the floor.
		const endCols = 16;
		const endW = (endCols + 1) * 34;
		const west = seatBlock({
			x: cx - pitchW / 2 - 80 - endW / 2,
			y: cy - endW / 2 + 40,
			rows: 8,
			cols: endCols,
			seatSpacing: 34,
			rowSpacing: 40,
			aisleAfter: [8],
			elevationStep: 14,
			rotation: 90,
			section: 'West Stand',
			seatTypeId: 'standard',
			numbering: { pattern: '{section}-{row}{seat}' }
		});
		const east = seatBlock({
			x: cx + pitchW / 2 + 80 - endW / 2,
			y: cy - endW / 2 + 40,
			rows: 8,
			cols: endCols,
			seatSpacing: 34,
			rowSpacing: 40,
			aisleAfter: [8],
			elevationStep: 14,
			rotation: -90,
			section: 'East Stand',
			seatTypeId: 'standard',
			numbering: { pattern: '{section}-{row}{seat}' }
		});

		// Upper tier behind the north stand, lifted clear of it.
		const upperCols = 28;
		const upperW = (upperCols + 2) * 34;
		const upper = seatBlock({
			x: cx - upperW / 2,
			y: 60,
			rows: 8,
			cols: upperCols,
			seatSpacing: 34,
			rowSpacing: 42,
			aisleAfter: [9, 19],
			elevationStep: 18,
			z: 320,
			rotation: 180,
			section: 'Upper Tier',
			seatTypeId: 'economy',
			numbering: { pattern: '{section}-{row}{seat}' }
		});

		return {
			layoutType: 'STADIUM',
			canvasWidth,
			canvasHeight,
			elements: [
				pitch,
				fixture('ENTRANCE', 60, cy - 30, 70, 60, 'Gate A'),
				fixture('ENTRANCE', canvasWidth - 130, cy - 30, 70, 60, 'Gate B'),
				north,
				south,
				west,
				east,
				upper
			],
			seatTypes: tieredSeatTypes(),
			stageView: {
				cameraX: 0,
				cameraY: 900,
				cameraZ: 1500,
				targetX: 0,
				targetY: 0,
				targetZ: 0,
				floor: 'GRASS',
				environment: 'OUTDOOR_DAY',
				showRoof: false
			},
			defaultView: '3D'
		};
	}
};

/**
 * Banquet: round tables of ten on a grid, numbered per table.
 *
 * Seats are labelled "{table}-{seat}" because a banquet guest is told a
 * table number, not a row letter. The table's own label becomes the row
 * component, which is what `rowLabel` on a table element is for.
 */
const banquet: VenueTemplate = {
	id: 'banquet',
	name: 'Banquet / Gala Dinner',
	description:
		'Round tables of ten on a staggered grid, with a stage and dancefloor. Seats labelled by table.',
	icon: 'mdi:table-furniture',
	approxSeats: 240,
	tags: ['indoor', 'tables', 'dining'],
	build() {
		const canvasWidth = 1400;
		const canvasHeight = 1200;

		const elements: LayoutElement[] = [
			fixture('STAGE', (canvasWidth - 460) / 2, 50, 460, 100, 'Stage'),
			fixture('DANCEFLOOR', (canvasWidth - 300) / 2, 190, 300, 180, 'Dancefloor')
		];

		// Six across, four deep, staggered so no table sits directly
		// behind another — the same reason theatres offset rows.
		const cols = 6;
		const rows = 4;
		const gapX = 200;
		const gapY = 215;
		const startX = (canvasWidth - (cols - 1) * gapX - 96) / 2;
		const startY = 430;

		let n = 1;
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const stagger = r % 2 === 1 ? gapX / 2 : 0;
				// The staggered row is one table shorter so it stays inside
				// the canvas rather than running off the right edge.
				if (r % 2 === 1 && c === cols - 1) continue;
				elements.push(
					roundTable(
						startX + c * gapX + stagger,
						startY + r * gapY,
						10,
						`T${n++}`,
						r === 0 ? 'vip' : 'standard'
					)
				);
			}
		}

		elements.push(
			fixture('BUFFET', 80, canvasHeight - 150, 220, 80, 'Buffet'),
			fixture('BAR', canvasWidth - 300, canvasHeight - 150, 220, 80, 'Bar'),
			fixture('DOOR', 40, 560, 50, 80, 'Entrance')
		);

		return {
			layoutType: 'BANQUET',
			canvasWidth,
			canvasHeight,
			elements,
			seatTypes: flatSeatTypes(),
			stageView: {
				cameraX: 0,
				cameraY: 560,
				cameraZ: 1020,
				targetX: 0,
				targetY: 0,
				targetZ: -260,
				floor: 'WOOD',
				environment: 'INDOOR',
				showRoof: false
			},
			defaultView: '3D'
		};
	}
};

/** Flat conference hall: straight rows, centre aisle, stage and screens. */
const conference: VenueTemplate = {
	id: 'conference',
	name: 'Conference Hall',
	description:
		'Flat straight-row seating with a centre aisle, stage and two screens. Front rows reserved.',
	icon: 'mdi:presentation',
	approxSeats: 420,
	tags: ['indoor', 'flat', 'corporate'],
	build() {
		const canvasWidth = 1500;
		const canvasHeight = 1100;

		const cols = 24;
		const aisles = [12];
		const w = (cols + aisles.length) * 34;
		const x = (canvasWidth - w) / 2;

		const front = seatBlock({
			x,
			y: 280,
			rows: 3,
			cols,
			seatSpacing: 34,
			rowSpacing: 42,
			aisleAfter: aisles,
			section: 'Reserved',
			seatTypeId: 'vip',
			numbering: { pattern: '{row}{seat}' }
		});
		const main = seatBlock({
			x,
			y: 280 + 3 * 42 + 40,
			rows: 14,
			cols,
			seatSpacing: 34,
			rowSpacing: 42,
			aisleAfter: aisles,
			section: 'General',
			seatTypeId: 'standard',
			numbering: { rowLabelStart: 'D', pattern: '{row}{seat}' }
		});

		return {
			layoutType: 'CONFERENCE',
			canvasWidth,
			canvasHeight,
			elements: [
				fixture('STAGE', (canvasWidth - 520) / 2, 60, 520, 90, 'Stage'),
				fixture('SCREEN', 180, 70, 180, 24, 'Screen'),
				fixture('SCREEN', canvasWidth - 360, 70, 180, 24, 'Screen'),
				front,
				main,
				seatBlock({
					x: 120,
					y: 300,
					rows: 2,
					cols: 2,
					seatSpacing: 44,
					rowSpacing: 48,
					section: 'Accessible',
					seatTypeId: 'accessible',
					rowLabel: 'W',
					numbering: { pattern: '{row}{seat}' }
				}),
				fixture('DOOR', 60, 900, 60, 44, 'Exit'),
				fixture('DOOR', canvasWidth - 120, 900, 60, 44, 'Exit')
			],
			seatTypes: flatSeatTypes(),
			stageView: {
				cameraX: 0,
				cameraY: 440,
				cameraZ: 980,
				targetX: 0,
				targetY: 40,
				targetZ: -320,
				floor: 'CARPET',
				environment: 'INDOOR',
				showRoof: false
			},
			defaultView: '2D'
		};
	}
};

/** Ceremony seating: two blocks either side of a processional aisle. */
const ceremony: VenueTemplate = {
	id: 'ceremony',
	name: 'Wedding / Ceremony',
	description:
		'Two blocks facing an altar across a wide processional aisle, with a reserved front row.',
	icon: 'mdi:party-popper',
	approxSeats: 160,
	tags: ['indoor', 'outdoor', 'aisle', 'small'],
	build() {
		const canvasWidth = 1100;
		const canvasHeight = 1000;
		const aisleWidth = 150;
		const blockCols = 8;
		const blockW = blockCols * 34;
		const leftX = canvasWidth / 2 - aisleWidth / 2 - blockW;
		const rightX = canvasWidth / 2 + aisleWidth / 2;

		/**
		 * Numbered outward from the aisle: the left block runs
		 * right-to-left so seat 1 is the aisle seat on both sides. Mirrored
		 * numbering is what a ceremony programme assumes, and it is exactly
		 * what `seatOrder: 'RTL'` is for.
		 */
		const left = seatBlock({
			x: leftX,
			y: 300,
			rows: 10,
			cols: blockCols,
			seatSpacing: 34,
			rowSpacing: 44,
			section: 'Left',
			seatTypeId: 'standard',
			numbering: { seatOrder: 'RTL', pattern: '{section}-{row}{seat}' }
		});
		const right = seatBlock({
			x: rightX,
			y: 300,
			rows: 10,
			cols: blockCols,
			seatSpacing: 34,
			rowSpacing: 44,
			section: 'Right',
			seatTypeId: 'standard',
			numbering: { seatOrder: 'LTR', pattern: '{section}-{row}{seat}' }
		});

		return {
			layoutType: 'CUSTOM',
			canvasWidth,
			canvasHeight,
			elements: [
				fixture('STAGE', (canvasWidth - 300) / 2, 90, 300, 90, 'Altar'),
				left,
				right,
				fixture('AISLE', canvasWidth / 2 - aisleWidth / 2, 240, aisleWidth, 520, 'Aisle'),
				fixture('ENTRANCE', canvasWidth / 2 - 45, canvasHeight - 110, 90, 60, 'Entrance')
			],
			seatTypes: flatSeatTypes(),
			stageView: {
				cameraX: 0,
				cameraY: 400,
				cameraZ: 820,
				targetX: 0,
				targetY: 30,
				targetZ: -260,
				floor: 'GRASS',
				environment: 'OUTDOOR_DAY',
				showRoof: false
			},
			defaultView: '3D'
		};
	}
};

/** Classroom / training: tables with chairs on one side only. */
const classroom: VenueTemplate = {
	id: 'classroom',
	name: 'Classroom / Training',
	description: 'Rows of tables with chairs on the facing side only, plus a presenter screen.',
	icon: 'mdi:school',
	approxSeats: 96,
	tags: ['indoor', 'tables', 'training', 'small'],
	build() {
		const canvasWidth = 1200;
		const canvasHeight = 900;
		const elements: LayoutElement[] = [
			fixture('SCREEN', (canvasWidth - 320) / 2, 60, 320, 28, 'Screen'),
			fixture('STAGE', (canvasWidth - 420) / 2, 100, 420, 70, 'Presenter')
		];

		const perRow = 3;
		const tableW = 260;
		const gapX = 40;
		const rowsOfTables = 4;
		const totalW = perRow * tableW + (perRow - 1) * gapX;
		const startX = (canvasWidth - totalW) / 2;

		for (let r = 0; r < rowsOfTables; r++) {
			for (let c = 0; c < perRow; c++) {
				const x = startX + c * (tableW + gapX);
				const y = 260 + r * 150;
				elements.push(fixture('RECTANGLE', x, y, tableW, 46, ''));
				// Chairs face the screen, so they sit on the near edge only.
				elements.push(
					seatBlock({
						x,
						y: y + 58,
						rows: 1,
						cols: 8,
						seatSpacing: tableW / 8,
						seatSize: 24,
						section: 'Training',
						seatTypeId: 'standard',
						rowLabel: String.fromCharCode(65 + r),
						numbering: { pattern: '{row}{seat}' }
					})
				);
			}
		}

		return {
			layoutType: 'CLASSROOM',
			canvasWidth,
			canvasHeight,
			elements,
			seatTypes: flatSeatTypes(),
			stageView: {
				cameraX: 0,
				cameraY: 380,
				cameraZ: 760,
				targetX: 0,
				targetY: 20,
				targetZ: -220,
				floor: 'CARPET',
				environment: 'INDOOR',
				showRoof: false
			},
			defaultView: '2D'
		};
	}
};

/** Cabaret: small tables angled toward a stage, nobody with their back to it. */
const cabaret: VenueTemplate = {
	id: 'cabaret',
	name: 'Cabaret / Club',
	description:
		'Small tables of four angled toward the stage, with a bar and standing area at the back.',
	icon: 'mdi:glass-cocktail',
	approxSeats: 112,
	tags: ['indoor', 'tables', 'nightlife', 'small'],
	build() {
		const canvasWidth = 1200;
		const canvasHeight = 1000;
		const elements: LayoutElement[] = [
			fixture('STAGE', (canvasWidth - 380) / 2, 60, 380, 100, 'Stage'),
			fixture('DANCEFLOOR', (canvasWidth - 260) / 2, 190, 260, 140, '')
		];

		let n = 1;
		const arcs = [
			{ radius: 300, count: 7 },
			{ radius: 420, count: 9 },
			{ radius: 540, count: 11 }
		];
		const cx = canvasWidth / 2;
		const cy = 200;

		for (const arc of arcs) {
			for (let i = 0; i < arc.count; i++) {
				// Fan across the front 150° so every table faces the stage.
				const t = arc.count === 1 ? 0.5 : i / (arc.count - 1);
				const theta = (-75 + t * 150) * (Math.PI / 180);
				const x = cx + arc.radius * Math.sin(theta) - 36;
				const y = cy + arc.radius * Math.cos(theta) - 36;
				if (y > canvasHeight - 200) continue;
				const t4 = roundTable(x, y, 4, `T${n++}`, arc.radius <= 300 ? 'vip' : 'standard');
				t4.width = 72;
				t4.height = 72;
				elements.push(t4);
			}
		}

		elements.push(
			fixture('BAR', 60, canvasHeight - 160, 260, 80, 'Bar'),
			fixture('DOOR', canvasWidth - 130, canvasHeight - 160, 70, 50, 'Entrance')
		);

		return {
			layoutType: 'CUSTOM',
			canvasWidth,
			canvasHeight,
			elements,
			seatTypes: flatSeatTypes(),
			stageView: {
				cameraX: 0,
				cameraY: 420,
				cameraZ: 880,
				targetX: 0,
				targetY: 20,
				targetZ: -300,
				floor: 'WOOD',
				environment: 'STUDIO',
				showRoof: false
			},
			defaultView: '3D'
		};
	}
};

export const VENUE_TEMPLATES: VenueTemplate[] = [
	theatre,
	stadium,
	banquet,
	conference,
	ceremony,
	classroom,
	cabaret
];

export function getTemplate(templateId: string): VenueTemplate | undefined {
	return VENUE_TEMPLATES.find((t) => t.id === templateId);
}
