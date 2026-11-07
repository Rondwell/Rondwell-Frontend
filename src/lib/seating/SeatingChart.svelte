<script lang="ts">
	/**
	 * ══════════════════════════════════════════════════════════════════════
	 *  ORGANIZER SEATING CHART — live inventory
	 * ══════════════════════════════════════════════════════════════════════
	 *
	 * The builder designs the venue; this manages the seats that design
	 * produced. There was no equivalent before, because publishing never
	 * created any inventory to manage.
	 *
	 * What it is for:
	 *
	 *   - seeing what is actually sold, held and free, on the map rather
	 *     than as a number;
	 *   - **withholding seats from sale** — production holds, press seats,
	 *     a bank behind a pillar with no sightline. That is a real and
	 *     routine venue operation with no previous home in the product.
	 *
	 * Blocking is `BLOCKED`, not `OCCUPIED`: a blocked seat has no
	 * registration behind it. Overloading `OCCUPIED` would make the
	 * organizer's own holds appear in this chart as attendees who do not
	 * exist, and count them as sold in revenue reconciliation.
	 *
	 * The server refuses to block a seat that is already sold or held and
	 * reports which ones it skipped — that needs a refund or a
	 * reassignment, not a status flip underneath somebody.
	 */
	import { createEventDispatcher, onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import SeatMapCanvas from './SeatMapCanvas.svelte';
	import { deriveRenderSeats, type RenderSeat } from './render2d';
	import { getPublicSeatMap, listSeats, setSeatsBlocked, getLayout } from './api';
	import type { LayoutElement, Seat, SeatType, InventorySummary } from './types';

	export let eventId: string;
	/** The published layout. Falls back to the live public map. */
	export let layoutId: string | null = null;

	const dispatch = createEventDispatcher<{ close: void }>();

	let loading = true;
	let elements: LayoutElement[] = [];
	let seatTypes: SeatType[] = [];
	let canvasSize = { width: 1400, height: 1000 };
	let inventory: Seat[] = [];
	let renderSeats: RenderSeat[] = [];
	let canvasRef: SeatMapCanvas | null = null;

	let selected = new Set<string>();
	let busy = false;
	let message = '';
	let messageTone: 'ok' | 'error' = 'ok';
	let blockReason = '';
	let hovered: RenderSeat | null = null;
	let statusFilter: 'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BLOCKED' = 'ALL';

	onMount(load);

	async function load() {
		loading = true;
		try {
			// Geometry: prefer the named layout so an organizer can inspect a
			// specific design; otherwise take whatever is live.
			if (layoutId) {
				const layout = await getLayout(eventId, layoutId);
				elements = layout.elements ?? [];
				seatTypes = layout.seatTypes ?? [];
				canvasSize = {
					width: layout.canvasWidth ?? 1400,
					height: layout.canvasHeight ?? 1000
				};
			} else {
				const map = await getPublicSeatMap(eventId);
				elements = map.layout?.elements ?? [];
				seatTypes = map.layout?.seatTypes ?? [];
				canvasSize = {
					width: map.layout?.canvasWidth ?? 1400,
					height: map.layout?.canvasHeight ?? 1000
				};
			}

			/**
			 * Seats come from the **organizer** endpoint, not the public one.
			 * The public map withholds blocked seats entirely — correct for an
			 * attendee, useless here, since unblocking them is the main thing
			 * this screen does.
			 */
			inventory = await listSeats(eventId);
		} catch (e: any) {
			notify(e?.message ?? 'Could not load the seating chart.', 'error');
		} finally {
			loading = false;
		}
	}

	function notify(text: string, tone: 'ok' | 'error' = 'ok') {
		message = text;
		messageTone = tone;
		setTimeout(() => (message = ''), 6000);
	}

	// Organizer view: every seat is interactive regardless of status, so
	// `ticketTypeId` is left out of the derivation.
	$: renderSeats = deriveRenderSeats(elements, inventory).map((s) => ({
		...s,
		selectable: true
	}));

	$: visibleSeats =
		statusFilter === 'ALL'
			? renderSeats
			: renderSeats.filter((s) => s.status === statusFilter);

	$: counts = {
		total: renderSeats.length,
		available: renderSeats.filter((s) => s.status === 'AVAILABLE').length,
		occupied: renderSeats.filter((s) => s.status === 'OCCUPIED').length,
		reserved: renderSeats.filter((s) => s.status === 'RESERVED').length,
		blocked: renderSeats.filter((s) => s.status === 'BLOCKED').length
	} satisfies Partial<InventorySummary> & Record<string, number>;

	$: selectedSeats = renderSeats.filter((s) => selected.has(s.seatId));
	$: selectedBlockable = selectedSeats.filter((s) => s.status === 'AVAILABLE');
	$: selectedUnblockable = selectedSeats.filter((s) => s.status === 'BLOCKED');
	$: selectedClaimed = selectedSeats.filter(
		(s) => s.status === 'OCCUPIED' || s.status === 'RESERVED'
	);

	function toggleSeat(seat: RenderSeat) {
		const next = new Set(selected);
		if (next.has(seat.seatId)) next.delete(seat.seatId);
		else next.add(seat.seatId);
		selected = next;
	}

	function selectMany(seats: RenderSeat[], additive: boolean) {
		const next = additive ? new Set(selected) : new Set<string>();
		for (const s of seats) next.add(s.seatId);
		selected = next;
	}

	/** Mark local state so the map updates without a full reload. */
	function applyLocal(seatIds: Set<string>, status: Seat['status'], reason: string | null) {
		inventory = inventory.map((s) =>
			seatIds.has(s.seatId) ? { ...s, status, blockedReason: reason } : s
		);
	}

	async function applyBlock(blocked: boolean) {
		const targets = blocked ? selectedBlockable : selectedUnblockable;
		if (!targets.length || busy) return;

		busy = true;
		try {
			const ids = targets.map((s) => s.seatId);
			const res = await setSeatsBlocked(
				eventId,
				ids,
				blocked,
				blocked ? blockReason.trim() || undefined : undefined
			);
			applyLocal(
				new Set(ids),
				blocked ? 'BLOCKED' : 'AVAILABLE',
				blocked ? blockReason.trim() || null : null
			);
			selected = new Set();
			blockReason = '';
			notify(res.message, res.skipped.length ? 'error' : 'ok');
		} catch (e: any) {
			notify(e?.message ?? 'Could not update those seats.', 'error');
		} finally {
			busy = false;
		}
	}

	/** Select every seat in the same row as the current selection. */
	function expandToRows() {
		const rows = new Set(selectedSeats.map((s) => `${s.section ?? ''}\u0000${s.rowLabel ?? ''}`));
		if (!rows.size) return;
		selected = new Set(
			renderSeats
				.filter((s) => rows.has(`${s.section ?? ''}\u0000${s.rowLabel ?? ''}`))
				.map((s) => s.seatId)
		);
	}

	function selectByStatus(status: Seat['status']) {
		selected = new Set(renderSeats.filter((s) => s.status === status).map((s) => s.seatId));
	}
</script>

<div class="flex h-full min-h-0 flex-col">
	<!-- Header -->
	<div class="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
		<div>
			<h2 class="text-base font-semibold text-gray-900">Seating chart</h2>
			<p class="text-xs text-gray-500">
				Live inventory. Select seats to withhold them from sale or return them.
			</p>
		</div>
		<button
			type="button"
			class="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
			on:click={() => dispatch('close')}
		>
			Done
		</button>
	</div>

	{#if loading}
		<div class="flex flex-1 items-center justify-center">
			<Icon icon="mdi:loading" class="h-7 w-7 animate-spin text-gray-400" />
		</div>
	{:else if renderSeats.length === 0}
		<div class="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
			<Icon icon="mdi:seat-outline" class="h-8 w-8 text-gray-300" />
			<p class="text-sm font-medium text-gray-600">No seats are live yet</p>
			<p class="max-w-sm text-xs text-gray-500">
				Publish a seating layout and its seats will appear here, ready to manage.
			</p>
		</div>
	{:else}
		<!-- Counts double as filters -->
		<div class="flex flex-wrap gap-2 border-b px-4 py-2.5">
			{#each [['ALL', 'All', counts.total, '#6b7280'], ['AVAILABLE', 'Available', counts.available, '#10b981'], ['OCCUPIED', 'Sold', counts.occupied, '#6366f1'], ['RESERVED', 'On hold', counts.reserved, '#f59e0b'], ['BLOCKED', 'Withheld', counts.blocked, '#4b5563']] as [key, label, n, color]}
				<button
					type="button"
					class="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors {statusFilter ===
					key
						? 'border-gray-900 bg-gray-900 text-white'
						: 'text-gray-700 hover:bg-gray-50'}"
					on:click={() => (statusFilter = key as any)}
				>
					{#if key !== 'ALL'}
						<span class="inline-block h-2.5 w-2.5 rounded-sm" style="background-color: {color};"
						></span>
					{/if}
					{label}
					<span class="font-semibold">{(n as number).toLocaleString()}</span>
				</button>
			{/each}
		</div>

		{#if message}
			<div
				class="mx-4 mt-2.5 rounded-lg border px-3 py-2 text-xs {messageTone === 'error'
					? 'border-amber-200 bg-amber-50 text-amber-800'
					: 'border-emerald-200 bg-emerald-50 text-emerald-800'}"
				role="status"
				aria-live="polite"
			>
				{message}
			</div>
		{/if}

		<!-- Map -->
		<div class="relative min-h-0 flex-1">
			<SeatMapCanvas
				bind:this={canvasRef}
				{elements}
				seats={visibleSeats}
				{seatTypes}
				selectedSeatIds={selected}
				interactionMode="seats"
				seatMarquee={true}
				dimUnselectable={false}
				canvasBounds={canvasSize}
				on:seatTap={(e) => toggleSeat(e.detail.seat)}
				on:seatHover={(e) => (hovered = e.detail.seat)}
				on:marqueeEnd={(e) => selectMany(e.detail.seats, e.detail.additive)}
			/>

			<div class="absolute right-3 bottom-3 flex flex-col gap-1.5">
				<button
					type="button"
					aria-label="Zoom in"
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 shadow-sm ring-1 ring-black/5"
					on:click={() => canvasRef?.zoomBy(1.3)}
				>
					<Icon icon="mdi:plus" class="h-4 w-4 text-gray-700" />
				</button>
				<button
					type="button"
					aria-label="Zoom out"
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 shadow-sm ring-1 ring-black/5"
					on:click={() => canvasRef?.zoomBy(1 / 1.3)}
				>
					<Icon icon="mdi:minus" class="h-4 w-4 text-gray-700" />
				</button>
				<button
					type="button"
					aria-label="Fit"
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 shadow-sm ring-1 ring-black/5"
					on:click={() => canvasRef?.fit()}
				>
					<Icon icon="mdi:fit-to-screen-outline" class="h-4 w-4 text-gray-700" />
				</button>
			</div>

			{#if hovered}
				<div
					class="pointer-events-none absolute top-3 left-3 rounded-lg bg-gray-900/85 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur"
				>
					{hovered.section ? `${hovered.section} · ` : ''}{hovered.label}
					<span class="text-white/60">
						· {hovered.status === 'OCCUPIED'
							? 'sold'
							: hovered.status === 'RESERVED'
								? 'on hold'
								: hovered.status === 'BLOCKED'
									? 'withheld'
									: 'available'}
					</span>
				</div>
			{/if}

			<div
				class="pointer-events-none absolute top-3 right-3 max-w-[200px] rounded-lg bg-white/90 px-2.5 py-1.5 text-[10px] leading-snug text-gray-600 shadow-sm ring-1 ring-black/5"
			>
				Tap seats to select · drag empty space to select a bank · hold Space to pan
			</div>
		</div>

		<!-- Action bar -->
		<div class="border-t bg-white px-4 py-3">
			{#if selected.size === 0}
				<div class="flex flex-wrap items-center gap-2">
					<span class="text-xs text-gray-500">Quick select:</span>
					<button
						type="button"
						class="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-gray-50"
						on:click={() => selectByStatus('BLOCKED')}
					>
						All withheld ({counts.blocked})
					</button>
					<button
						type="button"
						class="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-gray-50"
						on:click={() => selectByStatus('AVAILABLE')}
					>
						All available ({counts.available})
					</button>
				</div>
			{:else}
				<div class="space-y-2.5">
					<div class="flex flex-wrap items-center gap-2">
						<span class="text-sm font-medium text-gray-900">
							{selected.size.toLocaleString()} seat{selected.size === 1 ? '' : 's'} selected
						</span>
						<button
							type="button"
							class="rounded-lg border px-2 py-1 text-[11px] hover:bg-gray-50"
							on:click={expandToRows}
						>
							Expand to whole row(s)
						</button>
						<button
							type="button"
							class="rounded-lg border px-2 py-1 text-[11px] hover:bg-gray-50"
							on:click={() => (selected = new Set())}
						>
							Clear
						</button>

						<span class="ml-auto flex flex-wrap gap-2 text-[11px] text-gray-500">
							{#if selectedBlockable.length}
								<span>{selectedBlockable.length} available</span>
							{/if}
							{#if selectedUnblockable.length}
								<span>{selectedUnblockable.length} withheld</span>
							{/if}
							{#if selectedClaimed.length}
								<span class="text-amber-600">{selectedClaimed.length} sold / on hold</span>
							{/if}
						</span>
					</div>

					{#if selectedClaimed.length}
						<p class="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800">
							{selectedClaimed.length} selected seat{selectedClaimed.length === 1 ? ' is' : 's are'}
							already sold or on hold and will be skipped. Refund or move those attendees first.
						</p>
					{/if}

					<div class="flex flex-wrap items-end gap-2">
						{#if selectedBlockable.length}
							<label class="min-w-[180px] flex-1">
								<span class="text-[11px] text-gray-500">
									Reason (shown to nobody but your team)
								</span>
								<input
									type="text"
									bind:value={blockReason}
									placeholder="e.g. Sound desk · no sightline"
									class="mt-0.5 w-full rounded-lg border bg-white px-2 py-2 text-sm"
								/>
							</label>
							<button
								type="button"
								class="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
								disabled={busy}
								on:click={() => applyBlock(true)}
							>
								{busy ? 'Working…' : `Withhold ${selectedBlockable.length}`}
							</button>
						{/if}

						{#if selectedUnblockable.length}
							<button
								type="button"
								class="rounded-lg border border-emerald-400 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
								disabled={busy}
								on:click={() => applyBlock(false)}
							>
								{busy ? 'Working…' : `Return ${selectedUnblockable.length} to sale`}
							</button>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
