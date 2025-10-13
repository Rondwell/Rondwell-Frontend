<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { onMount, onDestroy } from 'svelte';

	let currentIndex = 0;
	let imagesPerSlide = 1;
	let intervalId: number;

	const allEvents = [
		{ id: 1, image: '/f1.jpg' },
		{ id: 2, image: '/f2.jpg' },
		{ id: 3, image: '/f3.jpg' },
		{ id: 4, image: '/f4.jpg' },
		{ id: 5, image: '/f5.jpg' },
		{ id: 6, image: '/f6.jpg' }
	];

	function updateImagesPerSlide() {
		const width = window.innerWidth;
		if (width >= 1024) {
			imagesPerSlide = 3; // desktop
		} else if (width >= 640) {
			imagesPerSlide = 2; // tablet
		} else {
			imagesPerSlide = 1; // mobile
		}
	}

	// Reactive events based on currentSet
	$: events = allEvents.slice(currentIndex, currentIndex + imagesPerSlide);

	onMount(() => {
		updateImagesPerSlide();
		window.addEventListener('resize', updateImagesPerSlide);

		intervalId = setInterval(() => {
			currentIndex += imagesPerSlide;

			// Wrap around
			if (currentIndex >= allEvents.length) {
				currentIndex = 0;
			}
		}, 4000);

		return () => {
			clearInterval(intervalId);
			window.removeEventListener('resize', updateImagesPerSlide);
		};
	});

	onDestroy(() => {
		clearInterval(intervalId);
	});

	const floatingIcons = [
		{ icon: '/icon4.png', delay: 0, x: 5, y: 60 },
		{ icon: '/icon6.png', delay: 1, x: 10, y: 80 },
		{ icon: '/icon3.png', delay: 2, x: 50, y: 105 },
		{ icon: '/icon5.png', delay: 0.5, x: 60, y: 10 },
		{ icon: '/icon1.png', delay: 1.5, x: 94, y: 60 },
		{ icon: '/icon2.png', delay: 2.5, x: 93, y: 75 }
	];
</script>

<!-- EVENT CARDS SECTION -->
<section class="relative px-4 py-8 sm:px-6 sm:py-16">
	<div class="mx-auto max-w-7xl">
		<div class="relative flex min-h-[500px] items-center justify-center lg:min-h-[600px]">
			<div
				class="relative z-10 flex w-full flex-wrap items-center justify-center px-2 transition-all duration-500 ease-in-out"
			>
				{#each events as event (event.id)}
					<div class="event-card">
						<img class="card-image" src={event.image} alt="event photos" />
					</div>
				{/each}
			</div>

			{#each floatingIcons as iconData}
				<div
					class="animate-float floating-icon pointer-events-none absolute z-30"
					style="
						left: {iconData.x}%; 
						top: {iconData.y}%; 
						animation-delay: {iconData.delay}s;
						transform: translate(-50%, -50%);
					"
				>
					<div
						class="rounded-xl border border-gray-100 bg-white p-1.5 shadow-md sm:rounded-2xl sm:p-2 sm:shadow-lg"
					>
						<img
							src={iconData.icon}
							alt="App icon"
							class="h-8 w-8 rounded-lg sm:h-10 sm:w-10 sm:rounded-xl lg:h-12 lg:w-12"
						/>
					</div>
				</div>
			{/each}

			<!-- Dots -->
			<!-- <div
				class="absolute bottom-2 left-1/2 z-40 flex -translate-x-1/2 transform gap-1.5 sm:bottom-4 sm:gap-2"
			>
				{#each [0, 1] as setIndex}
					<button
						class="h-2.5 w-2.5 rounded-full transition-all duration-300 sm:h-3 sm:w-3 {currentSet ===
						setIndex
							? 'bg-blue-500'
							: 'bg-gray-300'}"
						aria-label={`Go to set ${setIndex + 1}`}
						on:click={() => (currentSet = setIndex)}
					></button>
				{/each}
			</div> -->
		</div>

		<div class="mt-30 space-y-4 text-center">
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
				<img src="/Aiicon.png" alt="AI Icon" class="mr-2 h-6 w-6 object-contain" />
				Create Event with AI
			</Button>
		</div>
	</div>
</section>

<style>
	.card-image {
		border-radius: 35px;
		height: 400px;
		width: 240px;
	}

	/* Rotation and positioning by nth-child */
	.event-card:nth-child(1) {
		transform: rotate(-6deg) translateX(-30px);
		z-index: 20;
	}
	.event-card:nth-child(2) {
		transform: rotate(6deg) translateX(30px);
		z-index: 25;
	}

	@media (max-width: 639px) {
		.card-image {
			height: 380px;
			width: 220px;
		}

		.event-card:nth-child(1) {
			transform: rotate(0deg) translateX(0px);
			z-index: 20;
		}
		.event-card:nth-child(2) {
			transform: rotate(0deg) translateY(0px);
			z-index: 25;
		}
		.event-card:nth-child(3) {
			transform: rotate(0deg) translateX(0px);
			z-index: 15;
		}
	}
	@media (min-width: 1024px) {
		.card-image {
			height: 540px;
			width: 300px;
		}
		.event-card:nth-child(1) {
			transform: rotate(-6deg) translateX(-50px);
			z-index: 20;
		}
		.event-card:nth-child(2) {
			transform: rotate(0deg) translateY(-10px);
			z-index: 25;
		}
		.event-card:nth-child(3) {
			transform: rotate(6deg) translateX(50px);
			z-index: 15;
		}
	}

	/* Float animation */
	@keyframes float {
		0%,
		100% {
			transform: translate(-50%, -50%) translateY(0) rotate(0);
		}
		25% {
			transform: translate(-50%, -50%) translateY(-10px) rotate(2deg);
		}
		50% {
			transform: translate(-50%, -50%) translateY(-5px) rotate(-1deg);
		}
		75% {
			transform: translate(-50%, -50%) translateY(-15px) rotate(1deg);
		}
	}
	.animate-float {
		animation: float 4s ease-in-out infinite;
	}

	@media (max-width: 639px) {
		.floating-icon {
			opacity: 0.8;
		}
		@keyframes float {
			0%,
			100% {
				transform: translate(-50%, -50%) translateY(0) rotate(0);
			}
			25% {
				transform: translate(-50%, -50%) translateY(-5px) rotate(1deg);
			}
			50% {
				transform: translate(-50%, -50%) translateY(-2px) rotate(-0.5deg);
			}
			75% {
				transform: translate(-50%, -50%) translateY(-7px) rotate(0.5deg);
			}
		}
	}

	@media (max-width: 640px) {
		.floating-icon:nth-child(n + 5) {
			display: none;
		}
	}
</style>
