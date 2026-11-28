<script lang="ts">
	let sdkType: 'event' | 'collection' = 'event';
	let targetId = '';
	let theme: 'light' | 'dark' = 'light';
	let primaryColor = '#7C3AED';
	let borderRadius = 12;
	let layout: 'grid' | 'list' | 'cards' = 'grid';
	let redirectUrl = '';
	let modalOpen = false;

	$: query = new URLSearchParams({
		theme,
		primary: primaryColor,
		radius: String(borderRadius),
		...(sdkType === 'collection' ? { layout } : {}),
		...(redirectUrl.trim() ? { redirectUrl: redirectUrl.trim() } : {}),
	}).toString();

	$: previewUrl = targetId.trim()
		? sdkType === 'event'
			? `/embed/event/${encodeURIComponent(targetId.trim())}?${query}`
			: `/embed/collection/${encodeURIComponent(targetId.trim())}?${query}`
		: '';
</script>

<div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
	<div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
		<div>
			<h3 class="text-sm font-bold text-gray-900">Live Web SDK Interactive Playground</h3>
			<p class="text-xs text-gray-500">Preview theme colors, border radius, and modal checkout live.</p>
		</div>
		<div class="flex gap-1.5">
			<button type="button" on:click={() => (sdkType = 'event')} class="rounded-lg px-3 py-1 text-xs font-semibold {sdkType === 'event' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}">Event Page SDK</button>
			<button type="button" on:click={() => (sdkType = 'collection')} class="rounded-lg px-3 py-1 text-xs font-semibold {sdkType === 'collection' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}">Collection SDK</button>
		</div>
	</div>

	<div class="mt-4 grid gap-3 sm:grid-cols-4">
		<div class="sm:col-span-2">
			<label class="text-xs font-semibold text-gray-700">{sdkType === 'event' ? 'Event ID or Slug' : 'Collection Slug or ID'}</label>
			<input bind:value={targetId} placeholder={sdkType === 'event' ? 'Enter your event ID or slug' : 'e.g. lagos-tech-week'} class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-mono" />
		</div>
		<div>
			<label class="text-xs font-semibold text-gray-700">Theme</label>
			<select bind:value={theme} class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-2 text-xs">
				<option value="light">Light</option>
				<option value="dark">Dark</option>
			</select>
		</div>
		<div>
			<label class="text-xs font-semibold text-gray-700">Primary Color</label>
			<input type="color" bind:value={primaryColor} class="mt-1 h-8 w-full cursor-pointer rounded border border-gray-300" />
		</div>
	</div>

	<div class="mt-3 grid gap-3 sm:grid-cols-3">
		<div>
			<label class="text-xs font-semibold text-gray-700">Radius ({borderRadius}px)</label>
			<input type="range" min="0" max="24" bind:value={borderRadius} class="mt-2 w-full" />
		</div>
		{#if sdkType === 'collection'}
			<div>
				<label class="text-xs font-semibold text-gray-700">Layout</label>
				<select bind:value={layout} class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs">
					<option value="grid">Grid</option>
					<option value="list">List</option>
					<option value="cards">Cards</option>
				</select>
			</div>
		{/if}
		<div class={sdkType === 'collection' ? '' : 'sm:col-span-2'}>
			<label class="text-xs font-semibold text-gray-700">Redirect URL on Success (Optional)</label>
			<!-- csp-ignore-next-line — placeholder text -->
			<input bind:value={redirectUrl} placeholder="https://yoursite.com/confirmed" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs" />
		</div>
	</div>

	<div class="mt-4 flex items-center gap-3">
		{#if previewUrl}
			<button
				type="button"
				on:click={() => (modalOpen = true)}
				class="px-4 py-2 text-xs font-semibold text-white shadow transition hover:opacity-95"
				style="background-color:{primaryColor}; border-radius:{borderRadius}px;"
			>
				{sdkType === 'event' ? 'Open Event Page SDK Modal' : 'Open Collection Widget Preview'}
			</button>
		{:else}
			<p class="text-xs text-gray-500">Enter any public Event ID/slug or Collection slug above to preview live.</p>
		{/if}
	</div>
</div>

{#if modalOpen && previewUrl}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
		<div class="relative h-[85vh] w-full max-w-2xl overflow-hidden bg-white shadow-2xl" style="border-radius:{borderRadius}px;">
			<button type="button" on:click={() => (modalOpen = false)} class="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-lg text-white">×</button>
			<iframe title="API Docs SDK Playground" src={previewUrl} class="h-full w-full border-0"></iframe>
		</div>
	</div>
{/if}
