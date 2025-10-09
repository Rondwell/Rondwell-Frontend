<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Button from '$lib/components/Button.svelte';

	let features = [
		{ icon: '/ico1.png', title: 'Ticket Sales and Group ticketing', color: 'bg-purple-100' },
		{ icon: '/ico2.png', title: 'Event communities and forums', color: 'bg-pink-100' },
		{ icon: '/ico3.png', title: 'Seating and capacity management', color: 'bg-blue-100' },
		{ icon: '/ico3.png', title: 'Multimodal check-in system', color: 'bg-blue-100' },
		{ icon: '/ico3.png', title: 'Vendor, Speaker & Exhibitor Management', color: 'bg-blue-100' }
	];

	let featureImages = [
		'/hero2.png', // Ticket Sales
		'/hero1.png', // Event communities
		'/hero2.png', // Seating management
		'/hero1.png', // Multimodal check-in
		'/hero2.png' // Vendor management
	];

	let activeIndex = 0;
	let interval: number;
	let sectionVisible = false;
	let userHovered = false;

	function startAutoCycle() {
		interval = setInterval(() => {
			if (!userHovered && sectionVisible) {
				activeIndex = (activeIndex + 1) % features.length;
			}
		}, 3000); // Change image every 3s
	}

	function stopAutoCycle() {
		clearInterval(interval);
	}

	let sectionRef: any;

	// Observe visibility of section
	onMount(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				sectionVisible = entry.isIntersecting;
				if (sectionVisible) {
					startAutoCycle();
				} else {
					stopAutoCycle();
				}
			},
			{
				threshold: 0.3 // Trigger when ~30% is visible
			}
		);

		if (sectionRef) observer.observe(sectionRef);

		return () => {
			stopAutoCycle();
			if (sectionRef) observer.disconnect();
		};
	});
</script>

<section
	bind:this={sectionRef}
	class="rounded-[30px] bg-[#ffe0f0]/20 px-4 py-16 backdrop-blur-sm sm:px-6"
>
	<div class="mx-auto max-w-7xl">
		<!-- Section Header -->
		<div class="mb-12 space-y-4 text-center sm:mb-16">
			<h2 class="text-3xl font-semibold text-[#000000] sm:text-4xl md:text-5xl">
				Rondwell
				<span
					class="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text font-semibold text-transparent"
				>
					Events.
				</span>
			</h2>
			<p class="mx-auto max-w-2xl text-base text-balance text-[#686768] sm:text-lg">
				Organize any kind of event on Rondwell, manage your event pages, embeddings, attendees,
				accept payments in multiple currencies.
			</p>
			<Button
				class="h-[52px] w-full rounded-[13px] bg-[#333537] px-6 py-3 text-center 
               text-[18px] text-white transition-colors duration-200 sm:h-[60px] sm:w-[300px] sm:px-8 sm:text-[20px]"
			>
				<img src="/Aiicon.png" alt="AI Icon" class="h-6 w-6 object-contain" />
				Create Event with AI
			</Button>
		</div>

		<!-- Content Grid -->
		<div class="grid grid-cols-1 items-center gap-10 sm:gap-12 lg:grid-cols-2">
			<div
				class="mx-auto flex h-auto w-full flex-col gap-6 rounded-[24px] border
            border-pink-100 bg-gradient-to-br from-[#ffe0f0]
            via-white to-[#fce7f3] px-4 py-6 shadow-lg
            shadow-pink-200/50 sm:px-6 sm:py-10 lg:h-[528px]
            lg:w-[1257px] lg:flex-row lg:gap-16"
			>
				<!-- Features Section (Left on desktop, Bottom on mobile) -->
				<div class="order-2 w-full flex-1 space-y-3 lg:order-1">
					{#each features as feature, index (index)}
						<div
							class="feature-border {index === activeIndex ? 'active' : ''}"
							role="button"
							tabindex="-1"
							on:mouseenter={() => (activeIndex = index)}
						>
							<div class="inner flex items-center gap-2 md:gap-4">
								<!-- Icon -->
								<div
									class={`h-9 w-9 md:h-12 md:w-12 ${feature.color} flex items-center justify-center rounded-xl`}
								>
									<img src={feature.icon} alt={feature.title} class="h-5 w-5 md:h-7 md:w-7" />
								</div>
								<!-- Text -->
								<span class="text-xs font-medium text-gray-900 sm:text-base md:text-lg">
									{feature.title}
								</span>
							</div>
						</div>
					{/each}
				</div>

				<!-- Card Section (Right on desktop, Top on mobile) -->
				<div
					class="relative order-1 flex w-full flex-1 flex-col items-center text-center lg:order-2"
				>
					<img
						src={featureImages[activeIndex] || '/placeholder.svg'}
						alt="Event group"
						class="w-full lg:max-w-[444px]"
						style="aspect-ratio: 16/9;"
					/>
					<p
						class="mt-4 w-full text-center text-sm font-medium text-gray-400 md:text-xl lg:max-w-[444px] lg:text-left"
					>
						Rondwell brings organizers, attendees, and professionals together to create
						unforgettable experiences.
					</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Features List -->
<style>
	.feature-border {
		position: relative;
		width: 100%;
		height: 66px;
		border-radius: 16px;
		padding: 2px;
		background: #eff0f0;
		transition: background 0.3s ease;
	}

	.feature-border.active {
		background: linear-gradient(90deg, #eff0f0 13%, #ab46dd 28%, #ab46dd 56%, #eff0f0 88%);
		background-size: 200% auto;
		animation: border-rotate 2s linear infinite;
	}

	@keyframes border-rotate {
		0% {
			background-position: 0% 50%;
		}
		100% {
			background-position: 200% 50%;
		}
	}

	.feature-border .inner {
		width: 100%;
		height: 100%;
		background: white;
		border-radius: 14px;
		display: flex;
		align-items: center;
		padding-left: 1rem;
	}
</style>
