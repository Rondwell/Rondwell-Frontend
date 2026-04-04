    <script lang="ts">
	import { page } from '$app/stores';
	import { confirmCollectionSubscription } from '$lib/services/collection.services';
	import { onMount } from 'svelte';

	let mounted = false;
	let status: 'loading' | 'success' | 'expired' | 'error' = 'loading';
	let message = '';
	let floatingItems: { x: number; y: number; size: number; delay: number; duration: number }[] = [];

	onMount(async () => {
		mounted = true;
		floatingItems = Array.from({ length: 15 }, () => ({
			x: Math.random() * 100,
			y: Math.random() * 100,
			size: Math.random() * 6 + 2,
			delay: Math.random() * 5,
			duration: Math.random() * 4 + 4
		}));

		const token = $page.url.searchParams.get('token');
		if (!token) {
			status = 'error';
			message = 'No verification token provided.';
			return;
		}
		try {
			await confirmCollectionSubscription(token);
			status = 'success';
			message = 'You will now receive updates about upcoming events and announcements from this collection.';
		} catch (err: any) {
			if (err.message?.toLowerCase().includes('expired')) {
				status = 'expired';
				message = 'This verification link has expired. Please ask the organizer to re-add you.';
			} else {
				status = 'error';
				message = err.message || 'Something went wrong. Please try again.';
			}
		}
	});
</script>

<svelte:head>
	<title>Confirm Subscription — Rondwell</title>
</svelte:head>

<section class="confirm-page relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
	<div class="highlight highlight-1"></div>
	<div class="highlight highlight-2"></div>
	<div class="highlight highlight-3"></div>
	<div class="grid-overlay"></div>

	{#each floatingItems as particle}
		<span
			class="floating-particle"
			style="left: {particle.x}%; top: {particle.y}%; width: {particle.size}px; height: {particle.size}px; animation-delay: {particle.delay}s; animation-duration: {particle.duration}s;"
		></span>
	{/each}

	<div class="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
		{#if status === 'loading'}
			<div class="status-icon-wrapper" class:mounted>
				<div class="flex h-24 w-24 items-center justify-center rounded-full bg-white/80 shadow-lg shadow-purple-500/10">
					<div class="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#DB3EC6]"></div>
				</div>
			</div>
			<div class="message-entrance" class:mounted>
				<p class="mt-6 text-sm text-[#919091]">Confirming your subscription...</p>
			</div>
		{:else if status === 'success'}
			<div class="status-icon-wrapper" class:mounted>
				<div class="flex h-24 w-24 items-center justify-center rounded-full bg-white/80 shadow-lg shadow-green-500/10">
					<svg class="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				</div>
			</div>
			<a href="/" class="logo-entrance mb-4 mt-6 transition-opacity hover:opacity-80" class:mounted>
				<img src="/logo.svg" alt="Rondwell" class="h-7" />
			</a>
			<div class="message-entrance" class:mounted>
				<h1 class="mb-3 text-2xl font-semibold text-[#131517]">Subscription Confirmed</h1>
				<p class="mb-8 max-w-md text-sm leading-relaxed text-[#919091]">{message}</p>
			</div>
			<div class="actions-entrance flex flex-wrap items-center justify-center gap-3" class:mounted>
				<a href="/" class="inline-flex h-12 items-center gap-2 rounded-xl bg-[#333537] px-7 text-sm text-white transition-all duration-300 hover:bg-gray-900 hover:shadow-lg hover:shadow-purple-500/20">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
						<polyline points="9 22 9 12 15 12 15 22"></polyline>
					</svg>
					Explore Rondwell
				</a>
			</div>
		{:else if status === 'expired'}
			<div class="status-icon-wrapper" class:mounted>
				<div class="flex h-24 w-24 items-center justify-center rounded-full bg-white/80 shadow-lg shadow-yellow-500/10">
					<svg class="h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
			</div>
			<a href="/" class="logo-entrance mb-4 mt-6 transition-opacity hover:opacity-80" class:mounted>
				<img src="/logo.svg" alt="Rondwell" class="h-7" />
			</a>
			<div class="message-entrance" class:mounted>
				<h1 class="mb-3 text-2xl font-semibold text-[#131517]">Link Expired</h1>
				<p class="mb-8 max-w-md text-sm leading-relaxed text-[#919091]">{message}</p>
			</div>
		{:else}
			<div class="status-icon-wrapper" class:mounted>
				<div class="flex h-24 w-24 items-center justify-center rounded-full bg-white/80 shadow-lg shadow-red-500/10">
					<svg class="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</div>
			</div>
			<a href="/" class="logo-entrance mb-4 mt-6 transition-opacity hover:opacity-80" class:mounted>
				<img src="/logo.svg" alt="Rondwell" class="h-7" />
			</a>
			<div class="message-entrance" class:mounted>
				<h1 class="mb-3 text-2xl font-semibold text-[#131517]">Verification Failed</h1>
				<p class="mb-8 max-w-md text-sm leading-relaxed text-[#919091]">{message}</p>
			</div>
		{/if}

		<div class="mt-10 flex items-center gap-2.5">
			<span class="dot dot-1"></span>
			<span class="dot dot-2"></span>
			<span class="dot dot-3"></span>
		</div>
	</div>
</section>

<style>
	.confirm-page {
		background: linear-gradient(0deg, rgba(251, 219, 231, 0.2), rgba(251, 219, 231, 0.2)), #ffffff;
		font-family: 'Merriweather Sans', system-ui, sans-serif;
	}
	.grid-overlay {
		position: absolute; inset: 0;
		background-image: linear-gradient(rgba(219, 62, 198, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(219, 62, 198, 0.03) 1px, transparent 1px);
		background-size: 60px 60px; z-index: 0;
	}
	.highlight { position: absolute; border-radius: 50%; z-index: 0; pointer-events: none; }
	.highlight-1 { width: 550px; height: 550px; left: -150px; top: -100px; background: rgba(231, 126, 231, 0.35); filter: blur(160px); animation: float-1 8s ease-in-out infinite; }
	.highlight-2 { width: 450px; height: 450px; right: -120px; bottom: 40px; background: rgba(81, 59, 226, 0.25); filter: blur(160px); animation: float-2 10s ease-in-out infinite; }
	.highlight-3 { width: 350px; height: 350px; left: 50%; top: 15%; transform: translateX(-50%); background: rgba(255, 195, 124, 0.2); filter: blur(140px); animation: float-3 12s ease-in-out infinite; }
	@keyframes float-1 { 0%, 100% { transform: translateY(0) translateX(0); } 33% { transform: translateY(-25px) translateX(10px); } 66% { transform: translateY(10px) translateX(-15px); } }
	@keyframes float-2 { 0%, 100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-30px) translateX(-10px); } }
	@keyframes float-3 { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-20px); } }
	.floating-particle { position: absolute; border-radius: 50%; background: linear-gradient(135deg, #DB3EC6, #513BE2); opacity: 0.15; z-index: 1; pointer-events: none; animation: particle-float linear infinite; }
	@keyframes particle-float { 0% { transform: translateY(0) scale(1); opacity: 0; } 10% { opacity: 0.15; } 90% { opacity: 0.15; } 100% { transform: translateY(-120px) scale(0.5); opacity: 0; } }
	.status-icon-wrapper { opacity: 0; transform: translateY(30px) scale(0.9); transition: opacity 1s ease, transform 1s cubic-bezier(0.34, 1.56, 0.64, 1); }
	.status-icon-wrapper.mounted { opacity: 1; transform: translateY(0) scale(1); }
	.logo-entrance { opacity: 0; transform: translateY(15px); transition: opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s; }
	.logo-entrance.mounted { opacity: 1; transform: translateY(0); }
	.message-entrance { opacity: 0; transform: translateY(15px); transition: opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s; }
	.message-entrance.mounted { opacity: 1; transform: translateY(0); }
	.actions-entrance { opacity: 0; transform: translateY(15px); transition: opacity 0.6s ease 0.7s, transform 0.6s ease 0.7s; }
	.actions-entrance.mounted { opacity: 1; transform: translateY(0); }
	.dot { display: block; width: 7px; height: 7px; border-radius: 50%; animation: pulse-dot 2s ease-in-out infinite; }
	.dot-1 { background: #DB3EC6; animation-delay: 0s; }
	.dot-2 { background: #8B3AD4; animation-delay: 0.3s; }
	.dot-3 { background: #513BE2; animation-delay: 0.6s; }
	@keyframes pulse-dot { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 1; transform: scale(1.5); } }
</style>
