<script lang="ts">
	import { onMount } from 'svelte';
	import { listApiLogs, getApiUsage } from '$lib/services/developer.services';

	let logs: any[] = [];
	let daily: any[] = [];
	let loading = true;

	onMount(async () => {
		try {
			const [logsRes, usageRes] = await Promise.all([listApiLogs({ limit: 30 }), getApiUsage()]);
			logs = logsRes?.data || [];
			daily = usageRes?.daily || [];
		} catch {
			/* ignore */
		} finally {
			loading = false;
		}
	});
</script>

<div class="space-y-5">
	<div class="rounded-xl border border-gray-200 bg-white p-4">
		<h3 class="text-sm font-semibold text-gray-900">Recent API Request Logs</h3>
		{#if loading}
			<div class="mt-3 h-28 animate-pulse rounded bg-gray-100"></div>
		{:else if logs.length === 0}
			<p class="mt-2 text-xs text-gray-500">No API requests logged yet.</p>
		{:else}
			<div class="mt-3 overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead>
						<tr class="border-b text-gray-500">
							<th class="py-2 pr-3">Method</th>
							<th class="py-2 pr-3">Path</th>
							<th class="py-2 pr-3">Status</th>
							<th class="py-2 pr-3">Latency</th>
							<th class="py-2">Time</th>
						</tr>
					</thead>
					<tbody>
						{#each logs as log}
							<tr class="border-b border-gray-100">
								<td class="py-2 pr-3 font-mono font-semibold">{log.method}</td>
								<td class="py-2 pr-3 font-mono">{log.path}</td>
								<td class="py-2 pr-3">
									<span class="rounded px-1.5 py-0.5 font-semibold {log.statusCode < 400 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
										{log.statusCode}
									</span>
								</td>
								<td class="py-2 pr-3">{log.durationMs}ms</td>
								<td class="py-2 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	{#if daily.length > 0}
		<div class="rounded-xl border border-gray-200 bg-white p-4">
			<h3 class="text-sm font-semibold text-gray-900">Daily API Volume (Last 30 Days)</h3>
			<div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
				{#each daily.slice(-10) as d}
					<div class="rounded-lg bg-gray-50 p-2.5 text-xs">
						<p class="text-gray-500">{d.date}</p>
						<p class="mt-0.5 font-bold text-gray-900">{d.requests} calls</p>
						<p class="text-[11px] text-gray-500">{d.errors} errs · {d.avgDurationMs}ms</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
