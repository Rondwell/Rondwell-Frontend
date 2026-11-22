<script lang="ts">
	import Icon from '@iconify/svelte';
	import EventCard from '$lib/components/EventCard.svelte';
	import { resolveTheme } from '$lib/utils/colors';

	interface Pillar {
		id: string;
		title: string;
		subtitle: string;
		icon: string;
		accent: string;
		paletteName: string;
		bullets: string[];
		previewEvent: Record<string, any>;
	}

	const pillars: Pillar[] = [
		{
			id: 'themes',
			title: 'Adaptive Theme Choreography',
			subtitle: 'Custom palettes flow from the event card right into the visitor browser status bar & mobile chrome.',
			icon: 'solar:palette-2-bold-duotone',
			accent: '#DB3E6C',
			paletteName: 'Light Rose',
			bullets: [
				'10 curated color themes & 10 Google display fonts',
				'Live mobile notification bar & bottom nav chrome sync',
				'Auto-synthesized artwork when covers are absent'
			],
			previewEvent: {
				id: 'pillar-themes',
				title: 'Rosewood Creative Salon & Design Showcase',
				date: 'Thu, Dec 10',
				time: '6:30 PM',
				locationDetails: { city: 'Lagos', country: 'Nigeria' },
				eventType: 'PHYSICAL',
				category: 'Design',
				price: 'Free',
				organizer: 'Rondwell Studio',
				displayPictureUrl: '/entriqs/runway-fashion.jpg',
				themeColor: 'Light Rose',
				themeFont: 'playfair',
				attendeeCount: 280
			}
		},
		{
			id: 'tickets',
			title: 'Collector Passes & QR Entry',
			subtitle: 'Multi-tier ticketing, Paystack & Stripe checkout, and millisecond offline-ready QR check-ins.',
			icon: 'solar:ticket-sale-bold-duotone',
			accent: '#AB46DD',
			paletteName: 'Midnight',
			bullets: [
				'Deterministic perforated QR pass per registration',
				'Flexible Free, Paid, Approval & Group registrations',
				'Waitlists, promo codes & instant payout settlement'
			],
			previewEvent: {
				id: 'pillar-tickets',
				title: 'Neon Frequencies Late Night Vinyl & Electronic Live Set',
				date: 'Sat, Dec 19',
				time: '10:00 PM',
				locationDetails: { city: 'London', country: 'United Kingdom' },
				eventType: 'PHYSICAL',
				category: 'Nightlife',
				price: 'Paid',
				organizer: 'Soundform UK',
				displayPictureUrl: '/entriqs/card2-concert.png',
				themeColor: 'Midnight',
				themeFont: 'unbounded',
				attendeeCount: 720
			}
		},
		{
			id: 'ecosystem',
			title: 'Speakers, Vendors & Community',
			subtitle: 'Connect exhibition booths, speaker rosters, community chatrooms, and multi-event collections in one graph.',
			icon: 'solar:users-group-rounded-bold-duotone',
			accent: '#2563EB',
			paletteName: 'Sky Blue',
			bullets: [
				'Vendor booths & speaker submission workflows',
				'Public event collections & recurring newsletters',
				'Built-in gift registries & contribution walls'
			],
			previewEvent: {
				id: 'pillar-ecosystem',
				title: 'Global Engineering & Open Source Leaders Forum',
				date: 'Tue, Dec 15',
				time: '9:30 AM',
				locationDetails: { city: 'Austin', country: 'United States' },
				eventType: 'HYBRID',
				category: 'Tech',
				price: 'Free',
				organizer: 'OSS Exchange',
				displayPictureUrl: '/entriqs/card3-mic.png',
				themeColor: 'Sky Blue',
				themeFont: 'space-grotesk',
				attendeeCount: 1450
			}
		}
	];

	let activeIndex = 0;
	$: activePillar = pillars[activeIndex];
	$: activeTheme = resolveTheme(activePillar.paletteName);
</script>

<section class="relative mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
	<div class="rounded-[32px] border border-black/8 bg-[#FAF9FC] p-6 sm:p-10 lg:p-12">
		<div class="grid items-center gap-10 lg:grid-cols-12">
			<!-- Left Pillar Controls -->
			<div class="lg:col-span-6">
				<span class="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-[#6B6878] uppercase shadow-xs">
					<Icon icon="solar:layers-minimalistic-bold-duotone" class="h-3.5 w-3.5 text-[#AB46DD]" />
					<span>Built for Modern Organizers</span>
				</span>

				<h2 class="mt-3 text-3xl font-bold tracking-tight text-[#17161E] sm:text-4xl">
					All the infrastructure behind every great room.
				</h2>

				<div class="mt-7 grid gap-3">
					{#each pillars as pillar, idx}
						{@const selected = activeIndex === idx}
						<button
							type="button"
							on:click={() => (activeIndex = idx)}
							on:mouseenter={() => (activeIndex = idx)}
							class={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-200 ${
								selected
									? 'border-black/15 bg-white shadow-[0_14px_34px_rgba(18,16,28,0.07)]'
									: 'border-transparent bg-transparent hover:bg-white/65'
							}`}
						>
							<div
								class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors"
								style={`background: ${selected ? pillar.accent : `${pillar.accent}15`}; color: ${selected ? '#FFFFFF' : pillar.accent};`}
							>
								<Icon icon={pillar.icon} class="h-5.5 w-5.5" />
							</div>

							<div class="min-w-0 flex-1">
								<h3 class="text-base font-bold text-[#17161E]">{pillar.title}</h3>
								<p class="mt-1 text-sm leading-relaxed text-[#5F5C6D]">{pillar.subtitle}</p>
								{#if selected}
									<ul class="mt-3 space-y-1.5 text-xs font-medium text-[#2E2D38]">
										{#each pillar.bullets as b}
											<li class="flex items-center gap-2">
												<Icon icon="solar:check-circle-bold" class="h-4 w-4 shrink-0" style={`color: ${pillar.accent};`} />
												<span>{b}</span>
											</li>
										{/each}
									</ul>
								{/if}
							</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- Right Interactive Live Card & Chrome Preview -->
			<div class="lg:col-span-6">
				<div
					class="relative overflow-hidden rounded-3xl border border-black/10 p-6 transition-colors duration-300 sm:p-8"
					style={`background: linear-gradient(155deg, ${activeTheme.bg} 0%, ${activeTheme.cover} 100%);`}
				>
					<!-- Simulated Mobile Top Chrome Pill showing native color sync -->
					<div class="mb-5 flex items-center justify-between rounded-2xl border border-black/10 bg-white/75 px-3.5 py-2 text-[11px] font-semibold text-[#17161E] backdrop-blur-md">
						<span class="inline-flex items-center gap-2">
							<span class="h-2.5 w-2.5 rounded-full" style={`background: ${activePillar.accent};`}></span>
							Native Chrome · {activePillar.paletteName}
						</span>
						<span class="font-mono text-[10px] text-[#6B6878]">rondwell.com/e/live</span>
					</div>

					<div class="mx-auto max-w-[310px]">
						<EventCard
							event={activePillar.previewEvent}
							variant="ticket"
							disableLink={true}
							interactiveTilt={true}
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
