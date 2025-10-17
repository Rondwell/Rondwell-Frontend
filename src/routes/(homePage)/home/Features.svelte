<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

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
	class="rounded-[30px] bg-[#FEF3F7] px-4 py-16 backdrop-blur-sm sm:px-6 md:px-20"
>
	<div class="mx-auto max-w-7xl">
		<!-- Content Grid -->
		<div
			class="bg-color flex h-auto w-full flex-col-reverse gap-6 p-5 sm:p-20 lg:flex-row lg:gap-16"
		>
			<!-- Features Section (Left on desktop, Bottom on mobile) -->
			<div class="w-full space-y-3">
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
			<div class="relative flex w-full justify-center lg:justify-end">
				<div class="h-full">
					<img
						src={featureImages[activeIndex] || '/placeholder.svg'}
						alt="Event group"
						class="w-full lg:max-w-[444px]"
						style="aspect-ratio: 16/9;"
					/>
					<p
						class="mt-4 w-full text-left text-sm font-medium text-gray-400 md:text-xl lg:max-w-[444px]"
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
	.bg-color {
		box-sizing: border-box;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 100%);
		box-shadow: inset 0px 0px 47.5964px rgba(255, 112, 166, 0.25);
		backdrop-filter: blur(11.3042px);
		border-radius: 30.9377px;
	}
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
