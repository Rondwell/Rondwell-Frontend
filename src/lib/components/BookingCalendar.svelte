<!--
	FE-P2-02-D — Booking calendar.

	A 7-day grid of available slots for a service product. Clicking a slot
	reserves it (RESERVED) via `bookProductSlot`, starts a 30-minute
	checkout countdown, and emits `book` so the parent can redirect to
	the gateway. Cancel / close releases via `releaseBookingSlot`.

	After webhook completes the slot flips to BOOKED. Until SSE wiring
	lands, callers poll `/account/purchases` after the redirect-back.
-->
<script lang="ts">
	import {
		bookProductSlot,
		getProductAvailability,
		releaseBookingSlot,
		type AvailabilitySlot,
	} from '$lib/services/marketplace.services';
	import { authState, isAuthenticated } from '$lib/stores/auth.store';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';

	export let productId: string;
	export let productName: string = '';
	export let successCallbackUrl: string;
	export let failureCallbackUrl: string;

	const dispatch = createEventDispatcher<{
		reserved: { holdToken: string; expiresAt: string };
	}>();

	const DAY_MS = 86_400_000;

	let weekStart: Date = startOfDay(new Date());
	let slots: AvailabilitySlot[] = [];
	let loading = true;
	let error = '';

	let selectedSlot: AvailabilitySlot | null = null;
	let activeHold: { holdToken: string; expiresAt: string; productId: string } | null = null;
	let countdownLabel = '';
	let countdownTimer: ReturnType<typeof setInterval> | null = null;

	let guestEmail = '';
	let guestName = '';
	let bookingError = '';
	let booking = false;

	function startOfDay(d: Date): Date {
		const x = new Date(d);
		x.setHours(0, 0, 0, 0);
		return x;
	}

	function fmtDayHeader(d: Date): string {
		return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
	}

	function fmtSlotTime(iso: string): string {
		try {
			return new Date(iso).toLocaleTimeString(undefined, {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true,
			});
		} catch {
			return iso;
		}
	}

	$: weekDays = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * DAY_MS));

	async function loadAvailability() {
		loading = true;
		error = '';
		try {
			const from = weekStart.toISOString();
			const to = new Date(weekStart.getTime() + 7 * DAY_MS).toISOString();
			slots = await getProductAvailability(productId, from, to);
		} catch (e: any) {
			error = financialErrorMessage(e);
			slots = [];
		} finally {
			loading = false;
		}
	}

	function dayKey(d: Date): string {
		return d.toISOString().slice(0, 10);
	}

	function slotsForDay(d: Date): AvailabilitySlot[] {
		const key = dayKey(d);
		return slots.filter((s) => s.start.startsWith(key));
	}

	async function handleSlotClick(slot: AvailabilitySlot) {
		if (!slot.available || booking) return;
		selectedSlot = slot;
		bookingError = '';
	}

	function shiftWeek(deltaDays: number) {
		weekStart = new Date(weekStart.getTime() + deltaDays * DAY_MS);
		loadAvailability();
	}

	async function reserveAndBook() {
		if (!selectedSlot) return;
		if (!$isAuthenticated && !guestEmail) {
			bookingError = 'Enter your email to continue as a guest.';
			return;
		}
		booking = true;
		bookingError = '';
		try {
			const result = await bookProductSlot(productId, {
				slotStart: selectedSlot.start,
				slotEnd: selectedSlot.end,
				customerEmail: $isAuthenticated ? $authState.user?.email : guestEmail,
				customerName: guestName || undefined,
				successCallbackUrl,
				failureCallbackUrl,
			});
			if (result.holdToken && result.expiresAt) {
				activeHold = { holdToken: result.holdToken, expiresAt: result.expiresAt, productId };
				dispatch('reserved', { holdToken: result.holdToken, expiresAt: result.expiresAt });
				startCountdown();
			}
			if (result.checkoutUrl) {
				window.location.href = result.checkoutUrl;
			}
		} catch (e: any) {
			bookingError = financialErrorMessage(e);
		} finally {
			booking = false;
		}
	}

	function startCountdown() {
		if (countdownTimer) clearInterval(countdownTimer);
		const tick = () => {
			if (!activeHold) {
				countdownLabel = '';
				return;
			}
			const ms = new Date(activeHold.expiresAt).getTime() - Date.now();
			if (ms <= 0) {
				countdownLabel = 'Hold expired';
				if (countdownTimer) clearInterval(countdownTimer);
				activeHold = null;
				selectedSlot = null;
				loadAvailability();
				return;
			}
			const min = Math.floor(ms / 60_000);
			const sec = Math.floor((ms % 60_000) / 1000);
			countdownLabel = `Slot held for ${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
		};
		tick();
		countdownTimer = setInterval(tick, 1000);
	}

	async function cancelHold() {
		if (!activeHold) return;
		try {
			await releaseBookingSlot(activeHold.productId, activeHold.holdToken);
		} catch {
			/* ignore — server may have expired the hold already */
		}
		activeHold = null;
		selectedSlot = null;
		if (countdownTimer) clearInterval(countdownTimer);
		countdownLabel = '';
		await loadAvailability();
	}

	onMount(() => {
		loadAvailability();
	});

	onDestroy(() => {
		if (countdownTimer) clearInterval(countdownTimer);
	});
</script>

<div class="rounded-xl border bg-white p-4">
	<div class="mb-4 flex items-center justify-between gap-2">
		<button
			on:click={() => shiftWeek(-7)}
			class="rounded-md border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
			aria-label="Previous week"
		>
			<Icon icon="mdi:chevron-left" />
		</button>
		<p class="text-sm font-medium text-gray-700">
			{fmtDayHeader(weekStart)} — {fmtDayHeader(new Date(weekStart.getTime() + 6 * DAY_MS))}
		</p>
		<button
			on:click={() => shiftWeek(7)}
			class="rounded-md border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
			aria-label="Next week"
		>
			<Icon icon="mdi:chevron-right" />
		</button>
	</div>

	{#if error}
		<p class="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-600">{error}</p>
	{/if}

	{#if loading}
		<div class="grid animate-pulse grid-cols-7 gap-2">
			{#each Array(7) as _}
				<div class="space-y-1">
					<div class="h-4 rounded bg-gray-100"></div>
					<div class="h-8 rounded bg-gray-100"></div>
					<div class="h-8 rounded bg-gray-100"></div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-7 gap-2">
			{#each weekDays as d}
				<div>
					<p class="mb-2 text-center text-[11px] font-medium text-gray-500">
						{fmtDayHeader(d)}
					</p>
					<div class="space-y-1">
						{#each slotsForDay(d) as s}
							<button
								on:click={() => handleSlotClick(s)}
								disabled={!s.available || !!activeHold}
								class="w-full rounded-md border px-2 py-1 text-xs font-medium transition
									{!s.available
									? 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300 line-through'
									: selectedSlot?.start === s.start
										? 'border-pink-500 bg-pink-50 text-pink-700'
										: 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}"
							>
								{fmtSlotTime(s.start)}
							</button>
						{:else}
							<p class="text-center text-[11px] italic text-gray-300">No slots</p>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if activeHold}
		<div class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
			<div class="flex items-center justify-between gap-2">
				<p class="font-medium text-amber-800">{countdownLabel}</p>
				<button
					on:click={cancelHold}
					class="rounded-md bg-white px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
				>
					Cancel hold
				</button>
			</div>
			<p class="mt-1 text-xs text-amber-700">
				Complete checkout before the timer runs out or this slot will release automatically.
			</p>
		</div>
	{:else if selectedSlot}
		<div class="mt-4 rounded-lg border bg-gray-50 p-3 text-sm">
			<p class="font-medium text-gray-800">
				{productName ? `Book ${productName}` : 'Confirm booking'}
			</p>
			<p class="mt-0.5 text-xs text-gray-500">
				{new Date(selectedSlot.start).toLocaleString()} ({fmtSlotTime(selectedSlot.start)} – {fmtSlotTime(selectedSlot.end)})
			</p>

			{#if bookingError}
				<p class="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-600">{bookingError}</p>
			{/if}

			{#if !$isAuthenticated}
				<input
					type="email"
					bind:value={guestEmail}
					placeholder="you@example.com"
					class="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
				/>
				<input
					type="text"
					bind:value={guestName}
					placeholder="Your name (optional)"
					class="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
				/>
			{/if}

			<div class="mt-3 flex gap-2">
				<button
					on:click={() => (selectedSlot = null)}
					class="flex-1 rounded-md border border-gray-200 bg-white py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
				>
					Pick another time
				</button>
				<button
					on:click={reserveAndBook}
					disabled={booking}
					class="flex-1 rounded-md bg-gray-900 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
				>
					{booking ? 'Reserving…' : 'Reserve & checkout'}
				</button>
			</div>
		</div>
	{/if}
</div>
