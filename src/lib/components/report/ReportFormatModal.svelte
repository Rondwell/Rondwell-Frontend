<script lang="ts">
	/**
	 * Format picker for the event report.
	 *
	 * Two genuinely different products, so the choice is presented as cards with
	 * the trade-off spelled out rather than a bare dropdown:
	 *  • CSV — every row, built for filtering and pivoting in a spreadsheet.
	 *  • PDF — a laid-out document for sharing with sponsors and stakeholders.
	 */
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	export let open = false;
	export let busy = false;
	export let busyStep = '';
	export let errorText = '';

	const dispatch = createEventDispatcher<{ select: { format: 'csv' | 'pdf' }; close: void }>();

	let selected: 'csv' | 'pdf' = 'pdf';

	function choose(format: 'csv' | 'pdf') {
		selected = format;
	}

	function confirm() {
		if (busy) return;
		dispatch('select', { format: selected });
	}

	function close() {
		if (busy) return;
		dispatch('close');
	}

	function onKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') close();
	}
</script>

<svelte:window on:keydown={onKeydown} />

{#if open}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
		on:click={close}
		transition:fade={{ duration: 140 }}
	>
		<div
			class="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-label="Choose report format"
			on:click|stopPropagation
			transition:scale={{ duration: 160, start: 0.97 }}
		>
			<div class="flex items-start justify-between border-b border-gray-100 px-6 py-5">
				<div>
					<h2 class="text-lg font-semibold text-gray-900">Download Event Report</h2>
					<p class="mt-0.5 text-sm text-gray-500">
						Everything about this event — attendees, seating, finance and more.
					</p>
				</div>
				<button
					on:click={close}
					disabled={busy}
					aria-label="Close"
					class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 disabled:opacity-50"
				>
					<Icon icon="mdi:close" class="text-lg" />
				</button>
			</div>

			<div class="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
				<!-- PDF -->
				<button
					type="button"
					on:click={() => choose('pdf')}
					disabled={busy}
					aria-pressed={selected === 'pdf'}
					class="rounded-xl border-2 p-4 text-left transition disabled:opacity-60 {selected ===
					'pdf'
						? 'border-[#6B46C1] bg-[#F6F3FD]'
						: 'border-gray-200 bg-white hover:border-gray-300'}"
				>
					<div class="mb-2 flex items-center justify-between">
						<span
							class="flex h-9 w-9 items-center justify-center rounded-lg {selected === 'pdf'
								? 'bg-[#6B46C1] text-white'
								: 'bg-gray-100 text-gray-500'}"
						>
							<Icon icon="mdi:file-document-outline" class="text-lg" />
						</span>
						{#if selected === 'pdf'}
							<Icon icon="mdi:check-circle" class="text-lg text-[#6B46C1]" />
						{/if}
					</div>
					<p class="text-sm font-semibold text-gray-900">PDF Document</p>
					<p class="mt-1 text-xs leading-relaxed text-gray-500">
						Designed, branded and paginated. Best for sharing with sponsors, clients and
						stakeholders.
					</p>
				</button>

				<!-- CSV -->
				<button
					type="button"
					on:click={() => choose('csv')}
					disabled={busy}
					aria-pressed={selected === 'csv'}
					class="rounded-xl border-2 p-4 text-left transition disabled:opacity-60 {selected ===
					'csv'
						? 'border-[#6B46C1] bg-[#F6F3FD]'
						: 'border-gray-200 bg-white hover:border-gray-300'}"
				>
					<div class="mb-2 flex items-center justify-between">
						<span
							class="flex h-9 w-9 items-center justify-center rounded-lg {selected === 'csv'
								? 'bg-[#6B46C1] text-white'
								: 'bg-gray-100 text-gray-500'}"
						>
							<Icon icon="mdi:table-large" class="text-lg" />
						</span>
						{#if selected === 'csv'}
							<Icon icon="mdi:check-circle" class="text-lg text-[#6B46C1]" />
						{/if}
					</div>
					<p class="text-sm font-semibold text-gray-900">CSV Spreadsheet</p>
					<p class="mt-1 text-xs leading-relaxed text-gray-500">
						Every single row, no limits. Best for filtering, pivoting and importing elsewhere.
					</p>
				</button>
			</div>

			{#if selected === 'pdf'}
				<p class="mx-6 -mt-2 mb-4 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
					<Icon icon="mdi:information-outline" class="mr-1 inline text-sm" />
					Your browser's print dialog will open — choose <strong>Save as PDF</strong> as the destination.
					Enable "Background graphics" for full colour.
				</p>
			{/if}

			{#if errorText}
				<p class="mx-6 mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{errorText}</p>
			{/if}

			<div class="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
				<p class="min-h-[1rem] text-xs text-gray-500">{busy ? busyStep : ''}</p>
				<div class="flex gap-2">
					<button
						on:click={close}
						disabled={busy}
						class="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						on:click={confirm}
						disabled={busy}
						class="flex items-center gap-2 rounded-lg bg-[#1F2937] px-5 py-2 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
					>
						{#if busy}
							<Icon icon="mdi:loading" class="animate-spin text-base" />
							Preparing…
						{:else}
							<Icon icon="mdi:download" class="text-base" />
							Download {selected.toUpperCase()}
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
