<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { getPublicEventPage, getPublicSeats } from '$lib/services/event.services';
	import { formatMoney, majorToKobo } from '$lib/utils/money';
	import { colors } from '$lib/utils/colors';
	import { sanitizeHtml } from '$lib/security/sanitizeHtml';
	import RegistrationModal from '../../../(app)/(main)/event-page/components/modal/RegistrationModal.svelte';
	import Icon from '@iconify/svelte';

	const EVENT_URL = import.meta.env.VITE_EVENT_API_URL || '';
	const ANALYTICS_URL = import.meta.env.VITE_API_URL || '';

	$: idOrSlug = ($page.params as Record<string, string>).idOrSlug ?? '';
	$: qTheme = $page.url.searchParams.get('theme');
	$: qPrimary = $page.url.searchParams.get('primary');
	$: qBg = $page.url.searchParams.get('bg');
	$: qText = $page.url.searchParams.get('text');
	$: qRadius = $page.url.searchParams.get('radius');
	$: qRedirect = $page.url.searchParams.get('redirectUrl');
	$: qTicketId = $page.url.searchParams.get('ticketId');
	$: qParentOrigin = $page.url.searchParams.get('parentOrigin') || '*';
	$: qShowCover = $page.url.searchParams.get('showCover');
	$: qShowDesc = $page.url.searchParams.get('showDescription');

	let loading = true;
	let error = '';
	let eventId = '';
	let event: any = null;
	let ticketTypes: any[] = [];
	let registrationFields: any[] = [];
	let attendeeCount = 0;
	let features: any = null;
	let hasSeatMap = false;
	let availableSeatsCount = 0;
	let selectedTicketId = '';
	let ticketQty = 1;
	let modalOpen = false;
	let completedPayload: any = null;

	$: savedCfg = event?.embedConfig || {};
	$: isDark = (qTheme || savedCfg.theme || 'light') === 'dark';
	$: primaryColor = qPrimary || savedCfg.primaryColor || '#7C3AED';
	$: bgColor = qBg || savedCfg.backgroundColor || (isDark ? '#0b0f19' : '#ffffff');
	$: textColor = qText || savedCfg.textColor || (isDark ? '#f8fafc' : '#0f172a');
	$: radiusPx = Number(qRadius ?? savedCfg.borderRadius ?? 12);
	$: showCover = qShowCover !== null ? qShowCover !== 'false' : savedCfg.showCover !== false;
	$: showDesc = qShowDesc !== null ? qShowDesc !== 'false' : savedCfg.showDescription !== false;
	$: effectiveRedirect = qRedirect || savedCfg.redirectUrl || '';

	$: modalTheme = {
		...colors[0],
		bg: bgColor,
		text: textColor,
		lightText: isDark ? '#94a3b8' : '#64748b',
		cover: isDark ? '#1e293b' : '#f1f5f9',
		smallCover: isDark ? '#334155' : '#e2e8f0',
		button: primaryColor,
		buttonText: '#ffffff',
		toggle: isDark ? '#334155' : '#e2e8f0',
	};

	function emitParent(type: string, payload: any = {}) {
		if (typeof window === 'undefined' || window.parent === window) return;
		const targetOrigin =
			qParentOrigin && (qParentOrigin.startsWith('http://') || qParentOrigin.startsWith('https://'))
				? qParentOrigin
				: '*';
		window.parent.postMessage({ source: 'rondwell-sdk', type, payload }, targetOrigin);
	}

	function sendTelemetry(action: string) {
		if (!eventId || !ANALYTICS_URL) return;
		fetch(`${ANALYTICS_URL}/api/v1/analytics/events/${encodeURIComponent(eventId)}/sdk-telemetry`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action }),
		}).catch(() => {});
	}

	onMount(async () => {
		if (!idOrSlug) {
			error = 'Missing event identifier.';
			loading = false;
			return;
		}
		try {
			let resolvedId = idOrSlug;
			if (!/^[0-9a-fA-F]{24}$/.test(idOrSlug)) {
				const slugRes = await fetch(
					`${EVENT_URL}/api/v1/events/by-slug/${encodeURIComponent(idOrSlug)}`
				);
				if (slugRes.ok) {
					const sd = await slugRes.json();
					resolvedId = sd.eventId || sd.event?._id || idOrSlug;
				}
			}
			eventId = resolvedId;
			const data = await getPublicEventPage(eventId);
			event = data.event;
			ticketTypes = data.ticketTypes || [];
			registrationFields = data.registrationFields || [];
			attendeeCount = data.attendeeCount || 0;
			features = data.features || null;

			if (qTicketId && ticketTypes.some((t) => t._id === qTicketId)) {
				selectedTicketId = qTicketId;
			} else if (ticketTypes.length > 0) {
				selectedTicketId = ticketTypes[0]._id;
			}

			try {
				const seatRes = await getPublicSeats(eventId);
				if (seatRes?.layout?.elements?.length > 0) {
					hasSeatMap = true;
					availableSeatsCount = (seatRes.seats || []).filter((s: any) => s.status === 'AVAILABLE').length;
				}
			} catch {
				hasSeatMap = false;
			}

			emitParent('rondwell:ready', { eventId, title: event?.title });
			sendTelemetry('view');
			sendTelemetry($page.url.searchParams.get('mode') === 'inline' ? 'inline_load' : 'modal_open');
		} catch (e: any) {
			error = e?.message || 'Unable to load event.';
			emitParent('rondwell:error', { message: error });
		} finally {
			loading = false;
		}
	});

	function startRegistration(ticketId: string) {
		selectedTicketId = ticketId;
		emitParent('rondwell:ticket:selected', { ticketTypeId: ticketId });
		sendTelemetry('ticket_select');
		modalOpen = true;
	}

	function handleSuccess(payload: any) {
		const fullPayload = { ...payload, redirectUrl: effectiveRedirect || undefined };
		completedPayload = fullPayload;
		sendTelemetry('registration_complete');
		emitParent('rondwell:registration:success', fullPayload);

		// If opened directly without SDK parent and organizer set a redirectUrl, navigate cleanly
		if (effectiveRedirect && (typeof window === 'undefined' || window.parent === window)) {
			try {
				const target = new URL(effectiveRedirect, window.location.origin);
				if (target.protocol === 'http:' || target.protocol === 'https:') {
					if (payload.registrationId) target.searchParams.set('rondwell_registration_id', payload.registrationId);
					if (payload.eventId) target.searchParams.set('rondwell_event_id', payload.eventId);
					target.searchParams.set('rondwell_status', payload.status || 'ATTENDING');
					setTimeout(() => window.location.assign(target.toString()), 900);
				}
			} catch {
				/* ignore */
			}
		}
	}

	function formatTicketPrice(t: any): string {
		if (!t || t.isFree || !t.price) return 'Free';
		return formatMoney(majorToKobo(t.price, t.currency || 'NGN'), t.currency || 'NGN', {
			minimumFractionDigits: 0,
		});
	}
</script>

<div class="mx-auto max-w-2xl p-5 sm:p-6" style="background-color:{bgColor}; color:{textColor}; border-radius:{radiusPx}px;">
	{#if loading}
		<div class="space-y-4 py-8">
			<div class="h-44 w-full animate-pulse rounded-xl bg-slate-200/70"></div>
			<div class="h-6 w-2/3 animate-pulse rounded bg-slate-200/70"></div>
			<div class="h-24 w-full animate-pulse rounded-xl bg-slate-200/70"></div>
		</div>
	{:else if error || !event}
		<div class="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
			<p class="font-semibold">Event unavailable</p>
			<p class="mt-1 text-sm">{error || 'This event could not be loaded.'}</p>
		</div>
	{:else}
		{#if showCover && (event.coverPictureUrl || event.displayPictureUrl)}
			<img
				src={event.coverPictureUrl || event.displayPictureUrl}
				alt={event.title}
				class="mb-4 h-48 w-full object-cover"
				style="border-radius:{radiusPx}px;"
			/>
		{/if}

		<div class="mb-5">
			<div class="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium opacity-75">
				<span class="rounded-full px-2.5 py-0.5 text-white" style="background-color:{primaryColor};">
					{event.eventType || 'EVENT'}
				</span>
				{#if event.startDateTime}
					<span>{new Date(event.startDateTime).toLocaleString()}</span>
				{/if}
				{#if hasSeatMap}
					<span class="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-emerald-600">
						{availableSeatsCount} seats open
					</span>
				{/if}
			</div>
			<h1 class="text-2xl font-bold leading-tight">{event.title}</h1>
			{#if event.locationDetails?.physical?.venueName}
				<p class="mt-1.5 flex items-center gap-1.5 text-sm opacity-75">
					<Icon icon="mdi:map-marker-outline" class="h-4 w-4" />
					{event.locationDetails.physical.venueName}
				</p>
			{/if}
			{#if savedCfg.showAttendeeCount !== false && attendeeCount > 0}
				<p class="mt-1 text-xs opacity-70">{attendeeCount} registered</p>
			{/if}
		</div>

		{#if completedPayload}
			<div class="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
				<p class="font-semibold text-emerald-600">Registration confirmed</p>
				<p class="mt-1 opacity-80">
					Reference: <code class="font-mono text-xs">{completedPayload.registrationId}</code>
					{#if effectiveRedirect} — redirecting back shortly…{/if}
				</p>
			</div>
		{/if}

		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold uppercase tracking-wider opacity-70">Select Ticket</h2>
				{#if hasSeatMap}
					<span class="text-xs opacity-70">Seat map included at next step</span>
				{/if}
			</div>

			{#if ticketTypes.length === 0}
				<button
					type="button"
					on:click={() => startRegistration('')}
					class="w-full py-3 text-sm font-semibold text-white transition hover:opacity-95"
					style="background-color:{primaryColor}; border-radius:{radiusPx}px;"
				>
					{savedCfg.buttonText || 'Register for Event'}
				</button>
			{:else}
				{#each ticketTypes as ticket}
					{@const soldOut =
						ticket.quantityAvailable != null &&
						Number(ticket.soldCount || 0) >= Number(ticket.quantityAvailable)}
					<div
						class="flex items-center justify-between gap-3 border p-4 transition"
						style="border-radius:{radiusPx}px; border-color:{selectedTicketId === ticket._id
							? primaryColor
							: isDark
								? '#1e293b'
								: '#e2e8f0'};"
					>
						<div class="min-w-0">
							<p class="font-semibold">{ticket.name}</p>
							{#if ticket.quantityAvailable != null}
								<p class="text-xs opacity-70">
									{Math.max(0, Number(ticket.quantityAvailable) - Number(ticket.soldCount || 0))} remaining
								</p>
							{/if}
						</div>
						<div class="flex items-center gap-3">
							<span class="text-sm font-bold">{formatTicketPrice(ticket)}</span>
							<button
								type="button"
								disabled={soldOut}
								on:click={() => startRegistration(ticket._id)}
								class="px-4 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
								style="background-color:{primaryColor}; border-radius:{Math.max(6, radiusPx - 2)}px;"
							>
								{soldOut ? 'Sold Out' : 'Select'}
							</button>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		{#if showDesc && event.description}
			<div class="mt-6 border-t pt-4 text-sm leading-relaxed opacity-85" style="border-color:{isDark ? '#1e293b' : '#e2e8f0'};">
				{@html sanitizeHtml(event.description)}
			</div>
		{/if}

		<div class="mt-6 flex items-center justify-between border-t pt-3 text-[11px] opacity-60" style="border-color:{isDark ? '#1e293b' : '#e2e8f0'};">
			<span>Powered by Rondwell Web SDK</span>
			<span>Secure checkout &amp; instant QR ticket</span>
		</div>
	{/if}
</div>

<RegistrationModal
	bind:open={modalOpen}
	eventData={event}
	eventIdOverride={eventId}
	embedMode={true}
	themeOverride={modalTheme}
	{selectedTicketId}
	{ticketTypes}
	{registrationFields}
	ticketQuantity={ticketQty}
	{features}
	onRegistrationSuccess={handleSuccess}
/>
