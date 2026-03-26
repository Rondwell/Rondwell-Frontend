<script lang="ts">
	import { assignSpeakerSessions, getEventSessions } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher, onMount } from 'svelte';

	const dispatch = createEventDispatcher();

	let searchQuery = '';
	export let open = false;
	export let speakerData: any = null;
	export let eventId = '';

	let selectedS: string[] = [];
	let sessions: any[] = [];
	let loading = false;
	let assigning = false;
	let error = '';

	$: speakerName = speakerData?.displayName || 'Speaker';

	$: if (open && eventId) {
		loadSessions();
		selectedS = speakerData?.assignedSessions || [];
	}

	async function loadSessions() {
		loading = true;
		try {
			sessions = await getEventSessions(eventId);
		} catch {
			sessions = [];
		} finally {
			loading = false;
		}
	}

	function toggleSelect(id: string) {
		if (selectedS.includes(id)) {
			selectedS = selectedS.filter((s) => s !== id);
		} else {
			selectedS = [...selectedS, id];
		}
	}

	async function handleAssign() {
		if (!speakerData?.id || !eventId) return;
		assigning = true;
		error = '';
		try {
			await assignSpeakerSessions(eventId, speakerData.id, selectedS);
			dispatch('assigned');
			open = false;
		} catch (e: any) {
			error = e.message || 'Failed to assign sessions';
		} finally {
			assigning = false;
		}
	}

	$: filteredSessions = sessions.filter((s: any) => {
		if (!searchQuery) return true;
		const q = searchQuery.toLowerCase();
		return (s.title || '').toLowerCase().includes(q) || (s.room || '').toLowerCase().includes(q);
	});
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
		<div class="animate-fadeIn max-h-180 md:max-h-150 w-full max-w-2xl rounded-2xl bg-[#FDFCFB] px-4 py-6 md:p-6 shadow-xl">
			<!-- Modal Header -->
			<div class="relative flex w-full flex-col items-center">
				<div class="mb-3 flex h-18 w-18 items-center justify-center rounded-full bg-gray-100">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-2xl">
						<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M19.2529 25.4017L21.2796 27.4283L25.3329 23.375" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M16.2135 14.4907C16.0801 14.4774 15.9201 14.4774 15.7735 14.4907C12.6001 14.3841 10.0801 11.7841 10.0801 8.58406C10.0668 5.3174 12.7201 2.66406 15.9868 2.66406C19.2535 2.66406 21.9068 5.3174 21.9068 8.58406C21.9068 11.7841 19.3735 14.3841 16.2135 14.4907Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M15.9867 29.077C13.5601 29.077 11.1467 28.4636 9.30672 27.237C6.08005 25.077 6.08005 21.557 9.30672 19.4103C12.9734 16.957 18.9867 16.957 22.6534 19.4103" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
				</div>

				<h2 class="text-xl font-semibold text-gray-800">Assign {speakerName} to Session(s)</h2>
				<p class="text-sm text-gray-500">Select the session(s) where {speakerName} will present.</p>
				<button class="absolute top-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#EBECED] text-xl leading-none text-gray-700" on:click={() => (open = false)}>
					<Icon icon="mdi:close" class="text-lg font-bold" />
				</button>
			</div>

			<!-- Content -->
			<div class="custom-scrollbar mt-6 h-80 md:h-60 overflow-y-auto rounded-lg border p-4">
				{#if error}
					<p class="mb-3 text-sm text-red-500">{error}</p>
				{/if}

				<div class="mb-4 flex items-center gap-2">
					<div class="relative w-full max-w-xl">
						<input type="text" bind:value={searchQuery} placeholder="Search sessions..." class="h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none" />
						<span class="absolute top-2.5 left-3 text-gray-400">
							<img src="/search-favorite.png" alt="search icon" class="h-5 w-5" />
						</span>
					</div>
				</div>

				<p class="mb-3 text-xs text-gray-500">Speakers can be assigned to multiple sessions.</p>

				{#if loading}
					<p class="py-4 text-center text-sm text-gray-400">Loading sessions...</p>
				{:else if filteredSessions.length > 0}
					<div class="divide-y rounded-lg border">
						{#each filteredSessions as session}
							{@const sessionId = session._id || session.id}
							<div class="flex items-start justify-between gap-2 p-3 hover:bg-gray-50 md:flex-row md:items-center">
								<div class="flex flex-col justify-between gap-2 md:flex-row md:items-center">
									<div class="flex items-center gap-2">
										<button on:click={() => toggleSelect(sessionId)} class="flex h-5 w-5 items-center justify-center rounded-full border-2 {selectedS.includes(sessionId) ? 'bg-black' : 'border-gray-300'}">
											{#if selectedS.includes(sessionId)}
												<Icon icon="mdi:tick" class="text-2xl text-white" />
											{/if}
										</button>
										<div class="font-medium">{session.title || 'Untitled Session'}</div>
									</div>
									<div class="max-w-[250px] truncate text-sm text-[#B6B7B7] md:max-w-[150px] lg:max-w-[250px]">
										{session.startTime ? new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : ''}
									</div>
								</div>
								<div class="flex flex-col items-end gap-2 sm:flex-row md:items-center text-sm text-gray-500">
									{session.room || session.stage || ''}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="py-8 text-center text-sm text-gray-400">No sessions found. Create sessions in the Planning section first.</p>
				{/if}
			</div>

			<div class="mt-6 flex items-center gap-2">
				<button on:click={() => (open = false)} class="rounded-md bg-white px-4 py-2 text-gray-600 shadow-xs">Cancel</button>
				<button on:click={handleAssign} disabled={assigning} class="rounded-md bg-black px-4 py-2 text-white shadow-xs disabled:opacity-50">
					{assigning ? 'Assigning...' : 'Assign Session(s)'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.animate-fadeIn { animation: fade 0.15s ease-out; }
	@keyframes fade { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
</style>
