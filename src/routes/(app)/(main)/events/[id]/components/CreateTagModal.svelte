<script lang="ts">
	import { createEventTag, getEventTags } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let eventId = '';

	let existingTags: { _id: string; name: string; color: string }[] = [];
	let mode: 'select' | 'create' = 'select';
	let name = '';
	let selectedColor = '';
	let searchQuery = '';
	let loadingTags = false;
	const colors = ['#FF3CAC', '#A84DFF', '#4D7CFF', '#3DDC97', '#FFD23F', '#FF8C42', '#FF3B30'];

	$: filteredTags = existingTags.filter(
		(t) => t.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	$: if (open && eventId) { loadTags(); }

	async function loadTags() {
		loadingTags = true;
		try { existingTags = await getEventTags(eventId); } catch { existingTags = []; }
		finally { loadingTags = false; }
	}

	function selectColor(color: string) { selectedColor = color; }

	async function createTag() {
		if (!name.trim() || !selectedColor) return;
		try {
			const tag = await createEventTag(eventId, name.trim(), selectedColor);
			existingTags = [...existingTags, tag];
			dispatch('tagAssigned', { tagName: name.trim() });
			name = ''; selectedColor = ''; mode = 'select'; open = false;
		} catch (e) { console.error('Failed to create tag:', e); }
	}

	function assignTag(tag: { name: string; color: string }) {
		dispatch('tagAssigned', { tagName: tag.name });
		open = false;
	}

	function close() { open = false; mode = 'select'; name = ''; selectedColor = ''; searchQuery = ''; }
</script>
{#if open}
	<div
		on:click={close}
		on:keydown={(e) => e.key === 'Escape' && close()}
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-3"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="w-full max-w-md overflow-hidden rounded-xl bg-[#F4F5F6] shadow-xl"
			role="document"
			on:click|stopPropagation
			on:keydown|stopPropagation
		>
			<div class="relative space-y-4 px-6 py-6">
				<!-- Close Button -->
				<button
					class="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#EBECED] text-xl leading-none text-gray-700"
					on:click={close}
					aria-label="Close"
				>
					<Icon icon="mdi:close" class="text-lg font-bold" />
				</button>

				<!-- Icon -->
				<div class="flex h-14 w-14 items-center justify-center rounded-full bg-[#EFF0F0]">
					<img src="/create tag.svg" alt="tag" class="h-9 w-9" />
				</div>

				{#if mode === 'select'}
					<h2 class="text-xl font-semibold text-gray-900">Add Attendee Tag</h2>
					<p class="text-sm leading-snug text-[#8E8E90]">
						Select an existing tag or create a new one to assign to this attendee.
					</p>

					<div>
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Search tags..."
							class="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
						/>
					</div>

					<div class="max-h-40 overflow-y-auto">
						{#if loadingTags}
							<div class="flex justify-center py-4"><Icon icon="mdi:loading" class="animate-spin text-xl text-gray-400" /></div>
						{:else if filteredTags.length > 0}
							<div class="flex flex-wrap gap-2">
								{#each filteredTags as tag}
									<button
										on:click={() => assignTag(tag)}
										class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition hover:opacity-80"
										style="background-color: {tag.color}20; color: {tag.color}"
									>
										<span class="h-2.5 w-2.5 rounded-full" style="background-color: {tag.color}"></span>
										{tag.name}
									</button>
								{/each}
							</div>
						{:else}
							<p class="text-center text-sm text-gray-400">No tags found</p>
						{/if}
					</div>

					<div class="flex items-center gap-3">
						<div class="h-px flex-1 bg-gray-200"></div>
						<span class="text-xs text-gray-400">or</span>
						<div class="h-px flex-1 bg-gray-200"></div>
					</div>

					<button
						class="w-full rounded-lg bg-gray-900 py-3 text-center font-medium text-white transition hover:bg-gray-800"
						on:click={() => (mode = 'create')}
					>
						Create New Tag
					</button>
				{:else}
					<h2 class="text-xl font-semibold text-gray-900">Create Attendee Tag</h2>
					<p class="text-sm leading-snug text-[#8E8E90]">
						Event tags let collection visitors filter events by category.
					</p>

					<div>
						<label for="tag-name" class="mb-1 block text-sm font-medium text-gray-700">Name</label>
						<input
							id="tag-name"
							type="text"
							bind:value={name}
							placeholder="e.g., VIP, Speaker, Sponsor"
							class="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
						/>
					</div>

					<div>
						<label for="tag-color" class="mb-1 block text-sm font-medium text-gray-700">Color</label>
						<div class="mt-2 flex space-x-2">
							{#each colors as color}
								<button
									aria-label="Select color {color}"
									type="button"
									on:click={() => selectColor(color)}
									class="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
									style="background-color: {color}; border-color: {selectedColor === color ? '#000' : 'transparent'}"
								></button>
							{/each}
						</div>
					</div>

					<div class="flex gap-3">
						<button
							class="flex-1 rounded-lg bg-[#F0F1F1] py-3 text-center font-medium text-[#727375] transition hover:bg-gray-200"
							on:click={() => (mode = 'select')}
						>
							Back
						</button>
						<button
							class="flex-1 rounded-lg bg-gray-900 py-3 text-center font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
							disabled={!name.trim() || !selectedColor}
							on:click={createTag}
						>
							Create
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
