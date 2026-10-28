<script lang="ts">
	/**
	 * The virtual-event location block: platform, countdown, and the Join action.
	 *
	 * ── What this replaces ──────────────────────────────────────────────────
	 *
	 * Two lines of static text on the public event page that printed the platform
	 * name and nothing else:
	 *
	 *     <div>{event.locationDetails?.virtual?.platform ?? 'Virtual Event'}</div>
	 *
	 * The meeting link was never rendered, and the API blanks it on the public
	 * payload anyway — so a registered attendee of a virtual event had no way at
	 * all to reach the join link from the page they were sent to. This component
	 * is the attendee-facing half of that: it asks `/join-details`, which returns
	 * the URL only to a viewer entitled to it.
	 *
	 * ── The five states, and why each one is distinct ───────────────────────
	 *
	 * Hiding the link is easy; explaining *why* is what stops support tickets. So
	 * the card never just shows nothing:
	 *
	 *   1. `not-registered`  → "Register to get the link." The ask, not a blank.
	 *   2. `locked`          → "Opens 60 minutes before." With a live countdown,
	 *                          so the attendee knows it will appear and when.
	 *   3. `ready`           → The Join button, prominent.
	 *   4. `live`            → Same button with a pulsing dot, matching the
	 *                          treatment already used in the organizer Agenda.
	 *   5. `ended`           → Honest, and the button is gone.
	 *
	 * ── Theming ─────────────────────────────────────────────────────────────
	 *
	 * Every colour comes from the event's resolved theme tokens, like the rest of
	 * the page. The vendor's brand colour appears only on the small platform
	 * glyph — the Join button takes the organizer's `button` colour, so a Zoom
	 * event does not grow a blue CTA in the middle of a themed page.
	 */
	import Icon from '@iconify/svelte';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { getJoinDetails, type JoinDetails } from '$lib/services/calendar.services';
	import { resolvePlatform, platformDisplayName } from '$lib/utils/meetingPlatform';
	import { safeHref } from '$lib/security/safeUrl';
	import { toast } from '$lib/stores/toast.store';
	import AddToCalendarMenu from './AddToCalendarMenu.svelte';

	export let eventId: string;
	export let eventTitle = 'Event';
	/** Start/end from the already-loaded event, so the card renders before the fetch lands. */
	export let startDateTime: string;
	export let endDateTime: string;
	/** The event's own virtual block from the public payload (platform name only). */
	export let virtual: { platform?: string | null; platformKey?: string | null } | null = null;
	export let themeColor: {
		cover: string;
		smallCover: string;
		toggle: string;
		text: string;
		lightText: string;
		button: string;
		buttonText: string;
	};
	/** `HYBRID` renders a slimmer card, since a venue block sits beside it. */
	export let compact = false;
	export let showAddToCalendar = true;

	let details: JoinDetails | null = null;
	let loaded = false;
	let now = Date.now();
	let ticker: ReturnType<typeof setInterval> | null = null;

	/** The virtual block the server returned, falling back to the page's copy. */
	$: effectiveVirtual = details?.virtual ?? virtual;
	$: brand = resolvePlatform(effectiveVirtual as any);
	$: displayName = platformDisplayName(effectiveVirtual as any);

	$: startMs = startDateTime ? new Date(startDateTime).getTime() : NaN;
	$: endMs = endDateTime ? new Date(endDateTime).getTime() : NaN;

	$: hasEnded =
		details?.eventStatus === 'ENDED' ||
		details?.eventStatus === 'CANCELLED' ||
		(Number.isFinite(endMs) && now > endMs);
	$: isLive = !hasEnded && Number.isFinite(startMs) && now >= startMs;

	/**
	 * The URL, present only when the server decided this viewer may have it.
	 *
	 * Run through `safeHref` even though the backend already normalised it: this
	 * value lands in an `href`, Svelte interpolates URL attributes verbatim, and
	 * a legacy row written before the backend validated links could still hold a
	 * hostile scheme. `safeHref` returns `undefined` for anything that is not
	 * http(s), which collapses to the not-registered state rather than rendering
	 * a dangerous link.
	 */
	$: joinUrl = details?.virtual?.meetingLink
		? (safeHref(details.virtual.meetingLink) ?? null)
		: null;
	$: access = details?.virtual?.access ?? null;

	type State = 'loading' | 'ready' | 'live' | 'locked' | 'not-registered' | 'ended';
	$: state = ((): State => {
		if (hasEnded) return 'ended';
		if (!loaded) return 'loading';
		if (joinUrl) return isLive ? 'live' : 'ready';
		if (access?.reason === 'NOT_YET') return 'locked';
		return 'not-registered';
	})();

	/**
	 * The countdown, in whole units.
	 *
	 * Deliberately coarse above an hour — "in 3 days" is more useful than a
	 * second-by-second readout of 72 hours, and it means the 1s interval below
	 * only matters in the final minute.
	 */
	function humanCountdown(target: number): string {
		const ms = target - now;
		if (ms <= 0) return 'now';
		const seconds = Math.floor(ms / 1000);
		const days = Math.floor(seconds / 86400);
		if (days >= 1) return `in ${days} day${days === 1 ? '' : 's'}`;
		const hours = Math.floor(seconds / 3600);
		if (hours >= 1) return `in ${hours} hour${hours === 1 ? '' : 's'}`;
		const minutes = Math.floor(seconds / 60);
		if (minutes >= 1) return `in ${minutes} minute${minutes === 1 ? '' : 's'}`;
		return `in ${seconds}s`;
	}

	$: opensAtMs = access?.opensAt ? new Date(access.opensAt).getTime() : NaN;

	async function load() {
		details = await getJoinDetails(eventId);
		loaded = true;
	}

	onMount(() => {
		void load();

		/**
		 * One second, and it earns it.
		 *
		 * The card has to flip from `locked` to `ready` at the reveal moment and
		 * from `ready` to `live` at the start — without a reload, because an
		 * attendee sitting on the page waiting for a link is the single most
		 * likely visitor to a virtual event page in the minutes before it opens.
		 * `$: state` is derived from `now`, so advancing it re-evaluates
		 * everything.
		 */
		ticker = setInterval(() => {
			now = Date.now();
		}, 1000);
	});

	/**
	 * Re-ask the server when the reveal moment passes.
	 *
	 * The clock alone cannot produce the link — the URL is only ever sent by the
	 * API — so crossing `opensAt` has to trigger one more fetch. Guarded so it
	 * fires once rather than every tick.
	 */
	let refetchedAtReveal = false;
	$: if (
		loaded &&
		!refetchedAtReveal &&
		access?.reason === 'NOT_YET' &&
		Number.isFinite(opensAtMs) &&
		now >= opensAtMs
	) {
		refetchedAtReveal = true;
		void load();
	}

	onDestroy(() => {
		if (ticker) clearInterval(ticker);
	});

	async function copyLink() {
		if (!joinUrl || !browser) return;
		try {
			await navigator.clipboard.writeText(joinUrl);
			toast.success('Meeting link copied.');
		} catch {
			toast.error('Could not copy the link.');
		}
	}

	async function copyPasscode() {
		const code = details?.virtual?.passcode;
		if (!code || !browser) return;
		try {
			await navigator.clipboard.writeText(code);
			toast.success('Passcode copied.');
		} catch {
			toast.error('Could not copy the passcode.');
		}
	}
</script>

<div
	class="overflow-hidden rounded-2xl border transition-shadow duration-300"
	style="background-color:{themeColor.cover};border-color:{themeColor.toggle};"
>
	<!-- Header: platform identity + status -->
	<div class="flex items-center gap-3 px-4 {compact ? 'pb-2 pt-3' : 'pb-3 pt-4'}">
		<div
			class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
			style="background-color:{themeColor.smallCover};border-color:{themeColor.toggle};"
		>
			<!-- Vendor glyph at 22px. The only place a brand colour appears. -->
			<Icon icon={brand.icon} class="text-[22px]" style="color:{brand.brandColor};" />
		</div>

		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-2">
				<span class="truncate text-base font-semibold" style="color:{themeColor.text};">
					{displayName}
				</span>

				{#if state === 'live'}
					<span
						class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-0.5
						       text-[10px] font-bold uppercase tracking-wide text-red-600"
					>
						<span class="relative flex h-1.5 w-1.5">
							<span
								class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"
							></span>
							<span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500"></span>
						</span>
						Live
					</span>
				{/if}
			</div>

			<div class="mt-0.5 text-xs" style="color:{themeColor.lightText};">
				{#if state === 'ended'}
					This event has ended
				{:else if state === 'live'}
					Happening now — join any time
				{:else if state === 'ready'}
					Ready to join · starts {humanCountdown(startMs)}
				{:else if state === 'locked'}
					Link opens {humanCountdown(opensAtMs)}
				{:else if state === 'not-registered'}
					Online event · starts {humanCountdown(startMs)}
				{:else}
					Online event
				{/if}
			</div>
		</div>
	</div>

	<!-- Action area -->
	<div class="px-4 {compact ? 'pb-3' : 'pb-4'}">
		{#if state === 'loading'}
			<div
				class="h-11 w-full animate-pulse rounded-xl"
				style="background-color:{themeColor.smallCover};"
			></div>
		{:else if state === 'ended'}
			<div
				class="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
				style="background-color:{themeColor.smallCover};color:{themeColor.lightText};"
			>
				<Icon icon="mdi:calendar-check-outline" class="shrink-0 text-[16px]" />
				<span>The meeting room is closed.</span>
			</div>
		{:else if joinUrl}
			<!-- The primary action. Themed, not vendor-coloured. -->
			<a
				href={joinUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="group flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold
				       shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98]"
				style="background-color:{themeColor.button};color:{themeColor.buttonText};"
			>
				<Icon icon="mdi:video" class="text-[18px]" />
				<span>{state === 'live' ? 'Join now' : brand.joinLabel}</span>
				<Icon
					icon="mdi:arrow-top-right"
					class="text-[15px] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
				/>
			</a>

			<!-- Meeting credentials, when the organizer supplied them -->
			{#if details?.virtual?.meetingId || details?.virtual?.passcode}
				<div class="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
					{#if details?.virtual?.meetingId}
						<span
							class="rounded-lg px-2 py-1 font-mono"
							style="background-color:{themeColor.smallCover};color:{themeColor.lightText};"
						>
							ID {details.virtual.meetingId}
						</span>
					{/if}
					{#if details?.virtual?.passcode}
						<button
							type="button"
							on:click={copyPasscode}
							class="flex items-center gap-1 rounded-lg px-2 py-1 font-mono transition-opacity hover:opacity-70"
							style="background-color:{themeColor.smallCover};color:{themeColor.lightText};"
						>
							<Icon icon="mdi:key-outline" class="text-[13px]" />
							{details.virtual.passcode}
						</button>
					{/if}
				</div>
			{/if}

			<!-- Secondary actions -->
			<div class="mt-2.5 flex items-center gap-2">
				<button
					type="button"
					on:click={copyLink}
					class="flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium
					       transition-colors hover:opacity-80"
					style="background-color:{themeColor.smallCover};border-color:{themeColor.toggle};color:{themeColor.text};"
				>
					<Icon icon="mdi:link-variant" class="text-[15px]" />
					Copy link
				</button>

				{#if showAddToCalendar}
					<AddToCalendarMenu
						{eventId}
						{eventTitle}
						{themeColor}
						variant="ghost"
						label="Calendar"
					/>
				{/if}
			</div>

			{#if details?.virtual?.dialInNumbers?.length}
				<div class="mt-2.5 text-[11px]" style="color:{themeColor.lightText};">
					<span class="font-medium">Dial in:</span>
					{details.virtual.dialInNumbers.join(' · ')}
				</div>
			{/if}
		{:else if state === 'locked'}
			<!--
				Withheld, but explained. The countdown is what turns "where is my
				link?" into "it appears at 6pm", which is the difference between a
				support ticket and none.
			-->
			<div
				class="flex items-start gap-2.5 rounded-xl border border-dashed px-3 py-3"
				style="border-color:{themeColor.toggle};background-color:{themeColor.smallCover};"
			>
				<Icon
					icon="mdi:lock-clock"
					class="mt-0.5 shrink-0 text-[18px]"
					style="color:{themeColor.lightText};"
				/>
				<div class="min-w-0 flex-1">
					<div class="text-sm font-medium" style="color:{themeColor.text};">
						Your join link unlocks {humanCountdown(opensAtMs)}
					</div>
					<div class="mt-0.5 text-xs" style="color:{themeColor.lightText};">
						You're registered — the link appears here automatically. Add the event to your
						calendar so you don't miss it.
					</div>
				</div>
			</div>

			{#if showAddToCalendar}
				<div class="mt-2.5">
					<AddToCalendarMenu
						{eventId}
						{eventTitle}
						{themeColor}
						variant="solid"
						fullWidth
					/>
				</div>
			{/if}
		{:else}
			<!-- Not registered: the ask. -->
			<div
				class="flex items-start gap-2.5 rounded-xl border border-dashed px-3 py-3"
				style="border-color:{themeColor.toggle};background-color:{themeColor.smallCover};"
			>
				<Icon
					icon="mdi:ticket-confirmation-outline"
					class="mt-0.5 shrink-0 text-[18px]"
					style="color:{themeColor.lightText};"
				/>
				<div class="min-w-0 flex-1">
					<div class="text-sm font-medium" style="color:{themeColor.text};">
						Register to get the join link
					</div>
					<div class="mt-0.5 text-xs" style="color:{themeColor.lightText};">
						The {displayName} link is shared with registered attendees only.
					</div>
				</div>
			</div>

			{#if showAddToCalendar}
				<div class="mt-2.5">
					<AddToCalendarMenu {eventId} {eventTitle} {themeColor} variant="ghost" fullWidth />
				</div>
			{/if}
		{/if}
	</div>
</div>
