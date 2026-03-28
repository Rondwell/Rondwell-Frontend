<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getPublicEventPage } from '$lib/services/event.services';
	import { isAuthenticated } from '$lib/stores/auth.store';
	import { getEventTheme, setEventTheme } from '$lib/stores/eventTheme';
	import type { Color } from '$lib/utils/colors';
	import { colors } from '$lib/utils/colors';
	import { onMount } from 'svelte';
	import RegistrationModal from '../components/modal/RegistrationModal.svelte';
	import OrganiserList from '../components/OrganiserList.svelte';

	export let data: any = {};
	$: seo = data?.seo;

	$: eventId = $page.params.id ?? '';

	let selectedTicket = '';
	let showAddModal = false;
	let loading = true;
	let error = '';

	// Data from API
	let event: any = null;
	let ticketTypes: any[] = [];
	let organizers: any[] = [];
	let attendeeCount = 0;
	let attendingSample: any[] = [];
	let collectionInfo: any = null;
	let registrationFields: any[] = [];
	let organizerProfile: any = null;
	let paymentSuccess = false;
	let paymentFailed = false;
	let paymentRegId = '';

	let themeColor: Color = colors[0];
	$: if (eventId) themeColor = getEventTheme(eventId);

	onMount(async () => {
		if (!eventId) return;
		try {
			const data = await getPublicEventPage(eventId);
			event = data.event;
			ticketTypes = data.ticketTypes;
			organizers = data.organizers;
			attendeeCount = data.attendeeCount;
			attendingSample = data.attendingSample;
			collectionInfo = data.collection;
			registrationFields = data.registrationFields ?? [];
			organizerProfile = data.organizerProfile ?? null;

			// Auto-select first available ticket
			if (ticketTypes.length > 0) {
				const available = ticketTypes.find((t: any) => isTicketAvailable(t));
				selectedTicket = available?._id ?? ticketTypes[0]._id;
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
				}
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

		// Handle payment callback
		const params = new URLSearchParams(window.location.search);
		const paymentStatus = params.get('payment');
		const regId = params.get('reg');
		if (paymentStatus === 'success' && regId) {
			// Finalize the registration after successful payment
			const EVENT_URL = import.meta.env.VITE_EVENT_API_URL;
			try {
				await fetch(`${EVENT_URL}/api/v1/events/${eventId}/registrations/finalize/${regId}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
				});
			} catch { /* finalization may already be handled by webhook */ }
			paymentSuccess = true;
			paymentRegId = regId;
			// Clean URL
			window.history.replaceState({}, '', window.location.pathname);
		} else if (paymentStatus === 'failed') {
			paymentFailed = true;
			window.history.replaceState({}, '', window.location.pathname);
		}
	});

	// Helpers
	function formatEventDate(dt: string): string {
		if (!dt) return 'Date TBD';
		const d = new Date(dt);
		return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
	}

	function formatEventTime(start: string, end: string, tz: string): string {
		if (!start) return '';
		const s = new Date(start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
		const e = end ? new Date(end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
		const tzLabel = tz ? ` ${tz}` : '';
		return e ? `${s} - ${e}${tzLabel}` : `${s}${tzLabel}`;
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
		const now = new Date();
		if (ticket.salesEndDate && new Date(ticket.salesEndDate) < now) return false;
		if (ticket.salesStartDate && new Date(ticket.salesStartDate) > now) return false;
		return true;
	}

	function formatTicketPrice(ticket: any): string {
		if (ticket.isFree || !ticket.price || ticket.price === 0) return 'Free';
		const currency = ticket.currency ?? 'NGN';
		return new Intl.NumberFormat('en-NG', { style: 'currency', currency, minimumFractionDigits: 0 }).format(ticket.price);
	}

	function getTicketSalesEndLabel(ticket: any): string {
		if (!ticket.salesEndDate) return '';
		const d = new Date(ticket.salesEndDate);
		if (d < new Date()) {
			return `Sales ended ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
		}
		return '';
	}

	function getRegisterButtonLabel(): string {
		const ticket = ticketTypes.find(t => t._id === selectedTicket);
		if (!ticket) return 'Register';
		if (ticket.requiresApproval) return 'Request to Get In';
		if (ticket.isFree || !ticket.price) return 'Register';
		return `Register — ${formatTicketPrice(ticket)}`;
	}

	$: attendingNames = attendingSample.map(g => [g.firstName, g.lastName].filter(Boolean).join(' ') || 'Guest').join(', ');
	$: remainingCount = Math.max(0, attendeeCount - attendingSample.length);

	$: organizerEmail = event?.socialLinks?.website
		? event.socialLinks.website
		: (organizers.length > 0 ? organizers[0].email : '');
</script>

<!-- SEO Meta Tags (server-rendered) -->
<svelte:head>
	{#if seo}
		<title>{seo.title}</title>
		<meta name="description" content={seo.description} />

		<!-- Open Graph (Facebook, WhatsApp, Telegram, LinkedIn) -->
		<meta property="og:title" content={seo.title} />
		<meta property="og:description" content={seo.description} />
		<meta property="og:image" content={seo.image} />
		<meta property="og:image:secure_url" content={seo.image} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta property="og:image:type" content="image/jpeg" />
		<meta property="og:image:alt" content={seo.title} />
		<meta property="og:url" content={seo.url} />
		<meta property="og:type" content="website" />
		<meta property="og:site_name" content="Rondwell" />
		<meta property="og:locale" content="en_US" />

		<!-- Twitter -->
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content={seo.title} />
		<meta name="twitter:description" content={seo.description} />
		<meta name="twitter:image" content={seo.image} />
		<meta name="twitter:site" content="@rondwell" />

		<link rel="canonical" href={seo.url} />

		{#if seo.event}
			<!-- JSON-LD Structured Data for Events -->
			{@html `<script type="application/ld+json">${JSON.stringify({
				"@context": "https://schema.org",
				"@type": "Event",
				"name": seo.event.name,
				"startDate": seo.event.startDate,
				"endDate": seo.event.endDate,
				"eventAttendanceMode": seo.event.eventType === 'VIRTUAL' ? "https://schema.org/OnlineEventAttendanceMode" : seo.event.eventType === 'HYBRID' ? "https://schema.org/MixedEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
				"location": seo.event.eventType === 'VIRTUAL' ? { "@type": "VirtualLocation", "url": seo.url } : { "@type": "Place", "name": seo.event.location },
				"image": [seo.image],
				"description": seo.description,
				"organizer": { "@type": "Organization", "name": seo.event.organizer, "url": "https://rondwell.com" },
				"offers": { "@type": "Offer", "url": seo.url, "availability": "https://schema.org/InStock" },
				"eventStatus": "https://schema.org/EventScheduled"
			})}</script>`}
		{/if}
	{:else if event}
		<title>{event.title} | Rondwell</title>
		<meta name="description" content={event.description?.replace(/<[^>]*>/g, '').slice(0, 160) || `Join ${event.title} on Rondwell`} />
	{:else}
		<title>Event | Rondwell</title>
	{/if}
</svelte:head>

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
<div class="w-full max-w-6xl animate-pulse">
	<div class="flex flex-col gap-6 py-4 md:flex-row md:gap-9">
		<div class="w-full md:max-w-[378px]">
			<div class="aspect-square w-full rounded-[27px] bg-gray-200 md:size-[378px]"></div>
			<div class="mt-3 h-16 rounded-lg bg-gray-200"></div>
		</div>
		<div class="flex-1 space-y-5">
			<div class="h-40 rounded-2xl bg-gray-200"></div>
			<div class="h-64 rounded-2xl bg-gray-200"></div>
			<div class="h-32 rounded-2xl bg-gray-200"></div>
		</div>
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
				src={event.displayPictureUrl || event.coverPictureUrl || '/eventpage_sample.svg'}
				alt={event.title}
				class="aspect-square w-full rounded-[27px] object-cover md:size-[378px]"
				on:error={(e) => { (e.currentTarget as HTMLImageElement).src = '/eventpage_sample.svg'; }}
			/>

			<!-- Organizer Access Card (only if logged in) -->
			{#if $isAuthenticated}
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
			<div class="hidden md:block {$isAuthenticated ? '' : 'mt-4'}">
				<!-- Presented By -->
				{#if collectionInfo}
				<div class="rounded-2xl p-4" style="background-color: {themeColor.cover};">
					<div class="flex items-center justify-between gap-3">
						<div class="flex gap-3">
							<div class="flex size-9 items-center justify-center rounded-[9px] text-lg" style="background-color: {themeColor.smallCover};">🎪</div>
							<div>
								<p class="text-xs" style="color: {themeColor.lightText};">Presented by</p>
								<a href="/collection/{collectionInfo._id}/events" class="flex items-center gap-1 text-sm font-medium no-underline hover:underline" style="color: {themeColor.text};">
									{collectionInfo.name}
									<svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M3 1l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
								</a>
							</div>
						</div>
						<button
							class="rounded-full px-3.5 py-2 text-sm font-normal transition-colors"
							style="background-color: {themeColor.smallCover}; color: {themeColor.text};"
						>
							Subscribe
						</button>
					</div>
					{#if event.description}
					<p class="mt-3 line-clamp-3 text-sm font-light leading-6" style="color: {themeColor.lightText};">
						{@html event.description.replace(/<[^>]*>/g, '').slice(0, 150)}{event.description.length > 150 ? '...' : ''}
					</p>
					{/if}
				</div>
				{/if}

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
						/>
						<!-- Co-organizers from admins (only those with a name or email) -->
						{#each organizers.filter((a) => a.displayName || a.email) as admin}
							<OrganiserList
								organizerName={admin.displayName ?? admin.email ?? 'Co-organizer'}
								organizerAvatar="/user1-icon.svg"
								organizerSocial={false}
							/>
						{/each}
					</div>

					<!-- Attending -->
					<div class="mt-6">
						<h3 class="mb-4 border-b pb-2 text-sm font-normal" style="color: {themeColor.lightText}; border-color: {themeColor.toggle};">
							{attendeeCount} Attending
						</h3>
						{#if attendeeCount > 0}
						<div class="space-y-2">
							<p class="max-w-[334px] text-sm" style="color: {themeColor.lightText};">
								{attendingNames}{#if remainingCount > 0}, and {remainingCount} others{/if}
							</p>
						</div>
						{:else}
						<p class="text-sm" style="color: {themeColor.lightText};">Be the first to register</p>
						{/if}
					</div>

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
				{#if collectionInfo}
				<div class="mt-2 flex items-center md:hidden">
					<div class="mr-2 size-4 rounded-[4px] border flex items-center justify-center text-[8px]" style="border-color: {themeColor.toggle};">🎪</div>
					<p class="text-xs" style="color: {themeColor.lightText};">{collectionInfo.name}</p>
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

				{#if !event.registrationOpen}
				<div class="flex flex-col px-5 py-5">
					<div class="flex items-center gap-3">
						<img src="/reg-closed.svg" alt="" class="h-[42px] w-[42px]" />
						<h3 class="text-xl font-semibold" style="color: {themeColor.text};">Registration Closed</h3>
					</div>
					<p class="mt-3 text-sm leading-relaxed" style="color: {themeColor.lightText};">
						This event is currently not taking registrations. You may contact the host or subscribe to receive updates.
					</p>
					<a
						href="mailto:{event.organizerSocialLinks?.website || ''}"
						class="mt-4 inline-flex items-center justify-center self-start rounded-lg px-16 py-3 text-sm font-medium transition-opacity hover:opacity-90"
						style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
					>
						Contact Organizer
					</a>
				</div>
				{:else}
				<p class="my-4 px-5 text-base" style="color: {themeColor.text};">
					Welcome! Please choose your desired ticket type:
				</p>

				<div class="mb-5 flex flex-col gap-3 px-5">
					{#each ticketTypes as ticket (ticket._id)}
					{@const available = isTicketAvailable(ticket)}
					{@const salesEnded = getTicketSalesEndLabel(ticket)}
					<button
						class="relative block w-full text-left rounded-lg border-2 p-4 transition-colors {available ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}"
						style="background-color: {themeColor.bg}; border-color: {selectedTicket === ticket._id ? themeColor.button : themeColor.toggle};"
						on:click={() => { if (available) selectedTicket = ticket._id; }}
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
							</div>
							<span class="text-sm font-medium" style="color: {themeColor.lightText};">{formatTicketPrice(ticket)}</span>
						</div>
						{#if ticket.description}
						<div class="ticket-desc mt-2 text-xs leading-relaxed" style="color: {themeColor.lightText};">{@html ticket.description}</div>
						{/if}
						{#if salesEnded}
						<p class="mt-2 text-xs" style="color: {themeColor.lightText};">{salesEnded}</p>
						{/if}
					</button>
					{/each}

					{#if ticketTypes.length === 0}
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
						disabled={!selectedTicket || ticketTypes.length === 0}
					>
						{getRegisterButtonLabel()}
					</button>
					<RegistrationModal
						bind:open={showAddModal}
						eventData={event}
						selectedTicketId={selectedTicket}
						{ticketTypes}
						{registrationFields}
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
				<div class="px-5 pb-5 prose prose-sm max-w-none" style="color: {themeColor.lightText};">
					{@html event.description}
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
							<div class="flex size-9 items-center justify-center rounded-[9px] text-lg" style="background-color: {themeColor.smallCover};">🎪</div>
							<div>
								<p class="text-xs" style="color: {themeColor.lightText};">Presented by</p>
								<h2 class="text-sm font-medium" style="color: {themeColor.text};">{collectionInfo.name}</h2>
							</div>
						</div>
					</div>
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
						/>
						{#each organizers.filter((a) => a.displayName || a.email) as admin}
							<OrganiserList
								organizerName={admin.displayName ?? admin.email ?? 'Co-organizer'}
								organizerAvatar="/user1-icon.svg"
								organizerSocial={false}
							/>
						{/each}
					</div>
					<div class="mt-6">
						<h3 class="mb-4 border-b pb-2 text-sm font-normal" style="color: {themeColor.lightText}; border-color: {themeColor.toggle};">
							{attendeeCount} Attending
						</h3>
						{#if attendeeCount > 0}
						<p class="max-w-[334px] text-sm" style="color: {themeColor.lightText};">
							{attendingNames}{#if remainingCount > 0}, and {remainingCount} others{/if}
						</p>
						{:else}
						<p class="text-sm" style="color: {themeColor.lightText};">Be the first to register</p>
						{/if}
					</div>
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

<style>
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
</style>
