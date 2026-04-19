<script lang="ts">
	import { page } from '$app/stores';
	import { getEventSpeakers } from '$lib/services/event.services';
	import { clickOutside } from '$lib/utils/constant';
	import { getStatusStyle } from '$lib/utils/statusStyle';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import AddParticipant from './modal/AddParticipant.svelte';
	import Dropdown from './modal/Dropdown.svelte';
	import Filter from './modal/Filter.svelte';
	import ProfileDetail from './modal/ProfileDetail.svelte';
	import Status from './modal/Status.svelte';

	export let eventTitle = '';

	$: eventId = $page.params.id;

	let searchQuery = '';
	let showAddModal = false;
	let showProfile = false;
	let showFilter = false;
	let showStatus = false;
	let showActionModal: string | null = null;
	let buttonEl: HTMLElement;
	let selectedSpeaker: any = null;

	let speakers: any[] = [];
	let loading = true;
	let statusFilter = 'All';
	let sessionFilter = 'All';

	async function loadSpeakers() {
		if (!eventId) return;
		loading = true;
		try {
			const filters: any = {};
			if (statusFilter !== 'All') filters.status = statusFilter;
			if (searchQuery) filters.search = searchQuery;
			if (sessionFilter !== 'All') filters.hasSession = sessionFilter;
			speakers = await getEventSpeakers(eventId, filters);
		} catch (e) {
			console.error('Failed to load speakers:', e);
			speakers = [];
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadSpeakers();
	});

	// Debounced search
	let searchTimeout: ReturnType<typeof setTimeout>;
	$: {
		if (searchQuery !== undefined) {
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(() => {
				loadSpeakers();
			}, 400);
		}
	}

	function getDisplayName(speaker: any): string {
		return speaker.displayName || speaker.applicationDetails?.contactEmail || 'Unknown Speaker';
	}

	function getBioSnippet(speaker: any): string {
		const bio = speaker.bio || speaker.applicationDetails?.bio || '';
		return bio.length > 60 ? bio.substring(0, 60) + '...' : bio;
	}

	function getSessionCount(speaker: any): string {
		const sessions = speaker.assignedSessions || [];
		if (sessions.length === 0) return 'None';
		return `${sessions.length} Session${sessions.length > 1 ? 's' : ''}`;
	}

	function getStatusLabel(status: string): string {
		const map: Record<string, string> = {
			INVITED: 'Invited',
			ACCEPTED: 'Accepted',
			CONFIRMED: 'Confirmed',
			DECLINED: 'Declined',
			MANUAL_ADD: 'Manual Add',
			APPROVED: 'Confirmed',
			APPLIED: 'Applied',
		};
		return map[status] || status;
	}

	function openProfile(speaker: any) {
		selectedSpeaker = speaker;
		showProfile = true;
	}

	function handleSpeakerAdded() {
		showAddModal = false;
		loadSpeakers();
	}

	function handleSpeakerUpdated() {
		loadSpeakers();
	}
</script>

<div class="">
	<!-- Speakers Section -->
	<div class="mb-6">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-4 md:flex-row">
			<div>
				<h2 class="mb-1 text-xl font-semibold">Speakers for {eventTitle || 'Event'}</h2>
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
				<AddParticipant bind:open={showAddModal} participant="Speaker" {eventId} {eventTitle} on:added={handleSpeakerAdded} />
			</div>
		</div>

		<!-- Search and Filters -->
		<div class="mb-4 flex flex-col justify-between gap-2 lg:flex-row lg:items-center">
			<div class="relative mb-4 w-full max-w-sm lg:mb-0">
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
					<Status bind:open={showStatus} participant="speaker" on:select={(e) => { statusFilter = e.detail; loadSpeakers(); showStatus = false; }} />
				</div>
				<div use:clickOutside={() => (showFilter = false)} class="relative">
					<button
						on:click={() => (showFilter = !showFilter)}
						class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
					>
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
						Has Session
					</button>
					<Filter bind:open={showFilter} participant="speaker" on:select={(e) => { sessionFilter = e.detail; loadSpeakers(); showFilter = false; }} />
				</div>
			</div>
		</div>

		{#if loading}
			<div class="space-y-2">
				{#each [1, 2, 3] as _}
					<div class="mb-2 animate-pulse rounded-lg bg-white p-4">
						<div class="flex items-center gap-4">
							<div class="h-8 w-8 rounded-full bg-gray-200"></div>
							<div class="h-4 w-32 rounded bg-gray-200"></div>
							<div class="h-3 w-48 rounded bg-gray-200"></div>
							<div class="ml-auto h-6 w-20 rounded-full bg-gray-200"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if speakers.length > 0}
			<!-- Speakers List -->
			{#each speakers as speaker}
				{@const statusLabel = getStatusLabel(speaker.status)}
				{@const styling = getStatusStyle(statusLabel)}
				<div class="mb-2 rounded-lg bg-white p-4">
					<div class="flex items-start justify-between lg:items-center">
						<button
							class="flex flex-wrap gap-2 md:flex-row md:items-center md:gap-5"
							on:click={() => openProfile(speaker)}
						>
							<div class="flex items-center gap-2">
								{#if speaker.profilePictureUrl}
									<img src={speaker.profilePictureUrl} alt={getDisplayName(speaker)} class="h-8 w-8 rounded-full object-cover" />
								{:else}
									<div class="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-600">
										{getDisplayName(speaker).charAt(0).toUpperCase()}
									</div>
								{/if}
								<div class="font-medium">{getDisplayName(speaker)}</div>
							</div>
							<div class="flex items-start flex-col gap-2 md:flex-row md:items-center">
								<div
									class="max-w-[200px] truncate text-sm text-[#B6B7B7] md:max-w-[150px] lg:max-w-[250px]"
								>
									{getBioSnippet(speaker)}
								</div>
								<div class="text-sm text-gray-600">{getSessionCount(speaker)}</div>
							</div>
						</button>

						<div class="flex flex-col items-end gap-2 lg:flex-row lg:items-center">
							<span
								class="rounded-[11px] px-2 py-1 text-xs"
								style="background: {styling.bg}; color: {styling.text}"
							>
								{statusLabel}
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
								<Dropdown
									open={showActionModal === speaker.id}
									{buttonEl}
									participant="speaker"
									speakerData={speaker}
									{eventId}
									{eventTitle}
									on:updated={handleSpeakerUpdated}
								/>
							</div>
						</div>
					</div>
				</div>
			{/each}
		{:else}
			<div class="flex h-50 flex-col items-center justify-center">
				<img src="/participants.svg" alt="" class="h-40" />
				<p class="-mt-2 font-medium text-[#A2ACB2]">No Speakers added, yet</p>
				<p class="text-sm text-gray-400">Speakers will display when they are added</p>
			</div>
		{/if}
	</div>
</div>

{#if selectedSpeaker}
	<ProfileDetail
		bind:open={showProfile}
		participant="Speaker"
		speakerData={selectedSpeaker}
		{eventId}
		{eventTitle}
		on:save={handleSpeakerUpdated}
		on:close={() => { showProfile = false; selectedSpeaker = null; }}
	/>
{/if}
