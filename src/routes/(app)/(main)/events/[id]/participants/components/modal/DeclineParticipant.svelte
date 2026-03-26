<script lang="ts">
	import { declineParticipant } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let participant = 'exhibitor';
	export let speakerData: any = null;
	export let eventId = '';

	let participantUp = participant.charAt(0).toUpperCase() + participant.slice(1);
	let reason = '';
	let declining = false;
	let error = '';

	$: participantName = speakerData?.displayName || speakerData?.applicationDetails?.companyName || 'Participant';

	async function handleDecline() {
		if (!speakerData?.id || !eventId) return;
		declining = true;
		error = '';
		try {
			await declineParticipant(eventId, speakerData.id, { reason: reason || undefined });
			dispatch('declined');
			open = false;
		} catch (e: any) {
			error = e.message || 'Failed to decline';
		} finally {
			declining = false;
		}
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
		<div class="animate-fadeIn max-h-180 md:max-h-150 w-full max-w-2xl rounded-2xl bg-[#FDFCFB] px-4 py-6 md:p-6 shadow-xl">
			<div class="relative flex w-full flex-col items-center">
				<div class="mb-3 flex h-18 w-18 items-center justify-center rounded-full bg-gray-100">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-2xl">
						<Icon icon="mdi:close-circle-outline" class="text-2xl text-red-500" />
					</div>
				</div>
				<h2 class="text-xl font-semibold text-gray-800">Decline {participantUp}</h2>
				<p class="text-sm text-gray-500">This will decline {participantName}'s participation.</p>
				<button class="absolute top-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#EBECED]" on:click={() => (open = false)}>
					<Icon icon="mdi:close" class="text-lg font-bold" />
				</button>
			</div>

			<div class="custom-scrollbar mt-6 max-h-80 overflow-y-auto rounded-lg border p-4 md:max-h-60">
				{#if error}
					<p class="mb-3 text-sm text-red-500">{error}</p>
				{/if}

				<h3 class="mb-4 flex items-center gap-1 text-lg font-semibold text-gray-700">
					Are you sure you want to decline {participantName}'s participation?
				</h3>

				<div class="mt-4">
					<label class="flex text-gray-900">Reason for Decline <span class="ml-1 text-gray-500">(Optional)</span></label>
					<textarea placeholder="Provide feedback to the {participant}..." rows="4" bind:value={reason} class="mt-2 w-full resize-none rounded-sm bg-[#FFFFFF] px-3 py-2 shadow-xs"></textarea>
					<p class="flex items-center gap-1 text-xs font-light text-gray-500">
						<img src="/information-fill.svg" alt="" />
						The {participant} will be notified of this decision.
					</p>
				</div>
			</div>

			<div class="mt-6 flex items-center gap-2">
				<button on:click={() => (open = false)} class="rounded-md bg-white px-4 py-2 text-gray-600 shadow-xs">Cancel</button>
				<button on:click={handleDecline} disabled={declining} class="rounded-md bg-red-600 px-4 py-2 text-white shadow-xs disabled:opacity-50">
					{declining ? 'Declining...' : `Decline ${participantUp}`}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.animate-fadeIn { animation: fade 0.15s ease-out; }
	@keyframes fade { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
</style>
