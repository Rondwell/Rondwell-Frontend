<script lang="ts">
	/**
	 * Canvas seat map with pointer gestures. Shared by the organizer
	 * builder and the attendee picker.
	 *
	 * `interactionMode` is the only difference between the two uses:
	 *
	 *   'seats'    — tapping picks a seat, dragging pans, marquee off
	 *   'elements' — tapping selects an element, dragging moves it,
	 *                dragging empty space rubber-bands a selection
	 *
	 * Everything else — culling, level of detail, pinch-zoom, DPI scaling
	 * — is identical, so it lives here once rather than in both callers.
	 *
	 * Rendering is scheduled on an animation frame and coalesced: several
	 * state changes in one tick repaint once. The canvas is not redrawn on
	 * a timer, so an idle map costs nothing.
	 */
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import type { LayoutElement, SeatType } from './types';
	import {
		drawSeatMap,
		sizeCanvas,
		SeatIndex,
		elementAt,
		seatBounds,
		handleAt,
		handleCursor,
		type RenderSeat,
		type HandleId
	} from './render2d';
	import { isMultiSeat } from './types';
	import {
		createGestureController,
		snapBox,
		type GestureController,
		type Viewport,
		type Point
	} from './viewport';

	export let elements: LayoutElement[] = [];
	export let seats: RenderSeat[] = [];
	export let seatTypes: SeatType[] = [];
	export let selectedSeatIds: Set<string> = new Set();
	export let selectedElementIds: Set<string> = new Set();
	/**
	 * What a gesture acts on.
	 *
	 *   'seats'     — attendee picker: tap picks a seat, drag pans
	 *   'elements'  — builder, block mode: select and move whole elements
	 *   'seat-edit' — builder, seat mode: select and nudge individual
	 *                 seats inside their block
	 *
	 * Seat mode is separate from element mode rather than a modifier on
	 * it because the two want opposite things from the same gesture: a
	 * drag on a block should move the block, and a drag on a seat inside
	 * that block should move only the seat. Making it an explicit mode
	 * keeps that unambiguous on touch, where there is no hover to
	 * telegraph what you are about to grab.
	 */
	export let interactionMode: 'seats' | 'elements' | 'seat-edit' = 'seats';
	/**
	 * Allow rubber-band selection of seats in `seats` mode.
	 *
	 * Off for the attendee picker — a drag there should pan the map, and
	 * one attendee selects one seat at a time. On for the organizer's
	 * seating chart, where the whole point is acting on a bank of seats at
	 * once (blocking a row for production, killing an obstructed section).
	 */
	export let seatMarquee = false;
	export let showGrid = false;
	export let gridSize = 20;
	export let snapEnabled = true;
	export let canvasBounds: { width: number; height: number } | null = null;
	export let dimUnselectable = true;
	export let theme: 'light' | 'dark' = 'light';
	/** Extra radius added to the seat hit area on touch. */
	export let touchPadding = 10;

	const dispatch = createEventDispatcher<{
		seatTap: { seat: RenderSeat };
		seatHover: { seat: RenderSeat | null };
		elementTap: { element: LayoutElement | null; additive: boolean };
		elementDrag: { ids: string[]; dx: number; dy: number };
		elementDragEnd: Record<string, never>;
		/** Seat-mode drag, in world units. */
		seatDrag: { dx: number; dy: number };
		seatDragEnd: Record<string, never>;
		/** Handle drag: a resized/rotated element, ready to patch. */
		elementTransform: { id: string; patch: Record<string, number> };
		marqueeEnd: { seats: RenderSeat[]; elements: LayoutElement[]; additive: boolean };
		viewport: Viewport;
		longPress: { world: Point; element: LayoutElement | null; seat: RenderSeat | null };
	}>();

	let host: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let controller: GestureController | null = null;
	let detachGestures: (() => void) | null = null;
	let resizeObserver: ResizeObserver | null = null;

	let size = { width: 0, height: 0 };
	let viewport: Viewport = { x: 0, y: 0, zoom: 1 };
	let hoveredId: string | null = null;
	let guides: Array<{ axis: 'x' | 'y'; at: number }> = [];
	let index: SeatIndex | null = null;
	let dirty = true;
	let frame = 0;
	/** True once a pointer has reported a coarse type, to size hit areas. */
	let coarsePointer = false;

	/**
	 * Handle being dragged, and the element's geometry when the drag
	 * began.
	 *
	 * The start snapshot matters: resizing from accumulated per-frame
	 * deltas drifts, because each frame rounds. Deriving every frame from
	 * the original box and the total offset keeps it exact.
	 */
	let activeHandle: HandleId | null = null;
	let transformStart: {
		id: string;
		x: number;
		y: number;
		width: number;
		height: number;
		rotation: number;
		rows: number;
		cols: number;
		seatSpacing: number;
		rowSpacing: number;
		multiSeat: boolean;
		originX: number;
		originY: number;
	} | null = null;
	let totalDx = 0;
	let totalDy = 0;
	let hoverCursor = '';

	/** Rebuild the spatial index only when the seat set actually changes. */
	$: index = new SeatIndex(seats, 64);

	// Any of these changing means the picture is stale.
	$: elements, seats, seatTypes, selectedSeatIds, selectedElementIds, showGrid, theme, markDirty();

	function markDirty() {
		dirty = true;
	}

	function render() {
		frame = requestAnimationFrame(render);
		if (!dirty || !ctx) return;
		dirty = false;

		size = sizeCanvas(canvas, ctx);
		drawSeatMap(ctx, {
			viewport,
			width: size.width,
			height: size.height,
			elements,
			seats,
			seatTypes,
			selectedIds: selectedSeatIds,
			hoveredId,
			showGrid,
			gridSize,
			selectedElementIds: interactionMode === 'elements' ? selectedElementIds : undefined,
			// Handles are hidden in seat mode: they sit on the block edges,
			// exactly where seats are, and would steal those taps.
			showHandles: interactionMode === 'elements',
			guides,
			marquee: controller?.marquee ?? null,
			canvasBounds,
			dimUnselectable,
			theme
		});
	}

	/** The single selected element, when exactly one is selected. */
	function soleSelected(): LayoutElement | null {
		if (interactionMode !== 'elements' || selectedElementIds.size !== 1) return null;
		const id = [...selectedElementIds][0];
		const el = elements.find((e) => e.id === id);
		return el && !el.locked ? el : null;
	}

	/**
	 * Apply a handle drag.
	 *
	 * ── Resizing a seat block adds seats, it does not stretch them ──────
	 *
	 * For a parametric block the useful meaning of "drag the edge wider"
	 * is **more seats at the same pitch**, not the same seats spread
	 * further apart. Stretching would silently change the row pitch —
	 * which is a real physical dimension, constrained by fire code — as a
	 * side effect of wanting a bigger section. So for multi-seat elements
	 * the drag is converted into a column/row count, and `seatSpacing` /
	 * `rowSpacing` stay put. Fixtures and annotations resize literally.
	 *
	 * Dragging a north/west handle also moves the origin, so the opposite
	 * edge stays pinned.
	 */
	function applyTransform() {
		const t = transformStart;
		if (!t || !activeHandle) return;

		if (activeHandle === 'rotate') {
			// Angle from the element's centre to the pointer.
			const cx = t.x + t.width / 2;
			const cy = t.y + t.height / 2;
			const angle =
				(Math.atan2(t.originY + totalDy - cy, t.originX + totalDx - cx) * 180) / Math.PI + 90;
			// Shift snaps to 15°, the usual convention for a rotation handle.
			const snapped = shiftHeld ? Math.round(angle / 15) * 15 : Math.round(angle);
			dispatch('elementTransform', { id: t.id, patch: { rotation: snapped } });
			return;
		}

		const h = activeHandle;
		const east = h.includes('e');
		const west = h.includes('w');
		const north = h.startsWith('n');
		const south = h.startsWith('s');

		if (t.multiSeat) {
			let cols = t.cols;
			let rows = t.rows;
			let x = t.x;
			let y = t.y;

			if (east) cols = Math.round((t.width + totalDx) / t.seatSpacing);
			if (west) {
				cols = Math.round((t.width - totalDx) / t.seatSpacing);
				x = t.x + t.width - Math.max(1, cols) * t.seatSpacing;
			}
			if (south) rows = Math.round((t.height + totalDy) / t.rowSpacing);
			if (north) {
				rows = Math.round((t.height - totalDy) / t.rowSpacing);
				y = t.y + t.height - Math.max(1, rows) * t.rowSpacing;
			}

			cols = Math.max(1, Math.min(500, cols));
			rows = Math.max(1, Math.min(500, rows));

			dispatch('elementTransform', {
				id: t.id,
				patch: {
					rows,
					cols,
					x,
					y,
					width: cols * t.seatSpacing,
					height: rows * t.rowSpacing
				}
			});
			return;
		}

		let x = t.x;
		let y = t.y;
		let width = t.width;
		let height = t.height;
		const MIN = 8;

		if (east) width = Math.max(MIN, t.width + totalDx);
		if (west) {
			width = Math.max(MIN, t.width - totalDx);
			x = t.x + t.width - width;
		}
		if (south) height = Math.max(MIN, t.height + totalDy);
		if (north) {
			height = Math.max(MIN, t.height - totalDy);
			y = t.y + t.height - height;
		}

		dispatch('elementTransform', {
			id: t.id,
			patch: {
				x: Math.round(x),
				y: Math.round(y),
				width: Math.round(width),
				height: Math.round(height)
			}
		});
	}

	/** World-space pick radius, generous enough for a fingertip. */
	function hitRadius(): number {
		const base = (seats[0]?.size ?? 28) * 0.75;
		const pad = coarsePointer ? touchPadding / viewport.zoom : 2 / viewport.zoom;
		return base + pad;
	}

	onMount(() => {
		ctx = canvas.getContext('2d');

		controller = createGestureController(
			{
				decideMode: (world, ev) => {
					coarsePointer = ev.pointerType !== 'mouse';

					// A handle on the single selected element wins over
					// everything else — it sits on top of the element body, so
					// testing it first is what makes an edge grabbable at all.
					activeHandle = null;
					transformStart = null;
					totalDx = 0;
					totalDy = 0;
					const sole = soleSelected();
					if (sole) {
						const h = handleAt(sole, world.x, world.y, viewport.zoom);
						if (h) {
							activeHandle = h;
							transformStart = {
								id: sole.id,
								x: sole.x,
								y: sole.y,
								width: sole.width,
								height: sole.height,
								rotation: sole.rotation ?? 0,
								rows: sole.rows ?? 1,
								cols: sole.cols ?? 1,
								seatSpacing: sole.seatSpacing ?? 34,
								rowSpacing: sole.rowSpacing ?? 40,
								multiSeat: isMultiSeat(sole.type),
								originX: world.x,
								originY: world.y
							};
							return 'drag';
						}
					}

					if (interactionMode === 'seats') {
						if (!seatMarquee || spaceHeld) return 'pan';
						// Dragging from a seat pans (so the map stays navigable
						// from anywhere); dragging from empty space rubber-bands.
						const onSeat = index?.nearest(world.x, world.y, hitRadius());
						return onSeat ? 'pan' : 'marquee';
					}

					if (interactionMode === 'seat-edit') {
						if (spaceHeld) return 'pan';
						// Dragging a seat moves it; empty space rubber-bands.
						const onSeat = index?.nearest(world.x, world.y, hitRadius());
						return onSeat ? 'drag' : 'marquee';
					}

					// Builder: a press on an unlocked element drags it; a press
					// on empty space rubber-bands.
					const el = elementAt(elements, world.x, world.y);
					if (el && !el.locked) return 'drag';
					// Space-drag pans, which is the convention in every design
					// tool and keeps panning reachable while marquee is the
					// default on empty canvas.
					if (spaceHeld) return 'pan';
					return el ? 'pan' : 'marquee';
				},

				onTap: (world, ev) => {
					coarsePointer = ev.pointerType !== 'mouse';

					if (interactionMode === 'seats' || interactionMode === 'seat-edit') {
						const seat = index?.nearest(world.x, world.y, hitRadius()) ?? null;
						if (seat) dispatch('seatTap', { seat });
						else if (interactionMode === 'seat-edit') {
							// Tapping empty canvas in seat mode clears the
							// selection, matching every other editor.
							dispatch('marqueeEnd', { seats: [], elements: [], additive: false });
						}
						return;
					}
					dispatch('elementTap', {
						element: elementAt(elements, world.x, world.y),
						additive: ev.shiftKey || ev.ctrlKey || ev.metaKey
					});
				},

				onLongPress: (world) => {
					dispatch('longPress', {
						world,
						element: elementAt(elements, world.x, world.y),
						seat: index?.nearest(world.x, world.y, hitRadius()) ?? null
					});
				},

				onDragStart: (world) => {
					// A handle drag is already fully set up by decideMode.
					if (activeHandle) return;
					// A drag that starts on something unselected selects it
					// first, so dragging always moves what you grabbed rather
					// than a stale selection elsewhere.
					if (interactionMode === 'seat-edit') {
						const seat = index?.nearest(world.x, world.y, hitRadius());
						if (seat && !selectedSeatIds.has(seat.seatId)) {
							dispatch('seatTap', { seat });
						}
						return;
					}
					const el = elementAt(elements, world.x, world.y);
					if (el && !selectedElementIds.has(el.id)) {
						dispatch('elementTap', { element: el, additive: false });
					}
				},

				onDragMove: (_world, delta) => {
					if (activeHandle && transformStart) {
						// Accumulate, then derive from the start snapshot —
						// see `applyTransform`.
						totalDx += delta.x;
						totalDy += delta.y;
						applyTransform();
						markDirty();
						return;
					}

					if (interactionMode === 'seat-edit') {
						// Seats are nudged free-form: they sit inside a
						// parametric grid, so snapping them to the canvas grid
						// would fight the row pitch rather than help.
						if (selectedSeatIds.size) dispatch('seatDrag', { dx: delta.x, dy: delta.y });
						markDirty();
						return;
					}

					const ids = [...selectedElementIds];
					if (!ids.length) return;

					// Snap the primary element, then move the whole selection
					// by the snapped delta so a multi-selection keeps its
					// internal spacing instead of collapsing onto one guide.
					let dx = delta.x;
					let dy = delta.y;
					guides = [];

					if (ids.length === 1 && snapEnabled) {
						const el = elements.find((e) => e.id === ids[0]);
						if (el) {
							const moved = { ...el, x: el.x + delta.x, y: el.y + delta.y };
							const others = elements.filter((e) => e.id !== el.id);
							const snapped = snapBox(moved, others, {
								grid: gridSize,
								threshold: 8 / viewport.zoom,
								enabled: snapEnabled
							});
							dx = snapped.x - el.x;
							dy = snapped.y - el.y;
							guides = snapped.guides;
						}
					}

					dispatch('elementDrag', { ids, dx, dy });
					markDirty();
				},

				onDragEnd: () => {
					guides = [];
					const wasTransform = activeHandle !== null;
					activeHandle = null;
					transformStart = null;
					totalDx = 0;
					totalDy = 0;

					if (wasTransform) dispatch('elementDragEnd', {});
					else if (interactionMode === 'seat-edit') dispatch('seatDragEnd', {});
					else dispatch('elementDragEnd', {});
					markDirty();
				},

				onMarquee: () => markDirty(),

				onMarqueeEnd: (from, to) => {
					const hitSeats = index?.within(from.x, from.y, to.x, to.y) ?? [];
					const minX = Math.min(from.x, to.x);
					const maxX = Math.max(from.x, to.x);
					const minY = Math.min(from.y, to.y);
					const maxY = Math.max(from.y, to.y);
					// Centre-in-rect, not full containment: requiring a block to
					// be fully enclosed makes large elements nearly impossible
					// to marquee at working zoom.
					const hitElements = (elements ?? []).filter((el) => {
						const cx = el.x + el.width / 2;
						const cy = el.y + el.height / 2;
						return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;
					});
					dispatch('marqueeEnd', {
						seats: hitSeats,
						elements: hitElements,
						additive: shiftHeld
					});
					markDirty();
				},

				onHover: (world, ev) => {
					if (ev.pointerType !== 'mouse') return;

					// Handle affordance: without a cursor change the handles
					// read as decoration rather than as grab targets.
					const sole = soleSelected();
					const overHandle = sole ? handleAt(sole, world.x, world.y, viewport.zoom) : null;
					const nextCursor = handleCursor(overHandle);
					if (nextCursor !== hoverCursor) {
						hoverCursor = nextCursor;
						markDirty();
					}

					if (interactionMode === 'elements') return;
					const seat = index?.nearest(world.x, world.y, hitRadius()) ?? null;
					const id = seat?.seatId ?? null;
					if (id !== hoveredId) {
						hoveredId = id;
						dispatch('seatHover', { seat });
						markDirty();
					}
				},

				onViewportChange: (vp) => {
					viewport = vp;
					dispatch('viewport', vp);
					markDirty();
				}
			},
			viewport
		);

		detachGestures = controller.attach(host);

		if (typeof ResizeObserver !== 'undefined') {
			resizeObserver = new ResizeObserver(() => markDirty());
			resizeObserver.observe(host);
		}

		frame = requestAnimationFrame(render);

		// Initial framing once the host has real dimensions.
		requestAnimationFrame(() => fit());
	});

	onDestroy(() => {
		cancelAnimationFrame(frame);
		detachGestures?.();
		resizeObserver?.disconnect();
		controller?.destroy();
		controller = null;
	});

	// ── Keyboard modifiers ──
	// Tracked here rather than read off the pointer event because a
	// marquee's modifier state matters at *release*, by which time the
	// original event is long gone.
	let shiftHeld = false;
	let spaceHeld = false;

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Shift') shiftHeld = true;
		if (e.code === 'Space') spaceHeld = true;
	}
	function onKeyup(e: KeyboardEvent) {
		if (e.key === 'Shift') shiftHeld = false;
		if (e.code === 'Space') spaceHeld = false;
	}

	// ── Imperative API ──

	export function fit(padding = 72, maxZoom = 1.4) {
		controller?.fit(seatBounds(seats, elements), padding, maxZoom);
		viewport = controller?.viewport ?? viewport;
		markDirty();
	}

	export function zoomBy(factor: number) {
		controller?.zoomBy(factor);
		viewport = controller?.viewport ?? viewport;
		markDirty();
	}

	export function getViewport(): Viewport {
		return viewport;
	}

	/** Centre a seat without changing zoom — used by "find my seat". */
	export function centerOnSeat(seatId: string) {
		const seat = seats.find((s) => s.seatId === seatId);
		if (!seat || !controller) return;
		controller.setViewport({
			...viewport,
			x: size.width / 2 - seat.x * viewport.zoom,
			y: size.height / 2 - seat.y * viewport.zoom
		});
		viewport = controller.viewport;
		markDirty();
	}
</script>

<svelte:window on:keydown={onKeydown} on:keyup={onKeyup} />

<div
	bind:this={host}
	class="relative h-full w-full overflow-hidden"
	class:cursor-grab={interactionMode === 'seats' && !hoverCursor}
	style={hoverCursor ? `cursor: ${hoverCursor};` : ''}
>
	<canvas bind:this={canvas} class="block h-full w-full"></canvas>
</div>
