<script lang="ts">
	import { page } from '$app/stores';
	import { getPublicParticipants } from '$lib/services/event.services';
	import { getEventTheme } from '$lib/stores/eventTheme';
	import type { Color } from '$lib/utils/colors';
	import { colors } from '$lib/utils/colors';
	import { onMount } from 'svelte';

	$: eventId = $page.params.id ?? '';
	let themeColor: Color = colors[0];
	$: if (eventId) themeColor = getEventTheme(eventId);

	let speakers: any[] = [];
	let exhibitors: any[] = [];
	let vendors: any[] = [];
	let loading = true;
	let activeTab = 'speakers';

	onMount(async () => {
		if (!eventId) return;
		try {
			const data = await getPublicParticipants(eventId);
			speakers = data.speakers;
			exhibitors = data.exhibitors;
			vendors = data.vendors;
		} catch { /* empty */ }
		finally { loading = false; }
	});

	$: currentList = activeTab === 'speakers' ? speakers : activeTab === 'exhibitors' ? exhibitors : vendors;

	const tabs = [
		{ id: 'speakers', label: 'Speakers' },
		{ id: 'exhibitors', label: 'Exhibitors' },
		{ id: 'vendors', label: 'Vendors' },
	];
</script>

<div class="w-full max-w-4xl">
	<div class="mb-6">
		<h1 class="text-2xl font-bold" style="color: {themeColor.text};">Participants</h1>
		<p class="mt-1 text-sm" style="color: {themeColor.lightText};">Speakers, exhibitors, and vendors</p>
	</div>

	<!-- Tabs -->
	<div class="mb-6 flex gap-2">
		{#each tabs as tab}
		<button
			class="rounded-lg px-4 py-2 text-sm font-medium transition-all"
			style="background-color: {activeTab === tab.id ? themeColor.button : themeColor.cover}; color: {activeTab === tab.id ? themeColor.buttonText : themeColor.lightText}; border: 1px solid {activeTab === tab.id ? themeColor.button : themeColor.toggle};"
			on:click={() => activeTab = tab.id}
		>
			{tab.label}
		</button>
		{/each}
	</div>

	{#if loading}
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
		{#each [1, 2, 3] as _}
		<div class="h-48 rounded-2xl" style="background-color: {themeColor.cover};"></div>
		{/each}
	</div>
	{:else if currentList.length === 0}
	<div class="flex h-40 items-center justify-center rounded-2xl" style="background-color: {themeColor.cover};">
		<p class="text-sm" style="color: {themeColor.lightText};">No {activeTab} listed yet.</p>
	</div>
	{:else}
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each currentList as participant}
		<div class="flex flex-col items-center gap-3 rounded-2xl p-5 text-center"
			style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};">
			{#if participant.profilePictureUrl}
			<img src={participant.profilePictureUrl} alt={participant.name ?? 'Participant'} class="h-16 w-16 rounded-full object-cover" />
			{:else}
			<div class="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold" style="background-color: {themeColor.smallCover}; color: {themeColor.text};">
				{(participant.name ?? participant.firstName ?? 'P').charAt(0)}
			</div>
			{/if}
			<div>
				<h3 class="text-sm font-semibold" style="color: {themeColor.text};">
					{participant.name ?? [participant.firstName, participant.lastName].filter(Boolean).join(' ') ?? 'Participant'}
				</h3>
				{#if participant.title || participant.company}
				<p class="text-xs" style="color: {themeColor.lightText};">
					{[participant.title, participant.company].filter(Boolean).join(' at ')}
				</p>
				{/if}
			</div>
			{#if participant.bio}
			<p class="text-xs leading-relaxed line-clamp-3" style="color: {themeColor.lightText};">{participant.bio}</p>
			{/if}
			{#if participant.socialLinks}
			<div class="flex gap-2">
				{#if participant.socialLinks?.instagram}
				<a href="https://instagram.com/{participant.socialLinks.instagram}" target="_blank" rel="noopener" aria-label="Instagram" class="text-xs" style="color: {themeColor.lightText};">IG</a>
				{/if}
				{#if participant.socialLinks?.x}
				<a href="https://x.com/{participant.socialLinks.x}" target="_blank" rel="noopener" aria-label="X" class="text-xs" style="color: {themeColor.lightText};">X</a>
				{/if}
			</div>
			{/if}
		</div>
		{/each}
	</div>
	{/if}
</div>
