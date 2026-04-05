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
			window.history.replaceState(window.history.state, '', `/e/${slug}`);
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
					window.history.replaceState(window.history.state, '', `/e/${slug}`);
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
		<meta property="og:image:secure_url" content={seo.image} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta property="og:image:type" content="image/jpeg" />
		<meta property="og:image:alt" content={seo.title} />
		<meta property="og:url" content={seo.url} />
		<meta property="og:type" content="website" />
		<meta property="og:site_name" content="Rondwell" />
		<meta property="og:locale" content="en_US" />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content={seo.title} />
		<meta name="twitter:description" content={seo.description} />
		<meta name="twitter:image" content={seo.image} />
		<meta name="twitter:site" content="@rondwellhq" />
		<link rel="canonical" href={seo.url} />
		{#if seo.jsonLd}
			{@html `<script type="application/ld+json">${JSON.stringify(seo.jsonLd)}</script>`}
		{/if}
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
		<div class="flex flex-col items-center gap-5">
			<!-- Animated ticket icon -->
			<div class="relative">
				<div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50">
					<svg width="36" height="36" viewBox="0 0 24 24" fill="none" class="loading-icon-bounce">
						<path d="M18.91 14.69C18.91 15.98 19.97 17.03 21.26 17.03C21.26 20.78 20.32 21.72 16.57 21.72H7.19C3.44 21.72 2.5 20.78 2.5 17.03V16.57C3.79 16.57 4.85 15.51 4.85 14.22C4.85 12.93 3.79 11.87 2.5 11.87V11.41C2.51 7.66 3.44 6.72 7.19 6.72H16.56C20.31 6.72 21.25 7.66 21.25 11.41V12.35C19.96 12.35 18.91 13.39 18.91 14.69Z" stroke="#8B3AD4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M16.21 6.72H7.12L10.05 3.79C12.44 1.4 13.64 1.4 16.03 3.79L16.63 4.39C16 5.02 15.85 5.95 16.21 6.72Z" stroke="#DB3EC6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M9.88 6.72V21.72" stroke="#8B3AD4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="5 5"/>
					</svg>
				</div>
				<div class="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-60 animate-ping"></div>
			</div>
			<!-- Loading dots -->
			<div class="flex items-center gap-2">
				<span class="inline-block h-2 w-2 rounded-full bg-[#DB3EC6] animate-[pulse-dot_1.6s_ease-in-out_infinite]"></span>
				<span class="inline-block h-2 w-2 rounded-full bg-[#8B3AD4] animate-[pulse-dot_1.6s_ease-in-out_0.2s_infinite]"></span>
				<span class="inline-block h-2 w-2 rounded-full bg-[#513BE2] animate-[pulse-dot_1.6s_ease-in-out_0.4s_infinite]"></span>
			</div>
			<p class="text-sm text-gray-400">Loading event</p>
		</div>
	</div>
{/if}

<style>
	@keyframes pulse-dot {
		0%, 100% { opacity: 0.3; transform: scale(1); }
		50% { opacity: 1; transform: scale(1.4); }
	}

	.loading-icon-bounce {
		animation: gentle-bounce 2s ease-in-out infinite;
	}

	@keyframes gentle-bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-6px); }
	}
</style>
