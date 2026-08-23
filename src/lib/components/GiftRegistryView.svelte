<!--
	GAP 3 — the PUBLIC gift registry view.

	Shared by two routes so they can never drift apart:
	  - `event-page/[id]/gifts`  (the event's Gifts tab)
	  - `w/[slug]`               (a standalone registry, shared by link)

	Design rules this component exists to enforce:

	  1. **Claimed items show as claimed.** That is the entire point of a
	     registry — two guests must not both buy the toaster. What is NEVER
	     shown is who claimed it (the server strips that; we just don't ask).

	  2. **Cash items are funded, physical items are claimed.** Two different
	     mechanics, two different CTAs, one card component.

	  3. **Everything is themed.** No hardcoded colours — this renders inside
	     someone's event page and must look like their event.
-->
<script lang="ts">
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';
	import type { Color } from '$lib/utils/colors';
	import { formatMoney, majorToKobo } from '$lib/utils/money';
	import { toast } from '$lib/stores/toast.store';
	import {
		claimWishlistItem,
		type PublicWishlistView,
		type WishlistItem
	} from '$lib/services/wishlist.services';
	import {
		initiateContribution,
		verifyAndSettleContribution,
		contributionErrorCopy,
		getContributorWall
	} from '$lib/services/contribution.services';

	export let view: PublicWishlistView | null = null;
	export let themeColor: Color;
	/** Optional — only present when the registry hangs off an event. */
	export let eventTitle = '';

	// `funded` / `claimed` let the host page re-fetch the authoritative totals
	// rather than this component guessing at them.
	const dispatch = createEventDispatcher();

	$: registry = view?.registry ?? null;
	$: items = view?.items ?? [];
	$: currency = registry?.currency ?? 'NGN';
	$: openItems = items.filter((i) => i.status !== 'FULFILLED');
	$: fulfilledItems = items.filter((i) => i.status === 'FULFILLED');

	// ── Contributor wall ──────────────────────────────────────────────────
	let wall: { name: string; message: string | null; at: string }[] = [];
	let wallSummary = { contributorCount: 0, raisedKobo: 0 };
	let wallLoadedFor = '';
	$: if (registry?.id && wallLoadedFor !== registry.id) {
		wallLoadedFor = registry.id;
		// Scoped to the EVENT when there is one — a registry's well-wishers are
		// the same people as the event's, and the wall endpoint keys on event.
		// Decoration on an otherwise-working page: never allowed to break it.
		const scope = registry.eventId
			? (['EVENT', registry.eventId] as const)
			: (['WISHLIST_ITEM', registry.id] as const);
		getContributorWall(scope[0], scope[1])
			.then((w) => {
				wall = w.data;
				wallSummary = w.summary;
			})
			.catch(() => {});
	}

	// ── Cash gift sheet ───────────────────────────────────────────────────
	let fundItem: WishlistItem | null = null;
	let fundAmountMajor: number | null = null;
	let fundName = '';
	let fundEmail = '';
	let fundMessage = '';
	let fundAnonymous = false;
	let fundBusy = false;
	let fundError = '';

	function openFund(item: WishlistItem) {
		fundItem = item;
		// Pre-fill with whatever is still needed — the amount most people mean.
		fundAmountMajor = item.remainingKobo ? Math.round(item.remainingKobo / 100) : null;
		fundName = '';
		fundEmail = '';
		fundMessage = '';
		fundAnonymous = false;
		fundError = '';
	}

	async function submitFund() {
		if (!fundItem) return;
		fundError = '';
		if (!fundEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fundEmail)) {
			fundError = 'Please enter a valid email so we can send your receipt.';
			return;
		}
		const amountKobo = majorToKobo(fundAmountMajor ?? 0, currency);
		if (!amountKobo || amountKobo <= 0) {
			fundError = 'Enter an amount first.';
			return;
		}

		fundBusy = true;
		try {
			const res = await initiateContribution({
				kind: 'WISHLIST',
				wishlistItemId: String(fundItem._id ?? fundItem.id),
				amountKobo,
				contributorName: fundName.trim() || 'A well-wisher',
				contributorEmail: fundEmail.trim().toLowerCase(),
				isAnonymous: fundAnonymous,
				message: fundMessage.trim() || undefined,
				successCallbackUrl: `${window.location.origin}${window.location.pathname}?gift=success`,
				failureCallbackUrl: `${window.location.origin}${window.location.pathname}?gift=failed`
			});

			await loadPaystack();
			const handler = (window as any).PaystackPop.setup({
				key: res.paystackPublicKey || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
				email: fundEmail.trim().toLowerCase(),
				amount: res.totalAmount,
				currency: res.currency || currency,
				ref: res.reference || '',
				channels: ['card', 'bank', 'ussd', 'bank_transfer'],
				callback: () => {
					// The webhook is the canonical settlement and is idempotent —
					// this only makes the thank-you appear now instead of in a
					// minute, so its failure is NOT a payment failure.
					//
					// We re-fetch rather than patching the total locally: the
					// authoritative raised amount is net of whatever the gateway
					// actually captured, and guessing it here would show the payer
					// a number that then changes under them.
					verifyAndSettleContribution(res.reference, res.verificationToken).finally(() => {
						fundBusy = false;
						fundItem = null;
						toast.success('Thank you — your gift is on its way! 🎁');
						dispatch('funded');
					});
				},
				onClose: () => {
					fundError = 'Payment window closed. You can try again.';
					fundBusy = false;
				}
			});
			handler.openIframe();
		} catch (e: any) {
			fundError = contributionErrorCopy(e, 'Could not start the payment.');
			fundBusy = false;
		}
	}

	function loadPaystack(): Promise<void> {
		return new Promise((resolve, reject) => {
			if ((window as any).PaystackPop) return resolve();
			const s = document.createElement('script');
			s.src = 'https://js.paystack.co/v1/inline.js';
			s.onload = () => resolve();
			s.onerror = () => reject(new Error('Could not load the payment library'));
			document.head.appendChild(s);
		});
	}

	// ── Claim sheet (PHYSICAL / EXTERNAL_LINK) ────────────────────────────
	let claimItem_: WishlistItem | null = null;
	let claimName = '';
	let claimEmail = '';
	let claimNote = '';
	let claimQty = 1;
	let claimBusy = false;
	let claimError = '';
	let claimResult: { claimToken: string; externalUrl?: string } | null = null;

	function openClaim(item: WishlistItem) {
		claimItem_ = item;
		claimName = '';
		claimEmail = '';
		claimNote = '';
		claimQty = 1;
		claimError = '';
		claimResult = null;
	}

	async function submitClaim() {
		if (!claimItem_ || !registry) return;
		claimError = '';
		if (!claimEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claimEmail)) {
			claimError = 'Please enter a valid email so we can send you the details.';
			return;
		}
		claimBusy = true;
		try {
			const res = await claimWishlistItem(registry.id, String(claimItem_._id ?? claimItem_.id), {
				claimerName: claimName.trim() || 'A guest',
				claimerEmail: claimEmail.trim().toLowerCase(),
				quantity: claimQty,
				note: claimNote.trim() || undefined
			});
			claimResult = { claimToken: res.claimToken, externalUrl: claimItem_.externalUrl };
			dispatch('claimed');
			// Optimistically reflect the claim so the card updates behind the sheet.
			items = items.map((i) =>
				String(i._id ?? i.id) === String(claimItem_?._id ?? claimItem_?.id)
					? { ...i, quantityClaimed: i.quantityClaimed + claimQty, status: res.itemStatus as any }
					: i
			);
		} catch (e: any) {
			claimError =
				e?.code === 'ALREADY_CLAIMED'
					? 'Someone just claimed the last one. Try another gift!'
					: e?.code === 'REGISTRY_CLOSED'
						? 'This registry is closed.'
						: e?.message || 'Could not claim this gift.';
		} finally {
			claimBusy = false;
		}
	}

	function progressPct(item: WishlistItem) {
		if (!item.targetAmountKobo || item.targetAmountKobo <= 0) return 0;
		return Math.min(100, Math.round((item.raisedAmountKobo / item.targetAmountKobo) * 100));
	}

	function isCash(item: WishlistItem) {
		return item.type === 'CASH' || item.type === 'EXPERIENCE';
	}
</script>

{#if !registry}
	<div
		class="flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center"
		style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};"
	>
		<div class="mb-3 text-5xl">🎁</div>
		<p class="text-lg font-semibold" style="color: {themeColor.text};">No gift registry yet</p>
		<p class="mt-1 text-sm" style="color: {themeColor.lightText};">
			The host hasn't set one up. Check back closer to the day.
		</p>
	</div>
{:else}
	<div class="rounded-2xl p-5" style="background-color: {themeColor.cover};">
		<h2 class="text-2xl font-bold" style="color: {themeColor.text};">{registry.title}</h2>
		{#if registry.description}
			<p class="mt-2 text-sm leading-relaxed" style="color: {themeColor.lightText};">
				{registry.description}
			</p>
		{/if}

		<div class="mt-4 flex flex-wrap gap-4 text-sm">
			<div>
				<p class="text-xs" style="color: {themeColor.lightText};">Raised</p>
				<p class="font-semibold" style="color: {themeColor.text};">
					{formatMoney(registry.totals?.raisedAmountKobo ?? 0, currency)}
				</p>
			</div>
			<div>
				<p class="text-xs" style="color: {themeColor.lightText};">Gifts</p>
				<p class="font-semibold" style="color: {themeColor.text};">
					{registry.totals?.fulfilledCount ?? 0} of {registry.totals?.itemCount ?? items.length}
				</p>
			</div>
		</div>

		{#if registry.surprisePreserved}
			<!-- Told to guests on purpose: knowing the host can't see who claimed
			     what is a large part of why people claim at all. -->
			<p
				class="mt-4 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs"
				style="background-color: {themeColor.smallCover}; color: {themeColor.lightText};"
			>
				<Icon icon="mdi:eye-off-outline" class="text-base" />
				{eventTitle || 'The host'} can't see who claimed what — the surprise is safe.
			</p>
		{/if}

		{#if !registry.isOpen}
			<p class="mt-3 rounded-lg px-3 py-2 text-xs" style="background-color: {themeColor.smallCover}; color: {themeColor.lightText};">
				This registry is closed. Thank you to everyone who gave.
			</p>
		{/if}
	</div>

	{#if items.length === 0}
		<div class="mt-5 rounded-2xl px-6 py-12 text-center" style="background-color: {themeColor.cover};">
			<p class="text-sm" style="color: {themeColor.lightText};">
				Nothing on the list just yet.
			</p>
		</div>
	{:else}
		<div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each [...openItems, ...fulfilledItems] as item (String(item._id ?? item.id))}
				{@const fulfilled = item.status === 'FULFILLED'}
				<div
					class="flex flex-col overflow-hidden rounded-2xl transition-opacity"
					style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle}; {fulfilled ? 'opacity: 0.65;' : ''}"
				>
					{#if item.imageUrl}
						<img src={item.imageUrl} alt={item.title} class="h-40 w-full object-cover" />
					{:else}
						<div
							class="flex h-40 w-full items-center justify-center text-5xl"
							style="background-color: {themeColor.smallCover};"
						>
							{isCash(item) ? '💝' : '🎁'}
						</div>
					{/if}

					<div class="flex flex-1 flex-col p-4">
						<div class="mb-2 flex flex-wrap gap-1.5">
							{#if item.priority === 'MUST_HAVE'}
								<span
									class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
									style="background-color: {themeColor.toggle}; color: {themeColor.text};"
								>
									Most wanted
								</span>
							{/if}
							{#if fulfilled}
								<span
									class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
									style="background-color: {themeColor.smallCover}; color: {themeColor.lightText};"
								>
									{isCash(item) ? 'Fully funded' : 'Claimed'}
								</span>
							{/if}
						</div>

						<p class="text-sm font-semibold" style="color: {themeColor.text};">{item.title}</p>
						{#if item.description}
							<p class="mt-0.5 line-clamp-2 text-xs" style="color: {themeColor.lightText};">
								{item.description}
							</p>
						{/if}

						{#if isCash(item)}
							<div class="mt-3">
								<div class="mb-1 flex items-baseline justify-between text-xs">
									<span class="font-semibold" style="color: {themeColor.text};">
										{formatMoney(item.raisedAmountKobo, item.currency)}
									</span>
									{#if item.targetAmountKobo}
										<span style="color: {themeColor.lightText};">
											of {formatMoney(item.targetAmountKobo, item.currency)}
										</span>
									{/if}
								</div>
								{#if item.targetAmountKobo}
									<div class="h-2 w-full overflow-hidden rounded-full" style="background-color: {themeColor.smallCover};">
										<div
											class="h-full rounded-full transition-all"
											style="width: {progressPct(item)}%; background-color: {themeColor.button};"
										></div>
									</div>
								{/if}
							</div>
						{:else}
							<p class="mt-3 text-xs" style="color: {themeColor.lightText};">
								{item.quantityClaimed} of {item.quantityWanted} claimed
							</p>
						{/if}

						<div class="mt-auto pt-3">
							{#if fulfilled || !registry.isOpen}
								<button
									disabled
									class="w-full cursor-not-allowed rounded-lg py-2.5 text-sm font-medium opacity-50"
									style="background-color: {themeColor.smallCover}; color: {themeColor.lightText};"
								>
									{isCash(item) ? 'Fully funded' : 'Already claimed'}
								</button>
							{:else if isCash(item)}
								<button
									on:click={() => openFund(item)}
									class="w-full rounded-lg py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
									style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
								>
									Contribute
								</button>
							{:else if item.type === 'EXTERNAL_LINK' && item.externalUrl}
								<div class="flex gap-2">
									<a
										href={item.externalUrl}
										target="_blank"
										rel="noopener nofollow"
										class="flex-1 rounded-lg py-2.5 text-center text-sm font-medium no-underline transition-opacity hover:opacity-90"
										style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
									>
										Buy it
									</a>
									<button
										on:click={() => openClaim(item)}
										class="rounded-lg px-3 py-2.5 text-sm font-medium"
										style="background-color: {themeColor.smallCover}; color: {themeColor.text};"
									>
										I'll get this
									</button>
								</div>
							{:else}
								<button
									on:click={() => openClaim(item)}
									class="w-full rounded-lg py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
									style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
								>
									I'll get this
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if wall.length > 0}
		<div class="mt-6 rounded-2xl p-5" style="background-color: {themeColor.cover};">
			<h3 class="mb-3 text-base font-semibold" style="color: {themeColor.text};">
				{wallSummary.contributorCount} well-wisher{wallSummary.contributorCount === 1 ? '' : 's'}
			</h3>
			<div class="space-y-3">
				{#each wall as w}
					<div class="flex items-start gap-3">
						<div
							class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
							style="background-color: {themeColor.smallCover}; color: {themeColor.text};"
						>
							{(w.name || '?').charAt(0).toUpperCase()}
						</div>
						<div class="min-w-0">
							<p class="text-sm font-medium" style="color: {themeColor.text};">{w.name}</p>
							{#if w.message}
								<p class="mt-0.5 text-sm break-words" style="color: {themeColor.lightText};">
									{w.message}
								</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
{/if}

<!-- ── Cash gift sheet ─────────────────────────────────────────────────── -->
{#if fundItem}
	<div class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
		<div
			class="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl p-6 sm:rounded-2xl"
			style="background-color: {themeColor.bg};"
		>
			<div class="mb-4 flex items-start justify-between gap-3">
				<div>
					<h3 class="text-lg font-semibold" style="color: {themeColor.text};">
						Contribute to {fundItem.title}
					</h3>
					{#if fundItem.targetAmountKobo}
						<p class="mt-0.5 text-xs" style="color: {themeColor.lightText};">
							{formatMoney(fundItem.remainingKobo ?? 0, currency)} still needed
						</p>
					{/if}
				</div>
				<button on:click={() => (fundItem = null)} aria-label="Close" style="color: {themeColor.lightText};">
					<Icon icon="mdi:close" class="text-xl" />
				</button>
			</div>

			{#if fundError}
				<div class="mb-3 rounded-xl p-3 text-sm" style="background-color: #fef2f2; color: #991b1b;">
					{fundError}
				</div>
			{/if}

			<div class="space-y-3">
				<div>
					<label class="text-sm" style="color: {themeColor.lightText};" for="f-amt">Amount ({currency})</label>
					<input
						id="f-amt"
						type="number"
						min="0"
						bind:value={fundAmountMajor}
						class="mt-1.5 w-full rounded-[9px] border px-4 py-3 text-sm focus:outline-none"
						style="background-color: {themeColor.cover}; border-color: {themeColor.toggle}; color: {themeColor.text};"
					/>
				</div>
				<div>
					<label class="text-sm" style="color: {themeColor.lightText};" for="f-name">Your name</label>
					<input
						id="f-name"
						bind:value={fundName}
						placeholder="So they know who to thank"
						class="mt-1.5 w-full rounded-[9px] border px-4 py-3 text-sm focus:outline-none"
						style="background-color: {themeColor.cover}; border-color: {themeColor.toggle}; color: {themeColor.text};"
					/>
				</div>
				<div>
					<label class="text-sm" style="color: {themeColor.lightText};" for="f-email">Email *</label>
					<input
						id="f-email"
						type="email"
						bind:value={fundEmail}
						placeholder="For your receipt"
						class="mt-1.5 w-full rounded-[9px] border px-4 py-3 text-sm focus:outline-none"
						style="background-color: {themeColor.cover}; border-color: {themeColor.toggle}; color: {themeColor.text};"
					/>
				</div>
				<div>
					<label class="text-sm" style="color: {themeColor.lightText};" for="f-msg">Note (optional)</label>
					<textarea
						id="f-msg"
						rows="2"
						maxlength="500"
						bind:value={fundMessage}
						class="mt-1.5 w-full resize-none rounded-[9px] border px-4 py-3 text-sm focus:outline-none"
						style="background-color: {themeColor.cover}; border-color: {themeColor.toggle}; color: {themeColor.text};"
					></textarea>
				</div>
				<label class="flex items-start gap-3 rounded-lg px-3 py-2.5" style="background-color: {themeColor.cover};">
					<input type="checkbox" bind:checked={fundAnonymous} class="mt-0.5 h-5 w-5 rounded" style="accent-color: {themeColor.button};" />
					<span class="text-sm" style="color: {themeColor.text};">
						Hide my name publicly
						<span class="mt-0.5 block text-xs" style="color: {themeColor.lightText};">
							The host still sees it, so they can thank you.
						</span>
					</span>
				</label>
			</div>

			<button
				on:click={submitFund}
				disabled={fundBusy}
				class="mt-5 w-full rounded-lg py-3 text-base font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
				style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
			>
				{fundBusy ? 'Opening payment…' : 'Send gift'}
			</button>
		</div>
	</div>
{/if}

<!-- ── Claim sheet ─────────────────────────────────────────────────────── -->
{#if claimItem_}
	<div class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
		<div
			class="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl p-6 sm:rounded-2xl"
			style="background-color: {themeColor.bg};"
		>
			{#if claimResult}
				<div class="text-center">
					<div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full" style="background-color: {themeColor.smallCover};">
						<Icon icon="mdi:check" class="text-2xl" style="color: {themeColor.button};" />
					</div>
					<h3 class="text-lg font-semibold" style="color: {themeColor.text};">It's yours to bring</h3>
					<p class="mt-2 text-sm" style="color: {themeColor.lightText};">
						We've emailed you a link to mark it as bought — or release it if your plans change. Nobody
						else can claim it in the meantime.
					</p>
					{#if claimResult.externalUrl}
						<a
							href={claimResult.externalUrl}
							target="_blank"
							rel="noopener nofollow"
							class="mt-4 inline-block w-full rounded-lg py-3 text-sm font-medium no-underline"
							style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
						>
							Go buy it
						</a>
					{/if}
					<button
						on:click={() => (claimItem_ = null)}
						class="mt-2 w-full rounded-lg py-2.5 text-sm font-medium"
						style="background-color: {themeColor.cover}; color: {themeColor.text};"
					>
						Done
					</button>
				</div>
			{:else}
				<div class="mb-4 flex items-start justify-between gap-3">
					<h3 class="text-lg font-semibold" style="color: {themeColor.text};">
						I'll get {claimItem_.title}
					</h3>
					<button on:click={() => (claimItem_ = null)} aria-label="Close" style="color: {themeColor.lightText};">
						<Icon icon="mdi:close" class="text-xl" />
					</button>
				</div>

				{#if claimError}
					<div class="mb-3 rounded-xl p-3 text-sm" style="background-color: #fef2f2; color: #991b1b;">
						{claimError}
					</div>
				{/if}

				<div class="space-y-3">
					<div>
						<label class="text-sm" style="color: {themeColor.lightText};" for="c-name">Your name</label>
						<input
							id="c-name"
							bind:value={claimName}
							class="mt-1.5 w-full rounded-[9px] border px-4 py-3 text-sm focus:outline-none"
							style="background-color: {themeColor.cover}; border-color: {themeColor.toggle}; color: {themeColor.text};"
						/>
					</div>
					<div>
						<label class="text-sm" style="color: {themeColor.lightText};" for="c-email">Email *</label>
						<input
							id="c-email"
							type="email"
							bind:value={claimEmail}
							placeholder="We'll send you a manage link"
							class="mt-1.5 w-full rounded-[9px] border px-4 py-3 text-sm focus:outline-none"
							style="background-color: {themeColor.cover}; border-color: {themeColor.toggle}; color: {themeColor.text};"
						/>
					</div>
					{#if claimItem_.quantityWanted - claimItem_.quantityClaimed > 1}
						<div>
							<label class="text-sm" style="color: {themeColor.lightText};" for="c-qty">How many?</label>
							<input
								id="c-qty"
								type="number"
								min="1"
								max={claimItem_.quantityWanted - claimItem_.quantityClaimed}
								bind:value={claimQty}
								class="mt-1.5 w-24 rounded-[9px] border px-4 py-3 text-sm focus:outline-none"
								style="background-color: {themeColor.cover}; border-color: {themeColor.toggle}; color: {themeColor.text};"
							/>
						</div>
					{/if}
					<div>
						<label class="text-sm" style="color: {themeColor.lightText};" for="c-note">Note (optional)</label>
						<textarea
							id="c-note"
							rows="2"
							bind:value={claimNote}
							class="mt-1.5 w-full resize-none rounded-[9px] border px-4 py-3 text-sm focus:outline-none"
							style="background-color: {themeColor.cover}; border-color: {themeColor.toggle}; color: {themeColor.text};"
						></textarea>
					</div>
				</div>

				<button
					on:click={submitClaim}
					disabled={claimBusy}
					class="mt-5 w-full rounded-lg py-3 text-base font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
					style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
				>
					{claimBusy ? 'Reserving…' : 'Claim this gift'}
				</button>
			{/if}
		</div>
	</div>
{/if}
