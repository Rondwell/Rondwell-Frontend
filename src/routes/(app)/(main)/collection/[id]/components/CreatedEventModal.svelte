<script lang="ts">
	export let open: boolean = false;
	export let collectionId: string = '';
	import {
		addExistingEventToCollection,
		getSelectableEventsForCollection,
		resolveEventUrl
	} from '$lib/services/event.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher, onMount } from 'svelte';

	const dispatch = createEventDispatcher<{
		close: void;
		collection: void;
		added: void;
	}>();

	let eventUrl = '';
	let resolvedEvent: any = null;
	let resolving = false;
	let resolveError = '';
	let submitting = false;
	let submitError = '';

	// Dropdown selection mode
	let showDropdown = false;
	let selectableEvents: any[] = [];
	let loadingSelectable = false;
	let selectedEventId = '';

	async function handleResolveUrl() {
		if (!eventUrl.trim()) return;
		resolving = true;
		resolveError = '';
		resolvedEvent = null;
		try {
			resolvedEvent = await resolveEventUrl(collectionId, eventUrl.trim());
		} catch (e: any) {
			resolveError = e.message ?? 'Could not find event from URL';
		} finally {
			resolving = false;
		}
	}

	async function loadSelectableEvents() {
		loadingSelectable = true;
		try {
			selectableEvents = await getSelectableEventsForCollection(collectionId);
		} catch { selectableEvents = []; }
		finally { loadingSelectable = false; }
	}

	function toggleDropdown() {
		showDropdown = !showDropdown;
		if (showDropdown && selectableEvents.length === 0) loadSelectableEvents();
	}

	function selectEvent(ev: any) {
		selectedEventId = ev._id;
		resolvedEvent = ev;
		showDropdown = false;
		eventUrl = '';
	}

	async function handleSubmit() {
		const eid = resolvedEvent?._id ?? selectedEventId;
		if (!eid) { submitError = 'Please resolve an event first'; return; }
		submitting = true;
		submitError = '';
		try {
			await addExistingEventToCollection(collectionId, eid);
			dispatch('added');
		} catch (e: any) {
			submitError = e.message ?? 'Failed to add event';
		} finally {
			submitting = false;
		}
	}

	function reset() {
		eventUrl = '';
		resolvedEvent = null;
		resolveError = '';
		submitError = '';
		selectedEventId = '';
	}

	$: if (!open) reset();
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 backdrop-blur-sm"
		on:click={() => dispatch('close')}>
		<div class="flex max-h-[90vh] w-full max-w-lg flex-col rounded-md bg-[#F8F9F9] shadow-lg"
			on:click|stopPropagation>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-4 py-4">
				<div class="flex items-center gap-3">
					<button aria-label="Close" on:click={() => dispatch('close')}>
						<Icon icon="mdi:close" class="h-5 w-5 text-[#68696B]" />
					</button>
					<p class="text-base font-medium">Add Existing Event</p>
				</div>
			</div>

			<div class="flex-1 overflow-y-auto p-4 space-y-4">
				<!-- URL Input -->
				<div>
					<label class="mb-1 block text-sm font-medium text-[#666769]">
						Paste Rondwell Event URL
					</label>
					<div class="flex gap-2">
						<input type="url" bind:value={eventUrl}
							placeholder="https://rondwell.com/my-event-slug"
							class="flex-1 rounded-md border px-3 py-2 text-sm placeholder-[#C8C9C9] focus:outline-none" />
						<button on:click={handleResolveUrl} disabled={resolving || !eventUrl.trim()}
							class="rounded-md bg-[#333537] px-4 py-2 text-sm text-white disabled:opacity-50">
							{resolving ? '...' : 'Resolve'}
						</button>
					</div>
					{#if resolveError}
						<p class="mt-1 text-xs text-red-500">{resolveError}</p>
					{/if}
				</div>

				<!-- OR divider -->
				<div class="flex items-center gap-3">
					<div class="h-px flex-1 bg-gray-200"></div>
					<span class="text-xs text-gray-400">OR</span>
					<div class="h-px flex-1 bg-gray-200"></div>
				</div>

				<!-- Dropdown selection -->
				<div class="relative">
					<label class="mb-1 block text-sm font-medium text-[#666769]">Select from your events</label>
					<button on:click={toggleDropdown}
						class="flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm text-left">
						<span class="text-[#666769]">
							{resolvedEvent?.title ?? 'Choose an event...'}
						</span>
						<Icon icon="mdi:chevron-down" class="h-4 w-4 text-gray-400" />
					</button>
					{#if showDropdown}
						<div class="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-white shadow-lg"
							use:clickOutside={() => (showDropdown = false)}>
							{#if loadingSelectable}
								<p class="p-3 text-sm text-gray-400">Loading...</p>
							{:else if selectableEvents.length === 0}
								<p class="p-3 text-sm text-gray-400">No other events available</p>
							{:else}
								{#each selectableEvents as ev}
									<button on:click={() => selectEvent(ev)}
										class="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50">
										<span class="font-medium">{ev.title}</span>
										<span class="ml-auto text-xs text-gray-400">
											{new Date(ev.startDateTime).toLocaleDateString()}
										</span>
									</button>
								{/each}
							{/if}
						</div>
					{/if}
				</div>

				<!-- Resolved event preview -->
				{#if resolvedEvent}
					<div class="rounded-lg border bg-white p-3">
						<p class="text-sm font-semibold">{resolvedEvent.title}</p>
						{#if resolvedEvent.description}
							<p class="mt-1 text-xs text-gray-500 line-clamp-2">{resolvedEvent.description}</p>
						{/if}
						{#if resolvedEvent.startDateTime}
							<p class="mt-1 text-xs text-gray-400">
								{new Date(resolvedEvent.startDateTime).toLocaleString()}
							</p>
						{/if}
					</div>
				{/if}

				{#if submitError}
					<p class="text-sm text-red-500">{submitError}</p>
				{/if}

				<button on:click={handleSubmit} disabled={submitting || !resolvedEvent}
					class="w-full rounded-md bg-[#333537] py-3 text-sm text-white disabled:opacity-50">
					{submitting ? 'Adding...' : 'Add to Collection'}
				</button>
			</div>
		</div>
	</div>
{/if}
