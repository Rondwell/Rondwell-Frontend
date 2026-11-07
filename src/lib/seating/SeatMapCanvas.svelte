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
		type RenderSeat
	} from './render2d';
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
	export let interactionMode: 'seats' | 'elements' = 'seats';
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
			guides,
			marquee: controller?.marquee ?? null,
			canvasBounds,
			dimUnselectable,
			theme
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

					if (interactionMode === 'seats') {
						if (!seatMarquee || spaceHeld) return 'pan';
						// Dragging from a seat pans (so the map stays navigable
						// from anywhere); dragging from empty space rubber-bands.
						const onSeat = index?.nearest(world.x, world.y, hitRadius());
						return onSeat ? 'pan' : 'marquee';
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

					if (interactionMode === 'seats') {
						const seat = index?.nearest(world.x, world.y, hitRadius()) ?? null;
						if (seat) dispatch('seatTap', { seat });
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
					// A drag that starts on an unselected element selects it
					// first, so dragging something always moves what you
					// grabbed rather than a stale selection elsewhere.
					const el = elementAt(elements, world.x, world.y);
					if (el && !selectedElementIds.has(el.id)) {
						dispatch('elementTap', { element: el, additive: false });
					}
				},

				onDragMove: (_world, delta) => {
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
					dispatch('elementDragEnd', {});
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
					if (interactionMode !== 'seats' || ev.pointerType !== 'mouse') return;
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
	class:cursor-grab={interactionMode === 'seats'}
>
	<canvas bind:this={canvas} class="block h-full w-full"></canvas>
</div>
