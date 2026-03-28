<script lang="ts">
	import { page } from '$app/stores';
	import { getPublicAgenda } from '$lib/services/event.services';
	import { getEventTheme } from '$lib/stores/eventTheme';
	import type { Color } from '$lib/utils/colors';
	import { colors } from '$lib/utils/colors';
	import { onMount } from 'svelte';

	$: eventId = $page.params.id ?? '';
	let themeColor: Color = colors[0];
	$: if (eventId) themeColor = getEventTheme(eventId);

	let dates: any[] = [];
	let rooms: any[] = [];
	let loading = true;

	let expandedDates: Record<string, boolean> = {};

	onMount(async () => {
		if (!eventId) return;
		try {
			const data = await getPublicAgenda(eventId);
			dates = data.dates;
			rooms = data.rooms;
			if (dates.length > 0) expandedDates[dates[0].date] = true;
		} catch { /* empty agenda */ }
		finally { loading = false; }
	});

	function toggleDate(date: string) {
		expandedDates[date] = !expandedDates[date];
		expandedDates = { ...expandedDates };
	}

	function formatDate(dateStr: string): string {
		if (!dateStr || dateStr === 'TBD') return 'TBD';
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
	}

	function formatTime(dt: string): string {
		if (!dt) return '';
		return new Date(dt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
	}

	function getRoomName(roomId: string): string {
		return rooms.find((r: any) => (r._id || r.id) === roomId)?.name || '';
	}
</script>

<div class="w-full max-w-4xl">
	<div class="mb-6">
		<h1 class="text-2xl font-bold" style="color: {themeColor.text};">Event Agenda</h1>
		<p class="mt-1 text-sm" style="color: {themeColor.lightText};">Sessions and schedule</p>
	</div>

	{#if loading}
	<div class="space-y-4 animate-pulse">
		{#each [1, 2] as _}
		<div class="h-40 rounded-2xl" style="background-color: {themeColor.cover};"></div>
		{/each}
	</div>
	{:else if dates.length === 0}
	<div class="flex h-40 items-center justify-center rounded-2xl" style="background-color: {themeColor.cover};">
		<p class="text-sm" style="color: {themeColor.lightText};">No agenda published yet.</p>
	</div>
	{:else}
	<div class="flex flex-col gap-4">
		{#each dates as group}
		<div class="overflow-hidden rounded-2xl" style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};">
			<button
				class="flex w-full items-center justify-between px-5 py-4 text-left"
				style="background-color: {themeColor.smallCover};"
				on:click={() => toggleDate(group.date)}
			>
				<div class="flex items-center gap-2">
					<span class="font-semibold" style="color: {themeColor.text};">{formatDate(group.date)}</span>
					<span class="rounded-full px-2 py-0.5 text-xs" style="background-color: {themeColor.toggle}; color: {themeColor.text};">
						{group.sessions.length} session{group.sessions.length !== 1 ? 's' : ''}
					</span>
				</div>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
					style="color: {themeColor.lightText}; transform: rotate({expandedDates[group.date] ? '180deg' : '0deg'}); transition: transform 0.2s;">
					<path d="M19 9L12 15L5 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</button>

			{#if expandedDates[group.date]}
			<div class="flex flex-col gap-3 p-4">
				{#each group.sessions as session}
				<div class="flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:gap-5"
					style="background-color: {themeColor.bg}; border: 1px solid {themeColor.toggle};">
					<div class="min-w-[130px]">
						<span class="text-xs font-medium" style="color: {themeColor.lightText};">
							{formatTime(session.startTime)}{session.endTime ? ` – ${formatTime(session.endTime)}` : ''}
						</span>
					</div>
					<div class="flex flex-1 flex-col gap-2">
						<h3 class="text-sm font-semibold" style="color: {themeColor.text};">{session.title}</h3>
						{#if session.description}
						<p class="text-xs leading-relaxed" style="color: {themeColor.lightText};">{session.description}</p>
						{/if}
						<div class="flex flex-wrap items-center gap-3 text-xs" style="color: {themeColor.lightText};">
							{#if session.roomId}
							<span class="flex items-center gap-1">📍 {getRoomName(session.roomId)}</span>
							{/if}
							{#if session.type}
							<span class="rounded-full px-2 py-0.5" style="background-color: {themeColor.smallCover};">{session.type}</span>
							{/if}
						</div>
						{#if session.speakers?.length}
						<div class="mt-1 flex flex-wrap gap-2">
							{#each session.speakers as speaker}
							<div class="flex items-center gap-2 rounded-lg p-2" style="background-color: {themeColor.cover};">
								<div class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold" style="background-color: {themeColor.toggle}; color: {themeColor.text};">
									{(speaker.name ?? speaker.firstName ?? 'S').charAt(0)}
								</div>
								<span class="text-xs font-medium" style="color: {themeColor.text};">{speaker.name ?? [speaker.firstName, speaker.lastName].filter(Boolean).join(' ')}</span>
							</div>
							{/each}
						</div>
						{/if}
					</div>
				</div>
				{/each}
			</div>
			{/if}
		</div>
		{/each}
	</div>
	{/if}
</div>
