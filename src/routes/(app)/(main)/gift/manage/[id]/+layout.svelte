<!--
	One gift link — dashboard shell.

	Mirrors `events/[id]/+layout.svelte`: it owns the header, the data, and the
	SideMenu for everything inside a single link. The parent `gift/+layout.svelte`
	deliberately stands down while this route is active so the two never fight
	over `subMenuItems`.

	Why the header lives here rather than in each tab: the title, occasion,
	status and share controls are the same on all three tabs, and duplicating
	them is how the tabs drift apart. It also means the page does not flash a
	different header while a tab loads.
-->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { activeSubItem, showSubMenu, subMenuItems } from '$lib/stores/uiStore.js';
	import { toast } from '$lib/stores/toast.store';
	import { cleanErrorMessage } from '$lib/utils/errorMessage';
	import {
		getGiftLink,
		getGiftLinkContributions,
		GIFT_OCCASIONS
	} from '$lib/services/giftLink.services';
	import { setGiftLinkCtx, type GiftLinkTotals } from './context';

	const link = writable<any>(null);
	const contributions = writable<any[]>([]);
	const totals = writable<GiftLinkTotals[]>([]);
	const loading = writable(true);
	const error = writable('');

	$: id = $page.params.id ?? '';

	async function reload() {
		if (!id) return;
		loading.set(true);
		error.set('');
		try {
			const l = await getGiftLink(id);
			link.set(l);
			// Contributions are secondary: a link that loads with a failed
			// contributions call should still render, not show "not found".
			try {
				const res = await getGiftLinkContributions(id, { limit: 100 });
				contributions.set(res.data ?? []);
				totals.set((res.totals ?? []) as GiftLinkTotals[]);
			} catch {
				contributions.set([]);
				totals.set([]);
			}
		} catch (e: any) {
			error.set(cleanErrorMessage(e?.message || 'Could not load this gift link'));
		} finally {
			loading.set(false);
		}
	}

	setGiftLinkCtx({ link, contributions, totals, loading, error, reload });

	// Refetch when the id changes (navigating between two links).
	let loadedId = '';
	$: if (id && id !== loadedId) {
		loadedId = id;
		reload();
	}

	const icons = {
		overview: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
		</svg>`,
		gifts: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M20 12v9H4v-9M12 21V8M22 8H2v4h20V8zM12 8H7.5a2.5 2.5 0 010-5C11 3 12 8 12 8zM12 8h4.5a2.5 2.5 0 000-5C13 3 12 8 12 8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
		</svg>`,
		settings: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" stroke-width="1.5"/>
			<path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 8.6a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
		</svg>`
	};

	$: path = $page.url.pathname;
	$: base = `/gift/manage/${id}`;

	$: if (id) {
		subMenuItems.set([
			{ label: 'Overview', icon: icons.overview, nav: base },
			{ label: 'Gifts', icon: icons.gifts, nav: `${base}/gifts` },
			{ label: 'Settings', icon: icons.settings, nav: `${base}/settings` }
		]);
		showSubMenu.set(true);
		activeSubItem.set(
			path.endsWith('/gifts') ? 'Gifts' : path.endsWith('/settings') ? 'Settings' : 'Overview'
		);
	}

	// Leaving the link entirely — hand the menu back rather than stranding the
	// per-link tabs in the sidebar of an unrelated page.
	onDestroy(() => {
		subMenuItems.set([]);
		activeSubItem.set('');
	});

	$: occasion = GIFT_OCCASIONS.find((o) => o.value === $link?.occasion) ?? GIFT_OCCASIONS[5];

	/** Falls the header back to the occasion emoji if the cover cannot load. */
	let coverFailed = false;
	$: if ($link?.coverImageUrl) coverFailed = false;
	$: shareUrl =
		$link && typeof window !== 'undefined' ? `${window.location.origin}/gift/${$link.slug}` : '';

	async function copyShare() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			toast.success('Link copied!');
		} catch {
			toast.error('Could not copy the link');
		}
	}

	async function share() {
		if (typeof navigator !== 'undefined' && 'share' in navigator && $link) {
			try {
				await navigator.share({ title: $link.title, url: shareUrl });
				return;
			} catch (err: any) {
				if (err?.name === 'AbortError') return;
			}
		}
		copyShare();
	}
</script>

<svelte:head>
	<title>{$link?.title ?? 'Gift link'} · Rondwell</title>
</svelte:head>

<div class="mx-auto w-full max-w-5xl">
	<button
		on:click={() => goto('/gift')}
		class="mb-5 flex items-center gap-1 text-sm text-[#83808D] transition-colors hover:text-gray-700"
	>
		<Icon icon="mdi:arrow-left" />
		All gifts
	</button>

	{#if $loading && !$link}
		<div class="h-24 animate-pulse rounded-2xl bg-gray-100"></div>
	{:else if $error && !$link}
		<div class="rounded-2xl border border-[#F5C2C7] bg-[#FDF2F2] p-6 text-center text-sm text-[#B02A37]">
			{$error}
		</div>
	{:else if $link}
		<!-- Header — shared by every tab -->
		<div class="mb-6 flex flex-wrap items-start justify-between gap-4">
			<div class="flex min-w-0 items-start gap-3">
				<!-- The owner's cover, so every gift surface shows the same artwork. -->
				{#if $link.coverImageUrl && !coverFailed}
					<img
						src={$link.coverImageUrl}
						alt=""
						width="48"
						height="48"
						decoding="async"
						on:error={() => (coverFailed = true)}
						class="h-12 w-12 flex-shrink-0 rounded-xl object-cover"
					/>
				{:else}
					<div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#F2E4F8] text-2xl">
						{occasion.emoji}
					</div>
				{/if}
				<div class="min-w-0">
					<h1 class="truncate text-2xl font-bold text-gray-900">{$link.title}</h1>
					<p class="text-sm text-[#83808D]">
						{occasion.label}
						{#if $link.status !== 'ACTIVE'}
							· <span class="text-amber-600">{$link.status.toLowerCase()}</span>
						{/if}
					</p>
				</div>
			</div>

			<div class="flex flex-shrink-0 gap-2">
				<button
					on:click={share}
					class="flex items-center gap-1.5 rounded-md bg-[#EBECED] px-3 py-2 text-sm font-medium text-[#5D646F] transition-colors hover:bg-gray-200"
				>
					<Icon icon="mdi:share-variant-outline" class="text-base" />
					Share
				</button>
				<button
					on:click={copyShare}
					class="flex items-center gap-1.5 rounded-md bg-[#EBECED] px-3 py-2 text-sm font-medium text-[#5D646F] transition-colors hover:bg-gray-200"
				>
					<Icon icon="mdi:link-variant" class="text-base" />
					Copy link
				</button>
			</div>
		</div>

		<slot />
	{/if}
</div>
