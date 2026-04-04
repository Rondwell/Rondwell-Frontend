<script lang="ts">
	interface TabItem {
		id: string;
		label: string;
		icon: string;
	}

	export let tabs: TabItem[] = [];
	export let activeTab: string = tabs[0]?.id || '';

	const setTab = (tab: string) => (activeTab = tab);
</script>

<!-- Navigation Tabs -->
<div class="mb-10">
	<nav
		class="custom-scrollbar -mx-4 flex overflow-x-auto border-b border-gray-400 px-4 sm:mx-0 sm:px-0"
	>
		{#each tabs as tab}
			<button
				on:click|preventDefault={() => setTab(tab.id)}
				class="flex flex-shrink-0 items-center justify-center gap-1.5 border-b-2 px-3 pb-3 text-sm font-medium whitespace-nowrap transition-colors duration-300 sm:px-4 sm:text-base
					{activeTab === tab.id
					? 'border-[#DB3EC6] text-[#DB3EC6]'
					: 'border-transparent text-gray-500 hover:text-gray-700'}"
			>
				<span class="flex items-center justify-center">{@html tab.icon}</span>
				{tab.label}
			</button>
		{/each}
	</nav>
</div>
