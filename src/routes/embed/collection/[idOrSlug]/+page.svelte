<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { getPublicCollectionBySlug } from '$lib/services/event.services';
	import { sanitizeHtml } from '$lib/security/sanitizeHtml';

	$: idOrSlug = ($page.params as Record<string, string>).idOrSlug ?? '';
	$: qTheme = $page.url.searchParams.get('theme');
	$: qPrimary = $page.url.searchParams.get('primary');
	$: qBg = $page.url.searchParams.get('bg');
	$: qText = $page.url.searchParams.get('text');
	$: qRadius = $page.url.searchParams.get('radius');
	$: qLayout = $page.url.searchParams.get('layout');
	$: qOpenMode = $page.url.searchParams.get('openMode');
	$: qRedirect = $page.url.searchParams.get('redirectUrl');
	$: qShowSearch = $page.url.searchParams.get('showSearch');
	$: qShowTags = $page.url.searchParams.get('showTags');
	$: qShowPast = $page.url.searchParams.get('showPastEvents');
	$: qParentOrigin = $page.url.searchParams.get('parentOrigin') || '*';

	let loading = true;
	let error = '';
	let collection: any = null;
	let events: any[] = [];
	let eventTags: any[] = [];
	let search = '';
	let selectedTag = 'all';

	$: savedCfg = collection?.embedConfig || {};
	$: isDark = (qTheme || savedCfg.theme || 'light') === 'dark';
	$: primaryColor = qPrimary || savedCfg.primaryColor || '#7C3AED';
	$: bgColor = qBg || savedCfg.backgroundColor || (isDark ? '#0b0f19' : '#ffffff');
	$: textColor = qText || savedCfg.textColor || (isDark ? '#f8fafc' : '#0f172a');
	$: radiusPx = Number(qRadius ?? savedCfg.borderRadius ?? 12);
	$: layout = qLayout || savedCfg.layout || 'grid';
	$: openMode = qOpenMode || savedCfg.openMode || 'modal';
	$: showSearch = qShowSearch !== null ? qShowSearch !== 'false' : savedCfg.showSearch !== false;
	$: showTags = qShowTags !== null ? qShowTags !== 'false' : savedCfg.showTags !== false;
	$: showPast = qShowPast !== null ? qShowPast !== 'false' : savedCfg.showPastEvents === true;

	$: filteredEvents = events.filter((ev) => {
		if (!showPast && ev.endDateTime && new Date(ev.endDateTime).getTime() < Date.now()) return false;
		if (selectedTag !== 'all' && !(ev.collectionTagIds || []).includes(selectedTag)) return false;
		if (search.trim()) {
			const q = search.trim().toLowerCase();
			return (
				String(ev.title || '').toLowerCase().includes(q) ||
				String(ev.locationDetails?.physical?.venueName || '').toLowerCase().includes(q)
			);
		}
		return true;
	});

	function emitParent(type: string, payload: any = {}) {
		if (typeof window === 'undefined' || window.parent === window) return;
		const targetOrigin =
			qParentOrigin && (qParentOrigin.startsWith('http://') || qParentOrigin.startsWith('https://'))
				? qParentOrigin
				: '*';
		window.parent.postMessage({ source: 'rondwell-sdk', type, payload }, targetOrigin);
	}

	onMount(async () => {
		try {
			const data = await getPublicCollectionBySlug(idOrSlug);
			collection = data.collection;
			events = data.events || [];
			eventTags = data.eventTags || [];
			emitParent('rondwell:ready', { collectionId: collection?._id || idOrSlug });
		} catch (e: any) {
			error = e?.message || 'Collection not found.';
		} finally {
			loading = false;
		}
	});

	function openEvent(ev: any) {
		const inIframe = typeof window !== 'undefined' && window.parent !== window;
		if (openMode === 'modal' && inIframe) {
			emitParent('rondwell:collection:open-event', {
				eventId: ev._id,
				slug: ev.customLinkSlug,
				title: ev.title,
			});
			return;
		}
		const targetUrl = `/embed/event/${encodeURIComponent(ev._id)}${qRedirect ? `?redirectUrl=${encodeURIComponent(qRedirect)}` : ''}`;
		if (openMode === 'new_tab') window.open(`/e/${ev.customLinkSlug || ev._id}`, '_blank', 'noopener');
		else window.location.assign(targetUrl);
	}
</script>

<div class="p-5 sm:p-6" style="background-color:{bgColor}; color:{textColor}; border-radius:{radiusPx}px;">
	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="h-44 animate-pulse rounded-xl bg-slate-200/70"></div>
			<div class="h-44 animate-pulse rounded-xl bg-slate-200/70"></div>
		</div>
	{:else if error || !collection}
		<div class="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
			<p class="font-semibold">Collection unavailable</p>
			<p class="mt-1 text-sm">{error}</p>
		</div>
	{:else}
		<div class="mb-5 flex flex-wrap items-start justify-between gap-4">
			<div>
				<h1 class="text-xl font-bold">{collection.name}</h1>
				{#if collection.description}
					<div class="mt-1 line-clamp-2 text-sm opacity-75">{@html sanitizeHtml(collection.description)}</div>
				{/if}
			</div>
			{#if showSearch}
				<input
					type="search"
					bind:value={search}
					placeholder="Search events…"
					class="rounded-lg border px-3 py-1.5 text-sm outline-none"
					style="border-color:{isDark ? '#334155' : '#cbd5e1'}; background-color:transparent;"
				/>
			{/if}
		</div>

		{#if showTags && eventTags.length > 0}
			<div class="mb-4 flex flex-wrap gap-2">
				<button
					type="button"
					on:click={() => (selectedTag = 'all')}
					class="rounded-full px-3 py-1 text-xs font-medium transition"
					style={selectedTag === 'all'
						? `background-color:${primaryColor}; color:#fff;`
						: `border:1px solid ${isDark ? '#334155' : '#cbd5e1'};`}
				>
					All ({events.length})
				</button>
				{#each eventTags as tag}
					<button
						type="button"
						on:click={() => (selectedTag = tag.id)}
						class="rounded-full px-3 py-1 text-xs font-medium transition"
						style={selectedTag === tag.id
							? `background-color:${primaryColor}; color:#fff;`
							: `border:1px solid ${isDark ? '#334155' : '#cbd5e1'};`}
					>
						{tag.name}
					</button>
				{/each}
			</div>
		{/if}

		{#if filteredEvents.length === 0}
			<p class="rounded-xl border p-8 text-center text-sm opacity-70" style="border-color:{isDark ? '#1e293b' : '#e2e8f0'};">
				No events match the current filter.
			</p>
		{:else}
			<div class={layout === 'list' ? 'space-y-3' : layout === 'cards' ? 'grid gap-4 sm:grid-cols-3' : 'grid gap-4 sm:grid-cols-2'}>
				{#each filteredEvents as ev}
					<div
						class="flex overflow-hidden border transition hover:shadow-md {layout === 'list' ? 'flex-row items-center justify-between p-3 gap-4' : 'flex-col'}"
						style="border-radius:{radiusPx}px; border-color:{isDark ? '#1e293b' : '#e2e8f0'};"
					>
						{#if layout !== 'list' && (ev.coverPictureUrl || ev.displayPictureUrl)}
							<img
								src={ev.coverPictureUrl || ev.displayPictureUrl}
								alt={ev.title}
								class="h-36 w-full object-cover"
							/>
						{/if}
						<div class={layout === 'list' ? 'min-w-0 flex-1' : 'flex flex-1 flex-col justify-between p-4'}>
							<div>
								<p class="text-[11px] font-medium uppercase tracking-wide opacity-65">
									{ev.startDateTime ? new Date(ev.startDateTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'} · {ev.eventType || 'EVENT'}
								</p>
								<h2 class="mt-1 font-semibold leading-snug">{ev.title}</h2>
								{#if ev.locationDetails?.physical?.venueName}
									<p class="mt-0.5 truncate text-xs opacity-70">{ev.locationDetails.physical.venueName}</p>
								{/if}
							</div>
							{#if layout !== 'list'}
								<button
									type="button"
									on:click={() => openEvent(ev)}
									class="mt-3 w-full py-2 text-xs font-semibold text-white transition hover:opacity-95"
									style="background-color:{primaryColor}; border-radius:{Math.max(6, radiusPx - 3)}px;"
								>
									Register
								</button>
							{/if}
						</div>
						{#if layout === 'list'}
							<button
								type="button"
								on:click={() => openEvent(ev)}
								class="shrink-0 px-4 py-2 text-xs font-semibold text-white transition hover:opacity-95"
								style="background-color:{primaryColor}; border-radius:{Math.max(6, radiusPx - 3)}px;"
							>
								Register
							</button>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
