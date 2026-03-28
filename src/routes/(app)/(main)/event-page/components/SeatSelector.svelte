<script lang="ts">
	import { getPublicSeats } from '$lib/services/event.services';
	import type { Color } from '$lib/utils/colors';
	import { createEventDispatcher, onMount } from 'svelte';

	export let eventId: string;
	export let ticketTypeId: string;
	export let themeColor: Color;

	const dispatch = createEventDispatcher<{ select: { seatId: string; seatNumber: string } }>();

	let layout: any = null;
	let seats: any[] = [];
	let loading = true;
	let selectedSeatId: string | null = null;
	let scale = 1;

	// Seat type icons
	const seatableTypes = new Set(['CHAIR', 'BIG_CHAIR', 'SEAT_ROW']);

	onMount(async () => {
		try {
			const data = await getPublicSeats(eventId, ticketTypeId);
			layout = data.layout;
			seats = data.seats;
		} catch { /* no seats */ }
		finally { loading = false; }
	});

	$: if (layout) {
		// Calculate scale to fit the layout in the container (max 600px wide)
		const containerWidth = 600;
		scale = Math.min(1, containerWidth / (layout.canvasWidth || 1200));
	}

	function getSeatStatus(element: any): 'available' | 'occupied' | 'selected' {
		if (selectedSeatId === element.id) return 'selected';
		const seat = seats.find((s: any) => s.seatNumber === element.seatNumber);
		if (seat && seat.status !== 'AVAILABLE') return 'occupied';
		return 'available';
	}

	function getSeatColor(element: any): string {
		const status = getSeatStatus(element);
		if (status === 'selected') return themeColor.button;
		if (status === 'occupied') return '#D1D5DB';
		return element.ticketColor || themeColor.cover;
	}

	function getSeatBorder(element: any): string {
		const status = getSeatStatus(element);
		if (status === 'selected') return themeColor.button;
		if (status === 'occupied') return '#9CA3AF';
		return themeColor.toggle;
	}

	function handleSeatClick(element: any) {
		if (!seatableTypes.has(element.type)) return;
		const status = getSeatStatus(element);
		if (status === 'occupied') return;

		if (selectedSeatId === element.id) {
			selectedSeatId = null;
			dispatch('select', { seatId: '', seatNumber: '' });
		} else {
			selectedSeatId = element.id;
			const seat = seats.find((s: any) => s.seatNumber === element.seatNumber);
			dispatch('select', {
				seatId: seat?.seatId ?? element.id,
				seatNumber: element.seatNumber ?? element.label ?? '',
			});
		}
	}

	function getElementShape(type: string): string {
		switch (type) {
			case 'ROUND_TABLE': return 'rounded-full';
			case 'SQUARE_TABLE': return 'rounded-lg';
			case 'CHAIR': case 'BIG_CHAIR': return 'rounded-lg';
			case 'STAGE': return 'rounded-xl';
			case 'DOOR': case 'RESTROOM': return 'rounded-md';
			case 'SEAT_ROW': return 'rounded-md';
			default: return 'rounded-sm';
		}
	}

	function isSeatable(type: string): boolean {
		return seatableTypes.has(type);
	}

	$: availableCount = layout?.elements?.filter((el: any) =>
		isSeatable(el.type) && getSeatStatus(el) === 'available'
	).length ?? 0;

	$: occupiedCount = layout?.elements?.filter((el: any) =>
		isSeatable(el.type) && getSeatStatus(el) === 'occupied'
	).length ?? 0;
</script>

{#if loading}
<div class="flex h-48 items-center justify-center animate-pulse rounded-xl" style="background-color: {themeColor.cover};">
	<p class="text-sm" style="color: {themeColor.lightText};">Loading seat map...</p>
</div>

{:else if !layout}
<div class="flex h-32 items-center justify-center rounded-xl" style="background-color: {themeColor.cover};">
	<p class="text-sm" style="color: {themeColor.lightText};">No seat layout available for this event.</p>
</div>

{:else}
<div class="flex flex-col gap-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h3 class="text-base font-semibold" style="color: {themeColor.text};">Select Your Seat</h3>
			<p class="text-xs" style="color: {themeColor.lightText};">{layout.title}</p>
		</div>
		<div class="flex items-center gap-4 text-xs" style="color: {themeColor.lightText};">
			<span class="flex items-center gap-1.5">
				<span class="inline-block h-3 w-3 rounded-sm" style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};"></span>
				Available ({availableCount})
			</span>
			<span class="flex items-center gap-1.5">
				<span class="inline-block h-3 w-3 rounded-sm bg-gray-300"></span>
				Taken ({occupiedCount})
			</span>
			<span class="flex items-center gap-1.5">
				<span class="inline-block h-3 w-3 rounded-sm" style="background-color: {themeColor.button};"></span>
				Selected
			</span>
		</div>
	</div>

	<!-- Seat Map -->
	<div class="overflow-auto rounded-xl p-4" style="background-color: {themeColor.bg}; border: 1px solid {themeColor.toggle};">
		<div
			class="relative mx-auto"
			style="width: {layout.canvasWidth * scale}px; height: {layout.canvasHeight * scale}px;"
		>
			{#each layout.elements as element (element.id)}
			{@const seatable = isSeatable(element.type)}
			{@const status = seatable ? getSeatStatus(element) : 'fixture'}
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="absolute flex items-center justify-center text-center transition-all duration-150 {getElementShape(element.type)} {seatable ? (status === 'occupied' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110 hover:shadow-md') : ''}"
				style="
					left: {element.x * scale}px;
					top: {element.y * scale}px;
					width: {element.width * scale}px;
					height: {element.height * scale}px;
					transform: rotate({element.rotation}deg);
					background-color: {seatable ? getSeatColor(element) : (element.type === 'STAGE' ? themeColor.smallCover : 'transparent')};
					border: {seatable ? `2px solid ${getSeatBorder(element)}` : (element.type === 'STAGE' || element.type === 'DOOR' || element.type === 'RESTROOM' ? `1px solid ${themeColor.toggle}` : 'none')};
					z-index: {element.zIndex ?? 0};
				"
				on:click={() => seatable && handleSeatClick(element)}
				on:keydown={(e) => e.key === 'Enter' && seatable && handleSeatClick(element)}
				role={seatable ? 'button' : 'presentation'}
				tabindex={seatable ? 0 : -1}
				aria-label={seatable ? `Seat ${element.seatNumber ?? element.label ?? ''} - ${status}` : undefined}
			>
				{#if element.type === 'TEXT'}
					<span class="text-xs font-medium" style="color: {themeColor.lightText}; font-size: {Math.max(8, 12 * scale)}px;">
						{element.label ?? ''}
					</span>
				{:else if element.type === 'STAGE'}
					<span class="text-xs font-medium uppercase tracking-wider" style="color: {themeColor.lightText}; font-size: {Math.max(8, 11 * scale)}px;">
						{element.label ?? 'Stage'}
					</span>
				{:else if element.type === 'DOOR'}
					<span style="font-size: {Math.max(10, 14 * scale)}px;">🚪</span>
				{:else if element.type === 'RESTROOM'}
					<span style="font-size: {Math.max(10, 14 * scale)}px;">🚻</span>
				{:else if seatable}
					<span class="text-xs font-medium leading-none" style="color: {status === 'selected' ? themeColor.buttonText : themeColor.text}; font-size: {Math.max(7, 10 * scale)}px;">
						{element.seatNumber ?? element.label ?? ''}
					</span>
				{:else if element.type === 'ROUND_TABLE' || element.type === 'SQUARE_TABLE'}
					<span class="text-xs" style="color: {themeColor.lightText}; font-size: {Math.max(7, 9 * scale)}px;">
						{element.label ?? ''}
					</span>
				{/if}
			</div>
			{/each}
		</div>
	</div>

	<!-- Selected seat info -->
	{#if selectedSeatId}
	{@const selectedEl = layout.elements.find((el) => el.id === selectedSeatId)}
	{#if selectedEl}
	<div class="flex items-center gap-3 rounded-lg p-3" style="background-color: {themeColor.smallCover};">
		<span class="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold" style="background-color: {themeColor.button}; color: {themeColor.buttonText};">
			{selectedEl.seatNumber ?? '?'}
		</span>
		<div>
			<p class="text-sm font-medium" style="color: {themeColor.text};">
				Seat {selectedEl.seatNumber ?? selectedEl.label}
				{#if selectedEl.row} · Row {selectedEl.row}{/if}
				{#if selectedEl.section} · {selectedEl.section}{/if}
			</p>
		</div>
	</div>
	{/if}
	{/if}
</div>
{/if}
