<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { listApiLogs, getApiUsage } from '$lib/services/developer.services';

	let logs: any[] = [];
	let daily: any[] = [];
	let loading = true;

	async function loadUsage() {
		loading = true;
		try {
			const [logsRes, usageRes] = await Promise.all([listApiLogs({ limit: 30 }), getApiUsage()]);
			logs = logsRes?.data || [];
			daily = usageRes?.daily || [];
		} catch {
			/* ignore */
		} finally {
			loading = false;
		}
	}

	onMount(loadUsage);

	function methodBadge(method: string): string {
		switch ((method || '').toUpperCase()) {
			case 'GET':
				return 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20';
			case 'POST':
				return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
			case 'PATCH':
			case 'PUT':
				return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20';
			case 'DELETE':
				return 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20';
			default:
				return 'bg-gray-100 text-gray-700 ring-1 ring-gray-300/60';
		}
	}

	$: recentDaily = daily.slice(-14);
	$: maxDailyRequests = Math.max(1, ...recentDaily.map((d) => Number(d.requests || 0)));
</script>

<div class="space-y-5">
	{#if daily.length > 0}
		<div class="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(23,22,30,0.05)]">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<div>
					<h3 class="text-sm font-bold text-[#17161E]">Daily API Volume (Recent 14 Days)</h3>
					<p class="text-xs text-gray-500">Request throughput and average gateway latency across all keys.</p>
				</div>
				<span class="rounded-full bg-[#513BE2]/10 px-3 py-1 text-[11px] font-semibold text-[#513BE2]">
					{recentDaily.reduce((acc, d) => acc + Number(d.requests || 0), 0)} total calls
				</span>
			</div>

			<!-- Visual Volume Bars -->
			<div class="mt-4 flex h-24 items-end gap-1.5 rounded-2xl border border-gray-100 bg-gray-50/70 px-3 pt-4 pb-2">
				{#each recentDaily as d}
					{@const pct = Math.max(8, Math.round((Number(d.requests || 0) / maxDailyRequests) * 100))}
					<div class="group relative flex flex-1 flex-col items-center justify-end h-full" title="{d.date}: {d.requests} calls · {d.errors} errors · {d.avgDurationMs}ms">
						<div
							class="w-full max-w-[26px] rounded-t-lg transition-all {Number(d.errors || 0) > 0 ? 'bg-gradient-to-t from-[#513BE2] to-rose-400' : 'bg-gradient-to-t from-[#513BE2] to-[#7C3AED]'} group-hover:brightness-110"
							style="height: {pct}%"
						></div>
					</div>
				{/each}
			</div>

			<div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
				{#each daily.slice(-5) as d}
					<div class="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5 text-xs">
						<p class="font-medium text-gray-500">{d.date}</p>
						<p class="mt-0.5 font-bold text-[#17161E] tabular-nums">{d.requests} calls</p>
						<p class="text-[11px] text-gray-500">{d.errors} errs · {d.avgDurationMs}ms</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(23,22,30,0.05)]">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<h3 class="text-sm font-bold text-[#17161E]">Recent API Request Logs</h3>
				<p class="text-xs text-gray-500">Live trace of requests authenticated with your API or SDK keys.</p>
			</div>
			<div class="flex items-center gap-2">
				<a
					href="/api-docs#console"
					class="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
				>
					<Icon icon="solar:terminal-linear" class="h-3.5 w-3.5 text-[#513BE2]" />
					Try in Console
				</a>
				<button
					type="button"
					disabled={loading}
					on:click={loadUsage}
					class="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
				>
					<Icon icon="solar:refresh-linear" class="h-3.5 w-3.5 {loading ? 'animate-spin' : ''}" />
					Refresh
				</button>
			</div>
		</div>

		{#if loading}
			<div class="mt-4 h-36 animate-pulse rounded-2xl bg-gray-100"></div>
		{:else if logs.length === 0}
			<div class="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
				<p class="text-sm font-semibold text-gray-700">No API requests logged yet</p>
				<p class="mt-1 text-xs text-gray-500">Send a test request from the Interactive API Console or mount a Web SDK to inspect live logs here.</p>
			</div>
		{:else}
			<div class="mt-4 overflow-x-auto rounded-2xl border border-gray-200/80">
				<table class="w-full text-left text-xs">
					<thead class="bg-gray-50/90 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
						<tr>
							<th class="px-4 py-3">Method</th>
							<th class="px-4 py-3">Endpoint Path</th>
							<th class="px-4 py-3">Status</th>
							<th class="px-4 py-3">Latency</th>
							<th class="px-4 py-3">Timestamp</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100 bg-white">
						{#each logs as log}
							<tr class="transition hover:bg-gray-50/70">
								<td class="px-4 py-3">
									<span class="rounded-md px-2 py-0.5 font-mono text-[10px] font-bold {methodBadge(log.method)}">
										{log.method}
									</span>
								</td>
								<td class="px-4 py-3 font-mono text-xs text-[#17161E]">{log.path}</td>
								<td class="px-4 py-3">
									<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold {log.statusCode < 400 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">
										<span class="h-1.5 w-1.5 rounded-full {log.statusCode < 400 ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
										{log.statusCode}
									</span>
								</td>
								<td class="px-4 py-3 font-mono text-gray-600 tabular-nums">{log.durationMs}ms</td>
								<td class="px-4 py-3 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
