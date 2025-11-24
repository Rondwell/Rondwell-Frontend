<!-- src/routes/event/exhibitors/+page.svelte -->
<script lang="ts">
	import { getStatusStyle } from '$lib/utils/statusStyle';
	import Icon from '@iconify/svelte';
	import AddParticipant from './modal/AddParticipant.svelte';

	let searchQuery = '';
	let showAddModal = false;

	// Mock data for exhibitors
	const eventData = {
		title: 'Megaexe Party',
		collection: 'John Collection',
		tabs: [
			{ name: 'Speakers', active: false },
			{ name: 'Exhibitors', active: true },
			{ name: 'Vendors', active: false },
			{ name: 'Collaboration Request', active: false }
		],
		exhibitors: [
			{
				id: 1,
				company: 'Sleekwaresandslides',
				packageName: 'Package Name',
				setupStatus: 'Set Up',
				status: 'Approved',
				avatar: 'https://placehold.co/24x24/FF6B6B/FFFFFF?text=S'
			},
			{
				id: 2,
				company: 'Edima Collection',
				packageName: 'Sponsorship Amount',
				setupStatus: 'Not Set Up',
				status: 'Invited',
				avatar: 'https://placehold.co/24x24/FF9270/FFFFFF?text=E'
			},
			{
				id: 3,
				company: 'Imabong Ekemini Food Lacart',
				packageName: 'Pending',
				setupStatus: 'Published',
				status: 'Applied',
				avatar: 'https://placehold.co/24x24/6B7280/FFFFFF?text=I'
			},
			{
				id: 4,
				company: 'Imabong Ekemini Food Lacart',
				packageName: 'Paid',
				setupStatus: 'Draft',
				status: 'Declined',
				avatar: 'https://placehold.co/24x24/6B7280/FFFFFF?text=I'
			},
			{
				id: 5,
				company: 'Imabong Ekemini Food Lacart',
				packageName: 'Paid',
				setupStatus: 'Draft',
				status: 'Pending',
				avatar: 'https://placehold.co/24x24/6B7280/FFFFFF?text=I'
			},
			{
				id: 6,
				company: 'Imabong Ekemini Food Lacart',
				packageName: 'Paid',
				setupStatus: 'Draft',
				status: 'Live',
				avatar: 'https://placehold.co/24x24/6B7280/FFFFFF?text=I'
			},
			{
				id: 7,
				company: 'Imabong Ekemini Food Lacart',
				packageName: 'Paid',
				setupStatus: 'Draft',
				status: 'Manual Add',
				avatar: 'https://placehold.co/24x24/6B7280/FFFFFF?text=I'
			}
		]
	};

	// Function to search exhibitors
	const searchExhibitors = (event: any) => {
		console.log('Searching exhibitors:', event.target.value);
		// In a real app, this would filter the exhibitors list
	};

	// Function to handle actions for each exhibitor
	const handleActions = (exhibitorId: number) => {
		console.log('Handling actions for exhibitor:', exhibitorId);
		// In a real app, this would open a dropdown menu with options
	};

	// Function to change exhibitor status
	const changeStatus = (exhibitorId: number, newStatus: string) => {
		console.log('Changing status for exhibitor:', exhibitorId, 'to', newStatus);
		// In a real app, this would update the exhibitor's status
	};
</script>

<div class="">
	<!-- Exhibitors Section -->
	<div class="mb-6">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-4 md:flex-row">
			<div>
				<h2 class="mb-1 text-xl font-semibold">Exhibitors for Megaexe Party</h2>
				<p class="text-sm text-gray-600">
					Manage businesses showcasing their products and services at your event.
				</p>
			</div>
			<div>
				<button
					on:click={() => (showAddModal = true)}
					class="flex w-full items-center justify-center gap-2 rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800 sm:w-fit"
				>
					<Icon icon="mdi:plus" class="text-xl" />
					Add Exhibitor
				</button>
				<AddParticipant bind:open={showAddModal} participant="Exhibitor" />
			</div>
		</div>

		<!-- Search and Filters -->
		<div class="mb-4 flex flex-col justify-between lg:flex-row lg:items-center">
			<div class="relative mb-4 w-full max-w-xl">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search speakers by name, session, or status..."
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

				<button
					class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
				>
					<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
					Status
				</button>
				<button
					class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
				>
					<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
					Digital Booth Status
				</button>
			</div>
		</div>

		<!-- Exhibitors List -->
		{#each eventData.exhibitors as exhibitor}
			{@const styling = getStatusStyle(exhibitor.status)}
			<div class="mb-2 rounded-lg bg-white p-4">
				<div class="flex items-end justify-between md:items-start lg:items-center">
					<div class="flex flex-wrap gap-2 md:flex-row md:items-center md:gap-5">
						<div class="flex items-center gap-2">
							<img src={exhibitor.avatar} alt={exhibitor.company} class="h-8 w-8 rounded-full" />
							<div class="font-medium">{exhibitor.company}</div>
						</div>

						<div class="flex items-center gap-2">
							<div class="text-sm text-[#B6B7B7]">{exhibitor.packageName}</div>
							<div class="text-sm text-gray-600">{exhibitor.setupStatus}</div>
						</div>
					</div>

					<div class="flex flex-col items-end gap-2 lg:flex-row lg:items-center">
						<span
							class="rounded-[11px] px-2 py-1 text-xs"
							style="background: {styling.bg}; color: {styling.text}"
						>
							{exhibitor.status}
						</span>

						<div class="group relative">
							<button
								on:click={() => handleActions(exhibitor.id)}
								class="rounded p-1 hover:bg-gray-100"
							>
								<Icon icon="mdi:dots-horizontal" class="h-5 w-5 text-gray-500" />
							</button>

							<!-- Actions Dropdown (hidden by default) -->
							<!-- <div
									class="absolute right-0 z-10 mt-1 hidden rounded-md border border-gray-200 bg-white shadow-lg group-hover:block"
								>
									<div class="py-1">
										<button
											on:click={() => changeStatus(exhibitor.id, 'Approved')}
											class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
										>
											Mark as Approved
										</button>
										<button
											on:click={() => changeStatus(exhibitor.id, 'Invited')}
											class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
										>
											Mark as Invited
										</button>
										<button
											on:click={() => changeStatus(exhibitor.id, 'Applied')}
											class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
										>
											Mark as Applied
										</button>
										<button
											on:click={() => changeStatus(exhibitor.id, 'Declined')}
											class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
										>
											Mark as Declined
										</button>
										<button
											on:click={() => changeStatus(exhibitor.id, 'Pending')}
											class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
										>
											Mark as Pending
										</button>
										<button
											on:click={() => changeStatus(exhibitor.id, 'Live')}
											class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
										>
											Mark as Live
										</button>
										<button
											on:click={() => changeStatus(exhibitor.id, 'Manual Add')}
											class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
										>
											Mark as Manual Add
										</button>
										<div class="my-1 border-t border-gray-200"></div>
										<button
											on:click={() => console.log('Edit exhibitor:', exhibitor.id)}
											class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
										>
											Edit Exhibitor
										</button>
										<button
											on:click={() => console.log('Delete exhibitor:', exhibitor.id)}
											class="block w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
										>
											Delete Exhibitor
										</button>
									</div>
								</div> -->
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
