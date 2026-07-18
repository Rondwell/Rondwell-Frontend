<script lang="ts">
	import { authState } from '$lib/stores/auth.store';
	import Nav from '../../components/Nav.svelte';
	import Account from './Components/Account.svelte';
	import CallbackDomains from './Components/CallbackDomains.svelte';
	import NotificationPreferences from './Components/NotificationPreferences.svelte';
	import Orders from './Components/Orders.svelte';
	import PaymentMethods from './Components/PaymentMethods.svelte';
	import Subscription from './Components/Subscription.svelte';
	import Wallet from './Components/Wallet.svelte';

	let activeTab = 'account';

	$: isOrganizer = $authState.activeProfile?.role === 'ORGANIZER';

	// Tab persistence (read on load + write on change) is handled by the shared
	// Nav component via the `tab` query param.

	// Static tab set. Preferences and Custom Domains are no longer top-level
	// tabs — they live as sections inside the Account tab. Tax / escrows /
	// refunds / disputes are reachable as entry cards inside Payments, and
	// purchases / tickets inside Orders.
	const tabs = [
		{
			id: 'account',
			label: 'Account',
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
			id: 'wallet',
			label: 'Wallet',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.8327 9.29167H5.83268" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M1.66602 9.29232V5.45065C1.66602 3.72482 3.06602 2.32482 4.79185 2.32482H9.37435C11.1002 2.32482 12.5002 3.39982 12.5002 5.12565" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.5672 10.1172C14.1505 10.5089 13.9255 11.0922 13.9922 11.7089C14.0922 12.6839 14.9838 13.3922 15.9672 13.3922H17.5005V14.5422C17.5005 16.3339 16.0422 17.7922 14.2505 17.7922H4.58382C2.79215 17.7922 1.33382 16.3339 1.33382 14.5422V8.62552C1.33382 6.83385 2.79215 5.37552 4.58382 5.37552H14.2505C16.0338 5.37552 17.5005 6.84219 17.5005 8.62552V10.1089H15.8588C15.3505 10.1089 14.8838 10.3089 14.5672 10.1172Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.3338 10.8161V12.6828C18.3338 13.0745 18.0172 13.3911 17.6172 13.3911H15.9338C15.1672 13.3911 14.4672 12.8161 14.4005 12.0495C14.3588 11.5995 14.5255 11.1745 14.8172 10.8745C15.0755 10.6078 15.4338 10.4578 15.8255 10.4578H17.6172C18.0172 10.4578 18.3338 10.7745 18.3338 11.1661V10.8161Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
		},
		{
			id: 'payments',
			label: 'Payments',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.66699 7.08333H18.3337" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 13.75H6.66667" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.75 13.75H12.0833" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.36699 2.91667H14.6253C17.592 2.91667 18.3337 3.65 18.3337 6.58333V13.4167C18.3337 16.35 17.592 17.0833 14.6337 17.0833H5.36699C2.40866 17.0833 1.66699 16.35 1.66699 13.4167V6.58333C1.66699 3.65 2.40866 2.91667 5.36699 2.91667Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
		},
		{
			id: 'subscription',
			label: 'Subscription',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 1.66667L12.575 6.88333L18.3333 7.725L14.1667 11.7833L15.15 17.5167L10 14.8083L4.85 17.5167L5.83333 11.7833L1.66667 7.725L7.425 6.88333L10 1.66667Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
		},
		{
			id: 'orders',
			label: 'Orders',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 2.5H3.83333L5.5 12.5H15.5L17.5 5.83333H4.83333" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.66667 17.5C7.35702 17.5 7.91667 16.9404 7.91667 16.25C7.91667 15.5596 7.35702 15 6.66667 15C5.97631 15 5.41667 15.5596 5.41667 16.25C5.41667 16.9404 5.97631 17.5 6.66667 17.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.1667 17.5C14.857 17.5 15.4167 16.9404 15.4167 16.25C15.4167 15.5596 14.857 15 14.1667 15C13.4763 15 12.9167 15.5596 12.9167 16.25C12.9167 16.9404 13.4763 17.5 14.1667 17.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
		}
	];
</script>

<div class="w-full max-w-4xl">
	<!-- Page Header -->
	<h1 class="mb-12 text-3xl font-bold">Settings</h1>

	<!-- Navigation Tabs -->
	<Nav {tabs} bind:activeTab />

	<!-- Content Area -->
	{#if activeTab === 'account'}
		<Account />
		<NotificationPreferences />
		{#if isOrganizer}
			<CallbackDomains />
		{/if}
	{:else if activeTab === 'wallet'}
		<Wallet />
	{:else if activeTab === 'payments'}
		<PaymentMethods />
	{:else if activeTab === 'subscription'}
		<Subscription />
	{:else if activeTab === 'orders'}
		<Orders />
	{/if}
</div>
