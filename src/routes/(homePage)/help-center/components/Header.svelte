<!-- src/lib/components/Header.svelte -->
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

<header class="border-b border-[#909EA3] bg-[#f5efec] shadow-sm">
	<div class="container mx-auto flex items-center justify-between px-6 py-4">
		<!-- Logo -->
		<div class="flex items-center gap-4">
			<a href="/">
				<img src="/logo.svg" alt="Rondwell" class="h-8" />
			</a>
			<a href="/help-center" class="hidden items-center gap-1 font-medium text-gray-400 md:flex">
				<img src="/information.png" alt="warning icon" class="h-5 w-5" />
				Help Center</a
			>
		</div>

		<div class="flex items-center gap-4 md:gap-10">
			<span class="hidden text-sm text-gray-400 lg:block">{now}</span>
			<img src="/search-favorite.png" alt="search icon" class="hidden h-5 w-5 lg:block" />

			<!-- Back Button -->
			<a
				href="/"
				class="hidden items-start gap-1 rounded-4xl bg-[#E9EBEC] px-4 py-2 text-[#717374] hover:text-gray-900 md:flex"
			>
				Back to rondwell.com
				<img src="/send-icon.png" alt="send icon" class="h-4 w-4" />
			</a>

			<!-- Sign in (always visible) -->
			<Button
				class="cursor-pointer justify-end rounded-full bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] px-4 py-2 text-white shadow-md md:hidden"
			>
				<a href="/auth" class="w-full"> Sign in </a>
			</Button>

			<!-- Toggle (mobile only) -->
			<button
				class="cursor-pointer rounded-lg p-2 md:hidden"
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
	</div>

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

				<a href="/create-event" class="flex items-center gap-2 text-[#909EA3] md:hidden">
					<img src="/vec.png" alt="Vector" class="h-[18px] w-[18px]" />
					Create Event
				</a>
			</div>
		</div>
	{/if}
</header>
