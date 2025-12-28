<script>
	import Footer from './components/Footer.svelte';
</script>

<div class="flex flex-col min-h-screen">
	<main class="flex-1 bg-[#F4F5F6]">
		<slot />
	</main>

	<Footer />
</div>