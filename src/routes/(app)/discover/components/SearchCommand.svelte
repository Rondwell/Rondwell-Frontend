<!--
  SearchCommand — the hero search field plus its liquid-glass results dropdown.

  Behaviour
  ---------
  - Types ahead across events, vendors, speakers and exhibitors in one request
    fan-out (the active tab's entity is listed first).
  - Debounced + abortable: one in-flight request at a time, stale responses are
    dropped so fast typing never flickers older results in.
  - The term is also pushed into the shared discover store (debounced), so the
    list behind the dropdown filters live for the active tab.
  - Full keyboard support: ⌘K / Ctrl+K to focus, ↑ ↓ to move, Enter to open the
    highlighted hit (or to search the active tab), Esc to dismiss.
  - Remembers recent searches locally.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { onDestroy, onMount } from 'svelte';
	import GlassPopover from '$lib/components/GlassPopover.svelte';
	import {
		globalSearch,
		type GlobalSearchGroup,
		type GlobalSearchResult,
		type SearchResultType
	} from '$lib/services/discover.services';
	import {
		discoverFilters,
		recentSearches,
		rememberSearch,
		clearRecentSearches,
		loadRecentSearches,
		setSearch,
		toggleCategory,
		type DiscoverTab
	} from '$lib/stores/discover.store';
	import { categoryEmoji } from '$lib/constants/eventCategories';

	export let activeTab: DiscoverTab = 'Events';
	export let placeholder = 'Search events, and collections';
	/** Top categories from the facet endpoint — shown as quick filters. */
	export let trending: Array<{ value: string; count: number }> = [];

	const TAB_TO_TYPE: Partial<Record<DiscoverTab, SearchResultType>> = {
		Events: 'event',
		Vendors: 'vendor',
		Speakers: 'speaker',
		Exhibitors: 'exhibitor'
	};

	let anchorEl: HTMLElement | null = null;
	let inputEl: HTMLInputElement | null = null;

	let term = '';
	let open = false;
	let loading = false;
	let groups: GlobalSearchGroup[] = [];
	let partial = false;
	let activeIndex = -1;

	/** Last value pushed to / pulled from the store, to avoid feedback loops. */
	let syncedSearch = '';

	let searchDebounce = 0;
	let applyDebounce = 0;
	let controller: AbortController | null = null;
	let requestId = 0;

	onMount(() => {
		loadRecentSearches();
		window.addEventListener('keydown', handleGlobalKeydown);
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') window.removeEventListener('keydown', handleGlobalKeydown);
		clearTimeout(searchDebounce);
		clearTimeout(applyDebounce);
		controller?.abort();
	});

	// Keep the input in step with external changes (URL hydrate, Clear pill, chips).
	$: if ($discoverFilters.search !== syncedSearch) {
		syncedSearch = $discoverFilters.search;
		if (term !== syncedSearch) term = syncedSearch;
	}

	function handleGlobalKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			inputEl?.focus();
			inputEl?.select();
			open = true;
		}
	}

	function orderGroups(list: GlobalSearchGroup[]): GlobalSearchGroup[] {
		const preferred = TAB_TO_TYPE[activeTab];
		if (!preferred) return list;
		return [...list].sort((a, b) => {
			if (a.type === preferred) return -1;
			if (b.type === preferred) return 1;
			return 0;
		});
	}

	async function runSearch(value: string) {
		const query = value.trim();
		if (query.length < 2) {
			groups = [];
			loading = false;
			partial = false;
			return;
		}

		controller?.abort();
		controller = new AbortController();
		const id = ++requestId;
		loading = true;

		try {
			const response = await globalSearch(query, { limit: 5, signal: controller.signal });
			if (id !== requestId) return; // a newer keystroke won
			groups = orderGroups(response.groups);
			partial = response.partial;
			activeIndex = -1;
		} catch {
			if (id === requestId) {
				groups = [];
				partial = true;
			}
		} finally {
			if (id === requestId) loading = false;
		}
	}

	function handleInput() {
		open = true;
		activeIndex = -1;

		clearTimeout(searchDebounce);
		searchDebounce = window.setTimeout(() => runSearch(term), 220);

		// Filter the list behind the dropdown too, but more lazily.
		clearTimeout(applyDebounce);
		applyDebounce = window.setTimeout(() => {
			syncedSearch = term.trim();
			setSearch(syncedSearch);
		}, 480);
	}

	function applyNow() {
		clearTimeout(applyDebounce);
		syncedSearch = term.trim();
		setSearch(syncedSearch);
		if (syncedSearch) rememberSearch(syncedSearch);
	}

	function close() {
		open = false;
		activeIndex = -1;
	}

	function clearTerm() {
		term = '';
		groups = [];
		applyNow();
		inputEl?.focus();
		open = true;
	}

	function selectResult(result: GlobalSearchResult) {
		rememberSearch(term);
		close();
		void goto(result.href);
	}

	function useRecent(value: string) {
		term = value;
		open = true;
		void runSearch(value);
		applyNow();
	}

	function useTrending(label: string) {
		toggleCategory(label);
		close();
	}

	// ── Flattened list for keyboard navigation ──
	type Row =
		| { kind: 'result'; result: GlobalSearchResult }
		| { kind: 'recent'; value: string }
		| { kind: 'apply' };

	$: showSuggestions = term.trim().length < 2;
	$: rows = ((): Row[] => {
		if (showSuggestions) {
			return $recentSearches.map((value) => ({ kind: 'recent', value }) as Row);
		}
		const resultRows: Row[] = groups.flatMap((group) =>
			group.results.map((result) => ({ kind: 'result', result }) as Row)
		);
		return [...resultRows, { kind: 'apply' }];
	})();

	function indexOfResult(result: GlobalSearchResult): number {
		return rows.findIndex((row) => row.kind === 'result' && row.result === result);
	}

	function moveActive(delta: number) {
		if (!rows.length) return;
		open = true;
		const next = activeIndex + delta;
		activeIndex = next < 0 ? rows.length - 1 : next >= rows.length ? 0 : next;
		requestAnimationFrame(() => {
			document
				.querySelector<HTMLElement>(`[data-search-row="${activeIndex}"]`)
				?.scrollIntoView({ block: 'nearest' });
		});
	}

	function commitActive() {
		const row = rows[activeIndex];
		if (!row) {
			applyNow();
			close();
			return;
		}
		if (row.kind === 'result') selectResult(row.result);
		else if (row.kind === 'recent') useRecent(row.value);
		else {
			applyNow();
			close();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				moveActive(1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				moveActive(-1);
				break;
			case 'Enter':
				event.preventDefault();
				commitActive();
				break;
			case 'Escape':
				if (open) {
					event.preventDefault();
					close();
				}
				break;
			case 'Tab':
				close();
				break;
		}
	}

	$: totalShown = groups.reduce((sum, g) => sum + g.results.length, 0);
</script>

<div class="search-field" bind:this={anchorEl} class:is-open={open}>
	<Icon icon="mdi:magnify" class="search-icon" />
	<input
		bind:this={inputEl}
		bind:value={term}
		type="search"
		role="combobox"
		aria-expanded={open}
		aria-controls="discover-search-results"
		aria-autocomplete="list"
		aria-label="Search Rondwell"
		autocomplete="off"
		spellcheck="false"
		{placeholder}
		on:input={handleInput}
		on:focus={() => (open = true)}
		on:keydown={handleKeydown}
	/>

	{#if term}
		<button type="button" class="clear-btn" on:click={clearTerm} aria-label="Clear search">
			<Icon icon="mdi:close-circle" class="h-4 w-4" />
		</button>
	{/if}

	<kbd class="kbd">⌘K</kbd>
</div>

<GlassPopover
	{open}
	anchor={anchorEl}
	matchAnchorWidth
	minWidth={320}
	maxHeight={480}
	label="Search results"
	on:close={close}
>
	<div
		id="discover-search-results"
		class="results"
		style="max-height:var(--gp-max-h)"
		role="listbox"
		aria-label="Search results"
	>
		{#if showSuggestions}
			{#if $recentSearches.length}
				<div class="section-head">
					<span>Recent searches</span>
					<button type="button" class="text-link" on:click={clearRecentSearches}>Clear</button>
				</div>
				{#each $recentSearches as value, i}
					<button
						type="button"
						class="row"
						class:is-active={activeIndex === i}
						data-search-row={i}
						role="option"
						aria-selected={activeIndex === i}
						on:click={() => useRecent(value)}
						on:mouseenter={() => (activeIndex = i)}
					>
						<span class="row-icon"><Icon icon="mdi:history" class="h-4 w-4" /></span>
						<span class="row-title">{value}</span>
						<Icon icon="mdi:arrow-top-left" class="h-3.5 w-3.5 text-gray-300" />
					</button>
				{/each}
			{/if}

			{#if trending.length}
				<div class="section-head"><span>Browse by category</span></div>
				<div class="chips">
					{#each trending as item}
						<button
							type="button"
							class="chip"
							class:is-selected={$discoverFilters.categories.some(
								(c) => c.toLowerCase() === item.value.toLowerCase()
							)}
							on:click={() => useTrending(item.value)}
						>
							<span aria-hidden="true">{categoryEmoji(item.value)}</span>
							{item.value}
							{#if item.count}<span class="chip-count">{item.count}</span>{/if}
						</button>
					{/each}
				</div>
			{/if}

			{#if !$recentSearches.length && !trending.length}
				<div class="empty">
					<Icon icon="mdi:magnify" class="h-6 w-6 text-gray-300" />
					<p class="empty-title">Search across Rondwell</p>
					<p class="empty-hint">Events, vendors, speakers and exhibitors — all at once.</p>
				</div>
			{/if}
		{:else if loading && !totalShown}
			<div class="skeletons">
				{#each [0, 1, 2, 3] as i}
					<div class="skeleton-row" style="animation-delay:{i * 60}ms">
						<div class="skeleton-avatar"></div>
						<div class="skeleton-lines">
							<div class="skeleton-line w-2/3"></div>
							<div class="skeleton-line w-1/3"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if !totalShown}
			<div class="empty">
				<Icon icon="mdi:text-search" class="h-6 w-6 text-gray-300" />
				<p class="empty-title">No matches for “{term.trim()}”</p>
				<p class="empty-hint">
					{partial
						? 'Some results could not be loaded. Try again in a moment.'
						: 'Check the spelling or try a broader term.'}
				</p>
			</div>
		{:else}
			{#each groups as group (group.type)}
				<div class="section-head">
					<span class="flex items-center gap-1.5">
						<Icon icon={group.icon} class="h-3.5 w-3.5" />
						{group.label}
					</span>
					{#if group.total > group.results.length}
						<span class="text-[11px] text-gray-400">{group.total} total</span>
					{/if}
				</div>
				{#each group.results as result (result.type + result.id)}
					{@const index = indexOfResult(result)}
					<a
						class="row"
						class:is-active={activeIndex === index}
						href={result.href}
						data-search-row={index}
						role="option"
						aria-selected={activeIndex === index}
						on:click|preventDefault={() => selectResult(result)}
						on:mouseenter={() => (activeIndex = index)}
					>
						<span class="row-thumb">
							{#if result.imageUrl}
								<img src={result.imageUrl} alt="" loading="lazy" />
							{:else}
								<span class="row-initial">{result.initial}</span>
							{/if}
						</span>
						<span class="row-body">
							<span class="row-title">{result.title}</span>
							{#if result.subtitle}<span class="row-sub">{result.subtitle}</span>{/if}
						</span>
						{#if result.badge}
							<span class="row-badge">{result.badge}</span>
						{/if}
					</a>
				{/each}
			{/each}

			{@const applyIndex = rows.length - 1}
			<button
				type="button"
				class="row apply-row"
				class:is-active={activeIndex === applyIndex}
				data-search-row={applyIndex}
				role="option"
				aria-selected={activeIndex === applyIndex}
				on:click={() => {
					applyNow();
					close();
				}}
				on:mouseenter={() => (activeIndex = applyIndex)}
			>
				<span class="row-icon"><Icon icon="mdi:filter-variant" class="h-4 w-4" /></span>
				<span class="row-title">Filter {activeTab.toLowerCase()} by “{term.trim()}”</span>
				<kbd class="kbd kbd-sm">↵</kbd>
			</button>
		{/if}

		<div class="results-foot">
			<span><kbd class="kbd kbd-sm">↑</kbd><kbd class="kbd kbd-sm">↓</kbd> navigate</span>
			<span><kbd class="kbd kbd-sm">↵</kbd> select</span>
			<span><kbd class="kbd kbd-sm">esc</kbd> close</span>
		</div>
	</div>
</GlassPopover>

<style>
	.search-field {
		position: relative;
		display: flex;
		width: 100%;
		align-items: center;
		gap: 0.5rem;
		border-radius: 14px;
		border: 1px solid rgba(255, 255, 255, 0.8);
		background: linear-gradient(160deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.72));
		-webkit-backdrop-filter: blur(18px) saturate(160%);
		backdrop-filter: blur(18px) saturate(160%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.9),
			0 1px 2px rgba(31, 25, 53, 0.06),
			0 10px 26px -14px rgba(31, 25, 53, 0.28);
		padding: 0 0.75rem;
		height: 46px;
		transition:
			box-shadow 220ms ease,
			border-color 220ms ease,
			transform 220ms ease;
	}

	.search-field:focus-within,
	.search-field.is-open {
		border-color: rgba(166, 103, 228, 0.55);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.9),
			0 0 0 3px rgba(166, 103, 228, 0.16),
			0 14px 34px -16px rgba(81, 59, 226, 0.4);
	}

	.search-field :global(.search-icon) {
		height: 1.15rem;
		width: 1.15rem;
		flex-shrink: 0;
		color: #8b8a94;
	}

	.search-field input {
		flex: 1;
		min-width: 0;
		border: 0;
		background: transparent;
		font-size: 0.875rem;
		font-weight: 500;
		color: #1f1935;
		outline: none;
	}

	.search-field input::placeholder {
		color: #9a99a4;
		font-weight: 500;
	}

	/* Hide the browser's native search clear affordance — we render our own. */
	.search-field input::-webkit-search-cancel-button {
		-webkit-appearance: none;
		appearance: none;
	}

	.clear-btn {
		display: grid;
		place-items: center;
		color: #b6b5bd;
		transition: color 160ms ease;
		cursor: pointer;
	}

	.clear-btn:hover {
		color: #6b6a75;
	}

	.kbd {
		flex-shrink: 0;
		border-radius: 6px;
		border: 1px solid rgba(31, 25, 53, 0.08);
		background: rgba(255, 255, 255, 0.7);
		padding: 0.1rem 0.35rem;
		font-size: 0.7rem;
		font-weight: 600;
		color: #8b8a94;
		line-height: 1.4;
	}

	.kbd-sm {
		font-size: 0.65rem;
		padding: 0.05rem 0.28rem;
	}

	.results {
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 0.35rem;
	}

	.section-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.6rem 0.3rem;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #9a99a4;
	}

	.text-link {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: none;
		letter-spacing: 0;
		color: #7c5cf0;
		cursor: pointer;
	}

	.row {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 0.65rem;
		border-radius: 12px;
		padding: 0.45rem 0.6rem;
		text-align: left;
		text-decoration: none;
		color: inherit;
		cursor: pointer;
		transition: background 140ms ease;
	}

	.row.is-active {
		background: linear-gradient(120deg, rgba(166, 103, 228, 0.16), rgba(81, 59, 226, 0.1));
	}

	.row-thumb {
		display: grid;
		height: 34px;
		width: 34px;
		flex-shrink: 0;
		place-items: center;
		overflow: hidden;
		border-radius: 10px;
		background: rgba(31, 25, 53, 0.06);
	}

	.row-thumb img {
		height: 100%;
		width: 100%;
		object-fit: cover;
	}

	.row-initial {
		font-size: 0.8rem;
		font-weight: 700;
		color: #8b8a94;
	}

	.row-icon {
		display: grid;
		height: 28px;
		width: 28px;
		flex-shrink: 0;
		place-items: center;
		border-radius: 9px;
		background: rgba(31, 25, 53, 0.05);
		color: #6b6a75;
	}

	.row-body {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
	}

	.row-title {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.8125rem;
		font-weight: 600;
		color: #241f35;
	}

	.row-sub {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.7rem;
		font-weight: 500;
		color: #8b8a94;
	}

	.row-badge {
		flex-shrink: 0;
		border-radius: 999px;
		background: rgba(166, 103, 228, 0.14);
		padding: 0.1rem 0.45rem;
		font-size: 0.65rem;
		font-weight: 700;
		color: #6c40c4;
	}

	.apply-row {
		margin-top: 0.2rem;
		border-top: 1px solid rgba(31, 25, 53, 0.06);
		border-radius: 0 0 12px 12px;
		padding-top: 0.55rem;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		padding: 0.15rem 0.6rem 0.5rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		border-radius: 999px;
		border: 1px solid rgba(31, 25, 53, 0.07);
		background: rgba(255, 255, 255, 0.72);
		padding: 0.25rem 0.6rem;
		font-size: 0.72rem;
		font-weight: 600;
		color: #4a4658;
		cursor: pointer;
		transition:
			background 140ms ease,
			border-color 140ms ease;
	}

	.chip:hover {
		background: #fff;
		border-color: rgba(166, 103, 228, 0.4);
	}

	.chip.is-selected {
		background: linear-gradient(120deg, rgba(166, 103, 228, 0.2), rgba(81, 59, 226, 0.14));
		border-color: rgba(166, 103, 228, 0.5);
		color: #4b2f9c;
	}

	.chip-count {
		font-size: 0.62rem;
		font-weight: 700;
		color: #9a99a4;
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 1.75rem 1rem;
		text-align: center;
	}

	.empty-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #4a4658;
	}

	.empty-hint {
		font-size: 0.72rem;
		color: #9a99a4;
	}

	.skeletons {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.5rem 0.6rem;
	}

	.skeleton-row {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		animation: pulse 1.3s ease-in-out infinite;
	}

	.skeleton-avatar {
		height: 34px;
		width: 34px;
		flex-shrink: 0;
		border-radius: 10px;
		background: rgba(31, 25, 53, 0.08);
	}

	.skeleton-lines {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.skeleton-line {
		height: 8px;
		border-radius: 999px;
		background: rgba(31, 25, 53, 0.08);
	}

	.results-foot {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		border-top: 1px solid rgba(31, 25, 53, 0.06);
		margin-top: 0.3rem;
		padding: 0.45rem 0.65rem 0.2rem;
		font-size: 0.66rem;
		font-weight: 500;
		color: #9a99a4;
	}

	.results-foot span {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.55;
		}
	}

	@media (max-width: 639px) {
		.results-foot {
			display: none;
		}
	}
</style>
