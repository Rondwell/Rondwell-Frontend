<script lang="ts">
	import { handleStatus } from '$lib/utils/handleParticipantStatus';
	import Icon from '@iconify/svelte';

	let searchQuery = '';

	export const speakers = [
		{
			id: 1,
			name: 'John Odoemenem',
			avatar: '/user1-icon.svg',
			profile: 'UX Designer with 2+ years of experience in fintech…',
			sessionNum: 3,
			status: 'confirm' // maps to sessionStatus.panel
		},
		{
			id: 2,
			name: 'Edima Atahnasius',
			avatar: '/user2-icon.svg',
			profile: 'Product manager with 3+ years of experience in fintech…',
			sessionNum: 2,
			status: 'invited'
		},
		{
			id: 3,
			name: 'Imabong Ekemini',
			avatar: '/user3-icon.svg',
			profile: 'Software dev with 1+ years of experience in fintech…',
			sessionNum: 1,
			status: 'decline'
		},
		{
			id: 4,
			name: 'Imabong Ekemini',
			avatar: '/user2-icon.svg',
			profile: 'Software dev with 1+ years of experience in fintech…',
			sessionNum: 0,
			status: 'accepted'
		},
		{
			id: 5,
			name: 'Imabong Ekemini',
			avatar: '/face.svg',
			profile: 'Software dev with 1+ years of experience in fintech…',
			sessionNum: 3,
			status: 'manual'
		}
	];
</script>

<!-- Speaker Section -->
<div class="mt-6">
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
				class="flex w-full items-center justify-center gap-2 rounded-md bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 sm:w-fit"
			>
				<Icon icon="mdi:plus" class="text-xl" />
				Add Speaker
			</button>
		</div>
	</div>

	<!-- Search Bar -->
	<div class="mb-6 flex flex-col justify-between lg:flex-row lg:items-center">
		<div class="relative mb-4 w-full max-w-xl md:mb-0">
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

	<div class="overflow-hidden">
		{#if speakers.length > 0}
			<div class="overflow-hidden">
				{#each speakers as s}
					<div
						class="mb-[11px] flex flex-col gap-3 rounded-xl border-[0.75px] bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
					>
						<!-- Speaker -->
						<div class="flex items-center gap-3">
							<img
								src={s.avatar}
								alt="{s.name} avatar"
								class="h-7 w-7"
							/>
							<div class="font-medium">{s.name}</div>
						</div>

						<div class="text-left text-gray-500">
							{s.profile}
						</div>

						<div class="w-40 font-base text-[#131517]">
							{s.sessionNum} Session
						</div>

						<div class="flex items-center gap-3">
							<span
								class="rounded-full px-3 py-1 text-xs font-medium {handleStatus[s.status].color}"
							>
								{handleStatus[s.status].label}
							</span>

							<button class="ml-4 text-gray-400 hover:text-gray-600">
								<Icon
									icon="mdi:dots-horizontal"
									class="h-5 w-5 text-gray-500"
								/>
							</button>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<!-- Empty state -->
			<div class="flex h-70 flex-col items-center justify-center">
				<img src="/planning.svg" alt="" class="h-40" />
				<p class="mt-2 text-lg font-medium text-[#A2ACB2]">
					No Session added, yet
				</p>
				<p class="mt-1 text-sm text-gray-400">
					Session will display when they are added
				</p>
			</div>
		{/if}
	</div>
</div>
