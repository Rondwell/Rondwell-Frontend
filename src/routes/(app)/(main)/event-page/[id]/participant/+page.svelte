<script lang="ts">
	import { page } from '$app/stores';
	import { getPublicParticipants } from '$lib/services/event.services';
	import { getEventTheme } from '$lib/stores/eventTheme';
	import type { Color } from '$lib/utils/colors';
	import { colors } from '$lib/utils/colors';
	import Icon from '@iconify/svelte';
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

	/**
	 * The API returns a normalized participant: `{ id, role, name,
	 * profilePictureUrl, title, company, bio, publicProfileSlug, socialLinks }`.
	 * This template previously read `name`/`firstName`/`lastName`,
	 * `socialLinks.instagram` and `socialLinks.x` — none of which the API ever
	 * sent — so every card rendered a blank heading and the letter "P".
	 */
	function displayName(p: any): string {
		return p?.name || p?.company || 'Participant';
	}

	function initial(p: any): string {
		return displayName(p).trim().charAt(0).toUpperCase() || 'P';
	}

	function profileHref(p: any): string {
		const prefix = p.role === 'VENDOR' ? 'v' : p.role === 'EXHIBITOR' ? 'x' : 's';
		return `/${prefix}/${p.publicProfileSlug}`;
	}

	/** Handles both bare handles ("janedoe") and full URLs stored by users. */
	function socialUrl(kind: 'linkedin' | 'twitter' | 'website', value: string): string {
		const v = (value || '').trim();
		if (/^https?:\/\//i.test(v)) return v;
		if (kind === 'linkedin') return `https://linkedin.com/in/${v.replace(/^\/+/, '')}`;
		if (kind === 'twitter') return `https://x.com/${v.replace(/^@/, '')}`;
		return `https://${v}`;
	}
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
		{#each currentList as participant (participant.id)}
		<div class="flex flex-col items-center gap-3 rounded-2xl p-5 text-center"
			style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};">
			{#if participant.profilePictureUrl}
			<img src={participant.profilePictureUrl} alt={displayName(participant)} class="h-16 w-16 rounded-full object-cover" />
			{:else}
			<div class="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold" style="background-color: {themeColor.smallCover}; color: {themeColor.text};">
				{initial(participant)}
			</div>
			{/if}
			<div>
				<h3 class="text-sm font-semibold" style="color: {themeColor.text};">
					{#if participant.publicProfileSlug}
						<a href={profileHref(participant)} target="_blank" rel="noopener noreferrer" class="hover:underline">
							{displayName(participant)}
						</a>
					{:else}
						{displayName(participant)}
					{/if}
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
			<div class="flex gap-3">
				{#if participant.socialLinks.linkedin}
				<a href={socialUrl('linkedin', participant.socialLinks.linkedin)} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" style="color: {themeColor.lightText};">
					<Icon icon="mdi:linkedin" class="h-4 w-4" />
				</a>
				{/if}
				{#if participant.socialLinks.twitter}
				<a href={socialUrl('twitter', participant.socialLinks.twitter)} target="_blank" rel="noopener noreferrer" aria-label="X" style="color: {themeColor.lightText};">
					<Icon icon="mdi:twitter" class="h-4 w-4" />
				</a>
				{/if}
				{#if participant.socialLinks.website}
				<a href={socialUrl('website', participant.socialLinks.website)} target="_blank" rel="noopener noreferrer" aria-label="Website" style="color: {themeColor.lightText};">
					<Icon icon="mdi:web" class="h-4 w-4" />
				</a>
				{/if}
			</div>
			{/if}
		</div>
		{/each}
	</div>
	{/if}
</div>
