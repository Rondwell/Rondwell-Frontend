<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';

	export let open: boolean = false;
	export let onClose: () => void;
	export let position = { top: 0, left: 0 };

	const dispatch = createEventDispatcher();

	const languages = [
		{ code: 'en', label: 'English', flag: '/GB.png' },
		{ code: 'es', label: 'Español', flag: '/ES.png' },
		{ code: 'fr', label: 'Français', flag: '/FR.png' },
		{ code: 'de', label: 'German', flag: '/DE.png' }
	];
	let selected = languages[0].label;

	function selectLanguage(lang: string) {
		selected = lang;
		dispatch('select', lang);
		// dispatch('close');
	}
</script>

{#if open}
	<div
		class="absolute left-114 z-50 mt-2 w-48 rounded-lg bg-[#FFFCFC] p-3"
		use:clickOutside={onClose}
		style="top: {position.top}px; left: {position.left}px;"
	>
		{#each languages as lang}
			<button
				class="flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-sm focus:outline-none {selected ===
				lang.label
					? 'rounded-sm bg-[#F1F1F1]'
					: ''}"
				on:click={() => selectLanguage(lang.label)}
			>
				<img src={lang.flag} alt={lang.label} class="" />
				<span class="text-gray-800">{lang.label}</span>
			</button>
		{/each}
	</div>
{/if}

<style>
	button:focus {
		outline: none;
	}
</style>
