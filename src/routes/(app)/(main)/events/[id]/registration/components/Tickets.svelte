<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import CapacityModal from './modal/CapacityModal.svelte';
	import GroupRegistrationModal from './modal/GroupRegistrationModal.svelte';
	import AddTicket from './modal/AddTicket.svelte';
	import EmailTemplate from './modal/EmailTemplate.svelte';
	import DeleteTicket from './modal/DeleteTicket.svelte';

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
</script>

<div class="">
	<!-- Event Header -->

	<!-- Action Buttons -->
	<div class="mb-6 flex w-full flex-wrap gap-3">
		<button
			class="flex w-full items-center gap-2 rounded-[12.75px] bg-[#FDFDFD] p-2 text-sm font-medium shadow-sm sm:min-w-70 md:w-fit"
		>
			<div class="flex h-[44px] w-[44px] items-center justify-center rounded-sm bg-[#DBF4DA]">
				<svg
					width="29"
					height="27"
					viewBox="0 0 29 27"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M8.33203 3.92188H10.6357V6.00488C10.6357 6.55688 11.0281 6.99464 11.5283 7.14355V9.59668C11.0279 9.7455 10.6357 10.1842 10.6357 10.7363V15.4785C10.6359 16.0304 11.0281 16.4684 11.5283 16.6172V19.0693C11.0279 19.2181 10.6358 19.6569 10.6357 20.209V22.293H8.33203C5.71655 22.2929 4.13765 21.9216 3.19629 21.0576C2.26522 20.2028 1.86426 18.7754 1.86426 16.3848V15.8389C1.86426 15.6273 2.07001 15.3936 2.38184 15.3936C3.70036 15.3935 4.83875 14.3926 4.83887 13.1074C4.83887 11.8221 3.70043 10.8203 2.38184 10.8203C2.07015 10.8203 1.86444 10.5875 1.86426 10.376V9.8291C1.86429 7.43867 2.26526 6.01199 3.19629 5.15723C4.13763 4.29309 5.71637 3.9219 8.33203 3.92188Z"
						fill="#3CBD2C"
						stroke="#3CBD2C"
						stroke-width="0.74922"
					/>
					<path
						d="M8.26367 4.74219H9.72559V6.61523C9.72573 7.03471 9.9524 7.47639 10.3369 7.65527V9.89941C9.95217 10.0783 9.72559 10.5208 9.72559 10.9404V15.2754C9.72559 15.6949 9.95247 16.1364 10.3369 16.3154V18.5605C9.9522 18.7394 9.72559 19.1819 9.72559 19.6016V21.4746H8.26367C6.49252 21.4746 5.47041 21.1408 4.8584 20.3916C4.22592 19.6173 3.94629 18.3039 3.94629 16.1045V15.6055C3.94629 15.4837 3.98763 15.381 4.04199 15.3145C4.09634 15.2479 4.14957 15.2305 4.18359 15.2305C5.24093 15.2303 5.98618 14.1997 5.98633 13.1084C5.98633 12.017 5.24103 10.9855 4.18359 10.9854C4.14962 10.9854 4.09625 10.9686 4.04199 10.9023C3.98759 10.8358 3.94629 10.7322 3.94629 10.6104V10.1113C3.94629 7.91188 4.22589 6.59848 4.8584 5.82422C5.47042 5.07515 6.49264 4.74219 8.26367 4.74219Z"
						fill="#3CBD2C"
						stroke="#3CBD2C"
						stroke-width="0.74922"
					/>
					<path
						opacity="0.4"
						d="M20.2305 3.92188C22.8461 3.92191 24.4249 4.29305 25.3662 5.15723C26.2972 6.01199 26.6982 7.43867 26.6982 9.8291V10.9219C26.6982 11.1334 26.4924 11.3671 26.1807 11.3672C24.8621 11.3672 23.7238 12.3681 23.7236 13.6533C23.7236 14.9386 24.8621 15.9404 26.1807 15.9404C26.4923 15.9405 26.698 16.1733 26.6982 16.3848C26.6982 18.7754 26.2973 20.2028 25.3662 21.0576C24.4249 21.9217 22.8459 22.2929 20.2305 22.293H13.167V20.209C13.1669 19.6573 12.7743 19.2194 12.2744 19.0703V16.6162C12.7742 16.4671 13.1668 16.0301 13.167 15.4785V10.7363C13.167 10.1846 12.7744 9.74675 12.2744 9.59766V7.14355C12.7743 6.99443 13.167 6.55662 13.167 6.00488V3.92188H20.2305Z"
						fill="#3CBD2C"
						stroke="#3CBD2C"
						stroke-width="0.74922"
					/>
					<path
						d="M15.4766 8.71819L17.8572 10.9038L22.9791 6.55469"
						stroke="white"
						stroke-width="1.49844"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</div>
			<div>
				<p>Registration</p>
				<p class="text-left text-xs text-[#B8BABA]">Open</p>
			</div>
		</button>

		<div
			class="relative w-full md:w-fit"
			use:clickOutside={() => {
				showCapacityModal = false;
			}}
		>
			<button
				on:click={() => (showCapacityModal = !showCapacityModal)}
				class="flex w-full items-center gap-2 rounded-[12.75px] bg-[#FDFDFD] p-2 text-sm font-medium sm:min-w-70 md:w-fit"
			>
				<div class="flex h-[44px] w-[44px] items-center justify-center rounded-sm bg-[#F8E8E0]">
					<svg
						width="28"
						height="27"
						viewBox="0 0 28 27"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect
							y="4.49219"
							width="4.49532"
							height="27.7461"
							rx="2.24766"
							transform="rotate(-90 0 4.49219)"
							fill="#F87937"
						/>
						<rect
							x="11.4258"
							y="14.2344"
							width="4.89637"
							height="12.7367"
							rx="2.44819"
							fill="#F87937"
						/>
						<path
							d="M13.3 5.92689C13.5994 5.56977 14.1488 5.56977 14.4482 5.92689L22.7365 15.8118C23.1453 16.2994 22.7987 17.0424 22.1624 17.0424H5.58581C4.94953 17.0424 4.60288 16.2994 5.01169 15.8118L13.3 5.92689Z"
							fill="#F87937"
						/>
					</svg>
					<CapacityModal open={showCapacityModal} />
				</div>
				<div>
					<p>Event Capacity</p>
					<p class="text-left text-xs text-[#B8BABA]">Unlimited</p>
				</div>
			</button>
		</div>
		<div
			class="relative w-full md:w-fit"
			use:clickOutside={() => {
				showGroupRegisterModal = false;
			}}
		>
			<button
				on:click={() => (showGroupRegisterModal = !showGroupRegisterModal)}
				class="flex w-full items-center gap-2 rounded-[12.75px] bg-[#FDFDFD] p-2 text-sm font-medium shadow-sm sm:min-w-70 md:w-fit"
			>
				<div class="flex h-[44px] w-[44px] items-center justify-center rounded-sm bg-[#F2E4F8]">
					<svg
						width="29"
						height="27"
						viewBox="0 0 29 27"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							opacity="0.4"
							d="M24.8037 14.3892C25.2678 14.3892 25.6367 14.0396 25.6367 13.6025V12.641C25.6367 8.34708 24.2086 7.04688 19.5435 7.04688H12.0459V9.70192C12.51 9.70192 12.8909 10.0516 12.8909 10.4777V13.4059C12.8909 13.832 12.51 14.1816 12.0459 14.1816V16.9241C12.51 16.9241 12.8909 17.2737 12.8909 17.6998V20.628C12.8909 21.0542 12.51 21.4038 12.0459 21.4038V24.037H19.5435C24.2086 24.037 25.6367 22.7259 25.6367 18.4428C25.6367 18.0167 25.2678 17.6671 24.8037 17.6671C23.804 17.6671 23.0066 16.935 23.0066 16.0281C23.0066 15.1213 23.804 14.3892 24.8037 14.3892Z"
							fill="#AB46DD"
						/>
						<path
							opacity="0.4"
							d="M18.127 7.28819H10.709L13.1 5.09298C15.0504 3.30234 16.0297 3.30234 17.9801 5.09298L18.4697 5.54251C17.9556 6.01452 17.8332 6.71129 18.127 7.28819Z"
							stroke="#AB46DD"
							stroke-width="1.12383"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M11.1998 10.4746V13.4028C11.1998 13.8289 11.5807 14.1785 12.0448 14.1785V16.921C11.5807 16.921 11.1998 17.2706 11.1998 17.6967V20.6249C11.1998 21.051 11.5807 21.4007 12.0448 21.4007V24.0339H9.02197C4.35682 24.0339 2.92871 22.7227 2.92871 18.4397V17.9699C2.92871 17.5328 3.29764 17.1941 3.76177 17.1941C4.76145 17.1941 5.55881 16.4511 5.55881 15.5443C5.55881 14.6374 4.76145 13.8944 3.76177 13.8944C3.29764 13.8944 2.92871 13.5557 2.92871 13.1187V12.6489C2.92871 8.3549 4.35682 7.05469 9.02197 7.05469H12.0329V9.70973C11.5807 9.70973 11.1998 10.0594 11.1998 10.4746Z"
							fill="#AB46DD"
						/>
					</svg>
				</div>
				<div>
					<p>Group Registration</p>
					<p class="text-left text-xs text-[#B8BABA]">off</p>
				</div>
			</button>
			<GroupRegistrationModal bind:open={showGroupRegisterModal} />
		</div>
	</div>

	<div class="mb-6">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-semibold">Tickets</h2>
			<div class="flex items-center gap-2">
				<div
					class="relative"
					use:clickOutside={() => {
						showAddTicketType = false;
					}}
				>
					<button
						on:click={() => (showAddTicketType = !showAddTicketType)}
						class="flex w-fit items-center gap-1 rounded-md bg-[#EBECED] px-3 py-2 text-xs font-medium text-[#616265] transition-colors hover:bg-gray-200 md:text-sm"
					>
						<Icon icon="mdi:plus" class="text-xl" />
						New Ticket Type
					</button>
					<AddTicket bind:open={showAddTicketType} />
				</div>
				<button aria-label="layout" class="rounded bg-[#EBECED] p-2" on:click={toggleLayout}>
					{#if layout !== 'grid'}
						<svg
							width="17"
							height="17"
							viewBox="0 0 17 17"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M3.4334 6.86928H4.80697C6.18054 6.86928 6.86732 6.18249 6.86732 4.80892V3.43535C6.86732 2.06178 6.18054 1.375 4.80697 1.375H3.4334C2.05983 1.375 1.37305 2.06178 1.37305 3.43535V4.80892C1.37305 6.18249 2.05983 6.86928 3.4334 6.86928Z"
								stroke="#626265"
								stroke-width="1.12383"
								stroke-miterlimit="10"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M11.6746 6.86928H13.0482C14.4218 6.86928 15.1085 6.18249 15.1085 4.80892V3.43535C15.1085 2.06178 14.4218 1.375 13.0482 1.375H11.6746C10.301 1.375 9.61426 2.06178 9.61426 3.43535V4.80892C9.61426 6.18249 10.301 6.86928 11.6746 6.86928Z"
								stroke="#626265"
								stroke-width="1.12383"
								stroke-miterlimit="10"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M11.6746 15.1115H13.0482C14.4218 15.1115 15.1085 14.4247 15.1085 13.0511V11.6775C15.1085 10.304 14.4218 9.61719 13.0482 9.61719H11.6746C10.301 9.61719 9.61426 10.304 9.61426 11.6775V13.0511C9.61426 14.4247 10.301 15.1115 11.6746 15.1115Z"
								stroke="#626265"
								stroke-width="1.12383"
								stroke-miterlimit="10"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M3.4334 15.1115H4.80697C6.18054 15.1115 6.86732 14.4247 6.86732 13.0511V11.6775C6.86732 10.304 6.18054 9.61719 4.80697 9.61719H3.4334C2.05983 9.61719 1.37305 10.304 1.37305 11.6775V13.0511C1.37305 14.4247 2.05983 15.1115 3.4334 15.1115Z"
								stroke="#626265"
								stroke-width="1.12383"
								stroke-miterlimit="10"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					{:else}
						<svg
							width="17"
							height="12"
							viewBox="0 0 18 12"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<rect x="1.5" y="10.5" width="13.5" height="1.5" fill="#626265" />
							<rect x="1.5" width="13.5" height="1.5" fill="#626265" />
							<rect x="7.5" y="5.25" width="9.75" height="1.5" fill="#626265" />
							<path d="M6 6L1.5 8.59808V3.40192L6 6Z" fill="#626265" />
						</svg>
					{/if}
				</button>
			</div>
		</div>

		<!-- Start Selling Banner -->
		<div class="mb-4 rounded-lg border p-4">
			<div class="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
				<div class="flex flex-col items-start gap-2 lg:flex-row lg:items-center">
					<img src="/get-ticket.svg" alt="get-ticket" />
					<p class="text-sm text-gray-600">
						<span class="font-medium text-black">Start Selling.</span>
						Collect payments by creating a Stripe account. Receive payouts daily. Set up in under 5 minutes.
					</p>
				</div>
				<div class="flex w-full items-center gap-2 lg:w-fit">
				<a
					href="/auth"
					class="flex w-full items-center justify-center gap-1 rounded-md bg-[#EBECED] px-3 py-2 text-xs font-medium text-[#616265] transition-colors hover:bg-gray-200 md:w-fit md:text-sm"
				>
					Get Started
				</a>
					<button>
						<Icon icon="mdi:close" class="h-4 w-4 text-gray-600" />
					</button>
				</div>
			</div>
		</div>

		{#if eventData?.tickets?.length > 0}
			<!-- Ticket Cards -->
			{#if layout === 'grid'}
				<div class="flex flex-wrap gap-4">
					{#each eventData.tickets as ticket}
						<div class="w-full rounded-lg bg-[#FDFDFD] p-4 md:max-w-[400px]">
							<!-- Header -->
							<div class="mb-2 flex items-center justify-between text-sm">
								<div class="font-medium">{ticket.type}</div>

								<div class="relative">
									<button
										on:click={() => toggleMenu(ticket.id)}
										class="rounded p-1 hover:bg-gray-100"
									>
										<Icon icon="mdi:dots-horizontal" class="h-5 w-5 text-gray-500" />
									</button>

									{#if menuOpen === ticket.id}
										<div
											class="absolute right-0 z-50 mt-2 w-35 rounded-md border border-gray-200 bg-white p-1 shadow-md"
										>
											<div
												class="relative w-full"
												use:clickOutside={() => {
													if (showUpdateTicket === ticket.id) showUpdateTicket = null;
												}}
											>
												<button
													on:click={() =>
														(showUpdateTicket = showUpdateTicket === ticket.id ? null : ticket.id)}
													class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#F0F0F0]"
												>
													<Icon icon="mdi:pencil-outline" class="h-4 w-4 text-gray-500" />
													Edit
												</button>
												<AddTicket open={showUpdateTicket === ticket.id} type="update" />
											</div>
											<div
												class="relative w-full md:max-w-[300px]"
												use:clickOutside={() => {
													if (showDeleteTicket === ticket.id) showDeleteTicket = null;
												}}
											>
												<button
													on:click={() =>
														(showDeleteTicket = showDeleteTicket === ticket.id ? null : ticket.id)}
													class="hover:bg-gray-5 flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#F0F0F0]"
												>
													<Icon icon="mdi:trash-can-outline" class="h-4 w-4" />
													Delete
												</button>
												<DeleteTicket open={showDeleteTicket === ticket.id} />
											</div>
										</div>
									{/if}
								</div>
							</div>

							<div class="mb-2 text-2xl font-bold">{ticket.price}</div>

							<!-- Require Approval Toggle -->
							<div class="mb-3 flex items-center justify-between">
								<div class="flex items-center gap-1">
									<p class="text-sm">Require Approval</p>
									<!-- your svg icon -->
									<img src="/information.svg" alt="" />
								</div>

								<!-- Toggle Button -->
								<button
									aria-label="toggle"
									class="relative h-6 w-10 rounded-full transition-colors duration-300"
									class:bg-gray-300={!ticket.requireApproval}
									class:bg-gray-800={ticket.requireApproval}
									on:click={() => toggleRequireApproval(ticket.id)}
								>
									<span
										class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
										class:translate-x-4={ticket.requireApproval}
									></span>
								</button>
							</div>

							<!-- Status -->
							<div class="mt-3 flex items-center justify-between border-t pt-3">
								<div class="flex items-center gap-1">
									<div class="h-2 w-2 rounded-full bg-green-500"></div>
									<div class="text-sm text-gray-500">{ticket.status}</div>
								</div>
								<div class="flex items-center gap-1">
									<img src="/moon.svg" alt="Featured" class="h-5 w-7" />
									<div class="text-sm text-gray-500">{ticket.registered} Registered</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex flex-col rounded-md bg-[#FDFDFD] px-3">
					{#each eventData?.tickets as ticket}
						<div
							class="relative flex flex-col items-center justify-between gap-3 border-b py-3 last:border-b-0 lg:flex-row lg:gap-0"
						>
							<!-- Left: Info -->
							<div
								class="flex w-full items-center justify-between gap-2 lg:w-fit lg:justify-center"
							>
								<!-- Drag handle placeholder -->
								<Icon icon="mdi:drag" class="h-6 w-6 text-gray-400" />

								<!-- Ticket details -->
								<div class="flex w-full flex-col gap-3 lg:flex-row">
									<div class="flex items-center gap-3 lg:gap-2">
										<span class="font-medium text-gray-800">{ticket.type}</span>
										<span class="text-sm text-gray-500">{ticket.price}</span>
										<div class="flex items-center gap-1">
											<span
												class="rounded-[11px] bg-[#F8EFDD] px-2 py-0.5 text-xs font-medium text-[#D69814]"
											>
												Require Approval
											</span>

											<img src="/information.svg" alt="" />
										</div>
									</div>

									<div class="mt-1 flex items-center gap-2 text-sm text-[#88888A]">
										{#if ticket.status === 'Available'}
											<span class="flex items-center gap-1">
												<span class="h-2 w-2 rounded-full bg-green-500"></span>
												Available {ticket.availableUntil ? 'Until' : ''}
												{ticket.availableUntil}
											</span>
										{:else if ticket.status === 'Sold Out'}
											<span class="flex items-center gap-1">
												<span class="h-2 w-2 rounded-full bg-red-500"></span>
												Sold Out
											</span>
										{/if}
									</div>
								</div>
							</div>

							<!-- Right: Registered + Menu -->
							<div
								class="flex w-full items-center justify-between gap-3 pl-7 lg:w-fit lg:justify-center lg:pl-0"
							>
								{#if ticket.capacity}
									<div class="flex items-center gap-1 text-sm text-[#A9AAAA]">
										<!-- Avatar placeholders -->
										<img src="/moon.svg" alt="Featured" class="h-5 w-7" />

										{ticket.registered}/{ticket.capacity} registered
									</div>
								{:else}
									<div class="text-sm text-[#A9AAAA]">0 registered</div>
								{/if}

								<!-- Dots Menu -->
								<div class="relative">
									<button
										on:click={() => toggleMenu(ticket.id)}
										class="rounded p-1 hover:bg-gray-100"
									>
										<Icon icon="mdi:dots-horizontal" class="h-5 w-5 text-gray-500" />
									</button>

									{#if menuOpen === ticket.id}
										<div
											class="absolute right-0 z-50 mt-2 w-35 rounded-md border border-gray-200 bg-white p-1 shadow-md"
										>
											<div
												class="relative w-full"
												use:clickOutside={() => {
													if (showUpdateTicket === ticket.id) showUpdateTicket = null;
												}}
											>
												<button
													on:click={() =>
														(showUpdateTicket = showUpdateTicket === ticket.id ? null : ticket.id)}
													class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#F0F0F0]"
												>
													<Icon icon="mdi:pencil-outline" class="h-4 w-4 text-gray-500" />
													Edit
												</button>
												<AddTicket open={showUpdateTicket === ticket.id} type="update" />
											</div>
											<div
												class="relative w-full md:max-w-[300px]"
												use:clickOutside={() => {
													if (showDeleteTicket === ticket.id) showDeleteTicket = null;
												}}
											>
												<button
													on:click={() =>
														(showDeleteTicket = showDeleteTicket === ticket.id ? null : ticket.id)}
													class="hover:bg-gray-5 flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#F0F0F0]"
												>
													<Icon icon="mdi:trash-can-outline" class="h-4 w-4" />
													Delete
												</button>
												<DeleteTicket open={showDeleteTicket === ticket.id} />
											</div>
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{:else}
			<div class="flex h-50 flex-col items-center justify-center">
				<img src="/add.svg" alt="" />
				<p class="mt-2 font-medium text-[#A2ACB2]">No Tickets Created</p>
				<p class="text-sm text-gray-400">All free and paid tickets created will appear here</p>
			</div>
		{/if}
	</div>

	<!-- Registration Emails / Templates Section -->
	<div class="rounded-lg">
		<h2 class="mb-2 text-xl font-medium">Registration Emails / Templates</h2>
		<p class="mb-4 text-sm text-[#8C8F93]">
			Customize the emails sent when a guest registers for the event and for when your approve or
			decline their registration.
		</p>

		<div class="flex flex-wrap gap-4">
			{#each eventData.registrationEmails as email}
				<div
					class="relative w-full md:max-w-[300px]"
					use:clickOutside={() => {
						if (showEmailTemplate === email.id) showEmailTemplate = null;
					}}
				>
					<button
						on:click={() => (showEmailTemplate = showEmailTemplate === email.id ? null : email.id)}
						class="w-full rounded-lg bg-[#FDFDFD] shadow-sm md:max-w-[300px]"
					>
						<div
							class="mb-3 flex flex-col items-start gap-2 rounded-lg p-4"
							style="background: linear-gradient(90deg, #FDFDFD 0%, #F5F5F5 100%);"
						>
							<!-- Icon -->
							{#if email.icon === 'gray'}
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full border-3 border-[#737475]"
								>
									<Icon icon="mdi:tick" class="h-7 w-7 font-bold text-[#737475]" />
								</div>
							{:else if email.icon === 'check'}
								<div class="flex h-8 w-8 items-center justify-center rounded-full bg-[#3CBD2C]">
									<Icon icon="mdi:tick" class="h-7 w-7 font-bold text-white" />
								</div>
							{:else if email.icon === 'cancel'}
								<div class="flex h-8 w-8 items-center justify-center rounded-full bg-[#ED2B32]">
									<Icon icon="mdi:close" class="h-7 w-7 font-bold text-white" />
								</div>
							{/if}

							<!-- Gray text bars -->
							<div class="mt-3 flex w-full flex-col gap-2">
								<div class="h-3 w-full rounded-md bg-[#E6E7E7]"></div>
								<div class="h-3 w-1/2 rounded-md bg-[#E6E7E7]"></div>
							</div>
						</div>

						<!-- Label -->
						<div class="px-4 py-2 text-sm font-medium text-gray-800">
							{email.type}
						</div>
					</button>
					<EmailTemplate
						open={showEmailTemplate === email.id}
						title={email.title}
						description={email.description}
						subject={email.subject}
						onSave={() => {}}
						onPreview={() => {}}
					/>
				</div>
			{/each}
		</div>
	</div>
</div>
