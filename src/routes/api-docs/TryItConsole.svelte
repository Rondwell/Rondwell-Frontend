<script lang="ts">
	import { REST_ENDPOINTS } from './docsData';

	const DEFAULT_GATEWAY = import.meta.env.VITE_API_URL || 'https://api.rondwell.com';

	let selectedIdx = 0;
	let eventId = '';
	let collectionSlug = '';
	let apiKey = '';
	let customBody = '';
	let loading = false;
	let statusCode: number | null = null;
	let responseText = '';

	$: ep = REST_ENDPOINTS[selectedIdx];
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
			statusCode = res.status;
			const json = await res.json().catch(() => null);
			responseText = json ? JSON.stringify(json, null, 2) : await res.text();
		} catch (e: any) {
			responseText = e?.message || 'Network request failed';
		} finally {
			loading = false;
		}
	}
</script>

<div class="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-slate-100">
	<div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
		<div>
			<h3 class="text-sm font-bold text-white">Interactive API Console</h3>
			<p class="text-xs text-slate-400">Test live <code class="font-mono">/v1</code> requests using your API or SDK key.</p>
		</div>
		{#if statusCode !== null}
			<span class="rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold {statusCode < 400 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}">
				HTTP {statusCode}
			</span>
		{/if}
	</div>

	<div class="mt-4 grid gap-3 sm:grid-cols-2">
		<div>
			<label class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Endpoint</label>
			<select bind:value={selectedIdx} class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white">
				{#each REST_ENDPOINTS as item, idx}
					<option value={idx}>{item.method} {item.path}</option>
				{/each}
			</select>
		</div>
		<div>
			<label class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">API / Publishable Key</label>
			<input type="password" bind:value={apiKey} placeholder="rw_live_... or rw_live_pub_..." class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white" />
		</div>
	</div>

	<div class="mt-3 grid gap-3 sm:grid-cols-2">
		{#if ep.path.includes('{eventId}')}
			<div>
				<label class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Event ID</label>
				<input bind:value={eventId} placeholder="Enter event ID" class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white" />
			</div>
		{/if}
		{#if ep.path.includes('{collectionIdOrSlug}')}
			<div>
				<label class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Collection Slug or ID</label>
				<input bind:value={collectionSlug} placeholder="e.g. lagos-tech-week" class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white" />
			</div>
		{/if}
	</div>

	{#if ep.method !== 'GET'}
		<div class="mt-3">
			<label class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">JSON Body</label>
			<textarea bind:value={customBody} rows="4" class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 font-mono text-xs text-slate-100"></textarea>
		</div>
	{/if}

	<div class="mt-4 flex items-center justify-between gap-3">
		<code class="truncate font-mono text-xs text-purple-300">{ep.method} {resolvedPath}</code>
		<button
			type="button"
			disabled={loading}
			on:click={sendTestRequest}
			class="shrink-0 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
		>
			{loading ? 'Sending…' : 'Send Request'}
		</button>
	</div>

	{#if responseText}
		<pre class="mt-4 max-h-64 overflow-auto rounded-lg border border-slate-800 bg-black/50 p-3 font-mono text-xs text-emerald-300"><code>{responseText}</code></pre>
	{/if}
</div>
