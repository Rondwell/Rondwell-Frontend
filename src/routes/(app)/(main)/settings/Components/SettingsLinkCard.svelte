<script lang="ts">
	/**
	 * Reusable settings "entry card". Renders a titled row that navigates to a
	 * dedicated page (e.g. /account/escrows). Mirrors the way the Wallet tab
	 * routes into KYC — the heavy list/detail logic stays on the route page,
	 * the settings tab just surfaces a discoverable entry point.
	 */
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';

	export let icon: string;
	export let title: string;
	export let description = '';
	export let href: string;
	export let iconBg = 'bg-gray-100';
	export let iconColor = 'text-gray-600';
</script>

<button
	on:click={() => goto(href)}
	class="flex w-full items-center justify-between gap-3 rounded-xl border bg-white p-4 text-left transition hover:shadow-md"
>
	<div class="flex items-center gap-3">
		<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg {iconBg} {iconColor}">
			<Icon {icon} class="text-xl" />
		</div>
		<div>
			<p class="text-sm font-semibold text-gray-900">{title}</p>
			{#if description}<p class="mt-0.5 text-xs text-gray-500">{description}</p>{/if}
		</div>
	</div>
	<Icon icon="mdi:chevron-right" class="shrink-0 text-xl text-gray-400" />
</button>
