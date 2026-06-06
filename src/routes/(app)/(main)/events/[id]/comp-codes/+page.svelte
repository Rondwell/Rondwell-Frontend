<!--
	FE-P2-11-C — Comp / freebie code management.

	Backend endpoints wrapped in `compCode.services.ts`:
	  - POST  /api/v1/payment/comp-codes/
	  - GET   /api/v1/payment/comp-codes?eventId=...
	  - POST  /api/v1/payment/comp-codes/:id/disable
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		createCompCode,
		disableCompCode,
		listCompCodes,
		type CompCode,
		type CreateCompCodeBody,
	} from '$lib/services/compCode.services';
	import { getTicketTypes } from '$lib/services/event.services';
	import { getEventCache } from '$lib/stores/eventCache.store';
	import { toast } from '$lib/stores/toast.store';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	$: eventId = $page.params.id ?? '';
	$: ({ event: eventStore } = getEventCache(eventId));
	$: rawEvent = $eventStore;
	$: eventTitle = rawEvent?.title ?? 'Event';

	let codes: CompCode[] = [];
	let ticketTypes: any[] = [];
	let loading = true;
	let error = '';

	let showCreate = false;
	let creating = false;
	let createError = '';

	let newCode: CreateCompCodeBody = {
		code: '',
		eventId: '',
		ticketTypeIds: [],
		allowedEmails: [],
		usageLimit: null,
		perUserCap: 1,
		expiresAt: null,
	};
	let allowedEmailsRaw = '';

	onMount(async () => {
		await loadAll();
	});

	$: if (eventId) newCode.eventId = eventId;

	async function loadAll() {
		loading = true;
		error = '';
		try {
			[codes, ticketTypes] = await Promise.all([
				listCompCodes(eventId),
				getTicketTypes(eventId),
			]);
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			loading = false;
		}
	}

	function resetCreate() {
		newCode = {
			code: '',
			eventId,
			ticketTypeIds: [],
			allowedEmails: [],
			usageLimit: null,
			perUserCap: 1,
			expiresAt: null,
		};
		allowedEmailsRaw = '';
		createError = '';
	}

	async function handleCreate() {
		if (!newCode.code.trim()) {
			createError = 'Code is required.';
			return;
		}
		creating = true;
		createError = '';
		try {
			const allowedEmails = allowedEmailsRaw
				.split(/[\n,]/)
				.map((e) => e.trim().toLowerCase())
				.filter(Boolean);
			await createCompCode({
				...newCode,
				code: newCode.code.trim().toUpperCase(),
				allowedEmails: allowedEmails.length ? allowedEmails : undefined,
			});
			toast.success('Comp code created.');
			showCreate = false;
			resetCreate();
			await loadAll();
		} catch (e: any) {
			createError = financialErrorMessage(e);
		} finally {
			creating = false;
		}
	}

	async function handleDisable(code: CompCode) {
		if (!window.confirm(`Disable comp code "${code.code}"?`)) return;
		try {
			await disableCompCode(code.id);
			toast.success('Code disabled.');
			await loadAll();
		} catch (e: any) {
			toast.error(financialErrorMessage(e));
		}
	}

	function ticketTypeName(id: string): string {
		return ticketTypes.find((t: any) => (t._id ?? t.id) === id)?.name ?? id;
	}

	function fmtDate(iso?: string | null): string {
		if (!iso) return 'Never';
		try {
			return new Date(iso).toLocaleDateString();
		} catch {
			return iso;
		}
	}

	function toggleTicketType(id: string) {
		const list = newCode.ticketTypeIds ?? [];
		if (list.includes(id)) {
			newCode.ticketTypeIds = list.filter((t) => t !== id);
		} else {
			newCode.ticketTypeIds = [...list, id];
		}
	}
</script>

<svelte:head><title>Comp codes — {eventTitle}</title></svelte:head>

<div class="max-w-5xl">
	<div class="mb-6 flex flex-wrap items-start justify-between gap-3">
		<div>
			<button
				on:click={() => goto(`/events/${eventId}`)}
				class="mb-3 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
			>
				<Icon icon="mdi:arrow-left" /> Back to event
			</button>
			<h1 class="text-2xl font-bold sm:text-3xl">Comp / freebie codes</h1>
			<p class="mt-1 text-sm text-[#8C8F93]">
				Issue 100%-off codes to staff, press, or VIPs. Audited as `COMP_TICKET` registrations — no
				gateway charge.
			</p>
		</div>
		<button
			on:click={() => {
				resetCreate();
				showCreate = true;
			}}
			class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
		>
			<Icon icon="mdi:plus" class="mr-1 inline" /> New code
		</button>
	</div>

	{#if error}
		<p class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{/if}

	{#if loading}
		<div class="space-y-2">
			{#each [1, 2, 3] as _}
				<div class="h-16 animate-pulse rounded-lg bg-white"></div>
			{/each}
		</div>
	{:else if codes.length === 0}
		<div class="flex h-60 flex-col items-center justify-center rounded-xl bg-white">
			<Icon icon="mdi:ticket-percent-outline" class="mb-2 text-4xl text-gray-300" />
			<p class="text-lg font-medium text-[#A2ACB2]">No comp codes yet</p>
			<p class="mt-1 text-sm text-gray-400">Create one to comp staff or VIP attendees.</p>
		</div>
	{:else}
		<div class="overflow-visible rounded-xl bg-white shadow-sm">
			<div class="hidden border-b px-4 py-3 text-xs font-medium text-gray-400 lg:flex">
				<div class="w-1/5">Code</div>
				<div class="w-1/5">Ticket types</div>
				<div class="w-1/5">Usage</div>
				<div class="w-1/5">Expiry</div>
				<div class="w-1/5 text-right">Status</div>
			</div>
			{#each codes as c}
				<div
					class="flex flex-col gap-2 border-b px-4 py-3 last:border-none lg:flex-row lg:items-center lg:gap-0"
				>
					<div class="lg:w-1/5">
						<p class="font-mono font-semibold">{c.code}</p>
						{#if c.allowedEmails && c.allowedEmails.length > 0}
							<p class="text-[11px] text-gray-400">{c.allowedEmails.length} email allowlist</p>
						{/if}
					</div>
					<div class="text-xs text-gray-600 lg:w-1/5">
						{#if c.ticketTypeIds && c.ticketTypeIds.length > 0}
							{c.ticketTypeIds.map(ticketTypeName).join(', ')}
						{:else}
							<span class="italic text-gray-400">All tickets</span>
						{/if}
					</div>
					<div class="text-sm text-gray-700 lg:w-1/5">
						{c.timesUsed} / {c.usageLimit ?? '∞'}
					</div>
					<div class="text-sm text-gray-500 lg:w-1/5">{fmtDate(c.expiresAt)}</div>
					<div class="lg:w-1/5 lg:text-right">
						{#if c.isActive}
							<button
								on:click={() => handleDisable(c)}
								class="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
							>
								Disable
							</button>
						{:else}
							<span class="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">Disabled</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Create modal -->
{#if showCreate}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 backdrop-blur-sm"
		on:click={() => (showCreate = false)}
		on:keydown={(e) => {
			if (e.key === 'Escape') showCreate = false;
		}}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="w-full max-w-lg rounded-xl bg-white shadow-xl"
			role="document"
			on:click|stopPropagation
			on:keydown|stopPropagation
		>
			<div class="flex items-center justify-between border-b px-5 py-4">
				<h2 class="text-lg font-semibold">New comp code</h2>
				<button on:click={() => (showCreate = false)} class="text-gray-400 hover:text-gray-600">
					<Icon icon="mdi:close" class="text-xl" />
				</button>
			</div>

			<div class="space-y-4 px-5 py-4 text-sm">
				{#if createError}
					<p class="rounded-md bg-red-50 p-2 text-xs text-red-600">{createError}</p>
				{/if}

				<div>
					<label class="text-xs font-medium text-gray-700" for="cc-code">Code</label>
					<input
						id="cc-code"
						type="text"
						bind:value={newCode.code}
						placeholder="STAFF2026"
						class="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm uppercase focus:outline-none"
					/>
					<p class="mt-1 text-[11px] text-gray-400">
						Case-insensitive. Attendees redeem this code at checkout.
					</p>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="text-xs font-medium text-gray-700" for="cc-limit">Usage limit</label>
						<input
							id="cc-limit"
							type="number"
							min="1"
							bind:value={newCode.usageLimit}
							placeholder="Unlimited"
							class="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
						/>
					</div>
					<div>
						<label class="text-xs font-medium text-gray-700" for="cc-cap">Per-user cap</label>
						<input
							id="cc-cap"
							type="number"
							min="1"
							bind:value={newCode.perUserCap}
							class="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
						/>
					</div>
				</div>

				<div>
					<label class="text-xs font-medium text-gray-700" for="cc-expires">Expires</label>
					<input
						id="cc-expires"
						type="datetime-local"
						bind:value={newCode.expiresAt}
						class="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
					/>
				</div>

				<div>
					<label class="text-xs font-medium text-gray-700">Ticket types</label>
					<p class="text-[11px] text-gray-400">Leave empty to allow all ticket types.</p>
					<div class="mt-2 flex flex-wrap gap-1">
						{#each ticketTypes as t}
							{@const id = t._id ?? t.id}
							<button
								type="button"
								on:click={() => toggleTicketType(id)}
								class="rounded-full border px-2 py-0.5 text-[11px] {(newCode.ticketTypeIds ?? []).includes(id)
									? 'border-pink-500 bg-pink-50 text-pink-700'
									: 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}"
							>
								{t.name}
							</button>
						{/each}
					</div>
				</div>

				<div>
					<label class="text-xs font-medium text-gray-700" for="cc-emails">
						Allowed emails <span class="text-gray-400">(optional)</span>
					</label>
					<textarea
						id="cc-emails"
						rows="3"
						bind:value={allowedEmailsRaw}
						placeholder={`vip@example.com\nstaff@example.com\nor comma-separated`}
						class="mt-1 w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none"
					></textarea>
				</div>
			</div>

			<div class="flex items-center justify-end gap-2 border-t px-5 py-3">
				<button
					on:click={() => (showCreate = false)}
					class="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					on:click={handleCreate}
					disabled={creating || !newCode.code.trim()}
					class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
				>
					{creating ? 'Creating…' : 'Create code'}
				</button>
			</div>
		</div>
	</div>
{/if}
