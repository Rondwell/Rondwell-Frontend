<!--
	Gift link — Overview.

	The "how is this link doing" tab. Stats, progress toward a target, the share
	surface, and the last handful of gifts. Everything deeper lives in Gifts;
	everything editable lives in Settings.

	Gross and net are both shown for the same reason as the section overview:
	the gap between "what friends gave" and "what reached your wallet" is the
	commission plus VAT, and a dashboard that shows only one of them turns a
	documented fee into a surprise.
-->
<script lang="ts">
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	import { formatMoney } from '$lib/utils/money';
	import StatTile from '../../components/StatTile.svelte';
	import ContributionRow from '../../components/ContributionRow.svelte';
	import { getGiftLinkCtx } from './context';

	const { link, contributions, totals, loading } = getGiftLinkCtx();

	$: primary = $totals.length
		? [...$totals].sort((a, b) => b.net - a.net)[0]
		: { currency: $link?.currency ?? 'NGN', gross: 0, net: 0, platformFee: 0, count: 0 };

	$: pct =
		$link?.targetAmountKobo && $link.targetAmountKobo > 0
			? Math.min(100, Math.round(($link.raisedAmountKobo / $link.targetAmountKobo) * 100))
			: null;

	$: recent = $contributions.slice(0, 5);
	$: unthanked = $contributions.filter((c) => !c.thankYouSentAt && c.status === 'COMPLETED').length;
	$: shareUrl =
		$link && typeof window !== 'undefined' ? `${window.location.origin}/gift/${$link.slug}` : '';
</script>

<!-- Stats -->
<div class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
	<StatTile
		loading={$loading}
		label="Raised (net)"
		value={formatMoney(primary.net, primary.currency)}
		sub="in your wallet"
		tone="money"
	/>
	<StatTile
		loading={$loading}
		label="Given"
		value={formatMoney(primary.gross, primary.currency)}
		sub={primary.platformFee > 0
			? `${formatMoney(primary.platformFee, primary.currency)} in fees`
			: 'no fees yet'}
	/>
	<StatTile
		loading={$loading}
		label="Gifts"
		value={String(primary.count)}
		sub={primary.count === 1 ? 'from 1 person' : `from ${primary.count} people`}
	/>
	<StatTile
		loading={$loading}
		label="To thank"
		value={String(unthanked)}
		sub={unthanked === 0 ? 'all caught up' : 'waiting on you'}
		tone={unthanked > 0 ? 'pending' : 'default'}
	/>
</div>

<!-- Progress -->
{#if pct !== null && $link}
	<div class="mb-6 rounded-2xl bg-[#FDFDFD] p-5 shadow-sm">
		<div class="mb-2 flex items-baseline justify-between gap-2">
			<p class="text-sm font-medium text-gray-900">Target</p>
			<p class="text-sm text-[#83808D]">
				{formatMoney($link.raisedAmountKobo, $link.currency)} of {formatMoney(
					$link.targetAmountKobo ?? 0,
					$link.currency
				)}
			</p>
		</div>
		<div class="h-2 w-full overflow-hidden rounded-full bg-[#EBECED]">
			<div class="h-full rounded-full bg-[#3CBD2C] transition-all" style="width: {pct}%"></div>
		</div>
		<p class="mt-1.5 text-xs text-[#83808D]">{pct}% there</p>
	</div>
{/if}

<!-- Share -->
{#if $link}
	<div class="mb-6 rounded-2xl border border-[#EBECED] bg-white p-5">
		<p class="text-sm font-medium text-gray-900">Your link</p>
		<p class="mt-0.5 text-xs text-[#83808D]">
			Anyone with this can send you a gift — they don't need an account.
		</p>
		<div class="mt-3 flex items-center gap-2 rounded-lg bg-[#F7F7F8] px-3 py-2.5">
			<Icon icon="mdi:link-variant" class="flex-shrink-0 text-base text-[#B9B6C3]" />
			<code class="min-w-0 flex-1 truncate text-xs text-[#5D646F]">{shareUrl}</code>
		</div>
		{#if $link.status !== 'ACTIVE'}
			<p class="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
				<Icon icon="mdi:pause-circle-outline" />
				This link is {$link.status.toLowerCase()} — it isn't accepting new gifts.
			</p>
		{/if}
	</div>
{/if}

<!-- Recent -->
<div class="mb-3 flex items-center justify-between">
	<h2 class="text-lg font-semibold text-gray-900">Recent gifts</h2>
	{#if $contributions.length > recent.length}
		<button
			on:click={() => goto(`/gift/manage/${$link?._id}/gifts`)}
			class="text-xs font-medium text-[#F31A7C] hover:underline"
		>
			View all {$contributions.length}
		</button>
	{/if}
</div>

{#if $loading}
	<div class="space-y-2">
		{#each [1, 2, 3] as _}
			<div class="h-16 animate-pulse rounded-xl bg-gray-100"></div>
		{/each}
	</div>
{:else if recent.length === 0}
	<div class="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
		<div class="mb-2 text-3xl">🎁</div>
		<p class="text-sm font-medium text-gray-700">No gifts yet</p>
		<p class="mx-auto mt-1 max-w-sm text-xs text-[#83808D]">
			Share the link above — it works in a group chat, a bio, or anywhere you'd paste a URL.
		</p>
	</div>
{:else}
	<div class="space-y-2">
		{#each recent as c (c._id)}
			<ContributionRow {c} />
		{/each}
	</div>
{/if}
