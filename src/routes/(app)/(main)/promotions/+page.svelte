<script lang="ts">
	/**
	 * GAP 9 — "My promotions".
	 *
	 * Every event this user promotes, in one place, with earnings split into
	 * the three states that actually matter to them:
	 *
	 *   PENDING  — the buyer can still get a refund, so this can vanish.
	 *   ELIGIBLE — past the refund window; the host can pay it now.
	 *   PAID     — in their wallet.
	 *
	 * Showing a single "earned" figure would be the friendly-looking lie:
	 * a promoter would see a number, spend against it mentally, and watch it
	 * drop when a refund lands.
	 *
	 * There is no "all my promotions" endpoint — promoter records are scoped
	 * per event by design (a promoter belongs to an event, not the platform).
	 * So this page resolves the user's attending/created events and asks each
	 * one for `promoters/me`, keeping the authorisation model intact rather
	 * than adding a cross-event read.
	 */
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { isAuthenticated } from '$lib/stores/auth.store';
	import { formatMoney } from '$lib/utils/money';
	import { getMyEvents } from '$lib/services/event.services';
	import {
		bpsToPercentLabel,
		getMyPromoterRecord,
		type Promoter,
		type PromoterAttribution
	} from '$lib/services/promoter.services';

	interface Row {
		event: any;
		promoter: Promoter;
		attributions: PromoterAttribution[];
	}

	let rows: Row[] = [];
	let loading = true;
	let copiedCode = '';

	$: totals = rows.reduce(
		(acc, r) => {
			for (const a of r.attributions) {
				if (a.payoutStatus === 'PENDING') acc.pending += a.commissionKobo ?? 0;
				else if (a.payoutStatus === 'ELIGIBLE') acc.eligible += a.commissionKobo ?? 0;
				else if (a.payoutStatus === 'PAID') acc.paid += a.commissionKobo ?? 0;
			}
			acc.clicks += r.promoter.totals?.clicks ?? 0;
			acc.sold += r.promoter.totals?.ticketsSold ?? 0;
			return acc;
		},
		{ pending: 0, eligible: 0, paid: 0, clicks: 0, sold: 0 }
	);

	async function load() {
		if (!$isAuthenticated) {
			loading = false;
			return;
		}
		loading = true;
		try {
			const events = await getMyEvents().catch(() => []);
			const candidates = (Array.isArray(events) ? events : (events as any)?.events ?? []).slice(0, 60);

			const results = await Promise.all(
				candidates.map(async (ev: any) => {
					const id = ev?._id ?? ev?.id;
					if (!id) return null;
					const res = await getMyPromoterRecord(id);
					// Only events where this user is actually a promoter.
					if (!res.promoter) return null;
					return { event: ev, promoter: res.promoter, attributions: res.attributions } as Row;
				})
			);

			rows = results.filter(Boolean) as Row[];
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function shareUrl(row: Row): string {
		const base = row.event?.customLinkSlug
			? `${location.origin}/e/${row.event.customLinkSlug}`
			: `${location.origin}/event-page/${row.event?._id ?? row.event?.id}`;
		return `${base}?ref=${row.promoter.refCode}`;
	}

	async function copy(row: Row) {
		try {
			await navigator.clipboard.writeText(shareUrl(row));
			copiedCode = row.promoter.refCode;
			setTimeout(() => (copiedCode = ''), 2000);
		} catch {
			/* clipboard can be blocked; the link is visible on screen regardless */
		}
	}

	function stateOf(row: Row, status: PromoterAttribution['payoutStatus']): number {
		return row.attributions
			.filter((a) => a.payoutStatus === status)
			.reduce((s, a) => s + (a.commissionKobo ?? 0), 0);
	}
</script>

<svelte:head>
	<title>My promotions · Rondwell</title>
</svelte:head>

<div class="max-w-5xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-[#131517] md:text-4xl">My promotions</h1>
		<p class="mt-2 text-sm text-[#83808D]">
			Events you're promoting, and what you've earned from each.
		</p>
	</div>

	{#if !$isAuthenticated}
		<div class="rounded-2xl border border-[#EBECED] bg-[#FDFDFD] p-8 text-center">
			<p class="mb-4 text-sm text-[#83808D]">Sign in to see the events you're promoting.</p>
			<a
				href="/auth?returnUrl=%2Fpromotions"
				class="inline-flex rounded-lg bg-[#F31A7C] px-4 py-2.5 text-sm font-medium text-white no-underline hover:opacity-90"
			>
				Sign in
			</a>
		</div>
	{:else if loading}
		<div class="space-y-3">
			{#each Array(3) as _}
				<div class="h-28 animate-pulse rounded-2xl bg-[#F0EFF1]"></div>
			{/each}
		</div>
	{:else if rows.length === 0}
		<div class="rounded-2xl border border-[#EBECED] bg-[#FDFDFD] p-10 text-center">
			<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FDF0F6]">
				<Icon icon="mdi:bullhorn-outline" class="h-7 w-7 text-[#F31A7C]" />
			</div>
			<h3 class="mb-1 text-lg font-semibold text-[#131517]">You're not promoting anything yet</h3>
			<p class="mx-auto mb-5 max-w-sm text-sm text-[#83808D]">
				When an event has promoter mode on, you'll see an "Apply to promote" card on its page.
				Approved promoters earn a cut of every ticket sold through their link.
			</p>
			<a
				href="/discover"
				class="inline-flex rounded-lg bg-[#F31A7C] px-4 py-2.5 text-sm font-medium text-white no-underline hover:opacity-90"
			>
				Find events
			</a>
		</div>
	{:else}
		<!-- Three states, never summed into one. -->
		<div class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
			<div class="rounded-xl border border-[#EBECED] bg-[#FDFDFD] p-4">
				<p class="mb-1 text-xs font-medium text-[#83808D]">Tickets sold</p>
				<p class="text-lg font-semibold text-[#131517]">{totals.sold}</p>
			</div>
			<div class="rounded-xl border border-[#EBECED] bg-[#FDFDFD] p-4">
				<p class="mb-1 text-xs font-medium text-[#83808D]" title="Still inside the refund window">
					Pending
				</p>
				<p class="text-lg font-semibold text-[#B26A00]">{formatMoney(totals.pending, 'NGN')}</p>
			</div>
			<div class="rounded-xl border border-[#EBECED] bg-[#FDFDFD] p-4">
				<p class="mb-1 text-xs font-medium text-[#83808D]">Awaiting payout</p>
				<p class="text-lg font-semibold text-[#3CBD2C]">{formatMoney(totals.eligible, 'NGN')}</p>
			</div>
			<div class="rounded-xl border border-[#EBECED] bg-[#FDFDFD] p-4">
				<p class="mb-1 text-xs font-medium text-[#83808D]">Paid to you</p>
				<p class="text-lg font-semibold text-[#131517]">{formatMoney(totals.paid, 'NGN')}</p>
			</div>
		</div>

		<div class="space-y-3">
			{#each rows as row (row.promoter._id)}
				{@const ev = row.event}
				<div class="rounded-2xl border border-[#EBECED] bg-[#FDFDFD] p-4">
					<div class="flex flex-wrap items-start gap-4">
						{#if ev?.coverPictureUrl || ev?.displayPictureUrl}
							<img
								src={ev.coverPictureUrl || ev.displayPictureUrl}
								alt=""
								class="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
							/>
						{/if}

						<div class="min-w-0 flex-1">
							<div class="mb-1 flex flex-wrap items-center gap-2">
								<a
									href={ev?.customLinkSlug ? `/e/${ev.customLinkSlug}` : `/event-page/${ev?._id ?? ev?.id}`}
									class="truncate font-semibold text-[#131517] no-underline hover:underline"
								>
									{ev?.title ?? 'Event'}
								</a>
								<span
									class="rounded-full px-2 py-0.5 text-[10px] font-medium {row.promoter.status === 'APPROVED'
										? 'bg-[#E3F4E1] text-[#3CBD2C]'
										: row.promoter.status === 'PENDING'
											? 'bg-[#FFF4E5] text-[#B26A00]'
											: 'bg-[#EBECED] text-[#5D646F]'}"
								>
									{row.promoter.status.charAt(0) + row.promoter.status.slice(1).toLowerCase()}
								</span>
								<span class="text-xs text-[#83808D]">
									{bpsToPercentLabel(row.promoter.commissionPercent)} commission
								</span>
							</div>

							{#if row.promoter.status === 'APPROVED'}
								<div class="mb-3 flex items-center gap-2 rounded-lg bg-[#F7F7F8] px-2.5 py-1.5">
									<span class="flex-1 truncate text-[11px] text-[#5D646F]">{shareUrl(row)}</span>
									<button
										on:click={() => copy(row)}
										class="flex-shrink-0 rounded-md bg-[#F31A7C] px-2 py-1 text-[11px] font-medium text-white hover:opacity-90"
									>
										{copiedCode === row.promoter.refCode ? 'Copied' : 'Copy'}
									</button>
								</div>
							{/if}

							<div class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-5">
								<div>
									<p class="text-[#83808D]">Clicks</p>
									<p class="font-medium text-[#131517]">{row.promoter.totals?.clicks ?? 0}</p>
								</div>
								<div>
									<p class="text-[#83808D]">Registrations</p>
									<p class="font-medium text-[#131517]">{row.promoter.totals?.registrations ?? 0}</p>
								</div>
								<div>
									<p class="text-[#83808D]">Pending</p>
									<p class="font-medium text-[#B26A00]">
										{formatMoney(stateOf(row, 'PENDING'), 'NGN')}
									</p>
								</div>
								<div>
									<p class="text-[#83808D]">Awaiting payout</p>
									<p class="font-medium text-[#3CBD2C]">
										{formatMoney(stateOf(row, 'ELIGIBLE'), 'NGN')}
									</p>
								</div>
								<div>
									<p class="text-[#83808D]">Paid</p>
									<p class="font-medium text-[#131517]">{formatMoney(stateOf(row, 'PAID'), 'NGN')}</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<p class="mt-4 flex items-start gap-1.5 text-xs text-[#83808D]">
			<Icon icon="mdi:information-outline" class="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
			Commission becomes payable once the host's refund window closes on each sale — that's why
			some of it shows as pending. Payouts land in your Rondwell wallet.
		</p>
	{/if}
</div>
