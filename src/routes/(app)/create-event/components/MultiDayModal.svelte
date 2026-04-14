<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';
	import DatePickerModal from './DatePickerModal.svelte';
	import TimeModal from './TimeModal.svelte';

	export let open = false;
	export let isMultiDay = false;
	export let eventDays: Array<{
		dayNumber: number;
		label: string;
		date: Date;
		startTime: string;
		endTime: string;
	}> = [];

	const dispatch = createEventDispatcher();

	// Track which day's date/time picker is open
	let openDatePicker: number | null = null;
	let openStartTime: number | null = null;
	let openEndTime: number | null = null;

	function toggleMultiDay() {
		isMultiDay = !isMultiDay;
		if (isMultiDay && eventDays.length === 0) {
			addDay();
			addDay();
		} else if (!isMultiDay) {
			eventDays = [];
		}
		dispatch('change', { isMultiDay, eventDays });
	}

	function addDay() {
		const nextNum = eventDays.length + 1;
		const lastDay = eventDays.length > 0 ? eventDays[eventDays.length - 1] : null;
		const nextDate = lastDay ? new Date(lastDay.date.getTime() + 86400000) : new Date();
		eventDays = [
			...eventDays,
			{
				dayNumber: nextNum,
				label: `Day ${nextNum}`,
				date: nextDate,
				startTime: '9:00 AM',
				endTime: '5:00 PM'
			}
		];
		dispatch('change', { isMultiDay, eventDays });
	}

	function removeDay(index: number) {
		if (eventDays.length <= 2) return;
		eventDays = eventDays
			.filter((_, i) => i !== index)
			.map((d, i) => ({ ...d, dayNumber: i + 1 }));
		dispatch('change', { isMultiDay, eventDays });
	}

	function formatDate(date: Date) {
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}

	function updateDayDate(index: number, date: Date) {
		eventDays[index].date = date;
		eventDays = [...eventDays];
		openDatePicker = null;
		dispatch('change', { isMultiDay, eventDays });
	}

	function updateDayStartTime(index: number, time: string) {
		eventDays[index].startTime = time;
		eventDays = [...eventDays];
		openStartTime = null;
		dispatch('change', { isMultiDay, eventDays });
	}

	function updateDayEndTime(index: number, time: string) {
		eventDays[index].endTime = time;
		eventDays = [...eventDays];
		openEndTime = null;
		dispatch('change', { isMultiDay, eventDays });
	}
</script>

{#if open}
	<div
		id="multiday"
		class="triangle absolute top-full left-0 z-40 mt-2 w-[340px] md:w-[400px]"
	>
		<div class="bg relative w-full space-y-3 p-4">
			<div class="flex items-center justify-between">
				<span class="text-sm font-semibold text-gray-900">Multi-Day Event</span>
				<label class="inline-flex cursor-pointer items-center">
					<input type="checkbox" class="peer sr-only" checked={isMultiDay} on:change={toggleMultiDay} />
					<div
						class="peer relative h-6 w-10 rounded-full bg-gray-300 peer-checked:bg-[#F31A7C] peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-4"
					></div>
				</label>
			</div>

			{#if isMultiDay}
				<p class="text-xs text-gray-500">
					Define each day of your event with its own schedule. Attendees will see day tabs on the event page.
				</p>

				<div class="custom-scrollbar max-h-[320px] space-y-3 overflow-y-auto pr-1">
					{#each eventDays as day, i}
						<div class="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
							<div class="flex items-center justify-between">
								<input
									type="text"
									bind:value={day.label}
									class="w-full max-w-[200px] rounded border border-gray-200 px-2 py-1 text-sm font-medium text-gray-900 focus:border-[#F31A7C] focus:outline-none"
									placeholder="Day {day.dayNumber}"
									on:change={() => dispatch('change', { isMultiDay, eventDays })}
								/>
								{#if eventDays.length > 2}
									<button
										class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
										on:click={() => removeDay(i)}
										title="Remove day"
									>
										<Icon icon="mdi:close" class="text-lg" />
									</button>
								{/if}
							</div>

							<div class="grid grid-cols-3 gap-2">
								<!-- Date -->
								<div class="relative" use:clickOutside={() => { if (openDatePicker === i) openDatePicker = null; }}>
									<button
										class="w-full rounded bg-gray-100 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
										on:click={() => (openDatePicker = openDatePicker === i ? null : i)}
									>
										{formatDate(day.date)}
									</button>
									<DatePickerModal
										open={openDatePicker === i}
										selectedDate={day.date}
										on:select={(e) => updateDayDate(i, e.detail)}
									/>
								</div>

								<!-- Start Time -->
								<div class="relative" use:clickOutside={() => { if (openStartTime === i) openStartTime = null; }}>
									<button
										class="w-full rounded bg-gray-100 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
										on:click={() => (openStartTime = openStartTime === i ? null : i)}
									>
										{day.startTime}
									</button>
									{#if openStartTime === i}
										<TimeModal
											open={true}
											selectedTime={day.startTime}
											on:select={(e) => updateDayStartTime(i, e.detail)}
										/>
									{/if}
								</div>

								<!-- End Time -->
								<div class="relative" use:clickOutside={() => { if (openEndTime === i) openEndTime = null; }}>
									<button
										class="w-full rounded bg-gray-100 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
										on:click={() => (openEndTime = openEndTime === i ? null : i)}
									>
										{day.endTime}
									</button>
									{#if openEndTime === i}
										<TimeModal
											open={true}
											selectedTime={day.endTime}
											referenceTime={day.startTime}
											on:select={(e) => updateDayEndTime(i, e.detail)}
										/>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>

				{#if eventDays.length < 14}
					<button
						class="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-[#F31A7C] hover:text-[#F31A7C]"
						on:click={addDay}
					>
						<Icon icon="mdi:plus" class="text-lg" />
						Add Day
					</button>
				{/if}
			{:else}
				<p class="text-xs text-gray-500">
					Enable this to create a multi-day event with separate schedules, check-ins, and ticket access per day.
				</p>
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

	.triangle::before {
		content: '';
		position: absolute;
		top: -18px;
		left: 30px;
		border-width: 8px;
		border-style: solid;
		border-color: transparent transparent white transparent;
	}
</style>
