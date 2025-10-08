<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Button from '$lib/components/Button.svelte';

	// Hero section image slider
	let heroImages = ['hero-event-1.png', 'hero-event-2.png', 'hero-event-1.png', 'hero-event-2.png'];
	let currentImageIndex = 0;
	let imageIntervalId: number;

	// Stack slide animation setup
	type StackItem = {
		id: number;
		bottom: number;
		left: number;
		z: number;
		width: number;
	};

	function getLeftOffset(width: number): number {
		const containerWidth = 440; // Same as the container
		const cardWidth = (Number(width) / 100) * containerWidth;
		return (containerWidth - cardWidth) / 2;
	}

	let stackItems: StackItem[] = [
		{ id: 1, bottom: -60, originalBottom: -60, width: 86 },
		{ id: 2, bottom: -40, originalBottom: -40, width: 89 },
		{ id: 3, bottom: -20, originalBottom: -20, width: 92 }
	].map((item, i) => ({
		...item,
		left: getLeftOffset(item.width),
		z: i + 1
	}));

	let stackIntervalId: number;

	const widthPresets = [85, 90, 95];

	onMount(() => {
		imageIntervalId = setInterval(() => {
			currentImageIndex = (currentImageIndex + 1) % heroImages.length;
		}, 4000);

		stackIntervalId = setInterval(() => {
			// Move each item up
			stackItems = stackItems.map((item) => ({
				...item,
				bottom: item.bottom + 20
			}));

			// Reset items that go above
			stackItems = stackItems.map((item) => {
				if (item.bottom > -20) {
					return {
						...item,
						bottom: -60
					};
				}
				return item;
			});

			const reSorted = [...stackItems].sort((a, b) => a.bottom - b.bottom);
			stackItems = reSorted.map((item, i) => {
				const width = widthPresets[i];
				const left = getLeftOffset(width);
				return {
					...item,
					width,
					left,
					z: i + 1
				};
			});
		}, 4000);
	});

	onDestroy(() => {
		clearInterval(imageIntervalId);
		clearInterval(stackIntervalId);
	});
</script>

<!-- HERO SECTION -->
<section class="relative overflow-hidden px-2 pt-10 pb-0 md:px-16 lg:pt-20">
	<div class="absolute w-full">
		<img src="grid-bg.png" alt="" class="w-full opacity-20" />
	</div>

	<div class="mx-auto max-w-7xl">
		<div class="grid items-center gap-12 lg:grid-cols-2">
			<!-- LEFT -->
			<div class="relative z-10 space-y-8 text-center lg:text-left">
				<div class="space-y-4">
					<h1 class="text-5xl leading-tight font-bold text-[#000000] lg:text-6xl">
						Organize
						<span
							class="bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] bg-clip-text text-transparent"
						>
							Unforgettable
						</span>
						<br />
						<span
							class="bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] bg-clip-text text-transparent"
						>
							Events.
						</span>
					</h1>

					<p
						class="mx-auto max-w-[566px] text-[22px] leading-[40px] text-[#686768] md:text-[24px] lg:mx-0 lg:text-left"
					>
						Rondwell brings organizers, attendees, exhibitors and vendors together to create
						unforgettable experiences.
					</p>
				</div>

				<div class="flex flex-wrap items-center justify-center gap-6 lg:justify-start">
					<Button
						class="flex h-[60px] w-[300px] items-center justify-center gap-2 rounded-[13px] bg-[#333537] px-8 py-3 text-center text-[20px] text-white transition-colors duration-200 hover:bg-gray-900 hover:text-white"
					>
						<img src="/Aiicon.png" alt="AI Icon" class="h-6 w-6 object-contain" />
						Create Event with AI
					</Button>
				</div>
			</div>

			<!-- RIGHT -->
			<div class="relative flex h-full min-h-[580px] w-full justify-center lg:justify-end">
				<div
					class="relative container mx-auto h-full max-h-[395px] w-full max-w-[340px] md:max-h-[514px] md:max-w-[445px]"
				>
					<div class="gradient-border-wrapper h-full w-full">
						<div class="gradient-border relative h-full w-full overflow-hidden p-2">
							{#each heroImages as img, i (i)}
								<div
									class="image-container w-full max-w-[315px] md:max-w-[420px]"
									class:active={i === currentImageIndex}
									style="z-index: {heroImages.length - i};"
								>
									<img
										src={img}
										alt="Event attendees"
										class="h-auto w-full rounded-xl object-cover"
									/>
								</div>
							{/each}
						</div>
					</div>

					<!-- Animated Stack Slides -->
					<div class="relative w-full max-w-[340px] md:max-w-[440px]">
						{#each stackItems as item (item.id)}
							<div
								class="stack-slide border-2 border-amber-400"
								style="bottom: {item.bottom}px; left: {item.left}px; z-index: {item.z}; width: {item.width}%"
							></div>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<!-- STACKED FLOATING CARDS BELOW -->
		<div class="relative z-20 mt-10 mb-0 flex flex-col items-center md:mt-20">
			<div
				class="relative z-30 flex h-[48px] w-[320px] items-center justify-center rounded-full border-[3px] border-white bg-[rgba(255,255,255,0.65)] text-[12px] font-medium whitespace-nowrap text-[#3D235E] shadow-xl backdrop-blur-md"
			>
				<span class="flex items-center gap-2">
					<img src="/heart-icon.png" alt="Heart" class="h-4 w-4" />
					Trusted by over 100,000 people worldwide.
				</span>
			</div>

			<div
				class="glass-card relative z-20 -mt-8 flex h-[70px] w-[280px] items-center justify-center rounded-2xl border-[3px] border-white bg-[rgba(255,255,255,0.65)] text-[12px] font-medium text-[#3D3D4E]"
			>
				<div class="mt-6">See Latest Events</div>
			</div>

			<div
				class="relative z-10 mt-[-21px] flex h-[58px] w-[58px] items-center justify-center rounded-full border-[3px] border-white bg-[rgba(255,255,255,0.65)]"
			>
				<img src="/arrow-down.png" alt="Arrow Down" class="absolute bottom-3 h-3 w-5" />
			</div>
		</div>
	</div>
</section>

<style>
	.gradient-border-wrapper {
		position: relative;
		padding: 4px;
		border-radius: 25.3442px;
		display: inline-block;
		overflow: hidden;
		z-index: 5;
		box-shadow: inset 0px 0px 25.3442px rgba(255, 112, 166, 0.75);
		filter: drop-shadow(0 0 4px rgba(215, 103, 255, 0.6));
	}

	.gradient-border-wrapper::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		border-radius: inherit;
		background: repeating-conic-gradient(
			from 0deg,
			#f3d7d7 0deg 15deg,
			#d767ff 0deg 30deg,
			#ffa1c6 30deg 60deg,
			#ff5595 60deg 90deg,
			#ffcade 90deg 120deg,
			#d767ff 120deg 150deg,
			#ffc37c 150deg 180deg
		);
		background-size: 400% 400%;
		animation: move-gradient 10s linear infinite;
	}

	@keyframes move-gradient {
		0% {
			background-position: 0% 0%;
		}
		100% {
			background-position: 100% 0%;
		}
	}

	.gradient-border {
		background: rgb(251, 242, 242);
		box-shadow: inset 0px 0px 25.3442px rgba(255, 112, 166, 0.25);
		backdrop-filter: blur(11.9808px);
		border-radius: 25.3442px;
		animation: floatUpDown 4s ease-in-out infinite;
	}

	@keyframes floatUpDown {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-3px);
		}
	}

	.image-container {
		position: absolute;
		top: 2;
		left: 2;
		height: 100%;
		opacity: 0;
		transform: translateY(5px);
		transition:
			opacity 1s ease-in-out,
			transform 1s ease-in-out;
		pointer-events: none;
	}

	.image-container.active {
		opacity: 1;
		transform: translateY(0);
		pointer-events: auto;
	}

	.stack-slide {
		position: absolute;
		width: 398.21px;
		height: 115.43px;
		right: 20px;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 100%);
		box-shadow: inset 0px 0px 19.5639px rgba(255, 112, 166, 0.25);
		backdrop-filter: blur(4.64644px);
		border-radius: 12.7166px;
		transition: bottom 1s ease-in-out;
	}

	.glass-card {
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6));
		border: 1px solid rgba(255, 255, 255, 0.4);
		border-radius: 12px;
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
		transition: all 0.3s ease;
	}

	.glass-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 12px 25px rgba(0, 0, 0, 0.25);
	}
</style>
