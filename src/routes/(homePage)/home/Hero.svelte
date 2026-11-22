<script lang="ts">
	import Icon from '@iconify/svelte';
	import EventCard from '$lib/components/EventCard.svelte';

	interface HeroEdition {
		id: string;
		tabLabel: string;
		badgeIcon: string;
		event: Record<string, any>;
	}

	const heroEditions: HeroEdition[] = [
		{
			id: 'velvet-concert',
			tabLabel: 'Live Music',
			badgeIcon: 'solar:music-notes-bold-duotone',
			event: {
				id: 'showcase-concert',
				title: 'Midnight Velvet Symphony: Acoustic Echoes at Victoria Hall',
				date: 'Sat, Nov 28',
				time: '8:30 PM',
				locationDetails: { city: 'London', country: 'United Kingdom' },
				eventType: 'PHYSICAL',
				category: 'Music',
				price: 'Paid',
				organizer: 'Sonder Collective',
				displayPictureUrl: '/entriqs/card2-concert.png',
				themeColor: 'Midnight',
				themeFont: 'playfair',
				attendeeCount: 420
			}
		},
		{
			id: 'creator-keynote',
			tabLabel: 'Keynote Talk',
			badgeIcon: 'solar:microphone-3-bold-duotone',
			event: {
				id: 'showcase-keynote',
				title: 'Design Systems & Autonomous Interfaces Summit',
				date: 'Thu, Dec 03',
				time: '10:00 AM',
				locationDetails: { city: 'Lagos', country: 'Nigeria', venueName: 'Landmark Centre' },
				eventType: 'HYBRID',
				category: 'Tech & AI',
				price: 'Free',
				organizer: 'Rondwell Labs',
				displayPictureUrl: '/entriqs/card3-mic.png',
				themeColor: 'Orchid',
				themeFont: 'space-grotesk',
				attendeeCount: 890
			}
		},
		{
			id: 'maison-gala',
			tabLabel: 'Atelier & Gala',
			badgeIcon: 'solar:crown-star-bold-duotone',
			event: {
				id: 'showcase-wedding',
				title: 'Atelier Lumière: Autumn Salon & Sculpture Courtyard',
				date: 'Sun, Dec 14',
				time: '5:00 PM',
				locationDetails: { city: 'Paris', country: 'France' },
				eventType: 'PHYSICAL',
				category: 'Arts & Culture',
				price: 'RSVP',
				organizer: 'Maison Lumière',
				displayPictureUrl: '/entriqs/card5-wedding.png',
				themeColor: 'Light Apricot',
				themeFont: 'fraunces',
				attendeeCount: 165
			}
		}
	];

	let activeIndex = 0;
	let touchStartX = 0;
	let touchStartY = 0;

	function selectEdition(idx: number) {
		activeIndex = idx;
	}

	function nextEdition() {
		activeIndex = (activeIndex + 1) % heroEditions.length;
	}

	function prevEdition() {
		activeIndex = (activeIndex - 1 + heroEditions.length) % heroEditions.length;
	}

	function handleTouchStart(e: TouchEvent) {
		const touch = e.touches[0];
		if (!touch) return;
		touchStartX = touch.clientX;
		touchStartY = touch.clientY;
	}

	function handleTouchEnd(e: TouchEvent) {
		const touch = e.changedTouches[0];
		if (!touch) return;
		const dx = touch.clientX - touchStartX;
		const dy = touch.clientY - touchStartY;
		if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) {
			if (dx < 0) nextEdition();
			else prevEdition();
		}
	}

	function orderedDeck(current: number): { item: HeroEdition; offset: number; origIdx: number }[] {
		return heroEditions.map((item, idx) => {
			const rel = (idx - current + heroEditions.length) % heroEditions.length;
			return { item, offset: rel, origIdx: idx };
		});
	}

	$: stageCards = orderedDeck(activeIndex);
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&display=swap"
	/>
</svelte:head>

<section class="relative mx-auto w-full max-w-7xl overflow-x-clip px-4 pt-6 pb-14 sm:px-6 md:pt-12 md:pb-20 lg:px-8">
	<div class="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
		<!-- LEFT COLUMN: Editorial Headline, Interactive CTAs, Edition Controls -->
		<div class="relative z-10 text-center lg:col-span-6 lg:text-left">
			<div class="mx-auto inline-flex items-center gap-2 rounded-full border border-[#DB3E6C]/20 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[#5C3650] shadow-xs backdrop-blur-md lg:mx-0">
				<span class="relative flex h-2 w-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#DB3E6C] opacity-75"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-[#DB3E6C]"></span>
				</span>
				<span>Live Event Infrastructure · Dynamic Collector Passes</span>
			</div>

			<h1 class="mt-5 text-[40px] leading-[1.04] font-bold tracking-tight text-[#17161E] sm:text-[52px] lg:text-[60px]">
				Host events that <br class="hidden sm:inline" />
				feel like
				<span
					class="bg-gradient-to-r from-[#DB3E6C] via-[#AB46DD] to-[#7C3AED] bg-clip-text text-transparent"
					style="font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-weight: 700;"
				>
					unforgettable
				</span>
				moments.
			</h1>

			<p class="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#52505D] sm:text-lg lg:mx-0">
				Craft themed event pages, dynamic collector tickets, instant QR check-ins, vendor booths,
				and real-time analytics — engineered to move seamlessly across every device.
			</p>

			<!-- Primary Interactive Action Bar -->
			<div class="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
				<a
					href="/create-event"
					class="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#DB3E6C] to-[#AB46DD] px-6 text-sm font-semibold text-white no-underline shadow-[0_12px_28px_rgba(171,70,221,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(171,70,221,0.36)] active:scale-[0.98] sm:w-auto"
				>
					<img src="/Aiicon.svg" alt="" class="h-5 w-5 brightness-0 invert" />
					<span>Create First Event Free</span>
					<Icon icon="solar:arrow-right-linear" class="h-4 w-4" />
				</a>

				<a
					href="/discover"
					class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-black/12 bg-white/88 px-6 text-sm font-semibold text-[#17161E] no-underline shadow-xs backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm sm:w-auto"
				>
					<Icon icon="solar:compass-bold-duotone" class="h-4.5 w-4.5 text-[#AB46DD]" />
					<span>Explore Live Events</span>
				</a>
			</div>

			<!-- Interactive Showcase Switcher -->
			<div class="mt-8">
				<p class="mb-2.5 text-[11px] font-semibold tracking-[0.16em] text-[#7A7787] uppercase">
					Preview Adaptive Card Styles
				</p>
				<div class="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
					{#each heroEditions as ed, idx}
						<button
							type="button"
							on:click={() => selectEdition(idx)}
							class={`inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
								activeIndex === idx
									? 'border-[#17161E] bg-[#17161E] text-white shadow-sm'
									: 'border-black/10 bg-white/75 text-[#3F3D4A] hover:bg-white'
							}`}
						>
							<Icon icon={ed.badgeIcon} class="h-3.5 w-3.5" />
							<span>{ed.tabLabel}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Lightweight Trust Metadata -->
			<div class="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-[#6B6878] lg:justify-start">
				<span class="inline-flex items-center gap-1.5">
					<img src="/heart-icon.png" alt="" class="h-3.5 w-3.5" />
					Instant Payouts & Free Tiers
				</span>
				<span class="inline-flex items-center gap-1.5">
					<Icon icon="solar:qr-code-bold-duotone" class="h-4 w-4 text-[#DB3E6C]" />
					Dynamic QR Entry Stubs
				</span>
				<span class="inline-flex items-center gap-1.5">
					<Icon icon="solar:palette-bold-duotone" class="h-4 w-4 text-[#AB46DD]" />
					Adaptive Mobile Chrome
				</span>
			</div>
		</div>

		<!-- RIGHT COLUMN: Interactive 3D Collector Ticket Depth Stage -->
		<div class="relative flex flex-col items-center justify-center lg:col-span-6">
			<!-- Unified Responsive Fanned 3-Card Stage (Mobile + Desktop) -->
			<div
				class="hero-deck-stage relative flex w-full max-w-[490px] touch-pan-y items-center justify-center"
				on:touchstart={handleTouchStart}
				on:touchend={handleTouchEnd}
			>
				<div
					class="pointer-events-none absolute h-60 w-60 rounded-full bg-gradient-to-tr from-[#DB3E6C]/20 via-[#AB46DD]/18 to-[#513BE2]/15 blur-3xl sm:h-72 sm:w-72"
				></div>

				{#each stageCards as { item, offset, origIdx } (item.id)}
					{@const isFront = offset === 0}
					{@const isRight = offset === 1}
					<div
						role="button"
						tabindex="0"
						aria-label={`Spotlight ${item.tabLabel} event card`}
						on:click={() => selectEdition(origIdx)}
						on:keydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								selectEdition(origIdx);
							}
						}}
						class="deck-card absolute cursor-pointer {isFront
							? 'deck-front'
							: isRight
								? 'deck-right'
								: 'deck-left'}"
					>
						<EventCard
							event={item.event}
							variant="ticket"
							disableLink={true}
							interactiveTilt={isFront}
						/>
					</div>
				{/each}
			</div>

			<!-- Interactive Pill Indicator Switcher -->
			<div class="mt-2 flex items-center justify-center gap-1.5" role="tablist" aria-label="Featured card styles">
				{#each heroEditions as ed, idx}
					<button
						type="button"
						role="tab"
						aria-selected={activeIndex === idx}
						aria-label={`Show ${ed.tabLabel} card`}
						on:click={() => selectEdition(idx)}
						class={`h-2 rounded-full transition-all duration-300 ${
							activeIndex === idx ? 'w-6 bg-[#17161E]' : 'w-2 bg-black/20 hover:bg-black/35'
						}`}
					></button>
				{/each}
			</div>

			<div class="mt-2.5 flex items-center gap-2 text-xs text-[#6B6878]">
				<Icon icon="solar:cursor-bold-duotone" class="h-3.5 w-3.5 text-[#DB3E6C]" />
				<span>Swipe or tap any card to inspect live theme choreography</span>
			</div>
		</div>
	</div>
</section>

<style>
	.hero-deck-stage {
		height: 390px;
		--card-w: 234px;
		--fan-x: 48px;
		--fan-y-r: 14px;
		--fan-y-l: 18px;
		--fan-scale: 0.84;
		--fan-rot: 6.5deg;
	}

	@media (min-width: 400px) {
		.hero-deck-stage {
			height: 410px;
			--card-w: 254px;
			--fan-x: 62px;
			--fan-y-r: 16px;
			--fan-y-l: 20px;
			--fan-scale: 0.86;
			--fan-rot: 7deg;
		}
	}

	@media (min-width: 640px) {
		.hero-deck-stage {
			height: 440px;
			--card-w: 285px;
			--fan-x: 104px;
			--fan-y-r: 18px;
			--fan-y-l: 22px;
			--fan-scale: 0.88;
			--fan-rot: 7deg;
		}
	}

	.deck-card {
		width: var(--card-w);
		transition:
			transform 520ms cubic-bezier(0.22, 1, 0.36, 1),
			opacity 420ms ease,
			filter 420ms ease;
		will-change: transform;
	}

	.deck-front {
		z-index: 30;
		transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
		opacity: 1;
		filter: drop-shadow(0 24px 38px rgba(18, 15, 36, 0.22));
	}

	.deck-right {
		z-index: 20;
		transform: translate3d(var(--fan-x), var(--fan-y-r), 0) rotate(var(--fan-rot)) scale(var(--fan-scale));
		opacity: 0.92;
	}

	.deck-left {
		z-index: 10;
		transform: translate3d(calc(var(--fan-x) * -1), var(--fan-y-l), 0) rotate(calc(var(--fan-rot) * -1)) scale(var(--fan-scale));
		opacity: 0.9;
	}
</style>
