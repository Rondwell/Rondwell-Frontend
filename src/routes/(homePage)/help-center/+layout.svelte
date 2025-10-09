<script>
	import Header from './components/Header.svelte';
</script>

<section>
	<Header />

	<main class="bg-color px-6 py-8">
		<slot />
	</main>
</section>

<style>
	.bg-color {
		background: linear-gradient(180deg, #f5efec 0%, #f4edea 17%, #f4f5f6 43%);
	}
</style>
