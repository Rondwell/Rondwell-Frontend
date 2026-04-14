<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let open = false;
	export let selectedTime = '';
	export let referenceTime: string | null = null; // e.g., "11:30 PM"
	export let minTime: string | null = null; // e.g., "9:00 AM" — hide times before this
	export let maxTime: string | null = null; // e.g., "5:00 PM" — hide times after this

	const dispatch = createEventDispatcher();

	function parseTimeTo24(timeStr: string): number {
		const [time, ampm] = timeStr.trim().split(' ');
		let [h, m] = time.split(':').map(Number);
		if (ampm?.toUpperCase() === 'PM' && h !== 12) h += 12;
		if (ampm?.toUpperCase() === 'AM' && h === 12) h = 0;
		return h * 60 + m;
	}

	// Generate 30-min interval times
	function generateTimes() {
		const times = [];
		const minMinutes = minTime ? parseTimeTo24(minTime) : 0;
		const maxMinutes = maxTime ? parseTimeTo24(maxTime) : 24 * 60;
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

	$: times = generateTimes();

	// Calculate difference between time and reference
	function getTimeDiff(h: number, m: number) {
		if (!referenceTime) return '';

		// Parse reference time: "11:30 PM"
		const [time, ampm] = referenceTime.split(' ');
		let [refHour, refMinute] = time.split(':').map(Number);
		if (ampm.toUpperCase() === 'PM' && refHour !== 12) refHour += 12;
		if (ampm.toUpperCase() === 'AM' && refHour === 12) refHour = 0;

		const refTotal = refHour * 60 + refMinute;
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
	<div
		id="time"
		class="triangle absolute top-full right-0 z-40 mt-2 max-w-[185px] {referenceTime !== null
			? 'w-[185px]'
			: 'w-[135px]'}"
	>
		<div
			class="custom-scrollbar relative h-[300px] w-full space-y-1 overflow-hidden overflow-y-auto rounded-sm bg-[#FFFCFC] p-2"
		>
			{#each times as time}
				<button
					class="flex w-full cursor-pointer rounded-md px-2.5 py-1.5 text-xs hover:bg-[#F31A7C] hover:text-white {selectedTime ===
					time.label
						? 'bg-[#F31A7C]  text-white'
						: 'text-black'}"
					on:click={() => selectTime(time.label)}
				>
					<span class="w-full">{time.label}</span>
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
	/* Triangle pointer */
	.triangle::before {
		content: '';
		position: absolute;
		top: -18px;
		right: 30px;
		border-width: 8px;
		border-style: solid;
		border-color: transparent transparent white transparent;
	}
</style>
