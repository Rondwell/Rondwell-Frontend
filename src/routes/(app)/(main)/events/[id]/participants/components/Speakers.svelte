<!-- src/routes/event/speakers/+page.svelte -->
<script lang="ts">
	import { getStatusStyle } from '$lib/utils/statusStyle';
	import Icon from '@iconify/svelte';
	import AddParticipant from './modal/AddParticipant.svelte';
	import Filter from './modal/Filter.svelte';
	import Status from './modal/Status.svelte';
	import { clickOutside } from '$lib/utils/constant';
	import Dropdown from './modal/Dropdown.svelte';
	import ProfileDetail from './modal/ProfileDetail.svelte';

	let searchQuery = '';
	let showAddModal = false;
	let showProfile = false;
	let showFilter = false;
	let showStatus = false;
	let showActionModal: number | null = null;
	let buttonEl: HTMLElement;

	// Mock data for speakers
	const eventData = {
		title: 'Megaexe Party',
		collection: 'John Collection',
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

	function handleSaveSpeaker(speaker: string) {
		console.log('Saved speaker:', speaker);
		// Update your speaker data or send to API
	}

	function handleSendMessage(speakerId: string) {
		console.log('Sending message to speaker ID:', speakerId);
		// Implement messaging functionality
	}

	function handleManageSession(sessionId: string) {
		console.log('Managing session ID:', sessionId);
		// Implement session management
	}
</script>

<div class="">
	<!-- Speakers Section -->
	<div class="mb-6">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-4 md:flex-row">
			<div>
				<h2 class="mb-1 text-xl font-semibold">Speakers for Megaexe Party</h2>
				<p class="text-sm text-[#8C8F93]">
					Manage your event's speakers, their profiles, and session assignments.
				</p>
			</div>
			<div>
				<button
					on:click={() => (showAddModal = true)}
					class="flex w-full items-center justify-center gap-2 rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800 sm:w-fit"
				>
					<Icon icon="mdi:plus" class="text-xl" />
					Add Speaker
				</button>
				<AddParticipant bind:open={showAddModal} participant="Speaker" />
			</div>
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
					<Status bind:open={showStatus} participant="speaker" />
				</div>
				<div use:clickOutside={() => (showFilter = false)} class="relative">
					<button
						on:click={() => (showFilter = !showFilter)}
						class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
					>
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
						Has Session
					</button>
					<Filter bind:open={showFilter} participant="speaker" />
				</div>
			</div>
		</div>

		{#if eventData?.speakers?.length > 0}
			<!-- Speakers List -->
			{#each eventData.speakers as speaker}
				{@const styling = getStatusStyle(speaker.status)}
				<div class="mb-2 rounded-lg bg-white p-4">
					<div class="flex items-start justify-between lg:items-center">
						<button
							class="flex flex-wrap gap-2 md:flex-row md:items-center md:gap-5"
							on:click={() => (showProfile = true)}
						>
							<div class="flex items-center gap-2">
								<img src={speaker.profile} alt={speaker.name} class="h-8 w-8 rounded-full" />
								<div class="font-medium">{speaker.name}</div>
							</div>
							<div class="flex items-start flex-col gap-2 md:flex-row md:items-center">
								<div
									class="max-w-[200px] truncate text-sm text-[#B6B7B7] md:max-w-[150px] lg:max-w-[250px]"
								>
									{speaker.title}
								</div>
								<div class="text-sm text-gray-600">{speaker.sessions}</div>
							</div>
						</button>

						<div class="flex flex-col items-end gap-2 lg:flex-row lg:items-center">
							<span
								class="rounded-[11px] px-2 py-1 text-xs"
								style="background: {styling.bg}; color: {styling.text}"
							>
								{speaker.status}
							</span>

							<div
								class="group relative"
								bind:this={buttonEl}
								use:clickOutside={() => {
									if (showActionModal === speaker.id) showActionModal = null;
								}}
							>
								<button
									on:click={() =>
										(showActionModal = showActionModal === speaker.id ? null : speaker.id)}
									class="rounded p-1 hover:bg-gray-100"
								>
									<Icon icon="mdi:dots-horizontal" class="h-5 w-5 text-gray-500" />
								</button>
								<Dropdown open={showActionModal === speaker.id} {buttonEl} participant="speaker" />
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

<ProfileDetail
	bind:open={showProfile}
	participant="Speaker"
	on:save={() => handleSaveSpeaker}
	on:sendMessage={() => handleSendMessage}
	on:manageSession={() => handleManageSession}
	on:close={() => (showProfile = false)}
/>
