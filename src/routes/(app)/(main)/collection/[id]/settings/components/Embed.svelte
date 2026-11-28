<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import CustomSelect, { type SelectOption } from '$lib/components/CustomSelect.svelte';
	import { getMyCollections, updateCollection } from '$lib/services/event.services';
	import { listApiKeys, type ApiKeyItem } from '$lib/services/developer.services';
	import { toast } from '$lib/stores/toast.store';

	$: collectionId = $page.params.id ?? '';

	let loading = true;
	let saving = false;
	let copiedCode = false;
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

	const COLOR_PRESETS = ['#513BE2', '#7C3AED', '#DB3E6C', '#0EA5E9', '#10B981', '#17161E'];

	const OPEN_MODE_OPTIONS: SelectOption<'modal' | 'inline' | 'new_tab'>[] = [
		{
			value: 'modal',
			label: 'Open Event Page SDK Modal',
			description: 'Visitors stay on your website inside a branded checkout overlay',
			badge: 'BEST',
			badgeTone: 'purple',
			icon: 'solar:window-frame-bold-duotone',
		},
		{
			value: 'inline',
			label: 'Open Inline Inside Widget',
			description: 'Expands the event registration flow directly inside the widget frame',
			icon: 'solar:sidebar-minimalistic-bold-duotone',
		},
		{
			value: 'new_tab',
			label: 'Open Event Page in New Tab',
			description: 'Directs visitors to the hosted Rondwell event page',
			icon: 'solar:square-top-down-bold-duotone',
		},
	];

	$: pkOptions = publishableKeys.map(
		(k): SelectOption<string> => ({
			value: `${k.keyPrefix}...`,
			label: k.name,
			description: `${k.keyPrefix}...`,
			badge: k.environment?.toUpperCase() || 'LIVE',
			badgeTone: k.environment === 'test' ? 'amber' : 'emerald',
			icon: 'solar:code-square-bold-duotone',
		})
	);

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

	$: activeSnippet =
		snippetTab === 'html' ? htmlSnippet : snippetTab === 'js' ? jsSnippet : snippetTab === 'react' ? reactSnippet : iframeSnippet;

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
		copiedCode = true;
		toast.success('Copied to clipboard');
		setTimeout(() => (copiedCode = false), 2000);
	}
</script>

<div class="space-y-6 py-6">
	<!-- Obsidian Hero Banner -->
	<div class="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#17161E] via-[#1F1A36] to-[#291C4F] p-5 text-white shadow-[0_20px_50px_-20px_rgba(23,22,30,0.45)] sm:p-6">
		<div class="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[#7C3AED]/25 blur-3xl"></div>
		<div class="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
			<div>
				<div class="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-[11px] font-semibold text-violet-200">
					<Icon icon="solar:widget-4-bold-duotone" class="h-3.5 w-3.5 text-violet-300" />
					Collection Web SDK &amp; Embed Studio
				</div>
				<h2 class="text-lg font-bold tracking-tight text-white sm:text-xl">Stream {collectionName} Events Anywhere</h2>
				<p class="mt-1 text-xs leading-relaxed text-slate-300 sm:text-sm">
					Display curated upcoming events with search, tag filters, and instant Event Page SDK modal checkout.
				</p>
			</div>
			<div class="flex flex-wrap gap-2.5">
				<a
					href="/settings?tab=developers"
					class="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.08] px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/[0.15]"
				>
					<Icon icon="solar:key-linear" class="h-3.5 w-3.5 text-violet-300" />
					Manage SDK Keys
				</a>
				<a
					href="/api-docs#sdk-collection"
					class="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-[#17161E] shadow-md transition hover:bg-violet-50"
				>
					<Icon icon="solar:book-2-bold-duotone" class="h-3.5 w-3.5 text-[#513BE2]" />
					Collection SDK Docs
				</a>
			</div>
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-12">
		<!-- Left Studio Controls -->
		<div class="space-y-5 rounded-3xl border border-gray-200/80 bg-white p-5 shadow-[0_4px_20px_-8px_rgba(23,22,30,0.08)] lg:col-span-5">
			<div class="flex items-center gap-2.5 border-b border-gray-100 pb-3.5">
				<span class="flex h-8 w-8 items-center justify-center rounded-xl bg-[#513BE2]/10 text-[#513BE2]">
					<Icon icon="solar:tuning-2-bold-duotone" class="h-4 w-4" />
				</span>
				<div>
					<h3 class="text-sm font-bold text-[#17161E]">Appearance &amp; Behavior</h3>
					<p class="text-[11px] text-gray-500">Customize widget layout, theme &amp; click action</p>
				</div>
			</div>

			<div>
				<label for="collection-sdk-pk" class="mb-1.5 block text-xs font-semibold text-gray-700">Publishable SDK Key</label>
				{#if pkOptions.length > 0}
					<CustomSelect
						id="collection-sdk-pk"
						options={pkOptions}
						bind:value={selectedPk}
						size="sm"
						ariaLabel="Select publishable key"
					/>
				{:else}
					<div class="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
						<Icon icon="solar:shield-warning-bold-duotone" class="h-4 w-4 shrink-0 text-amber-600" />
						<span>
							<a href="/settings?tab=developers" class="font-bold underline">Generate a Publishable Key</a> in Account Settings.
						</span>
					</div>
				{/if}
			</div>

			<div>
				<p class="mb-1.5 text-xs font-semibold text-gray-700">Layout Style</p>
				<div class="grid grid-cols-3 gap-1 rounded-xl border border-gray-200 bg-[#F3F2F8] p-1">
					{#each [
						{ id: 'grid', label: 'Grid', icon: 'solar:widget-bold-duotone' },
						{ id: 'list', label: 'List', icon: 'solar:list-bold-duotone' },
						{ id: 'cards', label: 'Cards', icon: 'solar:slider-vertical-bold-duotone' },
					] as item}
						<button
							type="button"
							on:click={() => (layout = item.id as any)}
							class="flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition {layout === item.id ? 'bg-white text-[#17161E] shadow-sm' : 'text-gray-500 hover:text-[#17161E]'}"
						>
							<Icon icon={item.icon} class="h-3.5 w-3.5 {layout === item.id ? 'text-[#513BE2]' : ''}" />
							{item.label}
						</button>
					{/each}
				</div>
			</div>

			<div>
				<p class="mb-1.5 text-xs font-semibold text-gray-700">Theme</p>
				<div class="grid grid-cols-2 gap-1 rounded-xl border border-gray-200 bg-[#F3F2F8] p-1">
					<button
						type="button"
						on:click={() => (theme = 'light')}
						class="flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition {theme === 'light' ? 'bg-white text-[#17161E] shadow-sm' : 'text-gray-500 hover:text-[#17161E]'}"
					>
						<Icon icon="solar:sun-2-bold-duotone" class="h-3.5 w-3.5 text-amber-500" />
						Light
					</button>
					<button
						type="button"
						on:click={() => (theme = 'dark')}
						class="flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition {theme === 'dark' ? 'bg-[#17161E] text-white shadow-sm' : 'text-gray-500 hover:text-[#17161E]'}"
					>
						<Icon icon="solar:moon-bold-duotone" class="h-3.5 w-3.5 text-violet-400" />
						Dark
					</button>
				</div>
			</div>

			<div>
				<div class="mb-2 flex items-center justify-between">
					<span class="text-xs font-semibold text-gray-700">Accent Color</span>
					<span class="font-mono text-[11px] font-medium text-gray-500">{primaryColor.toUpperCase()}</span>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					{#each COLOR_PRESETS as swatch}
						<button
							type="button"
							on:click={() => (primaryColor = swatch)}
							aria-label="Pick accent color {swatch}"
							class="h-7 w-7 rounded-full border-2 transition-transform hover:scale-105 {primaryColor.toLowerCase() === swatch.toLowerCase() ? 'border-[#17161E] ring-2 ring-[#513BE2]/25 scale-105' : 'border-white shadow-sm'}"
							style="background-color: {swatch}"
						></button>
					{/each}
					<label class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-100">
						<input type="color" bind:value={primaryColor} class="h-4 w-4 cursor-pointer border-0 bg-transparent p-0" />
						Custom
					</label>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-3.5">
				<div>
					<label for="col-sdk-bg" class="mb-1.5 block text-xs font-semibold text-gray-700">Background</label>
					<label class="flex cursor-pointer items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2">
						<input id="col-sdk-bg" type="color" bind:value={backgroundColor} class="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0" />
						<span class="font-mono text-xs text-gray-700">{backgroundColor.toUpperCase()}</span>
					</label>
				</div>
				<div>
					<div class="mb-1.5 flex items-center justify-between">
						<label for="col-sdk-radius" class="text-xs font-semibold text-gray-700">Corner Radius</label>
						<span class="font-mono text-xs font-bold text-[#513BE2]">{borderRadius}px</span>
					</div>
					<input
						id="col-sdk-radius"
						type="range"
						min="0"
						max="24"
						bind:value={borderRadius}
						class="mt-2 h-2 w-full cursor-pointer accent-[#513BE2]"
					/>
				</div>
			</div>

			<div>
				<label for="collection-open-mode" class="mb-1.5 block text-xs font-semibold text-gray-700">When Visitor Clicks Register</label>
				<CustomSelect
					id="collection-open-mode"
					options={OPEN_MODE_OPTIONS}
					bind:value={openMode}
					size="sm"
					ariaLabel="Select click registration behavior"
				/>
			</div>

			<div>
				<label for="col-redirect-url" class="mb-1.5 block text-xs font-semibold text-gray-700">Post-Registration Redirect URL (Optional)</label>
				<!-- csp-ignore-next-line — placeholder text -->
				<input
					id="col-redirect-url"
					bind:value={redirectUrl}
					placeholder="https://yoursite.com/registered"
					class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs text-[#17161E] outline-none focus:border-[#513BE2] focus:ring-2 focus:ring-[#513BE2]/15"
				/>
			</div>

			<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
				{#each [
					{ label: 'Search Bar', val: showSearch, toggle: () => (showSearch = !showSearch) },
					{ label: 'Tag Filters', val: showTags, toggle: () => (showTags = !showTags) },
					{ label: 'Include Past Events', val: showPastEvents, toggle: () => (showPastEvents = !showPastEvents) },
				] as item}
					<button
						type="button"
						on:click={item.toggle}
						role="switch"
						aria-checked={item.val}
						class="flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium transition {item.val ? 'border-[#513BE2]/30 bg-[#513BE2]/[0.04] text-[#17161E]' : 'border-gray-200 bg-white text-gray-500'}"
					>
						<span>{item.label}</span>
						<span class="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors {item.val ? 'bg-[#513BE2]' : 'bg-gray-300'}">
							<span class="inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform {item.val ? 'translate-x-4.5' : 'translate-x-0.5'}"></span>
						</span>
					</button>
				{/each}
			</div>

			<button
				type="button"
				disabled={saving}
				on:click={saveConfig}
				class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#513BE2] to-[#7C3AED] py-3 text-xs font-bold text-white shadow-[0_8px_20px_-6px_rgba(81,59,226,0.6)] transition hover:brightness-110 disabled:opacity-50"
			>
				<Icon icon="solar:diskette-bold-duotone" class="h-4 w-4" />
				{saving ? 'Saving…' : 'Save Collection SDK Settings'}
			</button>
		</div>

		<!-- Right Browser Preview & Terminal Snippets -->
		<div class="space-y-5 lg:col-span-7">
			<div class="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-[0_4px_20px_-8px_rgba(23,22,30,0.08)]">
				<div class="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-4 py-3">
					<div class="flex items-center gap-3">
						<div class="flex gap-1.5">
							<span class="h-2.5 w-2.5 rounded-full bg-rose-400"></span>
							<span class="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
							<span class="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
						</div>
						<span class="rounded-lg border border-gray-200 bg-white px-2.5 py-1 font-mono text-[11px] text-gray-500">
							yoursite.com/calendar/{identifier}
						</span>
					</div>
					<span class="rounded-full bg-[#513BE2]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#513BE2] uppercase">
						{layout} · {theme}
					</span>
				</div>

				<div class="p-4 sm:p-5">
					{#if !loading && identifier}
						<iframe
							title="Collection SDK Preview"
							src={previewSrc}
							class="h-[460px] w-full rounded-2xl border border-gray-200"
						></iframe>
					{:else}
						<div class="h-64 animate-pulse rounded-2xl bg-gray-100"></div>
					{/if}
				</div>
			</div>

			<div class="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 shadow-xl">
				<div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/90 bg-slate-900/70 px-4 py-3">
					<div class="flex flex-wrap gap-1.5">
						{#each [['html', 'HTML Web SDK'], ['js', 'JS SDK'], ['react', 'React'], ['iframe', 'iFrame']] as [tabId, label]}
							<button
								type="button"
								on:click={() => (snippetTab = tabId as any)}
								class="rounded-xl px-3 py-1.5 text-xs font-semibold transition {snippetTab === tabId ? 'bg-[#513BE2] text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}"
							>
								{label}
							</button>
						{/each}
					</div>
					<button
						type="button"
						on:click={() => copyCode(activeSnippet)}
						class="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
					>
						<Icon icon={copiedCode ? 'solar:check-circle-bold' : 'solar:copy-linear'} class="h-3.5 w-3.5 {copiedCode ? 'text-emerald-400' : ''}" />
						{copiedCode ? 'Copied' : 'Copy Code'}
					</button>
				</div>
				<pre class="max-h-72 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-100"><code>{activeSnippet}</code></pre>
			</div>
		</div>
	</div>
</div>
