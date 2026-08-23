<!--
	Gifts — section shell.

	Registers the gift section in the same `subMenuItems` store the event and
	collection dashboards use, so Gifts gets the real SideMenu treatment rather
	than being a single flat page hanging off the sidebar. Nothing here renders
	chrome of its own: `(main)/+layout.svelte` already owns the Sidebar, the
	SideMenu and the page frame, which is exactly why the gift pages were moved
	inside that group.

	The per-link dashboard (`manage/[id]`) registers its OWN submenu on top of
	this one, mirroring how `events/[id]` swaps the menu once you are inside a
	single event. This layout deliberately does not fight it: it only sets the
	section menu when the route is NOT a per-link page.
-->
<script lang="ts">
	import { page } from '$app/stores';
	import { activeSubItem, showSubMenu, subMenuItems } from '$lib/stores/uiStore.js';

	const icons = {
		overview: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M20 12v9H4v-9M12 21V8M22 8H2v4h20V8zM12 8H7.5a2.5 2.5 0 010-5C11 3 12 8 12 8zM12 8h4.5a2.5 2.5 0 000-5C13 3 12 8 12 8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
		</svg>`,
		received: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M12 3v12m0 0l-4-4m4 4l4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			<path d="M3 15v2a4 4 0 004 4h10a4 4 0 004-4v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
		</svg>`
	};

	$: path = $page.url.pathname;
	// `manage/[id]` owns the menu while you are inside one link.
	$: isPerLink = path.startsWith('/gift/manage/');

	$: if (!isPerLink) {
		subMenuItems.set([
			{ label: 'Overview', icon: icons.overview, nav: '/gift' },
			{ label: 'Received', icon: icons.received, nav: '/gift/received' }
		]);
		showSubMenu.set(true);
		activeSubItem.set(path === '/gift/received' ? 'Received' : 'Overview');
	}
</script>

<slot />
