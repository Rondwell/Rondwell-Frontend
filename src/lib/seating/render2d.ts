/**
 * ════════════════════════════════════════════════════════════════════════
 *  2D CANVAS RENDERER + SPATIAL INDEX
 * ════════════════════════════════════════════════════════════════════════
 *
 * ── Why canvas instead of DOM ───────────────────────────────────────────
 *
 * Both the builder and the attendee picker previously rendered every
 * seat as an absolutely-positioned `<div>`. A 2,000-seat theatre is
 * 2,000 styled nodes with per-node transitions; an arena is 50,000. The
 * browser spends its whole frame budget on layout and style
 * recalculation, and dragging the canvas drops to single-digit FPS long
 * before a real venue is reached.
 *
 * One canvas draws the same scene in one pass, with no retained nodes.
 * The costs are that hit-testing becomes ours (hence the spatial index
 * below) and that accessibility has to be provided deliberately rather
 * than inherited from focusable elements — the picker component pairs
 * this renderer with a real keyboard/screen-reader surface.
 *
 * ── Culling and level of detail ─────────────────────────────────────────
 *
 * Only what intersects the viewport is drawn, and how much detail each
 * seat gets depends on how large it appears on screen. Below ~5px a seat
 * is a dot — drawing a rounded rect with a label would cost more and
 * show less. These thresholds are what let the renderer stay smooth at
 * stadium scale.
 */

import type { LayoutElement, Seat, SeatType, SeatOverride } from './types';
import { isFixture, isSeatGenerating } from './types';
import type { Viewport, Bounds } from './viewport';
import { generateSeatsForElement, type GeneratedSeat } from './geometry';

/** A seat positioned in layout space, ready to draw and hit-test. */
export interface RenderSeat {
	seatId: string;
	label: string;
	x: number;
	y: number;
	size: number;
	status: string;
	seatTypeId?: string | null;
	section?: string;
	rowLabel?: string;
	seatIndex?: number;
	isAccessible?: boolean;
	/** False when the seat is not part of the selected ticket type. */
	selectable: boolean;
	/**
	 * Suppressed by the organizer. Builder-only: drawn as a dashed ghost
	 * so it can be selected and restored.
	 *
	 * Without this the seat simply disappears from the canvas, and the
	 * only way back would be to find the override in the element's data —
	 * a one-way door in the UI.
	 */
	removed?: boolean;
}

export interface RenderOptions {
	viewport: Viewport;
	width: number;
	height: number;
	elements: LayoutElement[];
	seats: RenderSeat[];
	seatTypes: SeatType[];
	selectedIds: Set<string>;
	hoveredId?: string | null;
	/** Builder-only chrome. */
	showGrid?: boolean;
	gridSize?: number;
	selectedElementIds?: Set<string>;
	/** Suppressed in seat mode, where handles would compete with seats. */
	showHandles?: boolean;
	guides?: Array<{ axis: 'x' | 'y'; at: number }>;
	marquee?: { from: { x: number; y: number }; to: { x: number; y: number } } | null;
	canvasBounds?: { width: number; height: number } | null;
	/** Dim seats that are not selectable, instead of hiding them. */
	dimUnselectable?: boolean;
	theme?: 'light' | 'dark';
}

const STATUS_FILL: Record<string, string> = {
	OCCUPIED: '#d1d5db',
	RESERVED: '#fcd34d',
	BLOCKED: '#9ca3af'
};

const STATUS_STROKE: Record<string, string> = {
	OCCUPIED: '#9ca3af',
	RESERVED: '#f59e0b',
	BLOCKED: '#6b7280'
};

const SELECTED_FILL = '#22c55e';
const SELECTED_STROKE = '#15803d';

const FIXTURE_STYLE: Record<string, { fill: string; stroke: string; text: string }> = {
	STAGE: { fill: '#e5e7eb', stroke: '#9ca3af', text: '#374151' },
	SCREEN: { fill: '#1f2937', stroke: '#111827', text: '#f9fafb' },
	DANCEFLOOR: { fill: '#f3e8ff', stroke: '#c084fc', text: '#6b21a8' },
	BAR: { fill: '#fef3c7', stroke: '#d97706', text: '#92400e' },
	BUFFET: { fill: '#fef9c3', stroke: '#ca8a04', text: '#854d0e' },
	DOOR: { fill: '#fde68a', stroke: '#d97706', text: '#92400e' },
	ENTRANCE: { fill: '#d1fae5', stroke: '#059669', text: '#065f46' },
	EXIT: { fill: '#fee2e2', stroke: '#dc2626', text: '#991b1b' },
	RESTROOM: { fill: '#dbeafe', stroke: '#2563eb', text: '#1e40af' },
	AISLE: { fill: '#f9fafb', stroke: '#e5e7eb', text: '#9ca3af' },
	WALL: { fill: '#9ca3af', stroke: '#6b7280', text: '#374151' },
	PILLAR: { fill: '#6b7280', stroke: '#4b5563', text: '#f9fafb' },
	BOOTH: { fill: '#ede9fe', stroke: '#7c3aed', text: '#5b21b6' }
};

/**
 * On-screen seat size below which labels are skipped, and below which
 * seats become plain squares rather than rounded rects with strokes.
 */
const LABEL_MIN_PX = 16;
const DETAIL_MIN_PX = 5;

// ── Derivation ─────────────────────────────────────────────────────────

/**
 * Expand elements into renderable seats, merging in live inventory.
 *
 * The builder has no `Seat` rows for an unpublished layout, so seats are
 * generated client-side and shown as available. The attendee picker
 * passes real inventory and the generated geometry is matched to it by
 * `elementId:seatKey` — the same deterministic identity the server
 * materializes with, which is why the two can be joined at all. The old
 * code joined on a hand-typed `seatNumber` and silently produced
 * `undefined`.
 */
export function deriveRenderSeats(
	elements: LayoutElement[],
	inventory: Seat[] | null,
	opts: {
		ticketTypeId?: string | null;
		/**
		 * Also emit suppressed seats, flagged `removed`, so the builder can
		 * draw them as restorable ghosts. Off for the attendee picker —
		 * a removed seat is not a seat.
		 */
		includeRemoved?: boolean;
	} = {}
): RenderSeat[] {
	const byKey = new Map<string, Seat>();
	const byLabel = new Map<string, Seat>();
	for (const s of inventory ?? []) {
		if (s.elementId && s.seatKey) byKey.set(`${s.elementId}:${s.seatKey}`, s);
		byLabel.set(s.seatNumber, s);
	}

	const out: RenderSeat[] = [];
	for (const el of elements ?? []) {
		if (!isSeatGenerating(el.type)) continue;

		let generated: GeneratedSeat[];
		try {
			generated = generateSeatsForElement(el);
		} catch {
			continue;
		}

		/**
		 * Ghosts: re-run the generator on a copy of the element with the
		 * `removed` flags stripped, then take whatever the real run left
		 * out.
		 *
		 * Deliberately done by *calling the generator twice* rather than
		 * by adding an "include removed" switch to it. The generator is
		 * duplicated backend/frontend and pinned by a parity harness; a
		 * builder-only parameter would exist on one side only, or bloat
		 * the server with a flag it never passes. The second pass costs
		 * nothing because it only runs for elements that actually have a
		 * removal.
		 */
		const removedGhosts: GeneratedSeat[] = [];
		if (opts.includeRemoved) {
			const overrides = el.seatOverrides ?? {};
			const hasRemoval =
				(el.removedSeats?.length ?? 0) > 0 ||
				Object.values(overrides).some((o) => o?.removed);

			if (hasRemoval) {
				const cleared: Record<string, SeatOverride> = {};
				for (const [k, v] of Object.entries(overrides)) {
					const { removed: _drop, ...rest } = v ?? {};
					cleared[k] = rest;
				}
				try {
					const all = generateSeatsForElement({
						...el,
						removedSeats: undefined,
						seatOverrides: cleared
					});
					const liveKeys = new Set(generated.map((g) => g.seatKey));
					for (const g of all) {
						if (!liveKeys.has(g.seatKey)) removedGhosts.push(g);
					}
				} catch {
					/* ghosts are cosmetic; never fail the render for them */
				}
			}
		}

		for (const g of removedGhosts) {
			out.push({
				seatId: `${el.id}:${g.seatKey}`,
				label: g.label,
				x: g.x,
				y: g.y,
				size: g.size,
				status: 'AVAILABLE',
				seatTypeId: g.seatTypeId ?? null,
				section: g.section,
				rowLabel: g.rowLabel,
				seatIndex: g.seatIndex,
				isAccessible: false,
				selectable: true,
				removed: true
			});
		}

		for (const g of generated) {
			const key = `${el.id}:${g.seatKey}`;
			// Fall back to the label for seats materialized before the
			// element key existed, so an older published layout still
			// resolves live availability.
			const live = byKey.get(key) ?? byLabel.get(g.label);

			const ticketTypeId = live?.ticketTypeId ?? null;
			const selectable =
				live != null &&
				live.status === 'AVAILABLE' &&
				(!opts.ticketTypeId || ticketTypeId === opts.ticketTypeId);

			out.push({
				seatId: live?.seatId ?? key,
				label: live?.seatNumber ?? g.label,
				x: g.x,
				y: g.y,
				size: g.size,
				status: live?.status ?? 'AVAILABLE',
				seatTypeId: live?.seatTypeId ?? g.seatTypeId ?? null,
				section: live?.section ?? g.section,
				rowLabel: live?.rowLabel ?? g.rowLabel,
				seatIndex: live?.seatIndex ?? g.seatIndex,
				isAccessible: live?.isAccessible ?? false,
				selectable
			});
		}
	}
	return out;
}

export function seatBounds(seats: RenderSeat[], elements: LayoutElement[]): Bounds | null {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;

	for (const s of seats) {
		minX = Math.min(minX, s.x - s.size);
		minY = Math.min(minY, s.y - s.size);
		maxX = Math.max(maxX, s.x + s.size);
		maxY = Math.max(maxY, s.y + s.size);
	}
	for (const el of elements ?? []) {
		minX = Math.min(minX, el.x);
		minY = Math.min(minY, el.y);
		maxX = Math.max(maxX, el.x + el.width);
		maxY = Math.max(maxY, el.y + el.height);
	}
	if (!Number.isFinite(minX)) return null;
	return { minX, minY, maxX, maxY };
}

// ── Spatial index ──────────────────────────────────────────────────────

/**
 * Uniform grid over seat positions.
 *
 * Hit-testing by scanning every seat is O(n) per pointer event, which at
 * 50,000 seats makes hover feel broken even though the render is smooth.
 * A hash grid turns it into a handful of bucket lookups.
 *
 * A uniform grid (not a quadtree) because seats are near-uniformly
 * distributed by construction — blocks, rows and tables all produce
 * even spacing — so the simplest structure gives the same lookup cost
 * with far less code and no rebalancing.
 */
export class SeatIndex {
	private cell: number;
	private buckets = new Map<string, RenderSeat[]>();

	constructor(seats: RenderSeat[], cellSize = 64) {
		this.cell = Math.max(8, cellSize);
		for (const s of seats) {
			const k = this.key(s.x, s.y);
			const b = this.buckets.get(k);
			if (b) b.push(s);
			else this.buckets.set(k, [s]);
		}
	}

	private key(x: number, y: number): string {
		return `${Math.floor(x / this.cell)},${Math.floor(y / this.cell)}`;
	}

	/**
	 * Nearest seat to a world point, within `radius`.
	 *
	 * Searches the 3×3 neighbourhood so a point near a cell edge still
	 * finds seats in the adjacent cell. Returns the closest rather than
	 * the first hit — with a generous touch radius several seats can
	 * qualify, and picking the nearest is what the user meant.
	 */
	nearest(x: number, y: number, radius: number): RenderSeat | null {
		const cx = Math.floor(x / this.cell);
		const cy = Math.floor(y / this.cell);
		const reach = Math.max(1, Math.ceil(radius / this.cell));

		let best: RenderSeat | null = null;
		let bestDist = radius * radius;

		for (let gx = cx - reach; gx <= cx + reach; gx++) {
			for (let gy = cy - reach; gy <= cy + reach; gy++) {
				const bucket = this.buckets.get(`${gx},${gy}`);
				if (!bucket) continue;
				for (const s of bucket) {
					const dx = s.x - x;
					const dy = s.y - y;
					const d = dx * dx + dy * dy;
					if (d <= bestDist) {
						bestDist = d;
						best = s;
					}
				}
			}
		}
		return best;
	}

	/** Every seat whose centre falls inside a world-space rectangle. */
	within(x1: number, y1: number, x2: number, y2: number): RenderSeat[] {
		const minX = Math.min(x1, x2);
		const maxX = Math.max(x1, x2);
		const minY = Math.min(y1, y2);
		const maxY = Math.max(y1, y2);

		const out: RenderSeat[] = [];
		const gx0 = Math.floor(minX / this.cell);
		const gx1 = Math.floor(maxX / this.cell);
		const gy0 = Math.floor(minY / this.cell);
		const gy1 = Math.floor(maxY / this.cell);

		for (let gx = gx0; gx <= gx1; gx++) {
			for (let gy = gy0; gy <= gy1; gy++) {
				const bucket = this.buckets.get(`${gx},${gy}`);
				if (!bucket) continue;
				for (const s of bucket) {
					if (s.x >= minX && s.x <= maxX && s.y >= minY && s.y <= maxY) out.push(s);
				}
			}
		}
		return out;
	}
}

// ── Transform handles ──────────────────────────────────────────────────

export type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate';

/** Handle size and rotation-arm length, in **screen** pixels. */
const HANDLE_PX = 9;
const ROTATE_ARM_PX = 26;

/**
 * Handle positions in world space for one element.
 *
 * Sizes are divided by zoom so a handle stays the same size on screen at
 * any magnification — a handle that shrinks with the canvas becomes
 * un-grabbable exactly when you have zoomed out to reposition something
 * large.
 */
export function handlePositions(
	el: LayoutElement,
	zoom: number
): Array<{ id: HandleId; x: number; y: number }> {
	const { x, y, width: w, height: h } = el;
	const arm = ROTATE_ARM_PX / zoom;
	return [
		{ id: 'nw', x, y },
		{ id: 'n', x: x + w / 2, y },
		{ id: 'ne', x: x + w, y },
		{ id: 'e', x: x + w, y: y + h / 2 },
		{ id: 'se', x: x + w, y: y + h },
		{ id: 's', x: x + w / 2, y: y + h },
		{ id: 'sw', x, y: y + h },
		{ id: 'w', x, y: y + h / 2 },
		{ id: 'rotate', x: x + w / 2, y: y - arm }
	];
}

/** Which handle, if any, a world point is grabbing. */
export function handleAt(
	el: LayoutElement,
	wx: number,
	wy: number,
	zoom: number
): HandleId | null {
	// Generous on touch: the visual handle is 9px but the hit area is
	// larger, because a fingertip covers far more than that.
	const r = (HANDLE_PX * 1.6) / zoom;
	for (const h of handlePositions(el, zoom)) {
		if (Math.abs(wx - h.x) <= r && Math.abs(wy - h.y) <= r) return h.id;
	}
	return null;
}

/** CSS cursor for a handle. */
export function handleCursor(id: HandleId | null): string {
	switch (id) {
		case 'nw':
		case 'se':
			return 'nwse-resize';
		case 'ne':
		case 'sw':
			return 'nesw-resize';
		case 'n':
		case 's':
			return 'ns-resize';
		case 'e':
		case 'w':
			return 'ew-resize';
		case 'rotate':
			return 'grab';
		default:
			return '';
	}
}

function drawHandles(ctx: CanvasRenderingContext2D, el: LayoutElement, zoom: number) {
	const size = HANDLE_PX / zoom;
	const half = size / 2;

	// Arm connecting the element to its rotation handle.
	const rot = handlePositions(el, zoom).find((h) => h.id === 'rotate')!;
	ctx.strokeStyle = '#ec4899';
	ctx.lineWidth = 1 / zoom;
	ctx.beginPath();
	ctx.moveTo(el.x + el.width / 2, el.y);
	ctx.lineTo(rot.x, rot.y);
	ctx.stroke();

	for (const h of handlePositions(el, zoom)) {
		ctx.beginPath();
		if (h.id === 'rotate') {
			ctx.arc(h.x, h.y, half, 0, Math.PI * 2);
		} else {
			ctx.rect(h.x - half, h.y - half, size, size);
		}
		ctx.fillStyle = '#ffffff';
		ctx.fill();
		ctx.strokeStyle = '#ec4899';
		ctx.lineWidth = 1.5 / zoom;
		ctx.stroke();
	}
}

/** Topmost element whose box contains a world point. Builder hit-testing. */
export function elementAt(elements: LayoutElement[], x: number, y: number): LayoutElement | null {
	let found: LayoutElement | null = null;
	let bestZ = -Infinity;
	for (const el of elements ?? []) {
		if (x < el.x || x > el.x + el.width || y < el.y || y > el.y + el.height) continue;
		const z = el.zIndex ?? 0;
		if (z >= bestZ) {
			bestZ = z;
			found = el;
		}
	}
	return found;
}

// ── Draw ───────────────────────────────────────────────────────────────

function roundRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number
) {
	const radius = Math.min(r, w / 2, h / 2);
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.arcTo(x + w, y, x + w, y + h, radius);
	ctx.arcTo(x + w, y + h, x, y + h, radius);
	ctx.arcTo(x, y + h, x, y, radius);
	ctx.arcTo(x, y, x + w, y, radius);
	ctx.closePath();
}

/**
 * Draw the whole scene.
 *
 * Callers own the animation frame: both consumers already re-render on
 * viewport change, so an internal loop would just burn battery when
 * nothing moved.
 */
export function drawSeatMap(ctx: CanvasRenderingContext2D, o: RenderOptions): void {
	const { viewport: vp, width, height } = o;
	const dark = o.theme === 'dark';

	ctx.save();
	ctx.clearRect(0, 0, width, height);
	ctx.fillStyle = dark ? '#0b0b12' : '#f8f7fa';
	ctx.fillRect(0, 0, width, height);

	// World rect currently visible, used to cull everything below.
	const viewMinX = -vp.x / vp.zoom;
	const viewMinY = -vp.y / vp.zoom;
	const viewMaxX = (width - vp.x) / vp.zoom;
	const viewMaxY = (height - vp.y) / vp.zoom;

	ctx.setTransform(vp.zoom, 0, 0, vp.zoom, vp.x, vp.y);

	// ── Grid ──
	if (o.showGrid) {
		const g = o.gridSize ?? 20;
		// Skip when grid lines would be denser than ~4px on screen —
		// they would alias into a solid wash and cost thousands of strokes.
		if (g * vp.zoom >= 4) {
			ctx.strokeStyle = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.055)';
			ctx.lineWidth = 1 / vp.zoom;
			ctx.beginPath();
			const startX = Math.floor(viewMinX / g) * g;
			const startY = Math.floor(viewMinY / g) * g;
			for (let x = startX; x <= viewMaxX; x += g) {
				ctx.moveTo(x, viewMinY);
				ctx.lineTo(x, viewMaxY);
			}
			for (let y = startY; y <= viewMaxY; y += g) {
				ctx.moveTo(viewMinX, y);
				ctx.lineTo(viewMaxX, y);
			}
			ctx.stroke();
		}
	}

	// ── Canvas boundary ──
	if (o.canvasBounds) {
		ctx.fillStyle = dark ? '#111118' : '#ffffff';
		ctx.strokeStyle = dark ? '#2a2a38' : '#d4d4d8';
		ctx.lineWidth = 2 / vp.zoom;
		ctx.setLineDash([8 / vp.zoom, 6 / vp.zoom]);
		ctx.fillRect(0, 0, o.canvasBounds.width, o.canvasBounds.height);
		ctx.strokeRect(0, 0, o.canvasBounds.width, o.canvasBounds.height);
		ctx.setLineDash([]);
	}

	const typeColor = new Map((o.seatTypes ?? []).map((t) => [t.seatTypeId, t.color || '#6366F1']));

	// ── Fixtures and annotations, behind the seats ──
	const sorted = [...(o.elements ?? [])].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
	for (const el of sorted) {
		if (isSeatGenerating(el.type)) continue;
		if (
			el.x + el.width < viewMinX ||
			el.x > viewMaxX ||
			el.y + el.height < viewMinY ||
			el.y > viewMaxY
		)
			continue;

		const style = FIXTURE_STYLE[el.type] ?? {
			fill: 'transparent',
			stroke: dark ? '#52525b' : '#a1a1aa',
			text: dark ? '#a1a1aa' : '#52525b'
		};

		ctx.save();
		if (el.rotation) {
			ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
			ctx.rotate((el.rotation * Math.PI) / 180);
			ctx.translate(-(el.x + el.width / 2), -(el.y + el.height / 2));
		}

		if (el.type === 'CIRCLE') {
			ctx.beginPath();
			ctx.ellipse(
				el.x + el.width / 2,
				el.y + el.height / 2,
				el.width / 2,
				el.height / 2,
				0,
				0,
				Math.PI * 2
			);
			ctx.strokeStyle = el.color || style.stroke;
			ctx.lineWidth = 2 / vp.zoom;
			ctx.stroke();
		} else if (el.type === 'TRIANGLE') {
			ctx.beginPath();
			ctx.moveTo(el.x + el.width / 2, el.y);
			ctx.lineTo(el.x + el.width, el.y + el.height);
			ctx.lineTo(el.x, el.y + el.height);
			ctx.closePath();
			ctx.strokeStyle = el.color || style.stroke;
			ctx.lineWidth = 2 / vp.zoom;
			ctx.stroke();
		} else if (el.type === 'TEXT') {
			ctx.fillStyle = el.color || style.text;
			ctx.font = `600 ${Math.max(10, el.height * 0.7)}px ui-sans-serif, system-ui, sans-serif`;
			ctx.textBaseline = 'middle';
			ctx.fillText(el.label ?? '', el.x, el.y + el.height / 2);
		} else {
			ctx.fillStyle = el.color || style.fill;
			ctx.strokeStyle = style.stroke;
			ctx.lineWidth = 2 / vp.zoom;
			roundRect(ctx, el.x, el.y, el.width, el.height, 6);
			if (ctx.fillStyle !== 'transparent') ctx.fill();
			ctx.stroke();

			const label = el.label ?? (el.type === 'STAGE' ? 'Stage' : '');
			if (label && el.height * vp.zoom > 14) {
				ctx.fillStyle = style.text;
				const size = Math.min(el.height * 0.35, 18);
				ctx.font = `600 ${size}px ui-sans-serif, system-ui, sans-serif`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(label, el.x + el.width / 2, el.y + el.height / 2);
				ctx.textAlign = 'left';
			}
		}
		ctx.restore();
	}

	// ── Seats ──
	const onScreen = (o.seats[0]?.size ?? 28) * vp.zoom;
	const detailed = onScreen >= DETAIL_MIN_PX;
	const labelled = onScreen >= LABEL_MIN_PX;

	ctx.lineWidth = Math.max(0.5, 1.5 / vp.zoom);

	for (const s of o.seats) {
		const half = s.size / 2;
		if (
			s.x + half < viewMinX ||
			s.x - half > viewMaxX ||
			s.y + half < viewMinY ||
			s.y - half > viewMaxY
		)
			continue;

		const isSelected = o.selectedIds.has(s.seatId);
		const isHovered = o.hoveredId === s.seatId;

		/**
		 * A suppressed seat: dashed outline, no fill. Visibly "not a seat"
		 * while still being there to click, which is what makes removal
		 * reversible from the canvas.
		 */
		if (s.removed) {
			ctx.globalAlpha = 1;
			ctx.setLineDash([3 / vp.zoom, 3 / vp.zoom]);
			ctx.strokeStyle = isSelected ? SELECTED_STROKE : dark ? '#52525b' : '#a1a1aa';
			ctx.lineWidth = (isSelected ? 2 : 1) / vp.zoom;
			if (isSelected) {
				ctx.fillStyle = 'rgba(34,197,94,0.18)';
				roundRect(ctx, s.x - half, s.y - half, s.size, s.size, s.size * 0.22);
				ctx.fill();
				ctx.stroke();
			} else {
				roundRect(ctx, s.x - half, s.y - half, s.size, s.size, s.size * 0.22);
				ctx.stroke();
			}
			ctx.setLineDash([]);
			continue;
		}

		let fill: string;
		let stroke: string;
		if (isSelected) {
			fill = SELECTED_FILL;
			stroke = SELECTED_STROKE;
		} else if (STATUS_FILL[s.status]) {
			fill = STATUS_FILL[s.status];
			stroke = STATUS_STROKE[s.status];
		} else if (s.isAccessible) {
			fill = '#10b981';
			stroke = '#047857';
		} else {
			fill = (s.seatTypeId ? typeColor.get(s.seatTypeId) : undefined) ?? '#6366f1';
			stroke = 'rgba(0,0,0,0.25)';
		}

		// Unselectable seats stay visible but recede, so the map still
		// reads as a venue instead of as scattered islands of colour.
		const dim = o.dimUnselectable && !s.selectable && !isSelected;
		ctx.globalAlpha = dim ? 0.25 : 1;

		ctx.fillStyle = fill;
		if (!detailed) {
			ctx.fillRect(s.x - half, s.y - half, s.size, s.size);
		} else {
			roundRect(ctx, s.x - half, s.y - half, s.size, s.size, s.size * 0.22);
			ctx.fill();
			ctx.strokeStyle = isHovered ? '#111827' : stroke;
			ctx.lineWidth = (isHovered ? 2.5 : 1) / vp.zoom;
			ctx.stroke();
		}

		if (labelled && s.seatIndex !== undefined) {
			ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(17,24,39,0.75)';
			ctx.font = `600 ${s.size * 0.4}px ui-sans-serif, system-ui, sans-serif`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(String(s.seatIndex), s.x, s.y);
			ctx.textAlign = 'left';
		}

		ctx.globalAlpha = 1;
	}

	// ── Builder chrome: element selection outlines and handles ──
	if (o.selectedElementIds?.size) {
		ctx.strokeStyle = '#ec4899';
		ctx.lineWidth = 2 / vp.zoom;
		ctx.setLineDash([6 / vp.zoom, 4 / vp.zoom]);
		for (const el of o.elements ?? []) {
			if (!o.selectedElementIds.has(el.id)) continue;
			ctx.strokeRect(el.x - 3, el.y - 3, el.width + 6, el.height + 6);
		}
		ctx.setLineDash([]);

		/**
		 * Handles only for a single selection. With several selected the
		 * handles of each would overlap the others' bodies, and there is
		 * no unambiguous box to resize — alignment and distribution in the
		 * inspector are the multi-select tools.
		 */
		if (o.selectedElementIds.size === 1 && o.showHandles !== false) {
			const only = (o.elements ?? []).find((el) => o.selectedElementIds!.has(el.id));
			if (only && !only.locked) drawHandles(ctx, only, vp.zoom);
		}
	}

	// ── Alignment guides ──
	if (o.guides?.length) {
		ctx.strokeStyle = '#ec4899';
		ctx.lineWidth = 1 / vp.zoom;
		ctx.beginPath();
		for (const g of o.guides) {
			if (g.axis === 'x') {
				ctx.moveTo(g.at, viewMinY);
				ctx.lineTo(g.at, viewMaxY);
			} else {
				ctx.moveTo(viewMinX, g.at);
				ctx.lineTo(viewMaxX, g.at);
			}
		}
		ctx.stroke();
	}

	// ── Marquee ──
	if (o.marquee) {
		const { from, to } = o.marquee;
		const x = Math.min(from.x, to.x);
		const y = Math.min(from.y, to.y);
		const w = Math.abs(to.x - from.x);
		const h = Math.abs(to.y - from.y);
		ctx.fillStyle = 'rgba(59,130,246,0.12)';
		ctx.strokeStyle = '#3b82f6';
		ctx.lineWidth = 1.5 / vp.zoom;
		ctx.fillRect(x, y, w, h);
		ctx.strokeRect(x, y, w, h);
	}

	ctx.restore();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/**
 * Size the backing store to the element's CSS box times DPR.
 *
 * Without this the canvas renders at 1:1 CSS pixels and looks soft on
 * every retina and high-DPI phone display — which is most of them.
 * Returns the CSS dimensions, since all drawing is done in CSS pixels
 * with the DPR folded into the transform.
 */
export function sizeCanvas(
	canvas: HTMLCanvasElement,
	ctx: CanvasRenderingContext2D
): { width: number; height: number } {
	const dpr = Math.min(window.devicePixelRatio || 1, 2);
	const parent = canvas.parentElement;
	const width = parent?.clientWidth || canvas.clientWidth || 1;
	const height = parent?.clientHeight || canvas.clientHeight || 1;

	const bw = Math.max(1, Math.round(width * dpr));
	const bh = Math.max(1, Math.round(height * dpr));
	if (canvas.width !== bw || canvas.height !== bh) {
		canvas.width = bw;
		canvas.height = bh;
	}
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	return { width, height };
}
