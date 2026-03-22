<script lang="ts">
	import { page } from '$app/stores';
	import { getEventTheme } from '$lib/stores/eventTheme';
	import type { Color } from '$lib/utils/colors';
	import { colors } from '$lib/utils/colors';

	let themeColor: Color = colors[0];
	$: {
		const match = $page.url.pathname.match(/^\/event-page\/([^/]+)/);
		if (match) themeColor = getEventTheme(match[1]);
	}

	type Participant = { name: string; role: string; avatar: string; rooms: number; sessions: number };

	const speakers: Participant[] = [
		{ name: 'Dr. Bellamy N', role: 'Speaker', avatar: '/user1-icon.svg', rooms: 4, sessions: 3 },
		{ name: 'Dr. Bellamy N', role: 'Speaker', avatar: '/user2-icon.svg', rooms: 4, sessions: 2 },
		{ name: 'Imabong Ekemini', role: 'Speaker', avatar: '/user3-icon.svg', rooms: 4, sessions: 1 },
		{ name: 'Imabong Ekemini', role: 'Speaker', avatar: '/user1-icon.svg', rooms: 4, sessions: 0 },
		{ name: 'Imabong Ekemini', role: 'Speaker', avatar: '/user2-icon.svg', rooms: 4, sessions: 3 }
	];

	const exhibitors: Participant[] = [
		{ name: 'TechVentures Co.', role: 'Exhibitor', avatar: '/user3-icon.svg', rooms: 2, sessions: 1 },
		{ name: 'InnovateLab', role: 'Exhibitor', avatar: '/user1-icon.svg', rooms: 1, sessions: 2 },
		{ name: 'FutureBuild Inc.', role: 'Exhibitor', avatar: '/user2-icon.svg', rooms: 3, sessions: 0 }
	];

	const vendors: Participant[] = [
		{ name: 'CaterPro Services', role: 'Vendor', avatar: '/user1-icon.svg', rooms: 1, sessions: 0 },
		{ name: 'AV Solutions Ltd.', role: 'Vendor', avatar: '/user3-icon.svg', rooms: 2, sessions: 1 }
	];

	let activeTab: 'speakers' | 'exhibitors' | 'vendors' = 'speakers';
	let search = '';

	$: currentList = activeTab === 'speakers' ? speakers : activeTab === 'exhibitors' ? exhibitors : vendors;
	$: filtered = search
		? currentList.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
		: currentList;
</script>

<div class="w-full max-w-4xl">
	<!-- Header -->
	<div class="mb-6 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold" style="color: {themeColor.text};">Participants</h1>
			<p class="mt-1 text-sm" style="color: {themeColor.lightText};">
				Speakers, exhibitors, and vendors for Megaexe Party
			</p>
		</div>
	</div>

	<!-- Tab switcher -->
	<div class="mb-5 flex gap-2">
		{#each (['speakers', 'exhibitors', 'vendors'] as const) as tab}
			<button
				class="rounded-[10px] px-4 py-2 text-sm font-medium capitalize transition-colors"
				style={activeTab === tab
					? `background-color: ${themeColor.button}; color: ${themeColor.buttonText};`
					: `background-color: ${themeColor.cover}; color: ${themeColor.lightText}; border: 1px solid ${themeColor.toggle};`}
				on:click={() => (activeTab = tab)}
			>
				{tab}
			</button>
		{/each}
	</div>

	<!-- Search -->
	<div class="mb-5 flex items-center gap-2 rounded-xl px-4 py-2.5" style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: {themeColor.lightText};">
			<path d="M11 20C15.9706 20 20 15.9706 20 11C20 6.02944 15.9706 2 11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			<path d="M18.9299 20.6898C19.4599 22.2898 20.6699 22.4498 21.5999 21.0498C22.4499 19.7698 21.8899 18.7198 20.3499 18.7198C19.2099 18.7098 18.5699 19.5998 18.9299 20.6898Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
		</svg>
		<input
			type="text"
			bind:value={search}
			placeholder="Search by name..."
			class="flex-1 bg-transparent text-sm outline-none"
			style="color: {themeColor.text};"
		/>
	</div>

	<!-- Cards grid -->
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
		{#each filtered as participant}
			<div
				class="flex flex-col items-center gap-3 rounded-2xl p-4 text-center transition-shadow hover:shadow-md"
				style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};"
			>
				<img
					src={participant.avatar}
					alt={participant.name}
					class="h-16 w-16 rounded-full object-cover"
					style="border: 2px solid {themeColor.toggle};"
				/>
				<div>
					<p class="text-sm font-semibold" style="color: {themeColor.text};">{participant.name}</p>
					<span
						class="mt-1 inline-block rounded-full px-2 py-0.5 text-xs"
						style="background-color: {themeColor.smallCover}; color: {themeColor.lightText};"
					>{participant.role}</span>
				</div>
				<div class="flex w-full items-center justify-center gap-2 border-t pt-2 text-xs" style="border-color: {themeColor.toggle}; color: {themeColor.lightText};">
					<span>{participant.rooms} Rooms</span>
					<span style="color: {themeColor.toggle};">|</span>
					<span>{participant.sessions} Sessions</span>
				</div>
			</div>
		{/each}

		{#if filtered.length === 0}
			<div class="col-span-full py-12 text-center text-sm" style="color: {themeColor.lightText};">
				No participants found.
			</div>
		{/if}
	</div>
</div>
