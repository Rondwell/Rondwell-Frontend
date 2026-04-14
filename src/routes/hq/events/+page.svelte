<script lang="ts">
	import { getAdminEvents, updateEventStatus } from '$lib/services/admin.services';
	import { onMount } from 'svelte';

	let events: any[] = [];
	let total = 0;
	let currentPage = 1;
	let totalPages = 1;
	let limit = 20;
	let loading = true;

	let searchQuery = '';
	let searchTimeout: ReturnType<typeof setTimeout>;
	let statusFilter = 'ALL';
	let sortBy = 'createdAt';
	let sortOrder: 'asc' | 'desc' = 'desc';
	let showStatusDropdown = false;
	let showSortDropdown = false;

	// Detail modal
	let showModal = false;
	let selectedEvent: any = null;
	let statusUpdating = false;

	const statusOptions = [
		{ label: 'All Events', value: 'ALL' },
		{ label: 'Live', value: 'LIVE' },
		{ label: 'Ended', value: 'ENDED' },
		{ label: 'Cancelled', value: 'CANCELLED' },
		{ label: 'Archived', value: 'ARCHIVED' },
	];

	const sortOptions = [
		{ label: 'Created Date', value: 'createdAt' },
		{ label: 'Start Date', value: 'startDateTime' },
		{ label: 'Title', value: 'title' },
		{ label: 'Status', value: 'eventStatus' },
	];

	$: selectedStatusLabel = statusOptions.find((s) => s.value === statusFilter)?.label ?? 'All Events';
	$: selectedSortLabel = sortOptions.find((s) => s.value === sortBy)?.label ?? 'Created Date';

	onMount(() => fetchEvents());

	async function fetchEvents() {
		loading = true;
		try {
			const params: Record<string, string> = { page: currentPage.toString(), limit: limit.toString(), sortBy, sortOrder };
			if (searchQuery) params.search = searchQuery;
			if (statusFilter !== 'ALL') params.status = statusFilter;
			const data = await getAdminEvents(params);
			events = data.events;
			total = data.total;
			totalPages = data.totalPages;
		} catch { events = []; }
		finally { loading = false; }
	}

	function handleSearch() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => { currentPage = 1; fetchEvents(); }, 300);
	}

	function selectStatus(value: string) { statusFilter = value; showStatusDropdown = false; currentPage = 1; fetchEvents(); }
	function selectSort(value: string) {
		if (sortBy === value) sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
		else { sortBy = value; sortOrder = 'desc'; }
		showSortDropdown = false; currentPage = 1; fetchEvents();
	}
	function goToPage(p: number) { if (p < 1 || p > totalPages) return; currentPage = p; fetchEvents(); }

	async function handleStatusChange(eventId: string, newStatus: string) {
		statusUpdating = true;
		try {
			await updateEventStatus(eventId, newStatus);
			if (selectedEvent?._id === eventId) selectedEvent.eventStatus = newStatus;
			const idx = events.findIndex((e) => e._id === eventId);
			if (idx >= 0) events[idx].eventStatus = newStatus;
			events = events;
		} catch (e) { console.error(e); }
		finally { statusUpdating = false; }
	}

	function getStatusClass(status: string): string {
		switch (status) {
			case 'LIVE': return 'bg-[#E3F4E1] text-[#3CBD2C]';
			case 'ENDED': return 'bg-[#EBECED] text-[#616265]';
			case 'CANCELLED': return 'bg-[#FDEAEA] text-[#E53935]';
			case 'ARCHIVED': return 'bg-[#FFF8E1] text-[#EAAB26]';
			default: return 'bg-[#EBECED] text-[#616265]';
		}
	}

	function formatDate(dateStr: string): string {
		if (!dateStr) return 'N/A';
		return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function timeAgo(dateStr: string): string {
		if (!dateStr) return '';
		const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / (24 * 60 * 60 * 1000));
		if (diffDays < 1) return 'Today';
		if (diffDays < 7) return `${diffDays}d ago`;
		return formatDate(dateStr);
	}
</script>

<svelte:head><title>Events | Rondwell HQ</title></svelte:head>

<div>
	<div class="mb-6">
		<h1 class="text-3xl font-semibold text-gray-900">Event Management</h1>
		<p class="mt-1 text-sm text-gray-500">View and manage all platform events</p>
	</div>

	<!-- Search -->
	<div class="relative mb-4 w-full">
		<input type="text" bind:value={searchQuery} on:input={handleSearch} placeholder="Search events..."
			class="h-[44px] w-full rounded-xl bg-white py-2 pr-4 pl-10 text-sm shadow-sm focus:ring-1 focus:ring-[#513BE2] focus:outline-none" />
		<svg class="absolute top-3 left-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
	</div>

	<!-- Filters -->
	<div class="mb-4 flex items-center justify-between">
		<div class="relative">
			<button on:click={() => { showStatusDropdown = !showStatusDropdown; showSortDropdown = false; }}
				class="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-[#616265] shadow-sm">
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
				{selectedStatusLabel}
			</button>
			{#if showStatusDropdown}
				<div class="absolute left-0 z-50 mt-2 w-44 rounded-xl border border-gray-100 bg-white p-1 shadow-lg">
					{#each statusOptions as option}
						<button on:click={() => selectStatus(option.value)}
							class="flex w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-50 {statusFilter === option.value ? 'font-medium text-[#513BE2]' : 'text-[#616265]'}">
							{option.label}
						</button>
					{/each}
				</div>
			{/if}
		</div>
		<div class="relative">
			<button on:click={() => { showSortDropdown = !showSortDropdown; showStatusDropdown = false; }}
				class="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-[#616265] shadow-sm">
				{selectedSortLabel} {sortOrder === 'asc' ? '↑' : '↓'}
			</button>
			{#if showSortDropdown}
				<div class="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-gray-100 bg-white p-1 shadow-lg">
					{#each sortOptions as option}
						<button on:click={() => selectSort(option.value)}
							class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-50 {sortBy === option.value ? 'font-medium text-[#513BE2]' : 'text-[#616265]'}">
							{option.label}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Event List -->
	{#if loading}
		<div class="rounded-xl bg-white p-4">
			{#each Array(5) as _}
				<div class="flex animate-pulse items-center justify-between border-b py-3 last:border-b-0">
					<div class="flex items-center gap-3"><div class="h-10 w-10 rounded-lg bg-gray-200"></div><div><div class="h-4 w-44 rounded bg-gray-200"></div><div class="mt-1 h-3 w-28 rounded bg-gray-200"></div></div></div>
					<div class="h-6 w-16 rounded-full bg-gray-200"></div>
				</div>
			{/each}
		</div>
	{:else if events.length > 0}
		<div class="rounded-xl bg-white">
			{#each events as event}
				<button class="flex w-full items-center justify-between border-b border-gray-50 px-4 py-3 text-left transition last:border-b-0 hover:bg-gray-50"
					on:click={() => { selectedEvent = event; showModal = true; }}>
					<div class="flex items-center gap-3">
						{#if event.displayPictureUrl || event.coverPictureUrl}
							<img src={event.displayPictureUrl || event.coverPictureUrl} alt="" class="h-10 w-10 rounded-lg object-cover" />
						{:else}
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E2E8FC] text-xs font-semibold text-[#146AEB]">
								{(event.title || '?').charAt(0).toUpperCase()}
							</div>
						{/if}
						<div>
							<p class="text-sm font-medium text-gray-800">{event.title}</p>
							<p class="text-xs text-gray-400">{event.eventOrganizerName || 'Unknown'} · {event.attendeeCount || 0} attendees</p>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<span class="rounded-full px-2.5 py-0.5 text-[10px] font-medium {getStatusClass(event.eventStatus)}">{event.eventStatus}</span>
						<span class="hidden text-xs text-gray-400 sm:block">{timeAgo(event.createdAt)}</span>
					</div>
				</button>
			{/each}
		</div>

		{#if totalPages > 1}
			<div class="mt-4 flex items-center justify-center gap-2">
				<button on:click={() => goToPage(currentPage - 1)} disabled={currentPage === 1} class="rounded-lg px-3 py-1.5 text-sm text-[#616265] transition hover:bg-white disabled:opacity-40">Previous</button>
				{#each Array(Math.min(totalPages, 5)) as _, i}
					{@const pageNum = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i}
					<button on:click={() => goToPage(pageNum)} class="h-8 w-8 rounded-lg text-sm transition {currentPage === pageNum ? 'bg-[#513BE2] text-white' : 'text-[#616265] hover:bg-white'}">{pageNum}</button>
				{/each}
				<button on:click={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} class="rounded-lg px-3 py-1.5 text-sm text-[#616265] transition hover:bg-white disabled:opacity-40">Next</button>
			</div>
		{/if}
	{:else}
		<div class="flex h-64 flex-col items-center justify-center gap-2 rounded-xl bg-white">
			<p class="text-lg font-medium text-[#646568]">No Events Found</p>
			<p class="text-sm text-gray-400">Try adjusting your search or filters</p>
		</div>
	{/if}
</div>

<!-- Event Detail Modal -->
{#if showModal && selectedEvent}
	<div on:click={() => (showModal = false)} on:keydown={(e) => e.key === 'Escape' && (showModal = false)}
		class="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-5 lg:justify-end lg:p-0 lg:pr-10"
		role="dialog" aria-modal="true" tabindex="-1">
		<div class="flex h-full w-full max-w-xl flex-col rounded-xl bg-[#F4F5F6] shadow-xl lg:max-w-lg lg:rounded-none"
			role="document" on:click|stopPropagation on:keydown|stopPropagation>
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<button on:click={() => (showModal = false)} class="text-gray-500 hover:text-gray-700">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M13 17l5-5-5-5M6 17l5-5-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
				</button>
				<span class="text-sm font-medium text-gray-500">Event Details</span>
			</div>
			<div class="flex-1 overflow-y-auto px-6 pt-5 pb-6">
				<!-- Event Header -->
				<div class="flex items-start gap-4">
					{#if selectedEvent.displayPictureUrl || selectedEvent.coverPictureUrl}
						<img src={selectedEvent.displayPictureUrl || selectedEvent.coverPictureUrl} alt="" class="h-16 w-16 rounded-xl object-cover" />
					{:else}
						<div class="flex h-16 w-16 items-center justify-center rounded-xl bg-[#E2E8FC] text-xl font-semibold text-[#146AEB]">
							{(selectedEvent.title || '?').charAt(0)}
						</div>
					{/if}
					<div>
						<h2 class="text-lg font-semibold text-gray-900">{selectedEvent.title}</h2>
						<p class="text-sm text-gray-400">{selectedEvent.eventOrganizerName || 'Unknown Organizer'}</p>
						<span class="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusClass(selectedEvent.eventStatus)}">{selectedEvent.eventStatus}</span>
					</div>
				</div>

				<!-- Details Grid -->
				<div class="mt-6 grid grid-cols-2 gap-4 border-t border-gray-200 pt-6">
					<div><p class="text-xs text-[#C1C2C2]">Type</p><p class="text-sm font-medium text-gray-800">{selectedEvent.eventType || 'N/A'}</p></div>
					<div><p class="text-xs text-[#C1C2C2]">Registration</p><p class="text-sm font-medium text-gray-800">{selectedEvent.registrationType || 'N/A'}</p></div>
					<div><p class="text-xs text-[#C1C2C2]">Visibility</p><p class="text-sm font-medium text-gray-800">{selectedEvent.visibility || 'N/A'}</p></div>
					<div><p class="text-xs text-[#C1C2C2]">Attendees</p><p class="text-sm font-medium text-gray-800">{selectedEvent.attendeeCount || 0}{selectedEvent.maxAttendees ? ` / ${selectedEvent.maxAttendees}` : ''}</p></div>
					<div><p class="text-xs text-[#C1C2C2]">Start Date</p><p class="text-sm font-medium text-gray-800">{formatDate(selectedEvent.startDateTime)}</p></div>
					<div><p class="text-xs text-[#C1C2C2]">End Date</p><p class="text-sm font-medium text-gray-800">{formatDate(selectedEvent.endDateTime)}</p></div>
					<div><p class="text-xs text-[#C1C2C2]">Category</p><p class="text-sm font-medium text-gray-800">{selectedEvent.category || 'N/A'}</p></div>
					<div><p class="text-xs text-[#C1C2C2]">Created</p><p class="text-sm font-medium text-gray-800">{formatDate(selectedEvent.createdAt)}</p></div>
				</div>

				<!-- Actions -->
				<div class="mt-6 border-t border-gray-200 pt-6">
					<h3 class="mb-3 text-sm font-semibold text-gray-700">Change Status</h3>
					<div class="flex flex-wrap gap-2">
						{#each ['LIVE', 'ENDED', 'CANCELLED', 'ARCHIVED'] as s}
							{#if selectedEvent.eventStatus !== s}
								<button on:click={() => handleStatusChange(selectedEvent._id, s)} disabled={statusUpdating}
									class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">
									{statusUpdating ? '...' : s}
								</button>
							{/if}
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
