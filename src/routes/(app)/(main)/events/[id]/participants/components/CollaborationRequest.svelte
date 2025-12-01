<!-- src/routes/event/collaboration/+page.svelte -->
<script lang="ts">
	import { getStatusStyle } from '$lib/utils/statusStyle';
	import Icon from '@iconify/svelte';
	import Filter from './modal/Filter.svelte';
	import Status from './modal/Status.svelte';
	import { clickOutside } from '$lib/utils/constant';
	import RequestDetail from './modal/RequestDetail.svelte';

	let searchQuery = '';
	let showFilter = false;
	let showStatus = false;
	let showDetail: number | null = null;

	// Mock data for collaboration requests
	const eventData = {
		title: 'Megaexe Party',
		collection: 'John Collection',
		tabs: [
			{ name: 'Speakers', active: false },
			{ name: 'Exhibitors', active: false },
			{ name: 'Vendors', active: false },
			{ name: 'Collaboration Request', active: true }
		],
		collaborationRequests: [
			{
				id: 1,
				company: 'Sleekwaresandslides',
				role: 'Speaker',
				description: 'UX Designer with 5+ years of experience in fintech...',
				date: 'Oct 29, 2024',
				status: 'Accepted',
				avatar: 'https://placehold.co/24x24/FF6B6B/FFFFFF?text=S'
			},
			{
				id: 2,
				company: 'Edimas Collection',
				role: 'Exhibitor',
				description: 'UX Designer with 5+ years of experience in fintech...',
				date: 'Oct 29, 2024',
				status: 'Accepted',
				avatar: 'https://placehold.co/24x24/FF9270/FFFFFF?text=E'
			},
			{
				id: 3,
				company: 'Imabong Food Lacart',
				role: 'Vendor',
				description: 'UX Designer with 5+ years of experience in fintech...',
				date: 'Oct 29, 2024',
				status: 'Pending',
				avatar: 'https://placehold.co/24x24/6B7280/FFFFFF?text=I'
			},
			{
				id: 4,
				company: 'Imabong Lacart',
				role: 'Exhibitor',
				description: 'UX Designer with 5+ years of experience in fintech...',
				date: 'Oct 29, 2024',
				status: 'Declined',
				avatar: 'https://placehold.co/24x24/6B7280/FFFFFF?text=I'
			}
		]
	};
</script>

<div class="">
	<!-- Collaboration Requests Section -->
	<div class="mb-6">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-4 md:flex-row">
			<div>
				<h2 class="mb-1 text-xl font-semibold">Requests for Megaexe Party</h2>
				<p class="text-sm text-gray-600">
					Review and respond to all incoming proposals from Speakers, Exhibitors, and Vendors.
				</p>
			</div>
			<!-- <button
				on:click={addCollaborationRequest}
				class="flex w-full items-center justify-center gap-2 rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800 sm:w-fit"
			>
				<Icon icon="mdi:plus" class="text-xl" />
				Add Request
			</button> -->
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

				<div use:clickOutside={() => (showStatus = false)} class="relative">
					<button
						on:click={() => (showStatus = !showStatus)}
						class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
					>
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
						Status
					</button>
					<Status bind:open={showStatus} participant="cr" />
				</div>
				<div use:clickOutside={() => (showFilter = false)} class="relative">
					<button
						on:click={() => (showFilter = !showFilter)}
						class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
					>
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
						Role
					</button>
					<Filter bind:open={showFilter} participant="cr" />
				</div>
			</div>
		</div>

		<!-- Collaboration Requests List -->
		{#each eventData.collaborationRequests as request}
			{@const styling = getStatusStyle(request.status)}
			<div class="mb-2 rounded-lg bg-white p-4">
				<div class="flex flex-col justify-between gap-2 lg:flex-row lg:items-center">
					<div class="flex flex-wrap gap-2 md:flex-row md:items-center md:gap-5">
						<div class="flex items-center gap-2">
							<img src={request.avatar} alt={request.company} class="h-8 w-8 rounded-full" />
							<div class="font-medium">{request.company}</div>
							<span class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
								{request.role}
							</span>
						</div>
						<div class="flex flex-col gap-2 md:flex-row md:items-center">
							<span
								class="max-w-[200px] truncate text-sm text-[#B6B7B7] md:max-w-[150px] lg:max-w-[250px]"
								>{request.description}</span
							>
							<div class="text-sm text-gray-600">{request.date}</div>
						</div>
					</div>

					<div class="flex items-center gap-2">
						<span
							class="rounded-[11px] px-2 py-1 text-xs"
							style="background: {styling.bg}; color: {styling.text}"
						>
							{request.status}
						</span>

						<div
							class="group relative"
							use:clickOutside={() => {
								if (showDetail === request.id) showDetail = null;
							}}
						>
							<button
								on:click={() => (showDetail = showDetail === request.id ? null : request.id)}
								class="rounded-md bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300"
							>
								Review & Respond
							</button>
							<RequestDetail open={showDetail === request.id} />
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
