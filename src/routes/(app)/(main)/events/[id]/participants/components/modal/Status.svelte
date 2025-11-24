<script>
	import Icon from '@iconify/svelte';
	export let open = false;

	const items = [
		{ label: 'All', icon: 'mdi:view-grid-outline' },
		{ label: 'Invited', icon: 'mdi:ticket-confirmation-outline' },
		{ label: 'Accepted', icon: 'mdi:check-decagram' },
		{ label: 'Confirmed', icon: 'mdi:account-check' },
		{ label: 'Declined', icon: 'mdi:account-cancel' },
		{ label: 'Manual Add', icon: 'mdi:account-plus' }
	];

	export const invitationStatusItems = [
		{ label: 'All', icon: 'mdi:view-grid-outline' },
		{ label: 'Invited', icon: 'mdi:account-plus-outline' },
		{ label: 'Applied', icon: 'mdi:file-document-outline' },
		{ label: 'Approved', icon: 'mdi:check-decagram' },
		{ label: 'Contribution', icon: 'mdi:coffee-outline' },
		{ label: 'Pending', icon: 'mdi:clock-outline' },
		{ label: 'Live', icon: 'mdi:video-wireless-outline' },
		{ label: 'Declined', icon: 'mdi:account-cancel-outline' },
		{ label: 'Manual Add', icon: 'mdi:account-plus' }
	];

	export const invitationStatusItems1 = [
		{ label: 'All', icon: 'mdi:view-grid-outline' },
		{ label: 'Invited', icon: 'mdi:account-plus-outline' },
		{ label: 'Applied', icon: 'mdi:file-document-outline' },
		{ label: 'Approved', icon: 'mdi:check-decagram' },
		{ label: 'Order Pending', icon: 'mdi:clock-outline' },
		{ label: 'Order Confirmed', icon: 'mdi:checkbox-marked-circle-outline' },
		{ label: 'Fulfilled', icon: 'mdi:check-all' },
		{ label: 'Declined', icon: 'mdi:account-cancel-outline' },
		{ label: 'Manual Add', icon: 'mdi:account-plus' }
	];
</script>

{#if open}
	<div
		class="absolute z-50 mt-2 w-56 space-y-3 rounded-xl bg-white p-4 text-[15px] text-gray-700 shadow-lg"
	>
		{#each items as item}
			<div class="flex cursor-pointer items-center justify-between">
				<span>{item.label}</span>
				<Icon icon={item.icon} class="text-xl" />
			</div>
		{/each}
	</div>
{/if}
