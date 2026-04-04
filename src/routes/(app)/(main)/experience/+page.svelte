<script lang="ts">
	import { browser } from '$app/environment';
	import { authState } from '$lib/stores/auth.store';
	import { onMount } from 'svelte';

	let mounted = false;
	let floatingItems: { x: number; y: number; size: number; delay: number; duration: number }[] = [];
	let joining = false;
	let showToast = false;
	let toastMessage = '';

	const API_URL = import.meta.env.VITE_API_URL;

	onMount(() => {
		mounted = true;
		floatingItems = Array.from({ length: 25 }, () => ({
			x: Math.random() * 100,
			y: Math.random() * 100,
			size: Math.random() * 6 + 2,
			delay: Math.random() * 6,
			duration: Math.random() * 5 + 4
		}));
	});

	async function joinWaitlist() {
		if (joining) return;
		joining = true;

		const email = $authState.user?.email;
		const name = $authState.activeProfile?.name;
		const userId = ($authState.user as any)?.id ?? ($authState.user as any)?._id;

		if (!email) {
			toastMessage = 'Please log in to join the waitlist';
			showToast = true;
			joining = false;
			setTimeout(() => (showToast = false), 4000);
			return;
		}

		try {
			const res = await fetch(`${API_URL}/api/v1/admin/waitlist`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, name, userId, feature: 'experience_vr_ar' }),
			});
			const data = await res.json();
			toastMessage = data.message ?? "You've been added to the waitlist";
		} catch {
			toastMessage = "You've been added to the waitlist";
		}

		showToast = true;
		joining = false;
		setTimeout(() => (showToast = false), 5000);
	}

	const features = [
		{
			title: 'Virtual Booths',
			desc: 'Walk through immersive 3D exhibition spaces from anywhere in the world.'
		},
		{
			title: 'AR Event Overlays',
			desc: 'Point your phone at any event space and see interactive digital layers come alive.'
		},
		{
			title: 'Spatial Networking',
			desc: 'Meet and connect with attendees in shared virtual environments.'
		},
		{
			title: 'Immersive Stages',
			desc: 'Experience keynotes and panels as if you were sitting in the front row.'
		}
	];
</script>

<svelte:head>
	<title>Experience — Rondwell</title>
</svelte:head>

<!-- Toast -->
{#if showToast}
	<div class="toast-enter fixed top-6 left-1/2 z-[9999] -translate-x-1/2">
		<div class="flex items-center gap-3 rounded-2xl border border-white/30 bg-white/80 px-5 py-3 shadow-xl backdrop-blur-xl">
			<span class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] text-sm text-white">✓</span>
			<span class="text-sm font-medium text-[#333537]">{toastMessage}</span>
		</div>
	</div>
{/if}

<section class="experience-page relative flex min-h-[80vh] flex-col items-center overflow-hidden rounded-2xl px-4 pb-20 pt-10 md:pt-16">
	<!-- Gradient orbs -->
	<div class="highlight highlight-1"></div>
	<div class="highlight highlight-2"></div>
	<div class="highlight highlight-3"></div>
	<div class="highlight highlight-4"></div>

	<!-- Grid overlay -->
	<div class="grid-overlay"></div>

	<!-- Floating particles -->
	{#each floatingItems as particle}
		<span
			class="floating-particle"
			style="left:{particle.x}%;top:{particle.y}%;width:{particle.size}px;height:{particle.size}px;animation-delay:{particle.delay}s;animation-duration:{particle.duration}s;"
		></span>
	{/each}

	<div class="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
		<!-- Animated SVG header -->
		<div class="xr-title-wrapper" class:mounted>
			<svg viewBox="0 0 580 150" class="xr-svg" aria-hidden="true">
				<defs>
					<linearGradient id="xr-grad" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#DB3EC6" />
						<stop offset="50%" stop-color="#8B3AD4" />
						<stop offset="100%" stop-color="#513BE2" />
					</linearGradient>
					<linearGradient id="xr-shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
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
					<clipPath id="xr-wave">
						<path>
							<animate
								attributeName="d"
								dur="3s"
								repeatCount="indefinite"
								values="
									M0,75 C97,45 193,105 290,75 C387,45 483,105 580,75 L580,150 L0,150 Z;
									M0,75 C97,105 193,45 290,75 C387,105 483,45 580,75 L580,150 L0,150 Z;
									M0,75 C97,45 193,105 290,75 C387,45 483,105 580,75 L580,150 L0,150 Z
								"
							/>
						</path>
					</clipPath>
				</defs>
				<text x="290" y="115" text-anchor="middle" class="xr-text" fill="url(#xr-grad)" fill-opacity="0.08">XR</text>
				<text x="290" y="115" text-anchor="middle" class="xr-text" fill="url(#xr-shimmer)" clip-path="url(#xr-wave)">XR</text>
				<text x="290" y="115" text-anchor="middle" class="xr-text" fill="none" stroke="url(#xr-grad)" stroke-width="1.2" stroke-opacity="0.5">XR</text>
			</svg>
		</div>

		<!-- Badge -->
		<div class="badge-entrance" class:mounted>
			<span class="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5 text-xs font-medium text-purple-600">
				<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-500"></span>
				Coming Soon
			</span>
		</div>

		<!-- Heading -->
		<div class="heading-entrance mt-6" class:mounted>
			<h1 class="text-3xl font-semibold leading-tight text-[#131517] sm:text-4xl md:text-5xl">
				Immersive Event<br />
				<span class="bg-gradient-to-r from-[#DB3EC6] via-[#8B3AD4] to-[#513BE2] bg-clip-text text-transparent">Experiences</span>
			</h1>
		</div>

		<!-- Subtitle -->
		<div class="subtitle-entrance mt-5" class:mounted>
			<p class="max-w-lg text-base leading-relaxed text-[#6B6D6F] sm:text-lg">
				Step into events like never before. Explore virtual booths, interact with AR overlays, and connect with people in shared immersive spaces — all powered by Rondwell.
			</p>
		</div>

		<!-- CTA -->
		<div class="cta-entrance mt-8" class:mounted>
			<button
				on:click={joinWaitlist}
				disabled={joining}
				class="group relative overflow-hidden rounded-2xl bg-[#333537] px-8 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-60"
			>
				<span class="relative z-10 flex items-center gap-2">
					{#if joining}
						<span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
						Joining...
					{:else}
					Join Waitlist
					{/if}
				</span>
				<div class="absolute inset-0 -translate-x-full bg-gradient-to-r from-[#DB3EC6]/20 to-[#513BE2]/20 transition-transform duration-500 group-hover:translate-x-0"></div>
			</button>
		</div>

		<!-- Feature cards -->
		<div class="features-entrance mt-16 grid w-full grid-cols-1 gap-4 sm:grid-cols-2" class:mounted>
			{#each features as feature, i}
				<div
					class="feature-card rounded-2xl border border-white/40 bg-white/50 p-6 text-left backdrop-blur-sm transition-all duration-300 hover:border-purple-200 hover:bg-white/70 hover:shadow-lg hover:shadow-purple-500/5"
					style="animation-delay: {0.1 * i}s"
				>
					<h3 class="mb-1.5 text-base font-semibold text-[#131517]">{feature.title}</h3>
					<p class="text-sm leading-relaxed text-[#919091]">{feature.desc}</p>
				</div>
			{/each}
		</div>

		<!-- Decorative dots -->
		<div class="dots-entrance mt-14 flex items-center gap-2.5" class:mounted>
			<span class="dot dot-1"></span>
			<span class="dot dot-2"></span>
			<span class="dot dot-3"></span>
		</div>
	</div>
</section>

<style>
	.experience-page {
		background: linear-gradient(0deg, rgba(251, 219, 231, 0.15), rgba(251, 219, 231, 0.15)), #ffffff;
		font-family: 'Merriweather Sans', system-ui, sans-serif;
	}

	.grid-overlay {
		position: absolute; inset: 0;
		background-image:
			linear-gradient(rgba(219, 62, 198, 0.025) 1px, transparent 1px),
			linear-gradient(90deg, rgba(219, 62, 198, 0.025) 1px, transparent 1px);
		background-size: 60px 60px; z-index: 0;
	}

	.highlight { position: absolute; border-radius: 50%; z-index: 0; pointer-events: none; }
	.highlight-1 { width: 350px; height: 350px; left: -80px; top: -40px; background: rgba(231, 126, 231, 0.2); filter: blur(120px); animation: float-1 8s ease-in-out infinite; }
	.highlight-2 { width: 300px; height: 300px; right: -60px; bottom: 60px; background: rgba(81, 59, 226, 0.15); filter: blur(120px); animation: float-2 10s ease-in-out infinite; }
	.highlight-3 { width: 250px; height: 250px; left: 50%; top: 20%; transform: translateX(-50%); background: rgba(255, 195, 124, 0.12); filter: blur(110px); animation: float-3 12s ease-in-out infinite; }
	.highlight-4 { width: 200px; height: 200px; right: 20%; top: 55%; background: rgba(255, 117, 169, 0.12); filter: blur(110px); animation: float-1 9s ease-in-out infinite reverse; }

	@keyframes float-1 { 0%, 100% { transform: translateY(0) translateX(0); } 33% { transform: translateY(-20px) translateX(8px); } 66% { transform: translateY(8px) translateX(-12px); } }
	@keyframes float-2 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-25px) translateX(-8px); } }
	@keyframes float-3 { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-18px); } }

	.floating-particle {
		position: absolute; border-radius: 50%;
		background: linear-gradient(135deg, #DB3EC6, #513BE2);
		opacity: 0.12; z-index: 1; pointer-events: none;
		animation: particle-float linear infinite;
	}
	@keyframes particle-float {
		0% { transform: translateY(0) scale(1); opacity: 0; }
		10% { opacity: 0.12; } 90% { opacity: 0.12; }
		100% { transform: translateY(-110px) scale(0.4); opacity: 0; }
	}

	/* SVG title */
	.xr-title-wrapper {
		width: 280px; opacity: 0; transform: translateY(25px) scale(0.9);
		transition: opacity 0.9s ease, transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.xr-title-wrapper.mounted { opacity: 1; transform: translateY(0) scale(1); }
	.xr-svg { width: 100%; height: auto; overflow: visible; filter: drop-shadow(0 4px 25px rgba(219, 62, 198, 0.12)); }
	.xr-text { font-size: 130px; font-weight: 900; font-family: 'Merriweather Sans', system-ui, sans-serif; letter-spacing: -2px; }

	/* Staggered entrances */
	.badge-entrance { opacity: 0; transform: translateY(12px); transition: opacity 0.5s ease 0.25s, transform 0.5s ease 0.25s; }
	.badge-entrance.mounted { opacity: 1; transform: translateY(0); }
	.heading-entrance { opacity: 0; transform: translateY(12px); transition: opacity 0.5s ease 0.4s, transform 0.5s ease 0.4s; }
	.heading-entrance.mounted { opacity: 1; transform: translateY(0); }
	.subtitle-entrance { opacity: 0; transform: translateY(12px); transition: opacity 0.5s ease 0.55s, transform 0.5s ease 0.55s; }
	.subtitle-entrance.mounted { opacity: 1; transform: translateY(0); }
	.cta-entrance { opacity: 0; transform: translateY(12px); transition: opacity 0.5s ease 0.7s, transform 0.5s ease 0.7s; }
	.cta-entrance.mounted { opacity: 1; transform: translateY(0); }
	.features-entrance { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease 0.85s, transform 0.6s ease 0.85s; }
	.features-entrance.mounted { opacity: 1; transform: translateY(0); }
	.dots-entrance { opacity: 0; transition: opacity 0.5s ease 1.1s; }
	.dots-entrance.mounted { opacity: 1; }

	.feature-card { animation: card-in 0.5s ease both; }
	@keyframes card-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

	/* Dots */
	.dot { display: block; width: 7px; height: 7px; border-radius: 50%; animation: pulse-dot 2s ease-in-out infinite; }
	.dot-1 { background: #DB3EC6; animation-delay: 0s; }
	.dot-2 { background: #8B3AD4; animation-delay: 0.3s; }
	.dot-3 { background: #513BE2; animation-delay: 0.6s; }
	@keyframes pulse-dot { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 1; transform: scale(1.5); } }

	/* Toast */
	.toast-enter { animation: toast-slide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
	@keyframes toast-slide { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }

	@media (min-width: 640px) { .xr-title-wrapper { width: 360px; } }
	@media (min-width: 1024px) { .xr-title-wrapper { width: 400px; } }
</style>
