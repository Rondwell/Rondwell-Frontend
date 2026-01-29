<script lang="ts">
	import Invitation from './Components/Invite.svelte';
	import Application from './Components/Application.svelte';
	import Enagagement from './Components/Enagagement.svelte';
    import Collab from './Components/Collab.svelte';
	import Nav from '../../../components/Nav.svelte';


	let activeTab = 'invitations';

	const tabs = [
		{
			id: 'invitations',
			label: 'Invitations',
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
	id: 'application',
	label: 'Applications',
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
	id: 'enagagement',
	label: 'Enagagement',
	icon: `<svg
					width="20"
					height="20"
					viewBox="0 0 20 20"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M15.832 18.9557C15.4904 18.9557 15.207 18.6724 15.207 18.3307V9.16406C15.207 8.8224 15.4904 8.53906 15.832 8.53906C16.1737 8.53906 16.457 8.8224 16.457 9.16406V18.3307C16.457 18.6724 16.1737 18.9557 15.832 18.9557Z"
						fill="currentColor"
					/>
					<path
						d="M15.832 6.45573C15.4904 6.45573 15.207 6.1724 15.207 5.83073V1.66406C15.207 1.3224 15.4904 1.03906 15.832 1.03906C16.1737 1.03906 16.457 1.3224 16.457 1.66406V5.83073C16.457 6.1724 16.1737 6.45573 15.832 6.45573Z"
						fill="currentColor"
					/>
					<path
						d="M10 18.9557C9.65833 18.9557 9.375 18.6724 9.375 18.3307V14.1641C9.375 13.8224 9.65833 13.5391 10 13.5391C10.3417 13.5391 10.625 13.8224 10.625 14.1641V18.3307C10.625 18.6724 10.3417 18.9557 10 18.9557Z"
						fill="currentColor"
					/>
					<path
						d="M10 11.4557C9.65833 11.4557 9.375 11.1724 9.375 10.8307V1.66406C9.375 1.3224 9.65833 1.03906 10 1.03906C10.3417 1.03906 10.625 1.3224 10.625 1.66406V10.8307C10.625 11.1724 10.3417 11.4557 10 11.4557Z"
						fill="currentColor"
					/>
					<path
						d="M4.16797 18.9557C3.8263 18.9557 3.54297 18.6724 3.54297 18.3307V9.16406C3.54297 8.8224 3.8263 8.53906 4.16797 8.53906C4.50964 8.53906 4.79297 8.8224 4.79297 9.16406V18.3307C4.79297 18.6724 4.50964 18.9557 4.16797 18.9557Z"
						fill="currentColor"
					/>
					<path
						d="M4.16797 6.45573C3.8263 6.45573 3.54297 6.1724 3.54297 5.83073V1.66406C3.54297 1.3224 3.8263 1.03906 4.16797 1.03906C4.50964 1.03906 4.79297 1.3224 4.79297 1.66406V5.83073C4.79297 6.1724 4.50964 6.45573 4.16797 6.45573Z"
						fill="currentColor"
					/>
					<path
						d="M5.83333 9.78906H2.5C2.15833 9.78906 1.875 9.50573 1.875 9.16406C1.875 8.8224 2.15833 8.53906 2.5 8.53906H5.83333C6.175 8.53906 6.45833 8.8224 6.45833 9.16406C6.45833 9.50573 6.175 9.78906 5.83333 9.78906Z"
						fill="currentColor"
					/>
					<path
						d="M17.5013 9.78906H14.168C13.8263 9.78906 13.543 9.50573 13.543 9.16406C13.543 8.8224 13.8263 8.53906 14.168 8.53906H17.5013C17.843 8.53906 18.1263 8.8224 18.1263 9.16406C18.1263 9.50573 17.843 9.78906 17.5013 9.78906Z"
						fill="currentColor"
					/>
					<path
						d="M11.6654 11.4609H8.33203C7.99036 11.4609 7.70703 11.1776 7.70703 10.8359C7.70703 10.4943 7.99036 10.2109 8.33203 10.2109H11.6654C12.007 10.2109 12.2904 10.4943 12.2904 10.8359C12.2904 11.1776 12.007 11.4609 11.6654 11.4609Z"
						fill="currentColor"
					/>
				</svg>`
		},{
  id: 'collaboration',
  label: 'Collaboration',
  icon: `<svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Person -->
    <path
      d="M12 12a4 4 0 100-8 4 4 0 000 8Z"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M4 20c0-3.3137 3.5817-6 8-6"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Circular Settings Gear -->
    <circle
      cx="17.5"
      cy="16.5"
      r="3"
      stroke="currentColor"
      stroke-width="1.5"
    />
    <path
      d="M17.5 14.5v1M17.5 17.5v1M15.5 16.5h1M18.5 16.5h1"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
  </svg>`
}


	];
    const vendorName = 'Innocent James';
</script>

<div class="w-full max-w-4xl">
	<!-- Page Header -->
	<div class="mb-8 flex items-center gap-3">
		<img src="/tech-icon.svg" alt="logo" class="h-8 w-8 rounded-lg object-cover" />
		<h1 class="text-2xl font-bold">{vendorName}</h1>
	</div>

	<!-- Navigation Tabs -->
	<Nav {tabs} bind:activeTab />

	<!-- Content Area -->
	{#if activeTab === 'invitations'}
		<Invitation />
	{:else if activeTab === 'application'}
		<Application />
	{:else if activeTab === 'enagagement'}
		<Enagagement />
    {:else if activeTab === 'collaboration'}
        <Collab />
	{/if}
</div>
