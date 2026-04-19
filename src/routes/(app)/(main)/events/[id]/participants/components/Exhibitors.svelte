<script lang="ts">
	import { page } from '$app/stores';
	import { getEventExhibitors } from '$lib/services/event.services';
	import { clickOutside } from '$lib/utils/constant';
	import { getStatusStyle } from '$lib/utils/statusStyle';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import AddParticipant from './modal/AddParticipant.svelte';
	import Dropdown from './modal/Dropdown.svelte';
	import Filter from './modal/Filter.svelte';
	import ProfileDetail from './modal/ProfileDetail.svelte';
	import Status from './modal/Status.svelte';

	export let eventTitle = '';

	$: eventId = $page.params.id;

	let searchQuery = '';
	let showAddModal = false;
	let showProfile = false;
	let showFilter = false;
	let showStatus = false;
	let showActionModal: string | null = null;
	let buttonEl: HTMLElement;
	let selectedExhibitor: any = null;

	let exhibitors: any[] = [];
	let loading = true;
	let statusFilter = 'All';
	let boothFilter = 'All';

	async function loadExhibitors() {
		if (!eventId) return;
		loading = true;
		try {
			const filters: any = {};
			if (statusFilter !== 'All') filters.status = statusFilter;
			if (searchQuery) filters.search = searchQuery;
			if (boothFilter !== 'All') filters.boothStatus = boothFilter;
			exhibitors = await getEventExhibitors(eventId, filters);
		} catch (e) {
			console.error('Failed to load exhibitors:', e);
			exhibitors = [];
		} finally {
			loading = false;
		}
	}

	onMount(() => { loadExhibitors(); });

	let searchTimeout: ReturnType<typeof setTimeout>;
	$: {
		if (searchQuery !== undefined) {
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(() => { loadExhibitors(); }, 400);
		}
	}

	function getDisplayName(ex: any): string {
		return ex.displayName || ex.applicationDetails?.companyName || ex.applicationDetails?.contactEmail || 'Unknown Exhibitor';
	}

	function getPackageInfo(ex: any): string {
		return ex.packageName || ex.paymentDetails?.sponsorshipTier || '';
	}

	function getContributionStatus(ex: any): string {
		if (!ex.paymentDetails?.contributionAmount) return '';
		const ps = ex.paymentDetails?.paymentStatus;
		if (ps === 'COMPLETED') return 'Paid';
		if (ps === 'PENDING') return 'Pending';
		if (ps === 'FAILED') return 'Overdue';
		return '';
	}

	function getBoothStatusLabel(ex: any): string {
		const map: Record<string, string> = {
			NOT_SET_UP: 'Not Set Up',
			SET_UP: 'Set Up',
			PUBLISHED: 'Published',
			DRAFT: 'Draft',
		};
		return map[ex.boothStatus] || 'Not Set Up';
	}

	function getStatusLabel(status: string): string {
		const map: Record<string, string> = {
			INVITED: 'Invited', ACCEPTED: 'Accepted', CONFIRMED: 'Confirmed',
			DECLINED: 'Declined', MANUAL_ADD: 'Manual Add', APPROVED: 'Approved',
			APPLIED: 'Applied', PENDING_APPROVAL: 'Pending', INACTIVE: 'Inactive',
		};
		return map[status] || status;
	}

	function openProfile(ex: any) { selectedExhibitor = ex; showProfile = true; }
	function handleExhibitorAdded() { showAddModal = false; loadExhibitors(); }
	function handleExhibitorUpdated() { loadExhibitors(); }
</script>

<div class="">
	<div class="mb-6">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-4 md:flex-row">
			<div>
				<h2 class="mb-1 text-xl font-semibold">Exhibitors for {eventTitle || 'Event'}</h2>
				<p class="text-sm text-gray-600">Manage businesses showcasing their products and services at your event.</p>
			</div>
			<div>
				<button on:click={() => (showAddModal = true)} class="flex w-full items-center justify-center gap-2 rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800 sm:w-fit">
					<Icon icon="mdi:plus" class="text-xl" />
					Add Exhibitor
				</button>
				<AddParticipant bind:open={showAddModal} participant="Exhibitor" {eventId} {eventTitle} on:added={handleExhibitorAdded} />
			</div>
		</div>

		<!-- Search and Filters -->
		<div class="mb-4 flex flex-col justify-between gap-2 lg:flex-row lg:items-center">
			<div class="relative mb-4 w-full max-w-sm lg:mb-0">
				<input type="text" bind:value={searchQuery} placeholder="Search exhibitors by company name, status..." class="h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none" />
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
					<Status bind:open={showStatus} participant="exhibitor" on:select={(e) => { statusFilter = e.detail; loadExhibitors(); showStatus = false; }} />
				</div>
				<div use:clickOutside={() => (showFilter = false)} class="relative">
					<button on:click={() => (showFilter = !showFilter)} class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
						Digital Booth Status
					</button>
					<Filter bind:open={showFilter} participant="exhibitor" on:select={(e) => { boothFilter = e.detail; loadExhibitors(); showFilter = false; }} />
				</div>
			</div>
		</div>

		{#if loading}
			<div class="space-y-2">
				{#each [1, 2, 3] as _}
					<div class="mb-2 animate-pulse rounded-lg bg-white p-4">
						<div class="flex items-center gap-4">
							<div class="h-8 w-8 rounded-full bg-gray-200"></div>
							<div class="h-4 w-40 rounded bg-gray-200"></div>
							<div class="h-3 w-24 rounded bg-gray-200"></div>
							<div class="h-3 w-20 rounded bg-gray-200"></div>
							<div class="ml-auto h-6 w-20 rounded-full bg-gray-200"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if exhibitors.length > 0}
			{#each exhibitors as exhibitor}
				{@const statusLabel = getStatusLabel(exhibitor.status)}
				{@const styling = getStatusStyle(statusLabel)}
				{@const contributionStatus = getContributionStatus(exhibitor)}
				<div class="mb-2 rounded-lg bg-white p-4">
					<div class="flex items-end justify-between md:items-start lg:items-center">
						<button class="flex flex-wrap gap-2 md:flex-row md:items-center md:gap-5" on:click={() => openProfile(exhibitor)}>
							<div class="flex items-center gap-2">
								{#if exhibitor.profilePictureUrl}
									<img src={exhibitor.profilePictureUrl} alt={getDisplayName(exhibitor)} class="h-8 w-8 rounded-lg object-cover" />
								{:else}
									<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-sm font-medium text-orange-600">
										{getDisplayName(exhibitor).charAt(0).toUpperCase()}
									</div>
								{/if}
								<div class="font-medium">{getDisplayName(exhibitor)}</div>
							</div>
							<div class="flex items-center gap-2">
								{#if getPackageInfo(exhibitor)}
									<div class="text-sm text-[#B6B7B7]">{getPackageInfo(exhibitor)}</div>
								{/if}
								{#if contributionStatus}
									<span class="text-sm {contributionStatus === 'Paid' ? 'text-green-600' : contributionStatus === 'Overdue' ? 'text-red-500' : 'text-yellow-600'}">{contributionStatus}</span>
								{/if}
								<div class="text-sm text-gray-600">{getBoothStatusLabel(exhibitor)}</div>
							</div>
						</button>

						<div class="flex flex-col items-end gap-2 lg:flex-row lg:items-center">
							<span class="rounded-[11px] px-2 py-1 text-xs" style="background: {styling.bg}; color: {styling.text}">
								{statusLabel}
							</span>

							<div class="group relative" bind:this={buttonEl} use:clickOutside={() => { if (showActionModal === exhibitor.id) showActionModal = null; }}>
								<button on:click={() => (showActionModal = showActionModal === exhibitor.id ? null : exhibitor.id)} class="rounded p-1 hover:bg-gray-100">
									<Icon icon="mdi:dots-horizontal" class="h-5 w-5 text-gray-500" />
								</button>
								<Dropdown open={showActionModal === exhibitor.id} {buttonEl} participant="exhibitor" speakerData={exhibitor} {eventId} {eventTitle} on:updated={handleExhibitorUpdated} />
							</div>
						</div>
					</div>
				</div>
			{/each}
		{:else}
			<div class="flex h-50 flex-col items-center justify-center">
				<img src="/participants.svg" alt="" class="h-40" />
				<p class="-mt-2 font-medium text-[#A2ACB2]">No Exhibitors added, yet</p>
				<p class="text-sm text-gray-400">Exhibitors will display when they are added</p>
			</div>
		{/if}
	</div>
</div>

{#if selectedExhibitor}
	<ProfileDetail bind:open={showProfile} participant="Exhibitor" speakerData={selectedExhibitor} {eventId} {eventTitle} on:save={handleExhibitorUpdated} on:close={() => { showProfile = false; selectedExhibitor = null; }} />
{/if}
