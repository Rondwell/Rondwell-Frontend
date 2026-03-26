<script lang="ts">
	import { getEventSpeakers, updateEventSession } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher, onMount } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let eventId = '';
	export let session: any = null;

	let speakers: any[] = [];
	let selectedSpeakerIds: string[] = [];
	let searchQuery = '';
	let loading = false;
	let saving = false;
	let error = '';

	$: if (open && session) {
		selectedSpeakerIds = (session.speakers || []).map((s: any) => s.speakerProfileId);
		loadSpeakers();
	}

	async function loadSpeakers() {
		loading = true;
		try {
			speakers = await getEventSpeakers(eventId);
		} catch { speakers = []; }
		finally { loading = false; }
	}

	function toggleSpeaker(speaker: any) {
		const id = speaker.participantProfileId || speaker._id || speaker.id;
		if (selectedSpeakerIds.includes(id)) {
			selectedSpeakerIds = selectedSpeakerIds.filter(s => s !== id);
		} else {
			selectedSpeakerIds = [...selectedSpeakerIds, id];
		}
	}

	function getSpeakerName(speaker: any): string {
		return speaker.displayName || `${speaker.firstName || ''} ${speaker.lastName || ''}`.trim() || 'Anonymous';
	}

	function getProfilePicColor(index: number): string {
		const colors = ['bg-pink-200', 'bg-orange-200', 'bg-blue-200', 'bg-purple-200', 'bg-green-200'];
		return colors[index % colors.length];
	}

	$: filteredSpeakers = speakers.filter(s => {
		if (!searchQuery) return true;
		const name = getSpeakerName(s).toLowerCase();
		return name.includes(searchQuery.toLowerCase());
	});

	async function handleAssign() {
		if (!session?.id || !eventId) return;
		saving = true; error = '';
		try {
			const speakerData = selectedSpeakerIds.map(id => {
				const speaker = speakers.find(s => (s.participantProfileId || s._id || s.id) === id);
				return {
					speakerProfileId: id,
					name: speaker ? getSpeakerName(speaker) : 'Unknown',
					isLeadSpeaker: false,
				};
			});
			await updateEventSession(eventId, session.roomId, session.id, { speakers: speakerData });
			dispatch('saved');
			open = false;
		} catch (e: any) {
			error = e.message || 'Failed to assign speakers';
		} finally {
			saving = false;
		}
	}

	function goToSpeakers() {
		window.location.href = `/events/${eventId}/participants`;
	}
</script>

{#if open && session}
	<div on:click={() => (open = false)} on:keydown={(e) => e.key === 'Escape' && (open = false)} class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-3 py-10" role="dialog" aria-modal="true" tabindex="-1">
		<div class="w-full max-w-xl overflow-hidden rounded-xl bg-[#F4F5F6] shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<div class="flex items-center gap-3">
					<button aria-label="Close" on:click={() => (open = false)}>
						<Icon icon="mdi:share-variant" class="text-lg text-gray-500 rotate-180" />
					</button>
					<p class="font-medium">Assign Speakers</p>
				</div>
				<button on:click={() => (open = false)} aria-label="Close modal">
					<Icon icon="mdi:close" class="text-lg text-gray-500" />
				</button>
			</div>

			<!-- Body -->
			<div class="custom-scrollbar max-h-[75vh] space-y-5 overflow-y-auto px-6 py-6">
				<!-- Session info -->
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
						<Icon icon="mdi:hexagon-outline" class="text-xl text-gray-400" />
					</div>
					<div>
						<p class="font-medium text-gray-900">Assign Speakers to {session.title}</p>
						<p class="text-sm text-gray-500">Select speakers to present in this session</p>
					</div>
				</div>

				{#if error}
					<p class="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
				{/if}

				<!-- Search -->
				<div>
					<label class="mb-1 text-sm font-medium text-gray-900">Search speakers</label>
					<div class="flex items-center gap-2">
						<input type="text" bind:value={searchQuery} placeholder="Search speakers..." class="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:outline-none" />
						<button on:click={goToSpeakers} class="rounded-lg bg-gray-100 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-200">Invite Speakers</button>
					</div>
				</div>

				<!-- Speaker list -->
				{#if loading}
					<p class="py-4 text-center text-sm text-gray-400">Loading speakers...</p>
				{:else if filteredSpeakers.length > 0}
					<div class="rounded-lg border border-gray-200 bg-white">
						{#each filteredSpeakers as speaker, i}
							{@const speakerId = speaker.participantProfileId || speaker._id || speaker.id}
							{@const isSelected = selectedSpeakerIds.includes(speakerId)}
							<button on:click={() => toggleSpeaker(speaker)} class="flex w-full items-center justify-between border-b border-gray-100 px-4 py-3 last:border-none hover:bg-gray-50 {isSelected ? 'bg-gray-50' : ''}">
								<div class="flex items-center gap-3">
									<div class="flex h-5 w-5 items-center justify-center rounded-full border-2 {isSelected ? 'border-gray-800' : 'border-gray-300'}">
										{#if isSelected}
											<div class="h-2.5 w-2.5 rounded-full bg-gray-800"></div>
										{/if}
									</div>
									{#if speaker.profilePictureUrl}
										<img src={speaker.profilePictureUrl} alt="" class="h-8 w-8 rounded-full object-cover" />
									{:else}
										<div class="flex h-8 w-8 items-center justify-center rounded-full {getProfilePicColor(i)}">
											<span class="text-xs">😊</span>
										</div>
									{/if}
									<span class="font-medium text-gray-900">{getSpeakerName(speaker)}</span>
								</div>
								{#if isSelected}
									<Icon icon="mdi:check" class="text-lg text-gray-800" />
								{/if}
							</button>
						{/each}
					</div>
				{:else}
					<p class="py-4 text-center text-sm text-gray-400">No speakers found. Add speakers in the Participants section first.</p>
				{/if}

				<!-- Assign button -->
				<button on:click={handleAssign} disabled={saving} class="w-full rounded-lg bg-gray-900 py-3 text-center font-medium text-white disabled:opacity-50">
					{saving ? 'Assigning...' : 'Assign Speakers'}
				</button>
			</div>
		</div>
	</div>
{/if}
