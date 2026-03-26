<script lang="ts">
	import { page } from '$app/stores';
	import { getEventVendors } from '$lib/services/event.services';
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
	let selectedVendor: any = null;

	let vendors: any[] = [];
	let loading = true;
	let statusFilter = 'All';
	let orderFilter = 'All';

	async function loadVendors() {
		if (!eventId) return;
		loading = true;
		try {
			const filters: any = {};
			if (statusFilter !== 'All') filters.status = statusFilter;
			if (searchQuery) filters.search = searchQuery;
			if (orderFilter !== 'All') filters.hasOrders = orderFilter;
			vendors = await getEventVendors(eventId, filters);
		} catch (e) {
			console.error('Failed to load vendors:', e);
			vendors = [];
		} finally {
			loading = false;
		}
	}

	onMount(() => { loadVendors(); });

	let searchTimeout: ReturnType<typeof setTimeout>;
	$: {
		if (searchQuery !== undefined) {
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(() => { loadVendors(); }, 400);
		}
	}

	function getDisplayName(v: any): string {
		return v.displayName || v.applicationDetails?.companyName || v.applicationDetails?.contactEmail || 'Unknown Vendor';
	}

	function getServices(v: any): string {
		return v.applicationDetails?.bio || v.bio || '';
	}

	function getOrderCount(v: any): number {
		return v.paymentDetails?.contributionAmount ? 1 : 0;
	}

	function getStatusLabel(status: string): string {
		const map: Record<string, string> = {
			INVITED: 'Invited', ACCEPTED: 'Accepted', CONFIRMED: 'Order Confirmed',
			DECLINED: 'Declined', MANUAL_ADD: 'Manual Add', APPROVED: 'Approved',
			APPLIED: 'Applied', PENDING_APPROVAL: 'Order Pending', INACTIVE: 'Inactive',
		};
		return map[status] || status;
	}

	function openProfile(v: any) { selectedVendor = v; showProfile = true; }
	function handleVendorAdded() { showAddModal = false; loadVendors(); }
	function handleVendorUpdated() { loadVendors(); }
</script>

<div class="">
	<div class="mb-6">
		<div class="mb-4 flex flex-wrap justify-between gap-4 md:flex-row md:items-center">
			<div>
				<h2 class="mb-1 text-xl font-semibold">Vendors for {eventTitle || 'Event'}</h2>
				<p class="text-sm text-gray-600">Manage service and product providers for your event's needs.</p>
			</div>
			<div>
				<button on:click={() => (showAddModal = true)} class="flex w-full items-center justify-center gap-2 rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800 sm:w-fit">
					<Icon icon="mdi:plus" class="text-xl" />
					Add Vendor
				</button>
				<AddParticipant bind:open={showAddModal} participant="Vendor" {eventId} {eventTitle} on:added={handleVendorAdded} />
			</div>
		</div>

		<!-- Search and Filters -->
		<div class="mb-4 flex flex-col justify-between lg:flex-row lg:items-center">
			<div class="relative mb-4 w-full max-w-xl">
				<input type="text" bind:value={searchQuery} placeholder="Search vendors by company name, service..." class="h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none" />
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
					<Status bind:open={showStatus} participant="vendor" on:select={(e) => { statusFilter = e.detail; loadVendors(); showStatus = false; }} />
				</div>
				<div use:clickOutside={() => (showFilter = false)} class="relative">
					<button on:click={() => (showFilter = !showFilter)} class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
						Has Orders
					</button>
					<Filter bind:open={showFilter} participant="vendor" on:select={(e) => { orderFilter = e.detail; loadVendors(); showFilter = false; }} />
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
							<div class="ml-auto h-6 w-20 rounded-full bg-gray-200"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if vendors.length > 0}
			{#each vendors as vendor}
				{@const statusLabel = getStatusLabel(vendor.status)}
				{@const styling = getStatusStyle(statusLabel)}
				<div class="mb-2 rounded-lg bg-white p-4">
					<div class="flex items-end justify-between md:items-start lg:items-center">
						<button class="flex flex-wrap gap-2 md:flex-row md:items-center md:gap-5" on:click={() => openProfile(vendor)}>
							<div class="flex items-center gap-2">
								{#if vendor.profilePictureUrl}
									<img src={vendor.profilePictureUrl} alt={getDisplayName(vendor)} class="h-8 w-8 rounded-full object-cover" />
								{:else}
									<div class="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-sm font-medium text-teal-600">
										{getDisplayName(vendor).charAt(0).toUpperCase()}
									</div>
								{/if}
								<div class="font-medium">{getDisplayName(vendor)}</div>
							</div>
							<div class="flex items-center gap-2">
								{#if getServices(vendor)}
									<div class="max-w-[150px] truncate text-sm text-[#B6B7B7]">{getServices(vendor)}</div>
								{/if}
								<div class="text-sm text-gray-600">{getOrderCount(vendor)}</div>
							</div>
						</button>

						<div class="flex flex-col items-end gap-2 lg:flex-row lg:items-center">
							<span class="rounded-[11px] px-2 py-1 text-xs" style="background: {styling.bg}; color: {styling.text}">
								{statusLabel}
							</span>

							<div class="group relative" bind:this={buttonEl} use:clickOutside={() => { if (showActionModal === vendor.id) showActionModal = null; }}>
								<button on:click={() => (showActionModal = showActionModal === vendor.id ? null : vendor.id)} class="rounded p-1 hover:bg-gray-100">
									<Icon icon="mdi:dots-horizontal" class="h-5 w-5 text-gray-500" />
								</button>
								<Dropdown open={showActionModal === vendor.id} {buttonEl} participant="vendor" speakerData={vendor} {eventId} {eventTitle} on:updated={handleVendorUpdated} />
							</div>
						</div>
					</div>
				</div>
			{/each}
		{:else}
			<div class="flex h-50 flex-col items-center justify-center">
				<img src="/participants.svg" alt="" class="h-40" />
				<p class="-mt-2 font-medium text-[#A2ACB2]">No Vendors added, yet</p>
				<p class="text-sm text-gray-400">Vendors will display when they are added</p>
			</div>
		{/if}
	</div>
</div>

{#if selectedVendor}
	<ProfileDetail bind:open={showProfile} participant="Vendor" speakerData={selectedVendor} {eventId} {eventTitle} on:save={handleVendorUpdated} on:close={() => { showProfile = false; selectedVendor = null; }} />
{/if}
