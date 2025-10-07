<!-- src/lib/components/Header.svelte -->
<script>
	let searchQuery = '';
</script>

<header class="hero-section relative">
	<div
		class="relative mb-15 flex flex-col items-center justify-center gap-6 px-6 py-15 text-center"
	>
		<!-- Main Title -->
		<h1 class="text-5xl font-bold text-gray-800">Discover Unlimited Events</h1>

		<!-- Search Bar -->
		<div class="relative w-full max-w-4xl">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search events, and collections"
				class="h-[43px] w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:ring-2 focus:ring-purple-500 focus:outline-none"
			/>
			<span class="absolute top-2.5 left-3 text-gray-400">
				<img src="search.png" alt="search icon" class="h-5 w-5" />
			</span>
			<span class="absolute top-2 right-3 bg-[#eeeeef] p-1 text-sm text-gray-500">⌘K</span>
		</div>

		<!-- Stats -->
		<div class="text-md flex gap-6 font-bold text-gray-400">
			<span>39,374 <span class="font-medium">Events</span></span>
			<div class="border border-l border-gray-600"></div>
			<span>1,599,060 <span class="font-medium">Organizers</span></span>
		</div>
	</div>

	<div class="absolute bottom-0 w-full">
		<img src="floor-light.svg.png" alt="" class="w-full opacity-50" />
	</div>
</header>
<!-- Filters (optional - can be moved to main content later) -->
<div class="flex flex-wrap gap-4 pt-4">
	{#each ['Category', 'Event Type', 'Location', 'Language', 'Currency'] as filter}
		<button
			class="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
		>
			<span>🔘</span>
			{filter}
			<span>▼</span>
		</button>
	{/each}
	<button
		class="flex items-center gap-1 rounded-full border border-purple-200 px-3 py-1 text-sm text-purple-600"
	>
		Clear
		<span>○</span>
	</button>
</div>

<style>
	.hero-section {
		position: relative;
		background: linear-gradient(135deg, #e6e6fa 0%, #ffffff 50%, #f8e1ff 100%);
	}
</style>
