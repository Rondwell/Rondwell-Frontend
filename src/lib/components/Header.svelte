<script lang="ts">
	import LogoSvg from '$lib/assets/images/logo.svg';
	import { onMount } from 'svelte';

	let currentTime = '';
    let currentTimeZone = 'UTC'; // Default time zone

    // Function to get the user's time zone
    function getUserTimeZone() {
        // Use Intl.DateTimeFormat to get the user's time zone
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return timeZone || currentTimeZone; // Fallback to UTC if not available
    }

	// Function to format the time
	function updateTime() {
		const now = new Date();
		const options: Intl.DateTimeFormatOptions = { 
			hour: '2-digit', 
			minute: '2-digit',
			second: '2-digit',
			hour12: true 
		};
		currentTime = now.toLocaleTimeString(undefined, options);
	}
	
	// Initial time update and set interval
	onMount(() => {
		// Update immediately
		updateTime();
		
		// Then update every second
		const timer = setInterval(updateTime, 1000);

        // Set the user's time zone
        currentTimeZone = getUserTimeZone();
		
		// Clean up interval on component destruction
		return () => {
			clearInterval(timer);
		};
	});
</script>

<nav class="absolute top-0 left-0 z-[999] w-full bg-transparent border border-[#181515] border-opacity-10">
    <div class="w-full mx-auto flex items-center justify-between p-5 md:px-10">
        <!-- Logo -->
        <a href="/" class="text-xl font-bold text-indigo-600">
            <img src={LogoSvg} alt="Logo" class="w-[68.18px] h-[20.98px]" />
        </a>

        <!-- User's current time -->
        <div class="space-x-8 flex">
            <span class="merriweather-sans text-[14.98px] md:text-[12px] font-normal text-[#5E6163] transition-colors">
                {currentTime} {currentTimeZone}
            </span>
        </div>
    </div>
</nav>

<style>
	.border-opacity-10 {
		border-color: rgba(24, 21, 21, 0.1);
	}
</style>