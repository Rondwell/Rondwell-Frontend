<!--
	One gift link, as a card.

	Extracted from the old single-page dashboard so the overview and any future
	surface (an event's Gifts tab, a collection page) render a link identically.

	Two deliberate details:

	  - The whole card is a link to the per-link dashboard, but Copy and Share
	    are real buttons INSIDE it. Nesting interactive controls inside an
	    anchor is invalid and swallows their clicks, so the card body is a
	    `<button>` and the actions sit as siblings, not children.

	  - Share uses the Web Share API when the browser has it and silently falls
	    back to copy. On a phone — where these links are actually shared — that
	    is the difference between one tap into WhatsApp and a copy-paste.
-->
<script lang="ts">
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	import { toast } from '$lib/stores/toast.store';
	import { formatMoney } from '$lib/utils/money';
	import { GIFT_OCCASIONS, type GiftLink } from '$lib/services/giftLink.services';

	export let link: GiftLink;

	$: meta = GIFT_OCCASIONS.find((x) => x.value === link.occasion) ?? GIFT_OCCASIONS[5];
	/** Reset per link so a recycled card does not inherit a previous failure. */
	let coverFailed = false;
	$: if (link.coverImageUrl) coverFailed = false;
	$: publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/gift/${link.slug}` : '';
	$: pct =
		link.targetAmountKobo && link.targetAmountKobo > 0
			? Math.min(100, Math.round((link.raisedAmountKobo / link.targetAmountKobo) * 100))
			: null;

	async function copy() {
		try {
			await navigator.clipboard.writeText(publicUrl);
			toast.success('Link copied — go share it!');
		} catch {
			toast.error('Could not copy the link');
		}
	}

	async function share() {
		if (typeof navigator !== 'undefined' && 'share' in navigator) {
			try {
				await navigator.share({ title: link.title, url: publicUrl });
				return;
			} catch (err: any) {
				// A user dismissing the sheet is not an error worth reporting.
				if (err?.name === 'AbortError') return;
			}
		}
		copy();
	}
</script>

<div class="rounded-2xl bg-[#FDFDFD] p-4 shadow-sm transition-shadow hover:shadow-md">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<button
			class="flex min-w-0 flex-1 items-start gap-3 text-left"
			on:click={() => goto(`/gift/manage/${link._id}`)}
		>
			<!--
				The owner's cover, so the dashboard row matches the card people
				see in WhatsApp. Falls back to the occasion emoji when there is
				no cover, or when the image cannot be loaded — a broken-image
				glyph in a list reads as "this link is broken".
			-->
			{#if link.coverImageUrl && !coverFailed}
				<img
					src={link.coverImageUrl}
					alt=""
					width="44"
					height="44"
					loading="lazy"
					decoding="async"
					on:error={() => (coverFailed = true)}
					class="h-11 w-11 flex-shrink-0 rounded-xl object-cover"
				/>
			{:else}
				<div
					class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#F2E4F8] text-xl"
				>
					{meta.emoji}
				</div>
			{/if}
			<div class="min-w-0">
				<p class="truncate font-semibold text-gray-900">{link.title}</p>
				<p class="text-xs text-[#83808D]">
					{meta.label} · {link.contributionCount}
					{link.contributionCount === 1 ? 'gift' : 'gifts'}
					{#if link.status !== 'ACTIVE'}
						· <span class="text-amber-600">{link.status.toLowerCase()}</span>
					{/if}
				</p>
			</div>
		</button>

		<div class="flex items-center gap-1">
			<p class="mr-1 text-right font-semibold">
				{formatMoney(link.raisedAmountKobo, link.currency)}
			</p>
			<button
				on:click={share}
				aria-label="Share link"
				title="Share"
				class="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
			>
				<Icon icon="mdi:share-variant-outline" class="text-lg" />
			</button>
			<button
				on:click={copy}
				aria-label="Copy link"
				title="Copy link"
				class="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
			>
				<Icon icon="mdi:link-variant" class="text-lg" />
			</button>
		</div>
	</div>

	{#if pct !== null}
		<div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#EBECED]">
			<div class="h-full rounded-full bg-[#3CBD2C] transition-all" style="width: {pct}%"></div>
		</div>
		<p class="mt-1 text-xs text-[#83808D]">
			{pct}% of {formatMoney(link.targetAmountKobo ?? 0, link.currency)}
		</p>
	{/if}
</div>
