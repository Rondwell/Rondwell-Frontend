<script lang="ts">
	import Profile from './Components/Profile.svelte';
	import Notifications from './Components/Notifications.svelte';
	import Payment from './Components/Payment.svelte';
	import Nav from '../../../components/Nav.svelte';

	let activeTab = 'profile details';

	const tabs = [
		{
			id: 'profile details',
			label: 'Profile Details',
			icon: `				<svg
					width="20"
					height="20"
					viewBox="0 0 20 20"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M10 18.9552C9.41667 18.9552 8.825 18.7302 8.38333 18.2885L6.95831 16.8802C6.60831 16.5302 6.12501 16.3385 5.63334 16.3385H5C3.275 16.3385 1.875 14.9469 1.875 13.2385V4.14685C1.875 2.43852 3.275 1.04688 5 1.04688H15C16.725 1.04688 18.125 2.43852 18.125 4.14685V13.2385C18.125 14.9469 16.725 16.3385 15 16.3385H14.3667C13.875 16.3385 13.3917 16.5385 13.0417 16.8802L11.6167 18.2885C11.175 18.7302 10.5833 18.9552 10 18.9552ZM5 2.28853C3.96667 2.28853 3.125 3.12184 3.125 4.13851V13.2302C3.125 14.2552 3.96667 15.0802 5 15.0802H5.63334C6.45834 15.0802 7.25831 15.4135 7.84164 15.9885L9.26666 17.3969C9.675 17.7969 10.3333 17.7969 10.7417 17.3969L12.1666 15.9885C12.75 15.4135 13.55 15.0802 14.375 15.0802H15C16.0333 15.0802 16.875 14.2469 16.875 13.2302V4.13851C16.875 3.11351 16.0333 2.28853 15 2.28853H5Z"
						fill="currentColor"
					/>
					<path
						d="M10 4.32812C11.1405 4.32812 12.0673 5.25412 12.0674 6.39453C12.0674 7.53506 11.1405 8.46191 10 8.46191C8.8596 8.46177 7.93359 7.53496 7.93359 6.39453C7.93371 5.25421 8.85966 4.32827 10 4.32812ZM10 4.57812C8.99908 4.57827 8.18372 5.39356 8.18359 6.39453C8.18359 7.39558 8.99898 8.21176 10 8.21191C11.0011 8.21191 11.8174 7.39567 11.8174 6.39453C11.8173 5.39347 11.001 4.57812 10 4.57812Z"
						fill="currentColor"
						stroke="currentColor"
					/>
					<path
						d="M13.3346 13.6776C12.993 13.6776 12.7096 13.3942 12.7096 13.0526C12.7096 11.9026 11.493 10.9609 10.0013 10.9609C8.50964 10.9609 7.29297 11.9026 7.29297 13.0526C7.29297 13.3942 7.00964 13.6776 6.66797 13.6776C6.3263 13.6776 6.04297 13.3942 6.04297 13.0526C6.04297 11.2109 7.81797 9.71094 10.0013 9.71094C12.1846 9.71094 13.9596 11.2109 13.9596 13.0526C13.9596 13.3942 13.6763 13.6776 13.3346 13.6776Z"
						fill="currentColor"
					/>
				</svg>`
		},
		{
	id: 'payment & financial',
	label: 'Payment & Financial',
	icon: `<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M12 2v20"
			stroke="currentColor"
			stroke-width="1.8"
			stroke-linecap="round"
		/>
		<path
			d="M17 7.5c0-2.2-2.2-4-5-4s-5 1.8-5 4 2 4 5 4 5 1.8 5 4-2.2 4-5 4-5-1.8-5-4"
			stroke="currentColor"
			stroke-width="1.8"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>`
},
		{
	id: 'notifications',
	label: 'Notifications',
	icon: `<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9Z"
			stroke="currentColor"
			stroke-width="1.8"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<path
			d="M13.73 21a2 2 0 01-3.46 0"
			stroke="currentColor"
			stroke-width="1.8"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>`
}

	];
</script>

<div class="w-full max-w-4xl">
	<!-- Page Header -->
	<h1 class="mb-12 text-3xl font-bold">Settings</h1>

	<!-- Navigation Tabs -->
	<Nav {tabs} bind:activeTab />

	<!-- Content Area -->
	{#if activeTab === 'profile details'}
		<Profile />
	{:else if activeTab === 'payment & financial'}
		<Payment />
	{:else if activeTab === 'notifications'}
		<Notifications />
	{/if}
</div>
