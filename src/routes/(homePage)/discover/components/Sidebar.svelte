<!-- src/lib/components/Sidebar.svelte -->
<script>
	// You can add logic for active state, etc.
	let activeItem = 'Events';

	const menuItems = [
		{ name: 'Events', icon: '' },
		{ name: 'Exhibitors', icon: '' },
		{ name: 'Vendors', icon: '' },
		{ name: 'Speakers', icon: '' },
		{ name: 'Community', icon: '' }
	];
</script>

<aside class="flex w-72 flex-col">
	<div class="h-fit rounded-2xl border-2 border-gray-200 p-4">
		<!-- Logo & Title -->
		<div class="flex w-full items-center justify-start gap-2 py-6 text-xl font-bold">
			<img src="logo1.png" alt="roundwell logo" class="h-11 w-11" />
			Discover
		</div>

		<!-- Menu Items -->
		<nav class="flex-1 space-y-3">
			{#each menuItems as item}
				<button
					class={`flex w-full items-center gap-3 rounded-md px-4 py-2 transition ${
						activeItem === item.name
							? 'rounded-2xl border border-purple-700 text-purple-700'
							: 'text-gray-700 hover:bg-gray-100'
					}`}
					on:click={() => (activeItem = item.name)}
				>
					<span>{item.icon}</span>
					{item.name}
					<!-- Badge placeholder -->
					{#if item.name === 'Events'}
						<span class="ml-auto rounded-full bg-purple-100 p-2 text-xs text-purple-700">⌘E</span>
					{:else}
						<span class="ml-auto p-2 text-xs text-gray-400">⌘V</span>
					{/if}
				</button>
			{/each}
		</nav>
	</div>
</aside>
