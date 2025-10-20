<!-- src/lib/components/Header.svelte -->
<script lang="ts">
	import { tick, onDestroy, onMount } from 'svelte';
	import CategoryModal from './modal/CategoryModal.svelte';
	import EventTypeModal from './modal/EventTypeModel.svelte';
	import LanguageModal from './modal/LanguageModal.svelte';
	import LocationModal from './modal/LocationModal.svelte';

	let searchQuery = '';
	let activeItem = 'Events';
	let activeModal: string | null;

	function scrollToId(id: string, options?: ScrollIntoViewOptions) {
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({
				behavior: options?.behavior ?? 'smooth',
				block: options?.block ?? 'start'
			});
		}
	}

	let modalPosition = { top: 0, left: 0 };

	let lastWindowScrollY = 0;

	let scrollListener: (() => void) | null = null;
	let containerScrollListener: (() => void) | null = null;

	let lastContainerScrollX = 0;

	async function handleFilterClick(filter: string, event: MouseEvent) {
		let isMobile = window.innerWidth <= 768;
		const target = event.currentTarget as HTMLElement;
		const container = target.offsetParent as HTMLElement;

		// Clean up if same modal is clicked again
		if (activeModal === filter) {
			activeModal = null;
			removeScrollListeners();
			return;
		}

		activeModal = filter;
		await tick();

		if (activeModal === 'Category') {
			scrollToId('Category');
			return;
		}

		const updateModalPosition = () => {
			const targetRect = target.getBoundingClientRect();
			const containerRect = container.getBoundingClientRect();

			const relativeTop = targetRect.bottom - containerRect.top + container.scrollTop;
			const relativeLeft = targetRect.left - containerRect.left + container.scrollLeft;

			modalPosition = {
				top: relativeTop,
				left: relativeLeft
			};
		};

		updateModalPosition();

		if (isMobile) {
			target.scrollIntoView({
				inline: 'start',
				behavior: 'smooth',
				block: 'nearest'
			});
		}

		const parent = target.parentElement;
		if (parent) {
			const parentRect = parent.getBoundingClientRect();
			const targetRect = target.getBoundingClientRect();

			const isPartiallyOutOfView =
				targetRect.left < parentRect.left || targetRect.right > parentRect.right;

			if (isPartiallyOutOfView) {
				target.scrollIntoView({
					inline: 'start',
					block: 'nearest',
					behavior: 'smooth'
				});
			}
		}

		// Clean up previous listeners
		removeScrollListeners();

		const windowScrollThreshold = 30;

		// Set up window scroll listener
		lastWindowScrollY = window.scrollY;
		scrollListener = () => {
			const currentY = window.scrollY;
			if (Math.abs(currentY - lastWindowScrollY) > windowScrollThreshold) {
				onClose();
			}
			lastWindowScrollY = currentY;
			updateModalPosition();
		};
		window.addEventListener('scroll', scrollListener, true);

		// Set up horizontal scroll listener for custom scrollbar
		const scrollContainer = document.querySelector('.custom-scrollbar') as HTMLElement;
		if (scrollContainer) {
			console.log('scrollContainer:', scrollContainer);

			lastContainerScrollX = scrollContainer.scrollLeft;
			containerScrollListener = () => {
				const targetRect = target.getBoundingClientRect();
				const containerRect = scrollContainer.getBoundingClientRect();

				console.log('targetRect:', targetRect);
				console.log('containerRect:', containerRect);

				const isFullyVisible =
					targetRect.left >= containerRect.left && targetRect.right <= containerRect.right;

				console.log('isFullyVisible:', isFullyVisible);

				if (!isFullyVisible) {
					onClose();
				}

				updateModalPosition();
			};

			window.addEventListener('load', () => {
				const scrollContainer = document.querySelector('.custom-scrollbar');
				if (scrollContainer) {
					scrollContainer.addEventListener('scroll', () => {
						console.log('scroll detected!');
					});
				}
			});

			scrollContainer.addEventListener('scroll', containerScrollListener, true);
		}
	}

	function removeScrollListeners() {
		if (scrollListener) {
			window.removeEventListener('scroll', scrollListener, true);
			scrollListener = null;
		}
		if (containerScrollListener) {
			const container = document.querySelector('.custom-scrollbar');
			if (container) container.removeEventListener('scroll', containerScrollListener, true);
			containerScrollListener = null;
		}
	}

	function onClose() {
		activeModal = null;
		removeScrollListeners();
	}

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

<header class="relative h-full">
	<div class="hero-section relative mb-6 h-full rounded-t-[12px]">
		<div
			class="mb-4 flex flex-col items-center justify-center gap-6 px-6 py-15 pb-20 text-center md:mb-8 lg:pb-28"
		>
			<!-- Main Title -->
			<h1 class="text-3xl font-bold text-gray-800 md:text-5xl">Discover Unlimited Events</h1>

			<!-- Search Bar -->
			<div class="relative w-full max-w-3xl">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search events, and collections"
					class="h-[43px] w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:ring-2 focus:ring-purple-500 focus:outline-none"
				/>
				<span class="absolute top-2.5 left-3 text-gray-400">
					<img src="/search.png" alt="search icon" class="h-5 w-5" />
				</span>
				<span class="absolute top-2 right-3 bg-[#eeeeef] p-1 text-sm text-gray-500">⌘K</span>
			</div>

			<!-- Stats -->
			<div class="md:text-md flex gap-4 text-sm font-bold text-gray-400 md:gap-6">
				<span>39,374 <span class="font-medium">Events</span></span>
				<div class="border border-l border-gray-600"></div>
				<span>1,599,060 <span class="font-medium">Organizers</span></span>
			</div>
		</div>

		<div class="absolute bottom-0 h-[31px] w-full md:h-auto">
			<img src="/floor-light.svg.png" alt="" class="h-full w-full" />
		</div>
	</div>

	<div
		class="custom-scrollbar mt-4 flex gap-4 overflow-x-auto overflow-y-hidden whitespace-nowrap lg:hidden"
	>
		{#each menuItems as item}
			<button
				class={`flex flex-shrink-0 cursor-pointer items-center gap-3 rounded-md px-4 py-2 transition ${
					activeItem === item.name
						? 'rounded-2xl border border-purple-700 text-purple-700'
						: 'bg-[#eeeff0] text-gray-700'
				}`}
				on:click={() => (activeItem = item.name)}
			>
				<span>{@html activeItem === item.name ? item.selectedIcon : item.icon}</span>
				{item.name}
			</button>
		{/each}
	</div>

	<div class="relative mt-4">
		<!-- Filters (optional - can be moved to main content later) -->
		<div class="custom-scrollbar flex gap-4 overflow-x-auto overflow-y-hidden whitespace-nowrap">
			{#each ['Category', 'Event Type', 'Location', 'Language', 'Currency'] as filter}
				<button
					class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-sm text-[#616265]"
					on:click={(e) => handleFilterClick(filter, e)}
				>
					<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
					{filter}
					<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
				</button>
			{/each}

			<!-- Clear Button -->
			<button
				class="flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-md border border-purple-600 px-3 py-1 text-sm text-purple-600"
				on:click={() => (activeModal = null)}
			>
				Clear
				<span>
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M7.9987 15.1663C4.04536 15.1663 0.832031 11.953 0.832031 7.99967C0.832031 4.04634 4.04536 0.833008 7.9987 0.833008C11.952 0.833008 15.1654 4.04634 15.1654 7.99967C15.1654 11.953 11.952 15.1663 7.9987 15.1663ZM7.9987 1.83301C4.5987 1.83301 1.83203 4.59967 1.83203 7.99967C1.83203 11.3997 4.5987 14.1663 7.9987 14.1663C11.3987 14.1663 14.1654 11.3997 14.1654 7.99967C14.1654 4.59967 11.3987 1.83301 7.9987 1.83301Z"
							fill="#A9AAAA"
						/>
						<path
							d="M6.11161 10.3869C5.98495 10.3869 5.85828 10.3402 5.75828 10.2402C5.56495 10.0469 5.56495 9.7269 5.75828 9.53357L9.53162 5.76023C9.72495 5.5669 10.0449 5.5669 10.2383 5.76023C10.4316 5.95357 10.4316 6.27357 10.2383 6.4669L6.46495 10.2402C6.37161 10.3402 6.23828 10.3869 6.11161 10.3869Z"
							fill="#A9AAAA"
						/>
						<path
							d="M9.88495 10.3869C9.75828 10.3869 9.63162 10.3402 9.53162 10.2402L5.75828 6.4669C5.56495 6.27357 5.56495 5.95357 5.75828 5.76023C5.95161 5.5669 6.27161 5.5669 6.46495 5.76023L10.2383 9.53357C10.4316 9.7269 10.4316 10.0469 10.2383 10.2402C10.1383 10.3402 10.0116 10.3869 9.88495 10.3869Z"
							fill="#A9AAAA"
						/>
					</svg>
				</span>
			</button>
		</div>
		<CategoryModal open={activeModal === 'Category'} {onClose} />

		{#if activeModal === 'Event Type'}
			<EventTypeModal
				open={activeModal === 'Event Type'}
				{onClose}
				position={modalPosition}
				on:select={(e) => console.log('Selected:', e.detail)}
			/>
		{/if}

		<!-- Placeholders for other modals -->
		{#if activeModal === 'Location'}
			<LocationModal open={activeModal === 'Location'} {onClose} position={modalPosition} />
		{/if}
		{#if activeModal === 'Language'}
			<LanguageModal open={activeModal === 'Language'} {onClose} position={modalPosition} />
		{/if}
		{#if activeModal === 'Currency'}
			<!-- Add CurrencyModal here -->
		{/if}
	</div>
</header>

<style>
	.hero-section {
		position: relative;
		background: linear-gradient(135deg, #e6e6fa 0%, #ffffff 50%, #f8e1ff 100%);
	}
</style>
