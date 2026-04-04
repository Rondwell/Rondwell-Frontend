<script lang="ts">
	import { onMount } from 'svelte';

	export let visible = false;
	export let message = 'Generating your event with AI...';

	let mounted = false;
	let floatingItems: { x: number; y: number; size: number; delay: number; duration: number }[] = [];

	onMount(() => {
		mounted = true;
		floatingItems = Array.from({ length: 15 }, () => ({
			x: Math.random() * 100,
			y: Math.random() * 100,
			size: Math.random() * 5 + 2,
			delay: Math.random() * 4,
			duration: Math.random() * 3 + 3
		}));
	});
</script>

{#if visible}
	<div class="ai-overlay fixed inset-0 z-[9999] flex flex-col items-center justify-center">
		<!-- Gradient highlight orbs -->
		<div class="highlight highlight-1"></div>
		<div class="highlight highlight-2"></div>
		<div class="highlight highlight-3"></div>

		<!-- Grid background -->
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

		<div class="relative z-10 flex flex-col items-center text-center px-6">
			<!-- Animated AI icon -->
			<div class="ai-icon-wrapper" class:mounted>
				<svg viewBox="0 0 480 150" class="ai-svg" aria-hidden="true">
					<defs>
						<linearGradient id="ai-grad-shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
							<stop offset="0%" stop-color="#DB3EC6">
								<animate attributeName="stop-color" values="#DB3EC6;#513BE2;#DB3EC6" dur="3s" repeatCount="indefinite" />
							</stop>
							<stop offset="50%" stop-color="#8B3AD4">
								<animate attributeName="stop-color" values="#8B3AD4;#DB3EC6;#8B3AD4" dur="3s" repeatCount="indefinite" />
							</stop>
							<stop offset="100%" stop-color="#513BE2">
								<animate attributeName="stop-color" values="#513BE2;#8B3AD4;#513BE2" dur="3s" repeatCount="indefinite" />
							</stop>
						</linearGradient>

						<clipPath id="ai-wave-clip">
							<path>
								<animate
									attributeName="d"
									dur="2.5s"
									repeatCount="indefinite"
									values="
										M0,75 C80,45 160,105 240,75 C320,45 400,105 480,75 L480,150 L0,150 Z;
										M0,75 C80,105 160,45 240,75 C320,105 400,45 480,75 L480,150 L0,150 Z;
										M0,75 C80,45 160,105 240,75 C320,45 400,105 480,75 L480,150 L0,150 Z
									"
								/>
							</path>
						</clipPath>
					</defs>

					<text x="240" y="115" text-anchor="middle" class="ai-text" fill="url(#ai-grad-shimmer)" fill-opacity="0.1">
						AI
					</text>
					<text x="240" y="115" text-anchor="middle" class="ai-text" fill="url(#ai-grad-shimmer)" clip-path="url(#ai-wave-clip)">
						AI
					</text>
					<text x="240" y="115" text-anchor="middle" class="ai-text" fill="none" stroke="url(#ai-grad-shimmer)" stroke-width="1" stroke-opacity="0.5">
						AI
					</text>
				</svg>
			</div>

			<!-- Message -->
			<p class="message-text mt-2 text-base font-medium text-[#555]" class:mounted>{message}</p>

			<!-- Animated dots -->
			<div class="mt-6 flex items-center gap-2.5">
				<span class="dot dot-1"></span>
				<span class="dot dot-2"></span>
				<span class="dot dot-3"></span>
			</div>
		</div>
	</div>
{/if}

<style>
	.ai-overlay {
		background: linear-gradient(0deg, rgba(251, 219, 231, 0.25), rgba(251, 219, 231, 0.25)), rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(8px);
		font-family: 'Merriweather Sans', system-ui, sans-serif;
	}

	.grid-overlay {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(219, 62, 198, 0.03) 1px, transparent 1px),
			linear-gradient(90deg, rgba(219, 62, 198, 0.03) 1px, transparent 1px);
		background-size: 60px 60px;
		z-index: 0;
	}

	.highlight {
		position: absolute;
		border-radius: 50%;
		z-index: 0;
		pointer-events: none;
	}

	.highlight-1 {
		width: 400px;
		height: 400px;
		left: -100px;
		top: -50px;
		background: rgba(231, 126, 231, 0.3);
		filter: blur(140px);
		animation: float-1 7s ease-in-out infinite;
	}

	.highlight-2 {
		width: 350px;
		height: 350px;
		right: -80px;
		bottom: 60px;
		background: rgba(81, 59, 226, 0.2);
		filter: blur(140px);
		animation: float-2 9s ease-in-out infinite;
	}

	.highlight-3 {
		width: 300px;
		height: 300px;
		left: 50%;
		top: 20%;
		transform: translateX(-50%);
		background: rgba(255, 195, 124, 0.15);
		filter: blur(120px);
		animation: float-3 11s ease-in-out infinite;
	}

	@keyframes float-1 {
		0%, 100% { transform: translateY(0) translateX(0); }
		33% { transform: translateY(-20px) translateX(8px); }
		66% { transform: translateY(8px) translateX(-12px); }
	}

	@keyframes float-2 {
		0%, 100% { transform: translateY(0) translateX(0); }
		50% { transform: translateY(-25px) translateX(-8px); }
	}

	@keyframes float-3 {
		0%, 100% { transform: translateX(-50%) translateY(0); }
		50% { transform: translateX(-50%) translateY(-15px); }
	}

	.floating-particle {
		position: absolute;
		border-radius: 50%;
		background: linear-gradient(135deg, #DB3EC6, #513BE2);
		opacity: 0.12;
		z-index: 1;
		pointer-events: none;
		animation: particle-float linear infinite;
	}

	@keyframes particle-float {
		0% { transform: translateY(0) scale(1); opacity: 0; }
		10% { opacity: 0.12; }
		90% { opacity: 0.12; }
		100% { transform: translateY(-100px) scale(0.4); opacity: 0; }
	}

	.ai-icon-wrapper {
		width: 280px;
		opacity: 0;
		transform: translateY(20px) scale(0.9);
		transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.ai-icon-wrapper.mounted {
		opacity: 1;
		transform: translateY(0) scale(1);
	}

	.ai-svg {
		width: 100%;
		height: auto;
		overflow: visible;
		filter: drop-shadow(0 4px 25px rgba(219, 62, 198, 0.15));
	}

	.ai-text {
		font-size: 130px;
		font-weight: 900;
		font-family: 'Merriweather Sans', system-ui, sans-serif;
		letter-spacing: -2px;
	}

	.message-text {
		opacity: 0;
		transform: translateY(10px);
		transition: opacity 0.5s ease 0.4s, transform 0.5s ease 0.4s;
	}

	.message-text.mounted {
		opacity: 1;
		transform: translateY(0);
	}

	.dot {
		display: block;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		animation: pulse-dot 1.5s ease-in-out infinite;
	}

	.dot-1 { background: #DB3EC6; animation-delay: 0s; }
	.dot-2 { background: #8B3AD4; animation-delay: 0.2s; }
	.dot-3 { background: #513BE2; animation-delay: 0.4s; }

	@keyframes pulse-dot {
		0%, 100% { opacity: 0.3; transform: scale(1); }
		50% { opacity: 1; transform: scale(1.6); }
	}
</style>
