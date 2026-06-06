<!--
	FE-P4-06 (P4-06) — Recent ops alerts.
-->
<script lang="ts">
	import { acknowledgeAlert, listOpsAlerts, type OpsAlert } from '$lib/services/slo.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let alerts: OpsAlert[] = [];
	let loading = true;
	let error = '';
	let nextCursor: string | null = null;
	let loadingMore = false;
	let severityFilter: OpsAlert['severity'] | '' = '';
	let showResolved = false;
	let acking = '';

	onMount(load);

	async function load(reset = true) {
		if (reset) {
			loading = true;
			alerts = [];
			nextCursor = null;
		} else {
			loadingMore = true;
		}
		error = '';
		try {
			const result = await listOpsAlerts({
				severity: severityFilter || undefined,
				resolved: showResolved ? undefined : false,
				cursor: reset ? null : nextCursor,
				limit: 30,
			});
			alerts = reset ? result.items : [...alerts, ...result.items];
			nextCursor = result.nextCursor;
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			loading = false;
			loadingMore = false;
		}
	}

	async function ack(a: OpsAlert) {
		acking = a.id;
		try {
			await acknowledgeAlert(a.id);
			alerts = alerts.map((x) =>
				x.id === a.id ? { ...x, acknowledgedAt: new Date().toISOString() } : x
			);
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			acking = '';
		}
	}

	function severityColor(s: OpsAlert['severity']): string {
		if (s === 'CRITICAL') return 'bg-red-100 text-red-700';
		if (s === 'HIGH') return 'bg-orange-100 text-orange-700';
		if (s === 'MEDIUM') return 'bg-yellow-100 text-yellow-700';
		return 'bg-gray-100 text-gray-600';
	}

	function fmtDate(iso?: string | null): string {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleString();
		} catch {
			return iso;
		}
	}
</script>

<svelte:head><title>Alerts — Rondwell HQ</title></svelte:head>

<div>
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold text-gray-900">Operational alerts</h1>
			<p class="mt-1 text-sm text-gray-500">
				Synthetic + real-time alerts for the money paths (webhook signature failures, stuck
				transactions, drift, withdrawal failure rate, dunning, AML).
			</p>
		</div>
	</div>

	<div class="mt-4 flex flex-wrap items-center gap-3 text-xs">
		<label class="flex items-center gap-2">
			<span class="text-gray-500">Severity</span>
			<select
				bind:value={severityFilter}
				on:change={() => load(true)}
				class="rounded-md border border-gray-200 bg-white px-2 py-1"
			>
				<option value="">All</option>
				<option value="CRITICAL">Critical</option>
				<option value="HIGH">High</option>
				<option value="MEDIUM">Medium</option>
				<option value="LOW">Low</option>
			</select>
		</label>
		<label class="flex items-center gap-2">
			<input
				type="checkbox"
				bind:checked={showResolved}
				on:change={() => load(true)}
			/>
			<span class="text-gray-600">Include resolved</span>
		</label>
	</div>

	{#if error}
		<p class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{/if}

	{#if loading}
		<div class="mt-6 space-y-2">
			{#each [1, 2, 3] as _}
				<div class="h-20 animate-pulse rounded-lg bg-white"></div>
			{/each}
		</div>
	{:else if alerts.length === 0}
		<div class="mt-8 flex h-60 flex-col items-center justify-center rounded-xl bg-white">
			<Icon icon="mdi:bell-check" class="mb-2 text-4xl text-green-400" />
			<p class="text-lg font-medium text-gray-700">No alerts</p>
			<p class="mt-1 text-sm text-gray-400">All systems quiet.</p>
		</div>
	{:else}
		<div class="mt-6 space-y-3">
			{#each alerts as a}
				<div class="rounded-xl border bg-white p-4">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<div class="flex items-center gap-2">
								<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {severityColor(a.severity)}">
									{a.severity}
								</span>
								<span class="text-xs text-gray-400">{a.source}</span>
							</div>
							<p class="mt-1 text-sm font-semibold text-gray-900">{a.title}</p>
							<p class="mt-0.5 text-xs text-gray-600">{a.body}</p>
							<p class="mt-1 text-xs text-gray-400">Opened {fmtDate(a.openedAt)}</p>
						</div>
						<div class="flex flex-col items-end gap-2">
							{#if a.resolvedAt}
								<span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
									Resolved {fmtDate(a.resolvedAt)}
								</span>
							{:else if a.acknowledgedAt}
								<span class="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
									Acked {fmtDate(a.acknowledgedAt)}
								</span>
							{:else}
								<button
									on:click={() => ack(a)}
									disabled={acking === a.id}
									class="rounded-md bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
								>
									{acking === a.id ? 'Acking…' : 'Acknowledge'}
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>

		{#if nextCursor}
			<div class="mt-4 flex justify-center">
				<button
					on:click={() => load(false)}
					disabled={loadingMore}
					class="rounded-md border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
				>
					{loadingMore ? 'Loading…' : 'Load more'}
				</button>
			</div>
		{/if}
	{/if}
</div>
