<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy, onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { authState, isAuthenticated } from '$lib/stores/auth.store';
	import { clickOutside } from '$lib/utils/constant';
	import ProfileMenu from '../../(app)/components/ProfileMenu.svelte';

	let isScrolled = false;
	let mobileMenuOpen = false;
	let currentUser: any = null;
	let showProfileMenu = false;

	const unsubAuth = authState.subscribe((state) => {
		currentUser = state.user;
	});

	function handleScroll() {
		isScrolled = window.scrollY > 14;
	}

	onMount(() => {
		if (!browser) return;
		handleScroll();
		window.addEventListener('scroll', handleScroll, { passive: true });
	});

	onDestroy(() => {
		unsubAuth();
		if (browser) {
			window.removeEventListener('scroll', handleScroll);
		}
	});
</script>

<header
	class={`sticky top-0 z-50 w-full transition-all duration-300 ${
		isScrolled
			? 'border-b border-black/8 bg-white/82 py-2.5 shadow-[0_8px_30px_rgba(18,16,28,0.06)] backdrop-blur-xl'
			: 'bg-transparent py-4'
	}`}
>
	<div class="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<!-- Brand Logo -->
		<a href="/" class="flex items-center gap-2.5 no-underline">
			<img src="/logo.svg" alt="Rondwell Logo" class="h-8 w-auto" />
		</a>

		<!-- Desktop Primary Nav -->
		<nav class="hidden items-center gap-1 rounded-full border border-black/8 bg-white/75 p-1 backdrop-blur-md md:flex">
			<a
				href="/discover"
				class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium text-[#2A2933] no-underline transition hover:bg-black/5"
			>
				<img src="/Disc.png" alt="" class="h-4 w-4" />
				<span>Discover</span>
			</a>
			<a
				href="/pricing"
				class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium text-[#2A2933] no-underline transition hover:bg-black/5"
			>
				<img src="/Verified.png" alt="" class="h-4 w-4" />
				<span>Pricing</span>
			</a>
			<a
				href="/marketplace"
				class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium text-[#2A2933] no-underline transition hover:bg-black/5"
			>
				<Icon icon="solar:shop-2-bold-duotone" class="h-4 w-4 text-[#AB46DD]" />
				<span>Marketplace</span>
			</a>
		</nav>

		<!-- Desktop Right Actions (proper <a> links — never <Button><a> nesting) -->
		<div class="hidden items-center gap-2.5 md:flex">
			<a
				href="/create-event"
				class="inline-flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white/90 px-4 text-sm font-semibold text-[#17171B] no-underline shadow-xs transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
			>
				<img src="/vec.png" alt="" class="h-4 w-4" />
				<span>Create Event</span>
			</a>

			{#if $isAuthenticated && currentUser}
				<div class="relative" use:clickOutside={() => (showProfileMenu = false)}>
					<button
						type="button"
						on:click={() => (showProfileMenu = !showProfileMenu)}
						class="flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white/90 py-1 pr-3 pl-1.5 text-sm font-medium text-[#17171B] shadow-xs transition hover:bg-white"
					>
						<img
							src={currentUser?.profilePictureUrl || '/rondwell-attendee.png'}
							alt={currentUser?.name || 'Profile'}
							class="h-7 w-7 rounded-full object-cover"
						/>
						<span class="max-w-[100px] truncate">{currentUser?.name?.split(' ')[0] || 'Account'}</span>
						<Icon icon="solar:alt-arrow-down-linear" class="h-3.5 w-3.5 text-[#737580]" />
					</button>
					{#if showProfileMenu}
						<div class="absolute right-0 mt-2">
							<ProfileMenu on:close={() => (showProfileMenu = false)} />
						</div>
					{/if}
				</div>
			{:else}
				<a
					href="/auth"
					class="inline-flex h-10 items-center justify-center rounded-full bg-[#17171B] px-5 text-sm font-semibold text-white no-underline shadow-sm transition hover:-translate-y-0.5 hover:bg-[#2C2C34]"
				>
					Sign in
				</a>
			{/if}
		</div>

		<!-- Mobile Right Trigger -->
		<div class="flex items-center gap-2 md:hidden">
			{#if $isAuthenticated && currentUser}
				<a
					href="/overview"
					class="inline-flex h-9 items-center gap-1.5 rounded-full border border-black/10 bg-white/85 px-3 text-xs font-semibold text-[#17171B] no-underline"
				>
					Dashboard
				</a>
			{:else}
				<a
					href="/auth"
					class="inline-flex h-9 items-center rounded-full bg-[#17171B] px-4 text-xs font-semibold text-white no-underline"
				>
					Sign in
				</a>
			{/if}

			<button
				type="button"
				aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
				aria-expanded={mobileMenuOpen}
				on:click={() => (mobileMenuOpen = !mobileMenuOpen)}
				class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/70 text-[#17171B] shadow-[0_4px_14px_rgba(17,15,28,0.07)] ring-1 ring-black/6 backdrop-blur-xl transition active:scale-95"
			>
				<Icon icon={mobileMenuOpen ? 'solar:close-circle-bold' : 'solar:hamburger-menu-linear'} class="h-4.5 w-4.5" />
			</button>
		</div>
	</div>

	<!-- Responsive Mobile Navigation Card -->
	{#if mobileMenuOpen}
		<div class="mx-4 mt-2.5 rounded-3xl border border-black/10 bg-white/95 p-3 shadow-xl backdrop-blur-xl md:hidden">
			<div class="grid gap-1">
				<a
					href="/discover"
					on:click={() => (mobileMenuOpen = false)}
					class="flex min-h-[44px] items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-[#17171B] no-underline transition hover:bg-black/5"
				>
					<img src="/Disc2.svg" alt="" class="h-5 w-5" />
					<span>Discover Events</span>
				</a>
				<a
					href="/pricing"
					on:click={() => (mobileMenuOpen = false)}
					class="flex min-h-[44px] items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-[#17171B] no-underline transition hover:bg-black/5"
				>
					<img src="/Verified.svg" alt="" class="h-5 w-5" />
					<span>Pricing</span>
				</a>
				<a
					href="/marketplace"
					on:click={() => (mobileMenuOpen = false)}
					class="flex min-h-[44px] items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-[#17171B] no-underline transition hover:bg-black/5"
				>
					<Icon icon="solar:shop-2-bold-duotone" class="h-5 w-5 text-[#AB46DD]" />
					<span>Marketplace</span>
				</a>
				<a
					href="/create-event"
					on:click={() => (mobileMenuOpen = false)}
					class="mt-1 flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#DB3E6C] to-[#AB46DD] px-4 text-sm font-semibold text-white no-underline shadow-sm"
				>
					<img src="/vec.svg" alt="" class="h-4 w-4 brightness-0 invert" />
					<span>Create Event with AI</span>
				</a>
			</div>
		</div>
	{/if}
</header>
