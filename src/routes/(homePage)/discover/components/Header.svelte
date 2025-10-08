<script>
	import Button from '$lib/components/Button.svelte';
	import { onDestroy } from 'svelte';

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
</script>

<div class="relative w-full border-b border-[#909EA3]">
	<!-- Mobile extra background -->
	<div class="absolute inset-x-2 top-2 h-[55px] rounded-[20px] bg-[#C7AFB8] md:hidden"></div>

	<header
		class="relative z-20 mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-4 md:px-10"
	>
		<!-- Logo -->
		<a href="/" class="flex items-center gap-2">
			<img src="/logo.png" alt="Rondwell Logo" class="h-8 w-auto" />
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
			<span class="hidden text-sm md:inline">{now}</span>

			<!-- Create Event (desktop only) -->
			<a href="/" class="hidden items-center gap-1 transition md:flex">
				<img src="/vec.png" alt="Vector" class="h-[18px] w-[18px]" />
				Create Event
			</a>

			<!-- Sign in (always visible) -->
			<Button
				class="hidden cursor-pointer rounded-full px-4 py-2 text-white shadow-md hover:bg-gradient-to-r lg:block lg:bg-[#ECEDED] lg:text-[#777779]"
			>
				Sign in
			</Button>

			<Button
				class="cursor-pointer rounded-full bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] px-4 py-2 text-white shadow-md hover:bg-gradient-to-r lg:hidden"
			>
				Sign in
			</Button>

			<!-- Toggle (mobile only) -->
			<button
				class="cursor-pointer rounded-lg p-2 lg:hidden"
				on:click={() => (isOpen = !isOpen)}
				aria-label="Toggle menu"
			>
				{#if isOpen}
					<span class="text-2xl font-bold">×</span> <!-- Close as X -->
				{:else}
					<img src="/mobicon.png" alt="Open menu" class="h-6 w-6" />
				{/if}
			</button>
		</div>
	</header>

	<!-- Mobile menu -->
	{#if isOpen}
		<div
			class="fixed top-[70px] left-0 z-[9999] w-full border-t border-gray-200 bg-[#C7AFB8] shadow-md lg:hidden"
		>
			<div
				class="flex flex-col space-y-4 p-6"
				style="background: linear-gradient(135deg, #eb9ec4ff 0%, #ffe0f0 20%, #ffd1e8 40%, #ffe0f0 70%, #ffd1e8 100%);"
			>
				<a href="/discover" class="flex items-center gap-2 text-[#909EA3]">
					<img src="/Disc.png" alt="Discover" class="h-[18px] w-[18px]" />
					Discover Events
				</a>

				<a href="/" class="flex items-center gap-2 text-[#909EA3]">
					<img src="/Verified.png" alt="Verified" class="h-[18px] w-[18px]" />
					Explore Experiences
				</a>

				<a href="/" class="flex items-center gap-2 text-[#909EA3] md:hidden">
					<img src="/vec.png" alt="Vector" class="h-[18px] w-[18px]" />
					Create Event
				</a>
			</div>
		</div>
	{/if}
</div>
