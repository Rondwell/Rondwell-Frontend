<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';

	let mounted = false;

	onMount(() => {
		mounted = true;
	});

	$: status = $page.status;
	$: message = $page.error?.message || 'Something went wrong';
</script>

<svelte:head>
	<title>{status} — Rondwell</title>
</svelte:head>

<section class="error-page relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
	<!-- Background highlights -->
	<div class="highlight highlight-1"></div>
	<div class="highlight highlight-2"></div>
	<div class="highlight highlight-3"></div>

	<div class="relative z-10 mx-auto flex max-w-lg flex-col items-center text-center">
		<!-- Animated wavy 404 -->
		<div class="error-code-wrapper mb-6" class:mounted>
			<svg viewBox="0 0 480 120" class="error-svg" aria-hidden="true">
				<defs>
					<linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#DB3EC6" />
						<stop offset="100%" stop-color="#513BE2" />
					</linearGradient>
					<!-- Wave clip path -->
					<clipPath id="wave-clip">
						<path class="wave-path">
							<animate
								attributeName="d"
								dur="3s"
								repeatCount="indefinite"
								values="
									M0,60 Q60,30 120,60 Q180,90 240,60 Q300,30 360,60 Q420,90 480,60 L480,120 L0,120 Z;
									M0,60 Q60,90 120,60 Q180,30 240,60 Q300,90 360,60 Q420,30 480,60 L480,120 L0,120 Z;
									M0,60 Q60,30 120,60 Q180,90 240,60 Q300,30 360,60 Q420,90 480,60 L480,120 L0,120 Z
								"
							/>
						</path>
					</clipPath>
				</defs>

				<!-- Solid gradient text (bottom layer) -->
				<text
					x="240"
					y="95"
					text-anchor="middle"
					class="error-text-base"
					fill="url(#grad)"
					fill-opacity="0.15"
				>
					{status}
				</text>

				<!-- Wavy gradient text (animated clip) -->
				<text
					x="240"
					y="95"
					text-anchor="middle"
					class="error-text-base"
					fill="url(#grad)"
					clip-path="url(#wave-clip)"
				>
					{status}
				</text>

				<!-- Outline text on top -->
				<text
					x="240"
					y="95"
					text-anchor="middle"
					class="error-text-base"
					fill="none"
					stroke="url(#grad)"
					stroke-width="1.5"
				>
					{status}
				</text>
			</svg>
		</div>

		<!-- Logo -->
		<a href="/" class="mb-6 transition-opacity hover:opacity-80">
			<img src="/logo.svg" alt="Rondwell" class="h-7" />
		</a>

		<!-- Message -->
		<h1 class="mb-2 text-2xl font-semibold text-[#131517]">
			{#if status === 404}
				Page not found
			{:else}
				Oops, something broke
			{/if}
		</h1>
		<p class="mb-8 max-w-sm text-sm leading-relaxed text-[#919091]">
			{#if status === 404}
				The page you're looking for doesn't exist or has been moved. Let's get you back on track.
			{:else}
				{message}
			{/if}
		</p>

		<!-- Actions -->
		<div class="flex flex-wrap items-center justify-center gap-3">
			<a href="/" class="inline-block">
				<Button
					class="h-11 rounded-xl bg-[#333537] px-6 text-sm text-white transition hover:bg-gray-900"
				>
					Go Home
				</Button>
			</a>
			<button
				on:click={() => history.back()}
				class="h-11 rounded-xl border border-[#E5E5E5] bg-white px-6 text-sm font-medium text-[#333537] transition hover:bg-[#F4F3F3]"
			>
				Go Back
			</button>
		</div>

		<!-- Decorative dots -->
		<div class="mt-12 flex items-center gap-2">
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

	/* Blurred gradient highlights */
	.highlight {
		position: absolute;
		border-radius: 50%;
		z-index: 0;
		pointer-events: none;
	}

	.highlight-1 {
		width: 500px;
		height: 500px;
		left: -120px;
		top: -80px;
		background: rgba(231, 126, 231, 0.4);
		filter: blur(160px);
		animation: float-slow 8s ease-in-out infinite;
	}

	.highlight-2 {
		width: 400px;
		height: 400px;
		right: -100px;
		bottom: 60px;
		background: rgba(81, 59, 226, 0.3);
		filter: blur(160px);
		animation: float-slow 10s ease-in-out infinite reverse;
	}

	.highlight-3 {
		width: 300px;
		height: 300px;
		left: 50%;
		top: 20%;
		transform: translateX(-50%);
		background: rgba(255, 195, 124, 0.25);
		filter: blur(140px);
		animation: float-slow 12s ease-in-out infinite;
	}

	@keyframes float-slow {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-20px); }
	}

	/* 404 SVG animation */
	.error-code-wrapper {
		width: 320px;
		opacity: 0;
		transform: translateY(20px) scale(0.95);
		transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.error-code-wrapper.mounted {
		opacity: 1;
		transform: translateY(0) scale(1);
	}

	.error-svg {
		width: 100%;
		height: auto;
		overflow: visible;
	}

	.error-text-base {
		font-size: 110px;
		font-weight: 800;
		font-family: 'Merriweather Sans', system-ui, sans-serif;
		letter-spacing: -2px;
	}

	/* Decorative dots */
	.dot {
		display: block;
		width: 6px;
		height: 6px;
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
		50% { opacity: 1; transform: scale(1.4); }
	}

	/* Responsive */
	@media (min-width: 640px) {
		.error-code-wrapper {
			width: 420px;
		}
	}
</style>
