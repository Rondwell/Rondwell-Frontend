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

<div
	class="bg:shadow-sm relative z-50 h-[70px] w-full p-2 lg:border-b lg:border-[#909EA3] lg:bg-[#f5efec] lg:p-0"
>
	<header
		class="mx-auto flex min-h-[70px] max-w-screen-2xl flex-col items-center justify-between rounded-[20px] bg-[#C7AFB8] px-6 py-4 md:px-10 lg:rounded-none lg:bg-transparent"
	>
		<div class="flex w-full items-center justify-between">
			<div class="flex items-center gap-4">
				<a href="/">
					<img src="/logo.svg" alt="Rondwell" class="h-8" />
				</a>
				<a href="/help-center" class="hidden items-center gap-1 font-medium text-gray-400 lg:flex">
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
