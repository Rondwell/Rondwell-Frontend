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

<div class="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
	<div class="flex flex-col gap-3 border-b border-gray-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="min-w-0">
			<h3 class="text-sm font-bold text-gray-900">Live Web SDK Interactive Playground</h3>
			<p class="text-xs text-gray-500">Preview theme colors, border radius, and modal checkout live.</p>
		</div>
		<div class="grid w-full grid-cols-2 gap-1.5 sm:flex sm:w-auto">
			<button
				type="button"
				on:click={() => (sdkType = 'event')}
				class="min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-semibold transition {sdkType === 'event' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}"
			>
				Event Page SDK
			</button>
			<button
				type="button"
				on:click={() => (sdkType = 'collection')}
				class="min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-semibold transition {sdkType === 'collection' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}"
			>
				Collection SDK
			</button>
		</div>
	</div>

	<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<div class="min-w-0 sm:col-span-2">
			<label for="sdk-target-id" class="text-xs font-semibold text-gray-700">{sdkType === 'event' ? 'Event ID or Slug' : 'Collection Slug or ID'}</label>
			<input id="sdk-target-id" bind:value={targetId} placeholder={sdkType === 'event' ? 'Enter your event ID or slug' : 'e.g. lagos-tech-week'} class="mt-1 min-h-[42px] w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs" />
		</div>
		<div class="min-w-0">
			<label for="sdk-theme" class="text-xs font-semibold text-gray-700">Theme</label>
			<select id="sdk-theme" bind:value={theme} class="mt-1 min-h-[42px] w-full rounded-lg border border-gray-300 px-2.5 py-2 text-xs">
				<option value="light">Light</option>
				<option value="dark">Dark</option>
			</select>
		</div>
		<div class="min-w-0">
			<label for="sdk-primary-color" class="text-xs font-semibold text-gray-700">Primary Color</label>
			<input id="sdk-primary-color" type="color" bind:value={primaryColor} class="mt-1 h-[42px] w-full cursor-pointer rounded-lg border border-gray-300 bg-white p-1" />
		</div>
	</div>

	<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
		<div class="min-w-0">
			<label for="sdk-radius" class="text-xs font-semibold text-gray-700">Radius ({borderRadius}px)</label>
			<input id="sdk-radius" type="range" min="0" max="24" bind:value={borderRadius} class="mt-2.5 w-full" />
		</div>
		{#if sdkType === 'collection'}
			<div class="min-w-0">
				<label for="sdk-layout" class="text-xs font-semibold text-gray-700">Layout</label>
				<select id="sdk-layout" bind:value={layout} class="mt-1 min-h-[42px] w-full rounded-lg border border-gray-300 px-2.5 py-2 text-xs">
					<option value="grid">Grid</option>
					<option value="list">List</option>
					<option value="cards">Cards</option>
				</select>
			</div>
		{/if}
		<div class="min-w-0 {sdkType === 'collection' ? '' : 'sm:col-span-2'}">
			<label for="sdk-redirect-url" class="text-xs font-semibold text-gray-700">Redirect URL on Success (Optional)</label>
			<!-- csp-ignore-next-line — placeholder text -->
			<input id="sdk-redirect-url" bind:value={redirectUrl} placeholder="https://yoursite.com/confirmed" class="mt-1 min-h-[42px] w-full rounded-lg border border-gray-300 px-3 py-2 text-xs" />
		</div>
	</div>

	<div class="mt-4 flex flex-wrap items-center gap-3">
		{#if previewUrl}
			<button
				type="button"
				on:click={() => (modalOpen = true)}
				class="min-h-[42px] w-full px-4 py-2 text-xs font-semibold text-white shadow transition hover:opacity-95 sm:w-auto"
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
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-2 backdrop-blur-sm sm:p-4">
		<div class="relative h-[88dvh] w-full max-w-2xl overflow-hidden bg-white shadow-2xl sm:h-[85vh]" style="border-radius:{borderRadius}px;">
			<button type="button" on:click={() => (modalOpen = false)} aria-label="Close SDK preview" class="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-lg text-white">×</button>
			<iframe title="API Docs SDK Playground" src={previewUrl} class="h-full w-full border-0"></iframe>
		</div>
	</div>
{/if}
