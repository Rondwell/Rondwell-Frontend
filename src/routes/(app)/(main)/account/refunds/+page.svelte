<!--
	FE-P2-01-B — Attendee "My refunds" view.

	Backend reference:
	  - GET /api/v1/payment/refunds/me

	Lists every refund the attendee has received. Linked from
	`TICKET_REFUND_ISSUED` emails.
-->
<script lang="ts">
	import TransactionStatusBadge from '$lib/components/TransactionStatusBadge.svelte';
	import { listMyRefunds, type Refund } from '$lib/services/refund.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import { openReceipt } from '$lib/utils/receipt';
	import SettingsBackButton from '$lib/components/SettingsBackButton.svelte';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let refunds: Refund[] = [];
	let loading = true;
	let error = '';
	let receiptError = '';

	onMount(async () => {
		await loadRefunds();
	});

	async function loadRefunds() {
		loading = true;
		error = '';
		try {
			const result = await listMyRefunds({ limit: 50 });
			refunds = result.items;
		} catch (e: any) {
			error = financialErrorMessage(e);
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
			});
		} catch {
			return iso;
		}
	}

	function viewReceipt(r: Refund) {
		// FE-P4-04 — fall back to the presigned URL endpoint when the
		// row didn't ship a `receiptUrl` directly. The PDF carries a
		// REFUNDED watermark for refund transactions.
		if (r.receiptUrl) {
			window.open(r.receiptUrl, '_blank', 'noopener,noreferrer');
			return;
		}
		const txId = (r as any).transactionId ?? (r as any).ticketPaymentId ?? r.id;
		if (txId) openReceipt(txId, { onError: (m) => (receiptError = m) });
	}

	function statusEta(r: Refund): string {
		if (r.status === 'COMPLETED') return 'Funds back in your account';
		if (r.status === 'GATEWAY_PROCESSING') return 'Funds typically settle within 3–7 business days';
		if (r.status === 'INITIATED') return 'Awaiting gateway processing';
		if (r.status === 'FAILED') return r.failureReason ?? 'Refund failed — contact support';
		return '';
	}
</script>

<svelte:head>
	<title>My refunds — Rondwell</title>
</svelte:head>

<div class="max-w-4xl">
	<SettingsBackButton fallbackTab="payments" />
	<div class="mb-6">
		<h1 class="text-2xl font-bold sm:text-3xl">My refunds</h1>
		<p class="mt-1 text-sm text-[#8C8F93]">
			Refunds issued to you for events and bookings. Funds are returned through the original payment
			method.
		</p>
	</div>

	{#if error}
		<p class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{/if}

	{#if receiptError}
		<div class="mb-4 flex items-start justify-between rounded-md bg-yellow-50 p-3 text-xs text-yellow-700">
			<span>{receiptError}</span>
			<button on:click={() => (receiptError = '')} aria-label="Dismiss"><Icon icon="mdi:close" /></button>
		</div>
	{/if}

	{#if loading}
		<div class="space-y-2">
			{#each [1, 2, 3] as _}
				<div class="flex animate-pulse items-center gap-4 rounded-lg bg-white p-4">
					<div class="h-10 w-10 rounded-lg bg-gray-200"></div>
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
			<p class="mt-1 text-sm text-gray-400">When an organizer issues a refund, it'll appear here.</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each refunds as r}
				<div class="rounded-xl bg-white p-4 shadow-sm">
					<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div class="flex items-start gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600"
							>
								<Icon icon="mdi:cash-refund" class="text-xl" />
							</div>
							<div>
								<p class="text-sm font-semibold">{r.eventName ?? 'Event refund'}</p>
								<p class="text-xs text-gray-500">{r.ticketTypeName ?? 'Ticket'}</p>
								<p class="mt-1 text-xs text-gray-400">
									{formatDate(r.createdAt)}
									{#if r.gateway}
										<span> · via {r.gateway}</span>
									{/if}
									{#if r.gatewayReference}
										<span> · ref {r.gatewayReference.slice(-8)}</span>
									{/if}
								</p>
								{#if r.reason}
									<p class="mt-1 text-xs italic text-gray-500">"{r.reason}"</p>
								{/if}
							</div>
						</div>
						<div class="flex items-center gap-3 lg:flex-col lg:items-end">
							<TransactionStatusBadge status={r.status} tooltip={statusEta(r)} />
							<p class="text-base font-semibold text-gray-900">
								{formatMoney(r.amountKobo, r.currency)}
							</p>
							<button
								on:click={() => viewReceipt(r)}
								class="inline-flex items-center gap-1 text-xs font-medium text-pink-600 hover:underline"
								title="Receipts are generated within 60s of payment. PDFs for refunded payments carry a REFUNDED watermark."
							>
								<Icon icon="mdi:receipt-text-outline" class="text-sm" /> Receipt
							</button>
						</div>
					</div>
					{#if statusEta(r) && r.status !== 'COMPLETED'}
						<p class="mt-2 border-t pt-2 text-xs text-gray-500">{statusEta(r)}</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
