<script lang="ts">
	import { removeSpeaker } from '$lib/services/event.services';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let participant = 'speaker';
	export let speakerData: any = null;
	export let eventId = '';

	let participantUp = participant.charAt(0).toUpperCase() + participant.slice(1);
	let removing = false;
	let error = '';

	$: participantName = speakerData?.displayName || speakerData?.applicationDetails?.contactEmail || 'this participant';

	async function handleRemove() {
		if (!speakerData?.id || !eventId) return;
		removing = true;
		error = '';
		try {
			await removeSpeaker(eventId, speakerData.id);
			dispatch('removed');
			open = false;
		} catch (e: any) {
			error = e.message || 'Failed to remove participant';
		} finally {
			removing = false;
		}
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2 backdrop-blur-sm" role="dialog" aria-modal="true">
		<div class="inline-block text-left sm:right-0">
			<div class="relative w-[330px] max-w-lg rounded-lg bg-[#FFFCFC] p-4 shadow-lg">
				<div class="mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#EFEFF0]">
					<div class="flex h-9 w-9 items-center justify-center">
						<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path opacity="0.4" d="M28.4935 15.1858V23.1725C28.4935 26.8525 25.5068 29.8392 21.8268 29.8392H10.1735C6.4935 29.8392 3.50684 26.8525 3.50684 23.1725V15.2792C4.52017 16.3725 5.96017 16.9992 7.52017 16.9992C9.20017 16.9992 10.8135 16.1592 11.8268 14.8125C12.7335 16.1592 14.2802 16.9992 16.0002 16.9992C17.7068 16.9992 19.2268 16.1992 20.1468 14.8658C21.1735 16.1858 22.7602 16.9992 24.4135 16.9992C26.0268 16.9992 27.4935 16.3458 28.4935 15.1858Z" fill="#2A2D32"/>
							<path d="M15.1335 22.2111C13.4402 22.3844 12.1602 23.8244 12.1602 25.5311V29.8377H19.8268V25.9977C19.8402 23.2111 18.2002 21.8911 15.1335 22.2111Z" fill="#2A2D32"/>
						</svg>
					</div>
				</div>

				<h2 class="text-lg font-semibold text-black">Remove {participantUp}</h2>
				<p class="mt-1 mb-4 text-sm leading-snug font-light text-[#8E8E90]">
					Are you sure you want to remove <span class="text-black font-bold">{participantName}</span> from this event? This action cannot be undone.
				</p>

				{#if error}
					<p class="mb-3 text-sm text-red-500">{error}</p>
				{/if}

				<div class="flex items-center gap-3">
					<button class="w-full rounded-lg bg-[#F0F0F0] p-2.5 font-medium text-[#636466] transition" on:click={() => (open = false)}>Cancel</button>
					<button class="w-full rounded-lg bg-black p-2.5 font-medium text-white transition disabled:opacity-50" on:click={handleRemove} disabled={removing}>
						{removing ? 'Removing...' : `Remove ${participantUp}`}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
