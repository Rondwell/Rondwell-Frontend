<script lang="ts">
	import { page } from '$app/stores';
	import { getCollaborationRequests } from '$lib/services/event.services';
	import { clickOutside } from '$lib/utils/constant';
	import { getStatusStyle } from '$lib/utils/statusStyle';
	import { onMount } from 'svelte';
	import Filter from './modal/Filter.svelte';
	import RequestDetail from './modal/RequestDetail.svelte';
	import Status from './modal/Status.svelte';

	export let eventTitle = '';
	$: eventId = $page.params.id;

	let searchQuery = '';
	let showFilter = false;
	let showStatus = false;
	let selectedRequest: any = null;
	let showDetail = false;

	let requests: any[] = [];
	let loading = true;
	let statusFilter = 'All';
	let roleFilter = 'All';

	async function loadRequests() {
		if (!eventId) return;
		loading = true;
		try {
			requests = await getCollaborationRequests(eventId, {
				status: statusFilter,
				role: roleFilter,
				search: searchQuery || undefined,
			});
		} catch (e) {
			console.error('Failed to load collaboration requests:', e);
			requests = [];
		} finally {
			loading = false;
		}
	}

	onMount(() => { loadRequests(); });

	let searchTimeout: ReturnType<typeof setTimeout>;
	$: {
		if (searchQuery !== undefined) {
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(() => { loadRequests(); }, 400);
		}
	}

	function getStatusLabel(status: string): string {
		const map: Record<string, string> = {
			PENDING: 'Pending', ACCEPTED: 'Accepted', DECLINED: 'Declined',
			APPLIED: 'Pending', APPROVED: 'Accepted',
		};
		return map[status] || status;
	}

	function getRoleBadgeColor(role: string): string {
		if (role === 'SPEAKER') return 'bg-purple-100 text-purple-600';
		if (role === 'EXHIBITOR') return 'bg-blue-100 text-blue-600';
		if (role === 'VENDOR') return 'bg-teal-100 text-teal-600';
		return 'bg-gray-100 text-gray-700';
	}

	function formatDate(date: string): string {
		if (!date) return '';
		return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function openDetail(request: any) {
		selectedRequest = request;
		showDetail = true;
	}

	function handleResponded() {
		showDetail = false;
		selectedRequest = null;
		loadRequests();
	}
</script>

<div class="">
	<div class="mb-6">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-4 md:flex-row">
			<div>
				<h2 class="mb-1 text-xl font-semibold">Collaboration Requests for {eventTitle || 'Event'}</h2>
				<p class="text-sm text-gray-600">Review and respond to all incoming proposals from Speakers, Exhibitors, and Vendors.</p>
			</div>
		</div>

		<!-- Search and Filters -->
		<div class="mb-4 flex flex-col justify-between lg:flex-row lg:items-center">
			<div class="relative mb-4 w-full max-w-xl">
				<input type="text" bind:value={searchQuery} placeholder="Search requests by name, role, or topic..." class="h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none" />
				<span class="absolute top-2.5 left-3 text-gray-400">
					<img src="/search-favorite.png" alt="search icon" class="h-5 w-5" />
				</span>
			</div>

			<div class="flex items-center gap-1 md:flex-row">
				<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]">
					<img src="/download-icon.svg" alt="download icon" />
				</div>
				<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]">
					<img src="/export.svg" alt="export icon" />
				</div>

				<div use:clickOutside={() => (showStatus = false)} class="relative">
					<button on:click={() => (showStatus = !showStatus)} class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
						Status
					</button>
					<Status bind:open={showStatus} participant="cr" on:select={(e) => { statusFilter = e.detail; loadRequests(); showStatus = false; }} />
				</div>
				<div use:clickOutside={() => (showFilter = false)} class="relative">
					<button on:click={() => (showFilter = !showFilter)} class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
						Role
					</button>
					<Filter bind:open={showFilter} participant="cr" on:select={(e) => { roleFilter = e.detail; loadRequests(); showFilter = false; }} />
				</div>
			</div>
		</div>

		{#if loading}
			<div class="space-y-2">
				{#each [1, 2, 3] as _}
					<div class="mb-2 animate-pulse rounded-lg bg-white p-4">
						<div class="flex items-center gap-4">
							<div class="h-8 w-8 rounded-full bg-gray-200"></div>
							<div class="h-4 w-32 rounded bg-gray-200"></div>
							<div class="h-5 w-16 rounded bg-gray-200"></div>
							<div class="h-3 w-48 rounded bg-gray-200"></div>
							<div class="ml-auto h-6 w-20 rounded-full bg-gray-200"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if requests.length > 0}
			{#each requests as request}
				{@const statusLabel = getStatusLabel(request.status)}
				{@const styling = getStatusStyle(statusLabel)}
				<div class="mb-2 rounded-lg bg-white p-4">
					<div class="flex flex-col justify-between gap-2 lg:flex-row lg:items-center">
						<div class="flex flex-col gap-2 md:flex-row md:items-center md:gap-5">
							<div class="flex items-center gap-2">
								{#if request.senderProfilePicture}
									<img src={request.senderProfilePicture} alt={request.senderName} class="h-8 w-8 rounded-full object-cover" />
								{:else}
									<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
										{(request.senderName || 'U').charAt(0).toUpperCase()}
									</div>
								{/if}
								<div class="font-medium">{request.senderName}</div>
								<span class="rounded px-2 py-0.5 text-xs font-medium {getRoleBadgeColor(request.role)}">
									{request.role === 'SPEAKER' ? 'Speaker' : request.role === 'EXHIBITOR' ? 'Exhibitor' : 'Vendor'}
								</span>
							</div>
							<div class="flex flex-col gap-2 md:flex-row md:items-center">
								<span class="max-w-[200px] truncate text-sm text-[#B6B7B7] md:max-w-[150px] lg:max-w-[250px]">
									{request.proposal}
								</span>
								<div class="text-sm text-gray-600">{formatDate(request.dateSent)}</div>
							</div>
						</div>

						<div class="flex items-center gap-2">
							<span class="rounded-[11px] px-2 py-1 text-xs" style="background: {styling.bg}; color: {styling.text}">
								{statusLabel}
							</span>
							<button on:click={() => openDetail(request)} class="rounded-md bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300">
								Review & Respond
							</button>
						</div>
					</div>
				</div>
			{/each}
		{:else}
			<div class="flex h-50 flex-col items-center justify-center">
				<img src="/participants.svg" alt="" class="h-40" />
				<p class="-mt-2 font-medium text-[#A2ACB2]">No collaboration requests yet</p>
				<p class="text-sm text-gray-400">Requests from Speakers, Exhibitors, and Vendors will appear here</p>
			</div>
		{/if}
	</div>
</div>

{#if selectedRequest}
	<RequestDetail bind:open={showDetail} request={selectedRequest} {eventId} {eventTitle} on:responded={handleResponded} on:close={() => { showDetail = false; selectedRequest = null; }} />
{/if}
