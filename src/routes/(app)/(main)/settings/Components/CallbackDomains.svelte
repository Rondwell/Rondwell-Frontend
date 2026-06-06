<script lang="ts">
	/**
	 * FE-P1-15 (FA-10.3) — Custom callback domains management panel.
	 *
	 * Organizers running events on their own subdomain (events.acme.com)
	 * need to redirect attendees back to that domain after a Paystack /
	 * Flutterwave checkout. The backend extends the callback URL allow-list
	 * for any *verified* domain owned by an organizer — this panel is the
	 * UX that lets them register one, prove ownership via DNS TXT record,
	 * and remove old entries.
	 *
	 * Flow:
	 *   1. User submits `events.example.com`.
	 *   2. Server returns `{ challengeToken, dnsRecord: { name, type, value } }`.
	 *   3. User publishes the TXT record at their DNS provider.
	 *   4. User clicks Verify — server resolves the record and flips
	 *      `verified=true` if it matches.
	 */
	import {
		addCallbackDomain,
		listCallbackDomains,
		removeCallbackDomain,
		validateCallbackDomain,
		verifyCallbackDomain,
		type AddCallbackDomainResponse,
		type CallbackDomainEntry,
	} from '$lib/services/callbackDomain.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let domains: CallbackDomainEntry[] = [];
	let loading = true;
	let loadError = '';

	let newDomain = '';
	let formError = '';
	let adding = false;
	let pendingChallenge: AddCallbackDomainResponse | null = null;

	let verifying = '';
	let verifyError = '';
	let removing = '';

	onMount(async () => {
		await refresh();
	});

	async function refresh() {
		loading = true;
		loadError = '';
		try {
			domains = await listCallbackDomains();
		} catch (e: any) {
			loadError = e?.message ?? 'Failed to load domains';
		} finally {
			loading = false;
		}
	}

	async function handleAdd() {
		formError = '';
		const validationErr = validateCallbackDomain(newDomain);
		if (validationErr) {
			formError = validationErr;
			return;
		}
		adding = true;
		try {
			pendingChallenge = await addCallbackDomain(newDomain.trim().toLowerCase());
			newDomain = '';
			await refresh();
		} catch (e: any) {
			formError = e?.message ?? 'Failed to add domain';
		} finally {
			adding = false;
		}
	}

	async function handleVerify(domain: string) {
		verifying = domain;
		verifyError = '';
		try {
			await verifyCallbackDomain(domain);
			pendingChallenge = null;
			await refresh();
		} catch (e: any) {
			verifyError = e?.message ?? 'DNS record not found yet — give propagation a few minutes.';
		} finally {
			verifying = '';
		}
	}

	async function handleRemove(domain: string) {
		removing = domain;
		try {
			await removeCallbackDomain(domain);
			await refresh();
		} catch (e: any) {
			loadError = e?.message ?? 'Failed to remove domain';
		} finally {
			removing = '';
		}
	}

	async function copyToClipboard(value: string) {
		try {
			await navigator.clipboard.writeText(value);
		} catch {
			/* swallow — best effort */
		}
	}

	function formatDate(iso: string | null | undefined): string {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
		} catch {
			return '—';
		}
	}
</script>

<div class="mb-12">
	<div class="mb-6">
		<h2 class="text-lg font-semibold">Custom callback domains</h2>
		<p class="text-sm text-[#8C8F93]">
			Redirect attendees back to your own subdomain after checkout. Verified domains are added to
			Rondwell's payment callback allow-list automatically.
		</p>
	</div>

	{#if loadError}
		<p class="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-600">{loadError}</p>
	{/if}

	<!-- Add domain form -->
	<div class="mb-6 rounded-xl border bg-white p-5">
		<h3 class="mb-2 text-sm font-semibold text-gray-900">Add a new domain</h3>
		<p class="mb-3 text-xs text-gray-500">
			Enter the hostname only — no <code>https://</code>, no path. Example: <code
				class="rounded bg-gray-100 px-1.5 py-0.5">events.example.com</code
			>
		</p>
		<div class="flex gap-2">
			<input
				type="text"
				bind:value={newDomain}
				placeholder="events.example.com"
				class="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none"
			/>
			<button
				on:click={handleAdd}
				disabled={adding || !newDomain.trim()}
				class="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
			>
				{adding ? 'Adding…' : 'Add'}
			</button>
		</div>
		{#if formError}
			<p class="mt-2 text-xs text-red-600">{formError}</p>
		{/if}
	</div>

	<!-- Pending DNS challenge (shows the TXT record to publish) -->
	{#if pendingChallenge}
		<div class="mb-6 rounded-xl border-2 border-amber-200 bg-amber-50 p-5">
			<div class="mb-3 flex items-center gap-2">
				<Icon icon="mdi:dns-outline" class="text-xl text-amber-600" />
				<h3 class="text-sm font-semibold text-amber-900">Verify ownership of {pendingChallenge.domain}</h3>
			</div>
			<p class="mb-3 text-sm text-amber-800">
				Publish this TXT record at your DNS provider, then click <strong>Verify</strong> below. DNS
				propagation can take a few minutes.
			</p>
			<div class="space-y-2">
				<div class="rounded-lg bg-white p-3 font-mono text-xs">
					<div class="flex items-center justify-between gap-2">
						<span class="text-gray-500">Name</span>
						<button
							on:click={() => copyToClipboard(pendingChallenge?.dnsRecord.name ?? '')}
							class="text-amber-700 hover:underline"
						>
							Copy
						</button>
					</div>
					<p class="mt-1 break-all text-gray-900">{pendingChallenge.dnsRecord.name}</p>
				</div>
				<div class="rounded-lg bg-white p-3 font-mono text-xs">
					<div class="flex items-center justify-between gap-2">
						<span class="text-gray-500">Type</span>
					</div>
					<p class="mt-1 text-gray-900">{pendingChallenge.dnsRecord.type}</p>
				</div>
				<div class="rounded-lg bg-white p-3 font-mono text-xs">
					<div class="flex items-center justify-between gap-2">
						<span class="text-gray-500">Value</span>
						<button
							on:click={() => copyToClipboard(pendingChallenge?.dnsRecord.value ?? '')}
							class="text-amber-700 hover:underline"
						>
							Copy
						</button>
					</div>
					<p class="mt-1 break-all text-gray-900">{pendingChallenge.dnsRecord.value}</p>
				</div>
			</div>
			<div class="mt-3 flex items-center gap-2">
				<button
					on:click={() => handleVerify(pendingChallenge?.domain ?? '')}
					disabled={verifying === pendingChallenge?.domain}
					class="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
				>
					{verifying === pendingChallenge?.domain ? 'Checking DNS…' : 'Verify now'}
				</button>
				<button
					on:click={() => (pendingChallenge = null)}
					class="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
				>
					I'll verify later
				</button>
			</div>
			{#if verifyError}
				<p class="mt-2 text-xs text-red-600">{verifyError}</p>
			{/if}
		</div>
	{/if}

	<!-- Existing domains list -->
	<div class="rounded-xl border bg-white">
		<div class="border-b px-4 py-3">
			<h3 class="text-sm font-semibold text-gray-900">Your domains</h3>
		</div>
		{#if loading}
			<div class="space-y-2 p-4">
				{#each [1, 2] as _}
					<div class="h-12 animate-pulse rounded bg-gray-100"></div>
				{/each}
			</div>
		{:else if domains.length === 0}
			<div class="flex flex-col items-center gap-2 p-10 text-center text-sm text-gray-400">
				<Icon icon="mdi:web" class="text-3xl text-gray-300" />
				<p>No custom domains yet.</p>
				<p class="text-xs">Until you add one, callbacks fall back to <code>*.rondwell.com</code>.</p>
			</div>
		{:else}
			{#each domains as d}
				<div class="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 last:border-none">
					<div class="min-w-0">
						<div class="flex items-center gap-2">
							<p class="truncate text-sm font-medium text-gray-900">{d.domain}</p>
							{#if d.verified}
								<span class="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
									<Icon icon="mdi:check-circle" class="text-xs" /> Verified
								</span>
							{:else}
								<span class="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
									<Icon icon="mdi:clock-outline" class="text-xs" /> Pending DNS
								</span>
							{/if}
						</div>
						<p class="mt-0.5 text-[11px] text-gray-400">
							{#if d.verified}
								Verified {formatDate(d.verifiedAt)}
							{:else}
								Issued {formatDate(d.challengeIssuedAt)}
							{/if}
						</p>
					</div>
					<div class="flex items-center gap-2">
						{#if !d.verified}
							<button
								on:click={() => handleVerify(d.domain)}
								disabled={verifying === d.domain}
								class="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
							>
								{verifying === d.domain ? 'Checking…' : 'Verify'}
							</button>
						{/if}
						<button
							on:click={() => handleRemove(d.domain)}
							disabled={removing === d.domain}
							class="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
						>
							{removing === d.domain ? 'Removing…' : 'Remove'}
						</button>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
