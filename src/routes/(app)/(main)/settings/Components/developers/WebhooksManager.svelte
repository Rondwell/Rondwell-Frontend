<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import Icon from '@iconify/svelte';
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

	const CORE_EVENTS = ['attendee.registered', 'ticket.purchased', 'checkin.recorded', 'event.updated'];

	let endpoints: WebhookEndpointItem[] = [];
	let loading = true;
	let showCreate = false;
	let creating = false;
	let url = '';
	let description = '';
	let selectedEvents: string[] = ['attendee.registered', 'checkin.recorded', 'ticket.purchased'];
	let revealedSecret = '';
	let copiedSecret = false;
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

	function toggleEvent(ev: string) {
		if (selectedEvents.includes(ev)) {
			selectedEvents = selectedEvents.filter((x) => x !== ev);
		} else {
			selectedEvents = [...selectedEvents, ev];
		}
	}

	async function handleCreate() {
		if (!url.trim() || selectedEvents.length === 0) return;
		creating = true;
		try {
			const res = await createWebhook({
				url: url.trim(),
				description: description.trim() || undefined,
				events: selectedEvents,
			});
			revealedSecret = res.signingSecret || '';
			copiedSecret = false;
			showCreate = false;
			url = '';
			description = '';
			await load();
			dispatch('changed');
		} catch (e: any) {
			toast.error(e?.message || 'Failed to add webhook');
		} finally {
			creating = false;
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

	function copySecret(secret: string) {
		navigator.clipboard?.writeText(secret);
		copiedSecret = true;
		toast.success('Signing secret copied');
		setTimeout(() => (copiedSecret = false), 2000);
	}
</script>

<div class="space-y-5">
	<div class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(23,22,30,0.05)]">
		<div>
			<h3 class="text-base font-bold text-[#17161E]">Webhook Endpoints</h3>
			<p class="mt-0.5 text-xs text-gray-500">
				Every delivery is signed with <code class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-[#17161E]">Rondwell-Signature: t=...,v1=...</code> (HMAC-SHA256).
			</p>
		</div>
		<button
			type="button"
			on:click={() => (showCreate = true)}
			class="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#513BE2] to-[#7C3AED] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_6px_18px_-6px_rgba(81,59,226,0.65)] transition hover:brightness-110"
		>
			<Icon icon="solar:add-circle-bold-duotone" class="h-4 w-4" />
			Add Webhook Endpoint
		</button>
	</div>

	{#if revealedSecret}
		<div class="overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-[#111827] via-[#17161E] to-[#1E1B38] p-5 text-white shadow-xl">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div class="min-w-0 flex-1">
					<div class="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/25">
						<Icon icon="solar:shield-keyhole-bold-duotone" class="h-3.5 w-3.5" />
						Webhook Signing Secret (copy now — shown once)
					</div>
					<div class="mt-3 rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5">
						<code class="break-all font-mono text-xs text-emerald-200">{revealedSecret}</code>
					</div>
				</div>
				<div class="flex shrink-0 items-center gap-2">
					<button
						type="button"
						on:click={() => copySecret(revealedSecret)}
						class="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
					>
						<Icon icon={copiedSecret ? 'solar:check-circle-bold' : 'solar:copy-bold-duotone'} class="h-4 w-4" />
						{copiedSecret ? 'Copied' : 'Copy Secret'}
					</button>
					<button
						type="button"
						on:click={() => (revealedSecret = '')}
						class="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
					>
						Dismiss
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if loading}
		<div class="h-32 animate-pulse rounded-2xl border border-gray-200/70 bg-white"></div>
	{:else if endpoints.length === 0}
		<div class="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
			<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
				<Icon icon="solar:routing-3-bold-duotone" class="h-6 w-6" />
			</div>
			<p class="mt-3 text-base font-bold text-[#17161E]">No webhook endpoints configured yet</p>
			<p class="mx-auto mt-1 max-w-md text-xs text-gray-500">
				Receive real-time HTTPS notifications when attendees register, purchase tickets, select seats, or check in at the door.
			</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each endpoints as ep}
				<div class="rounded-2xl border border-gray-200/85 bg-white p-4 shadow-[0_2px_10px_-4px_rgba(23,22,30,0.05)] transition hover:border-[#513BE2]/30 sm:p-5">
					<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-center gap-2">
								<span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
									<Icon icon="solar:link-circle-bold-duotone" class="h-4 w-4" />
								</span>
								<span class="break-all font-mono text-xs font-semibold text-[#17161E] sm:text-sm">{ep.url}</span>
								<span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold {ep.enabled ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20'}">
									<span class="h-1.5 w-1.5 rounded-full {ep.enabled ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
									{ep.enabled ? 'Enabled' : 'Disabled'}
								</span>
							</div>
							{#if ep.description}
								<p class="mt-1.5 text-xs text-gray-500">{ep.description}</p>
							{/if}
							<div class="mt-2.5 flex flex-wrap gap-1.5">
								{#each ep.events as ev}
									<span class="rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 font-mono text-[11px] text-gray-700">
										{ev}
									</span>
								{/each}
							</div>
						</div>

						<div class="flex flex-wrap items-center gap-2">
							<button
								type="button"
								on:click={() => handleTest(ep)}
								class="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-[#513BE2]/40 hover:bg-gray-50"
							>
								<Icon icon="solar:paper-plane-linear" class="h-3.5 w-3.5" />
								Send Test
							</button>
							<button
								type="button"
								on:click={() => toggleDeliveries(ep.id)}
								class="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition {activeDeliveriesFor === ep.id
									? 'border-[#513BE2] bg-[#513BE2]/10 text-[#513BE2]'
									: 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}"
							>
								<Icon icon="solar:history-linear" class="h-3.5 w-3.5" />
								Deliveries
							</button>
							<button
								type="button"
								on:click={async () => {
									const res = await rotateWebhookSecret(ep.id);
									revealedSecret = res.signingSecret || '';
									copiedSecret = false;
								}}
								class="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
							>
								<Icon icon="solar:key-linear" class="h-3.5 w-3.5" />
								Rotate Secret
							</button>
							<button
								type="button"
								on:click={async () => {
									await updateWebhook(ep.id, { enabled: !ep.enabled });
									await load();
								}}
								class="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
							>
								{ep.enabled ? 'Pause' : 'Enable'}
							</button>
							<button
								type="button"
								on:click={async () => {
									await deleteWebhook(ep.id);
									await load();
									dispatch('changed');
								}}
								class="rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
							>
								Delete
							</button>
						</div>
					</div>

					{#if activeDeliveriesFor === ep.id}
						<div class="mt-4 rounded-2xl border border-gray-200/80 bg-gray-50/70 p-4">
							<p class="mb-2.5 text-xs font-bold text-[#17161E]">Recent Deliveries</p>
							{#if deliveries.length === 0}
								<p class="text-xs text-gray-500">No deliveries recorded for this endpoint yet.</p>
							{:else}
								<div class="space-y-2">
									{#each deliveries as d}
										<div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200/80 bg-white px-3.5 py-2.5 text-xs">
											<div class="flex flex-wrap items-center gap-2">
												<span class="rounded-md bg-gray-100 px-2 py-0.5 font-mono font-semibold text-[#17161E]">{d.eventType}</span>
												<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold {d.lastStatusCode && d.lastStatusCode < 400 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">
													{d.status} ({d.lastStatusCode || '—'})
												</span>
											</div>
											<button
												type="button"
												on:click={() => handleReplay(ep.id, d._id)}
												class="inline-flex items-center gap-1 rounded-lg bg-[#513BE2]/10 px-2.5 py-1 text-xs font-semibold text-[#513BE2] transition hover:bg-[#513BE2]/20"
											>
												<Icon icon="solar:refresh-linear" class="h-3.5 w-3.5" />
												Replay
											</button>
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
	<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-label="Add webhook endpoint"
		tabindex="-1"
		on:click={() => (showCreate = false)}
		on:keydown={(e) => e.key === 'Escape' && (showCreate = false)}
		transition:fade={{ duration: 140 }}
	>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
			on:click|stopPropagation
			transition:scale={{ duration: 160, start: 0.97 }}
		>
			<div class="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
				<div class="flex items-center gap-3">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
						<Icon icon="solar:routing-3-bold-duotone" class="h-5 w-5" />
					</span>
					<div>
						<h3 class="text-base font-bold text-[#17161E]">Add Webhook Endpoint</h3>
						<p class="text-xs text-gray-500">Subscribe to real-time Rondwell event and ticketing lifecycle events.</p>
					</div>
				</div>
				<button
					type="button"
					on:click={() => (showCreate = false)}
					aria-label="Close modal"
					class="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
				>
					<Icon icon="solar:close-circle-linear" class="h-5 w-5" />
				</button>
			</div>

			<div class="flex-1 space-y-4 overflow-y-auto px-6 py-5">
				<div>
					<label for="webhook-url" class="text-xs font-semibold text-gray-700">Endpoint HTTPS URL</label>
					<!-- csp-ignore-next-line — placeholder text -->
					<input
						id="webhook-url"
						bind:value={url}
						placeholder="https://api.yourapp.com/webhooks/rondwell"
						class="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 font-mono text-xs text-[#17161E] outline-none focus:border-[#513BE2] focus:ring-2 focus:ring-[#513BE2]/15"
					/>
				</div>

				<div>
					<label for="webhook-desc" class="text-xs font-semibold text-gray-700">Description (Optional)</label>
					<input
						id="webhook-desc"
						bind:value={description}
						placeholder="e.g. CRM Sync Worker"
						class="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-[#17161E] outline-none focus:border-[#513BE2] focus:ring-2 focus:ring-[#513BE2]/15"
					/>
				</div>

				<div>
					<div class="mb-2 flex flex-wrap items-center justify-between gap-2">
						<span class="text-xs font-semibold text-gray-700">Subscribed Events ({selectedEvents.length} selected)</span>
						<div class="flex gap-2 text-[11px] font-semibold">
							<button type="button" on:click={() => (selectedEvents = [...CORE_EVENTS])} class="text-[#513BE2] hover:underline">Core Events</button>
							<button type="button" on:click={() => (selectedEvents = [...WEBHOOK_EVENTS])} class="text-[#513BE2] hover:underline">All Events</button>
							<button type="button" on:click={() => (selectedEvents = [])} class="text-gray-500 hover:underline">Clear</button>
						</div>
					</div>
					<div class="flex max-h-52 flex-wrap gap-1.5 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
						{#each WEBHOOK_EVENTS as ev}
							{@const active = selectedEvents.includes(ev)}
							<button
								type="button"
								on:click={() => toggleEvent(ev)}
								class="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[11px] font-medium transition {active
									? 'border-[#513BE2] bg-[#513BE2] text-white shadow-sm'
									: 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}"
							>
								<Icon icon={active ? 'solar:check-circle-bold' : 'solar:add-circle-linear'} class="h-3.5 w-3.5" />
								{ev}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<div class="flex justify-end gap-2.5 border-t border-gray-100 bg-gray-50/70 px-6 py-4">
				<button type="button" on:click={() => (showCreate = false)} class="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
					Cancel
				</button>
				<button
					type="button"
					disabled={creating || !url.trim() || selectedEvents.length === 0}
					on:click={handleCreate}
					class="rounded-xl bg-[#513BE2] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#4330c9] disabled:opacity-50"
				>
					{creating ? 'Creating…' : 'Create Endpoint'}
				</button>
			</div>
		</div>
	</div>
{/if}
