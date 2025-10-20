<!-- src/lib/components/Sidebar.svelte -->
<script>
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	export let background_color = '';

	// Menu items
	const menuItems = [
		{ id: 'create', label: 'Create Event', icon: 'plus', active: true },
		{ id: 'event', label: 'Events', icon: '/ticket-2.svg' },
		{ id: 'collections', label: 'Collections', icon: '/cate.svg' },
		{ id: 'discover', label: 'Discover', icon: '/disc.svg' },
		{ id: 'experience', label: 'Experience', icon: '/exp.svg' }
	];

	$: mobileMenuItems = [...menuItems.slice(1, 3), menuItems[0], ...menuItems.slice(3)];

	// Reactive mobile detection
	let isMobile = false;

	function checkScreenSize() {
		if (browser) {
			isMobile = window.innerWidth < 768;
		}
	}

	onMount(() => {
		checkScreenSize();
		window.addEventListener('resize', checkScreenSize);
		return () => window.removeEventListener('resize', checkScreenSize);
	});
</script>

{#if isMobile}
	<!-- Mobile Bottom Navigation -->
	<nav
		class="fixed right-0 bottom-0 left-0 z-50 flex h-[106px] items-end justify-around border-t py-2 md:hidden"
		style="background-color: {background_color};"
	>
		<div class="flex h-full w-full items-end justify-around">
			{#each mobileMenuItems as item}
				<button
					class={`flex h-full flex-col items-center justify-center text-gray-500`}
					aria-label={item.label}
				>
					{#if item.icon === 'plus'}
						<div
							class="flex h-[48px] w-[48px] items-center justify-center rounded-full text-white"
							style="background: linear-gradient(90deg, #DB3EC6 0%, #963DD4 50%, #513BE2 100%);"
							title="Create Event"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 6v6m0 0v6m0-6h6m-6 0H6"
								/>
							</svg>
						</div>
					{:else}
						<img src={item.icon} alt="icons" class="" />
						<span class="mt-1 text-xs">{item.label}</span>
					{/if}
				</button>
			{/each}
		</div>
	</nav>
{:else}
	<!-- Desktop Sidebar -->
	<aside
		class="fixed top-0 left-0 z-40 hidden h-screen w-[117px] flex-col items-center justify-evenly gap-10 border-r py-10 md:flex"
	>
		<div class="flex flex-col items-center space-y-10">
			<!-- Hamburger Menu -->
			<div class="cursor-pointer space-y-1">
				<div class="h-[2.5px] w-[20px] bg-[#513BE2]"></div>
				<div class="h-[2.5px] w-[20px] bg-[#513BE2]"></div>
				<div class="h-[2.5px] w-[20px] bg-[#513BE2]"></div>
			</div>

			<!-- Create Event (active) -->
			<button class="flex flex-col items-center justify-center gap-1">
				<div
					class="flex h-[48px] w-[48px] items-center justify-center rounded-full text-white"
					style="background: linear-gradient(90deg, #DB3EC6 0%, #963DD4 50%, #513BE2 100%);"
					title="Create Event"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 6v6m0 0v6m0-6h6m-6 0H6"
						/>
					</svg>
				</div>
				<p class="gradient-text">Create Event</p>
			</button>
		</div>

		<!-- Other menu items -->
		<div class="space-y-5">
			{#each menuItems.slice(1) as item}
				<button
					class="flex w-full flex-col items-center justify-center gap-1 p-2 text-gray-500 transition-colors"
					title={item.label}
					aria-label={item.label}
				>
					<img src={item.icon} alt="icons" />
					<p>{item.label}</p>
				</button>
			{/each}
		</div>

		<!-- Bottom utility icons -->
		<div class="mt-auto flex w-full flex-col items-center justify-center space-y-4">
			<img src="/notification.svg" alt="" />
			<img src="/face-1.svg" alt="" />
		</div>
	</aside>
{/if}

<!-- Spacer to prevent content overlap with fixed sidebar/bottom nav -->
<div class={isMobile ? 'pb-20' : 'pl-16'}></div>

<style>
	.gradient-text {
		background: linear-gradient(90deg, #db3ec6 0%, #963dd4 50%, #513be2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		color: transparent;
	}
</style>
