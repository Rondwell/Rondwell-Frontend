<!--
	FE-P5-03 (NEW-11.1) — Organizer payout reserve panel.

	Drops into the wallet tab. Explains why the withdrawable figure is lower than
	total earnings, and exactly when each held slice unlocks.

	Without this the reserve is invisible until a withdrawal is refused, which is
	the worst possible way to learn about it — the organizer concludes the wallet is
	broken or that we're sitting on their money.
-->
<script lang="ts">
	import {
		getMyPayoutReserve,
		type PayoutReserveSummary
	} from '$lib/services/payoutReserve.services';
	import { formatMoney } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	/** Set false to render nothing until the caller opts in (e.g. tab is visible). */
	export let active = true;

	let summary: PayoutReserveSummary | null = null;
	let loading = true;
	let error = '';
	let expanded = false;

	onMount(load);

	async function load() {
		if (!active) return;
		loading = true;
		error = '';
		try {
			summary = await getMyPayoutReserve();
		} catch (e: any) {
			// Non-fatal: the wallet still works without this panel.
			error = e?.message ?? 'Could not load your payout schedule';
		} finally {
			loading = false;
		}
	}

	function fmtDate(iso?: string | null): string {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'short',
				year: 'numeric'
			});
		} catch {
			return String(iso);
		}
	}

	$: totalHeldKobo = (summary?.held ?? []).reduce((n, c) => n + c.heldKobo, 0);
	$: hasHeld = totalHeldKobo > 0;
	$: nextRelease = (summary?.schedule ?? [])[0] ?? null;
</script>

{#if active}
	{#if loading}
		<div class="h-24 animate-pulse rounded-xl bg-gray-100"></div>
	{:else if error}
		<div class="rounded-xl border border-gray-200 bg-white p-4">
			<p class="text-xs text-gray-500">{error}</p>
			<button on:click={load} class="mt-1 text-xs font-medium text-pink-600 underline">Retry</button>
		</div>
	{:else if summary}
		<div class="rounded-xl border border-gray-200 bg-white p-4">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div class="flex items-start gap-3">
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg {summary.policy
							.mode === 'INSTANT'
							? 'bg-green-50 text-green-600'
							: 'bg-[#EEF0FF] text-[#513BE2]'}"
					>
						<Icon
							icon={summary.policy.mode === 'INSTANT' ? 'mdi:cash-fast' : 'mdi:lock-clock'}
							class="text-xl"
						/>
					</div>
					<div>
						<p class="text-sm font-semibold text-gray-900">
							{summary.policy.mode === 'INSTANT' ? 'Instant payouts' : 'Payout schedule'}
						</p>
						<p class="mt-0.5 max-w-md text-xs text-gray-500">
							{summary.policy.explanation}
						</p>
					</div>
				</div>

				{#if hasHeld}
					<div class="text-right">
						<p class="text-xs text-gray-400">Currently held</p>
						<p class="text-lg font-semibold text-gray-900">
							{#each summary.held.filter((c) => c.heldKobo > 0) as c, i}
								{i > 0 ? ' · ' : ''}{formatMoney(c.heldKobo, c.currency)}
							{/each}
						</p>
						{#if nextRelease}
							<p class="text-[11px] text-gray-400">
								Next release {fmtDate(nextRelease.releaseDueAt)}
							</p>
						{/if}
					</div>
				{/if}
			</div>

			{#if hasHeld}
				<button
					on:click={() => (expanded = !expanded)}
					class="mt-3 flex items-center gap-1 text-xs font-medium text-[#513BE2] hover:underline"
				>
					{expanded ? 'Hide' : 'See'} release schedule
					<Icon icon={expanded ? 'mdi:chevron-up' : 'mdi:chevron-down'} />
				</button>

				{#if expanded}
					<div class="mt-3 space-y-2 border-t border-gray-100 pt-3">
						{#each summary.schedule as h}
							<div class="flex flex-wrap items-center justify-between gap-2">
								<div class="min-w-0">
									<p class="truncate text-sm text-gray-800">
										{h.eventTitle || 'Event'}
									</p>
									<p class="text-[11px] text-gray-400">
										Releases {fmtDate(h.releaseDueAt)}
										{#if h.isProvisionalDate}
											· <span class="text-[#EAAB26]">provisional — we're confirming the event end date</span>
										{/if}
									</p>
								</div>
								<p class="shrink-0 text-sm font-medium text-gray-900">
									{formatMoney(h.heldKobo, h.currency)}
								</p>
							</div>
						{/each}
					</div>
				{/if}

				<div class="mt-3 rounded-lg bg-[#F8F9F9] p-3">
					<p class="text-[11px] leading-relaxed text-gray-500">
						We hold a small share of each ticket sale until just after your event, so refunds and
						card disputes can be covered without affecting your payouts. Everything else is
						available to withdraw straight away, and the held amount is released automatically —
						you don't need to ask.
					</p>
				</div>
			{/if}
		</div>
	{/if}
{/if}
