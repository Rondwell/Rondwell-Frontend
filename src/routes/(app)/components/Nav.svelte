<script lang="ts">
	import { onMount } from 'svelte';

	interface TabItem {
		id: string;
		label: string;
		icon: string;
	}

	export let tabs: TabItem[] = [];
	export let activeTab: string = tabs[0]?.id || '';
	// Query param key used to persist the active tab across refreshes.
	export let paramKey: string = 'tab';

	// Sync the active tab to the URL so it persists across page refreshes.
	const syncUrl = (tab: string) => {
		if (typeof window === 'undefined') return;
		const url = new URL(window.location.href);
		url.searchParams.set(paramKey, tab);
		window.history.replaceState(window.history.state, '', url.toString());
	};

	const setTab = (tab: string) => {
		activeTab = tab;
		syncUrl(tab);
	};

	onMount(() => {
		if (typeof window === 'undefined') return;
		const params = new URLSearchParams(window.location.search);
		const tabParam = params.get(paramKey);
		if (tabParam && tabs.some((t) => t.id === tabParam)) {
			// Restore the persisted tab on load.
			activeTab = tabParam;
		} else {
			// Ensure the URL reflects the current default tab.
			syncUrl(activeTab);
		}
	});
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
