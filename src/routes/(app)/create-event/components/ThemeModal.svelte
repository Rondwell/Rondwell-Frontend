<!--
	Theme picker sheet: colour + font.

	Style and Template were removed. Neither was ever saved or rendered — the
	style cards only changed a thumbnail on this page, and the Template row had
	no handler at all (which is why tapping it did nothing). Event page
	templates are planned separately; see docs/EVENT-PAGE-TEMPLATES-PLAN.md.

	Both choices ARE persisted now: `themeColor` (palette name) and `themeFont`
	(font id) are saved on the event and rendered on the public page.
-->
<script lang="ts">
	import { fly } from 'svelte/transition';
	import { colors, themeSwatch, DEFAULT_THEME, type Color } from '$lib/utils/colors';
	import {
		DEFAULT_FONT,
		ensureThemeFontLoaded,
		themeFonts,
		type ThemeFont
	} from '$lib/utils/themeFonts';

	export let open = false;
	export let selectedColor: Color = DEFAULT_THEME;
	export let selectedFont: ThemeFont = DEFAULT_FONT;

	let activeTab: 'color' | 'font' = 'color';

	// Font previews need the faces; the stylesheets are small and the font
	// files download only for the faces actually drawn.
	$: if (open && activeTab === 'font') themeFonts.forEach(ensureThemeFontLoaded);

	function close() {
		open = false;
	}

	function onKeydown(event: KeyboardEvent) {
		if (open && event.key === 'Escape') close();
	}

	const arrow = `<svg width="10" height="16" viewBox="0 0 14 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12.1816" y="8.05963" width="9.43215" height="1.86395" rx="0.931977" transform="rotate(-135 12.1816 8.05963)" fill="currentColor"/>
    <rect y="6.73932" width="9.53286" height="1.86395" rx="0.931977" transform="rotate(-45 0 6.73932)" fill="currentColor"/>
    <rect x="1.31836" y="11.2471" width="9.43215" height="1.86395" rx="0.931977" transform="rotate(45 1.31836 11.2471)" fill="currentColor"/>
    <rect x="13.5" y="12.5674" width="9.53286" height="1.86395" rx="0.931977" transform="rotate(135 13.5 12.5674)" fill="currentColor"/>
    </svg>`;
</script>

<svelte:window on:keydown={onKeydown} />

{#if open}
	<div
		class="bg fixed inset-x-0 bottom-0 z-50 flex w-full flex-col gap-4 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6"
		style="max-height: 78vh;"
		role="dialog"
		aria-modal="false"
		aria-label="Event theme"
		transition:fly={{ y: 300, duration: 300 }}
	>
		<!-- Header -->
		<div class="flex items-center justify-between gap-3">
			<div class="min-w-0">
				<p class="text-sm font-semibold text-gray-900">Theme</p>
				<p class="truncate text-xs text-gray-500">Pick a colour and a font for your event page.</p>
			</div>
			<button
				type="button"
				on:click={close}
				class="shrink-0 rounded-full bg-gray-900 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-gray-700"
			>
				Done
			</button>
		</div>

		<!-- Options (scrolls on small screens) -->
		<div class="custom-scrollbar min-h-0 flex-1 overflow-y-auto pb-1" style="max-height: 42vh;">
			{#if activeTab === 'color'}
				<div class="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-5 lg:grid-cols-10" role="radiogroup" aria-label="Colour">
					{#each colors as color (color.name)}
						{@const isSelected = selectedColor?.name === color.name}
						<button
							type="button"
							role="radio"
							aria-checked={isSelected}
							title={color.name}
							class="group flex flex-col items-center gap-1.5 focus:outline-none"
							on:click={() => (selectedColor = color)}
						>
							<span
								class="relative h-12 w-12 rounded-full shadow-sm ring-offset-2 transition group-hover:scale-105 group-focus-visible:ring-2 group-focus-visible:ring-gray-400 {isSelected
									? 'ring-2 ring-gray-900'
									: 'ring-1 ring-black/10'}"
								style="background: {themeSwatch(color)};"
							>
								{#if isSelected}
									<span class="absolute inset-0 flex items-center justify-center">
										<svg width="16" height="16" viewBox="0 0 12 12" fill="none" aria-hidden="true">
											<path d="M2 6l3 3 5-5" stroke={color.scheme === 'dark' ? '#FFFFFF' : '#141414'} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
										</svg>
									</span>
								{/if}
							</span>
							<span class="max-w-[72px] truncate text-[11px] capitalize {isSelected ? 'font-semibold text-gray-900' : 'text-gray-600'}">
								{color.name}
							</span>
						</button>
					{/each}
				</div>
			{:else}
				<div class="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5" role="radiogroup" aria-label="Font">
					{#each themeFonts as font (font.id)}
						{@const isSelected = selectedFont?.id === font.id}
						<button
							type="button"
							role="radio"
							aria-checked={isSelected}
							class="flex flex-col items-center gap-1 rounded-xl border bg-[#FAFCFE] px-2 py-3 transition hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 {isSelected
								? 'border-gray-900 shadow-sm'
								: 'border-gray-200'}"
							on:click={() => (selectedFont = font)}
						>
							<span class="text-2xl leading-tight text-gray-900" style="font-family: {font.display}; font-synthesis: none;">
								Ag
							</span>
							<span class="truncate text-[11px] font-medium text-gray-800">{font.label}</span>
							<span class="text-[10px] text-gray-500">{font.vibe}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Tabs -->
		<div class="grid w-full grid-cols-2 gap-3 text-gray-600" role="tablist" aria-label="Theme options">
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === 'color'}
				class="flex h-[45px] w-full items-center justify-between gap-2 rounded-md bg-[#F5EEED] px-4 py-2"
				class:selected={activeTab === 'color'}
				on:click={() => (activeTab = 'color')}
			>
				<span class="flex min-w-0 items-center gap-2">
					<span
						class="h-6 w-6 shrink-0 rounded-full ring-1 ring-black/10"
						style="background: {themeSwatch(selectedColor)};"
					></span>
					<span>Color</span>
				</span>
				<span class="flex min-w-0 items-center gap-1">
					<span class="truncate capitalize">{selectedColor?.name}</span>
					<span>{@html arrow}</span>
				</span>
			</button>

			<button
				type="button"
				role="tab"
				aria-selected={activeTab === 'font'}
				class="flex h-[45px] w-full items-center justify-between gap-2 rounded-md bg-[#F5EEED] px-4 py-2"
				class:selected={activeTab === 'font'}
				on:click={() => (activeTab = 'font')}
			>
				<span class="flex min-w-0 items-center gap-2">
					<span class="text-lg font-semibold" style="font-family: {selectedFont?.display}; font-synthesis: none;">Ag</span>
					<span>Font</span>
				</span>
				<span class="flex min-w-0 items-center gap-1">
					<span class="truncate">{selectedFont?.label}</span>
					<span>{@html arrow}</span>
				</span>
			</button>
		</div>
	</div>
{/if}

<style>
	.bg {
		background: rgba(255, 255, 255, 0.72);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-radius: 18.75px 18.75px 0px 0px;
		box-shadow: 0 -8px 30px rgba(15, 15, 20, 0.08);
	}
	button.selected {
		background-color: #e6dfde;
	}
</style>
