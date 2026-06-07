<!--
	FE-P3-08 (NEW-10.3) — My tickets list.

	Lists the authenticated attendee's tickets. Each row exposes a
	Transfer / Resell action when the organizer enabled `allowResale` on the
	event AND the transfer cutoff has not passed AND the ticket is not in a
	refunded / transferred state.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { getMyTickets, type MyTicket } from '$lib/services/ticket.services';
	import { formatMoney } from '$lib/utils/money';
	import SettingsBackButton from '$lib/components/SettingsBackButton.svelte';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let tickets: MyTicket[] = [];
	let loading = true;

	onMount(async () => {
		try {
			tickets = await getMyTickets();
		} finally {
			loading = false;
		}
	});

	function isTransferable(t: MyTicket): boolean {
		if (!t.allowResale) return false;
		const cutoffHours = t.transferCutoffHoursBeforeStart ?? 6;
		const cutoffMs = new Date(t.eventStartDate).getTime() - cutoffHours * 3_600_000;
		if (Date.now() > cutoffMs) return false;
		const status = (t.status || '').toUpperCase();
		if (status === 'REFUNDED' || status === 'TRANSFERRED' || status === 'CANCELED') return false;
		return true;
	}

	function fmtDate(iso: string): string {
		try {
			return new Date(iso).toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
			});
		} catch {
			return iso;
		}
	}

	function statusBadge(status: string): string {
		const s = (status || '').toUpperCase();
		if (s === 'ATTENDING') return 'bg-green-100 text-green-700';
		if (s === 'UNAPPROVED') return 'bg-yellow-100 text-yellow-700';
		if (s === 'TRANSFERRED') return 'bg-blue-100 text-blue-700';
		if (s === 'REFUNDED') return 'bg-red-100 text-red-700';
		return 'bg-gray-100 text-gray-700';
	}
</script>

<svelte:head>
	<title>My Tickets · Rondwell</title>
</svelte:head>

<div class="max-w-4xl">
	<SettingsBackButton fallbackTab="orders" />
	<div class="mb-6">
		<h1 class="text-2xl font-bold sm:text-3xl">My Tickets</h1>
		<p class="mt-1 text-sm text-gray-500">Manage your tickets, request transfers, or resell when allowed.</p>
	</div>

	{#if loading}
		<div class="space-y-3">
			{#each [1, 2, 3] as _}
				<div class="h-24 animate-pulse rounded-xl bg-gray-100"></div>
			{/each}
		</div>
	{:else if tickets.length === 0}
		<div class="flex h-60 flex-col items-center justify-center rounded-xl border border-dashed bg-white">
			<Icon icon="mdi:ticket-outline" class="mb-2 text-4xl text-gray-300" />
			<p class="text-sm font-medium text-gray-600">No tickets yet</p>
			<p class="mt-1 text-xs text-gray-400">Tickets you purchase will appear here.</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each tickets as t}
				<div class="rounded-xl border bg-white p-4">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-center gap-2">
								<h3 class="text-base font-semibold">{t.eventTitle}</h3>
								<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {statusBadge(t.status)}">
									{(t.status || 'unknown').toLowerCase()}
								</span>
							</div>
							<p class="mt-1 text-xs text-gray-500">
								{t.ticketTypeName} · {fmtDate(t.eventStartDate)}
							</p>
							{#if t.priceKobo > 0}
								<p class="mt-1 text-xs text-gray-500">{formatMoney(t.priceKobo, t.currency)}</p>
							{/if}
						</div>
						<div class="flex flex-col items-end gap-1">
							<button
								on:click={() => goto(`/event-page/${t.eventId}`)}
								class="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
							>
								View event
							</button>
							{#if isTransferable(t)}
								<button
									on:click={() => goto(`/account/tickets/${t.id}/transfer`)}
									class="rounded-md bg-pink-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-pink-700"
								>
									Transfer / Resell
								</button>
							{:else if t.allowResale === false}
								<span class="text-[10px] text-gray-400">Transfers disabled by organizer</span>
							{:else if (t.status || '').toUpperCase() === 'REFUNDED'}
								<span class="text-[10px] text-red-500">Refunded — not transferable</span>
							{:else}
								<span class="text-[10px] text-gray-400">Transfer cutoff passed</span>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
