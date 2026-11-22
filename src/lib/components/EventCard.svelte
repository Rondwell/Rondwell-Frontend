<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import EventQrCode from '$lib/components/EventQrCode.svelte';
	import { themeColor } from '$lib/stores/themeColor';
	import {
		formatEventStubDates,
		formatSmartLocation,
		formatSmartTitle,
		resolveEventCardDesign
	} from '$lib/utils/eventCardDesign';
	import type { Color } from '$lib/utils/colors';
	import { ensureThemeFontLoaded } from '$lib/utils/themeFonts';

	export let event: any;
	export let type: 'mine' | 'attending' | 'discover' = 'discover';
	export let eventId: string | undefined = undefined;
	export let slug: string | undefined = undefined;
	export let variant: 'default' | 'subscriber' | 'ticket' | 'landscape' = 'default';
	export let disableLink: boolean = false;
	export let theme: Color | null = null;
	export let rotateDeg: number = 0;
	export let offsetY: number = 0;
	export let interactiveTilt: boolean = false;

	let imageFailed = false;
	let lastImageKey = '';
	const instanceUid = Math.random().toString(36).slice(2, 7);

	$: currentImageKey = `${event?.displayPictureUrl || ''}|${event?.coverPictureUrl || ''}|${event?.image || ''}`;
	$: if (currentImageKey !== lastImageKey) {
		lastImageKey = currentImageKey;
		imageFailed = false;
	}

	$: effectiveVariant = variant === 'default' ? 'ticket' : variant;
	$: resolvedId = eventId || event?.id || event?._id || '';
	$: resolvedSlug = slug || event?.slug || event?.customLinkSlug || '';

	// Link routing preserves existing Rondwell organizer vs public discovery behavior
	$: computedHref = (() => {
		if (disableLink) return undefined;
		if (event?.href) return event.href;
		const pathname = $page?.url?.pathname || '';
		if (pathname.startsWith('/discover') || pathname.startsWith('/c/') || pathname === '/') {
			return resolvedSlug ? `/e/${resolvedSlug}` : `/event-page/${resolvedId}`;
		}
		if (type === 'attending') {
			return resolvedSlug ? `/e/${resolvedSlug}` : `/event-page/${resolvedId}`;
		}
		return `/events/${resolvedId}`;
	})();

	$: design = resolveEventCardDesign(event, {
		themeOverride: theme,
		forceNoImage: imageFailed
	});
	$: smartTitle = formatSmartTitle(event?.title);
	$: smartLocation = formatSmartLocation(event);
	$: stubDates = formatEventStubDates(
		event?.startDateTime,
		event?.endDateTime,
		event?.date,
		event?.time
	);
	$: organizerLabel =
		event?.organizer ||
		event?.eventOrganizerName ||
		event?.organizerName ||
		'Rondwell Host';
	$: qrSeed = String(resolvedId || resolvedSlug || smartTitle.full || 'rondwell');
	$: attendeeCount =
		typeof event?.attendeeCount === 'number' && event.attendeeCount > 0
			? event.attendeeCount
			: Array.isArray(event?.attendees) && event.attendees.length > 0
				? event.attendees.length
				: 0;
	$: fontStyle =
		design.font.id !== 'default'
			? `font-family: ${design.font.display};`
			: '';

	onMount(() => {
		if (design.font.id !== 'default') {
			ensureThemeFontLoaded(design.font);
		}
	});

	// Lightweight GPU 3D tilt (active only when interactiveTilt={true})
	let tiltX = 0;
	let tiltY = 0;
	let isHovered = false;

	function handlePointerMove(e: PointerEvent) {
		if (!interactiveTilt || e.pointerType === 'touch') return;
		const el = e.currentTarget as HTMLElement | null;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const px = (e.clientX - rect.left) / rect.width - 0.5;
		const py = (e.clientY - rect.top) / rect.height - 0.5;
		tiltY = px * 8;
		tiltX = -py * 8;
	}

	function handlePointerLeave() {
		isHovered = false;
		tiltX = 0;
		tiltY = 0;
	}

	$: cardTransformStyle = (() => {
		const parts: string[] = [];
		if (rotateDeg !== 0 && !isHovered) parts.push(`rotate(${rotateDeg}deg)`);
		if (offsetY !== 0) parts.push(`translateY(${offsetY}px)`);
		if (interactiveTilt && (tiltX !== 0 || tiltY !== 0)) {
			parts.push(`perspective(900px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`);
		}
		return parts.length > 0 ? `transform: ${parts.join(' ')};` : '';
	})();
</script>

{#if effectiveVariant === 'subscriber'}
	<!-- Compact Subscriber Detail Modal variant -->
	<div
		class="flex w-full items-center gap-3.5 rounded-2xl border p-3 transition-all duration-200 hover:shadow-sm"
		style={`background-color: ${design.surfaceBg}; border-color: ${design.borderColor}; color: ${design.inkPrimary};`}
	>
		<div class="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-black/10 bg-black/5">
			{#if design.imageUrl && !imageFailed}
				<img
					src={design.imageUrl}
					alt={smartTitle.full}
					class="h-full w-full object-cover"
					loading="lazy"
					on:error={() => (imageFailed = true)}
				/>
			{:else}
				<div
					class="flex h-full w-full items-center justify-center text-xs font-bold"
					style={`background: ${design.accentColor}; color: ${design.accentText};`}
				>
					{smartTitle.line1.slice(0, 2).toUpperCase()}
				</div>
			{/if}
		</div>

		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-semibold" title={smartTitle.full}>
				{smartTitle.display}
			</p>
			<div class="mt-0.5 flex flex-wrap items-center gap-2 text-xs" style={`color: ${design.inkMuted};`}>
				<span>{stubDates.month} {stubDates.day} · {stubDates.timeShort}</span>
				<span>·</span>
				<span title={smartLocation.full}>{smartLocation.short}</span>
			</div>
		</div>

		<span
			class="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
			style={`background: ${design.pillBg}; color: ${design.pillText};`}
		>
			{design.categoryLabel}
		</span>
	</div>
{:else if effectiveVariant === 'landscape'}
	<!-- Horizontal Perforated Ticket Stub (Dashboard Timeline + Discover Compact Mode) -->
	<svelte:element
		this={computedHref ? 'a' : 'div'}
		href={computedHref}
		class="group relative flex w-full items-stretch text-left no-underline transition-all duration-250 ease-out hover:-translate-y-0.5 active:scale-[0.99]"
		style={`${cardTransformStyle} filter: drop-shadow(0 8px 20px rgba(17, 15, 28, 0.06));`}
	>
		<!-- Left Main Chamber -->
		<div
			class="relative flex min-w-0 flex-1 items-center gap-3.5 rounded-l-[18px] border border-r-0 p-3.5 sm:gap-4 sm:p-4"
			style={`background-color: ${design.surfaceBg}; border-color: ${design.borderColor}; color: ${design.inkPrimary};`}
		>
			<!-- Framed Art Thumbnail or Procedural Emblemed Tile -->
			<div
				class="relative h-[78px] w-[78px] shrink-0 overflow-hidden rounded-[14px] border sm:h-[88px] sm:w-[88px]"
				style={`border-color: ${design.borderColor}; background: ${design.stubBg};`}
			>
				{#if design.imageUrl && !imageFailed}
					<img
						src={design.imageUrl}
						alt={smartTitle.full}
						class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
						loading="lazy"
						on:error={() => (imageFailed = true)}
					/>
					<div
						class="pointer-events-none absolute inset-0"
						style="background: linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.22) 100%);"
					></div>
				{:else}
					<div class="flex h-full w-full flex-col items-center justify-center p-2 text-center">
						<span
							class="text-[10px] font-bold tracking-[0.14em] uppercase"
							style={`color: ${design.inkMuted};`}
						>
							{stubDates.month}
						</span>
						<span
							class="text-2xl leading-none font-bold"
							style={`${fontStyle} color: ${design.inkPrimary};`}
						>
							{stubDates.day}
						</span>
					</div>
				{/if}
			</div>

			<!-- Structured Metadata -->
			<div class="min-w-0 flex-1 space-y-1.5">
				<div class="flex flex-wrap items-center gap-1.5">
					<span
						class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase"
						style={`background: ${design.pillBg}; color: ${design.pillText};`}
					>
						<span
							class="h-1.5 w-1.5 rounded-full"
							style={`background: ${design.accentColor};`}
						></span>
						{design.categoryLabel}
					</span>

					{#if event?.eventType === 'VIRTUAL'}
						<span
							class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
							style={`background: ${design.accentColor}; color: ${design.accentText};`}
						>
							Virtual
						</span>
					{:else if event?.status && event.status !== 'ACTIVE' && event.status !== 'LIVE'}
						<span
							class="rounded-full px-2 py-0.5 text-[10px] font-medium"
							style={`background: ${design.pillBg}; color: ${design.inkMuted};`}
						>
							{event.status}
						</span>
					{/if}
				</div>

				<h3
					class="line-clamp-2 text-[15px] leading-snug font-bold tracking-tight sm:text-[17px]"
					style={fontStyle}
					title={smartTitle.full}
				>
					{smartTitle.display}
				</h3>

				<div
					class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
					style={`color: ${design.inkMuted};`}
				>
					<span class="inline-flex items-center gap-1 font-medium" title={smartLocation.full}>
						<Icon
							icon={smartLocation.isVirtual ? 'solar:videocamera-bold-duotone' : 'solar:map-point-bold-duotone'}
							class="h-3.5 w-3.5 shrink-0"
						/>
						<span>{smartLocation.short}</span>
					</span>

					<span class="inline-flex items-center gap-1">
						<Icon icon="solar:clock-circle-linear" class="h-3.5 w-3.5 shrink-0" />
						<span>{stubDates.timeShort}</span>
					</span>

					{#if organizerLabel}
						<span class="hidden truncate sm:inline-flex sm:max-w-[140px]">
							by {organizerLabel}
						</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Vertical Transparent Punch-Notch Strip -->
		<div class="relative flex w-4 shrink-0 flex-col justify-between">
			<div
				class="h-1/2 w-full"
				style={`background-color: ${design.stubBg}; -webkit-mask-image: radial-gradient(circle 8px at 50% 0%, transparent 7.5px, #000 8px); mask-image: radial-gradient(circle 8px at 50% 0%, transparent 7.5px, #000 8px);`}
			></div>
			<div
				class="h-1/2 w-full"
				style={`background-color: ${design.stubBg}; -webkit-mask-image: radial-gradient(circle 8px at 50% 100%, transparent 7.5px, #000 8px); mask-image: radial-gradient(circle 8px at 50% 100%, transparent 7.5px, #000 8px);`}
			></div>
			<div
				class="pointer-events-none absolute top-3 bottom-3 left-1/2 -translate-x-1/2 border-l border-dashed"
				style={`border-color: ${design.borderColor};`}
			></div>
		</div>

		<!-- Right Ticket Stub -->
		<div
			class="flex w-[86px] shrink-0 flex-col items-center justify-between rounded-r-[18px] border border-l-0 px-2 py-3 text-center sm:w-[98px]"
			style={`background-color: ${design.stubBg}; border-color: ${design.borderColor}; color: ${design.inkPrimary};`}
		>
			<div class="leading-none">
				<p class="text-[9px] font-bold tracking-[0.16em] uppercase" style={`color: ${design.accentColor};`}>
					{stubDates.month}
				</p>
				<p class="mt-0.5 text-xl font-bold" style={fontStyle}>
					{stubDates.day}
				</p>
			</div>

			<div class="my-1 rounded-md p-1 shadow-xs" style={`background: ${design.qrBg};`}>
				<EventQrCode seed={qrSeed} size={34} fg={design.qrFg} bg="transparent" />
			</div>

			<span
				class="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase"
				style={`background: ${design.pillBg}; color: ${design.pillText};`}
			>
				{design.priceBadge}
			</span>
		</div>
	</svelte:element>
{:else}
	<!-- Vertical Collector Ticket Card ('ticket' / 'default') -->
	<svelte:element
		this={computedHref ? 'a' : 'div'}
		href={computedHref}
		on:pointermove={handlePointerMove}
		on:pointerenter={() => (isHovered = true)}
		on:pointerleave={handlePointerLeave}
		class="group relative flex h-full w-full flex-col text-left no-underline transition-all duration-300 ease-out hover:-translate-y-1.5 active:scale-[0.985]"
		style={`${cardTransformStyle} filter: drop-shadow(0 12px 26px rgba(18, 16, 28, 0.08)); will-change: transform;`}
	>
		<!-- TOP TICKET CHAMBER -->
		<div
			class="relative flex flex-1 flex-col overflow-hidden rounded-t-[22px] border border-b-0"
			style={`background-color: ${design.surfaceBg}; border-color: ${design.borderColor}; color: ${design.inkPrimary};`}
		>
			{#if design.archetype === 'full-bleed' && design.imageUrl && !imageFailed}
				<!-- ARCHETYPE 1: FULL-BLEED CINEMATIC POSTER -->
				<div class="relative flex min-h-[252px] flex-1 flex-col justify-between p-4 sm:min-h-[272px] sm:p-5">
					<img
						src={design.imageUrl}
						alt={smartTitle.full}
						class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
						loading="lazy"
						on:error={() => (imageFailed = true)}
					/>
					<div
						class="pointer-events-none absolute inset-0"
						style="background: linear-gradient(180deg, rgba(12,10,18,0.52) 0%, rgba(12,10,18,0.18) 42%, rgba(12,10,18,0.88) 100%);"
					></div>

					<!-- Top Bar -->
					<div class="relative z-10 flex items-center justify-between gap-2">
						<span class="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-white uppercase backdrop-blur-md">
							<span class="h-1.5 w-1.5 rounded-full" style={`background: ${design.accentColor};`}></span>
							{design.categoryLabel}
						</span>
						<span class="rounded-full border border-white/20 bg-white/15 px-2.5 py-1 font-mono text-[10px] font-medium text-white backdrop-blur-md">
							{stubDates.month} {stubDates.day}
						</span>
					</div>

					<!-- Bottom Headline -->
					<div class="relative z-10 mt-auto pt-12">
						{#if organizerLabel}
							<p class="mb-1 truncate text-[11px] font-medium tracking-wide text-white/75 uppercase">
								{organizerLabel}
							</p>
						{/if}
						<h3
							class={`${
								smartTitle.sizeTier === 'hero'
									? 'text-[22px] sm:text-[24px]'
									: smartTitle.sizeTier === 'balanced'
										? 'text-[19px] sm:text-[21px]'
										: 'text-[17px] sm:text-[18px]'
							} leading-[1.08] font-bold tracking-tight text-white drop-shadow-xs`}
							style={fontStyle}
							title={smartTitle.full}
						>
							{smartTitle.line1}
							{#if smartTitle.line2}
								<span class="block text-white/90">{smartTitle.line2}</span>
							{/if}
						</h3>
					</div>
				</div>
			{:else if design.archetype === 'spotlight-cutout' && design.imageUrl && !imageFailed}
				<!-- ARCHETYPE 2: STANDALONE CUTOUT / STAGE FRAME -->
				<div class="relative flex min-h-[252px] flex-1 flex-col justify-between p-4 sm:min-h-[272px] sm:p-5">
					<!-- Subtle radial aura behind cutout -->
					<div
						class="pointer-events-none absolute -top-10 -right-10 h-44 w-44 rounded-full opacity-35 blur-2xl"
						style={`background: ${design.accentColor};`}
					></div>

					<!-- Header Metadata -->
					<div class="relative z-10 flex items-center justify-between gap-2">
						<span
							class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase"
							style={`background: ${design.pillBg}; color: ${design.pillText};`}
						>
							{design.categoryLabel}
						</span>
						<span class="font-mono text-[10px] font-semibold" style={`color: ${design.inkMuted};`}>
							{design.codeLabel}
						</span>
					</div>

					<!-- Title Left/Top + Crisp Standalone Image Card Frame -->
					<div class="relative z-10 my-3 flex flex-1 flex-col justify-between gap-3">
						<h3
							class={`${
								smartTitle.sizeTier === 'hero'
									? 'text-[22px]'
									: smartTitle.sizeTier === 'balanced'
										? 'text-[19px]'
										: 'text-[17px]'
							} leading-[1.08] font-extrabold tracking-tight`}
							style={`${fontStyle} color: ${design.inkPrimary};`}
							title={smartTitle.full}
						>
							{smartTitle.line1}
							{#if smartTitle.line2}
								<span class="block font-semibold opacity-85">{smartTitle.line2}</span>
							{/if}
						</h3>

						<div class="flex items-end justify-between gap-3">
							<div class="space-y-1 text-[11px]" style={`color: ${design.inkMuted};`}>
								<p class="font-semibold uppercase tracking-wide" style={`color: ${design.accentColor};`}>
									{stubDates.weekday} · {stubDates.month} {stubDates.day}
								</p>
								<p class="truncate max-w-[125px]">{organizerLabel}</p>
							</div>

							<div
								class="relative h-[108px] w-[108px] shrink-0 overflow-hidden rounded-2xl border shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-2 sm:h-[118px] sm:w-[118px]"
								style={`border-color: ${design.borderColor}; background: ${design.stubBg};`}
							>
								<img
									src={design.imageUrl}
									alt={smartTitle.full}
									class="h-full w-full object-cover"
									loading="lazy"
									on:error={() => (imageFailed = true)}
								/>
							</div>
						</div>
					</div>
				</div>
			{:else if design.archetype === 'arch-frame' && design.imageUrl && !imageFailed}
				<!-- ARCHETYPE 3: EDITORIAL ARCH GALLERY WINDOW -->
				<div class="relative flex min-h-[252px] flex-1 flex-col justify-between p-4 sm:min-h-[272px] sm:p-5">
					<div class="flex items-center justify-between text-[10px] font-semibold tracking-[0.14em] uppercase" style={`color: ${design.inkMuted};`}>
						<span>{design.categoryLabel}</span>
						<span style={`color: ${design.accentColor};`}>{stubDates.month} {stubDates.day}</span>
					</div>

					<!-- Arched Portal Frame -->
					<div class="my-3 flex flex-1 items-center justify-center">
						<div
							class="relative h-[136px] w-[112px] overflow-hidden rounded-t-full rounded-b-[14px] border p-1 transition-transform duration-300 group-hover:scale-[1.03] sm:h-[146px] sm:w-[122px]"
							style={`border-color: ${design.borderColor}; background: ${design.stubBg};`}
						>
							<img
								src={design.imageUrl}
								alt={smartTitle.full}
								class="h-full w-full rounded-t-full rounded-b-[10px] object-cover"
								loading="lazy"
								on:error={() => (imageFailed = true)}
							/>
						</div>
					</div>

					<div class="text-center">
						<h3
							class="text-[18px] leading-[1.14] font-bold tracking-tight"
							style={`${fontStyle} color: ${design.inkPrimary};`}
							title={smartTitle.full}
						>
							{smartTitle.display}
						</h3>
						<p class="mt-1 truncate text-[11px]" style={`color: ${design.inkMuted};`}>
							Hosted by {organizerLabel}
						</p>
					</div>
				</div>
			{:else if design.archetype === 'editorial-split' && design.imageUrl && !imageFailed}
				<!-- ARCHETYPE 4: SWISS EDITORIAL SPLIT PASS -->
				<div class="relative flex min-h-[252px] flex-1 flex-col justify-between p-4 sm:min-h-[272px] sm:p-5">
					<!-- Clean Cover Aspect Strip -->
					<div
						class="relative h-[126px] w-full overflow-hidden rounded-[14px] border sm:h-[136px]"
						style={`border-color: ${design.borderColor};`}
					>
						<img
							src={design.imageUrl}
							alt={smartTitle.full}
							class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
							loading="lazy"
							on:error={() => (imageFailed = true)}
						/>
						<div class="absolute top-2.5 left-2.5">
							<span
								class="rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase shadow-xs backdrop-blur-md"
								style={`background: ${design.isDarkSurface ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.92)'}; color: ${design.inkPrimary};`}
							>
								{design.categoryLabel}
							</span>
						</div>
						<div class="absolute top-2.5 right-2.5">
							<span
								class="rounded-md px-2 py-0.5 font-mono text-[10px] font-bold"
								style={`background: ${design.accentColor}; color: ${design.accentText};`}
							>
								{stubDates.month} {stubDates.day}
							</span>
						</div>
					</div>

					<!-- Typographic Headline Block -->
					<div class="mt-3.5 flex flex-1 flex-col justify-between">
						<h3
							class={`${
								smartTitle.sizeTier === 'compact' ? 'text-[17px]' : 'text-[19px]'
							} leading-[1.15] font-bold tracking-tight`}
							style={`${fontStyle} color: ${design.inkPrimary};`}
							title={smartTitle.full}
						>
							{smartTitle.display}
						</h3>

						<div class="mt-2.5 flex items-center justify-between border-t pt-2.5 text-[11px]" style={`border-color: ${design.borderColor}; color: ${design.inkMuted};`}>
							<span class="truncate max-w-[140px]">{organizerLabel}</span>
							<span class="font-mono text-[10px] font-semibold">{design.codeLabel}</span>
						</div>
					</div>
				</div>
			{:else}
				<!-- ARCHETYPES 5–8: GENERATIVE ARTWORKS WHEN NO CUSTOM IMAGE EXISTS (OR ON IMAGE ERROR) -->
				<div class="relative flex min-h-[252px] flex-1 flex-col justify-between overflow-hidden p-4 sm:min-h-[272px] sm:p-5">
					<!-- Generative Vector Backdrop -->
					{#if design.archetype === 'tech-grid'}
						<svg class="pointer-events-none absolute inset-0 h-full w-full opacity-25" aria-hidden="true">
							<defs>
								<pattern id={`grid-${instanceUid}`} width="22" height="22" patternUnits="userSpaceOnUse">
									<circle cx="2" cy="2" r="1.1" fill={design.accentColor} />
								</pattern>
							</defs>
							<rect width="100%" height="100%" fill={`url(#grid-${instanceUid})`} />
						</svg>
						<div
							class="pointer-events-none absolute -right-12 -bottom-10 h-44 w-44 rounded-full opacity-30 blur-2xl"
							style={`background: ${design.accentColor};`}
						></div>
					{:else if design.archetype === 'vinyl'}
						<svg viewBox="0 0 220 220" class="pointer-events-none absolute -right-14 -bottom-12 h-52 w-52 opacity-30" aria-hidden="true">
							{#each [96, 80, 64, 48, 32] as radius}
								<circle cx="110" cy="110" r={radius} fill="none" stroke={design.accentColor} stroke-width="1.2" />
							{/each}
							<circle cx="110" cy="110" r="14" fill={design.accentColor} />
						</svg>
					{:else if design.archetype === 'solar-dial'}
						<svg viewBox="0 0 240 240" class="pointer-events-none absolute -right-12 -bottom-12 h-52 w-52 opacity-30" aria-hidden="true">
							<circle cx="120" cy="120" r="78" fill="none" stroke={design.accentColor} stroke-width="1.5" stroke-dasharray="4 6" />
							<circle cx="120" cy="120" r="46" fill={design.accentColor} opacity="0.22" />
						</svg>
					{:else}
						<!-- lattice geometric frame -->
						<svg class="pointer-events-none absolute inset-0 h-full w-full opacity-20" aria-hidden="true">
							<defs>
								<pattern id={`lat-${instanceUid}`} width="28" height="28" patternUnits="userSpaceOnUse">
									<path d="M 14 0 L 28 14 L 14 28 L 0 14 Z" fill="none" stroke={design.accentColor} stroke-width="0.9" />
								</pattern>
							</defs>
							<rect width="100%" height="100%" fill={`url(#lat-${instanceUid})`} />
						</svg>
					{/if}

					<!-- Header Chips -->
					<div class="relative z-10 flex items-center justify-between gap-2">
						<span
							class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase"
							style={`background: ${design.pillBg}; color: ${design.pillText};`}
						>
							<span class="h-1.5 w-1.5 rounded-full" style={`background: ${design.accentColor};`}></span>
							{design.categoryLabel}
						</span>
						<span class="font-mono text-[10px] font-bold tracking-wider" style={`color: ${design.accentColor};`}>
							{stubDates.month} · {stubDates.day}
						</span>
					</div>

					<!-- Focal Date/Monogram Stamp + Expressive Typographic Title -->
					<div class="relative z-10 my-4 flex flex-1 flex-col justify-center">
						<div class="mb-3 inline-flex w-fit items-center gap-2 rounded-xl border px-2.5 py-1" style={`border-color: ${design.borderColor}; background: ${design.pillBg};`}>
							<Icon
								icon={
									design.archetype === 'vinyl'
										? 'solar:music-notes-bold-duotone'
										: design.archetype === 'tech-grid'
											? 'solar:code-circle-bold-duotone'
											: design.archetype === 'solar-dial'
												? 'solar:sun-2-bold-duotone'
												: 'solar:ticket-bold-duotone'
								}
								class="h-4 w-4"
								style={`color: ${design.accentColor};`}
							/>
							<span class="font-mono text-[10px] font-semibold" style={`color: ${design.inkMuted};`}>
								{design.codeLabel}
							</span>
						</div>

						<h3
							class={`${
								smartTitle.sizeTier === 'hero'
									? 'text-[23px]'
									: smartTitle.sizeTier === 'balanced'
										? 'text-[20px]'
										: 'text-[18px]'
							} leading-[1.1] font-bold tracking-tight`}
							style={`${fontStyle} color: ${design.inkPrimary};`}
							title={smartTitle.full}
						>
							{smartTitle.line1}
							{#if smartTitle.line2}
								<span class="block opacity-90">{smartTitle.line2}</span>
							{/if}
						</h3>

						{#if smartTitle.subtitle}
							<p class="mt-1.5 line-clamp-1 text-xs" style={`color: ${design.inkMuted};`}>
								{smartTitle.subtitle}
							</p>
						{/if}
					</div>

					<div class="relative z-10 flex items-center justify-between text-[11px]" style={`color: ${design.inkMuted};`}>
						<span class="truncate max-w-[155px] font-medium">by {organizerLabel}</span>
						<span class="font-mono text-[10px] uppercase">{stubDates.weekday}</span>
					</div>
				</div>
			{/if}
		</div>

		<!-- TRANSPARENT PERFORATED NOTCH STRIP -->
		<div class="relative flex h-5 w-full items-center">
			<div
				class="h-full w-1/2"
				style={`background-color: ${design.stubBg}; -webkit-mask-image: radial-gradient(circle 9px at 0% 50%, transparent 8.5px, #000 9px); mask-image: radial-gradient(circle 9px at 0% 50%, transparent 8.5px, #000 9px);`}
			></div>
			<div
				class="h-full w-1/2"
				style={`background-color: ${design.stubBg}; -webkit-mask-image: radial-gradient(circle 9px at 100% 50%, transparent 8.5px, #000 9px); mask-image: radial-gradient(circle 9px at 100% 50%, transparent 8.5px, #000 9px);`}
			></div>
			<div
				class="pointer-events-none absolute right-4 left-4 top-1/2 -translate-y-1/2 border-t border-dashed"
				style={`border-color: ${design.borderColor};`}
			></div>
		</div>

		<!-- BOTTOM STUB (SMART 1-2 WORD LOCATION, TIME, PRICE/ATTENDEES & QR) -->
		<div
			class="flex items-center justify-between gap-3 rounded-b-[22px] border border-t-0 px-4 py-3 sm:px-5"
			style={`background-color: ${design.stubBg}; border-color: ${design.borderColor}; color: ${design.inkPrimary};`}
		>
			<div class="min-w-0 flex-1 space-y-1">
				<div class="flex items-center gap-1.5 text-xs font-semibold" title={smartLocation.full}>
					<Icon
						icon={smartLocation.isVirtual ? 'solar:videocamera-bold-duotone' : 'solar:map-point-bold-duotone'}
						class="h-3.5 w-3.5 shrink-0"
						style={`color: ${design.accentColor};`}
					/>
					<span class="truncate">{smartLocation.short}</span>
				</div>

				<div class="flex flex-wrap items-center gap-2 text-[11px]" style={`color: ${design.inkMuted};`}>
					<span>{stubDates.timeShort}</span>
					<span>·</span>
					<span
						class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
						style={`background: ${design.pillBg}; color: ${design.pillText};`}
					>
						{design.priceBadge}
					</span>
					{#if attendeeCount > 0}
						<span class="hidden sm:inline text-[10px]">
							{attendeeCount}+ going
						</span>
					{/if}
				</div>
			</div>

			<div
				class="shrink-0 rounded-lg p-1 shadow-xs transition-transform duration-300 group-hover:scale-105"
				style={`background: ${design.qrBg};`}
			>
				<EventQrCode seed={qrSeed} size={36} fg={design.qrFg} bg="transparent" />
			</div>
		</div>
	</svelte:element>
{/if}
