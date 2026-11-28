<script context="module" lang="ts">
	export type SelectBadgeTone = 'purple' | 'emerald' | 'amber' | 'sky' | 'rose' | 'slate';

	export interface SelectOption<T extends string | number = string | number> {
		value: T;
		label: string;
		description?: string;
		badge?: string;
		badgeTone?: SelectBadgeTone;
		icon?: string;
		mono?: boolean;
		disabled?: boolean;
	}
</script>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Icon from '@iconify/svelte';
	import GlassPopover from './GlassPopover.svelte';

	export let options: SelectOption[] = [];
	export let value: string | number = '';
	export let placeholder = 'Select an option';
	export let variant: 'light' | 'dark' = 'light';
	export let size: 'sm' | 'md' = 'md';
	export let disabled = false;
	export let id: string | undefined = undefined;
	export let ariaLabel = '';
	export let minWidth = 180;
	export let maxWidth = 520;
	export let align: 'start' | 'end' | 'center' = 'start';
	export let matchAnchorWidth = true;
	export let triggerClass = '';

	const dispatch = createEventDispatcher<{ change: { value: string | number } }>();

	let open = false;
	let triggerEl: HTMLButtonElement | null = null;
	let highlightedIndex = -1;

	$: selectedOption = options.find((opt) => opt.value === value) ?? null;

	$: if (open) {
		const activeIdx = options.findIndex((opt) => opt.value === value && !opt.disabled);
		highlightedIndex = activeIdx >= 0 ? activeIdx : options.findIndex((opt) => !opt.disabled);
	}

	function toggleOpen() {
		if (disabled) return;
		open = !open;
	}

	function selectOption(opt: SelectOption) {
		if (opt.disabled) return;
		value = opt.value;
		open = false;
		dispatch('change', { value: opt.value });
		triggerEl?.focus?.();
	}

	function moveHighlight(step: 1 | -1) {
		if (!options.length) return;
		let idx = highlightedIndex;
		for (let i = 0; i < options.length; i++) {
			idx = (idx + step + options.length) % options.length;
			if (!options[idx]?.disabled) {
				highlightedIndex = idx;
				return;
			}
		}
	}

	function handleTriggerKeydown(event: KeyboardEvent) {
		if (disabled) return;
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			if (!open) {
				open = true;
				return;
			}
			moveHighlight(event.key === 'ArrowDown' ? 1 : -1);
		} else if (event.key === 'Enter' || event.key === ' ') {
			if (open && highlightedIndex >= 0 && options[highlightedIndex]) {
				event.preventDefault();
				selectOption(options[highlightedIndex]);
			}
		} else if (event.key === 'Home' && open) {
			event.preventDefault();
			highlightedIndex = options.findIndex((opt) => !opt.disabled);
		} else if (event.key === 'End' && open) {
			event.preventDefault();
			for (let i = options.length - 1; i >= 0; i--) {
				if (!options[i]?.disabled) {
					highlightedIndex = i;
					break;
				}
			}
		}
	}

	function badgeClasses(tone: SelectBadgeTone = 'slate', isDark = false): string {
		if (isDark) {
			switch (tone) {
				case 'purple':
					return 'bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/30';
				case 'emerald':
					return 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30';
				case 'amber':
					return 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30';
				case 'sky':
					return 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/30';
				case 'rose':
					return 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/30';
				default:
					return 'bg-slate-700/80 text-slate-200 ring-1 ring-slate-600/60';
			}
		}
		switch (tone) {
			case 'purple':
				return 'bg-[#513BE2]/10 text-[#513BE2] ring-1 ring-[#513BE2]/20';
			case 'emerald':
				return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
			case 'amber':
				return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20';
			case 'sky':
				return 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20';
			case 'rose':
				return 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20';
			default:
				return 'bg-gray-100 text-gray-700 ring-1 ring-gray-300/60';
		}
	}

	$: isDark = variant === 'dark';
	$: sizeClasses = size === 'sm' ? 'min-h-[38px] px-3 py-2 text-xs' : 'min-h-[42px] px-3.5 py-2.5 text-sm';
	$: triggerThemeClasses = isDark
		? 'border-slate-700/85 bg-slate-900/90 text-slate-100 hover:border-violet-400/50 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20'
		: 'border-gray-200/90 bg-white text-[#17161E] shadow-[0_1px_2px_rgba(23,22,30,0.04)] hover:border-[#513BE2]/45 focus:border-[#513BE2] focus:ring-2 focus:ring-[#513BE2]/15';
</script>

<button
	{id}
	type="button"
	bind:this={triggerEl}
	{disabled}
	on:click={toggleOpen}
	on:keydown={handleTriggerKeydown}
	aria-haspopup="listbox"
	aria-expanded={open}
	aria-label={ariaLabel || placeholder}
	class="group flex w-full items-center justify-between gap-2.5 rounded-xl border text-left font-medium transition-all outline-none disabled:cursor-not-allowed disabled:opacity-55 {sizeClasses} {triggerThemeClasses} {open ? (isDark ? 'border-violet-400 ring-2 ring-violet-500/25' : 'border-[#513BE2] ring-2 ring-[#513BE2]/15') : ''} {triggerClass}"
>
	<span class="flex min-w-0 flex-1 items-center gap-2">
		{#if selectedOption?.icon}
			<Icon
				icon={selectedOption.icon}
				class="h-4 w-4 shrink-0 {isDark ? 'text-violet-300' : 'text-[#513BE2]'}"
			/>
		{/if}
		{#if selectedOption?.badge}
			<span class="shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider {badgeClasses(selectedOption.badgeTone, isDark)}">
				{selectedOption.badge}
			</span>
		{/if}
		{#if selectedOption}
			<span class="truncate {selectedOption.mono ? 'font-mono text-xs' : ''}">
				{selectedOption.label}
			</span>
		{:else}
			<span class="truncate {isDark ? 'text-slate-400' : 'text-gray-400'}">
				{placeholder}
			</span>
		{/if}
	</span>

	<Icon
		icon="solar:alt-arrow-down-linear"
		class="h-4 w-4 shrink-0 transition-transform duration-200 {open ? 'rotate-180' : ''} {isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-gray-400 group-hover:text-[#17161E]'}"
	/>
</button>

<GlassPopover
	{open}
	anchor={triggerEl}
	{align}
	{minWidth}
	{maxWidth}
	{matchAnchorWidth}
	dark={isDark}
	offset={8}
	label={ariaLabel || placeholder}
	on:close={() => (open = false)}
>
	<div
		role="listbox"
		aria-label={ariaLabel || placeholder}
		class="relative z-10 overflow-y-auto p-1.5"
		style="max-height: var(--gp-max-h, 340px);"
	>
		{#each options as opt, idx}
			{@const isSelected = opt.value === value}
			{@const isHighlighted = idx === highlightedIndex}
			<button
				type="button"
				role="option"
				aria-selected={isSelected}
				disabled={opt.disabled}
				on:mouseenter={() => (highlightedIndex = idx)}
				on:click={() => selectOption(opt)}
				class="flex w-full items-start justify-between gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 {isSelected
					? isDark
						? 'bg-violet-500/20 text-white'
						: 'bg-[#513BE2]/[0.08] text-[#17161E]'
					: isHighlighted
						? isDark
							? 'bg-white/[0.06] text-slate-100'
							: 'bg-[#17161E]/[0.04] text-[#17161E]'
						: isDark
							? 'text-slate-200 hover:bg-white/[0.06]'
							: 'text-gray-700 hover:bg-[#17161E]/[0.04]'}"
			>
				<span class="flex min-w-0 flex-1 items-start gap-2.5">
					{#if opt.icon}
						<Icon
							icon={opt.icon}
							class="mt-0.5 h-4 w-4 shrink-0 {isSelected
								? isDark
									? 'text-violet-300'
									: 'text-[#513BE2]'
								: isDark
									? 'text-slate-400'
									: 'text-gray-500'}"
						/>
					{/if}
					<span class="min-w-0 flex-1">
						<span class="flex flex-wrap items-center gap-2">
							{#if opt.badge}
								<span class="shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider {badgeClasses(opt.badgeTone, isDark)}">
									{opt.badge}
								</span>
							{/if}
							<span class="truncate text-xs font-semibold sm:text-[13px] {opt.mono ? 'font-mono' : ''} {isSelected && !isDark ? 'text-[#513BE2]' : ''}">
								{opt.label}
							</span>
						</span>
						{#if opt.description}
							<span class="mt-0.5 block text-[11px] leading-snug {isDark ? 'text-slate-400' : 'text-gray-500'}">
								{opt.description}
							</span>
						{/if}
					</span>
				</span>

				{#if isSelected}
					<Icon
						icon="solar:check-circle-bold"
						class="mt-0.5 h-4 w-4 shrink-0 {isDark ? 'text-violet-400' : 'text-[#513BE2]'}"
					/>
				{/if}
			</button>
		{/each}
	</div>
</GlassPopover>
