<script lang="ts">
	import { getStatusStyle } from '$lib/utils/statusStyle';
	import Icon from '@iconify/svelte';
	import { clickOutside } from '$lib/utils/constant';

	let searchQuery = '';
	let showActionModal: number | null = null;

	// Mock data for sent requests
	const sentRequests = [
		{
			id: 1,
			organizerName: 'John Odoemenem',
			organizerEmail: 'johnmedoc23@gmail.com',
			eventName: 'Megaexe Award Ceremony',
			proposedService: 'Event Photography Package',
			dateSent: '2 Days Ago',
			status: 'Pending'
		},
		{
			id: 2,
			organizerName: 'Innocent Tamunosiki',
			organizerEmail: 'tamunosiki@gmail.com',
			eventName: 'Design Hangout',
			proposedService: 'Premium Catering Service',
			dateSent: '5 Days Ago',
			status: 'Accepted'
		},
		{
			id: 3,
			organizerName: 'Sarah Johnson',
			organizerEmail: 'sarah@example.com',
			eventName: 'Tech Conference 2025',
			proposedService: 'Full AV Setup',
			dateSent: '1 Week Ago',
			status: 'Declined'
		},
		{
			id: 4,
			organizerName: 'Mike Anderson',
			organizerEmail: 'mike@example.com',
			eventName: 'Corporate Gala',
			proposedService: 'Venue Decoration & Setup',
			dateSent: '3 Days Ago',
			status: 'Withdrawn'
		}
	];
</script>

<div class="">
	<!-- Header Section -->
	<div class="mb-6">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-4 md:flex-row">
			<div>
				<h2 class="mb-1 text-xl font-semibold">Sent Collaboration Requests</h2>
				<p class="text-sm text-[#8C8F93]">Track your proactive proposals to Organizers.</p>
			</div>
			<div>
				<button
					class="flex w-full items-center justify-center gap-2 rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800 sm:w-fit"
				>
					<Icon icon="mdi:plus" class="text-xl" />
					Send New Collaboration Request
				</button>
			</div>
		</div>

		<!-- Search and Filters -->
		<div class="mb-4 flex flex-col justify-between lg:flex-row lg:items-center">
			<div class="relative mb-4 w-full max-w-xl">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search by organizer name or event name..."
					class="h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none"
				/>
				<span class="absolute top-2.5 left-3 text-gray-400">
					<img src="/search-favorite.svg" alt="search icon" class="h-5 w-5" />
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

		{#if sentRequests?.length > 0}
			<!-- Sent Requests List -->
			{#each sentRequests as request}
				{@const styling = getStatusStyle(request.status)}
				<div class="mb-2 rounded-lg bg-white p-4">
					<div class="grid grid-cols-12 items-center gap-3">
						<!-- Organizer Name & Email - 3 cols -->
						<div class="col-span-3 flex items-center gap-2">
							<img src="/face-1.svg" alt={request.organizerName} class="h-8 w-8 flex-shrink-0 rounded-full" />
							<div class="min-w-0 flex-1">
								<div class="truncate font-medium" title={request.organizerName}>{request.organizerName}</div>
								<div class="truncate text-xs text-gray-500" title={request.organizerEmail}>{request.organizerEmail}</div>
							</div>
						</div>

						<!-- Event Name - 2 cols -->
						<div class="col-span-2">
							<div class="truncate text-sm text-gray-600" title={request.eventName}>{request.eventName}</div>
						</div>

						<!-- Proposed Service - 3 cols -->
						<div class="col-span-3">
							<div class="truncate text-sm text-[#B6B7B7]" title={request.proposedService}>{request.proposedService}</div>
						</div>

						<!-- Date Sent - 1 col -->
						<div class="col-span-1">
							<div class="text-xs text-gray-400">{request.dateSent}</div>
						</div>

						<!-- Status & Actions - 3 cols -->
						<div class="col-span-3 flex items-center justify-end gap-2">
							<span
								class="flex-shrink-0 rounded-[11px] px-2 py-1 text-xs"
								style="background: {styling.bg}; color: {styling.text}"
							>
								{request.status}
							</span>

							<button
								class="flex-shrink-0 rounded-md bg-[#EBECED] px-3 py-1 text-xs text-[#616265] hover:bg-gray-300"
							>
								View Details
							</button>

							<div
								class="group relative flex-shrink-0"
								use:clickOutside={() => {
									if (showActionModal === request.id) showActionModal = null;
								}}
							>
								<button
									on:click={() =>
										(showActionModal = showActionModal === request.id ? null : request.id)}
									class="rounded p-1 hover:bg-gray-100"
								>
									<Icon icon="mdi:dots-horizontal" class="h-5 w-5 text-gray-500" />
								</button>

								{#if showActionModal === request.id}
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
											<Icon icon="mdi:pencil" class="text-gray-600" />
											Edit Request
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
											<Icon icon="mdi:close-circle" class="text-red-600" />
											Withdraw Request
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
				<p class="mt-2 font-medium text-[#A2ACB2]">No sent requests yet</p>
				<p class="text-sm text-gray-400">Your sent collaboration requests will appear here</p>
			</div>
		{/if}
	</div>
</div>
