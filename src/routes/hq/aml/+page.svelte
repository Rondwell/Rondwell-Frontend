<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	onMount(() => goto('/hq/finance', { replaceState: true }));
</script>

<p class="p-6 text-sm text-gray-500">Redirecting to Finance…</p>
