<script lang="ts">
	import Nav from '../../../../components/Nav.svelte';
	import Admins from './components/Admins.svelte';
	import Display from './components/Display.svelte';
	import Embed from './components/Embed.svelte';
	import Options from './components/Options.svelte';
	import Payment from './components/Payment.svelte';
	import RondwellPlus from './components/RondwellPlus.svelte';
	import SendLimit from './components/SendLimit.svelte';
	import Tags from './components/Tags.svelte';

	let activeTab = 'display';

	const tabs = [
		{
			id: 'display',
			label: 'Display',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.9081 18.9584H6.09144C2.61644 18.9584 1.55811 17.9 1.55811 14.425V14.0417C1.55811 13.7 1.84144 13.4167 2.18311 13.4167C2.91644 13.4167 3.51644 12.8167 3.51644 12.0834C3.51644 11.35 2.91644 10.75 2.18311 10.75C1.84144 10.75 1.55811 10.4667 1.55811 10.125V9.74171C1.55811 6.26671 2.61644 5.20837 6.09144 5.20837H13.9081C17.3831 5.20837 18.4414 6.26671 18.4414 9.74171V10.525C18.4414 10.8667 18.1581 11.15 17.8164 11.15C17.0831 11.15 16.4831 11.75 16.4831 12.4834C16.4831 13.2167 17.0831 13.8084 17.8164 13.8084C18.1581 13.8084 18.4414 14.0917 18.4414 14.4334C18.4331 17.9 17.3748 18.9584 13.9081 18.9584ZM2.81644 14.5917C2.83311 17.2417 3.35811 17.7084 6.09977 17.7084H13.9164C16.5164 17.7084 17.1164 17.2834 17.1914 14.975C16.0748 14.6917 15.2414 13.6834 15.2414 12.475C15.2414 11.2667 16.0748 10.25 17.1998 9.96671V9.73337C17.1998 6.94171 16.7081 6.45004 13.9164 6.45004H6.09144C3.35811 6.45004 2.83311 6.92504 2.80811 9.56671C3.93311 9.85004 4.76644 10.8667 4.76644 12.075C4.76644 13.2834 3.93311 14.3084 2.81644 14.5917Z" fill="currentColor"/>
<path d="M8.3335 8.54171C7.99183 8.54171 7.7085 8.25837 7.7085 7.91671V5.83337C7.7085 5.49171 7.99183 5.20837 8.3335 5.20837C8.67516 5.20837 8.9585 5.49171 8.9585 5.83337V7.91671C8.9585 8.25837 8.67516 8.54171 8.3335 8.54171Z" fill="currentColor"/>
<path d="M8.3335 14.1C7.99183 14.1 7.7085 13.8166 7.7085 13.475V10.7C7.7085 10.3583 7.99183 10.075 8.3335 10.075C8.67516 10.075 8.9585 10.3583 8.9585 10.7V13.475C8.9585 13.8166 8.67516 14.1 8.3335 14.1Z" fill="currentColor"/>
<path d="M8.3335 18.9583C7.99183 18.9583 7.7085 18.675 7.7085 18.3333V16.25C7.7085 15.9083 7.99183 15.625 8.3335 15.625C8.67516 15.625 8.9585 15.9083 8.9585 16.25V18.3333C8.9585 18.675 8.67516 18.9583 8.3335 18.9583Z" fill="currentColor"/>
<path d="M13.6082 6.45828H6.03315C5.78315 6.45828 5.54982 6.30828 5.45815 6.07495C5.36649 5.84162 5.41649 5.56662 5.59149 5.39162L8.03315 2.94995C10.2832 0.699951 11.6582 0.699951 13.8998 2.94995L14.3998 3.44995C14.5165 3.56662 14.5832 3.72495 14.5832 3.89162C14.5832 4.05828 14.5165 4.21662 14.3998 4.33328C14.0665 4.66662 13.9748 5.15828 14.1665 5.58328C14.2582 5.77495 14.2415 5.99995 14.1248 6.18328C14.0165 6.34995 13.8165 6.45828 13.6082 6.45828ZM7.54149 5.20828H12.8165C12.7998 4.76662 12.9082 4.32495 13.1332 3.94162L13.0248 3.83328C11.2832 2.09162 10.6665 2.09162 8.92482 3.83328L7.54149 5.20828Z" fill="currentColor"/>
</svg>`
		},
		{
			id: 'payment',
			label: 'Payment',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.4998 18.9583H7.49984C2.97484 18.9583 1.0415 17.025 1.0415 12.5V7.49999C1.0415 2.97499 2.97484 1.04166 7.49984 1.04166H12.4998C17.0248 1.04166 18.9582 2.97499 18.9582 7.49999V12.5C18.9582 17.025 17.0248 18.9583 12.4998 18.9583ZM7.49984 2.29166C3.65817 2.29166 2.2915 3.65832 2.2915 7.49999V12.5C2.2915 16.3417 3.65817 17.7083 7.49984 17.7083H12.4998C16.3415 17.7083 17.7082 16.3417 17.7082 12.5V7.49999C17.7082 3.65832 16.3415 2.29166 12.4998 2.29166H7.49984Z" fill="#808080"/>
<path d="M13.125 8.125H6.875C6.53333 8.125 6.25 7.84167 6.25 7.5C6.25 7.15833 6.53333 6.875 6.875 6.875H13.125C13.4667 6.875 13.75 7.15833 13.75 7.5C13.75 7.84167 13.4667 8.125 13.125 8.125Z" fill="#808080"/>
<path d="M13.125 13.125H6.875C6.53333 13.125 6.25 12.8417 6.25 12.5C6.25 12.1583 6.53333 11.875 6.875 11.875H13.125C13.4667 11.875 13.75 12.1583 13.75 12.5C13.75 12.8417 13.4667 13.125 13.125 13.125Z" fill="#808080"/>
</svg>`
		},
		{
			id: 'options',
			label: 'Options',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.4998 18.9583H7.49984C2.97484 18.9583 1.0415 17.025 1.0415 12.5V7.49999C1.0415 2.97499 2.97484 1.04166 7.49984 1.04166H12.4998C17.0248 1.04166 18.9582 2.97499 18.9582 7.49999V12.5C18.9582 17.025 17.0248 18.9583 12.4998 18.9583ZM7.49984 2.29166C3.65817 2.29166 2.2915 3.65832 2.2915 7.49999V12.5C2.2915 16.3417 3.65817 17.7083 7.49984 17.7083H12.4998C16.3415 17.7083 17.7082 16.3417 17.7082 12.5V7.49999C17.7082 3.65832 16.3415 2.29166 12.4998 2.29166H7.49984Z" fill="#808080"/>
<path d="M13.125 8.125H6.875C6.53333 8.125 6.25 7.84167 6.25 7.5C6.25 7.15833 6.53333 6.875 6.875 6.875H13.125C13.4667 6.875 13.75 7.15833 13.75 7.5C13.75 7.84167 13.4667 8.125 13.125 8.125Z" fill="#808080"/>
<path d="M13.125 13.125H6.875C6.53333 13.125 6.25 12.8417 6.25 12.5C6.25 12.1583 6.53333 11.875 6.875 11.875H13.125C13.4667 11.875 13.75 12.1583 13.75 12.5C13.75 12.8417 13.4667 13.125 13.125 13.125Z" fill="#808080"/>
</svg>`
		},
		{
			id: 'admins',
			label: 'Admins',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.4998 18.9583H7.49984C2.97484 18.9583 1.0415 17.025 1.0415 12.5V7.49999C1.0415 2.97499 2.97484 1.04166 7.49984 1.04166H12.4998C17.0248 1.04166 18.9582 2.97499 18.9582 7.49999V12.5C18.9582 17.025 17.0248 18.9583 12.4998 18.9583ZM7.49984 2.29166C3.65817 2.29166 2.2915 3.65832 2.2915 7.49999V12.5C2.2915 16.3417 3.65817 17.7083 7.49984 17.7083H12.4998C16.3415 17.7083 17.7082 16.3417 17.7082 12.5V7.49999C17.7082 3.65832 16.3415 2.29166 12.4998 2.29166H7.49984Z" fill="#808080"/>
<path d="M13.125 8.125H6.875C6.53333 8.125 6.25 7.84167 6.25 7.5C6.25 7.15833 6.53333 6.875 6.875 6.875H13.125C13.4667 6.875 13.75 7.15833 13.75 7.5C13.75 7.84167 13.4667 8.125 13.125 8.125Z" fill="#808080"/>
<path d="M13.125 13.125H6.875C6.53333 13.125 6.25 12.8417 6.25 12.5C6.25 12.1583 6.53333 11.875 6.875 11.875H13.125C13.4667 11.875 13.75 12.1583 13.75 12.5C13.75 12.8417 13.4667 13.125 13.125 13.125Z" fill="#808080"/>
</svg>`
		},
		{
			id: 'tags',
			label: 'Tags',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.4998 18.9583H7.49984C2.97484 18.9583 1.0415 17.025 1.0415 12.5V7.49999C1.0415 2.97499 2.97484 1.04166 7.49984 1.04166H12.4998C17.0248 1.04166 18.9582 2.97499 18.9582 7.49999V12.5C18.9582 17.025 17.0248 18.9583 12.4998 18.9583ZM7.49984 2.29166C3.65817 2.29166 2.2915 3.65832 2.2915 7.49999V12.5C2.2915 16.3417 3.65817 17.7083 7.49984 17.7083H12.4998C16.3415 17.7083 17.7082 16.3417 17.7082 12.5V7.49999C17.7082 3.65832 16.3415 2.29166 12.4998 2.29166H7.49984Z" fill="#808080"/>
<path d="M13.125 8.125H6.875C6.53333 8.125 6.25 7.84167 6.25 7.5C6.25 7.15833 6.53333 6.875 6.875 6.875H13.125C13.4667 6.875 13.75 7.15833 13.75 7.5C13.75 7.84167 13.4667 8.125 13.125 8.125Z" fill="#808080"/>
<path d="M13.125 13.125H6.875C6.53333 13.125 6.25 12.8417 6.25 12.5C6.25 12.1583 6.53333 11.875 6.875 11.875H13.125C13.4667 11.875 13.75 12.1583 13.75 12.5C13.75 12.8417 13.4667 13.125 13.125 13.125Z" fill="#808080"/>
</svg>`
		},

		{
			id: 'embed',
			label: 'Embed',
			icon: `<svg width="20" height="23" viewBox="0 0 20 23" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.6665 20.3688H18.3332" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10 1.8517C11.3333 2.44425 12.8333 2.44425 14.1667 1.8517V4.62926C12.8333 5.2218 11.3333 5.2218 10 4.62926V1.8517Z" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10 4.62927V7.40683" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M14.1668 7.40683H5.8335C4.16683 7.40683 3.3335 8.33268 3.3335 10.1844V20.3688H16.6668V10.1844C16.6668 8.33268 15.8335 7.40683 14.1668 7.40683Z" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3.81689 11.1102H16.1836" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M6.6582 11.1102V20.3688" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linejoin="round"/>
<path d="M9.9917 11.1102V20.3688" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linejoin="round"/>
<path d="M13.3252 11.1102V20.3688" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linejoin="round"/>
</svg>`
		},

		{
			id: 'send-limit',
			label: 'Send Limit',
			icon: `<svg width="20" height="23" viewBox="0 0 20 23" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.6665 20.3688H18.3332" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10 1.8517C11.3333 2.44425 12.8333 2.44425 14.1667 1.8517V4.62926C12.8333 5.2218 11.3333 5.2218 10 4.62926V1.8517Z" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10 4.62927V7.40683" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M14.1668 7.40683H5.8335C4.16683 7.40683 3.3335 8.33268 3.3335 10.1844V20.3688H16.6668V10.1844C16.6668 8.33268 15.8335 7.40683 14.1668 7.40683Z" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3.81689 11.1102H16.1836" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M6.6582 11.1102V20.3688" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linejoin="round"/>
<path d="M9.9917 11.1102V20.3688" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linejoin="round"/>
<path d="M13.3252 11.1102V20.3688" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linejoin="round"/>
</svg>`
		},
		{
			id: 'rondwell-plus',
			label: 'Rondwell Plus',
			icon: `<svg width="20" height="23" viewBox="0 0 20 23" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.6665 20.3688H18.3332" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10 1.8517C11.3333 2.44425 12.8333 2.44425 14.1667 1.8517V4.62926C12.8333 5.2218 11.3333 5.2218 10 4.62926V1.8517Z" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10 4.62927V7.40683" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M14.1668 7.40683H5.8335C4.16683 7.40683 3.3335 8.33268 3.3335 10.1844V20.3688H16.6668V10.1844C16.6668 8.33268 15.8335 7.40683 14.1668 7.40683Z" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3.81689 11.1102H16.1836" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M6.6582 11.1102V20.3688" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linejoin="round"/>
<path d="M9.9917 11.1102V20.3688" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linejoin="round"/>
<path d="M13.3252 11.1102V20.3688" stroke="#808080" stroke-width="1.5" stroke-miterlimit="10" stroke-linejoin="round"/>
</svg>`
		}
	];
</script>

<div class="min-h-screen">
	<!-- Header -->
	<div class="px-4 py-4">
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

		<!-- Navigation Tabs -->
		<Nav {tabs} bind:activeTab />
		<!-- Content Area -->

		{#if activeTab === 'display'}
			<div class="py-6">
				<Display />
			</div>
		{:else if activeTab === 'payment'}
			<Payment />
		{:else if activeTab === 'options'}
			<Options />
		{:else if activeTab === 'embed'}
			<Embed />
		{:else if activeTab === 'admins'}
			<Admins />
		{:else if activeTab === 'tags'}
			<Tags />
		{:else if activeTab === 'send-limit'}
			<SendLimit />
		{:else if activeTab === 'rondwell-plus'}
			<RondwellPlus />
		{/if}
	</div>
</div>
