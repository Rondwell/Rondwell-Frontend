<script>
	const menuItems = [
		{ id: 'create', label: 'Create Event', icon: 'plus', active: true },
		{ id: 'event', label: 'Events', icon: '/ticket-2.svg' },
		{ id: 'collections', label: 'Collections', icon: '/cate.svg' },
		{ id: 'discover', label: 'Discover', icon: '/disc.svg' },
		{ id: 'experience', label: 'Experience', icon: '/exp.svg' }
	];
</script>

<aside
	class="custom-scrollbar fixed top-0 left-0 z-40 hidden h-screen w-[250px] flex-col items-center justify-evenly gap-10 overflow-y-auto border-r py-10 md:flex"
>
	<img src="/logo.svg" alt="Rondwell Logo" class="h-8 w-auto" />

	<!-- Other menu items -->
	<div class="space-y-5">
		{#each menuItems.slice(1) as item}
			<button
				class="flex w-full items-center justify-center gap-1 p-2 text-gray-500 transition-colors"
				title={item.label}
				aria-label={item.label}
			>
				<img src={item.icon} alt="icons" />
				<p>{item.label}</p>
			</button>
		{/each}
	</div>
</aside>
