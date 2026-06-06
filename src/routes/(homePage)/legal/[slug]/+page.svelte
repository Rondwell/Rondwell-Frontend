<!--
	FE-P4-10 (P4-10) — Public compliance documentation pages.

	The compliance docs live in the backend repo under `docs/compliance/`. The
	backend exposes them at /api/v1/profile/legal/:slug as markdown. We render
	a thin viewer here, falling back to a stub when the slug isn't published.
-->
<script lang="ts">
	import { page } from '$app/stores';
	import { getLegalDoc, LEGAL_DOCS, type LegalDoc, type LegalSlug } from '$lib/services/legal.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	$: slug = $page.params.slug as LegalSlug;
	$: meta = LEGAL_DOCS.find((d) => d.slug === slug);

	let doc: LegalDoc | null = null;
	let loading = true;

	$: if (slug) load();

	async function load() {
		loading = true;
		doc = null;
		try {
			doc = await getLegalDoc(slug);
		} finally {
			loading = false;
		}
	}

	onMount(load);

	/**
	 * Minimal markdown renderer — handles headings, paragraphs, lists,
	 * inline code, bold/italic, and links. Anything more complex falls
	 * through to a `<pre>`. Keeping it inline avoids pulling a dependency
	 * for a public-facing static page.
	 */
	function renderMarkdown(md: string): string {
		if (!md) return '';
		let html = md
			// escape HTML
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');

		// Code blocks (triple backtick)
		html = html.replace(/```([\s\S]*?)```/g, (_m, code) => `<pre class="my-3 rounded-md bg-gray-900 p-3 text-xs text-gray-100 overflow-x-auto">${code}</pre>`);

		// Headings
		html = html
			.replace(/^### (.*)$/gm, '<h3 class="mt-5 text-lg font-semibold">$1</h3>')
			.replace(/^## (.*)$/gm, '<h2 class="mt-6 text-xl font-bold">$1</h2>')
			.replace(/^# (.*)$/gm, '<h1 class="mt-8 text-2xl font-bold">$1</h1>');

		// Bold + italic + inline code
		html = html
			.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
			.replace(/\*([^*]+)\*/g, '<em>$1</em>')
			.replace(/`([^`]+)`/g, '<code class="rounded bg-gray-100 px-1 text-sm">$1</code>');

		// Links [text](url)
		html = html.replace(
			/\[([^\]]+)\]\(([^)]+)\)/g,
			'<a href="$2" class="text-pink-600 underline" target="_blank" rel="noopener noreferrer">$1</a>'
		);

		// Lists (consecutive lines starting with - or *)
		html = html.replace(/(^|\n)((?:- .+(?:\n|$))+)/g, (_m, lead, block) => {
			const items = block
				.trim()
				.split('\n')
				.map((line: string) => `<li>${line.replace(/^- /, '')}</li>`)
				.join('');
			return `${lead}<ul class="my-3 ml-6 list-disc space-y-1">${items}</ul>`;
		});

		// Paragraphs — wrap remaining double-newline blocks
		html = html
			.split(/\n{2,}/)
			.map((p) => {
				if (
					p.startsWith('<h') ||
					p.startsWith('<ul') ||
					p.startsWith('<pre') ||
					p.trim() === ''
				)
					return p;
				return `<p class="my-3 leading-relaxed text-gray-700">${p.replace(/\n/g, ' ')}</p>`;
			})
			.join('\n');

		return html;
	}
</script>

<svelte:head>
	<title>{meta?.title ?? 'Legal'} | Rondwell</title>
	<meta name="description" content={meta?.description ?? 'Rondwell compliance documentation.'} />
</svelte:head>

<div class="mx-auto max-w-4xl px-6 py-10">
	<a href="/terms" class="inline-flex items-center gap-1 text-xs text-pink-600 hover:underline">
		<Icon icon="mdi:arrow-left" /> Back to terms
	</a>

	<header class="mt-4 mb-6">
		<h1 class="text-3xl font-bold">{meta?.title ?? 'Legal document'}</h1>
		{#if meta?.description}
			<p class="mt-2 text-sm text-gray-500">{meta.description}</p>
		{/if}
		{#if doc?.lastUpdated}
			<p class="mt-2 inline-block rounded-full bg-[#F0E0D8] px-3 py-1 text-xs text-[#F77A3A]">
				Updated {doc.lastUpdated}
			</p>
		{/if}
	</header>

	{#if loading}
		<div class="space-y-3">
			{#each [1, 2, 3, 4, 5] as _}
				<div class="h-4 animate-pulse rounded bg-gray-200"></div>
			{/each}
		</div>
	{:else if doc?.body}
		<article class="prose max-w-none">
			{@html renderMarkdown(doc.body)}
		</article>
	{:else}
		<div class="rounded-xl border border-dashed bg-white p-10 text-center">
			<Icon icon="mdi:file-document-outline" class="mx-auto text-4xl text-gray-300" />
			<p class="mt-3 text-sm text-gray-600">
				This document is being finalised. Reach out to <a href="mailto:legal@rondwell.com" class="text-pink-600 underline">legal@rondwell.com</a>
				for a copy in the meantime.
			</p>
		</div>
	{/if}

	<!-- Other legal docs -->
	<section class="mt-10 rounded-xl border bg-white p-5">
		<h2 class="text-sm font-semibold text-gray-900">Other policies</h2>
		<ul class="mt-3 space-y-2 text-sm">
			{#each LEGAL_DOCS.filter((d) => d.slug !== slug) as d}
				<li>
					<a href={`/legal/${d.slug}`} class="text-pink-600 hover:underline">{d.title}</a>
					<span class="ml-2 text-xs text-gray-500">{d.description}</span>
				</li>
			{/each}
		</ul>
	</section>
</div>
