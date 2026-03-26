<script lang="ts">
	import { createEventFaq, updateEventFaq } from '$lib/services/event.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let eventId = '';
	export let faq: any = null;

	$: isEdit = !!faq;

	let question = '';
	let answer = '';
	let category = '';
	let isPublic = false;
	let saving = false;
	let error = '';
	let showCategoryDropdown = false;

	const categories = ['General', 'Registration', 'Venue', 'Schedule', 'Payment', 'Technical'];

	$: if (open) {
		if (faq) { question = faq.question || ''; answer = faq.answer || ''; category = faq.category || ''; isPublic = faq.isPublic ?? true; }
		else { question = ''; answer = ''; category = ''; isPublic = true; }
		error = '';
	}

	async function handleSave() {
		if (!question.trim()) { error = 'Question is required'; return; }
		if (!answer.trim()) { error = 'Answer is required'; return; }
		saving = true; error = '';
		try {
			const payload = { question: question.trim(), answer: answer.trim(), category: category || undefined, isPublic };
			if (isEdit) { await updateEventFaq(eventId, faq._id || faq.id, payload); }
			else { await createEventFaq(eventId, payload); }
			dispatch('saved'); open = false;
		} catch (e: any) { error = e.message || 'Failed to save FAQ'; }
		finally { saving = false; }
	}
</script>

{#if open}
<div on:click={() => (open = false)} on:keydown={(e) => e.key === 'Escape' && (open = false)} class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-3 py-10" role="dialog" aria-modal="true" tabindex="-1">
<div class="w-full max-w-xl overflow-hidden rounded-xl bg-[#F4F5F6] shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
		<button aria-label="Close" on:click={() => (open = false)}><Icon icon="mdi:chevron-double-right" class="text-lg text-gray-500" /></button>
		<div class="flex items-center gap-2"><Icon icon="mdi:chevron-up" class="text-lg text-gray-400" /><Icon icon="mdi:chevron-down" class="text-lg text-gray-400" /></div>
	</div>

	<div class="custom-scrollbar max-h-[75vh] space-y-5 overflow-y-auto px-6 py-6">
		<div class="flex items-center gap-2">
			<div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100"><img src="/faqs-icon.svg" alt="faq" class="h-6 w-6" /></div>
			<h3 class="text-xl font-semibold">{isEdit ? 'Edit FAQ' : 'Add New FAQ'}</h3>
		</div>

		{#if error}<p class="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>{/if}

		<div>
			<label class="mb-1 flex items-center gap-1 text-sm font-medium text-gray-900">Question <Icon icon="mdi:information-outline" width="14" class="text-gray-400" /></label>
			<div class="relative">
				<textarea bind:value={question} placeholder="Text area to add question to your FAQ" rows="3" maxlength="100" class="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:outline-none"></textarea>
				<span class="absolute right-3 bottom-3 text-xs text-gray-400">{question.length}/100</span>
			</div>
			<p class="mt-1 flex items-center gap-1 text-xs text-gray-500"><Icon icon="mdi:information-outline" width="12" class="text-gray-400" /> You can describe your Reason for Mute briefly.</p>
		</div>

		<div>
			<label class="mb-1 flex items-center gap-1 text-sm font-medium text-gray-900">Answer <Icon icon="mdi:information-outline" width="14" class="text-gray-400" /></label>
			<div class="relative">
				<textarea bind:value={answer} placeholder="Text area to add answer to your FAQ question" rows="3" maxlength="500" class="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:outline-none"></textarea>
				<span class="absolute right-3 bottom-3 text-xs text-gray-400">{answer.length}/500</span>
			</div>
			<p class="mt-1 flex items-center gap-1 text-xs text-gray-500"><Icon icon="mdi:information-outline" width="12" class="text-gray-400" /> You can describe your Reason for Mute briefly.</p>
		</div>

		<!-- Category -->
		<div>
			<label class="mb-1 flex items-center gap-1 text-sm font-medium text-gray-900">Category <Icon icon="mdi:information-outline" width="14" class="text-gray-400" /></label>
			<div class="relative" use:clickOutside={() => (showCategoryDropdown = false)}>
				<button on:click={() => (showCategoryDropdown = !showCategoryDropdown)} class="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
					<span class={category ? 'text-gray-800' : 'text-gray-400'}>{category || 'Select FAQ category'}</span>
					<Icon icon="mdi:chevron-down" class="text-lg text-gray-400" />
				</button>
				{#if showCategoryDropdown}
				<div class="absolute left-0 z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
					{#each categories as cat}
					<button on:click={() => { category = cat; showCategoryDropdown = false; }} class="flex w-full items-center px-4 py-2.5 text-sm hover:bg-gray-50 {category === cat ? 'bg-gray-50 font-medium' : ''}">{cat}</button>
					{/each}
				</div>
				{/if}
			</div>
		</div>

		<!-- Make Public -->
		<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
			<span class="text-sm font-medium text-gray-900">Make Public</span>
			<button aria-label="Toggle public" on:click={() => (isPublic = !isPublic)} class="relative h-6 w-10 rounded-full transition-colors duration-300" class:bg-gray-300={!isPublic} class:bg-gray-800={isPublic}>
				<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300" class:translate-x-4={isPublic}></span>
			</button>
		</div>

		<!-- Footer -->
		<div class="flex items-center gap-3 pt-2">
			<button on:click={() => (open = false)} class="flex items-center gap-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600"><Icon icon="mdi:close-circle-outline" class="text-lg" /> Cancel</button>
			<button on:click={handleSave} disabled={saving} class="flex items-center gap-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"><Icon icon="mdi:check-circle-outline" class="text-lg" /> {saving ? 'Saving...' : isEdit ? 'Save FAQ' : 'Save FAQ'}</button>
		</div>
	</div>
</div>
</div>
{/if}
