<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';

	export let open: boolean = false;
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

	function closeModal() {
		open = false;
	}
</script>

{#if open}
	<div
		class="absolute left-114 z-50 mt-2 w-48 rounded-lg bg-[#FFFCFC] p-3"
		use:clickOutside={closeModal}
	>
		{#each languages as lang}
			<button
				class="flex w-full items-center gap-3 px-4 py-3 text-sm focus:outline-none {selected ===
				lang.label
					? 'rounded-sm bg-[#F1F1F1]'
					: ''}"
				on:click={() => selectLanguage(lang.label)}
			>
				<img src={lang.flag} alt={lang.label} class="h-5 w-5" />
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
