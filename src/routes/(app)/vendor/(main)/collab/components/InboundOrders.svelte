<script lang="ts">
	import { getStatusStyle } from '$lib/utils/statusStyle';
	import Icon from '@iconify/svelte';
	import { clickOutside } from '$lib/utils/constant';

	let searchQuery = '';
	let showActionModal: number | null = null;

	// Mock data for inbound orders
	const orders = [
		{
			id: 1,
			organizerName: 'John Odoemenem',
			organizerEmail: 'johnmedoc23@gmail.com',
			eventName: 'Megaexe Award Ceremony',
			requestedService: 'Design Hangout',
			dateRequested: '12 Minutes Ago',
			status: 'Pending'
		},
		{
			id: 2,
			organizerName: 'Innocent Tamunosiki',
			organizerEmail: 'tamunosiki@gmail.com',
			eventName: 'Design Hangout',
			requestedService: 'Design Hangout',
			dateRequested: '2 hour Ago',
			status: 'Accepted'
		},
		{
			id: 3,
			organizerName: 'Innocent Tamunosiki',
			organizerEmail: 'tamunosiki@gmail.com',
			eventName: 'Design Hangout',
			requestedService: 'Design Hangout',
			dateRequested: '2 hour Ago',
			status: 'Declined'
		},
		{
			id: 4,
			organizerName: 'Innocent Tamunosiki',
			organizerEmail: 'tamunosiki@gmail.com',
			eventName: 'Design Hangout',
			requestedService: 'Design Hangout',
			dateRequested: '2 hour Ago',
			status: 'Quoted'
		}
	];
</script>

<div class="">
	<!-- Header Section -->
	<div class="mb-6">
		<div class="mb-4">
			<h2 class="mb-1 text-xl font-semibold">Inbound Order Requests</h2>
			<p class="text-sm text-[#8C8F93]">Review and respond to new requests from Organizers.</p>
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
				<button
					class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
				>
					<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
					Category
					<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
				</button>
			</div>
		</div>

		{#if orders?.length > 0}
			<!-- Orders List -->
			{#each orders as order}
				{@const styling = getStatusStyle(order.status)}
				<div class="mb-2 rounded-lg bg-white p-4">
					<div class="grid grid-cols-12 items-center gap-3">
						<!-- Organizer Name & Email - 3 cols -->
						<div class="col-span-3 flex items-center gap-2">
							<img src="/face-1.svg" alt={order.organizerName} class="h-8 w-8 flex-shrink-0 rounded-full" />
							<div class="min-w-0 flex-1">
								<div class="truncate font-medium" title={order.organizerName}>{order.organizerName}</div>
								<div class="truncate text-xs text-gray-500" title={order.organizerEmail}>{order.organizerEmail}</div>
							</div>
						</div>

						<!-- Event Name - 2 cols -->
						<div class="col-span-2">
							<div class="truncate text-sm text-gray-600" title={order.eventName}>{order.eventName}</div>
						</div>

						<!-- Requested Service - 2 cols -->
						<div class="col-span-2">
							<div class="truncate text-sm text-[#B6B7B7]" title={order.requestedService}>{order.requestedService}</div>
						</div>

						<!-- Date Requested - 2 cols -->
						<div class="col-span-2">
							<div class="text-xs text-gray-400">{order.dateRequested}</div>
						</div>

						<!-- Status & Actions - 3 cols -->
						<div class="col-span-3 flex items-center justify-end gap-2">
							<span
								class="flex-shrink-0 rounded-[11px] px-2 py-1 text-xs"
								style="background: {styling.bg}; color: {styling.text}"
							>
								{order.status}
							</span>

							<button
								class="flex-shrink-0 rounded-md bg-[#EBECED] px-3 py-1 text-xs text-[#616265] hover:bg-gray-300"
							>
								View Details
							</button>

							<div
								class="group relative flex-shrink-0"
								use:clickOutside={() => {
									if (showActionModal === order.id) showActionModal = null;
								}}
							>
								<button
									on:click={() =>
										(showActionModal = showActionModal === order.id ? null : order.id)}
									class="rounded p-1 hover:bg-gray-100"
								>
									<Icon icon="mdi:dots-horizontal" class="h-5 w-5 text-gray-500" />
								</button>

								{#if showActionModal === order.id}
									<div
										class="absolute top-8 right-0 z-10 w-48 rounded-md border bg-white py-1 shadow-lg"
									>
										<button
											class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-100"
										>
											<Icon icon="mdi:check" class="text-green-600" />
											Accept Request
										</button>
										<button
											class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-100"
										>
											<Icon icon="mdi:close" class="text-red-600" />
											Decline Request
										</button>
										<button
											class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-100"
										>
											<Icon icon="mdi:currency-usd" class="text-blue-600" />
											Send Quote
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
				<p class="mt-2 font-medium text-[#A2ACB2]">No inbound requests yet</p>
				<p class="text-sm text-gray-400">New requests from organizers will appear here</p>
			</div>
		{/if}
	</div>
</div>
