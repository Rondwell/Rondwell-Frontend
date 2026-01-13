	<script lang="ts">
	import Icon from '@iconify/svelte';

	let searchQuery = '';

export const speakers  = [
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

		const handleStatus: any = {
		confirm: {
			label: 'Confirm',
			color: 'bg-green-100 text-green-700'
		},
        approved: {
			label: 'Approved',
			color: 'bg-green-100 text-green-700'
		},
		invited: {
			label: 'Invited',
			color: 'bg-blue-100 text-blue-700'
		},
		decline: {
			label: 'Decline',
			color: 'bg-red-100 text-red-700'
		},
		applied:{
			label: 'Applied',
			color: 'bg-orange-100 text-orange-700'
		},
		live:{
			label: 'Live',
			color: 'bg-cyan-100 text-cyan-700'
		},
		pending:{
			label: 'Pending',
			color: 'bg-yellow-100 text-yellow-700'
		},
		accepted: {
			label: 'Accepted',
			color: 'bg-amber-100 text-amber-700'
		},
		manual: {
			label: 'Manual Add',
			color: 'bg-gray-100 text-gray-700'
		}
	};

	
</script>
    
    <!-- Speaker Section -->
		<div class="mt-6">
				<div class="mb-8 flex flex-wrap items-center justify-between gap-4 md:flex-row">
			<div>
				<h2 class="mb-1 text-xl font-semibold">Speakers for Megaexe Party </h2>
				<p class="text-sm text-[#8C8F93]">
				Manage your event's speakers, their profiles, and session assignments.
				</p>
			</div>
			<div>
				<button
					
					class="flex w-full items-center justify-center gap-2 rounded-md bg-black px-5 py-2 font-medium text-white text-sm transition-colors hover:bg-gray-800 sm:w-fit"
				>
					<Icon icon="mdi:plus" class="text-xl" />
					Add Speaker
				</button>
				<!-- <AddParticipant bind:open={showAddModal} participant="Speaker" /> -->
			</div>
		</div>

		<!-- Search Bar -->
		<div class="mb-6 flex flex-col justify-between lg:flex-row lg:items-center">
			<div class="mb-4 md:mb-0 relative w-full max-w-xl">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search speakers by name, session, or status..."
					class="h-9 w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-gray-500 focus:ring-0 focus:outline-none"
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
						class="flex flex-col justify-between gap-3 border-[0.75px] mb-[11px] px-4 py-3 lg:flex-row lg:items-center rounded-xl bg-white"
					>
						<!-- Icon + Title -->
						<div class="flex items-center gap-3">
							<img src={s.avatar} alt="${s.name} avater" class="h-7 w-7" />
							<div class="font-medium">{s.name}</div>
						</div>

						<div class="text-gray-500 text-left">{s.profile}</div>
						<div class="w-40 text-[#131517] font-base">{s.sessionNum} Session </div>
						

						<div class="flex items-center justify-between gap-3">
							<!-- STATUS BADGE -->
							<span
								class="rounded-full px-3 py-1 text-xs font-medium
									{handleStatus[s.status].color}"
							>
								{handleStatus[s.status].label}
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