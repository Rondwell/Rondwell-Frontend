<script lang="ts">
	import { page } from '$app/stores';
	import { activeEventPageTheme, getEventTheme } from '$lib/stores/eventTheme';
	import { activeSubItem, showSubMenu, subMenuItems } from '$lib/stores/uiStore.js';
	import type { Color } from '$lib/utils/colors';
	import { colors } from '$lib/utils/colors';

	// Hide the organizer submenu on the public event page
	showSubMenu.set(false);
	subMenuItems.set([]);
	activeSubItem.set('');

	let themeColor: Color = colors[0];

	$: {
		const match = $page.url.pathname.match(/^\/event-page\/([^/]+)/);
		if (match) {
			themeColor = getEventTheme(match[1]);
			activeEventPageTheme.set(themeColor);
		} else {
			activeEventPageTheme.set(null);
		}
	}

	const tabIcons = {
		overview: `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.3333 18.9583H6.66667C1.875 18.9583 1.875 16.4167 1.875 14.1667V13.3333C1.875 11.475 1.875 9.375 5.83333 9.375C6.825 9.375 7.19167 9.61667 7.70833 10C7.73333 10.025 7.76667 10.0417 7.79167 10.075L8.64167 10.975C9.35833 11.7333 10.6583 11.7333 11.375 10.975L12.225 10.075C12.25 10.05 12.275 10.025 12.3083 10C12.825 9.60833 13.1917 9.375 14.1833 9.375C18.1417 9.375 18.1417 11.475 18.1417 13.3333V14.1667C18.125 17.35 16.5167 18.9583 13.3333 18.9583ZM5.83333 10.625C3.125 10.625 3.125 11.475 3.125 13.3333V14.1667C3.125 16.45 3.125 17.7083 6.66667 17.7083H13.3333C15.8167 17.7083 16.875 16.65 16.875 14.1667V13.3333C16.875 11.475 16.875 10.625 14.1667 10.625C13.5667 10.625 13.4417 10.7 13.0833 10.9667L12.275 11.825C11.675 12.4583 10.8667 12.8083 10 12.8083C9.13333 12.8083 8.325 12.4583 7.725 11.825L6.91667 10.9667C6.55833 10.7 6.43333 10.625 5.83333 10.625Z" fill="currentColor"/><path d="M15.8327 10.6224C15.491 10.6224 15.2077 10.3391 15.2077 9.9974V4.9974C15.2077 3.13906 15.2077 2.28906 12.4993 2.28906H7.49935C4.79102 2.28906 4.79102 3.13906 4.79102 4.9974V9.9974C4.79102 10.3391 4.50768 10.6224 4.16602 10.6224C3.82435 10.6224 3.54102 10.3391 3.54102 9.9974V4.9974C3.54102 3.13906 3.54102 1.03906 7.49935 1.03906H12.4993C16.4577 1.03906 16.4577 3.13906 16.4577 4.9974V9.9974C16.4577 10.3391 16.1743 10.6224 15.8327 10.6224Z" fill="currentColor"/></svg>`,
		agenda: `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path opacity="0.4" d="M15.833 1.66797H14.1663C12.4997 1.66797 11.6663 2.5013 11.6663 4.16797V5.83464C11.6663 7.5013 12.4997 8.33464 14.1663 8.33464H15.833C17.4997 8.33464 18.333 7.5013 18.333 5.83464V4.16797C18.333 2.5013 17.4997 1.66797 15.833 1.66797Z" fill="currentColor"/><path opacity="0.4" d="M5.83301 11.668H4.16634C2.49967 11.668 1.66634 12.5013 1.66634 14.168V15.8346C1.66634 17.5013 2.49967 18.3346 4.16634 18.3346H5.83301C7.49967 18.3346 8.33301 17.5013 8.33301 15.8346V14.168C8.33301 12.5013 7.49967 11.668 5.83301 11.668Z" fill="currentColor"/><path d="M5 8.33464C6.84095 8.33464 8.33333 6.84226 8.33333 5.0013C8.33333 3.16035 6.84095 1.66797 5 1.66797C3.15905 1.66797 1.66667 3.16035 1.66667 5.0013C1.66667 6.84226 3.15905 8.33464 5 8.33464Z" fill="currentColor"/><path d="M15 18.3346C16.8409 18.3346 18.3333 16.8423 18.3333 15.0013C18.3333 13.1603 16.8409 11.668 15 11.668C13.1591 11.668 11.6667 13.1603 11.6667 15.0013C11.6667 16.8423 13.1591 18.3346 15 18.3346Z" fill="currentColor"/></svg>`,
		participants: `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path opacity="0.4" d="M7.63281 3.125C5.52344 3.125 3.82031 4.82812 3.82031 6.9375C3.82031 9.00781 5.44531 10.6719 7.55469 10.7422H7.58594C7.64844 10.7344 7.71094 10.7344 7.75781 10.7422H7.77344C9.84375 10.6641 11.4453 9.00781 11.4531 6.9375C11.4531 4.82812 9.75 3.125 7.63281 3.125Z" fill="currentColor"/><path d="M11.7031 11.7969C9.45312 10.2344 5.83594 10.2344 3.57031 11.7969C2.50781 12.5156 1.92188 13.4922 1.92188 14.5312C1.92188 15.5703 2.50781 16.5391 3.5625 17.25C4.73438 18.0469 6.28125 18.4453 7.82812 18.4453C9.375 18.4453 10.9219 18.0469 12.0938 17.25C13.1484 16.5312 13.7344 15.5625 13.7344 14.5156C13.7266 13.4766 13.1484 12.5078 11.7031 11.7969Z" fill="currentColor"/><path opacity="0.4" d="M16.6484 7.8125C16.7734 9.35156 15.6484 10.7031 14.1328 10.8906H14.0938C14.0469 10.8906 14 10.8906 13.9609 10.9062C13.1875 10.9453 10.9453 10.8672 11.6328 10.2578C12.4141 9.5625 12.8906 8.5625 12.7891 7.4609C12.7344 6.875 12.5078 6.34375 12.1719 5.90625C12.4766 5.75781 12.8281 5.66406 13.1875 5.63281C14.7578 5.50781 16.2109 6.64062 16.6484 7.8125Z" fill="currentColor"/><path d="M18.2344 13.9219C18.1719 14.6953 17.6562 15.3594 16.8047 15.8047C15.9922 16.2344 14.9609 16.4375 13.9375 16.4141C14.5234 15.875 14.8672 15.1875 14.9297 14.4609C15.0078 13.4297 14.5234 12.4375 13.4922 11.6484C12.8984 11.2109 12.2031 10.8672 11.4453 10.625C13.4453 10.0547 15.9609 10.4453 17.3672 11.7578C18.0859 12.4219 18.3047 13.1641 18.2344 13.9219Z" fill="currentColor"/></svg>`,
		media: `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.3337 7.5013V12.5013C18.3337 16.668 16.667 18.3346 12.5003 18.3346H7.50033C3.33366 18.3346 1.66699 16.668 1.66699 12.5013V7.5013C1.66699 3.33464 3.33366 1.66797 7.50033 1.66797H12.5003C16.667 1.66797 18.3337 3.33464 18.3337 7.5013Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path opacity="0.4" d="M7.50033 8.33464C8.42080 8.33464 9.16699 7.58844 9.16699 6.66797C9.16699 5.74750 8.42080 5.0013 7.50033 5.0013C6.57985 5.0013 5.83366 5.74750 5.83366 6.66797C5.83366 7.58844 6.57985 8.33464 7.50033 8.33464Z" fill="currentColor"/><path d="M2.22461 15.7096L6.33294 12.9596C6.99128 12.5263 7.94128 12.5763 8.53294 13.0763L8.80794 13.318C9.45794 13.868 10.4996 13.868 11.1496 13.318L14.6246 10.418C15.2746 9.86797 16.3163 9.86797 16.9663 10.418L18.3329 11.5846" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
		community: `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.167 17.5H5.83366C3.33366 17.5 1.66699 16.25 1.66699 13.3333V6.66667C1.66699 3.75 3.33366 2.5 5.83366 2.5H14.167C16.667 2.5 18.3337 3.75 18.3337 6.66667V13.3333C18.3337 16.25 16.667 17.5 14.167 17.5Z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/><path opacity="0.4" d="M14.167 7.08203L11.5587 9.16536C10.7003 9.8487 9.29199 9.8487 8.43366 9.16536L5.83366 7.08203" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/></svg>`
	};

	$: eventId = (() => {
		const match = $page.url.pathname.match(/^\/event-page\/([^/]+)/);
		return match ? match[1] : '1';
	})();

	$: tabs = [
		{ label: 'Overview', link: `/event-page/${eventId}`, icon: tabIcons.overview },
		{ label: 'Agenda', link: `/event-page/${eventId}/agenda`, icon: tabIcons.agenda },
		{ label: 'Participants', link: `/event-page/${eventId}/participant`, icon: tabIcons.participants },
		{ label: 'Media / FAQs', link: `/event-page/${eventId}/media`, icon: tabIcons.media },
		{ label: 'Community', link: `/event-page/${eventId}/community`, icon: tabIcons.community }
	];

	$: currentPath = $page.url.pathname;

	function isActive(link: string): boolean {
		if (link === `/event-page/${eventId}`) {
			return currentPath === link;
		}
		return currentPath.startsWith(link);
	}
</script>

<!-- Themed tab navigation -->
<nav
	class="custom-scrollbar mb-6 flex gap-2 overflow-x-auto whitespace-nowrap pb-1"
	aria-label="Event sections"
>
	{#each tabs as tab}
		<a
			href={tab.link}
			class="flex flex-shrink-0 items-center gap-2 rounded-[12px] px-3 py-2 text-sm font-medium transition-all duration-200"
			style={isActive(tab.link)
				? `background-color: ${themeColor.cover}; color: ${themeColor.text}; border: 1.5px solid ${themeColor.toggle};`
				: `background-color: ${themeColor.smallCover}; color: ${themeColor.lightText}; border: 1.5px solid transparent;`}
		>
			<span
				class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px]"
				style="background-color: {isActive(tab.link) ? themeColor.toggle : themeColor.cover}; color: {themeColor.text};"
			>
				{@html tab.icon}
			</span>
			{tab.label}
		</a>
	{/each}
</nav>

<!-- Page content -->
<slot />
