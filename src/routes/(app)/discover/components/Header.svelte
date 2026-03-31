<script>
	import Button from '$lib/components/Button.svelte';
	import { authState, isAuthenticated } from '$lib/stores/auth.store';
	import { clickOutside } from '$lib/utils/constant';
	import { onDestroy } from 'svelte';
	import ProfileMenu from '../../components/ProfileMenu.svelte';

	// live time
	let now = new Date().toLocaleString('en-GB', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		timeZoneName: 'short'
	});

	const updateTime = () => {
		now = new Date().toLocaleString('en-GB', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			timeZoneName: 'short'
		});
	};

	const interval = setInterval(updateTime, 60000);
	onDestroy(() => clearInterval(interval));

	// mobile menu toggle
	let isOpen = false;
	let showMenu = false;

	$: activeProfile = $authState.activeProfile;
	$: avatarUrl = activeProfile?.profilePictureUrl || '/you-rondwell.png';
</script>

<div class="relative z-50 h-[70px] w-full p-2 md:px-4 lg:border-b lg:border-[#909EA3] lg:p-0">
	<header
		class="mx-auto flex min-h-[70px] max-w-screen-2xl flex-col items-center justify-between rounded-[20px] bg-[#C7AFB8] px-6 py-4 md:px-10 lg:rounded-none lg:bg-transparent"
	>
		<div class="flex w-full items-center justify-between">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-2">
				<img src="/logo.svg" alt="Rondwell Logo" class="h-8 w-auto" />
			</a>

			<!-- Navigation (desktop) -->
			<nav class="hidden items-center gap-8 text-[#909EA3] lg:flex">
				<a href="/discover" class="flex items-center justify-center gap-1 transition">
					<img src="/Disc.png" alt="Discover" class="h-5 w-5" />
					Discover Events
				</a>
				<a href="/" class="flex items-center gap-1 transition">
					<img src="/Verified.png" alt="Verified" class="h-5 w-5" />
					Explore Experiences
				</a>
			</nav>

			<!-- Right side -->
			<div class="flex items-center gap-4 text-[#909EA3]">
				<!-- Current time (desktop only) -->
				<span class="hidden text-sm lg:inline">{now}</span>

				<!-- Create Event (desktop only) -->
				<a href="/create-event" class="hidden items-center gap-1 transition lg:flex">
					<img src="/vec.png" alt="Vector" class="h-[18px] w-[18px]" />
					Create Event
				</a>

				{#if $isAuthenticated}
					<!-- Logged in: show avatar with profile dropdown -->
					<div use:clickOutside={() => (showMenu = false)} class="relative hidden lg:block">
						<button
							class="cursor-pointer"
							on:click={() => (showMenu = !showMenu)}
							aria-label="Profile menu"
						>
							<img
								src={avatarUrl}
								alt="profile"
								class="h-[34px] w-[34px] rounded-full object-cover"
							/>
						</button>
						<ProfileMenu bind:showMenu className="fixed top-16 right-4 left-4 md:absolute md:right-0 md:left-auto md:top-12" />
					</div>

					<!-- Mobile: avatar -->
					<div use:clickOutside={() => (showMenu = false)} class="relative lg:hidden">
						<button
							class="cursor-pointer"
							on:click={() => (showMenu = !showMenu)}
							aria-label="Profile menu"
						>
							<img
								src={avatarUrl}
								alt="profile"
								class="h-[34px] w-[34px] rounded-full object-cover"
							/>
						</button>
						<ProfileMenu bind:showMenu className="fixed top-16 right-4 left-4 md:absolute md:right-0 md:left-auto md:top-12" />
					</div>
				{:else}
					<!-- Not logged in: show Sign in -->
					<Button
						class="hidden cursor-pointer rounded-full px-4 py-2 text-white shadow-md hover:bg-gradient-to-r lg:block lg:bg-[#ECEDED] lg:text-[#777779]"
					>
						<a href="/auth" class="w-full"> Sign in </a>
					</Button>

					<Button
						class="cursor-pointer rounded-full bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] px-4 py-2 text-white shadow-md hover:bg-gradient-to-r lg:hidden"
					>
						<a href="/auth" class="w-full"> Sign in </a>
					</Button>
				{/if}

				<!-- Toggle (mobile only) -->
				<button
					class="cursor-pointer rounded-lg p-2 lg:hidden"
					on:click={() => (isOpen = !isOpen)}
					aria-label="Toggle menu"
				>
					<img
						src="/mobicon.svg"
						alt="Open menu"
						class={`h-6 w-6 transition-transform duration-300 ${isOpen ? 'rotate-[-45deg]' : ''}`}
					/>
				</button>
			</div>
		</div>

		<!-- Mobile menu -->
		{#if isOpen}
			<div class="w-full py-4 text-center text-lg text-white lg:hidden">
				<span class="text-sm text-[#E6EDF1]">{now}</span>

				<div class="mt-6 flex flex-col items-center justify-center gap-6">
					<a href="/discover" class="flex items-center gap-2">
						<img src="/Disc2.svg" alt="Discover" class="h-6 w-6" />
						Discover Events
					</a>

					<a href="/" class="flex items-center gap-2">
						<img src="/Verified.svg" alt="Verified" class="h-6 w-6" />
						Explore Experiences
					</a>

					<a href="/create-event" class="flex items-center gap-2">
						<img src="/vec.svg" alt="Vector" class="h-6 w-6" />
						Create Event
					</a>
				</div>
			</div>
		{/if}
	</header>
</div>
