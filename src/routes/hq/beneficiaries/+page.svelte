<!--
	FE-P2-08 — Admin beneficiary review queue.

	Backend: /api/v1/payment/beneficiary/admin/pending-review/
-->
<script lang="ts">
	import { authFetch } from '$lib/services/api.client';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { throwApiError } from '$lib/utils/errorMessage';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	const API_URL = import.meta.env.VITE_API_URL;

	interface PendingBeneficiary {
		id: string;
		userId: string;
		userEmail?: string;
		userName?: string;
		accountNumber: string;
		bankName: string;
		bankCode: string;
		accountName: string;
		canonicalAccountName?: string;
		flagReason?: string;
		createdAt: string;
	}

	let items: PendingBeneficiary[] = [];
	let loading = true;
	let error = '';
	let processing = '';

	onMount(load);

	async function load() {
		loading = true;
		error = '';
		try {
			const res = await authFetch(`${API_URL}/api/v1/payment/beneficiary/admin/pending-review`);
			if (!res.ok) await throwApiError(res, 'Failed to load queue');
			const data = await res.json();
			items = data.data?.items ?? data.items ?? [];
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			loading = false;
		}
	}

	async function approve(id: string) {
		processing = id;
		try {
			const res = await authFetch(`${API_URL}/api/v1/payment/beneficiary/admin/${id}/approve`, {
				method: 'POST',
			});
			if (!res.ok) await throwApiError(res, 'Failed to approve');
			items = items.filter((i) => i.id !== id);
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			processing = '';
		}
	}

	async function reject(id: string) {
		const reason = window.prompt('Reason for rejection?');
		if (!reason) return;
		processing = id;
		try {
			const res = await authFetch(`${API_URL}/api/v1/payment/beneficiary/admin/${id}/reject`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reason }),
			});
			if (!res.ok) await throwApiError(res, 'Failed to reject');
			items = items.filter((i) => i.id !== id);
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			processing = '';
		}
	}
</script>

<svelte:head><title>Beneficiary review — Rondwell HQ</title></svelte:head>

<div>
	<h1 class="text-2xl font-semibold text-gray-900">Beneficiary review queue</h1>
	<p class="mt-1 text-sm text-gray-500">
		Bank accounts pending review (cross-user duplicates, name mismatches, flagged adds).
	</p>

	{#if error}
		<p class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{/if}

	{#if loading}
		<div class="mt-6 space-y-2">
			{#each [1, 2, 3] as _}
				<div class="h-20 animate-pulse rounded-lg bg-white"></div>
			{/each}
		</div>
	{:else if items.length === 0}
		<div class="mt-8 flex h-60 flex-col items-center justify-center rounded-xl bg-white">
			<Icon icon="mdi:check-circle-outline" class="mb-2 text-4xl text-green-400" />
			<p class="text-lg font-medium text-gray-700">Queue empty</p>
		</div>
	{:else}
		<div class="mt-6 space-y-3">
			{#each items as i}
				<div class="rounded-xl border bg-white p-4">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p class="font-semibold">{i.userName ?? i.userEmail ?? 'User'}</p>
							{#if i.userEmail && i.userName}
								<p class="text-xs text-gray-400">{i.userEmail}</p>
							{/if}
							<dl class="mt-2 grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
								<div>
									<dt class="text-gray-400">Bank</dt>
									<dd class="text-gray-700">{i.bankName} ({i.bankCode})</dd>
								</div>
								<div>
									<dt class="text-gray-400">Account</dt>
									<dd class="font-mono text-gray-700">{i.accountNumber}</dd>
								</div>
								<div>
									<dt class="text-gray-400">Submitted name</dt>
									<dd class="text-gray-700">{i.accountName}</dd>
								</div>
								{#if i.canonicalAccountName}
									<div>
										<dt class="text-gray-400">Canonical name</dt>
										<dd class="text-gray-700">{i.canonicalAccountName}</dd>
									</div>
								{/if}
							</dl>
							{#if i.flagReason}
								<p class="mt-2 rounded-md bg-amber-50 p-2 text-xs text-amber-700">
									Flag: {i.flagReason}
								</p>
							{/if}
						</div>
						<div class="flex items-center gap-2">
							<button
								on:click={() => approve(i.id)}
								disabled={processing === i.id}
								class="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
							>
								Approve
							</button>
							<button
								on:click={() => reject(i.id)}
								disabled={processing === i.id}
								class="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
							>
								Reject
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
