<script lang="ts">
	import { getStatusStyle } from '$lib/utils/statusStyle';
	import Icon from '@iconify/svelte';
	import { clickOutside } from '$lib/utils/constant';

	let searchQuery = '';
	let showActionModal: number | null = null;

	// Mock data for accepted collaborations
	const collaborations = [
		{
			id: 1,
			organizerName: 'John Odoemenem',
			organizerEmail: 'johnmedoc23@gmail.com',
			eventName: 'Megaexe Award Ceremony',
			serviceProduct: 'Event Photography',
			agreedPrice: '$2,500',
			startDate: 'Dec 15, 2024',
			endDate: 'Dec 16, 2024',
			status: 'Confirmed'
		},
		{
			id: 2,
			organizerName: 'Innocent Tamunosiki',
			organizerEmail: 'tamunosiki@gmail.com',
			eventName: 'Design Hangout',
			serviceProduct: 'Catering Services',
			agreedPrice: '$1,800',
			startDate: 'Jan 10, 2025',
			endDate: 'Jan 10, 2025',
			status: 'In Progress'
		},
		{
			id: 3,
			organizerName: 'Sarah Johnson',
			organizerEmail: 'sarah@example.com',
			eventName: 'Tech Conference 2025',
			serviceProduct: 'AV Equipment Rental',
			agreedPrice: '$3,200',
			startDate: 'Feb 5, 2025',
			endDate: 'Feb 7, 2025',
			status: 'Fulfilled'
		},
		{
			id: 4,
			organizerName: 'Mike Anderson',
			organizerEmail: 'mike@example.com',
			eventName: 'Corporate Gala',
			serviceProduct: 'Venue Decoration',
			agreedPrice: '$4,500',
			startDate: 'Mar 20, 2025',
			endDate: 'Mar 21, 2025',
			status: 'Canceled'
		}
	];
</script>

<div class="">
	<!-- Header Section -->
	<div class="mb-6">
		<div class="mb-4">
			<h2 class="mb-1 text-xl font-semibold">Accepted Collaborations</h2>
			<p class="text-sm text-[#8C8F93]">Manage your confirmed bookings and ongoing projects.</p>
		</div>

		<!-- Search and Filters -->
		<div class="mb-4 flex flex-col justify-between lg:flex-row lg:items-center">
			<div class="relative mb-4 w-full max-w-xl">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search by organizer name, event name, or status..."
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
					<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
				</button>
			</div>
		</div>

		{#if collaborations?.length > 0}
			<!-- Collaborations List -->
			{#each collaborations as collab}
				{@const styling = getStatusStyle(collab.status)}
				<div class="mb-2 rounded-lg bg-white p-4">
					<div class="grid grid-cols-12 items-center gap-3">
						<!-- Organizer Name & Email - 2 cols -->
						<div class="col-span-2 flex items-center gap-2">
							<img src="/face-1.svg" alt={collab.organizerName} class="h-8 w-8 flex-shrink-0 rounded-full" />
							<div class="min-w-0 flex-1">
								<div class="truncate font-medium" title={collab.organizerName}>{collab.organizerName}</div>
								<div class="truncate text-xs text-gray-500" title={collab.organizerEmail}>{collab.organizerEmail}</div>
							</div>
						</div>

						<!-- Event Name - 2 cols -->
						<div class="col-span-2">
							<div class="truncate text-sm text-gray-600" title={collab.eventName}>{collab.eventName}</div>
						</div>

						<!-- Service/Product - 2 cols -->
						<div class="col-span-2">
							<div class="truncate text-sm text-[#B6B7B7]" title={collab.serviceProduct}>{collab.serviceProduct}</div>
						</div>

						<!-- Agreed Price - 1 col -->
						<div class="col-span-1">
							<div class="text-sm font-medium text-green-600">{collab.agreedPrice}</div>
						</div>

						<!-- Start Date - 1 col -->
						<div class="col-span-1">
							<div class="truncate text-xs text-gray-400" title={collab.startDate}>{collab.startDate}</div>
						</div>

						<!-- End Date - 1 col -->
						<div class="col-span-1">
							<div class="truncate text-xs text-gray-400" title={collab.endDate}>{collab.endDate}</div>
						</div>

						<!-- Status & Actions - 3 cols -->
						<div class="col-span-3 flex items-center justify-end gap-2">
							<span
								class="flex-shrink-0 rounded-[11px] px-2 py-1 text-xs"
								style="background: {styling.bg}; color: {styling.text}"
							>
								{collab.status}
							</span>

							<div
								class="group relative flex-shrink-0"
								use:clickOutside={() => {
									if (showActionModal === collab.id) showActionModal = null;
								}}
							>
								<button
									on:click={() =>
										(showActionModal = showActionModal === collab.id ? null : collab.id)}
									class="rounded p-1 hover:bg-gray-100"
								>
									<Icon icon="mdi:dots-horizontal" class="h-5 w-5 text-gray-500" />
								</button>

								{#if showActionModal === collab.id}
									<div
										class="absolute top-8 right-0 z-10 w-48 rounded-md border bg-white py-1 shadow-lg"
									>
										<button
											class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-100"
										>
											<Icon icon="mdi:eye" class="text-blue-600" />
											View Details
										</button>
										<button
											class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-100"
										>
											<Icon icon="mdi:message" class="text-gray-600" />
											Message Organizer
										</button>
										<button
											class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-100"
										>
											<Icon icon="mdi:check-circle" class="text-green-600" />
											Mark as Fulfilled
										</button>
										<button
											class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-100"
										>
											<Icon icon="mdi:cancel" class="text-red-600" />
											Cancel Collaboration
										</button>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/each}
		{:else}
			<div class="flex h-50 flex-col items-center justify-center">
				<img src="/participants.svg" alt="" class="h-60" />
				<p class="mt-2 font-medium text-[#A2ACB2]">No accepted collaborations yet</p>
				<p class="text-sm text-gray-400">Accepted collaborations will appear here</p>
			</div>
		{/if}
	</div>
</div>
