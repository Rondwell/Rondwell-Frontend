<script>
	import Icon from '@iconify/svelte';
	export let open = false;

	let visibility = true;

	const actions = [
		{ label: 'View Details', icon: 'mdi:eye-outline' },
		{ label: 'Edit Details', icon: 'mdi:pencil-outline' },
		{ label: 'Assign Session', icon: 'mdi:calendar-check-outline' },
		{ label: 'Send Message', icon: 'mdi:message-text-outline' },
		{ label: 'Send Reminder', icon: 'mdi:clock-outline' },
		{ label: 'Resend Invitation', icon: 'mdi:send-outline' }
	];

	export const profileActionsItems = [
		{ label: 'View Details', icon: 'mdi:eye-outline' },
		{ label: 'Edit Details', icon: 'mdi:pencil-outline' },
		{ label: 'Approve Application', icon: 'mdi:check-circle-outline' },
		{ label: 'Decline Invitation', icon: 'mdi:close-circle-outline' },
		{ label: 'Manage Contribution/Payment', icon: 'mdi:cash-multiple' },
		{ label: 'Manage Visibility', icon: 'mdi:toggle-switch-off-outline' },
		{ label: 'Send Message', icon: 'mdi:message-text-outline' },
		{ label: 'Send Reminder', icon: 'mdi:clock-outline' },
		{ label: 'Resend Invitation', icon: 'mdi:send-outline' },
		{ label: 'View Digital Booth', icon: 'mdi:monitor' },
		{ label: 'Remove Exhibitor', icon: 'mdi:trash-can-outline', danger: true }
	];

	export const vendorActionsItems = [
		{ label: 'View Details', icon: 'mdi:eye-outline' },
		{ label: 'Edit Details', icon: 'mdi:pencil-outline' },
		{ label: 'Create Order', icon: 'mdi:cart-plus' },
		{ label: 'Request Quote', icon: 'mdi:file-document-outline' },
		{ label: 'View All Orders', icon: 'mdi:clipboard-list-outline' },
		{ label: 'Approve Application', icon: 'mdi:check-circle-outline' },
		{ label: 'Decline Invitation', icon: 'mdi:close-circle-outline' },
		{ label: 'Manage Visibility', icon: 'mdi:toggle-switch-off-outline' },
		{ label: 'Send Message', icon: 'mdi:message-text-outline' },
		{ label: 'Remove Vendor', icon: 'mdi:trash-can-outline', danger: true }
	];

	const danger = { label: 'Remove Speaker', icon: 'mdi:trash-can-outline' };
</script>

{#if open}
	<div class="w-72 space-y-4 rounded-xl bg-white p-4 text-[15px] text-gray-700 shadow-lg">
		<!-- Mapped actions -->
		{#each actions.slice(0, 3) as item}
			<div class="flex cursor-pointer items-center justify-between">
				<span>{item.label}</span>
				<Icon icon={item.icon} class="text-xl" />
			</div>
		{/each}

		<!-- Toggle row -->
		<div class="flex cursor-pointer items-center justify-between">
			<span>Manage Visibility</span>

			<div
				class="flex h-6 w-12 items-center rounded-full bg-gray-300 p-1 transition-all"
				class:bg-green-400={visibility}
				on:click={() => (visibility = !visibility)}
			>
				<div
					class="h-5 w-5 transform rounded-full bg-white shadow-md transition-all"
					class:translate-x-6={visibility}
				></div>
			</div>
		</div>

		<!-- Remaining mapped items -->
		{#each actions.slice(3) as item}
			<div class="flex cursor-pointer items-center justify-between">
				<span>{item.label}</span>
				<Icon icon={item.icon} class="text-xl" />
			</div>
		{/each}

		<!-- Danger option -->
		<div class="flex cursor-pointer items-center justify-between text-red-500">
			<span>{danger.label}</span>
			<Icon icon={danger.icon} class="text-xl" />
		</div>
	</div>
{/if}
