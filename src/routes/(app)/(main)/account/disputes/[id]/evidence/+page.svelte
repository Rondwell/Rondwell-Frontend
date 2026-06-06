<!--
	FE-P4-05 (P4-05) — Evidence submission for an open dispute.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		getDispute,
		submitEvidence,
		type DisputeDetail,
		type DisputeEvidence,
	} from '$lib/services/dispute.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	$: id = $page.params.id;

	let dispute: DisputeDetail | null = null;
	let loading = true;
	let error = '';
	let success = '';
	let submitting = false;

	let files: File[] = [];
	let evidenceType: DisputeEvidence['type'] = 'OTHER';
	let note = '';

	onMount(load);

	async function load() {
		loading = true;
		try {
			dispute = await getDispute(id);
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			loading = false;
		}
	}

	function onFileChange(e: Event) {
		const list = (e.target as HTMLInputElement).files;
		files = list ? Array.from(list) : [];
	}

	async function handleSubmit() {
		if (!files.length) {
			error = 'Pick at least one file to upload.';
			return;
		}
		submitting = true;
		error = '';
		success = '';
		try {
			const result = await submitEvidence(id, files, note.trim() || undefined, evidenceType);
			success = `Uploaded ${result.uploaded} file${result.uploaded === 1 ? '' : 's'}. We'll forward to the gateway.`;
			files = [];
			note = '';
			await load();
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			submitting = false;
		}
	}

	function fmtDate(iso?: string | null): string {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleString();
		} catch {
			return iso;
		}
	}
</script>

<svelte:head><title>Submit evidence — Rondwell</title></svelte:head>

<div class="max-w-3xl">
	<button
		on:click={() => goto('/account/disputes')}
		class="inline-flex items-center gap-1 text-xs text-pink-600 hover:underline"
	>
		<Icon icon="mdi:arrow-left" /> Back to disputes
	</button>

	{#if loading}
		<div class="mt-6 h-32 animate-pulse rounded-xl bg-white"></div>
	{:else if dispute}
		<header class="mt-4 rounded-xl bg-white p-5 shadow-sm">
			<h1 class="text-xl font-bold text-gray-900">Defend this charge</h1>
			<p class="mt-1 text-sm text-gray-500">{dispute.eventName ?? dispute.productName ?? 'Disputed transaction'}</p>
			<dl class="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
				<div>
					<dt class="text-gray-500">Amount</dt>
					<dd class="mt-0.5 font-semibold text-gray-900">{formatMoney(dispute.amountKobo, dispute.currency)}</dd>
				</div>
				<div>
					<dt class="text-gray-500">Status</dt>
					<dd class="mt-0.5 text-gray-700">{dispute.status.replace(/_/g, ' ')}</dd>
				</div>
				<div>
					<dt class="text-gray-500">Opened</dt>
					<dd class="mt-0.5 text-gray-700">{fmtDate(dispute.openedAt)}</dd>
				</div>
				<div>
					<dt class="text-gray-500">Deadline</dt>
					<dd class="mt-0.5 text-gray-700">{fmtDate(dispute.deadlineAt)}</dd>
				</div>
			</dl>
			{#if dispute.reason}
				<p class="mt-3 rounded-md bg-orange-50 p-3 text-xs text-orange-700">
					<strong>Reason:</strong> {dispute.reason}
				</p>
			{/if}
		</header>

		<!-- Evidence upload -->
		<section class="mt-6 rounded-xl bg-white p-5 shadow-sm">
			<h2 class="text-base font-semibold text-gray-900">Submit evidence</h2>
			<p class="mt-1 text-xs text-gray-500">
				Upload photos, receipts, or communication logs that prove the customer received the goods/service.
				Our compliance team forwards everything to the card network.
			</p>

			<label class="mt-4 block text-sm">
				<span class="font-medium text-gray-700">Evidence type</span>
				<select
					bind:value={evidenceType}
					class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
				>
					<option value="PHOTO">Photo / image</option>
					<option value="RECEIPT">Receipt / invoice</option>
					<option value="COMMUNICATION_LOG">Communication log (email, chat)</option>
					<option value="OTHER">Other</option>
				</select>
			</label>

			<label class="mt-3 block text-sm">
				<span class="font-medium text-gray-700">Files</span>
				<input
					type="file"
					multiple
					on:change={onFileChange}
					accept="image/*,.pdf,.doc,.docx,.txt"
					class="mt-1 block w-full text-sm text-gray-600"
				/>
			</label>
			{#if files.length}
				<ul class="mt-2 list-disc pl-5 text-xs text-gray-600">
					{#each files as f}
						<li>{f.name} ({Math.round(f.size / 1024)} KB)</li>
					{/each}
				</ul>
			{/if}

			<label class="mt-3 block text-sm">
				<span class="font-medium text-gray-700">Note (optional)</span>
				<textarea
					rows="3"
					bind:value={note}
					placeholder="Briefly describe what this evidence shows."
					class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
				></textarea>
			</label>

			{#if error}
				<p class="mt-3 rounded-md bg-red-50 p-3 text-xs text-red-600">{error}</p>
			{/if}
			{#if success}
				<p class="mt-3 rounded-md bg-green-50 p-3 text-xs text-green-700">{success}</p>
			{/if}

			<div class="mt-4 flex justify-end gap-2">
				<button
					on:click={handleSubmit}
					disabled={submitting || !files.length}
					class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
				>
					{submitting ? 'Uploading…' : 'Submit evidence'}
				</button>
			</div>
		</section>

		<!-- Existing evidence -->
		{#if dispute.evidence?.length}
			<section class="mt-6 rounded-xl bg-white p-5 shadow-sm">
				<h2 class="text-base font-semibold text-gray-900">Submitted evidence</h2>
				<ul class="mt-3 space-y-2 text-sm">
					{#each dispute.evidence as e}
						<li class="flex items-center justify-between rounded-md border border-gray-100 p-2">
							<div class="flex items-center gap-2">
								<Icon icon="mdi:file-document-outline" class="text-gray-400" />
								<span class="text-xs text-gray-700">{e.type.replace(/_/g, ' ')}</span>
								{#if e.note}<span class="text-xs italic text-gray-500"> — {e.note}</span>{/if}
							</div>
							<a
								href={e.url}
								target="_blank"
								rel="noopener noreferrer"
								class="text-xs font-medium text-pink-600 hover:underline"
							>
								View
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{:else}
		<p class="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-600">{error || 'Dispute not found.'}</p>
	{/if}
</div>
