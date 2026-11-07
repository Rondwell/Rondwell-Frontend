/**
 * ════════════════════════════════════════════════════════════════════════
 *  SEAT GEOMETRY (client port)
 * ════════════════════════════════════════════════════════════════════════
 *
 * A faithful port of the event service's `services/seat-geometry.ts`.
 * Both files must produce byte-identical seats for the same element.
 *
 * ── Why it is duplicated rather than shared ─────────────────────────────
 *
 * The builder renders every seat of a block live while the organizer
 * drags its handles, and shows the exact labels publishing will mint. It
 * cannot ask the server per frame. The backend, meanwhile, must own the
 * expansion because it is what writes inventory — a client-supplied seat
 * list would be untrusted input.
 *
 * Sharing the module across the repo boundary was rejected: the
 * backend's `rootDir` blocks cross-service TypeScript imports, and the
 * runtime-require workaround used elsewhere for shared libs would put a
 * build-time coupling on the builder's hot path. So: two copies, one
 * contract, and a shared fixture set
 * (`seat-geometry.test.ts` / `geometry.test.ts`) that pins them
 * together. **Any edit here must be mirrored there.**
 *
 * Coordinates are canvas space: x right, y down, origin top-left. `z` is
 * elevation above the floor.
 */

import type { LayoutElement, SeatNumbering } from './types';

export interface GeneratedSeat {
	/** Stable identity within the element: "rowIdx:colIdx". */
	seatKey: string;
	rowIndex: number;
	colIndex: number;
	rowLabel: string;
	seatIndex: number;
	label: string;
	section?: string;
	seatTypeId?: string | null;
	x: number;
	y: number;
	z: number;
	size: number;
}

const DEFAULT_NUMBERING = {
	rowLabelStyle: 'ALPHA' as const,
	rowLabelStart: 'A',
	rowOrder: 'ASC' as const,
	skipLabels: ['I', 'O'],
	seatNumberStart: 1,
	seatOrder: 'LTR' as const,
	seatStep: 1,
	pattern: '{row}{seat}'
};

export const MAX_SEATS_PER_ELEMENT = 20_000;

// ── Row labels ─────────────────────────────────────────────────────────

/** Bijective base-26: 0→A, 25→Z, 26→AA. */
export function alphaLabel(index: number): string {
	if (index < 0) return 'A';
	let n = index;
	let out = '';
	for (;;) {
		out = String.fromCharCode(65 + (n % 26)) + out;
		n = Math.floor(n / 26) - 1;
		if (n < 0) break;
	}
	return out;
}

export function alphaIndex(label: string): number {
	const s = String(label || '')
		.toUpperCase()
		.replace(/[^A-Z]/g, '');
	if (!s) return 0;
	let n = 0;
	for (const ch of s) n = n * 26 + (ch.charCodeAt(0) - 64);
	return n - 1;
}

/**
 * The nth row label, honouring style, start offset and skips.
 *
 * Skips apply while walking the alphabet, so a layout omitting I and O
 * yields A…H, J…N, P… — row "I" is never issued. The walk is bounded
 * because `skipLabels` could in principle exclude every candidate.
 */
export function rowLabelFor(n: number, numbering?: SeatNumbering): string {
	const cfg = { ...DEFAULT_NUMBERING, ...(numbering ?? {}) };

	if (cfg.rowLabelStyle === 'NUMERIC') {
		const start = parseInt(cfg.rowLabelStart, 10);
		return String((Number.isFinite(start) ? start : 1) + n);
	}

	const skip = new Set((cfg.skipLabels ?? []).map((s) => String(s).toUpperCase()));
	const offset = alphaIndex(cfg.rowLabelStart || 'A');

	let found = 0;
	const limit = (n + skip.size + 2) * 2 + 64;
	for (let i = 0; i < limit; i++) {
		const candidate = alphaLabel(offset + i);
		if (skip.has(candidate)) continue;
		if (found === n) {
			return cfg.rowLabelStyle === 'ALPHA_LOWER' ? candidate.toLowerCase() : candidate;
		}
		found++;
	}
	return alphaLabel(offset + n);
}

export function formatSeatLabel(
	pattern: string,
	parts: { section?: string; row: string; seat: number }
): string {
	return (pattern || DEFAULT_NUMBERING.pattern)
		.replace(/\{section\}/g, parts.section ?? '')
		.replace(/\{row\}/g, parts.row)
		.replace(/\{seat\}/g, String(parts.seat))
		.trim();
}

// ── Helpers ────────────────────────────────────────────────────────────

function rotatePoint(px: number, py: number, cx: number, cy: number, degrees: number) {
	if (!degrees) return { x: px, y: py };
	const r = (degrees * Math.PI) / 180;
	const cos = Math.cos(r);
	const sin = Math.sin(r);
	const dx = px - cx;
	const dy = py - cy;
	return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
}

function posInt(v: unknown, fallback: number): number {
	const n = Math.floor(Number(v));
	return Number.isFinite(n) && n > 0 ? n : fallback;
}

function num(v: unknown, fallback: number): number {
	const n = Number(v);
	return Number.isFinite(n) ? n : fallback;
}

/**
 * Cumulative x offsets for one row, inserting an aisle gap after each
 * listed index. An aisle consumes floor space but not a seat number.
 */
function rowOffsets(cols: number, spacing: number, aisleAfter?: number[]): number[] {
	const gaps = new Set((aisleAfter ?? []).map((n) => Math.floor(Number(n))));
	const out: number[] = [];
	let cursor = 0;
	for (let j = 0; j < cols; j++) {
		out.push(cursor);
		cursor += spacing;
		if (gaps.has(j + 1)) cursor += spacing;
	}
	return out;
}

// ── The generator ──────────────────────────────────────────────────────

export function generateSeatsForElement(
	element: LayoutElement,
	layoutNumbering?: SeatNumbering
): GeneratedSeat[] {
	const type = element.type as string;
	const numbering = {
		...DEFAULT_NUMBERING,
		...(layoutNumbering ?? {}),
		...(element.numbering ?? {})
	};
	const removed = new Set(element.removedSeats ?? []);
	const seatSize = num(element.seatSize, 28);
	const baseZ = num(element.z, 0);
	const rotation = num(element.rotation, 0);
	const section = element.section || undefined;
	const seatTypeId = element.seatTypeId ?? null;

	const cx = element.x + element.width / 2;
	const cy = element.y + element.height / 2;

	const emit = (
		rowIndex: number,
		colIndex: number,
		rawX: number,
		rawY: number,
		z: number,
		labelRowIndex: number,
		labelSeatOrdinal: number
	): GeneratedSeat | null => {
		const seatKey = `${rowIndex}:${colIndex}`;
		if (removed.has(seatKey)) return null;

		const rowLabel =
			element.rowLabel && element.rowLabel.length
				? (element.rows ?? 1) <= 1
					? element.rowLabel
					: rowLabelFor(labelRowIndex, numbering)
				: rowLabelFor(labelRowIndex, numbering);

		const seatIndex =
			num(numbering.seatNumberStart, 1) + labelSeatOrdinal * posInt(numbering.seatStep, 1);

		const { x, y } = rotatePoint(rawX, rawY, cx, cy, rotation);

		return {
			seatKey,
			rowIndex,
			colIndex,
			rowLabel,
			seatIndex,
			label: formatSeatLabel(numbering.pattern, { section, row: rowLabel, seat: seatIndex }),
			section,
			seatTypeId,
			x,
			y,
			z,
			size: seatSize
		};
	};

	// ── Single seat (and the legacy CHAIR / BIG_CHAIR sprites) ──
	if (type === 'SEAT' || type === 'CHAIR' || type === 'BIG_CHAIR') {
		const rowLabel = element.rowLabel || element.row || rowLabelFor(0, numbering);
		const explicit = element.seatNumber;
		const seatIndex = num(numbering.seatNumberStart, 1);
		return [
			{
				seatKey: '0:0',
				rowIndex: 0,
				colIndex: 0,
				rowLabel,
				seatIndex,
				label:
					explicit && explicit.length
						? explicit
						: formatSeatLabel(numbering.pattern, { section, row: rowLabel, seat: seatIndex }),
				section,
				seatTypeId,
				x: cx,
				y: cy,
				z: baseZ,
				size: Math.max(seatSize, Math.min(element.width, element.height) || seatSize)
			}
		];
	}

	// ── Straight / curved rows and blocks ──
	if (type === 'SEAT_ROW' || type === 'SEAT_BLOCK' || type === 'SEAT_ARC') {
		const rows = type === 'SEAT_ROW' || type === 'SEAT_ARC' ? 1 : posInt(element.rows, 1);
		const colsRaw = posInt(element.cols ?? element.seatCount, 1);

		const cols = Math.min(
			colsRaw,
			Math.max(1, Math.floor(MAX_SEATS_PER_ELEMENT / Math.max(1, rows)))
		);
		const safeRows = Math.min(rows, MAX_SEATS_PER_ELEMENT);

		const spacing = num(element.seatSpacing, 34);
		const rowGap = num(element.rowSpacing, 40);
		const rake = num(element.elevationStep, 0);
		const sweep = num(element.curvature, 0);

		const offsets = rowOffsets(cols, spacing, element.aisleAfter);
		const rowWidth = offsets.length ? offsets[offsets.length - 1] : 0;

		const curved = sweep > 0.01 && cols > 1;
		const sweepRad = (sweep * Math.PI) / 180;
		const R0 = curved ? rowWidth / (2 * Math.sin(sweepRad / 2)) : 0;
		const arcCenterY = element.y - R0;

		const out: GeneratedSeat[] = [];
		for (let i = 0; i < safeRows; i++) {
			const labelRowIndex = numbering.rowOrder === 'DESC' ? safeRows - 1 - i : i;

			for (let j = 0; j < cols; j++) {
				const labelSeatOrdinal = numbering.seatOrder === 'RTL' ? cols - 1 - j : j;

				let px: number;
				let py: number;
				if (curved) {
					const R = R0 + i * rowGap;
					const t = rowWidth > 0 ? offsets[j] / rowWidth : 0.5;
					const theta = -sweepRad / 2 + t * sweepRad;
					px = cx + R * Math.sin(theta);
					py = arcCenterY + R * Math.cos(theta);
				} else {
					px = element.x + offsets[j] + seatSize / 2;
					py = element.y + i * rowGap + seatSize / 2;
				}

				const seat = emit(i, j, px, py, baseZ + i * rake, labelRowIndex, labelSeatOrdinal);
				if (seat) out.push(seat);
			}
		}
		return out;
	}

	// ── Tables ──
	if (type === 'ROUND_TABLE' || type === 'SQUARE_TABLE') {
		const seats = posInt(element.cols ?? element.seatCount, 8);
		const count = Math.min(seats, MAX_SEATS_PER_ELEMENT);
		const out: GeneratedSeat[] = [];

		const rx = element.width / 2 + seatSize * 0.75;
		const ry = element.height / 2 + seatSize * 0.75;

		for (let j = 0; j < count; j++) {
			const labelSeatOrdinal = numbering.seatOrder === 'RTL' ? count - 1 - j : j;
			let px: number;
			let py: number;

			if (type === 'ROUND_TABLE') {
				const theta = -Math.PI / 2 + (j / count) * Math.PI * 2;
				px = cx + rx * Math.cos(theta);
				py = cy + ry * Math.sin(theta);
			} else {
				const per = count / 4;
				const side = Math.min(3, Math.floor(j / per));
				const within = per > 0 ? (j - side * per) / per : 0;
				const w = element.width;
				const h = element.height;
				if (side === 0) {
					px = element.x + within * w;
					py = cy - ry;
				} else if (side === 1) {
					px = cx + rx;
					py = element.y + within * h;
				} else if (side === 2) {
					px = element.x + (1 - within) * w;
					py = cy + ry;
				} else {
					px = cx - rx;
					py = element.y + (1 - within) * h;
				}
			}

			const tableLabel = element.rowLabel || element.label || rowLabelFor(0, numbering);
			const seatIndex =
				num(numbering.seatNumberStart, 1) + labelSeatOrdinal * posInt(numbering.seatStep, 1);
			const seatKey = `0:${j}`;
			if (removed.has(seatKey)) continue;

			const { x, y } = rotatePoint(px, py, cx, cy, rotation);
			out.push({
				seatKey,
				rowIndex: 0,
				colIndex: j,
				rowLabel: tableLabel,
				seatIndex,
				label: formatSeatLabel(numbering.pattern, {
					section,
					row: tableLabel,
					seat: seatIndex
				}),
				section,
				seatTypeId,
				x,
				y,
				z: baseZ,
				size: seatSize
			});
		}
		return out;
	}

	return [];
}

export function countSeatsForElement(
	element: LayoutElement,
	layoutNumbering?: SeatNumbering
): number {
	return generateSeatsForElement(element, layoutNumbering).length;
}

/**
 * Expand a whole layout, reporting duplicate labels rather than
 * renaming them — see the backend counterpart for why. The builder
 * surfaces these in its pre-publish checklist.
 */
export function generateSeatsForLayout(
	elements: LayoutElement[],
	layoutNumbering?: SeatNumbering
): {
	seats: Array<GeneratedSeat & { elementId: string }>;
	duplicateLabels: string[];
} {
	const seats: Array<GeneratedSeat & { elementId: string }> = [];
	const seen = new Map<string, number>();

	for (const el of elements ?? []) {
		for (const s of generateSeatsForElement(el, layoutNumbering)) {
			seats.push({ ...s, elementId: el.id });
			seen.set(s.label, (seen.get(s.label) ?? 0) + 1);
		}
	}

	const duplicateLabels = [...seen.entries()]
		.filter(([, n]) => n > 1)
		.map(([label]) => label)
		.sort();

	return { seats, duplicateLabels };
}

/** Total seats a layout describes. Shown live in the builder header. */
export function countLayoutSeats(
	elements: LayoutElement[],
	layoutNumbering?: SeatNumbering
): number {
	let n = 0;
	for (const el of elements ?? []) n += countSeatsForElement(el, layoutNumbering);
	return n;
}

/**
 * Axis-aligned bounds of every seat and fixture, for zoom-to-fit and for
 * framing the 3D camera. Returns null for an empty layout so callers can
 * distinguish "no content" from "content at the origin".
 */
export function layoutBounds(
	elements: LayoutElement[]
): { minX: number; minY: number; maxX: number; maxY: number } | null {
	if (!elements?.length) return null;
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const el of elements) {
		minX = Math.min(minX, el.x);
		minY = Math.min(minY, el.y);
		maxX = Math.max(maxX, el.x + el.width);
		maxY = Math.max(maxY, el.y + el.height);
	}
	if (!Number.isFinite(minX)) return null;
	return { minX, minY, maxX, maxY };
}
