<script lang="ts">
	import { browser } from '$app/environment';
	import Sidebar from '../components/Sidebar.svelte';
	import SideMenu from '../components/SideMenu.svelte';
	import { showSubMenu, subMenuItems, activeSubItem } from '$lib/stores/uiStore.js';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	const themes = {
		default: 'linear-gradient(180deg, #d1e8f5 0%, #EAF2F5 17%, #f4f5f6 35%)',
		eventMain: 'linear-gradient(180deg, #DBD4F1 0%, #DBE5F5 17%, #F4F5F6 35%)',
		eventRegistration: 'linear-gradient(180deg, #DDD1E1 0%, #F2EBE8 17%, #F4F5F6 35%)',
		eventMore: 'linear-gradient(180deg, #FFD8D2 0%, #FFECE9 17%, #FAF9F6 35%)',
		collection: 'linear-gradient(180deg, #F4E1D2 0%, #F8F2E9 17%, #FAF9F6 35%)'
	};

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

	let selectedTheme = themes.default;

	function getThemeForRoute(path: string | null): string {
		if (!path) return themes.default;

		if (path.startsWith('/events/') && path.includes('/registration'))
			return themes.eventRegistration;
		if (path.startsWith('/events/')) return themes.eventMain;
		if (path.startsWith('/collections/')) return themes.collection;

		return themes.default;
	}

	$: menuItems = $subMenuItems;
	$: activeItem = $activeSubItem;
	$: isSubMenuVisible = isMobile ? menuItems.length > 0 : $showSubMenu;

	$: {
		const path = $page.url.pathname;
		selectedTheme = getThemeForRoute(path);

		// show submenu only for nested event subroutes (not base)
		if (!path.startsWith('/events/') && path === '/events') {
			showSubMenu.set(false);
			subMenuItems.set([]);
			activeSubItem.set('');
		}
	}
</script>

<div
	class="relative flex min-h-screen flex-col text-sm font-medium md:flex-row"
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
