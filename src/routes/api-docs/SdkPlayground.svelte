<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import Icon from '@iconify/svelte';
	import CustomSelect, { type SelectOption } from '$lib/components/CustomSelect.svelte';

	let sdkType: 'event' | 'collection' = 'event';
	let targetId = '';
	let theme: 'light' | 'dark' = 'light';
	let primaryColor = '#7C3AED';
	let borderRadius = 12;
	let layout: 'grid' | 'list' | 'cards' = 'grid';
	let redirectUrl = '';
	let modalOpen = false;

	const COLOR_PRESETS = ['#513BE2', '#7C3AED', '#DB3E6C', '#0EA5E9', '#10B981', '#17161E'];

	const themeOptions: SelectOption<'light' | 'dark'>[] = [
		{ value: 'light', label: 'Light Surface', description: 'Crisp white surface for light websites', icon: 'solar:sun-2-bold-duotone' },
		{ value: 'dark', label: 'Dark Surface', description: 'Obsidian surface for dark themes', icon: 'solar:moon-bold-duotone' },
	];

	const layoutOptions: SelectOption<'grid' | 'list' | 'cards'>[] = [
		{ value: 'grid', label: 'Grid', description: 'Multi-column event grid', icon: 'solar:widget-bold-duotone' },
		{ value: 'list', label: 'List', description: 'Compact chronological rows', icon: 'solar:list-bold-duotone' },
		{ value: 'cards', label: 'Compact Cards', description: 'Balanced editorial cards', icon: 'solar:slider-vertical-bold-duotone' },
	];

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

<div class="min-w-0 rounded-3xl border border-gray-200/85 bg-white p-5 shadow-[0_6px_24px_-10px_rgba(23,22,30,0.08)] sm:p-6">
	<div class="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex min-w-0 items-center gap-3">
			<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#513BE2]/10 text-[#513BE2]">
				<Icon icon="solar:window-frame-bold-duotone" class="h-5 w-5" />
			</span>
			<div class="min-w-0">
				<h3 class="text-sm font-bold text-[#17161E]">Live Web SDK Interactive Playground</h3>
				<p class="text-xs text-gray-500">Preview theme colors, border radius, and modal checkout live.</p>
			</div>
		</div>
		<div class="grid w-full grid-cols-2 gap-1 rounded-xl border border-gray-200 bg-[#F3F2F8] p-1 sm:flex sm:w-auto">
			<button
				type="button"
				on:click={() => (sdkType = 'event')}
				class="min-h-[36px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition {sdkType === 'event' ? 'bg-white text-[#17161E] shadow-sm' : 'text-gray-600 hover:text-[#17161E]'}"
			>
				Event Page SDK
			</button>
			<button
				type="button"
				on:click={() => (sdkType = 'collection')}
				class="min-h-[36px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition {sdkType === 'collection' ? 'bg-white text-[#17161E] shadow-sm' : 'text-gray-600 hover:text-[#17161E]'}"
			>
				Collection SDK
			</button>
		</div>
	</div>

	<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<div class="min-w-0 sm:col-span-2">
			<label for="sdk-target-id" class="mb-1.5 block text-xs font-semibold text-gray-700">{sdkType === 'event' ? 'Event ID or Slug' : 'Collection Slug or ID'}</label>
			<input
				id="sdk-target-id"
				bind:value={targetId}
				placeholder={sdkType === 'event' ? 'Enter your event ID or slug' : 'e.g. lagos-tech-week'}
				class="min-h-[42px] w-full rounded-xl border border-gray-200 px-3.5 py-2 font-mono text-xs text-[#17161E] outline-none focus:border-[#513BE2] focus:ring-2 focus:ring-[#513BE2]/15"
			/>
		</div>
		<div class="min-w-0">
			<label for="sdk-theme" class="mb-1.5 block text-xs font-semibold text-gray-700">Theme</label>
			<CustomSelect
				id="sdk-theme"
				options={themeOptions}
				bind:value={theme}
				ariaLabel="Select SDK theme"
			/>
		</div>
		<div class="min-w-0">
			<div class="mb-1.5 flex items-center justify-between">
				<label for="sdk-primary-color" class="text-xs font-semibold text-gray-700">Accent Color</label>
				<span class="font-mono text-[10px] text-gray-500">{primaryColor.toUpperCase()}</span>
			</div>
			<div class="flex min-h-[42px] items-center gap-1.5 rounded-xl border border-gray-200 px-2.5">
				{#each COLOR_PRESETS.slice(0, 4) as swatch}
					<button
						type="button"
						on:click={() => (primaryColor = swatch)}
						aria-label="Pick color {swatch}"
						class="h-5 w-5 rounded-full border transition {primaryColor.toLowerCase() === swatch.toLowerCase() ? 'border-[#17161E] scale-110' : 'border-white shadow-sm'}"
						style="background-color: {swatch}"
					></button>
				{/each}
				<input id="sdk-primary-color" type="color" bind:value={primaryColor} class="ml-auto h-6 w-6 cursor-pointer border-0 bg-transparent p-0" />
			</div>
		</div>
	</div>

	<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
		<div class="min-w-0">
			<div class="mb-1.5 flex items-center justify-between">
				<label for="sdk-radius" class="text-xs font-semibold text-gray-700">Radius</label>
				<span class="font-mono text-xs font-bold text-[#513BE2]">{borderRadius}px</span>
			</div>
			<input id="sdk-radius" type="range" min="0" max="24" bind:value={borderRadius} class="mt-2.5 h-2 w-full cursor-pointer accent-[#513BE2]" />
		</div>
		{#if sdkType === 'collection'}
			<div class="min-w-0">
				<label for="sdk-layout" class="mb-1.5 block text-xs font-semibold text-gray-700">Layout</label>
				<CustomSelect
					id="sdk-layout"
					options={layoutOptions}
					bind:value={layout}
					ariaLabel="Select collection layout"
				/>
			</div>
		{/if}
		<div class="min-w-0 {sdkType === 'collection' ? '' : 'sm:col-span-2'}">
			<label for="sdk-redirect-url" class="mb-1.5 block text-xs font-semibold text-gray-700">Redirect URL on Success (Optional)</label>
			<!-- csp-ignore-next-line — placeholder text -->
			<input
				id="sdk-redirect-url"
				bind:value={redirectUrl}
				placeholder="https://yoursite.com/confirmed"
				class="min-h-[42px] w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs text-[#17161E] outline-none focus:border-[#513BE2] focus:ring-2 focus:ring-[#513BE2]/15"
			/>
		</div>
	</div>

	<div class="mt-5 flex flex-wrap items-center gap-3">
		{#if previewUrl}
			<button
				type="button"
				on:click={() => (modalOpen = true)}
				class="inline-flex min-h-[42px] w-full items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition hover:opacity-95 sm:w-auto"
				style="background-color:{primaryColor}; border-radius:{borderRadius}px;"
			>
				<Icon icon="solar:play-circle-bold" class="h-4 w-4" />
				{sdkType === 'event' ? 'Open Event Page SDK Modal' : 'Open Collection Widget Preview'}
			</button>
		{:else}
			<p class="text-xs text-gray-500">Enter any public Event ID/slug or Collection slug above to preview live.</p>
		{/if}
	</div>
</div>

{#if modalOpen && previewUrl}
	<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2 backdrop-blur-sm sm:px-4"
		role="dialog"
		aria-modal="true"
		aria-label="Web SDK interactive preview"
		tabindex="-1"
		on:click={() => (modalOpen = false)}
		on:keydown={(e) => e.key === 'Escape' && (modalOpen = false)}
		transition:fade={{ duration: 140 }}
	>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="relative h-[88dvh] w-full max-w-2xl overflow-hidden border border-gray-100 bg-white shadow-2xl sm:h-[85vh]"
			style="border-radius:{borderRadius}px;"
			on:click|stopPropagation
			transition:scale={{ duration: 160, start: 0.97 }}
		>
			<button type="button" on:click={() => (modalOpen = false)} aria-label="Close SDK preview" class="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/85 text-lg text-white hover:bg-slate-900">×</button>
			<iframe title="API Docs SDK Playground" src={previewUrl} class="h-full w-full border-0"></iframe>
		</div>
	</div>
{/if}
