<script lang="ts">
	export let open: boolean = false;
	export let collectionId: string = '';
	import { addExternalEventToCollection, scrapeExternalEventUrl } from '$lib/services/event.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher, onMount, tick } from 'svelte';
	import DatePickerModal from '../../../../create-event/components/DatePickerModal.svelte';
	import TimeModal from '../../../../create-event/components/TimeModal.svelte';

	const dispatch = createEventDispatcher<{
		close: void;
		collection: void;
		added: void;
	}>();

	let sourceUrl = '';
	let eventName = '';
	let eventDescription = '';
	let eventLocation = '';
	let eventOrganizer = '';
	let eventType: 'VIRTUAL' | 'PHYSICAL' | 'HYBRID' = 'PHYSICAL';

	let openStartDatePickerModal = false;
	let openStartTimeModal = false;
	let openEndTimeModal = false;
	let startTime = '7:00 PM';
	let endTime = '10:00 PM';
	let startDate = new Date();
	let endDate = new Date();
	let locationName = '...';
	let timezone = '';

	let submitting = false;
	let submitError = '';
	let resolving = false;

	function formatDate(date: Date) {
		return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
	}

	function buildDateTime(date: Date, timeStr: string): string {
		const [timePart, meridiem] = timeStr.split(' ');
		let [hours, minutes] = timePart.split(':').map(Number);
		if (meridiem === 'PM' && hours !== 12) hours += 12;
		if (meridiem === 'AM' && hours === 12) hours = 0;
		const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, '0'), d = String(date.getDate()).padStart(2, '0');
		return new Date(`${y}-${m}-${d}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`).toISOString();
	}

	let resolveError = '';

	async function handleResolveUrl() {
		if (!sourceUrl.trim()) return;
		resolving = true;
		resolveError = '';
		try {
			const data = await scrapeExternalEventUrl(sourceUrl.trim());
			if (data.title) eventName = data.title;
			if (data.description) eventDescription = data.description;
			if (data.location) eventLocation = data.location;
			if (data.siteName) eventOrganizer = data.siteName;
			if (data.startDate) {
				const d = new Date(data.startDate);
				if (!isNaN(d.getTime())) {
					startDate = d;
					startTime = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
				}
			}
			if (data.endDate) {
				const d = new Date(data.endDate);
				if (!isNaN(d.getTime())) {
					endDate = d;
					endTime = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
				}
			}
		} catch (e: any) {
			resolveError = e.message ?? 'Could not fetch event details from URL';
		} finally {
			resolving = false;
		}
	}

	async function handleSubmit() {
		if (!eventName.trim()) { submitError = 'Event name is required'; return; }
		submitting = true;
		submitError = '';
		try {
			await addExternalEventToCollection(collectionId, {
				title: eventName.trim(),
				description: eventDescription.trim() || undefined,
				startDateTime: buildDateTime(startDate, startTime),
				endDateTime: buildDateTime(endDate, endTime),
				timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
				eventType,
				location: eventLocation || undefined,
				organizerName: eventOrganizer || undefined,
				sourceUrl: sourceUrl || undefined,
			});
			dispatch('added');
		} catch (e: any) {
			submitError = e.message ?? 'Failed to add event';
		} finally {
			submitting = false;
		}
	}

	function reset() {
		sourceUrl = ''; eventName = ''; eventDescription = ''; eventLocation = '';
		eventOrganizer = ''; submitError = '';
	}

	$: if (!open) reset();

	onMount(() => {
		timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(async (pos) => {
				const off = -(new Date().getTimezoneOffset() / 60);
				timezone = `GMT${off >= 0 ? '+' : ''}${String(Math.abs(off)).padStart(2, '0')}:00`;
				try {
					const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
					const data = await res.json();
					locationName = data.address.city || data.address.town || data.address.state || 'Unknown';
				} catch { locationName = 'Unknown'; }
			});
		}
	});
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 backdrop-blur-sm"
		on:click={() => dispatch('close')}>
		<div class="flex max-h-[90vh] w-full max-w-lg flex-col rounded-md bg-[#F8F9F9] shadow-lg"
			on:click|stopPropagation>
			<div class="flex items-center justify-between border-b border-gray-200 px-4 py-4">
				<div class="flex items-center gap-3">
					<button aria-label="Close" on:click={() => dispatch('close')}>
						<Icon icon="mdi:close" class="h-5 w-5 text-[#68696B]" />
					</button>
					<p class="text-base font-medium">Add External Event</p>
				</div>
			</div>

			<div class="custom-scrollbar flex-1 overflow-y-auto p-4 space-y-4" style="max-height: 75vh;">
				<!-- Source URL -->
				<div>
					<label class="mb-1 block text-sm font-medium text-[#666769]">External Event URL</label>
					<div class="flex gap-2">
						<input type="url" bind:value={sourceUrl}
							placeholder="https://eventbrite.com/e/some-event"
							class="flex-1 rounded-md border px-3 py-2 text-sm placeholder-[#C8C9C9] focus:outline-none" />
						<button on:click={handleResolveUrl} disabled={resolving || !sourceUrl.trim()}
							class="rounded-md bg-[#333537] px-4 py-2 text-sm text-white disabled:opacity-50">
							{resolving ? '...' : 'Fetch'}
						</button>
					</div>
					<p class="mt-1 text-xs text-gray-400">Paste a link and we'll try to extract event details.</p>
					{#if resolveError}
						<p class="mt-1 text-xs text-red-500">{resolveError}</p>
					{/if}
				</div>

				<!-- Event Name -->
				<div>
					<label class="mb-1 block text-sm font-medium text-[#666769]">Event Name *</label>
					<input type="text" bind:value={eventName} placeholder="Happy Hour Drinks"
						class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" />
				</div>

				<!-- Description -->
				<div>
					<label class="mb-1 block text-sm font-medium text-[#666769]">Description</label>
					<textarea bind:value={eventDescription} rows="3" placeholder="Brief description..."
						class="w-full resize-none rounded-md border px-3 py-2 text-sm focus:outline-none"></textarea>
				</div>

				<!-- Event Type -->
				<div>
					<label class="mb-1 block text-sm font-medium text-[#666769]">Event Type</label>
					<div class="flex gap-2">
						{#each (['PHYSICAL', 'VIRTUAL', 'HYBRID'] as const) as t}
							<button on:click={() => (eventType = t)}
								class="rounded-md border px-3 py-1.5 text-sm transition {eventType === t ? 'border-black bg-black text-white' : 'bg-white text-gray-600'}">
								{t.charAt(0) + t.slice(1).toLowerCase()}
							</button>
						{/each}
					</div>
				</div>

				<!-- Location -->
				<div>
					<label class="mb-1 block text-sm font-medium text-[#666769]">Location</label>
					<input type="text" bind:value={eventLocation} placeholder="Venue name or meeting link"
						class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" />
				</div>

				<!-- Organizer -->
				<div>
					<label class="mb-1 block text-sm font-medium text-[#666769]">Organizer</label>
					<input type="text" bind:value={eventOrganizer} placeholder="Organizer name"
						class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" />
				</div>

				<!-- Date & Time -->
				<div>
					<label class="mb-1 block text-sm font-medium text-[#666769]">Event Time</label>
					<div class="flex w-full flex-col rounded-[9.75px] bg-white sm:max-w-[280px]">
						<div class="relative w-full pt-1 pl-3" use:clickOutside={() => (openStartDatePickerModal = false)}>
							<button on:click={() => (openStartDatePickerModal = !openStartDatePickerModal)}
								class="h-[32px] w-[115px] rounded-sm p-1 text-sm transition hover:bg-[#E4E5E5]">
								{formatDate(startDate)}
							</button>
							<DatePickerModal open={openStartDatePickerModal} bind:selectedDate={startDate} />
						</div>
						<div class="mt-2 flex w-full pl-3">
							<div class="relative mb-2 w-full text-sm" use:clickOutside={() => (openStartTimeModal = false)}>
								<button on:click={() => (openStartTimeModal = !openStartTimeModal)}
									class="w-full text-sm font-semibold"><p class="w-fit px-1">{startTime}</p></button>
								<TimeModal open={openStartTimeModal} bind:selectedTime={startTime} />
							</div>
							<span class="mb-2 px-1 text-sm text-gray-300">—</span>
							<div class="relative mb-2 w-full text-sm" use:clickOutside={() => (openEndTimeModal = false)}>
								<button on:click={() => (openEndTimeModal = !openEndTimeModal)}
									class="w-full pr-4 text-sm font-semibold"><p class="ml-auto w-fit">{endTime}</p></button>
								<TimeModal open={openEndTimeModal} bind:selectedTime={endTime} referenceTime={startTime} />
							</div>
						</div>
						<div class="flex w-full gap-2 rounded-b-[9.75px] border-t px-3 py-3 text-xs text-[#636466]">
							<Icon icon="mdi:earth" class="h-4 w-4" />
							<span>{timezone} · {locationName}</span>
						</div>
					</div>
				</div>

				{#if submitError}
					<p class="text-sm text-red-500">{submitError}</p>
				{/if}

				<button on:click={handleSubmit} disabled={submitting}
					class="w-full rounded-md bg-[#333537] py-3 text-sm text-white disabled:opacity-50">
					{submitting ? 'Adding...' : 'Add Event to Collection'}
				</button>
				<p class="text-center text-xs text-gray-400">
					External events are created as live events and can be managed from the event page.
				</p>
			</div>
		</div>
	</div>
{/if}
