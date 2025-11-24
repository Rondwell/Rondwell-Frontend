<script>
	import Icon from '@iconify/svelte';
	export let open = false;

	const items = [
		{ label: 'All', icon: 'mdi:view-grid-outline' },
		{ label: 'Assigned', icon: 'mdi:account-badge' },
		{ label: 'Unassigned', icon: 'mdi:account-badge-outline' }
	];

	export const setupStatusItems = [
		{ label: 'All', icon: 'mdi:view-grid-outline' },
		{ label: 'Set Up', icon: 'mdi:check-circle-outline' },
		{ label: 'Not Set Up', icon: 'mdi:cog-outline' },
		{ label: 'Published', icon: 'mdi:checkbox-multiple-marked-outline' },
		{ label: 'Draft', icon: 'mdi:file-document-edit-outline' }
	];

	export const orderStatusItems = [
		{ label: 'All', icon: 'mdi:view-grid-outline' },
		{ label: 'With Orders', icon: 'mdi:package-variant-closed' },
		{ label: 'No Orders', icon: 'mdi:package-variant' }
	];
</script>

{#if open}
	<div
		class="absolute right-0 z-50 mt-2 w-48 space-y-3 rounded-xl bg-white p-4 text-[15px] text-gray-700 shadow-lg"
	>
		{#each items as item}
			<div class="flex cursor-pointer items-center justify-between">
				<span>{item.label}</span>
				<Icon icon={item.icon} class="text-xl" />
			</div>
		{/each}
	</div>
{/if}
