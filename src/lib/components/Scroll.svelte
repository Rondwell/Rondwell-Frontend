<script>
	import { onMount } from 'svelte';

	let scrolled = false;
	let showScrollTop = false;

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function handleScroll() {
		scrolled = window.scrollY > 20;
		showScrollTop = window.scrollY > 300;
	}

	onMount(() => {
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});
</script>

<div>
	{#if showScrollTop}
		<button
			on:click={scrollToTop}
			class="scroll-bg fixed right-6 bottom-6 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full p-3 shadow-xl transition duration-30"
		>
			<img src="/arrow-down.png" alt="Arrow Down" class="h-3 w-5 opacity-80" />
		</button>
	{/if}
</div>

<style>
	.scroll-bg {
		background: #ffffff;
		box-shadow: 0px 4px 10px rgba(141, 128, 128, 0.25);
		/* border-radius: 28.5px; */
		transform: rotate(-180deg);
	}
</style>
