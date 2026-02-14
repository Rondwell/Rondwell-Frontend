<script lang="ts">
	import SubscriberDetailModal from '../../people/SubscriberDetailModal.svelte';

	// Mock data

	let subscribers = [
		{
			id: '1',
			name: 'John Odoemene',
			payment: '$48.00',
			events: [
				{
					title: 'Megaexe Party',
					date: 'Jan 25',
					status: 'Attending'
				}
			],

			email: 'johnmedoc23@gmail.com',
			joinedAt: formatDate(new Date())
		},
		{
			id: '2',
			name: 'Joe Ken',
			payment: '',
			events: [
				{
					title: 'Multiflex Party',
					date: 'September 25',
					status: 'Not attending'
				}
			],
			email: 'smartme783@gmail.com',
			joinedAt: formatDate(new Date())
		},
		{
			id: '3',
			name: '',
			payment: '$128.00',
			events: [
				{
					title: 'Pool Party',
					date: 'Dec 26',
					status: 'Attending'
				}
			],
			email: 'johnmedoce23@gmail.com',
			joinedAt: formatDate(new Date())
		}
	];
	let searchQuery = '';

	function formatDate(date: Date) {
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	// Derived state
	$: subscriberCount = subscribers?.length;

	// Modal state
	let selectedSubscriber: any = null;
	let isSubscriberModalOpen = false;

	function openSubscriber(subscriber: any) {
		selectedSubscriber = {
			...subscriber,
			events: subscriber.events ?? [],
			eventsCount: subscriber.events?.length ?? 0,
			checkIns: 0,
			revenue: 0,
			tags: []
		};

		isSubscriberModalOpen = true;
	}

	function closeSubscriberModal() {
		selectedSubscriber = null;
		isSubscriberModalOpen = false;
	}
</script>

<section class="p-4">
	<!-- Header -->
	<div class="lg-block hidden sm:justify-between md:mb-10 md:flex">
		<div class="flex items-center justify-between">
			<img src="/tech-icon.svg" alt="icon" class="h-7 w-7" />
			<h1 class="text-md ml-2 lg:text-2xl">Business Collection</h1>
		</div>
		<button
			class="flex w-fit items-center gap-2 whitespace-nowrap rounded-md bg-[#DCE4EE] px-3 text-[#5D646F] md:text-sm"
		>
			<span class="md:text-sm">Calendar Page</span>
			<svg
				width="16"
				height="16"
				viewBox="0 0 16 16"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M1.24306 6.4387C1.40611 5.40243 2.12888 4.62786 3.0931 4.47826L9.69034 3.43935L9.8408 3.42097C10.5948 3.35739 11.3249 3.72187 11.7721 4.3912C12.2195 5.06073 12.3131 5.92902 12.0244 6.68931L11.9618 6.83923L9.01457 13.3413L9.01326 13.3411C8.84871 13.7088 8.61528 14.0066 8.33157 14.2308C7.8792 14.5883 7.31432 14.7405 6.72781 14.6481C5.77143 14.4963 5.05093 13.7247 4.89305 12.6922L4.591 10.7138C4.53659 10.3578 4.3245 10.0403 4.02548 9.86912L4.02494 9.8683L2.3872 8.94152C1.53287 8.45922 1.08026 7.47484 1.24306 6.4387ZM2.76439 5.88928C2.52769 6.07636 2.39626 6.36366 2.35324 6.63719L2.35378 6.638C2.28828 7.04462 2.40721 7.57568 2.91465 7.86476L4.55152 8.78851L4.66279 8.85692C5.17357 9.19045 5.53909 9.73754 5.67294 10.3689L5.69839 10.5051L6.00044 12.4835L6.00098 12.4843C6.09306 13.0997 6.52266 13.3845 6.9 13.4426C7.27991 13.5012 7.75745 13.3662 8.00792 12.8142L10.9559 6.31145C11.1348 5.91836 11.1012 5.47237 10.8636 5.11651C10.6258 4.7606 10.2457 4.58735 9.84651 4.65089L9.84575 4.6515L3.24253 5.68148C3.04601 5.71271 2.88934 5.79056 2.76439 5.88928Z"
					fill="#5D646F"
					stroke="#5D646F"
					stroke-width="0.37461"
				/>
				<rect
					x="7.25931"
					y="8.68484"
					width="3.5114"
					height="1.15881"
					rx="0.579404"
					transform="rotate(144 7.25931 8.68484)"
					fill="#5D646F"
					stroke="#5D646F"
					stroke-width="0.37461"
				/>
			</svg>
		</button>
	</div>
	<div class="mb-4 flex items-center justify-between">
		<h2 class="align-center flex justify-center gap-2 text-lg font-semibold">
			<span> Event Tags </span>
			<div class="relative inline-flex items-center justify-center">
				<img src="/circle.svg" alt="" class="h-6 w-6" />
				<span class="absolute text-xs">{subscriberCount}</span>
			</div>
		</h2>
	</div>

	<!-- Description -->
	<p class="mb-4 text-sm text-[#737577]">
		Allow visitors to filter events by categories on the collection page.
	</p>

	<div class="mb-4 gap-3">
		<div class="relative w-full">
			<div
				class="mb-2 h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pl-10 pr-4 text-[#C5C6C6]"
			></div>
			<div class="absolute left-3 top-2.5 flex items-center justify-between gap-4">
				<span class=" text-gray-400">
					<svg
						width="11"
						height="10"
						viewBox="0 0 11 10"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<ellipse cx="5.5" cy="5" rx="5.5" ry="5" fill="#EAAB26" />
					</svg>
				</span>
				<span>Plan</span>
			</div>

			<div class="absolute right-0 top-2.5 flex items-center justify-between gap-10">
				<span class="text-[#A9AAAA]"> 0 Events</span>

				<span class="border-l px-4 py-1.5 text-gray-400">
					<svg
						width="20"
						height="3"
						viewBox="0 0 20 3"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M1.90176 3C1.39476 3 0.955369 2.86747 0.583573 2.60241C0.211776 2.33133 0.017428 1.99699 0.000528107 1.5994C-0.0079217 1.30422 0.0850274 1.03614 0.279375 0.795181C0.482173 0.554217 0.744121 0.361446 1.06522 0.216867C1.38631 0.0722891 1.72431 0 2.07921 0C2.69605 0 3.16502 0.138554 3.48612 0.415663C3.80722 0.692771 3.97199 1.01807 3.98044 1.39157C3.99734 1.69277 3.90862 1.96687 3.71427 2.21386C3.51992 2.45482 3.2622 2.64759 2.9411 2.79217C2.62 2.93072 2.27356 3 1.90176 3Z"
							fill="#A9AAAA"
						/>
						<path
							d="M9.45222 3C8.94523 3 8.50583 2.86747 8.13404 2.60241C7.76224 2.33133 7.56789 1.99699 7.55099 1.5994C7.54254 1.30422 7.63549 1.03614 7.82984 0.795181C8.03264 0.554217 8.29458 0.361446 8.61568 0.216867C8.93678 0.0722891 9.27477 0 9.62967 0C10.2465 0 10.7155 0.138554 11.0366 0.415663C11.3577 0.692771 11.5225 1.01807 11.5309 1.39157C11.5478 1.69277 11.4591 1.96687 11.2647 2.21386C11.0704 2.45482 10.8127 2.64759 10.4916 2.79217C10.1705 2.93072 9.82402 3 9.45222 3Z"
							fill="#A9AAAA"
						/>
						<path
							d="M17.0027 3C16.4957 3 16.0563 2.86747 15.6845 2.60241C15.3127 2.33133 15.1184 1.99699 15.1015 1.5994C15.093 1.30422 15.186 1.03614 15.3803 0.795181C15.5831 0.554217 15.845 0.361446 16.1661 0.216867C16.4872 0.0722891 16.8252 0 17.1801 0C17.797 0 18.2659 0.138554 18.587 0.415663C18.9081 0.692771 19.0729 1.01807 19.0814 1.39157C19.0983 1.69277 19.0095 1.96687 18.8152 2.21386C18.6208 2.45482 18.3631 2.64759 18.042 2.79217C17.7209 2.93072 17.3745 3 17.0027 3Z"
							fill="#A9AAAA"
						/>
					</svg>
				</span>
			</div>
		</div>
		<div class="mb-3 flex items-center justify-between">
			<button
				class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#333537] px-3 py-2 text-xs text-[#FFFFFF] md:text-sm"
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 14 14"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<rect x="6" width="1.5" height="13.5" rx="0.75" fill="white" />
					<rect
						y="7.5"
						width="1.5"
						height="13.5"
						rx="0.75"
						transform="rotate(-90 0 7.5)"
						fill="white"
					/>
				</svg>

				Create Tag
			</button>
		</div>
	</div>

	<div class="mb-4 flex items-center justify-between">
		<h2 class="align-center flex justify-center gap-2 text-lg font-semibold">
			<span> Member Tag </span>
			<div class="relative inline-flex items-center justify-center">
				<img src="/circle.svg" alt="" class="h-6 w-6" />
				<span class="absolute text-xs">{subscriberCount}</span>
			</div>
		</h2>
	</div>
	<p class="mb-4 text-sm text-[#737577]">
		Organize your audience with member tags. These tags are only visible to admins.
	</p>

	<div class=" gap-3">
		<div class="relative w-full">
			<div
				class="mb-2 h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pl-10 pr-4 text-[#C5C6C6]"
			></div>
			<div class="absolute left-3 top-2.5 flex items-center justify-between gap-4">
				<span class=" text-gray-400">
					<svg
						width="11"
						height="10"
						viewBox="0 0 11 10"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<ellipse cx="5.5" cy="5" rx="5.5" ry="5" fill="#EAAB26" />
					</svg>
				</span>
				<span>Crypto</span>
			</div>

			<div class="absolute right-0 top-2.5 flex items-center justify-between gap-10">
				<span class="text-[#A9AAAA]"> 0 Events</span>

				<span class="border-l px-4 py-1.5 text-gray-400">
					<svg
						width="20"
						height="3"
						viewBox="0 0 20 3"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M1.90176 3C1.39476 3 0.955369 2.86747 0.583573 2.60241C0.211776 2.33133 0.017428 1.99699 0.000528107 1.5994C-0.0079217 1.30422 0.0850274 1.03614 0.279375 0.795181C0.482173 0.554217 0.744121 0.361446 1.06522 0.216867C1.38631 0.0722891 1.72431 0 2.07921 0C2.69605 0 3.16502 0.138554 3.48612 0.415663C3.80722 0.692771 3.97199 1.01807 3.98044 1.39157C3.99734 1.69277 3.90862 1.96687 3.71427 2.21386C3.51992 2.45482 3.2622 2.64759 2.9411 2.79217C2.62 2.93072 2.27356 3 1.90176 3Z"
							fill="#A9AAAA"
						/>
						<path
							d="M9.45222 3C8.94523 3 8.50583 2.86747 8.13404 2.60241C7.76224 2.33133 7.56789 1.99699 7.55099 1.5994C7.54254 1.30422 7.63549 1.03614 7.82984 0.795181C8.03264 0.554217 8.29458 0.361446 8.61568 0.216867C8.93678 0.0722891 9.27477 0 9.62967 0C10.2465 0 10.7155 0.138554 11.0366 0.415663C11.3577 0.692771 11.5225 1.01807 11.5309 1.39157C11.5478 1.69277 11.4591 1.96687 11.2647 2.21386C11.0704 2.45482 10.8127 2.64759 10.4916 2.79217C10.1705 2.93072 9.82402 3 9.45222 3Z"
							fill="#A9AAAA"
						/>
						<path
							d="M17.0027 3C16.4957 3 16.0563 2.86747 15.6845 2.60241C15.3127 2.33133 15.1184 1.99699 15.1015 1.5994C15.093 1.30422 15.186 1.03614 15.3803 0.795181C15.5831 0.554217 15.845 0.361446 16.1661 0.216867C16.4872 0.0722891 16.8252 0 17.1801 0C17.797 0 18.2659 0.138554 18.587 0.415663C18.9081 0.692771 19.0729 1.01807 19.0814 1.39157C19.0983 1.69277 19.0095 1.96687 18.8152 2.21386C18.6208 2.45482 18.3631 2.64759 18.042 2.79217C17.7209 2.93072 17.3745 3 17.0027 3Z"
							fill="#A9AAAA"
						/>
					</svg>
				</span>
			</div>
		</div>
	</div>

	<div class="mb-4 gap-3">
		<div class="relative w-full">
			<div
				class="mb-2 h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pl-10 pr-4 text-[#C5C6C6]"
			></div>
			<div class="absolute left-3 top-2.5 flex items-center justify-between gap-4">
				<span class=" text-gray-400">
					<svg
						width="10"
						height="10"
						viewBox="0 0 10 10"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<circle cx="4.875" cy="4.875" r="4.875" fill="#EA2630" />
					</svg>
				</span>
				<span>New Group</span>
			</div>

			<div class="absolute right-0 top-2.5 flex items-center justify-between gap-10">
				<span class="text-[#A9AAAA]"> 0 Events</span>

				<span class="border-l px-4 py-1.5 text-gray-400">
					<svg
						width="20"
						height="3"
						viewBox="0 0 20 3"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M1.90176 3C1.39476 3 0.955369 2.86747 0.583573 2.60241C0.211776 2.33133 0.017428 1.99699 0.000528107 1.5994C-0.0079217 1.30422 0.0850274 1.03614 0.279375 0.795181C0.482173 0.554217 0.744121 0.361446 1.06522 0.216867C1.38631 0.0722891 1.72431 0 2.07921 0C2.69605 0 3.16502 0.138554 3.48612 0.415663C3.80722 0.692771 3.97199 1.01807 3.98044 1.39157C3.99734 1.69277 3.90862 1.96687 3.71427 2.21386C3.51992 2.45482 3.2622 2.64759 2.9411 2.79217C2.62 2.93072 2.27356 3 1.90176 3Z"
							fill="#A9AAAA"
						/>
						<path
							d="M9.45222 3C8.94523 3 8.50583 2.86747 8.13404 2.60241C7.76224 2.33133 7.56789 1.99699 7.55099 1.5994C7.54254 1.30422 7.63549 1.03614 7.82984 0.795181C8.03264 0.554217 8.29458 0.361446 8.61568 0.216867C8.93678 0.0722891 9.27477 0 9.62967 0C10.2465 0 10.7155 0.138554 11.0366 0.415663C11.3577 0.692771 11.5225 1.01807 11.5309 1.39157C11.5478 1.69277 11.4591 1.96687 11.2647 2.21386C11.0704 2.45482 10.8127 2.64759 10.4916 2.79217C10.1705 2.93072 9.82402 3 9.45222 3Z"
							fill="#A9AAAA"
						/>
						<path
							d="M17.0027 3C16.4957 3 16.0563 2.86747 15.6845 2.60241C15.3127 2.33133 15.1184 1.99699 15.1015 1.5994C15.093 1.30422 15.186 1.03614 15.3803 0.795181C15.5831 0.554217 15.845 0.361446 16.1661 0.216867C16.4872 0.0722891 16.8252 0 17.1801 0C17.797 0 18.2659 0.138554 18.587 0.415663C18.9081 0.692771 19.0729 1.01807 19.0814 1.39157C19.0983 1.69277 19.0095 1.96687 18.8152 2.21386C18.6208 2.45482 18.3631 2.64759 18.042 2.79217C17.7209 2.93072 17.3745 3 17.0027 3Z"
							fill="#A9AAAA"
						/>
					</svg>
				</span>
			</div>
		</div>
		<div class="mb-3 flex items-center justify-between">
			<button
				class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#333537] px-3 py-2 text-xs text-[#FFFFFF] md:text-sm"
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 14 14"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<rect x="6" width="1.5" height="13.5" rx="0.75" fill="white" />
					<rect
						y="7.5"
						width="1.5"
						height="13.5"
						rx="0.75"
						transform="rotate(-90 0 7.5)"
						fill="white"
					/>
				</svg>

				Create Tag
			</button>
		</div>
	</div>
</section>
