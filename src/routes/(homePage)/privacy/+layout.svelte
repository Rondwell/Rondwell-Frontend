<script>
	import Header from './components/Header.svelte';
</script>

<section>
	<Header />

	<main class="bg-color px-4 py-6 md:px-6 md:py-8">
		<slot />

		<!-- Contact Section -->
		<div class="flex flex-col items-center gap-3 md:gap-4 py-6 md:py-8 text-center">
			<p class="text-2xl font-bold">Didn’t find what you are looking for?</p>
			<a
				class="flex cursor-pointer items-center gap-1 rounded-md bg-black px-4 md:px-6 py-2 text-white transition hover:bg-gray-800"
				href="/contact"
			>
				<img src="/direct-normal.png" alt="icon" class="h-5 w-5" />
				Contact Us
		</a>
		</div>
	</main>
</section>

<style>
	.bg-color {
		background: linear-gradient(180deg, #f5efec 0%, #f4edea 17%, #f4f5f6 43%);
	}
</style>
