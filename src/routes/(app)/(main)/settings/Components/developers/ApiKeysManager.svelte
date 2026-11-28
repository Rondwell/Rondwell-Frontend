<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import {
		createApiKey,
		listApiKeys,
		revokeApiKey,
		rollApiKey,
		updateApiKey,
		type ApiKeyItem,
	} from '$lib/services/developer.services';
	import { toast } from '$lib/stores/toast.store';

	const dispatch = createEventDispatcher();

	let keys: ApiKeyItem[] = [];
	let loading = true;
	let showCreateModal = false;
	let revealedRawKey = '';
	let editingKey: ApiKeyItem | null = null;

	// Create form state
	let name = '';
	let keyType: 'SECRET' | 'PUBLISHABLE' = 'SECRET';
	let environment: 'live' | 'test' = 'live';
	let preset: 'full' | 'sdk' | 'checkin' | 'analytics' | 'custom' = 'full';
	let selectedScopes: string[] = [];
	let ipInput = '';
	let ipAllowlist: string[] = [];
	let originInput = '';
	let allowedOrigins: string[] = [];
	let saving = false;

	const ALL_SCOPES = [
		'events:read', 'events:write',
		'tickets:read', 'tickets:write',
		'seating:read', 'seating:write',
		'attendees:read', 'attendees:write', 'attendees:import',
		'credentials:read', 'credentials:write',
		'checkins:read', 'checkins:write',
		'analytics:read', 'analytics:export',
		'collections:read', 'collections:write',
		'webhooks:read', 'webhooks:write',
		'embed:write', 'organizations:read',
		'sdk:events', 'sdk:collections',
	];

	const PRESETS: Record<string, string[]> = {
		full: ALL_SCOPES,
		sdk: ['sdk:events', 'sdk:collections', 'events:read', 'tickets:read', 'seating:read', 'seating:write', 'collections:read'],
		checkin: ['events:read', 'attendees:read', 'credentials:read', 'checkins:read', 'checkins:write'],
		analytics: ['events:read', 'analytics:read', 'analytics:export', 'collections:read'],
	};

	$: if (preset !== 'custom') {
		selectedScopes = [...(PRESETS[preset] || [])];
	}

	async function load() {
		loading = true;
		try {
			keys = await listApiKeys();
		} catch (e: any) {
			toast.error(e?.message || 'Failed to load keys');
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function openCreate(defaultType: 'SECRET' | 'PUBLISHABLE') {
		name = '';
		keyType = defaultType;
		environment = 'live';
		preset = defaultType === 'PUBLISHABLE' ? 'sdk' : 'full';
		ipAllowlist = [];
		allowedOrigins = [];
		showCreateModal = true;
	}

	function addIpRule() {
		const v = ipInput.trim();
		if (v && !ipAllowlist.includes(v)) ipAllowlist = [...ipAllowlist, v];
		ipInput = '';
	}

	function addOriginRule() {
		const v = originInput.trim();
		if (v && !allowedOrigins.includes(v)) allowedOrigins = [...allowedOrigins, v];
		originInput = '';
	}

	async function handleCreate() {
		if (!name.trim()) return;
		saving = true;
		try {
			const created = await createApiKey({
				name: name.trim(),
				keyType,
				environment,
				scopes: selectedScopes,
				ipAllowlist: keyType === 'SECRET' ? ipAllowlist : [],
				allowedOrigins: keyType === 'PUBLISHABLE' ? allowedOrigins : [],
			});
			revealedRawKey = created.rawKey || '';
			showCreateModal = false;
			await load();
			dispatch('changed');
		} catch (e: any) {
			toast.error(e?.message || 'Failed to create key');
		} finally {
			saving = false;
		}
	}

	async function handleRoll(k: ApiKeyItem) {
		try {
			const res = await rollApiKey(k.id, 24);
			revealedRawKey = res.rawKey || '';
			toast.success('Key rolled. Old key remains valid for 24h.');
			await load();
			dispatch('changed');
		} catch (e: any) {
			toast.error(e?.message || 'Roll failed');
		}
	}

	async function handleRevoke(k: ApiKeyItem) {
		try {
			await revokeApiKey(k.id);
			toast.success('Key revoked.');
			await load();
			dispatch('changed');
		} catch (e: any) {
			toast.error(e?.message || 'Revoke failed');
		}
	}

	async function handleSaveSecurityRules() {
		if (!editingKey) return;
		saving = true;
		try {
			await updateApiKey(editingKey.id, {
				ipAllowlist: editingKey.ipAllowlist,
				allowedOrigins: editingKey.allowedOrigins,
				scopes: editingKey.scopes,
			});
			toast.success('Security rules updated.');
			editingKey = null;
			await load();
		} catch (e: any) {
			toast.error(e?.message || 'Update failed');
		} finally {
			saving = false;
		}
	}

	function copyText(text: string) {
		navigator.clipboard?.writeText(text);
		toast.success('Copied to clipboard');
	}
</script>

<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h3 class="text-base font-semibold text-gray-900">Account API &amp; SDK Credentials</h3>
			<p class="text-xs text-gray-500">
				Use Secret Keys (<code class="font-mono">rw_live_...</code>) on your backend and Publishable Keys (<code class="font-mono">rw_live_pub_...</code>) in Web SDKs.
			</p>
		</div>
		<div class="flex gap-2">
			<button
				type="button"
				on:click={() => openCreate('PUBLISHABLE')}
				class="rounded-lg border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100"
			>
				+ Create SDK Publishable Key
			</button>
			<button
				type="button"
				on:click={() => openCreate('SECRET')}
				class="rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-purple-700"
			>
				+ Create Secret API Key
			</button>
		</div>
	</div>

	{#if revealedRawKey}
		<div class="rounded-xl border border-amber-300 bg-amber-50 p-4">
			<div class="flex items-start justify-between gap-3">
				<div>
					<p class="text-sm font-bold text-amber-900">Copy your new key now — it will not be shown again</p>
					<code class="mt-2 block break-all rounded bg-white px-3 py-2 font-mono text-xs text-gray-900 border border-amber-200">{revealedRawKey}</code>
				</div>
				<div class="flex gap-2">
					<button
						type="button"
						on:click={() => copyText(revealedRawKey)}
						class="rounded bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white"
					>
						Copy
					</button>
					<button
						type="button"
						on:click={() => (revealedRawKey = '')}
						class="rounded border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-900"
					>
						Dismiss
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if loading}
		<div class="h-32 animate-pulse rounded-xl bg-gray-100"></div>
	{:else if keys.length === 0}
		<div class="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
			<p class="font-semibold text-gray-800">No API or SDK keys yet</p>
			<p class="mt-1 text-sm text-gray-500">Create a Publishable Key for Event/Collection Web SDKs or a Secret Key for server-to-server APIs.</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each keys as k}
				<div class="rounded-xl border border-gray-200 bg-white p-4">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<div class="flex flex-wrap items-center gap-2">
								<span class="font-semibold text-gray-900">{k.name}</span>
								<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold {k.keyType === 'PUBLISHABLE' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}">
									{k.keyType}
								</span>
								<span class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">{k.environment}</span>
								<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold {k.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : k.status === 'ROLLING' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}">
									{k.status}
								</span>
							</div>
							<p class="mt-1 font-mono text-xs text-gray-600">{k.maskedKey}</p>
							<div class="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
								<span>Scopes: {k.scopes.length}</span>
								{#if k.keyType === 'SECRET'}
									<span>IP Allowlist: {k.ipAllowlist?.length ? k.ipAllowlist.join(', ') : 'Any IP'}</span>
								{:else}
									<span>Allowed Origins: {k.allowedOrigins?.length ? k.allowedOrigins.join(', ') : 'Any Origin'}</span>
								{/if}
								<span>Calls: {k.usageCount || 0}</span>
							</div>
						</div>
						{#if k.status !== 'REVOKED'}
							<div class="flex flex-wrap gap-2">
								<button
									type="button"
									on:click={() => (editingKey = JSON.parse(JSON.stringify(k)))}
									class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
								>
									IP / Origins &amp; Scopes
								</button>
								{#if k.status === 'ACTIVE'}
									<button
										type="button"
										on:click={() => handleRoll(k)}
										class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
									>
										Roll (24h Grace)
									</button>
								{/if}
								<button
									type="button"
									on:click={() => handleRevoke(k)}
									class="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
								>
									Revoke
								</button>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if showCreateModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
			<h3 class="text-lg font-bold text-gray-900">Create {keyType === 'PUBLISHABLE' ? 'Publishable SDK' : 'Secret API'} Key</h3>
			<div class="mt-4 space-y-4">
				<div>
					<label class="text-xs font-semibold text-gray-700">Key Name</label>
					<input bind:value={name} placeholder="e.g. Production Checkout Website" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="text-xs font-semibold text-gray-700">Type</label>
						<select bind:value={keyType} class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
							<option value="SECRET">Secret Key (Server REST)</option>
							<option value="PUBLISHABLE">Publishable Key (Web SDK)</option>
						</select>
					</div>
					<div>
						<label class="text-xs font-semibold text-gray-700">Environment</label>
						<select bind:value={environment} class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
							<option value="live">Live (Production)</option>
							<option value="test">Test Prefix (Same Prod Workspace)</option>
						</select>
					</div>
				</div>

				{#if environment === 'test'}
					<div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
						<strong>Single production environment:</strong> <code class="font-mono">rw_test_...</code> keys use a distinct prefix for QA/staging separation, but still authenticate against your live account data. Test write calls on an unlisted or dedicated test event.
					</div>
				{/if}

				<div>
					<label class="text-xs font-semibold text-gray-700">Scope Preset</label>
					<select bind:value={preset} class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
						<option value="full">Full Access</option>
						<option value="sdk">Web SDKs Only</option>
						<option value="checkin">Check-in &amp; Door Scanner</option>
						<option value="analytics">Analytics Read-Only</option>
						<option value="custom">Custom Scopes</option>
					</select>
				</div>

				{#if keyType === 'SECRET'}
					<div>
						<label class="text-xs font-semibold text-gray-700">IP Whitelisting (IPv4 / IPv6 CIDR)</label>
						<div class="mt-1 flex gap-2">
							<input bind:value={ipInput} placeholder="e.g. 203.0.113.0/24" class="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
							<button type="button" on:click={addIpRule} class="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white">Add IP</button>
						</div>
						<div class="mt-2 flex flex-wrap gap-1.5">
							{#each ipAllowlist as ip, idx}
								<span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs">
									{ip}
									<button type="button" on:click={() => (ipAllowlist = ipAllowlist.filter((_, i) => i !== idx))}>×</button>
								</span>
							{/each}
						</div>
					</div>
				{:else}
					<div>
						<label class="text-xs font-semibold text-gray-700">Allowed Website Origins</label>
						<div class="mt-1 flex gap-2">
							<input bind:value={originInput} placeholder="e.g. https://mysite.com" class="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
							<button type="button" on:click={addOriginRule} class="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white">Add Origin</button>
						</div>
						<div class="mt-2 flex flex-wrap gap-1.5">
							{#each allowedOrigins as orig, idx}
								<span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs">
									{orig}
									<button type="button" on:click={() => (allowedOrigins = allowedOrigins.filter((_, i) => i !== idx))}>×</button>
								</span>
							{/each}
						</div>
					</div>
				{/if}

				<div class="flex justify-end gap-2 pt-2">
					<button type="button" on:click={() => (showCreateModal = false)} class="rounded-lg border px-4 py-2 text-sm">Cancel</button>
					<button type="button" disabled={saving || !name.trim()} on:click={handleCreate} class="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
						{saving ? 'Generating…' : 'Generate Key'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if editingKey}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
			<h3 class="text-lg font-bold text-gray-900">Edit Security Rules — {editingKey.name}</h3>
			<div class="mt-4 space-y-4">
				{#if editingKey.keyType === 'SECRET'}
					<div>
						<label class="text-xs font-semibold text-gray-700">IP Allowlist (comma-separated CIDR or IP)</label>
						<input
							value={editingKey.ipAllowlist.join(', ')}
							on:input={(e) => {
								if (editingKey) {
									editingKey.ipAllowlist = e.currentTarget.value.split(',').map((s) => s.trim()).filter(Boolean);
								}
							}}
							placeholder="203.0.113.0/24, 198.51.100.12"
							class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
						/>
					</div>
				{:else}
					<div>
						<label class="text-xs font-semibold text-gray-700">Allowed Origins (comma-separated)</label>
						<input
							value={editingKey.allowedOrigins.join(', ')}
							on:input={(e) => {
								if (editingKey) {
									editingKey.allowedOrigins = e.currentTarget.value.split(',').map((s) => s.trim()).filter(Boolean);
								}
							}}
							placeholder="https://events.acme.com, https://*.acme.com"
							class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
						/>
					</div>
				{/if}
				<div class="flex justify-end gap-2 pt-2">
					<button type="button" on:click={() => (editingKey = null)} class="rounded-lg border px-4 py-2 text-sm">Cancel</button>
					<button type="button" disabled={saving} on:click={handleSaveSecurityRules} class="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white">Save Changes</button>
				</div>
			</div>
		</div>
	</div>
{/if}
