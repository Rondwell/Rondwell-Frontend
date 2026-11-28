<script lang="ts">
	import Icon from '@iconify/svelte';
	import CustomSelect, { type SelectBadgeTone, type SelectOption } from '$lib/components/CustomSelect.svelte';
	import { REST_ENDPOINTS } from './docsData';

	const DEFAULT_GATEWAY = import.meta.env.VITE_API_URL || 'https://api.rondwell.com';

	let selectedIdx = 0;
	let eventId = '';
	let collectionSlug = '';
	let apiKey = '';
	let showApiKey = false;
	let customBody = '';
	let loading = false;
	let statusCode: number | null = null;
	let latencyMs: number | null = null;
	let responseText = '';
	let copiedResponse = false;

	function methodTone(method: string): SelectBadgeTone {
		switch (method.toUpperCase()) {
			case 'GET':
				return 'sky';
			case 'POST':
				return 'emerald';
			case 'PATCH':
			case 'PUT':
				return 'amber';
			case 'DELETE':
				return 'rose';
			default:
				return 'slate';
		}
	}

	const endpointOptions: SelectOption<number>[] = REST_ENDPOINTS.map((item, idx) => ({
		value: idx,
		label: item.path,
		description: item.summary,
		badge: item.method,
		badgeTone: methodTone(item.method),
		mono: true,
	}));

	$: ep = REST_ENDPOINTS[selectedIdx] ?? REST_ENDPOINTS[0];
	$: resolvedPath = ep.path
		.replace('{eventId}', eventId.trim() || 'EVENT_ID')
		.replace('{collectionIdOrSlug}', collectionSlug.trim() || 'lagos-tech-week');

	$: if (ep) {
		customBody = ep.requestExample || '';
	}

	async function sendTestRequest() {
		if (!DEFAULT_GATEWAY) {
			responseText = 'Configure VITE_API_URL to run live requests from the console.';
			return;
		}
		loading = true;
		statusCode = null;
		latencyMs = null;
		const startedAt = performance.now();
		try {
			const headers: Record<string, string> = {};
			if (apiKey.trim()) {
				if (apiKey.trim().includes('_pub_')) headers['X-Rondwell-Publishable-Key'] = apiKey.trim();
				else headers['Authorization'] = `Bearer ${apiKey.trim()}`;
			}
			const init: RequestInit = { method: ep.method, headers };
			if (ep.method !== 'GET' && customBody.trim()) {
				headers['Content-Type'] = 'application/json';
				init.body = customBody;
			}
			const res = await fetch(`${DEFAULT_GATEWAY}${resolvedPath}`, init);
			latencyMs = Math.round(performance.now() - startedAt);
			statusCode = res.status;
			const json = await res.json().catch(() => null);
			responseText = json ? JSON.stringify(json, null, 2) : await res.text();
		} catch (e: any) {
			latencyMs = Math.round(performance.now() - startedAt);
			responseText = e?.message || 'Network request failed';
		} finally {
			loading = false;
		}
	}

	function copyResponse() {
		if (!responseText) return;
		navigator.clipboard?.writeText(responseText);
		copiedResponse = true;
		setTimeout(() => (copiedResponse = false), 1800);
	}
</script>

<div class="min-w-0 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-950 to-[#0B0D18] p-4 text-slate-100 shadow-2xl sm:p-6">
	<div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/90 pb-4">
		<div class="flex min-w-0 items-center gap-3">
			<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/20">
				<Icon icon="solar:terminal-bold-duotone" class="h-5 w-5" />
			</span>
			<div class="min-w-0">
				<h3 class="text-sm font-bold text-white">Interactive API Console</h3>
				<p class="text-xs text-slate-400">Execute live <code class="font-mono text-violet-300">/v1</code> requests using your Secret or Publishable key.</p>
			</div>
		</div>
		{#if statusCode !== null}
			<div class="flex items-center gap-2">
				{#if latencyMs !== null}
					<span class="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-0.5 font-mono text-[11px] text-slate-300">
						{latencyMs}ms
					</span>
				{/if}
				<span class="rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold {statusCode < 400 ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30' : 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/30'}">
					HTTP {statusCode}
				</span>
			</div>
		{/if}
	</div>

	<div class="mt-4 grid gap-3.5 sm:grid-cols-2">
		<div class="min-w-0">
			<label for="console-endpoint" class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Endpoint</label>
			<CustomSelect
				id="console-endpoint"
				options={endpointOptions}
				bind:value={selectedIdx}
				variant="dark"
				ariaLabel="Select API endpoint"
			/>
		</div>
		<div class="min-w-0">
			<label for="console-api-key" class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">API / Publishable Key</label>
			<div class="relative">
				{#if showApiKey}
					<input
						id="console-api-key"
						type="text"
						bind:value={apiKey}
						placeholder="rw_live_... or rw_live_pub_..."
						class="min-h-[42px] w-full min-w-0 max-w-full rounded-xl border border-slate-700/85 bg-slate-900/90 py-2 pr-10 pl-3.5 font-mono text-xs text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
					/>
				{:else}
					<input
						id="console-api-key"
						type="password"
						bind:value={apiKey}
						placeholder="rw_live_... or rw_live_pub_..."
						class="min-h-[42px] w-full min-w-0 max-w-full rounded-xl border border-slate-700/85 bg-slate-900/90 py-2 pr-10 pl-3.5 font-mono text-xs text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
					/>
				{/if}
				<button
					type="button"
					on:click={() => (showApiKey = !showApiKey)}
					aria-label={showApiKey ? 'Hide key' : 'Show key'}
					class="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-white"
				>
					<Icon icon={showApiKey ? 'solar:eye-closed-linear' : 'solar:eye-linear'} class="h-4 w-4" />
				</button>
			</div>
		</div>
	</div>

	<div class="mt-3 grid gap-3.5 sm:grid-cols-2">
		{#if ep.path.includes('{eventId}')}
			<div class="min-w-0">
				<label for="console-event-id" class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Event ID</label>
				<input
					id="console-event-id"
					bind:value={eventId}
					placeholder="Enter event ID"
					class="min-h-[42px] w-full min-w-0 max-w-full rounded-xl border border-slate-700/85 bg-slate-900/90 px-3.5 py-2 font-mono text-xs text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
				/>
			</div>
		{/if}
		{#if ep.path.includes('{collectionIdOrSlug}')}
			<div class="min-w-0">
				<label for="console-collection-slug" class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Collection Slug or ID</label>
				<input
					id="console-collection-slug"
					bind:value={collectionSlug}
					placeholder="e.g. lagos-tech-week"
					class="min-h-[42px] w-full min-w-0 max-w-full rounded-xl border border-slate-700/85 bg-slate-900/90 px-3.5 py-2 font-mono text-xs text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
				/>
			</div>
		{/if}
	</div>

	{#if ep.method !== 'GET'}
		<div class="mt-3 min-w-0">
			<label for="console-json-body" class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">JSON Body</label>
			<textarea
				id="console-json-body"
				bind:value={customBody}
				rows="4"
				class="w-full min-w-0 rounded-xl border border-slate-700/85 bg-slate-900/90 p-3 font-mono text-xs text-slate-100 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
			></textarea>
		</div>
	{/if}

	<div class="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-800/90 bg-slate-900/60 p-3 sm:flex-row sm:items-center sm:justify-between">
		<code class="min-w-0 break-all font-mono text-xs text-violet-300">{ep.method} {resolvedPath}</code>
		<button
			type="button"
			disabled={loading}
			on:click={sendTestRequest}
			class="inline-flex min-h-[40px] w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#513BE2] to-[#7C3AED] px-5 py-2 text-xs font-bold text-white shadow-[0_6px_18px_-6px_rgba(124,58,237,0.75)] transition hover:brightness-110 disabled:opacity-50 sm:w-auto"
		>
			<Icon icon={loading ? 'solar:refresh-linear' : 'solar:play-bold'} class="h-3.5 w-3.5 {loading ? 'animate-spin' : ''}" />
			{loading ? 'Sending…' : 'Send Request'}
		</button>
	</div>

	{#if responseText}
		<div class="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-black/60">
			<div class="flex items-center justify-between border-b border-slate-800 px-3.5 py-2 text-[11px] text-slate-400">
				<span class="font-mono font-semibold text-slate-300">Response Body</span>
				<button type="button" on:click={copyResponse} class="inline-flex items-center gap-1 font-semibold text-slate-300 hover:text-white">
					<Icon icon={copiedResponse ? 'solar:check-circle-bold' : 'solar:copy-linear'} class="h-3.5 w-3.5 {copiedResponse ? 'text-emerald-400' : ''}" />
					{copiedResponse ? 'Copied' : 'Copy JSON'}
				</button>
			</div>
			<pre class="max-h-64 max-w-full overflow-auto p-3.5 font-mono text-xs text-emerald-300"><code>{responseText}</code></pre>
		</div>
	{/if}
</div>
