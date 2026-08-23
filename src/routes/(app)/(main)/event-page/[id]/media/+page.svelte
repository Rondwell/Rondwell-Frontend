<script lang="ts">
	import { page } from '$app/stores';
	import { getPublicMediaFaqs } from '$lib/services/event.services';
	import { getEventTheme } from '$lib/stores/eventTheme';
	import type { Color } from '$lib/utils/colors';
	import { colors } from '$lib/utils/colors';
	import MediaViewer from '$lib/components/MediaViewer.svelte';
	import { onMount } from 'svelte';

	$: eventId = $page.params.id ?? '';
	let themeColor: Color = colors[0];
	$: if (eventId) themeColor = getEventTheme(eventId);

	let media: any[] = [];
	let faqs: any[] = [];
	let loading = true;
	let activeTab = 'media';
	let expandedFaq: string | null = null;

	// Lightbox state
	let viewerOpen = false;
	let viewerIndex = 0;

	onMount(async () => {
		if (!eventId) return;
		try {
			const data = await getPublicMediaFaqs(eventId);
			media = data.media;
			faqs = data.faqs;
		} catch {
			/* empty */
		} finally {
			loading = false;
		}
	});

	function toggleFaq(id: string) {
		expandedFaq = expandedFaq === id ? null : id;
	}

	function openViewer(i: number) {
		viewerIndex = i;
		viewerOpen = true;
	}

	/**
	 * Classify a media record for the grid tile.
	 *
	 * `type` is the authoritative field (IMAGE/VIDEO/AUDIO/DOCUMENT), but some
	 * older records carry a *category* such as "GENERAL" there, so fall back to
	 * the file extension instead of rendering an empty tile.
	 */
	function kindOf(item: any): 'image' | 'video' | 'audio' | 'document' {
		const t = String(item?.type ?? '').toUpperCase();
		if (t === 'IMAGE') return 'image';
		if (t === 'VIDEO') return 'video';
		if (t === 'AUDIO') return 'audio';
		if (t === 'DOCUMENT') return 'document';

		const ext =
			String(item?.url ?? '')
				.split(/[?#]/)[0]
				.split('.')
				.pop()
				?.toLowerCase() ?? '';
		if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp'].includes(ext)) return 'image';
		if (['mp4', 'webm', 'mov', 'm4v', 'ogv'].includes(ext)) return 'video';
		if (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'].includes(ext)) return 'audio';
		return 'document';
	}
</script>

<div class="w-full max-w-4xl">
	<div class="mb-6">
		<h1 class="text-2xl font-bold" style="color: {themeColor.text};">Media & FAQs</h1>
		<p class="mt-1 text-sm" style="color: {themeColor.lightText};">
			Event gallery and frequently asked questions
		</p>
	</div>

	<!-- Tabs -->
	<div class="mb-6 flex gap-2">
		<button
			class="rounded-lg px-4 py-2 text-sm font-medium transition-all"
			style="background-color: {activeTab === 'media'
				? themeColor.button
				: themeColor.cover}; color: {activeTab === 'media'
				? themeColor.buttonText
				: themeColor.lightText}; border: 1px solid {activeTab === 'media'
				? themeColor.button
				: themeColor.toggle};"
			on:click={() => (activeTab = 'media')}
		>
			Media Gallery
		</button>
		<button
			class="rounded-lg px-4 py-2 text-sm font-medium transition-all"
			style="background-color: {activeTab === 'faqs'
				? themeColor.button
				: themeColor.cover}; color: {activeTab === 'faqs'
				? themeColor.buttonText
				: themeColor.lightText}; border: 1px solid {activeTab === 'faqs'
				? themeColor.button
				: themeColor.toggle};"
			on:click={() => (activeTab = 'faqs')}
		>
			FAQs
		</button>
	</div>

	{#if loading}
		<div class="animate-pulse space-y-4">
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
				{#each [1, 2, 3, 4, 5, 6] as _}
					<div class="aspect-square rounded-xl" style="background-color: {themeColor.cover};"></div>
				{/each}
			</div>
		</div>
	{:else if activeTab === 'media'}
		{#if media.length === 0}
			<div
				class="flex h-40 items-center justify-center rounded-2xl"
				style="background-color: {themeColor.cover};"
			>
				<p class="text-sm" style="color: {themeColor.lightText};">No media uploaded yet.</p>
			</div>
		{:else}
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
				{#each media as item, i}
					{@const kind = kindOf(item)}
					<button
						type="button"
						class="tile group relative overflow-hidden rounded-xl"
						style="background-color: {themeColor.cover}; --tile-ring: {themeColor.button};"
						aria-label="Open {item.title || `media ${i + 1}`} in viewer"
						on:click={() => openViewer(i)}
					>
						{#if kind === 'image'}
							<img
								src={item.thumbnailUrl || item.url}
								alt={item.title ?? 'Event media'}
								loading="lazy"
								class="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
							/>
						{:else if kind === 'video'}
							{#if item.thumbnailUrl}
								<img
									src={item.thumbnailUrl}
									alt={item.title ?? 'Event video'}
									loading="lazy"
									class="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
								/>
							{:else}
								<!-- No poster: preload just enough to paint the first frame. -->
								<!-- svelte-ignore a11y-media-has-caption -->
								<video
									src={item.url}
									class="pointer-events-none aspect-square w-full object-cover"
									preload="metadata"
									muted
									playsinline
								></video>
							{/if}
						{:else if kind === 'audio'}
							<div class="flex aspect-square items-center justify-center">
								<span class="text-3xl">🎵</span>
							</div>
						{:else}
							<div class="flex aspect-square items-center justify-center">
								<span class="text-3xl">📄</span>
							</div>
						{/if}

						<!-- Play badge so video tiles are unmistakable at a glance -->
						{#if kind === 'video'}
							<span class="play-badge" aria-hidden="true">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
									<path d="M8 5.5v13l11-6.5-11-6.5Z" />
								</svg>
							</span>
						{/if}

						<!-- Hover affordance: makes it obvious the tile is interactive -->
						<span class="tile-hint" aria-hidden="true">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
								<path
									d="M15 3h6v6M21 3l-9 9"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
								/>
							</svg>
						</span>

						{#if item.title}
							<div
								class="absolute bottom-0 left-0 right-0 p-2 text-left"
								style="background: linear-gradient(transparent, rgba(0,0,0,0.6));"
							>
								<p class="truncate text-xs font-medium text-white">{item.title}</p>
							</div>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	{:else if faqs.length === 0}
		<div
			class="flex h-40 items-center justify-center rounded-2xl"
			style="background-color: {themeColor.cover};"
		>
			<p class="text-sm" style="color: {themeColor.lightText};">No FAQs published yet.</p>
		</div>
	{:else}
		<div class="flex flex-col gap-3">
			{#each faqs as faq}
				{@const faqId = faq._id ?? faq.id}
				<div
					class="overflow-hidden rounded-xl"
					style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};"
				>
					<button
						class="flex w-full items-center justify-between px-5 py-4 text-left"
						on:click={() => toggleFaq(faqId)}
					>
						<span class="text-sm font-medium" style="color: {themeColor.text};">{faq.question}</span
						>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							style="color: {themeColor.lightText}; transform: rotate({expandedFaq === faqId
								? '180deg'
								: '0deg'}); transition: transform 0.2s; flex-shrink: 0;"
						>
							<path
								d="M19 9L12 15L5 9"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
					{#if expandedFaq === faqId}
						<div class="px-5 pb-4">
							<p class="text-sm leading-relaxed" style="color: {themeColor.lightText};">
								{faq.answer}
							</p>
							{#if faq.category}
								<span
									class="mt-2 inline-block rounded-full px-2 py-0.5 text-xs"
									style="background-color: {themeColor.smallCover}; color: {themeColor.lightText};"
									>{faq.category}</span
								>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<MediaViewer
	bind:open={viewerOpen}
	bind:index={viewerIndex}
	items={media}
	theme={themeColor}
	on:close={() => (viewerOpen = false)}
/>

<style>
	.tile {
		display: block;
		width: 100%;
		border: 0;
		padding: 0;
		cursor: zoom-in;
		transition:
			transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1),
			box-shadow 200ms ease;
	}

	.tile:hover {
		transform: translateY(-2px);
		box-shadow: 0 12px 28px rgba(0, 0, 0, 0.16);
	}

	.tile:focus-visible {
		outline: 2px solid var(--tile-ring);
		outline-offset: 3px;
	}

	/* Slight scrim on hover so the white overlay chrome stays legible. */
	.tile::after {
		content: '';
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0);
		transition: background 200ms ease;
		pointer-events: none;
	}
	.tile:hover::after {
		background: rgba(0, 0, 0, 0.12);
	}

	.play-badge {
		position: absolute;
		top: 50%;
		left: 50%;
		display: grid;
		height: 44px;
		width: 44px;
		translate: -50% -50%;
		place-items: center;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.55);
		color: #fff;
		backdrop-filter: blur(4px);
		transition:
			scale 200ms ease,
			background 200ms ease;
		pointer-events: none;
	}

	.tile:hover .play-badge {
		scale: 1.1;
		background: rgba(0, 0, 0, 0.7);
	}

	.tile-hint {
		position: absolute;
		top: 8px;
		right: 8px;
		display: grid;
		height: 28px;
		width: 28px;
		place-items: center;
		border-radius: 8px;
		background: rgba(0, 0, 0, 0.5);
		color: #fff;
		opacity: 0;
		transition: opacity 200ms ease;
		pointer-events: none;
	}

	.tile:hover .tile-hint,
	.tile:focus-visible .tile-hint {
		opacity: 1;
	}

	@media (prefers-reduced-motion: reduce) {
		.tile,
		.tile::after,
		.play-badge,
		.tile-hint {
			transition: none;
		}
		.tile:hover {
			transform: none;
		}
	}
</style>
