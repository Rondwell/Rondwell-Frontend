<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import {
		createWebhook,
		deleteWebhook,
		listWebhookDeliveries,
		listWebhooks,
		replayWebhookDelivery,
		rotateWebhookSecret,
		sendTestWebhook,
		updateWebhook,
		type WebhookEndpointItem,
	} from '$lib/services/developer.services';
	import { toast } from '$lib/stores/toast.store';

	const dispatch = createEventDispatcher();
	const WEBHOOK_EVENTS = [
		'event.created', 'event.updated', 'event.published', 'event.cancelled',
		'attendee.registered', 'attendee.updated', 'attendee.cancelled', 'attendee.imported',
		'ticket.purchased', 'ticket.refunded',
		'checkin.recorded', 'checkin.duplicate_attempt',
		'seat.held', 'seat.assigned', 'seat.released',
		'collection.updated', 'analytics.snapshot_ready', 'webhook.test',
	];

	let endpoints: WebhookEndpointItem[] = [];
	let loading = true;
	let showCreate = false;
	let url = '';
	let description = '';
	let selectedEvents: string[] = ['attendee.registered', 'checkin.recorded', 'ticket.purchased'];
	let revealedSecret = '';
	let activeDeliveriesFor: string | null = null;
	let deliveries: any[] = [];

	async function load() {
		loading = true;
		try {
			endpoints = await listWebhooks();
		} catch (e: any) {
			toast.error(e?.message || 'Failed to load webhooks');
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function handleCreate() {
		try {
			const res = await createWebhook({ url: url.trim(), description: description.trim() || undefined, events: selectedEvents });
			revealedSecret = res.signingSecret || '';
			showCreate = false;
			url = '';
			description = '';
			await load();
			dispatch('changed');
		} catch (e: any) {
			toast.error(e?.message || 'Failed to add webhook');
		}
	}

	async function handleTest(ep: WebhookEndpointItem) {
		try {
			await sendTestWebhook(ep.id);
			toast.success('Test webhook dispatched');
			if (activeDeliveriesFor === ep.id) {
				deliveries = await listWebhookDeliveries(ep.id);
			}
		} catch (e: any) {
			toast.error(e?.message || 'Test failed');
		}
	}

	async function toggleDeliveries(epId: string) {
		if (activeDeliveriesFor === epId) {
			activeDeliveriesFor = null;
			return;
		}
		activeDeliveriesFor = epId;
		deliveries = await listWebhookDeliveries(epId);
	}

	async function handleReplay(epId: string, deliveryId: string) {
		await replayWebhookDelivery(epId, deliveryId);
		toast.success('Replay triggered');
		deliveries = await listWebhookDeliveries(epId);
	}
</script>

<div class="space-y-5">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h3 class="text-base font-semibold text-gray-900">Webhook Endpoints</h3>
			<p class="text-xs text-gray-500">All payloads are signed with <code class="font-mono">Rondwell-Signature: t=...,v1=...</code> (HMAC-SHA256).</p>
		</div>
		<button type="button" on:click={() => (showCreate = true)} class="rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white">
			+ Add Webhook Endpoint
		</button>
	</div>

	{#if revealedSecret}
		<div class="rounded-xl border border-amber-300 bg-amber-50 p-4">
			<p class="text-sm font-bold text-amber-900">Webhook Signing Secret (copy now — shown once)</p>
			<code class="mt-2 block break-all rounded bg-white px-3 py-2 font-mono text-xs">{revealedSecret}</code>
			<button type="button" on:click={() => (revealedSecret = '')} class="mt-2 text-xs font-semibold text-amber-900 underline">Dismiss</button>
		</div>
	{/if}

	{#if loading}
		<div class="h-28 animate-pulse rounded-xl bg-gray-100"></div>
	{:else if endpoints.length === 0}
		<div class="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
			No webhook endpoints configured yet.
		</div>
	{:else}
		<div class="space-y-3">
			{#each endpoints as ep}
				<div class="rounded-xl border border-gray-200 bg-white p-4">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<div class="flex items-center gap-2">
								<span class="font-mono text-sm font-semibold text-gray-900">{ep.url}</span>
								<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold {ep.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
									{ep.enabled ? 'Enabled' : 'Disabled'}
								</span>
							</div>
							<p class="mt-1 text-xs text-gray-500">Events: {ep.events.join(', ')}</p>
						</div>
						<div class="flex flex-wrap gap-2">
							<button type="button" on:click={() => handleTest(ep)} class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50">Send Test</button>
							<button type="button" on:click={() => toggleDeliveries(ep.id)} class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50">Deliveries</button>
							<button
								type="button"
								on:click={async () => {
									const res = await rotateWebhookSecret(ep.id);
									revealedSecret = res.signingSecret || '';
								}}
								class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
							>
								Rotate Secret
							</button>
							<button
								type="button"
								on:click={async () => {
									await updateWebhook(ep.id, { enabled: !ep.enabled });
									await load();
								}}
								class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
							>
								{ep.enabled ? 'Disable' : 'Enable'}
							</button>
							<button
								type="button"
								on:click={async () => {
									await deleteWebhook(ep.id);
									await load();
									dispatch('changed');
								}}
								class="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
							>
								Delete
							</button>
						</div>
					</div>

					{#if activeDeliveriesFor === ep.id}
						<div class="mt-4 border-t pt-3">
							<p class="mb-2 text-xs font-semibold text-gray-700">Recent Deliveries</p>
							{#if deliveries.length === 0}
								<p class="text-xs text-gray-500">No deliveries yet.</p>
							{:else}
								<div class="space-y-1.5">
									{#each deliveries as d}
										<div class="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
											<div>
												<span class="font-semibold">{d.eventType}</span>
												<span class="ml-2 text-gray-500">Status: {d.status} ({d.lastStatusCode || '—'})</span>
											</div>
											<button type="button" on:click={() => handleReplay(ep.id, d._id)} class="text-purple-700 font-semibold hover:underline">Replay</button>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if showCreate}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
			<h3 class="text-lg font-bold text-gray-900">Add Webhook Endpoint</h3>
			<div class="mt-4 space-y-4">
				<div>
					<label class="text-xs font-semibold text-gray-700">Endpoint HTTPS URL</label>
					<!-- csp-ignore-next-line — placeholder text -->
					<input bind:value={url} placeholder="https://api.yourapp.com/webhooks/rondwell" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
				</div>
				<div>
					<label class="text-xs font-semibold text-gray-700">Events ({selectedEvents.length} selected)</label>
					<div class="mt-1.5 grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto rounded-lg border border-gray-200 p-2.5">
						{#each WEBHOOK_EVENTS as ev}
							<label class="flex items-center gap-2 text-xs">
								<input
									type="checkbox"
									checked={selectedEvents.includes(ev)}
									on:change={(e) => {
										if (e.currentTarget.checked) selectedEvents = [...selectedEvents, ev];
										else selectedEvents = selectedEvents.filter((x) => x !== ev);
									}}
								/>
								<span class="font-mono">{ev}</span>
							</label>
						{/each}
					</div>
				</div>
				<div class="flex justify-end gap-2">
					<button type="button" on:click={() => (showCreate = false)} class="rounded-lg border px-4 py-2 text-sm">Cancel</button>
					<button type="button" disabled={!url.trim() || selectedEvents.length === 0} on:click={handleCreate} class="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white">Create Endpoint</button>
				</div>
			</div>
		</div>
	</div>
{/if}
