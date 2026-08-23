<script lang="ts">
	/**
	 * GAP 9 — promoter mode.
	 *
	 * Three things this screen has to get across, because getting them wrong
	 * costs the organizer real money:
	 *
	 *   1. **Commission is capped at 30%** and comes out of THEIR wallet. The
	 *      input says so, and the server clamps regardless.
	 *   2. **Pending ≠ payable.** A commission inside the refund window can
	 *      still evaporate; only ELIGIBLE rows can be paid. They are shown as
	 *      two separate numbers, never summed into one "owed".
	 *   3. **Spendable ≠ balance.** When a payout is refused for funds, the
	 *      reserve portion is spelled out — otherwise it reads as a bug.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import { formatMoney } from '$lib/utils/money';
	import {
		bpsToPercentLabel,
		getEligiblePayouts,
		getPromoterPayoutSummary,
		getPromoters,
		payPromoterCommissions,
		updatePromoter,
		type EligiblePayout,
		type Promoter,
		type PromoterStatus
	} from '$lib/services/promoter.services';

	export let eventData: any = null;

	$: eventId = $page.params.id ?? '';
	$: promoterEnabled = eventData?.promoter?.enabled === true;

	let loading = true;
	let error = '';
	let notice = '';
	let promoters: Promoter[] = [];
	let summary: Awaited<ReturnType<typeof getPromoterPayoutSummary>> = null;
	let eligible: EligiblePayout[] = [];

	let filter: PromoterStatus | 'ALL' = 'ALL';
	let showPayModal = false;
	let paying = false;
	let shortfall: { requiredKobo: number; availableKobo: number; shortfallKobo: number; payoutReserveKobo: number; currency: string } | null =
		null;

	let editingCommissionFor = '';
	let commissionInput = '';

	const STATUS_STYLES: Record<string, string> = {
		PENDING: 'bg-[#FFF4E5] text-[#B26A00]',
		APPROVED: 'bg-[#E3F4E1] text-[#3CBD2C]',
		REJECTED: 'bg-[#FDECEC] text-[#D92D20]',
		SUSPENDED: 'bg-[#EBECED] text-[#5D646F]'
	};

	$: currency = summary?.currency ?? 'NGN';
	$: pendingApplications = promoters.filter((p) => p.status === 'PENDING');
	$: visible = filter === 'ALL' ? promoters : promoters.filter((p) => p.status === filter);
	$: totalEligibleKobo = eligible.reduce((s, p) => s + p.amountKobo, 0);

	async function load() {
		if (!eventId) return;
		loading = true;
		error = '';
		try {
			const [list, sum, elig] = await Promise.all([
				getPromoters(eventId, { limit: 200 }),
				getPromoterPayoutSummary(eventId),
				getEligiblePayouts(eventId)
			]);
			promoters = list.data;
			summary = sum;
			eligible = elig;
		} catch (e: any) {
			error = e?.message ?? 'Could not load promoters';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function setStatus(promoter: Promoter, status: PromoterStatus) {
		error = '';
		try {
			await updatePromoter(eventId, promoter._id, { status });
			notice =
				status === 'APPROVED'
					? `${promoter.name} can now share their referral link`
					: `${promoter.name} was ${status.toLowerCase()}`;
			await load();
		} catch (e: any) {
			error = e?.message ?? 'Could not update the promoter';
		}
	}

	async function saveCommission(promoter: Promoter) {
		const pct = Number(commissionInput);
		if (!Number.isFinite(pct) || pct < 0) {
			error = 'Enter a percentage between 0 and 30';
			return;
		}
		try {
			// Sent as basis points; the server re-clamps at 3000 regardless of
			// what arrives, so a bypassed input cannot set 100%.
			await updatePromoter(eventId, promoter._id, { commissionPercent: Math.round(pct * 100) });
			editingCommissionFor = '';
			await load();
		} catch (e: any) {
			error = e?.message ?? 'Could not update the commission';
		}
	}

	async function confirmPay() {
		paying = true;
		error = '';
		shortfall = null;
		try {
			const result = await payPromoterCommissions(eventId, eligible, currency);
			showPayModal = false;
			notice =
				result.paidCount > 0
					? `Paid ${result.paidCount} promoter${result.paidCount === 1 ? '' : 's'}`
					: 'No promoters were paid';
			if (result.failed.length > 0) {
				error = `${result.failed.length} payout${result.failed.length === 1 ? '' : 's'} could not be completed: ${result.failed
					.map((f) => f.reason)
					.join('; ')}`;
			}
			await load();
		} catch (e: any) {
			if (e?.code === 'INSUFFICIENT_FUNDS' && e?.meta) {
				// The reserve is why their balance looks bigger than what they can
				// spend. Say it plainly rather than leaving them to guess.
				shortfall = e.meta;
			} else {
				error = e?.message ?? 'Could not pay the commissions';
			}
		} finally {
			paying = false;
		}
	}

	function refLink(promoter: Promoter): string {
		const base =
			eventData?.customLinkSlug
				? `${location.origin}/e/${eventData.customLinkSlug}`
				: `${location.origin}/event-page/${eventId}`;
		return `${base}?ref=${promoter.refCode}`;
	}

	async function copyLink(promoter: Promoter) {
		try {
			await navigator.clipboard.writeText(refLink(promoter));
			notice = `Referral link for ${promoter.name} copied`;
		} catch {
			error = 'Could not copy the link';
		}
	}
</script>

<div>
	<div class="mb-6 flex flex-wrap items-start justify-between gap-3">
		<div>
			<h2 class="text-xl font-semibold text-[#131517]">Promoters</h2>
			<p class="mt-1 text-sm text-[#83808D]">
				Let people sell your event for a cut. You approve who promotes and at what rate.
			</p>
		</div>
		{#if eligible.length > 0}
			<button
				on:click={() => (showPayModal = true)}
				class="flex items-center gap-1.5 rounded-lg bg-[#F31A7C] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
			>
				<Icon icon="mdi:cash-multiple" class="h-4 w-4" />
				Pay commissions ({formatMoney(totalEligibleKobo, currency)})
			</button>
		{/if}
	</div>

	{#if !promoterEnabled}
		<!-- Degrades gracefully: the tab is reachable, but it explains rather than breaking. -->
		<div class="mb-6 flex items-start gap-3 rounded-xl border border-[#EBECED] bg-[#FFF9E6] p-4">
			<Icon icon="mdi:information-outline" class="mt-0.5 h-5 w-5 flex-shrink-0 text-[#B26A00]" />
			<div class="text-sm">
				<p class="font-medium text-[#131517]">Promoter mode is off</p>
				<p class="mt-0.5 text-[#83808D]">
					Turn it on in <a href="/events/{eventId}/settings" class="font-medium text-[#F31A7C] hover:underline">Settings</a>
					so people can apply to promote this event. Anyone already approved keeps their link.
				</p>
			</div>
		</div>
	{/if}

	{#if notice}
		<div class="mb-4 flex items-center gap-2 rounded-lg bg-[#E3F4E1] px-4 py-3 text-sm text-[#2E7D22]">
			<Icon icon="mdi:check-circle-outline" class="h-4 w-4 flex-shrink-0" />
			<span>{notice}</span>
			<button class="ml-auto opacity-70 hover:opacity-100" on:click={() => (notice = '')} aria-label="Dismiss">
				<Icon icon="mdi:close" class="h-4 w-4" />
			</button>
		</div>
	{/if}
	{#if error}
		<div class="mb-4 flex items-start gap-2 rounded-lg bg-[#FDECEC] px-4 py-3 text-sm text-[#D92D20]">
			<Icon icon="mdi:alert-circle-outline" class="mt-0.5 h-4 w-4 flex-shrink-0" />
			<span>{error}</span>
			<button class="ml-auto opacity-70 hover:opacity-100" on:click={() => (error = '')} aria-label="Dismiss">
				<Icon icon="mdi:close" class="h-4 w-4" />
			</button>
		</div>
	{/if}

	{#if loading}
		<div class="space-y-3">
			{#each Array(3) as _}
				<div class="h-20 animate-pulse rounded-xl bg-[#F0EFF1]"></div>
			{/each}
		</div>
	{:else}
		<!-- Commission state, never collapsed into one number. -->
		<div class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
			<div class="rounded-xl border border-[#EBECED] bg-[#FDFDFD] p-4">
				<p class="mb-1 text-xs font-medium text-[#83808D]">Promoters</p>
				<p class="text-lg font-semibold text-[#131517]">
					{promoters.filter((p) => p.status === 'APPROVED').length}
				</p>
			</div>
			<div class="rounded-xl border border-[#EBECED] bg-[#FDFDFD] p-4">
				<p class="mb-1 flex items-center gap-1 text-xs font-medium text-[#83808D]">
					Pending
					<span title="Inside the refund window — not payable yet">
						<Icon icon="mdi:information-outline" class="h-3 w-3" />
					</span>
				</p>
				<p class="text-lg font-semibold text-[#B26A00]">
					{formatMoney(summary?.pendingKobo ?? 0, currency)}
				</p>
			</div>
			<div class="rounded-xl border border-[#EBECED] bg-[#FDFDFD] p-4">
				<p class="mb-1 text-xs font-medium text-[#83808D]">Ready to pay</p>
				<p class="text-lg font-semibold text-[#3CBD2C]">
					{formatMoney(summary?.eligibleKobo ?? 0, currency)}
				</p>
			</div>
			<div class="rounded-xl border border-[#EBECED] bg-[#FDFDFD] p-4">
				<p class="mb-1 text-xs font-medium text-[#83808D]">Paid out</p>
				<p class="text-lg font-semibold text-[#131517]">
					{formatMoney(summary?.paidKobo ?? 0, currency)}
				</p>
			</div>
		</div>

		{#if pendingApplications.length > 0}
			<div class="mb-6 rounded-xl border border-[#F31A7C]/25 bg-[#FDF0F6]/40 p-4">
				<h3 class="mb-3 flex items-center gap-2 text-sm font-semibold text-[#131517]">
					<Icon icon="mdi:account-clock-outline" class="h-4 w-4 text-[#F31A7C]" />
					{pendingApplications.length} application{pendingApplications.length === 1 ? '' : 's'} waiting
				</h3>
				<div class="space-y-2">
					{#each pendingApplications as applicant (applicant._id)}
						<div class="flex flex-wrap items-center gap-3 rounded-lg bg-white p-3">
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium text-[#131517]">{applicant.name}</p>
								<p class="truncate text-xs text-[#83808D]">{applicant.email}</p>
								{#if applicant.note}
									<p class="mt-1 text-xs italic text-[#5D646F]">"{applicant.note}"</p>
								{/if}
							</div>
							<span class="text-xs text-[#83808D]">{bpsToPercentLabel(applicant.commissionPercent)}</span>
							<div class="flex gap-2">
								<button
									on:click={() => setStatus(applicant, 'APPROVED')}
									class="rounded-lg bg-[#3CBD2C] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
								>
									Approve
								</button>
								<button
									on:click={() => setStatus(applicant, 'REJECTED')}
									class="rounded-lg border border-[#EBECED] px-3 py-1.5 text-xs font-medium text-[#5D646F] hover:bg-[#F7F7F8]"
								>
									Decline
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<div class="mb-3 flex flex-wrap gap-2">
			{#each ['ALL', 'APPROVED', 'PENDING', 'SUSPENDED', 'REJECTED'] as f}
				<button
					on:click={() => (filter = f as any)}
					class="rounded-full px-3 py-1.5 text-xs font-medium transition-colors {filter === f
						? 'bg-[#131517] text-white'
						: 'bg-[#EBECED] text-[#5D646F] hover:bg-[#E4E3E6]'}"
				>
					{f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
				</button>
			{/each}
		</div>

		{#if visible.length === 0}
			<div class="rounded-xl border border-dashed border-[#EBECED] p-8 text-center">
				<p class="text-sm text-[#83808D]">
					{promoters.length === 0
						? 'Nobody has applied to promote this event yet. The apply card shows on your public event page once promoter mode is on.'
						: 'No promoters match this filter.'}
				</p>
			</div>
		{:else}
			<div class="overflow-x-auto rounded-xl border border-[#EBECED]">
				<table class="w-full min-w-[820px] text-sm">
					<thead class="bg-[#F7F7F8] text-left text-xs font-medium text-[#83808D]">
						<tr>
							<th class="px-4 py-3">Promoter</th>
							<th class="px-4 py-3 text-right">Clicks</th>
							<th class="px-4 py-3 text-right">Registrations</th>
							<th class="px-4 py-3 text-right">Sold</th>
							<th class="px-4 py-3 text-right">Attributed</th>
							<th class="px-4 py-3 text-right">Rate</th>
							<th class="px-4 py-3 text-right">Earned</th>
							<th class="px-4 py-3">Status</th>
							<th class="px-4 py-3"></th>
						</tr>
					</thead>
					<tbody class="divide-y divide-[#F0EFF1] bg-white">
						{#each visible as promoter (promoter._id)}
							<tr class="hover:bg-[#FCFCFD]">
								<td class="px-4 py-3">
									<p class="font-medium text-[#131517]">{promoter.name}</p>
									<p class="text-xs text-[#83808D]">{promoter.email}</p>
									{#if promoter.status === 'APPROVED'}
										<code class="mt-1 inline-block rounded bg-[#F0EFF1] px-1.5 py-0.5 text-[10px] text-[#5D646F]">
											{promoter.refCode}
										</code>
									{/if}
								</td>
								<td class="px-4 py-3 text-right text-[#5D646F]">{promoter.totals?.clicks ?? 0}</td>
								<td class="px-4 py-3 text-right text-[#5D646F]">{promoter.totals?.registrations ?? 0}</td>
								<td class="px-4 py-3 text-right text-[#5D646F]">{promoter.totals?.ticketsSold ?? 0}</td>
								<td class="px-4 py-3 text-right text-[#5D646F]">
									{formatMoney(promoter.totals?.grossAttributedKobo ?? 0, currency)}
								</td>
								<td class="px-4 py-3 text-right">
									{#if editingCommissionFor === promoter._id}
										<div class="flex items-center justify-end gap-1">
											<input
												type="number"
												min="0"
												max="30"
												step="0.5"
												bind:value={commissionInput}
												class="w-16 rounded border border-[#EBECED] px-1.5 py-1 text-right text-xs focus:border-[#F31A7C] focus:outline-none"
											/>
											<span class="text-xs text-[#83808D]">%</span>
											<button
												on:click={() => saveCommission(promoter)}
												class="rounded p-1 text-[#3CBD2C] hover:bg-[#E3F4E1]"
												aria-label="Save rate"
											>
												<Icon icon="mdi:check" class="h-3.5 w-3.5" />
											</button>
										</div>
									{:else}
										<button
											on:click={() => {
												editingCommissionFor = promoter._id;
												commissionInput = String((promoter.commissionPercent ?? 0) / 100);
											}}
											class="rounded px-1.5 py-0.5 text-[#5D646F] hover:bg-[#F0EFF1]"
											title="Max 30%"
										>
											{bpsToPercentLabel(promoter.commissionPercent)}
										</button>
									{/if}
								</td>
								<td class="px-4 py-3 text-right font-medium text-[#131517]">
									{formatMoney(promoter.totals?.commissionEarnedKobo ?? 0, currency)}
								</td>
								<td class="px-4 py-3">
									<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {STATUS_STYLES[promoter.status]}">
										{promoter.status.charAt(0) + promoter.status.slice(1).toLowerCase()}
									</span>
								</td>
								<td class="px-4 py-3">
									<div class="flex justify-end gap-1">
										{#if promoter.status === 'APPROVED'}
											<button
												on:click={() => copyLink(promoter)}
												class="rounded p-1.5 text-[#5D646F] hover:bg-[#F0EFF1]"
												title="Copy referral link"
												aria-label="Copy referral link"
											>
												<Icon icon="mdi:link-variant" class="h-4 w-4" />
											</button>
											<button
												on:click={() => setStatus(promoter, 'SUSPENDED')}
												class="rounded p-1.5 text-[#B26A00] hover:bg-[#FFF4E5]"
												title="Suspend"
												aria-label="Suspend"
											>
												<Icon icon="mdi:pause-circle-outline" class="h-4 w-4" />
											</button>
										{:else if promoter.status !== 'PENDING'}
											<button
												on:click={() => setStatus(promoter, 'APPROVED')}
												class="rounded p-1.5 text-[#3CBD2C] hover:bg-[#E3F4E1]"
												title="Approve"
												aria-label="Approve"
											>
												<Icon icon="mdi:check-circle-outline" class="h-4 w-4" />
											</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}
</div>

<!-- Pay-commissions confirm -->
{#if showPayModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
		<div class="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
			<h3 class="mb-1 text-base font-semibold text-[#131517]">Pay commissions</h3>
			<p class="mb-4 text-sm text-[#83808D]">
				This transfers from your wallet to {eligible.length} promoter{eligible.length === 1 ? '' : 's'}.
				Only commissions past the refund window are included.
			</p>

			<div class="mb-4 max-h-56 space-y-2 overflow-y-auto rounded-lg bg-[#F7F7F8] p-3">
				{#each eligible as payout (payout.promoterId)}
					<div class="flex items-center justify-between text-sm">
						<span class="truncate text-[#5D646F]">{payout.promoterName}</span>
						<span class="font-medium text-[#131517]">{formatMoney(payout.amountKobo, payout.currency)}</span>
					</div>
				{/each}
				<div class="mt-2 flex items-center justify-between border-t border-[#EBECED] pt-2 text-sm">
					<span class="font-medium text-[#131517]">Total</span>
					<span class="font-semibold text-[#131517]">{formatMoney(totalEligibleKobo, currency)}</span>
				</div>
			</div>

			{#if shortfall}
				<div class="mb-4 rounded-lg bg-[#FDECEC] p-3 text-sm text-[#D92D20]">
					<p class="font-medium">Not enough available balance</p>
					<p class="mt-1 text-xs">
						You need {formatMoney(shortfall.requiredKobo, shortfall.currency)} but only
						{formatMoney(shortfall.availableKobo, shortfall.currency)} is spendable —
						{formatMoney(shortfall.payoutReserveKobo, shortfall.currency)} is held in your payout
						reserve against refunds and chargebacks.
					</p>
				</div>
			{/if}

			<div class="flex gap-2">
				<button
					on:click={() => {
						showPayModal = false;
						shortfall = null;
					}}
					class="flex-1 rounded-lg border border-[#EBECED] px-4 py-2.5 text-sm font-medium text-[#5D646F] hover:bg-[#F7F7F8]"
				>
					Cancel
				</button>
				<button
					on:click={confirmPay}
					disabled={paying}
					class="flex-1 rounded-lg bg-[#F31A7C] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
				>
					{paying ? 'Paying…' : 'Confirm payment'}
				</button>
			</div>
		</div>
	</div>
{/if}
