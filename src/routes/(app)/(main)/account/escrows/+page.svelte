<!--
	FE-P2-03-B — Organizer "Open dispute" entry point.

	Lists the organizer's HELD / DISPUTED escrows from
	`/api/v1/payment/escrow/me`. From here the organizer can drill in,
	open a dispute, or watch the release timer.
-->
<script lang="ts">
	import TransactionStatusBadge from '$lib/components/TransactionStatusBadge.svelte';
	import { listMyEscrows, type Escrow, type EscrowStatus } from '$lib/services/escrow.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import SettingsBackButton from '$lib/components/SettingsBackButton.svelte';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	const STATUSES: Array<{ key: EscrowStatus | 'ALL'; label: string }> = [
		{ key: 'ALL', label: 'All' },
		{ key: 'HELD', label: 'Held' },
		{ key: 'DISPUTED', label: 'Disputed' },
		{ key: 'RELEASED', label: 'Released' },
		{ key: 'REVERSED', label: 'Reversed' },
	];

	let escrows: Escrow[] = [];
	let activeStatus: EscrowStatus | 'ALL' = 'ALL';
	let loading = true;
	let error = '';

	$: load(activeStatus);

	async function load(status: EscrowStatus | 'ALL') {
		loading = true;
		error = '';
		try {
			const result = await listMyEscrows({
				status: status === 'ALL' ? undefined : status,
				limit: 50,
			});
			escrows = result.items;
		} catch (e: any) {
			error = financialErrorMessage(e);
			escrows = [];
		} finally {
			loading = false;
		}
	}

	function daysUntil(iso: string): number {
		const ms = new Date(iso).getTime() - Date.now();
		return Math.max(0, Math.ceil(ms / 86_400_000));
	}
</script>

<svelte:head><title>Escrows — Rondwell</title></svelte:head>

<div class="max-w-4xl">
	<SettingsBackButton fallbackTab="payments" />
	<div class="mb-6">
		<h1 class="text-2xl font-bold sm:text-3xl">Vendor escrows</h1>
		<p class="mt-1 text-sm text-[#8C8F93]">
			Vendor invoice payments are held in escrow before being released. You can dispute within the
			release window.
		</p>
	</div>

	<div class="mb-4 flex flex-wrap items-center gap-2">
		{#each STATUSES as s}
			<button
				on:click={() => (activeStatus = s.key)}
				class="rounded-full border px-3 py-1 text-xs font-medium transition {activeStatus === s.key
					? 'border-pink-500 bg-pink-50 text-pink-700'
					: 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}"
			>
				{s.label}
			</button>
		{/each}
	</div>

	{#if error}
		<p class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{/if}

	{#if loading}
		<div class="space-y-2">
			{#each [1, 2, 3] as _}
				<div class="flex animate-pulse items-center gap-4 rounded-lg bg-white p-4">
					<div class="h-10 w-10 rounded-lg bg-gray-200"></div>
					<div class="h-4 w-40 rounded bg-gray-200"></div>
					<div class="ml-auto h-4 w-20 rounded bg-gray-200"></div>
				</div>
			{/each}
		</div>
	{:else if escrows.length === 0}
		<div class="flex h-60 flex-col items-center justify-center rounded-xl bg-white">
			<Icon icon="mdi:safe-square-outline" class="mb-2 text-4xl text-gray-300" />
			<p class="text-lg font-medium text-[#A2ACB2]">No escrows</p>
			<p class="mt-1 text-sm text-gray-400">
				Vendor invoice payments will appear here once they're held in escrow.
			</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each escrows as e}
				<a
					href={`/account/escrows/${e.id}`}
					class="block rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
				>
					<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div>
							<p class="text-sm font-semibold">
								{e.vendorName ?? 'Vendor'}
								{#if e.invoiceNumber}<span class="ml-1 text-xs font-normal text-gray-400">· {e.invoiceNumber}</span>{/if}
							</p>
							{#if e.eventName}
								<p class="text-xs text-gray-500">for {e.eventName}</p>
							{/if}
							<p class="mt-1 text-xs text-gray-400">
								Held {new Date(e.heldAt).toLocaleDateString()}
								{#if e.status === 'HELD'}
									<span class="ml-2 text-amber-600">
										Releases in {daysUntil(e.releaseDueAt)} day{daysUntil(e.releaseDueAt) === 1 ? '' : 's'}
									</span>
								{/if}
							</p>
						</div>
						<div class="flex items-center gap-3 lg:flex-col lg:items-end">
							<TransactionStatusBadge status={e.status} />
							<p class="text-base font-semibold text-gray-900">
								{formatMoney(e.amountKobo, e.currency)}
							</p>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
