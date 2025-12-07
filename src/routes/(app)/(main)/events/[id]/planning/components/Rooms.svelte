<script>
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';

	let searchQuery = '';
	let showAddModal = false;
	let showFilter = false;
	let showStatus = false;

	export const rooms = [
		{
			id: 'main-stage',
			name: 'Main Stage',
			status: 'Active',
			statusColor: 'bg-green-100 text-green-700',
			sessions: 3,
			accessType: 'Public',
			accessIcon: 'mdi:web',
			restricted: false,
			communityChat: true
		},
		{
			id: 'breakout-1',
			name: 'Breakout Room 1',
			status: 'Draft',
			statusColor: 'bg-gray-200 text-gray-700',
			sessions: 3,
			accessType: 'Restricted',
			accessIcon: 'mdi:eye-off-outline',
			restricted: true,
			communityChat: false
		},
		{
			id: 'networking',
			name: 'Networking Lounge',
			status: 'Inactive',
			statusColor: 'bg-yellow-100 text-yellow-700',
			sessions: 3,
			accessType: 'Public',
			accessIcon: 'mdi:web',
			restricted: false,
			communityChat: false
		}
	];
</script>

<div>
	<div class="mb-6">
		<!-- Section Header -->
		<div
			class="relative mb-6 flex flex-col justify-between gap-3 rounded-lg border-3 border-dashed p-4 lg:flex-row lg:items-center lg:pr-10"
		>
			<div class="space-y-3">
				<h2 class="text-xl font-semibold text-gray-600">Add Room</h2>
				<p class="max-w-[70%] text-sm text-gray-400">
					Set up and manage the virtual or physical spaces where your event will take place.
				</p>
				<button
					class="flex items-center gap-2 rounded-lg bg-[#EBECED] px-4 py-2 text-sm text-black"
				>
					<Icon icon="mdi:plus" class="text-xl" />
					Create New Room
				</button>
			</div>

			<img src="/rooms.svg" alt="" class="w-50" />

			<button
				class="absolute top-2 right-2 flex h-[29px] w-[29px] items-center justify-center rounded-full bg-[#EBECED] text-[#616265]"
			>
				<Icon icon="mdi:close" class="text-xl" />
			</button>
		</div>

		<div class="mb-4 flex flex-wrap items-center justify-between gap-4 md:flex-row">
			<div>
				<h2 class="mb-1 text-xl font-semibold">Event Rooms for Megaexe Party</h2>
				<p class="text-sm text-[#8C8F93]">
					Set up and manage the virtual or physical spaces where your event will take place.
				</p>
			</div>
			<div>
				<button
					on:click={() => (showAddModal = true)}
					class="flex w-full items-center justify-center gap-2 rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800 sm:w-fit"
				>
					<Icon icon="mdi:plus" class="text-xl" />
					Create New Session
				</button>
				<!-- <AddParticipant bind:open={showAddModal} participant="Speaker" /> -->
			</div>
		</div>

		<!-- Search and Filters -->
		<div class="mb-4 flex flex-col justify-between lg:flex-row lg:items-center">
			<div class="relative mb-4 w-full max-w-xl">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search room by name..."
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
						Community Chat
					</button>
					<!-- <Status bind:open={showStatus} participant="speaker" /> -->
				</div>
				<div use:clickOutside={() => (showFilter = false)} class="relative">
					<button
						on:click={() => (showFilter = !showFilter)}
						class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
					>
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
						Access
					</button>
					<!-- <Filter bind:open={showFilter} participant="speaker" /> -->
				</div>
			</div>
		</div>

		{#if rooms.length > 0}
			<div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
				{#each rooms as room}
					<div class="relative rounded-xl border bg-white p-6 shadow-sm">
						<!-- Status badge -->
						<span
							class="absolute top-4 left-4 rounded-full px-2 py-1 text-xs font-medium
      {room.statusColor}"
						>
							{room.status}
						</span>

						<!-- 3-dot menu -->
						<button class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
							<Icon icon="mdi:dots-horizontal" class="h-5 w-5 text-gray-500" />
						</button>

						<!-- Room name -->
						<h3 class="mt-10 text-2xl font-semibold">{room.name}</h3>

						<!-- Sessions count -->
						<div class="mt-1 flex items-center gap-2 text-sm text-gray-500">
							<img src="/task-square.svg" alt="" />
							{room.sessions} Sessions
						</div>

						<!-- Footer info -->
						<div
							class="mt-6 flex flex-col justify-between gap-2 border-t pt-6 md:flex-row md:items-center"
						>
							<!-- Access -->
							<div class="flex items-center justify-between gap-2 text-sm text-gray-600 md:justify-normal">
								<span class="font-medium">Access:</span>
								<div class="flex items-center gap-2 rounded-xl bg-gray-100 px-2 py-1.5">
									<span class="flex items-center gap-1">
										<Icon icon={room.accessIcon} class="text-xl" />
										{room.accessType}
									</span>
									<img src="/arrow-left.svg" alt="" class="rotate-90 transform" />
								</div>
							</div>

							<!-- Community Chat toggle -->
							<div class="flex items-center justify-between gap-2 text-sm text-gray-600 md:justify-normal">
								<span>Community Chat</span>

								<!-- Switch -->
								<label class="relative inline-flex cursor-pointer items-center">
									<input type="checkbox" class="peer sr-only" checked={room.communityChat} />
									<div
										class="peer h-6 w-10 rounded-full bg-gray-200 transition-all
            peer-checked:bg-black peer-focus:ring-offset-1"
									></div>
									<span
										class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow
            transition peer-checked:translate-x-4"
									></span>
								</label>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<!-- Empty state -->
			<div class="flex h-70 flex-col items-center justify-center">
				<img src="/planning.svg" alt="" class="h-40" />
				<p class="mt-2 text-lg font-medium text-[#A2ACB2]">No Room added, yet</p>
				<p class="mt-1 text-sm text-gray-400">Rooms will display when they are added</p>
			</div>
		{/if}
	</div>
</div>
