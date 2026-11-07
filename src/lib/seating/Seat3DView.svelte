<script lang="ts">
	/**
	 * 3D seat map.
	 *
	 * A thin lifecycle shell: Three.js lives in `scene3d.ts`, which this
	 * mounts, feeds and tears down. Keeping the WebGL out of the component
	 * means the renderer is plain TypeScript — testable, and not re-created
	 * by an unrelated reactive update.
	 *
	 * Three.js is imported dynamically so the ~160kb chunk is fetched only
	 * when somebody actually opens the 3D view. Most attendees never do,
	 * and it must not sit in the critical path of the registration modal.
	 */
	import { onDestroy, onMount, createEventDispatcher } from 'svelte';
	import type { LayoutElement, Seat, SeatType, StageView } from './types';
	import type { SceneSeat, SeatScene } from './scene3d';

	export let elements: LayoutElement[] = [];
	export let seats: Seat[] = [];
	export let seatTypes: SeatType[] = [];
	export let stageView: StageView | null = null;
	export let selectedIds: string[] = [];
	export let interactive = true;
	/**
	 * No `ticketTypeId` prop: the public endpoint already filters `seats`
	 * to the selected tier, and the caller re-checks selectability against
	 * its own render set before acting on a pick. A second copy of that
	 * rule here would be a third place for it to disagree.
	 */

	const dispatch = createEventDispatcher<{
		pick: { seatId: string; label: string };
		hover: { seatId: string | null; label?: string };
	}>();

	let canvas: HTMLCanvasElement;
	let scene: SeatScene | null = null;
	let loading = true;
	let failed = '';
	let hoverLabel = '';
	let resizeObserver: ResizeObserver | null = null;

	/** Inventory → the renderer's flatter seat shape. */
	function toSceneSeats(list: Seat[]): SceneSeat[] {
		return (list ?? []).map((s) => ({
			seatId: s.seatId,
			x: s.x ?? 0,
			y: s.y ?? 0,
			z: s.z ?? 0,
			status: s.status,
			seatTypeId: s.seatTypeId ?? null,
			label: s.seatNumber,
			section: s.section,
			isAccessible: s.isAccessible
		}));
	}

	onMount(async () => {
		try {
			// Dynamic import: see the component docblock.
			const { createSeatScene } = await import('./scene3d');

			scene = createSeatScene(canvas, {
				interactive,
				onReady: () => (loading = false),
				onPick: (seat) => {
					if (!seat) return;
					dispatch('pick', { seatId: seat.seatId, label: seat.label });
				},
				onHover: (seat) => {
					hoverLabel = seat ? `${seat.section ? seat.section + ' · ' : ''}${seat.label}` : '';
					dispatch('hover', { seatId: seat?.seatId ?? null, label: seat?.label });
				}
			});

			scene.setLayout(elements, toSceneSeats(seats), seatTypes, stageView);
			scene.setSelection(selectedIds);

			/**
			 * The canvas is sized from its parent, so a pane resize (sidebar
			 * toggle, orientation change) has to be observed — a window
			 * `resize` listener alone misses every layout-driven change and
			 * leaves the render stretched.
			 */
			if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
				resizeObserver = new ResizeObserver(() => scene?.resize());
				resizeObserver.observe(canvas.parentElement);
			}
		} catch (err: any) {
			// WebGL can be unavailable: blocklisted driver, a headless
			// browser, or too many live contexts. Say so and let the caller
			// fall back to 2D rather than showing a dead black rectangle.
			failed = 'Your browser or device could not start the 3D view.';
			loading = false;
			console.error('[Seat3DView] init failed', err);
		}
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
		resizeObserver = null;
		scene?.dispose();
		scene = null;
	});

	// Rebuild when the design changes; recolour when only selection does.
	$: if (scene && elements) {
		scene.setLayout(elements, toSceneSeats(seats), seatTypes, stageView);
		scene.setSelection(selectedIds);
	}
	$: if (scene) scene.setSelection(selectedIds);

	export function viewFromSeat(seatId: string) {
		scene?.viewFromSeat(seatId);
	}
	export function resetView() {
		scene?.resetView();
	}
</script>

<div class="relative h-full w-full overflow-hidden bg-[#0b0b12]">
	<canvas bind:this={canvas} class="block h-full w-full"></canvas>

	{#if loading && !failed}
		<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
			<div class="flex flex-col items-center gap-3 text-white/70">
				<div
					class="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80"
				></div>
				<span class="text-sm">Building the 3D view…</span>
			</div>
		</div>
	{/if}

	{#if failed}
		<div class="absolute inset-0 flex items-center justify-center p-6 text-center">
			<div class="max-w-sm space-y-2">
				<p class="text-sm font-medium text-white">{failed}</p>
				<p class="text-xs text-white/60">Switch to the 2D map to choose your seat.</p>
			</div>
		</div>
	{/if}

	{#if hoverLabel && !failed}
		<div
			class="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-3 py-1.5 text-xs font-medium text-white backdrop-blur"
		>
			{hoverLabel}
		</div>
	{/if}

	{#if !failed && !loading}
		<div
			class="pointer-events-none absolute top-3 right-3 rounded-lg bg-black/55 px-2.5 py-1.5 text-[11px] leading-snug text-white/75 backdrop-blur"
		>
			Drag to orbit · Scroll to zoom
		</div>
	{/if}
</div>
