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
		class="custom-scrollbar flex space-x-4 overflow-x-auto border-b border-gray-400 md:space-x-8"
	>
		{#each tabs as tab}
			<button
				on:click|preventDefault={() => setTab(tab.id)}
				class="flex w-fit min-w-30 sm:min-w-33 flex-shrink-0 items-center justify-center gap-2 border-b-2 pb-3 font-medium transition-colors duration-300 sm:w-full sm:max-w-50 md:min-w-auto {tabs.length <=
				4
					? 'lg:max-w-none lg:flex-shrink'
					: ''}
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
