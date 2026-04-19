<script lang="ts">
	import { createEventDispatcher, onMount, tick } from 'svelte';
	import ApproveParticipant from './ApproveParticipant.svelte';
	import Assign from './Assign.svelte';
	import CreateOrder from './CreateOrder.svelte';
	import DeclineParticipant from './DeclineParticipant.svelte';
	import ManageContribution from './ManageContribution.svelte';
	import ProfileDetail from './ProfileDetail.svelte';
	import RemoveParticipant from './RemoveParticipant.svelte';
	import SendMail from './SendMail.svelte';
	import SendReminder from './SendReminder.svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let participant = 'speaker';
	export let buttonEl: HTMLElement;
	export let speakerData: any = null;
	export let eventId = '';
	export let eventTitle = '';

	let dropdownEl: HTMLElement;
	let positionAbove = false;

	let visibility = speakerData?.isPublic ?? true;
	let showEmailTemplate = false;
	let showRemoveParticipant = false;
	let showProfile = false;
	let showEditProfile = false;
	let showAssign = false;
	let showSendReminder = false;
	let showApproveParticipant = false;
	let showDeclineParticipant = false;
	let showManageContribution = false;
	let showCreateOrder = false;

	let items: any[];

	$: {
		visibility = speakerData?.isPublic ?? true;
	}

	// Check if participant was added via collaboration (not manually)
	$: isCollaborationAdded = speakerData?.source === 'COLLABORATION' || (speakerData?.applicationDetails?.additionalInfo?.collaborationId);

	if (participant === 'speaker') {
		items = [
			{ label: 'View/Edit Details', icon: '/eye.svg' },
			{ label: 'Assign Session', icon: '/profile.svg' },
			{ label: 'Manage Visibility', icon: '' },
			{ label: 'Send Message', icon: '/message-text.svg' },
			{ label: 'Send Reminder', icon: '/clock.svg', condition: () => speakerData?.status === 'INVITED' || speakerData?.status === 'ACCEPTED' },
			{ label: 'Resend Invitation', icon: '/send-2.svg', condition: () => speakerData?.status === 'INVITED' },
			{ label: 'Remove Speaker', icon: '/delete-icon.svg' }
		];
	} else if (participant === 'exhibitor') {
		items = [
			{ label: 'View/Edit Details', icon: '/eye.svg' },
			{ label: 'Approve Application', icon: '/clipboard-tick.svg', condition: () => speakerData?.status === 'INVITED' || speakerData?.status === 'APPLIED' },
			{ label: 'Decline Invitation', icon: '/clipboard-close.svg', condition: () => speakerData?.status === 'INVITED' || speakerData?.status === 'APPLIED' },
			{ label: 'Manage Contribution/Payment', icon: '/setting.svg', condition: () => speakerData?.status === 'APPROVED' || speakerData?.status === 'PENDING_APPROVAL' },
			{ label: 'Manage Visibility', icon: '' },
			{ label: 'Send Message', icon: '/message-text.svg' },
			{ label: 'Send Reminder', icon: '/clock.svg', condition: () => speakerData?.status === 'INVITED' || speakerData?.status === 'ACCEPTED' },
			{ label: 'Resend Invitation', icon: '/send-3.svg', condition: () => speakerData?.status === 'INVITED' },
			{ label: 'View Digital Booth', icon: '/eye-2.svg', condition: () => speakerData?.boothStatus === 'PUBLISHED' || speakerData?.boothStatus === 'SET_UP' },
			{ label: 'Remove Exhibitor', icon: '/delete-icon.svg' }
		];
	} else if (participant === 'vendor') {
		items = [
			{ label: 'View/Edit Details', icon: '/eye.svg', dynamicLabel: () => isCollaborationAdded ? 'View Details' : 'View/Edit Details' },
			{ label: 'Create Order', icon: '/box-tick.svg', condition: () => speakerData?.status === 'APPROVED' || speakerData?.status === 'CONFIRMED' },
			{ label: 'View All Orders', icon: '/document-search.svg' },
			{ label: 'Approve Application', icon: '/clipboard-tick.svg', condition: () => speakerData?.status === 'INVITED' || speakerData?.status === 'APPLIED' },
			{ label: 'Decline Invitation', icon: '/clipboard-close.svg', condition: () => speakerData?.status === 'INVITED' || speakerData?.status === 'APPLIED' },
			{ label: 'Manage Visibility', icon: '' },
			{ label: 'Send Message', icon: '/message-text.svg' },
			{ label: 'Send Reminder', icon: '/clock.svg', condition: () => speakerData?.status === 'INVITED' || speakerData?.status === 'ACCEPTED' },
			{ label: 'Remove Vendor', icon: '/delete-icon.svg' }
		];
	}

	function handleItemClick(label: string) {
		if (label.includes('Send Message')) {
			showEmailTemplate = true;
		} else if (label.startsWith('Remove')) {
			showRemoveParticipant = true;
		} else if (label.startsWith('View/Edit Details') || label.startsWith('View Details')) {
			showProfile = true;
		} else if (label.startsWith('Edit Details')) {
			showProfile = true;
		} else if (label.startsWith('Assign Session')) {
			showAssign = true;
		} else if (label.startsWith('Send Reminder')) {
			showSendReminder = true;
		} else if (label.startsWith('Resend Invitation')) {
			import('$lib/services/event.services').then(({ resendSpeakerInvitation }) => {
				if (speakerData?.id && eventId) {
					resendSpeakerInvitation(eventId, speakerData.id)
						.then(() => { alert('Invitation resent successfully'); dispatch('updated'); })
						.catch((e) => alert(e.message || 'Failed to resend invitation'));
				}
			});
		} else if (label.startsWith('Approve Application')) {
			showApproveParticipant = true;
		} else if (label.startsWith('Decline Invitation')) {
			showDeclineParticipant = true;
		} else if (label.startsWith('Manage Contribution/Payment')) {
			showManageContribution = true;
		} else if (label.startsWith('View Digital Booth')) {
			// Open booth preview in new tab
			if (speakerData?.id && eventId) {
				window.open(`/event-page/${eventId}/booth/${speakerData.id}`, '_blank');
			}
		} else if (label.startsWith('Create Order')) {
			showCreateOrder = true;
		} else if (label.startsWith('View All Orders')) {
			// For now, show the create order modal as a placeholder for viewing orders
			showCreateOrder = true;
		}
		open = false;
	}

	function updateDropdownPosition() {
		if (!dropdownEl || !buttonEl) return;
		const buttonRect = buttonEl.getBoundingClientRect();
		const dropdownHeight = dropdownEl.offsetHeight + 250;
		const spaceBelow = window.innerHeight - buttonRect.bottom;
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

	$: filteredItems = (items || []).filter((item: any) => !item.condition || item.condition());
</script>

{#if open}
	<div
		bind:this={dropdownEl}
		class="custom-scrollbar absolute right-0 z-50 flex max-h-80 w-72 flex-col overflow-hidden overflow-y-auto rounded-xl bg-white p-2 text-[15px] text-[#768387] shadow-lg transition-all"
		class:bottom-full={positionAbove}
		class:top-full={!positionAbove}
		style="margin-top: 8px; margin-bottom: 8px;"
	>
		{#each filteredItems as item}
			<button
				on:click={() => handleItemClick(item.label)}
				class="flex w-full cursor-pointer items-center justify-between p-2 hover:bg-[#EBECED]"
			>
				<span>{item.dynamicLabel ? item.dynamicLabel() : item.label}</span>
				{#if item.label === 'Manage Visibility'}
					<div
						class="flex h-5 w-8 items-center rounded-full p-1 transition-all"
						class:bg-gray-300={!visibility}
						class:bg-black={visibility}
						on:click|stopPropagation={() => {
							visibility = !visibility;
							if (speakerData?.id && eventId) {
								import('$lib/services/event.services').then(({ updateSpeakerDetails }) => {
									updateSpeakerDetails(eventId, speakerData.id, { isPublic: visibility })
										.then(() => dispatch('updated'))
										.catch(console.error);
								});
							}
						}}
					>
						<div class="h-4 w-4 transform rounded-full bg-white shadow-md transition-all" class:translate-x-2={visibility}></div>
					</div>
				{:else}
					<img src={item.icon} alt="" class="h-5 w-5" />
				{/if}
			</button>
		{/each}
	</div>
{/if}

<SendMail bind:open={showEmailTemplate} {speakerData} {eventId} {eventTitle} on:sent={() => dispatch('updated')} />
<RemoveParticipant bind:open={showRemoveParticipant} {participant} {speakerData} {eventId} on:removed={() => dispatch('updated')} />
<ProfileDetail bind:open={showProfile} {participant} {speakerData} {eventId} {eventTitle} on:save={() => dispatch('updated')} on:close={() => (showProfile = false)} />
<Assign bind:open={showAssign} {speakerData} {eventId} on:assigned={() => dispatch('updated')} />
<SendReminder bind:open={showSendReminder} {participant} {speakerData} {eventId} {eventTitle} on:sent={() => dispatch('updated')} />
<ApproveParticipant bind:open={showApproveParticipant} {participant} {speakerData} {eventId} on:approved={() => dispatch('updated')} />
<DeclineParticipant bind:open={showDeclineParticipant} {participant} {speakerData} {eventId} on:declined={() => dispatch('updated')} />
<ManageContribution bind:open={showManageContribution} {participant} {speakerData} {eventId} on:updated={() => dispatch('updated')} />
<CreateOrder bind:open={showCreateOrder} {speakerData} {eventId} on:ordered={() => dispatch('updated')} />
