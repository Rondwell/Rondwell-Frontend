<script lang="ts">
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{ select: Date }>();

	export let open = false;
	export let startDate: Date | null = null;
	export let selectedDate: Date | null = null;
	export let minDate: Date | null = null;
	export let maxDate: Date | null = null;
	/** Horizontal anchor on >=sm screens. On small screens the panel is always
	 * centred in the viewport so it can never be clipped off-screen. */
	export let align: 'left' | 'right' = 'left';

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

	/**
	 * Which month should be on screen when the picker opens. Without this the
	 * calendar always landed on the *current* month, so an organiser scheduling
	 * a room inside a future event had to page forward manually — and any date
	 * they clicked in the wrong month was disabled by the min/max window.
	 */
	function focusMonthFor(date: Date) {
		currentMonth = date.getMonth();
		currentYear = date.getFullYear();
		generateCalendar(currentYear, currentMonth);
	}

	// Re-sync only on the closed -> open transition so paging through months
	// while the picker is open is never undone.
	let wasOpen = false;
	$: if (open !== wasOpen) {
		wasOpen = open;
		if (open) {
			showMonthYearSelect = false;
			focusMonthFor(selectedDate ?? startDate ?? minDate ?? today);
		}
	}

	// First paint (picker rendered already open).
	if (days.length === 0) generateCalendar(currentYear, currentMonth);

	function startOfDay(d: Date): Date {
		const copy = new Date(d);
		copy.setHours(0, 0, 0, 0);
		return copy;
	}

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

	// Disable paging past the allowed window so the organiser can't wander into
	// a month where every single day is greyed out.
	// Last day of the previous month must still be inside the window.
	$: canGoPrev = !minDate || new Date(currentYear, currentMonth, 0) >= startOfDay(new Date(minDate));
	// First day of the next month must still be inside the window.
	$: canGoNext = !maxDate || new Date(currentYear, currentMonth + 1, 1) <= startOfDay(new Date(maxDate));

	function selectDate(day: Day): void {
		if (!day.current) return;
		if (isDisabled(day)) return;
		// Preserve any time already carried by the bound value so picking a date
		// never silently resets the paired time field.
		const d = new Date(currentYear, currentMonth, day.day);
		if (selectedDate) {
			d.setHours(
				selectedDate.getHours(),
				selectedDate.getMinutes(),
				selectedDate.getSeconds(),
				selectedDate.getMilliseconds()
			);
		}
		selectedDate = d;
		// Callers that want click-to-close listen for this and flip their own
		// `open` flag. We don't self-close: several call sites pass `open`
		// one-way, and mutating it here would desync their toggle button.
		dispatch('select', d);
	}

	function isDisabled(day: Day): boolean {
		if (!day.current) return true;
		const d = startOfDay(new Date(currentYear, currentMonth, day.day));
		if (minDate && d < startOfDay(new Date(minDate))) return true;
		if (maxDate && d > startOfDay(new Date(maxDate))) return true;
		return false;
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
	<!--
		Positioning: on small screens the panel is fixed and centred in the
		viewport (it used to be absolutely positioned relative to a narrow
		trigger button, which pushed it off the left edge of the screen).
		From `sm` up it anchors to the trigger as a normal popover.
	-->
	<div
		id="date"
		class="triangle fixed top-1/2 left-1/2 z-50 w-[288px] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-1/2
			sm:absolute sm:top-full sm:z-40 sm:mt-2 sm:w-[270px] sm:translate-x-0 sm:translate-y-0
			{align === 'right' ? 'sm:right-0 sm:left-auto' : 'sm:left-0'}"
	>
		<div class="bg relative h-full w-full space-y-3 p-3 sm:max-h-[300px] sm:min-h-[280px]">
			<!-- Header -->
			<div class="mb-4 flex items-center justify-between">
				<!-- Month + Year toggle -->
				<button
					type="button"
					class="cursor-pointer text-lg font-semibold text-gray-900 select-none"
					on:click={() => (showMonthYearSelect = !showMonthYearSelect)}
				>
					{monthNames[currentMonth]}
					{currentYear}
				</button>

				<div class="flex items-center gap-1">
					<button
						type="button"
						aria-label="Previous month"
						on:click={prevMonth}
						disabled={!canGoPrev}
						class="rounded p-1 text-[#68696B] hover:bg-[#F0EEEF] disabled:cursor-not-allowed disabled:opacity-30"
					>
						<Icon icon="mdi:chevron-left" class="text-2xl" />
					</button>

					<span class="h-[11.25px] w-[11.25px] rounded-full bg-[#E5E2E3]"></span>

					<button
						type="button"
						aria-label="Next month"
						on:click={nextMonth}
						disabled={!canGoNext}
						class="rounded p-1 text-[#68696B] hover:bg-[#F0EEEF] disabled:cursor-not-allowed disabled:opacity-30"
					>
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
				<div class="grid grid-cols-7 justify-items-center gap-1 text-center">
					{#each days as day}
						{@const disabled = isDisabled(day)}
						{@const selected = isSelected(day) && !disabled}
						{@const isStart = isStartDate(day) && !disabled && !selected}
						<button
							type="button"
							class={`flex h-8 w-8 items-center justify-center rounded-sm text-sm transition-colors
                            ${disabled ? 'cursor-not-allowed text-gray-300' : day.current ? 'cursor-pointer text-gray-900' : 'text-gray-400'}
                            ${selected ? 'bg-[#F31A7C] font-semibold text-white' : ''}
                            ${isStart ? 'bg-[#F31A7C]/70 font-semibold text-white' : ''}
                            ${isToday(day) && !selected && !isStart && !disabled ? 'bg-black font-semibold text-white' : ''}
                            ${!disabled && !selected ? 'hover:bg-gray-300 hover:text-black' : ''}`}
							on:click={() => selectDate(day)}
							{disabled}
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
								type="button"
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
								type="button"
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

	/* Triangle pointer — only meaningful once the panel is anchored to its
	   trigger (>=640px). Below that the panel is centred in the viewport. */
	@media (min-width: 640px) {
		.triangle::before {
			content: '';
			position: absolute;
			top: -18px;
			left: 60px;
			border-width: 8px;
			border-style: solid;
			border-color: transparent transparent white transparent;
		}
	}
</style>
