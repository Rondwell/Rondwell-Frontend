<script lang="ts">
	/**
	 * GAP 9 — "Become a promoter" on the public event page.
	 *
	 * Three states in one card, because they are the same story at different
	 * stages and splitting them would put a dead "apply" button in front of
	 * someone who already has a link:
	 *
	 *   1. Not applied  → pitch + apply.
	 *   2. Pending      → "we'll let you know", no link yet.
	 *   3. Approved     → the referral link, share buttons and live stats.
	 *
	 * A REJECTED or SUSPENDED promoter is shown a plain status, never the
	 * link — the whole point of suspending someone is that their link stops
	 * being handed to them.
	 */
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { isAuthenticated } from '$lib/stores/auth.store';
	import { formatMoney } from '$lib/utils/money';
	import type { Color } from '$lib/utils/colors';
	import {
		applyToPromote,
		bpsToPercentLabel,
		getMyPromoterRecord,
		type Promoter
	} from '$lib/services/promoter.services';

	export let eventId = '';
	export let eventTitle = '';
	export let themeColor: Color;
	/** `features.promoter` from the public page payload. */
	export let promoter: { enabled: boolean; defaultCommissionPercent: number; terms: string } | null =
		null;
	export let eventSlug = '';

	let record: Promoter | null = null;
	let loading = true;
	let applying = false;
	let error = '';
	let copied = false;

	let showApply = false;
	let pitch = '';
	let acceptedTerms = false;

	$: enabled = promoter?.enabled === true;
	$: rate = bpsToPercentLabel(promoter?.defaultCommissionPercent ?? 1000);
	$: shareUrl = record
		? `${location.origin}${eventSlug ? `/e/${eventSlug}` : `/event-page/${eventId}`}?ref=${record.refCode}`
		: '';
	$: shareText = `Come to ${eventTitle || 'this event'} 🎉`;

	async function load() {
		if (!enabled || !$isAuthenticated || !eventId) {
			loading = false;
			return;
		}
		loading = true;
		const res = await getMyPromoterRecord(eventId);
		record = res.promoter;
		loading = false;
	}

	onMount(load);

	async function submit() {
		if (promoter?.terms && !acceptedTerms) {
			error = 'Please accept the terms first';
			return;
		}
		applying = true;
		error = '';
		try {
			record = await applyToPromote(eventId, pitch.trim() || undefined);
			showApply = false;
			pitch = '';
		} catch (e: any) {
			error = e?.message ?? 'Could not submit your application';
		} finally {
			applying = false;
		}
	}

	async function copy() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			error = 'Could not copy the link';
		}
	}
</script>

{#if enabled && !loading}
	<div class="mt-6 rounded-[16px] p-4" style="background-color: {themeColor.cover};">
		{#if !$isAuthenticated}
			<h3 class="mb-1 text-sm font-medium" style="color: {themeColor.text};">
				Earn {rate} promoting this event
			</h3>
			<p class="mb-3 text-xs leading-relaxed" style="color: {themeColor.lightText};">
				Share your own link and earn on every ticket sold through it.
			</p>
			<!-- `/login` does not exist (the only one is `/hq/login`, the admin
			     console), so this was a 404 for every signed-out visitor who wanted
			     to promote an event — the first step of the whole promoter funnel.
			     The app's sign-in route is `/auth` and the destination param is
			     `returnUrl`, matching `hooks.server.ts` and `api.client.ts`. -->
			<a
				href="/auth?returnUrl={encodeURIComponent(`/event-page/${eventId}`)}"
				class="inline-flex rounded-full px-4 py-2 text-sm font-medium no-underline transition-opacity hover:opacity-90"
				style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
			>
				Sign in to apply
			</a>
		{:else if !record}
			<h3 class="mb-1 flex items-center gap-1.5 text-sm font-medium" style="color: {themeColor.text};">
				<Icon icon="mdi:bullhorn-outline" class="h-4 w-4" />
				Become a promoter
			</h3>
			<p class="mb-3 text-xs leading-relaxed" style="color: {themeColor.lightText};">
				Get your own link and earn <span class="font-semibold">{rate}</span> of every ticket sold
				through it. Paid to your wallet once the refund window closes.
			</p>

			{#if showApply}
				<textarea
					bind:value={pitch}
					rows="3"
					maxlength="1000"
					placeholder="How will you promote it? (optional)"
					class="mb-2 w-full rounded-xl border-0 p-2.5 text-sm focus:outline-none focus:ring-2"
					style="background-color: {themeColor.smallCover}; color: {themeColor.text};"
				></textarea>

				{#if promoter?.terms}
					<div
						class="mb-2 max-h-24 overflow-y-auto rounded-xl p-2.5 text-[11px] leading-relaxed"
						style="background-color: {themeColor.smallCover}; color: {themeColor.lightText};"
					>
						{promoter.terms}
					</div>
					<label class="mb-3 flex items-start gap-2 text-xs" style="color: {themeColor.lightText};">
						<input type="checkbox" bind:checked={acceptedTerms} class="mt-0.5 h-3.5 w-3.5" />
						<span>I accept the promoter terms</span>
					</label>
				{/if}

				<div class="flex gap-2">
					<button
						on:click={submit}
						disabled={applying}
						class="flex-1 rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
						style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
					>
						{applying ? 'Sending…' : 'Apply'}
					</button>
					<button
						on:click={() => (showApply = false)}
						class="rounded-full px-3 py-2 text-sm transition-opacity hover:opacity-80"
						style="background-color: {themeColor.smallCover}; color: {themeColor.text};"
					>
						Cancel
					</button>
				</div>
			{:else}
				<button
					on:click={() => (showApply = true)}
					class="inline-flex rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
					style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
				>
					Apply to promote
				</button>
			{/if}
		{:else if record.status === 'PENDING'}
			<h3 class="mb-1 flex items-center gap-1.5 text-sm font-medium" style="color: {themeColor.text};">
				<Icon icon="mdi:clock-outline" class="h-4 w-4" />
				Application sent
			</h3>
			<p class="text-xs leading-relaxed" style="color: {themeColor.lightText};">
				The host is reviewing it. You'll get an email with your link as soon as you're approved.
			</p>
		{:else if record.status === 'APPROVED'}
			<h3 class="mb-1 flex items-center gap-1.5 text-sm font-medium" style="color: {themeColor.text};">
				<Icon icon="mdi:check-decagram-outline" class="h-4 w-4" />
				You're promoting this event
			</h3>
			<p class="mb-3 text-xs" style="color: {themeColor.lightText};">
				Earning {bpsToPercentLabel(record.commissionPercent)} of every ticket sold through your link.
			</p>

			<div
				class="mb-2 flex items-center gap-2 rounded-xl p-2"
				style="background-color: {themeColor.smallCover};"
			>
				<span class="flex-1 truncate text-[11px]" style="color: {themeColor.text};">{shareUrl}</span>
				<button
					on:click={copy}
					class="flex-shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium transition-opacity hover:opacity-90"
					style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
				>
					{copied ? 'Copied' : 'Copy'}
				</button>
			</div>

			<div class="mb-3 flex gap-2">
				<a
					href="https://wa.me/?text={encodeURIComponent(`${shareText} ${shareUrl}`)}"
					target="_blank"
					rel="noopener noreferrer"
					class="flex flex-1 items-center justify-center gap-1 rounded-full py-1.5 text-[11px] font-medium no-underline transition-opacity hover:opacity-80"
					style="background-color: {themeColor.smallCover}; color: {themeColor.text};"
				>
					<Icon icon="mdi:whatsapp" class="h-3.5 w-3.5" />
					WhatsApp
				</a>
				<a
					href="https://twitter.com/intent/tweet?text={encodeURIComponent(shareText)}&url={encodeURIComponent(shareUrl)}"
					target="_blank"
					rel="noopener noreferrer"
					class="flex flex-1 items-center justify-center gap-1 rounded-full py-1.5 text-[11px] font-medium no-underline transition-opacity hover:opacity-80"
					style="background-color: {themeColor.smallCover}; color: {themeColor.text};"
				>
					<Icon icon="mdi:twitter" class="h-3.5 w-3.5" />
					X
				</a>
				<button
					on:click={copy}
					class="flex flex-1 items-center justify-center gap-1 rounded-full py-1.5 text-[11px] font-medium transition-opacity hover:opacity-80"
					style="background-color: {themeColor.smallCover}; color: {themeColor.text};"
				>
					<Icon icon="mdi:instagram" class="h-3.5 w-3.5" />
					Bio link
				</button>
			</div>

			<div class="grid grid-cols-3 gap-2 text-center">
				<div class="rounded-xl p-2" style="background-color: {themeColor.smallCover};">
					<p class="text-sm font-semibold" style="color: {themeColor.text};">
						{record.totals?.clicks ?? 0}
					</p>
					<p class="text-[10px]" style="color: {themeColor.lightText};">Clicks</p>
				</div>
				<div class="rounded-xl p-2" style="background-color: {themeColor.smallCover};">
					<p class="text-sm font-semibold" style="color: {themeColor.text};">
						{record.totals?.ticketsSold ?? 0}
					</p>
					<p class="text-[10px]" style="color: {themeColor.lightText};">Sold</p>
				</div>
				<div class="rounded-xl p-2" style="background-color: {themeColor.smallCover};">
					<p class="text-sm font-semibold" style="color: {themeColor.text};">
						{formatMoney(record.totals?.commissionEarnedKobo ?? 0, 'NGN')}
					</p>
					<p class="text-[10px]" style="color: {themeColor.lightText};">Earned</p>
				</div>
			</div>

			<a
				href="/promotions"
				class="mt-3 block text-center text-[11px] no-underline hover:underline"
				style="color: {themeColor.lightText};"
			>
				See all my promotions →
			</a>
		{:else}
			<!-- REJECTED / SUSPENDED: status only. Never the link. -->
			<h3 class="mb-1 text-sm font-medium" style="color: {themeColor.text};">
				{record.status === 'SUSPENDED' ? 'Promotion paused' : 'Application not accepted'}
			</h3>
			<p class="text-xs leading-relaxed" style="color: {themeColor.lightText};">
				{record.status === 'SUSPENDED'
					? 'The host has paused your promoter access for this event.'
					: 'The host is not taking more promoters for this event right now.'}
			</p>
		{/if}

		{#if error}
			<p class="mt-2 text-xs text-[#D92D20]">{error}</p>
		{/if}
	</div>
{/if}
