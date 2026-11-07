<script lang="ts">
	/**
	 * ══════════════════════════════════════════════════════════════════════
	 *  ATTENDEE SEAT PICKER
	 * ══════════════════════════════════════════════════════════════════════
	 *
	 * Replaces the previous `SeatSelector`, which could not complete a
	 * single successful selection. Its three defects are each addressed
	 * somewhere specific:
	 *
	 *   - It sent a canvas **element id** as a seat id whenever no
	 *     inventory row matched, because the join was a hand-typed label.
	 *     Seats now arrive from materialized inventory with real ids, and
	 *     `deriveRenderSeats` joins on the deterministic element key.
	 *   - Every hold 401'd (bare `fetch`, auth-required route), and the UI
	 *     rendered that as "someone else took it". The service now sends an
	 *     identity and `seatHoldErrorCopy` distinguishes the real causes.
	 *   - It branched on a `'HELD'` status the backend never emits, so a
	 *     seat held by somebody else showed as plain grey "taken". The
	 *     status is `RESERVED`, and it renders amber.
	 *
	 * Beyond the repairs: pan/zoom (there was none — a 1200px map was
	 * squeezed into 600px and unreadable on a phone), multi-seat parties,
	 * "best available", a real legend, and a keyboard/screen-reader path
	 * that does not depend on the canvas.
	 */
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import type { Color } from '$lib/utils/colors';
	import type { LayoutElement, Seat, SeatType, StageView } from './types';
	import { deriveRenderSeats, type RenderSeat } from './render2d';
	import SeatMapCanvas from './SeatMapCanvas.svelte';
	import Seat3DView from './Seat3DView.svelte';
	import { getPublicSeatMap, getBestAvailable } from './api';
	import {
		holdSeat,
		holdSeats,
		releaseHold,
		releaseHoldOnUnload,
		seatHoldErrorCopy,
		type SeatHoldError
	} from '$lib/services/seat.services';

	export let eventId: string;
	export let ticketTypeId: string = '';
	/** Seats this attendee needs. >1 enables party selection. */
	export let quantity = 1;
	/**
	 * Palette from the event page theme.
	 *
	 * Typed as the real `Color` interface rather than a string record:
	 * `Color` has no index signature, so a record type rejects it at the
	 * call site. `Partial` because the picker is also used outside a
	 * themed page and falls back below.
	 */
	export let themeColor: Partial<Color> | null = null;

	const dispatch = createEventDispatcher<{
		select: { seats: Array<{ seatId: string; seatNumber: string; holdToken: string }>; expiresAt: string };
		clear: Record<string, never>;
		unavailable: { message: string };
	}>();

	// ── Palette with safe fallbacks ──
	$: c = {
		bg: themeColor?.bg ?? '#ffffff',
		cover: themeColor?.cover ?? '#f4f4f5',
		smallCover: themeColor?.smallCover ?? '#fafafa',
		text: themeColor?.text ?? '#18181b',
		lightText: themeColor?.lightText ?? '#71717a',
		button: themeColor?.button ?? '#18181b',
		buttonText: themeColor?.buttonText ?? '#ffffff',
		toggle: themeColor?.toggle ?? '#e4e4e7'
	};

	let loading = true;
	let layoutMeta: {
		title: string;
		canvasWidth: number;
		canvasHeight: number;
		defaultView: '2D' | '3D';
		stageView: StageView | null;
	} | null = null;
	let elements: LayoutElement[] = [];
	let inventory: Seat[] = [];
	let seatTypes: SeatType[] = [];
	let renderSeats: RenderSeat[] = [];

	let view: '2D' | '3D' = '2D';
	let canvasRef: SeatMapCanvas | null = null;
	let threeRef: Seat3DView | null = null;

	/** Seats held by this attendee, in pick order. */
	let held: Array<{ seatId: string; seatNumber: string; holdToken: string }> = [];
	let expiresAt = 0;
	let countdown = '';
	let countdownTimer: ReturnType<typeof setInterval> | null = null;

	let busy = false;
	let message = '';
	let messageTone: 'error' | 'info' = 'error';
	let messageTimer: ReturnType<typeof setTimeout> | null = null;
	let hovered: RenderSeat | null = null;
	let showAccessibleList = false;

	$: selectedIds = new Set(held.map((h) => h.seatId));
	$: full = held.length >= quantity;

	// ── Load ──

	onMount(async () => {
		try {
			const data = await getPublicSeatMap(eventId, ticketTypeId || undefined);
			if (data.layout) {
				layoutMeta = {
					title: data.layout.title,
					canvasWidth: data.layout.canvasWidth,
					canvasHeight: data.layout.canvasHeight,
					defaultView: data.layout.defaultView ?? '2D',
					stageView: data.layout.stageView ?? null
				};
				elements = data.layout.elements ?? [];
				seatTypes = data.layout.seatTypes ?? [];
				view = layoutMeta.defaultView;
			}
			inventory = data.seats ?? [];
		} catch {
			/* leave layoutMeta null → empty state */
		} finally {
			loading = false;
		}

		countdownTimer = setInterval(tickCountdown, 1000);
		window.addEventListener('beforeunload', onBeforeUnload);
	});

	onDestroy(() => {
		if (countdownTimer) clearInterval(countdownTimer);
		if (messageTimer) clearTimeout(messageTimer);
		window.removeEventListener('beforeunload', onBeforeUnload);
		// Release on unmount so an abandoned modal does not leave the
		// seats held for the full window.
		void releaseAll();
	});

	/**
	 * `fetch` is cancelled when the document unloads, so a closed tab
	 * would otherwise strand every held seat. `sendBeacon` survives.
	 */
	function onBeforeUnload() {
		for (const h of held) releaseHoldOnUnload(eventId, h.seatId, h.holdToken);
	}

	$: renderSeats = deriveRenderSeats(elements, inventory, {
		ticketTypeId: ticketTypeId || null
	});

	// ── Messaging ──

	function notify(text: string, tone: 'error' | 'info' = 'error') {
		message = text;
		messageTone = tone;
		if (tone === 'error') dispatch('unavailable', { message: text });
		if (messageTimer) clearTimeout(messageTimer);
		messageTimer = setTimeout(() => (message = ''), 5000);
	}

	// ── Hold countdown ──

	function tickCountdown() {
		if (!expiresAt || held.length === 0) {
			countdown = '';
			return;
		}
		const ms = expiresAt - Date.now();
		if (ms <= 0) {
			// Expired server-side; drop the local selection so the attendee
			// can re-pick rather than submitting against dead holds.
			held = [];
			expiresAt = 0;
			countdown = '';
			dispatch('clear', {});
			notify('Your seat hold expired. Please choose again.', 'info');
			return;
		}
		const total = Math.floor(ms / 1000);
		countdown = `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
	}

	// ── Selection ──

	function markLocal(seatId: string, status: Seat['status']) {
		inventory = inventory.map((s) => (s.seatId === seatId ? { ...s, status } : s));
	}

	async function pickSeat(seat: RenderSeat) {
		if (busy) return;

		// Toggling off a seat this attendee holds.
		const existing = held.find((h) => h.seatId === seat.seatId);
		if (existing) {
			busy = true;
			try {
				await releaseHold(eventId, existing.seatId, existing.holdToken);
				held = held.filter((h) => h.seatId !== existing.seatId);
				markLocal(existing.seatId, 'AVAILABLE');
				if (held.length === 0) {
					expiresAt = 0;
					dispatch('clear', {});
				} else {
					emitSelection();
				}
			} finally {
				busy = false;
			}
			return;
		}

		if (!seat.selectable) {
			if (seat.status === 'OCCUPIED') notify('That seat is already booked.');
			else if (seat.status === 'RESERVED')
				notify('Someone is holding that seat right now. Try another.');
			else if (seat.status === 'BLOCKED') notify('That seat is not available for sale.');
			else notify('That seat is not available with the ticket you selected.');
			return;
		}

		/**
		 * At capacity, replace the oldest pick rather than refusing.
		 *
		 * For the common single-seat case this makes the map behave the way
		 * people expect — clicking a new seat moves your selection instead
		 * of erroring. For a party it keeps the newest intent and releases
		 * the stale seat so inventory is never over-held.
		 */
		if (full) {
			const oldest = held[0];
			busy = true;
			try {
				await releaseHold(eventId, oldest.seatId, oldest.holdToken);
				held = held.slice(1);
				markLocal(oldest.seatId, 'AVAILABLE');
			} finally {
				busy = false;
			}
		}

		busy = true;
		try {
			const res = await holdSeat(eventId, seat.seatId);
			held = [...held, { seatId: seat.seatId, seatNumber: res.seatNumber ?? seat.label, holdToken: res.holdToken }];
			expiresAt = new Date(res.expiresAt).getTime() || Date.now() + 10 * 60_000;
			markLocal(seat.seatId, 'RESERVED');
			tickCountdown();
			emitSelection();
		} catch (err) {
			const e = err as SeatHoldError;
			notify(seatHoldErrorCopy(e));
			// Reflect the real reason locally so the attendee is not invited
			// to keep clicking a seat that will never succeed.
			if (e.code === 'SEAT_SOLD') markLocal(seat.seatId, 'OCCUPIED');
			else if (e.code === 'SEAT_UNAVAILABLE') markLocal(seat.seatId, 'RESERVED');
			else if (e.code === 'SEAT_BLOCKED') markLocal(seat.seatId, 'BLOCKED');
		} finally {
			busy = false;
		}
	}

	function emitSelection() {
		dispatch('select', {
			seats: held,
			expiresAt: new Date(expiresAt || Date.now() + 10 * 60_000).toISOString()
		});
	}

	async function releaseAll() {
		const snapshot = held;
		held = [];
		expiresAt = 0;
		await Promise.allSettled(
			snapshot.map((h) => releaseHold(eventId, h.seatId, h.holdToken))
		);
	}

	async function clearSelection() {
		busy = true;
		try {
			for (const h of held) markLocal(h.seatId, 'AVAILABLE');
			await releaseAll();
			dispatch('clear', {});
		} finally {
			busy = false;
		}
	}

	/**
	 * "Best available" — ask the server, then hold what it suggests.
	 *
	 * Suggest-then-hold: a browsing visitor changing the party size must
	 * not lock up inventory on every change.
	 */
	async function chooseBestAvailable() {
		if (busy) return;
		busy = true;
		try {
			await releaseAll();
			for (const h of held) markLocal(h.seatId, 'AVAILABLE');

			const result = await getBestAvailable(eventId, quantity, {
				ticketTypeId: ticketTypeId || undefined
			});
			if (result.found === 0) {
				notify('No seats are available for this ticket type right now.');
				return;
			}

			let acquired: typeof held = [];

			if (result.seats.length > 1) {
				/**
				 * A party goes all-or-nothing through `/hold-many`.
				 *
				 * "Four together" that returns three is not a smaller version
				 * of the request — the party still cannot sit together, and the
				 * three held seats block other parties for ten minutes. The
				 * server releases any partial set before failing, so a failed
				 * call leaves nothing held and the attendee can retry against
				 * fresh availability.
				 */
				try {
					const multi = await holdSeats(
						eventId,
						result.seats.map((s) => s.seatId)
					);
					acquired = multi.holds;
					expiresAt = new Date(multi.expiresAt).getTime() || Date.now() + 10 * 60_000;
					for (const h of acquired) markLocal(h.seatId, 'RESERVED');
				} catch (err) {
					notify(seatHoldErrorCopy(err as SeatHoldError));
					return;
				}
			} else {
				for (const s of result.seats) {
					try {
						const res = await holdSeat(eventId, s.seatId);
						acquired.push({
							seatId: s.seatId,
							seatNumber: res.seatNumber ?? s.seatNumber,
							holdToken: res.holdToken
						});
						markLocal(s.seatId, 'RESERVED');
						expiresAt = new Date(res.expiresAt).getTime() || Date.now() + 10 * 60_000;
					} catch {
						// Taken between the suggestion and the hold. Reported below.
					}
				}
			}

			held = acquired;
			if (acquired.length === 0) {
				notify('Those seats were taken just now. Please try again.');
				return;
			}
			if (acquired.length < quantity) {
				notify(
					`Only ${acquired.length} of ${quantity} seats could be held. Pick the rest from the map.`,
					'info'
				);
			} else if (result.split) {
				notify('These seats are the best available but are not all together.', 'info');
			}
			tickCountdown();
			emitSelection();
			if (acquired[0]) {
				canvasRef?.centerOnSeat(acquired[0].seatId);
				threeRef?.viewFromSeat(acquired[0].seatId);
			}
		} finally {
			busy = false;
		}
	}

	// ── Counts and the accessible list ──

	$: availableCount = renderSeats.filter((s) => s.selectable).length;
	$: takenCount = renderSeats.filter(
		(s) => s.status === 'OCCUPIED' || s.status === 'RESERVED'
	).length;

	/**
	 * Section → row → seats, for the keyboard and screen-reader path.
	 *
	 * A canvas has no focusable children, so without this the picker would
	 * be unusable without a pointer. The previous DOM version was no
	 * better: seats were `role="button"` divs with no way to move between
	 * them. Grouping by row is also genuinely faster for a sighted user
	 * who already knows where they want to sit.
	 */
	$: grouped = (() => {
		const bySection = new Map<string, Map<string, RenderSeat[]>>();
		for (const s of renderSeats) {
			if (!s.selectable && !selectedIds.has(s.seatId)) continue;
			const section = s.section || 'Seating';
			const row = s.rowLabel || '—';
			if (!bySection.has(section)) bySection.set(section, new Map());
			const rows = bySection.get(section)!;
			if (!rows.has(row)) rows.set(row, []);
			rows.get(row)!.push(s);
		}
		return [...bySection.entries()].map(([section, rows]) => ({
			section,
			rows: [...rows.entries()]
				.map(([row, list]) => ({
					row,
					seats: list.sort((a, b) => (a.seatIndex ?? 0) - (b.seatIndex ?? 0))
				}))
				.sort((a, b) => a.row.localeCompare(b.row, undefined, { numeric: true }))
		}));
	})();
</script>

{#if loading}
	<div
		class="flex h-56 animate-pulse items-center justify-center rounded-xl"
		style="background-color: {c.cover};"
	>
		<p class="text-sm" style="color: {c.lightText};">Loading seat map…</p>
	</div>
{:else if !layoutMeta}
	<div
		class="flex h-32 items-center justify-center rounded-xl"
		style="background-color: {c.cover};"
	>
		<p class="text-sm" style="color: {c.lightText};">No seat map is available for this event.</p>
	</div>
{:else}
	<div class="flex flex-col gap-3">
		<!-- Header -->
		<div class="flex flex-wrap items-start justify-between gap-3">
			<div class="min-w-0">
				<h3 class="truncate text-base font-semibold" style="color: {c.text};">
					{quantity > 1 ? `Choose ${quantity} seats` : 'Choose your seat'}
				</h3>
				<p class="truncate text-xs" style="color: {c.lightText};">
					{layoutMeta.title} · {availableCount} available
				</p>
			</div>

			<div class="flex items-center gap-2">
				<!-- 2D / 3D -->
				<div class="flex overflow-hidden rounded-lg border" style="border-color: {c.toggle};">
					<button
						type="button"
						class="px-2.5 py-1.5 text-xs font-medium transition-colors"
						style={view === '2D'
							? `background-color: ${c.button}; color: ${c.buttonText};`
							: `color: ${c.lightText};`}
						on:click={() => (view = '2D')}
					>
						2D
					</button>
					<button
						type="button"
						class="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors"
						style={view === '3D'
							? `background-color: ${c.button}; color: ${c.buttonText};`
							: `color: ${c.lightText};`}
						on:click={() => (view = '3D')}
					>
						<Icon icon="mdi:cube-outline" class="h-3.5 w-3.5" />
						3D
					</button>
				</div>

				<button
					type="button"
					class="rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50"
					style="border-color: {c.toggle}; color: {c.text};"
					disabled={busy}
					on:click={chooseBestAvailable}
				>
					{quantity > 1 ? `Best ${quantity} together` : 'Best available'}
				</button>
			</div>
		</div>

		<!-- Hold countdown -->
		{#if countdown}
			<div
				class="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs"
			>
				<span class="font-medium text-amber-800">
					{held.length === 1 ? 'Seat held for you' : `${held.length} seats held for you`}
				</span>
				<span class="font-mono font-semibold text-amber-900">{countdown}</span>
			</div>
		{/if}

		<!-- Messages -->
		{#if message}
			<div
				class="rounded-lg border px-3 py-2 text-xs {messageTone === 'error'
					? 'border-red-200 bg-red-50 text-red-700'
					: 'border-blue-200 bg-blue-50 text-blue-700'}"
				role="status"
				aria-live="polite"
			>
				{message}
			</div>
		{/if}

		<!-- Map -->
		<div
			class="relative overflow-hidden rounded-xl border"
			style="border-color: {c.toggle}; background-color: {c.bg}; height: min(60vh, 520px);"
		>
			{#if view === '2D'}
				<SeatMapCanvas
					bind:this={canvasRef}
					{elements}
					seats={renderSeats}
					{seatTypes}
					selectedSeatIds={selectedIds}
					interactionMode="seats"
					dimUnselectable={true}
					on:seatTap={(e) => pickSeat(e.detail.seat)}
					on:seatHover={(e) => (hovered = e.detail.seat)}
				/>

				<!-- Zoom controls. Pinch works on touch; these are for mouse
				     and for anyone who cannot make a pinch gesture. -->
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
						aria-label="Fit the whole map"
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
						{#if !hovered.selectable}
							<span class="text-white/60">
								· {hovered.status === 'OCCUPIED'
									? 'booked'
									: hovered.status === 'RESERVED'
										? 'on hold'
										: hovered.status === 'BLOCKED'
											? 'not for sale'
											: 'other ticket type'}
							</span>
						{/if}
					</div>
				{/if}
			{:else}
				<Seat3DView
					bind:this={threeRef}
					{elements}
					seats={inventory}
					{seatTypes}
					stageView={layoutMeta.stageView}
					selectedIds={[...selectedIds]}
					interactive={true}
					on:pick={(e) => {
						const seat = renderSeats.find((s) => s.seatId === e.detail.seatId);
						if (seat) pickSeat(seat);
					}}
				/>

				<div class="absolute right-3 bottom-3 flex flex-col gap-1.5">
					<button
						type="button"
						class="rounded-lg bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-gray-700 shadow-sm ring-1 ring-black/5"
						on:click={() => threeRef?.resetView()}
					>
						Reset view
					</button>
					{#if held.length}
						<button
							type="button"
							class="rounded-lg bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-gray-700 shadow-sm ring-1 ring-black/5"
							on:click={() => threeRef?.viewFromSeat(held[held.length - 1].seatId)}
						>
							View from my seat
						</button>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Legend -->
		<div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px]" style="color: {c.lightText};">
			{#each seatTypes as t (t.seatTypeId)}
				<span class="flex items-center gap-1.5">
					<span class="inline-block h-3 w-3 rounded-sm" style="background-color: {t.color};"></span>
					{t.name}
				</span>
			{/each}
			<span class="flex items-center gap-1.5">
				<span class="inline-block h-3 w-3 rounded-sm bg-[#22c55e]"></span> Your pick
			</span>
			<span class="flex items-center gap-1.5">
				<span class="inline-block h-3 w-3 rounded-sm bg-[#fcd34d]"></span> On hold
			</span>
			<span class="flex items-center gap-1.5">
				<span class="inline-block h-3 w-3 rounded-sm bg-[#d1d5db]"></span> Booked ({takenCount})
			</span>
		</div>

		<!-- Selection summary -->
		{#if held.length}
			<div class="rounded-lg p-3" style="background-color: {c.smallCover};">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0">
						<p class="text-xs font-medium" style="color: {c.lightText};">
							{held.length} of {quantity} selected
						</p>
						<div class="mt-1.5 flex flex-wrap gap-1.5">
							{#each held as h (h.seatId)}
								<span
									class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold"
									style="background-color: {c.button}; color: {c.buttonText};"
								>
									{h.seatNumber}
									<button
										type="button"
										aria-label={`Release seat ${h.seatNumber}`}
										class="opacity-70 hover:opacity-100"
										on:click={() => {
											const seat = renderSeats.find((s) => s.seatId === h.seatId);
											if (seat) pickSeat(seat);
										}}
									>
										<Icon icon="mdi:close" class="h-3 w-3" />
									</button>
								</span>
							{/each}
						</div>
					</div>
					<button
						type="button"
						class="shrink-0 text-xs underline disabled:opacity-50"
						style="color: {c.lightText};"
						disabled={busy}
						on:click={clearSelection}
					>
						Clear
					</button>
				</div>
			</div>
		{/if}

		<!-- Keyboard / screen-reader path -->
		<div>
			<button
				type="button"
				class="flex items-center gap-1.5 text-xs underline"
				style="color: {c.lightText};"
				aria-expanded={showAccessibleList}
				on:click={() => (showAccessibleList = !showAccessibleList)}
			>
				<Icon icon={showAccessibleList ? 'mdi:chevron-down' : 'mdi:chevron-right'} class="h-4 w-4" />
				Choose a seat from a list instead
			</button>

			{#if showAccessibleList}
				<div
					class="mt-2 max-h-64 overflow-y-auto rounded-lg border p-3"
					style="border-color: {c.toggle};"
				>
					{#if grouped.length === 0}
						<p class="text-xs" style="color: {c.lightText};">
							No seats are available for this ticket type.
						</p>
					{/if}
					{#each grouped as group (group.section)}
						<div class="mb-3 last:mb-0">
							<p class="mb-1.5 text-xs font-semibold" style="color: {c.text};">{group.section}</p>
							{#each group.rows as row (row.row)}
								<div class="mb-1.5 flex flex-wrap items-center gap-1">
									<span class="w-10 shrink-0 text-[11px]" style="color: {c.lightText};">
										Row {row.row}
									</span>
									{#each row.seats as s (s.seatId)}
										<button
											type="button"
											class="min-w-7 rounded border px-1.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-40"
											style={selectedIds.has(s.seatId)
												? `background-color: ${c.button}; color: ${c.buttonText}; border-color: ${c.button};`
												: `border-color: ${c.toggle}; color: ${c.text};`}
											disabled={busy}
											aria-pressed={selectedIds.has(s.seatId)}
											aria-label={`${group.section}, row ${row.row}, seat ${s.seatIndex}${s.isAccessible ? ', wheelchair accessible' : ''}`}
											on:click={() => pickSeat(s)}
										>
											{s.seatIndex}
										</button>
									{/each}
								</div>
							{/each}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
