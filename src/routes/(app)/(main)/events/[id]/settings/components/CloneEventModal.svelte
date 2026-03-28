<script lang="ts">
	import { goto } from '$app/navigation';
	import { cloneEvent, getMyCollections } from '$lib/services/event.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import DatePickerModal from '../../../../../create-event/components/DatePickerModal.svelte';
	import TimeModal from '../../../../../create-event/components/TimeModal.svelte';

	export let open = false;
	export let eventId = '';
	export let eventTitle = '';

	let collections: any[] = [];
	let selectedCollectionId = '';
	let showCollectionDropdown = false;
	let showVisibilityDropdown = false;
	let visibility: 'PUBLIC' | 'PRIVATE' = 'PUBLIC';
	let startDate: Date = new Date();
	let startTime = '02:00 PM';
	let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	let saving = false;
	let error = '';

	let openDatePicker = false;
	let openTimePicker = false;

	$: if (open) { loadCollections(); }
	$: selectedCollection = collections.find((c) => (c._id || c.id) === selectedCollectionId);
	$: tzOffset = (() => {
		try {
			const d = new Date();
			const parts = new Intl.DateTimeFormat('en', { timeZone, timeZoneName: 'shortOffset' }).formatToParts(d);
			const tz = parts.find(p => p.type === 'timeZoneName');
			return tz?.value || timeZone;
		} catch { return timeZone; }
	})();

	async function loadCollections() {
		try { collections = await getMyCollections(); if (collections.length > 0 && !selectedCollectionId) selectedCollectionId = collections[0]._id || collections[0].id; } catch { collections = []; }
	}

	function buildDateTime(date: Date, timeStr: string): string {
		const [timePart, meridiem] = timeStr.split(' ');
		let [hours, minutes] = timePart.split(':').map(Number);
		if (meridiem === 'PM' && hours !== 12) hours += 12;
		if (meridiem === 'AM' && hours === 12) hours = 0;
		const d = new Date(date);
		d.setHours(hours, minutes, 0, 0);
		return d.toISOString();
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
	}

	async function handleClone() {
		if (!selectedCollectionId) { error = 'Please select a collection'; return; }
		saving = true; error = '';
		try {
			const startDT = buildDateTime(startDate, startTime);
			const endDT = new Date(new Date(startDT).getTime() + 3 * 60 * 60 * 1000).toISOString();
			const result = await cloneEvent(eventId, {
				collectionId: selectedCollectionId,
				startDateTime: startDT,
				endDateTime: endDT,
				timeZone,
				visibility,
			});
			open = false;
			const newId = result.eventId || result.event?.id || result.event?._id;
			if (newId) goto(`/events/${newId}`);
		} catch (e: any) { error = e.message || 'Failed to clone event'; }
		finally { saving = false; }
	}
</script>

{#if open}
	<div on:click={() => (open = false)} on:keydown={(e) => e.key === 'Escape' && (open = false)}
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-3" role="dialog" aria-modal="true" tabindex="-1">
		<div class="custom-scrollbar max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-5 shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
			<!-- Header -->
			<div class="mb-1 flex items-start justify-between">
				<img src="/clone event.svg" alt="" class="h-12 w-12" />
				<button on:click={() => (open = false)} class="flex h-7 w-7 items-center justify-center rounded-full bg-[#EBECED]">
					<Icon icon="mdi:close" class="text-base text-gray-600" />
				</button>
			</div>
			<h2 class="text-lg font-semibold text-gray-900">Clone Event</h2>
			<p class="text-sm text-gray-400">{eventTitle}</p>
			<p class="mt-1 text-xs text-gray-500">Everything except the attendee list and event Marketing will be copied over.</p>

			<!-- Collection -->
			<div class="mt-4">
				<label class="mb-1 block text-xs font-medium text-gray-600">Calendar</label>
				<div class="flex items-center gap-2">
					<div class="relative flex-1" use:clickOutside={() => (showCollectionDropdown = false)}>
						<button on:click={() => (showCollectionDropdown = !showCollectionDropdown)}
							class="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700">
							<span class="flex items-center gap-2">
								<img src="/tech-icon.svg" alt="" class="h-4 w-4" />
								{selectedCollection?.name || 'Choose'}
							</span>
							<Icon icon="mdi:chevron-down" class="text-lg text-gray-400" />
						</button>
						{#if showCollectionDropdown}
							<div class="absolute left-0 z-10 mt-1 w-full rounded-lg border bg-white shadow-lg">
								{#each collections as col}
									<button on:click={() => { selectedCollectionId = col._id || col.id; showCollectionDropdown = false; }}
										class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50">
										<img src="/tech-icon.svg" alt="" class="h-4 w-4" />
										{col.name}
									</button>
								{/each}
							</div>
						{/if}
					</div>
					<!-- Visibility toggle -->
					<div class="relative" use:clickOutside={() => (showVisibilityDropdown = false)}>
						<button on:click={() => (showVisibilityDropdown = !showVisibilityDropdown)}
							class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
							<Icon icon={visibility === 'PUBLIC' ? 'mdi:earth' : 'mdi:lock-outline'} class="text-lg" />
						</button>
						{#if showVisibilityDropdown}
							<div class="absolute right-0 z-10 mt-1 w-56 rounded-lg border bg-white p-2 shadow-lg">
								<button on:click={() => { visibility = 'PUBLIC'; showVisibilityDropdown = false; }}
									class="flex w-full items-start gap-2 rounded-md p-2 text-left hover:bg-gray-50 {visibility === 'PUBLIC' ? 'bg-gray-50' : ''}">
									<Icon icon="mdi:earth" class="mt-0.5 text-base text-gray-500" />
									<div>
										<p class="text-sm font-medium">Public</p>
										<p class="text-xs text-gray-400">Shown on your calendar and eligible to be featured.</p>
									</div>
									{#if visibility === 'PUBLIC'}<Icon icon="mdi:check" class="ml-auto text-base" />{/if}
								</button>
								<button on:click={() => { visibility = 'PRIVATE'; showVisibilityDropdown = false; }}
									class="flex w-full items-start gap-2 rounded-md p-2 text-left hover:bg-gray-50 {visibility === 'PRIVATE' ? 'bg-gray-50' : ''}">
									<Icon icon="mdi:lock-outline" class="mt-0.5 text-base text-gray-500" />
									<div>
										<p class="text-sm font-medium">Private</p>
										<p class="text-xs text-gray-400">Unlisted. Only people with the link can register.</p>
									</div>
									{#if visibility === 'PRIVATE'}<Icon icon="mdi:check" class="ml-auto text-base" />{/if}
								</button>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Date & Time -->
			<div class="mt-4">
				<label class="mb-1 block text-xs font-medium text-gray-600">New Time</label>
				<div class="flex items-center gap-2">
					<div class="relative" use:clickOutside={() => (openDatePicker = false)}>
						<button on:click={() => (openDatePicker = !openDatePicker)}
							class="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700">
							{formatDate(startDate)}
						</button>
						<DatePickerModal open={openDatePicker} bind:selectedDate={startDate} />
					</div>
					<div class="relative" use:clickOutside={() => (openTimePicker = false)}>
						<button on:click={() => (openTimePicker = !openTimePicker)}
							class="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700">
							{startTime}
						</button>
						<TimeModal open={openTimePicker} bind:selectedTime={startTime} />
					</div>
				</div>
			</div>

			<!-- Timezone -->
			<div class="mt-3 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-500">
				<span class="text-xs text-gray-400">{tzOffset}</span>
				<span>{timeZone.split('/').pop()?.replace(/_/g, ' ')}</span>
			</div>

			{#if error}<p class="mt-3 text-sm text-red-500">{error}</p>{/if}

			<button on:click={handleClone} disabled={saving}
				class="mt-4 w-full rounded-lg bg-gray-900 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50">
				{saving ? 'Cloning...' : 'Clone Event'}
			</button>
		</div>
	</div>
{/if}
