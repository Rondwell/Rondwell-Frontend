<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { isAuthenticated } from '$lib/stores/auth.store';
	import { onMount } from 'svelte';

	let { children } = $props();
	let checked = $state(false);

	onMount(() => {
		const unsub = isAuthenticated.subscribe((authed) => {
			if (browser && !authed) {
				goto('/auth');
			} else {
				checked = true;
			}
		});
		return unsub;
	});
</script>

{#if checked}
	{@render children()}
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#513BE2]"></div>
	</div>
{/if}
