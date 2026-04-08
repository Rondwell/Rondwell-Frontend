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
			icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`
		},
		{
			id: 'payment',
			label: 'Payment',
			icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`
		},
		{
			id: 'options',
			label: 'Options',
			icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`
		},
		{
			id: 'admins',
			label: 'Admins',
			icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
		},
		{
			id: 'tags',
			label: 'Tags',
			icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`
		},
		{
			id: 'embed',
			label: 'Embed',
			icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`
		},
		{
			id: 'send-limit',
			label: 'Send Limit',
			icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`
		},
		{
			id: 'rondwell-plus',
			label: 'Rondwell Plus',
			icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
		}
	];
</script>

<div class="min-h-screen">
	<div class="px-1 py-4 sm:px-4">
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
