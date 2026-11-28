<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import Icon from '@iconify/svelte';
	import { portal } from '$lib/utils/portal';
	import CustomSelect, { type SelectOption } from '$lib/components/CustomSelect.svelte';
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
	let copiedRawKey = false;
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

	const ENV_OPTIONS: SelectOption<'live' | 'test'>[] = [
		{
			value: 'live',
			label: 'Live (Production)',
			description: 'Production prefix rw_live_... for live websites & servers',
			badge: 'LIVE',
			badgeTone: 'emerald',
			icon: 'solar:shield-check-bold-duotone',
		},
		{
			value: 'test',
			label: 'Test Prefix (QA / Staging)',
			description: 'Uses rw_test_... prefix against your workspace for staging separation',
			badge: 'TEST',
			badgeTone: 'amber',
			icon: 'solar:flask-bold-duotone',
		},
	];

	const PRESET_OPTIONS: SelectOption<'full' | 'sdk' | 'checkin' | 'analytics' | 'custom'>[] = [
		{
			value: 'full',
			label: 'Full Access',
			description: 'All 23 REST API & Web SDK scopes enabled',
			badge: '23',
			badgeTone: 'purple',
			icon: 'solar:crown-bold-duotone',
		},
		{
			value: 'sdk',
			label: 'Web SDKs Only',
			description: 'Public event & collection embed checkout + seat selection',
			badge: 'SDK',
			badgeTone: 'sky',
			icon: 'solar:code-square-bold-duotone',
		},
		{
			value: 'checkin',
			label: 'Check-in & Door Scanner',
			description: 'Scan QR passes, inspect credentials, and record gate check-ins',
			badge: 'OPS',
			badgeTone: 'emerald',
			icon: 'solar:qr-code-bold-duotone',
		},
		{
			value: 'analytics',
			label: 'Analytics Read-Only',
			description: 'Read event metrics, funnel stats, and export reports',
			badge: 'READ',
			badgeTone: 'slate',
			icon: 'solar:chart-square-bold-duotone',
		},
		{
			value: 'custom',
			label: 'Custom Scopes',
			description: 'Pick individual granular permissions manually',
			badge: 'CUSTOM',
			badgeTone: 'amber',
			icon: 'solar:tuning-2-bold-duotone',
		},
	];

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
		ipInput = '';
		originInput = '';
		showCreateModal = true;
	}

	function selectKeyType(nextType: 'SECRET' | 'PUBLISHABLE') {
		keyType = nextType;
		if (nextType === 'PUBLISHABLE' && preset === 'full') {
			preset = 'sdk';
		} else if (nextType === 'SECRET' && preset === 'sdk') {
			preset = 'full';
		}
	}

	function toggleScope(scope: string) {
		if (selectedScopes.includes(scope)) {
			selectedScopes = selectedScopes.filter((s) => s !== scope);
		} else {
			selectedScopes = [...selectedScopes, scope];
		}
	}

	function toggleEditingScope(scope: string) {
		if (!editingKey) return;
		const current = editingKey.scopes || [];
		editingKey.scopes = current.includes(scope)
			? current.filter((s) => s !== scope)
			: [...current, scope];
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
			copiedRawKey = false;
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
			copiedRawKey = false;
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
		copiedRawKey = true;
		toast.success('Copied to clipboard');
		setTimeout(() => (copiedRawKey = false), 2000);
	}
</script>

<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(23,22,30,0.05)]">
		<div>
			<h3 class="text-base font-bold text-[#17161E]">Account API &amp; SDK Credentials</h3>
			<p class="mt-0.5 text-xs text-gray-500">
				Use Secret Keys (<code class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-[#17161E]">rw_live_...</code>) on your backend and Publishable Keys (<code class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-[#513BE2]">rw_live_pub_...</code>) in Web SDKs.
			</p>
		</div>
		<div class="flex flex-wrap gap-2.5">
			<button
				type="button"
				on:click={() => openCreate('PUBLISHABLE')}
				class="inline-flex items-center gap-1.5 rounded-xl border border-[#513BE2]/25 bg-[#513BE2]/[0.06] px-4 py-2.5 text-xs font-semibold text-[#513BE2] transition hover:bg-[#513BE2]/12"
			>
				<Icon icon="solar:code-square-bold-duotone" class="h-4 w-4" />
				Create SDK Publishable Key
			</button>
			<button
				type="button"
				on:click={() => openCreate('SECRET')}
				class="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#513BE2] to-[#7C3AED] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_6px_18px_-6px_rgba(81,59,226,0.65)] transition hover:brightness-110"
			>
				<Icon icon="solar:key-minimalistic-square-2-bold-duotone" class="h-4 w-4" />
				Create Secret API Key
			</button>
		</div>
	</div>

	{#if revealedRawKey}
		<div class="overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-[#111827] via-[#17161E] to-[#1E1B38] p-5 text-white shadow-xl">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div class="min-w-0 flex-1">
					<div class="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/25">
						<Icon icon="solar:shield-warning-bold-duotone" class="h-3.5 w-3.5" />
						Copy your credential now — it will never be shown again
					</div>
					<div class="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5">
						<code class="min-w-0 flex-1 break-all font-mono text-xs text-emerald-200">{revealedRawKey}</code>
					</div>
				</div>
				<div class="flex shrink-0 items-center gap-2">
					<button
						type="button"
						on:click={() => copyText(revealedRawKey)}
						class="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
					>
						<Icon icon={copiedRawKey ? 'solar:check-circle-bold' : 'solar:copy-bold-duotone'} class="h-4 w-4" />
						{copiedRawKey ? 'Copied' : 'Copy Key'}
					</button>
					<button
						type="button"
						on:click={() => (revealedRawKey = '')}
						class="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
					>
						Dismiss
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if loading}
		<div class="space-y-3">
			{#each [1, 2] as _}
				<div class="h-28 animate-pulse rounded-2xl border border-gray-200/70 bg-white"></div>
			{/each}
		</div>
	{:else if keys.length === 0}
		<div class="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
			<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#513BE2]/10 text-[#513BE2]">
				<Icon icon="solar:key-minimalistic-square-2-bold-duotone" class="h-6 w-6" />
			</div>
			<p class="mt-3 text-base font-bold text-[#17161E]">No API or SDK keys yet</p>
			<p class="mx-auto mt-1 max-w-md text-xs leading-relaxed text-gray-500">
				Create a Publishable Key for Event &amp; Collection Web SDKs, or a Secret Key with optional IP whitelisting for server-to-server REST APIs.
			</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each keys as k}
				<div class="group rounded-2xl border border-gray-200/85 bg-white p-4 shadow-[0_2px_10px_-4px_rgba(23,22,30,0.05)] transition hover:border-[#513BE2]/30 sm:p-5">
					<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-center gap-2">
								<span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl {k.keyType === 'PUBLISHABLE' ? 'bg-sky-500/10 text-sky-600' : 'bg-[#513BE2]/10 text-[#513BE2]'}">
									<Icon icon={k.keyType === 'PUBLISHABLE' ? 'solar:code-square-bold-duotone' : 'solar:lock-keyhole-bold-duotone'} class="h-4 w-4" />
								</span>
								<span class="text-sm font-bold text-[#17161E]">{k.name}</span>
								<span class="rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider {k.keyType === 'PUBLISHABLE' ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20' : 'bg-[#513BE2]/10 text-[#513BE2] ring-1 ring-[#513BE2]/20'}">
									{k.keyType}
								</span>
								<span class="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-gray-600">
									{k.environment}
								</span>
								<span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold {k.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' : k.status === 'ROLLING' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20'}">
									<span class="h-1.5 w-1.5 rounded-full {k.status === 'ACTIVE' ? 'bg-emerald-500' : k.status === 'ROLLING' ? 'bg-amber-500' : 'bg-rose-500'}"></span>
									{k.status}
								</span>
							</div>

							<div class="mt-2.5 flex flex-wrap items-center gap-2.5">
								<code class="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 font-mono text-xs text-gray-700">{k.maskedKey}</code>
								<span class="inline-flex items-center gap-1 text-xs text-gray-500">
									<Icon icon="solar:shield-keyhole-linear" class="h-3.5 w-3.5 text-gray-400" />
									{k.scopes.length} scopes
								</span>
								<span class="inline-flex items-center gap-1 text-xs text-gray-500">
									<Icon icon="solar:activity-linear" class="h-3.5 w-3.5 text-gray-400" />
									{k.usageCount || 0} calls
								</span>
								<span class="inline-flex items-center gap-1 text-xs text-gray-500">
									<Icon icon="solar:globe-linear" class="h-3.5 w-3.5 text-gray-400" />
									{#if k.keyType === 'SECRET'}
										{k.ipAllowlist?.length ? `${k.ipAllowlist.length} CIDR rule(s)` : 'Any IP'}
									{:else}
										{k.allowedOrigins?.length ? `${k.allowedOrigins.length} origin(s)` : 'Any Origin'}
									{/if}
								</span>
							</div>
						</div>

						{#if k.status !== 'REVOKED'}
							<div class="flex flex-wrap items-center gap-2">
								<button
									type="button"
									on:click={() => (editingKey = JSON.parse(JSON.stringify(k)))}
									class="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-[#513BE2]/40 hover:bg-gray-50"
								>
									<Icon icon="solar:tuning-2-linear" class="h-3.5 w-3.5" />
									Rules &amp; Scopes
								</button>
								{#if k.status === 'ACTIVE'}
									<button
										type="button"
										on:click={() => handleRoll(k)}
										class="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-amber-300 hover:bg-amber-50/60"
									>
										<Icon icon="solar:refresh-circle-linear" class="h-3.5 w-3.5" />
										Roll (24h)
									</button>
								{/if}
								<button
									type="button"
									on:click={() => handleRevoke(k)}
									class="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
								>
									<Icon icon="solar:trash-bin-minimalistic-linear" class="h-3.5 w-3.5" />
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

<!-- Create Key Modal -->
{#if showCreateModal}
	<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
	<div
		use:portal
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-label="Create API or SDK key"
		tabindex="-1"
		on:click={() => (showCreateModal = false)}
		on:keydown={(e) => e.key === 'Escape' && (showCreateModal = false)}
		transition:fade={{ duration: 140 }}
	>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
			on:click|stopPropagation
			transition:scale={{ duration: 160, start: 0.97 }}
		>
			<!-- Modal Header -->
			<div class="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
				<div class="flex items-center gap-3">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#513BE2]/10 text-[#513BE2]">
						<Icon icon={keyType === 'PUBLISHABLE' ? 'solar:code-square-bold-duotone' : 'solar:key-minimalistic-square-2-bold-duotone'} class="h-5 w-5" />
					</span>
					<div>
						<h3 class="text-base font-bold text-[#17161E]">
							Create {keyType === 'PUBLISHABLE' ? 'Publishable SDK' : 'Secret API'} Key
						</h3>
						<p class="text-xs text-gray-500">Scoped credential for your account APIs &amp; Web SDK widgets.</p>
					</div>
				</div>
				<button
					type="button"
					on:click={() => (showCreateModal = false)}
					aria-label="Close modal"
					class="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
				>
					<Icon icon="solar:close-circle-linear" class="h-5 w-5" />
				</button>
			</div>

			<!-- Scrollable Body -->
			<div class="flex-1 space-y-5 overflow-y-auto px-6 py-5">
				<div>
					<label for="create-key-name" class="text-xs font-semibold text-gray-700">Key Name</label>
					<input
						id="create-key-name"
						bind:value={name}
						placeholder="e.g. Production Checkout Website"
						class="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#17161E] shadow-[0_1px_2px_rgba(23,22,30,0.03)] transition outline-none focus:border-[#513BE2] focus:ring-2 focus:ring-[#513BE2]/15"
					/>
				</div>

				<!-- Credential Type Cards -->
				<div>
					<p class="text-xs font-semibold text-gray-700">Credential Type</p>
					<div class="mt-1.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
						<button
							type="button"
							on:click={() => selectKeyType('SECRET')}
							class="flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all {keyType === 'SECRET'
								? 'border-[#513BE2] bg-[#513BE2]/[0.05] ring-2 ring-[#513BE2]/15'
								: 'border-gray-200 bg-white hover:border-gray-300'}"
						>
							<span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl {keyType === 'SECRET' ? 'bg-[#513BE2] text-white' : 'bg-gray-100 text-gray-500'}">
								<Icon icon="solar:lock-keyhole-bold-duotone" class="h-4 w-4" />
							</span>
							<span class="min-w-0">
								<span class="block text-xs font-bold text-[#17161E]">Secret Key</span>
								<span class="mt-0.5 block text-[11px] leading-snug text-gray-500">Server-side REST APIs &amp; IP allowlisting</span>
							</span>
						</button>

						<button
							type="button"
							on:click={() => selectKeyType('PUBLISHABLE')}
							class="flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all {keyType === 'PUBLISHABLE'
								? 'border-[#513BE2] bg-[#513BE2]/[0.05] ring-2 ring-[#513BE2]/15'
								: 'border-gray-200 bg-white hover:border-gray-300'}"
						>
							<span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl {keyType === 'PUBLISHABLE' ? 'bg-[#513BE2] text-white' : 'bg-gray-100 text-gray-500'}">
								<Icon icon="solar:code-square-bold-duotone" class="h-4 w-4" />
							</span>
							<span class="min-w-0">
								<span class="block text-xs font-bold text-[#17161E]">Publishable Key</span>
								<span class="mt-0.5 block text-[11px] leading-snug text-gray-500">Browser Event &amp; Collection Web SDKs</span>
							</span>
						</button>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label for="create-key-env" class="mb-1.5 block text-xs font-semibold text-gray-700">Environment</label>
						<CustomSelect
							id="create-key-env"
							options={ENV_OPTIONS}
							bind:value={environment}
							ariaLabel="Select key environment"
						/>
					</div>

					<div>
						<label for="create-key-preset" class="mb-1.5 block text-xs font-semibold text-gray-700">Scope Preset</label>
						<CustomSelect
							id="create-key-preset"
							options={PRESET_OPTIONS}
							bind:value={preset}
							ariaLabel="Select permission scope preset"
						/>
					</div>
				</div>

				{#if environment === 'test'}
					<div class="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-[11px] leading-relaxed text-amber-900">
						<Icon icon="solar:info-circle-bold-duotone" class="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
						<span>
							<strong>Single production workspace:</strong> <code class="font-mono">rw_test_...</code> keys provide a distinct prefix for QA/staging separation against your live workspace. Test writes on an unlisted event.
						</span>
					</div>
				{/if}

				{#if preset === 'custom'}
					<div class="rounded-2xl border border-gray-200 bg-gray-50/70 p-3.5">
						<div class="mb-2.5 flex items-center justify-between">
							<span class="text-xs font-bold text-[#17161E]">Custom Scopes ({selectedScopes.length} selected)</span>
							<div class="flex gap-2 text-[11px] font-semibold">
								<button type="button" on:click={() => (selectedScopes = [...ALL_SCOPES])} class="text-[#513BE2] hover:underline">Select All</button>
								<button type="button" on:click={() => (selectedScopes = [])} class="text-gray-500 hover:underline">Clear</button>
							</div>
						</div>
						<div class="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto">
							{#each ALL_SCOPES as scope}
								{@const active = selectedScopes.includes(scope)}
								<button
									type="button"
									on:click={() => toggleScope(scope)}
									class="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 font-mono text-[11px] font-medium transition {active
										? 'border-[#513BE2] bg-[#513BE2] text-white shadow-sm'
										: 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}"
								>
									{#if active}
										<Icon icon="solar:check-read-linear" class="h-3 w-3" />
									{/if}
									{scope}
								</button>
							{/each}
						</div>
					</div>
				{/if}

				{#if keyType === 'SECRET'}
					<div>
						<label for="create-ip-rule" class="text-xs font-semibold text-gray-700">IP Whitelisting (IPv4 / IPv6 CIDR)</label>
						<div class="mt-1.5 flex gap-2">
							<input
								id="create-ip-rule"
								bind:value={ipInput}
								on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), addIpRule())}
								placeholder="e.g. 203.0.113.0/24"
								class="flex-1 rounded-xl border border-gray-200 px-3.5 py-2 font-mono text-xs text-[#17161E] outline-none focus:border-[#513BE2] focus:ring-2 focus:ring-[#513BE2]/15"
							/>
							<button type="button" on:click={addIpRule} class="rounded-xl bg-[#17161E] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#2a2838]">
								Add IP
							</button>
						</div>
						{#if ipAllowlist.length > 0}
							<div class="mt-2.5 flex flex-wrap gap-1.5">
								{#each ipAllowlist as ip, idx}
									<span class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 font-mono text-xs text-gray-700">
										{ip}
										<button
											type="button"
											on:click={() => (ipAllowlist = ipAllowlist.filter((_, i) => i !== idx))}
											class="text-gray-400 hover:text-rose-600"
											aria-label="Remove IP"
										>
											×
										</button>
									</span>
								{/each}
							</div>
						{/if}
					</div>
				{:else}
					<div>
						<label for="create-origin-rule" class="text-xs font-semibold text-gray-700">Allowed Website Origins</label>
						<div class="mt-1.5 flex gap-2">
							<!-- csp-ignore-next-line — placeholder text -->
							<input
								id="create-origin-rule"
								bind:value={originInput}
								on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), addOriginRule())}
								placeholder="e.g. https://mysite.com"
								class="flex-1 rounded-xl border border-gray-200 px-3.5 py-2 font-mono text-xs text-[#17161E] outline-none focus:border-[#513BE2] focus:ring-2 focus:ring-[#513BE2]/15"
							/>
							<button type="button" on:click={addOriginRule} class="rounded-xl bg-[#17161E] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#2a2838]">
								Add Origin
							</button>
						</div>
						{#if allowedOrigins.length > 0}
							<div class="mt-2.5 flex flex-wrap gap-1.5">
								{#each allowedOrigins as orig, idx}
									<span class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 font-mono text-xs text-gray-700">
										{orig}
										<button
											type="button"
											on:click={() => (allowedOrigins = allowedOrigins.filter((_, i) => i !== idx))}
											class="text-gray-400 hover:text-rose-600"
											aria-label="Remove origin"
										>
											×
										</button>
									</span>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Modal Footer -->
			<div class="flex items-center justify-end gap-2.5 border-t border-gray-100 bg-gray-50/70 px-6 py-4">
				<button
					type="button"
					on:click={() => (showCreateModal = false)}
					class="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					type="button"
					disabled={saving || !name.trim()}
					on:click={handleCreate}
					class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#513BE2] to-[#7C3AED] px-5 py-2.5 text-xs font-semibold text-white shadow-[0_6px_18px_-6px_rgba(81,59,226,0.65)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<Icon icon="solar:bolt-bold-duotone" class="h-4 w-4" />
					{saving ? 'Generating…' : 'Generate Key'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Edit Security Rules Modal -->
{#if editingKey}
	<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
	<div
		use:portal
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-label="Edit security rules and scopes"
		tabindex="-1"
		on:click={() => (editingKey = null)}
		on:keydown={(e) => e.key === 'Escape' && (editingKey = null)}
		transition:fade={{ duration: 140 }}
	>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
			on:click|stopPropagation
			transition:scale={{ duration: 160, start: 0.97 }}
		>
			<div class="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
				<div>
					<h3 class="text-base font-bold text-[#17161E]">Security Rules &amp; Scopes</h3>
					<p class="text-xs text-gray-500">{editingKey.name} · <code class="font-mono">{editingKey.maskedKey}</code></p>
				</div>
				<button
					type="button"
					on:click={() => (editingKey = null)}
					aria-label="Close modal"
					class="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
				>
					<Icon icon="solar:close-circle-linear" class="h-5 w-5" />
				</button>
			</div>

			<div class="flex-1 space-y-5 overflow-y-auto px-6 py-5">
				{#if editingKey.keyType === 'SECRET'}
					<div>
						<label for="edit-ip-allowlist" class="text-xs font-semibold text-gray-700">IP Allowlist (comma-separated CIDR or IP)</label>
						<input
							id="edit-ip-allowlist"
							value={editingKey.ipAllowlist.join(', ')}
							on:input={(e) => {
								if (editingKey) {
									editingKey.ipAllowlist = e.currentTarget.value.split(',').map((s) => s.trim()).filter(Boolean);
								}
							}}
							placeholder="203.0.113.0/24, 198.51.100.12"
							class="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 font-mono text-xs text-[#17161E] outline-none focus:border-[#513BE2] focus:ring-2 focus:ring-[#513BE2]/15"
						/>
					</div>
				{:else}
					<div>
						<label for="edit-origin-allowlist" class="text-xs font-semibold text-gray-700">Allowed Origins (comma-separated)</label>
						<!-- csp-ignore-next-line — placeholder text -->
						<input
							id="edit-origin-allowlist"
							value={editingKey.allowedOrigins.join(', ')}
							on:input={(e) => {
								if (editingKey) {
									editingKey.allowedOrigins = e.currentTarget.value.split(',').map((s) => s.trim()).filter(Boolean);
								}
							}}
							placeholder="https://events.acme.com, https://*.acme.com"
							class="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 font-mono text-xs text-[#17161E] outline-none focus:border-[#513BE2] focus:ring-2 focus:ring-[#513BE2]/15"
						/>
					</div>
				{/if}

				<div>
					<p class="mb-2 text-xs font-semibold text-gray-700">Active Scopes ({editingKey.scopes.length})</p>
					<div class="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
						{#each ALL_SCOPES as scope}
							{@const active = editingKey.scopes.includes(scope)}
							<button
								type="button"
								on:click={() => toggleEditingScope(scope)}
								class="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 font-mono text-[11px] font-medium transition {active
									? 'border-[#513BE2] bg-[#513BE2] text-white shadow-sm'
									: 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}"
							>
								{#if active}
									<Icon icon="solar:check-read-linear" class="h-3 w-3" />
								{/if}
								{scope}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<div class="flex justify-end gap-2.5 border-t border-gray-100 bg-gray-50/70 px-6 py-4">
				<button type="button" on:click={() => (editingKey = null)} class="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
					Cancel
				</button>
				<button type="button" disabled={saving} on:click={handleSaveSecurityRules} class="rounded-xl bg-[#513BE2] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#4330c9] disabled:opacity-50">
					{saving ? 'Saving…' : 'Save Changes'}
				</button>
			</div>
		</div>
	</div>
{/if}
