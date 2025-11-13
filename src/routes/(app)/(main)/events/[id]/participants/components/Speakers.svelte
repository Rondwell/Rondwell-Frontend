<!-- src/routes/event/speakers/+page.svelte -->
<script lang="ts">
	import Icon from '@iconify/svelte';

	let searchQuery = '';

	// Mock data for speakers
	const eventData = {
		title: 'Megaexe Party',
		collection: 'John Collection',
		tabs: [
			{ name: 'Speakers', active: true },
			{ name: 'Exhibitors', active: false },
			{ name: 'Vendors', active: false },
			{ name: 'Collaboration Request', active: false }
		],
		speakers: [
			{
				id: 1,
				name: 'John Odoemenem',
				profile: '/face-1.svg',
				title: 'UX Designer with 5+ years of experience in fintech...',
				sessions: '3 Sessions',
				status: 'Confirmed',
				avatar: 'https://placehold.co/24x24/FF6B6B/FFFFFF?text=J'
			},
			{
				id: 2,
				name: 'Edima Atahnasius',
				profile: '/face-1.svg',
				title: 'UX Designer with 5+ years of experience in fintech...',
				sessions: '3 Sessions',
				status: 'Invited',
				avatar: 'https://placehold.co/24x24/FF9270/FFFFFF?text=E'
			},
			{
				id: 3,
				name: 'Imabong Ekemini',
				profile: '/face-2.svg',
				title: 'UX Designer with 5+ years of experience in fintech...',
				sessions: 'None',
				status: 'Declined',
				avatar: 'https://placehold.co/24x24/6B7280/FFFFFF?text=I'
			},
			{
				id: 4,
				name: 'Imabong Ekemini',
				profile: '/face-1.svg',
				title: 'UX Designer with 5+ years of experience in fintech...',
				sessions: 'None',
				status: 'Accepted',
				avatar: 'https://placehold.co/24x24/6B7280/FFFFFF?text=I'
			},
			{
				id: 5,
				name: 'Imabong Ekemini',
				profile: '/face-2.svg',
				title: 'UX Designer with 5+ years of experience in fintech...',
				sessions: 'None',
				status: 'Manual Add',
				avatar: 'https://placehold.co/24x24/6B7280/FFFFFF?text=I'
			}
		]
	};

	// Function to add a new speaker
	const addSpeaker = () => {
		console.log('Adding new speaker...');
		// In a real app, this would open a modal or form to create a new speaker
	};

	// Function to search speakers
	const searchSpeakers = (event: any) => {
		console.log('Searching speakers:', event.target.value);
		// In a real app, this would filter the speakers list
	};

	// Function to handle actions for each speaker
	const handleActions = (speakerId: number) => {
		console.log('Handling actions for speaker:', speakerId);
		// In a real app, this would open a dropdown menu with options
	};

	// Function to change speaker status
	const changeStatus = (speakerId: number, newStatus: string) => {
		console.log('Changing status for speaker:', speakerId, 'to', newStatus);
		// In a real app, this would update the speaker's status
	};
</script>

<div class="">
	<!-- Speakers Section -->
	<div class="mb-6">
		<div class="mb-4 flex flex-col items-center justify-between gap-4 md:flex-row">
			<div>
				<h2 class="mb-1 text-xl font-semibold">Speakers for Megaexe Party</h2>
				<p class="text-sm text-[#8C8F93]">
					Manage your event's speakers, their profiles, and session assignments.
				</p>
			</div>
			<button
				on:click={addSpeaker}
				class="flex w-full items-center justify-center gap-2 rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800 md:w-fit"
			>
				<Icon icon="mdi:plus" class="text-xl" />
				Add Speaker
			</button>
		</div>

		<!-- Search and Filters -->
		<div class="mb-4 flex flex-col md:items-center justify-between md:flex-row">
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
					Has Session
				</button>
			</div>
		</div>

		{#if eventData?.speakers?.length > 0}
			<!-- Speakers List -->
			{#each eventData.speakers as speaker}
				<div class="mb-2 rounded-lg bg-white p-4">
					<div class="flex items-center justify-between">
						<div class="flex flex-col gap-2 md:flex-row md:items-center md:gap-5">
							<div class="flex items-center gap-2">
								<img src={speaker.profile} alt={speaker.name} class="h-8 w-8 rounded-full" />
								<div class="font-medium">{speaker.name}</div>
							</div>
							<div class="text-sm text-[#B6B7B7]">{speaker.title}</div>
							<div class="text-sm text-gray-600">{speaker.sessions}</div>
						</div>

						<div class="flex flex-col items-end gap-2 md:flex-row md:items-center">
							{#if speaker.status === 'Confirmed'}
								<span class="rounded-[11px] bg-[#E3F4E1] px-2 py-1 text-xs text-[#3CBD2C]">
									{speaker.status}
								</span>
							{:else if speaker.status === 'Invited'}
								<span class="rounded-[11px] bg-[#DBE4FF] px-2 py-1 text-xs text-[#003BFF]">
									{speaker.status}
								</span>
							{:else if speaker.status === 'Declined'}
								<span class="rounded-[11px] bg-[#FFECEC] px-2 py-1 text-xs text-[#FF0004]">
									{speaker.status}
								</span>
							{:else if speaker.status === 'Accepted'}
								<span class="rounded-[11px] bg-[#f2d7a6] px-2 py-1 text-xs text-[#FFA600]">
									{speaker.status}
								</span>
							{:else}
								<span class="rounded-[11px] bg-[#EBECED] px-2 py-1 text-xs text-gray-800">
									{speaker.status}
								</span>
							{/if}

							<div class="group relative">
								<button
									on:click={() => handleActions(speaker.id)}
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
											on:click={() => changeStatus(speaker.id, 'Confirmed')}
											class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
										>
											Mark as Confirmed
										</button>
										<button
											on:click={() => changeStatus(speaker.id, 'Invited')}
											class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
										>
											Mark as Invited
										</button>
										<button
											on:click={() => changeStatus(speaker.id, 'Declined')}
											class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
										>
											Mark as Declined
										</button>
										<button
											on:click={() => changeStatus(speaker.id, 'Accepted')}
											class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
										>
											Mark as Accepted
										</button>
										<button
											on:click={() => changeStatus(speaker.id, 'Manual Add')}
											class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
										>
											Mark as Manual Add
										</button>
										<div class="my-1 border-t border-gray-200"></div>
										<button
											on:click={() => console.log('Edit speaker:', speaker.id)}
											class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
										>
											Edit Speaker
										</button>
										<button
											on:click={() => console.log('Delete speaker:', speaker.id)}
											class="block w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
										>
											Delete Speaker
										</button>
									</div>
								</div> -->
							</div>
						</div>
					</div>
				</div>
			{/each}
		{:else}
			<div class="flex h-50 flex-col items-center justify-center">
				<img src="/participants.svg" alt="" class="h-60" />
				<p class="mt-2 font-medium text-[#A2ACB2]">No Speakers added, yet</p>
				<p class="text-sm text-gray-400">Speakers will display when they are added</p>
			</div>
		{/if}
	</div>
</div>
