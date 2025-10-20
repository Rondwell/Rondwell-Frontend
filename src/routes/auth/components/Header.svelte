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
				Create Event
				<div class="hidden md:inline-block">
					<svg
						width="11"
						height="10"
						viewBox="0 0 11 10"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M6.92817 9.38496C6.53948 9.67805 6.04814 9.81076 5.52903 9.74493C4.68559 9.63709 4.04141 9.02537 3.88736 8.1904L3.56742 6.45622C3.50027 6.09225 3.25993 5.77353 2.92554 5.60498L1.3433 4.81654C0.582892 4.43879 0.17193 3.65122 0.300221 2.81064C0.428512 1.97007 1.04902 1.33755 1.89184 1.20198L8.18467 0.176045C8.88927 0.0593337 9.59686 0.342776 10.0277 0.914154C10.4586 1.48553 10.5365 2.24379 10.2305 2.88912L7.51339 8.65712C7.37396 8.95736 7.17305 9.20031 6.92817 9.38496ZM1.47464 2.14456C1.20644 2.3468 1.06702 2.64704 1.02489 2.92268C0.959757 3.33762 1.10234 3.88248 1.67071 4.16726L3.25002 4.95181C3.78913 5.22206 4.17309 5.73124 4.28464 6.32389L4.60458 8.05807C4.71818 8.68577 5.2067 8.96978 5.62354 9.02128C6.04039 9.07277 6.58232 8.9263 6.85442 8.34921L9.5715 2.58121C9.76419 2.17374 9.71725 1.71528 9.4476 1.35768C9.17795 1.00009 8.75009 0.828861 8.30533 0.90206L2.00664 1.92022C1.78961 1.95584 1.61457 2.03905 1.47464 2.14456Z"
							fill="#A4A5A5"
						/>
					</svg>
				</div>
			</a>

			<!-- Sign in (always visible) -->
			<Button class="cursor-pointer rounded-full bg-[#ECEDED] px-4 py-2 text-[#777779] shadow-md">
				<a href="/auth" class="w-full"> Sign in </a>
			</Button>
		</div>
	</header>
</div>
