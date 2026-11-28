<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	$: themeParam = $page.url.searchParams.get('theme') || 'light';
	$: primaryParam = $page.url.searchParams.get('primary') || '';
	$: bgParam = $page.url.searchParams.get('bg') || '';
	$: textParam = $page.url.searchParams.get('text') || '';
	$: radiusParam = $page.url.searchParams.get('radius') || '12';

	let rootEl: HTMLDivElement;

	onMount(() => {
		if (!rootEl || typeof window === 'undefined' || window.parent === window) return;
		const postHeight = () => {
			const h = Math.max(rootEl.scrollHeight, document.body.scrollHeight);
			window.parent.postMessage({ source: 'rondwell-sdk', type: 'rondwell:resize', height: h }, '*');
		};
		postHeight();
		const ro = new ResizeObserver(postHeight);
		ro.observe(rootEl);
		return () => ro.disconnect();
	});
</script>

<div
	bind:this={rootEl}
	class="min-h-screen w-full transition-colors {themeParam === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'}"
	style:--rw-primary={primaryParam || '#7C3AED'}
	style:--rw-bg={bgParam || (themeParam === 'dark' ? '#020617' : '#ffffff')}
	style:--rw-text={textParam || (themeParam === 'dark' ? '#f8fafc' : '#0f172a')}
	style:--rw-radius={`${Number(radiusParam) || 12}px`}
	style:background-color={bgParam || undefined}
	style:color={textParam || undefined}
>
	<slot />
</div>
