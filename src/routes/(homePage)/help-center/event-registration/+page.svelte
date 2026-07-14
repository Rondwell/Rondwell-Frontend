<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// Redirect old article URL to the new one
	onMount(() => {
		goto('/help-center/creating-your-first-event', { replaceState: true });
	});
</script>

<div class="flex items-center justify-center py-20">
	<p class="text-gray-400">Redirecting...</p>
</div>
