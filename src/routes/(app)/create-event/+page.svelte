<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import Sidebar from '../components/Sidebar.svelte';
	import AIModal from './components/AIModal.svelte';
	import CapacityModal from './components/CapacityModal.svelte';
	import CategoryModal from './components/CategoryModal.svelte';
	import CollectionModal from './components/CollectionModal.svelte';
	import DatePickerModal from './components/DatePickerModal.svelte';
	import DescriptionModal from './components/DescriptionModal.svelte';
	import EventLocationModal from './components/EventLocationModal.svelte';
	import EventTypeModal from './components/EventTypeModal.svelte';
	import ImageSelectorModal from './components/ImageSelectorModal.svelte';
	import SettingsModal from './components/SettingsModal.svelte';
	import TicketModal from './components/TicketModal.svelte';
	import TimeModal from './components/TimeModal.svelte';
	import VisibilityModal from './components/VisibilityModal.svelte';
	import { onMount, tick } from 'svelte';
	import ThemeModal from './components/ThemeModal.svelte';
	import { colors, type Color } from '$lib/utils/colors';

	let showImageSelectorModal = false;
	let showThemeModal = false;
	let showSettingsModal = false;
	let showAIModalMobile = false;
	let showAIModal = false;
	let openCollectionModal = false;
	let openVisibilityModal = false;
	let openStartDatePickerModal = false;
	let openEndDatePickerModal = false;
	let openStartTimeModal = false;
	let openEndTimeModal = false;
	let showCategoryModal = false;
	let showEventTypeModal = false;
	let openEventLocationModal = false;
	let openDescriptionModal = false;
	let openTicketModal = false;
	let openCapacityModal = false;

	let visibility = 'public';
	let eventName = '';
	let startTime = '1:30 AM';
	let endTime = '2:30 AM';
	let startDate = new Date(2025, 10, 25);
	let endDate = new Date(2025, 10, 30);
	let locationName = '...';
	let timezone = '';
	let eventType = '';
	let eventCategory = '';
	let location = '';
	let description = '';
	let tickets = false;
	let approvalRequired = false;
	let capacity = '';

	function scrollToId(id: string, options?: { behavior?: ScrollBehavior }) {
		const el = document.getElementById(id);
		if (!el) return;

		const isMobile = window.innerWidth <= 768;
		const rect = el.getBoundingClientRect();
		const viewHeight = window.innerHeight - (isMobile ? 100 : 0);

		let scrollAmount = 0;

		// If top of element is above the viewport
		if (rect.top < 0) {
			scrollAmount = rect.top - 16; // add small padding
		}
		// If bottom of element is below the viewport
		else if (rect.bottom > viewHeight) {
			scrollAmount = rect.bottom - viewHeight + 16; // add small padding
		}

		if (scrollAmount !== 0) {
			window.scrollBy({
				top: scrollAmount,
				left: 0,
				behavior: options?.behavior ?? 'smooth'
			});
		}
	}

	let visibility_icon = 'mdi:web';

	function formatDate(date: Date) {
		return date.toLocaleDateString('en-US', {
			weekday: 'short', // "Sat"
			month: 'short', // "Sep"
			day: 'numeric' // "14"
		});
	}

	let selectedStyle = 'Minimal';
	let selectedFont = 'Default';
	let selectedColor: Color = colors[0];

	onMount(() => {
		// Get user’s location
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(async (position) => {
				const { latitude, longitude } = position.coords;

				// Get timezone from browser
				const offsetMin = new Date().getTimezoneOffset();
				const offsetHours = -(offsetMin / 60);
				const sign = offsetHours >= 0 ? '+' : '-';
				const formattedOffset = `GMT${sign}${String(Math.abs(offsetHours)).padStart(2, '0')}:00`;
				timezone = formattedOffset;

				// Get city name using reverse geocoding (OpenStreetMap API)
				try {
					const res = await fetch(
						`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
					);
					const data = await res.json();
					locationName =
						data.address.city ||
						data.address.town ||
						data.address.village ||
						data.address.state ||
						'Unknown';
				} catch (e) {
					locationName = 'Unknown';
				}
			});
		} else {
			locationName = 'Unavailable';
			timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		}
	});

	const arrowDown = `<svg width="12" height="11" viewBox="0 0 12 11" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path d="M10.375 1.45312C11.025 2.11929 11.1698 3.08309 10.7324 3.91016L7.76367 9.55273V9.55176C7.40021 10.2466 6.68362 10.6797 5.89844 10.6797C5.1133 10.6797 4.39768 10.2465 4.03418 9.55176L4.0332 9.55273L1.06348 3.91016L1.06445 3.90918C0.894635 3.59018 0.813477 3.25368 0.813477 2.91699C0.813602 2.38016 1.02379 1.86187 1.42188 1.45312C2.07284 0.78615 3.03705 0.625109 3.86914 1.04102L5.44629 1.83008C5.68943 1.95165 5.97862 1.96677 6.2373 1.875L6.3457 1.8291L7.92773 1.04102C8.7598 0.625179 9.72406 0.786179 10.375 1.45312ZM9.87793 2.92188C9.87779 2.64494 9.749 2.39777 9.58105 2.22559H9.58008C9.33125 1.96847 8.89638 1.79125 8.41602 2.0293V2.02832L6.83887 2.81738C6.32024 3.07436 5.71969 3.10672 5.18066 2.91406L4.95312 2.81738L3.37598 2.02832H3.375C2.89624 1.78694 2.46182 1.96735 2.21191 2.22559C1.96027 2.48567 1.78887 2.92017 2.03809 3.39453L5.00781 9.03711L5.08105 9.15723C5.2681 9.4218 5.56282 9.57422 5.89355 9.57422C6.22429 9.5742 6.51902 9.42182 6.70605 9.15723L6.7793 9.03711L9.75781 3.39551C9.84523 3.229 9.87793 3.06831 9.87793 2.92188Z" fill="currentColor" stroke="currentColor" stroke-width="0.375"/>
		<rect x="5.31348" y="5.6875" width="3.375" height="1.125" rx="0.5625" transform="rotate(-90 5.31348 5.6875)" fill="currentColor" stroke="currentColor" stroke-width="0.375"/>
		</svg>`;
</script>

<div
	class="relative flex flex-col md:flex-row min-h-screen overflow-auto"
	style="background-color: {selectedColor.bg}; color: {selectedColor.text}; font-family: {selectedFont}"
>
	<!-- Sidebar -->

	<div class="md:w-[117px]">
		<Sidebar background_color={selectedColor.bg} />
	</div>

	<!-- Main Content -->
	<main class="relative mb-[106px] flex-1 md:mb-0 md:p-5 lg:flex lg:gap-15 lg:p-15">
		<!-- Left Panel -->
		<div class="hidden w-full max-w-[450px] space-y-6 lg:block">
			<!-- Image -->
			<div class="relative w-full overflow-hidden rounded-xl">
				<button class="w-full" on:click={() => (showImageSelectorModal = !showImageSelectorModal)}>
					<img src="/events.png" alt="" class="w-full cursor-pointer" />
				</button>
				<ImageSelectorModal bind:open={showImageSelectorModal} />
			</div>

			<div class="space-y-4">
				<!-- Theme -->
				<div
					class="relative"
					use:clickOutside={() => {
						showThemeModal = false;
					}}
				>
					<button
						class="flex w-full items-center justify-between rounded-[9px] px-4 py-3"
						style="background-color: {selectedColor.cover};"
						on:click={() => (showThemeModal = !showThemeModal)}
					>
						<div class="flex items-center gap-2">
							<img
								src={`/${selectedStyle}.svg`}
								alt={selectedStyle}
								class="mb-1 h-[36.75px] w-[54px]"
							/>
							<div>
								<div class="text-xs" style="color: {selectedColor.lightText};">Theme</div>
								<div class="font-semibold">{selectedStyle}</div>
							</div>
						</div>
						<div aria-label="change theme" style="color: {selectedColor.lightText}">
							<svg
								width="14"
								height="14"
								viewBox="0 0 14 14"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M7.49329 2.20342L1.58329 8.11342C1.35829 8.33842 1.13329 8.78092 1.08829 9.10342L0.765788 11.3609C0.645788 12.1784 1.22329 12.7484 2.04079 12.6359L4.29829 12.3134C4.61329 12.2684 5.05579 12.0434 5.28829 11.8184L11.1983 5.90842C12.2183 4.88842 12.6983 3.70342 11.1983 2.20342C9.69829 0.703422 8.51329 1.18342 7.49329 2.20342Z"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-miterlimit="10"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M7.49329 2.20342L1.58329 8.11342C1.35829 8.33842 1.13329 8.78092 1.08829 9.10342L0.765788 11.3609C0.645788 12.1784 1.22329 12.7484 2.04079 12.6359L4.29829 12.3134C4.61329 12.2684 5.05579 12.0434 5.28829 11.8184L11.1983 5.90842C12.2183 4.88842 12.6983 3.70342 11.1983 2.20342C9.69829 0.703422 8.51329 1.18342 7.49329 2.20342Z"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-miterlimit="10"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M7.49329 2.20342L1.58329 8.11342C1.35829 8.33842 1.13329 8.78092 1.08829 9.10342L0.765788 11.3609C0.645788 12.1784 1.22329 12.7484 2.04079 12.6359L4.29829 12.3134C4.61329 12.2684 5.05579 12.0434 5.28829 11.8184L11.1983 5.90842C12.2183 4.88842 12.6983 3.70342 11.1983 2.20342C9.69829 0.703422 8.51329 1.18342 7.49329 2.20342Z"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-miterlimit="10"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M6.64453 3.05469C7.14703 4.84719 8.54953 6.24969 10.3495 6.75969"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-miterlimit="10"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M6.64453 3.05469C7.14703 4.84719 8.54953 6.24969 10.3495 6.75969"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-miterlimit="10"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M6.64453 3.05469C7.14703 4.84719 8.54953 6.24969 10.3495 6.75969"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-miterlimit="10"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<rect x="8.625" y="12.125" width="4.5" height="0.75" fill="currentColor" />
								<rect
									x="8.625"
									y="12.125"
									width="4.5"
									height="0.75"
									stroke="currentColor"
									stroke-width="0.75"
								/>
								<rect
									x="8.625"
									y="12.125"
									width="4.5"
									height="0.75"
									stroke="currentColor"
									stroke-width="0.75"
								/>
								<rect
									x="8.625"
									y="12.125"
									width="4.5"
									height="0.75"
									stroke="currentColor"
									stroke-width="0.75"
								/>
							</svg>
						</div>
					</button>
					<ThemeModal
						open={showThemeModal}
						bind:selectedStyle
						bind:selectedFont
						bind:selectedColor
					/>
				</div>

				<!-- AI & Settings -->
				<div
					class="relative"
					use:clickOutside={() => {
						showAIModal = false;
					}}
				>
					<button
						class="flex w-full items-center gap-2 rounded-[9px] px-4 py-3 text-left"
						style="background-color: {selectedColor.cover};"
						on:click={async () => {
							showAIModal = !showAIModal;
							await tick();
							scrollToId('aiModal');
						}}
					>
						<div
							class="flex h-[34.75px] w-[54px] items-center justify-center rounded-[3.75px]"
							style="background-color: {selectedColor.smallCover}; color: {selectedColor.text}"
						>
							<svg
								width="22"
								height="22"
								viewBox="0 0 22 22"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M20.3271 1.90412C20.4297 2.12656 20.6033 2.30297 20.8321 2.40268L21.7869 2.81687C22.071 2.94727 22.071 3.33844 21.7869 3.46883L20.84 3.88302C20.6112 3.98273 20.4297 4.15915 20.335 4.38159L19.5853 6.08437C19.4512 6.35281 19.0488 6.35281 18.9147 6.08437L18.165 4.38159C18.0624 4.15915 17.8888 3.98273 17.6599 3.88302L16.7131 3.46883C16.429 3.33844 16.429 2.94727 16.7131 2.81687L17.6599 2.40268C17.8888 2.30297 18.0703 2.12656 18.165 1.90412L18.9147 0.201341C19.0488 -0.0671137 19.4512 -0.0671137 19.5853 0.201341L20.3271 1.90412ZM10.987 2.48647C11.0605 2.63944 11.1832 2.76182 11.3467 2.83066L12.0253 3.11365C12.2296 3.20543 12.2296 3.47314 12.0253 3.56492L11.3467 3.84791C11.1832 3.91675 11.0523 4.03913 10.987 4.1921L10.4555 5.36232C10.3574 5.54589 10.0712 5.54589 9.97307 5.36232L9.44169 4.1921C9.36807 4.03913 9.24542 3.91675 9.08191 3.84791L8.40329 3.56492C8.19893 3.47314 8.19893 3.20543 8.40329 3.11365L9.08191 2.83066C9.24542 2.76182 9.37624 2.63944 9.44169 2.48647L9.97307 1.31624C10.0712 1.13268 10.3574 1.13268 10.4555 1.31624L10.987 2.48647ZM1.57143 18.8571L0.265179 20.1356C-0.0883929 20.4901 -0.0883929 21.0574 0.265179 21.4119L0.587321 21.735C0.933036 22.0896 1.50661 22.0896 1.85232 21.7272L3.14286 20.4329L3.14066 20.4307L14.1429 9.42856L15.4582 8.11854C15.7996 7.76898 15.7996 7.14489 15.4582 6.80271L15.1985 6.54232C14.8497 6.20016 14.1429 6.28571 13.75 6.67856L1.57143 18.8571ZM18.8184 11.2338C18.6586 11.1568 18.5324 11.0285 18.4567 10.8574L17.9183 9.58256C17.8174 9.37725 17.5313 9.37725 17.4389 9.58256L16.9004 10.8574C16.8331 11.0199 16.6985 11.1568 16.5387 11.2338L15.8657 11.5419C15.6638 11.6445 15.6638 11.9355 15.8657 12.0295L16.5387 12.3376C16.6985 12.4146 16.8247 12.5429 16.9004 12.714L17.4389 13.9888C17.5397 14.1941 17.8258 14.1941 17.9183 13.9888L18.4567 12.714C18.524 12.5515 18.6586 12.4146 18.8184 12.3376L19.4914 12.0295C19.6933 11.9269 19.6933 11.6359 19.4914 11.5419L18.8184 11.2338ZM7.85714 9.42856C8.29109 9.42856 8.64286 9.0768 8.64286 8.64285C8.64286 8.2089 8.29109 7.85713 7.85714 7.85713C7.42319 7.85713 7.07143 8.2089 7.07143 8.64285C7.07143 9.0768 7.42319 9.42856 7.85714 9.42856ZM22 8.64285C22 9.0768 21.6482 9.42856 21.2143 9.42856C20.7803 9.42856 20.4286 9.0768 20.4286 8.64285C20.4286 8.2089 20.7803 7.85713 21.2143 7.85713C21.6482 7.85713 22 8.2089 22 8.64285ZM13.3571 1.57143C13.7911 1.57143 14.1429 1.21966 14.1429 0.785715C14.1429 0.351774 13.7911 2.04305e-06 13.3571 2.04305e-06C12.9232 2.04305e-06 12.5714 0.351774 12.5714 0.785715C12.5714 1.21966 12.9232 1.57143 13.3571 1.57143ZM14.1429 14.9286C14.1429 15.3625 13.7911 15.7143 13.3571 15.7143C12.9232 15.7143 12.5714 15.3625 12.5714 14.9286C12.5714 14.4946 12.9232 14.1428 13.3571 14.1428C13.7911 14.1428 14.1429 14.4946 14.1429 14.9286Z"
									fill="currentColor"
								/>
							</svg>
						</div>
						<div>
							<div class="text-xs" style="color: {selectedColor.lightText};">Create Event</div>
							<div class="font-semibold">Generate with AI</div>
						</div>
					</button>
					<AIModal open={showAIModal} />
				</div>

				<div
					class="relative"
					use:clickOutside={() => {
						showSettingsModal = false;
					}}
				>
					<button
						class="flex w-full items-center gap-2 rounded-[9px] px-4 py-3 text-left"
						style="background-color: {selectedColor.cover};"
						on:click={() => (showSettingsModal = !showSettingsModal)}
					>
						<div
							class="flex h-[34.75px] w-[54px] items-center justify-center rounded-[3.75px]"
							style="background-color: {selectedColor.smallCover}; color: {selectedColor.lightText}"
						>
							<svg
								width="22"
								height="24"
								viewBox="0 0 22 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M4.93237 5.38691L4.75001 6.1144L4.93237 5.38691ZM8.30692 3.43861L7.58572 3.23279L8.30692 3.43861ZM2.23886 10.0522L2.77771 9.53053L2.23886 10.0522ZM2.23886 13.9488L1.70001 13.4271H1.70001L2.23886 13.9488ZM4.93237 18.6141L5.11472 19.3416L4.93237 18.6141ZM8.30692 20.5624L7.58572 20.7682L8.30692 20.5624ZM13.6939 20.5624L14.4151 20.7682L13.6939 20.5624ZM17.0685 18.6141L17.2509 17.8866L17.0685 18.6141ZM19.762 13.9488L19.2232 14.4705V14.4705L19.762 13.9488ZM19.762 10.0522L19.2232 9.53053V9.53053L19.762 10.0522ZM17.0685 5.38691L16.8861 4.65942L17.0685 5.38691ZM13.6939 3.43861L14.4151 3.23279L13.6939 3.43861ZM4.93237 5.38691L4.75001 6.1144C6.60892 6.58036 8.50221 5.48727 9.02813 3.64443L8.30692 3.43861L7.58572 3.23279C7.28195 4.29719 6.18841 4.92855 5.11472 4.65942L4.93237 5.38691ZM2.23886 10.0522L2.77771 9.53053C1.34244 8.048 2.74847 5.61269 4.75001 6.1144L4.93237 5.38691L5.11472 4.65942C1.64939 3.79079 -0.784913 8.00712 1.70001 10.5739L2.23886 10.0522ZM2.23886 13.9488L2.77771 14.4705C4.11069 13.0936 4.11069 10.9074 2.77771 9.53053L2.23886 10.0522L1.70001 10.5739C2.46993 11.3691 2.46992 12.6319 1.70001 13.4271L2.23886 13.9488ZM4.93237 18.6141L4.75001 17.8866C2.74847 18.3883 1.34244 15.953 2.77771 14.4705L2.23886 13.9488L1.70001 13.4271C-0.784914 15.9939 1.64939 20.2102 5.11472 19.3416L4.93237 18.6141ZM8.30692 20.5624L9.02813 20.3566C8.50221 18.5137 6.60892 17.4207 4.75001 17.8866L4.93237 18.6141L5.11472 19.3416C6.18841 19.0725 7.28195 19.7038 7.58572 20.7682L8.30692 20.5624ZM13.6939 20.5624L12.9727 20.3566C12.4065 22.3408 9.59441 22.3408 9.02813 20.3566L8.30692 20.5624L7.58572 20.7682C8.56613 24.2036 13.4347 24.2036 14.4151 20.7682L13.6939 20.5624ZM17.0685 18.6141L17.2509 17.8866C15.3919 17.4207 13.4987 18.5137 12.9727 20.3566L13.6939 20.5624L14.4151 20.7682C14.7189 19.7038 15.8125 19.0725 16.8861 19.3416L17.0685 18.6141ZM19.762 13.9488L19.2232 14.4705C20.6584 15.953 19.2524 18.3883 17.2509 17.8866L17.0685 18.6141L16.8861 19.3416C20.3515 20.2102 22.7858 15.9939 20.3009 13.4271L19.762 13.9488ZM19.762 10.0522L19.2232 9.53053C17.8902 10.9074 17.8902 13.0936 19.2232 14.4705L19.762 13.9488L20.3009 13.4271C19.5309 12.6319 19.5309 11.3691 20.3009 10.5739L19.762 10.0522ZM17.0685 5.38691L17.2509 6.1144C19.2524 5.61269 20.6584 8.048 19.2232 9.53053L19.762 10.0522L20.3009 10.5739C22.7858 8.00712 20.3515 3.79079 16.8861 4.65942L17.0685 5.38691ZM13.6939 3.43861L12.9727 3.64443C13.4987 5.48727 15.3919 6.58036 17.2509 6.1144L17.0685 5.38691L16.8861 4.65942C15.8125 4.92855 14.7189 4.29719 14.4151 3.23279L13.6939 3.43861ZM13.6939 3.43861L14.4151 3.23279C13.4347 -0.202596 8.56613 -0.202595 7.58572 3.23279L8.30692 3.43861L9.02813 3.64443C9.59441 1.66019 12.4065 1.66019 12.9727 3.64443L13.6939 3.43861ZM8.00043 12.0005H7.25043C7.25043 14.0716 8.92937 15.7505 11.0004 15.7505V15.0005V14.2505C9.75779 14.2505 8.75043 13.2431 8.75043 12.0005H8.00043ZM11.0004 15.0005V15.7505C13.0715 15.7505 14.7504 14.0716 14.7504 12.0005H14.0004H13.2504C13.2504 13.2431 12.2431 14.2505 11.0004 14.2505V15.0005ZM14.0004 12.0005H14.7504C14.7504 9.92944 13.0715 8.2505 11.0004 8.2505V9.0005V9.7505C12.2431 9.7505 13.2504 10.7579 13.2504 12.0005H14.0004ZM11.0004 9.0005V8.2505C8.92937 8.2505 7.25043 9.92944 7.25043 12.0005H8.00043H8.75043C8.75043 10.7579 9.75779 9.7505 11.0004 9.7505V9.0005Z"
									fill="currentColor"
								/>
							</svg>
						</div>
						<div>
							<div class="text-xs" style="color: {selectedColor.lightText};">Action</div>
							<div class="font-semibold">Quick Settings</div>
						</div>
					</button>
					<SettingsModal open={showSettingsModal} />
				</div>
			</div>
		</div>

		<!-- Right Panel: Create Event Form -->
		<div class="w-full space-y-5 p-6 lg:max-w-2xl lg:p-0">
			<!-- Collection & Visibility -->
			<div class="flex items-center justify-between text-sm">
				<div
					class="relative"
					use:clickOutside={() => {
						openCollectionModal = false;
					}}
				>
					<button
						class="flex items-center gap-1 rounded-[9.75px] px-3 py-2 font-medium"
						style="background-color: {selectedColor.cover};"
						on:click={() => (openCollectionModal = !openCollectionModal)}
					>
						<img src="/face-1.svg" alt="profile icon" class="inline h-5 w-5 rounded-full" />
						<span class="">Personal Collection</span>
						<span>{@html arrowDown}</span>
					</button>
					<CollectionModal open={openCollectionModal} />
				</div>
				<div
					class="relative"
					use:clickOutside={() => {
						openVisibilityModal = false;
					}}
				>
					<button
						class="flex items-center gap-1 rounded-[9.75px] px-3 py-2 font-medium"
						style="background-color: {selectedColor.cover};"
						on:click={() => (openVisibilityModal = !openVisibilityModal)}
					>
						<Icon
							icon={visibility_icon}
							class="text-xl font-light"
							style="color: {selectedColor.lightText}"
						/>
						<div class="">{visibility}</div>
						<span>{@html arrowDown}</span>
					</button>
					<VisibilityModal bind:open={openVisibilityModal} bind:visibility bind:visibility_icon />
				</div>
			</div>

			<!-- Event Name -->
			<input
				type="text"
				bind:value={eventName}
				placeholder="Event Name"
				class="w-full py-1.5 text-4xl font-semibold focus:outline-none"
				style="--placeholder-color: {selectedColor.lightText}; color: {selectedColor.lightText}"
			/>

			<div class="relative h-[360px] w-full overflow-hidden rounded-xl lg:hidden">
				<button class="w-full" on:click={() => (showImageSelectorModal = !showImageSelectorModal)}>
					<img src="/events.png" alt="" class="w-full cursor-pointer" />
				</button>
				<ImageSelectorModal bind:open={showImageSelectorModal} />
			</div>

			<!-- Date & Time -->
			<div class="flex w-full gap-4">
				<div class="flex w-full flex-col items-start justify-between gap-4 md:flex-row">
					<!-- Left Section -->
					<div
						class="flex w-full justify-between rounded-[9.75px] px-4 py-3"
						style="background-color: {selectedColor.cover};"
					>
						<!-- Start -->
						<div class="flex w-full max-w-[70px] flex-col items-start">
							<div class="flex items-center space-x-2">
								<span
									class="h-[11.25px] w-[11.25px] rounded-full"
									style="background-color: {selectedColor.smallCover};"
								></span>
								<span class="font-medium">Start</span>
							</div>
							<div
								class="ml-1 h-8 border-2 border-dashed"
								style="border-color: {selectedColor.smallCover};"
							></div>
							<div class="flex items-center space-x-2">
								<span
									class="h-[11.25px] w-[11.25px] rounded-full border"
									style="border-color: {selectedColor.smallCover};"
								></span>
								<span class="font-medium">End</span>
							</div>
						</div>

						<!-- End -->
						<div class="flex w-full max-w-[243px] flex-col items-center space-x-4">
							<div class="grid w-full grid-cols-2 items-center gap-2">
								<div
									class="relative w-full"
									use:clickOutside={() => (openStartDatePickerModal = false)}
								>
									<button
										on:click={async () => {
											openStartDatePickerModal = !openStartDatePickerModal;
											await tick();
											scrollToId('date');
										}}
										class="rounded-t-r w-full p-2 text-sm font-semibold"
										style="background-color: {selectedColor.smallCover}; border-top-left-radius: 9.75px;"
										><p class="mr-auto w-fit">{formatDate(startDate)}</p></button
									>
									<DatePickerModal open={openStartDatePickerModal} bind:selectedDate={startDate} />
								</div>
								<div class="relative w-full" use:clickOutside={() => (openStartTimeModal = false)}>
									<button
										on:click={async () => {
											openStartTimeModal = !openStartTimeModal;
											await tick();
											scrollToId('time');
										}}
										class="w-full p-2 text-sm font-semibold"
										style="background-color: {selectedColor.smallCover}; border-top-right-radius: 9.75px;"
										><p class="ml-auto w-fit">{startTime}</p></button
									>
									<TimeModal open={openStartTimeModal} bind:selectedTime={startTime} />
								</div>
								<div
									class="relative w-full"
									use:clickOutside={() => (openEndDatePickerModal = false)}
								>
									<button
										on:click={async () => {
											openEndDatePickerModal = !openEndDatePickerModal;
											await tick();
											scrollToId('date');
										}}
										class="w-full p-2 text-sm font-semibold"
										style="background-color: {selectedColor.smallCover}; border-bottom-left-radius: 9.75px;"
										><p class="mr-auto w-fit">{formatDate(endDate)}</p></button
									>
									<DatePickerModal
										open={openEndDatePickerModal}
										bind:selectedDate={endDate}
										{startDate}
									/>
								</div>
								<div class="relative w-full" use:clickOutside={() => (openEndTimeModal = false)}>
									<button
										on:click={async () => {
											openEndTimeModal = !openEndTimeModal;
											await tick();
											scrollToId('time');
										}}
										class="w-full p-2 text-sm font-semibold"
										style="background-color: {selectedColor.smallCover}; border-bottom-right-radius: 9.75px;"
										><p class="ml-auto w-fit">{endTime}</p></button
									>
									<TimeModal
										open={openEndTimeModal}
										bind:selectedTime={endTime}
										referenceTime={startTime}
									/>
								</div>
							</div>
						</div>
					</div>

					<!-- Right Section -->
					<div
						class="flex w-[159px] flex-col justify-center gap-2 rounded-[9.75px] p-4 font-medium"
						style="background-color: {selectedColor.cover};"
					>
						<div style="color: {selectedColor.lightText}">
							<svg
								width="19"
								height="18"
								viewBox="0 0 19 18"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M9.25 16.5C13.3921 16.5 16.75 13.1421 16.75 9C16.75 4.85786 13.3921 1.5 9.25 1.5C5.10786 1.5 1.75 4.85786 1.75 9C1.75 13.1421 5.10786 16.5 9.25 16.5Z"
									stroke="currentColor"
									stroke-width="1.125"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M6.24922 2.25H6.99922C5.53672 6.63 5.53672 11.37 6.99922 15.75H6.24922"
									stroke="currentColor"
									stroke-width="1.125"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M11.5 2.25C12.9625 6.63 12.9625 11.37 11.5 15.75"
									stroke="currentColor"
									stroke-width="1.125"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M2.5 12V11.25C6.88 12.7125 11.62 12.7125 16 11.25V12"
									stroke="currentColor"
									stroke-width="1.125"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M2.5 6.75313C6.88 5.29063 11.62 5.29063 16 6.75313"
									stroke="currentColor"
									stroke-width="1.125"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
						<span>{timezone}</span>
						<span style="color: {selectedColor.lightText};">{locationName}</span>
					</div>
				</div>
			</div>

			<!-- Event Type & Category -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div class="relative w-full" use:clickOutside={() => (showEventTypeModal = false)}>
					<button
						class="flex h-[44px] w-full items-center justify-between rounded-[9.75px] px-3 py-2"
						style="background-color: {selectedColor.cover};"
						on:click={async () => {
							showEventTypeModal = !showEventTypeModal;
							await tick();
							scrollToId('eventType');
						}}
					>
						<div class="flex items-center gap-1" style="color: {selectedColor.lightText}">
							<svg
								width="20"
								height="21"
								viewBox="0 0 20 21"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M1.66699 7.78964C1.66699 5.74414 3.3252 4.08594 5.3707 4.08594H14.63C16.6755 4.08594 18.3337 5.74414 18.3337 7.78964C18.3337 8.24238 18.074 8.65501 17.6659 8.85092L17.2597 9.04587C15.8278 9.73319 15.8278 11.772 17.2597 12.4593L17.6659 12.6543C18.074 12.8502 18.3337 13.2628 18.3337 13.7156C18.3337 15.7611 16.6755 17.4193 14.63 17.4193H5.3707C3.3252 17.4193 1.66699 15.7611 1.66699 13.7156C1.66699 13.2628 1.92663 12.8502 2.33479 12.6543L2.74093 12.4593C4.17284 11.772 4.17284 9.73319 2.74093 9.04587L2.33479 8.85092C1.92663 8.65501 1.66699 8.24238 1.66699 7.78964Z"
									stroke="currentColor"
									stroke-width="1.5"
								/>
								<path
									d="M9.18159 8.86708C9.43929 8.04778 10.5614 8.04778 10.8191 8.86708C10.9343 9.23348 11.2649 9.48155 11.6378 9.48155C12.4718 9.48155 12.8185 10.5839 12.1438 11.0903C11.8421 11.3167 11.7158 11.7181 11.8311 12.0845C12.0888 12.9038 11.181 13.5851 10.5063 13.0787C10.2046 12.8523 9.79604 12.8523 9.49432 13.0787C8.81964 13.5851 7.91187 12.9038 8.16957 12.0845C8.28482 11.7181 8.15857 11.3167 7.85684 11.0903C7.18216 10.5839 7.5289 9.48155 8.36285 9.48155C8.7358 9.48155 9.06634 9.23348 9.18159 8.86708Z"
									stroke="currentColor"
									stroke-width="1.5"
								/>
							</svg>

							<p>Event Type</p>
						</div>
						<span>{@html arrowDown}</span>
					</button>
					<EventTypeModal open={showEventTypeModal} />
				</div>
				<div class="relative w-full">
					<button
						class="flex h-[44px] w-full items-center justify-between rounded-[9.75px] px-3 py-2"
						style="background-color: {selectedColor.cover};"
						on:click={() => (showCategoryModal = !showCategoryModal)}
					>
						<div class="flex items-center gap-1" style="color: {selectedColor.lightText}">
							<svg
								width="20"
								height="20"
								viewBox="0 0 20 20"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M6.66699 3.33594L6.66699 16.6693"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-dasharray="2 3"
								/>
								<path
									d="M1.66699 7.03964C1.66699 4.99414 3.3252 3.33594 5.3707 3.33594H14.63C16.6755 3.33594 18.3337 4.99414 18.3337 7.03964C18.3337 7.49238 18.074 7.90501 17.6659 8.10092L17.2597 8.29587C15.8278 8.98319 15.8278 11.022 17.2597 11.7093L17.6659 11.9043C18.074 12.1002 18.3337 12.5128 18.3337 12.9656C18.3337 15.0111 16.6755 16.6693 14.63 16.6693H5.3707C3.3252 16.6693 1.66699 15.0111 1.66699 12.9656C1.66699 12.5128 1.92663 12.1002 2.33479 11.9043L2.74093 11.7093C4.17284 11.022 4.17284 8.98319 2.74093 8.29587L2.33479 8.10092C1.92663 7.90501 1.66699 7.49238 1.66699 7.03964Z"
									stroke="currentColor"
									stroke-width="1.5"
								/>
								<path
									d="M10.8483 8.11708C11.106 7.29778 12.228 7.29778 12.4857 8.11708C12.601 8.48348 12.9315 8.73155 13.3045 8.73155C14.1384 8.73155 14.4852 9.83391 13.8105 10.3403C13.5088 10.5667 13.3825 10.9681 13.4977 11.3345C13.7555 12.1538 12.8477 12.8351 12.173 12.3287C11.8713 12.1023 11.4627 12.1023 11.161 12.3287C10.4863 12.8351 9.57853 12.1538 9.83624 11.3345C9.95149 10.9681 9.82523 10.5667 9.52351 10.3403C8.84883 9.83391 9.19557 8.73155 10.0295 8.73155C10.4025 8.73155 10.733 8.48348 10.8483 8.11708Z"
									stroke="currentColor"
									stroke-width="1.5"
								/>
							</svg>

							<p>Event Category</p>
						</div>
						<span>{@html arrowDown}</span>
					</button>
					<CategoryModal bind:open={showCategoryModal} />
				</div>
			</div>

			<!-- Location -->
			<div
				class="relative"
				use:clickOutside={() => {
					openEventLocationModal = false;
				}}
			>
				<button
					class="w-full rounded-[9.75px] p-3 text-left"
					style="background-color: {selectedColor.cover};"
					on:click={async () => {
						openEventLocationModal = !openEventLocationModal;
						await tick();
						scrollToId('location');
					}}
				>
					<div class="flex items-center gap-1" style="color: {selectedColor.lightText}">
						<svg
							width="18"
							height="19"
							viewBox="0 0 18 19"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M11.0625 8.25C11.4736 8.25 11.8125 8.58895 11.8125 9C11.8125 9.41105 11.4736 9.75 11.0625 9.75H6.9375C6.52645 9.75 6.1875 9.41105 6.1875 9C6.1875 8.58895 6.52645 8.25 6.9375 8.25H11.0625Z"
								fill="currentColor"
								stroke="currentColor"
								stroke-width="0.375"
							/>
							<path
								d="M9 6.1875C9.41105 6.1875 9.75 6.52645 9.75 6.9375V11.0625C9.75 11.4736 9.41105 11.8125 9 11.8125C8.58895 11.8125 8.25 11.4736 8.25 11.0625V6.9375C8.25 6.52645 8.58895 6.1875 9 6.1875Z"
								fill="currentColor"
								stroke="currentColor"
								stroke-width="0.375"
							/>
							<path
								d="M9.00684 1.5C11.8694 1.50002 15.166 3.18327 16.0225 6.96387C16.9602 11.1074 14.45 14.5616 12.2266 16.7021V16.7031C11.3209 17.5697 10.1563 18.0078 8.99902 18.0078C7.84198 18.0077 6.67802 17.5695 5.77246 16.7031L5.77148 16.7021C3.54798 14.5614 1.03891 11.0996 1.98438 6.95605C2.84085 3.18304 6.13666 1.5001 8.99902 1.5H9.00684ZM8.99902 3C6.87258 3.00009 4.16913 4.12935 3.45215 7.28613V7.28711C2.71515 10.5016 4.56012 13.3211 6.44238 15.2422L6.81934 15.6143V15.6152C8.04416 16.7976 9.96167 16.7975 11.1865 15.6152C13.1801 13.6963 15.3328 10.7164 14.5615 7.28711L14.4883 6.99707C13.669 4.06002 11.0594 3 8.99902 3Z"
								fill="currentColor"
								stroke="currentColor"
								stroke-width="0.375"
							/>
						</svg>
						<p>Add Event Location</p>
					</div>
					<p
						class="custom-scrollbar block max-w-sm overflow-x-auto px-3 md:max-w-md lg:max-w-full"
						style="color: {selectedColor.lightText}"
					>
						{location ? location : 'Offline location or virtual link'}
					</p>
				</button>
				<EventLocationModal open={openEventLocationModal} bind:link={location} />
			</div>

			<!-- Description -->
			<div
				class="relative"
				use:clickOutside={() => {
					openDescriptionModal = false;
				}}
			>
				<button
					class="custom-scrollbar relative w-full"
					on:click={async () => {
						openDescriptionModal = !openDescriptionModal;
						await tick();
						scrollToId('description');
					}}
				>
					<div
						class="pointer-events-none absolute top-2 left-3 text-gray-400"
						style="color: {selectedColor.lightText}"
					>
						<svg
							width="18"
							height="19"
							viewBox="0 0 18 19"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M15.75 6V13.5C15.75 15.75 14.625 17.25 12 17.25H6C3.375 17.25 2.25 15.75 2.25 13.5V6C2.25 3.75 3.375 2.25 6 2.25H12C14.625 2.25 15.75 3.75 15.75 6Z"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-miterlimit="10"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M10.875 4.125V5.625C10.875 6.45 11.55 7.125 12.375 7.125H13.875"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-miterlimit="10"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M6 10.5H9"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-miterlimit="10"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M6 13.5H12"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-miterlimit="10"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>

					<!-- Textarea -->
					<p
						class="h-10 w-full resize-none rounded-md py-2 pr-3 pl-9 text-left focus:outline-none"
						style="background-color: {selectedColor.cover}; color: {selectedColor.lightText}"
					>
						{description ? description : 'Add Description'}
					</p>
				</button>
				<DescriptionModal open={openDescriptionModal} />
			</div>

			<!-- Event Options -->
			<div class="space-y-2">
				<p>Event Options</p>

				<div style="background-color: {selectedColor.cover};" class="space-y-4 p-3">
					<!-- Tickets -->
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-1">
							<div style="color: {selectedColor.lightText}">
								<svg
									width="18"
									height="19"
									viewBox="0 0 18 19"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M7.5 7.31V5.1875C7.1925 5.1875 6.9375 4.9325 6.9375 4.625V2.9375H5.25C1.9425 2.9375 0.9375 3.9425 0.9375 7.25V7.625C0.9375 7.9325 1.1925 8.1875 1.5 8.1875C2.22 8.1875 2.8125 8.78 2.8125 9.5C2.8125 10.22 2.22 10.8125 1.5 10.8125C1.1925 10.8125 0.9375 11.0675 0.9375 11.375V11.75C0.9375 15.0575 1.9425 16.0625 5.25 16.0625H6.9375V14.375C6.9375 14.0675 7.1925 13.8125 7.5 13.8125V11.69C7.1925 11.69 6.9375 11.435 6.9375 11.1275V7.8725C6.9375 7.565 7.1925 7.31 7.5 7.31Z"
										fill="currentColor"
									/>
									<path
										opacity="0.4"
										d="M15.1875 9.875C15.1875 10.595 15.78 11.1875 16.5 11.1875C16.8075 11.1875 17.0625 11.4425 17.0625 11.75C17.0625 15.0575 16.0575 16.0625 12.75 16.0625H8.0625V14.375C8.0625 14.0675 7.8075 13.8125 7.5 13.8125V11.69C7.8075 11.69 8.0625 11.435 8.0625 11.1275V7.8725C8.0625 7.565 7.8075 7.31 7.5 7.31V5.1875C7.8075 5.1875 8.0625 4.9325 8.0625 4.625V2.9375H12.75C16.0575 2.9375 17.0625 3.9425 17.0625 7.25V8C17.0625 8.3075 16.8075 8.5625 16.5 8.5625C15.78 8.5625 15.1875 9.155 15.1875 9.875Z"
										fill="currentColor"
									/>
								</svg>
							</div>
							<span>Tickets</span>
						</div>
						<div class="relative" use:clickOutside={() => (openTicketModal = false)}>
							<div class="flex items-center gap-1">
								<span class="" style="color: {selectedColor.lightText};">Free</span>
								<button
									aria-label="edit"
									class="flex items-center gap-1"
									style="color: {selectedColor.lightText}"
									on:click={async () => {
										openTicketModal = !openTicketModal;
										await tick();
										scrollToId('ticket');
									}}
								>
									<svg
										width="19"
										height="19"
										viewBox="0 0 19 19"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M8.75 2H7.25C3.5 2 2 3.5 2 7.25V11.75C2 15.5 3.5 17 7.25 17H11.75C15.5 17 17 15.5 17 11.75V10.25"
											stroke="currentColor"
											stroke-width="1.125"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<path
											d="M12.5304 2.76592L6.6204 8.67592C6.3954 8.90092 6.1704 9.34342 6.1254 9.66592L5.8029 11.9234C5.6829 12.7409 6.2604 13.3109 7.0779 13.1984L9.3354 12.8759C9.6504 12.8309 10.0929 12.6059 10.3254 12.3809L16.2354 6.47092C17.2554 5.45092 17.7354 4.26592 16.2354 2.76592C14.7354 1.26592 13.5504 1.74592 12.5304 2.76592Z"
											stroke="currentColor"
											stroke-width="1.125"
											stroke-miterlimit="10"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<path
											d="M11.6826 3.60938C12.1851 5.40188 13.5876 6.80438 15.3876 7.31438"
											stroke="currentColor"
											stroke-width="1.125"
											stroke-miterlimit="10"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								</button>
							</div>
							<TicketModal open={openTicketModal} />
						</div>
					</div>

					<!-- Request Approval -->
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-1">
							<div style="color: {selectedColor.lightText}">
								<svg
									width="18"
									height="18"
									viewBox="0 0 18 18"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M11.265 2.25751C10.635 1.77751 9.855 1.5 9 1.5C6.93 1.5 5.25 3.18 5.25 5.25C5.25 7.32 6.93 9 9 9C11.07 9 12.75 7.32 12.75 5.25"
										stroke="currentColor"
										stroke-width="1.125"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
									<path
										d="M2.55762 16.5C2.55762 13.5975 5.44514 11.25 9.00014 11.25C9.72014 11.25 10.4176 11.3475 11.0701 11.5275"
										stroke="currentColor"
										stroke-width="1.125"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
									<path
										d="M16.5 13.5C16.5 14.0625 16.3425 14.595 16.065 15.045C15.9075 15.315 15.705 15.555 15.4725 15.75C14.9475 16.2225 14.2575 16.5 13.5 16.5C12.405 16.5 11.4525 15.915 10.935 15.045C10.6575 14.595 10.5 14.0625 10.5 13.5C10.5 12.555 10.935 11.7075 11.625 11.16C12.1425 10.7475 12.795 10.5 13.5 10.5C15.1575 10.5 16.5 11.8425 16.5 13.5Z"
										stroke="currentColor"
										stroke-width="1.125"
										stroke-miterlimit="10"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
									<path
										d="M12.3301 13.5006L13.0726 14.2431L14.6701 12.7656"
										stroke="currentColor"
										stroke-width="1.125"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</div>

							<span>Request Approval</span>
						</div>
						<label class="inline-flex cursor-pointer items-center">
							<input type="checkbox" class="peer sr-only" bind:checked={approvalRequired} />
							<div
								class="peer relative h-6 w-10 rounded-full peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-4"
								style="background-color: {approvalRequired
									? selectedColor.text
									: selectedColor.toggle}"
							></div>
						</label>
					</div>

					<!-- Capacity -->
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-1">
							<div style="color: {selectedColor.lightText}">
								<svg
									width="18"
									height="18"
									viewBox="0 0 18 18"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M8.81949 3.74731C10.402 3.74731 11.992 4.0023 13.4995 4.5048C13.792 4.6023 13.9495 4.9248 13.852 5.2173C13.7545 5.5098 13.432 5.6748 13.1395 5.5698C10.3495 4.6398 7.28199 4.6398 4.49199 5.5698C4.19949 5.6673 3.87699 5.5098 3.77949 5.2173C3.68199 4.9248 3.83949 4.6023 4.13199 4.5048C5.64699 3.9948 7.23699 3.74731 8.81949 3.74731Z"
										fill="currentColor"
									/>
									<path
										d="M11.25 17.0625H6.75C2.6775 17.0625 0.9375 15.3225 0.9375 11.25V6.75C0.9375 2.6775 2.6775 0.9375 6.75 0.9375H11.25C15.3225 0.9375 17.0625 2.6775 17.0625 6.75V11.25C17.0625 15.3225 15.3225 17.0625 11.25 17.0625ZM6.75 2.0625C3.2925 2.0625 2.0625 3.2925 2.0625 6.75V11.25C2.0625 14.7075 3.2925 15.9375 6.75 15.9375H11.25C14.7075 15.9375 15.9375 14.7075 15.9375 11.25V6.75C15.9375 3.2925 14.7075 2.0625 11.25 2.0625H6.75Z"
										fill="currentColor"
									/>
									<path
										d="M11.6476 12.1613C11.5051 12.1613 11.3626 12.1088 11.2501 11.9963L9.00012 9.74625L6.75012 11.9963C6.53262 12.2138 6.17262 12.2138 5.95512 11.9963C5.73762 11.7788 5.73762 11.4188 5.95512 11.2013L8.60262 8.55375C8.82012 8.33625 9.18012 8.33625 9.39762 8.55375L12.0451 11.2013C12.2626 11.4188 12.2626 11.7788 12.0451 11.9963C11.9326 12.1088 11.7901 12.1613 11.6476 12.1613Z"
										fill="currentColor"
									/>
								</svg>
							</div>
							<span>Capacity</span>
						</div>
						<div class="relative" use:clickOutside={() => (openCapacityModal = false)}>
							<div class="flex items-center gap-1">
								<span class="" style="color: {selectedColor.lightText};">Unlimited</span>
								<button
									aria-label="edit"
									class="flex items-center gap-1"
									style="color: {selectedColor.lightText}"
									on:click={async () => {
										openCapacityModal = !openCapacityModal;
										await tick();
										scrollToId('capacity');
									}}
								>
									<svg
										width="14"
										height="15"
										viewBox="0 0 14 15"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M6.6875 1.875H5.5625C2.75 1.875 1.625 3 1.625 5.8125V9.1875C1.625 12 2.75 13.125 5.5625 13.125H8.9375C11.75 13.125 12.875 12 12.875 9.1875V8.0625"
											stroke="currentColor"
											stroke-width="0.84375"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<path
											d="M9.52231 2.44944L5.08981 6.88194C4.92106 7.05069 4.75231 7.38257 4.71856 7.62444L4.47668 9.31757C4.38668 9.93069 4.81981 10.3582 5.43293 10.2738L7.12606 10.0319C7.36231 9.99819 7.69419 9.82944 7.86856 9.66069L12.3011 5.22819C13.0661 4.46319 13.4261 3.57444 12.3011 2.44944C11.1761 1.32444 10.2873 1.68444 9.52231 2.44944Z"
											stroke="currentColor"
											stroke-width="0.84375"
											stroke-miterlimit="10"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<path
											d="M8.88672 3.07812C9.26359 4.4225 10.3155 5.47438 11.6655 5.85688"
											stroke="currentColor"
											stroke-width="0.84375"
											stroke-miterlimit="10"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								</button>
							</div>
							<CapacityModal open={openCapacityModal} />
						</div>
					</div>
				</div>
			</div>

			<div class="space-y-4 lg:hidden">
				<!-- Theme -->
				<div
					class="relative"
					use:clickOutside={() => {
						showThemeModal = false;
					}}
				>
					<button
						class="flex w-full items-center justify-between rounded-[9px] px-4 py-3"
						style="background-color: {selectedColor.cover};"
						on:click={() => (showThemeModal = !showThemeModal)}
					>
						<div class="flex items-center gap-2">
							<img
								src={`/${selectedStyle}.svg`}
								alt={selectedStyle}
								class="mb-1 h-[36.75px] w-[54px]"
							/>
							<div>
								<div class="text-xs" style="color: {selectedColor.lightText};">Theme</div>
								<div class="font-semibold">{selectedStyle}</div>
							</div>
						</div>
						<div aria-label="change theme" style="color: {selectedColor.lightText}">
							<svg
								width="14"
								height="14"
								viewBox="0 0 14 14"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M7.49329 2.20342L1.58329 8.11342C1.35829 8.33842 1.13329 8.78092 1.08829 9.10342L0.765788 11.3609C0.645788 12.1784 1.22329 12.7484 2.04079 12.6359L4.29829 12.3134C4.61329 12.2684 5.05579 12.0434 5.28829 11.8184L11.1983 5.90842C12.2183 4.88842 12.6983 3.70342 11.1983 2.20342C9.69829 0.703422 8.51329 1.18342 7.49329 2.20342Z"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-miterlimit="10"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M7.49329 2.20342L1.58329 8.11342C1.35829 8.33842 1.13329 8.78092 1.08829 9.10342L0.765788 11.3609C0.645788 12.1784 1.22329 12.7484 2.04079 12.6359L4.29829 12.3134C4.61329 12.2684 5.05579 12.0434 5.28829 11.8184L11.1983 5.90842C12.2183 4.88842 12.6983 3.70342 11.1983 2.20342C9.69829 0.703422 8.51329 1.18342 7.49329 2.20342Z"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-miterlimit="10"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M7.49329 2.20342L1.58329 8.11342C1.35829 8.33842 1.13329 8.78092 1.08829 9.10342L0.765788 11.3609C0.645788 12.1784 1.22329 12.7484 2.04079 12.6359L4.29829 12.3134C4.61329 12.2684 5.05579 12.0434 5.28829 11.8184L11.1983 5.90842C12.2183 4.88842 12.6983 3.70342 11.1983 2.20342C9.69829 0.703422 8.51329 1.18342 7.49329 2.20342Z"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-miterlimit="10"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M6.64453 3.05469C7.14703 4.84719 8.54953 6.24969 10.3495 6.75969"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-miterlimit="10"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M6.64453 3.05469C7.14703 4.84719 8.54953 6.24969 10.3495 6.75969"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-miterlimit="10"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M6.64453 3.05469C7.14703 4.84719 8.54953 6.24969 10.3495 6.75969"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-miterlimit="10"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<rect x="8.625" y="12.125" width="4.5" height="0.75" fill="currentColor" />
								<rect
									x="8.625"
									y="12.125"
									width="4.5"
									height="0.75"
									stroke="currentColor"
									stroke-width="0.75"
								/>
								<rect
									x="8.625"
									y="12.125"
									width="4.5"
									height="0.75"
									stroke="currentColor"
									stroke-width="0.75"
								/>
								<rect
									x="8.625"
									y="12.125"
									width="4.5"
									height="0.75"
									stroke="currentColor"
									stroke-width="0.75"
								/>
							</svg>
						</div>
					</button>
					<ThemeModal
						open={showThemeModal}
						bind:selectedStyle
						bind:selectedFont
						bind:selectedColor
					/>
				</div>

				<!-- AI & Settings -->
				<div
					class="relative"
					use:clickOutside={() => {
						showAIModalMobile = false;
					}}
				>
					<button
						class="flex w-full items-center gap-2 rounded-[9px] px-4 py-3 text-left"
						style="background-color: {selectedColor.cover};"
						on:click={async () => {
							showAIModalMobile = !showAIModalMobile;
							await tick();
							scrollToId('aiModal');
						}}
					>
						<div
							class="flex h-[34.75px] w-[54px] items-center justify-center rounded-[3.75px]"
							style="background-color: {selectedColor.smallCover}; color: {selectedColor.text}"
						>
							<svg
								width="22"
								height="22"
								viewBox="0 0 22 22"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M20.3271 1.90412C20.4297 2.12656 20.6033 2.30297 20.8321 2.40268L21.7869 2.81687C22.071 2.94727 22.071 3.33844 21.7869 3.46883L20.84 3.88302C20.6112 3.98273 20.4297 4.15915 20.335 4.38159L19.5853 6.08437C19.4512 6.35281 19.0488 6.35281 18.9147 6.08437L18.165 4.38159C18.0624 4.15915 17.8888 3.98273 17.6599 3.88302L16.7131 3.46883C16.429 3.33844 16.429 2.94727 16.7131 2.81687L17.6599 2.40268C17.8888 2.30297 18.0703 2.12656 18.165 1.90412L18.9147 0.201341C19.0488 -0.0671137 19.4512 -0.0671137 19.5853 0.201341L20.3271 1.90412ZM10.987 2.48647C11.0605 2.63944 11.1832 2.76182 11.3467 2.83066L12.0253 3.11365C12.2296 3.20543 12.2296 3.47314 12.0253 3.56492L11.3467 3.84791C11.1832 3.91675 11.0523 4.03913 10.987 4.1921L10.4555 5.36232C10.3574 5.54589 10.0712 5.54589 9.97307 5.36232L9.44169 4.1921C9.36807 4.03913 9.24542 3.91675 9.08191 3.84791L8.40329 3.56492C8.19893 3.47314 8.19893 3.20543 8.40329 3.11365L9.08191 2.83066C9.24542 2.76182 9.37624 2.63944 9.44169 2.48647L9.97307 1.31624C10.0712 1.13268 10.3574 1.13268 10.4555 1.31624L10.987 2.48647ZM1.57143 18.8571L0.265179 20.1356C-0.0883929 20.4901 -0.0883929 21.0574 0.265179 21.4119L0.587321 21.735C0.933036 22.0896 1.50661 22.0896 1.85232 21.7272L3.14286 20.4329L3.14066 20.4307L14.1429 9.42856L15.4582 8.11854C15.7996 7.76898 15.7996 7.14489 15.4582 6.80271L15.1985 6.54232C14.8497 6.20016 14.1429 6.28571 13.75 6.67856L1.57143 18.8571ZM18.8184 11.2338C18.6586 11.1568 18.5324 11.0285 18.4567 10.8574L17.9183 9.58256C17.8174 9.37725 17.5313 9.37725 17.4389 9.58256L16.9004 10.8574C16.8331 11.0199 16.6985 11.1568 16.5387 11.2338L15.8657 11.5419C15.6638 11.6445 15.6638 11.9355 15.8657 12.0295L16.5387 12.3376C16.6985 12.4146 16.8247 12.5429 16.9004 12.714L17.4389 13.9888C17.5397 14.1941 17.8258 14.1941 17.9183 13.9888L18.4567 12.714C18.524 12.5515 18.6586 12.4146 18.8184 12.3376L19.4914 12.0295C19.6933 11.9269 19.6933 11.6359 19.4914 11.5419L18.8184 11.2338ZM7.85714 9.42856C8.29109 9.42856 8.64286 9.0768 8.64286 8.64285C8.64286 8.2089 8.29109 7.85713 7.85714 7.85713C7.42319 7.85713 7.07143 8.2089 7.07143 8.64285C7.07143 9.0768 7.42319 9.42856 7.85714 9.42856ZM22 8.64285C22 9.0768 21.6482 9.42856 21.2143 9.42856C20.7803 9.42856 20.4286 9.0768 20.4286 8.64285C20.4286 8.2089 20.7803 7.85713 21.2143 7.85713C21.6482 7.85713 22 8.2089 22 8.64285ZM13.3571 1.57143C13.7911 1.57143 14.1429 1.21966 14.1429 0.785715C14.1429 0.351774 13.7911 2.04305e-06 13.3571 2.04305e-06C12.9232 2.04305e-06 12.5714 0.351774 12.5714 0.785715C12.5714 1.21966 12.9232 1.57143 13.3571 1.57143ZM14.1429 14.9286C14.1429 15.3625 13.7911 15.7143 13.3571 15.7143C12.9232 15.7143 12.5714 15.3625 12.5714 14.9286C12.5714 14.4946 12.9232 14.1428 13.3571 14.1428C13.7911 14.1428 14.1429 14.4946 14.1429 14.9286Z"
									fill="currentColor"
								/>
							</svg>
						</div>
						<div>
							<div class="text-xs" style="color: {selectedColor.lightText};">Create Event</div>
							<div class="font-semibold">Generate with AI</div>
						</div>
					</button>
					<AIModal open={showAIModalMobile} />
				</div>

				<div
					class="relative"
					use:clickOutside={() => {
						showSettingsModal = false;
					}}
				>
					<button
						class="flex w-full items-center gap-2 rounded-[9px] px-4 py-3 text-left"
						style="background-color: {selectedColor.cover};"
						on:click={() => (showSettingsModal = !showSettingsModal)}
					>
						<div
							class="flex h-[34.75px] w-[54px] items-center justify-center rounded-[3.75px]"
							style="background-color: {selectedColor.smallCover}; color: {selectedColor.lightText}"
						>
							<svg
								width="22"
								height="24"
								viewBox="0 0 22 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M4.93237 5.38691L4.75001 6.1144L4.93237 5.38691ZM8.30692 3.43861L7.58572 3.23279L8.30692 3.43861ZM2.23886 10.0522L2.77771 9.53053L2.23886 10.0522ZM2.23886 13.9488L1.70001 13.4271H1.70001L2.23886 13.9488ZM4.93237 18.6141L5.11472 19.3416L4.93237 18.6141ZM8.30692 20.5624L7.58572 20.7682L8.30692 20.5624ZM13.6939 20.5624L14.4151 20.7682L13.6939 20.5624ZM17.0685 18.6141L17.2509 17.8866L17.0685 18.6141ZM19.762 13.9488L19.2232 14.4705V14.4705L19.762 13.9488ZM19.762 10.0522L19.2232 9.53053V9.53053L19.762 10.0522ZM17.0685 5.38691L16.8861 4.65942L17.0685 5.38691ZM13.6939 3.43861L14.4151 3.23279L13.6939 3.43861ZM4.93237 5.38691L4.75001 6.1144C6.60892 6.58036 8.50221 5.48727 9.02813 3.64443L8.30692 3.43861L7.58572 3.23279C7.28195 4.29719 6.18841 4.92855 5.11472 4.65942L4.93237 5.38691ZM2.23886 10.0522L2.77771 9.53053C1.34244 8.048 2.74847 5.61269 4.75001 6.1144L4.93237 5.38691L5.11472 4.65942C1.64939 3.79079 -0.784913 8.00712 1.70001 10.5739L2.23886 10.0522ZM2.23886 13.9488L2.77771 14.4705C4.11069 13.0936 4.11069 10.9074 2.77771 9.53053L2.23886 10.0522L1.70001 10.5739C2.46993 11.3691 2.46992 12.6319 1.70001 13.4271L2.23886 13.9488ZM4.93237 18.6141L4.75001 17.8866C2.74847 18.3883 1.34244 15.953 2.77771 14.4705L2.23886 13.9488L1.70001 13.4271C-0.784914 15.9939 1.64939 20.2102 5.11472 19.3416L4.93237 18.6141ZM8.30692 20.5624L9.02813 20.3566C8.50221 18.5137 6.60892 17.4207 4.75001 17.8866L4.93237 18.6141L5.11472 19.3416C6.18841 19.0725 7.28195 19.7038 7.58572 20.7682L8.30692 20.5624ZM13.6939 20.5624L12.9727 20.3566C12.4065 22.3408 9.59441 22.3408 9.02813 20.3566L8.30692 20.5624L7.58572 20.7682C8.56613 24.2036 13.4347 24.2036 14.4151 20.7682L13.6939 20.5624ZM17.0685 18.6141L17.2509 17.8866C15.3919 17.4207 13.4987 18.5137 12.9727 20.3566L13.6939 20.5624L14.4151 20.7682C14.7189 19.7038 15.8125 19.0725 16.8861 19.3416L17.0685 18.6141ZM19.762 13.9488L19.2232 14.4705C20.6584 15.953 19.2524 18.3883 17.2509 17.8866L17.0685 18.6141L16.8861 19.3416C20.3515 20.2102 22.7858 15.9939 20.3009 13.4271L19.762 13.9488ZM19.762 10.0522L19.2232 9.53053C17.8902 10.9074 17.8902 13.0936 19.2232 14.4705L19.762 13.9488L20.3009 13.4271C19.5309 12.6319 19.5309 11.3691 20.3009 10.5739L19.762 10.0522ZM17.0685 5.38691L17.2509 6.1144C19.2524 5.61269 20.6584 8.048 19.2232 9.53053L19.762 10.0522L20.3009 10.5739C22.7858 8.00712 20.3515 3.79079 16.8861 4.65942L17.0685 5.38691ZM13.6939 3.43861L12.9727 3.64443C13.4987 5.48727 15.3919 6.58036 17.2509 6.1144L17.0685 5.38691L16.8861 4.65942C15.8125 4.92855 14.7189 4.29719 14.4151 3.23279L13.6939 3.43861ZM13.6939 3.43861L14.4151 3.23279C13.4347 -0.202596 8.56613 -0.202595 7.58572 3.23279L8.30692 3.43861L9.02813 3.64443C9.59441 1.66019 12.4065 1.66019 12.9727 3.64443L13.6939 3.43861ZM8.00043 12.0005H7.25043C7.25043 14.0716 8.92937 15.7505 11.0004 15.7505V15.0005V14.2505C9.75779 14.2505 8.75043 13.2431 8.75043 12.0005H8.00043ZM11.0004 15.0005V15.7505C13.0715 15.7505 14.7504 14.0716 14.7504 12.0005H14.0004H13.2504C13.2504 13.2431 12.2431 14.2505 11.0004 14.2505V15.0005ZM14.0004 12.0005H14.7504C14.7504 9.92944 13.0715 8.2505 11.0004 8.2505V9.0005V9.7505C12.2431 9.7505 13.2504 10.7579 13.2504 12.0005H14.0004ZM11.0004 9.0005V8.2505C8.92937 8.2505 7.25043 9.92944 7.25043 12.0005H8.00043H8.75043C8.75043 10.7579 9.75779 9.7505 11.0004 9.7505V9.0005Z"
									fill="currentColor"
								/>
							</svg>
						</div>
						<div>
							<div class="text-xs" style="color: {selectedColor.lightText};">Action</div>
							<div class="font-semibold">Quick Settings</div>
						</div>
					</button>
					<SettingsModal open={showSettingsModal} />
				</div>
			</div>

			<!-- Submit -->
			<button
				class="h-[49.5px] w-full rounded-[9.75px] py-2 font-semibold transition"
				style="background-color: {selectedColor.button}; color: {selectedColor.buttonText}"
			>
				Create Event
			</button>
		</div>
	</main>
</div>
