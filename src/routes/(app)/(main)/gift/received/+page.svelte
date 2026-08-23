<!--
	Gifts — Received.

	The full ledger of everything the user has been given, across gift links,
	registries and event contributions. The overview shows the last six; this is
	the place you come to actually work through them.

	What it adds over a list:

	  - Per-currency totals, because a user with NGN and USD gifts summed into
	    one number is being told something false.
	  - Bulk "thank everyone" — the endpoint is idempotent and skips anyone
	    already thanked server-side, so the button is safe to press twice. That
	    is why it does not need a confirmation step.
	  - Real pagination against `pagination.total` rather than a fixed limit,
	    so a popular link does not silently truncate at 20.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { isAuthenticated } from '$lib/stores/auth.store';
	import { toast } from '$lib/stores/toast.store';
	import { formatMoney } from '$lib/utils/money';
	import {
		getMyReceivedContributions,
		sendThankYou,
		type ContributionRow as Row
	} from '$lib/services/contribution.services';
	import StatTile from '../components/StatTile.svelte';
	import ContributionRow from '../components/ContributionRow.svelte';

	const PAGE = 25;

	let rows: Row[] = [];
	let totals: { currency: string; gross: number; net: number; count: number }[] = [];
	let total = 0;
	let loading = true;
	let loadingMore = false;
	let loadError = '';
	let thankingId: string | null = null;
	let thankingAll = false;

	$: unthanked = rows.filter((r) => !(r as any).thankYouSentAt && r.status === 'COMPLETED');

	async function load(skip = 0) {
		const res = await getMyReceivedContributions({ limit: PAGE, skip });
		totals = res.totals ?? [];
		total = res.pagination?.total ?? res.data.length;
		rows = skip === 0 ? res.data : [...rows, ...res.data];
	}

	onMount(async () => {
		if (!$isAuthenticated) {
			loading = false;
			return;
		}
		try {
			await load(0);
		} catch (e: any) {
			loadError = e?.message ?? 'Could not load your gifts.';
		} finally {
			loading = false;
		}
	});

	async function loadMore() {
		loadingMore = true;
		try {
			await load(rows.length);
		} catch (e: any) {
			toast.error(e?.message ?? 'Could not load more');
		} finally {
			loadingMore = false;
		}
	}

	/** Mark locally so the row updates without a full refetch. */
	function markThanked(ids: string[]) {
		const set = new Set(ids);
		rows = rows.map((r) => (set.has(r._id) ? { ...r, thankYouSentAt: new Date().toISOString() } : r));
	}

	async function thankOne(c: Row) {
		thankingId = c._id;
		try {
			await sendThankYou([c._id]);
			markThanked([c._id]);
			toast.success('Thank-you sent');
		} catch (e: any) {
			toast.error(e?.message ?? 'Could not send the thank-you');
		} finally {
			thankingId = null;
		}
	}

	async function thankAll() {
		const ids = unthanked.map((r) => r._id);
		if (ids.length === 0) return;
		thankingAll = true;
		try {
			const { sent } = await sendThankYou(ids);
			markThanked(ids);
			toast.success(sent === 1 ? 'Thank-you sent' : `${sent} thank-yous sent`);
		} catch (e: any) {
			toast.error(e?.message ?? 'Could not send the thank-yous');
		} finally {
			thankingAll = false;
		}
	}
</script>

<svelte:head>
	<title>Gifts received · Rondwell</title>
</svelte:head>

<div class="mx-auto w-full max-w-5xl">
	<div class="mb-6 flex flex-wrap items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-gray-900 md:text-3xl">Received</h1>
			<p class="mt-1 text-sm text-[#83808D]">
				Every gift you've been given — from links, registries and events.
			</p>
		</div>
		{#if unthanked.length > 0}
			<button
				on:click={thankAll}
				disabled={thankingAll}
				class="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
			>
				<Icon icon="mdi:heart-outline" class="text-base" />
				{thankingAll ? 'Sending…' : `Thank all (${unthanked.length})`}
			</button>
		{/if}
	</div>

	{#if !$isAuthenticated}
		<div class="rounded-2xl bg-[#FDFDFD] p-10 text-center shadow-sm">
			<p class="text-lg font-semibold">Sign in to see your gifts</p>
			<a
				href="/auth?returnUrl=%2Fgift%2Freceived"
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

		{#if totals.length > 0}
			<div class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
				{#each totals as t}
					<StatTile
						label="Received ({t.currency})"
						value={formatMoney(t.net, t.currency)}
						sub="{t.count} {t.count === 1 ? 'gift' : 'gifts'} · {formatMoney(
							t.gross,
							t.currency
						)} given"
						tone="money"
					/>
				{/each}
			</div>
		{/if}

		{#if loading}
			<div class="space-y-2">
				{#each [1, 2, 3, 4, 5] as _}
					<div class="h-20 animate-pulse rounded-xl bg-gray-100"></div>
				{/each}
			</div>
		{:else if rows.length === 0}
			<div class="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
				<div class="mb-2 text-4xl">🎁</div>
				<p class="text-sm font-medium text-gray-700">No gifts yet</p>
				<p class="mx-auto mt-1 max-w-sm text-xs text-[#83808D]">
					Share a gift link and anything you receive — plus registry gifts and event contributions —
					lands here.
				</p>
				<a
					href="/gift"
					class="mt-4 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-gray-800"
				>
					Back to gifts
				</a>
			</div>
		{:else}
			<div class="space-y-2">
				{#each rows as c (c._id)}
					<ContributionRow
						{c}
						showThanks
						thanking={thankingId === c._id}
						onThank={thankOne}
					/>
				{/each}
			</div>

			{#if rows.length < total}
				<div class="mt-4 text-center">
					<button
						on:click={loadMore}
						disabled={loadingMore}
						class="rounded-lg border border-[#EBECED] px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
					>
						{loadingMore ? 'Loading…' : `Load more (${total - rows.length} left)`}
					</button>
				</div>
			{/if}
		{/if}
	{/if}
</div>
