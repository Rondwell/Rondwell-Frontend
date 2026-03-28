<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	export let data: any;

	$: slug = $page.params.slug;
	$: seo = data?.seo;

	let notFound = false;

	onMount(async () => {
		if (data?.eventId) {
			await goto(`/event-page/${data.eventId}`, { replaceState: true });
			window.history.replaceState(window.history.state, '', `/${slug}`);
			return;
		}

		// Fallback: client-side lookup if server didn't resolve
		if (!slug) { notFound = true; return; }
		const EVENT_URL = import.meta.env.VITE_EVENT_API_URL || 'http://localhost:3000';
		try {
			const res = await fetch(`${EVENT_URL}/api/v1/events/by-slug/${encodeURIComponent(slug)}`);
			if (res.ok) {
				const d = await res.json();
				const eventId = d.event?._id || d.event?.id || d.eventId;
				if (eventId) {
					await goto(`/event-page/${eventId}`, { replaceState: true });
					window.history.replaceState(window.history.state, '', `/${slug}`);
					return;
				}
			}
		} catch { /* fallthrough */ }
		notFound = true;
	});
</script>

<svelte:head>
	{#if seo}
		<title>{seo.title}</title>
		<meta name="description" content={seo.description} />
		<meta property="og:title" content={seo.title} />
		<meta property="og:description" content={seo.description} />
		<meta property="og:image" content={seo.image} />
		<meta property="og:url" content={seo.url} />
		<meta property="og:type" content="website" />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content={seo.title} />
		<meta name="twitter:description" content={seo.description} />
		<meta name="twitter:image" content={seo.image} />
		<link rel="canonical" href={seo.url} />
	{/if}
</svelte:head>

{#if notFound}
	<div class="flex h-screen flex-col items-center justify-center bg-white gap-4">
		<p class="text-6xl">🎪</p>
		<h1 class="text-2xl font-semibold text-gray-900">Event Not Found</h1>
		<p class="text-sm text-gray-500">The event you're looking for doesn't exist or has been removed.</p>
		<a href="/discover" class="mt-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
			Discover Events
		</a>
	</div>
{:else}
	<div class="flex h-screen items-center justify-center bg-white">
		<div class="flex flex-col items-center gap-3">
			<div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-purple-600"></div>
			<p class="text-sm text-gray-500">Loading event...</p>
		</div>
	</div>
{/if}
