<script lang="ts">
	export let open = false;
	export let participant = 'speaker';

	let items: any[];

	if (participant === 'speaker') {
		items = [
			{ label: 'All', icon: '/category.svg' },
			{ label: 'Assigned', icon: '/ticket-1.svg' },
			{ label: 'Unassigned', icon: '/ticket-2-1.svg' }
		];
	} else if (participant === 'exhibitor') {
		items = [
			{ label: 'All', icon: '/category.svg' },
			{ label: 'Set Up', icon: '/setting.svg' },
			{ label: 'Not Set Up', icon: '/setting-2.svg' },
			{ label: 'Published', icon: '/note-2.svg' },
			{ label: 'Draft', icon: '/bookmark.svg' }
		];
	} else if (participant === 'vendor') {
		items = [
			{ label: 'All', icon: '/category.svg' },
			{ label: 'With Orders', icon: '/box-tick.svg' },
			{ label: 'No Orders', icon: '/box-remove.svg' }
		];
	} else if (participant === 'cr') {
		items = [
			{ label: 'All', icon: '/category.svg' },
			{ label: 'Speaker', icon: '/speaker.svg' },
			{ label: 'Exhibitor', icon: '/shapes-1.svg' },
			{ label: 'Vendor', icon: '/vendor.svg' }
		];
	}
</script>

{#if open}
	<div
		class="absolute right-0 z-50 mt-2 w-48 rounded-xl bg-white p-2 text-[15px] text-[#768387] shadow-lg"
	>
		{#each items as item}
			<div class="flex cursor-pointer items-center justify-between p-2 hover:bg-[#EBECED]">
				<span>{item.label}</span>
				<img src={item.icon} alt="" />
			</div>
		{/each}
	</div>
{/if}
