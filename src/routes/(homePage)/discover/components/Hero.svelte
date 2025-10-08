<!-- src/lib/components/Header.svelte -->
<script>
	let searchQuery = '';
	let activeItem = 'Events';

	const menuItems = [
		{ name: 'Events', icon: '' },
		{ name: 'Exhibitors', icon: '' },
		{ name: 'Vendors', icon: '' },
		{ name: 'Speakers', icon: '' },
		{ name: 'Community', icon: '' }
	];
</script>

<header class="h-full">
	<div class="hero-section relative mb-6 h-full">
		<div
			class="mb-8 flex flex-col items-center justify-center gap-6 px-6 py-15 pb-20 text-center lg:pb-38"
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
	</div>

	<div
		class="custom-scrollbar flex gap-4 overflow-x-auto overflow-y-hidden pt-4 whitespace-nowrap lg:hidden"
	>
		{#each menuItems as item}
			<button
				class={`flex flex-shrink-0 items-center gap-3 rounded-md px-4 py-2 transition ${
					activeItem === item.name
						? 'rounded-2xl border border-purple-700 text-purple-700'
						: 'bg-[#eeeff0] text-gray-700'
				}`}
				on:click={() => (activeItem = item.name)}
			>
				<span></span>
				{item.name}
			</button>
		{/each}
	</div>

	<!-- Filters (optional - can be moved to main content later) -->
	<div class="custom-scrollbar flex gap-4 overflow-x-auto overflow-y-hidden pt-4 whitespace-nowrap">
		{#each ['Category', 'Event Type', 'Location', 'Language', 'Currency'] as filter}
			<button
				class="flex flex-shrink-0 items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-sm text-[#616265]"
			>
				<img src="filter-edit.png" alt="filter icon" class="h-5 w-5" />
				{filter}
				<img src="/arrow-down.png" alt="Arrow Down" class="h-2 w-3 opacity-60" />
			</button>
		{/each}
		<button
			class="flex flex-shrink-0 items-center gap-1 rounded-full border border-purple-200 px-3 py-1 text-sm text-purple-600"
		>
			Clear
			<span>○</span>
		</button>
	</div>
</header>

<style>
	.hero-section {
		position: relative;
		background: linear-gradient(135deg, #e6e6fa 0%, #ffffff 50%, #f8e1ff 100%);
	}
</style>
