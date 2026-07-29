<!--
  FilterTrigger — the glass pill that opens a filter panel.

  Shows the facet name when nothing is selected, and a summary + count badge
  once it is active, so the filter bar reads as state rather than as buttons.
-->
<script lang="ts">
	import Icon from '@iconify/svelte';

	export let label: string;
	export let icon = 'mdi:tune-variant';
	export let count = 0;
	export let summary = '';
	export let open = false;
	/** Bound by the parent and handed to GlassPopover as its anchor. */
	export let element: HTMLElement | null = null;
</script>

<button
	bind:this={element}
	type="button"
	class="filter-chip"
	class:is-active={count > 0}
	class:is-open={open}
	aria-expanded={open}
	aria-haspopup="dialog"
	on:click
>
	<Icon {icon} class="chip-icon" />
	<span class="chip-label">{count > 0 && summary ? summary : label}</span>
	{#if count > 1}
		<span class="chip-count">{count}</span>
	{/if}
	<Icon icon="mdi:chevron-down" class="chip-caret {open ? 'is-flipped' : ''}" />
</button>

<style>
	.filter-chip {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.4rem;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.8);
		background: linear-gradient(160deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.66));
		-webkit-backdrop-filter: blur(14px) saturate(160%);
		backdrop-filter: blur(14px) saturate(160%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.9),
			0 1px 2px rgba(31, 25, 53, 0.05),
			0 8px 20px -14px rgba(31, 25, 53, 0.3);
		padding: 0.45rem 0.7rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: #55525f;
		cursor: pointer;
		transition:
			transform 160ms ease,
			box-shadow 200ms ease,
			border-color 200ms ease,
			color 200ms ease;
	}

	.filter-chip:hover {
		transform: translateY(-1px);
		border-color: rgba(166, 103, 228, 0.4);
		color: #3a3648;
	}

	.filter-chip.is-open {
		border-color: rgba(166, 103, 228, 0.6);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.9),
			0 0 0 3px rgba(166, 103, 228, 0.16);
	}

	.filter-chip.is-active {
		background: linear-gradient(160deg, rgba(240, 232, 255, 0.95), rgba(255, 246, 255, 0.8));
		border-color: rgba(166, 103, 228, 0.55);
		color: #4b2f9c;
	}

	.chip-label {
		max-width: 13rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.filter-chip :global(.chip-icon) {
		height: 1rem;
		width: 1rem;
		opacity: 0.65;
	}

	.filter-chip :global(.chip-caret) {
		height: 0.85rem;
		width: 0.85rem;
		opacity: 0.55;
		transition: transform 200ms ease;
	}

	.filter-chip :global(.chip-caret.is-flipped) {
		transform: rotate(180deg);
	}

	.chip-count {
		display: grid;
		min-width: 1.15rem;
		place-items: center;
		border-radius: 999px;
		background: linear-gradient(120deg, #a667e4, #513be2);
		padding: 0 0.25rem;
		font-size: 0.65rem;
		font-weight: 700;
		color: #fff;
	}
</style>
