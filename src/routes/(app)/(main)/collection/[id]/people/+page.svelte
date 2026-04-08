<script lang="ts">
	import { page } from '$app/stores';
	import { getCollectionSubscribers } from '$lib/services/collection.services';
	import { clickOutside } from '$lib/utils/constant';
	import { onMount } from 'svelte';
	import SubscriberDetailModal from './SubscriberDetailModal.svelte';
	import AddPeopleModal from './components/AddPeopleModal.svelte';

	$: collectionId = $page.params.id ?? '';

	let subscribers: any[] = [];
	let subscriberCount = 0;
	let loading = true;
	let searchQuery = '';
	let searchTimeout: ReturnType<typeof setTimeout>;
	let showAddPeopleModal = false;
	let currentPage = 1;
	const pageSize = 20;

	// Filter state
	let statusFilter = 'ALL';
	let sortBy = 'subscribedAt';
	let sortOrder: 'asc' | 'desc' = 'desc';
	let showFilterDropdown = false;
	let showSortDropdown = false;

	const filterOptions = [
		{ label: 'All Subscribers', value: 'ALL' },
		{ label: 'Active', value: 'ACTIVE' },
		{ label: 'Pending Verification', value: 'PENDING_VERIFICATION' },
		{ label: 'Expired', value: 'EXPIRED' }
	];

	const sortOptions = [
		{ label: 'Recently Joined', value: 'subscribedAt' },
		{ label: 'Name', value: 'firstName' },
		{ label: 'Email', value: 'email' },
		{ label: 'Status', value: 'verificationStatus' }
	];

	$: selectedFilterLabel = filterOptions.find((f) => f.value === statusFilter)?.label ?? 'All Subscribers';
	$: selectedSortLabel = sortOptions.find((s) => s.value === sortBy)?.label ?? 'Recently Joined';

	function formatDate(date: string | Date) {
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	$: totalPages = Math.ceil(subscriberCount / pageSize);

	async function loadSubscribers() {
		loading = true;
		try {
			const result = await getCollectionSubscribers(collectionId, {
				search: searchQuery || undefined,
				limit: pageSize,
				skip: (currentPage - 1) * pageSize,
				status: statusFilter !== 'ALL' ? statusFilter : undefined,
				sortBy,
				sortOrder
			});
			const raw = result?.subscribers ?? [];
			subscribers = raw.map((s: any) => ({
				id: s._id ?? s.id,
				name: [s.firstName, s.lastName].filter(Boolean).join(' ') || '',
				email: s.email ?? '',
				joinedAt: s.subscribedAt ? formatDate(s.subscribedAt) : formatDate(new Date()),
				tags: s.tags ?? [],
				verificationStatus: s.verificationStatus ?? 'ACTIVE',
				source: s.source ?? 'manual'
			}));
			subscriberCount = result?.total ?? subscribers.length;
		} catch {
			subscribers = [];
			subscriberCount = 0;
		} finally {
			loading = false;
		}
	}

	onMount(() => { loadSubscribers(); });

	function handleSearch() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => { currentPage = 1; loadSubscribers(); }, 400);
	}

	function selectFilter(value: string) {
		statusFilter = value;
		showFilterDropdown = false;
		currentPage = 1;
		loadSubscribers();
	}

	function selectSort(value: string) {
		if (sortBy === value) {
			sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
		} else {
			sortBy = value;
			sortOrder = 'desc';
		}
		showSortDropdown = false;
		currentPage = 1;
		loadSubscribers();
	}

	let selectedSubscriber: any = null;

	function openSubscriber(subscriber: any) {
		selectedSubscriber = { ...subscriber, collectionId };
	}

	function closeSubscriberModal() { selectedSubscriber = null; }

	function handleSubscriberRefresh() {
		selectedSubscriber = null;
		loadSubscribers();
	}

	function handleSubscriberAdded() {
		showAddPeopleModal = false;
		loadSubscribers();
	}
</script>

<section class="p-4">
	<div class="mb-4 flex items-center justify-between">
		<h2 class="align-center flex justify-center gap-2 text-lg font-semibold">
			<span>People</span>
			<div class="relative inline-flex items-center justify-center">
				<img src="/circle.svg" alt="" class="h-6 w-6" />
				<span class="absolute text-xs">{subscriberCount}</span>
			</div>
		</h2>
		<button
			on:click={() => (showAddPeopleModal = true)}
			class="flex gap-1 rounded-md bg-[#EBECED] px-3 py-1 text-sm text-[#616265]"
		>
			<img src="/add-icon.svg" alt="add people" class="h-4 w-4" /> Add People
		</button>
	</div>

	<p class="mb-4 text-sm text-[#737577]">
		Manage your subscribers and event attendees. Event guests are automatically added to this list.
	</p>

	<div class="mb-4 gap-3">
		<div class="relative mb-2 w-full">
			<input
				type="text"
				bind:value={searchQuery}
				on:input={handleSearch}
				placeholder="Search"
				class="h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none"
			/>
			<span class="absolute top-2.5 left-3 text-gray-400">
				<img src="/search-favorite.png" alt="search icon" class="h-5 w-5" />
			</span>
			<span class="absolute top-2.5 right-0 border-l px-4 py-1.5 text-gray-400">
				<img src="/search-download.svg" alt="" class="h-4 w-4" />
			</span>
		</div>
		<div class="mb-3 flex flex-wrap items-center gap-2">
			<!-- Filter Dropdown -->
			<div class="relative flex-shrink-0" use:clickOutside={() => { showFilterDropdown = false; }}>
				<button
					on:click={() => { showFilterDropdown = !showFilterDropdown; }}
					class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
				>
					<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
					{selectedFilterLabel}
					<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
				</button>
				{#if showFilterDropdown}
					<div class="glass-dropdown absolute left-0 z-50 mt-2 w-52 rounded-xl border border-white/20 bg-white/70 p-1 shadow-xl backdrop-blur-xl">
						{#each filterOptions as option}
							<button
								on:click={() => selectFilter(option.value)}
								class="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/50 {statusFilter === option.value ? 'font-medium text-[#7C3AED]' : 'text-[#616265]'}"
							>
								{option.label}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Sort Dropdown -->
			<div class="relative flex-shrink-0" use:clickOutside={() => { showSortDropdown = false; }}>
				<button
					on:click={() => { showSortDropdown = !showSortDropdown; }}
					class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
				>
					<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
					{selectedSortLabel}
					{#if sortOrder === 'asc'}
						<span class="text-[10px]">↑</span>
					{:else}
						<span class="text-[10px]">↓</span>
					{/if}
					<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
				</button>
				{#if showSortDropdown}
					<div class="glass-dropdown absolute right-0 z-50 mt-2 w-48 rounded-xl border border-white/20 bg-white/70 p-1 shadow-xl backdrop-blur-xl">
						{#each sortOptions as option}
							<button
								on:click={() => selectSort(option.value)}
								class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/50 {sortBy === option.value ? 'font-medium text-[#7C3AED]' : 'text-[#616265]'}"
							>
								{option.label}
								{#if sortBy === option.value}
									<span class="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>

	{#if loading}
		<div class="flex flex-col gap-3 rounded-md bg-[#FDFDFD] px-3">
			{#each [1, 2, 3] as _}
				<div class="flex items-center justify-between border-b py-3 last:border-b-0">
					<div class="flex items-center gap-2">
						<div class="h-6 w-6 animate-pulse rounded-full bg-gray-200"></div>
						<div class="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
					</div>
					<div class="flex items-center gap-2">
						<div class="h-5 w-14 animate-pulse rounded-full bg-gray-200"></div>
						<div class="h-4 w-12 animate-pulse rounded bg-gray-200"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if subscriberCount === 0}
		<div class="mt-20 flex flex-col items-center justify-center gap-4">
			<img src="/noEvent.svg" alt="No Events" class="ml-4 h-60 w-60" />
			<h2 class="text-lg font-semibold text-[#646568]">No Subscribers, yet</h2>
			<p class="max-w-md text-center text-[#A2ACB2]">
				When people subscribe to your calendar, they will appear here.
			</p>
		</div>
	{:else}
		<div class="flex flex-col rounded-md bg-[#FDFDFD] px-3">
			{#each subscribers as subscriber}
				<button
					class="my-0.5 flex w-full items-center justify-between gap-2 rounded-md border-b py-3 last:border-b-0"
					on:click={() => openSubscriber(subscriber)}
				>
					<div class="flex min-w-0 items-start gap-2">
						<img src="/rondwell-attendee.png" alt="profile icon" class="h-6 w-6 flex-shrink-0 rounded-full" />
						<div class="flex min-w-0 flex-col items-start gap-0.5">
							<span class="flex items-center gap-1">
								{#if !subscriber?.name}
									<p class="truncate font-medium text-gray-500">Anonymous</p>
								{:else}
									<p class="truncate font-medium">{subscriber.name}</p>
									<span class="h-2 w-2 flex-shrink-0 rounded-full bg-[#EAAB26]"></span>
								{/if}
							</span>
							<p class="truncate text-xs text-gray-500">{subscriber?.email}</p>
						</div>
					</div>
					<div class="flex flex-shrink-0 flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-2">
						{#if subscriber.verificationStatus === 'PENDING_VERIFICATION'}
							<span class="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">Pending</span>
						{:else if subscriber.verificationStatus === 'EXPIRED'}
							<span class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">Expired</span>
						{:else}
							<span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>
						{/if}
						<span class="text-xs text-gray-500">{subscriber?.joinedAt}</span>
					</div>
				</button>
			{/each}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="mt-4 flex items-center justify-center gap-2">
				<button
					on:click={() => { currentPage = Math.max(1, currentPage - 1); loadSubscribers(); }}
					disabled={currentPage === 1}
					class="rounded-md px-3 py-1 text-sm text-[#616265] transition-colors hover:bg-[#EBECED] disabled:opacity-40"
				>
					Previous
				</button>
				<span class="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
				<button
					on:click={() => { currentPage = Math.min(totalPages, currentPage + 1); loadSubscribers(); }}
					disabled={currentPage === totalPages}
					class="rounded-md px-3 py-1 text-sm text-[#616265] transition-colors hover:bg-[#EBECED] disabled:opacity-40"
				>
					Next
				</button>
			</div>
		{/if}
	{/if}
</section>

{#if selectedSubscriber}
	<SubscriberDetailModal subscriber={selectedSubscriber} collectionId={collectionId} on:close={closeSubscriberModal} on:refresh={handleSubscriberRefresh} />
{/if}

{#if showAddPeopleModal}
	<AddPeopleModal {collectionId} on:close={() => (showAddPeopleModal = false)} on:added={handleSubscriberAdded} />
{/if}

<style>
	.glass-dropdown {
		background: rgba(255, 255, 255, 0.75);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.3);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.5);
	}
</style>
