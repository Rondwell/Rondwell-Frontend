<!-- src/lib/components/Sidebar.svelte -->
<script lang="ts">
	let activeItem = 'Events';

	const GRAY = '#545260';
	const PURPLE = '#A667E4';

	function withColor(svg: any, from = GRAY, to = PURPLE) {
		return svg.replace(new RegExp(from, 'g'), to);
	}

	const EVENT_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
	<path d="M12.9806 9.84007C12.9806 10.7558 13.733 11.5011 14.6487 11.5011C14.6487 14.163 13.9814 14.8303 11.3195 14.8303H4.6612C1.99928 14.8303 1.33203 14.163 1.33203 11.5011V11.1746C2.24773 11.1746 3.00016 10.4221 3.00016 9.50644C3.00016 8.59075 2.24773 7.83831 1.33203 7.83831V7.51178C1.33913 4.84987 1.99928 4.18262 4.6612 4.18262H11.3124C13.9743 4.18262 14.6416 4.84987 14.6416 7.51178V8.17904C13.7259 8.17904 12.9806 8.91727 12.9806 9.84007Z" stroke="#545260" stroke-width="1.06477" stroke-linecap="round" stroke-linejoin="round"/>
	<path d="M11.0619 4.18231H4.60938L6.68922 2.10247C8.38574 0.405947 9.23755 0.405947 10.9341 2.10247L11.36 2.52838C10.9128 2.97558 10.8063 3.63573 11.0619 4.18231Z" stroke="#545260" stroke-width="1.06477" stroke-linecap="round" stroke-linejoin="round"/>
	<path d="M6.57031 4.18262L6.57031 14.8303" stroke="#545260" stroke-width="1.06477" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="3.55 3.55"/>
	</svg>`;

	const EXHIBITOR_ICON = `<svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
	<path d="M10.0759 3.70185C10.2609 3.79433 10.465 3.84247 10.6719 3.84247C10.8788 3.84247 11.0828 3.79433 11.2679 3.70185L13.7072 2.48185C13.8089 2.43102 13.922 2.40705 14.0355 2.41223C14.1491 2.4174 14.2595 2.45154 14.3562 2.5114C14.4529 2.57126 14.5326 2.65486 14.5879 2.75424C14.6431 2.85361 14.672 2.96547 14.6719 3.07918V11.5885C14.6718 11.7123 14.6373 11.8336 14.5722 11.9389C14.5071 12.0441 14.4139 12.1292 14.3032 12.1845L11.2679 13.7025C11.0828 13.795 10.8788 13.8431 10.6719 13.8431C10.465 13.8431 10.2609 13.795 10.0759 13.7025L7.26788 12.2985C7.08281 12.206 6.87876 12.1579 6.67188 12.1579C6.46499 12.1579 6.26094 12.206 6.07588 12.2985L3.63654 13.5185C3.53478 13.5694 3.42169 13.5933 3.30805 13.5881C3.1944 13.5829 3.08398 13.5487 2.98729 13.4888C2.8906 13.4288 2.81085 13.3452 2.75564 13.2457C2.70043 13.1462 2.6716 13.0343 2.67188 12.9205V4.41185C2.67194 4.28807 2.70647 4.16676 2.77158 4.0615C2.83669 3.95623 2.92982 3.87118 3.04054 3.81585L6.07588 2.29785C6.26094 2.20537 6.46499 2.15723 6.67188 2.15723C6.87876 2.15723 7.08281 2.20537 7.26788 2.29785L10.0759 3.70185Z" stroke="#545260" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
	<path d="M10.6719 3.84277V13.8428" stroke="#545260" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
	<path d="M6.67188 2.15723V12.1572" stroke="#545260" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
	</svg>`;

	const VENDOR_ICON = `<svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
	<path d="M11.6719 6.26664L5.67188 2.80664" stroke="#545260" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
	<path d="M14.6719 10.6669V5.33359C14.6716 5.09978 14.6099 4.87013 14.4929 4.6677C14.3759 4.46527 14.2077 4.29717 14.0052 4.18026L9.33854 1.51359C9.13585 1.39657 8.90592 1.33496 8.67188 1.33496C8.43783 1.33496 8.2079 1.39657 8.00521 1.51359L3.33854 4.18026C3.13605 4.29717 2.96786 4.46527 2.85085 4.6677C2.73384 4.87013 2.67211 5.09978 2.67188 5.33359V10.6669C2.67211 10.9007 2.73384 11.1304 2.85085 11.3328C2.96786 11.5353 3.13605 11.7034 3.33854 11.8203L8.00521 14.4869C8.2079 14.604 8.43783 14.6656 8.67188 14.6656C8.90592 14.6656 9.13585 14.604 9.33854 14.4869L14.0052 11.8203C14.2077 11.7034 14.3759 11.5353 14.4929 11.3328C14.6099 11.1304 14.6716 10.9007 14.6719 10.6669Z" stroke="#545260" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
	<path d="M2.85156 4.63965L8.67156 8.00632L14.4916 4.63965" stroke="#545260" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
	<path d="M8.67188 14.72V8" stroke="#545260" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
	</svg>`;

	const SPEAKER_ICON = `<svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
	<path d="M14.6719 10C14.6719 10.3536 14.5314 10.6928 14.2814 10.9428C14.0313 11.1929 13.6922 11.3333 13.3385 11.3333H5.33854L2.67188 14V3.33333C2.67188 2.97971 2.81235 2.64057 3.0624 2.39052C3.31245 2.14048 3.65159 2 4.00521 2H13.3385C13.6922 2 14.0313 2.14048 14.2814 2.39052C14.5314 2.64057 14.6719 2.97971 14.6719 3.33333V10Z" stroke="#545260" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
	<path d="M9.33984 5.33301H5.33984" stroke="#545260" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
	<path d="M12.0065 8H5.33984" stroke="#545260" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
	</svg>`;

	const menuItems = [
		{
			name: 'Events',
			icon: EVENT_ICON,
			selectedIcon: withColor(EVENT_ICON)
		},
		{
			name: 'Exhibitors',
			icon: EXHIBITOR_ICON,
			selectedIcon: withColor(EXHIBITOR_ICON)
		},
		{
			name: 'Vendors',
			icon: VENDOR_ICON,
			selectedIcon: withColor(VENDOR_ICON)
		},
		{
			name: 'Speakers',
			icon: SPEAKER_ICON,
			selectedIcon: withColor(SPEAKER_ICON)
		},
		{
			name: 'Community',
			icon: SPEAKER_ICON,
			selectedIcon: withColor(SPEAKER_ICON)
		}
	];
</script>

<aside class="hidden w-68 flex-col lg:flex">
	<div class="h-fit rounded-2xl border-2 border-gray-200 p-4">
		<!-- Logo & Title -->
		<div class="flex w-full items-center justify-start gap-2 py-6 text-xl font-bold">
			<img src="logo1.png" alt="roundwell logo" class="h-11 w-11" />
			Discover
		</div>

		<!-- Menu Items -->
		<nav class="flex-1 space-y-3">
			{#each menuItems as item}
				<button
					class={`flex w-full items-center gap-3 rounded-md px-4 py-2 transition ${
						activeItem === item.name
							? 'rounded-2xl border border-purple-700 text-purple-700'
							: 'text-gray-700 hover:bg-gray-100'
					}`}
					on:click={() => (activeItem = item.name)}
				>
					<span>{@html activeItem === item.name ? item.selectedIcon : item.icon}</span>
					{item.name}
					<!-- Badge placeholder -->
					{#if item.name === 'Events'}
						<span
							class="ml-auto rounded-md {activeItem === item.name
								? 'bg-purple-100'
								: ''} p-2 text-xs">⌘E</span
						>
					{:else}
						<span
							class="ml-auto rounded-md p-2 text-xs {activeItem === item.name
								? 'bg-purple-100'
								: ''}">⌘V</span
						>
					{/if}
				</button>
			{/each}
		</nav>
	</div>
</aside>
