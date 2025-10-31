<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	export let open = false;
	export let startDate: Date | null = null;
	export let selectedDate: Date | null = null;

	type Day = { day: number; current: boolean };

	const today = new Date();
	let currentMonth = today.getMonth();
	let currentYear = today.getFullYear();
	let days: Day[] = [];
	let showMonthYearSelect = false;

	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	function generateCalendar(year: number, month: number) {
		const firstDay = new Date(year, month, 1).getDay();
		const totalDays = new Date(year, month + 1, 0).getDate();
		const prevMonthDays = new Date(year, month, 0).getDate();
		const calendar: Day[] = [];

		// Previous month padding
		for (let i = firstDay - 1; i >= 0; i--) {
			calendar.push({ day: prevMonthDays - i, current: false });
		}

		// Current month
		for (let i = 1; i <= totalDays; i++) {
			calendar.push({ day: i, current: true });
		}

		// Fill to multiple of 7
		while (calendar.length % 7 !== 0) {
			calendar.push({ day: calendar.length % 7, current: false });
		}

		days = calendar;
	}

	onMount(() => {
		generateCalendar(currentYear, currentMonth);
	});

	function prevMonth(): void {
		currentMonth--;
		if (currentMonth < 0) {
			currentMonth = 11;
			currentYear--;
		}
		generateCalendar(currentYear, currentMonth);
	}

	function nextMonth(): void {
		currentMonth++;
		if (currentMonth > 11) {
			currentMonth = 0;
			currentYear++;
		}
		generateCalendar(currentYear, currentMonth);
	}

	function selectDate(day: Day): void {
		if (!day.current) return;
		selectedDate = new Date(currentYear, currentMonth, day.day);
	}

	function isToday(day: Day): boolean {
		return (
			day.current &&
			day.day === today.getDate() &&
			currentMonth === today.getMonth() &&
			currentYear === today.getFullYear()
		);
	}

	function isStartDate(day: Day): boolean {
		if (!startDate) return false;
		const sd = new Date(startDate);
		return (
			day.current &&
			day.day === sd.getDate() &&
			currentMonth === sd.getMonth() &&
			currentYear === sd.getFullYear()
		);
	}

	function isSelected(day: Day): boolean {
		if (!selectedDate) return false;
		return (
			day.current &&
			day.day === selectedDate.getDate() &&
			currentMonth === selectedDate.getMonth() &&
			currentYear === selectedDate.getFullYear()
		);
	}

	// --- Month & Year Selection ---
	let years: number[] = [];
	const current = new Date().getFullYear();
	for (let i = current - 50; i <= current + 50; i++) {
		years.push(i);
	}

	function selectMonth(mIndex: number): void {
		currentMonth = mIndex;
		showMonthYearSelect = false;
		generateCalendar(currentYear, currentMonth);
	}

	function selectYear(year: number): void {
		currentYear = year;
		generateCalendar(currentYear, currentMonth);
	}
</script>

{#if open}
	<!-- Modal Container -->
	<div class="traingle absolute top-full left-0 z-40 mt-2 w-[270px]">
		<div class="bg relative h-full max-h-[300px] min-h-[280px] w-full space-y-3 p-3">
			<!-- Header -->
			<div class="mb-4 flex items-center justify-between">
				<!-- Month + Year toggle -->
				<button
					class="cursor-pointer text-lg font-semibold text-gray-900 select-none"
					on:click={() => (showMonthYearSelect = !showMonthYearSelect)}
				>
					{monthNames[currentMonth]}
					{currentYear}
				</button>

				<div class="flex items-center gap-1">
					<button on:click={prevMonth} class="rounded p-1 text-[#68696B] hover:bg-[#F0EEEF]">
						<Icon icon="mdi:chevron-left" class="text-2xl" />
					</button>

					<span class="h-[11.25px] w-[11.25px] rounded-full bg-[#E5E2E3]"></span>

					<button on:click={nextMonth} class="rounded p-1 text-[#68696B] hover:bg-[#F0EEEF]">
						<Icon icon="mdi:chevron-right" class="text-2xl" />
					</button>
				</div>
			</div>

			{#if !showMonthYearSelect}
				<!-- Weekdays -->
				<div class="mb-1 grid grid-cols-7 text-center text-xs text-gray-500">
					<div>S</div>
					<div>M</div>
					<div>T</div>
					<div>W</div>
					<div>T</div>
					<div>F</div>
					<div>S</div>
				</div>

				<!-- Calendar Grid -->
				<div class="grid grid-cols-7 gap-1 text-center">
					{#each days as day}
						<button
							class={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm text-sm transition-colors
                            ${day.current ? 'text-gray-900' : 'text-gray-400'}
                            ${isStartDate(day) ? 'bg-[#F31A7C] font-semibold text-white' : ''}
                            ${isToday(day) && !isStartDate(day) ? 'bg-black font-semibold text-white' : ''}
                            ${isSelected(day) && !isToday(day) && !isStartDate(day) ? 'bg-[#F31A7C] font-semibold text-white' : ''}
                            hover:bg-gray-300 hover:text-black`}
							on:click={() => selectDate(day)}
						>
							{day.day}
						</button>
					{/each}
				</div>
			{:else}
				<!-- Month & Year Selector -->
				<div class="mt-2 flex gap-3 text-black">
					<!-- Months -->
					<div class="custom-scrollbar max-h-50 flex-1 overflow-y-auto rounded border p-2">
						{#each monthNames as month, i}
							<button
								class={`mb-1 w-full cursor-pointer rounded p-1 text-center
              ${i === currentMonth ? 'bg-[#F31A7C] font-semibold text-white' : 'hover:bg-gray-100'}`}
								on:click={() => selectMonth(i)}
							>
								{month}
							</button>
						{/each}
					</div>

					<!-- Years -->
					<div class="custom-scrollbar max-h-50 flex-1 overflow-y-auto rounded border p-2">
						{#each years as y}
							<button
								class={`mb-1 w-full cursor-pointer rounded p-1 text-center
              ${y === currentYear ? 'bg-[#F31A7C] font-semibold text-white' : 'hover:bg-gray-100'}`}
								on:click={() => selectYear(y)}
							>
								{y}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.bg {
		background: #f8f9f9;
		box-shadow: 0px 0px 22.5px 0.75px rgba(0, 0, 0, 0.16);
		border-radius: 7.5px;
	}

	/* Triangle pointer */
	.traingle::before {
		content: '';
		position: absolute;
		top: -18px;
		left: 60px;
		border-width: 8px;
		border-style: solid;
		border-color: transparent transparent white transparent;
	}
</style>
