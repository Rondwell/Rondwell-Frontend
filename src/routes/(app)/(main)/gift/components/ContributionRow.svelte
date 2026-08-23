<!--
	One received gift.

	Shared by the overview's "recent activity" strip and the full Received
	ledger, so a gift reads the same wherever it appears.

	`isAnonymous` is honoured HERE as well as on the server. The API already
	anonymises before it sends, but a gift is the one place where leaking a name
	someone deliberately hid is a genuine betrayal rather than a bug, so the
	client does not rely on being sent the right thing.
-->
<script lang="ts">
	import Icon from '@iconify/svelte';
	import { formatMoney } from '$lib/utils/money';
	import type { ContributionRow } from '$lib/services/contribution.services';

	export let c: ContributionRow;
	/** Show the "Say thanks" action. Off in compact strips. */
	export let showThanks = false;
	export let thanking = false;
	export let onThank: (c: ContributionRow) => void = () => {};

	const KIND_LABEL: Record<string, string> = {
		GIFT_LINK: 'gift link',
		WISHLIST: 'registry',
		RSVP_CONTRIBUTION: 'event contribution'
	};

	$: displayName = c.isAnonymous ? 'Someone' : c.contributorName || 'Someone';
	$: alreadyThanked = Boolean((c as any).thankYouSentAt);
</script>

<div class="flex items-start justify-between gap-3 rounded-xl bg-[#FDFDFD] p-4 shadow-sm">
	<div class="min-w-0 flex-1">
		<p class="truncate text-sm font-medium text-gray-900">
			{displayName}
			<span class="ml-1 text-xs font-normal text-[#83808D]">
				{KIND_LABEL[c.kind] ?? 'gift'}
			</span>
			{#if c.status && c.status !== 'COMPLETED'}
				<span
					class="ml-1 rounded-full bg-[#FDF3E2] px-2 py-0.5 text-[10px] font-medium text-[#B7791F]"
				>
					{c.status.toLowerCase()}
				</span>
			{/if}
		</p>

		{#if c.message}
			<p class="mt-0.5 line-clamp-2 text-xs italic text-[#5D646F]">"{c.message}"</p>
		{/if}

		{#if showThanks}
			<div class="mt-2">
				{#if alreadyThanked}
					<span class="inline-flex items-center gap-1 text-xs text-[#3CBD2C]">
						<Icon icon="mdi:check-circle-outline" /> Thanked
					</span>
				{:else}
					<button
						on:click={() => onThank(c)}
						disabled={thanking}
						class="inline-flex items-center gap-1 rounded-lg border border-[#EBECED] px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
					>
						<Icon icon="mdi:heart-outline" />
						{thanking ? 'Sending…' : 'Say thanks'}
					</button>
				{/if}
			</div>
		{/if}
	</div>

	<div class="flex-shrink-0 text-right">
		<p class="font-semibold text-[#3CBD2C]">{formatMoney(c.netKobo, c.currency)}</p>
		{#if c.amountKobo !== c.netKobo}
			<p class="text-[11px] text-[#83808D]">
				{formatMoney(c.amountKobo, c.currency)} gross
			</p>
		{/if}
	</div>
</div>
