<script lang="ts">
	import Icon from '@iconify/svelte';
	import EventCard from '$lib/components/EventCard.svelte';
	import EventQrCode from '$lib/components/EventQrCode.svelte';
	import {
		formatEventStubDates,
		formatSmartLocation,
		formatSmartTitle,
		resolveEventCardDesign
	} from '$lib/utils/eventCardDesign';

	interface EditionCard {
		id: string;
		deck: 'featured' | 'curated';
		badge: string;
		description: string;
		highlightEcosystem: string;
		event: Record<string, any>;
	}

	const ecosystemNodes = [
		{ id: 'ticketing', label: 'Smart Passes', icon: 'solar:ticket-bold-duotone', color: '#DB3E6C' },
		{ id: 'themes', label: 'Custom Themes', icon: 'solar:palette-2-bold-duotone', color: '#AB46DD' },
		{ id: 'checkin', label: 'QR Check-In', icon: 'solar:qr-code-bold-duotone', color: '#2563EB' },
		{ id: 'booths', label: 'Vendor Booths', icon: 'solar:shop-bold-duotone', color: '#EA580C' },
		{ id: 'stages', label: 'Live Stages', icon: 'solar:videocamera-record-bold-duotone', color: '#059669' },
		{ id: 'collections', label: 'Collections', icon: 'solar:layers-bold-duotone', color: '#7C3AED' }
	];

	const editions: EditionCard[] = [
		{
			id: 'midnight-concert',
			deck: 'featured',
			badge: 'Full-Bleed Acoustic Poster',
			description: 'Full-bleed stage photography paired with luminous high-contrast ticket stubs for tours, raves, and festivals.',
			highlightEcosystem: 'ticketing',
			event: {
				id: 'ed-midnight-concert',
				title: 'Neon Echoes World Tour: Live Under The Rotunda',
				date: 'Fri, Nov 27',
				time: '9:00 PM',
				locationDetails: { city: 'Lagos', country: 'Nigeria', venueName: 'Eko Convention Centre' },
				eventType: 'PHYSICAL',
				category: 'Concert',
				price: 'Paid',
				organizer: 'Velvet Noise',
				displayPictureUrl: '/entriqs/card2-concert.png',
				themeColor: 'Midnight',
				themeFont: 'bebas',
				attendeeCount: 1200
			}
		},
		{
			id: 'tech-keynote',
			deck: 'featured',
			badge: 'Standalone Cutout Frame',
			description: 'Balances crisp display headlines with a freestanding speaker/workshop vignette so long event names breathe effortlessly.',
			highlightEcosystem: 'stages',
			event: {
				id: 'ed-tech-keynote',
				title: 'Founders & Product Builders: Building Resilient Consumer Software',
				date: 'Wed, Dec 02',
				time: '2:00 PM',
				locationDetails: { city: 'San Francisco', country: 'United States' },
				eventType: 'HYBRID',
				category: 'Keynote',
				price: 'Free',
				organizer: 'Stack Guild',
				displayPictureUrl: '/entriqs/card3-mic.png',
				themeColor: 'Orchid',
				themeFont: 'space-grotesk',
				attendeeCount: 540
			}
		},
		{
			id: 'atelier-wedding',
			deck: 'featured',
			badge: 'Editorial Arch Frame',
			description: 'Warm champagne gallery arch framing with serif typography and RSVP stubs crafted for private salons and galas.',
			highlightEcosystem: 'themes',
			event: {
				id: 'ed-atelier-wedding',
				title: 'The Rosewood Garden Banquet & Evening Reception',
				date: 'Sat, Dec 12',
				time: '4:30 PM',
				locationDetails: { city: 'Napa Valley', country: 'United States' },
				eventType: 'PHYSICAL',
				category: 'Wedding & Gala',
				price: 'RSVP',
				organizer: 'Clara & Theo Atelier',
				displayPictureUrl: '/entriqs/card5-wedding.png',
				themeColor: 'Light Apricot',
				themeFont: 'playfair',
				attendeeCount: 180
			}
		},
		{
			id: 'ceramic-exhibition',
			deck: 'curated',
			badge: 'Gallery Arch Edition',
			description: 'Sculptural exhibition card combining exhibition imagery with minimalist collector codes and location compression.',
			highlightEcosystem: 'collections',
			event: {
				id: 'ed-ceramic-exhibition',
				title: 'Terra & Form: Contemporary Ceramic Sculpture Exhibition',
				date: 'Thu, Dec 10',
				time: '6:00 PM',
				locationDetails: { city: 'Kyoto', country: 'Japan' },
				eventType: 'PHYSICAL',
				category: 'Art Exhibition',
				price: 'Free',
				organizer: 'Kamo Art Space',
				displayPictureUrl: '/entriqs/gallery-ceramic.jpg',
				themeColor: 'Coffee Brown',
				themeFont: 'fraunces',
				attendeeCount: 230
			}
		},
		{
			id: 'night-motorsport',
			deck: 'featured',
			badge: 'Swiss Split Pass',
			description: 'High-octane editorial layout merging split photography, paddock telemetry badges, and instant paddock QR entry.',
			highlightEcosystem: 'checkin',
			event: {
				id: 'ed-night-motorsport',
				title: 'Apex Night Circuit: Endurance Drift & Paddock Club Experience',
				date: 'Sat, Dec 19',
				time: '10:30 PM',
				locationDetails: { city: 'Dubai', country: 'United Arab Emirates' },
				eventType: 'PHYSICAL',
				category: 'Motorsport',
				price: 'Paid',
				organizer: 'Apex Racing',
				displayPictureUrl: '/entriqs/night-motorsport.jpg',
				themeColor: 'Midnight',
				themeFont: 'unbounded',
				attendeeCount: 680
			}
		},
		{
			id: 'runway-editorial',
			deck: 'curated',
			badge: 'Runway Arched Pass',
			description: 'Fashion-week front-row pass automatically adapting mobile toolbar chrome to the organizer palette.',
			highlightEcosystem: 'themes',
			event: {
				id: 'ed-runway-editorial',
				title: 'A/W 26 Avant-Garde Fashion Week Runway Presentation',
				date: 'Fri, Dec 18',
				time: '7:30 PM',
				locationDetails: { city: 'Milan', country: 'Italy' },
				eventType: 'PHYSICAL',
				category: 'Fashion',
				price: 'Invite',
				organizer: 'Studio Veloce',
				displayPictureUrl: '/entriqs/runway-fashion.jpg',
				themeColor: 'Light Rose',
				themeFont: 'playfair',
				attendeeCount: 310
			}
		},
		{
			id: 'supper-culinary',
			deck: 'curated',
			badge: 'Chef Table Split',
			description: 'Warm dining experience card showcasing tasting menu timing, intimate venue pill, and dietary guest collection.',
			highlightEcosystem: 'booths',
			event: {
				id: 'ed-supper-culinary',
				title: 'Candlelit Botanical Supper Club & Natural Wine Pairing',
				date: 'Sun, Dec 20',
				time: '7:00 PM',
				locationDetails: { city: 'London', country: 'United Kingdom' },
				eventType: 'PHYSICAL',
				category: 'Culinary',
				price: 'Paid',
				organizer: 'Hearth & Fig',
				displayPictureUrl: '/entriqs/supper-culinary.jpg',
				themeColor: 'Pale Green',
				themeFont: 'fraunces',
				attendeeCount: 48
			}
		},
		{
			id: 'proc-tech-grid',
			deck: 'featured',
			badge: 'Generative Tech Matrix',
			description: 'When no cover image is uploaded, tech & AI events automatically generate a blueprint coordinate grid.',
			highlightEcosystem: 'stages',
			event: {
				id: 'ed-proc-tech',
				title: 'Distributed Systems & Local-First Web Architecture Hackathon',
				date: 'Tue, Dec 08',
				time: '9:00 AM',
				locationDetails: { city: 'Berlin', country: 'Germany' },
				eventType: 'VIRTUAL',
				category: 'Tech & AI',
				price: 'Free',
				organizer: 'ZeroLatency Collective',
				displayPictureUrl: '',
				themeColor: 'Midnight',
				themeFont: 'geist-mono',
				attendeeCount: 950
			}
		},
		{
			id: 'proc-vinyl',
			deck: 'curated',
			badge: 'Generative Vinyl Grooves',
			description: 'Music and audio events without flyer images synthesize acoustic vinyl artwork matching the host palette.',
			highlightEcosystem: 'ticketing',
			event: {
				id: 'ed-proc-vinyl',
				title: 'Afterhours Vinyl Listening Session & Rare Pressing Exchange',
				date: 'Fri, Dec 11',
				time: '11:00 PM',
				locationDetails: { city: 'Accra', country: 'Ghana' },
				eventType: 'PHYSICAL',
				category: 'Audio & DJ',
				price: 'Free',
				organizer: 'Analog Sound Room',
				displayPictureUrl: '',
				themeColor: 'pastel purple',
				themeFont: 'space-grotesk',
				attendeeCount: 140
			}
		},
		{
			id: 'proc-solar',
			deck: 'curated',
			badge: 'Generative Solar Dial',
			description: 'Outdoor, wellness, and community mornings come alive with radiant orbital dials and crisp venue compression.',
			highlightEcosystem: 'collections',
			event: {
				id: 'ed-proc-solar',
				title: 'Sunrise Rooftop Breathwork, Cold Plunge & Community Matcha',
				date: 'Sat, Dec 05',
				time: '7:00 AM',
				locationDetails: { city: 'Cape Town', country: 'South Africa' },
				eventType: 'PHYSICAL',
				category: 'Wellness',
				price: 'Paid',
				organizer: 'Solstice Club',
				displayPictureUrl: '',
				themeColor: 'Light Apricot',
				themeFont: 'jakarta',
				attendeeCount: 85
			}
		},
		{
			id: 'proc-lattice',
			deck: 'curated',
			badge: 'Generative Lattice Seal',
			description: 'Architectural geometric latticework for executive forums, private dinners, and curated member salons.',
			highlightEcosystem: 'booths',
			event: {
				id: 'ed-proc-lattice',
				title: 'Private Venture Roundtable & Emerging Markets Forum',
				date: 'Wed, Dec 16',
				time: '5:30 PM',
				locationDetails: { city: 'Nairobi', country: 'Kenya' },
				eventType: 'PHYSICAL',
				category: 'Business',
				price: 'Invite',
				organizer: 'Meridian Partners',
				displayPictureUrl: '',
				themeColor: 'Coffee Brown',
				themeFont: 'playfair',
				attendeeCount: 60
			}
		}
	];

	let activeDeck: 'all' | 'featured' | 'curated' = 'all';
	let activeEcoFilter: string | null = null;
	let selectedEdition: EditionCard | null = null;
	let scrollStrip: HTMLDivElement | null = null;

	$: filteredEditions = editions.filter((item) => {
		const deckMatch = activeDeck === 'all' || item.deck === activeDeck;
		const ecoMatch = !activeEcoFilter || item.highlightEcosystem === activeEcoFilter;
		return deckMatch && ecoMatch;
	});

	$: modalDesign = selectedEdition ? resolveEventCardDesign(selectedEdition.event) : null;
	$: modalTitle = selectedEdition ? formatSmartTitle(selectedEdition.event.title) : null;
	$: modalLocation = selectedEdition ? formatSmartLocation(selectedEdition.event) : null;
	$: modalDates = selectedEdition
		? formatEventStubDates(null, null, selectedEdition.event.date, selectedEdition.event.time)
		: null;

	function scrollDeck(direction: -1 | 1) {
		if (!scrollStrip) return;
		const step = Math.min(scrollStrip.clientWidth * 0.85, 360);
		scrollStrip.scrollBy({ left: direction * step, behavior: 'smooth' });
	}

	function toggleEcosystemNode(id: string) {
		activeEcoFilter = activeEcoFilter === id ? null : id;
	}
</script>

<section class="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 md:py-16 lg:px-8">
	<!-- Section Header + Deck Switcher -->
	<div class="flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
		<div>
			<div class="inline-flex items-center gap-2 rounded-full border border-[#AB46DD]/20 bg-white/80 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-[#7A35A1] uppercase backdrop-blur-sm">
				<Icon icon="solar:magic-stick-3-bold-duotone" class="h-3.5 w-3.5" />
				<span>11 Event Archetypes · Zero Generic Cards</span>
			</div>
			<h2 class="mt-3 text-3xl font-bold tracking-tight text-[#17161E] sm:text-4xl">
				Every format gets its own stage.
			</h2>
			<p class="mt-2 max-w-2xl text-sm leading-relaxed text-[#585663] sm:text-base">
				Rondwell adapts typography, framing, location labels, and generative artwork around your
				event theme — whether it has bespoke photography or starts with pure metadata.
			</p>
		</div>

		<!-- Deck Filter Pills -->
		<div class="flex flex-wrap items-center gap-1.5 rounded-2xl border border-black/8 bg-white/80 p-1.5 shadow-xs backdrop-blur-md">
			<button
				type="button"
				on:click={() => {
					activeDeck = 'all';
					activeEcoFilter = null;
				}}
				class={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
					activeDeck === 'all' && !activeEcoFilter
						? 'bg-[#17161E] text-white shadow-xs'
						: 'text-[#555362] hover:bg-black/5'
				}`}
			>
				All Editions ({editions.length})
			</button>
			<button
				type="button"
				on:click={() => {
					activeDeck = 'featured';
					activeEcoFilter = null;
				}}
				class={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
					activeDeck === 'featured'
						? 'bg-[#DB3E6C] text-white shadow-xs'
						: 'text-[#555362] hover:bg-black/5'
				}`}
			>
				Featured (5)
			</button>
			<button
				type="button"
				on:click={() => {
					activeDeck = 'curated';
					activeEcoFilter = null;
				}}
				class={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
					activeDeck === 'curated'
						? 'bg-[#AB46DD] text-white shadow-xs'
						: 'text-[#555362] hover:bg-black/5'
				}`}
			>
				Curated (6)
			</button>
		</div>
	</div>

	<!-- Ecosystem Orbit Bar (Interactive Pill Strip on ALL breakpoints — cleanly scannable on mobile, orbital halo feel on desktop!) -->
	<div class="mt-7 flex items-center justify-between gap-4">
		<div class="no-scrollbar flex flex-1 items-center gap-2.5 overflow-x-auto pb-1">
			{#each ecosystemNodes as node}
				{@const isSelected = activeEcoFilter === node.id}
				<button
					type="button"
					on:click={() => toggleEcosystemNode(node.id)}
					class={`group inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
						isSelected
							? 'border-[#17161E] bg-[#17161E] text-white shadow-md scale-[1.02]'
							: 'border-black/8 bg-white/85 text-[#2E2D38] shadow-xs hover:-translate-y-0.5 hover:border-black/20 hover:bg-white'
					}`}
				>
					<span
						class="flex h-6 w-6 items-center justify-center rounded-full transition-transform group-hover:scale-110"
						style={`background: ${isSelected ? 'rgba(255,255,255,0.16)' : `${node.color}18`}; color: ${isSelected ? '#FFFFFF' : node.color};`}
					>
						<Icon icon={node.icon} class="h-3.5 w-3.5" />
					</span>
					<span>{node.label}</span>
				</button>
			{/each}
		</div>

		<!-- Desktop Carousel Prev/Next Controls -->
		<div class="hidden shrink-0 items-center gap-2 md:flex">
			<button
				type="button"
				aria-label="Scroll previous editions"
				on:click={() => scrollDeck(-1)}
				class="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/90 text-[#17161E] shadow-xs transition hover:bg-white active:scale-95"
			>
				<Icon icon="solar:arrow-left-linear" class="h-4.5 w-4.5" />
			</button>
			<button
				type="button"
				aria-label="Scroll next editions"
				on:click={() => scrollDeck(1)}
				class="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/90 text-[#17161E] shadow-xs transition hover:bg-white active:scale-95"
			>
				<Icon icon="solar:arrow-right-linear" class="h-4.5 w-4.5" />
			</button>
		</div>
	</div>

	<!-- Smooth Horizontal Snap Deck on Mobile + Multi-Card Carousel Strip on Desktop -->
	<div
		bind:this={scrollStrip}
		class="no-scrollbar mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pt-2 pb-6"
	>
		{#each filteredEditions as edition (edition.id)}
			<div class="flex w-[80vw] max-w-[305px] shrink-0 snap-center flex-col sm:w-[290px]">
				<button
					type="button"
					on:click={() => (selectedEdition = edition)}
					class="w-full cursor-pointer text-left focus:outline-none"
				>
					<EventCard
						event={edition.event}
						variant="ticket"
						disableLink={true}
						interactiveTilt={true}
					/>
				</button>

				<div class="mt-3 flex items-center justify-between px-2">
					<span class="text-xs font-semibold text-[#3C3A47]">{edition.badge}</span>
					<button
						type="button"
						on:click={() => (selectedEdition = edition)}
						class="inline-flex items-center gap-1 text-xs font-semibold text-[#AB46DD] hover:underline"
					>
						<span>Inspect</span>
						<Icon icon="solar:eye-linear" class="h-3.5 w-3.5" />
					</button>
				</div>
			</div>
		{/each}
	</div>

	<!-- Bottom CTA Bar -->
	<div class="mt-4 flex flex-col items-center justify-between gap-4 rounded-3xl border border-black/8 bg-white/75 p-5 backdrop-blur-md sm:flex-row sm:px-7">
		<div class="text-center sm:text-left">
			<p class="text-sm font-bold text-[#17161E]">
				Tap any collector pass above to inspect its dynamic theme, smart title split, and QR stub.
			</p>
			<p class="mt-0.5 text-xs text-[#6B6878]">
				Full venue addresses live inside the event page while cards keep listings clean with 2-word city cues.
			</p>
		</div>
		<a
			href="/create-event"
			class="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#17161E] px-5 text-sm font-semibold text-white no-underline shadow-sm transition hover:bg-[#2C2C34]"
		>
			<img src="/Aiicon.svg" alt="" class="h-4.5 w-4.5 brightness-0 invert" />
			<span>Launch Your Event</span>
		</a>
	</div>
</section>

<!-- Interactive Collector Ticket Detail Modal -->
{#if selectedEdition && modalDesign && modalTitle && modalLocation && modalDates}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-label={modalTitle.full}
		tabindex="-1"
		on:keydown={(e) => {
			if (e.key === 'Escape') selectedEdition = null;
		}}
		on:click|self={() => (selectedEdition = null)}
	>
		<div class="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-white p-6 shadow-2xl">
			<button
				type="button"
				aria-label="Close card inspector"
				on:click={() => (selectedEdition = null)}
				class="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-[#17161E] transition hover:bg-black/10"
			>
				<Icon icon="solar:close-circle-linear" class="h-5 w-5" />
			</button>

			<div class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase" style={`background: ${modalDesign.accentColor}15; color: ${modalDesign.accentColor};`}>
				<span>{selectedEdition.badge}</span>
			</div>

			<h3 class="mt-3 pr-8 text-xl font-bold text-[#17161E]">
				{modalTitle.full}
			</h3>
			<p class="mt-2 text-sm leading-relaxed text-[#555362]">
				{selectedEdition.description}
			</p>

			<div class="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-black/8 bg-[#FAF9FC] p-4 text-xs">
				<div>
					<p class="font-semibold text-[#878495] uppercase">Card Compressed Location</p>
					<p class="mt-0.5 font-bold text-[#17161E]">{modalLocation.short}</p>
				</div>
				<div>
					<p class="font-semibold text-[#878495] uppercase">Full Event Page Address</p>
					<p class="mt-0.5 font-medium text-[#3F3D4A]">{modalLocation.full}</p>
				</div>
				<div>
					<p class="font-semibold text-[#878495] uppercase">Theme Palette</p>
					<p class="mt-0.5 flex items-center gap-1.5 font-bold text-[#17161E]">
						<span class="inline-block h-3 w-3 rounded-full border border-black/15" style={`background: ${modalDesign.accentColor};`}></span>
						{modalDesign.palette.name}
					</p>
				</div>
				<div>
					<p class="font-semibold text-[#878495] uppercase">Display Typography</p>
					<p class="mt-0.5 font-bold text-[#17161E]">{modalDesign.font.label}</p>
				</div>
			</div>

			<div class="mt-5 flex items-center justify-between gap-4 border-t border-black/8 pt-4">
				<div class="flex items-center gap-3">
					<div class="rounded-xl border border-black/10 bg-white p-1.5">
						<EventQrCode seed={selectedEdition.id} size={52} fg="#17161E" bg="#FFFFFF" />
					</div>
					<div class="text-xs">
						<p class="font-bold text-[#17161E]">{modalDates.month} {modalDates.day} · {modalDates.timeShort}</p>
						<p class="text-[#6B6878]">{modalDesign.codeLabel} · Instant QR Pass</p>
					</div>
				</div>

				<a
					href="/create-event"
					class="inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#DB3E6C] to-[#AB46DD] px-5 text-xs font-semibold text-white no-underline shadow-sm transition hover:opacity-95"
				>
					<span>Create Like This</span>
					<Icon icon="solar:arrow-right-linear" class="h-3.5 w-3.5" />
				</a>
			</div>
		</div>
	</div>
{/if}

<style>
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
</style>
