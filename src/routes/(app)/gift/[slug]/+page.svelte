<!--
	GAP 4 — the PUBLIC gift-link page.

	Fully public and deliberately frictionless: the contributor is usually not
	a Rondwell user and arrived from a WhatsApp message. Amount, name, email —
	that's the whole form.

	Themed from the owner's chosen palette via `lib/utils/colors.ts`, never
	hardcoded, so the page looks like the person whose link it is.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { colors, type Color } from '$lib/utils/colors';
	import { formatMoney, majorToKobo } from '$lib/utils/money';
	import { toast } from '$lib/stores/toast.store';
	import {
		getPublicGiftLink,
		contributeToGiftLink,
		GIFT_OCCASIONS,
		type PublicGiftLink
	} from '$lib/services/giftLink.services';
	import {
		verifyAndSettleContribution,
		contributionErrorCopy,
		getContributorWall
	} from '$lib/services/contribution.services';
	import { getPublicWishlistBySlug } from '$lib/services/wishlist.services';

	export let data: any;
	$: seo = data?.seo;
	$: slug = $page.params.slug ?? '';

	let link: PublicGiftLink | null = data?.preloaded ?? null;
	let loading = !data?.preloaded;
	let notFound = false;

	// The owner picked a palette name; resolve it back to the palette entry so
	// the whole page is themed the way they set it up.
	$: themeColor =
		(link?.themeColor && colors.find((c) => c.name.toLowerCase() === link!.themeColor!.toLowerCase())) ||
		colors[0];

	$: occasionMeta = GIFT_OCCASIONS.find((o) => o.value === link?.occasion) ?? GIFT_OCCASIONS[5];

	/** Set when the cover image fails to load; falls back to the occasion emoji. */
	let coverFailed = false;
	// Reset per link, so navigating between gift pages does not inherit a
	// previous page's failure.
	$: if (link?.coverImageUrl) coverFailed = false;

	let wall: { name: string; message: string | null; at: string }[] = [];
	let wallSummary = { contributorCount: 0, raisedKobo: 0 };

	// ── Gift form ─────────────────────────────────────────────────────────
	let amountMajor: number | null = null;
	let name = '';
	let email = '';
	let note = '';
	let anonymous = false;
	let busy = false;
	let error = '';
	let done = false;

	async function load() {
		const res = await getPublicGiftLink(slug);
		if (!res) {
			notFound = true;
		} else {
			link = res;
			notFound = false;
			if (res.showContributorWall) {
				getContributorWall('GIFT_LINK', res.id)
					.then((w) => {
						wall = w.data;
						wallSummary = w.summary;
					})
					.catch(() => {});
			}
		}
		loading = false;
	}

	onMount(load);

	$: progressPct =
		link?.targetAmountKobo && link.targetAmountKobo > 0
			? Math.min(100, Math.round((link.raisedAmountKobo / link.targetAmountKobo) * 100))
			: 0;

	function pickAmount(kobo: number) {
		amountMajor = Math.round(kobo / 100);
		error = '';
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

	async function submit() {
		if (!link) return;
		error = '';

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			error = 'Please enter a valid email so we can send your receipt.';
			return;
		}
		const amountKobo = majorToKobo(amountMajor ?? 0, link.currency);
		if (!amountKobo || amountKobo <= 0) {
			error = 'Choose or enter an amount first.';
			return;
		}
		if (amountKobo < link.minKobo) {
			error = `The minimum is ${formatMoney(link.minKobo, link.currency)}.`;
			return;
		}

		busy = true;
		try {
			const res = await contributeToGiftLink(slug, {
				amountKobo,
				contributorName: name.trim() || 'A well-wisher',
				contributorEmail: email.trim().toLowerCase(),
				message: note.trim() || undefined,
				isAnonymous: anonymous,
				successCallbackUrl: `${window.location.origin}/gift/${slug}?gift=success`,
				failureCallbackUrl: `${window.location.origin}/gift/${slug}?gift=failed`
			});

			await loadPaystack();
			const handler = (window as any).PaystackPop.setup({
				key: res.paystackPublicKey || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
				email: email.trim().toLowerCase(),
				amount: res.totalAmount,
				currency: res.currency || link.currency,
				ref: res.reference || '',
				channels: ['card', 'bank', 'ussd', 'bank_transfer'],
				callback: () => {
					// The webhook is the canonical settlement and is idempotent —
					// this only makes the thank-you appear immediately, so a
					// failure here is NOT a payment failure.
					verifyAndSettleContribution(res.reference, res.verificationToken).finally(() => {
						busy = false;
						done = true;
						toast.success('Thank you — your gift is on its way! 🎁');
						load();
					});
				},
				onClose: () => {
					error = 'Payment window closed. You can try again.';
					busy = false;
				}
			});
			handler.openIframe();
		} catch (e: any) {
			error = contributionErrorCopy(e, 'Could not start the payment.');
			busy = false;
		}
	}
</script>

<Seo {seo} />

<div class="min-h-screen py-8" style="background-color: {themeColor.bg};">
	<div class="mx-auto max-w-lg px-4">
		{#if loading}
			<div class="h-96 animate-pulse rounded-2xl" style="background-color: {themeColor.cover};"></div>
		{:else if notFound || !link}
			<div class="rounded-2xl px-6 py-16 text-center" style="background-color: {themeColor.cover};">
				<Icon icon="mdi:gift-off-outline" class="mb-3 text-5xl" style="color: {themeColor.lightText};" />
				<p class="text-lg font-semibold" style="color: {themeColor.text};">Link not found</p>
				<p class="mt-1 text-sm" style="color: {themeColor.lightText};">
					This gift link may have been removed.
				</p>
				<a
					href="/gift"
					class="mt-5 inline-block rounded-lg px-5 py-2.5 text-sm font-medium no-underline"
					style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
				>
					Create your own
				</a>
			</div>
		{:else}
			<!-- Header -->
			<div class="overflow-hidden rounded-2xl" style="background-color: {themeColor.cover};">
				<!--
					The cover the owner uploaded, and the same artwork the share
					card carries. `coverFailed` falls back to the occasion emoji
					rather than leaving a browser's broken-image glyph on a page
					someone is about to be asked for money on — an image can go
					missing (a stale URL, an S3 hiccup) and this page has no way
					to know until the request fails.
				-->
				{#if link.coverImageUrl && !coverFailed}
					<img
						src={link.coverImageUrl}
						alt={link.title}
						width="1200"
						height="630"
						decoding="async"
						on:error={() => (coverFailed = true)}
						class="h-44 w-full object-cover"
					/>
				{:else}
					<div
						class="flex h-44 w-full items-center justify-center text-6xl"
						style="background-color: {themeColor.smallCover};"
					>
						{occasionMeta.emoji}
					</div>
				{/if}

				<div class="p-5">
					<p class="text-xs font-medium uppercase tracking-wide" style="color: {themeColor.lightText};">
						{occasionMeta.label}
					</p>
					<h1 class="mt-1 text-2xl font-bold" style="color: {themeColor.text};">{link.title}</h1>
					<p class="mt-1 text-sm" style="color: {themeColor.lightText};">
						for {link.ownerName}
					</p>

					{#if link.message}
						<p class="mt-3 text-sm leading-relaxed" style="color: {themeColor.lightText};">
							{link.message}
						</p>
					{/if}

					{#if link.targetAmountKobo}
						<div class="mt-4">
							<div class="mb-1.5 flex items-baseline justify-between text-sm">
								<span class="font-semibold" style="color: {themeColor.text};">
									{formatMoney(link.raisedAmountKobo, link.currency)}
								</span>
								<span style="color: {themeColor.lightText};">
									of {formatMoney(link.targetAmountKobo, link.currency)}
								</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full" style="background-color: {themeColor.smallCover};">
								<div
									class="h-full rounded-full transition-all"
									style="width: {progressPct}%; background-color: {themeColor.button};"
								></div>
							</div>
						</div>
					{:else if link.contributionCount > 0}
						<p class="mt-3 text-sm" style="color: {themeColor.lightText};">
							{link.contributionCount}
							{link.contributionCount === 1 ? 'person has' : 'people have'} already sent something 💛
						</p>
					{/if}
				</div>
			</div>

			{#if !link.acceptingGifts}
				<div class="mt-5 rounded-2xl p-5 text-center" style="background-color: {themeColor.cover};">
					<p class="text-sm font-medium" style="color: {themeColor.text};">
						This link is no longer accepting gifts
					</p>
					<p class="mt-1 text-xs" style="color: {themeColor.lightText};">
						Thank you to everyone who gave.
					</p>
				</div>
			{:else if done}
				<div class="mt-5 rounded-2xl p-6 text-center" style="background-color: {themeColor.cover};">
					<div class="mb-3 text-4xl">🎉</div>
					<p class="text-lg font-semibold" style="color: {themeColor.text};">Thank you!</p>
					<p class="mt-1 text-sm" style="color: {themeColor.lightText};">
						Your gift is on its way to {link.ownerName}. Check your email for the receipt.
					</p>
					<button
						on:click={() => {
							done = false;
							amountMajor = null;
							note = '';
						}}
						class="mt-4 rounded-lg px-4 py-2 text-sm font-medium"
						style="background-color: {themeColor.smallCover}; color: {themeColor.text};"
					>
						Send another
					</button>
					<a
						href="/gift"
						class="mt-2 block text-xs underline"
						style="color: {themeColor.lightText};"
					>
						Create your own gift link
					</a>
				</div>
			{:else}
				<!-- Gift form -->
				<div class="mt-5 rounded-2xl p-5" style="background-color: {themeColor.cover};">
					<h2 class="mb-4 text-base font-semibold" style="color: {themeColor.text};">
						Send a gift
					</h2>

					{#if error}
						<div class="mb-3 rounded-xl p-3 text-sm" style="background-color: #fef2f2; color: #991b1b;">
							{error}
						</div>
					{/if}

					{#if link.suggestedAmountsKobo?.length}
						<div class="mb-3 grid grid-cols-3 gap-2">
							{#each link.suggestedAmountsKobo as amt}
								{@const selected = majorToKobo(amountMajor ?? 0, link.currency) === amt}
								<button
									type="button"
									on:click={() => pickAmount(amt)}
									class="rounded-lg border-2 py-3 text-sm font-medium transition-all"
									style="border-color: {selected ? themeColor.button : themeColor.toggle}; background-color: {selected ? themeColor.button : themeColor.bg}; color: {selected ? themeColor.buttonText : themeColor.text};"
								>
									{formatMoney(amt, link.currency, { minimumFractionDigits: 0 })}
								</button>
							{/each}
						</div>
					{/if}

					<div class="space-y-3">
						<div>
							<label class="text-sm" style="color: {themeColor.lightText};" for="gl-amt">
								Amount ({link.currency})
							</label>
							<input
								id="gl-amt"
								type="number"
								min="0"
								inputmode="decimal"
								bind:value={amountMajor}
								placeholder={String(Math.round(link.minKobo / 100))}
								class="mt-1.5 w-full rounded-[9px] border px-4 py-3 text-sm focus:outline-none"
								style="background-color: {themeColor.bg}; border-color: {themeColor.toggle}; color: {themeColor.text};"
							/>
							<p class="mt-1 text-xs" style="color: {themeColor.lightText};">
								Minimum {formatMoney(link.minKobo, link.currency, { minimumFractionDigits: 0 })}
							</p>
						</div>

						<div>
							<label class="text-sm" style="color: {themeColor.lightText};" for="gl-name">Your name</label>
							<input
								id="gl-name"
								bind:value={name}
								placeholder="So they know who to thank"
								class="mt-1.5 w-full rounded-[9px] border px-4 py-3 text-sm focus:outline-none"
								style="background-color: {themeColor.bg}; border-color: {themeColor.toggle}; color: {themeColor.text};"
							/>
						</div>

						<div>
							<label class="text-sm" style="color: {themeColor.lightText};" for="gl-email">Email *</label>
							<input
								id="gl-email"
								type="email"
								bind:value={email}
								placeholder="For your receipt"
								class="mt-1.5 w-full rounded-[9px] border px-4 py-3 text-sm focus:outline-none"
								style="background-color: {themeColor.bg}; border-color: {themeColor.toggle}; color: {themeColor.text};"
							/>
						</div>

						<div>
							<label class="text-sm" style="color: {themeColor.lightText};" for="gl-note">
								Say something (optional)
							</label>
							<textarea
								id="gl-note"
								rows="2"
								maxlength="500"
								bind:value={note}
								placeholder="Happy birthday! 🎉"
								class="mt-1.5 w-full resize-none rounded-[9px] border px-4 py-3 text-sm focus:outline-none"
								style="background-color: {themeColor.bg}; border-color: {themeColor.toggle}; color: {themeColor.text};"
							></textarea>
						</div>

						{#if link.allowAnonymous}
							<label class="flex items-start gap-3 rounded-lg px-3 py-2.5" style="background-color: {themeColor.bg};">
								<input
									type="checkbox"
									bind:checked={anonymous}
									class="mt-0.5 h-5 w-5 rounded"
									style="accent-color: {themeColor.button};"
								/>
								<span class="text-sm" style="color: {themeColor.text};">
									Hide my name publicly
									<span class="mt-0.5 block text-xs" style="color: {themeColor.lightText};">
										{link.ownerName} still sees it, so they can thank you.
									</span>
								</span>
							</label>
						{/if}
					</div>

					<button
						on:click={submit}
						disabled={busy}
						class="mt-5 w-full rounded-lg py-3 text-base font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
						style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
					>
						{busy
							? 'Opening payment…'
							: amountMajor
								? `Send ${formatMoney(majorToKobo(amountMajor, link.currency), link.currency, { minimumFractionDigits: 0 })}`
								: 'Send a gift'}
					</button>

					<p class="mt-3 text-center text-xs" style="color: {themeColor.lightText};">
						Secured by Paystack. No Rondwell account needed.
					</p>
				</div>
			{/if}

			{#if link.showContributorWall && wall.length > 0}
				<div class="mt-5 rounded-2xl p-5" style="background-color: {themeColor.cover};">
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

			{#if link.wishlistId}
				<a
					href={`/w/${link.wishlistId}`}
					class="mt-5 flex items-center justify-between rounded-2xl p-5 no-underline"
					style="background-color: {themeColor.cover};"
				>
					<div>
						<p class="text-sm font-semibold" style="color: {themeColor.text};">
							Prefer to send a gift?
						</p>
						<p class="text-xs" style="color: {themeColor.lightText};">
							{link.ownerName} has a registry too.
						</p>
					</div>
					<Icon icon="mdi:arrow-right" class="text-xl" style="color: {themeColor.button};" />
				</a>
			{/if}

			<p class="mt-6 text-center text-xs" style="color: {themeColor.lightText};">
				<a href="/gift" class="underline" style="color: {themeColor.lightText};">
					Create your own gift link on Rondwell
				</a>
			</p>
		{/if}
	</div>
</div>
