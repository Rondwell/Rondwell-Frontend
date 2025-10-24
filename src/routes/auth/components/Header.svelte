<script>
	import Button from '$lib/components/Button.svelte';
	import { onDestroy } from 'svelte';

	// live time
	let now = formatTime();

	const updateTime = () => {
		now = formatTime();
	};

	function formatTime() {
		let rawTime = new Date().toLocaleString('en-GB', {
			// weekday: 'short',
			// month: 'short',
			// day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: true,
			timeZoneName: 'short'
		});

		// Convert am/pm to AM/PM
		return rawTime.replace(/am|pm/, (match) => match.toUpperCase());
	}

	const interval = setInterval(updateTime, 60000);
	onDestroy(() => clearInterval(interval));
</script>

<div class="relative w-full border-b border-[#AAA19F]">
	<header
		class="relative z-20 mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-3 md:px-10"
	>
		<!-- Logo -->
		<a href="/" class="flex items-center gap-2">
			<img src="/logo.svg" alt="Rondwell Logo" class="h-8 w-auto" />
		</a>

		<!-- Right side -->
		<div class="flex items-center gap-3 text-[#909EA3] md:gap-6">
			<!-- Current time (desktop only) -->
			<span class="hidden text-sm md:inline">{now}</span>

			<!-- Create Event (desktop only) -->
			<a href="/create-event" class="flex items-start gap-1 transition">
				<img src="/vec.png" alt="icon" class="h-5 w-5" />
				Create Event
			</a>
		</div>
	</header>
</div>
