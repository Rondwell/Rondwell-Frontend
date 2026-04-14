<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getEventAttendeesPaginated, getEventDays, getTicketTypes } from '$lib/services/event.services';
	import { getEventCache } from '$lib/stores/eventCache.store';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import CheckedInAttendeeModal from './components/CheckedInAttendeeModal.svelte';
	import ScanAttendeeModal from './components/ScanAttendeeModal.svelte';

	$: eventId = $page.params.id ?? '';

	$: ({ event: eventStore, loading: eventLoading } = getEventCache(eventId));
	$: rawEvent = $eventStore;
	$: isMultiDay = rawEvent?.isMultiDay || false;

	let searchQuery = '';
	let searchTimeout: ReturnType<typeof setTimeout>;
	let showModal = false;
	let showScanModal = false;
	let selectedAttendeeId = '';
	let selectedAttendeeData: any = null;

	let checkedInAttendees: any[] = [];
	let loading = true;
	let totalCheckedIn = 0;
	let currentPage = 1;
	let totalPages = 1;

	// Filter/sort
	let ticketFilter = '';
	let sortBy = 'updatedAt';
	let sortOrder: 'desc' | 'asc' = 'desc';
	let showTicketDropdown = false;
	let showSortDropdown = false;

	// Ticket types for filter
	let ticketTypes: any[] = [];

	// Multi-day support
	let eventDays: any[] = [];
	let selectedDayId = '';
	let showDayDropdown = false;

	const sortOptions = [
		{ label: 'Check-in Time', value: 'updatedAt' },
		{ label: 'Name', value: 'firstName' },
		{ label: 'Email', value: 'email' }
	];

	onMount(() => {
		fetchCheckedIn();
		loadTicketTypes();
		if (isMultiDay) {
			getEventDays(eventId).then((days) => { eventDays = days; }).catch(() => {});
		}
	});

	async function fetchCheckedIn() {
		loading = true;
		try {
			const result = await getEventAttendeesPaginated(eventId, {
				page: currentPage,
				limit: 20,
				search: searchQuery || undefined,
				attendeeStatus: 'CHECKED_IN',
				ticketTypeId: ticketFilter || undefined,
				sortBy,
				sortOrder
			});
			checkedInAttendees = result.attendees;
			totalCheckedIn = result.total;
			totalPages = result.totalPages;
		} catch { checkedInAttendees = []; totalCheckedIn = 0; }
		finally { loading = false; }
	}

	async function loadTicketTypes() {
		try { ticketTypes = await getTicketTypes(eventId); } catch { ticketTypes = []; }
	}

	function selectTicketFilter(id: string) {
		ticketFilter = id;
		showTicketDropdown = false;
		currentPage = 1;
		fetchCheckedIn();
	}

	function handleSearch() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => { currentPage = 1; fetchCheckedIn(); }, 300);
	}

	function selectSort(value: string) {
		if (sortBy === value) { sortOrder = sortOrder === 'desc' ? 'asc' : 'desc'; }
		else { sortBy = value; sortOrder = 'desc'; }
		showSortDropdown = false;
		currentPage = 1;
		fetchCheckedIn();
	}

	function getDisplayName(a: any): string {
		if (a.firstName || a.lastName) return `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim();
		return a.email?.split('@')[0] ?? 'Anonymous';
	}

	function timeAgo(dateStr: string): string {
		if (!dateStr) return '';
		const now = new Date();
		const date = new Date(dateStr);
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		if (diffMins < 1) return 'this minute';
		if (diffMins < 60) return `${diffMins}m ago`;
		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `${diffHours} hours ago`;
		const diffDays = Math.floor(diffHours / 24);
		return `${diffDays} days ago`;
	}

	function handleCheckinSuccess() {
		// Refresh the list after a successful check-in
		fetchCheckedIn();
	}

	$: eventTitle = rawEvent?.title ?? 'Event';
	$: eventStartLabel = rawEvent?.startDateTime
		? (() => {
			const d = new Date(rawEvent.startDateTime);
			const now = new Date();
			const diffMs = d.getTime() - now.getTime();
			const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
			if (diffDays > 0) return `Starting in ${diffDays} Day${diffDays > 1 ? 's' : ''}`;
			if (diffDays === 0) return 'Starting Today';
			return 'Event Started';
		})()
		: '';
	$: selectedSortLabel = sortOptions.find(s => s.value === sortBy)?.label ?? 'Check-in Time';
	$: selectedTicketLabel = ticketFilter
		? ticketTypes.find(t => (t._id || t.id) === ticketFilter)?.name ?? 'Ticket'
		: 'All Attendees';
</script>

<div class="max-w-6xl">
	<!-- Back Button and Event Info -->
	<div class="mb-6 flex items-center gap-3">
		<button on:click={() => goto(`/events/${eventId}/attendees`)}
			class="flex items-center gap-2 text-gray-600 hover:text-gray-800">
			<div class="flex h-[29px] w-[29px] items-center justify-center rounded-full bg-[#D8D8DD]">
				<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M9.2793 9.60352C8.62129 10.2457 7.66873 10.3899 6.85156 9.95801L1.31152 7.04199H1.3125C0.625893 6.68284 0.198242 5.97506 0.198242 5.19922C0.198273 4.42347 0.626009 3.71658 1.3125 3.35742L6.85156 0.442383L6.85059 0.441406C7.16604 0.273212 7.49893 0.19339 7.83203 0.193359C8.36285 0.193359 8.87545 0.401565 9.2793 0.794922C9.93827 1.43808 10.0974 2.39081 9.68652 3.21289L8.91211 4.76172C8.77777 5.0304 8.77707 5.35686 8.91211 5.63184L9.68652 7.18555C10.0975 8.00765 9.93828 8.96033 9.2793 9.60352Z" fill="#8E8E90" stroke="#8E8E90" stroke-width="0.394617"/><rect x="5.09957" y="4.60738" width="3.34009" height="1.13098" rx="0.565492" fill="#919091" stroke="#8E8E90" stroke-width="0.394617"/></svg>
			</div>
		</button>
		<img src="/Title-icon.svg" alt="title icon" class="h-12 w-12" />
		<div>
			{#if $eventLoading}
				<div class="h-5 w-40 animate-pulse rounded bg-gray-200"></div>
				<div class="mt-1 h-4 w-28 animate-pulse rounded bg-gray-200"></div>
			{:else}
				<h1 class="text-xl font-semibold">{eventTitle}</h1>
				<p class="text-sm text-gray-500">{eventStartLabel}</p>
			{/if}
		</div>
	</div>

	<!-- Scan Attendee Button -->
	<div class="mb-6">
		<button on:click={() => (showScanModal = true)}
			class="flex w-full items-center gap-2 rounded-[12.75px] bg-[#FDFDFD] p-2 text-sm font-medium shadow-sm sm:min-w-70 md:w-fit">
			<div class="flex h-[44px] w-[44px] items-center justify-center rounded-sm bg-[#E3F4E1]">
				<svg width="27" height="27" viewBox="0 0 27 27" fill="none"><path opacity="0.4" d="M20.398 2.1875H18.322C15.9401 2.1875 14.6836 3.444 14.6836 5.8259V7.90186C14.6836 10.2838 15.9401 11.5403 18.322 11.5403H20.398C22.7798 11.5403 24.0364 10.2838 24.0364 7.90186V5.8259C24.0364 3.444 22.7798 2.1875 20.398 2.1875Z" fill="#3CBD2C"/><path opacity="0.4" d="M7.90888 14.6719H5.83292C3.4401 14.6719 2.18359 15.9284 2.18359 18.3103V20.3862C2.18359 22.7791 3.4401 24.0356 5.82199 24.0356H7.89795C10.2798 24.0356 11.5364 22.7791 11.5364 20.3972V18.3212C11.5473 15.9284 10.2908 14.6719 7.90888 14.6719Z" fill="#3CBD2C"/><path d="M6.8709 11.5621C9.45963 11.5621 11.5582 9.46353 11.5582 6.8748C11.5582 4.28608 9.45963 2.1875 6.8709 2.1875C4.28217 2.1875 2.18359 4.28608 2.18359 6.8748C2.18359 9.46353 4.28217 11.5621 6.8709 11.5621Z" fill="#3CBD2C"/><path d="M19.3494 24.0387C21.9381 24.0387 24.0367 21.9401 24.0367 19.3514C24.0367 16.7626 21.9381 14.6641 19.3494 14.6641C16.7607 14.6641 14.6621 16.7626 14.6621 19.3514C14.6621 21.9401 16.7607 24.0387 19.3494 24.0387Z" fill="#3CBD2C"/></svg>
			</div>
			Scan Attendee
		</button>
	</div>

	<!-- Attendee Checked-in List Section -->
	<div class="mb-12 border-t pt-6">
		<div class="mb-4 flex items-center justify-between gap-1">
			<h1 class="text-xl font-semibold">Attendee Checked-in List</h1>
			<div class="flex items-center gap-1">
				<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]">
					<img src="/download-icon.svg" alt="download icon" />
				</div>
				<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]">
					<img src="/export.svg" alt="export icon" />
				</div>
			</div>
		</div>

		<!-- Search -->
		<div class="relative mb-4 w-full">
			<input type="text" bind:value={searchQuery} on:input={handleSearch} placeholder="Search"
				class="h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none" />
			<span class="absolute top-2.5 left-3 text-gray-400">
				<img src="/search-favorite.svg" alt="search icon" class="h-5 w-5" />
			</span>
		</div>

		<!-- Filters -->
		<div class="mb-3 flex flex-wrap items-center gap-2 justify-between">
			<!-- Day Filter (Multi-Day Events) -->
			{#if isMultiDay && eventDays.length > 0}
			<div class="relative" use:clickOutside={() => { showDayDropdown = false; }}>
				<button on:click={() => (showDayDropdown = !showDayDropdown)}
					class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
					<Icon icon="mdi:calendar-multiple" class="text-base" />
					{selectedDayId ? (eventDays.find((d) => (d._id || d.id) === selectedDayId)?.label || 'Day') : 'All Days'}
					<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
				</button>
				{#if showDayDropdown}
					<div class="absolute left-0 z-50 mt-2 w-52 rounded-xl border border-white/20 bg-white/70 p-1 shadow-xl backdrop-blur-xl">
						<button on:click={() => { selectedDayId = ''; showDayDropdown = false; }}
							class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/50 {!selectedDayId ? 'font-medium text-[#7C3AED]' : 'text-[#616265]'}">
							All Days
							{#if !selectedDayId}<span class="text-xs text-[#7C3AED]">✓</span>{/if}
						</button>
						{#each eventDays as day}
							{@const dayId = day._id || day.id}
							<button on:click={() => { selectedDayId = dayId; showDayDropdown = false; }}
								class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/50 {selectedDayId === dayId ? 'font-medium text-[#7C3AED]' : 'text-[#616265]'}">
								{day.label || `Day ${day.dayNumber}`} — {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
								{#if selectedDayId === dayId}<span class="text-xs text-[#7C3AED]">✓</span>{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>
			{/if}

			<div class="relative" use:clickOutside={() => { showTicketDropdown = false; }}>
				<button on:click={() => (showTicketDropdown = !showTicketDropdown)}
					class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
					<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
					{selectedTicketLabel}
					<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
				</button>
				{#if showTicketDropdown}
					<div class="absolute left-0 z-50 mt-2 w-52 rounded-xl border border-white/20 bg-white/70 p-1 shadow-xl backdrop-blur-xl">
						<button on:click={() => selectTicketFilter('')}
							class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/50 {!ticketFilter ? 'font-medium text-[#7C3AED]' : 'text-[#616265]'}">
							All Attendees
							{#if !ticketFilter}<span class="text-xs text-[#7C3AED]">✓</span>{/if}
						</button>
						{#each ticketTypes as ticket}
							{@const tid = ticket._id || ticket.id}
							<button on:click={() => selectTicketFilter(tid)}
								class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/50 {ticketFilter === tid ? 'font-medium text-[#7C3AED]' : 'text-[#616265]'}">
								{ticket.name}
								{#if ticketFilter === tid}<span class="text-xs text-[#7C3AED]">✓</span>{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>
			<div class="relative" use:clickOutside={() => { showSortDropdown = false; }}>
				<button on:click={() => (showSortDropdown = !showSortDropdown)}
					class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
					<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
					{selectedSortLabel}
					<span class="text-[10px]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
					<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
				</button>
				{#if showSortDropdown}
					<div class="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-white/20 bg-white/70 p-1 shadow-xl backdrop-blur-xl">
						{#each sortOptions as option}
							<button on:click={() => selectSort(option.value)}
								class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/50 {sortBy === option.value ? 'font-medium text-[#7C3AED]' : 'text-[#616265]'}">
								{option.label}
								{#if sortBy === option.value}<span class="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Table Content -->
		{#if loading}
			<div class="flex flex-col rounded-md bg-[#FDFDFD] px-3">
				{#each Array(5) as _}
					<div class="flex animate-pulse items-center justify-between border-b py-3 last:border-b-0">
						<div class="flex items-center gap-2">
							<div class="h-6 w-6 rounded-full bg-gray-200"></div>
							<div class="flex flex-col gap-1">
								<div class="h-4 w-32 rounded bg-gray-200"></div>
								<div class="h-3 w-44 rounded bg-gray-200"></div>
							</div>
						</div>
						<div class="flex items-center gap-4">
							<div class="h-6 w-20 rounded-full bg-gray-200"></div>
							<div class="h-3 w-24 rounded bg-gray-200"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if checkedInAttendees.length > 0}
			<div use:clickOutside={() => (showModal = false)}>
				<div class="flex flex-col rounded-md bg-[#FDFDFD] px-3">
					{#each checkedInAttendees as attendee}
						<button
							class="flex items-center justify-between rounded-md border-b py-3 last:border-b-0"
							on:click={() => { selectedAttendeeId = attendee._id || attendee.id; selectedAttendeeData = attendee; showModal = true; }}>
							<div class="flex items-start gap-2">
								<img src={attendee.profilePictureUrl || '/rondwell-attendee.png'} alt="" class="h-6 w-6 rounded-full object-cover"
									on:error={(e) => { (e.currentTarget as HTMLImageElement).src = '/rondwell-attendee.png'; }} />
								<div class="flex flex-col items-start gap-1">
									<p class="font-medium">{getDisplayName(attendee)}</p>
									<p class="text-xs text-gray-500">{attendee.email}</p>
								</div>
							</div>
							<div class="flex flex-col items-end gap-1 lg:flex-row lg:items-center lg:gap-4">
								<div class="flex items-center justify-center rounded-full px-2 py-1 text-xs
									{attendee.attendeeStatus === 'CHECKED_IN' ? 'bg-[#E3F4E1] text-[#3CBD2C]' : 'bg-[#EBECED] text-[#616265]'}">
									{attendee.attendeeStatus === 'CHECKED_IN' ? 'Checked-In' : attendee.attendeeStatus}
								</div>
								<div class="text-xs text-gray-500">{timeAgo(attendee.updatedAt || attendee.createdAt)}</div>
							</div>
						</button>
					{/each}
				</div>
				<CheckedInAttendeeModal bind:open={showModal} attendeeId={selectedAttendeeId} {eventId} attendeeData={selectedAttendeeData} on:undone={fetchCheckedIn} />
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="mt-4 flex items-center justify-center gap-2">
					<button on:click={() => { currentPage--; fetchCheckedIn(); }} disabled={currentPage === 1}
						class="rounded-md px-3 py-1 text-sm text-[#616265] transition-colors hover:bg-[#EBECED] disabled:opacity-40">Previous</button>
					<span class="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
					<button on:click={() => { currentPage++; fetchCheckedIn(); }} disabled={currentPage === totalPages}
						class="rounded-md px-3 py-1 text-sm text-[#616265] transition-colors hover:bg-[#EBECED] disabled:opacity-40">Next</button>
				</div>
			{/if}
		{:else}
			<div class="flex h-50 flex-col items-center justify-center">
				<img src="/profile-2user.svg" alt="" />
				<p class="text-[#646568]">No Checked-in Attendees</p>
				<p class="text-sm text-gray-500">Scan attendees to check them in</p>
			</div>
		{/if}
	</div>
</div>

<ScanAttendeeModal bind:open={showScanModal} {eventId} on:checkedIn={handleCheckinSuccess} />
