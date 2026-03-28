<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';

	interface DropdownOption {
		label: string;
		value: string;
	}

	export let options: DropdownOption[] = [];
	export let value: any = null;
	export let placeholder = 'Select an option';
	export let disabled = false;
	export let multiple = false;
	export let themeColor: any = null;

	const dispatch = createEventDispatcher<{ change: { value: any } }>();

	let open = false;
	let buttonRef: HTMLButtonElement;
	let menuRef: HTMLDivElement;

	$: bgColor = themeColor?.cover ?? '#EBEBEC';
	$: borderColor = themeColor?.toggle ?? '#ECEDED';
	$: textColor = themeColor?.text ?? '#3C3D3F';
	$: lightTextColor = themeColor?.lightText ?? '#B3B4B4';
	$: accentColor = themeColor?.button ?? '#3E4041';

	$: selectedOption = !multiple ? options.find((opt) => opt.value === value) ?? null : null;
	$: selectedValues = multiple ? (Array.isArray(value) ? value : []) : [];
	$: displayLabel = multiple
		? selectedValues.length > 0
			? `${selectedValues.length} selected`
			: placeholder
		: selectedOption?.label ?? placeholder;

	function toggle(event: MouseEvent) {
		event.preventDefault();
		if (disabled) return;
		open = !open;
	}

	function select(option: DropdownOption) {
		if (multiple) {
			const current = [...selectedValues];
			const idx = current.indexOf(option.value);
			if (idx >= 0) current.splice(idx, 1);
			else current.push(option.value);
			value = current;
			dispatch('change', { value: current });
		} else {
			value = option.value;
			dispatch('change', { value: option.value });
			open = false;
		}
	}

	function isSelected(optValue: string): boolean {
		if (multiple) return selectedValues.includes(optValue);
		return value === optValue;
	}

	function handleClickOutside(event: MouseEvent) {
		if (open && buttonRef && menuRef && !buttonRef.contains(event.target as Node) && !menuRef.contains(event.target as Node)) {
			open = false;
		}
	}

	onMount(() => document.addEventListener('mousedown', handleClickOutside));
	onDestroy(() => document.removeEventListener('mousedown', handleClickOutside));
</script>

<div class="relative w-full">
	<button
		bind:this={buttonRef}
		on:click={toggle}
		{disabled}
		class="flex w-full items-center justify-between rounded-[9px] border px-5 py-3 text-sm transition-all focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
		style="background-color: {bgColor}; border-color: {borderColor}; color: {textColor}; --tw-ring-color: {accentColor}40;"
	>
		<span class="truncate text-left" style="color: {selectedOption || selectedValues.length > 0 ? textColor : lightTextColor};">
			{displayLabel}
		</span>
		<svg class="h-4 w-4 transition-transform duration-200 {open ? 'rotate-180' : ''}" style="color: {lightTextColor};" width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M9.64673 0.779297C10.2857 1.434 10.4282 2.38163 9.99829 3.19434V3.19336L7.02954 8.83594V8.83496C6.67257 9.5174 5.96877 9.94333 5.19751 9.94336C4.42623 9.94336 3.72344 9.51741 3.36646 8.83496L3.36548 8.83594L0.395752 3.19336L0.396729 3.19238C0.229793 2.87882 0.149658 2.54839 0.149658 2.21777C0.149783 1.69095 0.355805 1.18125 0.747314 0.779297C1.38686 0.124028 2.33407 -0.0336343 3.15161 0.375L4.72876 1.16406C4.98125 1.29031 5.2809 1.30613 5.54907 1.21094L5.66138 1.16406L7.24341 0.375C8.06077 -0.0334866 9.00722 0.124375 9.64673 0.779297Z" fill="currentColor" stroke="currentColor" stroke-width="0.3"/>
		</svg>
	</button>

	<div
		bind:this={menuRef}
		class="absolute z-10 mt-2 w-full origin-top rounded-lg border shadow-lg transition-all duration-200 ease-out {open ? 'scale-y-100 opacity-100' : 'pointer-events-none scale-y-95 opacity-0'}"
		style="background-color: {bgColor}; border-color: {borderColor}; transform-origin: top;"
	>
		<div class="px-4 py-3 text-sm" style="color: {lightTextColor};">{placeholder}</div>
		<div class="max-h-60 overflow-y-auto">
			{#each options as option (option.value)}
				{@const checked = multiple ? selectedValues.includes(option.value) : value === option.value}
				<button
					type="button"
					on:click={() => select(option)}
					class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
					style="color: {textColor};"
					on:mouseenter={(e) => e.currentTarget.style.backgroundColor = accentColor + '15'}
					on:mouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
				>
					<span class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all"
						style="border-color: {checked ? accentColor : borderColor}; background-color: {checked ? accentColor : 'transparent'};">
						{#if checked}
							<svg width="12" height="9" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
								<rect y="4.957" width="2.25" height="7.5" rx="1.125" transform="rotate(-45 0 4.957)" fill="white"/>
								<rect x="12.39" width="2.228" height="12.257" rx="1.114" transform="rotate(45 12.39 0)" fill="white"/>
							</svg>
						{/if}
					</span>
					<span class="flex-1 text-sm {checked ? 'font-medium' : ''}">{option.label}</span>
				</button>
			{/each}
		</div>
	</div>
</div>
