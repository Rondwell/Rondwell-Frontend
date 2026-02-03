<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	export let items: any[] = [];
	export let activeItem = '';
	export let variant: 'default' | 'horizontal' = 'default';

	let isMobile = false;
	let navContainer: HTMLElement | null = null;

	function checkScreenSize() {
		if (browser) {
			isMobile = window.innerWidth < 768;
		}
	}

	/* ---------- Horizontal scroll helpers ---------- */
	function scrollRight() {
		if (navContainer) {
			navContainer.scrollBy({ left: 200, behavior: 'smooth' });
		}
	}

	let showScrollBtn = false;
	let lastScrollLeft = 0;
	let scrollTimeout: ReturnType<typeof setTimeout>;

	function handleScroll() {
		if (!navContainer) return;

		const currentScrollLeft = navContainer.scrollLeft;

		if (currentScrollLeft > lastScrollLeft) {
			showScrollBtn = true;
			clearTimeout(scrollTimeout);

			scrollTimeout = setTimeout(() => {
				showScrollBtn = false;
			}, 2000);
		}

		lastScrollLeft = currentScrollLeft;
	}

	onMount(() => {
		checkScreenSize();
		window.addEventListener('resize', checkScreenSize);
		return () => window.removeEventListener('resize', checkScreenSize);
	});
</script>

{#if variant === 'horizontal'}
	<!-- ✅ SETTINGS MODE (HORIZONTAL ONLY - MOBILE + DESKTOP) -->
	<nav
		bind:this={navContainer}
		on:scroll={handleScroll}
		class="custom-scrollbar flex gap-3 overflow-x-auto overflow-y-hidden py-4 px-1 whitespace-nowrap w-full"
	>
		{#if showScrollBtn}
			<div class="bg fade-in">
				<button
					on:click={scrollRight}
					class="scroll-bg fixed top-[120px] right-2 z-50 flex h-10 w-10 cursor-pointer items-center justify-center  p-2 shadow-xl transition duration-300"
				>
					<img src="/arrow-down.png" alt="Arrow" class="h-3 w-4 opacity-80" />
				</button>
			</div>
		{/if}

		{#each items as item}
			<button
	class={`flex flex-shrink-0 cursor-pointer items-center gap-2 px-4 py-2 transition border-b-2 ${
		activeItem === item.label
			? 'border-[#DB3EC6] text-[#DB3EC6] bg-transparent'
			: 'border-transparent text-[#808080] hover:text-[#DB3EC6]'
	}`}
	on:click={() => {
		goto(item.nav);
		activeItem = item.label;
	}}
>
	{#if item.icon}
		<span>{@html item.icon}</span>
	{/if}
	{item.label}
</button>

		{/each}
	</nav>

{:else if isMobile}
	<!-- DEFAULT MODE - MOBILE -->
	<nav
		bind:this={navContainer}
		on:scroll={handleScroll}
		class="custom-scrollbar flex gap-3 overflow-x-auto overflow-y-hidden py-6 pr-12 whitespace-nowrap md:hidden"
	>
		{#if showScrollBtn}
			<div class="bg fade-in">
				<button
					on:click={scrollRight}
					class="scroll-bg fixed top-[20px] right-0 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full p-3 shadow-xl transition duration-300"
				>
					<img src="/arrow-down.png" alt="Arrow" class="h-3 w-5 opacity-80" />
				</button>
			</div>
		{/if}

		{#each items as item}
			<button
				class={`flex flex-shrink-0 cursor-pointer items-center gap-3 rounded-md px-4 py-2 transition ${
					activeItem === item.label ? 'selected text-[#DB3EC6]' : 'text-[#808080]'
				}`}
				on:click={() => {
					goto(item.nav);
					activeItem = item.label;
				}}
			>
				<span>{@html item.icon}</span>
				{item.label}
			</button>
		{/each}
	</nav>

{:else}
	<!-- ✅ DEFAULT MODE - DESKTOP -->
	<aside
		class="fixed top-0 left-[117px] z-10 hidden h-screen w-[250px] flex-col items-start justify-start gap-10 border-r px-6 py-10 md:flex"
	>
		<a href="/overview">
			<img src="/logo.svg" alt="Rondwell Logo" class="h-8 w-auto" />
		</a>

		<div class="w-full space-y-2">
			{#each items as item}
				<button
					class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5
					{item.label === activeItem ? 'selected text-[#DB3EC6]' : 'text-[#808080]'}"
					on:click={() => {
						goto(item.nav);
						activeItem = item.label;
					}}
				>
					{#if item.icon}
						<p class="h-5 w-5">{@html item.icon}</p>
					{/if}
					<span class="text-sm font-light">{item.label}</span>
				</button>
			{/each}
		</div>
	</aside>
{/if}

<style>
	.selected {
		background: rgba(219, 62, 198, 0.22);
		border: 1px solid #db3ec6;
		border-radius: 12px;
	}

	.scroll-bg {
		background: #ffffff;
		box-shadow: 0px 4px 10px rgba(141, 128, 128, 0.25);
		transform: rotate(90deg);
	}

	.bg {
		position: absolute;
		width: 55px;
		height: 100%;
		right: 0;
		top: 0;
		border-radius: 16px;
		background: linear-gradient(270deg, rgba(255, 255, 255, 0.01) 10%, #ffffff 100%);
		transform: rotate(-180deg);
	}
</style>
