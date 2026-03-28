<script lang="ts">
	import { reportAttendee } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';

	export let open = false;
	export let eventId = '';
	export let attendeeId = '';

	let notes = '';
	let block = false;
	let submitting = false;

	function toggleBlock() {
		block = !block;
	}

	async function submitReport() {
		if (submitting) return;
		submitting = true;
		try {
			await reportAttendee(eventId, attendeeId, notes, block);
			open = false;
			notes = '';
			block = false;
		} catch (e) {
			console.error('Failed to report attendee:', e);
		} finally {
			submitting = false;
		}
	}
</script>

{#if open}
	<div
		on:click={() => (open = false)}
		on:keydown={(e) => e.key === 'Escape' && (open = false)}
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-3"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="w-full max-w-md overflow-hidden rounded-xl bg-[#F4F5F6] shadow-xl"
			role="document"
			on:click|stopPropagation
			on:keydown|stopPropagation
		>
			<div class="relative space-y-4 px-6 py-6">
				<!-- Close Button -->
				<button
					class="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#EBECED] text-xl leading-none text-gray-700"
					on:click={() => (open = false)}
					aria-label="Close"
				>
					<Icon icon="mdi:close" class="text-lg font-bold" />
				</button>

				<!-- Icon -->
				<div class="flex h-14 w-14 items-center justify-center rounded-full bg-[#F5DCDD]">
					<img src="/report attendee.svg" alt="report" class="h-9 w-9" />
				</div>

				<h2 class="text-xl font-semibold text-gray-900">Report Attendee</h2>
				<p class="text-sm leading-snug text-[#8E8E90]">
					Please share any information about the guest being disruptive, abusive, or otherwise a related issue.
				</p>

				<!-- Notes -->
				<div>
					<label for="report-notes" class="mb-1 block text-sm font-medium text-gray-700">Notes</label>
					<textarea
						id="report-notes"
						bind:value={notes}
						rows="4"
						placeholder="Provide any additional information that may be helpful."
						class="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
					></textarea>
				</div>

				<!-- Block Toggle -->
				<div class="flex items-center justify-between">
					<label for="block-toggle" class="text-sm font-medium text-gray-700">Block guest for future events</label>
					<button
						id="block-toggle"
						aria-label="Toggle block guest"
						class="relative h-6 w-10 rounded-full transition-colors duration-300"
						class:bg-gray-300={!block}
						class:bg-gray-800={block}
						on:click={toggleBlock}
					>
						<span
							class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
							class:translate-x-4={block}
						></span>
					</button>
				</div>

				<!-- Submit Button -->
				<button
					class="w-full rounded-lg bg-[#DE292F] py-3 text-center font-medium text-white transition hover:bg-[#C42428]"
					on:click={submitReport}
				>
					Submit Report
				</button>
			</div>
		</div>
	</div>
{/if}
