<script lang="ts">
	import { goto } from '$app/navigation';
	import { cancelEvent } from '$lib/services/event.services';
	import { toast } from '$lib/stores/toast.store';
	import { cleanErrorMessage } from '$lib/utils/errorMessage';
	import Icon from '@iconify/svelte';

	export let open = false;
	export let eventId = '';
	export let eventTitle = '';

	let saving = false;

	async function handleCancel() {
		saving = true;
		try {
			await cancelEvent(eventId);
			toast.success('Event cancelled successfully.');
			open = false;
			goto(`/events`);
		} catch (e: any) {
			toast.error(cleanErrorMessage(e.message || 'Failed to cancel event'));
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
				<Icon icon="mdi:cancel" class="text-2xl text-[#D92D20]" />
			</div>
			<h2 class="text-lg font-semibold text-gray-900">Cancel Event</h2>
			<p class="mt-2 text-sm text-gray-500">
				Are you sure you want to cancel <span class="font-medium text-gray-700">{eventTitle}</span>? All registered guests will be notified. This cannot be undone.
			</p>
			<div class="mt-5 flex gap-3">
				<button on:click={() => (open = false)} class="flex-1 rounded-lg bg-[#F0F1F1] py-2.5 text-sm font-medium text-[#727375] transition hover:bg-gray-200">
					Keep Event
				</button>
				<button on:click={handleCancel} disabled={saving} class="flex-1 rounded-lg bg-[#D92D20] py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50">
					{saving ? 'Cancelling...' : 'Cancel Event'}
				</button>
			</div>
		</div>
	</div>
{/if}
