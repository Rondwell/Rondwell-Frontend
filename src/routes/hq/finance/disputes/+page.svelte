<!--
	FE-P4-05 (P4-05) — Admin chargeback / dispute dashboard.

	Lists all disputes from Paystack/Stripe, lets ops resolve WON/LOST.
-->
<script lang="ts">
	import {
		listAllDisputes,
		resolveDispute,
		type Dispute,
		type DisputeStatus,
	} from '$lib/services/dispute.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let disputes: Dispute[] = [];
	let loading = true;
	let error = '';
	let nextCursor: string | null = null;
	let loadingMore = false;
	let statusFilter: DisputeStatus | '' = 'OPEN';

	let resolvingId = '';
	let resolutionNote = '';
	let resolutionType: 'WON' | 'LOST' = 'WON';
	let processing = '';

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
			const result = await listAllDisputes({
				status: statusFilter || undefined,
				cursor: reset ? null : nextCursor,
				limit: 30,
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

	async function handleResolve() {
		if (!resolvingId) return;
		processing = resolvingId;
		try {
			await resolveDispute(resolvingId, resolutionType, resolutionNote.trim() || undefined);
			disputes = disputes.filter((d) => d.id !== resolvingId);
			resolvingId = '';
			resolutionNote = '';
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			processing = '';
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

	function statusColor(s: DisputeStatus): string {
		if (s === 'WON') return 'bg-green-100 text-green-700';
		if (s === 'LOST') return 'bg-red-100 text-red-700';
		if (s === 'WITHDRAWN') return 'bg-gray-100 text-gray-600';
		if (s === 'UNDER_REVIEW') return 'bg-blue-100 text-blue-700';
		if (s === 'NEEDS_RESPONSE') return 'bg-orange-100 text-orange-700';
		return 'bg-purple-100 text-purple-700'; // OPEN
	}
</script>

<svelte:head><title>Disputes — Rondwell HQ</title></svelte:head>

<div>
	<a href="/hq/finance" class="inline-flex items-center gap-1 text-xs text-pink-600 hover:underline">
		<Icon icon="mdi:arrow-left" /> Back to Finance
	</a>

	<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold text-gray-900">Disputes</h1>
			<p class="mt-1 text-sm text-gray-500">
				Chargebacks raised through Paystack/Stripe. Recipient wallets are frozen for the
				disputed amount until resolved.
			</p>
		</div>
		<label class="flex items-center gap-2 text-xs">
			<span class="text-gray-500">Status</span>
			<select
				bind:value={statusFilter}
				on:change={() => load(true)}
				class="rounded-md border border-gray-200 px-2 py-1.5"
			>
				<option value="">All</option>
				<option value="OPEN">Open</option>
				<option value="NEEDS_RESPONSE">Needs response</option>
				<option value="UNDER_REVIEW">Under review</option>
				<option value="WON">Won</option>
				<option value="LOST">Lost</option>
				<option value="WITHDRAWN">Withdrawn</option>
			</select>
		</label>
	</div>

	{#if error}
		<p class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{/if}

	{#if loading}
		<div class="mt-6 space-y-2">
			{#each [1, 2, 3] as _}
				<div class="h-20 animate-pulse rounded-lg bg-white"></div>
			{/each}
		</div>
	{:else if disputes.length === 0}
		<div class="mt-8 flex h-60 flex-col items-center justify-center rounded-xl bg-white">
			<Icon icon="mdi:check-circle-outline" class="mb-2 text-4xl text-green-400" />
			<p class="text-lg font-medium text-gray-700">No disputes</p>
			<p class="mt-1 text-sm text-gray-400">Filtered for status: {statusFilter || 'all'}.</p>
		</div>
	{:else}
		<div class="mt-6 space-y-3">
			{#each disputes as d}
				<div class="rounded-xl border bg-white p-4">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<div class="flex items-center gap-2">
								<span class="font-mono text-xs text-gray-500">#{d.id.slice(-10)}</span>
								<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {statusColor(d.status)}">
									{d.status.replace(/_/g, ' ')}
								</span>
								<span class="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
									{d.gateway}
								</span>
							</div>
							<p class="mt-1 text-sm font-semibold text-gray-900">
								{d.eventName ?? d.productName ?? 'Transaction dispute'}
							</p>
							{#if d.customerEmail}
								<p class="text-xs text-gray-500">vs {d.customerName ?? d.customerEmail}</p>
							{/if}
							{#if d.reason}
								<p class="mt-1 text-xs italic text-gray-500">"{d.reason}"</p>
							{/if}
							<p class="mt-1 text-xs text-gray-400">
								Opened {fmtDate(d.openedAt)}{#if d.deadlineAt} · respond by {fmtDate(d.deadlineAt)}{/if}
							</p>
						</div>
						<div class="text-right">
							<p class="text-base font-semibold text-gray-900">{formatMoney(d.amountKobo, d.currency)}</p>
							{#if d.evidenceCount}
								<p class="mt-0.5 text-xs text-gray-500">{d.evidenceCount} evidence file(s)</p>
							{/if}
						</div>
					</div>

					{#if d.status === 'OPEN' || d.status === 'NEEDS_RESPONSE' || d.status === 'UNDER_REVIEW'}
						{#if resolvingId === d.id}
							<div class="mt-3 rounded-md border bg-gray-50 p-3">
								<div class="flex items-center gap-3">
									<label class="flex items-center gap-1 text-xs">
										<input type="radio" bind:group={resolutionType} value="WON" />
										<span>Won (release reserve)</span>
									</label>
									<label class="flex items-center gap-1 text-xs">
										<input type="radio" bind:group={resolutionType} value="LOST" />
										<span>Lost (refund customer)</span>
									</label>
								</div>
								<textarea
									rows="2"
									bind:value={resolutionNote}
									placeholder="Resolution note (audit log)"
									class="mt-2 w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-xs"
								></textarea>
								<div class="mt-2 flex justify-end gap-2">
									<button
										on:click={() => {
											resolvingId = '';
											resolutionNote = '';
										}}
										class="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs"
									>
										Cancel
									</button>
									<button
										on:click={handleResolve}
										disabled={processing === d.id}
										class="rounded-md {resolutionType === 'WON' ? 'bg-green-600' : 'bg-red-600'} px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
									>
										{processing === d.id ? 'Resolving…' : `Confirm ${resolutionType === 'WON' ? 'won' : 'lost'}`}
									</button>
								</div>
							</div>
						{:else}
							<button
								on:click={() => {
									resolvingId = d.id;
									resolutionNote = '';
								}}
								class="mt-3 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
							>
								Resolve
							</button>
						{/if}
					{/if}

					{#if d.resolution}
						<p class="mt-2 text-xs text-gray-500">
							Resolved as <strong>{d.resolution}</strong> {fmtDate(d.resolvedAt)}{#if d.resolutionNotes} — {d.resolutionNotes}{/if}
						</p>
					{/if}
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
