<!--
	Gifts — overview.

	Rebuilt from the flat single-page version onto the same shape as the event
	dashboard: a stat row that answers "how am I doing", then the things you act
	on, then recent activity. It lives inside `(main)` so it carries the real
	Sidebar and SideMenu, and it registers its section menu in `+layout.svelte`.

	Two figures are separated on purpose. `raised` is what people gave; `net` is
	what reached the wallet after commission and VAT. Showing only one of them is
	how a platform ends up in an argument about missing money, and the gap is
	exactly the fee — so both are stated, side by side.

	`withdrawable` is deliberately NOT invented here. Gift money lands in the
	same wallet balance as ticket, vendor and exhibitor money, so the honest
	answer is a link to /wallet rather than a second, subtly different number.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	import { isAuthenticated } from '$lib/stores/auth.store';
	import { formatMoney } from '$lib/utils/money';
	import { getMyGiftLinks, type GiftLink } from '$lib/services/giftLink.services';
	import {
		getMyReceivedContributions,
		type ContributionRow as Row
	} from '$lib/services/contribution.services';
	import StatTile from './components/StatTile.svelte';
	import GiftLinkCard from './components/GiftLinkCard.svelte';
	import ContributionRow from './components/ContributionRow.svelte';

	let links: GiftLink[] = [];
	let received: Row[] = [];
	let totals: { currency: string; gross: number; net: number; count: number }[] = [];
	let loading = true;
	let loadError = '';

	/** The primary currency to headline — whichever has received the most. */
	$: primary = totals.length
		? [...totals].sort((a, b) => b.net - a.net)[0]
		: { currency: 'NGN', gross: 0, net: 0, count: 0 };

	$: activeLinks = links.filter((l) => l.status === 'ACTIVE').length;
	$: totalFees = Math.max(0, primary.gross - primary.net);

	onMount(async () => {
		if (!$isAuthenticated) {
			loading = false;
			return;
		}
		try {
			const [l, r] = await Promise.all([
				getMyGiftLinks(),
				getMyReceivedContributions({ limit: 6 })
			]);
			links = l;
			received = r.data;
			totals = r.totals ?? [];
		} catch (e: any) {
			// Surfaced rather than swallowed: an empty dashboard and a broken one
			// look identical, and the old page could not tell them apart.
			loadError = e?.message ?? 'Could not load your gifts.';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Gifts · Rondwell</title>
	<meta
		name="description"
		content="Create a gift link and let friends send you cash for any occasion — birthdays, weddings, graduations."
	/>
</svelte:head>

<div class="mx-auto w-full max-w-5xl">
	<!-- Header -->
	<div class="mb-6 flex flex-wrap items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-gray-900 md:text-3xl">Gifts</h1>
			<p class="mt-1 text-sm text-[#83808D]">Share a link, receive cash. No event needed.</p>
		</div>
		<button
			on:click={() => goto('/gift/new')}
			class="flex items-center gap-2 rounded-lg bg-[#F31A7C] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#d81869]"
		>
			<Icon icon="mdi:plus" class="text-lg" />
			Create a gift link
		</button>
	</div>

	{#if !$isAuthenticated}
		<div class="rounded-2xl bg-[#FDFDFD] p-10 text-center shadow-sm">
			<div class="mb-3 text-5xl">🎁</div>
			<p class="text-lg font-semibold">Sign in to create a gift link</p>
			<p class="mx-auto mt-1 max-w-md text-sm text-[#83808D]">
				Pick an occasion, set your suggested amounts, and share one link. Friends can send you cash in
				a few taps — they don't need an account.
			</p>
			<a
				href="/auth?returnUrl=%2Fgift"
				class="mt-5 inline-block rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white no-underline hover:bg-gray-800"
			>
				Sign in
			</a>
		</div>
	{:else}
		{#if loadError}
			<div
				class="mb-6 flex items-start gap-2 rounded-xl border border-[#F5C2C7] bg-[#FDF2F2] p-4 text-sm text-[#B02A37]"
			>
				<Icon icon="mdi:alert-circle-outline" class="mt-0.5 flex-shrink-0 text-base" />
				<span>{loadError}</span>
			</div>
		{/if}

		<!-- Stat row -->
		<div class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
			<StatTile
				{loading}
				label="Received ({primary.currency})"
				value={formatMoney(primary.net, primary.currency)}
				sub="net, after fees"
				tone="money"
			/>
			<StatTile
				{loading}
				label="Given by friends"
				value={formatMoney(primary.gross, primary.currency)}
				sub={totalFees > 0 ? `${formatMoney(totalFees, primary.currency)} in fees` : 'no fees yet'}
			/>
			<StatTile
				{loading}
				label="Gifts"
				value={String(primary.count)}
				sub={primary.count === 1 ? 'from 1 person' : `from ${primary.count} people`}
			/>
			<StatTile
				{loading}
				label="Active links"
				value={String(activeLinks)}
				sub={links.length === activeLinks ? 'all live' : `${links.length} total`}
			/>
		</div>

		<!-- Where the money actually is -->
		{#if !loading && primary.net > 0}
			<a
				href="/wallet"
				class="mb-8 flex items-center justify-between gap-3 rounded-2xl border border-[#EBECED] bg-white p-4 no-underline transition-colors hover:bg-gray-50"
			>
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9F7E7]">
						<Icon icon="mdi:wallet-outline" class="text-xl text-[#3CBD2C]" />
					</div>
					<div>
						<p class="text-sm font-medium text-gray-900">Gift money sits in your wallet</p>
						<p class="text-xs text-[#83808D]">
							Alongside ticket, vendor and exhibitor earnings — withdraw it the same way.
						</p>
					</div>
				</div>
				<Icon icon="mdi:chevron-right" class="flex-shrink-0 text-xl text-[#B9B6C3]" />
			</a>
		{/if}

		<!-- Links -->
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-lg font-semibold text-gray-900">My gift links</h2>
			{#if links.length > 0}
				<span class="text-xs text-[#83808D]">{links.length} total</span>
			{/if}
		</div>

		{#if loading}
			<div class="mb-8 space-y-3">
				{#each [1, 2] as _}
					<div class="h-28 animate-pulse rounded-2xl bg-gray-100"></div>
				{/each}
			</div>
		{:else if links.length === 0}
			<div class="mb-8 rounded-2xl border border-dashed border-gray-200 p-10 text-center">
				<div class="mb-2 text-4xl">🎂</div>
				<p class="text-sm font-medium text-gray-700">No gift links yet</p>
				<p class="mt-1 text-xs text-[#83808D]">
					Birthday coming up? Create a link and share it in your group chat.
				</p>
				<button
					on:click={() => goto('/gift/new')}
					class="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
				>
					Create one
				</button>
			</div>
		{:else}
			<div class="mb-8 grid gap-3 md:grid-cols-2">
				{#each links as link (link._id)}
					<GiftLinkCard {link} />
				{/each}
			</div>
		{/if}

		<!-- Recent -->
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-lg font-semibold text-gray-900">Recently received</h2>
			{#if received.length > 0}
				<a href="/gift/received" class="text-xs font-medium text-[#F31A7C] no-underline hover:underline">
					View all
				</a>
			{/if}
		</div>

		{#if loading}
			<div class="space-y-2">
				{#each [1, 2, 3] as _}
					<div class="h-16 animate-pulse rounded-xl bg-gray-100"></div>
				{/each}
			</div>
		{:else if received.length === 0}
			<div
				class="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-[#83808D]"
			>
				Nothing yet. Gifts from your links, event contributions and registry gifts all show up here.
			</div>
		{:else}
			<div class="space-y-2">
				{#each received as c (c._id)}
					<ContributionRow {c} />
				{/each}
			</div>
		{/if}
	{/if}
</div>
