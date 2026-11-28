<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { getDeveloperOverview } from '$lib/services/developer.services';
	import ApiKeysManager from './ApiKeysManager.svelte';
	import WebhooksManager from './WebhooksManager.svelte';
	import UsageAndLogs from './UsageAndLogs.svelte';

	let subTab: 'keys' | 'webhooks' | 'logs' = 'keys';
	let overview: any = null;
	let loading = true;

	async function loadOverview() {
		loading = true;
		try {
			overview = await getDeveloperOverview();
		} catch {
			overview = null;
		} finally {
			loading = false;
		}
	}

	onMount(loadOverview);
</script>

<div class="space-y-6">
	<!-- Obsidian Hero Header -->
	<div class="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#17161E] via-[#1F1A36] to-[#291C4F] p-6 text-white shadow-[0_20px_50px_-20px_rgba(23,22,30,0.45)] sm:p-7">
		<div class="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#7C3AED]/25 blur-3xl"></div>
		<div class="pointer-events-none absolute -bottom-24 left-12 h-56 w-56 rounded-full bg-[#DB3E6C]/15 blur-3xl"></div>

		<div class="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
			<div class="max-w-2xl">
				<div class="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-[11px] font-semibold tracking-wide text-violet-200 backdrop-blur-md">
					<span class="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"></span>
					Rondwell Developer Platform · API v1 &amp; Web SDK
				</div>
				<h2 class="text-xl font-bold tracking-tight text-white sm:text-2xl">
					Developer Platform, API Keys &amp; Web SDKs
				</h2>
				<p class="mt-1.5 text-sm leading-relaxed text-slate-300">
					Create account-wide Secret REST keys with IP whitelisting, browser Publishable keys for Event &amp; Collection Web SDKs, and HMAC-SHA256 webhooks.
				</p>
			</div>

			<div class="flex flex-wrap items-center gap-2.5">
				<a
					href="/api-docs#console"
					class="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/[0.15]"
				>
					<Icon icon="solar:terminal-bold-duotone" class="h-4 w-4 text-violet-300" />
					API Console
				</a>
				<a
					href="/api-docs"
					class="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#17161E] shadow-lg transition hover:bg-violet-50"
				>
					<Icon icon="solar:book-2-bold-duotone" class="h-4 w-4 text-[#513BE2]" />
					Open API &amp; SDK Docs
				</a>
			</div>
		</div>
	</div>

	<!-- KPI Summary Cards -->
	{#if loading}
		<div class="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
			{#each [1, 2, 3, 4] as _}
				<div class="h-28 animate-pulse rounded-2xl border border-gray-200/70 bg-white p-4">
					<div class="h-3 w-20 rounded bg-gray-200"></div>
					<div class="mt-4 h-7 w-16 rounded bg-gray-200"></div>
					<div class="mt-3 h-2.5 w-28 rounded bg-gray-100"></div>
				</div>
			{/each}
		</div>
	{:else if overview}
		<div class="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
			<div class="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-[0_2px_10px_-4px_rgba(23,22,30,0.06)] transition hover:border-[#513BE2]/30">
				<div class="flex items-center justify-between">
					<p class="text-xs font-semibold text-gray-500">Active Keys</p>
					<span class="flex h-8 w-8 items-center justify-center rounded-xl bg-[#513BE2]/10 text-[#513BE2]">
						<Icon icon="solar:key-minimalistic-square-2-bold-duotone" class="h-4 w-4" />
					</span>
				</div>
				<p class="mt-2.5 text-2xl font-bold tracking-tight text-[#17161E] tabular-nums">{overview.activeKeys ?? 0}</p>
				<p class="mt-1 text-xs text-gray-500">
					<span class="font-medium text-gray-700">{overview.secretKeys ?? 0}</span> secret · <span class="font-medium text-gray-700">{overview.publishableKeys ?? 0}</span> SDK
				</p>
			</div>

			<div class="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-[0_2px_10px_-4px_rgba(23,22,30,0.06)] transition hover:border-[#513BE2]/30">
				<div class="flex items-center justify-between">
					<p class="text-xs font-semibold text-gray-500">Webhooks Enabled</p>
					<span class="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
						<Icon icon="solar:routing-3-bold-duotone" class="h-4 w-4" />
					</span>
				</div>
				<p class="mt-2.5 text-2xl font-bold tracking-tight text-[#17161E] tabular-nums">
					{overview.enabledWebhooks ?? 0} <span class="text-base font-medium text-gray-400">/ {overview.webhookEndpoints ?? 0}</span>
				</p>
				<p class="mt-1 text-xs text-gray-500">{overview.webhookDeliveries30d ?? 0} delivered (30d)</p>
			</div>

			<div class="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-[0_2px_10px_-4px_rgba(23,22,30,0.06)] transition hover:border-[#513BE2]/30">
				<div class="flex items-center justify-between">
					<p class="text-xs font-semibold text-gray-500">API Calls (30d)</p>
					<span class="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
						<Icon icon="solar:chart-square-bold-duotone" class="h-4 w-4" />
					</span>
				</div>
				<p class="mt-2.5 text-2xl font-bold tracking-tight text-[#17161E] tabular-nums">{overview.totalCalls30d ?? 0}</p>
				<p class="mt-1 text-xs text-gray-500">{overview.errorRatePct ?? 0}% error rate</p>
			</div>

			<div class="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-[0_2px_10px_-4px_rgba(23,22,30,0.06)] transition hover:border-emerald-500/30">
				<div class="flex items-center justify-between">
					<p class="text-xs font-semibold text-gray-500">Door Check-ins</p>
					<span class="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
						<Icon icon="solar:qr-code-bold-duotone" class="h-4 w-4" />
					</span>
				</div>
				<p class="mt-2.5 text-xl font-bold tracking-tight text-emerald-600">Unlimited</p>
				<p class="mt-1 text-xs text-gray-500">Exempt from API quota cap</p>
			</div>
		</div>
	{/if}

	<!-- Segmented Pill Tab Switcher -->
	<div class="inline-flex flex-wrap gap-1 rounded-2xl border border-gray-200/80 bg-[#F3F2F8] p-1.5">
		<button
			type="button"
			on:click={() => (subTab = 'keys')}
			class="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all sm:text-sm {subTab === 'keys'
				? 'bg-white text-[#17161E] shadow-sm ring-1 ring-black/5'
				: 'text-gray-600 hover:text-[#17161E]'}"
		>
			<Icon icon="solar:key-bold-duotone" class="h-4 w-4 {subTab === 'keys' ? 'text-[#513BE2]' : 'text-gray-400'}" />
			API &amp; SDK Keys
		</button>
		<button
			type="button"
			on:click={() => (subTab = 'webhooks')}
			class="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all sm:text-sm {subTab === 'webhooks'
				? 'bg-white text-[#17161E] shadow-sm ring-1 ring-black/5'
				: 'text-gray-600 hover:text-[#17161E]'}"
		>
			<Icon icon="solar:routing-3-bold-duotone" class="h-4 w-4 {subTab === 'webhooks' ? 'text-[#513BE2]' : 'text-gray-400'}" />
			Webhooks
		</button>
		<button
			type="button"
			on:click={() => (subTab = 'logs')}
			class="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all sm:text-sm {subTab === 'logs'
				? 'bg-white text-[#17161E] shadow-sm ring-1 ring-black/5'
				: 'text-gray-600 hover:text-[#17161E]'}"
		>
			<Icon icon="solar:diagram-up-bold-duotone" class="h-4 w-4 {subTab === 'logs' ? 'text-[#513BE2]' : 'text-gray-400'}" />
			Usage &amp; Request Logs
		</button>
	</div>

	{#if subTab === 'keys'}
		<ApiKeysManager on:changed={loadOverview} />
	{:else if subTab === 'webhooks'}
		<WebhooksManager on:changed={loadOverview} />
	{:else}
		<UsageAndLogs />
	{/if}
</div>
