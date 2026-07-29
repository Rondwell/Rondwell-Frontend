<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let open = false;
	export let selectedTime = '';
	export let referenceTime: string | null = null; // e.g., "11:30 PM"
	export let minTime: string | null = null; // e.g., "9:00 AM" — hide times before this
	export let maxTime: string | null = null; // e.g., "5:00 PM" — hide times after this
	/** When true the list starts *after* referenceTime, so an end time can never
	 * be earlier than the start time it is paired with. */
	export let afterReference = false;

	const dispatch = createEventDispatcher();

	function parseTimeTo24(timeStr: string): number {
		const [time, ampm] = timeStr.trim().split(' ');
		let [h, m] = time.split(':').map(Number);
		if (ampm?.toUpperCase() === 'PM' && h !== 12) h += 12;
		if (ampm?.toUpperCase() === 'AM' && h === 12) h = 0;
		return h * 60 + m;
	}

	// Generate 30-min interval times
	function generateTimes(min: string | null, max: string | null, ref: string | null, after: boolean) {
		const times = [];
		let minMinutes = min ? parseTimeTo24(min) : 0;
		const maxMinutes = max ? parseTimeTo24(max) : 24 * 60;
		if (after && ref) minMinutes = Math.max(minMinutes, parseTimeTo24(ref) + 30);
		for (let h = 0; h < 24; h++) {
			for (let m = 0; m < 60; m += 30) {
				const totalMin = h * 60 + m;
				if (totalMin < minMinutes || totalMin > maxMinutes) continue;
				let hour12 = h % 12 === 0 ? 12 : h % 12;
				let ampm = h < 12 ? 'AM' : 'PM';
				let minuteStr = m === 0 ? '00' : '30';
				times.push({ h, m, label: `${hour12}:${minuteStr} ${ampm}` });
			}
		}
		return times;
	}

	$: times = generateTimes(minTime, maxTime, referenceTime, afterReference);

	// Calculate difference between time and reference
	function getTimeDiff(h: number, m: number) {
		if (!referenceTime) return '';

		const refTotal = parseTimeTo24(referenceTime);
		const currentTotal = h * 60 + m;

		let diff = currentTotal - refTotal;
		if (diff < 0) diff += 24 * 60; // handle next-day wrap-around

		const diffHours = Math.floor(diff / 60);
		const diffMinutes = diff % 60;

		let diffStr = '';
		if (diffHours > 0) diffStr += `${diffHours}h `;
		if (diffMinutes > 0) diffStr += `${diffMinutes}m`;
		return diffStr.trim();
	}

	function selectTime(time: string) {
		selectedTime = time;
		dispatch('select', time);
		open = false;
	}
</script>

{#if open}
	<!--
		On small screens this is centred in the viewport instead of anchored to a
		narrow trigger button, which previously pushed it past the screen edge.
	-->
	<div
		id="time"
		class="triangle fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 sm:absolute sm:top-full sm:right-0 sm:left-auto sm:z-40 sm:mt-2 sm:translate-x-0 sm:translate-y-0
			{referenceTime !== null ? 'w-[185px]' : 'w-[150px] sm:w-[135px]'}"
	>
		<div
			class="custom-scrollbar relative h-[300px] w-full space-y-1 overflow-hidden overflow-y-auto rounded-sm bg-[#FFFCFC] p-2 shadow-lg"
		>
			{#if times.length === 0}
				<p class="px-2 py-3 text-xs text-gray-400">No times available in this window.</p>
			{/if}
			{#each times as time}
				<button
					type="button"
					class="flex w-full cursor-pointer rounded-md px-2.5 py-1.5 text-xs hover:bg-[#F31A7C] hover:text-white {selectedTime ===
					time.label
						? 'bg-[#F31A7C]  text-white'
						: 'text-black'}"
					on:click={() => selectTime(time.label)}
				>
					<span class="w-full text-left">{time.label}</span>
					{#if referenceTime}
						<span class="w-full text-left text-xs text-gray-400">{getTimeDiff(time.h, time.m)}</span
						>
					{/if}
				</button>
			{/each}
		</div>
	</div>
{/if}

<style>
	/* Triangle pointer — only meaningful when anchored to the trigger. */
	@media (min-width: 640px) {
		.triangle::before {
			content: '';
			position: absolute;
			top: -18px;
			right: 30px;
			border-width: 8px;
			border-style: solid;
			border-color: transparent transparent white transparent;
		}
	}
</style>
