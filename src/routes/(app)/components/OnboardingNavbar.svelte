<!-- src/lib/components/Sidebar.svelte -->
<script>
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import ProfileMenu from './ProfileMenu.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { clickOutside } from '$lib/utils/constant';
	import { activeSubItem, showSubMenu, subMenuItems } from '$lib/stores/uiStore.js';

	export let background_color = '';
	export let show = true;
	export let selectedColor = { lightText: '#909EA3' }; // Add default color

	let showMenu = false;
	let activeItem = '';

	function goHome() {
		goto('/overview');
		showSubMenu.set(false);
		subMenuItems.set([]);
		activeSubItem.set('');
	}

	// Menu items
	const menuItems = [
		{ id: 'create', label: 'Create Event', icon: 'plus', active: true, nav: '/create-event' },
		{
			id: 'event',
			label: 'Events',
			icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M18.91 14.6888C18.91 15.9788 19.97 17.0287 21.26 17.0287C21.26 20.7787 20.32 21.7188 16.57 21.7188H7.19C3.44 21.7188 2.5 20.7787 2.5 17.0287V16.5688C3.79 16.5688 4.85 15.5087 4.85 14.2188C4.85 12.9288 3.79 11.8687 2.5 11.8687V11.4087C2.51 7.65875 3.44 6.71875 7.19 6.71875H16.56C20.31 6.71875 21.25 7.65875 21.25 11.4087V12.3488C19.96 12.3488 18.91 13.3888 18.91 14.6888Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			<path d="M16.2111 6.7225H7.12109L10.0511 3.7925C12.4411 1.4025 13.6411 1.4025 16.0311 3.7925L16.6311 4.3925C16.0011 5.0225 15.8511 5.9525 16.2111 6.7225Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			<path d="M9.87891 6.71875L9.87891 21.7188" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="5 5"/>
			</svg>`,
			nav: '/events'
		},
		{
			id: 'collections',
			label: 'Collections',
			icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M17 10H19C21 10 22 9 22 7V5C22 3 21 2 19 2H17C15 2 14 3 14 5V7C14 9 15 10 17 10Z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
			<path d="M5 22H7C9 22 10 21 10 19V17C10 15 9 14 7 14H5C3 14 2 15 2 17V19C2 21 3 22 5 22Z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
			<path d="M6 10C8.20914 10 10 8.20914 10 6C10 3.79086 8.20914 2 6 2C3.79086 2 2 3.79086 2 6C2 8.20914 3.79086 10 6 10Z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
			<path d="M18 22C20.2091 22 22 20.2091 22 18C22 15.7909 20.2091 14 18 14C15.7909 14 14 15.7909 14 18C14 20.2091 15.7909 22 18 22Z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>`,
			nav: '/collection'
		},
		{
			id: 'discover',
			label: 'Discover',
			icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M20.2499 7.2397C21.5236 9.44571 22.1604 10.5487 22.2203 11.7549C22.2285 11.9201 22.2285 12.0856 22.2203 12.2508C22.1604 13.457 21.5236 14.56 20.2499 16.766C18.9763 18.972 18.3395 20.075 17.3248 20.73C17.1859 20.8197 17.0425 20.9024 16.8954 20.9779C15.8209 21.5291 14.5472 21.5291 11.9999 21.5291C9.45265 21.5291 8.17901 21.5291 7.10448 20.9779C6.95732 20.9024 6.814 20.8196 6.67504 20.73C5.6604 20.075 5.02357 18.972 3.74993 16.766C2.47629 14.56 1.83947 13.457 1.77959 12.2508C1.77139 12.0856 1.77139 11.9201 1.77959 11.7549C1.83947 10.5487 2.47629 9.44571 3.74994 7.2397C5.02358 5.03369 5.6604 3.93069 6.67504 3.27573C6.814 3.18603 6.95732 3.10329 7.10448 3.02779C8.17901 2.47656 9.45265 2.47656 11.9999 2.47656C14.5472 2.47656 15.8209 2.47656 16.8954 3.02779C17.0425 3.10329 17.1859 3.18603 17.3248 3.27573C18.3395 3.93069 18.9763 5.03369 20.2499 7.2397Z" stroke="currentColor" stroke-width="1.5"/>
			<path d="M10.016 11.1067C10.219 10.6136 10.6107 10.222 11.1038 10.0189L13.7807 8.91664C14.6026 8.5782 15.4246 9.40013 15.0861 10.2221L13.9839 12.8989C13.7808 13.3921 13.3892 13.7837 12.896 13.9868L10.2192 15.089C9.39722 15.4275 8.57529 14.6056 8.91373 13.7836L10.016 11.1067Z" stroke="currentColor" stroke-width="1.5"/>
			</svg>`,
			nav: '/discover?show=true'
		},
		{
			id: 'experience',
			label: 'Experience',
			icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M8.38086 11.9981L10.7909 14.4181L15.6209 9.57812" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			<path d="M10.7509 2.45031C11.4409 1.86031 12.5709 1.86031 13.2709 2.45031L14.8509 3.81031C15.1509 4.07031 15.7109 4.28031 16.1109 4.28031H17.8109C18.8709 4.28031 19.7409 5.15031 19.7409 6.21031V7.91031C19.7409 8.30031 19.9509 8.87031 20.2109 9.17031L21.5709 10.7503C22.1609 11.4403 22.1609 12.5703 21.5709 13.2703L20.2109 14.8503C19.9509 15.1503 19.7409 15.7103 19.7409 16.1103V17.8103C19.7409 18.8703 18.8709 19.7403 17.8109 19.7403H16.1109C15.7209 19.7403 15.1509 19.9503 14.8509 20.2103L13.2709 21.5703C12.5809 22.1603 11.4509 22.1603 10.7509 21.5703L9.17086 20.2103C8.87086 19.9503 8.31086 19.7403 7.91086 19.7403H6.18086C5.12086 19.7403 4.25086 18.8703 4.25086 17.8103V16.1003C4.25086 15.7103 4.04086 15.1503 3.79086 14.8503L2.44086 13.2603C1.86086 12.5703 1.86086 11.4503 2.44086 10.7603L3.79086 9.17031C4.04086 8.87031 4.25086 8.31031 4.25086 7.92031V6.20031C4.25086 5.14031 5.12086 4.27031 6.18086 4.27031H7.91086C8.30086 4.27031 8.87086 4.06031 9.17086 3.80031L10.7509 2.45031Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>`,
			nav: '/experience'
		}
	];

	$: mobileMenuItems = [...menuItems.slice(1, 3), menuItems[0], ...menuItems.slice(3)];

	// Reactive mobile detection
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

	$: if ($page && $page.url) {
		let path = $page.url.pathname;
		if (path === '/discover') {
			path = `${path}?show=true`;
		}
		const match = menuItems.find((item) => path.startsWith(item.nav));
		activeItem = match ? match.id : '';
	}

	$: {
		if (
			(activeItem && $page.url.pathname === '/events') ||
			(activeItem && $page.url.pathname === '/collection') ||
			(activeItem && $page.url.pathname === '/overview') ||
			(activeItem && $page.url.pathname === '/settings') ||
			(activeItem && $page.url.pathname === '/create-event') ||
			(activeItem && $page.url.pathname.startsWith('/discover')) ||
			(activeItem && $page.url.pathname === '/experience') ||
			$page.url.pathname === '/collection/create'
		) {
			showSubMenu.set(false);
			subMenuItems.set([]);
			activeSubItem.set('');
		}
	}
</script>

{#if isMobile}
	<!-- ================= MOBILE HEADER ================= -->
	<div class="z-50">
		<div class="items-center justify-between px-4 py-3 md:hidden {show ? 'flex' : 'hidden'}">
			<div use:clickOutside={() => (showMenu = false)}>
				<button onclick={() => (showMenu = !showMenu)}>
					<img src="/face-1.svg" alt="Profile" />
				</button>
				<ProfileMenu bind:showMenu className="absolute top-15 left-5 md:hidden" />
			</div>

			<button onclick={goHome}>
				<img src="/logo.svg" alt="Rondwell Logo" class="h-8 w-auto" />
			</button>

			<img src="/notification.svg" alt="Notifications" />
		</div>

		<!-- ================= MOBILE BOTTOM NAV ================= -->
		<nav
			class="fixed right-0 bottom-0 left-0 z-50 flex h-[106px] items-end justify-around border-t py-2 md:hidden bg-[#F5F6F7]"
		>
			<div class="flex h-full w-full items-end justify-around">
				{#each mobileMenuItems as item}
					<button
						class="flex h-full flex-col items-center justify-center text-gray-500"
						aria-label={item.label}
						onclick={() => goto(item.nav)}
					>
						{#if item.icon === 'plus'}
							<div
								class="flex h-[48px] w-[48px] items-center justify-center rounded-full text-white"
								style="background: linear-gradient(90deg, #DB3EC6 0%, #963DD4 50%, #513BE2 100%);"
								title="Create Event"
							>
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 6v6m0 0v6m0-6h6m-6 0H6"
									/>
								</svg>
							</div>
						{:else}
							<div class={activeItem === item.id ? 'selected' : ''}>
								<p>{@html item.icon}</p>
							</div>
							<span
								class="mt-1 text-xs {activeItem === item.id
									? 'text-[#513BE2]'
									: 'text-gray-500'} transition-colors">{item.label}</span
							>
						{/if}
					</button>
				{/each}
			</div>
		</nav>
	</div>
{:else}
	<!-- ================= DESKTOP HEADER ================= -->
	<div
		class="mx-auto mb-2 hidden w-full items-center justify-between border-b border-[#EBEBEB] px-8 py-5 md:flex"
	>
		<div class="flex w-full">
			<a href="/" class="mr-[20%] flex items-center gap-2">
				<img src="/logo.svg" alt="Rondwell Logo" class="h-8 w-auto" />
			</a>

			<div class="flex gap-5">
				<button
					class="flex items-center gap-1 text-[#909EA3] transition-colors hover:text-[#513BE2]"
					onclick={() => goto('/events')}
				>
					<img class="h-[17px] w-[18px]" src="/Discovery.svg" alt="discover" />
					<span class="text-[16px]">Discover Events</span>
				</button>

				<button
					class="flex items-center gap-1 text-[#909EA3] transition-colors hover:text-[#513BE2]"
					onclick={() => goto('/discover?show=true')}
				>
					<img class="h-[17px] w-[18px]" src="/Verified-explore.svg" alt="explore" />
					<span class="text-[16px]">Explore Experiences</span>
				</button>
			</div>
		</div>

		<div class="flex w-[350px] items-center justify-end gap-10">
			<div class="text-sm" style="color: {selectedColor.lightText}">
				{new Date().toLocaleTimeString('en-US', {
					hour: 'numeric',
					minute: '2-digit',
					hour12: true
				})} GMT+1
			</div>

			<div class="flex items-center gap-5">
				<img src="/search-favorite.svg" class="h-[18px] w-[18px]" alt="search" />
				<img src="/notification-favorite.svg" class="h-[18px] w-[18px]" alt="notification" />

				<div use:clickOutside={() => (showMenu = false)} class="relative">
					<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
					<img
						src="/face-1.svg"
						alt="profile"
						class="h-[27px] w-[27px] cursor-pointer"
						onclick={() => (showMenu = !showMenu)}
						onkeydown={(e) => e.key === 'Enter' && (showMenu = !showMenu)}
						role="button"
						tabindex="0"
					/>
					<ProfileMenu bind:showMenu className="absolute right-0 top-10" />
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	button {
		transition: all 0.3s ease;
	}

	.selected {
		position: relative;
		display: flex;
		align-items: center;
		justify-center: center;
		width: 48px;
		height: 48px;
		border-radius: 12px;
		background: rgba(81, 59, 226, 0.2);
		overflow: hidden;
		transition:
			background 0.3s ease,
			transform 0.3s ease;
	}

	.selected:hover {
		transform: scale(1.05);
	}

	.selected::before {
		content: '';
		position: absolute;
		inset: 0;
		padding: 2px;
		border-radius: inherit;
		background: linear-gradient(90deg, #db3ec6, #963dd4, #513be2);
		-webkit-mask:
			linear-gradient(#fff 0 0) content-box,
			linear-gradient(#fff 0 0);
		mask:
			linear-gradient(#fff 0 0) content-box,
			linear-gradient(#fff 0 0);
		-webkit-mask-composite: xor;
		mask-composite: exclude;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.selected::before {
		opacity: 1;
	}

	.gradient-text {
		background: linear-gradient(90deg, #db3ec6 0%, #963dd4 50%, #513be2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		color: transparent;
		transition: all 0.3s ease;
	}
</style>