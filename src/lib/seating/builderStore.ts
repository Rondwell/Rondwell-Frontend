/**
 * ════════════════════════════════════════════════════════════════════════
 *  BUILDER STATE + HISTORY
 * ════════════════════════════════════════════════════════════════════════
 *
 * ── Why history is structural, not a deep clone ─────────────────────────
 *
 * The previous builder pushed `JSON.parse(JSON.stringify(elements))` onto
 * an undo stack on **every** mutation, including each step of a drag. At
 * 50 elements that is unnoticeable; at 5,000 it serialises and reparses
 * the whole layout tens of times a second and the canvas locks up.
 *
 * Here every element is treated as **immutable**: an edit produces a new
 * element object and a new array, never a mutation in place. A history
 * entry is therefore just the array of references — O(n) pointers, no
 * serialisation. Fifty snapshots of a 5,000-element layout is 250,000
 * pointers, a few megabytes at worst, and pushing one is a single
 * `slice()`.
 *
 * The invariant that makes this sound: **never mutate an element or the
 * elements array in place.** Every helper below returns fresh objects.
 *
 * ── Coalescing ──────────────────────────────────────────────────────────
 *
 * A drag is one undoable action, not sixty. Mutations carry a `coalesceKey`;
 * consecutive mutations sharing a key replace the previous history entry
 * instead of appending. So one Ctrl+Z undoes the whole drag, which is
 * what a user means by "undo that move".
 */

import { writable, derived, get, type Readable } from 'svelte/store';
import type {
	LayoutElement,
	SeatType,
	SeatNumbering,
	SeatOverride,
	StageView,
	LayoutType,
	SeatLayout
} from './types';
import { countLayoutSeats, generateSeatsForLayout } from './geometry';

export interface BuilderState {
	layoutId: string | null;
	title: string;
	layoutType: LayoutType;
	canvasWidth: number;
	canvasHeight: number;
	elements: LayoutElement[];
	seatTypes: SeatType[];
	numbering: SeatNumbering;
	stageView: StageView | null;
	defaultView: '2D' | '3D';
	status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
	/** Element ids currently selected. */
	selection: string[];
	/**
	 * Individually selected seats, as `"<elementId>:<rowIdx>:<colIdx>"`.
	 *
	 * Element ids never contain a colon, so the first one separates the
	 * element from its seat key — the same composite the canvas renderer
	 * already uses as a seat's id, so selection round-trips without a
	 * translation step.
	 */
	seatSelection: string[];
	/** Whether the canvas acts on whole blocks or on individual seats. */
	editTarget: 'blocks' | 'seats';
	/** True when there are unsaved changes. */
	dirty: boolean;
}

/** Split `"<elementId>:<row>:<col>"` back into its parts. */
export function parseSeatUid(uid: string): { elementId: string; seatKey: string } | null {
	const i = uid.indexOf(':');
	if (i <= 0) return null;
	return { elementId: uid.slice(0, i), seatKey: uid.slice(i + 1) };
}

export function seatUid(elementId: string, seatKey: string): string {
	return `${elementId}:${seatKey}`;
}

interface HistoryEntry {
	elements: LayoutElement[];
	seatTypes: SeatType[];
	coalesceKey: string | null;
}

const HISTORY_LIMIT = 80;

const DEFAULT_NUMBERING: SeatNumbering = {
	rowLabelStyle: 'ALPHA',
	rowLabelStart: 'A',
	rowOrder: 'ASC',
	skipLabels: ['I', 'O'],
	seatNumberStart: 1,
	seatOrder: 'LTR',
	seatStep: 1,
	pattern: '{row}{seat}'
};

function initialState(): BuilderState {
	return {
		layoutId: null,
		title: 'Untitled layout',
		layoutType: 'CUSTOM',
		canvasWidth: 1400,
		canvasHeight: 1000,
		elements: [],
		seatTypes: [
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
		],
		numbering: { ...DEFAULT_NUMBERING },
		stageView: null,
		defaultView: '2D',
		status: 'DRAFT',
		selection: [],
		seatSelection: [],
		editTarget: 'blocks',
		dirty: false
	};
}

let counter = 0;
export function newElementId(prefix = 'el'): string {
	counter += 1;
	return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

export function createBuilderStore() {
	const state = writable<BuilderState>(initialState());

	let history: HistoryEntry[] = [];
	let historyIndex = -1;

	/** Push a snapshot, coalescing consecutive edits of the same kind. */
	function snapshot(coalesceKey: string | null) {
		const s = get(state);
		const entry: HistoryEntry = {
			elements: s.elements,
			seatTypes: s.seatTypes,
			coalesceKey
		};

		const prev = history[historyIndex];
		if (coalesceKey && prev && prev.coalesceKey === coalesceKey) {
			history[historyIndex] = entry;
			return;
		}

		// Drop any redo branch — editing after undoing abandons the future.
		history = history.slice(0, historyIndex + 1);
		history.push(entry);
		historyIndex = history.length - 1;

		if (history.length > HISTORY_LIMIT) {
			history.shift();
			historyIndex--;
		}
	}

	/** Apply a change and record it. */
	function commit(
		fn: (s: BuilderState) => Partial<BuilderState>,
		coalesceKey: string | null = null
	) {
		state.update((s) => ({ ...s, ...fn(s), dirty: true }));
		snapshot(coalesceKey);
	}

	/** Change selection or view state without touching history. */
	function touch(fn: (s: BuilderState) => Partial<BuilderState>) {
		state.update((s) => ({ ...s, ...fn(s) }));
	}

	return {
		subscribe: state.subscribe,

		// ── Loading / resetting ──

		/** Replace everything from a saved layout. Resets history. */
		load(layout: SeatLayout) {
			state.set({
				layoutId: layout.layoutId,
				title: layout.title ?? 'Untitled layout',
				layoutType: layout.layoutType ?? 'CUSTOM',
				canvasWidth: layout.canvasWidth ?? 1400,
				canvasHeight: layout.canvasHeight ?? 1000,
				elements: layout.elements ?? [],
				seatTypes: layout.seatTypes?.length ? layout.seatTypes : initialState().seatTypes,
				numbering: { ...DEFAULT_NUMBERING, ...(layout.numbering ?? {}) },
				stageView: layout.stageView ?? null,
				defaultView: layout.defaultView ?? '2D',
				status: layout.status ?? 'DRAFT',
				selection: [],
				seatSelection: [],
				editTarget: 'blocks',
				dirty: false
			});
			history = [];
			historyIndex = -1;
			snapshot(null);
		},

		reset() {
			state.set(initialState());
			history = [];
			historyIndex = -1;
			snapshot(null);
		},

		/**
		 * Apply a template, replacing the current design.
		 *
		 * Recorded in history as one step, so an organizer who applies the
		 * wrong template gets their work back with a single undo.
		 */
		applyTemplate(t: {
			layoutType: LayoutType;
			canvasWidth: number;
			canvasHeight: number;
			elements: LayoutElement[];
			seatTypes: SeatType[];
			stageView: StageView;
			defaultView: '2D' | '3D';
			numbering?: SeatNumbering;
		}) {
			commit(() => ({
				layoutType: t.layoutType,
				canvasWidth: t.canvasWidth,
				canvasHeight: t.canvasHeight,
				elements: t.elements,
				seatTypes: t.seatTypes,
				stageView: t.stageView,
				defaultView: t.defaultView,
				numbering: { ...DEFAULT_NUMBERING, ...(t.numbering ?? {}) },
				selection: []
			}));
		},

		markSaved(layoutId: string, status: BuilderState['status']) {
			touch(() => ({ layoutId, status, dirty: false }));
		},

		// ── Metadata ──

		setTitle(title: string) {
			touch(() => ({ title, dirty: true }));
		},
		setLayoutType(layoutType: LayoutType) {
			touch(() => ({ layoutType, dirty: true }));
		},
		setCanvasSize(width: number, height: number) {
			touch(() => ({ canvasWidth: width, canvasHeight: height, dirty: true }));
		},
		setDefaultView(defaultView: '2D' | '3D') {
			touch(() => ({ defaultView, dirty: true }));
		},
		setStageView(stageView: StageView | null) {
			touch(() => ({ stageView, dirty: true }));
		},
		setNumbering(patch: Partial<SeatNumbering>) {
			commit((s) => ({ numbering: { ...s.numbering, ...patch } }), 'numbering');
		},

		// ── Elements ──

		add(element: LayoutElement) {
			commit((s) => ({
				elements: [...s.elements, { ...element, zIndex: element.zIndex ?? s.elements.length }],
				selection: [element.id]
			}));
		},

		addMany(elements: LayoutElement[]) {
			commit((s) => ({
				elements: [...s.elements, ...elements],
				selection: elements.map((e) => e.id)
			}));
		},

		/** Patch one element. `coalesceKey` groups a continuous edit. */
		patch(id: string, patch: Partial<LayoutElement>, coalesceKey: string | null = null) {
			commit(
				(s) => ({
					elements: s.elements.map((e) => (e.id === id ? { ...e, ...patch } : e))
				}),
				coalesceKey
			);
		},

		/** Patch every selected element. */
		patchSelected(patch: Partial<LayoutElement>, coalesceKey: string | null = null) {
			commit((s) => {
				const sel = new Set(s.selection);
				return {
					elements: s.elements.map((e) => (sel.has(e.id) ? { ...e, ...patch } : e))
				};
			}, coalesceKey);
		},

		/**
		 * Move a set of elements by a delta.
		 *
		 * Coalesced under one key for the whole gesture, so a drag is a
		 * single undo step. Locked elements are skipped even if selected —
		 * a lock that a multi-select could bypass is not a lock.
		 */
		move(ids: string[], dx: number, dy: number, coalesceKey = 'move') {
			const set = new Set(ids);
			commit(
				(s) => ({
					elements: s.elements.map((e) =>
						set.has(e.id) && !e.locked ? { ...e, x: e.x + dx, y: e.y + dy } : e
					)
				}),
				coalesceKey
			);
		},

		remove(ids: string[]) {
			const set = new Set(ids);
			commit((s) => ({
				elements: s.elements.filter((e) => !set.has(e.id)),
				selection: s.selection.filter((id) => !set.has(id))
			}));
		},

		/** Copy the selection, offset so the duplicate is visible. */
		duplicate(ids: string[], offset = 24) {
			const set = new Set(ids);
			const s = get(state);
			const copies = s.elements
				.filter((e) => set.has(e.id))
				.map((e) => ({
					...e,
					id: newElementId('el'),
					x: e.x + offset,
					y: e.y + offset,
					locked: false
				}));
			if (!copies.length) return;
			commit((cur) => ({
				elements: [...cur.elements, ...copies],
				selection: copies.map((c) => c.id)
			}));
		},

		/** Raise or lower the selection in the draw order. */
		reorder(ids: string[], direction: 'front' | 'back') {
			const set = new Set(ids);
			commit((s) => {
				const zs = s.elements.map((e) => e.zIndex ?? 0);
				const target = direction === 'front' ? Math.max(0, ...zs) + 1 : Math.min(0, ...zs) - 1;
				return {
					elements: s.elements.map((e) => (set.has(e.id) ? { ...e, zIndex: target } : e))
				};
			});
		},

		/**
		 * Align the selection on one edge or axis.
		 *
		 * Needs two or more elements: aligning one thing to itself is a
		 * no-op that would still burn an undo step.
		 */
		align(
			ids: string[],
			mode: 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY'
		) {
			const s = get(state);
			const sel = s.elements.filter((e) => ids.includes(e.id) && !e.locked);
			if (sel.length < 2) return;

			const minX = Math.min(...sel.map((e) => e.x));
			const maxX = Math.max(...sel.map((e) => e.x + e.width));
			const minY = Math.min(...sel.map((e) => e.y));
			const maxY = Math.max(...sel.map((e) => e.y + e.height));
			const midX = (minX + maxX) / 2;
			const midY = (minY + maxY) / 2;

			const set = new Set(sel.map((e) => e.id));
			commit((cur) => ({
				elements: cur.elements.map((e) => {
					if (!set.has(e.id)) return e;
					switch (mode) {
						case 'left':
							return { ...e, x: minX };
						case 'right':
							return { ...e, x: maxX - e.width };
						case 'top':
							return { ...e, y: minY };
						case 'bottom':
							return { ...e, y: maxY - e.height };
						case 'centerX':
							return { ...e, x: midX - e.width / 2 };
						case 'centerY':
							return { ...e, y: midY - e.height / 2 };
					}
				})
			}));
		},

		/** Even spacing across the selection's extent. */
		distribute(ids: string[], axis: 'x' | 'y') {
			const s = get(state);
			const sel = s.elements
				.filter((e) => ids.includes(e.id) && !e.locked)
				.sort((a, b) => (axis === 'x' ? a.x - b.x : a.y - b.y));
			if (sel.length < 3) return;

			const first = sel[0];
			const last = sel[sel.length - 1];
			const span =
				axis === 'x' ? last.x + last.width - first.x : last.y + last.height - first.y;
			const total = sel.reduce((a, e) => a + (axis === 'x' ? e.width : e.height), 0);
			const gap = (span - total) / (sel.length - 1);

			let cursor = axis === 'x' ? first.x : first.y;
			const positions = new Map<string, number>();
			for (const e of sel) {
				positions.set(e.id, cursor);
				cursor += (axis === 'x' ? e.width : e.height) + gap;
			}

			commit((cur) => ({
				elements: cur.elements.map((e) => {
					const p = positions.get(e.id);
					if (p === undefined) return e;
					return axis === 'x' ? { ...e, x: p } : { ...e, y: p };
				})
			}));
		},

		// ── Selection (not undoable) ──

		select(ids: string[]) {
			touch(() => ({ selection: ids }));
		},
		toggleSelect(id: string) {
			touch((s) => ({
				selection: s.selection.includes(id)
					? s.selection.filter((x) => x !== id)
					: [...s.selection, id]
			}));
		},
		addToSelection(ids: string[]) {
			touch((s) => ({ selection: [...new Set([...s.selection, ...ids])] }));
		},
		selectAll() {
			touch((s) => ({ selection: s.elements.map((e) => e.id) }));
		},
		clearSelection() {
			touch(() => ({ selection: [] }));
		},

		// ── Individual seats ──
		//
		// Seat edits are expressed as `seatOverrides` on the owning
		// element, never by exploding a block into loose seats: the block
		// stays parametric, so changing its row count later still works.

		setEditTarget(editTarget: 'blocks' | 'seats') {
			touch(() => ({ editTarget, seatSelection: [], selection: [] }));
		},

		selectSeats(uids: string[]) {
			touch(() => ({ seatSelection: uids }));
		},
		toggleSeatSelect(uid: string) {
			touch((s) => ({
				seatSelection: s.seatSelection.includes(uid)
					? s.seatSelection.filter((x) => x !== uid)
					: [...s.seatSelection, uid]
			}));
		},
		addSeatsToSelection(uids: string[]) {
			touch((s) => ({ seatSelection: [...new Set([...s.seatSelection, ...uids])] }));
		},
		clearSeatSelection() {
			touch(() => ({ seatSelection: [] }));
		},

		/**
		 * Merge a patch into the override of every selected seat.
		 *
		 * Grouped by element so each element's override map is rebuilt
		 * once rather than per seat — selecting 500 seats and recolouring
		 * them is one pass, not 500 object spreads over the same map.
		 *
		 * Passing `undefined` for a field deletes it, which is how a seat
		 * returns to inheriting its element's value. That is distinct from
		 * `null`, which the generator reads as an explicit "no tier".
		 */
		patchSeats(
			uids: string[],
			patch: Partial<SeatOverride>,
			coalesceKey: string | null = null
		) {
			if (!uids.length) return;

			const byElement = new Map<string, string[]>();
			for (const uid of uids) {
				const parsed = parseSeatUid(uid);
				if (!parsed) continue;
				const list = byElement.get(parsed.elementId);
				if (list) list.push(parsed.seatKey);
				else byElement.set(parsed.elementId, [parsed.seatKey]);
			}
			if (!byElement.size) return;

			commit(
				(s) => ({
					elements: s.elements.map((el) => {
						const keys = byElement.get(el.id);
						if (!keys) return el;

						const next: Record<string, SeatOverride> = { ...(el.seatOverrides ?? {}) };
						for (const key of keys) {
							const merged: SeatOverride = { ...(next[key] ?? {}) };
							for (const [field, value] of Object.entries(patch)) {
								if (value === undefined) delete (merged as any)[field];
								else (merged as any)[field] = value;
							}
							// Drop overrides that no longer override anything, so
							// the document does not accumulate empty objects as
							// seats are toggled back and forth.
							if (Object.keys(merged).length === 0) delete next[key];
							else next[key] = merged;
						}

						return {
							...el,
							seatOverrides: Object.keys(next).length ? next : undefined
						};
					})
				}),
				coalesceKey
			);
		},

		/** Suppress seats — they generate no inventory at all. */
		removeSeats(uids: string[]) {
			this.patchSeats(uids, { removed: true });
		},

		/** Bring suppressed seats back. */
		restoreSeats(uids: string[]) {
			this.patchSeats(uids, { removed: undefined });
		},

		/** Move seats relative to where their element would place them. */
		nudgeSeats(uids: string[], dx: number, dy: number, coalesceKey = 'seat-nudge') {
			if (!uids.length) return;

			const byElement = new Map<string, Set<string>>();
			for (const uid of uids) {
				const parsed = parseSeatUid(uid);
				if (!parsed) continue;
				const set = byElement.get(parsed.elementId);
				if (set) set.add(parsed.seatKey);
				else byElement.set(parsed.elementId, new Set([parsed.seatKey]));
			}

			commit(
				(s) => ({
					elements: s.elements.map((el) => {
						const keys = byElement.get(el.id);
						if (!keys) return el;
						const next: Record<string, SeatOverride> = { ...(el.seatOverrides ?? {}) };
						for (const key of keys) {
							const cur = next[key] ?? {};
							// Accumulated, so a continuous drag adds up instead of
							// snapping back to the last frame's delta.
							next[key] = {
								...cur,
								dx: (cur.dx ?? 0) + dx,
								dy: (cur.dy ?? 0) + dy
							};
						}
						return { ...el, seatOverrides: next };
					})
				}),
				coalesceKey
			);
		},

		/** Clear every per-seat exception on the selected seats. */
		resetSeats(uids: string[]) {
			this.patchSeats(uids, {
				seatTypeId: undefined,
				removed: undefined,
				label: undefined,
				dx: undefined,
				dy: undefined
			});
		},

		// ── Seat types ──

		upsertSeatType(type: SeatType) {
			commit((s) => {
				const i = s.seatTypes.findIndex((t) => t.seatTypeId === type.seatTypeId);
				if (i === -1) return { seatTypes: [...s.seatTypes, type] };
				const next = [...s.seatTypes];
				next[i] = type;
				return { seatTypes: next };
			});
		},

		/**
		 * Remove a tier and unassign every element using it.
		 *
		 * Leaving dangling `seatTypeId` references would fail publish with
		 * UNKNOWN_SEAT_TYPE, from an edit that looked unrelated. Cleaning up
		 * here keeps the design publishable.
		 */
		removeSeatType(seatTypeId: string) {
			commit((s) => ({
				seatTypes: s.seatTypes.filter((t) => t.seatTypeId !== seatTypeId),
				elements: s.elements.map((e) =>
					e.seatTypeId === seatTypeId ? { ...e, seatTypeId: null } : e
				)
			}));
		},

		// ── History ──

		undo() {
			if (historyIndex <= 0) return;
			historyIndex--;
			const entry = history[historyIndex];
			state.update((s) => ({
				...s,
				elements: entry.elements,
				seatTypes: entry.seatTypes,
				// Selection is pruned to what still exists, so undoing a
				// delete does not leave phantom ids selected.
				selection: s.selection.filter((id) => entry.elements.some((e) => e.id === id)),
				seatSelection: s.seatSelection.filter((uid) => {
					const parsed = parseSeatUid(uid);
					return parsed ? entry.elements.some((e) => e.id === parsed.elementId) : false;
				}),
				dirty: true
			}));
		},

		redo() {
			if (historyIndex >= history.length - 1) return;
			historyIndex++;
			const entry = history[historyIndex];
			state.update((s) => ({
				...s,
				elements: entry.elements,
				seatTypes: entry.seatTypes,
				selection: s.selection.filter((id) => entry.elements.some((e) => e.id === id)),
				seatSelection: s.seatSelection.filter((uid) => {
					const parsed = parseSeatUid(uid);
					return parsed ? entry.elements.some((e) => e.id === parsed.elementId) : false;
				}),
				dirty: true
			}));
		},

		canUndo(): boolean {
			return historyIndex > 0;
		},
		canRedo(): boolean {
			return historyIndex < history.length - 1;
		},

		/** Close an interaction so the next edit starts a new undo step. */
		endCoalesce() {
			const prev = history[historyIndex];
			if (prev) prev.coalesceKey = null;
		},

		/** The payload shape the API expects. */
		toPayload() {
			const s = get(state);
			return {
				title: s.title,
				layoutType: s.layoutType,
				canvasWidth: s.canvasWidth,
				canvasHeight: s.canvasHeight,
				elements: s.elements,
				seatTypes: s.seatTypes,
				numbering: s.numbering,
				stageView: s.stageView ?? undefined,
				defaultView: s.defaultView
			};
		}
	};
}

export type BuilderStore = ReturnType<typeof createBuilderStore>;

/** Live seat total and label collisions, for the builder header. */
export function seatStats(store: BuilderStore): Readable<{
	total: number;
	duplicates: string[];
	bySeatType: Array<{ seatTypeId: string | null; name: string; color: string; count: number }>;
	unassigned: number;
}> {
	return derived(store, (s) => {
		const { seats, duplicateLabels } = generateSeatsForLayout(s.elements, s.numbering);

		const counts = new Map<string, number>();
		let unassigned = 0;
		for (const seat of seats) {
			if (!seat.seatTypeId) {
				unassigned++;
				continue;
			}
			counts.set(seat.seatTypeId, (counts.get(seat.seatTypeId) ?? 0) + 1);
		}

		return {
			total: seats.length,
			duplicates: duplicateLabels,
			unassigned,
			bySeatType: s.seatTypes.map((t) => ({
				seatTypeId: t.seatTypeId,
				name: t.name,
				color: t.color,
				count: counts.get(t.seatTypeId) ?? 0
			}))
		};
	});
}

/** Cheap seat total without the full expansion. Used while dragging. */
export function quickSeatCount(s: BuilderState): number {
	return countLayoutSeats(s.elements, s.numbering);
}
