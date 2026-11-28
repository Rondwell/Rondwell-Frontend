<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { getMyCollections, updateCollection } from '$lib/services/event.services';
	import { listApiKeys, type ApiKeyItem } from '$lib/services/developer.services';
	import { toast } from '$lib/stores/toast.store';

	$: collectionId = $page.params.id ?? '';

	let loading = true;
	let saving = false;
	let collectionSlug = '';
	let collectionName = 'Collection';
	let publishableKeys: ApiKeyItem[] = [];
	let selectedPk = 'rw_live_pub_your_publishable_key';
	let snippetTab: 'html' | 'js' | 'react' | 'iframe' = 'html';

	// Collection SDK configuration
	let layout: 'grid' | 'list' | 'cards' = 'grid';
	let theme: 'light' | 'dark' = 'light';
	let primaryColor = '#7C3AED';
	let backgroundColor = '#FFFFFF';
	let textColor = '#111827';
	let borderRadius = 12;
	let openMode: 'modal' | 'inline' | 'new_tab' = 'modal';
	let showSearch = true;
	let showTags = true;
	let showPastEvents = false;
	let redirectUrl = '';

	onMount(async () => {
		try {
			const [cols, keys] = await Promise.all([
				getMyCollections(),
				listApiKeys().catch(() => []),
			]);
			const col = (cols ?? []).find((c: any) => (c._id ?? c.id) === collectionId);
			if (col) {
				collectionSlug = col.slug || collectionId;
				collectionName = col.name || 'Collection';
				const cfg = col.embedConfig || {};
				layout = cfg.layout || 'grid';
				theme = cfg.theme === 'dark' ? 'dark' : 'light';
				primaryColor = cfg.primaryColor || '#7C3AED';
				backgroundColor = cfg.backgroundColor || (theme === 'dark' ? '#0B0F19' : '#FFFFFF');
				textColor = cfg.textColor || (theme === 'dark' ? '#F8FAFC' : '#111827');
				borderRadius = cfg.borderRadius ?? 12;
				openMode = cfg.openMode || 'modal';
				showSearch = cfg.showSearch !== false;
				showTags = cfg.showTags !== false;
				showPastEvents = cfg.showPastEvents === true;
				redirectUrl = cfg.redirectUrl || '';
			}
			publishableKeys = (keys || []).filter((k) => k.keyType === 'PUBLISHABLE' && k.status === 'ACTIVE');
			if (publishableKeys[0]?.keyPrefix) selectedPk = `${publishableKeys[0].keyPrefix}...`;
		} catch {
			/* defaults */
		} finally {
			loading = false;
		}
	});

	$: identifier = collectionSlug || collectionId;
	$: queryStr = new URLSearchParams({
		layout,
		theme,
		primary: primaryColor,
		bg: backgroundColor,
		text: textColor,
		radius: String(borderRadius),
		openMode,
		showSearch: String(showSearch),
		showTags: String(showTags),
		showPastEvents: String(showPastEvents),
		...(redirectUrl ? { redirectUrl } : {}),
	}).toString();

	$: previewSrc = `/embed/collection/${encodeURIComponent(identifier)}?${queryStr}`;

	$: htmlSnippet =
		`<div\n  data-rondwell-collection="${identifier}"\n  data-rondwell-pk="${selectedPk}"\n  data-rondwell-layout="${layout}"\n  data-rondwell-theme="${theme}"\n  data-rondwell-primary="${primaryColor}"\n  data-rondwell-radius="${borderRadius}"\n  data-rondwell-open-mode="${openMode}"${redirectUrl ? `\n  data-rondwell-redirect="${redirectUrl}"` : ''}\n></div>\n\n` +
		// csp-ignore-next-line — copyable external SDK script snippet for organizer websites
		`<script src="https://rondwell.com/sdk/v1/rondwell.js" async><\/script>`;

	$: jsSnippet = `import Rondwell from '@rondwell/web-sdk';\n\nRondwell.init({ publishableKey: '${selectedPk}' });\n\nRondwell.mountCollection('#rondwell-events', '${identifier}', {\n  layout: '${layout}',\n  theme: '${theme}',\n  primaryColor: '${primaryColor}',\n  borderRadius: ${borderRadius},\n  openMode: '${openMode}',\n  showSearch: ${showSearch},\n  showTags: ${showTags},\n  showPastEvents: ${showPastEvents},${redirectUrl ? `\n  redirectUrl: '${redirectUrl}',` : ''}\n  onSuccess: (reg) => console.log('Registered:', reg.registrationId),\n});`;

	$: reactSnippet = `import { useEffect, useRef } from 'react';\nimport { mountRondwellCollection } from '@rondwell/web-sdk/react';\n\nexport function CollectionEvents() {\n  const ref = useRef<HTMLDivElement>(null);\n  useEffect(() => mountRondwellCollection(ref.current, '${identifier}', {\n    publishableKey: '${selectedPk}',\n    layout: '${layout}',\n    theme: '${theme}',\n    primaryColor: '${primaryColor}',\n    openMode: '${openMode}',\n  }), []);\n  return <div ref={ref} />;\n}`;

	$: iframeSnippet =
		// csp-ignore-next-line — copyable HTML iframe snippet for organizer websites
		`<iframe\n  src="https://rondwell.com/embed/collection/${identifier}?${queryStr}"\n  style="width:100%;min-height:620px;border:0;border-radius:${borderRadius}px;"\n  allow="payment *"\n></iframe>`;

	async function saveConfig() {
		if (!collectionId) return;
		saving = true;
		try {
			await updateCollection(collectionId, {
				embedConfig: {
					enabled: true,
					layout,
					theme,
					primaryColor,
					backgroundColor,
					textColor,
					borderRadius: Number(borderRadius),
					openMode,
					showSearch,
					showTags,
					showPastEvents,
					redirectUrl: redirectUrl.trim(),
				},
			});
			toast.success('Collection SDK settings saved.');
		} catch (e: any) {
			toast.error(e?.message || 'Failed to save Collection SDK settings');
		} finally {
			saving = false;
		}
	}

	function copyCode(text: string) {
		navigator.clipboard?.writeText(text);
		toast.success('Copied to clipboard');
	}
</script>

<div class="space-y-6 py-6">
	<div class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5">
		<div>
			<h2 class="text-lg font-bold text-gray-900">Collection Web SDK &amp; Embed Studio</h2>
			<p class="mt-0.5 text-sm text-gray-600">
				Stream all events in <span class="font-semibold">{collectionName}</span> into your website with instant modal registration.
			</p>
		</div>
		<div class="flex gap-2">
			<a href="/settings?tab=developers" class="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50">
				Manage SDK Keys
			</a>
			<a href="/api-docs#sdk-collection" class="rounded-lg bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-gray-800">
				Collection SDK Docs
			</a>
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-12">
		<div class="space-y-4 rounded-xl border border-gray-200 bg-white p-5 lg:col-span-5">
			<h3 class="text-sm font-bold text-gray-900">Appearance &amp; Behavior</h3>

			<div>
				<label class="text-xs font-semibold text-gray-700">Publishable SDK Key</label>
				{#if publishableKeys.length > 0}
					<select bind:value={selectedPk} class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-mono">
						{#each publishableKeys as k}
							<option value="{k.keyPrefix}...">{k.name} ({k.keyPrefix}…)</option>
						{/each}
					</select>
				{:else}
					<p class="mt-1 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
						<a href="/settings?tab=developers" class="font-semibold underline">Generate a Publishable Key</a> in Account Settings.
					</p>
				{/if}
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="text-xs font-semibold text-gray-700">Layout</label>
					<select bind:value={layout} class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-2 text-xs">
						<option value="grid">Grid</option>
						<option value="list">List</option>
						<option value="cards">Compact Cards</option>
					</select>
				</div>
				<div>
					<label class="text-xs font-semibold text-gray-700">Theme</label>
					<select bind:value={theme} class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-2 text-xs">
						<option value="light">Light</option>
						<option value="dark">Dark</option>
					</select>
				</div>
			</div>

			<div class="grid grid-cols-3 gap-3">
				<div>
					<label class="text-xs font-semibold text-gray-700">Accent</label>
					<input type="color" bind:value={primaryColor} class="mt-1 h-9 w-full cursor-pointer rounded border border-gray-300" />
				</div>
				<div>
					<label class="text-xs font-semibold text-gray-700">Background</label>
					<input type="color" bind:value={backgroundColor} class="mt-1 h-9 w-full cursor-pointer rounded border border-gray-300" />
				</div>
				<div>
					<label class="text-xs font-semibold text-gray-700">Radius ({borderRadius}px)</label>
					<input type="range" min="0" max="24" bind:value={borderRadius} class="mt-3 w-full" />
				</div>
			</div>

			<div>
				<label class="text-xs font-semibold text-gray-700">When Visitor Clicks Register</label>
				<select bind:value={openMode} class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-2 text-xs">
					<option value="modal">Open Event Page SDK Modal (Recommended)</option>
					<option value="inline">Open Inline Inside Widget</option>
					<option value="new_tab">Open in New Tab</option>
				</select>
			</div>

			<div>
				<label class="text-xs font-semibold text-gray-700">Post-Registration Redirect URL (Optional)</label>
				<!-- csp-ignore-next-line — placeholder text -->
				<input bind:value={redirectUrl} placeholder="https://yoursite.com/registered" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs" />
			</div>

			<div class="grid grid-cols-2 gap-2 text-xs">
				<label class="flex items-center gap-2"><input type="checkbox" bind:checked={showSearch} /> Search Bar</label>
				<label class="flex items-center gap-2"><input type="checkbox" bind:checked={showTags} /> Tag Filters</label>
				<label class="flex items-center gap-2"><input type="checkbox" bind:checked={showPastEvents} /> Include Past Events</label>
			</div>

			<button
				type="button"
				disabled={saving}
				on:click={saveConfig}
				class="w-full rounded-lg bg-gray-900 py-2.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
			>
				{saving ? 'Saving…' : 'Save Collection SDK Settings'}
			</button>
		</div>

		<div class="space-y-5 lg:col-span-7">
			<div class="rounded-xl border border-gray-200 bg-white p-5">
				<h3 class="mb-3 text-sm font-bold text-gray-900">Live Collection SDK Preview</h3>
				{#if !loading && identifier}
					<iframe
						title="Collection SDK Preview"
						src={previewSrc}
						class="h-[460px] w-full rounded-xl border border-gray-200"
					></iframe>
				{:else}
					<div class="h-64 animate-pulse rounded-xl bg-gray-100"></div>
				{/if}
			</div>

			<div class="rounded-xl border border-gray-200 bg-white p-5">
				<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
					<div class="flex gap-1.5">
						{#each [['html', 'HTML Web SDK'], ['js', 'JS SDK'], ['react', 'React'], ['iframe', 'iFrame']] as [id, label]}
							<button
								type="button"
								on:click={() => (snippetTab = id as any)}
								class="rounded-lg px-3 py-1.5 text-xs font-semibold {snippetTab === id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}"
							>
								{label}
							</button>
						{/each}
					</div>
					<button
						type="button"
						on:click={() => copyCode(snippetTab === 'html' ? htmlSnippet : snippetTab === 'js' ? jsSnippet : snippetTab === 'react' ? reactSnippet : iframeSnippet)}
						class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
					>
						Copy Code
					</button>
				</div>
				<pre class="max-h-72 overflow-auto rounded-lg bg-slate-950 p-4 font-mono text-xs text-slate-100"><code>{snippetTab === 'html' ? htmlSnippet : snippetTab === 'js' ? jsSnippet : snippetTab === 'react' ? reactSnippet : iframeSnippet}</code></pre>
			</div>
		</div>
	</div>
</div>
