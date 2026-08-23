<script lang="ts">
	import {
		getAdminEvents,
		updateEventStatus,
		getAdminEventStats,
		getAdminEventRegistrations,
		getAdminEventGroups
	} from '$lib/services/admin.services';
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

	// ── Event Details panel: tabs + lazily-loaded data ──────────────────────
	type DetailTab = 'overview' | 'registrations' | 'groups' | 'tickets';
	let detailTab: DetailTab = 'overview';

	let stats: any = null;
	let statsLoading = false;
	let statsError = '';

	let regs: any[] = [];
	let regsTotal = 0;
	let regsPage = 1;
	let regsTotalPages = 1;
	let regsLoading = false;
	let regSearch = '';
	let regSearchTimeout: ReturnType<typeof setTimeout>;
	let regStatusFilter = 'ALL';
	let regPaymentFilter = 'ALL';
	let regTypeFilter = 'ALL';

	let groups: any[] = [];
	let groupsTotal = 0;
	let groupsPage = 1;
	let groupsTotalPages = 1;
	let groupsLoading = false;
	let groupsStatusFilter = 'ALL';
	let expandedGroup = '';

	const regStatusOptions = ['ALL', 'ATTENDING', 'CHECKED_IN', 'PENDING', 'UNAPPROVED', 'WAITLISTED', 'DECLINED', 'UNREGISTERED'];
	const regPaymentOptions = ['ALL', 'COMPLETED', 'PENDING', 'REFUNDED'];
	const regTypeOptions = [
		{ label: 'All types', value: 'ALL' },
		{ label: 'Individual', value: 'single' },
		{ label: 'Group leads', value: 'group_lead' },
		{ label: 'Group members', value: 'group_member' }
	];
	const groupStatusOptions = ['ALL', 'ACTIVE', 'PENDING_PAYMENT', 'EXPIRED', 'CANCELLED', 'REFUNDED'];

	function openEvent(ev: any) {
		selectedEvent = ev;
		showModal = true;
		detailTab = 'overview';
		stats = null;
		statsError = '';
		regs = [];
		regsPage = 1;
		regSearch = '';
		regStatusFilter = 'ALL';
		regPaymentFilter = 'ALL';
		regTypeFilter = 'ALL';
		groups = [];
		groupsPage = 1;
		groupsStatusFilter = 'ALL';
		expandedGroup = '';
		loadStats();
	}

	async function loadStats() {
		if (!selectedEvent?._id) return;
		statsLoading = true;
		statsError = '';
		try {
			stats = await getAdminEventStats(selectedEvent._id);
		} catch (e: any) {
			statsError = e?.message ?? 'Could not load event statistics';
		} finally {
			statsLoading = false;
		}
	}

	async function loadRegistrations() {
		if (!selectedEvent?._id) return;
		regsLoading = true;
		try {
			const data = await getAdminEventRegistrations(selectedEvent._id, {
				page: regsPage,
				limit: 25,
				status: regStatusFilter,
				paymentStatus: regPaymentFilter,
				type: regTypeFilter === 'ALL' ? '' : regTypeFilter,
				search: regSearch
			});
			regs = data.registrations ?? [];
			regsTotal = data.total ?? 0;
			regsTotalPages = data.totalPages ?? 1;
		} catch {
			regs = [];
		} finally {
			regsLoading = false;
		}
	}

	async function loadGroups() {
		if (!selectedEvent?._id) return;
		groupsLoading = true;
		try {
			const data = await getAdminEventGroups(selectedEvent._id, {
				page: groupsPage,
				limit: 20,
				status: groupsStatusFilter
			});
			groups = data.groups ?? [];
			groupsTotal = data.total ?? 0;
			groupsTotalPages = data.totalPages ?? 1;
		} catch {
			groups = [];
		} finally {
			groupsLoading = false;
		}
	}

	function selectDetailTab(tab: DetailTab) {
		detailTab = tab;
		if (tab === 'registrations' && regs.length === 0 && !regsLoading) loadRegistrations();
		if (tab === 'groups' && groups.length === 0 && !groupsLoading) loadGroups();
	}

	function handleRegSearch() {
		clearTimeout(regSearchTimeout);
		regSearchTimeout = setTimeout(() => { regsPage = 1; loadRegistrations(); }, 300);
	}

	function applyRegFilter() { regsPage = 1; loadRegistrations(); }
	function applyGroupFilter() { groupsPage = 1; loadGroups(); }

	function regStatusClass(status: string): string {
		switch (status) {
			case 'ATTENDING':
			case 'CHECKED_IN': return 'bg-[#E3F4E1] text-[#3CBD2C]';
			case 'PENDING': return 'bg-[#FFF8E1] text-[#EAAB26]';
			case 'UNAPPROVED': return 'bg-[#E2E8FC] text-[#146AEB]';
			case 'WAITLISTED': return 'bg-[#F3E8FF] text-[#7C3AED]';
			case 'DECLINED':
			case 'UNREGISTERED': return 'bg-[#FDEAEA] text-[#E53935]';
			default: return 'bg-[#EBECED] text-[#616265]';
		}
	}

	function groupStatusClass(status: string): string {
		switch (status) {
			case 'ACTIVE': return 'bg-[#E3F4E1] text-[#3CBD2C]';
			case 'PENDING_PAYMENT': return 'bg-[#FFF8E1] text-[#EAAB26]';
			case 'EXPIRED': return 'bg-[#EBECED] text-[#616265]';
			case 'CANCELLED':
			case 'REFUNDED': return 'bg-[#FDEAEA] text-[#E53935]';
			default: return 'bg-[#EBECED] text-[#616265]';
		}
	}

	function memberStatusClass(status: string): string {
		switch (status) {
			case 'CONFIRMED': return 'bg-[#E3F4E1] text-[#3CBD2C]';
			case 'INVITED': return 'bg-[#FFF8E1] text-[#EAAB26]';
			case 'DECLINED': return 'bg-[#FDEAEA] text-[#E53935]';
			case 'CANCELLED': return 'bg-[#EBECED] text-[#616265]';
			default: return 'bg-[#EBECED] text-[#616265]';
		}
	}

	function money(amount: number, currency = 'NGN'): string {
		return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount || 0);
	}

	function formatDateTime(dateStr: string): string {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleString('en-US', {
			month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
		});
	}

	function fullName(details: any): string {
		return [details?.firstName, details?.lastName].filter(Boolean).join(' ') || '—';
	}

	/** Non-zero integrity numbers, in display order, for the alert strip. */
	$: integrityIssues = stats?.integrity
		? [
				{ key: 'paidButNotFinalized', label: 'Paid but not finalized', value: stats.integrity.paidButNotFinalized,
					hint: 'Registrations whose payment completed but which never became attending. Usually a settlement that never reached the event service.' },
				{ key: 'registrationsWithoutAttendee', label: 'Missing attendee records', value: stats.integrity.registrationsWithoutAttendee,
					hint: 'Attending registrations with no attendee row — they will be missing from attendee counts and check-in.' },
				{ key: 'groupHoldsPastExpiry', label: 'Group holds past expiry', value: stats.integrity.groupHoldsPastExpiry,
					hint: 'Unpaid group reservations still holding ticket inventory. The expiry sweep should clear these within 5 minutes.' },
				{ key: 'unconfirmedGroupSeats', label: 'Unconfirmed group seats', value: stats.integrity.unconfirmedGroupSeats,
					hint: 'Paid group seats whose holder has not completed their profile yet. These still count as registrations.' }
			].filter((i) => Number(i.value) > 0)
		: [];

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
				<button class="flex w-full items-center gap-2 border-b border-gray-50 px-4 py-3 text-left transition last:border-b-0 hover:bg-gray-50"
					on:click={() => openEvent(event)}>
					<div class="flex min-w-0 flex-1 items-center gap-3">
						{#if event.displayPictureUrl || event.coverPictureUrl}
							<img src={event.displayPictureUrl || event.coverPictureUrl} alt="" class="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
						{:else}
							<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#E2E8FC] text-xs font-semibold text-[#146AEB]">
								{(event.title || '?').charAt(0).toUpperCase()}
							</div>
						{/if}
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-gray-800">{event.title}</p>
							<p class="truncate text-xs text-gray-400">{event.eventOrganizerName || 'Unknown'} · {event.attendeeCount || 0} attendees</p>
						</div>
					</div>
					<div class="flex flex-shrink-0 items-center gap-2">
						<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {getStatusClass(event.eventStatus)}">{event.eventStatus}</span>
						<span class="hidden text-xs text-gray-400 sm:block">{timeAgo(event.createdAt)}</span>
					</div>
				</button>
			{/each}
		</div>

		{#if totalPages > 1}
			<div class="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
				<p class="text-xs text-gray-400">Showing {(currentPage - 1) * limit + 1}–{Math.min(currentPage * limit, total)} of {total}</p>
				<div class="flex items-center gap-1">
					<button on:click={() => goToPage(currentPage - 1)} disabled={currentPage === 1} class="rounded-lg px-3 py-1.5 text-sm text-[#616265] transition hover:bg-white disabled:opacity-40">Prev</button>
					{#each Array(Math.min(totalPages, 5)) as _, i}
						{@const pageNum = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i}
						<button on:click={() => goToPage(pageNum)} class="h-8 w-8 rounded-lg text-sm transition {currentPage === pageNum ? 'bg-[#513BE2] text-white' : 'text-[#616265] hover:bg-white'}">{pageNum}</button>
					{/each}
					<button on:click={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} class="rounded-lg px-3 py-1.5 text-sm text-[#616265] transition hover:bg-white disabled:opacity-40">Next</button>
				</div>
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
		<div class="flex h-full w-full max-w-3xl flex-col rounded-xl bg-[#F4F5F6] shadow-xl lg:max-w-2xl lg:rounded-none"
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

				<!--
					Tabs. The four labels are wider than a phone screen, and without
					`overflow-x-auto` the last ones (Group tickets, Tickets) were
					simply unreachable on mobile — the row clipped with no way to
					scroll to them. `flex-shrink-0` stops flex from squashing the
					labels into ellipses instead of overflowing, which is what makes
					the scroll actually happen.
				-->
				<div class="custom-scrollbar mt-5 overflow-x-auto border-b border-gray-200">
					<div class="flex w-max min-w-full gap-1">
						{#each [['overview', 'Overview'], ['registrations', 'Registrations'], ['groups', 'Group tickets'], ['tickets', 'Tickets']] as [value, label]}
							<button on:click={() => selectDetailTab(value as DetailTab)}
								class="-mb-px flex-shrink-0 border-b-2 px-3 py-2 text-sm whitespace-nowrap transition {detailTab === value ? 'border-[#513BE2] font-medium text-[#513BE2]' : 'border-transparent text-gray-500 hover:text-gray-700'}">
								{label}
								{#if value === 'registrations' && stats}<span class="ml-1 text-xs text-gray-400">{stats.registrations?.total ?? 0}</span>{/if}
								{#if value === 'groups' && stats}<span class="ml-1 text-xs text-gray-400">{stats.groups?.total ?? 0}</span>{/if}
							</button>
						{/each}
					</div>
				</div>

				{#if detailTab === 'overview'}
				<!-- Registration summary -->
				{#if statsLoading}
					<div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
						{#each Array(4) as _}<div class="h-20 animate-pulse rounded-xl bg-gray-200"></div>{/each}
					</div>
				{:else if statsError}
					<div class="mt-5 rounded-xl bg-[#FDEAEA] p-3 text-sm text-[#991b1b]">{statsError}</div>
				{:else if stats}
					<div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
						<div class="rounded-xl bg-white p-3">
							<p class="text-xs text-[#C1C2C2]">Registrations</p>
							<p class="mt-1 text-xl font-semibold text-gray-900">{stats.registrations.total}</p>
							<p class="text-xs text-gray-400">{stats.registrations.single} individual · {stats.registrations.fromGroups} in groups</p>
						</div>
						<div class="rounded-xl bg-white p-3">
							<p class="text-xs text-[#C1C2C2]">Attending</p>
							<p class="mt-1 text-xl font-semibold text-[#3CBD2C]">{stats.registrations.attending}</p>
							<p class="text-xs text-gray-400">{stats.registrations.byStatus?.CHECKED_IN ?? 0} checked in</p>
						</div>
						<div class="rounded-xl bg-white p-3">
							<p class="text-xs text-[#C1C2C2]">Group seats</p>
							<p class="mt-1 text-xl font-semibold text-gray-900">{stats.groups.seatsSold}</p>
							<p class="text-xs text-gray-400">{stats.groups.total} group purchase{stats.groups.total === 1 ? '' : 's'}</p>
						</div>
						<div class="rounded-xl bg-white p-3">
							<p class="text-xs text-[#C1C2C2]">Capacity</p>
							<p class="mt-1 text-xl font-semibold text-gray-900">
								{stats.registrations.attending}{stats.event.maxAttendees ? ` / ${stats.event.maxAttendees}` : ''}
							</p>
							<p class="text-xs text-gray-400">{stats.waitlist.total} waitlisted</p>
						</div>
					</div>

					{#if integrityIssues.length > 0}
						<div class="mt-4 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3">
							<p class="text-xs font-semibold text-[#92400E]">Needs attention</p>
							<div class="mt-2 space-y-2">
								{#each integrityIssues as issue}
									<div>
										<p class="text-sm font-medium text-[#92400E]">{issue.label}: {issue.value}</p>
										<p class="text-xs text-[#B45309]">{issue.hint}</p>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<div class="mt-4 rounded-xl bg-white p-3">
						<p class="mb-2 text-xs font-semibold text-gray-700">Registration status breakdown</p>
						<div class="flex flex-wrap gap-2">
							{#each Object.entries(stats.registrations.byStatus ?? {}) as [status, count]}
								<span class="rounded-full px-2.5 py-0.5 text-xs font-medium {regStatusClass(status)}">{status} · {count}</span>
							{/each}
							{#if Object.keys(stats.registrations.byStatus ?? {}).length === 0}
								<span class="text-xs text-gray-400">No registrations yet</span>
							{/if}
						</div>
						<p class="mt-3 mb-2 text-xs font-semibold text-gray-700">Payment status</p>
						<div class="flex flex-wrap gap-2">
							{#each Object.entries(stats.registrations.byPayment ?? {}) as [status, count]}
								<span class="rounded-full bg-[#EBECED] px-2.5 py-0.5 text-xs font-medium text-[#616265]">{status} · {count}</span>
							{/each}
						</div>
						{#if Object.keys(stats.groups.seatsByMemberStatus ?? {}).length > 0}
							<p class="mt-3 mb-2 text-xs font-semibold text-gray-700">Group seat confirmations</p>
							<div class="flex flex-wrap gap-2">
								{#each Object.entries(stats.groups.seatsByMemberStatus) as [status, count]}
									<span class="rounded-full px-2.5 py-0.5 text-xs font-medium {memberStatusClass(status)}">{status} · {count}</span>
								{/each}
							</div>
						{/if}
					</div>
				{/if}

				<!-- Details Grid -->
				<div class="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-white p-4">
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
				<div class="mt-4 rounded-xl bg-white p-4">
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

				{:else if detailTab === 'registrations'}
				<!-- ── Registrations ─────────────────────────────────────────── -->
				<div class="mt-4 space-y-3">
					<input type="text" bind:value={regSearch} on:input={handleRegSearch}
						placeholder="Search name, email, registration id or passcode..."
						class="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:ring-1 focus:ring-[#513BE2] focus:outline-none" />

					<div class="flex flex-wrap gap-2">
						<select bind:value={regStatusFilter} on:change={applyRegFilter} aria-label="Filter by registration status"
							class="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700">
							{#each regStatusOptions as s}<option value={s}>{s === 'ALL' ? 'All statuses' : s}</option>{/each}
						</select>
						<select bind:value={regPaymentFilter} on:change={applyRegFilter} aria-label="Filter by payment status"
							class="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700">
							{#each regPaymentOptions as s}<option value={s}>{s === 'ALL' ? 'All payments' : s}</option>{/each}
						</select>
						<select bind:value={regTypeFilter} on:change={applyRegFilter} aria-label="Filter by registration type"
							class="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700">
							{#each regTypeOptions as o}<option value={o.value}>{o.label}</option>{/each}
						</select>
					</div>

					{#if regsLoading}
						<div class="space-y-2">
							{#each Array(6) as _}<div class="h-16 animate-pulse rounded-xl bg-gray-200"></div>{/each}
						</div>
					{:else if regs.length === 0}
						<div class="rounded-xl bg-white p-6 text-center text-sm text-gray-400">No registrations match these filters.</div>
					{:else}
						<p class="text-xs text-gray-400">{regsTotal} registration{regsTotal === 1 ? '' : 's'}</p>
						<div class="space-y-2">
							{#each regs as r (r.registration_id)}
								<div class="rounded-xl bg-white p-3">
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0">
											<p class="truncate text-sm font-medium text-gray-800">{fullName(r.attendee_details)}</p>
											<p class="truncate text-xs text-gray-400">{r.attendee_details?.email ?? '—'}</p>
										</div>
										<div class="flex flex-shrink-0 flex-col items-end gap-1">
											<span class="rounded-full px-2 py-0.5 text-[11px] font-medium {regStatusClass(r.attendee_status)}">{r.attendee_status}</span>
											<span class="text-[11px] text-gray-400">{r.payment_status}</span>
										</div>
									</div>
									<div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
										<span>{r.ticketTypeName}</span>
										<span>·</span>
										<span>
											{#if r.registrationKind === 'GROUP_LEAD'}
												Group lead ({r.group?.quantity ?? '?'} seats)
											{:else if r.registrationKind === 'GROUP_MEMBER'}
												Group member{r.group?.memberStatus ? ` · ${r.group.memberStatus}` : ''}
											{:else}
												Individual
											{/if}
										</span>
										<span>·</span>
										<span>{formatDateTime(r.registered_at ?? r.createdAt)}</span>
										{#if r.checked_in_at}<span>·</span><span class="text-[#3CBD2C]">Checked in {formatDateTime(r.checked_in_at)}</span>{/if}
									</div>
									{#if r.group}
										<div class="mt-2 flex flex-wrap items-center gap-2 border-t border-gray-50 pt-2 text-[11px]">
											<span class="rounded-full px-2 py-0.5 font-medium {groupStatusClass(r.group.status)}">Group {r.group.status}</span>
											<span class="font-mono text-gray-400">{r.group.group_id.slice(0, 8)}</span>
											{#if r.group.memberStatus}<span class="rounded-full px-2 py-0.5 font-medium {memberStatusClass(r.group.memberStatus)}">{r.group.memberStatus}</span>{/if}
											{#if !r.attendeeId}<span class="text-[#E53935]">No attendee record</span>{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>

						{#if regsTotalPages > 1}
							<div class="flex items-center justify-between pt-1">
								<button on:click={() => { if (regsPage > 1) { regsPage--; loadRegistrations(); } }} disabled={regsPage === 1}
									class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs disabled:opacity-40">Previous</button>
								<span class="text-xs text-gray-500">Page {regsPage} of {regsTotalPages}</span>
								<button on:click={() => { if (regsPage < regsTotalPages) { regsPage++; loadRegistrations(); } }} disabled={regsPage === regsTotalPages}
									class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs disabled:opacity-40">Next</button>
							</div>
						{/if}
					{/if}
				</div>

				{:else if detailTab === 'groups'}
				<!-- ── Group tickets ─────────────────────────────────────────── -->
				<div class="mt-4 space-y-3">
					<select bind:value={groupsStatusFilter} on:change={applyGroupFilter} aria-label="Filter by group status"
						class="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700">
						{#each groupStatusOptions as s}<option value={s}>{s === 'ALL' ? 'All group statuses' : s}</option>{/each}
					</select>

					{#if groupsLoading}
						<div class="space-y-2">{#each Array(4) as _}<div class="h-24 animate-pulse rounded-xl bg-gray-200"></div>{/each}</div>
					{:else if groups.length === 0}
						<div class="rounded-xl bg-white p-6 text-center text-sm text-gray-400">No group purchases for this event.</div>
					{:else}
						<p class="text-xs text-gray-400">{groupsTotal} group purchase{groupsTotal === 1 ? '' : 's'}</p>
						<div class="space-y-2">
							{#each groups as g (g.group_id)}
								<div class="rounded-xl bg-white p-3">
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0">
											<p class="truncate text-sm font-medium text-gray-800">{g.lead?.name || g.lead?.email || 'Unknown lead'}</p>
											<p class="truncate text-xs text-gray-400">{g.lead?.email ?? '—'} · {money(g.totalAmount)}</p>
										</div>
										<span class="flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium {groupStatusClass(g.status)}">{g.status}</span>
									</div>

									<div class="mt-2 grid grid-cols-3 gap-2 text-[11px]">
										<div><span class="text-gray-400">Seats paid</span><p class="font-medium text-gray-800">{g.quantity}</p></div>
										<div><span class="text-gray-400">Seats live</span>
											<p class="font-medium {g.seatsLive === g.quantity ? 'text-[#3CBD2C]' : 'text-[#E53935]'}">{g.seatsLive} / {g.quantity}</p></div>
										<div><span class="text-gray-400">Payment</span><p class="font-medium text-gray-800">{g.payment_status}</p></div>
									</div>

									{#if g.status === 'PENDING_PAYMENT' && g.expiresAt}
										<p class="mt-2 text-[11px] text-[#B45309]">Hold expires {formatDateTime(g.expiresAt)}</p>
									{/if}
									{#if g.seatsMissing > 0}
										<p class="mt-1 text-[11px] text-[#E53935]">{g.seatsMissing} seat row(s) missing for this group.</p>
									{/if}

									<button on:click={() => (expandedGroup = expandedGroup === g.group_id ? '' : g.group_id)}
										class="mt-2 text-[11px] font-medium text-[#513BE2]">
										{expandedGroup === g.group_id ? 'Hide' : 'Show'} {g.members.length} member{g.members.length === 1 ? '' : 's'}
									</button>

									{#if expandedGroup === g.group_id}
										<div class="mt-2 space-y-2 border-t border-gray-50 pt-2">
											{#each g.members as m (m.email)}
												<div class="flex items-start justify-between gap-2">
													<div class="min-w-0">
														<p class="truncate text-xs font-medium text-gray-700">{m.name || m.email}</p>
														<p class="truncate text-[11px] text-gray-400">
															{m.email}
															{#if m.replacedEmail} · replaced {m.replacedEmail}{/if}
														</p>
														<p class="text-[11px] text-gray-400">
															{#if m.confirmedAt}Confirmed {formatDateTime(m.confirmedAt)}
															{:else if m.declinedAt}Declined {formatDateTime(m.declinedAt)}
															{:else}Invited {m.inviteSentCount}× {m.lastInviteSentAt ? `· last ${formatDateTime(m.lastInviteSentAt)}` : ''}{/if}
														</p>
													</div>
													<div class="flex flex-shrink-0 flex-col items-end gap-1">
														<span class="rounded-full px-2 py-0.5 text-[11px] font-medium {memberStatusClass(m.status)}">{m.status}</span>
														{#if m.attendee_status}<span class="text-[11px] text-gray-400">{m.attendee_status}</span>{/if}
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						</div>

						{#if groupsTotalPages > 1}
							<div class="flex items-center justify-between pt-1">
								<button on:click={() => { if (groupsPage > 1) { groupsPage--; loadGroups(); } }} disabled={groupsPage === 1}
									class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs disabled:opacity-40">Previous</button>
								<span class="text-xs text-gray-500">Page {groupsPage} of {groupsTotalPages}</span>
								<button on:click={() => { if (groupsPage < groupsTotalPages) { groupsPage++; loadGroups(); } }} disabled={groupsPage === groupsTotalPages}
									class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs disabled:opacity-40">Next</button>
							</div>
						{/if}
					{/if}
				</div>

				{:else}
				<!-- ── Tickets ───────────────────────────────────────────────── -->
				<div class="mt-4 space-y-2">
					{#if statsLoading}
						{#each Array(3) as _}<div class="h-20 animate-pulse rounded-xl bg-gray-200"></div>{/each}
					{:else if !stats || stats.tickets.length === 0}
						<div class="rounded-xl bg-white p-6 text-center text-sm text-gray-400">No ticket types configured.</div>
					{:else}
						{#each stats.tickets as t (t._id)}
							<div class="rounded-xl bg-white p-3">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="truncate text-sm font-medium text-gray-800">{t.name}</p>
										<p class="text-xs text-gray-400">{t.isFree ? 'Free' : money(t.price, t.currency)}</p>
									</div>
									<div class="flex flex-shrink-0 gap-1">
										{#if t.groupTicketEnabled}<span class="rounded-full bg-[#E2E8FC] px-2 py-0.5 text-[11px] font-medium text-[#146AEB]">Group</span>{/if}
										{#if t.requiresApproval}<span class="rounded-full bg-[#FFF8E1] px-2 py-0.5 text-[11px] font-medium text-[#EAAB26]">Approval</span>{/if}
									</div>
								</div>
								<div class="mt-2 grid grid-cols-4 gap-2 text-[11px]">
									<div><span class="text-gray-400">Sold</span><p class="font-medium text-gray-800">{t.soldCount}</p></div>
									<div><span class="text-gray-400">Confirmed</span><p class="font-medium text-gray-800">{t.confirmedCount}</p></div>
									<div><span class="text-gray-400">Reserved</span><p class="font-medium text-gray-800">{t.reservedCount}</p></div>
									<div><span class="text-gray-400">Capacity</span><p class="font-medium text-gray-800">{t.quantityAvailable ?? '∞'}</p></div>
								</div>
							</div>
						{/each}
					{/if}
				</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
