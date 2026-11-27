<script lang="ts">
	import { authState, isAuthenticated } from '$lib/stores/auth.store';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { onDestroy } from 'svelte';
	import ProfileMenu from '../../../(app)/components/ProfileMenu.svelte';

	const formatTime = () =>
		new Date().toLocaleString('en-GB', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			timeZoneName: 'short'
		});

	let now = formatTime();
	const interval = setInterval(() => {
		now = formatTime();
	}, 60000);
	onDestroy(() => clearInterval(interval));

	let isOpen = false;
	let showMenu = false;

	$: activeProfile = $authState.activeProfile;
	$: avatarUrl = activeProfile?.profilePictureUrl || '/you-rondwell.png';

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
			href: '/discover?tab=vendors',
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
</script>

<header
	use:clickOutside={() => (isOpen = false)}
	class="sticky top-0 z-50 w-full border-b border-black/8 bg-white/75 backdrop-blur-xl transition-all"
>
	<div class="mx-auto flex h-[68px] w-full max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-10">
		<!-- Logo + Desktop Help Center -->
		<div class="flex items-center gap-5">
			<a href="/" class="flex items-center gap-2 no-underline">
				<img src="/logo.svg" alt="Rondwell" class="h-8 w-auto" />
			</a>
			<a
				href="/help-center"
				class="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[#5F5C6D] no-underline transition hover:bg-black/5 hover:text-[#17161E] lg:inline-flex"
			>
				<Icon icon="solar:question-circle-bold-duotone" class="h-4 w-4 text-[#2563EB]" />
				<span>Help Center</span>
			</a>
		</div>

		<!-- Right Actions -->
		<div class="flex items-center gap-2.5 sm:gap-3 lg:gap-4">
			<span class="hidden rounded-full border border-black/6 bg-black/[0.03] px-3 py-1 text-xs font-medium text-[#5F5C6D] lg:inline-flex">
				{now}
			</span>

			<a
				href="/"
				class="hidden h-9 items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-4 text-xs font-semibold text-[#17161E] no-underline shadow-xs transition hover:bg-white md:inline-flex"
			>
				<span>Back to rondwell.com</span>
				<Icon icon="solar:arrow-right-up-linear" class="h-3.5 w-3.5 text-[#7C3AED]" />
			</a>

			{#if $isAuthenticated}
				<div use:clickOutside={() => (showMenu = false)} class="relative">
					<button
						type="button"
						class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/80 bg-white/80 p-0.5 shadow-[0_4px_14px_rgba(17,15,28,0.08)] ring-1 ring-black/8 transition active:scale-95"
						on:click={() => (showMenu = !showMenu)}
						aria-label="Profile menu"
					>
						<img
							src={avatarUrl}
							alt={activeProfile?.name || 'Account'}
							class="h-full w-full rounded-full object-cover"
						/>
					</button>
					<ProfileMenu
						bind:showMenu
						className="fixed top-16 right-4 left-4 md:absolute md:right-0 md:left-auto md:top-12 md:bottom-auto"
					/>
				</div>
			{:else}
				<a
					href="/auth"
					class="inline-flex h-9 items-center justify-center rounded-full bg-[#17161E] px-4 text-xs font-semibold text-white no-underline shadow-xs transition hover:bg-[#2E2D38]"
				>
					Sign in
				</a>
			{/if}

			<!-- Mobile Menu Toggle -->
			<button
				type="button"
				aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
				aria-expanded={isOpen}
				on:click={() => (isOpen = !isOpen)}
				class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/75 text-[#17161E] shadow-[0_4px_14px_rgba(17,15,28,0.07)] ring-1 ring-black/6 backdrop-blur-xl transition hover:bg-white active:scale-95 lg:hidden"
			>
				<Icon icon={isOpen ? 'solar:close-circle-bold-duotone' : 'solar:hamburger-menu-linear'} class="h-[18px] w-[18px] text-[#17161E]" />
			</button>
		</div>
	</div>

	<!-- Mobile Dropdown Navigation -->
	{#if isOpen}
		<div class="mx-4 mb-3 mt-1 rounded-[26px] border border-white/85 bg-white/94 p-3.5 shadow-[0_24px_60px_-12px_rgba(18,15,36,0.22),0_0_0_1px_rgba(18,15,36,0.06)] backdrop-blur-2xl lg:hidden">
			<div class="mb-2 flex items-center justify-between px-2">
				<span class="text-[11px] font-bold tracking-[0.14em] text-[#7A7787] uppercase">Explore Rondwell</span>
				<span class="text-[10px] font-medium text-[#8E8B99]">{now}</span>
			</div>

			<div class="grid gap-1">
				{#each mobileNavLinks as item}
					<a
						href={item.href}
						on:click={() => (isOpen = false)}
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
					on:click={() => (isOpen = false)}
					class="flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#DB3E6C] via-[#AB46DD] to-[#513BE2] px-4 text-sm font-semibold text-white no-underline shadow-sm transition active:scale-[0.99]"
				>
					<Icon icon="solar:magic-stick-3-bold-duotone" class="h-[18px] w-[18px]" />
					<span>Create Event</span>
				</a>

				{#if $isAuthenticated}
					<a
						href="/overview"
						on:click={() => (isOpen = false)}
						class="flex min-h-[42px] items-center justify-center gap-2 rounded-2xl border border-black/8 bg-black/[0.03] px-4 text-xs font-semibold text-[#17161E] no-underline transition hover:bg-black/[0.06]"
					>
						<Icon icon="solar:widget-4-bold-duotone" class="h-4 w-4 text-[#7C3AED]" />
						<span>Go to Dashboard</span>
					</a>
				{:else}
					<a
						href="/auth"
						on:click={() => (isOpen = false)}
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
