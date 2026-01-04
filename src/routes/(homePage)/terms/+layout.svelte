<script>
	import Header from './components/Header.svelte';
</script>

<section>
	<Header />

	<main class="bg-color px-4 py-8 sm:px-6">
		<slot />

		<div class="flex flex-col items-center gap-4 py-8 text-center">
			<p class="text-2xl font-bold">Didn’t find what you are looking for?</p>
			<a
				class="flex cursor-pointer items-center gap-1 rounded-md bg-black px-5 py-2 text-sm text-white transition hover:bg-gray-800 sm:px-6 sm:text-base"
				href="/contact"
			>
				<img src="/direct-normal.png" alt="icon" class="h-4 w-4 sm:h-5 sm:w-5" />
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