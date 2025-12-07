<script lang="ts">
	import Nav from '../../../../components/Nav.svelte';
	import Admin from './components/Admin.svelte';
	import Agenda from './components/Agenda.svelte';
	import Community from './components/Community.svelte';
	import Media from './components/Media.svelte';
	import Rooms from './components/Rooms.svelte';
	import Sessions from './components/Sessions.svelte';
	import Surveys from './components/Surveys.svelte';

	const tabs = [
		{
			id: 'rooms',
			label: 'Rooms',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.51602 2.36517L3.02435 5.86517C2.27435 6.44851 1.66602 7.69017 1.66602 8.63184V14.8068C1.66602 16.7402 3.24102 18.3235 5.17435 18.3235H14.8244C16.7577 18.3235 18.3327 16.7402 18.3327 14.8152V8.74851C18.3327 7.74017 17.6577 6.44851 16.8327 5.87351L11.6827 2.26517C10.516 1.44851 8.64102 1.49017 7.51602 2.36517Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8.75 15H11.25C12.625 15 13.75 13.875 13.75 12.5V10C13.75 8.625 12.625 7.5 11.25 7.5H8.75C7.375 7.5 6.25 8.625 6.25 10V12.5C6.25 13.875 7.375 15 8.75 15Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10 7.5V15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M6.25 11.25H13.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`
		},
		{
			id: 'sessions',
			label: 'Sessions',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.3086 7.39844H14.6836" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5.31641 7.39844L5.94141 8.02344L7.81641 6.14844" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10.3086 13.2344H14.6836" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5.31641 13.2344L5.94141 13.8594L7.81641 11.9844" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M7.49935 18.3307H12.4993C16.666 18.3307 18.3327 16.6641 18.3327 12.4974V7.4974C18.3327 3.33073 16.666 1.66406 12.4993 1.66406H7.49935C3.33268 1.66406 1.66602 3.33073 1.66602 7.4974V12.4974C1.66602 16.6641 3.33268 18.3307 7.49935 18.3307Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`
		},
		{
			id: 'agenda',
			label: 'Agenda',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.1426 10.2109V13.9609C14.1426 17.0859 12.8926 18.3359 9.76758 18.3359H6.01758C2.89258 18.3359 1.64258 17.0859 1.64258 13.9609V10.2109C1.64258 7.08594 2.89258 5.83594 6.01758 5.83594H9.76758C12.8926 5.83594 14.1426 7.08594 14.1426 10.2109Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M18.3077 6.2474C18.3077 8.63906 16.4827 10.5974 14.141 10.8057V10.2057C14.141 7.08073 12.891 5.83073 9.76602 5.83073H9.16602C9.37435 3.48906 11.3327 1.66406 13.7243 1.66406C16.0493 1.66406 17.966 3.38906 18.2577 5.63906C18.291 5.83073 18.3077 6.03906 18.3077 6.2474Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`
		},
		{
			id: 'community',
			label: 'Community',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.0004 5.96407C14.9504 5.95573 14.8921 5.95573 14.8421 5.96407C13.6921 5.9224 12.7754 4.98073 12.7754 3.81406C12.7754 2.6224 13.7337 1.66406 14.9254 1.66406C16.1171 1.66406 17.0754 2.63073 17.0754 3.81406C17.0671 4.98073 16.1504 5.9224 15.0004 5.96407Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M14.1422 12.0309C15.2839 12.2225 16.5422 12.0225 17.4255 11.4309C18.6005 10.6475 18.6005 9.3642 17.4255 8.58086C16.5339 7.9892 15.2589 7.78919 14.1172 7.98919" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M4.97344 5.96407C5.02344 5.95573 5.08177 5.95573 5.13177 5.96407C6.28177 5.9224 7.19844 4.98073 7.19844 3.81406C7.19844 2.6224 6.24011 1.66406 5.04844 1.66406C3.85677 1.66406 2.89844 2.63073 2.89844 3.81406C2.90677 4.98073 3.82344 5.9224 4.97344 5.96407Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5.83255 12.0309C4.69088 12.2225 3.43255 12.0225 2.54922 11.4309C1.37422 10.6475 1.37422 9.3642 2.54922 8.58086C3.44089 7.9892 4.71588 7.78919 5.85755 7.98919" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10.0004 12.1906C9.95039 12.1823 9.89206 12.1823 9.84206 12.1906C8.69206 12.149 7.77539 11.2073 7.77539 10.0406C7.77539 8.84896 8.73372 7.89062 9.92539 7.89062C11.1171 7.89062 12.0754 8.85729 12.0754 10.0406C12.0671 11.2073 11.1504 12.1573 10.0004 12.1906Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M7.57461 14.8187C6.39961 15.6021 6.39961 16.8854 7.57461 17.6687C8.90794 18.5604 11.0913 18.5604 12.4246 17.6687C13.5996 16.8854 13.5996 15.6021 12.4246 14.8187C11.0996 13.9354 8.90794 13.9354 7.57461 14.8187Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`
		},
		{
			id: 'media',
			label: 'Media / FAQs',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.441 17.0177H5.17435C2.54102 17.0177 1.66602 15.2677 1.66602 13.5094V6.49271C1.66602 3.85937 2.54102 2.98438 5.17435 2.98438H10.441C13.0743 2.98438 13.9493 3.85937 13.9493 6.49271V13.5094C13.9493 16.1427 13.066 17.0177 10.441 17.0177Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M16.2659 14.2482L13.9492 12.6232V7.36482L16.2659 5.73982C17.3992 4.94816 18.3326 5.43149 18.3326 6.82316V13.1732C18.3326 14.5648 17.3992 15.0482 16.2659 14.2482Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M9.58398 9.16406C10.2743 9.16406 10.834 8.60442 10.834 7.91406C10.834 7.22371 10.2743 6.66406 9.58398 6.66406C8.89363 6.66406 8.33398 7.22371 8.33398 7.91406C8.33398 8.60442 8.89363 9.16406 9.58398 9.16406Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`
		},
		{
			id: 'admin',
			label: 'Admin & Team',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.63411 9.05573C7.55078 9.0474 7.45078 9.0474 7.35911 9.05573C5.37578 8.98906 3.80078 7.36406 3.80078 5.36406C3.80078 3.3224 5.45078 1.66406 7.50078 1.66406C9.54245 1.66406 11.2008 3.3224 11.2008 5.36406C11.1924 7.36406 9.61745 8.98906 7.63411 9.05573Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M13.6747 3.33594C15.2914 3.33594 16.5914 4.64427 16.5914 6.2526C16.5914 7.8276 15.3414 9.11094 13.7831 9.16927C13.7164 9.16094 13.6414 9.16094 13.5664 9.16927" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3.46758 12.1359C1.45091 13.4859 1.45091 15.6859 3.46758 17.0276C5.75924 18.5609 9.51758 18.5609 11.8092 17.0276C13.8259 15.6776 13.8259 13.4776 11.8092 12.1359C9.52591 10.6109 5.76758 10.6109 3.46758 12.1359Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M15.2832 16.6641C15.8832 16.5391 16.4499 16.2974 16.9165 15.9391C18.2165 14.9641 18.2165 13.3557 16.9165 12.3807C16.4582 12.0307 15.8999 11.7974 15.3082 11.6641" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`
		},
		{
			id: 'surveys',
			label: 'Surveys & Feedback',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18.3327 8.33073V12.4974C18.3327 16.6641 16.666 18.3307 12.4993 18.3307H7.49935C3.33268 18.3307 1.66602 16.6641 1.66602 12.4974V7.4974C1.66602 3.33073 3.33268 1.66406 7.49935 1.66406H11.666" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M18.3327 8.33073H14.9993C12.4993 8.33073 11.666 7.4974 11.666 4.9974V1.66406L18.3327 8.33073Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5.83398 10.8359H10.834" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5.83398 14.1641H9.16732" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`
		}
	];

	let activeTab = 'rooms';
</script>

<div class="max-w-6xl">
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
		<h1 class="mb-10 text-3xl font-bold md:text-4xl">Megaexe Party</h1>

		<Nav {tabs} bind:activeTab />
	</div>
	{#if activeTab === 'rooms'}
		<Rooms />
	{:else if activeTab === 'sessions'}
		<Sessions />
	{:else if activeTab === 'agenda'}
		<Agenda />
	{:else if activeTab === 'community'}
		<Community />
	{:else if activeTab === 'media'}
		<Media />
	{:else if activeTab === 'admin'}
		<Admin />
	{:else if activeTab === 'surveys'}
		<Surveys />
	{/if}
</div>
