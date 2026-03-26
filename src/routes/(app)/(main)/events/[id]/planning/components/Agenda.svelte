<script lang="ts">
	import { page } from '$app/stores';
	import { getEventAgenda, getEventById, getEventRooms } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import CustomizeAgenda from './modal/CustomizeAgenda.svelte';

	export let eventTitle = '';
	$: eventId = $page.params.id ?? '';

	let agendaData: any = null;
	let rooms: any[] = [];
	let loading = true;
	let showCustomizeModal = false;
	let agendaSettings: any = {};

	let expandedDates: Record<string, boolean> = {};

	async function loadAgenda() {
		if (!eventId) return;
		loading = true;
		try {
			const [agenda, roomList, event] = await Promise.all([
				getEventAgenda(eventId),
				getEventRooms(eventId),
				getEventById(eventId),
			]);
			agendaData = agenda;
			rooms = roomList;
			agendaSettings = event?.agendaSettings || {};
			if (agenda?.dates?.length > 0) {
				expandedDates[agenda.dates[0].date] = true;
			}
		} catch (e) {
			console.error('Failed to load agenda:', e);
			agendaData = { dates: [], sessions: [], totalSessions: 0 };
		} finally { loading = false; }
	}

	onMount(() => { loadAgenda(); });

	function toggleDate(date: string) {
		expandedDates[date] = !expandedDates[date];
		expandedDates = { ...expandedDates };
	}

	function getRoomName(roomId: string): string {
		return rooms.find(r => (r.id || r._id) === roomId)?.name || 'No Room';
	}

	function formatTime(dateStr: string): string {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
	}

	function formatDateLabel(dateStr: string): string {
		const d = new Date(dateStr + 'T00:00:00');
		return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
	}

	function getSessionTypeColor(type: string): string {
		const map: Record<string, string> = {
			TALK: 'bg-green-100 text-green-700', WORKSHOP: 'bg-blue-100 text-blue-700',
			PANEL: 'bg-purple-100 text-purple-700', NETWORKING: 'bg-yellow-100 text-yellow-700',
			BREAKOUT: 'bg-orange-100 text-orange-700', EXHIBITION: 'bg-pink-100 text-pink-700',
			QNA: 'bg-indigo-100 text-indigo-700',
		};
		return map[type] || 'bg-gray-100 text-gray-700';
	}

	function getTypeLabel(type: string): string {
		const map: Record<string, string> = { TALK: 'Keynote', WORKSHOP: 'Workshop', PANEL: 'Panel', NETWORKING: 'Networking', BREAKOUT: 'Breakout', EXHIBITION: 'Exhibition', QNA: 'Q&A' };
		return map[type] || type;
	}

	$: showDescription = agendaSettings?.showSessionDescription ?? true;
	$: showCapacity = agendaSettings?.showRoomCapacity ?? false;
	$: showMeetingLinks = agendaSettings?.showMeetingLinks ?? true;

	function handleSettingsSaved() { showCustomizeModal = false; loadAgenda(); }
</script>

<div>
	<!-- Header -->
	<div class="mb-6 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
		<div>
			<h1 class="text-2xl font-semibold">Event Agenda for {eventTitle || 'Event'}</h1>
			<p class="text-sm text-gray-500">Configure how your event's sessions and rooms are displayed to attendees</p>
		</div>
		<button on:click={() => (showCustomizeModal = true)} class="flex items-center justify-center gap-2 rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800 sm:w-fit">
			<Icon icon="mdi:tune-variant" class="text-xl" /> Customize Agenda
		</button>
	</div>

	<!-- Agenda Title -->
	<div class="mb-4 flex items-center gap-2">
		<img src="/calendar.svg" alt="" class="h-7 w-7" />
		<h2 class="text-xl font-semibold">Event Agenda for {eventTitle || 'Event'}</h2>
		{#if agendaData?.totalSessions}
		<span class="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">{agendaData.totalSessions} sessions</span>
		{/if}
	</div>

	<!-- Agenda Content -->
	{#if loading}
	<div class="space-y-4">
		{#each [1, 2] as _}
		<div class="animate-pulse rounded-2xl border bg-white p-6">
			<div class="mb-4 h-6 w-40 rounded bg-gray-200"></div>
			<div class="space-y-3"><div class="h-20 rounded-xl bg-gray-100"></div><div class="h-20 rounded-xl bg-gray-100"></div></div>
		</div>
		{/each}
	</div>
	{:else if agendaData?.dates?.length > 0}
	<div class="flex flex-col gap-4">
		{#each agendaData.dates as group}
		<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white">
			<!-- Date Header -->
			<button on:click={() => toggleDate(group.date)} class="flex w-full items-center justify-between bg-gray-50 px-5 py-4 text-left transition-colors hover:bg-gray-100">
				<div class="flex items-center gap-2">
					<Icon icon="mdi:calendar-outline" class="text-lg text-gray-600" />
					<span class="font-semibold text-gray-900">{formatDateLabel(group.date)}</span>
					<span class="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">{group.sessions.length} sessions</span>
				</div>
				<Icon icon="mdi:chevron-down" class="text-xl text-gray-400 transition-transform duration-200 {expandedDates[group.date] ? 'rotate-180' : ''}" />
			</button>

			{#if expandedDates[group.date]}
			<div class="flex flex-col gap-3 p-4">
				{#each group.sessions as session}
				<div class="flex flex-col gap-3 rounded-xl border border-gray-100 bg-[#FAFAFA] p-4 sm:flex-row sm:gap-5">
					<div class="min-w-[140px] flex-shrink-0">
						<span class="text-xs font-medium text-gray-500">{formatTime(session.startTime)} – {formatTime(session.endTime)}</span>
					</div>
					<div class="flex flex-1 flex-col gap-2">
						<div class="flex flex-wrap items-center gap-2">
							<h3 class="text-sm font-semibold text-gray-900">{session.title}</h3>
							{#if session.type}<span class="rounded-full px-2 py-0.5 text-xs font-medium {getSessionTypeColor(session.type)}">{getTypeLabel(session.type)}</span>{/if}
						</div>
						{#if showDescription && session.description}<p class="text-xs text-gray-500">{session.description}</p>{/if}
						<div class="flex flex-wrap items-center gap-3 text-xs text-gray-500">
							<span class="flex items-center gap-1"><Icon icon="mdi:map-marker-outline" class="text-sm" /> {getRoomName(session.roomId)}</span>
							{#if showCapacity && session.capacity}<span class="flex items-center gap-1"><Icon icon="mdi:account-group-outline" class="text-sm" /> {session.capacity} capacity</span>{/if}
						</div>
						{#if session.speakers?.length > 0}
						<div class="mt-1 flex flex-col gap-2 rounded-lg bg-gray-100 p-3">
							{#each session.speakers as speaker}
							<div class="flex flex-wrap items-center gap-2">
								<div class="flex h-7 w-7 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-gray-700">{speaker.name?.charAt(0) || '?'}</div>
								<span class="text-xs font-medium text-gray-900">{speaker.name}</span>
								{#if speaker.isLeadSpeaker}<span class="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Lead</span>{/if}
							</div>
							{/each}
						</div>
						{/if}
						{#if showMeetingLinks && session.meetingLink}
						<div class="mt-1 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
							<div class="flex items-center gap-2 text-xs text-gray-500"><Icon icon="mdi:video-outline" class="text-sm" /><span class="truncate">{session.meetingLink}</span></div>
							<a href={session.meetingLink} target="_blank" rel="noopener noreferrer" class="flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-xs text-white">Join <span class="rounded bg-red-500 px-1.5 py-0.5 text-[10px]">Live</span></a>
						</div>
						{/if}
					</div>
				</div>
				{/each}
			</div>
			{/if}
		</div>
		{/each}
	</div>
	{:else}
	<div class="flex h-70 flex-col items-center justify-center">
		<img src="/planning.svg" alt="" class="h-40" />
		<p class="mt-2 text-lg font-medium text-[#A2ACB2]">No agenda available yet</p>
		<p class="mt-1 text-sm text-gray-400">Create sessions and assign them to rooms to build your agenda</p>
	</div>
	{/if}
</div>

<CustomizeAgenda bind:open={showCustomizeModal} {eventId} {eventTitle} on:saved={handleSettingsSaved} />
