<script lang="ts">
	import { authState, isAuthenticated } from '$lib/stores/auth.store';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { onDestroy } from 'svelte';
	import ProfileMenu from '../../components/ProfileMenu.svelte';

	let isOpen = false;
	let currentUser: any = null;
	let showProfileMenu = false;

	const unsubAuth = authState.subscribe((state) => {
		currentUser = state.user;
	});

	onDestroy(() => {
		unsubAuth();
	});
</script>

<header class="sticky top-0 z-40 w-full border-b border-black/8 bg-white/75 px-4 py-3 backdrop-blur-xl transition-all sm:px-6 lg:px-10">
	<nav class="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
		<!-- Logo -->
		<a href="/" class="flex items-center gap-2 no-underline">
			<img src="/logo.svg" alt="Rondwell Logo" class="h-8 w-auto" />
		</a>

		<!-- Center Links (Desktop) -->
		<div class="hidden items-center gap-1 rounded-full border border-black/8 bg-white/80 p-1 text-sm font-medium text-[#3C3B47] md:flex">
			<a href="/discover" class="flex items-center gap-1.5 rounded-full bg-black/5 px-3.5 py-1.5 font-semibold text-[#17161E] no-underline transition">
				<img src="/Disc.png" alt="" class="h-4 w-4" />
				<span>Discover</span>
			</a>
			<a href="/pricing" class="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 no-underline transition hover:bg-black/5">
				<img src="/Verified.png" alt="" class="h-4 w-4" />
				<span>Pricing</span>
			</a>
			<a href="/marketplace" class="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 no-underline transition hover:bg-black/5">
				<Icon icon="solar:shop-2-bold-duotone" class="h-4 w-4 text-[#AB46DD]" />
				<span>Marketplace</span>
			</a>
		</div>

		<!-- Right Actions (Never nest <a> inside <Button>!) -->
		<div class="flex items-center gap-2.5 sm:gap-3">
			<a
				href="/create-event"
				class="hidden h-9 items-center gap-1.5 rounded-full border border-black/10 bg-white px-4 text-xs font-semibold text-[#17161E] no-underline shadow-xs transition hover:-translate-y-0.5 hover:shadow-sm lg:inline-flex"
			>
				<img src="/vec.png" alt="" class="h-4 w-4" />
				<span>Create Event</span>
			</a>

			{#if $isAuthenticated && currentUser}
				<div class="relative" use:clickOutside={() => (showProfileMenu = false)}>
					<button
						type="button"
						on:click={() => (showProfileMenu = !showProfileMenu)}
						class="flex h-9 items-center gap-2 rounded-full border border-black/10 bg-white py-1 pr-3 pl-1.5 text-xs font-semibold text-[#17161E] shadow-xs transition hover:bg-[#FAF9FC]"
					>
						<img
							src={currentUser.profilePictureUrl || '/rondwell-attendee.png'}
							alt={currentUser.name || 'Profile'}
							class="h-6.5 w-6.5 rounded-full object-cover"
						/>
						<span class="hidden max-w-[100px] truncate sm:inline">{currentUser.name?.split(' ')[0] || 'Account'}</span>
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
					class="inline-flex h-9 items-center justify-center rounded-full bg-[#17161E] px-5 text-xs font-semibold text-white no-underline shadow-xs transition hover:bg-[#2E2D38]"
				>
					Sign in
				</a>
			{/if}

			<button
				type="button"
				aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
				aria-expanded={isOpen}
				on:click={() => (isOpen = !isOpen)}
				class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/70 text-[#17161E] shadow-[0_4px_14px_rgba(17,15,28,0.07)] ring-1 ring-black/6 backdrop-blur-xl transition hover:bg-white/90 active:scale-95 md:hidden"
			>
				<Icon icon={isOpen ? 'solar:close-circle-linear' : 'solar:hamburger-menu-linear'} class="h-4.5 w-4.5 text-[#17161E]" />
			</button>
		</div>
	</nav>

	<!-- Mobile Dropdown Navigation -->
	{#if isOpen}
		<div class="mt-3 rounded-3xl border border-black/10 bg-white/95 p-3 shadow-xl backdrop-blur-xl md:hidden">
			<div class="grid gap-1">
				<a href="/discover" on:click={() => (isOpen = false)} class="flex min-h-[44px] items-center gap-3 rounded-2xl px-3.5 py-2 text-sm font-semibold text-[#17161E] no-underline hover:bg-black/5">
					<img src="/Disc2.svg" alt="" class="h-5 w-5" />
					<span>Discover</span>
				</a>
				<a href="/pricing" on:click={() => (isOpen = false)} class="flex min-h-[44px] items-center gap-3 rounded-2xl px-3.5 py-2 text-sm font-semibold text-[#17161E] no-underline hover:bg-black/5">
					<img src="/Verified.svg" alt="" class="h-5 w-5" />
					<span>Pricing</span>
				</a>
				<a href="/create-event" on:click={() => (isOpen = false)} class="mt-1 flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#DB3E6C] to-[#AB46DD] px-4 text-sm font-semibold text-white no-underline">
					<img src="/vec.svg" alt="" class="h-4 w-4 brightness-0 invert" />
					<span>Create Event</span>
				</a>
			</div>
		</div>
	{/if}
</header>
