<script lang="ts">
	import { handleStatus } from '$lib/utils/handleParticipantStatus';
	import Icon from '@iconify/svelte';
	import AddParticipant from '../../../../events/[id]/participants/components/modal/AddParticipant.svelte';

	let searchQuery = '';
	let showAddModal = false;

	export const speakers = [
		{
			id: 1,
			name: 'Dr. Bellamy N',
			avatar: '/user1-icon.svg',
			role: 'Speaker',
			sessionNum: 3,
			roomNum: 4,
		},
		{
			id: 2,
			name: 'Dr. Bellamy N',
			avatar: '/user2-icon.svg',
			role: 'speaker',
			sessionNum: 2,
			roomNum: 4,
		},
		{
			id: 3,
			name: 'Imabong Ekemini',
			avatar: '/user3-icon.svg',
			role: 'Speaker',
			sessionNum: 1,
			roomNum: 4,
		},
		{
			id: 4,
			name: 'Imabong Ekemini',
			avatar: '/user2-icon.svg',
			role: 'Speaker',
			sessionNum: 0,
			roomNum: 4,
		},
		{
			id: 5,
			name: 'Imabong Ekemini',
			avatar: '/face.svg',
			role: 'Speaker',
			sessionNum: 3,
			roomNum: 4,
		}
	];
</script>

<!-- Speaker Section -->
<div class="mt-6 min-w-0">
	<div class="mb-8 flex flex-wrap items-center justify-between gap-4 md:flex-row">
		<div>
			<h2 class="mb-1 text-xl font-semibold">
				Speakers for Megaexe Party
			</h2>
			<p class="text-sm text-[#8C8F93]">
				Manage your event's speakers, their profiles, and session assignments.
			</p>
		</div>

		<div>
			<button
				on:click={() => (showAddModal = true)}
				class="flex w-full items-center justify-center gap-2 rounded-md bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 sm:w-fit"
			>
				<Icon icon="mdi:plus" class="text-xl" />
				Add Speaker
			</button>
			<AddParticipant bind:open={showAddModal} participant="Speaker" />

		</div>
	</div>

	<!-- Search Bar -->
	<div class="mb-6 flex flex-col justify-between lg:flex-row lg:items-center">
		<div class="relative mb-4 w-full max-w-xl lg:mb-0">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search speakers by name, session, or status..."
				class="h-9 w-full rounded-lg bg-white py-2 pl-10 pr-4 text-gray-500 focus:outline-none focus:ring-0"
			/>
			<span class="absolute left-3 top-2.5 text-gray-400">
				<img
					src="/search-favorite.png"
					alt="search icon"
					class="h-5 w-5"
				/>
			</span>
		</div>

		<div class="flex items-center gap-1">
			<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]">
				<img src="/download-icon.svg" alt="download icon" />
			</div>

			<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]">
				<img src="/export.svg" alt="export icon" />
			</div>

			<button
				class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
			>
				<Icon icon="mdi:plus" class="h-5 w-5" />
				Status
			</button>

			<button
				class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
			>
				<Icon icon="mdi:plus" class="h-5 w-5" />
				Has Session
			</button>
		</div>
	</div>

	<!-- Speakers Grid -->
	{#if speakers.length > 0}
		<div
			class="grid grid-flow-col auto-cols-[minmax(160.92px,max-content)] gap-5 overflow-x-auto grid-rows-2 md:grid-rows-1 custom-scrollbar min-w-0"
		>
			{#each speakers as s}
				<div
					class="flex flex-col items-center justify-center gap-[19px] rounded-[20px] border border-[#EBECED] bg-white py-5 px-3 min-w-[160.92px]"
				> 
					<img
						src={s.avatar}
						alt="{s.name} avatar"
						class="size-19.5 rounded-full aspect-square"
					/>

					<div class="text-center flex flex-col items-center gap-[5px]">
						<h2 class="text-[#222B45] text-base font-normal">
							{s.name}
						</h2>
						<p class="text-[#6B779A] text-xs font-normal capitalize">
							{s.role}
						</p>

						<div class="inline-flex items-center gap-1 text-[10px] font-normal text-[#6B779A]">
							<span>{s.roomNum} Rooms</span>
							<span>|</span>
							<span>{s.sessionNum} Session</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Empty state -->
		<div class="flex h-70 flex-col items-center justify-center">
			<img src="/planning.svg" alt="" class="h-40" />
			<p class="mt-2 text-lg font-medium text-[#A2ACB2]">
				No Speaker added, yet
			</p>
			<p class="mt-1 text-sm text-gray-400">
				Speakers will display when they are added
			</p>
		</div>
	{/if}
</div>
