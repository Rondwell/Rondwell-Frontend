<!--
	GAP 3 — the standalone gift registry page.

	`/w/{slug}` is what a host shares when the registry isn't attached to a
	Rondwell event page (a baby shower, a housewarming). Fully public, fully
	themed, and it also handles the `?claim={token}` deep-link from the claim
	confirmation email so a guest can mark a gift bought or release it.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import Seo from '$lib/components/Seo.svelte';
	import GiftRegistryView from '$lib/components/GiftRegistryView.svelte';
	import { colors, type Color } from '$lib/utils/colors';
	import { toast } from '$lib/stores/toast.store';
	import {
		getPublicWishlistBySlug,
		getClaimByToken,
		markClaimPurchased,
		releaseClaim,
		type PublicWishlistView
	} from '$lib/services/wishlist.services';

	export let data: any;
	$: seo = data?.seo;
	$: slug = $page.params.slug ?? '';

	// A standalone registry has no event theme to inherit, so it uses the
	// default palette — still routed through `colors`, never hardcoded, so a
	// per-registry theme can be added later without touching the markup.
	const themeColor: Color = colors[0];

	let view: PublicWishlistView | null = data?.preloaded ?? null;
	let loading = !data?.preloaded;
	let notFound = false;

	// ── Claim management (from the confirmation email's deep link) ────────
	let claimToken = '';
	let claimDetail: any = null;
	let claimBusy = false;

	async function load() {
		const res = await getPublicWishlistBySlug(slug);
		if (!res) {
			notFound = true;
		} else {
			view = res;
			notFound = false;
		}
		loading = false;
	}

	onMount(async () => {
		await load();
		claimToken = $page.url.searchParams.get('claim') ?? '';
		if (claimToken) {
			claimDetail = await getClaimByToken(claimToken);
		}
	});

	async function onPurchased() {
		if (!claimToken) return;
		claimBusy = true;
		try {
			await markClaimPurchased(claimToken);
			claimDetail = { ...claimDetail, claim: { ...claimDetail.claim, status: 'PURCHASED' } };
			toast.success('Marked as bought — thank you!');
			await load();
		} catch (e: any) {
			toast.error(e?.message || 'Could not update your claim');
		} finally {
			claimBusy = false;
		}
	}

	async function onReleased() {
		if (!claimToken) return;
		claimBusy = true;
		try {
			await releaseClaim(claimToken);
			claimDetail = { ...claimDetail, claim: { ...claimDetail.claim, status: 'RELEASED' } };
			toast.info('Released — someone else can claim it now.');
			await load();
		} catch (e: any) {
			toast.error(e?.message || 'Could not release your claim');
		} finally {
			claimBusy = false;
		}
	}
</script>

<Seo {seo} />

<div class="mx-auto max-w-5xl px-4 py-8" style="background-color: {themeColor.bg};">
	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each [1, 2, 3] as _}
				<div class="h-64 animate-pulse rounded-2xl" style="background-color: {themeColor.cover};"></div>
			{/each}
		</div>
	{:else if notFound}
		<div class="flex flex-col items-center justify-center py-24 text-center">
			<Icon icon="mdi:gift-off-outline" class="mb-3 text-5xl" style="color: {themeColor.lightText};" />
			<p class="text-lg font-semibold" style="color: {themeColor.text};">Registry not found</p>
			<p class="mt-1 text-sm" style="color: {themeColor.lightText};">
				This link may have expired, or the host made it private.
			</p>
			<a
				href="/discover"
				class="mt-5 rounded-lg px-5 py-2.5 text-sm font-medium no-underline"
				style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
			>
				Explore Rondwell
			</a>
		</div>
	{:else}
		<!-- The claim deep-link banner, shown above the registry so a guest who
		     came from their email lands directly on the thing they came to do. -->
		{#if claimDetail?.claim}
			<div class="mb-6 rounded-2xl p-5" style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};">
				<p class="text-sm font-semibold" style="color: {themeColor.text};">
					Your claim: {claimDetail.item?.title ?? 'a gift'}
				</p>
				<p class="mt-1 text-xs" style="color: {themeColor.lightText};">
					Status: {claimDetail.claim.status === 'PURCHASED'
						? 'Bought — thank you!'
						: claimDetail.claim.status === 'RELEASED' || claimDetail.claim.status === 'EXPIRED'
							? 'Released'
							: 'Reserved for you'}
				</p>

				{#if claimDetail.claim.status === 'RESERVED'}
					<div class="mt-3 flex flex-wrap gap-2">
						{#if claimDetail.item?.externalUrl}
							<a
								href={claimDetail.item.externalUrl}
								target="_blank"
								rel="noopener nofollow"
								class="rounded-lg px-4 py-2 text-sm font-medium no-underline"
								style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
							>
								Go buy it
							</a>
						{/if}
						<button
							on:click={onPurchased}
							disabled={claimBusy}
							class="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
							style="background-color: {themeColor.smallCover}; color: {themeColor.text};"
						>
							I've bought it
						</button>
						<button
							on:click={onReleased}
							disabled={claimBusy}
							class="rounded-lg px-4 py-2 text-sm font-medium underline disabled:opacity-50"
							style="color: {themeColor.lightText};"
						>
							Release it
						</button>
					</div>
					<p class="mt-2 text-xs" style="color: {themeColor.lightText};">
						Releasing frees it up for another guest — no hard feelings.
					</p>
				{/if}
			</div>
		{/if}

		<GiftRegistryView {view} {themeColor} on:funded={load} on:claimed={load} />
	{/if}
</div>
