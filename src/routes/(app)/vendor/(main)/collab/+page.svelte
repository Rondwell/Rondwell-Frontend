<script lang="ts">
	import Nav from '../../../components/Nav.svelte';
	import InboundOrders from './components/InboundOrders.svelte';
	import AcceptedCollaborations from './components/AcceptedCollaborations.svelte';
	import SentRequests from './components/SentRequests.svelte';

	let activeTab = 'inbound';

	const tabs = [
		{
			id: 'inbound',
			label: 'Inbound Order Requests',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M10 18.9583C5.05833 18.9583 1.04167 14.9417 1.04167 10C1.04167 5.05833 5.05833 1.04167 10 1.04167C14.9417 1.04167 18.9583 5.05833 18.9583 10C18.9583 14.9417 14.9417 18.9583 10 18.9583ZM10 2.29167C5.75 2.29167 2.29167 5.75 2.29167 10C2.29167 14.25 5.75 17.7083 10 17.7083C14.25 17.7083 17.7083 14.25 17.7083 10C17.7083 5.75 14.25 2.29167 10 2.29167Z" fill="currentColor"/>
				<path d="M10 13.125C9.65833 13.125 9.375 12.8417 9.375 12.5V7.5C9.375 7.15833 9.65833 6.875 10 6.875C10.3417 6.875 10.625 7.15833 10.625 7.5V12.5C10.625 12.8417 10.3417 13.125 10 13.125Z" fill="currentColor"/>
			</svg>`
		},
		{
			id: 'accepted',
			label: 'Accepted Collaborations',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M7.5 13.125C7.35833 13.125 7.21667 13.0667 7.10833 12.9583L4.60833 10.4583C4.39167 10.2417 4.39167 9.89167 4.60833 9.675C4.825 9.45833 5.175 9.45833 5.39167 9.675L7.5 11.7833L14.6083 4.675C14.825 4.45833 15.175 4.45833 15.3917 4.675C15.6083 4.89167 15.6083 5.24167 15.3917 5.45833L7.89167 12.9583C7.78333 13.0667 7.64167 13.125 7.5 13.125Z" fill="currentColor"/>
			</svg>`
		},
		{
			id: 'sent',
			label: 'Sent Collaboration Requests',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M8.33333 13.9583C8.19167 13.9583 8.05 13.9 7.94167 13.7917C7.725 13.575 7.725 13.225 7.94167 13.0083L11.7833 9.16667L7.94167 5.325C7.725 5.10833 7.725 4.75833 7.94167 4.54167C8.15833 4.325 8.50833 4.325 8.725 4.54167L13.0583 8.875C13.275 9.09167 13.275 9.44167 13.0583 9.65833L8.725 13.9917C8.61667 13.9 8.475 13.9583 8.33333 13.9583Z" fill="currentColor"/>
			</svg>`
		},
		{
			id: 'financials',
			label: 'Financials',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M13.3333 18.9583H6.66667C2.91667 18.9583 1.04167 17.0833 1.04167 13.3333V6.66667C1.04167 2.91667 2.91667 1.04167 6.66667 1.04167H13.3333C17.0833 1.04167 18.9583 2.91667 18.9583 6.66667V13.3333C18.9583 17.0833 17.0833 18.9583 13.3333 18.9583ZM6.66667 2.29167C3.60833 2.29167 2.29167 3.60833 2.29167 6.66667V13.3333C2.29167 16.3917 3.60833 17.7083 6.66667 17.7083H13.3333C16.3917 17.7083 17.7083 16.3917 17.7083 13.3333V6.66667C17.7083 3.60833 16.3917 2.29167 13.3333 2.29167H6.66667Z" fill="currentColor"/>
				<path d="M10 14.375C9.65833 14.375 9.375 14.0917 9.375 13.75V6.25C9.375 5.90833 9.65833 5.625 10 5.625C10.3417 5.625 10.625 5.90833 10.625 6.25V13.75C10.625 14.0917 10.3417 14.375 10 14.375Z" fill="currentColor"/>
			</svg>`
		},
		{
			id: 'calendar',
			label: 'My Calendar/Bookings',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M6.66667 1.875C6.325 1.875 6.04167 1.59167 6.04167 1.25C6.04167 0.908333 6.325 0.625 6.66667 0.625C7.00833 0.625 7.29167 0.908333 7.29167 1.25C7.29167 1.59167 7.00833 1.875 6.66667 1.875Z" fill="currentColor"/>
				<path d="M13.3333 1.875C12.9917 1.875 12.7083 1.59167 12.7083 1.25C12.7083 0.908333 12.9917 0.625 13.3333 0.625C13.675 0.625 13.9583 0.908333 13.9583 1.25C13.9583 1.59167 13.675 1.875 13.3333 1.875Z" fill="currentColor"/>
				<path d="M7.08333 12.0833H5.41667C5.075 12.0833 4.79167 11.8 4.79167 11.4583C4.79167 11.1167 5.075 10.8333 5.41667 10.8333H7.08333C7.425 10.8333 7.70833 11.1167 7.70833 11.4583C7.70833 11.8 7.425 12.0833 7.08333 12.0833Z" fill="currentColor"/>
			</svg>`
		}
	];
</script>

<div class="max-w-6xl">
	<div class="mb-6">
		<h1 class="mb-6 text-3xl font-bold md:text-4xl">Megaexe Limited</h1>
		<Nav {tabs} bind:activeTab />
	</div>

	{#if activeTab === 'inbound'}
		<InboundOrders />
	{:else if activeTab === 'accepted'}
		<AcceptedCollaborations />
	{:else if activeTab === 'sent'}
		<SentRequests />
	{:else if activeTab === 'financials'}
		<div class="flex h-50 flex-col items-center justify-center">
			<p class="text-gray-500">Financials module coming soon...</p>
		</div>
	{:else if activeTab === 'calendar'}
		<div class="flex h-50 flex-col items-center justify-center">
			<p class="text-gray-500">Calendar/Bookings module coming soon...</p>
		</div>
	{/if}
</div>
