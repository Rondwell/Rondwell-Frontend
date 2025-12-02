<script lang="ts">
	export let open = false;
	export let participant = 'speaker';

	let items: any[];

	if (participant === 'speaker') {
		items = [
			{ label: 'All', icon: '/category.svg' },
			{ label: 'Invited', icon: '/ticket-1.svg' },
			{ label: 'Accepted', icon: '/ticket-2-1.svg' },
			{ label: 'Confirmed', icon: '/Ticket Star 2.svg' },
			{ label: 'Declined', icon: '/ticket-expired.svg' },
			{ label: 'Manual Add', icon: '/profile-add.svg' }
		];
	} else if (participant === 'exhibitor') {
		items = [
			{ label: 'All', icon: '/category.svg' },
			{ label: 'Invited', icon: '/profile-add-1.svg' },
			{ label: 'Applied', icon: '/note.svg' },
			{ label: 'Approved', icon: '/profile-tick.svg' },
			{ label: 'Contribution', icon: '/shapes.svg' },
			{ label: 'Pending', icon: '/clock.svg' },
			{ label: 'Live', icon: '/like.svg' },
			{ label: 'Declined', icon: '/profile-delete.svg' },
			{ label: 'Manual Add', icon: '/profile-add.svg' }
		];
	} else if (participant === 'vendor') {
		items = [
			{ label: 'All', icon: '/category.svg' },
			{ label: 'Invited', icon: '/profile-add-1.svg' },
			{ label: 'Applied', icon: '/note.svg' },
			{ label: 'Approved', icon: '/profile-tick.svg' },
			{ label: 'Order Pending', icon: '/box-time.svg' },
			{ label: 'Order Confirmed', icon: '/box-tick.svg' },
			{ label: 'Fulfilled', icon: '/box-tick.svg' },
			{ label: 'Declined', icon: '/profile-delete.svg' },
			{ label: 'Manual Add', icon: '/profile-add.svg' }
		];
	} else if (participant === 'cr') {
		items = [
			{ label: 'All', icon: '/category.svg' },
			{ label: 'Pending', icon: '/timer.svg' },
			{ label: 'Accepted', icon: '/tick-circle.svg' },
			{ label: 'Declined', icon: '/close-circle.svg' }
		];
	}
</script>

{#if open}
	<div class="absolute z-50 mt-2 w-56 rounded-xl bg-white p-2 text-[15px] text-[#768387] shadow-lg {participant === 'cr' ? 'right-0' : ''}">
		{#each items as item}
			<div class="flex cursor-pointer items-center justify-between p-2 hover:bg-[#EBECED]">
				<span>{item.label}</span>
				<img src={item.icon} alt="" />
			</div>
		{/each}
	</div>
{/if}
