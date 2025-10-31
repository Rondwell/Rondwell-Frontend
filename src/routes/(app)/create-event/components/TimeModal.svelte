<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let open = false;
	export let selectedTime = '';
	export let referenceTime: string | null = null; // e.g., "11:30 PM"

	const dispatch = createEventDispatcher();

	// Generate 30-min interval times
	function generateTimes() {
		const times = [];
		for (let h = 0; h < 24; h++) {
			for (let m = 0; m < 60; m += 30) {
				let hour12 = h % 12 === 0 ? 12 : h % 12;
				let ampm = h < 12 ? 'AM' : 'PM';
				let minuteStr = m === 0 ? '00' : '30';
				times.push({ h, m, label: `${hour12}:${minuteStr} ${ampm}` });
			}
		}
		return times;
	}

	const times = generateTimes();

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
		class="traingle absolute top-full right-0 z-40 mt-2 max-w-[201.75px] {referenceTime !== null
			? 'w-[201.75px]'
			: 'w-[150px]'}"
	>
		<div
			class="custom-scrollbar relative h-[332.25px] w-full space-y-3 overflow-hidden overflow-y-auto rounded-sm bg-[#FFFCFC] p-3"
		>
			{#each times as time}
				<button
					class="flex w-full cursor-pointer rounded-md px-3 py-2 hover:bg-[#F31A7C] hover:text-white {selectedTime ===
					time.label
						? 'bg-[#F31A7C]  text-white'
						: 'text-black'}"
					on:click={() => selectTime(time.label)}
				>
					<span class="w-full">{time.label}</span>
					{#if referenceTime}
						<span class="w-full text-left text-sm text-gray-400">{getTimeDiff(time.h, time.m)}</span
						>
					{/if}
				</button>
			{/each}
		</div>
	</div>
{/if}

<style>
	/* Triangle pointer */
	.traingle::before {
		content: '';
		position: absolute;
		top: -18px;
		right: 30px;
		border-width: 8px;
		border-style: solid;
		border-color: transparent transparent white transparent;
	}
</style>
