<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	export let items: any[] = [];
	export let activeItem = '';
	let isMobile = false;

	let navContainer: HTMLElement | null = null;

	function scrollRight() {
		if (navContainer) {
			navContainer.scrollBy({ left: 200, behavior: 'smooth' });
		}
	}

	function checkScreenSize() {
		if (browser) {
			isMobile = window.innerWidth < 768;
		}
	}

	let showScrollBtn = false;
	let lastScrollLeft = 0;
	let scrollTimeout: ReturnType<typeof setTimeout>;

	function handleScroll() {
		if (!navContainer) return;

		const currentScrollLeft = navContainer.scrollLeft;

		// ✅ If user is scrolling right
		if (currentScrollLeft > lastScrollLeft) {
			showScrollBtn = true;
			clearTimeout(scrollTimeout);

			// Hide after 1s of no scroll
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

{#if isMobile}
	<!-- Mobile Bottom Navigation -->

	<nav
		bind:this={navContainer}
		on:scroll={handleScroll}
		class="custom-scrollbar flex gap-3 overflow-x-auto overflow-y-hidden py-6 pr-12 whitespace-nowrap md:hidden"
	>
		<!-- <div class="bg">
			<button
				on:click={scrollRight}
				class="scroll-bg fixed top-[20px] right-0 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full p-3 shadow-xl transition duration-30"
			>
				<img src="/arrow-down.png" alt="Arrow Down" class="h-3 w-5 opacity-80" />
			</button>
		</div> -->

		{#if showScrollBtn}
			<div class="bg fade-in">
				<button
					on:click={scrollRight}
					class="scroll-bg fixed top-[20px] right-0 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full p-3 shadow-xl transition duration-300"
				>
					<img src="/arrow-down.png" alt="Arrow Down" class="h-3 w-5 opacity-80" />
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
		/* border-radius: 28.5px; */
		transform: rotate(90deg);
	}

	.bg {
		/* Rectangle 40302 */

		position: absolute;
		width: 55px;
		height: 63px;
		right: 0;
		top: 0px;
		height: 100%;
		border-radius: 16px;
		background: linear-gradient(270deg, rgba(255, 255, 255, 0.01) 10%, #ffffff 100%);
		transform: rotate(-180deg);
	}
</style>
