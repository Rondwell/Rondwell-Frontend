<script lang="ts">
	import Nav from '../../../../components/Nav.svelte';
	import EventForm from './components/EventForm.svelte';
	import SeatCapacity from './components/SeatCapacity.svelte';
	import Tickets from './components/Tickets.svelte';
	import { goto } from '$app/navigation';

	let eventData = {
		title: 'Megaexe Party',
		collection: 'John Collection',
		status: 'Ticket',
		tickets: [
			{
				id: 1,
				type: 'Standard',
				price: 'Free',
				requireApproval: false,
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
				requireApproval: false,
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
				icon: 'gray'
			},
			{
				id: 2,
				type: 'Confirmation Email',
				status: 'Active',
				icon: 'check'
			},
			{
				id: 3,
				type: 'Decline Email',
				status: 'Inactive',
				icon: 'cancel'
			}
		]
	};

	let activeTab = 'ticket';

	const tabs = [
		{
			id: 'ticket',
			label: 'Ticket',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.9086 18.9609H6.09193C2.61693 18.9609 1.55859 17.9026 1.55859 14.4276V14.0443C1.55859 13.7026 1.84193 13.4193 2.18359 13.4193C2.91693 13.4193 3.51693 12.8193 3.51693 12.0859C3.51693 11.3526 2.91693 10.7526 2.18359 10.7526C1.84193 10.7526 1.55859 10.4693 1.55859 10.1276V9.74427C1.55859 6.26927 2.61693 5.21094 6.09193 5.21094H13.9086C17.3836 5.21094 18.4419 6.26927 18.4419 9.74427V10.5276C18.4419 10.8693 18.1586 11.1526 17.8169 11.1526C17.0836 11.1526 16.4836 11.7526 16.4836 12.4859C16.4836 13.2193 17.0836 13.8109 17.8169 13.8109C18.1586 13.8109 18.4419 14.0943 18.4419 14.4359C18.4336 17.9026 17.3753 18.9609 13.9086 18.9609ZM2.81693 14.5943C2.83359 17.2443 3.35859 17.7109 6.10026 17.7109H13.9169C16.5169 17.7109 17.1169 17.2859 17.1919 14.9776C16.0753 14.6943 15.2419 13.6859 15.2419 12.4776C15.2419 11.2693 16.0753 10.2526 17.2003 9.96927V9.73594C17.2003 6.94427 16.7086 6.4526 13.9169 6.4526H6.09193C3.35859 6.4526 2.83359 6.9276 2.80859 9.56927C3.93359 9.8526 4.76693 10.8693 4.76693 12.0776C4.76693 13.2859 3.93359 14.3109 2.81693 14.5943Z" fill="currentColor"/>
<path d="M8.33301 8.54427C7.99134 8.54427 7.70801 8.26094 7.70801 7.91927V5.83594C7.70801 5.49427 7.99134 5.21094 8.33301 5.21094C8.67467 5.21094 8.95801 5.49427 8.95801 5.83594V7.91927C8.95801 8.26094 8.67467 8.54427 8.33301 8.54427Z" fill="currentColor"/>
<path d="M8.33301 14.1031C7.99134 14.1031 7.70801 13.8198 7.70801 13.4781V10.7031C7.70801 10.3615 7.99134 10.0781 8.33301 10.0781C8.67467 10.0781 8.95801 10.3615 8.95801 10.7031V13.4781C8.95801 13.8198 8.67467 14.1031 8.33301 14.1031Z" fill="currentColor"/>
<path d="M8.33301 18.9583C7.99134 18.9583 7.70801 18.675 7.70801 18.3333V16.25C7.70801 15.9083 7.99134 15.625 8.33301 15.625C8.67467 15.625 8.95801 15.9083 8.95801 16.25V18.3333C8.95801 18.675 8.67467 18.9583 8.33301 18.9583Z" fill="currentColor"/>
<path d="M13.6082 6.46146H6.03315C5.78315 6.46146 5.54982 6.31146 5.45815 6.07813C5.36649 5.84479 5.41649 5.56979 5.59149 5.39479L8.03315 2.95313C10.2832 0.703125 11.6582 0.703125 13.8998 2.95313L14.3998 3.45313C14.5165 3.56979 14.5832 3.72813 14.5832 3.89479C14.5832 4.06146 14.5165 4.21979 14.3998 4.33646C14.0665 4.66979 13.9748 5.16146 14.1665 5.58646C14.2582 5.77813 14.2415 6.00313 14.1248 6.18646C14.0165 6.35313 13.8165 6.46146 13.6082 6.46146ZM7.54149 5.21146H12.8165C12.7998 4.76979 12.9082 4.32813 13.1332 3.94479L13.0248 3.83646C11.2832 2.09479 10.6665 2.09479 8.92482 3.83646L7.54149 5.21146Z" fill="currentColor"/>
</svg>
`
		},
		{
			id: 'event_forms',
			label: 'Event Forms',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.5003 18.9557H7.50033C2.97533 18.9557 1.04199 17.0224 1.04199 12.4974V7.4974C1.04199 2.9724 2.97533 1.03906 7.50033 1.03906H12.5003C17.0253 1.03906 18.9587 2.9724 18.9587 7.4974V12.4974C18.9587 17.0224 17.0253 18.9557 12.5003 18.9557ZM7.50033 2.28906C3.65866 2.28906 2.29199 3.65573 2.29199 7.4974V12.4974C2.29199 16.3391 3.65866 17.7057 7.50033 17.7057H12.5003C16.342 17.7057 17.7087 16.3391 17.7087 12.4974V7.4974C17.7087 3.65573 16.342 2.28906 12.5003 2.28906H7.50033Z" fill="currentColor"/>
<path d="M13.125 8.125H6.875C6.53333 8.125 6.25 7.84167 6.25 7.5C6.25 7.15833 6.53333 6.875 6.875 6.875H13.125C13.4667 6.875 13.75 7.15833 13.75 7.5C13.75 7.84167 13.4667 8.125 13.125 8.125Z" fill="currentColor"/>
<path d="M13.125 13.125H6.875C6.53333 13.125 6.25 12.8417 6.25 12.5C6.25 12.1583 6.53333 11.875 6.875 11.875H13.125C13.4667 11.875 13.75 12.1583 13.75 12.5C13.75 12.8417 13.4667 13.125 13.125 13.125Z" fill="currentColor"/>
</svg>
`
		},
		{
			id: 'seat_capacity',
			label: 'Seat Capacity',
			icon: `<svg width="20" height="23" viewBox="0 0 20 23" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.66699 20.3672H18.3337" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10 1.85156C11.3333 2.44411 12.8333 2.44411 14.1667 1.85156V4.62912C12.8333 5.22167 11.3333 5.22167 10 4.62912V1.85156Z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10 4.63281V7.41037" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M14.1663 7.40625H5.83301C4.16634 7.40625 3.33301 8.3321 3.33301 10.1838V20.3682H16.6663V10.1838C16.6663 8.3321 15.833 7.40625 14.1663 7.40625Z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3.81641 11.1094H16.1831" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M6.6582 11.1094V20.3679" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linejoin="round"/>
<path d="M9.99121 11.1094V20.3679" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linejoin="round"/>
<path d="M13.3252 11.1094V20.3679" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linejoin="round"/>
</svg>
`
		}
	];
</script>

<div class="max-w-6xl">
	<!-- Event Header -->
	<div class="mb-6">
		<div class="mb-2 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span class="text-sm text-[#83808D]">John Collection</span>
				<svg
					width="11"
					height="11"
					viewBox="0 0 11 11"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M0.827148 0.795898C1.49266 0.146359 2.45588 0.00140483 3.28223 0.438477L8.91895 3.4043H8.91797C9.61211 3.76739 10.0449 4.48319 10.0449 5.26758C10.0449 6.05184 9.61196 6.76678 8.91797 7.12988L8.91895 7.13086L3.28223 10.0957C2.96323 10.2657 2.62676 10.3467 2.29004 10.3467C1.75372 10.3466 1.23549 10.137 0.827148 9.73926C0.160836 9.0889 0.000384912 8.12521 0.416016 7.29395L1.2041 5.71875C1.34288 5.44119 1.34292 5.10404 1.20312 4.82031V4.81934L0.416016 3.24023C0.000612916 2.4091 0.161042 1.44617 0.827148 0.795898ZM2.29492 1.29199C2.01826 1.29212 1.77162 1.42109 1.59961 1.58887L1.59863 1.58984C1.34194 1.83849 1.16551 2.27322 1.40332 2.75293L2.19043 4.32812L2.28711 4.55469C2.47977 5.09324 2.44715 5.69271 2.19043 6.21094V6.21191L1.40234 7.78711V7.78809C1.16122 8.26626 1.34076 8.7005 1.59863 8.9502C1.85851 9.20169 2.2935 9.37235 2.76758 9.12305L8.40332 6.15723H8.4043C8.74149 5.98034 8.94037 5.64982 8.94043 5.27246C8.94043 4.89509 8.74146 4.56463 8.4043 4.3877H8.40332L2.76758 1.41113C2.60129 1.32386 2.44117 1.29199 2.29492 1.29199Z"
						fill="#83808D"
						stroke="#83808D"
						stroke-width="0.37461"
					/>
					<rect
						x="5.0584"
						y="5.85137"
						width="3.37149"
						height="1.12383"
						rx="0.561915"
						transform="rotate(-180 5.0584 5.85137)"
						fill="#83808D"
						stroke="#83808D"
						stroke-width="0.37461"
					/>
				</svg>
			</div>
			<button
				on:click={()=> goto('/event-page/1')}
				class="flex items-start gap-1 rounded-md bg-[#DCE4EE] px-3 py-1 text-sm font-medium text-[#5D646F]"
			>
				Event Page
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
		<h1 class="mb-10 text-3xl font-bold md:text-4xl">{eventData.title}</h1>

		<!-- Navigation Tabs -->
		<Nav {tabs} bind:activeTab />
	</div>
	{#if activeTab === 'ticket'}
		<Tickets />
	{:else if activeTab === 'event_forms'}
		<EventForm/>
	{:else if activeTab === 'seat_capacity'}
		<SeatCapacity />
	{/if}
</div>
