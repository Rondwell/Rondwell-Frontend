<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';

	let searchQuery = '';
	let showAddModal = false;
	let showFilter = false;
	let showStatus = false;

	const sessionStatus: any = {
		workshop: {
			label: 'Workshop',
			color: 'bg-blue-100 text-blue-700'
		},
		keynote: {
			label: 'Keynote',
			color: 'bg-green-100 text-green-700'
		},
		panel: {
			label: 'Panel',
			color: 'bg-purple-100 text-purple-700'
		}
	};

	export const sessions = [
		{
			id: 1,
			title: 'Panel Discussion',
			room: 'Main Stage',
			time: '10:00 AM – 11:00 AM',
			date: 'Mon, Aug 5',
			status: 'panel' // maps to sessionStatus.panel
		},
		{
			id: 2,
			title: 'Keynote',
			room: 'Breakout Room 1',
			time: '11:00 AM – 12:00 AM',
			date: 'Tue, Aug 6',
			status: 'keynote'
		},
		{
			id: 3,
			title: 'Workshop',
			room: 'Breakout Room 2',
			time: '12:00 AM – 01:00 AM',
			date: 'Wed, Aug 7',
			status: 'workshop'
		}
	];
</script>

<div>
	<div class="mb-6">
		<div class="mb-4 rounded-lg border p-4">
			<div class="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
				<div class="flex flex-col items-start gap-2 lg:flex-row lg:items-center">
					<img src="/get-ticket.svg" alt="get-ticket" />
					<p class="text-sm text-gray-600">
						<span class="font-medium text-black">Event Sessions.</span>
						Create and manage sessions that make up your event's agenda.
					</p>
				</div>
				<div class="flex w-full items-center gap-2 lg:w-fit">
					<button
						class="flex w-full items-center justify-center gap-1 rounded-md bg-[#EBECED] px-3 py-2 text-xs font-medium text-[#616265] transition-colors hover:bg-gray-200 md:w-fit md:text-sm"
					>
						Create New Session
					</button>
					<button>
						<Icon icon="mdi:close" class="h-4 w-4 text-gray-600" />
					</button>
				</div>
			</div>
		</div>

		<div class="mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
			<div>
				<h2 class="mb-1 text-xl font-semibold">Event Sessions for Megaexe Party</h2>
				<p class="text-sm text-[#8C8F93]">
					Organize your event's content by creating and scheduling sessions.
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
			<div class="flex items-center gap-2 mb-4">
				<div class="relative w-full max-w-xl">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search sessions by title, speaker, room, or tag..."
						class="h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none"
					/>
					<span class="absolute top-2.5 left-3 text-gray-400">
						<img src="/search-favorite.png" alt="search icon" class="h-5 w-5" />
					</span>
				</div>
				<div class="flex items-center gap-1 md:hidden">
					<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]">
						<img src="/download-icon.svg" alt="download icon" />
					</div>
					<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]">
						<img src="/export.svg" alt="export icon" />
					</div>
				</div>
			</div>

			<div class="flex items-center gap-1">
				<div class="hidden items-center gap-1 md:flex">
					<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]">
						<img src="/download-icon.svg" alt="download icon" />
					</div>
					<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]">
						<img src="/export.svg" alt="export icon" />
					</div>
				</div>

				<div use:clickOutside={() => (showStatus = false)} class="relative">
					<button
						on:click={() => (showStatus = !showStatus)}
						class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
					>
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
						Room
					</button>
					<!-- <Status bind:open={showStatus} participant="speaker" /> -->
				</div>
				<div use:clickOutside={() => (showStatus = false)} class="relative">
					<button
						on:click={() => (showStatus = !showStatus)}
						class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
					>
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
						Speakers
					</button>
					<!-- <Status bind:open={showStatus} participant="speaker" /> -->
				</div>
				<div use:clickOutside={() => (showFilter = false)} class="relative">
					<button
						on:click={() => (showFilter = !showFilter)}
						class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
					>
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
						Session Type
					</button>
					<!-- <Filter bind:open={showFilter} participant="speaker" /> -->
				</div>
			</div>
		</div>

		{#if sessions.length > 0}
			<div class="overflow-hidden rounded-xl bg-white shadow-sm">
				{#each sessions as s}
					<div
						class="flex flex-col justify-between gap-3 border-b px-4 py-3 last:border-none lg:flex-row lg:items-center"
					>
						<!-- Icon + Title -->
						<div class="flex items-center gap-3">
							<img src="/calendar.svg" alt="" class="h-7 w-7" />
							<div class="font-medium">{s.title}</div>
						</div>

						<div class="w-40 text-gray-500">{s.room}</div>
						<div class="flex items-center justify-between gap-3">
							<div class="w-44 text-gray-500">{s.time}</div>
							<div class="w-32 text-gray-500">{s.date}</div>
						</div>

						<div class="flex items-center justify-between gap-3">
							<!-- STATUS BADGE -->
							<span
								class="rounded-full px-2 py-1 text-xs font-medium
									{sessionStatus[s.status].color}"
							>
								{sessionStatus[s.status].label}
							</span>

							<!-- Actions menu -->
							<button class="ml-4 text-gray-400 hover:text-gray-600">
								<Icon icon="mdi:dots-horizontal" class="h-5 w-5 text-gray-500" />
							</button>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<!-- Empty state -->
			<div class="flex h-70 flex-col items-center justify-center">
				<img src="/planning.svg" alt="" class="h-40" />
				<p class="mt-2 text-lg font-medium text-[#A2ACB2]">No Session added, yet</p>
				<p class="mt-1 text-sm text-gray-400">Session will display when they are added</p>
			</div>
		{/if}
	</div>
</div>
