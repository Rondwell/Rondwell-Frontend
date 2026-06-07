<!--
	FE-P4-05 (P4-05) — Recipient's view of disputes against them.

	Backend reference: GET /api/v1/payment/disputes/me
	Recipient wallet's `disputedReserve` is frozen during the dispute. The
	recipient (organizer/vendor) submits evidence to defend the charge.
-->
<script lang="ts">
	import TransactionStatusBadge from '$lib/components/TransactionStatusBadge.svelte';
	import { listMyDisputes, type Dispute, type DisputeStatus } from '$lib/services/dispute.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import SettingsBackButton from '$lib/components/SettingsBackButton.svelte';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let disputes: Dispute[] = [];
	let loading = true;
	let error = '';
	let nextCursor: string | null = null;
	let loadingMore = false;
	let statusFilter: DisputeStatus | '' = '';

	onMount(load);

	async function load(reset = true) {
		if (reset) {
			loading = true;
			disputes = [];
			nextCursor = null;
		} else {
			loadingMore = true;
		}
		error = '';
		try {
			const result = await listMyDisputes({
				status: statusFilter || undefined,
				cursor: reset ? null : nextCursor,
				limit: 20,
			});
			disputes = reset ? result.items : [...disputes, ...result.items];
			nextCursor = result.nextCursor;
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			loading = false;
			loadingMore = false;
		}
	}

	function fmtDate(iso?: string | null): string {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
			});
		} catch {
			return iso;
		}
	}

	function urgency(d: Dispute): { text: string; color: string } | null {
		if (!d.deadlineAt) return null;
		const ms = new Date(d.deadlineAt).getTime() - Date.now();
		if (ms < 0) return { text: 'Deadline passed', color: 'text-red-600' };
		const days = Math.floor(ms / (24 * 60 * 60 * 1000));
		if (days <= 1) return { text: `${days === 0 ? 'Last day' : '1 day left'}`, color: 'text-red-600' };
		if (days <= 3) return { text: `${days} days left`, color: 'text-orange-600' };
		return { text: `${days} days left`, color: 'text-gray-500' };
	}
</script>

<svelte:head><title>My disputes — Rondwell</title></svelte:head>

<div class="max-w-4xl">
	<SettingsBackButton fallbackTab="payments" />
	<div class="mb-6">
		<h1 class="text-2xl font-bold sm:text-3xl">My disputes</h1>
		<p class="mt-1 text-sm text-[#8C8F93]">
			Chargebacks raised against your transactions. Funds equivalent to the disputed amount are
			held back from your withdrawable balance until the dispute is resolved.
		</p>
	</div>

	<div class="mb-4 flex flex-wrap items-center gap-2 text-xs">
		<span class="text-gray-500">Filter:</span>
		<button
			on:click={() => {
				statusFilter = '';
				load(true);
			}}
			class="rounded-full px-3 py-1 {statusFilter === ''
				? 'bg-gray-900 text-white'
				: 'bg-white text-gray-600 hover:bg-gray-50'}"
		>
			All
		</button>
		{#each ['OPEN', 'NEEDS_RESPONSE', 'UNDER_REVIEW', 'WON', 'LOST'] as s}
			<button
				on:click={() => {
					statusFilter = s as DisputeStatus;
					load(true);
				}}
				class="rounded-full px-3 py-1 {statusFilter === s
					? 'bg-gray-900 text-white'
					: 'bg-white text-gray-600 hover:bg-gray-50'}"
			>
				{s.replace(/_/g, ' ')}
			</button>
		{/each}
	</div>

	{#if error}
		<p class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{/if}

	{#if loading}
		<div class="space-y-2">
			{#each [1, 2, 3] as _}
				<div class="h-24 animate-pulse rounded-lg bg-white"></div>
			{/each}
		</div>
	{:else if disputes.length === 0}
		<div class="flex h-60 flex-col items-center justify-center rounded-xl bg-white">
			<Icon icon="mdi:scale-balance" class="mb-2 text-4xl text-gray-300" />
			<p class="text-lg font-medium text-[#A2ACB2]">No disputes</p>
			<p class="mt-1 text-sm text-gray-400">When a customer raises a chargeback, it'll appear here.</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each disputes as d}
				<div class="rounded-xl bg-white p-4 shadow-sm">
					<div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
						<div class="flex items-start gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
								<Icon icon="mdi:alert-decagram-outline" class="text-xl" />
							</div>
							<div>
								<p class="text-sm font-semibold">{d.eventName ?? d.productName ?? 'Disputed transaction'}</p>
								{#if d.reason}
									<p class="text-xs italic text-gray-500">"{d.reason}"</p>
								{/if}
								<p class="mt-1 text-xs text-gray-400">
									Opened {fmtDate(d.openedAt)}
									{#if d.gateway}<span> · {d.gateway}</span>{/if}
								</p>
								{#if urgency(d)}
									<p class="mt-1 text-xs font-medium {urgency(d)?.color}">
										<Icon icon="mdi:clock-outline" class="inline" /> {urgency(d)?.text}
									</p>
								{/if}
							</div>
						</div>
						<div class="flex items-center gap-3 lg:flex-col lg:items-end">
							<TransactionStatusBadge status={d.status} />
							<p class="text-base font-semibold text-gray-900">{formatMoney(d.amountKobo, d.currency)}</p>
							{#if d.disputedReserveKobo}
								<p class="text-[10px] text-gray-500">
									{formatMoney(d.disputedReserveKobo, d.currency)} held
								</p>
							{/if}
							{#if d.status === 'OPEN' || d.status === 'NEEDS_RESPONSE' || d.status === 'UNDER_REVIEW'}
								<a
									href={`/account/disputes/${d.id}/evidence`}
									class="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
								>
									Submit evidence
								</a>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>

		{#if nextCursor}
			<div class="mt-4 flex justify-center">
				<button
					on:click={() => load(false)}
					disabled={loadingMore}
					class="rounded-md border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
				>
					{loadingMore ? 'Loading…' : 'Load more'}
				</button>
			</div>
		{/if}
	{/if}
</div>
