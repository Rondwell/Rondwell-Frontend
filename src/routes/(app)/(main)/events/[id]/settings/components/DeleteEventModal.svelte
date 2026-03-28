<script lang="ts">
	import { goto } from '$app/navigation';
	import { deleteEvent } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';

	export let open = false;
	export let eventId = '';
	export let eventTitle = '';

	let confirmText = '';
	let saving = false;
	let error = '';

	$: canConfirm = confirmText === 'I confirm';
	$: if (!open) { confirmText = ''; error = ''; }

	async function handleDelete() {
		if (!canConfirm) return;
		saving = true;
		error = '';
		try {
			await deleteEvent(eventId);
			open = false;
			goto('/events');
		} catch (e: any) {
			error = e.message || 'Failed to delete event';
		} finally {
			saving = false;
		}
	}
</script>

{#if open}
	<div on:click={() => (open = false)} on:keydown={(e) => e.key === 'Escape' && (open = false)}
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-3" role="dialog" aria-modal="true" tabindex="-1">
		<div class="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
			<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF3F2]">
				<Icon icon="mdi:delete-forever-outline" class="text-2xl text-[#D92D20]" />
			</div>
			<h2 class="text-lg font-semibold text-gray-900">Delete Event Permanently</h2>
			<p class="mt-2 text-sm text-gray-500">
				This will permanently delete <span class="font-medium text-gray-700">{eventTitle}</span> and all associated data. This action cannot be undone.
			</p>
			<div class="mt-4">
				<label for="confirm-delete" class="mb-1 block text-sm text-gray-600">Type <span class="font-semibold text-gray-900">I confirm</span> to proceed</label>
				<input id="confirm-delete" type="text" bind:value={confirmText} placeholder="I confirm"
					class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100" />
			</div>
			{#if error}<p class="mt-3 text-sm text-red-500">{error}</p>{/if}
			<div class="mt-5 flex gap-3">
				<button on:click={() => (open = false)} class="flex-1 rounded-lg bg-[#F0F1F1] py-2.5 text-sm font-medium text-[#727375] transition hover:bg-gray-200">
					Cancel
				</button>
				<button on:click={handleDelete} disabled={!canConfirm || saving} class="flex-1 rounded-lg bg-[#D92D20] py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-40">
					{saving ? 'Deleting...' : 'Delete Forever'}
				</button>
			</div>
		</div>
	</div>
{/if}
