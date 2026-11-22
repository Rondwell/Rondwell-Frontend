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

	const mobileNavLinks = [
		{
			label: 'Discover Events',
			subtitle: 'Concerts, summits & community mixers',
			href: '/discover',
			icon: 'solar:compass-big-bold-duotone',
			iconBg: 'bg-gradient-to-br from-[#DB3E6C]/15 to-[#AB46DD]/15 text-[#DB3E6C] ring-1 ring-[#DB3E6C]/15'
		},
		{
			label: 'Marketplace',
			subtitle: 'Verified vendors, speakers & exhibitors',
			href: '/marketplace',
			icon: 'solar:shop-2-bold-duotone',
			iconBg: 'bg-gradient-to-br from-[#8B5CF6]/15 to-[#6366F1]/15 text-[#7C3AED] ring-1 ring-[#7C3AED]/15'
		},
		{
			label: 'Pricing',
			subtitle: 'Flexible plans for hosts & teams',
			href: '/pricing',
			icon: 'solar:verified-check-bold-duotone',
			iconBg: 'bg-gradient-to-br from-[#10B981]/15 to-[#059669]/15 text-[#059669] ring-1 ring-[#059669]/15'
		},
		{
			label: 'Help Center',
			subtitle: 'Guides, FAQs & organizer support',
			href: '/help-center',
			icon: 'solar:question-circle-bold-duotone',
			iconBg: 'bg-gradient-to-br from-[#0EA5E9]/15 to-[#2563EB]/15 text-[#2563EB] ring-1 ring-[#2563EB]/15'
		}
	];

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
	use:clickOutside={() => (mobileMenuOpen = false)}
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
				<Icon icon="solar:compass-big-bold-duotone" class="h-4 w-4 text-[#DB3E6C]" />
				<span>Discover</span>
			</a>
			<a
				href="/pricing"
				class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium text-[#2A2933] no-underline transition hover:bg-black/5"
			>
				<Icon icon="solar:verified-check-bold-duotone" class="h-4 w-4 text-[#059669]" />
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
				<Icon icon="solar:magic-stick-3-bold-duotone" class="h-4 w-4 text-[#7C3AED]" />
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
					<ProfileMenu
						bind:showMenu={showProfileMenu}
						className="fixed top-16 right-4 left-4 md:absolute md:top-12 md:right-0 md:left-auto md:bottom-auto"
					/>
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
				class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/75 text-[#17161E] shadow-[0_4px_14px_rgba(17,15,28,0.07)] ring-1 ring-black/6 backdrop-blur-xl transition hover:bg-white active:scale-95"
			>
				<Icon icon={mobileMenuOpen ? 'solar:close-circle-bold-duotone' : 'solar:hamburger-menu-linear'} class="h-[18px] w-[18px] text-[#17161E]" />
			</button>
		</div>
	</div>

	<!-- Responsive Mobile Navigation Card -->
	{#if mobileMenuOpen}
		<div class="mx-4 mt-2.5 rounded-[26px] border border-white/85 bg-white/94 p-3.5 shadow-[0_24px_60px_-12px_rgba(18,15,36,0.22),0_0_0_1px_rgba(18,15,36,0.06)] backdrop-blur-2xl md:hidden">
			<div class="mb-2 flex items-center justify-between px-2">
				<span class="text-[11px] font-bold tracking-[0.14em] text-[#7A7787] uppercase">Explore Rondwell</span>
			</div>

			<div class="grid gap-1">
				{#each mobileNavLinks as item}
					<a
						href={item.href}
						on:click={() => (mobileMenuOpen = false)}
						class="group flex items-center gap-3.5 rounded-2xl p-2.5 text-left no-underline transition-all hover:bg-black/[0.04] active:scale-[0.99]"
					>
						<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl {item.iconBg}">
							<Icon icon={item.icon} class="h-5 w-5" />
						</span>
						<div class="min-w-0 flex-1">
							<p class="text-sm font-semibold text-[#17161E]">{item.label}</p>
							<p class="truncate text-xs text-[#6B6878]">{item.subtitle}</p>
						</div>
						<Icon icon="solar:alt-arrow-right-linear" class="h-4 w-4 shrink-0 text-[#8E8B99] transition-transform group-hover:translate-x-0.5" />
					</a>
				{/each}
			</div>

			<div class="my-2.5 h-px bg-black/6"></div>

			<div class="grid gap-2">
				<a
					href="/create-event"
					on:click={() => (mobileMenuOpen = false)}
					class="flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#DB3E6C] via-[#AB46DD] to-[#513BE2] px-4 text-sm font-semibold text-white no-underline shadow-sm transition active:scale-[0.99]"
				>
					<Icon icon="solar:magic-stick-3-bold-duotone" class="h-[18px] w-[18px]" />
					<span>Create Event</span>
				</a>

				{#if $isAuthenticated && currentUser}
					<a
						href="/overview"
						on:click={() => (mobileMenuOpen = false)}
						class="flex min-h-[42px] items-center justify-center gap-2 rounded-2xl border border-black/8 bg-black/[0.03] px-4 text-xs font-semibold text-[#17161E] no-underline transition hover:bg-black/[0.06]"
					>
						<Icon icon="solar:widget-4-bold-duotone" class="h-4 w-4 text-[#7C3AED]" />
						<span>Go to Dashboard</span>
					</a>
				{:else}
					<a
						href="/auth"
						on:click={() => (mobileMenuOpen = false)}
						class="flex min-h-[42px] items-center justify-center gap-2 rounded-2xl border border-black/8 bg-black/[0.03] px-4 text-xs font-semibold text-[#17161E] no-underline transition hover:bg-black/[0.06]"
					>
						<Icon icon="solar:login-2-bold-duotone" class="h-4 w-4 text-[#513BE2]" />
						<span>Sign in to Rondwell</span>
					</a>
				{/if}
			</div>
		</div>
	{/if}
</header>
