<script lang="ts">
	/**
	 * Unified SEO head component.
	 *
	 * Renders the complete, WhatsApp/Facebook/X/LinkedIn-compatible metadata set
	 * from a single SeoMeta object. Every public page uses this so the emitted
	 * <head> is always consistent and complete — no more per-page drift.
	 *
	 * All tags render inside <svelte:head>, so with SSR enabled they are present
	 * in the initial HTML that crawlers (which do not run JavaScript) receive.
	 */
	import { SITE, OG_IMAGE, type SeoMeta } from '$lib/seo';

	export let seo: SeoMeta | null | undefined = null;

	$: alt = seo?.imageAlt || seo?.title || SITE.name;
	$: ogType = seo?.ogType || 'website';
</script>

<svelte:head>
	{#if seo}
		<title>{seo.title}</title>
		<meta name="description" content={seo.description} />
		<link rel="canonical" href={seo.url} />
		{#if seo.noindex}
			<meta name="robots" content="noindex, nofollow" />
		{:else}
			<meta name="robots" content="index, follow" />
		{/if}

		<!-- Open Graph (Facebook, WhatsApp, Telegram, LinkedIn, iMessage) -->
		<meta property="og:site_name" content={SITE.name} />
		<meta property="og:type" content={ogType} />
		<meta property="og:title" content={seo.title} />
		<meta property="og:description" content={seo.description} />
		<meta property="og:url" content={seo.url} />
		<meta property="og:locale" content={SITE.locale} />
		<meta property="og:image" content={seo.image} />
		<meta property="og:image:secure_url" content={seo.image} />
		<meta property="og:image:type" content={OG_IMAGE.type} />
		<meta property="og:image:width" content={String(OG_IMAGE.width)} />
		<meta property="og:image:height" content={String(OG_IMAGE.height)} />
		<meta property="og:image:alt" content={alt} />

		<!-- Twitter / X -->
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:site" content={SITE.twitter} />
		<meta name="twitter:title" content={seo.title} />
		<meta name="twitter:description" content={seo.description} />
		<meta name="twitter:image" content={seo.image} />
		<meta name="twitter:image:alt" content={alt} />

		<!-- Event facets for crawlers that read them -->
		{#if seo.event?.startDate}
			<meta name="event:start_date" content={seo.event.startDate} />
		{/if}
		{#if seo.event?.endDate}
			<meta name="event:end_date" content={seo.event.endDate} />
		{/if}
		{#if seo.event?.location}
			<meta name="event:location" content={seo.event.location} />
		{/if}

		<!-- JSON-LD structured data -->
		{#if seo.jsonLd}
			{@html `<script type="application/ld+json">${JSON.stringify(seo.jsonLd)}<\/script>`}
		{/if}
	{/if}
</svelte:head>
