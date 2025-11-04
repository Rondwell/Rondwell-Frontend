<script>
	import { browser } from '$app/environment';
	import Header from '../components/Header.svelte';
	import Sidebar from '../components/Sidebar.svelte';
	import SideMenu from '../components/SideMenu.svelte';
	import { showSubMenu, subMenuItems, activeSubItem } from '$lib/stores/uiStore.js';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	const themes = ['linear-gradient(180deg, #d1e8f5 0%, #EAF2F5 17%, #f4f5f6 35%)'];

	let isMobile = false;

	function checkScreenSize() {
		if (browser) {
			isMobile = window.innerWidth < 768;
		}
	}

	onMount(() => {
		checkScreenSize();
		window.addEventListener('resize', checkScreenSize);
		return () => window.removeEventListener('resize', checkScreenSize);
	});

	let selectedTheme = themes[0];

	$: isSubMenuVisible = isMobile ? menuItems.length > 0 : $showSubMenu;
	$: menuItems = $subMenuItems;
	$: activeItem = $activeSubItem;

	$: if ($page.url.pathname && !$page.url.pathname.startsWith('/event')) {
		subMenuItems.set([]);
		activeSubItem.set('');
		showSubMenu.set(false);
	}
</script>

<div
	class="relative flex min-h-screen text-sm font-medium"
	style="background-image: {selectedTheme};"
>
	<!-- Sidebar -->
	<div class="relative md:min-w-[117px]">
		<Sidebar background_color="#f4f5f6" />
	</div>

	{#if isSubMenuVisible}
		<div class="relative hidden md:block md:min-w-[250px]">
			<SideMenu items={menuItems} {activeItem} />
		</div>
	{/if}
	<main class="relative mb-[106px] flex min-h-screen w-full flex-col p-3 md:mb-0 md:p-5">
		<Header />
		<div class="bg flex w-full flex-1 flex-col px-3 py-4 md:p-6 lg:p-8">
			{#if isSubMenuVisible && menuItems.length > 0}
				<div class="relative mb-6 md:hidden">
					<SideMenu items={menuItems} {activeItem} />
				</div>
			{/if}
			<slot class="h-full w-full flex-1" />
		</div>
	</main>
</div>

<style>
	.bg {
		background: rgba(255, 255, 255, 0.08);
		box-shadow:
			0px 0px 0px 1px rgba(64, 87, 109, 0.04),
			0px 6px 20px -4px rgba(64, 87, 109, 0.3);
		border-radius: 12px;
	}
</style>
