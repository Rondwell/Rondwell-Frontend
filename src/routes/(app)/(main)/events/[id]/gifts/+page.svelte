<!--
	GAP 3 — the organizer's gift registry.

	Four tabs, matching how a host actually thinks about a registry:
	  registry   — what I'm asking for
	  received   — what's actually come in (cash + claims)
	  thank-you  — who I still owe a thank-you
	  settings   — the surprise, the close date, the share link

	The one rule that governs the whole page: when `hideClaimersFromHost` is on
	(the DEFAULT), the host never sees WHO claimed a physical gift. The server
	enforces it in `sanitizeClaimsFor`; this page's job is to explain WHY the
	names are missing, so it reads as a feature rather than a bug.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import Nav from '../../../../components/Nav.svelte';
	import { getEventCache, invalidateEventCache } from '$lib/stores/eventCache.store';
	import { toast } from '$lib/stores/toast.store';
	import { cleanErrorMessage } from '$lib/utils/errorMessage';
	import { formatMoney, majorToKobo, koboToMajor } from '$lib/utils/money';
	import {
		createWishlist,
		getEventWishlist,
		updateWishlist,
		addWishlistItem,
		updateWishlistItem,
		deleteWishlistItem,
		reorderWishlistItems,
		getWishlistClaims,
		type Wishlist,
		type WishlistItem
	} from '$lib/services/wishlist.services';
	import {
		getEventContributions,
		sendThankYou,
		type ContributionRow
	} from '$lib/services/contribution.services';

	$: eventId = $page.params.id as string;
	$: ({ event: eventStore, collections: collectionsStore } = getEventCache(eventId));
	$: rawEvent = $eventStore;
	$: collectionName =
		$collectionsStore?.find(
			(c: any) => c._id === rawEvent?.collectionId || c.id === rawEvent?.collectionId
		)?.name ?? 'My Collection';

	let activeTab = 'registry';
	const tabs = [
		{ id: 'registry', label: 'Registry', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 12v9H4v-9M12 21V8M22 8H2v4h20V8zM12 8H7.5a2.5 2.5 0 010-5C11 3 12 8 12 8zM12 8h4.5a2.5 2.5 0 000-5C13 3 12 8 12 8z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
		{ id: 'received', label: 'Received', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 6H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2zM2 10h20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
		{ id: 'thank-you', label: 'Thank-you', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
		{ id: 'settings', label: 'Settings', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6h.09A1.65 1.65 0 0010 3.09V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9v.09a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="1.6"/></svg>` }
	];

	$: {
		const t = $page.url.searchParams.get('tab');
		if (t && tabs.some((x) => x.id === t)) activeTab = t;
	}

	// ── State ─────────────────────────────────────────────────────────────
	let wishlist: Wishlist | null = null;
	let items: WishlistItem[] = [];
	let loading = true;
	let creating = false;

	let contributions: ContributionRow[] = [];
	let claimsData: { hideClaimersFromHost: boolean; claims: any[] } = {
		hideClaimersFromHost: true,
		claims: []
	};

	$: currency = wishlist?.currency ?? 'NGN';
	$: raisedKobo = wishlist?.totals?.raisedAmountKobo ?? 0;
	$: shareUrl = wishlist ? `${typeof window !== 'undefined' ? window.location.origin : ''}/w/${wishlist.slug}` : '';

	async function load() {
		loading = true;
		try {
			wishlist = await getEventWishlist(eventId);
			items = (wishlist?.items ?? []) as WishlistItem[];
			if (wishlist) {
				const [contribRes, claimRes] = await Promise.all([
					getEventContributions(eventId, { kind: 'WISHLIST', status: 'COMPLETED', limit: 100 }).catch(
						() => ({ data: [] as ContributionRow[], pagination: { skip: 0, limit: 0, total: 0 }, rollup: [] })
					),
					getWishlistClaims(String(wishlist._id ?? wishlist.id))
				]);
				contributions = contribRes.data;
				claimsData = claimRes;
			}
		} catch (e: any) {
			toast.error(cleanErrorMessage(e.message || 'Could not load the registry'));
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function createRegistry() {
		creating = true;
		try {
			wishlist = await createWishlist({
				eventId,
				scopeType: 'EVENT',
				title: `${rawEvent?.title ?? 'Our'} Registry`,
				currency: rawEvent?.guestContributions?.currency === 'USD' ? 'USD' : 'NGN'
			});
			items = [];
			// The event now carries `giftRegistry.wishlistId`; drop the cache so
			// the sub-nav and Overview tile pick it up on the next read.
			invalidateEventCache(eventId);
			toast.success('Registry created.');
		} catch (e: any) {
			toast.error(cleanErrorMessage(e.message || 'Could not create the registry'));
		} finally {
			creating = false;
		}
	}

	// ── Item editor ───────────────────────────────────────────────────────
	let showItemModal = false;
	let editingItem: WishlistItem | null = null;
	let fTitle = '';
	let fDescription = '';
	let fImageUrl = '';
	let fType: WishlistItem['type'] = 'PHYSICAL';
	let fExternalUrl = '';
	let fTargetMajor: number | null = null;
	let fQuantity = 1;
	let fAllowGroup = true;
	let fPriority: 'MUST_HAVE' | 'NICE_TO_HAVE' = 'NICE_TO_HAVE';
	let savingItem = false;

	function openNewItem() {
		editingItem = null;
		fTitle = '';
		fDescription = '';
		fImageUrl = '';
		fType = 'PHYSICAL';
		fExternalUrl = '';
		fTargetMajor = null;
		fQuantity = 1;
		fAllowGroup = true;
		fPriority = 'NICE_TO_HAVE';
		showItemModal = true;
	}

	function openEditItem(item: WishlistItem) {
		editingItem = item;
		fTitle = item.title;
		fDescription = item.description ?? '';
		fImageUrl = item.imageUrl ?? '';
		fType = item.type;
		fExternalUrl = item.externalUrl ?? '';
		fTargetMajor = item.targetAmountKobo ? koboToMajor(item.targetAmountKobo, currency) : null;
		fQuantity = item.quantityWanted;
		fAllowGroup = item.allowGroupGifting;
		fPriority = item.priority;
		showItemModal = true;
	}

	async function saveItem() {
		if (!wishlist || !fTitle.trim()) return;
		savingItem = true;
		const wid = String(wishlist._id ?? wishlist.id);
		try {
			const payload: any = {
				title: fTitle.trim(),
				description: fDescription.trim() || undefined,
				imageUrl: fImageUrl.trim() || undefined,
				type: fType,
				externalUrl: fType === 'EXTERNAL_LINK' ? fExternalUrl.trim() || undefined : undefined,
				priority: fPriority,
				allowGroupGifting: fAllowGroup,
				quantityWanted: Math.max(1, Math.round(fQuantity || 1))
			};
			if (fType === 'CASH' || fType === 'EXPERIENCE') {
				payload.targetAmountKobo = fTargetMajor ? majorToKobo(fTargetMajor, currency) : undefined;
			}

			if (editingItem) {
				const updated = await updateWishlistItem(
					wid,
					String(editingItem._id ?? editingItem.id),
					payload
				);
				items = items.map((i) =>
					String(i._id ?? i.id) === String(updated._id ?? updated.id) ? updated : i
				);
			} else {
				const created = await addWishlistItem(wid, payload);
				items = [...items, created];
			}
			showItemModal = false;
			toast.success(editingItem ? 'Gift updated.' : 'Gift added.');
		} catch (e: any) {
			toast.error(cleanErrorMessage(e.message || 'Could not save the gift'));
		} finally {
			savingItem = false;
		}
	}

	async function removeItem(item: WishlistItem) {
		if (!wishlist) return;
		const wid = String(wishlist._id ?? wishlist.id);
		const id = String(item._id ?? item.id);
		try {
			await deleteWishlistItem(wid, id);
			items = items.filter((i) => String(i._id ?? i.id) !== id);
			toast.success('Gift removed.');
		} catch (e: any) {
			// The server refuses to delete an item with claims or money against
			// it, so offer the thing it will accept instead of just failing.
			const msg = cleanErrorMessage(e.message || 'Could not remove the gift');
			toast.error(msg);
			if (/claim|contribution/i.test(msg)) {
				try {
					const updated = await updateWishlistItem(wid, id, { status: 'ARCHIVED' } as any);
					items = items.map((i) => (String(i._id ?? i.id) === id ? updated : i));
					toast.info('Archived instead — the history is kept.');
				} catch {
					/* leave the original error standing */
				}
			}
		}
	}

	// ── Drag to reorder ───────────────────────────────────────────────────
	let dragIndex = -1;
	function onDragStart(i: number) {
		dragIndex = i;
	}
	async function onDrop(i: number) {
		if (dragIndex < 0 || dragIndex === i || !wishlist) return;
		const next = [...items];
		const [moved] = next.splice(dragIndex, 1);
		next.splice(i, 0, moved);
		items = next;
		dragIndex = -1;
		try {
			await reorderWishlistItems(
				String(wishlist._id ?? wishlist.id),
				items.map((x) => String(x._id ?? x.id))
			);
		} catch {
			toast.error('Could not save the new order.');
		}
	}

	// ── Settings ──────────────────────────────────────────────────────────
	let sTitle = '';
	let sDescription = '';
	let sHideClaimers = true;
	let sClosesAt = '';
	let sIsPublic = true;
	let sThankYou = '';
	let sStatus: 'DRAFT' | 'OPEN' | 'CLOSED' = 'OPEN';
	let settingsSeeded = false;
	let savingSettings = false;

	$: if (wishlist && !settingsSeeded) {
		sTitle = wishlist.title;
		sDescription = wishlist.description ?? '';
		sHideClaimers = wishlist.hideClaimersFromHost !== false;
		sClosesAt = wishlist.closesAt ? String(wishlist.closesAt).slice(0, 10) : '';
		sIsPublic = wishlist.isPublic !== false;
		sThankYou = wishlist.thankYouMessage ?? '';
		sStatus = wishlist.status;
		settingsSeeded = true;
	}

	async function saveSettings() {
		if (!wishlist) return;
		savingSettings = true;
		try {
			wishlist = await updateWishlist(String(wishlist._id ?? wishlist.id), {
				title: sTitle,
				description: sDescription,
				hideClaimersFromHost: sHideClaimers,
				closesAt: sClosesAt || null,
				isPublic: sIsPublic,
				thankYouMessage: sThankYou,
				status: sStatus
			} as any);
			settingsSeeded = false;
			// The host may have just turned the surprise on or off — re-read the
			// claims so the names appear or disappear immediately.
			claimsData = await getWishlistClaims(String(wishlist._id ?? wishlist.id));
			toast.success('Registry settings saved.');
		} catch (e: any) {
			toast.error(cleanErrorMessage(e.message || 'Could not save settings'));
		} finally {
			savingSettings = false;
		}
	}

	function copyShareLink() {
		if (!shareUrl) return;
		navigator.clipboard.writeText(shareUrl);
		toast.success('Registry link copied!');
	}

	// ── Thank-you ─────────────────────────────────────────────────────────
	let thanking = false;
	$: unthanked = contributions.filter((c) => !c.thankYouSentAt);

	async function thankAll() {
		if (unthanked.length === 0) return;
		thanking = true;
		try {
			const { sent } = await sendThankYou(unthanked.map((c) => c._id));
			const now = new Date().toISOString();
			const ids = new Set(unthanked.map((c) => c._id));
			contributions = contributions.map((c) =>
				ids.has(c._id) ? { ...c, thankYouSentAt: now } : c
			);
			toast.success(`Thank-you sent to ${sent} contributor${sent === 1 ? '' : 's'}.`);
		} catch (e: any) {
			toast.error(cleanErrorMessage(e.message || 'Could not send thank-yous'));
		} finally {
			thanking = false;
		}
	}

	async function thankOne(c: ContributionRow) {
		try {
			await sendThankYou([c._id]);
			contributions = contributions.map((x) =>
				x._id === c._id ? { ...x, thankYouSentAt: new Date().toISOString() } : x
			);
			toast.success(`Thank-you sent to ${c.contributorName}.`);
		} catch (e: any) {
			toast.error(cleanErrorMessage(e.message || 'Could not send thank-you'));
		}
	}

	// ── Helpers ───────────────────────────────────────────────────────────
	function typeLabel(t: string) {
		return t === 'CASH'
			? 'Cash'
			: t === 'EXPERIENCE'
				? 'Experience'
				: t === 'EXTERNAL_LINK'
					? 'External link'
					: 'Physical';
	}
	function typeChip(t: string) {
		return t === 'CASH' || t === 'EXPERIENCE'
			? 'bg-[#E3F4E1] text-[#3CBD2C]'
			: t === 'EXTERNAL_LINK'
				? 'bg-[#E2E8FC] text-[#146AEB]'
				: 'bg-[#F2E4F8] text-[#AB46DD]';
	}
	function progressPct(item: WishlistItem) {
		if (!item.targetAmountKobo || item.targetAmountKobo <= 0) return 0;
		return Math.min(100, Math.round((item.raisedAmountKobo / item.targetAmountKobo) * 100));
	}
	function claimsForItem(itemId: string) {
		return claimsData.claims.filter((c) => String(c.wishlistItemId) === itemId);
	}
	function fmtDate(d?: string) {
		return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
	}
</script>

<div class="max-w-6xl">
	<div class="mb-6">
		<div class="mb-2 flex items-center justify-between">
			<a
				href="/collection/{rawEvent?.collectionId}/events"
				class="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-[#83808D] transition-colors hover:bg-[#F0EFF1]"
			>
				<span>In</span>
				<span class="hidden sm:inline">{collectionName}</span>
			</a>
			{#if wishlist}
				<button
					on:click={copyShareLink}
					class="flex items-center gap-1.5 rounded-md bg-[#F0EFF1] px-3 py-1.5 text-sm font-medium text-[#5D646F] transition-colors hover:bg-[#E4E3E6]"
				>
					<Icon icon="mdi:link-variant" class="h-3.5 w-3.5" />
					Copy registry link
				</button>
			{/if}
		</div>
		<h1 class="mb-8 text-2xl font-bold sm:text-3xl md:text-4xl">
			{rawEvent?.title ?? 'Gift Registry'}
		</h1>
		<Nav {tabs} bind:activeTab />
	</div>

	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each [1, 2, 3] as _}
				<div class="h-48 animate-pulse rounded-xl bg-gray-100"></div>
			{/each}
		</div>
	{:else if !wishlist}
		<!-- Empty state: no registry yet -->
		<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center">
			<div class="mb-3 text-5xl">🎁</div>
			<p class="text-lg font-semibold text-gray-800">No gift registry yet</p>
			<p class="mt-1 max-w-md text-sm text-[#83808D]">
				Add the things you actually want. Guests can buy them, or chip in cash towards the bigger
				ones — and by default you won't see who claimed what, so the surprise holds.
			</p>
			<button
				on:click={createRegistry}
				disabled={creating}
				class="mt-5 rounded-md bg-[#F31A7C] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#d81869] disabled:opacity-50"
			>
				{creating ? 'Creating…' : 'Create registry'}
			</button>
		</div>
	{:else if activeTab === 'registry'}
		<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
			<div class="flex flex-wrap gap-3">
				<div class="rounded-xl bg-[#FDFDFD] px-4 py-3 shadow-sm">
					<p class="text-xs text-[#83808D]">Raised</p>
					<p class="mt-0.5 text-lg font-semibold">{formatMoney(raisedKobo, currency)}</p>
				</div>
				<div class="rounded-xl bg-[#FDFDFD] px-4 py-3 shadow-sm">
					<p class="text-xs text-[#83808D]">Gifts</p>
					<p class="mt-0.5 text-lg font-semibold">
						{wishlist.totals?.fulfilledCount ?? 0}<span class="text-sm text-[#83808D]">/{items.length}</span>
					</p>
				</div>
			</div>
			<button
				on:click={openNewItem}
				class="flex items-center gap-1.5 rounded-md bg-[#F31A7C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#d81869]"
			>
				<Icon icon="mdi:plus" class="text-lg" />
				Add a gift
			</button>
		</div>

		{#if items.length === 0}
			<div class="rounded-xl border border-dashed border-gray-200 p-10 text-center">
				<p class="text-sm font-medium text-gray-700">Your registry is empty</p>
				<p class="mt-1 text-xs text-[#83808D]">Add your first gift so guests have something to give.</p>
			</div>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each items as item, i (String(item._id ?? item.id))}
					<div
						role="listitem"
						draggable="true"
						on:dragstart={() => onDragStart(i)}
						on:dragover|preventDefault
						on:drop={() => onDrop(i)}
						class="flex flex-col overflow-hidden rounded-xl bg-[#FDFDFD] shadow-sm transition-shadow hover:shadow-md {item.status === 'ARCHIVED' ? 'opacity-50' : ''}"
					>
						{#if item.imageUrl}
							<img src={item.imageUrl} alt={item.title} class="h-36 w-full object-cover" />
						{:else}
							<div class="flex h-36 w-full items-center justify-center bg-[#F6F6F6] text-4xl">🎁</div>
						{/if}

						<div class="flex flex-1 flex-col p-4">
							<div class="mb-2 flex flex-wrap gap-1.5">
								<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {typeChip(item.type)}">
									{typeLabel(item.type)}
								</span>
								{#if item.priority === 'MUST_HAVE'}
									<span class="rounded-full bg-[#FFF0E0] px-2 py-0.5 text-[10px] font-medium text-[#B45309]">
										Must have
									</span>
								{/if}
								{#if item.status === 'FULFILLED'}
									<span class="rounded-full bg-[#E3F4E1] px-2 py-0.5 text-[10px] font-medium text-[#3CBD2C]">
										Fulfilled
									</span>
								{/if}
							</div>

							<p class="text-sm font-semibold text-gray-900">{item.title}</p>
							{#if item.description}
								<p class="mt-0.5 line-clamp-2 text-xs text-[#83808D]">{item.description}</p>
							{/if}

							{#if item.type === 'CASH' || item.type === 'EXPERIENCE'}
								<div class="mt-3">
									<div class="mb-1 flex items-baseline justify-between text-xs">
										<span class="font-medium text-gray-800">
											{formatMoney(item.raisedAmountKobo, item.currency)}
										</span>
										{#if item.targetAmountKobo}
											<span class="text-[#83808D]">
												of {formatMoney(item.targetAmountKobo, item.currency)}
											</span>
										{:else}
											<span class="text-[#83808D]">any amount</span>
										{/if}
									</div>
									{#if item.targetAmountKobo}
										<div class="h-1.5 w-full overflow-hidden rounded-full bg-[#EBECED]">
											<div class="h-full rounded-full bg-[#3CBD2C]" style="width: {progressPct(item)}%"></div>
										</div>
									{/if}
								</div>
							{:else}
								<div class="mt-3 text-xs text-[#83808D]">
									{item.quantityClaimed} of {item.quantityWanted} claimed
									{#if claimsData.hideClaimersFromHost && item.quantityClaimed > 0}
										<!-- The surprise promise, stated where the missing names are. -->
										<span
											class="ml-1 inline-flex items-center gap-1 text-[#AB46DD]"
											title="You chose to keep the surprise — names are hidden from you"
										>
											<Icon icon="mdi:eye-off-outline" class="text-sm" />
											hidden
										</span>
									{:else if item.quantityClaimed > 0}
										{#each claimsForItem(String(item._id ?? item.id)).slice(0, 2) as c}
											<span class="ml-1 text-gray-700">· {c.claimerName ?? 'Someone'}</span>
										{/each}
									{/if}
								</div>
							{/if}

							<div class="mt-auto flex gap-2 pt-3">
								<button
									on:click={() => openEditItem(item)}
									class="flex-1 rounded-md bg-[#EBECED] px-2 py-1.5 text-xs font-medium text-[#5D646F] hover:bg-gray-200"
								>
									Edit
								</button>
								<button
									on:click={() => removeItem(item)}
									aria-label="Remove gift"
									class="rounded-md px-2 py-1.5 text-xs text-gray-400 hover:bg-red-50 hover:text-red-600"
								>
									<Icon icon="mdi:trash-can-outline" class="text-base" />
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else if activeTab === 'received'}
		<h2 class="mb-1 text-lg font-semibold">What's come in</h2>
		<p class="mb-5 text-xs text-[#83808D]">
			Cash gifts land in your wallet net of the platform fee. Claims are guests telling you they're
			bringing something.
		</p>

		<h3 class="mb-2 text-sm font-semibold text-gray-700">Cash gifts</h3>
		{#if contributions.length === 0}
			<div class="mb-6 rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-[#83808D]">
				No cash gifts yet.
			</div>
		{:else}
			<div class="mb-6 overflow-x-auto rounded-xl bg-[#FDFDFD] shadow-sm">
				<table class="w-full min-w-[560px] text-left text-sm">
					<thead class="border-b border-gray-100 text-xs text-[#83808D]">
						<tr>
							<th class="px-4 py-3 font-medium">From</th>
							<th class="px-4 py-3 font-medium">Amount</th>
							<th class="px-4 py-3 font-medium">Note</th>
							<th class="px-4 py-3 font-medium">Date</th>
						</tr>
					</thead>
					<tbody>
						{#each contributions as c (c._id)}
							<tr class="border-b border-gray-50 last:border-0">
								<td class="px-4 py-3">
									<div class="font-medium text-gray-900">{c.contributorName}</div>
									<div class="text-xs text-[#83808D]">{c.contributorEmail}</div>
								</td>
								<td class="px-4 py-3 font-medium">
									{formatMoney(c.amountKobo, c.currency)}
									<div class="text-xs text-[#83808D]">net {formatMoney(c.netKobo, c.currency)}</div>
								</td>
								<td class="max-w-[220px] px-4 py-3 text-[#5D646F]">{c.message || '—'}</td>
								<td class="px-4 py-3 text-[#83808D]">{fmtDate(c.paidAt)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		<h3 class="mb-2 text-sm font-semibold text-gray-700">Claimed gifts</h3>
		{#if claimsData.hideClaimersFromHost}
			<p class="mb-3 flex items-center gap-1.5 rounded-lg bg-[#F7F5FA] p-3 text-xs text-[#5D646F]">
				<Icon icon="mdi:eye-off-outline" class="text-base text-[#AB46DD]" />
				Names are hidden to keep the surprise. You can turn this off under Settings — but most hosts
				don't.
			</p>
		{/if}
		{#if claimsData.claims.length === 0}
			<div class="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-[#83808D]">
				Nothing claimed yet.
			</div>
		{:else}
			<div class="space-y-2">
				{#each claimsData.claims as c}
					{@const item = items.find((i) => String(i._id ?? i.id) === String(c.wishlistItemId))}
					<div class="flex items-center justify-between rounded-xl bg-[#FDFDFD] p-4 shadow-sm">
						<div>
							<p class="text-sm font-medium text-gray-900">{item?.title ?? 'A gift'}</p>
							<p class="text-xs text-[#83808D]">
								{c.quantity} claimed ·
								{#if c.claimerName}{c.claimerName}{:else}1 person (hidden){/if}
								· {fmtDate(c.createdAt)}
							</p>
						</div>
						<span
							class="rounded-full px-2 py-0.5 text-xs {c.status === 'PURCHASED'
								? 'bg-[#E3F4E1] text-[#3CBD2C]'
								: 'bg-[#EBECED] text-[#5D646F]'}"
						>
							{c.status === 'PURCHASED' ? 'Bought' : 'Reserved'}
						</span>
					</div>
				{/each}
			</div>
		{/if}
	{:else if activeTab === 'thank-you'}
		<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
			<div>
				<h2 class="text-lg font-semibold">Thank-yous</h2>
				<p class="text-xs text-[#83808D]">
					Everyone who sent a cash gift. Already-thanked contributors are skipped, so this is safe to
					click twice.
				</p>
			</div>
			{#if unthanked.length > 0}
				<button
					on:click={thankAll}
					disabled={thanking}
					class="flex items-center gap-1.5 rounded-md bg-[#F31A7C] px-3 py-2 text-sm font-medium text-white hover:bg-[#d81869] disabled:opacity-50"
				>
					<Icon icon="mdi:email-heart-outline" class="text-base" />
					{thanking ? 'Sending…' : `Thank all (${unthanked.length})`}
				</button>
			{/if}
		</div>

		{#if contributions.length === 0}
			<div class="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-[#83808D]">
				No cash gifts to thank anyone for yet.
			</div>
		{:else}
			<div class="space-y-2">
				{#each contributions as c (c._id)}
					<div class="flex items-center justify-between rounded-xl bg-[#FDFDFD] p-4 shadow-sm">
						<div>
							<p class="text-sm font-medium text-gray-900">{c.contributorName}</p>
							<p class="text-xs text-[#83808D]">
								{formatMoney(c.amountKobo, c.currency)} · {fmtDate(c.paidAt)}
							</p>
							{#if c.message}
								<p class="mt-1 text-xs italic text-[#5D646F]">"{c.message}"</p>
							{/if}
						</div>
						{#if c.thankYouSentAt}
							<span class="flex items-center gap-1 text-xs text-[#3CBD2C]">
								<Icon icon="mdi:check-circle-outline" class="text-sm" />
								Thanked
							</span>
						{:else}
							<button
								on:click={() => thankOne(c)}
								class="rounded-md bg-[#EBECED] px-2.5 py-1.5 text-xs font-medium text-[#5D646F] hover:bg-gray-200"
							>
								Send thank-you
							</button>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	{:else if activeTab === 'settings'}
		<div class="max-w-2xl space-y-5">
			<div>
				<label class="mb-1 block text-xs font-medium text-gray-700" for="r-title">Registry title</label>
				<input
					id="r-title"
					bind:value={sTitle}
					class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
				/>
			</div>

			<div>
				<label class="mb-1 block text-xs font-medium text-gray-700" for="r-desc">Description</label>
				<textarea
					id="r-desc"
					rows="3"
					bind:value={sDescription}
					placeholder="A note to your guests…"
					class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
				></textarea>
			</div>

			<!-- The single most consequential setting on this page. -->
			<div class="rounded-xl border border-gray-200 bg-white p-4">
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="text-sm font-medium text-gray-900">Keep the surprise</p>
						<p class="mt-0.5 text-xs text-[#83808D]">
							When this is on, you can see that a gift was claimed but not by whom. Guests are told,
							which is a large part of why they claim at all. Turning it off is visible to nobody but
							you — but you can't un-see a name.
						</p>
					</div>
					<button
						type="button"
						on:click={() => (sHideClaimers = !sHideClaimers)}
						aria-pressed={sHideClaimers}
						aria-label="Toggle surprise preservation"
						class="relative mt-0.5 h-6 w-11 flex-shrink-0 rounded-full transition-colors {sHideClaimers ? 'bg-pink-600' : 'bg-gray-300'}"
					>
						<span
							class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform {sHideClaimers ? 'translate-x-5' : ''}"
						></span>
					</button>
				</div>
			</div>

			<div class="flex flex-wrap items-end gap-4">
				<div>
					<label class="mb-1 block text-xs font-medium text-gray-700" for="r-status">Status</label>
					<select
						id="r-status"
						bind:value={sStatus}
						class="rounded-md border border-gray-200 bg-white px-2 py-2 text-sm focus:outline-none"
					>
						<option value="OPEN">Open</option>
						<option value="DRAFT">Draft (hidden)</option>
						<option value="CLOSED">Closed</option>
					</select>
				</div>
				<div>
					<label class="mb-1 block text-xs font-medium text-gray-700" for="r-closes">Closes on</label>
					<input
						id="r-closes"
						type="date"
						bind:value={sClosesAt}
						class="rounded-md border border-gray-200 bg-white px-2 py-2 text-sm focus:outline-none"
					/>
				</div>
			</div>

			<label class="flex items-center gap-2 text-sm">
				<input type="checkbox" bind:checked={sIsPublic} class="h-4 w-4 rounded" />
				Anyone with the link can see this registry
			</label>

			<div>
				<label class="mb-1 block text-xs font-medium text-gray-700" for="r-thanks">
					Default thank-you message
				</label>
				<textarea
					id="r-thanks"
					rows="3"
					bind:value={sThankYou}
					placeholder="Thank you so much — it meant the world to us."
					class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
				></textarea>
			</div>

			{#if shareUrl}
				<div class="rounded-xl bg-[#F6F6F6] p-4">
					<p class="mb-1 text-xs font-medium text-gray-700">Share link</p>
					<div class="flex items-center gap-2">
						<code class="flex-1 truncate rounded bg-white px-2 py-1.5 text-xs">{shareUrl}</code>
						<button
							on:click={copyShareLink}
							class="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
						>
							Copy
						</button>
					</div>
				</div>
			{/if}

			<button
				on:click={saveSettings}
				disabled={savingSettings}
				class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
			>
				{savingSettings ? 'Saving…' : 'Save registry settings'}
			</button>
		</div>
	{/if}
</div>

<!-- Item editor -->
{#if showItemModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
		<div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold">{editingItem ? 'Edit gift' : 'Add a gift'}</h3>
				<button on:click={() => (showItemModal = false)} aria-label="Close" class="text-gray-400 hover:text-gray-600">
					<Icon icon="mdi:close" class="text-xl" />
				</button>
			</div>

			<div class="space-y-4">
				<div>
					<label class="mb-1 block text-xs font-medium text-gray-700" for="i-type">Type</label>
					<select
						id="i-type"
						bind:value={fType}
						class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
					>
						<option value="PHYSICAL">Physical — someone buys and brings it</option>
						<option value="CASH">Cash — guests chip in towards a goal</option>
						<option value="EXPERIENCE">Experience — cash towards something you'll do</option>
						<option value="EXTERNAL_LINK">External link — buy it from a shop</option>
					</select>
				</div>

				<div>
					<label class="mb-1 block text-xs font-medium text-gray-700" for="i-title">Title *</label>
					<input
						id="i-title"
						bind:value={fTitle}
						placeholder="e.g. Stand mixer"
						class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
					/>
				</div>

				<div>
					<label class="mb-1 block text-xs font-medium text-gray-700" for="i-desc">Description</label>
					<textarea
						id="i-desc"
						rows="2"
						bind:value={fDescription}
						class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
					></textarea>
				</div>

				<div>
					<label class="mb-1 block text-xs font-medium text-gray-700" for="i-img">Image URL</label>
					<input
						id="i-img"
						bind:value={fImageUrl}
						placeholder="https://…"
						class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
					/>
				</div>

				{#if fType === 'EXTERNAL_LINK'}
					<div>
						<label class="mb-1 block text-xs font-medium text-gray-700" for="i-url">Where to buy it</label>
						<input
							id="i-url"
							bind:value={fExternalUrl}
							placeholder="https://jumia.com.ng/…"
							class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
						/>
						<p class="mt-1 text-xs text-gray-400">Must start with http:// or https://</p>
					</div>
				{/if}

				{#if fType === 'CASH' || fType === 'EXPERIENCE'}
					<div>
						<label class="mb-1 block text-xs font-medium text-gray-700" for="i-target">
							Goal ({currency})
						</label>
						<input
							id="i-target"
							type="number"
							min="0"
							bind:value={fTargetMajor}
							placeholder="Leave blank for any amount"
							class="w-40 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
						/>
					</div>
					<label class="flex items-center gap-2 text-sm">
						<input type="checkbox" bind:checked={fAllowGroup} class="h-4 w-4 rounded" />
						Let several guests chip in together
					</label>
				{:else}
					<div>
						<label class="mb-1 block text-xs font-medium text-gray-700" for="i-qty">How many?</label>
						<input
							id="i-qty"
							type="number"
							min="1"
							bind:value={fQuantity}
							class="w-24 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
						/>
					</div>
				{/if}

				<div>
					<label class="mb-1 block text-xs font-medium text-gray-700" for="i-priority">Priority</label>
					<select
						id="i-priority"
						bind:value={fPriority}
						class="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
					>
						<option value="NICE_TO_HAVE">Nice to have</option>
						<option value="MUST_HAVE">Must have</option>
					</select>
				</div>
			</div>

			<div class="mt-6 flex gap-2">
				<button
					on:click={saveItem}
					disabled={savingItem || !fTitle.trim()}
					class="flex-1 rounded-md bg-[#F31A7C] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#d81869] disabled:opacity-50"
				>
					{savingItem ? 'Saving…' : editingItem ? 'Save changes' : 'Add gift'}
				</button>
				<button
					on:click={() => (showItemModal = false)}
					class="rounded-md bg-[#EBECED] px-4 py-2.5 text-sm font-medium text-[#5D646F] hover:bg-gray-200"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}
