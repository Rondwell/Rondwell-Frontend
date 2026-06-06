<!--
	FE-P2-03-B — Dispute submission form.

	Backend: POST /api/v1/payment/escrow/:id/dispute
	Reason has a 3-char minimum. Optional evidence URLs (uploaded
	separately via existing media services).
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { openEscrowDispute } from '$lib/services/escrow.services';
	import { toast } from '$lib/stores/toast.store';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import Icon from '@iconify/svelte';

	$: escrowId = $page.params.id;

	let reason = '';
	let evidenceUrlsRaw = '';
	let submitting = false;
	let error = '';

	$: canSubmit = reason.trim().length >= 3 && !submitting;

	async function handleSubmit() {
		if (!canSubmit) return;
		submitting = true;
		error = '';
		try {
			const evidenceUrls = evidenceUrlsRaw
				.split('\n')
				.map((u) => u.trim())
				.filter(Boolean);
			await openEscrowDispute(escrowId, { reason: reason.trim(), evidenceUrls });
			toast.success('Dispute submitted. Our team will review it shortly.');
			goto(`/account/escrows/${escrowId}`);
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head><title>Open dispute — Rondwell</title></svelte:head>

<div class="max-w-2xl">
	<button
		on:click={() => goto(`/account/escrows/${escrowId}`)}
		class="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
	>
		<Icon icon="mdi:arrow-left" /> Back to escrow
	</button>

	<div class="rounded-xl border bg-white p-6">
		<h1 class="text-xl font-semibold">Open a dispute</h1>
		<p class="mt-1 text-sm text-gray-500">
			Tell us what went wrong. Our team will hold the funds in escrow until the dispute is resolved.
		</p>

		{#if error}
			<p class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
		{/if}

		<div class="mt-4 space-y-4">
			<div>
				<label for="dispute-reason" class="mb-1 block text-sm font-medium text-gray-700">
					Reason
				</label>
				<textarea
					id="dispute-reason"
					rows="5"
					bind:value={reason}
					placeholder="Describe what the vendor failed to deliver, missed deadlines, quality issues, etc."
					class="w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
				></textarea>
				<p class="mt-1 text-[11px] text-gray-400">
					Minimum 3 characters. Be specific so the review is faster.
				</p>
			</div>

			<div>
				<label for="dispute-evidence" class="mb-1 block text-sm font-medium text-gray-700">
					Evidence URLs <span class="text-xs text-gray-400">(optional)</span>
				</label>
				<textarea
					id="dispute-evidence"
					rows="3"
					bind:value={evidenceUrlsRaw}
					placeholder={`Paste links to photos, screenshots, or messages.\nOne URL per line.`}
					class="w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
				></textarea>
				<p class="mt-1 text-[11px] text-gray-400">
					Upload media via your event gallery first, then paste the URLs here.
				</p>
			</div>

			<div class="flex justify-end gap-2">
				<button
					on:click={() => goto(`/account/escrows/${escrowId}`)}
					class="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					on:click={handleSubmit}
					disabled={!canSubmit}
					class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
				>
					{submitting ? 'Submitting…' : 'Submit dispute'}
				</button>
			</div>
		</div>
	</div>
</div>
