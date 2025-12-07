<!-- src/routes/event/vendors/+page.svelte -->
<script lang="ts">
	import { getStatusStyle } from '$lib/utils/statusStyle';
	import Icon from '@iconify/svelte';
	import AddParticipant from './modal/AddParticipant.svelte';
	import Status from './modal/Status.svelte';
	import Filter from './modal/Filter.svelte';
	import Dropdown from './modal/Dropdown.svelte';
	import { clickOutside } from '$lib/utils/constant';
	import ProfileDetail from './modal/ProfileDetail.svelte';

	let searchQuery = '';
	let showAddModal = false;
	let showProfile = false;
	let showFilter = false;
	let showStatus = false;
	let showActionModal: number | null = null;
	let buttonEl: HTMLElement;

	// Mock data for vendors
	const eventData = {
		title: 'Megaexe Party',
		collection: 'John Collection',
		vendors: [
			{
				id: 1,
				company: 'Edima Atahnasius Collection',
				service: 'Photography',
				orders: 44,
				status: 'Invited',
				avatar: 'https://placehold.co/24x24/FF6B6B/FFFFFF?text=E'
			},
			{
				id: 2,
				company: 'Imabong Ekemini Food Lacart',
				service: 'Photography',
				orders: 21,
				status: 'Applied',
				avatar: 'https://placehold.co/24x24/FF9270/FFFFFF?text=I'
			},
			{
				id: 3,
				company: 'Sleekwaresandslides',
				service: 'Catering',
				orders: 33,
				status: 'Approved',
				avatar: 'https://placehold.co/24x24/6B7280/FFFFFF?text=S'
			},
			{
				id: 4,
				company: 'Sleekwaresandslides',
				service: 'Catering',
				orders: 33,
				status: 'Pending',
				avatar: 'https://placehold.co/24x24/6B7280/FFFFFF?text=S'
			},
			{
				id: 5,
				company: 'Sleekwaresandslides',
				service: 'Catering',
				orders: 33,
				status: 'Confirmed',
				avatar: 'https://placehold.co/24x24/6B7280/FFFFFF?text=S'
			},
			{
				id: 6,
				company: 'Sleekwaresandslides',
				service: 'Catering',
				orders: 33,
				status: 'Fulfilled',
				avatar: 'https://placehold.co/24x24/6B7280/FFFFFF?text=S'
			},
			{
				id: 7,
				company: 'Imabong Ekemini Food Lacart',
				service: 'Catering',
				orders: 32,
				status: 'Declined',
				avatar: 'https://placehold.co/24x24/6B7280/FFFFFF?text=I'
			}
		]
	};

	function handleSaveSpeaker(speaker: string) {
		console.log('Saved speaker:', speaker);
		// Update your speaker data or send to API
	}

	function handleSendMessage(speakerId: string) {
		console.log('Sending message to speaker ID:', speakerId);
		// Implement messaging functionality
	}

	function handleManageSession(sessionId: string) {
		console.log('Managing session ID:', sessionId);
		// Implement session management
	}
</script>

<div class="">
	<!-- Vendors Section -->
	<div class="mb-6">
		<div class="mb-4 flex flex-wrap justify-between gap-4 md:flex-row md:items-center">
			<div>
				<h2 class="mb-1 text-xl font-semibold">Vendors for Megaexe Party</h2>
				<p class="text-sm text-gray-600">
					Manage service and product providers for your event's needs.
				</p>
			</div>
			<div>
				<button
					on:click={() => (showAddModal = true)}
					class="flex w-full items-center justify-center gap-2 rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800 sm:w-fit"
				>
					<Icon icon="mdi:plus" class="text-xl" />
					Add Vendor
				</button>
				<AddParticipant bind:open={showAddModal} participant="Vendor" />
			</div>
		</div>

		<!-- Search and Filters -->
		<div class="mb-4 flex flex-col justify-between lg:flex-row lg:items-center">
			<div class="relative mb-4 w-full max-w-xl">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search vendors by name, session, or status..."
					class="h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none"
				/>
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
					<button
						on:click={() => (showStatus = !showStatus)}
						class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
					>
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
						Status
					</button>
					<Status bind:open={showStatus} participant="vendor" />
				</div>
				<div use:clickOutside={() => (showFilter = false)} class="relative">
					<button
						on:click={() => (showFilter = !showFilter)}
						class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
					>
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
						Has Orders
					</button>
					<Filter bind:open={showFilter} participant="vendor" />
				</div>
			</div>
		</div>

		{#if eventData?.vendors?.length > 0}
			<!-- Vendors List -->
			{#each eventData.vendors as vendor}
				{@const styling = getStatusStyle(vendor.status)}
				<div class="mb-2 rounded-lg bg-white p-4">
					<div class="flex items-end justify-between md:items-start lg:items-center">
						<button
							class="flex flex-wrap gap-2 md:flex-row md:items-center md:gap-5"
							on:click={() => (showProfile = true)}
						>
							<div class="flex items-center gap-2">
								<img src={vendor.avatar} alt={vendor.company} class="h-8 w-8 rounded-full" />
								<div class="font-medium">{vendor.company}</div>
							</div>
							<div class="flex items-center gap-2">
								<div class="text-sm text-[#B6B7B7]">{vendor.service}</div>
								<div class="text-sm text-gray-600">{vendor.orders}</div>
							</div>
						</button>

						<div class="flex flex-col items-end gap-2 lg:flex-row lg:items-center">
							<span
								class="rounded-[11px] px-2 py-1 text-xs"
								style="background: {styling.bg}; color: {styling.text}"
							>
								{vendor.status}
							</span>

							<div
								class="group relative"
								use:clickOutside={() => {
									if (showActionModal === vendor.id) showActionModal = null;
								}}
							>
								<button
									bind:this={buttonEl}
									on:click={() =>
										(showActionModal = showActionModal === vendor.id ? null : vendor.id)}
									class="rounded p-1 hover:bg-gray-100"
								>
									<Icon icon="mdi:dots-horizontal" class="h-5 w-5 text-gray-500" />
								</button>

								<Dropdown open={showActionModal === vendor.id} {buttonEl} participant="vendor" />
							</div>
						</div>
					</div>
				</div>
			{/each}
		{:else}
			<div class="flex h-50 flex-col items-center justify-center">
				<img src="/participants.svg" alt="" class="h-60" />
				<p class="mt-2 font-medium text-[#A2ACB2]">No Vendor added, yet</p>
				<p class="text-sm text-gray-400">Vendor will display when they are added</p>
			</div>
		{/if}
	</div>
</div>

<ProfileDetail
	bind:open={showProfile}
	participant="Vendor"
	on:save={() => handleSaveSpeaker}
	on:sendMessage={() => handleSendMessage}
	on:manageSession={() => handleManageSession}
	on:close={() => (showProfile = false)}
/>
