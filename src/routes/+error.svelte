<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';
	import { onMount } from 'svelte';

	let mounted = false;
	let floatingItems: { x: number; y: number; size: number; delay: number; duration: number }[] = [];

	onMount(() => {
		mounted = true;
		// Generate random floating particles
		floatingItems = Array.from({ length: 20 }, () => ({
			x: Math.random() * 100,
			y: Math.random() * 100,
			size: Math.random() * 6 + 2,
			delay: Math.random() * 5,
			duration: Math.random() * 4 + 4
		}));
	});

	$: status = $page.status;
	$: message = $page.error?.message || 'Something went wrong';
</script>

<svelte:head>
	<title>{status} — Rondwell</title>
</svelte:head>

<section class="error-page relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
	<!-- Gradient highlight orbs -->
	<div class="highlight highlight-1"></div>
	<div class="highlight highlight-2"></div>
	<div class="highlight highlight-3"></div>
	<div class="highlight highlight-4"></div>

	<!-- Grid background overlay -->
	<div class="grid-overlay"></div>

	<!-- Floating particles -->
	{#each floatingItems as particle}
		<span
			class="floating-particle"
			style="
				left: {particle.x}%;
				top: {particle.y}%;
				width: {particle.size}px;
				height: {particle.size}px;
				animation-delay: {particle.delay}s;
				animation-duration: {particle.duration}s;
			"
		></span>
	{/each}

	<div class="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
		<!-- Animated wavy error code -->
		<div class="error-code-wrapper" class:mounted>
			<svg viewBox="0 0 480 150" class="error-svg" aria-hidden="true">
				<defs>
					<linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#DB3EC6" />
						<stop offset="50%" stop-color="#8B3AD4" />
						<stop offset="100%" stop-color="#513BE2" />
					</linearGradient>

					<linearGradient id="grad-shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#DB3EC6">
							<animate attributeName="stop-color" values="#DB3EC6;#513BE2;#DB3EC6" dur="4s" repeatCount="indefinite" />
						</stop>
						<stop offset="50%" stop-color="#8B3AD4">
							<animate attributeName="stop-color" values="#8B3AD4;#DB3EC6;#8B3AD4" dur="4s" repeatCount="indefinite" />
						</stop>
						<stop offset="100%" stop-color="#513BE2">
							<animate attributeName="stop-color" values="#513BE2;#8B3AD4;#513BE2" dur="4s" repeatCount="indefinite" />
						</stop>
					</linearGradient>

					<!-- Wave clip path with smooth animation -->
					<clipPath id="wave-clip">
						<path>
							<animate
								attributeName="d"
								dur="3s"
								repeatCount="indefinite"
								values="
									M0,75 C80,45 160,105 240,75 C320,45 400,105 480,75 L480,150 L0,150 Z;
									M0,75 C80,105 160,45 240,75 C320,105 400,45 480,75 L480,150 L0,150 Z;
									M0,75 C80,45 160,105 240,75 C320,45 400,105 480,75 L480,150 L0,150 Z
								"
							/>
						</path>
					</clipPath>

					<!-- Second wave for layered effect -->
					<clipPath id="wave-clip-2">
						<path>
							<animate
								attributeName="d"
								dur="4s"
								repeatCount="indefinite"
								values="
									M0,85 C60,55 120,115 180,85 C240,55 300,115 360,85 C420,55 480,115 480,85 L480,150 L0,150 Z;
									M0,85 C60,115 120,55 180,85 C240,115 300,55 360,85 C420,115 480,55 480,85 L480,150 L0,150 Z;
									M0,85 C60,55 120,115 180,85 C240,55 300,115 360,85 C420,55 480,115 480,85 L480,150 L0,150 Z
								"
							/>
						</path>
					</clipPath>
				</defs>

				<!-- Ghost text (faint background) -->
				<text x="240" y="115" text-anchor="middle" class="error-text-base" fill="url(#grad)" fill-opacity="0.08">
					{status}
				</text>

				<!-- Second wave layer (lighter) -->
				<text x="240" y="115" text-anchor="middle" class="error-text-base" fill="url(#grad)" fill-opacity="0.25" clip-path="url(#wave-clip-2)">
					{status}
				</text>

				<!-- Primary wave layer -->
				<text x="240" y="115" text-anchor="middle" class="error-text-base" fill="url(#grad-shimmer)" clip-path="url(#wave-clip)">
					{status}
				</text>

				<!-- Outline text on top -->
				<text x="240" y="115" text-anchor="middle" class="error-text-base" fill="none" stroke="url(#grad)" stroke-width="1.2" stroke-opacity="0.6">
					{status}
				</text>
			</svg>
		</div>

		<!-- Logo -->
		<a href="/" class="logo-entrance mb-5 transition-opacity hover:opacity-80" class:mounted>
			<img src="/logo.svg" alt="Rondwell" class="h-7" />
		</a>

		<!-- Message -->
		<div class="message-entrance" class:mounted>
			<h1 class="mb-3 text-2xl font-semibold text-[#131517]">
				{#if status === 404}
					Looks like you're lost
				{:else}
					Oops, something broke
				{/if}
			</h1>
			<p class="mb-8 max-w-md text-sm leading-relaxed text-[#919091]">
				{#if status === 404}
					The page you're looking for doesn't exist or has been moved. No worries, let's get you back on track.
				{:else}
					{message}
				{/if}
			</p>
		</div>

		<!-- Actions -->
		<div class="actions-entrance flex flex-wrap items-center justify-center gap-3" class:mounted>
			<a href="/" class="inline-block">
				<Button
					class="group relative h-12 overflow-hidden rounded-xl bg-[#333537] px-7 text-sm text-white transition-all duration-300 hover:bg-gray-900 hover:shadow-lg hover:shadow-purple-500/20"
				>
					<span class="relative z-10 flex items-center gap-2">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
							<polyline points="9 22 9 12 15 12 15 22"></polyline>
						</svg>
						Go Home
					</span>
				</Button>
			</a>
			<button
				on:click={() => history.back()}
				class="group h-12 rounded-xl border border-[#E5E5E5] bg-white px-7 text-sm font-medium text-[#333537] transition-all duration-300 hover:border-purple-200 hover:bg-[#faf5ff] hover:shadow-lg hover:shadow-purple-500/10"
			>
				<span class="flex items-center gap-2">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="19" y1="12" x2="5" y2="12"></line>
						<polyline points="12 19 5 12 12 5"></polyline>
					</svg>
					Go Back
				</span>
			</button>
		</div>

		<!-- Decorative animated dots -->
		<div class="mt-14 flex items-center gap-2.5">
			<span class="dot dot-1"></span>
			<span class="dot dot-2"></span>
			<span class="dot dot-3"></span>
		</div>
	</div>
</section>

<style>
	.error-page {
		background:
			linear-gradient(0deg, rgba(251, 219, 231, 0.2), rgba(251, 219, 231, 0.2)),
			#ffffff;
		font-family: 'Merriweather Sans', system-ui, sans-serif;
	}

	/* Subtle grid overlay */
	.grid-overlay {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(219, 62, 198, 0.03) 1px, transparent 1px),
			linear-gradient(90deg, rgba(219, 62, 198, 0.03) 1px, transparent 1px);
		background-size: 60px 60px;
		z-index: 0;
	}

	/* Blurred gradient highlights */
	.highlight {
		position: absolute;
		border-radius: 50%;
		z-index: 0;
		pointer-events: none;
	}

	.highlight-1 {
		width: 550px;
		height: 550px;
		left: -150px;
		top: -100px;
		background: rgba(231, 126, 231, 0.35);
		filter: blur(160px);
		animation: float-1 8s ease-in-out infinite;
	}

	.highlight-2 {
		width: 450px;
		height: 450px;
		right: -120px;
		bottom: 40px;
		background: rgba(81, 59, 226, 0.25);
		filter: blur(160px);
		animation: float-2 10s ease-in-out infinite;
	}

	.highlight-3 {
		width: 350px;
		height: 350px;
		left: 50%;
		top: 15%;
		transform: translateX(-50%);
		background: rgba(255, 195, 124, 0.2);
		filter: blur(140px);
		animation: float-3 12s ease-in-out infinite;
	}

	.highlight-4 {
		width: 300px;
		height: 300px;
		right: 20%;
		top: 10%;
		background: rgba(255, 117, 169, 0.2);
		filter: blur(150px);
		animation: float-1 9s ease-in-out infinite reverse;
	}

	@keyframes float-1 {
		0%, 100% { transform: translateY(0) translateX(0); }
		33% { transform: translateY(-25px) translateX(10px); }
		66% { transform: translateY(10px) translateX(-15px); }
	}

	@keyframes float-2 {
		0%, 100% { transform: translateY(0) translateX(0); }
		50% { transform: translateY(-30px) translateX(-10px); }
	}

	@keyframes float-3 {
		0%, 100% { transform: translateX(-50%) translateY(0); }
		50% { transform: translateX(-50%) translateY(-20px); }
	}

	/* Floating particles */
	.floating-particle {
		position: absolute;
		border-radius: 50%;
		background: linear-gradient(135deg, #DB3EC6, #513BE2);
		opacity: 0.15;
		z-index: 1;
		pointer-events: none;
		animation: particle-float linear infinite;
	}

	@keyframes particle-float {
		0% { transform: translateY(0) scale(1); opacity: 0; }
		10% { opacity: 0.15; }
		90% { opacity: 0.15; }
		100% { transform: translateY(-120px) scale(0.5); opacity: 0; }
	}

	/* 404 SVG animation */
	.error-code-wrapper {
		width: 360px;
		opacity: 0;
		transform: translateY(30px) scale(0.9);
		transition: opacity 1s ease, transform 1s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.error-code-wrapper.mounted {
		opacity: 1;
		transform: translateY(0) scale(1);
	}

	.error-svg {
		width: 100%;
		height: auto;
		overflow: visible;
		filter: drop-shadow(0 4px 30px rgba(219, 62, 198, 0.15));
	}

	.error-text-base {
		font-size: 130px;
		font-weight: 900;
		font-family: 'Merriweather Sans', system-ui, sans-serif;
		letter-spacing: -3px;
	}

	/* Staggered entrance animations */
	.logo-entrance {
		opacity: 0;
		transform: translateY(15px);
		transition: opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s;
	}

	.logo-entrance.mounted {
		opacity: 1;
		transform: translateY(0);
	}

	.message-entrance {
		opacity: 0;
		transform: translateY(15px);
		transition: opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s;
	}

	.message-entrance.mounted {
		opacity: 1;
		transform: translateY(0);
	}

	.actions-entrance {
		opacity: 0;
		transform: translateY(15px);
		transition: opacity 0.6s ease 0.7s, transform 0.6s ease 0.7s;
	}

	.actions-entrance.mounted {
		opacity: 1;
		transform: translateY(0);
	}

	/* Decorative dots */
	.dot {
		display: block;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		animation: pulse-dot 2s ease-in-out infinite;
	}

	.dot-1 {
		background: #DB3EC6;
		animation-delay: 0s;
	}

	.dot-2 {
		background: #8B3AD4;
		animation-delay: 0.3s;
	}

	.dot-3 {
		background: #513BE2;
		animation-delay: 0.6s;
	}

	@keyframes pulse-dot {
		0%, 100% { opacity: 0.3; transform: scale(1); }
		50% { opacity: 1; transform: scale(1.5); }
	}

	/* Responsive */
	@media (min-width: 640px) {
		.error-code-wrapper {
			width: 480px;
		}
	}

	@media (min-width: 1024px) {
		.error-code-wrapper {
			width: 520px;
		}
	}
</style>
