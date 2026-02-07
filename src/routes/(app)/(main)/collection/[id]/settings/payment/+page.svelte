<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import CapacityModal from '../../../../../create-event/components/CapacityModal.svelte';
	import GroupRegistrationModal from '../../../../events/[id]/registration/components/modal/GroupRegistrationModal.svelte';
	import AddTicket from '../../../../events/[id]/registration/components/modal/AddTicket.svelte';
	import DeleteTicket from '../../../../events/[id]/registration/components/modal/DeleteTicket.svelte';
	import EmailTemplate from '../../../../events/[id]/registration/components/modal/EmailTemplate.svelte';
	import EventLocationModal from '../../../../../create-event/components/EventLocationModal.svelte';
	import { createEventDispatcher, tick } from 'svelte';

	// ✅ Payment Method Options
	let paymentOptions = [
		{ id: 'paystack', label: 'Paystack', icon: '/paystack.svg', enabled: false },
		{ id: 'flutterwave', label: 'Flutterwave', icon: '/Logo_Flutterwave Logo.svg', enabled: false },
		{ id: 'stripe', label: 'Stripe', icon: '/Stripe.svg', enabled: false }
	];

	const toggleOption = (id: string) => {
		paymentOptions = paymentOptions.map((option) =>
			option.id === id ? { ...option, enabled: !option.enabled } : option
		);
	};
	let eventData = {
		title: 'Megaexe Party',
		collection: 'John Collection',
		status: 'Ticket',
		tickets: [
			{
				id: 1,
				type: 'Standard',
				price: 'Free',
				requireApproval: true,
				available: 2,
				registered: 2,
				status: 'Available',
				availableUntil: 'Oct 25',
				capacity: '250'
			},
			{
				id: 2,
				type: 'Standard',
				price: 'Free',
				requireApproval: true,
				available: 0,
				registered: 2,
				status: 'Available',
				availableUntil: '',
				capacity: ''
			}
		],
		registrationEmails: [
			{
				id: 1,
				type: 'Pending Approval / Waitlist',
				status: 'Pending',
				icon: 'gray',
				title: 'Pending Approval / Waitlist Email',
				description:
					'This email is sent when a guest registers for the event, notifying them that their registration is pending approval or that they are on the waitlist.',
				subject: 'Registration pending approval for Megaexe Party'
			},
			{
				id: 2,
				type: 'Confirmation Email',
				status: 'Active',
				icon: 'check',
				title: 'Confirmation Email',
				description:
					'This email is sent when a guest registers or when you approve a guest who is pending approval.',
				subject: 'Registration confirmed for Megaexe Party'
			},
			{
				id: 3,
				type: 'Decline Email',
				status: 'Inactive',
				icon: 'cancel',
				title: 'Declined Email',
				description:
					'This email is sent when you decline a guest who is pending approval or on the waitlist.',
				subject: 'Registration not accepted for Megaexe Party'
			}
		]
	};

	let showCapacityModal = false;
	let showGroupRegisterModal = false;
	let showAddTicketType = false;
	let showUpdateTicket: number | null = null;
	let showDeleteTicket: number | null = null;
	let showEmailTemplate: number | null = null;

	// Function to toggle ticket approval requirement
	let buttonOpen = false;
	let paymentMethod = 'Paystack';
	const toggleRequireApproval = (ticketId: number) => {
		const index = eventData.tickets.findIndex((t) => t.id === ticketId);
		if (index !== -1) {
			// Toggle the flag
			eventData.tickets[index].requireApproval = !eventData.tickets[index].requireApproval;

			// Force Svelte to detect the change by reassigning
			eventData = { ...eventData, tickets: [...eventData.tickets] };

			console.log(
				'Toggled require approval for ticket:',
				ticketId,
				'→',
				eventData.tickets[index].requireApproval
			);
		}
	};

	let layout: 'grid' | 'list' = 'grid';

	const toggleLayout = () => {
		layout = layout === 'grid' ? 'list' : 'grid';
	};

	let menuOpen: number | null = null;

	const toggleMenu = (id: number) => {
		menuOpen = menuOpen === id ? null : id;
	};

	// Function to start selling (Stripe setup)
	const startSelling = () => {
		console.log('Starting selling with Stripe...');
		// In a real app, this would redirect to Stripe setup
	};

	let openEventLocationModal = false;
	const dispatch = createEventDispatcher<{
		close: void;
		collection: void;
		submit: {
			// eventLocation: string;
			// eventOrganizer: string;
			// locationName: string;
			location: string;
		};
	}>();
	let location = '';

	let eventsInfo = '';
</script>

<!-- Action Buttons -->

<div class="mb-6">
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-lg font-semibold">Ticket Sales</h2>
	</div>

	<!-- Start Selling Banner -->
	<div class="mb-4 rounded-lg border bg-white p-4">
		<div class="flex flex-col items-start justify-between gap-3">
			<div class="flex flex-col items-start gap-2">
				<img src="/get-ticket.svg" alt="get-ticket" />
				<p class="text-sm text-gray-600">
					<span class="block font-medium text-black">Start Selling.</span>
					<span class="text-[#919193]"
						>Start selling tickets to your events by creating a Stripe account. It usually takes
						less tha 5 minutes to setup.</span
					>
				</p>
			</div>
			<button
				class="flex w-fit items-center justify-center gap-2 rounded-sm bg-black p-2 text-white"
			>
				Get Started
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M1.24306 6.4387C1.40611 5.40243 2.12888 4.62786 3.0931 4.47826L9.69034 3.43935L9.8408 3.42097C10.5948 3.35739 11.3249 3.72187 11.7721 4.3912C12.2195 5.06073 12.3131 5.92902 12.0244 6.68931L11.9618 6.83923L9.01457 13.3413L9.01326 13.3411C8.84871 13.7088 8.61528 14.0066 8.33157 14.2308C7.8792 14.5883 7.31432 14.7405 6.72781 14.6481C5.77143 14.4963 5.05093 13.7247 4.89305 12.6922L4.591 10.7138C4.53659 10.3578 4.3245 10.0403 4.02548 9.86912L4.02494 9.8683L2.3872 8.94152C1.53287 8.45922 1.08026 7.47484 1.24306 6.4387ZM2.76439 5.88928C2.52769 6.07636 2.39626 6.36366 2.35324 6.63719L2.35378 6.638C2.28828 7.04462 2.40721 7.57568 2.91465 7.86476L4.55152 8.78851L4.66279 8.85692C5.17357 9.19045 5.53909 9.73754 5.67294 10.3689L5.69839 10.5051L6.00044 12.4835L6.00098 12.4843C6.09306 13.0997 6.52266 13.3845 6.9 13.4426C7.27991 13.5012 7.75745 13.3662 8.00792 12.8142L10.9559 6.31145C11.1348 5.91836 11.1012 5.47237 10.8636 5.11651C10.6258 4.7606 10.2457 4.58735 9.84651 4.65089L9.84575 4.6515L3.24253 5.68148C3.04601 5.71271 2.88934 5.79056 2.76439 5.88928Z"
						fill="#fff"
						stroke="#fff"
						stroke-width="0.37461"
					/>
					<rect
						x="7.25931"
						y="8.68484"
						width="3.5114"
						height="1.15881"
						rx="0.579404"
						transform="rotate(144 7.25931 8.68484)"
						fill="#fff"
						stroke="#fff"
						stroke-width="0.37461"
					/>
				</svg>
			</button>
		</div>
	</div>

	<div class="mb-4 flex flex-col border-y">
		<div class="mb-4 flex flex-col">
			<div class="flex items-center justify-between pr-4 pt-4">
				<span>Coupons</span>
				<button class="flex w-fit items-center justify-center gap-1 rounded-md bg-[#EBECED] p-2">
					<svg
						width="18"
						height="18"
						viewBox="0 0 18 18"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M14.9766 6.75C15.3876 6.75 15.7266 7.08895 15.7266 7.5V13.5C15.7266 14.7997 15.4754 15.7531 14.8525 16.376C14.2296 16.9989 13.2763 17.25 11.9766 17.25H5.97656C4.67685 17.25 3.72349 16.9989 3.10059 16.376C2.47768 15.7531 2.22656 14.7997 2.22656 13.5V7.5C2.22656 7.08895 2.56551 6.75 2.97656 6.75H14.9766ZM3.72656 13.5C3.72656 14.4674 3.8567 15.0032 4.16504 15.3115C4.47338 15.6199 5.00919 15.75 5.97656 15.75H11.9766C12.9439 15.75 13.4797 15.6199 13.7881 15.3115C14.0964 15.0032 14.2266 14.4674 14.2266 13.5V8.25H3.72656V13.5Z"
							fill="#616265"
							stroke="#616265"
							stroke-width="0.375"
						/>
						<path
							d="M14.625 3C15.3015 3 15.8683 3.21005 16.2666 3.6084C16.6649 4.00675 16.875 4.57352 16.875 5.25V6C16.875 6.67648 16.6649 7.24325 16.2666 7.6416C15.8683 8.03995 15.3015 8.25 14.625 8.25H3.375C2.68348 8.25 2.11453 8.05203 1.71875 7.65625C1.32297 7.26047 1.125 6.69151 1.125 6V5.25C1.125 4.55848 1.32297 3.98953 1.71875 3.59375C2.11453 3.19797 2.68348 3 3.375 3H14.625ZM3.375 4.5C3.04916 4.5 2.87862 4.56279 2.7832 4.6582C2.68779 4.75362 2.625 4.92416 2.625 5.25V6C2.625 6.32584 2.68779 6.49638 2.7832 6.5918C2.87862 6.68721 3.04916 6.75 3.375 6.75H14.625C14.9342 6.75 15.1085 6.68448 15.209 6.58398C15.3095 6.48349 15.375 6.30922 15.375 6V5.25C15.375 4.94078 15.3095 4.76651 15.209 4.66602C15.1085 4.56552 14.9342 4.5 14.625 4.5H3.375Z"
							fill="#616265"
							stroke="#616265"
							stroke-width="0.375"
						/>
						<path
							d="M5.14648 1.17969C5.7147 0.611535 6.65152 0.611524 7.21973 1.17969L9.25977 3.21973C9.46995 3.42991 9.53999 3.75955 9.41895 4.04199L9.41797 4.04102C9.30487 4.3225 9.03399 4.49994 8.72949 4.5H4.58887C4.37843 4.49987 4.17953 4.41008 4.04004 4.26074L4.03809 4.25879C3.51389 3.68292 3.53061 2.79654 4.08203 2.24512L5.14648 1.17969ZM5.44727 3H6.9248L6.18359 2.2627L5.44727 3Z"
							fill="#616265"
							stroke="#616265"
							stroke-width="0.375"
						/>
						<path
							d="M10.7744 1.17969C11.3425 0.611781 12.2785 0.611929 12.8467 1.17969L13.9121 2.24512C14.4621 2.79516 14.4892 3.68223 13.9551 4.25977L13.9541 4.26074C13.8145 4.41028 13.615 4.5 13.4043 4.5H9.26465C8.96891 4.5 8.68886 4.32398 8.5752 4.04102C8.45342 3.75661 8.5266 3.43838 8.73145 3.22363L8.73438 3.21973L10.7744 1.17969ZM11.082 3H12.5537L11.8174 2.26367L11.082 3Z"
							fill="#616265"
							stroke="#616265"
							stroke-width="0.375"
						/>
						<path
							d="M11.2373 6.75C11.6482 6.75015 11.9873 7.08904 11.9873 7.5V11.3477C11.9872 11.9023 11.6875 12.4075 11.1982 12.666L11.1992 12.667C10.7087 12.9337 10.1164 12.8983 9.65527 12.5908H9.6543L8.9873 12.1406L8.98633 12.1396V12.1406L8.98535 12.1416L8.28027 12.6064C8.03144 12.7771 7.74047 12.8623 7.45703 12.8623C7.21665 12.8623 6.96877 12.8024 6.74609 12.6826H6.74512C6.2576 12.4175 5.95703 11.9114 5.95703 11.3623V7.5C5.95703 7.08895 6.29598 6.75 6.70703 6.75H11.2373ZM7.45703 11.3545L7.45801 11.3555L8.16406 10.8906C8.63704 10.5782 9.23936 10.5582 9.72363 10.833L9.81934 10.8916L10.4854 11.3398L10.4873 11.3389V8.24219H7.45703V11.3545Z"
							fill="#616265"
							stroke="#616265"
							stroke-width="0.375"
						/>
					</svg>

					Create</button
				>
			</div>
			<span class="text-md text-[#84857A]"
				>Create coupons that can be applied to any event managed by your calendar.
			</span>
		</div>

		<div class="py-4 pl-4">
			<div class="flex gap-1 rounded-md bg-white py-4 pl-4 text-[#A9AAAA]">
				<svg
					width="51"
					height="52"
					viewBox="0 0 51 52"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<g filter="url(#filter0_d_1_3080)">
						<path
							opacity="0.4"
							d="M39.7109 18.875V33.375C39.7109 38.8125 37.8672 40.625 32.3359 40.625H17.5859C12.0547 40.625 10.2109 38.8125 10.2109 33.375V18.875H39.7109Z"
							fill="#FEFEFE"
						/>
						<path
							d="M42.5313 13.4375V15.25C42.5313 17.2438 41.5541 18.875 38.8438 18.875H11.1875C8.36656 18.875 7.5 17.2438 7.5 15.25V13.4375C7.5 11.4438 8.36656 9.8125 11.1875 9.8125H38.8438C41.5541 9.8125 42.5313 11.4438 42.5313 13.4375Z"
							fill="#E8E8E8"
						/>
						<path
							opacity="0.4"
							d="M24.3491 9.93297H14.1716C13.5447 9.26234 13.5631 8.22922 14.2269 7.57672L16.845 5.00297C17.5272 4.33234 18.6519 4.33234 19.3341 5.00297L24.3491 9.93297Z"
							fill="#FDFDFD"
						/>
						<path
							opacity="0.4"
							d="M35.8416 9.93297H25.6641L30.6791 5.00297C31.3612 4.33234 32.4859 4.33234 33.1681 5.00297L35.7863 7.57672C36.45 8.22922 36.4684 9.26234 35.8416 9.93297Z"
							fill="#FDFDFD"
						/>
						<path
							opacity="0.6"
							d="M19.375 18.875V28.1913C19.375 29.6413 20.9975 30.4931 22.2328 29.7138L23.9659 28.59C24.5928 28.1913 25.3856 28.1913 25.9941 28.59L27.635 29.6775C28.8519 30.475 30.4928 29.6231 30.4928 28.1731V18.875H19.375Z"
							fill="#E8E8E8"
						/>
					</g>
					<defs>
						<filter
							id="filter0_d_1_3080"
							x="-1.90735e-06"
							y="-1.19209e-06"
							width="50.0313"
							height="51.125"
							filterUnits="userSpaceOnUse"
							color-interpolation-filters="sRGB"
						>
							<feFlood flood-opacity="0" result="BackgroundImageFix" />
							<feColorMatrix
								in="SourceAlpha"
								type="matrix"
								values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
								result="hardAlpha"
							/>
							<feOffset dy="3" />
							<feGaussianBlur stdDeviation="3.75" />
							<feComposite in2="hardAlpha" operator="out" />
							<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
							<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_3080" />
							<feBlend
								mode="normal"
								in="SourceGraphic"
								in2="effect1_dropShadow_1_3080"
								result="shape"
							/>
						</filter>
					</defs>
				</svg>

				<div class="flex flex-col gap-2">
					<span>No coupon</span>
					<span>You have not set any coupons</span>
				</div>
			</div>
		</div>
	</div>

	<div class="mb-4 mt-6">
		<label class="flex text-gray-900"> Select Payment Method </label>

		<span class="text-[#8C8F93]"
			>Choose how guest are able to pay for your event.<br class="block lg:hidden" /> some payment
			method may require additional <br class="block lg:hidden" /> configuration in Stripe.</span
		>

		<div use:clickOutside={() => (buttonOpen = false)} class="relative w-full">
			<button
				class="mb-2 flex w-full cursor-pointer items-center justify-between rounded-lg border bg-white p-3 text-sm font-medium text-[#B3B5B7]"
				on:click={() => (buttonOpen = !buttonOpen)}
			>
				<span class="flex items-center gap-1">
					{paymentMethod ? paymentMethod : 'Select option'}
				</span>
				<img src="/arrow-left.svg" alt="" class="rotate-90" />
			</button>

			{#if buttonOpen}
				<div class="absolute left-0 z-10 w-full rounded-lg border bg-white p-2 shadow-lg">
					<div class="flex flex-col gap-2">
						{#each paymentOptions as option}
							<button
								class="flex w-full items-center justify-between rounded-sm p-2"
								on:click={() => (paymentMethod = option.label)}
							>
								<div class="flex items-center gap-2">
									<div class="flex h-12 w-12 items-center justify-center rounded-full border">
										<img src={option.icon} alt="" />
									</div>
									<div class="truncate rounded-2xl px-2 py-1 text-xs font-medium">
										{option.label}
									</div>
									<span class="rounded-xl bg-gray-100 px-2 py-1 text-gray-300">soon</span>
								</div>

								<!-- Toggle Switch -->
								<div
									class="flex h-5 w-8 cursor-pointer items-center rounded-full p-1"
									class:bg-gray-300={!option.enabled}
									class:bg-black={option.enabled}
									on:click|stopPropagation={() => toggleOption(option.id)}
								>
									<div
										class="h-4 w-4 rounded-full bg-white shadow-md transition-all"
										class:translate-x-2={option.enabled}
									></div>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<div class="mb-8 flex flex-col gap-4 border-y pt-6">
		<h2 class="text-xl font-bold">Refund Policy</h2>
		<p class="leading-relaxed text-[#84857A]">
			Specify a refund policy to be shown on event pages and the <a href="#" class="text-[#F3358B]"
				>refund policy <br class="hidden lg:block" /> page</a
			> .
		</p>
		<div class="py-4">
			<div class="flex gap-1 rounded-md bg-white py-4 pl-4 text-[#A9AAAA]">
				<svg
					width="51"
					height="52"
					viewBox="0 0 51 52"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<g filter="url(#filter0_d_1_3080)">
						<path
							opacity="0.4"
							d="M39.7109 18.875V33.375C39.7109 38.8125 37.8672 40.625 32.3359 40.625H17.5859C12.0547 40.625 10.2109 38.8125 10.2109 33.375V18.875H39.7109Z"
							fill="#FEFEFE"
						/>
						<path
							d="M42.5313 13.4375V15.25C42.5313 17.2438 41.5541 18.875 38.8438 18.875H11.1875C8.36656 18.875 7.5 17.2438 7.5 15.25V13.4375C7.5 11.4438 8.36656 9.8125 11.1875 9.8125H38.8438C41.5541 9.8125 42.5313 11.4438 42.5313 13.4375Z"
							fill="#E8E8E8"
						/>
						<path
							opacity="0.4"
							d="M24.3491 9.93297H14.1716C13.5447 9.26234 13.5631 8.22922 14.2269 7.57672L16.845 5.00297C17.5272 4.33234 18.6519 4.33234 19.3341 5.00297L24.3491 9.93297Z"
							fill="#FDFDFD"
						/>
						<path
							opacity="0.4"
							d="M35.8416 9.93297H25.6641L30.6791 5.00297C31.3612 4.33234 32.4859 4.33234 33.1681 5.00297L35.7863 7.57672C36.45 8.22922 36.4684 9.26234 35.8416 9.93297Z"
							fill="#FDFDFD"
						/>
						<path
							opacity="0.6"
							d="M19.375 18.875V28.1913C19.375 29.6413 20.9975 30.4931 22.2328 29.7138L23.9659 28.59C24.5928 28.1913 25.3856 28.1913 25.9941 28.59L27.635 29.6775C28.8519 30.475 30.4928 29.6231 30.4928 28.1731V18.875H19.375Z"
							fill="#E8E8E8"
						/>
					</g>
					<defs>
						<filter
							id="filter0_d_1_3080"
							x="-1.90735e-06"
							y="-1.19209e-06"
							width="50.0313"
							height="51.125"
							filterUnits="userSpaceOnUse"
							color-interpolation-filters="sRGB"
						>
							<feFlood flood-opacity="0" result="BackgroundImageFix" />
							<feColorMatrix
								in="SourceAlpha"
								type="matrix"
								values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
								result="hardAlpha"
							/>
							<feOffset dy="3" />
							<feGaussianBlur stdDeviation="3.75" />
							<feComposite in2="hardAlpha" operator="out" />
							<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
							<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_3080" />
							<feBlend
								mode="normal"
								in="SourceGraphic"
								in2="effect1_dropShadow_1_3080"
								result="shape"
							/>
						</filter>
					</defs>
				</svg>

				<div class="flex flex-col gap-2">
					<span>No Refund Policy</span>
					<span>Let guests know what your refund policy is.</span>
				</div>
			</div>

			<button
				class="ml-2 mt-6 flex w-fit items-center justify-center gap-2 rounded-sm bg-black p-2 text-white"
			>
				<Icon icon="mdi:plus" class="text-xl" />

				Add Refund Policy
			</button>
		</div>
	</div>

	<div class="mb-8 flex flex-col gap-4 pt-4">
		<h2 class="text-xl font-bold">Invoice Settings</h2>
		<p class="leading-relaxed text-[#84857A]">
			You can customize the information shown on guest invoices below.
		</p>

		<div class=" pt-4">
			<label class="text-[#7B7C7F]">Company Address</label>
			<div class="relative mt-4" use:clickOutside={() => (openEventLocationModal = false)}>
				<input
					type="text"
					readonly
					class="w-full cursor-pointer rounded-md border bg-[#FFFFFF] px-3 py-2 text-sm placeholder-[#C8C9C9]"
					value={location || ''}
				/>
				<button
					type="button"
					class="absolute inset-0"
					on:click={async () => {
						openEventLocationModal = true;
						await tick();
						scrollToId('location');
					}}
					aria-label="Open event location modal"
				/>
				{#if !location}
					<div
						class="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-2 text-[#C8C9C9]"
					>
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

						<span class="text-sm">What's the address? </span>
					</div>
				{/if}

				<EventLocationModal open={openEventLocationModal} bind:link={location} />
			</div>
		</div>
	</div>

	<div class="mb-8">
		<label class="block font-medium text-[#7B7C7F]"> Memo </label>

		<textarea
			bind:value={eventsInfo}
			rows="4"
			class="w-full resize-none rounded-md border bg-[#fdfdfd] px-3 py-2 md:max-w-[630px]"
		/>
	</div>

	<button
		class="ml-2 mt-6 flex w-fit items-center justify-center gap-2 rounded-sm bg-black p-2 text-gray-300"
	>
		<img src="/tick-circle.svg" class="text-xl text-white" />

		Save Changes
	</button>

	<div class="mb-8 flex flex-col gap-4 pt-6">
		<h2 class="text-xl font-bold">Tax Configuration</h2>
		<p class="leading-relaxed text-[#84857A]">
			Collect taxes for your events. We will automatically calculate ad add the tax to price of any
			ticket.
		</p>
	</div>

	<div
		class="lg:item-center mb-12 flex flex-col items-start justify-between rounded-md bg-[#EBECED] py-2 md:flex-row md:justify-between md:p-2"
	>
		<span class="text-md m-2 text-[#7A7C7E] lg:m-4">Upgrade to Rondwell Plus to collect taxes.</span
		>
		<button
			class="m-2 flex w-fit items-center justify-center gap-1 rounded-md bg-[#E3E4E5] px-3 py-2 text-sm font-medium text-[#7A7C7E] transition-colors hover:bg-gray-200 sm:justify-start sm:text-sm"
		>
			Learn More
			<svg
				width="14"
				height="14"
				viewBox="0 0 14 14"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M1.05859 0.933594C1.95885 0.134803 3.25318 -0.0400553 4.36426 0.494141L12.1758 4.23145L12.3467 4.32031C13.1824 4.78731 13.705 5.62057 13.7051 6.53906C13.7051 7.51893 13.1109 8.40294 12.1758 8.84766V8.84668L4.36426 12.585L4.36328 12.584C3.9331 12.7923 3.48095 12.8906 3.0293 12.8906C2.40064 12.8905 1.78786 12.6956 1.27344 12.3184L1.05859 12.1455C0.153315 11.3423 -0.0696574 10.1442 0.5 9.1084L1.5918 7.12305C1.78974 6.76307 1.78998 6.32838 1.59082 5.96094V5.95996L0.5 3.9707C-0.0696527 2.93495 0.153333 1.73684 1.05859 0.933594ZM3.03613 1.48145C2.67562 1.48154 2.35396 1.61543 2.11328 1.7959L2.01465 1.87598C1.64292 2.20302 1.39411 2.76677 1.73145 3.38574L2.82324 5.37109C3.19934 6.06114 3.22359 6.86942 2.89453 7.57422L2.82324 7.71387L1.73145 9.69922V9.7002C1.38898 10.3176 1.64154 10.8807 2.01465 11.209C2.38946 11.5386 3.0313 11.7717 3.73047 11.4375L11.542 7.7002H11.543C12.0369 7.46462 12.3182 7.02986 12.3184 6.5459C12.3184 6.06188 12.0369 5.62727 11.543 5.3916L11.542 5.39063L3.73047 1.64063V1.6416C3.48788 1.52585 3.25276 1.48145 3.03613 1.48145Z"
					fill="#7A7B7D"
					stroke="#7A7B7D"
					stroke-width="0.375"
				/>
				<rect
					x="6.79492"
					y="7.22656"
					width="4.52853"
					height="1.31901"
					rx="0.659503"
					transform="rotate(180 6.79492 7.22656)"
					fill="#7A7B7D"
					stroke="#7A7B7D"
					stroke-width="0.375"
				/>
			</svg>
		</button>
	</div>
</div>
