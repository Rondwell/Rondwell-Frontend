<script lang="ts">
	import Nav from '../../../../components/Nav.svelte';
	import CommunityTab from './components/CommunityTab.svelte';
	import NewsletterTab from './components/NewsletterTab.svelte';
	import SubscribersTab from './components/SubscribersTab.svelte';

	let activeTab = 'newsletter';

	const tabs = [
		{
			id: 'newsletter',
			label: 'Newsletter',
			icon: `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.125 9.027H6.875C6.533 9.027 6.25 8.712 6.25 8.333C6.25 7.953 6.533 7.638 6.875 7.638H13.125C13.467 7.638 13.75 7.953 13.75 8.333C13.75 8.712 13.467 9.027 13.125 9.027Z" fill="currentColor"/><path d="M13.125 14.582H6.875C6.533 14.582 6.25 14.267 6.25 13.888C6.25 13.508 6.533 13.193 6.875 13.193H13.125C13.467 13.193 13.75 13.508 13.75 13.888C13.75 14.267 13.467 14.582 13.125 14.582Z" fill="currentColor"/></svg>`
		},
		{
			id: 'community',
			label: 'Community',
			icon: `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 18.955C9.417 18.955 8.825 18.73 8.383 18.289L6.958 16.88C6.608 16.53 6.125 16.339 5.633 16.339H5C3.275 16.339 1.875 14.947 1.875 13.239V4.147C1.875 2.439 3.275 1.047 5 1.047H15C16.725 1.047 18.125 2.439 18.125 4.147V13.239C18.125 14.947 16.725 16.339 15 16.339H14.367C13.875 16.339 13.392 16.539 13.042 16.88L11.617 18.289C11.175 18.73 10.583 18.955 10 18.955Z" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>`
		},
		{
			id: 'subscribers',
			label: 'Subscribers',
			icon: `<svg width="18" height="18" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.792 0C8.066 0 6.667 1.554 6.667 3.472C6.667 5.389 8.066 6.944 9.792 6.944C11.518 6.944 12.917 5.389 12.917 3.472C12.917 1.554 11.518 0 9.792 0Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M7.292 8.333C5.566 8.333 4.167 9.887 4.167 11.805C4.167 13.722 5.566 15.277 7.292 15.277H12.292C14.018 15.277 15.417 13.722 15.417 11.805C15.417 9.887 14.018 8.333 12.292 8.333H7.292Z" fill="currentColor"/></svg>`
		}
	];
</script>

<div class="px-4">
	<h1 class="mb-4 text-xl font-medium lg:text-2xl">Engage</h1>

	<Nav {tabs} bind:activeTab />

	<div class="mt-2">
		{#if activeTab === 'newsletter'}
			<NewsletterTab />
		{:else if activeTab === 'community'}
			<CommunityTab />
		{:else if activeTab === 'subscribers'}
			<SubscribersTab />
		{/if}
	</div>
</div>
