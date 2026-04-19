<script lang="ts">
	import Icon from '@iconify/svelte';

	export let show = false;
	export let title = 'Confirm Action';
	export let message = 'Are you sure you want to proceed?';
	export let confirmLabel = 'Confirm';
	export let cancelLabel = 'Cancel';
	export let confirmColor: 'red' | 'black' = 'black';
	export let icon = 'mdi:alert-circle-outline';
	export let iconColor = 'text-gray-500';
	export let loading = false;
	export let onConfirm: () => void = () => {};
	export let onCancel: () => void = () => {};

	function handleCancel() {
		show = false;
		onCancel();
	}

	function handleConfirm() {
		onConfirm();
	}

	const confirmBtnClass: Record<string, string> = {
		red: 'bg-red-600 hover:bg-red-700 text-white',
		black: 'bg-black hover:bg-gray-800 text-white'
	};
</script>

{#if show}
<div
	class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
	on:click|self={handleCancel}
	on:keydown={(e) => e.key === 'Escape' && handleCancel()}
	role="dialog"
	aria-modal="true"
	tabindex="-1"
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" on:click|stopPropagation on:keydown|stopPropagation>
		<!-- Icon -->
		<div class="mb-4 flex justify-center">
			<div class="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
				<Icon {icon} class="h-7 w-7 {iconColor}" />
			</div>
		</div>

		<!-- Title & Message -->
		<div class="mb-6 text-center">
			<h3 class="mb-2 text-lg font-semibold text-[#171717]">{title}</h3>
			<p class="text-sm text-[#5C5C5C] leading-relaxed">{message}</p>
		</div>

		<!-- Actions -->
		<div class="flex items-center justify-center gap-3">
			<button
				on:click={handleCancel}
				disabled={loading}
				class="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-[#5C5C5C] transition hover:bg-gray-50 disabled:opacity-50"
			>
				{cancelLabel}
			</button>
			<button
				on:click={handleConfirm}
				disabled={loading}
				class="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed {confirmBtnClass[confirmColor]}"
			>
				{#if loading}
					<Icon icon="mdi:loading" class="h-4 w-4 animate-spin" />
				{/if}
				{confirmLabel}
			</button>
		</div>
	</div>
</div>
{/if}
