<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { clearAdminAuth, getAdminUser, isAdminAuthenticated } from '$lib/services/admin.services';
	import { onMount } from 'svelte';

	let isMobile = false;

	$: currentPath = $page.url.pathname;
	$: isLoginPage = currentPath === '/hq/login';

	$: if (browser && !isLoginPage && !isAdminAuthenticated()) {
		goto('/hq/login');
	}

	$: adminUser = browser ? getAdminUser() : null;

	function checkScreenSize() {
		if (browser) isMobile = window.innerWidth < 768;
	}

	onMount(() => {
		checkScreenSize();
		window.addEventListener('resize', checkScreenSize);
		return () => window.removeEventListener('resize', checkScreenSize);
	});

	function handleLogout() {
		clearAdminAuth();
		goto('/hq/login');
	}

	const menuItems = [
		{ label: 'Dashboard', path: '/hq', icon: 'dashboard' },
		{ label: 'Users', path: '/hq/users', icon: 'users' },
		{ label: 'Events', path: '/hq/events', icon: 'events' },
		{ label: 'Collections', path: '/hq/collections', icon: 'collections' },
		{ label: 'Settings', path: '/hq/settings', icon: 'settings' },
	];

	$: activeItem = (() => {
		if (currentPath === '/hq') return 'Dashboard';
		const match = menuItems.find((m) => m.path !== '/hq' && currentPath.startsWith(m.path));
		return match?.label || 'Dashboard';
	})();
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if isLoginPage}
	<slot />
{:else}
	<div
		class="relative flex min-h-screen flex-col text-sm font-medium md:flex-row"
		style="background-image: linear-gradient(180deg, #d1e8f5 0%, #EAF2F5 17%, #f4f5f6 35%);"
	>
		<!-- ─── MOBILE: Top bar + horizontal nav ─── -->
		{#if isMobile}
			<div class="flex items-center justify-between px-4 py-3">
				<a href="/hq" class="flex items-center gap-2">
					<img src="/logo.svg" alt="Rondwell" class="h-7 w-auto" />
					<span class="rounded bg-[#513BE2]/10 px-2 py-0.5 text-[10px] font-semibold text-[#513BE2]">HQ</span>
				</a>
				<button on:click={handleLogout} aria-label="Sign out" class="text-gray-400 hover:text-red-500">
					<svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M6.675 5.67c.233-2.7 1.62-3.803 4.658-3.803h.098c3.352 0 4.695 1.343 4.695 4.695v5.89c0 3.353-1.343 4.695-4.695 4.695h-.098c-3.015 0-4.402-1.088-4.65-3.743" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.25 9H2.715M4.388 6.488L1.875 9l2.513 2.513" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
				</button>
			</div>

			<!-- Horizontal scrollable nav (same as SideMenu mobile) -->
			<nav class="custom-scrollbar -mx-3 flex gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap px-6 pb-4">
				{#each menuItems as item}
					<a
						href={item.path}
						class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm transition
							{item.label === activeItem ? 'selected text-[#DB3EC6]' : 'text-[#808080]'}"
					>
						{item.label}
					</a>
				{/each}
			</nav>
		{/if}

		<!-- ─── DESKTOP: Fixed sidebar with space reserved ─── -->
		{#if !isMobile}
			<div class="relative hidden md:block md:min-w-[250px]">
				<aside class="fixed left-0 top-0 z-10 hidden h-screen w-[250px] flex-col items-start justify-start gap-6 border-r border-gray-200/60 px-6 py-8 md:flex">
					<!-- Logo -->
					<a href="/hq" class="flex items-center gap-2">
						<img src="/logo.svg" alt="Rondwell" class="h-7 w-auto" />
						<span class="rounded bg-[#513BE2]/10 px-2 py-0.5 text-[10px] font-semibold text-[#513BE2]">HQ</span>
					</a>

					<!-- Nav Items -->
					<nav class="w-full flex-1 space-y-1">
						{#each menuItems as item}
							<a
								href={item.path}
								class="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5
									{item.label === activeItem ? 'selected text-[#DB3EC6]' : 'text-[#808080] hover:bg-white/60'}"
							>
								<span class="h-5 w-5">
									{#if item.icon === 'dashboard'}
										<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7.5 2.5H4.167A1.667 1.667 0 002.5 4.167V7.5A1.667 1.667 0 004.167 9.167H7.5A1.667 1.667 0 009.167 7.5V4.167A1.667 1.667 0 007.5 2.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M15.833 2.5H12.5a1.667 1.667 0 00-1.667 1.667V7.5a1.667 1.667 0 001.667 1.667h3.333A1.667 1.667 0 0017.5 7.5V4.167A1.667 1.667 0 0015.833 2.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M7.5 10.833H4.167A1.667 1.667 0 002.5 12.5v3.333a1.667 1.667 0 001.667 1.667H7.5a1.667 1.667 0 001.667-1.667V12.5A1.667 1.667 0 007.5 10.833z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M15.833 10.833H12.5a1.667 1.667 0 00-1.667 1.667v3.333a1.667 1.667 0 001.667 1.667h3.333a1.667 1.667 0 001.667-1.667V12.5a1.667 1.667 0 00-1.667-1.667z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
									{:else if item.icon === 'users'}
										<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 10a4.167 4.167 0 100-8.333A4.167 4.167 0 0010 10z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M2.5 17.5c0-2.761 3.358-5 7.5-5s7.5 2.239 7.5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
									{:else if item.icon === 'events'}
										<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6.667 1.667v2.5M13.333 1.667v2.5M2.917 7.575h14.166M17.5 7.083v5.834c0 2.5-1.25 4.166-4.167 4.166H6.667c-2.917 0-4.167-1.666-4.167-4.166V7.083c0-2.5 1.25-4.166 4.167-4.166h6.666c2.917 0 4.167 1.666 4.167 4.166z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/></svg>
									{:else if item.icon === 'collections'}
										<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M14.167 8.333h1.666c1.667 0 2.5-.833 2.5-2.5V4.167c0-1.667-.833-2.5-2.5-2.5h-1.666c-1.667 0-2.5.833-2.5 2.5v1.666c0 1.667.833 2.5 2.5 2.5zM4.167 18.333h1.666c1.667 0 2.5-.833 2.5-2.5v-1.666c0-1.667-.833-2.5-2.5-2.5H4.167c-1.667 0-2.5.833-2.5 2.5v1.666c0 1.667.833 2.5 2.5 2.5z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 8.333A3.333 3.333 0 105 1.667a3.333 3.333 0 000 6.666zM15 18.333a3.333 3.333 0 100-6.666 3.333 3.333 0 000 6.666z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/></svg>
									{:else if item.icon === 'settings'}
										<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M1.667 10.733V9.267c0-.734.6-1.334 1.333-1.334.95 0 1.342-.666.867-1.483a1.004 1.004 0 01.366-1.367l1.434-.825a.88.88 0 011.2.333l.083.142c.467.816 1.234.816 1.7 0l.084-.142a.88.88 0 011.2-.333l1.433.825a1.004 1.004 0 01.367 1.367c-.475.817-.084 1.483.866 1.483.734 0 1.334.6 1.334 1.334v1.466c0 .734-.6 1.334-1.334 1.334-.95 0-1.341.666-.866 1.483a1.004 1.004 0 01-.367 1.367l-1.433.825a.88.88 0 01-1.2-.333l-.084-.142c-.466-.817-1.233-.817-1.7 0l-.083.142a.88.88 0 01-1.2.333l-1.434-.825a1.004 1.004 0 01-.366-1.367c.475-.817.083-1.483-.867-1.483a1.338 1.338 0 01-1.333-1.334z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/></svg>
									{/if}
								</span>
								<span class="text-sm font-light">{item.label}</span>
							</a>
						{/each}
					</nav>

					<!-- Admin Profile + Logout -->
					<div class="w-full border-t border-gray-200/60 pt-4">
						<div class="mb-3 flex items-center gap-3 px-1">
							<div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#513BE2]/10 text-sm font-semibold text-[#513BE2]">
								{adminUser?.name?.charAt(0) || 'A'}
							</div>
							<div class="flex-1 overflow-hidden">
								<p class="truncate text-sm font-medium text-gray-800">{adminUser?.name || 'Admin'}</p>
								<p class="truncate text-xs text-gray-400">{adminUser?.email || ''}</p>
							</div>
						</div>
						<button on:click={handleLogout} class="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-red-500 transition hover:bg-red-50">
							<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6.675 5.67c.233-2.7 1.62-3.803 4.658-3.803h.098c3.352 0 4.695 1.343 4.695 4.695v5.89c0 3.353-1.343 4.695-4.695 4.695h-.098c-3.015 0-4.402-1.088-4.65-3.743" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.25 9H2.715M4.388 6.488L1.875 9l2.513 2.513" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
							Sign Out
						</button>
					</div>
				</aside>
			</div>
		{/if}

		<!-- ─── Main Content Area ─── -->
		<main class="relative flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden p-3 md:p-5">
			<div class="content-bg flex w-full flex-1 flex-col px-3 py-4 md:p-6 lg:p-8">
				<slot />
			</div>
		</main>
	</div>
{/if}

<style>
	.selected {
		background: rgba(219, 62, 198, 0.22);
		border: 1px solid #db3ec6;
		border-radius: 12px;
	}

	.content-bg {
		background: rgba(255, 255, 255, 0.08);
		box-shadow:
			0px 0px 0px 1px rgba(64, 87, 109, 0.04),
			0px 6px 20px -4px rgba(64, 87, 109, 0.3);
		border-radius: 12px;
	}
</style>
