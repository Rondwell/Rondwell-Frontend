<script lang="ts">
	import { page } from '$app/stores';
	import { createEventSession, getAllEventSessionsForEvent, getEventRooms, getEventSpeakers } from '$lib/services/event.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import AssignSpeakers from './modal/AssignSpeakers.svelte';
	import CreateEditSession from './modal/CreateEditSession.svelte';
	import SessionDropdown from './modal/SessionDropdown.svelte';
	import SessionFilter from './modal/SessionFilter.svelte';

	export let eventTitle = '';
	export let eventData: any = null;
	$: eventId = $page.params.id ?? '';

	let searchQuery = '';
	let showCreateModal = false;
	let showAssignModal = false;
	let showRoomFilter = false;
	let showSpeakerFilter = false;
	let showTypeFilter = false;
	let showActionModal: string | null = null;
	let buttonEls: Record<string, HTMLElement> = {};
	let editSession: any = null;
	let assignSession: any = null;
	let showBanner = true;

	let sessions: any[] = [];
	let rooms: any[] = [];
	let speakers: any[] = [];
	let loading = true;

	let roomFilter = 'All';
	let speakerFilter = 'All';
	let typeFilter = 'All';

	const sessionStatus: Record<string, { label: string; color: string }> = {
		TALK: { label: 'Keynote', color: 'bg-green-100 text-green-700' },
		WORKSHOP: { label: 'Workshop', color: 'bg-blue-100 text-blue-700' },
		PANEL: { label: 'Panel', color: 'bg-purple-100 text-purple-700' },
		NETWORKING: { label: 'Networking', color: 'bg-yellow-100 text-yellow-700' },
		BREAKOUT: { label: 'Breakout', color: 'bg-orange-100 text-orange-700' },
		EXHIBITION: { label: 'Exhibition', color: 'bg-pink-100 text-pink-700' },
		QNA: { label: 'Q&A', color: 'bg-indigo-100 text-indigo-700' },
	};

	async function loadSessions() {
		if (!eventId) return;
		loading = true;
		try {
			[sessions, rooms, speakers] = await Promise.all([
				getAllEventSessionsForEvent(eventId),
				getEventRooms(eventId),
				getEventSpeakers(eventId),
			]);
		} catch (e) {
			console.error('Failed to load sessions:', e);
			sessions = [];
		} finally { loading = false; }
	}

	onMount(() => { loadSessions(); });

	function getRoomName(roomId: string): string {
		const room = rooms.find(r => (r.id || r._id) === roomId);
		return room?.name || 'Unassigned';
	}

	function formatTime(dateStr: string): string {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
	}

	function formatSessionDate(dateStr: string): string {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
	}

	function getSpeakerNames(sessionSpeakers: any[]): string {
		if (!sessionSpeakers || sessionSpeakers.length === 0) return '—';
		return sessionSpeakers.map(s => s.name).join(', ');
	}

	$: filteredSessions = sessions.filter(s => {
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			const matchTitle = s.title?.toLowerCase().includes(q);
			const matchRoom = getRoomName(s.roomId).toLowerCase().includes(q);
			const matchSpeaker = (s.speakers || []).some((sp: any) => sp.name?.toLowerCase().includes(q));
			const matchTag = (s.tags || []).some((t: string) => t.toLowerCase().includes(q));
			if (!matchTitle && !matchRoom && !matchSpeaker && !matchTag) return false;
		}
		if (roomFilter !== 'All') {
			if (roomFilter === 'unassigned' && s.roomId) return false;
			if (roomFilter !== 'unassigned' && s.roomId !== roomFilter) return false;
		}
		if (speakerFilter !== 'All') {
			if (speakerFilter === 'assigned' && (!s.speakers || s.speakers.length === 0)) return false;
			if (speakerFilter === 'unassigned' && s.speakers && s.speakers.length > 0) return false;
			if (speakerFilter !== 'assigned' && speakerFilter !== 'unassigned') {
				if (!(s.speakers || []).some((sp: any) => sp.speakerProfileId === speakerFilter)) return false;
			}
		}
		if (typeFilter !== 'All' && s.type !== typeFilter) return false;
		return true;
	});

	function openCreate() { editSession = null; showCreateModal = true; }
	function openEdit(session: any) { editSession = session; showCreateModal = true; }
	function openAssign(session: any) { assignSession = session; showAssignModal = true; }

	function handleDropdownAction(e: CustomEvent) {
		const { type, session: s } = e.detail;
		if (type === 'edit') openEdit(s);
		else if (type === 'assignSpeaker') openAssign(s);
		else if (type === 'moveRoom') openEdit(s);
		else if (type === 'duplicate') duplicateSession(s);
	}

	async function duplicateSession(s: any) {
		if (!eventId) return;
		try {
			await createEventSession(eventId, s.roomId, {
				title: `${s.title} (Copy)`,
				description: s.description,
				startTime: s.startTime,
				endTime: s.endTime,
				type: s.type,
				speakers: s.speakers,
				tags: s.tags,
				isPublic: s.isPublic,
				communityChatEnabled: s.communityChatEnabled,
			});
			loadSessions();
		} catch (e: any) { alert(e.message || 'Failed to duplicate session'); }
	}

	function handleSaved() { showCreateModal = false; showAssignModal = false; loadSessions(); }
</script>

<div>
	<div class="mb-6">
		<!-- Banner -->
		{#if showBanner}
		<div class="mb-4 rounded-lg border p-4">
			<div class="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
				<div class="flex flex-col items-start gap-2 lg:flex-row lg:items-center">
					<img src="/get-ticket.svg" alt="get-ticket" />
					<p class="text-sm text-gray-600"><span class="font-medium text-black">Event Sessions.</span> Create and manage sessions that make up your event's agenda.</p>
				</div>
				<div class="flex w-full items-center gap-2 lg:w-fit">
					<button on:click={openCreate} class="flex w-full items-center justify-center gap-1 rounded-md bg-[#EBECED] px-3 py-2 text-xs font-medium text-[#616265] transition-colors hover:bg-gray-200 md:w-fit md:text-sm">Create New Session</button>
					<button on:click={() => (showBanner = false)}><Icon icon="mdi:close" class="h-4 w-4 text-gray-600" /></button>
				</div>
			</div>
		</div>
		{/if}

		<!-- Header -->
		<div class="mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
			<div>
				<h2 class="mb-1 text-xl font-semibold">Event Sessions for {eventTitle || 'Event'}</h2>
				<p class="text-sm text-[#8C8F93]">Organize your event's content by creating and scheduling sessions.</p>
			</div>
			<button on:click={openCreate} class="flex w-full items-center justify-center gap-2 rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800 sm:w-fit">
				<Icon icon="mdi:plus" class="text-xl" /> Create New Session
			</button>
		</div>

		<!-- Search and Filters -->
		<div class="mb-4 flex flex-col justify-between lg:flex-row lg:items-center">
			<div class="flex items-center gap-2 mb-4">
				<div class="relative w-full max-w-xl">
					<input type="text" bind:value={searchQuery} placeholder="Search sessions by title, speaker, room, or tag..." class="h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none" />
					<span class="absolute top-2.5 left-3 text-gray-400"><img src="/search-favorite.png" alt="search icon" class="h-5 w-5" /></span>
				</div>
				<div class="flex items-center gap-1 md:hidden">
					<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]"><img src="/download-icon.svg" alt="download icon" /></div>
					<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]"><img src="/export.svg" alt="export icon" /></div>
				</div>
			</div>
			<div class="flex items-center gap-1">
				<div class="hidden items-center gap-1 md:flex">
					<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]"><img src="/download-icon.svg" alt="download icon" /></div>
					<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]"><img src="/export.svg" alt="export icon" /></div>
				</div>
				<div use:clickOutside={() => (showRoomFilter = false)} class="relative">
					<button on:click={() => (showRoomFilter = !showRoomFilter)} class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" /> Room
					</button>
					<SessionFilter bind:open={showRoomFilter} type="room" {rooms} {speakers} on:select={(e) => { roomFilter = e.detail; showRoomFilter = false; }} />
				</div>
				<div use:clickOutside={() => (showSpeakerFilter = false)} class="relative">
					<button on:click={() => (showSpeakerFilter = !showSpeakerFilter)} class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" /> Speakers
					</button>
					<SessionFilter bind:open={showSpeakerFilter} type="speakers" {rooms} {speakers} on:select={(e) => { speakerFilter = e.detail; showSpeakerFilter = false; }} />
				</div>
				<div use:clickOutside={() => (showTypeFilter = false)} class="relative">
					<button on:click={() => (showTypeFilter = !showTypeFilter)} class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" /> Session Type
					</button>
					<SessionFilter bind:open={showTypeFilter} type="sessionType" {rooms} {speakers} on:select={(e) => { typeFilter = e.detail; showTypeFilter = false; }} />
				</div>
			</div>
		</div>

		<!-- Sessions List -->
		{#if loading}
		<div class="overflow-hidden rounded-xl bg-white shadow-sm">
			{#each [1, 2, 3] as _}
			<div class="flex animate-pulse items-center gap-4 border-b px-4 py-4 last:border-none">
				<div class="h-7 w-7 rounded bg-gray-200"></div>
				<div class="h-4 w-32 rounded bg-gray-200"></div>
				<div class="h-4 w-24 rounded bg-gray-200"></div>
				<div class="h-4 w-36 rounded bg-gray-200"></div>
				<div class="h-4 w-20 rounded bg-gray-200"></div>
			</div>
			{/each}
		</div>
		{:else if filteredSessions.length > 0}
		<div class="overflow-visible rounded-xl bg-white shadow-sm">
			{#each filteredSessions as s}
			{@const status = sessionStatus[s.type] || { label: s.type, color: 'bg-gray-100 text-gray-700' }}
			<div class="flex flex-col justify-between gap-3 border-b px-4 py-3 last:border-none lg:flex-row lg:items-center">
				<!-- Icon + Title -->
				<div class="flex items-center gap-3 lg:w-48">
					<img src="/calendar.svg" alt="" class="h-7 w-7" />
					<button on:click={() => openEdit(s)} class="text-left font-medium hover:underline">{s.title}</button>
				</div>
				<!-- Room -->
				<div class="w-36 text-gray-500">{getRoomName(s.roomId)}</div>
				<!-- Time -->
				<div class="flex items-center justify-between gap-3">
					<div class="w-44 text-gray-500">{formatTime(s.startTime)} – {formatTime(s.endTime)}</div>
					<div class="w-32 text-gray-500">{formatSessionDate(s.startTime)}</div>
				</div>
				<!-- Speakers -->
				<div class="hidden w-32 truncate text-sm text-gray-500 xl:block" title={getSpeakerNames(s.speakers)}>{getSpeakerNames(s.speakers)}</div>
				<!-- Status + Actions -->
				<div class="flex items-center justify-between gap-3">
					<span class="rounded-full px-2 py-1 text-xs font-medium {status.color}">{status.label}</span>
					<div class="relative" use:clickOutside={() => { if (showActionModal === s.id) showActionModal = null; }}>
						<button bind:this={buttonEls[s.id]} on:click={() => (showActionModal = showActionModal === s.id ? null : s.id)} class="ml-4 text-gray-400 hover:text-gray-600">
							<Icon icon="mdi:dots-horizontal" class="h-5 w-5 text-gray-500" />
						</button>
						<SessionDropdown open={showActionModal === s.id} buttonEl={buttonEls[s.id]} session={s} {eventId} on:action={handleDropdownAction} on:updated={() => { showActionModal = null; loadSessions(); }} />
					</div>
				</div>
			</div>
			{/each}
		</div>
		{:else}
		<div class="flex h-70 flex-col items-center justify-center">
			<img src="/planning.svg" alt="" class="h-40" />
			<p class="mt-2 text-lg font-medium text-[#A2ACB2]">No Sessions added, yet</p>
			<p class="mt-1 text-sm text-gray-400">Sessions will display when they are added</p>
		</div>
		{/if}
	</div>
</div>

<CreateEditSession bind:open={showCreateModal} {eventId} {eventData} session={editSession} on:saved={handleSaved} />
<AssignSpeakers bind:open={showAssignModal} {eventId} session={assignSession} on:saved={handleSaved} />
