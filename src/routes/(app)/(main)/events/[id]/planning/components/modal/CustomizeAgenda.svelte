<script lang="ts">
	import { getEventById, updateEvent } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let eventId = '';
	export let eventTitle = '';

	let isPublic = true;
	let showSpeakerBio = true;
	let showRoomCapacity = false;
	let showSessionDescription = true;
	let showMeetingLinks = true;
	let groupBy: 'DATE' | 'ROOM' | 'TYPE' = 'DATE';
	let saving = false;
	let error = '';

	const groupByOptions = [
		{ label: 'By Date (Chronological)', value: 'DATE', icon: 'mdi:calendar-outline' },
		{ label: 'By Room / Location', value: 'ROOM', icon: 'mdi:door-open' },
		{ label: 'By Session Type', value: 'TYPE', icon: 'mdi:tag-outline' },
	];

	$: if (open) loadSettings();

	async function loadSettings() {
		try {
			const event = await getEventById(eventId);
			const s = event?.agendaSettings;
			if (s) {
				isPublic = s.isPublic ?? true;
				showSpeakerBio = s.showSpeakerBio ?? true;
				showRoomCapacity = s.showRoomCapacity ?? false;
				showSessionDescription = s.showSessionDescription ?? true;
				showMeetingLinks = s.showMeetingLinks ?? true;
				groupBy = s.groupBy ?? 'DATE';
			}
		} catch { /* use defaults */ }
		error = '';
	}

	async function handleSave() {
		saving = true; error = '';
		try {
			await updateEvent(eventId, {
				agendaSettings: { isPublic, showSpeakerBio, showRoomCapacity, showSessionDescription, showMeetingLinks, groupBy }
			} as any);
			dispatch('saved');
			open = false;
		} catch (e: any) { error = e.message || 'Failed to save settings'; }
		finally { saving = false; }
	}

	function previewPublicAgenda() {
		window.open(`/event-page/${eventId}/agenda`, '_blank');
	}

	function syncWithCalendar() {
		// Generate an .ics download link or open Google Calendar
		const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&details=${encodeURIComponent('Event Agenda')}`;
		window.open(calUrl, '_blank');
	}
</script>

{#if open}
<div on:click={() => (open = false)} on:keydown={(e) => e.key === 'Escape' && (open = false)} class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-3 py-10" role="dialog" aria-modal="true" tabindex="-1">
<div class="w-full max-w-xl overflow-hidden rounded-xl bg-[#F4F5F6] shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
		<div class="flex items-center gap-3">
			<button aria-label="Close" on:click={() => (open = false)}><Icon icon="mdi:chevron-double-right" class="text-lg text-gray-500" /></button>
			<p class="font-medium">Customize Agenda</p>
		</div>
		<div class="flex items-center gap-3">
			<button on:click={handleSave} disabled={saving} class="flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
				<Icon icon="mdi:content-save-edit-outline" class="text-sm" /> {saving ? 'Saving...' : 'Save Settings'}
			</button>
			<button on:click={() => (open = false)} class="flex items-center gap-1 rounded-lg bg-[#F0F1F1] px-3 py-1.5 text-sm font-medium text-[#727375]">Cancel <Icon icon="mdi:close" class="text-sm" /></button>
		</div>
	</div>

	<!-- Body -->
	<div class="custom-scrollbar max-h-[75vh] space-y-6 overflow-y-auto px-6 py-6">
		<h2 class="text-2xl font-semibold text-gray-900">Agenda Settings</h2>
		<p class="text-sm text-gray-500">Configure how your event's agenda is displayed to attendees.</p>

		{#if error}<p class="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>{/if}

		<!-- Quick Actions -->
		<div class="rounded-lg border border-gray-200 bg-white p-5">
			<p class="mb-4 font-medium text-gray-900">Quick Actions</p>
			<div class="flex flex-col gap-3 sm:flex-row">
				<button on:click={syncWithCalendar} class="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100">
					<Icon icon="mdi:calendar-sync-outline" class="text-lg" /> Sync with Calendar
				</button>
				<button on:click={previewPublicAgenda} class="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100">
					<Icon icon="mdi:eye-outline" class="text-lg" /> Preview Public Agenda
				</button>
			</div>
		</div>

		<!-- Public Agenda Toggle -->
		<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
			<div>
				<p class="text-sm font-medium text-gray-900">Public Agenda</p>
				<p class="text-xs text-gray-500">Allow attendees to view the agenda on the event page</p>
			</div>
			<button aria-label="Toggle public agenda" on:click={() => (isPublic = !isPublic)} class="relative h-6 w-10 rounded-full transition-colors duration-300" class:bg-gray-300={!isPublic} class:bg-gray-800={isPublic}>
				<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300" class:translate-x-4={isPublic}></span>
			</button>
		</div>

		<!-- Group By -->
		<div class="rounded-lg border border-gray-200 bg-white p-5">
			<div class="mb-4 flex items-center gap-1">
				<p class="font-medium text-gray-900">Organize Agenda By</p>
				<Icon icon="mdi:information-outline" width="14" class="text-gray-400" />
			</div>
			{#each groupByOptions as opt}
			<label class="mb-3 flex cursor-pointer items-start gap-3 last:mb-0">
				<input type="radio" bind:group={groupBy} value={opt.value} class="mt-1" />
				<div class="flex items-center gap-2">
					<Icon icon={opt.icon} class="text-lg text-gray-500" />
					<span class="text-sm text-gray-900">{opt.label}</span>
				</div>
			</label>
			{/each}
		</div>

		<!-- Display Options -->
		<div class="rounded-lg border border-gray-200 bg-white p-5">
			<p class="mb-4 font-medium text-gray-900">Display Options</p>
			<div class="space-y-4">
				<!-- Show Session Description -->
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2"><Icon icon="mdi:text-box-outline" class="text-lg text-gray-500" /><span class="text-sm text-gray-900">Show Session Descriptions</span></div>
					<button aria-label="Toggle descriptions" on:click={() => (showSessionDescription = !showSessionDescription)} class="relative h-6 w-10 rounded-full transition-colors duration-300" class:bg-gray-300={!showSessionDescription} class:bg-gray-800={showSessionDescription}>
						<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300" class:translate-x-4={showSessionDescription}></span>
					</button>
				</div>
				<!-- Show Speaker Bio -->
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2"><Icon icon="mdi:account-details-outline" class="text-lg text-gray-500" /><span class="text-sm text-gray-900">Show Speaker Bios</span></div>
					<button aria-label="Toggle speaker bios" on:click={() => (showSpeakerBio = !showSpeakerBio)} class="relative h-6 w-10 rounded-full transition-colors duration-300" class:bg-gray-300={!showSpeakerBio} class:bg-gray-800={showSpeakerBio}>
						<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300" class:translate-x-4={showSpeakerBio}></span>
					</button>
				</div>
				<!-- Show Room Capacity -->
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2"><Icon icon="mdi:account-group-outline" class="text-lg text-gray-500" /><span class="text-sm text-gray-900">Show Room Capacity</span></div>
					<button aria-label="Toggle room capacity" on:click={() => (showRoomCapacity = !showRoomCapacity)} class="relative h-6 w-10 rounded-full transition-colors duration-300" class:bg-gray-300={!showRoomCapacity} class:bg-gray-800={showRoomCapacity}>
						<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300" class:translate-x-4={showRoomCapacity}></span>
					</button>
				</div>
				<!-- Show Meeting Links -->
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2"><Icon icon="mdi:video-outline" class="text-lg text-gray-500" /><span class="text-sm text-gray-900">Show Meeting / Join Links</span></div>
					<button aria-label="Toggle meeting links" on:click={() => (showMeetingLinks = !showMeetingLinks)} class="relative h-6 w-10 rounded-full transition-colors duration-300" class:bg-gray-300={!showMeetingLinks} class:bg-gray-800={showMeetingLinks}>
						<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300" class:translate-x-4={showMeetingLinks}></span>
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
</div>
{/if}
