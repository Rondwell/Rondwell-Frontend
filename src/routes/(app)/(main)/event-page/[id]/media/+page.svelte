<script lang="ts">
	import { page } from '$app/stores';
	import { getPublicMediaFaqs } from '$lib/services/event.services';
	import { getEventTheme } from '$lib/stores/eventTheme';
	import type { Color } from '$lib/utils/colors';
	import { colors } from '$lib/utils/colors';
	import { onMount } from 'svelte';

	$: eventId = $page.params.id ?? '';
	let themeColor: Color = colors[0];
	$: if (eventId) themeColor = getEventTheme(eventId);

	let media: any[] = [];
	let faqs: any[] = [];
	let loading = true;
	let activeTab = 'media';
	let expandedFaq: string | null = null;

	onMount(async () => {
		if (!eventId) return;
		try {
			const data = await getPublicMediaFaqs(eventId);
			media = data.media;
			faqs = data.faqs;
		} catch { /* empty */ }
		finally { loading = false; }
	});

	function toggleFaq(id: string) {
		expandedFaq = expandedFaq === id ? null : id;
	}
</script>

<div class="w-full max-w-4xl">
	<div class="mb-6">
		<h1 class="text-2xl font-bold" style="color: {themeColor.text};">Media & FAQs</h1>
		<p class="mt-1 text-sm" style="color: {themeColor.lightText};">Event gallery and frequently asked questions</p>
	</div>

	<!-- Tabs -->
	<div class="mb-6 flex gap-2">
		<button
			class="rounded-lg px-4 py-2 text-sm font-medium transition-all"
			style="background-color: {activeTab === 'media' ? themeColor.button : themeColor.cover}; color: {activeTab === 'media' ? themeColor.buttonText : themeColor.lightText}; border: 1px solid {activeTab === 'media' ? themeColor.button : themeColor.toggle};"
			on:click={() => activeTab = 'media'}
		>
			Media Gallery
		</button>
		<button
			class="rounded-lg px-4 py-2 text-sm font-medium transition-all"
			style="background-color: {activeTab === 'faqs' ? themeColor.button : themeColor.cover}; color: {activeTab === 'faqs' ? themeColor.buttonText : themeColor.lightText}; border: 1px solid {activeTab === 'faqs' ? themeColor.button : themeColor.toggle};"
			on:click={() => activeTab = 'faqs'}
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
		<div class="flex h-40 items-center justify-center rounded-2xl" style="background-color: {themeColor.cover};">
			<p class="text-sm" style="color: {themeColor.lightText};">No media uploaded yet.</p>
		</div>
		{:else}
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
			{#each media as item}
			<div class="group relative overflow-hidden rounded-xl" style="background-color: {themeColor.cover};">
				{#if item.type === 'IMAGE' || item.type === 'GENERAL'}
				<img src={item.url} alt={item.title ?? 'Event media'} class="aspect-square w-full object-cover transition-transform group-hover:scale-105" />
				{:else if item.type === 'VIDEO'}
				<video src={item.url} class="aspect-square w-full object-cover" controls></video>
				{:else}
				<div class="flex aspect-square items-center justify-center">
					<span class="text-3xl">📄</span>
				</div>
				{/if}
				{#if item.title}
				<div class="absolute bottom-0 left-0 right-0 p-2" style="background: linear-gradient(transparent, rgba(0,0,0,0.6));">
					<p class="text-xs font-medium text-white">{item.title}</p>
				</div>
				{/if}
			</div>
			{/each}
		</div>
		{/if}

	{:else}
		{#if faqs.length === 0}
		<div class="flex h-40 items-center justify-center rounded-2xl" style="background-color: {themeColor.cover};">
			<p class="text-sm" style="color: {themeColor.lightText};">No FAQs published yet.</p>
		</div>
		{:else}
		<div class="flex flex-col gap-3">
			{#each faqs as faq}
			{@const faqId = faq._id ?? faq.id}
			<div class="overflow-hidden rounded-xl" style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};">
				<button
					class="flex w-full items-center justify-between px-5 py-4 text-left"
					on:click={() => toggleFaq(faqId)}
				>
					<span class="text-sm font-medium" style="color: {themeColor.text};">{faq.question}</span>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
						style="color: {themeColor.lightText}; transform: rotate({expandedFaq === faqId ? '180deg' : '0deg'}); transition: transform 0.2s; flex-shrink: 0;">
						<path d="M19 9L12 15L5 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>
				{#if expandedFaq === faqId}
				<div class="px-5 pb-4">
					<p class="text-sm leading-relaxed" style="color: {themeColor.lightText};">{faq.answer}</p>
					{#if faq.category}
					<span class="mt-2 inline-block rounded-full px-2 py-0.5 text-xs" style="background-color: {themeColor.smallCover}; color: {themeColor.lightText};">{faq.category}</span>
					{/if}
				</div>
				{/if}
			</div>
			{/each}
		</div>
		{/if}
	{/if}
</div>
