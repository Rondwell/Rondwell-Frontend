<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { toast } from '$lib/stores/toast.store';
	import { deleteCollection, getMyCollections, updateCollection } from '$lib/services/event.services';

	$: collectionId = $page.params.id ?? '';

	let loading = true;
	let saving = false;
	let deleting = false;
	let showDeleteModal = false;
	let deleteError = '';
	let collectionName = 'Collection';

	// Settings
	let visibility: 'PUBLIC' | 'PRIVATE' = 'PUBLIC';
	let applyVisibilityToAllEvents = false;
	let publicAttendeeListEnabled = false;
	let feedbackCollectionEnabled = false;

	let visOpen = false;

	onMount(load);

	async function load() {
		loading = true;
		try {
			const cols = await getMyCollections();
			const col = (cols ?? []).find((c: any) => (c._id ?? c.id) === collectionId);
			if (col) {
				collectionName = col.name ?? 'Collection';
				visibility = (col.eventDefaults?.visibility ?? 'PUBLIC').toUpperCase() === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';
				publicAttendeeListEnabled = !!col.publicAttendeeListEnabled;
				feedbackCollectionEnabled = !!col.feedbackCollectionEnabled;
			}
		} catch {
			/* keep defaults */
		} finally {
			loading = false;
		}
	}

	async function save() {
		if (!collectionId) return;
		saving = true;
		try {
			const payload: Record<string, any> = {
				eventDefaults: { visibility },
				publicAttendeeListEnabled,
				feedbackCollectionEnabled
			};
			if (applyVisibilityToAllEvents) {
				payload.applyVisibilityToAllEvents = true;
				payload.eventVisibility = visibility;
			}
			const res = await updateCollection(collectionId, payload);
			const n = res?.collection?.eventsVisibilityUpdated;
			if (applyVisibilityToAllEvents && typeof n === 'number') {
				toast.success(`Saved. Visibility applied to ${n} event${n === 1 ? '' : 's'}.`);
			} else {
				toast.success('Settings saved.');
			}
		} catch (e: any) {
			toast.error(e?.message ?? 'Failed to save settings.');
		} finally {
			saving = false;
		}
	}

	function openDeleteModal() {
		deleteError = '';
		showDeleteModal = true;
	}

	async function confirmDelete() {
		if (!collectionId) return;
		deleting = true;
		deleteError = '';
		try {
			await deleteCollection(collectionId);
			toast.success('Collection deleted.');
			showDeleteModal = false;
			goto('/collection');
		} catch (e: any) {
			if (e?.code === 'COLLECTION_HAS_EVENTS') {
				deleteError =
					e.message ||
					'This collection still has events. Move them to another collection before deleting.';
			} else {
				deleteError = e?.message ?? 'Failed to delete collection.';
			}
		} finally {
			deleting = false;
		}
	}
</script>

<div class="mb-6 overflow-x-hidden">
	<div class="mb-3 flex items-center justify-between">
		<h2 class="text-lg font-semibold">Ticket Sales</h2>
		<button
			type="button"
			class="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
			disabled={saving || loading}
			on:click={save}
		>
			{saving ? 'Saving…' : 'Save changes'}
		</button>
	</div>
	<p class="text-[#8C8F93]">Default settings for events on this collection ({collectionName}).</p>

	<div class="mt-6 rounded-md bg-white p-3 sm:p-4">
		<!-- Event Visibility -->
		<div class="flex items-start justify-between gap-4 border-b border-gray-200 pb-4 pt-2">
			<div class="flex flex-col">
				<span class="text-[#131517]">Event Visibility</span>
				<span class="text-sm text-[#9a9c9c]">Whether events are shown on the discover page.</span>
			</div>

			<div class="relative">
				<button
					type="button"
					class="flex items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-sm text-[#616265]"
					on:click={() => (visOpen = !visOpen)}
				>
					{visibility === 'PUBLIC' ? 'Public' : 'Private'}
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg>
				</button>
				{#if visOpen}
					<div class="absolute right-0 z-10 mt-1 w-32 rounded-md border border-gray-200 bg-white shadow-md">
						<button type="button" class="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50" on:click={() => { visibility = 'PUBLIC'; visOpen = false; }}>Public</button>
						<button type="button" class="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50" on:click={() => { visibility = 'PRIVATE'; visOpen = false; }}>Private</button>
					</div>
				{/if}
			</div>
		</div>

		<!-- Apply to all events override -->
		<div class="flex items-start justify-between gap-4 border-b border-gray-200 pb-3 pt-4">
			<div class="flex flex-col">
				<span class="text-[#131517]">Override all events' visibility</span>
				<span class="text-sm text-[#9a9c9c]">
					Apply the visibility above to every event in this collection. Events you've individually
					changed keep their own setting.
				</span>
			</div>
			<button
				type="button"
				class="flex h-5 w-10 flex-shrink-0 items-center rounded-full p-1 transition-colors duration-200"
				class:bg-gray-300={!applyVisibilityToAllEvents}
				class:bg-black={applyVisibilityToAllEvents}
				aria-label="Toggle override all events"
				on:click={() => (applyVisibilityToAllEvents = !applyVisibilityToAllEvents)}
			>
				<div class="h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200" class:translate-x-4={applyVisibilityToAllEvents}></div>
			</button>
		</div>

		<!-- Public Attendee List -->
		<div class="flex items-start justify-between gap-4 border-b border-gray-200 pb-3 pt-4">
			<div class="flex flex-col">
				<span class="text-[#131517]">Public Attendee List</span>
				<span class="text-sm text-[#9a9c9c]">Whether to show attendee list on the event pages.</span>
			</div>
			<button
				type="button"
				class="flex h-5 w-10 flex-shrink-0 items-center rounded-full p-1 transition-colors duration-200"
				class:bg-gray-300={!publicAttendeeListEnabled}
				class:bg-black={publicAttendeeListEnabled}
				aria-label="Toggle public attendee list"
				on:click={() => (publicAttendeeListEnabled = !publicAttendeeListEnabled)}
			>
				<div class="h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200" class:translate-x-4={publicAttendeeListEnabled}></div>
			</button>
		</div>

		<!-- Collect Feedback -->
		<div class="flex items-start justify-between gap-4 pb-2 pt-4">
			<div class="flex flex-col">
				<span class="text-[#131517]">Collect Feedback</span>
				<span class="text-sm text-[#9a9c9c]">Email attendees after the event to collect feedback.</span>
			</div>
			<button
				type="button"
				class="flex h-5 w-10 flex-shrink-0 items-center rounded-full p-1 transition-colors duration-200"
				class:bg-gray-300={!feedbackCollectionEnabled}
				class:bg-black={feedbackCollectionEnabled}
				aria-label="Toggle collect feedback"
				on:click={() => (feedbackCollectionEnabled = !feedbackCollectionEnabled)}
			>
				<div class="h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200" class:translate-x-4={feedbackCollectionEnabled}></div>
			</button>
		</div>
	</div>

	<p class="border-b pb-8 pt-4 text-xs text-[#7F8082]">
		Changing the default visibility only affects new events unless you enable "Override all events'
		visibility". You can always change these settings for each individual event.
	</p>

	<!-- Delete Collection -->
	<div class="border-b">
		<div class="py-5">
			<h1 class="my-2 text-lg">Delete Collection</h1>
			<p class="text-[#8C8F93]">
				Permanently delete this collection. This operation cannot be undone. Subscribers won't be
				notified. You must move all events to another collection before deleting.
			</p>
			<button
				type="button"
				class="mb-4 mt-6 flex w-fit items-center gap-1 rounded-md bg-[#ED2B32] px-6 py-2 text-sm font-medium text-white hover:bg-red-700"
				on:click={openDeleteModal}
			>
				Delete Collection
			</button>
		</div>
	</div>
</div>

{#if showDeleteModal}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		on:click={() => !deleting && (showDeleteModal = false)}
		on:keydown={(e) => e.key === 'Escape' && !deleting && (showDeleteModal = false)}
	>
		<div
			class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
			role="document"
			on:click|stopPropagation
			on:keydown|stopPropagation
		>
			<div class="mb-3 flex items-center gap-3">
				<div class="flex h-11 w-11 items-center justify-center rounded-full bg-red-100">
					<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ED2B32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
				</div>
				<h3 class="text-lg font-semibold">Delete “{collectionName}”?</h3>
			</div>

			<p class="mb-4 text-sm text-[#737577]">
				This permanently deletes the collection along with its tags, admins and subscriber list.
				This cannot be undone. All events must be moved to another collection first.
			</p>

			{#if deleteError}
				<p class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{deleteError}</p>
			{/if}

			<div class="flex justify-end gap-3">
				<button
					type="button"
					on:click={() => (showDeleteModal = false)}
					disabled={deleting}
					class="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="button"
					on:click={confirmDelete}
					disabled={deleting}
					class="rounded-lg bg-[#ED2B32] px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
				>
					{deleting ? 'Deleting…' : 'Delete Collection'}
				</button>
			</div>
		</div>
	</div>
{/if}
