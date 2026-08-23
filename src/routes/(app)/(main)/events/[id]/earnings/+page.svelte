<script lang="ts">
	import { goto } from '$app/navigation';
	import { csvCell } from '$lib/utils/csv';
	import { page } from '$app/stores';
	import {
		earningsSourceMeta,
		getEventEarnings,
		getEventSalesSummary,
		getUserSubscriptionInfo,
		type EarningsSource,
		type SalesSummary
	} from '$lib/services/wallet.services';
	import SalesTimelineChart from '$lib/components/SalesTimelineChart.svelte';
	import { getEventCache } from '$lib/stores/eventCache.store';
	import { clickOutside } from '$lib/utils/constant';
	import { formatMoney, koboToMajor } from '$lib/utils/money';
	import { COMMON_TIMEZONES, getBrowserTz } from '$lib/utils/tz';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	$: eventId = $page.params.id ?? '';

	// Use cached event data
	$: ({ event: eventStore, collections: collectionsStore, loading: loadingStore, error: errorStore } = getEventCache(eventId));
	$: rawEvent = $eventStore;
	$: cachedCollections = $collectionsStore;
	$: loading = $loadingStore;
	$: error = $errorStore;

	$: collectionName = cachedCollections.find(
		(c: any) => c._id === rawEvent?.collectionId || c.id === rawEvent?.collectionId
	)?.name ?? 'My Collection';
	$: eventData = rawEvent ? { title: rawEvent.title ?? 'Untitled Event', collection: collectionName, collectionId: rawEvent.collectionId ?? '' } : null;

	let searchQuery = '';
	let statusFilter = 'All';
	let showStatusDropdown = false;
	let dateFilter = 'All Time';
	let showDateDropdown = false;
	// Celebration layer — the earnings feed is now a union of ticket sales and
	// non-ticket contributions, so the organizer needs to slice by source.
	let sourceFilter = 'All';
	let showSourceDropdown = false;
	let loadingEarnings = true;

	let earnings: any[] = [];
	let feeRate = 0.06;
	let feePercent = 6;
	let earningsPage = 1;
	const earningsPerPage = 20;

	// FE-P3-12 (NEW-1.4 / FA-9.1) — unified sales-summary feed.
	// Replaces the old client-side merge of getUserTransactions +
	// getEarningsSummary. Fall back gracefully if the endpoint isn't yet
	// available in production (loadingSummary stays true → existing
	// per-row totals continue rendering).
	let salesSummary: SalesSummary | null = null;
	let loadingSummary = true;
	let summaryError = '';
	// FE-P3-07 (NEW-9.3) — explicit IANA tz so day-buckets match the org's locale.
	let timezone = getBrowserTz();
	let showTzDropdown = false;

	const statusOptions = ['All', 'Completed', 'Pending', 'Refunded'];
	const dateOptions = ['All Time', 'Today', 'This Week', 'This Month', 'Last 3 Months', 'Last 6 Months'];
	const sourceOptions: Array<{ value: string; label: string }> = [
		{ value: 'All', label: 'All sources' },
		{ value: 'TICKET', label: 'Ticket sales' },
		{ value: 'WISHLIST', label: 'Gifts (registry)' },
		{ value: 'RSVP_CONTRIBUTION', label: 'Guest contributions' },
		{ value: 'GIFT_LINK', label: 'Gift links' }
	];
	$: sourceFilterLabel =
		sourceOptions.find((o) => o.value === sourceFilter)?.label ?? 'All sources';

	/** Rows from the union feed carry `source`; older ticket-only rows do not. */
	function rowSource(e: any): EarningsSource {
		return (e?.source as EarningsSource) ?? 'TICKET';
	}

	// Hoisted out of the markup: `{@const}` is only legal as the immediate
	// child of a block tag, and this one sits inside a plain <div>.
	const ticketMeta = earningsSourceMeta('TICKET');

	function koboToNaira(amount: number): number {
		// FE-P1-01 / FE-P1-16 — legacy alias for the kobo→major conversion
		// in the NGN bucket. New aggregations should call `koboToMajor` and
		// pass the row's actual currency. Preserved here so the existing
		// reactive blocks below compile while we transition.
		return koboToMajor(amount, 'NGN');
	}

	/**
	 * FE-P1-01 — currency-aware aggregation. The earnings list contains rows
	 * in whatever currency the ticket was sold in. We bucket by `currency`
	 * so a USD-only event renders `$X` and an NGN-only event renders `₦X`,
	 * never mixing them. The pretty-print helper below picks the dominant
	 * currency for a single-line summary, falling back to the row's own
	 * currency when iterating per-row.
	 */
	function bucketByCurrency(rows: any[], pred: (r: any) => boolean): Record<string, number> {
		const out: Record<string, number> = {};
		for (const r of rows) {
			if (!pred(r)) continue;
			const ccy = (r.currency || 'NGN').toUpperCase();
			out[ccy] = (out[ccy] ?? 0) + Number(r.totalAmount ?? 0);
		}
		return out;
	}

	function summarizeBuckets(buckets: Record<string, number>): string {
		const entries = Object.entries(buckets).filter(([, kobo]) => kobo > 0);
		if (entries.length === 0) return formatMoney(0, 'NGN');
		return entries.map(([ccy, kobo]) => formatMoney(kobo, ccy)).join(' · ');
	}

	function bucketSum(buckets: Record<string, number>, multiplier = 1): Record<string, number> {
		const out: Record<string, number> = {};
		for (const [ccy, kobo] of Object.entries(buckets)) {
			out[ccy] = Math.round(kobo * multiplier);
		}
		return out;
	}

	$: totalEarningsByCurrency = bucketByCurrency(earnings, (e: any) => e.status !== 'REFUNDED');
	$: completedEarningsByCurrency = bucketByCurrency(earnings, (e: any) => e.status === 'COMPLETED');
	$: pendingEarningsByCurrency = bucketByCurrency(earnings, (e: any) => e.status === 'PENDING');
	$: platformFeesByCurrency = bucketSum(completedEarningsByCurrency, feeRate);
	$: netEarningsByCurrency = bucketSum(completedEarningsByCurrency, 1 - feeRate);

	// Legacy NGN-only scalars retained for any downstream maths that hasn't
	// migrated yet (none currently — the cards below all use the buckets).
	$: totalEarnings = (totalEarningsByCurrency.NGN ?? 0) / 100;
	$: completedEarnings = (completedEarningsByCurrency.NGN ?? 0) / 100;
	$: pendingEarnings = (pendingEarningsByCurrency.NGN ?? 0) / 100;
	$: platformFees = completedEarnings * feeRate;
	$: netEarnings = completedEarnings - platformFees;

	$: filteredEarnings = earnings.filter((e: any) => {
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			const name = (e.metaData?.purchaserName || e.metaData?.userName || '').toLowerCase();
			const email = (e.metaData?.purchaserEmail || e.metaData?.userEmail || '').toLowerCase();
			const ticketName = (e.metaData?.ticketTypeName || '').toLowerCase();
			if (!name.includes(q) && !email.includes(q) && !ticketName.includes(q)) return false;
		}
		if (statusFilter !== 'All' && e.status !== statusFilter.toUpperCase()) return false;
		if (sourceFilter !== 'All' && rowSource(e) !== sourceFilter) return false;
		if (dateFilter !== 'All Time') {
			const now = new Date();
			const created = new Date(e.paidAt || e.createdAt);
			if (dateFilter === 'Today') {
				if (created.toDateString() !== now.toDateString()) return false;
			} else if (dateFilter === 'This Week') {
				const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
				if (created < weekAgo) return false;
			} else if (dateFilter === 'This Month') {
				if (created.getMonth() !== now.getMonth() || created.getFullYear() !== now.getFullYear()) return false;
			} else if (dateFilter === 'Last 3 Months') {
				const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
				if (created < threeMonthsAgo) return false;
			} else if (dateFilter === 'Last 6 Months') {
				const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
				if (created < sixMonthsAgo) return false;
			}
		}
		return true;
	});

	$: earningsTotalPages = Math.ceil(filteredEarnings.length / earningsPerPage);
	$: pagedEarnings = filteredEarnings.slice((earningsPage - 1) * earningsPerPage, earningsPage * earningsPerPage);
	$: if (statusFilter || dateFilter || searchQuery || sourceFilter) earningsPage = 1;

	/**
	 * GAP 9 — promoter commissions.
	 *
	 * Loaded separately and allowed to fail: an event with promoter mode off
	 * gets `null` here and the whole block simply doesn't render, so the
	 * earnings page of an ordinary ticketed event is untouched.
	 */
	let promoterSummary: {
		currency: string;
		pendingKobo: number;
		eligibleKobo: number;
		paidKobo: number;
		eligibleCount: number;
		pendingCount: number;
	} | null = null;

	/**
	 * Net once every commission is accounted for.
	 *
	 * PAID is already gone from the wallet; ELIGIBLE and PENDING are still
	 * owed. All three are subtracted, because the honest answer to "what do I
	 * actually keep" includes money that is committed but not yet moved.
	 */
	$: netAfterCommissions = salesSummary
		? salesSummary.totals.net -
			((promoterSummary?.paidKobo ?? 0) +
				(promoterSummary?.eligibleKobo ?? 0) +
				(promoterSummary?.pendingKobo ?? 0))
		: 0;

	async function loadPromoterSummary() {
		try {
			const { getPromoterPayoutSummary } = await import('$lib/services/promoter.services');
			promoterSummary = await getPromoterPayoutSummary(eventId);
		} catch {
			promoterSummary = null;
		}
	}

	onMount(() => {
		if (eventId) {
			fetchEarnings();
			loadFeeRate();
			loadSalesSummary();
			loadPromoterSummary();
		}
	});

	async function loadSalesSummary() {
		loadingSummary = true;
		summaryError = '';
		try {
			salesSummary = await getEventSalesSummary(eventId, { tz: timezone });
		} catch (e: any) {
			// Fall back to the legacy per-row aggregation. Don't surface a
			// hard error — the page still renders the table below.
			console.warn('[earnings] sales-summary unavailable, using legacy aggregation:', e?.message);
			salesSummary = null;
		} finally {
			loadingSummary = false;
		}
	}

	async function changeTimezone(tz: string) {
		timezone = tz;
		showTzDropdown = false;
		await loadSalesSummary();
	}

	// FE-P3-12 — reconciliation guard: warn if the timeline.gross sum
	// drifts from the headline `gross` figure. The backend already logs
	// this; surfacing it here lets the organizer refresh.
	$: timelineDrift = salesSummary
		? Math.abs(salesSummary.timeline.reduce((sum, d) => sum + d.gross, 0) - salesSummary.gross) > 1
		: false;

	async function loadFeeRate() {
		try {
			const info = await getUserSubscriptionInfo();
			feeRate = info.feeRate;
			feePercent = Math.round(feeRate * 100);
		} catch { /* use defaults */ }
	}

	async function fetchEarnings() {
		loadingEarnings = true;
		try {
			const result = await getEventEarnings(eventId, { limit: 100, tz: timezone });
			earnings = result.data ?? [];
		} catch (e: any) {
			console.error('Failed to fetch earnings:', e);
		} finally {
			loadingEarnings = false;
		}
	}

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function formatTime(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
	}

	function formatCurrency(amount: number, currency: string = 'NGN'): string {
		// FE-P1-01 / FE-P1-16 — replaces a hardcoded `Intl.NumberFormat({
		// currency: 'NGN' })` block. Drives the canonical helper, which
		// renders in the row's actual currency.
		const ccy = currency || 'NGN';
		return formatMoney(Math.round(amount * 100), ccy);
	}

	function getStatusStyle(status: string): string {
		switch (status) {
			case 'COMPLETED': return 'bg-green-100 text-green-700';
			case 'PENDING': return 'bg-yellow-100 text-yellow-700';
			case 'REFUNDED': return 'bg-red-100 text-red-700';
			// Contributions can terminate FAILED (abandoned checkout); ticket
			// payments never surfaced this status, hence the addition.
			case 'FAILED': return 'bg-red-50 text-red-500';
			default: return 'bg-gray-100 text-gray-700';
		}
	}

	function getUserInitials(e: any): string {
		const name = e.metaData?.purchaserName || e.metaData?.userName || 'U';
		return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
	}

	function getUserName(e: any): string {
		return e.metaData?.purchaserName || e.metaData?.userName || 'Unknown';
	}

	function getUserEmail(e: any): string {
		return e.metaData?.purchaserEmail || e.metaData?.userEmail || '';
	}

	function getTicketType(e: any): string {
		return e.metaData?.ticketTypeName || 'Ticket';
	}

	function isGroupPurchase(e: any): boolean {
		return !!(e.isGroupPurchase || e.metaData?.isGroupPurchase);
	}

	function getGroupCount(e: any): number {
		return Number(e.groupMembersCount ?? e.metaData?.groupMembersCount ?? 0);
	}

	/**
	 * Fee + net for one row, in MAJOR units.
	 *
	 * Ticket rows predate the stored-fee columns, so their fee is re-derived
	 * from the organizer's rate — that is how this page has always worked.
	 * Contribution rows carry `platformFeeKobo` / `netKobo` stamped at
	 * settlement, so we read those verbatim: re-deriving would disagree with
	 * the ledger for anything settled under a different plan rate.
	 */
	function rowFeeNet(e: any, ccy: string): { fee: number; net: number } {
		const gross = koboToMajor(Number(e.totalAmount ?? 0), ccy);
		if (rowSource(e) !== 'TICKET' && typeof e.platformFeeKobo === 'number') {
			const fee = koboToMajor(Number(e.platformFeeKobo ?? 0), ccy);
			const net = koboToMajor(Number(e.netKobo ?? Math.max(0, Number(e.totalAmount ?? 0) - Number(e.platformFeeKobo ?? 0))), ccy);
			return { fee, net };
		}
		const fee = e.status === 'COMPLETED' ? gross * feeRate : 0;
		return { fee, net: gross - fee };
	}

	/**
	 * H-28 — the hand-rolled encoder here is gone; every cell goes through
	 * `csvCell`.
	 *
	 * The version this replaced was the worst of the three sites, because it
	 * was wrong in two independent ways:
	 *
	 * **Field breakout.** `.map(v => `"${v}"`)` wrapped every value in quotes
	 * without doubling the quotes inside it, and the one field that could
	 * contain a quote had them replaced with apostrophes on the way past
	 * (`.replace(/"/g, "'")`) — a workaround that silently corrupts a gift
	 * message rather than escaping it. Any other column containing a `"` — a
	 * display name, a ticket type — broke the row and shifted every subsequent
	 * column.
	 *
	 * **Formula injection.** No leading-character guard at all. `getUserName`
	 * and the gift `message` are both attendee-supplied free text, and this
	 * file is downloaded and opened in a spreadsheet by the organizer — the
	 * person with access to the event's money.
	 *
	 * `csvCell` doubles embedded quotes properly, so the message no longer
	 * needs mangling and round-trips intact.
	 */
	function downloadCSV() {
		if (filteredEarnings.length === 0) return;
		const headers = ['Source', 'Name', 'Email', 'Time', 'Date', 'Item', 'Amount', 'Currency', 'Fee', 'Net', 'Status', 'Note'];
		const rows = filteredEarnings.map((e: any) => {
			const ccy = (e.currency || 'NGN').toUpperCase();
			const gross = koboToMajor(Number(e.totalAmount ?? 0), ccy);
			const { fee, net } = rowFeeNet(e, ccy);
			return [
				earningsSourceMeta(rowSource(e)).label,
				getUserName(e),
				getUserEmail(e),
				formatTime(e.paidAt || e.createdAt),
				formatDate(e.paidAt || e.createdAt),
				getTicketType(e),
				gross.toFixed(2),
				ccy,
				fee > 0 ? fee.toFixed(2) : '0',
				net.toFixed(2),
				e.status,
				// A gift often carries a message; it belongs in the export so
				// the host can write thank-you notes offline. No longer
				// quote-mangled — `csvCell` escapes it correctly.
				e.metaData?.message ?? ''
			].map(csvCell).join(',');
		});
		const csv = [headers.map(csvCell).join(','), ...rows].join('\r\n');
		// `\uFEFF` — a UTF-8 BOM, so Excel on Windows reads the accented
		// characters in Nigerian names correctly instead of as mojibake.
		const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `earnings-${eventId}-${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

{#if error}
	<div class="flex h-64 items-center justify-center text-red-500">{error}</div>
{:else}
<div class="max-w-6xl">
	<!-- Back button + Header -->
	<div class="mb-6">
		<button on:click={() => goto(`/events/${eventId}`)} class="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
			<Icon icon="mdi:arrow-left" class="text-lg" /> Back to Event
		</button>
		{#if loading}
			<div class="h-9 w-3/4 animate-pulse rounded bg-gray-200"></div>
		{:else if eventData}
			<div class="flex items-center gap-2 mb-1">
				<span class="text-sm text-[#83808D]">{eventData.collection}</span>
				<svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.827148 0.795898C1.49266 0.146359 2.45588 0.00140483 3.28223 0.438477L8.91895 3.4043H8.91797C9.61211 3.76739 10.0449 4.48319 10.0449 5.26758C10.0449 6.05184 9.61196 6.76678 8.91797 7.12988L8.91895 7.13086L3.28223 10.0957C2.96323 10.2657 2.62676 10.3467 2.29004 10.3467C1.75372 10.3466 1.23549 10.137 0.827148 9.73926C0.160836 9.0889 0.000384912 8.12521 0.416016 7.29395L1.2041 5.71875C1.34288 5.44119 1.34292 5.10404 1.20312 4.82031V4.81934L0.416016 3.24023C0.000612916 2.4091 0.161042 1.44617 0.827148 0.795898Z" fill="#83808D" stroke="#83808D" stroke-width="0.37461"/><rect x="5.0584" y="5.85137" width="3.37149" height="1.12383" rx="0.561915" transform="rotate(-180 5.0584 5.85137)" fill="#83808D" stroke="#83808D" stroke-width="0.37461"/></svg>
			</div>
			<h1 class="text-2xl font-bold sm:text-3xl md:text-4xl">{eventData.title}</h1>
			<p class="mt-1 text-sm text-[#8C8F93]">Track ticket sales and revenue for this event.</p>
		{/if}
	</div>

	<!-- Summary Cards -->
	{#if salesSummary && !loadingSummary}
		<!-- FE-P3-12 — unified sales-summary KPIs. -->
		<!-- Gateway fee is intentionally omitted: it is borne by the attendee at
		     checkout (pass-on model) and is not deducted from the organizer's
		     net, so surfacing it here only confused organizers. -->
		<!-- Headline totals now span EVERY revenue source (tickets + gifts +
		     contributions), so the number here matches the wallet. The
		     ticket-only split lives in the "Revenue by source" row below. -->
		<div class="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
			<div class="rounded-xl border bg-white p-4">
				<p class="text-xs text-gray-500">Gross</p>
				<p class="mt-1 text-xl font-semibold">{formatMoney(salesSummary.totals.gross, salesSummary.currency)}</p>
			</div>
			<div class="rounded-xl border bg-white p-4">
				<!-- H-83 — the fee figure is marked when it is an ESTIMATE.
				     The backend used to re-price every historical sale at the
				     organizer's CURRENT tier rate and present the result as
				     fact, so upgrading FREE -> PLUS retrospectively restated
				     every past sale. It now sums the immutable WalletEntry
				     ledger and reports `platformFeeBasis`; only events with no
				     ledger coverage fall back to an estimate, and that is said
				     here rather than hidden. -->
				<p class="text-xs text-gray-500">
					Platform fee
					{#if salesSummary.platformFeeBasis === 'ESTIMATED'}
						<span
							class="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700"
							title="No fee ledger entries cover this event, so this figure is estimated at your current plan rate rather than the rate charged at the time of sale."
						>Estimated</span>
					{/if}
				</p>
				<p class="mt-1 text-xl font-semibold text-red-500">-{formatMoney(salesSummary.totals.platformFee, salesSummary.currency)}</p>
			</div>
			<div class="rounded-xl border bg-white p-4">
				<p class="text-xs text-gray-500">Net</p>
				<p class="mt-1 text-xl font-semibold text-green-600">{formatMoney(salesSummary.totals.net, salesSummary.currency)}</p>
			</div>
		</div>

		<!-- GAP 9 — promoter commissions, as a NEGATIVE line.
		     Commission leaves the organizer's wallet, so a net figure that
		     ignored it would overstate what they actually keep. Shown only
		     when promoter mode has produced something, and split by state
		     because pending commission can still be reversed by a refund. -->
		{#if promoterSummary && (promoterSummary.paidKobo > 0 || promoterSummary.eligibleKobo > 0 || promoterSummary.pendingKobo > 0)}
			<div class="mb-6 rounded-xl border bg-white">
				<div class="flex items-center justify-between border-b px-4 py-2">
					<span class="text-xs font-medium text-gray-500">Promoter commissions</span>
					<a href="/events/{eventId}/planning?tab=promoters" class="text-xs text-pink-600 hover:underline">
						Manage
					</a>
				</div>
				<div class="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
					<div class="p-4">
						<p class="text-xs text-gray-500">Paid out</p>
						<p class="mt-1 text-lg font-semibold text-red-500">
							−{formatMoney(promoterSummary.paidKobo, promoterSummary.currency)}
						</p>
						<p class="text-xs text-gray-400">already deducted from your wallet</p>
					</div>
					<div class="p-4">
						<p class="text-xs text-gray-500">Ready to pay</p>
						<p class="mt-1 text-lg font-semibold text-amber-600">
							−{formatMoney(promoterSummary.eligibleKobo, promoterSummary.currency)}
						</p>
						<p class="text-xs text-gray-400">{promoterSummary.eligibleCount} awaiting payout</p>
					</div>
					<div class="p-4">
						<p class="text-xs text-gray-500">Pending</p>
						<p class="mt-1 text-lg font-semibold text-gray-500">
							−{formatMoney(promoterSummary.pendingKobo, promoterSummary.currency)}
						</p>
						<p class="text-xs text-gray-400">still inside the refund window</p>
					</div>
				</div>
				<div class="border-t px-4 py-2.5">
					<div class="flex items-center justify-between text-sm">
						<span class="text-gray-500">Net after all promoter commissions</span>
						<span class="font-semibold text-green-700">
							{formatMoney(netAfterCommissions, salesSummary.currency)}
						</span>
					</div>
				</div>
			</div>
		{/if}

		<!-- Revenue by source — only rendered once there IS non-ticket
		     revenue, so an ordinary ticketed event's page is unchanged. -->
		{#if salesSummary.contributions.count > 0}
			<div class="mb-6 rounded-xl border bg-white">
				<div class="border-b px-4 py-2 text-xs font-medium text-gray-500">Revenue by source</div>
				<div class="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
					<div class="p-4">
						<div class="mb-1 flex items-center gap-2">
							<span class="rounded-full px-2 py-0.5 text-[11px] font-medium" style="background-color: {ticketMeta.bg}; color: {ticketMeta.fg};">
								{ticketMeta.short}
							</span>
							<span class="text-xs text-gray-400">{salesSummary.ticketsSold} sold</span>
						</div>
						<p class="text-lg font-semibold text-green-700">{formatMoney(salesSummary.net, salesSummary.currency)}</p>
						<p class="text-xs text-gray-400">net · {formatMoney(salesSummary.gross, salesSummary.currency)} gross</p>
					</div>
					{#each salesSummary.contributions.bySource as row}
						{@const meta = earningsSourceMeta(row.source)}
						<div class="p-4">
							<div class="mb-1 flex items-center gap-2">
								<span class="rounded-full px-2 py-0.5 text-[11px] font-medium" style="background-color: {meta.bg}; color: {meta.fg};">
									{meta.short}
								</span>
								<span class="text-xs text-gray-400">{row.count} {row.count === 1 ? 'gift' : 'gifts'}</span>
							</div>
							<p class="text-lg font-semibold text-green-700">{formatMoney(row.net, salesSummary.currency)}</p>
							<p class="text-xs text-gray-400">net · {formatMoney(row.gross, salesSummary.currency)} gross</p>
						</div>
					{/each}
				</div>
			</div>
		{/if}
		<!-- Inventory + ticket counts -->
		<div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
			<div class="rounded-xl border bg-white p-4">
				<p class="text-xs text-gray-500">Tickets sold</p>
				<p class="mt-1 text-xl font-semibold">{salesSummary.ticketsSold}</p>
			</div>
			<div class="rounded-xl border bg-white p-4">
				<p class="text-xs text-gray-500">Refunded</p>
				<p class="mt-1 text-xl font-semibold text-yellow-600">{salesSummary.ticketsRefunded}</p>
			</div>
			<div class="rounded-xl border bg-white p-4">
				<p class="text-xs text-gray-500">Refunded amount</p>
				<p class="mt-1 text-xl font-semibold text-yellow-600">{formatMoney(salesSummary.refunded, salesSummary.currency)}</p>
			</div>
			<div class="rounded-xl border bg-white p-4">
				<p class="text-xs text-gray-500">Available</p>
				<p class="mt-1 text-xl font-semibold">{salesSummary.ticketsAvailable === -1 ? 'Unlimited' : salesSummary.ticketsAvailable}</p>
			</div>
		</div>

		{#if timelineDrift}
			<div class="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
				<Icon icon="mdi:alert-circle-outline" class="mr-1 inline text-base" />
				Data sync issue detected — please refresh to see the latest figures.
			</div>
		{/if}

		<!-- Daily timeline -->
		{#if salesSummary.timeline.length > 0}
			<div class="mb-6">
				<h3 class="mb-2 text-sm font-medium text-gray-700">Daily timeline</h3>
				<SalesTimelineChart data={salesSummary.timeline} currency={salesSummary.currency} />
			</div>
		{/if}

		<!-- Per-ticket-type breakdown -->
		{#if salesSummary.byTicketType.length > 0}
			<div class="mb-6 overflow-hidden rounded-xl border bg-white">
				<div class="border-b bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500">By ticket type</div>
				<table class="w-full text-sm">
					<thead class="text-xs text-gray-400">
						<tr>
							<th class="px-4 py-2 text-left font-medium">Ticket</th>
							<th class="px-4 py-2 text-right font-medium">Sold</th>
							<th class="px-4 py-2 text-right font-medium">Refunded</th>
							<th class="px-4 py-2 text-right font-medium">Gross</th>
							<th class="px-4 py-2 text-right font-medium">Net</th>
						</tr>
					</thead>
					<tbody>
						{#each salesSummary.byTicketType as row}
							<tr class="border-t">
								<td class="px-4 py-2">{row.name}</td>
								<td class="px-4 py-2 text-right">{row.sold}</td>
								<td class="px-4 py-2 text-right text-yellow-700">{row.refunded}</td>
								<td class="px-4 py-2 text-right">{formatMoney(row.gross, row.currency)}</td>
								<td class="px-4 py-2 text-right text-green-700">{formatMoney(row.net, row.currency)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		<!-- TZ footer + dropdown -->
		<div class="mb-4 flex items-center justify-end gap-2">
			<span class="text-xs text-gray-500" title="All amounts are stored in UTC. Times are converted to your selected zone for display only.">
				Showing data in {timezone}
			</span>
			<div use:clickOutside={() => (showTzDropdown = false)} class="relative">
				<button on:click={() => (showTzDropdown = !showTzDropdown)} class="flex items-center gap-1 rounded-md bg-[#EBECED] px-2 py-1 text-xs text-[#616265]">
					<Icon icon="mdi:earth" class="text-sm" /> Change
				</button>
				{#if showTzDropdown}
					<div class="absolute right-0 z-20 mt-1 max-h-72 w-56 overflow-auto rounded-lg border bg-white shadow-lg">
						{#each COMMON_TIMEZONES as tz}
							<button on:click={() => changeTimezone(tz.value)} class="block w-full px-3 py-2 text-left text-xs hover:bg-gray-50 {timezone === tz.value ? 'font-medium text-pink-600' : ''}">{tz.label}</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{:else if loadingSummary}
		<div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
			{#each [1, 2, 3, 4] as _}
				<div class="rounded-xl border bg-white p-4">
					<div class="h-4 w-16 animate-pulse rounded bg-gray-200"></div>
					<div class="mt-2 h-7 w-24 animate-pulse rounded bg-gray-200"></div>
				</div>
			{/each}
		</div>
	{:else}
	<!-- Legacy summary fallback when sales-summary endpoint is unavailable. -->
	<div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div class="rounded-xl border bg-white p-4">
			<p class="text-xs text-gray-500">Total Earnings</p>
			{#if loadingEarnings}
				<div class="mt-1 h-7 w-24 animate-pulse rounded bg-gray-200"></div>
			{:else}
				<p class="mt-1 text-xl font-semibold">{summarizeBuckets(totalEarningsByCurrency)}</p>
			{/if}
		</div>
		<div class="rounded-xl border bg-white p-4">
			<p class="text-xs text-gray-500">Completed</p>
			{#if loadingEarnings}
				<div class="mt-1 h-7 w-24 animate-pulse rounded bg-gray-200"></div>
			{:else}
				<p class="mt-1 text-xl font-semibold text-green-600">{summarizeBuckets(completedEarningsByCurrency)}</p>
			{/if}
		</div>
		<div class="rounded-xl border bg-white p-4">
			<p class="text-xs text-gray-500">Platform Fee ({feePercent}%)</p>
			{#if loadingEarnings}
				<div class="mt-1 h-7 w-24 animate-pulse rounded bg-gray-200"></div>
			{:else}
				<p class="mt-1 text-xl font-semibold text-red-500">-{summarizeBuckets(platformFeesByCurrency)}</p>
			{/if}
		</div>
		<div class="rounded-xl border bg-white p-4">
			<p class="text-xs text-gray-500">Pending</p>
			{#if loadingEarnings}
				<div class="mt-1 h-7 w-24 animate-pulse rounded bg-gray-200"></div>
			{:else}
				<p class="mt-1 text-xl font-semibold text-yellow-600">{summarizeBuckets(pendingEarningsByCurrency)}</p>
			{/if}
		</div>
	</div>
	{/if}

	<!-- Search + Filters -->
	<div class="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
		<div class="relative w-full max-w-sm">
			<input type="text" bind:value={searchQuery} placeholder="Search by name, email, or ticket type..." class="h-[43px] w-full rounded-lg bg-white py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none" />
			<span class="absolute top-2.5 left-3 text-gray-400"><img src="/search-favorite.png" alt="search" class="h-5 w-5" /></span>
		</div>
		<div class="flex items-center gap-2">
			<div class="flex h-[33px] w-[33px] cursor-pointer items-center justify-center rounded-lg bg-[#EBECED] hover:bg-gray-200" on:click={downloadCSV} role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && downloadCSV()}><img src="/download-icon.svg" alt="download CSV" /></div>
			<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]"><img src="/export.svg" alt="export" /></div>
			<div use:clickOutside={() => (showSourceDropdown = false)} class="relative">
				<button on:click={() => (showSourceDropdown = !showSourceDropdown)} class="flex items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
					<Icon icon="mdi:shape-outline" class="text-base" /> {sourceFilterLabel}
				</button>
				{#if showSourceDropdown}
					<div class="absolute right-0 z-10 mt-1 w-48 rounded-lg border bg-white shadow-lg">
						{#each sourceOptions as opt}
							<button on:click={() => { sourceFilter = opt.value; showSourceDropdown = false; }} class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 {sourceFilter === opt.value ? 'font-medium text-pink-600' : ''}">{opt.label}</button>
						{/each}
					</div>
				{/if}
			</div>
			<div use:clickOutside={() => (showStatusDropdown = false)} class="relative">
				<button on:click={() => (showStatusDropdown = !showStatusDropdown)} class="flex items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
					<img src="/filter-edit.svg" alt="filter" class="h-5 w-5" /> {statusFilter}
				</button>
				{#if showStatusDropdown}
					<div class="absolute right-0 z-10 mt-1 w-40 rounded-lg border bg-white shadow-lg">
						{#each statusOptions as opt}
							<button on:click={() => { statusFilter = opt; showStatusDropdown = false; }} class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 {statusFilter === opt ? 'font-medium text-pink-600' : ''}">{opt}</button>
						{/each}
					</div>
				{/if}
			</div>
			<div use:clickOutside={() => (showDateDropdown = false)} class="relative">
				<button on:click={() => (showDateDropdown = !showDateDropdown)} class="flex items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
					<Icon icon="mdi:calendar-outline" class="text-base" /> {dateFilter}
				</button>
				{#if showDateDropdown}
					<div class="absolute right-0 z-10 mt-1 w-40 rounded-lg border bg-white shadow-lg">
						{#each dateOptions as opt}
							<button on:click={() => { dateFilter = opt; showDateDropdown = false; }} class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 {dateFilter === opt ? 'font-medium text-pink-600' : ''}">{opt}</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Earnings Table -->
	{#if loadingEarnings}
		<div class="overflow-hidden rounded-xl bg-white shadow-sm">
			{#each [1, 2, 3, 4] as _}
				<div class="flex animate-pulse items-center gap-4 border-b px-4 py-4 last:border-none">
					<div class="h-8 w-8 rounded-full bg-gray-200"></div>
					<div class="h-4 w-32 rounded bg-gray-200"></div>
					<div class="h-4 w-24 rounded bg-gray-200"></div>
					<div class="h-4 w-20 rounded bg-gray-200"></div>
					<div class="h-4 w-16 rounded bg-gray-200"></div>
				</div>
			{/each}
		</div>
	{:else if filteredEarnings.length > 0}
		<div class="overflow-visible rounded-xl bg-white shadow-sm">
			<!-- Table Header -->
			<div class="hidden border-b px-4 py-3 text-xs font-medium text-gray-400 lg:flex">
				<div class="w-[20%]">User</div>
				<div class="w-[9%]">Time</div>
				<div class="w-[11%]">Date</div>
				<div class="w-[11%]">Source</div>
				<div class="w-[12%]">Item</div>
				<div class="w-[11%] text-right">Amount</div>
				<div class="w-[9%] text-right">Fee</div>
				<div class="w-[10%] text-right">Net</div>
				<div class="w-[7%] text-right">Status</div>
			</div>
			{#each pagedEarnings as e}
				{@const rowCcy = (e.currency || 'NGN').toUpperCase()}
				{@const gross = koboToMajor(Number(e.totalAmount ?? 0), rowCcy)}
				{@const feeNet = rowFeeNet(e, rowCcy)}
				{@const srcMeta = earningsSourceMeta(rowSource(e))}
				<div class="flex flex-col gap-2 border-b px-4 py-3 last:border-none lg:flex-row lg:items-center lg:gap-0">
					<!-- User -->
					<div class="flex items-center gap-3 lg:w-[20%]">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-xs font-medium text-white">
							{getUserInitials(e)}
						</div>
						<div class="min-w-0">
							<p class="text-sm font-medium truncate">{getUserName(e)}</p>
							<p class="text-xs text-gray-400 truncate">{getUserEmail(e)}</p>
						</div>
					</div>
					<!-- Time -->
					<div class="text-sm text-gray-500 lg:w-[9%]">{formatTime(e.paidAt || e.createdAt)}</div>
					<!-- Date -->
					<div class="text-sm text-gray-500 lg:w-[11%]">{formatDate(e.paidAt || e.createdAt)}</div>
					<!-- Source -->
					<div class="lg:w-[11%]">
						<span
							class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
							style="background-color: {srcMeta.bg}; color: {srcMeta.fg};"
							title={srcMeta.label}
						>
							<Icon icon={srcMeta.icon} class="text-sm" />
							{srcMeta.short}
						</span>
					</div>
					<!-- Item (ticket type, or what the gift was for) -->
					<div class="flex flex-wrap items-center gap-1 lg:w-[12%]">
						<span class="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 truncate max-w-full">{getTicketType(e)}</span>
						{#if isGroupPurchase(e)}
							<span class="rounded-full bg-[#EDE9FE] px-2 py-1 text-xs font-medium text-[#513BE2]" title="Group registration">
								👥 Group{getGroupCount(e) > 0 ? ` ×${getGroupCount(e)}` : ''}
							</span>
						{/if}
						{#if e.metaData?.isAnonymous}
							<span class="rounded-full bg-[#F0EFF1] px-2 py-1 text-xs font-medium text-[#83808D]" title="Hidden on the public contributor wall — you can still see them">
								Anon
							</span>
						{/if}
						{#if e.metaData?.message}
							<span class="text-xs text-gray-400 truncate max-w-full" title={e.metaData.message}>“{e.metaData.message}”</span>
						{/if}
					</div>
					<!-- Amount -->
					<div class="text-sm font-medium lg:w-[11%] lg:text-right">{formatCurrency(gross, rowCcy)}</div>
					<!-- Platform Fee -->
					<div class="text-sm text-red-400 lg:w-[9%] lg:text-right">{feeNet.fee > 0 ? `-${formatCurrency(feeNet.fee, rowCcy)}` : '–'}</div>
					<!-- Net -->
					<div class="text-sm font-medium text-green-700 lg:w-[10%] lg:text-right">{formatCurrency(feeNet.net, rowCcy)}</div>
					<!-- Status -->
					<div class="lg:w-[7%] lg:text-right">
						<span class="rounded-full px-2 py-1 text-xs font-medium {getStatusStyle(e.status)}">{e.status.charAt(0) + e.status.slice(1).toLowerCase()}</span>
					</div>
				</div>
			{/each}
		</div>

		<!-- Pagination -->
		{#if earningsTotalPages > 1}
			<div class="mt-4 flex items-center justify-center gap-2">
				<button
					on:click={() => { earningsPage = Math.max(1, earningsPage - 1); }}
					disabled={earningsPage === 1}
					class="rounded-md px-3 py-1 text-sm text-[#616265] transition-colors hover:bg-[#EBECED] disabled:opacity-40"
				>
					Previous
				</button>
				<span class="text-sm text-gray-500">Page {earningsPage} of {earningsTotalPages}</span>
				<button
					on:click={() => { earningsPage = Math.min(earningsTotalPages, earningsPage + 1); }}
					disabled={earningsPage === earningsTotalPages}
					class="rounded-md px-3 py-1 text-sm text-[#616265] transition-colors hover:bg-[#EBECED] disabled:opacity-40"
				>
					Next
				</button>
			</div>
		{/if}
	{:else}
		<div class="flex h-60 flex-col items-center justify-center rounded-xl bg-white">
			<Icon icon="mdi:cash-off" class="mb-2 text-4xl text-gray-300" />
			<p class="text-lg font-medium text-[#A2ACB2]">No earnings yet</p>
			<p class="mt-1 text-sm text-gray-400">Ticket sales, gifts and guest contributions all show up here.</p>
		</div>
	{/if}
</div>
{/if}
