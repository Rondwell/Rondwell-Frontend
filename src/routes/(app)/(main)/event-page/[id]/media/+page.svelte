<script lang="ts">
	import { page } from '$app/stores';
	import { getEventTheme } from '$lib/stores/eventTheme';
	import type { Color } from '$lib/utils/colors';
	import { colors } from '$lib/utils/colors';

	let themeColor: Color = colors[0];
	$: {
		const match = $page.url.pathname.match(/^\/event-page\/([^/]+)/);
		if (match) themeColor = getEventTheme(match[1]);
	}

	const gallery = [
		{ src: '/eventpage_sample.svg', caption: 'Opening Ceremony' },
		{ src: '/event_pic1.png', caption: 'Keynote Session' },
		{ src: '/community-image.png', caption: 'Networking Lounge' },
		{ src: '/eventpage_sample.svg', caption: 'Workshop Room B' },
		{ src: '/event_pic1.png', caption: 'Panel Discussion' },
		{ src: '/community-image.png', caption: 'Award Ceremony' }
	];

	const faqs = [
		{ q: 'What is the dress code for the event?', a: 'Smart casual is recommended. The venue is air-conditioned so a light jacket is advised.' },
		{ q: 'Is parking available at the venue?', a: 'Yes, free parking is available for all registered attendees. Please show your registration QR code at the gate.' },
		{ q: 'Can I transfer my ticket to someone else?', a: 'Ticket transfers are allowed up to 48 hours before the event. Contact support to initiate a transfer.' },
		{ q: 'Will sessions be recorded?', a: 'Selected keynote sessions will be recorded and made available to registered attendees within 7 days after the event.' },
		{ q: 'Is there a refund policy?', a: 'Full refunds are available up to 14 days before the event. No refunds will be issued after that date.' }
	];

	let openFaq: number | null = null;
	let activeTab: 'media' | 'faqs' = 'media';

	function toggleFaq(i: number) {
		openFaq = openFaq === i ? null : i;
	}
</script>

<div class="w-full max-w-4xl">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold" style="color: {themeColor.text};">Media & FAQs</h1>
		<p class="mt-1 text-sm" style="color: {themeColor.lightText};">Photos from the event and answers to common questions</p>
	</div>

	<!-- Tab switcher -->
	<div class="mb-6 flex gap-2">
		{#each (['media', 'faqs'] as const) as tab}
			<button
				class="rounded-[10px] px-5 py-2 text-sm font-medium capitalize transition-colors"
				style={activeTab === tab
					? `background-color: ${themeColor.button}; color: ${themeColor.buttonText};`
					: `background-color: ${themeColor.cover}; color: ${themeColor.lightText}; border: 1px solid ${themeColor.toggle};`}
				on:click={() => (activeTab = tab)}
			>
				{tab === 'faqs' ? 'FAQs' : 'Media'}
			</button>
		{/each}
	</div>

	{#if activeTab === 'media'}
		<!-- Photo Grid -->
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{#each gallery as photo, i}
				<div
					class="group relative overflow-hidden rounded-2xl"
					style="border: 1px solid {themeColor.toggle};"
				>
					<img
						src={photo.src}
						alt={photo.caption}
						class="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
					/>
					<div
						class="absolute inset-x-0 bottom-0 px-3 py-2 text-xs font-medium"
						style="background: linear-gradient(to top, {themeColor.bg}cc, transparent); color: {themeColor.text};"
					>
						{photo.caption}
					</div>
				</div>
			{/each}
		</div>

		<!-- Upload CTA -->
		<div
			class="mt-6 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10"
			style="border-color: {themeColor.toggle}; background-color: {themeColor.cover};"
		>
			<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: {themeColor.lightText};">
				<path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M9 10C10.1046 10 11 9.10457 11 8C11 6.89543 10.1046 6 9 6C7.89543 6 7 6.89543 7 8C7 9.10457 7.89543 10 9 10Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M2.67 18.95L7.6 15.64C8.39 15.11 9.53 15.17 10.24 15.78L10.57 16.07C11.35 16.74 12.61 16.74 13.39 16.07L17.55 12.5C18.33 11.83 19.59 11.83 20.37 12.5L22 13.9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
			<p class="text-sm font-medium" style="color: {themeColor.text};">Share your event photos</p>
			<p class="text-xs" style="color: {themeColor.lightText};">Upload photos from the event to share with other attendees</p>
			<button
				class="rounded-[10px] px-5 py-2 text-sm font-medium"
				style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
			>
				Upload Photos
			</button>
		</div>

	{:else}
		<!-- FAQs Accordion -->
		<div class="flex flex-col gap-3">
			{#each faqs as faq, i}
				<div
					class="overflow-hidden rounded-2xl"
					style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};"
				>
					<button
						class="flex w-full items-center justify-between px-5 py-4 text-left"
						on:click={() => toggleFaq(i)}
					>
						<span class="text-sm font-semibold pr-4" style="color: {themeColor.text};">{faq.q}</span>
						<svg
							width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
							style="color: {themeColor.lightText}; flex-shrink: 0; transform: rotate({openFaq === i ? '180deg' : '0deg'}); transition: transform 0.2s;"
						>
							<path d="M19 9L12 15L5 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</button>
					{#if openFaq === i}
						<div class="border-t px-5 py-4" style="border-color: {themeColor.toggle};">
							<p class="text-sm leading-relaxed" style="color: {themeColor.lightText};">{faq.a}</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
