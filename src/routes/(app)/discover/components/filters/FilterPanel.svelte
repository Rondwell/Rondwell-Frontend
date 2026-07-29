<!--
  FilterPanel — shared chrome for every filter dropdown: title row with a reset
  affordance, optional search box, optional segmented tabs, a scrollable option
  area and a footer showing how many results the current selection yields.

  Slots: tabs · default (options) · foot (extra footer content)
-->
<script lang="ts">
	import Icon from '@iconify/svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import { listNav } from '$lib/utils/portal';

	export let title: string;
	export let selectedCount = 0;
	export let searchable = false;
	export let searchPlaceholder = 'Search';
	export let query = '';
	export let maxHeight = 420;
	export let resultLabel = '';
	export let loading = false;
	/** Focus the search input when the panel opens. */
	export let autofocus = true;

	const dispatch = createEventDispatcher<{ reset: null; done: null }>();

	let searchInput: HTMLInputElement | null = null;

	onMount(() => {
		if (searchable && autofocus) {
			// Delay a frame so the popover has been positioned first — focusing
			// earlier makes mobile browsers scroll the page.
			requestAnimationFrame(() => searchInput?.focus());
		}
	});
</script>

<div class="panel" style="max-height:{maxHeight}px">
	<div class="panel-head">
		<span class="panel-title">{title}</span>
		{#if selectedCount > 0}
			<button type="button" class="reset" on:click={() => dispatch('reset', null)}>
				Reset<span class="reset-count">{selectedCount}</span>
			</button>
		{/if}
	</div>

	{#if searchable}
		<div class="panel-search">
			<Icon icon="mdi:magnify" class="panel-search-icon" />
			<input
				bind:this={searchInput}
				bind:value={query}
				type="text"
				placeholder={searchPlaceholder}
				autocomplete="off"
				spellcheck="false"
				aria-label={searchPlaceholder}
			/>
			{#if query}
				<button type="button" class="panel-search-clear" on:click={() => (query = '')} aria-label="Clear">
					<Icon icon="mdi:close-circle" class="h-3.5 w-3.5" />
				</button>
			{/if}
		</div>
	{/if}

	<slot name="tabs" />

	<div class="panel-body" use:listNav>
		{#if loading}
			<div class="panel-loading">
				{#each [0, 1, 2, 3, 4] as i}
					<div class="loading-row" style="animation-delay:{i * 70}ms"></div>
				{/each}
			</div>
		{:else}
			<slot />
		{/if}
	</div>

	<div class="panel-foot">
		<span class="foot-label">
			{#if resultLabel}{resultLabel}{:else}&nbsp;{/if}
		</span>
		<slot name="foot">
			<button type="button" class="done" on:click={() => dispatch('done', null)}>Done</button>
		</slot>
	</div>
</div>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.panel-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.7rem 0.85rem 0.45rem;
	}

	.panel-title {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: #9a99a4;
	}

	.reset {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.72rem;
		font-weight: 600;
		color: #7c5cf0;
		cursor: pointer;
	}

	.reset-count {
		display: grid;
		min-width: 1rem;
		place-items: center;
		border-radius: 999px;
		background: rgba(124, 92, 240, 0.14);
		padding: 0 0.22rem;
		font-size: 0.62rem;
		font-weight: 700;
	}

	.panel-search {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin: 0 0.55rem 0.35rem;
		border-radius: 11px;
		border: 1px solid rgba(31, 25, 53, 0.07);
		background: rgba(255, 255, 255, 0.72);
		padding: 0 0.6rem;
		height: 36px;
		transition:
			border-color 180ms ease,
			box-shadow 180ms ease;
	}

	.panel-search:focus-within {
		border-color: rgba(166, 103, 228, 0.5);
		box-shadow: 0 0 0 3px rgba(166, 103, 228, 0.13);
	}

	.panel-search :global(.panel-search-icon) {
		height: 0.95rem;
		width: 0.95rem;
		flex-shrink: 0;
		color: #a3a2ac;
	}

	.panel-search input {
		flex: 1;
		min-width: 0;
		border: 0;
		background: transparent;
		font-size: 0.8rem;
		font-weight: 500;
		color: #241f35;
		outline: none;
	}

	.panel-search input::placeholder {
		color: #a3a2ac;
	}

	.panel-search-clear {
		display: grid;
		place-items: center;
		color: #b6b5bd;
		cursor: pointer;
	}

	.panel-body {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 0.15rem 0.35rem 0.35rem;
		scrollbar-width: thin;
	}

	.panel-body::-webkit-scrollbar {
		width: 6px;
	}

	.panel-body::-webkit-scrollbar-thumb {
		border-radius: 999px;
		background: rgba(31, 25, 53, 0.14);
	}

	.panel-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		border-top: 1px solid rgba(31, 25, 53, 0.06);
		padding: 0.5rem 0.7rem 0.55rem;
	}

	.foot-label {
		font-size: 0.7rem;
		font-weight: 600;
		color: #9a99a4;
	}

	.done {
		border-radius: 10px;
		background: linear-gradient(120deg, #a667e4, #513be2);
		padding: 0.35rem 0.85rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: #fff;
		cursor: pointer;
		box-shadow: 0 6px 16px -8px rgba(81, 59, 226, 0.7);
		transition: transform 150ms ease;
	}

	.done:hover {
		transform: translateY(-1px);
	}

	.panel-loading {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 0.4rem 0.35rem;
	}

	.loading-row {
		height: 34px;
		border-radius: 11px;
		background: rgba(31, 25, 53, 0.06);
		animation: shimmer 1.3s ease-in-out infinite;
	}

	@keyframes shimmer {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
