<script lang="ts">
	import { onMount } from 'svelte';

	export let visible = false;
	export let roleName = 'Profile';
	export let roleColor = '#513BE2';

	let mounted = false;

	onMount(() => {
		mounted = true;
	});

	const ROLE_ICONS: Record<string, string> = {
		VENDOR: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`,
		EXHIBITOR: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>`,
		SPEAKER: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
		ORGANIZER: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
	};

	$: icon = ROLE_ICONS[roleName.toUpperCase()] || ROLE_ICONS.ORGANIZER;
</script>

{#if visible}
	<div class="switch-overlay" class:mounted>
		<!-- Gradient orbs -->
		<div class="orb orb-1" style="background: {roleColor}33;"></div>
		<div class="orb orb-2" style="background: {roleColor}22;"></div>

		<div class="relative z-10 flex flex-col items-center text-center px-6">
			<!-- Animated icon -->
			<div class="icon-ring" style="border-color: {roleColor}40;">
				<div class="icon-inner" style="background: {roleColor}15; color: {roleColor};">
					{@html icon}
				</div>
			</div>

			<!-- Text -->
			<p class="mt-5 text-sm font-medium text-gray-500">Switching to</p>
			<p class="mt-1 text-lg font-bold" style="color: {roleColor};">{roleName}</p>

			<!-- Animated dots -->
			<div class="mt-5 flex items-center gap-2">
				<span class="dot" style="background: {roleColor}; animation-delay: 0s;"></span>
				<span class="dot" style="background: {roleColor}; animation-delay: 0.15s;"></span>
				<span class="dot" style="background: {roleColor}; animation-delay: 0.3s;"></span>
			</div>
		</div>
	</div>
{/if}

<style>
	.switch-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(12px);
		opacity: 0;
		animation: overlay-in 0.3s ease forwards;
	}

	.switch-overlay.mounted {
		opacity: 1;
	}

	@keyframes overlay-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.orb {
		position: absolute;
		border-radius: 50%;
		pointer-events: none;
		filter: blur(100px);
	}

	.orb-1 {
		width: 300px;
		height: 300px;
		top: 10%;
		left: 15%;
		animation: orb-float 4s ease-in-out infinite;
	}

	.orb-2 {
		width: 250px;
		height: 250px;
		bottom: 15%;
		right: 15%;
		animation: orb-float 5s ease-in-out infinite reverse;
	}

	@keyframes orb-float {
		0%, 100% { transform: translate(0, 0); }
		50% { transform: translate(15px, -20px); }
	}

	.icon-ring {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		border: 2px solid;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: ring-pulse 1.5s ease-in-out infinite, icon-enter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
		transform: scale(0.5);
		opacity: 0;
	}

	@keyframes icon-enter {
		to { transform: scale(1); opacity: 1; }
	}

	@keyframes ring-pulse {
		0%, 100% { box-shadow: 0 0 0 0 currentColor; }
		50% { box-shadow: 0 0 0 12px transparent; }
	}

	.icon-inner {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: icon-spin 0.8s ease-out;
	}

	@keyframes icon-spin {
		from { transform: rotate(-180deg) scale(0.6); opacity: 0; }
		to { transform: rotate(0deg) scale(1); opacity: 1; }
	}

	.dot {
		display: block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		animation: dot-bounce 1.2s ease-in-out infinite;
	}

	@keyframes dot-bounce {
		0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
		40% { transform: scale(1.4); opacity: 1; }
	}
</style>
