<!--
	Gift link — Gifts.

	Every contribution to this link, and the place you actually thank people.

	The thank-you endpoint is idempotent and skips anyone already thanked
	server-side, so "Thank everyone" needs no confirmation — pressing it twice
	is harmless by construction rather than by a modal.

	Local state is patched after a successful send instead of refetching: the
	server is the authority, but a full reload to move one badge makes the page
	feel broken on a slow connection.
-->
<script lang="ts">
	import Icon from '@iconify/svelte';
	import { toast } from '$lib/stores/toast.store';
	import { cleanErrorMessage } from '$lib/utils/errorMessage';
	import { formatMoney } from '$lib/utils/money';
	import { sendThankYou } from '$lib/services/contribution.services';
	import ContributionRow from '../../../components/ContributionRow.svelte';
	import { getGiftLinkCtx } from '../context';

	const { link, contributions, totals, loading } = getGiftLinkCtx();

	let thankingId: string | null = null;
	let thankingAll = false;
	let filter: 'all' | 'unthanked' = 'all';

	$: unthanked = $contributions.filter((c) => !c.thankYouSentAt && c.status === 'COMPLETED');
	$: visible = filter === 'unthanked' ? unthanked : $contributions;
	$: primary = $totals.length
		? [...$totals].sort((a, b) => b.net - a.net)[0]
		: null;

	function markThanked(ids: string[]) {
		const set = new Set(ids);
		const now = new Date().toISOString();
		contributions.update((rows) =>
			rows.map((c) => (set.has(c._id) ? { ...c, thankYouSentAt: now } : c))
		);
	}

	async function thankOne(c: any) {
		thankingId = c._id;
		try {
			await sendThankYou([c._id]);
			markThanked([c._id]);
			toast.success('Thank-you sent');
		} catch (e: any) {
			toast.error(cleanErrorMessage(e?.message || 'Could not send the thank-you'));
		} finally {
			thankingId = null;
		}
	}

	async function thankAll() {
		const ids = unthanked.map((c) => c._id);
		if (ids.length === 0) return;
		thankingAll = true;
		try {
			const { sent } = await sendThankYou(ids);
			markThanked(ids);
			toast.success(sent === 1 ? 'Thank-you sent' : `${sent} thank-yous sent`);
		} catch (e: any) {
			toast.error(cleanErrorMessage(e?.message || 'Could not send the thank-yous'));
		} finally {
			thankingAll = false;
		}
	}
</script>

<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
	<div>
		<h2 class="text-lg font-semibold text-gray-900">Gifts</h2>
		{#if primary}
			<p class="mt-0.5 text-xs text-[#83808D]">
				{primary.count}
				{primary.count === 1 ? 'gift' : 'gifts'} · {formatMoney(primary.net, primary.currency)} net
			</p>
		{/if}
	</div>

	{#if unthanked.length > 0}
		<button
			on:click={thankAll}
			disabled={thankingAll}
			class="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
		>
			<Icon icon="mdi:heart-outline" class="text-base" />
			{thankingAll ? 'Sending…' : `Thank everyone (${unthanked.length})`}
		</button>
	{/if}
</div>

{#if $contributions.length > 0}
	<div class="mb-4 inline-flex rounded-lg border border-[#EBECED] p-0.5">
		<button
			on:click={() => (filter = 'all')}
			class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors {filter === 'all'
				? 'bg-gray-900 text-white'
				: 'text-[#5D646F] hover:bg-gray-50'}"
		>
			All ({$contributions.length})
		</button>
		<button
			on:click={() => (filter = 'unthanked')}
			class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors {filter === 'unthanked'
				? 'bg-gray-900 text-white'
				: 'text-[#5D646F] hover:bg-gray-50'}"
		>
			Not thanked ({unthanked.length})
		</button>
	</div>
{/if}

{#if $loading}
	<div class="space-y-2">
		{#each [1, 2, 3, 4] as _}
			<div class="h-20 animate-pulse rounded-xl bg-gray-100"></div>
		{/each}
	</div>
{:else if visible.length === 0}
	<div class="rounded-2xl border border-dashed border-gray-200 p-10 text-center">
		<div class="mb-2 text-3xl">{filter === 'unthanked' ? '💌' : '🎁'}</div>
		<p class="text-sm font-medium text-gray-700">
			{filter === 'unthanked' ? "You've thanked everyone" : 'No gifts yet'}
		</p>
		<p class="mx-auto mt-1 max-w-sm text-xs text-[#83808D]">
			{filter === 'unthanked'
				? 'Nothing waiting on you.'
				: 'Share your link and gifts will appear here as they arrive.'}
		</p>
	</div>
{:else}
	<div class="space-y-2">
		{#each visible as c (c._id)}
			<ContributionRow {c} showThanks thanking={thankingId === c._id} onThank={thankOne} />
		{/each}
	</div>
{/if}
