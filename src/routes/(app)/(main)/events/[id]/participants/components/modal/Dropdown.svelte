<script lang="ts">
	import { onMount, tick } from 'svelte';
	import SendMail from './SendMail.svelte';
	import RemoveParticipant from './RemoveParticipant.svelte';
	import ProfileDetail from './ProfileDetail.svelte';
	import Assign from './Assign.svelte';
	import SendReminder from './SendReminder.svelte';
	import ApproveParticipant from './ApproveParticipant.svelte';
	import DeclineParticipant from './DeclineParticipant.svelte';
	import ManageContribution from './ManageContribution.svelte';
	import CreateOrder from './CreateOrder.svelte';

	export let open = false;
	export let participant = 'speaker';
	export let buttonEl: HTMLElement;

	let dropdownEl: HTMLElement;
	let positionAbove = false;

	let visibility = false;
	let showEmailTemplate = false;
	let showRemoveParticipant = false;
	let showProfile = false;
	let showAssign = false;
	let showSendReminder = false;
	let showApproveParticipant = false;
	let showDeclineParticipant = false;
	let showManageContribution = false;
	let showCreateOrder = false;

	let items: any[];

	if (participant === 'speaker') {
		items = [
			{ label: 'View Details', icon: '/eye.svg' },
			{ label: 'Edit Details', icon: '/edit-icon-2.svg' },
			{ label: 'Assign Session', icon: '/profile.svg' },
			{ label: 'Manage Visibility', icon: '' },
			{ label: 'Send Message', icon: '/message-text.svg' },
			{ label: 'Send Reminder', icon: '/clock.svg' },
			{ label: 'Resend Invitation', icon: '/send-2.svg' },
			{ label: 'Remove Speaker', icon: '/delete-icon.svg' }
		];
	} else if (participant === 'exhibitor') {
		items = [
			{ label: 'View Details', icon: '/eye.svg' },
			{ label: 'Edit Details', icon: '/edit-icon-2.svg' },
			{ label: 'Approve Application', icon: '/clipboard-tick.svg' },
			{ label: 'Decline Invitation', icon: '/clipboard-close.svg' },
			{ label: 'Manage Contribution/Payment', icon: '/setting.svg' },
			{ label: 'Manage Visibility', icon: '' },
			{ label: 'Send Message', icon: '/message-text.svg' },
			{ label: 'Send Reminder', icon: '/clock.svg' },
			{ label: 'Resend Invitation', icon: '/send-3.svg' },
			{ label: 'View Digital Booth', icon: '/eye-2.svg' },
			{ label: 'Remove Exhibitor', icon: '/delete-icon.svg' }
		];
	} else if (participant === 'vendor') {
		items = [
			{ label: 'View Details', icon: '/eye.svg' },
			{ label: 'Edit Details', icon: '/edit-icon-2.svg' },
			{ label: 'Create Order', icon: '/box-tick.svg' },
			{ label: 'Request Quote', icon: '/receipt-edit.svg' },
			{ label: 'View All Orders', icon: '/document-search.svg' },
			{ label: 'Approve Application', icon: '/clipboard-tick.svg' },
			{ label: 'Decline Invitation', icon: '/clipboard-close.svg' },
			{ label: 'Manage Visibility', icon: '' },
			{ label: 'Send Reminder', icon: '/clock.svg' },
			{ label: 'Send Message', icon: '/send-3.svg' },
			{ label: 'Remove Vendor', icon: '/delete-icon.svg' }
		];
	}

	function handleItemClick(label: string) {
		if (label.includes('Send Message')) {
			showEmailTemplate = true;
		} else if (label.startsWith('Remove')) {
			showRemoveParticipant = true;
		} else if (label.startsWith('View Details')) {
			showProfile = true;
		} else if (label.startsWith('Assign Session')) {
			showAssign = true;
		} else if (label.startsWith('Send Reminder')) {
			showSendReminder = true;
		} else if (label.startsWith('Approve Application')) {
			showApproveParticipant = true;
		} else if (label.startsWith('Decline Invitation')) {
			showDeclineParticipant = true;
		} else if (label.startsWith('Manage Contribution/Payment')) {
			showManageContribution = true;
		} else if (label.startsWith('Create Order')) {
			showCreateOrder = true;
		}
		// Close the dropdown after clicking
		open = false;
	}

	function updateDropdownPosition() {
		if (!dropdownEl || !buttonEl) return;

		const buttonRect = buttonEl.getBoundingClientRect();
		const dropdownHeight = dropdownEl.offsetHeight + 250;
		const spaceBelow = window.innerHeight - buttonRect.bottom;
		// const spaceAbove = window.innerHeight - buttonRect.top;
		const spaceAbove = buttonRect.top;

		positionAbove = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;
	}

	$: if (open) {
		tick().then(updateDropdownPosition);
	}

	onMount(() => {
		window.addEventListener('resize', updateDropdownPosition);
		window.addEventListener('scroll', updateDropdownPosition, true);

		return () => {
			window.removeEventListener('resize', updateDropdownPosition);
			window.removeEventListener('scroll', updateDropdownPosition, true);
		};
	});
</script>

{#if open}
	<div
		bind:this={dropdownEl}
		class="custom-scrollbar absolute right-0 z-50 flex h-80 w-72 flex-col overflow-hidden overflow-y-auto rounded-xl bg-white p-2 text-[15px] text-[#768387] shadow-lg transition-all"
		class:bottom-full={positionAbove}
		class:top-full={!positionAbove}
		style="margin-top: 8px; margin-bottom: 8px;"
	>
		{#each items as item}
			<button
				on:click={() => handleItemClick(item.label)}
				class="flex w-full cursor-pointer items-center justify-between p-2 hover:bg-[#EBECED]"
			>
				<span>{item.label}</span>
				{#if item.label === 'Manage Visibility'}
					<div
						class="flex h-5 w-8 items-center rounded-full p-1 transition-all"
						class:bg-gray-300={!visibility}
						class:bg-black={visibility}
						on:click={() => (visibility = !visibility)}
					>
						<div
							class="h-4 w-4 transform rounded-full bg-white shadow-md transition-all"
							class:translate-x-2={visibility}
						></div>
					</div>
				{:else}
					<img src={item.icon} alt="" class="h-5 w-5" />
				{/if}
			</button>
		{/each}
	</div>
{/if}

<SendMail bind:open={showEmailTemplate} onSave={() => {}} onPreview={() => {}} />

<RemoveParticipant bind:open={showRemoveParticipant} {participant} />

<ProfileDetail bind:open={showProfile} {participant} on:close={() => (showProfile = false)} />

<Assign bind:open={showAssign} />

<SendReminder bind:open={showSendReminder} {participant} />

<ApproveParticipant bind:open={showApproveParticipant} {participant} />

<DeclineParticipant bind:open={showDeclineParticipant} {participant} />

<ManageContribution bind:open={showManageContribution} {participant} />

<CreateOrder bind:open={showCreateOrder} />
