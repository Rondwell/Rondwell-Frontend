<!--
	FE-P5-07 — Admin refund tracker.

	Every refund is money leaving the platform. Before this page existed, refunds
	were visible admin-side ONLY as an aggregate `refundRate` percentage on the
	finance dashboard: no list, no reasons, no initiators, and — most importantly —
	no visibility of FAILED refunds, where the organizer has already been debited
	but the attendee was never paid. Those need to be found and fixed by hand.

	Style follows `/hq/finance/disputes`: back-link, filter row, summary cards,
	card rows, cursor "Load more", and a detail drawer.
-->
<script lang="ts">
	import {
		downloadRefundsCsv,
		getRefund,
		listRefunds,
		type AdminRefund,
		type AdminRefundDetail,
		type AdminRefundTotals,
		type RefundFilters
	} from '$lib/services/adminRefund.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let refunds: AdminRefund[] = [];
	let totals: AdminRefundTotals = {
		count: 0,
		refundedKobo: 0,
		platformFeeReturnedKobo: 0,
		byStatus: {}
	};
	let loading = true;
	let loadingMore = false;
	let exporting = false;
	let error = '';
	let nextCursor: string | null = null;

	// Filters
	let statusFilter: RefundFilters['status'] = '';
	let kindFilter: RefundFilters['refundKind'] = '';
	let currencyFilter = '';
	let search = '';
	let fromDate = '';
	let toDate = '';
	let searchTimer: ReturnType<typeof setTimeout>;

	// Detail drawer
	let showDetail = false;
	let detail: AdminRefundDetail | null = null;
	let detailLoading = false;
	let detailError = '';

	onMount(() => load(true));

	function currentFilters(cursor: string | null = null): RefundFilters {
		return {
			status: statusFilter || undefined,
			refundKind: kindFilter || undefined,
			currency: currencyFilter || undefined,
			search: search.trim() || undefined,
			from: fromDate || undefined,
			to: toDate || undefined,
			cursor,
			limit: 30
		};
	}

	async function load(reset = true) {
		if (reset) {
			loading = true;
			refunds = [];
			nextCursor = null;
		} else {
			loadingMore = true;
		}
		error = '';
		try {
			const result = await listRefunds(currentFilters(reset ? null : nextCursor));
			refunds = reset ? result.items : [...refunds, ...result.items];
			nextCursor = result.nextCursor;
			totals = result.totals;
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			loading = false;
			loadingMore = false;
		}
	}

	function handleSearch() {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => load(true), 300);
	}

	async function openDetail(id: string) {
		showDetail = true;
		detail = null;
		detailError = '';
		detailLoading = true;
		try {
			detail = await getRefund(id);
		} catch (e) {
			detailError = financialErrorMessage(e);
		} finally {
			detailLoading = false;
		}
	}

	function closeDetail() {
		showDetail = false;
		detail = null;
	}

	async function handleExport() {
		exporting = true;
		error = '';
		try {
			await downloadRefundsCsv(currentFilters());
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			exporting = false;
		}
	}

	function statusColor(s: string): string {
		if (s === 'COMPLETED') return 'bg-green-100 text-green-700';
		// FAILED is the one that needs a human: money left the organizer but never
		// reached the attendee.
		if (s === 'FAILED') return 'bg-red-100 text-red-700';
		if (s === 'REVERSED') return 'bg-gray-100 text-gray-600';
		return 'bg-amber-100 text-amber-700'; // PENDING
	}

	function kindLabel(k: string): string {
		if (k === 'VENDOR_INVOICE') return 'Vendor invoice';
		if (k === 'WALLET_TOPUP') return 'Wallet top-up';
		return 'Ticket';
	}

	function fmtDate(iso?: string | null): string {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleString('en-GB', {
				day: 'numeric',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return String(iso);
		}
	}

	$: failedCount = totals.byStatus?.FAILED ?? 0;
	$: pendingCount = totals.byStatus?.PENDING ?? 0;
</script>

<svelte:head><title>Refunds — Rondwell HQ</title></svelte:head>

<div>
	<a href="/hq/finance" class="inline-flex items-center gap-1 text-xs text-pink-600 hover:underline">
		<Icon icon="mdi:arrow-left" /> Back to Finance
	</a>

	<div class="mt-4 flex flex-wrap items-start justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold text-gray-900">Refunds</h1>
			<p class="mt-1 max-w-2xl text-sm text-gray-500">
				Every refund issued across the platform — ticket, vendor invoice and wallet top-up.
				Rondwell is the merchant of record, so each of these is money leaving our balance.
			</p>
		</div>
		<button
			on:click={handleExport}
			disabled={exporting}
			class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
		>
			<Icon icon="mdi:download-outline" />
			{exporting ? 'Exporting…' : 'Export CSV'}
		</button>
	</div>

	<!--
		Failed-refund alarm. A FAILED refund means the organizer's wallet was
		debited and the gateway refused to pay the attendee — the customer is
		waiting for money that is not coming, which is the single most likely
		trigger for a chargeback.
	-->
	{#if failedCount > 0}
		<div class="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
			<Icon icon="mdi:alert-octagon-outline" class="mt-0.5 shrink-0 text-lg text-red-600" />
			<div>
				<p class="text-sm font-semibold text-red-900">
					{failedCount} refund{failedCount === 1 ? '' : 's'} failed at the gateway
				</p>
				<p class="mt-0.5 text-xs text-red-800">
					The organizer has been debited but the customer has not been paid. These need manual
					follow-up — an unresolved failed refund is the most common cause of a chargeback.
				</p>
				<button
					on:click={() => {
						statusFilter = 'FAILED';
						load(true);
					}}
					class="mt-2 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
				>
					Show failed refunds
				</button>
			</div>
		</div>
	{/if}

	<!-- Summary -->
	<div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-xl border border-gray-200 bg-white p-4">
			<p class="text-xs text-[#C1C2C2]">Refunds (filtered)</p>
			<p class="mt-1 text-xl font-semibold text-gray-900">{totals.count.toLocaleString()}</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4">
			<p class="text-xs text-[#C1C2C2]">Total refunded</p>
			<p class="mt-1 text-xl font-semibold text-gray-900">
				{formatMoney(totals.refundedKobo, currencyFilter || 'NGN')}
			</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4">
			<p class="text-xs text-[#C1C2C2]">Platform fee returned</p>
			<p class="mt-1 text-xl font-semibold text-gray-900">
				{formatMoney(totals.platformFeeReturnedKobo, currencyFilter || 'NGN')}
			</p>
			<p class="mt-1 text-[11px] text-gray-400">Commission given back to organizers</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4">
			<p class="text-xs text-[#C1C2C2]">Needs attention</p>
			<p class="mt-1 text-xl font-semibold {failedCount > 0 ? 'text-[#E53935]' : 'text-gray-900'}">
				{failedCount} failed
			</p>
			<p class="mt-1 text-[11px] text-gray-400">{pendingCount} awaiting gateway confirmation</p>
		</div>
	</div>

	<!-- Filters -->
	<div class="mt-5 flex flex-wrap items-end gap-3">
		<div class="relative min-w-[220px] flex-1">
			<input
				type="text"
				bind:value={search}
				on:input={handleSearch}
				placeholder="Search reason, transaction, event, organizer…"
				class="h-[38px] w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm focus:ring-1 focus:ring-[#513BE2] focus:outline-none"
			/>
			<Icon
				icon="mdi:magnify"
				class="absolute top-2.5 left-2.5 text-base text-gray-400"
			/>
		</div>
		<label class="flex flex-col gap-1 text-xs">
			<span class="text-gray-500">Status</span>
			<select
				bind:value={statusFilter}
				on:change={() => load(true)}
				class="h-[38px] rounded-lg border border-gray-200 bg-white px-2 text-sm"
			>
				<option value="">All</option>
				<option value="PENDING">Pending</option>
				<option value="COMPLETED">Completed</option>
				<option value="FAILED">Failed</option>
				<option value="REVERSED">Reversed</option>
			</select>
		</label>
		<label class="flex flex-col gap-1 text-xs">
			<span class="text-gray-500">Type</span>
			<select
				bind:value={kindFilter}
				on:change={() => load(true)}
				class="h-[38px] rounded-lg border border-gray-200 bg-white px-2 text-sm"
			>
				<option value="">All</option>
				<option value="TICKET">Ticket</option>
				<option value="VENDOR_INVOICE">Vendor invoice</option>
				<option value="WALLET_TOPUP">Wallet top-up</option>
			</select>
		</label>
		<label class="flex flex-col gap-1 text-xs">
			<span class="text-gray-500">Currency</span>
			<select
				bind:value={currencyFilter}
				on:change={() => load(true)}
				class="h-[38px] rounded-lg border border-gray-200 bg-white px-2 text-sm"
			>
				<option value="">All</option>
				<option value="NGN">NGN</option>
				<option value="USD">USD</option>
			</select>
		</label>
		<label class="flex flex-col gap-1 text-xs">
			<span class="text-gray-500">From</span>
			<input
				type="date"
				bind:value={fromDate}
				on:change={() => load(true)}
				class="h-[38px] rounded-lg border border-gray-200 bg-white px-2 text-sm"
			/>
		</label>
		<label class="flex flex-col gap-1 text-xs">
			<span class="text-gray-500">To</span>
			<input
				type="date"
				bind:value={toDate}
				on:change={() => load(true)}
				class="h-[38px] rounded-lg border border-gray-200 bg-white px-2 text-sm"
			/>
		</label>
	</div>

	{#if error}
		<p class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{/if}

	{#if loading}
		<div class="mt-6 space-y-2">
			{#each [1, 2, 3] as _}
				<div class="h-24 animate-pulse rounded-xl bg-white"></div>
			{/each}
		</div>
	{:else if refunds.length === 0}
		<div class="mt-8 flex h-60 flex-col items-center justify-center rounded-xl bg-white">
			<Icon icon="mdi:cash-refund" class="mb-2 text-4xl text-gray-300" />
			<p class="text-lg font-medium text-gray-700">No refunds</p>
			<p class="mt-1 text-sm text-gray-400">Nothing matches the current filters.</p>
		</div>
	{:else}
		<div class="mt-6 space-y-3">
			{#each refunds as r (r.id)}
				<button
					type="button"
					on:click={() => openDetail(r.id)}
					class="w-full rounded-xl border bg-white p-4 text-left transition hover:bg-gray-50 {r.status ===
					'FAILED'
						? 'border-red-200'
						: 'border-gray-200'}"
				>
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<span class="font-mono text-xs text-gray-500">#{r.id.slice(-10)}</span>
								<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {statusColor(r.status)}">
									{r.status}
								</span>
								<span class="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
									{kindLabel(r.refundKind)}
								</span>
								{#if !r.isFull}
									<span class="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
										Partial
									</span>
								{/if}
								<!--
									Seat-scoped group refunds are their own thing: a group of 4
									refunding one seat must show as one seat, not the whole group.
								-->
								{#if r.groupId}
									<span class="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
										Group · {r.seatCount} seat{r.seatCount === 1 ? '' : 's'}
									</span>
								{/if}
							</div>
							<p class="mt-1 truncate text-sm text-gray-800">{r.reason}</p>
							{#if r.failureReason}
								<p class="mt-1 truncate text-xs text-red-700">
									Gateway: {r.failureReason}
								</p>
							{/if}
							<p class="mt-1 text-xs text-gray-400">
								{fmtDate(r.createdAt)}
								{#if r.initiatorRole} · by {r.initiatorRole}{/if}
							</p>
						</div>
						<div class="shrink-0 text-right">
							<p class="text-base font-semibold text-gray-900">
								{formatMoney(r.refundAmountKobo, r.currency)}
							</p>
							{#if r.platformFeeRefundedKobo > 0}
								<p class="mt-0.5 text-xs text-gray-500">
									incl. {formatMoney(r.platformFeeRefundedKobo, r.currency)} fee returned
								</p>
							{/if}
						</div>
					</div>
				</button>
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

<!-- Detail drawer -->
{#if showDetail}
	<div
		on:click={closeDetail}
		on:keydown={(e) => e.key === 'Escape' && closeDetail()}
		class="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-5 lg:justify-end lg:p-0"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="flex h-full w-full max-w-xl flex-col rounded-xl bg-[#F4F5F6] shadow-xl lg:max-w-lg lg:rounded-none"
			role="document"
			on:click|stopPropagation
			on:keydown|stopPropagation
		>
			<div class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
				<button on:click={closeDetail} class="text-gray-500 hover:text-gray-700">
					<Icon icon="mdi:chevron-double-right" class="text-xl" />
				</button>
				<span class="text-sm font-medium text-gray-500">Refund Details</span>
			</div>

			<div class="flex-1 overflow-y-auto px-6 py-5">
				{#if detailLoading}
					<div class="space-y-3">
						<div class="h-24 animate-pulse rounded-xl bg-white"></div>
						<div class="h-32 animate-pulse rounded-xl bg-white"></div>
					</div>
				{:else if detailError}
					<p class="rounded-md bg-red-50 p-3 text-sm text-red-600">{detailError}</p>
				{:else if detail}
					<!-- Money -->
					<div class="rounded-xl border border-gray-200 bg-white p-4">
						<div class="flex items-start justify-between">
							<div>
								<p class="text-xs text-[#C1C2C2]">Refunded</p>
								<p class="text-2xl font-semibold text-gray-900">
									{formatMoney(detail.refundAmountKobo, detail.currency)}
								</p>
							</div>
							<span class="rounded-full px-2.5 py-0.5 text-xs font-medium {statusColor(detail.status)}">
								{detail.status}
							</span>
						</div>
						<div class="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 text-xs">
							<div>
								<p class="text-[#C1C2C2]">Original sale</p>
								<p class="font-medium text-gray-800">
									{detail.original
										? formatMoney(detail.original.amountKobo, detail.currency)
										: '—'}
								</p>
							</div>
							<div>
								<p class="text-[#C1C2C2]">Platform fee returned</p>
								<p class="font-medium text-gray-800">
									{formatMoney(detail.platformFeeRefundedKobo, detail.currency)}
								</p>
							</div>
							<div>
								<p class="text-[#C1C2C2]">Scope</p>
								<p class="font-medium text-gray-800">
									{detail.isFull ? 'Full refund' : 'Partial refund'}
								</p>
							</div>
							<div>
								<p class="text-[#C1C2C2]">Gateway</p>
								<p class="font-medium text-gray-800">{detail.original?.gateway ?? '—'}</p>
							</div>
						</div>
					</div>

					{#if detail.status === 'FAILED'}
						<div class="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
							<p class="text-sm font-semibold text-red-900">This refund failed at the gateway</p>
							<p class="mt-1 text-xs text-red-800">
								{detail.failureReason ?? 'No gateway detail recorded.'}
							</p>
							<p class="mt-2 text-xs text-red-800">
								The organizer's wallet legs were rolled back, so the platform is not out of pocket
								— but the customer has NOT been paid and is still expecting the money. Contact them
								before they raise a dispute.
							</p>
						</div>
					{/if}

					<!-- Reason -->
					<div class="mt-4 rounded-xl border border-gray-200 bg-white p-4">
						<h3 class="text-sm font-semibold text-gray-700">Reason</h3>
						<p class="mt-1 text-sm text-gray-700">{detail.reason}</p>
						<div class="mt-3 grid grid-cols-2 gap-3 text-xs">
							<div>
								<p class="text-[#C1C2C2]">Initiated by</p>
								<p class="font-medium text-gray-800">{detail.initiatorRole ?? '—'}</p>
								<p class="font-mono text-[11px] text-gray-500">{detail.initiatorId}</p>
							</div>
							<div>
								<p class="text-[#C1C2C2]">Created</p>
								<p class="font-medium text-gray-800">{fmtDate(detail.createdAt)}</p>
							</div>
						</div>
					</div>

					<!-- Parties -->
					{#if detail.original}
						<div class="mt-4 rounded-xl border border-gray-200 bg-white p-4">
							<h3 class="text-sm font-semibold text-gray-700">Parties</h3>
							<div class="mt-3 space-y-3 text-xs">
								<div>
									<p class="text-[#C1C2C2]">Attendee</p>
									<p class="font-medium text-gray-800">{detail.original.attendeeName || '—'}</p>
									<p class="text-gray-500">{detail.original.attendeeEmail || '—'}</p>
								</div>
								<div>
									<p class="text-[#C1C2C2]">Organizer</p>
									<p class="font-medium text-gray-800">{detail.original.organizerName || '—'}</p>
									<p class="text-gray-500">{detail.original.organizerEmail || '—'}</p>
								</div>
							</div>
						</div>
					{/if}

					<!-- Seats -->
					{#if detail.groupId}
						<div class="mt-4 rounded-xl border border-purple-200 bg-white p-4">
							<h3 class="text-sm font-semibold text-gray-700">Group seats released</h3>
							<p class="mt-1 text-xs text-gray-500">
								{detail.registrationIds.length} of
								{detail.ticket?.groupMembersCount || detail.registrationIds.length} seat(s).
								{#if detail.isFull}
									The whole group was released, so every invite link for it is now dead.
								{:else}
									Seat-scoped — the remaining members' tickets are untouched.
								{/if}
							</p>
							<div class="mt-2 max-h-40 overflow-y-auto rounded-lg bg-gray-50 p-2">
								{#each detail.registrationIds as rid}
									<p class="font-mono text-[11px] text-gray-600">{rid}</p>
								{/each}
							</div>
						</div>
					{/if}

					<!-- References -->
					<div class="mt-4 rounded-xl border border-gray-200 bg-white p-4">
						<h3 class="text-sm font-semibold text-gray-700">References</h3>
						<div class="mt-3 space-y-2 text-xs">
							<div>
								<p class="text-[#C1C2C2]">Refund id</p>
								<p class="font-mono break-all text-gray-700">{detail.id}</p>
							</div>
							<div>
								<p class="text-[#C1C2C2]">Original transaction</p>
								<p class="font-mono break-all text-gray-700">{detail.originalTransactionId}</p>
							</div>
							{#if detail.refundGatewayId}
								<div>
									<p class="text-[#C1C2C2]">Gateway refund id</p>
									<p class="font-mono break-all text-gray-700">{detail.refundGatewayId}</p>
								</div>
							{/if}
							{#if detail.eventId}
								<div>
									<p class="text-[#C1C2C2]">Event</p>
									<a
										href={`/hq/finance/events?eventId=${detail.eventId}`}
										class="font-mono break-all text-pink-600 hover:underline"
									>
										{detail.eventId}
									</a>
								</div>
							{/if}
							{#if detail.organizerId}
								<div>
									<p class="text-[#C1C2C2]">Organizer</p>
									<a
										href={`/hq/users/${detail.organizerId}`}
										class="font-mono break-all text-pink-600 hover:underline"
									>
										{detail.organizerId}
									</a>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
