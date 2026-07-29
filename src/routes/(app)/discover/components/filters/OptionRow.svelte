<!--
  OptionRow — one selectable row inside a filter panel.
  Multi-select semantics (checkbox), with an optional leading emoji or icon,
  a hint line and a live result count.
-->
<script lang="ts">
	import Icon from '@iconify/svelte';

	export let label: string;
	export let selected = false;
	export let count: number | null = null;
	export let emoji = '';
	export let icon = '';
	export let hint = '';
	export let muted = false;
</script>

<button
	type="button"
	class="option"
	class:is-selected={selected}
	class:is-muted={muted && !selected}
	data-option
	role="checkbox"
	aria-checked={selected}
	on:click
>
	<span class="box" aria-hidden="true">
		{#if selected}
			<Icon icon="mdi:check-bold" class="h-3 w-3" />
		{/if}
	</span>

	{#if emoji}
		<span class="lead" aria-hidden="true">{emoji}</span>
	{:else if icon}
		<span class="lead-icon" aria-hidden="true"><Icon {icon} class="h-4 w-4" /></span>
	{/if}

	<span class="body">
		<span class="label">{label}</span>
		{#if hint}<span class="hint">{hint}</span>{/if}
	</span>

	{#if count !== null}
		<span class="count">{count}</span>
	{/if}
</button>

<style>
	.option {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 0.55rem;
		border-radius: 11px;
		padding: 0.42rem 0.55rem;
		text-align: left;
		cursor: pointer;
		transition: background 140ms ease;
	}

	.option:hover,
	.option:focus-visible {
		background: rgba(31, 25, 53, 0.045);
		outline: none;
	}

	.option:focus-visible {
		box-shadow: inset 0 0 0 2px rgba(166, 103, 228, 0.45);
	}

	.option.is-selected {
		background: linear-gradient(120deg, rgba(166, 103, 228, 0.16), rgba(81, 59, 226, 0.09));
	}

	.option.is-muted .label,
	.option.is-muted .count {
		color: #b0aeb9;
	}

	.box {
		display: grid;
		height: 17px;
		width: 17px;
		flex-shrink: 0;
		place-items: center;
		border-radius: 5px;
		border: 1.5px solid rgba(31, 25, 53, 0.18);
		background: rgba(255, 255, 255, 0.8);
		color: #fff;
		transition:
			background 150ms ease,
			border-color 150ms ease;
	}

	.option.is-selected .box {
		border-color: transparent;
		background: linear-gradient(120deg, #a667e4, #513be2);
	}

	.lead {
		flex-shrink: 0;
		font-size: 0.95rem;
		line-height: 1;
	}

	.lead-icon {
		display: grid;
		height: 26px;
		width: 26px;
		flex-shrink: 0;
		place-items: center;
		border-radius: 8px;
		background: rgba(31, 25, 53, 0.05);
		color: #55525f;
	}

	.body {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
	}

	.label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.8125rem;
		font-weight: 600;
		color: #35313f;
	}

	.hint {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.68rem;
		font-weight: 500;
		color: #9a99a4;
	}

	.count {
		flex-shrink: 0;
		font-size: 0.68rem;
		font-weight: 700;
		color: #9a99a4;
		font-variant-numeric: tabular-nums;
	}
</style>
