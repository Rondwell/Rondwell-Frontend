<script lang="ts">
	import { onMount } from 'svelte';

	type Tx = {
		date: string;
		time?: string;
		type: string;
		id: string;
		amount: number;
		status: 'Completed' | 'Failed' | 'Pending';
	};

	let transactions: Tx[] = [];
	let page = 1;
	let perPage = 3;

	// Dummy data 
	onMount(() => {
		transactions = Array.from({ length: 48 }).map((_, i) => ({
			date: 'Sat, Sep 14',
			time: '08:30 PM',
			type: 'Refund',
			id: (1828198 + i).toString(),
			amount: 1250000,
			status: i % 3 === 1 ? 'Completed' : i % 3 === 2 ? 'Pending' : 'Failed'
		}));
	});

	$: totalPages = Math.max(1, Math.ceil(transactions.length / perPage));

	function formatCurrency(n: number) {
		return 'N' + n.toLocaleString();
	}

	function statusClasses(s: Tx['status']) {
		if (s === 'Completed') return 'bg-green-100 text-green-700';
		if (s === 'Failed') return 'bg-rose-100 text-rose-700';
		return 'bg-amber-100 text-amber-700';
	}

	function exportCSV() {
		const header = ['Date', 'Time', 'Type', 'Transaction ID', 'Amount', 'Status'];
		const rows = transactions.map(t => [t.date, t.time, t.type, t.id, t.amount, t.status]);
		const csv = [header, ...rows].map(r => r.join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'transactions.csv';
		a.click();
		URL.revokeObjectURL(url);
	}

	$: paged = transactions.slice((page - 1) * perPage, page * perPage);

	let visiblePages: (number | 'more')[] = [];

	$: visiblePages = totalPages <= 7
		? Array.from({ length: totalPages }, (_, i) => i + 1)
		: [...Array.from({ length: 5 }, (_, i) => i + 1), 'more', totalPages];
</script>

<div class="p-0 m-0">
	<div class="flex items-start justify-between mb-6">
		<div>
			<h2 class="text-2xl font-semibold flex items-center gap-2">
				Financials
				<span class="inline-flex items-center justify-center w-5 h-5 rounded-full text-black text-xs border border-gray-600">1</span>
			</h2>
			<p class="text-[12px] text-slate-500">Manage your earnings, payouts, and transaction history</p>
		</div>

		<div class="flex items-center gap-3">
			<button on:click={exportCSV} class="px-3 py-2 bg-gray-300 border rounded-md text-[10px] flex items-center gap-2">
				<!-- download icon -->
				<img src="/export-icon.svg" alt="Download" class="w-4 h-4" />
				Export to CSV
			</button>

			<button class="px-3 py-2 border rounded-md text-[10px] text-gray-500 bg-white flex items-center gap-2">
				<span>Transaction Type</span>
				<!-- chevron down icon -->
				<img src="/arrow-dropdown.svg" alt="Chevron Down" class="w-4 h-4" />
			</button>

			<button class="px-3 py-2 border rounded-md text-[10px] text-gray-500 bg-white flex items-center gap-2">
				<span>From - To</span>
				<img src="/arrow-dropdown.svg" alt="Dropdown" class="w-4 h-4" />
			</button>
		</div>
	</div>

	<!-- summary cards -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-1">
			<div class="p-2 border rounded-lg flex items-center gap-1">
				<div class="p-1 bg-slate-100 rounded-md">
					<img src="/Group 35310.svg" alt="Available for Payout" class="w-10 h-10 text-slate-700" />
				</div>
			<div>
				<div class="text-lg font-semibold">{formatCurrency(1250000)}</div>
				<div class="text-sm text-slate-500">Available for payout</div>
			</div>
		</div>

		<div class="p-2 border rounded-lg flex items-center gap-1">
			<div class="p-1 bg-violet-50 rounded-md">
				<img src="/send-icon.svg" alt="Pending Payout" class="w-10 h-10 text-violet-700" />
			</div>
			<div>
				<div class="text-lg font-semibold">{formatCurrency(1250000)}</div>
				<div class="text-sm text-slate-500">Pending payout</div>
			</div>
		</div>

		<div class="p-2 border rounded-lg flex items-center gap-1">
			<div class="p-1 bg-slate-100 rounded-md">
				<img src="/connect.svg" alt="Total Payout" class="w-10 h-10 text-slate-700" />
			</div>
			<div>
				<div class="text-lg font-semibold">{formatCurrency(1250000)}</div>
				<div class="text-sm text-slate-500">Total payout to date</div>
			</div>
		</div>
	</div>

	<!-- tabs -->
	<div class="mb-4">
		<div class="flex gap-1 items-center bg-gray-100 p-1 rounded-md">
			<button class="pb-2 text-slate-900 bg-white px-4 py-2 rounded">Transaction History</button>
			<button class="pb-2 text-slate-500 px-4 py-2 rounded hover:bg-gray-200">Payout History</button>
		</div>
	</div>

	<!-- table -->
	<div class="overflow-x-auto bg-white border rounded-md p-4">
		<table class="min-w-full text-left">
			<thead class="text-sm text-slate-500">
			</thead>
			<tbody>
				{#each paged as t}
					<tr class="border-t">
						<td class="py-4 text-sm">
							<div class="text-slate-800">{t.date} · {t.time}</div>
						</td>
						<td class="py-4 text-sm">{t.type}</td>
						<td class="py-4 text-sm">{t.id}</td>
						<td class="py-4 text-sm">{formatCurrency(t.amount)}</td>
						<td class="py-4 text-sm">
							<span class={`px-3 py-1 rounded-full text-xs font-medium ${statusClasses(t.status)}`}>{t.status}</span>
						</td>
						<td class="py-4 text-right">
							<div class="flex items-center justify-end gap-2">
								<button class="text-sm px-3 py-2 border rounded-md">View Details</button>
								<button aria-label="More options" class="p-2 rounded-full hover:bg-slate-100">
									<img src="/more-square.svg" alt="More" class="w-4 h-4" />
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- pagination -->
	<div class="mt-6 flex items-center justify-between">
		<div class="text-sm text-slate-500 flex items-center h-8">Page {page} of {totalPages}</div>
		<div class="flex items-center gap-2 h-8">
			{#each visiblePages as p}
				{#if p === 'more'}
					<button class="inline-flex items-center justify-center h-8 w-8 rounded border bg-white" aria-label="More pages" on:click={() => page = Math.min(totalPages, page + 5)}>
						<img src="/more-square.svg" alt="More pages" class="w-4 h-4" />
					</button>
				{:else}
					<button class={`inline-flex items-center justify-center h-8 px-3 rounded ${page === p ? 'bg-gray-100 text-black' : 'border'}`} on:click={() => page = p}>{p}</button>
				{/if}
			{/each}
		</div>
		<div class="flex items-center gap-2 h-8 text-sm">
			<div class="leading-none">{page}/page</div>
			<img src="/arrow.svg" alt="" class="w-4 h-4" />
		</div>
	</div>
</div>

<style>
	/* keep tiny custom tweaks here if needed */
</style>

