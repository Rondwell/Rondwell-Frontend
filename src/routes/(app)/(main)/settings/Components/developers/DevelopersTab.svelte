<script lang="ts">
	import { onMount } from 'svelte';
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
	<div class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5">
		<div>
			<h2 class="text-xl font-bold text-gray-900">Developer Platform, API Keys &amp; Web SDKs</h2>
			<p class="mt-1 text-sm text-gray-600">
				Manage account-wide Secret API keys, browser Publishable SDK keys, IP whitelisting, and HMAC-signed webhooks.
			</p>
		</div>
		<a
			href="/api-docs"
			class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
		>
			Open API &amp; SDK Docs
		</a>
	</div>

	{#if overview}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
			<div class="rounded-xl border border-gray-200 bg-white p-4">
				<p class="text-xs text-gray-500">Active Keys</p>
				<p class="mt-1 text-2xl font-bold text-gray-900">{overview.activeKeys ?? 0}</p>
				<p class="text-xs text-gray-500">{overview.secretKeys ?? 0} secret · {overview.publishableKeys ?? 0} SDK</p>
			</div>
			<div class="rounded-xl border border-gray-200 bg-white p-4">
				<p class="text-xs text-gray-500">Webhooks Enabled</p>
				<p class="mt-1 text-2xl font-bold text-gray-900">{overview.enabledWebhooks ?? 0} / {overview.webhookEndpoints ?? 0}</p>
				<p class="text-xs text-gray-500">{overview.webhookDeliveries30d ?? 0} delivered (30d)</p>
			</div>
			<div class="rounded-xl border border-gray-200 bg-white p-4">
				<p class="text-xs text-gray-500">API Calls (30d)</p>
				<p class="mt-1 text-2xl font-bold text-gray-900">{overview.totalCalls30d ?? 0}</p>
				<p class="text-xs text-gray-500">{overview.errorRatePct ?? 0}% error rate</p>
			</div>
			<div class="rounded-xl border border-gray-200 bg-white p-4">
				<p class="text-xs text-gray-500">Monthly Door Check-ins</p>
				<p class="mt-1 text-lg font-bold text-emerald-600">Unlimited</p>
				<p class="text-xs text-gray-500">Exempt from quota cap</p>
			</div>
		</div>
	{/if}

	<div class="flex gap-2 border-b border-gray-200">
		<button
			type="button"
			on:click={() => (subTab = 'keys')}
			class="border-b-2 px-4 py-2.5 text-sm font-semibold transition {subTab === 'keys' ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-800'}"
		>
			API &amp; SDK Keys
		</button>
		<button
			type="button"
			on:click={() => (subTab = 'webhooks')}
			class="border-b-2 px-4 py-2.5 text-sm font-semibold transition {subTab === 'webhooks' ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-800'}"
		>
			Webhooks
		</button>
		<button
			type="button"
			on:click={() => (subTab = 'logs')}
			class="border-b-2 px-4 py-2.5 text-sm font-semibold transition {subTab === 'logs' ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-800'}"
		>
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
