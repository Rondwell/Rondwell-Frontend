<!--
	FE-P2-01-A — Organizer "Refunds" tab per event.

	Backend reference: P2-01 / FA-7.1 / NEW-5.1
	  - GET /api/v1/payment/refunds?eventId=...

	Lists every refund issued for the event. Status filter chip bar plus a
	receipt link per row (P4-04 ships the PDF; until then the link gates
	on `receiptUrl` being present in the row).
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { listEventRefunds, type Refund, type RefundStatus } from '$lib/services/refund.services';
	import { getEventCache } from '$lib/stores/eventCache.store';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import TransactionStatusBadge from '$lib/components/TransactionStatusBadge.svelte';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	$: eventId = $page.params.id ?? '';
	$: ({ event: eventStore } = getEventCache(eventId));
	$: rawEvent = $eventStore;
	$: eventTitle = rawEvent?.title ?? 'Event';

	const STATUSES: Array<{ key: RefundStatus | 'ALL'; label: string }> = [
		{ key: 'ALL', label: 'All' },
		{ key: 'INITIATED', label: 'Initiated' },
		{ key: 'GATEWAY_PROCESSING', label: 'Processing' },
		{ key: 'COMPLETED', label: 'Completed' },
		{ key: 'FAILED', label: 'Failed' },
	];

	let activeStatus: RefundStatus | 'ALL' = 'ALL';
	let refunds: Refund[] = [];
	let loading = false;
	let error = '';

	$: if (eventId) loadRefunds(activeStatus);

	async function loadRefunds(status: RefundStatus | 'ALL') {
		loading = true;
		error = '';
		try {
			const result = await listEventRefunds(eventId, {
				status: status === 'ALL' ? undefined : status,
				limit: 50,
			});
			refunds = result.items;
		} catch (e: any) {
			error = financialErrorMessage(e);
			refunds = [];
		} finally {
			loading = false;
		}
	}

	function formatDate(iso: string): string {
		try {
			return new Date(iso).toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
				hour: 'numeric',
				minute: '2-digit',
			});
		} catch {
			return iso;
		}
	}

	function viewReceipt(r: Refund) {
		if (r.receiptUrl) {
			window.open(r.receiptUrl, '_blank');
		} else if (r.transactionId) {
			window.open(`/api/v1/payment/receipts/${r.transactionId}/url`, '_blank');
		}
	}
</script>

<svelte:head>
	<title>Refunds — {eventTitle}</title>
</svelte:head>

<div class="max-w-6xl">
	<div class="mb-6">
		<button
			on:click={() => goto(`/events/${eventId}`)}
			class="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
		>
			<Icon icon="mdi:arrow-left" class="text-lg" /> Back to event
		</button>
		<h1 class="text-2xl font-bold sm:text-3xl">Refunds</h1>
		<p class="mt-1 text-sm text-[#8C8F93]">
			Refunds issued for {eventTitle}. The platform fee is returned to the organizer when a refund
			completes.
		</p>
	</div>

	<!-- Status filter chips -->
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
					<div class="h-8 w-8 rounded-full bg-gray-200"></div>
					<div class="h-4 w-40 rounded bg-gray-200"></div>
					<div class="h-4 w-24 rounded bg-gray-200"></div>
					<div class="ml-auto h-4 w-20 rounded bg-gray-200"></div>
				</div>
			{/each}
		</div>
	{:else if refunds.length === 0}
		<div class="flex h-60 flex-col items-center justify-center rounded-xl bg-white">
			<Icon icon="mdi:cash-refund" class="mb-2 text-4xl text-gray-300" />
			<p class="text-lg font-medium text-[#A2ACB2]">No refunds yet</p>
			<p class="mt-1 text-sm text-gray-400">
				Refunds you issue will appear here. Open a participant or earnings row to start one.
			</p>
		</div>
	{:else}
		<div class="overflow-visible rounded-xl bg-white shadow-sm">
			<div class="hidden border-b px-4 py-3 text-xs font-medium text-gray-400 lg:flex">
				<div class="w-1/4">Attendee</div>
				<div class="w-1/6">Ticket</div>
				<div class="w-1/6">Date</div>
				<div class="w-1/6">Status</div>
				<div class="w-1/6 text-right">Amount</div>
				<div class="w-1/12 text-right">Receipt</div>
			</div>
			{#each refunds as r}
				<div
					class="flex flex-col gap-2 border-b px-4 py-3 last:border-none lg:flex-row lg:items-center lg:gap-0"
				>
					<div class="lg:w-1/4">
						<p class="text-sm font-medium">{r.attendeeName ?? r.attendeeEmail ?? 'Attendee'}</p>
						{#if r.attendeeEmail}
							<p class="truncate text-xs text-gray-400">{r.attendeeEmail}</p>
						{/if}
						{#if r.reason}
							<p class="mt-1 truncate text-xs italic text-gray-500" title={r.reason}>{r.reason}</p>
						{/if}
					</div>
					<div class="text-sm text-gray-700 lg:w-1/6">{r.ticketTypeName ?? '—'}</div>
					<div class="text-sm text-gray-500 lg:w-1/6">{formatDate(r.createdAt)}</div>
					<div class="lg:w-1/6">
						<TransactionStatusBadge
							status={r.status}
							tooltip={r.failureReason ?? ''}
						/>
					</div>
					<div class="text-sm font-medium lg:w-1/6 lg:text-right">
						{formatMoney(r.amountKobo, r.currency)}
					</div>
					<div class="lg:w-1/12 lg:text-right">
						{#if r.transactionId || r.receiptUrl}
							<button
								on:click={() => viewReceipt(r)}
								class="rounded-md bg-[#EBECED] px-3 py-1 text-xs font-medium text-[#616265] hover:bg-gray-200"
							>
								Receipt
							</button>
						{:else}
							<span class="text-xs text-gray-400">—</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
