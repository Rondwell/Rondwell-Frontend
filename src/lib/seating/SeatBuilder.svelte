<script lang="ts">
	/**
	 * ══════════════════════════════════════════════════════════════════════
	 *  SEAT LAYOUT BUILDER
	 * ══════════════════════════════════════════════════════════════════════
	 *
	 * Replaces `SeatCanvasBuilder`, which was desktop-only and could place
	 * only one chair at a time.
	 *
	 * ── Placement: tap-to-place, not drag-and-drop ──────────────────────
	 *
	 * The old builder placed elements with HTML5 drag-and-drop
	 * (`draggable` / `dragstart` / `drop`). Those events **never fire on
	 * touch**, so on a phone or tablet there was literally no way to put
	 * anything on the canvas.
	 *
	 * The fix is not "add touch handlers to the drag model" — it is to drop
	 * that model. Picking a tool arms it; the next tap on the canvas places
	 * it there. One interaction, identical on mouse, pen and finger, and
	 * fewer steps than a drag on every device. Everything after placement
	 * (select, move, marquee, pinch-zoom) goes through Pointer Events in
	 * `viewport.ts`.
	 *
	 * ── Why the right panel is the same component on both breakpoints ────
	 *
	 * The old mobile bar exposed a ticket dropdown, a seat-number field and
	 * a colour picker — controls that act on a selected element, on a
	 * layout where nothing could ever be selected. Desktop and mobile now
	 * share `BuilderInspector`; only the container changes (sidebar vs
	 * bottom sheet), so a capability cannot exist on one and silently rot
	 * on the other.
	 */
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import SeatMapCanvas from './SeatMapCanvas.svelte';
	import Seat3DView from './Seat3DView.svelte';
	import BuilderInspector from './BuilderInspector.svelte';
	import SeatTypeManager from './SeatTypeManager.svelte';
	import TemplatePicker from './TemplatePicker.svelte';
	import PublishPanel from './PublishPanel.svelte';
	import { createBuilderStore, seatStats } from './builderStore';
	import { TOOLS, toolsByGroup, getTool, type Tool } from './palette';
	import { deriveRenderSeats, type RenderSeat } from './render2d';
	import type { MaterializationReport } from './types';
	import {
		createLayout,
		updateLayout,
		publishLayout,
		previewPublish,
		getLayout,
		PublishValidationError
	} from './api';
	import { getTicketTypes } from '$lib/services/event.services';
	import type { VenueTemplate } from './templates';

	export let eventId: string;
	export let layoutId: string | null = null;
	/**
	 * Template to apply on mount, for "browse venues → open the builder"
	 * from the designs list. Ignored when `layoutId` is set — an existing
	 * design must never be silently overwritten by a template chosen
	 * before it loaded.
	 */
	export let initialTemplate: VenueTemplate | null = null;

	const dispatch = createEventDispatcher<{ close: void; saved: { layoutId: string } }>();

	const store = createBuilderStore();
	const stats = seatStats(store);

	let canvasRef: SeatMapCanvas | null = null;
	let view: '2D' | '3D' = '2D';

	// Armed tool, or null when in select mode.
	let armedTool: Tool | null = null;
	let toolGroup: 'seating' | 'fixtures' | 'shapes' = 'seating';
	let toolSearch = '';

	let showTemplates = false;
	let showSeatTypes = false;
	let showPublish = false;
	let mobilePanel: 'none' | 'tools' | 'inspect' = 'none';

	let ticketTypes: Array<{ id: string; name: string; price?: number; currency?: string }> = [];
	let saving = false;
	let publishing = false;
	let previewLoading = false;
	let report: MaterializationReport | null = null;
	let toast = '';
	let toastTone: 'ok' | 'error' = 'ok';
	let toastTimer: ReturnType<typeof setTimeout> | null = null;
	let loadingLayout = true;

	let showGrid = true;
	let snapEnabled = true;

	$: s = $store;
	$: selectedElement =
		s.selection.length === 1 ? (s.elements.find((e) => e.id === s.selection[0]) ?? null) : null;
	$: selectionSet = new Set(s.selection);

	/**
	 * Seats for the canvas, generated client-side.
	 *
	 * A draft layout has no materialized inventory, so the builder shows
	 * what publishing *would* create — using the same generator the server
	 * runs, pinned by `scripts/verify-seat-geometry-parity.ts`. Passing
	 * `null` inventory marks everything available, which is the right
	 * reading for a design that is not live yet.
	 */
	$: renderSeats = deriveRenderSeats(s.elements, null);

	$: seatTypeCounts = Object.fromEntries(
		$stats.bySeatType.map((t) => [t.seatTypeId ?? '', t.count])
	) as Record<string, number>;

	$: visibleTools = toolsByGroup(toolGroup, toolSearch);

	// ── Load ──

	onMount(async () => {
		try {
			const raw = await getTicketTypes(eventId);
			ticketTypes = (raw ?? []).map((t: any) => ({
				id: t._id ?? t.id ?? t.ticketTypeId,
				name: t.name ?? 'Ticket',
				price: t.price,
				currency: t.currency
			}));
		} catch {
			ticketTypes = [];
		}

		if (layoutId) {
			try {
				const layout = await getLayout(eventId, layoutId);
				store.load(layout);
				view = layout.defaultView ?? '2D';
			} catch (err: any) {
				notify(err?.message ?? 'Could not load that design.', 'error');
			}
		} else if (initialTemplate) {
			applyTemplate(initialTemplate);
		}
		loadingLayout = false;
		requestAnimationFrame(() => canvasRef?.fit());
	});

	onDestroy(() => {
		if (toastTimer) clearTimeout(toastTimer);
	});

	function notify(text: string, tone: 'ok' | 'error' = 'ok') {
		toast = text;
		toastTone = tone;
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toast = ''), 4500);
	}

	// ── Placement ──

	function armTool(tool: Tool) {
		// Tapping the armed tool again disarms it, so there is always a way
		// back to select mode without hunting for a separate button.
		armedTool = armedTool?.type === tool.type ? null : tool;
		mobilePanel = 'none';
	}

	/**
	 * Place the armed tool at the tapped point, then disarm.
	 *
	 * Disarming after one placement is deliberate: an armed tool that
	 * persists turns an attempt to select the thing you just made into a
	 * second copy on top of it. Repeat placement is Duplicate (Ctrl+D),
	 * which is explicit.
	 */
	function placeAt(world: { x: number; y: number }) {
		if (!armedTool) return;
		const seatTypeId =
			armedTool.group === 'seating'
				? (s.seatTypes.find((t) => t.ticketTypeId)?.seatTypeId ??
					s.seatTypes[0]?.seatTypeId ??
					null)
				: null;
		store.add(armedTool.make(world.x, world.y, seatTypeId));
		armedTool = null;
	}

	// ── Canvas events ──

	function onElementTap(e: CustomEvent<{ element: any; additive: boolean }>) {
		const { element, additive } = e.detail;

		if (armedTool) {
			// An armed tool wins over selection — the tap was intended as a
			// placement, even if it landed on something.
			return;
		}
		if (!element) {
			store.clearSelection();
			return;
		}
		if (additive) store.toggleSelect(element.id);
		else store.select([element.id]);
	}

	function onMarqueeEnd(e: CustomEvent<{ elements: any[]; additive: boolean }>) {
		const ids = e.detail.elements.map((el) => el.id);
		if (e.detail.additive) store.addToSelection(ids);
		else store.select(ids);
	}

	function onElementDrag(e: CustomEvent<{ ids: string[]; dx: number; dy: number }>) {
		store.move(e.detail.ids, e.detail.dx, e.detail.dy);
	}

	// ── Keyboard ──

	function onKeydown(ev: KeyboardEvent) {
		const target = ev.target as HTMLElement | null;
		// Never steal keys from a field the organizer is typing in.
		if (
			target &&
			(target.tagName === 'INPUT' ||
				target.tagName === 'TEXTAREA' ||
				target.tagName === 'SELECT' ||
				target.isContentEditable)
		) {
			return;
		}

		const mod = ev.ctrlKey || ev.metaKey;

		if (mod && ev.key.toLowerCase() === 'z' && !ev.shiftKey) {
			ev.preventDefault();
			store.undo();
			return;
		}
		if ((mod && ev.key.toLowerCase() === 'y') || (mod && ev.shiftKey && ev.key.toLowerCase() === 'z')) {
			ev.preventDefault();
			store.redo();
			return;
		}
		if (mod && ev.key.toLowerCase() === 'a') {
			ev.preventDefault();
			store.selectAll();
			return;
		}
		if (mod && ev.key.toLowerCase() === 'd') {
			ev.preventDefault();
			store.duplicate(s.selection);
			return;
		}
		if (mod && ev.key.toLowerCase() === 's') {
			ev.preventDefault();
			void save();
			return;
		}
		if (ev.key === 'Delete' || ev.key === 'Backspace') {
			if (s.selection.length) {
				ev.preventDefault();
				store.remove(s.selection);
			}
			return;
		}
		if (ev.key === 'Escape') {
			armedTool = null;
			store.clearSelection();
			return;
		}
		// Nudge. Shift moves by 10 for coarse positioning.
		const step = ev.shiftKey ? 10 : 1;
		const nudges: Record<string, [number, number]> = {
			ArrowLeft: [-step, 0],
			ArrowRight: [step, 0],
			ArrowUp: [0, -step],
			ArrowDown: [0, step]
		};
		const nudge = nudges[ev.key];
		if (nudge && s.selection.length) {
			ev.preventDefault();
			store.move(s.selection, nudge[0], nudge[1], `nudge-${ev.key}`);
		}
	}

	// ── Save / publish ──

	async function save(): Promise<string | null> {
		if (saving) return s.layoutId;
		saving = true;
		try {
			const payload = store.toPayload();
			if (s.layoutId) {
				await updateLayout(eventId, s.layoutId, payload);
				store.markSaved(s.layoutId, s.status);
				notify('Saved.');
				return s.layoutId;
			}
			const created = await createLayout(eventId, payload as any);
			store.markSaved(created.layoutId, created.status);
			dispatch('saved', { layoutId: created.layoutId });
			notify('Saved.');
			return created.layoutId;
		} catch (err: any) {
			if (err instanceof PublishValidationError && err.issues?.length) {
				notify(err.issues[0].message, 'error');
			} else {
				notify(err?.message ?? 'Could not save.', 'error');
			}
			return null;
		} finally {
			saving = false;
		}
	}

	/**
	 * Save, then dry-run the publish so the organizer sees the outcome
	 * before committing. The validation runs server-side against real
	 * inventory, which is the only place that knows what is already sold.
	 */
	async function openPublish() {
		showPublish = true;
		previewLoading = true;
		report = null;
		try {
			const id = await save();
			if (!id) return;
			report = await previewPublish(eventId, id);
		} catch (err: any) {
			if (err instanceof PublishValidationError && err.report) report = err.report;
			else notify(err?.message ?? 'Could not check the design.', 'error');
		} finally {
			previewLoading = false;
		}
	}

	async function doPublish() {
		if (!s.layoutId) return;
		publishing = true;
		try {
			const result = await publishLayout(eventId, s.layoutId);
			store.markSaved(s.layoutId, 'PUBLISHED');
			report = result.report;
			showPublish = false;
			notify(
				`Published — ${result.report.generated.toLocaleString()} seats are now bookable.`
			);
		} catch (err: any) {
			if (err instanceof PublishValidationError && err.report) {
				report = err.report;
				notify('The design needs fixing before it can be published.', 'error');
			} else {
				notify(err?.message ?? 'Could not publish.', 'error');
			}
		} finally {
			publishing = false;
		}
	}

	function applyTemplate(t: VenueTemplate) {
		// Built once. `build()` mints fresh element ids on every call, so
		// calling it twice would discard the set just handed to the store
		// and read `defaultView` off a different object.
		const built = t.build();
		store.applyTemplate(built);
		view = built.defaultView;
		requestAnimationFrame(() => canvasRef?.fit());
		notify(`Applied “${t.name}”. Undo with Ctrl+Z if that wasn’t what you wanted.`);
	}

	function requestClose() {
		if (s.dirty && !confirm('You have unsaved changes. Leave the builder anyway?')) return;
		dispatch('close');
	}
</script>

<svelte:window on:keydown={onKeydown} />

<div class="fixed inset-0 z-50 flex h-screen w-full flex-col bg-[#F6F3F7]">
	<!-- ══ TOP BAR ══ -->
	<header class="shrink-0 border-b bg-white">
		<div class="flex items-center gap-2 px-3 py-2.5 sm:px-4">
			<button
				type="button"
				aria-label="Close the builder"
				class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border hover:bg-gray-50"
				on:click={requestClose}
			>
				<Icon icon="mdi:arrow-left" class="h-4 w-4 text-gray-600" />
			</button>

			<input
				value={s.title}
				aria-label="Layout title"
				placeholder="Layout title"
				class="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm font-semibold outline-none hover:border-gray-200 focus:border-gray-300 sm:text-base"
				on:change={(e) => store.setTitle(e.currentTarget.value)}
			/>

			<!-- Live seat count: the number the organizer actually cares about -->
			<div class="hidden items-center gap-2 sm:flex">
				<span class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
					{$stats.total.toLocaleString()} seats
				</span>
				{#if $stats.duplicates.length}
					<span
						class="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700"
						title={$stats.duplicates.slice(0, 20).join(', ')}
					>
						{$stats.duplicates.length} duplicate label{$stats.duplicates.length === 1 ? '' : 's'}
					</span>
				{/if}
				{#if s.status === 'PUBLISHED'}
					<span class="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
						Live
					</span>
				{/if}
				{#if s.dirty}
					<span class="text-xs text-gray-400">Unsaved</span>
				{/if}
			</div>

			<div class="flex shrink-0 items-center gap-1.5">
				<button
					type="button"
					class="hidden rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 sm:block"
					disabled={saving}
					on:click={() => save()}
				>
					{saving ? 'Saving…' : 'Save'}
				</button>
				<button
					type="button"
					class="rounded-lg bg-gradient-to-r from-pink-500 to-indigo-600 px-3 py-2 text-sm font-medium text-white sm:px-4"
					on:click={openPublish}
				>
					{s.status === 'PUBLISHED' ? 'Update' : 'Publish'}
				</button>
			</div>
		</div>

		<!-- Toolbar -->
		<div class="flex items-center gap-1 overflow-x-auto border-t px-3 py-1.5 sm:px-4">
			<button
				type="button"
				aria-label="Undo"
				title="Undo (Ctrl+Z)"
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-gray-100 disabled:opacity-30"
				disabled={!store.canUndo()}
				on:click={store.undo}
			>
				<Icon icon="mdi:undo" class="h-4 w-4 text-gray-600" />
			</button>
			<button
				type="button"
				aria-label="Redo"
				title="Redo (Ctrl+Y)"
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-gray-100 disabled:opacity-30"
				disabled={!store.canRedo()}
				on:click={store.redo}
			>
				<Icon icon="mdi:redo" class="h-4 w-4 text-gray-600" />
			</button>

			<div class="mx-1 h-5 w-px shrink-0 bg-gray-200"></div>

			<button
				type="button"
				aria-label="Zoom out"
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-gray-100"
				on:click={() => canvasRef?.zoomBy(1 / 1.25)}
			>
				<Icon icon="mdi:magnify-minus-outline" class="h-4 w-4 text-gray-600" />
			</button>
			<button
				type="button"
				aria-label="Zoom in"
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-gray-100"
				on:click={() => canvasRef?.zoomBy(1.25)}
			>
				<Icon icon="mdi:magnify-plus-outline" class="h-4 w-4 text-gray-600" />
			</button>
			<button
				type="button"
				class="shrink-0 rounded-md px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
				on:click={() => canvasRef?.fit()}
			>
				Fit
			</button>

			<div class="mx-1 h-5 w-px shrink-0 bg-gray-200"></div>

			<button
				type="button"
				class="shrink-0 rounded-md px-2 py-1.5 text-xs hover:bg-gray-100 {showGrid
					? 'text-pink-600'
					: 'text-gray-600'}"
				on:click={() => (showGrid = !showGrid)}
			>
				<Icon icon="mdi:grid" class="mr-1 inline h-3.5 w-3.5" />Grid
			</button>
			<button
				type="button"
				class="shrink-0 rounded-md px-2 py-1.5 text-xs hover:bg-gray-100 {snapEnabled
					? 'text-pink-600'
					: 'text-gray-600'}"
				on:click={() => (snapEnabled = !snapEnabled)}
			>
				<Icon icon="mdi:magnet" class="mr-1 inline h-3.5 w-3.5" />Snap
			</button>

			<div class="mx-1 h-5 w-px shrink-0 bg-gray-200"></div>

			<!-- 2D / 3D -->
			<div class="flex shrink-0 overflow-hidden rounded-md border">
				<button
					type="button"
					class="px-2.5 py-1.5 text-xs font-medium {view === '2D'
						? 'bg-gray-900 text-white'
						: 'text-gray-600'}"
					on:click={() => (view = '2D')}
				>
					2D
				</button>
				<button
					type="button"
					class="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium {view === '3D'
						? 'bg-gray-900 text-white'
						: 'text-gray-600'}"
					on:click={() => (view = '3D')}
				>
					<Icon icon="mdi:cube-outline" class="h-3.5 w-3.5" />3D
				</button>
			</div>

			<div class="mx-1 h-5 w-px shrink-0 bg-gray-200"></div>

			<button
				type="button"
				class="shrink-0 rounded-md px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
				on:click={() => (showTemplates = true)}
			>
				<Icon icon="mdi:view-dashboard-outline" class="mr-1 inline h-3.5 w-3.5" />Templates
			</button>
			<button
				type="button"
				class="shrink-0 rounded-md px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
				on:click={() => (showSeatTypes = true)}
			>
				<Icon icon="mdi:palette-outline" class="mr-1 inline h-3.5 w-3.5" />Seat types
			</button>

			<span class="ml-auto shrink-0 pl-2 text-xs text-gray-400 sm:hidden">
				{$stats.total.toLocaleString()} seats
			</span>
		</div>
	</header>

	<!-- ══ BODY ══ -->
	<div class="flex min-h-0 flex-1">
		<!-- Tool palette (desktop) -->
		<aside class="hidden w-[232px] shrink-0 flex-col border-r bg-white md:flex">
			<div class="border-b p-3">
				<div class="flex items-center rounded-lg bg-gray-100 px-2 py-1.5">
					<Icon icon="mdi:magnify" class="mr-1.5 h-4 w-4 text-gray-400" />
					<input
						bind:value={toolSearch}
						placeholder="Search tools"
						class="w-full bg-transparent text-sm outline-none"
					/>
				</div>
				<div class="mt-2 flex gap-1">
					{#each [['seating', 'Seating'], ['fixtures', 'Venue'], ['shapes', 'Labels']] as [g, label]}
						<button
							type="button"
							class="flex-1 rounded-md py-1.5 text-[11px] font-medium {toolGroup === g
								? 'bg-gray-900 text-white'
								: 'bg-gray-100 text-gray-700'}"
							on:click={() => (toolGroup = g as any)}
						>
							{label}
						</button>
					{/each}
				</div>
			</div>

			<div class="flex-1 overflow-y-auto p-3">
				<div class="grid grid-cols-2 gap-2">
					{#each visibleTools as tool (tool.type)}
						<button
							type="button"
							class="flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center transition-all hover:border-pink-400 hover:bg-pink-50 {armedTool?.type ===
							tool.type
								? 'border-pink-500 bg-pink-50 ring-2 ring-pink-200'
								: ''}"
							title={tool.hint}
							on:click={() => armTool(tool)}
						>
							<Icon icon={tool.icon} class="h-5 w-5 text-gray-500" />
							<span class="text-[11px] leading-tight font-medium text-gray-700">{tool.label}</span>
							{#if tool.defaultSeats > 0}
								<span class="text-[10px] text-gray-400">{tool.defaultSeats} seats</span>
							{/if}
						</button>
					{/each}
				</div>

				{#if visibleTools.length === 0}
					<p class="py-6 text-center text-xs text-gray-400">No tools match “{toolSearch}”.</p>
				{/if}
			</div>

			<!-- Tier summary -->
			<div class="border-t p-3">
				<div class="mb-1.5 flex items-center justify-between">
					<span class="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
						Seat types
					</span>
					<button
						type="button"
						class="text-[11px] text-pink-600 underline"
						on:click={() => (showSeatTypes = true)}
					>
						Edit
					</button>
				</div>
				<div class="space-y-1">
					{#each $stats.bySeatType as t (t.seatTypeId)}
						<div class="flex items-center gap-1.5 text-[11px]">
							<span class="h-2.5 w-2.5 shrink-0 rounded-sm" style="background-color: {t.color};"></span>
							<span class="min-w-0 flex-1 truncate text-gray-700">{t.name}</span>
							<span class="shrink-0 text-gray-400">{t.count}</span>
						</div>
					{/each}
					{#if $stats.unassigned > 0}
						<div class="flex items-center gap-1.5 text-[11px] text-amber-600">
							<Icon icon="mdi:alert-outline" class="h-3 w-3 shrink-0" />
							<span>{$stats.unassigned} seats with no type</span>
						</div>
					{/if}
				</div>
			</div>
		</aside>

		<!-- Canvas -->
		<main class="relative min-w-0 flex-1">
			{#if loadingLayout}
				<div class="absolute inset-0 z-10 flex items-center justify-center bg-[#F6F3F7]">
					<Icon icon="mdi:loading" class="h-7 w-7 animate-spin text-gray-400" />
				</div>
			{/if}

			{#if view === '2D'}
				<SeatMapCanvas
					bind:this={canvasRef}
					elements={s.elements}
					seats={renderSeats}
					seatTypes={s.seatTypes}
					selectedElementIds={selectionSet}
					selectedSeatIds={new Set()}
					interactionMode="elements"
					{showGrid}
					{snapEnabled}
					dimUnselectable={false}
					canvasBounds={{ width: s.canvasWidth, height: s.canvasHeight }}
					on:elementTap={onElementTap}
					on:marqueeEnd={onMarqueeEnd}
					on:elementDrag={onElementDrag}
					on:elementDragEnd={() => store.endCoalesce()}
					on:longPress={(e) => {
						// Long-press is the touch equivalent of right-click:
						// select what was pressed and open the inspector sheet.
						if (e.detail.element) {
							store.select([e.detail.element.id]);
							mobilePanel = 'inspect';
						}
					}}
				/>

				<!-- Placement overlay. A transparent layer rather than a mode
				     inside the canvas, so an armed tool cannot be confused
				     with a selection drag. -->
				{#if armedTool}
					<button
						type="button"
						class="absolute inset-0 z-20 cursor-crosshair"
						aria-label={`Tap to place ${armedTool.label}`}
						on:pointerdown|preventDefault={(ev) => {
							const host = ev.currentTarget as HTMLElement;
							const rect = host.getBoundingClientRect();
							const vp = canvasRef?.getViewport() ?? { x: 0, y: 0, zoom: 1 };
							placeAt({
								x: (ev.clientX - rect.left - vp.x) / vp.zoom,
								y: (ev.clientY - rect.top - vp.y) / vp.zoom
							});
						}}
					></button>

					<div
						class="pointer-events-none absolute top-3 left-1/2 z-30 -translate-x-1/2 rounded-full bg-gray-900 px-3.5 py-2 text-xs font-medium text-white shadow-lg"
					>
						Tap the canvas to place {armedTool.label}
						<span class="ml-1.5 text-white/50">Esc to cancel</span>
					</div>
				{/if}

				{#if !armedTool && s.elements.length === 0 && !loadingLayout}
					<div class="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
						<div class="pointer-events-auto max-w-sm rounded-2xl bg-white/95 p-5 text-center shadow-sm ring-1 ring-black/5">
							<Icon icon="mdi:seat-outline" class="mx-auto mb-2 h-8 w-8 text-gray-300" />
							<p class="text-sm font-semibold text-gray-800">Start your seat map</p>
							<p class="mt-1 text-xs text-gray-500">
								Pick a ready-made venue, or choose a tool and tap the canvas to place it.
							</p>
							<button
								type="button"
								class="mt-3 rounded-lg bg-gray-900 px-3.5 py-2 text-xs font-medium text-white"
								on:click={() => (showTemplates = true)}
							>
								Browse venues
							</button>
						</div>
					</div>
				{/if}
			{:else}
				<Seat3DView
					elements={s.elements}
					seats={[]}
					seatTypes={s.seatTypes}
					stageView={s.stageView}
					selectedIds={[]}
					interactive={false}
				/>
				<div
					class="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1.5 text-[11px] text-white backdrop-blur"
				>
					Preview — switch to 2D to edit
				</div>
			{/if}
		</main>

		<!-- Inspector (desktop) -->
		<aside class="hidden w-[280px] shrink-0 overflow-y-auto border-l bg-white p-4 md:block">
			<BuilderInspector
				element={selectedElement}
				multiCount={s.selection.length}
				seatTypes={s.seatTypes}
				layoutNumbering={s.numbering}
				{ticketTypes}
				onPatch={(patch, key) =>
					selectedElement && store.patch(selectedElement.id, patch, key ?? null)}
				onPatchAll={(patch, key) => store.patchSelected(patch, key ?? null)}
				onDuplicate={() => store.duplicate(s.selection)}
				onDelete={() => store.remove(s.selection)}
				onAlign={(mode) => store.align(s.selection, mode)}
				onDistribute={(axis) => store.distribute(s.selection, axis)}
				onReorder={(dir) => store.reorder(s.selection, dir)}
				onEditSeatTypes={() => (showSeatTypes = true)}
			/>
		</aside>
	</div>

	<!-- ══ MOBILE BOTTOM BAR ══ -->
	<nav class="shrink-0 border-t bg-white md:hidden">
		<div class="flex items-stretch">
			<button
				type="button"
				class="flex flex-1 flex-col items-center gap-0.5 py-2.5 {mobilePanel === 'tools'
					? 'text-pink-600'
					: 'text-gray-600'}"
				on:click={() => (mobilePanel = mobilePanel === 'tools' ? 'none' : 'tools')}
			>
				<Icon icon="mdi:plus-box-outline" class="h-5 w-5" />
				<span class="text-[10px] font-medium">Add</span>
			</button>
			<button
				type="button"
				class="flex flex-1 flex-col items-center gap-0.5 py-2.5 {mobilePanel === 'inspect'
					? 'text-pink-600'
					: 'text-gray-600'}"
				on:click={() => (mobilePanel = mobilePanel === 'inspect' ? 'none' : 'inspect')}
			>
				<Icon icon="mdi:tune-variant" class="h-5 w-5" />
				<span class="text-[10px] font-medium">
					Edit{s.selection.length > 1 ? ` (${s.selection.length})` : ''}
				</span>
			</button>
			<button
				type="button"
				class="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-gray-600"
				on:click={() => canvasRef?.fit()}
			>
				<Icon icon="mdi:fit-to-screen-outline" class="h-5 w-5" />
				<span class="text-[10px] font-medium">Fit</span>
			</button>
			<button
				type="button"
				class="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-gray-600 disabled:opacity-40"
				disabled={saving}
				on:click={() => save()}
			>
				<Icon icon="mdi:content-save-outline" class="h-5 w-5" />
				<span class="text-[10px] font-medium">{s.dirty ? 'Save*' : 'Save'}</span>
			</button>
		</div>
	</nav>

	<!-- Mobile sheets -->
	{#if mobilePanel !== 'none'}
		<div class="fixed inset-0 z-[55] flex items-end md:hidden">
			<button
				type="button"
				aria-label="Close panel"
				class="absolute inset-0 bg-black/30"
				on:click={() => (mobilePanel = 'none')}
			></button>

			<div class="relative max-h-[72vh] w-full overflow-y-auto rounded-t-2xl bg-white pb-4">
				<div class="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
					<h2 class="text-sm font-semibold">
						{mobilePanel === 'tools' ? 'Add to the map' : 'Edit selection'}
					</h2>
					<button
						type="button"
						aria-label="Close"
						class="flex h-7 w-7 items-center justify-center rounded-full border text-gray-500"
						on:click={() => (mobilePanel = 'none')}
					>
						<Icon icon="mdi:close" class="h-4 w-4" />
					</button>
				</div>

				<div class="px-4 pt-3">
					{#if mobilePanel === 'tools'}
						<div class="mb-3 flex gap-1">
							{#each [['seating', 'Seating'], ['fixtures', 'Venue'], ['shapes', 'Labels']] as [g, label]}
								<button
									type="button"
									class="flex-1 rounded-md py-2 text-xs font-medium {toolGroup === g
										? 'bg-gray-900 text-white'
										: 'bg-gray-100 text-gray-700'}"
									on:click={() => (toolGroup = g as any)}
								>
									{label}
								</button>
							{/each}
						</div>

						<div class="grid grid-cols-3 gap-2">
							{#each visibleTools as tool (tool.type)}
								<button
									type="button"
									class="flex flex-col items-center gap-1 rounded-xl border p-3 text-center"
									on:click={() => armTool(tool)}
								>
									<Icon icon={tool.icon} class="h-6 w-6 text-gray-500" />
									<span class="text-[11px] leading-tight font-medium text-gray-700">
										{tool.label}
									</span>
									{#if tool.defaultSeats > 0}
										<span class="text-[10px] text-gray-400">{tool.defaultSeats}</span>
									{/if}
								</button>
							{/each}
						</div>

						<div class="mt-3 grid grid-cols-2 gap-2">
							<button
								type="button"
								class="rounded-lg border py-2.5 text-xs font-medium"
								on:click={() => {
									showTemplates = true;
									mobilePanel = 'none';
								}}
							>
								Browse venues
							</button>
							<button
								type="button"
								class="rounded-lg border py-2.5 text-xs font-medium"
								on:click={() => {
									showSeatTypes = true;
									mobilePanel = 'none';
								}}
							>
								Seat types
							</button>
						</div>
					{:else}
						<BuilderInspector
							element={selectedElement}
							multiCount={s.selection.length}
							seatTypes={s.seatTypes}
							layoutNumbering={s.numbering}
							{ticketTypes}
							onPatch={(patch, key) =>
								selectedElement && store.patch(selectedElement.id, patch, key ?? null)}
							onPatchAll={(patch, key) => store.patchSelected(patch, key ?? null)}
							onDuplicate={() => store.duplicate(s.selection)}
							onDelete={() => {
								store.remove(s.selection);
								mobilePanel = 'none';
							}}
							onAlign={(mode) => store.align(s.selection, mode)}
							onDistribute={(axis) => store.distribute(s.selection, axis)}
							onReorder={(dir) => store.reorder(s.selection, dir)}
							onEditSeatTypes={() => {
								showSeatTypes = true;
								mobilePanel = 'none';
							}}
						/>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Toast -->
	{#if toast}
		<div
			class="pointer-events-none fixed bottom-20 left-1/2 z-[80] max-w-[90vw] -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg md:bottom-6 {toastTone ===
			'error'
				? 'bg-red-600'
				: 'bg-gray-900'}"
			role="status"
			aria-live="polite"
		>
			{toast}
		</div>
	{/if}
</div>

<!-- Modals -->
<TemplatePicker
	bind:open={showTemplates}
	hasExistingWork={s.elements.length > 0}
	onApply={applyTemplate}
	onClose={() => (showTemplates = false)}
/>

<SeatTypeManager
	bind:open={showSeatTypes}
	seatTypes={s.seatTypes}
	{ticketTypes}
	counts={seatTypeCounts}
	onUpsert={(t) => store.upsertSeatType(t)}
	onRemove={(id) => store.removeSeatType(id)}
	onClose={() => (showSeatTypes = false)}
/>

<PublishPanel
	bind:open={showPublish}
	{report}
	loading={previewLoading}
	{publishing}
	isPublished={s.status === 'PUBLISHED'}
	onPublish={doPublish}
	onClose={() => (showPublish = false)}
/>
