<script lang="ts">
	/**
	 * Seating & capacity management — the organizer's list of designs.
	 *
	 * Two dead controls were removed here:
	 *
	 *   - "Browse template" opened a modal whose "Use Template" buttons had
	 *     no click handler at all. It now opens the real `TemplatePicker`
	 *     and launches the builder with that venue applied.
	 *   - "Use design" on a published layout had no handler either. A
	 *     published layout is already in use, so the honest thing to show
	 *     is its live inventory — how many of its seats are sold, held and
	 *     free — which is what an organizer opens this page to find out.
	 *
	 * The card previews are rendered from each layout's real elements via
	 * the shared generator, so a 400-seat block appears as 400 seats rather
	 * than as one rectangle.
	 */
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import SeatBuilder from '$lib/seating/SeatBuilder.svelte';
	import SeatingChart from '$lib/seating/SeatingChart.svelte';
	import TemplatePicker from '$lib/seating/TemplatePicker.svelte';
	import { listLayouts, deleteLayout, getInventorySummary } from '$lib/seating/api';
	import { generateSeatsForLayout } from '$lib/seating/geometry';
	import { isSeatGenerating } from '$lib/seating/types';
	import type { SeatLayout, InventorySummary } from '$lib/seating/types';
	import type { VenueTemplate } from '$lib/seating/templates';

	export let eventData: any = null;

	$: eventId = $page.params.id as string;

	let layouts: SeatLayout[] = [];
	let inventory: InventorySummary | null = null;
	let loading = true;
	let showTemplates = false;
	let showEditor = false;
	/** Layout whose live inventory is open in the seating chart. */
	let chartLayoutId: string | null = null;
	let showChart = false;
	let editingLayoutId: string | null = null;
	/** Template to apply once the builder mounts. */
	let pendingTemplate: VenueTemplate | null = null;
	let error = '';
	let busyId = '';

	onMount(load);

	async function load() {
		loading = true;
		try {
			layouts = await listLayouts(eventId);
		} catch (e: any) {
			layouts = [];
			error = e?.message ?? 'Could not load your seating designs.';
		}
		// Inventory only exists once something is published; a failure here
		// must not blank the list, so it is handled separately.
		try {
			inventory = await getInventorySummary(eventId);
		} catch {
			inventory = null;
		}
		loading = false;
	}

	function openNew() {
		editingLayoutId = null;
		pendingTemplate = null;
		showEditor = true;
	}

	function openEdit(layoutId: string) {
		editingLayoutId = layoutId;
		pendingTemplate = null;
		showEditor = true;
	}

	function openWithTemplate(t: VenueTemplate) {
		editingLayoutId = null;
		pendingTemplate = t;
		showEditor = true;
		showTemplates = false;
	}

	async function remove(layout: SeatLayout) {
		const label = layout.status === 'PUBLISHED' ? ' It is currently live.' : '';
		if (!confirm(`Delete “${layout.title}”?${label} This cannot be undone.`)) return;

		busyId = layout.layoutId;
		error = '';
		try {
			await deleteLayout(eventId, layout.layoutId);
			await load();
		} catch (e: any) {
			// The server refuses while any of the layout's seats are sold or
			// held, and says which — surface that rather than a generic fail.
			error = e?.message ?? 'Could not delete that design.';
		} finally {
			busyId = '';
		}
	}

	function onEditorClose() {
		showEditor = false;
		editingLayoutId = null;
		pendingTemplate = null;
		void load();
	}

	/** Seats a layout describes, plus a sampled preview. */
	function describe(layout: SeatLayout) {
		const elements = layout.elements ?? [];
		const { seats } = generateSeatsForLayout(elements, layout.numbering);
		const fixtures = elements
			.filter((el) => !isSeatGenerating(el.type))
			.map((el) => ({ x: el.x, y: el.y, w: el.width, h: el.height }));

		// Thumbnails cannot resolve more than a few hundred dots; drawing
		// 50,000 of them per card would stall the page.
		const step = Math.max(1, Math.ceil(seats.length / 500));
		return {
			total: seats.length,
			dots: seats.filter((_, i) => i % step === 0),
			fixtures
		};
	}

	function formatDate(d?: string) {
		if (!d) return '—';
		return new Date(d).toLocaleDateString('en-US', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

{#if showEditor}
	<SeatBuilder
		{eventId}
		layoutId={editingLayoutId}
		initialTemplate={pendingTemplate}
		on:close={onEditorClose}
		on:saved={() => void load()}
	/>
{:else if showChart}
	<!--
		Live inventory. Fixed-height so the canvas has a viewport to fill —
		a canvas inside an auto-height flow collapses to zero.
	-->
	<div class="h-[min(80vh,760px)] overflow-hidden rounded-xl border bg-white">
		<SeatingChart
			{eventId}
			layoutId={chartLayoutId}
			on:close={() => {
				showChart = false;
				chartLayoutId = null;
				void load();
			}}
		/>
	</div>
{:else}
	<div class="relative">
		<!-- Intro -->
		<div class="mb-6">
			<h2 class="mb-1 text-lg font-semibold">
				Seating &amp; capacity for {eventData?.title ?? 'your event'}
			</h2>
			<p class="max-w-2xl text-sm text-[#8C8F93]">
				Design your venue in 2D or 3D, set seat types and pricing tiers, then publish to make the
				seats bookable.
			</p>
		</div>

		{#if error}
			<div class="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
				<Icon icon="mdi:alert-circle" class="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
				<p class="text-sm text-red-700">{error}</p>
			</div>
		{/if}

		<!-- Live inventory, once anything is published -->
		{#if inventory && inventory.total > 0}
			<div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
				<div class="rounded-xl border bg-white p-3">
					<p class="text-xl font-semibold text-gray-900">{inventory.total.toLocaleString()}</p>
					<p class="text-xs text-gray-500">seats live</p>
				</div>
				<div class="rounded-xl border bg-white p-3">
					<p class="text-xl font-semibold text-emerald-600">
						{inventory.available.toLocaleString()}
					</p>
					<p class="text-xs text-gray-500">available</p>
				</div>
				<div class="rounded-xl border bg-white p-3">
					<p class="text-xl font-semibold text-indigo-600">{inventory.occupied.toLocaleString()}</p>
					<p class="text-xs text-gray-500">sold</p>
				</div>
				<div class="rounded-xl border bg-white p-3">
					<p class="text-xl font-semibold text-amber-600">{inventory.reserved.toLocaleString()}</p>
					<p class="text-xs text-gray-500">on hold</p>
				</div>
			</div>
		{/if}

		{#if loading}
			<div class="flex items-center justify-center py-20">
				<Icon icon="mdi:loading" class="h-8 w-8 animate-spin text-gray-400" />
			</div>
		{:else if layouts.length === 0}
			<!-- Empty state -->
			<div
				class="flex flex-col justify-between gap-4 rounded-xl border-2 border-dashed border-gray-300 p-6 lg:flex-row lg:items-center"
			>
				<div class="space-y-3">
					<h3 class="text-xl font-semibold text-gray-700">Create a seating layout</h3>
					<p class="max-w-lg text-sm text-gray-400">
						Start from a ready-made venue — theatre, arena, banquet, conference and more — or
						draw your own. Every layout works in 2D and 3D.
					</p>
					<div class="flex flex-wrap items-center gap-2">
						<button
							type="button"
							class="flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white"
							on:click={() => (showTemplates = true)}
						>
							<Icon icon="mdi:view-dashboard-outline" class="h-4 w-4" />
							Browse venues
						</button>
						<button
							type="button"
							class="flex items-center gap-2 rounded-lg border border-gray-800 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
							on:click={openNew}
						>
							<Icon icon="mdi:plus" class="h-4 w-4" />
							Start from scratch
						</button>
					</div>
				</div>
				<img src="/rooms.svg" alt="" class="w-44 self-center" />
			</div>
		{:else}
			<div class="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
				<span class="text-lg font-semibold text-gray-900">Your designs</span>
				<div class="flex items-center gap-2">
					<button
						type="button"
						class="rounded-lg border border-gray-800 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
						on:click={() => (showTemplates = true)}
					>
						Browse venues
					</button>
					<button
						type="button"
						class="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
						on:click={openNew}
					>
						New layout
					</button>
				</div>
			</div>

			<div class="grid gap-5 lg:grid-cols-2">
				{#each layouts as layout (layout.layoutId)}
					{@const d = describe(layout)}
					<div class="overflow-hidden rounded-xl border bg-white shadow-sm">
						<!-- Preview from real geometry -->
						<div class="relative h-56 w-full bg-gradient-to-br from-gray-50 to-gray-100">
							{#if d.total > 0 || d.fixtures.length > 0}
								<svg
									viewBox="0 0 {layout.canvasWidth || 1400} {layout.canvasHeight || 1000}"
									class="h-full w-full"
									preserveAspectRatio="xMidYMid meet"
								>
									{#each d.fixtures as f}
										<rect
											x={f.x}
											y={f.y}
											width={f.w}
											height={f.h}
											rx="6"
											fill="#d4d4d8"
											opacity="0.7"
										/>
									{/each}
									{#each d.dots as s}
										<circle
											cx={s.x}
											cy={s.y}
											r={Math.max(4, s.size / 2)}
											fill={layout.seatTypes?.find((t) => t.seatTypeId === s.seatTypeId)?.color ??
												'#6366f1'}
											opacity="0.85"
										/>
									{/each}
								</svg>
							{:else}
								<div class="flex h-full items-center justify-center">
									<span class="text-sm text-gray-400">Empty layout</span>
								</div>
							{/if}

							<span
								class="absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 text-xs font-medium {layout.status ===
								'PUBLISHED'
									? 'bg-emerald-100 text-emerald-700'
									: layout.status === 'ARCHIVED'
										? 'bg-gray-200 text-gray-500'
										: 'bg-amber-100 text-amber-700'}"
							>
								{layout.status === 'PUBLISHED'
									? 'Live'
									: layout.status === 'ARCHIVED'
										? 'Archived'
										: 'Draft'}
							</span>
							<span
								class="absolute bottom-2.5 left-2.5 rounded-full bg-gray-900/80 px-2 py-0.5 text-xs font-medium text-white"
							>
								{d.total.toLocaleString()} seats
							</span>
						</div>

						<div class="p-4">
							<h3 class="truncate text-base font-semibold text-gray-900">{layout.title}</h3>
							<p class="mt-0.5 text-xs text-gray-500">
								{layout.layoutType.replace(/_/g, ' ').toLowerCase()} · updated {formatDate(
									layout.updatedAt
								)}
							</p>

							<!-- Tier breakdown -->
							{#if layout.seatTypes?.length}
								<div class="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
									{#each layout.seatTypes as t (t.seatTypeId)}
										<span class="flex items-center gap-1.5 text-[11px] text-gray-600">
											<span
												class="inline-block h-2.5 w-2.5 rounded-sm"
												style="background-color: {t.color};"
											></span>
											{t.name}
											{#if !t.ticketTypeId}
												<!-- Iconify's component takes no `title`, so the
												     tooltip lives on a wrapper. -->
												<span
													class="inline-flex"
													title="No ticket type attached — these seats cannot be sold"
												>
													<Icon icon="mdi:alert-outline" class="h-3 w-3 text-amber-500" />
												</span>
											{/if}
										</span>
									{/each}
								</div>
							{/if}

							{#if layout.status === 'PUBLISHED'}
								<p class="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-700">
									<Icon icon="mdi:check-circle-outline" class="h-3.5 w-3.5" />
									Attendees are choosing from this map
									{#if layout.materializedSeatCount}
										· {layout.materializedSeatCount.toLocaleString()} bookable seats
									{/if}
								</p>
							{:else if layout.status === 'DRAFT'}
								<p class="mt-2.5 flex items-center gap-1.5 text-xs text-amber-700">
									<Icon icon="mdi:information-outline" class="h-3.5 w-3.5" />
									Not published — attendees cannot pick seats yet
								</p>
							{/if}

							<div class="mt-4 flex flex-wrap items-center gap-2">
								<button
									type="button"
									class="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
									on:click={() => openEdit(layout.layoutId)}
								>
									<Icon
										icon={layout.status === 'PUBLISHED' ? 'mdi:pencil-outline' : 'mdi:palette-outline'}
										class="h-4 w-4"
									/>
									{layout.status === 'PUBLISHED' ? 'Edit layout' : 'Continue editing'}
								</button>
								<button
									type="button"
									class="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
									on:click={() => openEdit(layout.layoutId)}
								>
									<Icon icon="mdi:cube-outline" class="h-4 w-4" />
									View in 3D
								</button>
								{#if layout.status === 'PUBLISHED'}
									<!--
										Only for a published layout: the chart manages
										materialized seats, and a draft has none.
									-->
									<button
										type="button"
										class="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
										on:click={() => {
											chartLayoutId = layout.layoutId;
											showChart = true;
										}}
									>
										<Icon icon="mdi:clipboard-list-outline" class="h-4 w-4" />
										Manage seats
									</button>
								{/if}
								<button
									type="button"
									class="ml-auto flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
									disabled={busyId === layout.layoutId}
									on:click={() => remove(layout)}
								>
									<Icon icon="mdi:delete-outline" class="h-4 w-4" />
									Delete
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<TemplatePicker
	bind:open={showTemplates}
	hasExistingWork={false}
	onApply={openWithTemplate}
	onClose={() => (showTemplates = false)}
/>
