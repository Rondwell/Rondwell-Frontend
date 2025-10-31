<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { colors, type Color } from '$lib/utils/colors';

	export let open = false;

	export let selectedStyle = 'Minimal';
	export let selectedFont = 'Default';
	export let selectedColor = colors[0];

	let activeTab = 'style'; // 'color', 'style', 'font', 'template'
	const styles = ['Minimal', 'Quantum', 'Warp', 'Emoji', 'Confetti', 'Pattern', 'Seasonal'];
	// const colors = ['Light Rose', 'orange', 'amber', 'red', 'green', 'blue', 'purple', 'pink'];
	const fonts = [
		'Default',
		'Musio',
		'Factoria',
		'Ivy Pesto',
		'Ivy Mode',
		'Alverata',
		'Roc Grotesk',
		'Benguiat',
		'Pearl',
		'Geist Mono',
		'New Spirit'
	];

	function selectStyle(style: string) {
		selectedStyle = style;
	}

	function selectColor(color: any) {
		selectedColor = color;
	}
	function selectFont(font: string) {
		selectedFont = font;
	}

	let arrow = `<svg width="10" height="16" viewBox="0 0 14 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12.1816" y="8.05963" width="9.43215" height="1.86395" rx="0.931977" transform="rotate(-135 12.1816 8.05963)" fill="currentColor"/>
    <rect y="6.73932" width="9.53286" height="1.86395" rx="0.931977" transform="rotate(-45 0 6.73932)" fill="currentColor"/>
    <rect x="1.31836" y="11.2471" width="9.43215" height="1.86395" rx="0.931977" transform="rotate(45 1.31836 11.2471)" fill="currentColor"/>
    <rect x="13.5" y="12.5674" width="9.53286" height="1.86395" rx="0.931977" transform="rotate(135 13.5 12.5674)" fill="currentColor"/>
    </svg>`;
</script>

{#if open}
	<!-- Main Modal -->
	<div
		class="bg fixed inset-x-0 bottom-0 z-50 flex h-full min-h-[236.25px] w-full gap-4 p-6 lg:h-auto"
		style="max-height: 70vh; overflow-y: auto;"
		transition:fly={{ y: 300, duration: 300 }}
	>
		<div
			class="relative flex h-full w-full flex-col items-center justify-between gap-4 overflow-y-auto text-gray-500"
		>
			<div class="flex h-full w-full items-center justify-center">
				<!-- Style (always open view) -->
				{#if activeTab === 'style'}
					<div class="mt-4 flex flex-wrap items-center gap-4 overflow-x-auto pb-2">
						{#each styles as style, i}
							<button
								class="relative flex w-24 cursor-pointer flex-col items-center rounded-xl"
								on:click={() => selectStyle(style)}
							>
								<img
									src={`/${style}.svg`}
									alt={style}
									class="mb-1 h-[72px] w-full rounded-lg {selectedStyle === style
										? 'border-2 border-black'
										: ''}"
								/>
								<span class="text-xs text-gray-700">{style}</span>
								{#if i === 6}
									<span class="absolute bottom-4 rounded bg-orange-500 px-1 text-xs text-white"
										>NEW</span
									>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
				<!-- Color Modal -->
				{#if activeTab === 'color'}
					<div class="mt-2 flex space-x-3">
						{#each colors as color}
							<button
								aria-label="color"
								class="h-12 w-12 cursor-pointer rounded-full border-2"
								style="background-color: {color.bg};"
								class:border-black={selectedColor === color}
								on:click={() => selectColor(color)}
							></button>
						{/each}
					</div>
				{/if}

				<!-- Font Modal -->
				{#if activeTab === 'font'}
					<div class="mt-4 grid grid-cols-3 gap-4 rounded-md bg-[#FAFCFE] p-4 md:grid-cols-4">
						{#each fonts as font}
							<button
								class="cursor-pointer rounded-lg border p-3 text-center hover:border-black"
								class:border-black={selectedFont === font}
								on:click={() => selectFont(font)}
							>
								<div class="text-xl font-semibold">Ag</div>
								<p class="mt-1 text-sm">{font}</p>
							</button>
						{/each}
					</div>
				{/if}
			</div>
			<!-- Toolbar -->
			<div
				class="flex h-full min-h-[50px] w-full flex-col items-center justify-center gap-4 space-x-4 md:flex-row"
			>
				<button
					class="flex h-[45px] w-full max-w-[315px] items-center justify-between gap-2 rounded-md bg-[#F5EEED] px-4 py-2"
					class:selected={activeTab === 'color'}
					on:click={() => (activeTab = 'color')}
				>
					<div class="flex items-center gap-1">
						<span style="background-color: {selectedColor.bg}" class="h-6 w-6 rounded-full"></span>
						<p>Color</p>
					</div>
					<div class="flex items-center gap-1">
						<p>{selectedColor.name}</p>
						<span>{@html arrow}</span>
					</div>
				</button>

				<button
					class="flex h-[45px] w-full max-w-[315px] items-center justify-between gap-2 rounded-md bg-[#F5EEED] px-4 py-2"
					class:selected={activeTab === 'style'}
					on:click={() => (activeTab = 'style')}
				>
					<div class="flex items-center gap-1">
						<span class="h-6 w-6 rounded-full bg-[#E8E2DC]"></span>
						<p>Style</p>
					</div>
					<div class="flex items-center gap-1">
						<p>{selectedStyle === 'Minimal' ? 'Default' : selectedStyle}</p>
						<span>{@html arrow}</span>
					</div>
				</button>

				<button
					class="flex h-[45px] w-full max-w-[315px] items-center justify-between gap-2 rounded-md bg-[#F5EEED] px-4 py-2"
					class:selected={activeTab === 'font'}
					on:click={() => (activeTab = 'font')}
				>
					<div class="flex items-center gap-1">
						<span class="text-lg font-semibold" style="font-family: {selectedFont};">Ag</span>
						<p>Font</p>
					</div>

					<div class="flex items-center gap-1">
						<p>{selectedFont}</p>
						<span>{@html arrow}</span>
					</div>
				</button>

				<button
					class="flex h-[45px] w-full max-w-[315px] items-center justify-between gap-2 rounded-md bg-[#F5EEED] px-4 py-2"
				>
					<div class="flex items-center gap-1">
						<svg
							width="22"
							height="22"
							viewBox="0 0 22 22"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M10.5 0.75C15.8848 0.75 20.25 5.11522 20.25 10.5V11.25C20.25 16.6348 15.8848 21 10.5 21V0.75Z"
								fill="#D1CCC5"
							/>
							<circle cx="10.875" cy="10.875" r="9.75" stroke="#D1CCC5" stroke-width="2.25" />
						</svg>

						<p>Template</p>
					</div>
					<div class="flex items-center gap-1">
						<p>Default</p>
						<span>{@html arrow}</span>
					</div>
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.bg {
		background: rgba(255, 255, 255, 0.5);
		backdrop-filter: blur(20px);
		border-radius: 18.75px 18.75px 0px 0px;
	}

	button.selected {
		background-color: #e6dfde;
	}

	/* For color palette */
	:root {
		--tw-color-red: #ef4444;
		--tw-color-orange: #f97316;
		--tw-color-amber: #f59e0b;
		--tw-color-yellow: #eab308;
		--tw-color-green: #22c55e;
		--tw-color-blue: #3b82f6;
		--tw-color-purple: #8b5cf6;
		--tw-color-pink: #ec4899;
	}
</style>
