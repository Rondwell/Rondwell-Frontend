<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { getEventComprehensiveAnalytics } from '$lib/services/analytics.services';

	$: eventId = ($page.params as Record<string, string>).eventId ?? '';
	$: primaryColor = $page.url.searchParams.get('primary') || '#7C3AED';

	let loading = true;
	let stats: any = null;

	onMount(async () => {
		try {
			stats = await getEventComprehensiveAnalytics(eventId);
		} catch {
			stats = null;
		} finally {
			loading = false;
		}
	});
</script>

<div class="p-6">
	<div class="mb-4 flex items-center justify-between">
		<div>
			<h1 class="text-lg font-bold">Live Attendance &amp; Capacity</h1>
			<p class="text-xs opacity-70">{stats?.eventTitle || eventId}</p>
		</div>
		<span class="h-2.5 w-2.5 rounded-full bg-emerald-500" title="Live"></span>
	</div>

	{#if loading}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
			<div class="h-20 animate-pulse rounded-xl bg-slate-200/70"></div>
			<div class="h-20 animate-pulse rounded-xl bg-slate-200/70"></div>
			<div class="h-20 animate-pulse rounded-xl bg-slate-200/70"></div>
			<div class="h-20 animate-pulse rounded-xl bg-slate-200/70"></div>
		</div>
	{:else if !stats}
		<p class="rounded-xl border p-4 text-sm opacity-75">
			Sign in as an authorized organizer or pass a scoped analytics key to view live attendance.
		</p>
	{:else}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
			<div class="rounded-xl border p-3">
				<p class="text-xs opacity-65">Registered</p>
				<p class="mt-1 text-2xl font-bold">{stats.registrations?.total ?? 0}</p>
			</div>
			<div class="rounded-xl border p-3">
				<p class="text-xs opacity-65">Checked In</p>
				<p class="mt-1 text-2xl font-bold" style="color:{primaryColor};">{stats.registrations?.checkedIn ?? 0}</p>
				<p class="text-[11px] opacity-65">{stats.registrations?.checkInRate ?? 0}% rate</p>
			</div>
			<div class="rounded-xl border p-3">
				<p class="text-xs opacity-65">No-Shows</p>
				<p class="mt-1 text-2xl font-bold">{stats.registrations?.noShowCount ?? 0}</p>
				<p class="text-[11px] opacity-65">{stats.registrations?.noShowRate ?? 0}%</p>
			</div>
			<div class="rounded-xl border p-3">
				<p class="text-xs opacity-65">Seats Filled</p>
				<p class="mt-1 text-2xl font-bold">{stats.seating?.assignedSeats ?? 0} / {stats.seating?.totalSeats ?? 0}</p>
				<p class="text-[11px] opacity-65">{stats.seating?.fillRate ?? 0}%</p>
			</div>
		</div>
	{/if}
</div>
