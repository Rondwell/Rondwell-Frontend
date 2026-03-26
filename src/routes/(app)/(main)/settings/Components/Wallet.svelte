<script lang="ts">
	import { goto } from '$app/navigation';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';

	// Balances
	let totalBalance = 340000;
	let withdrawableBalance = 285000;

	// Bank accounts
	let bankAccounts: { id: string; bankName: string; accountNumber: string; accountName: string }[] = [
		{ id: '1', bankName: 'Access Bank', accountNumber: '0123456789', accountName: 'John Doe' },
	];

	// Withdrawal modal
	let showWithdrawModal = false;
	let showAddBankModal = false;
	let selectedBankId = bankAccounts[0]?.id ?? '';
	let withdrawAmount = '';
	let withdrawing = false;
	let withdrawError = '';
	let withdrawSuccess = '';

	// Add bank form
	let newBankName = '';
	let newAccountNumber = '';
	let newAccountName = '';
	let addingBank = false;

	// Earnings table
	let showDateFilter = false;
	let dateFilter = 'All Time';
	const dateOptions = ['All Time', 'This Week', 'This Month', 'This Year'];

	let eventEarnings = [
		{ id: '1', name: 'Megaexe Party 3', type: 'Event', date: '2026-03-25T14:30:00Z', status: 'COMPLETED', amount: 200000, eventId: '69c0429efea038864ed347ee' },
		{ id: '2', name: 'Tech Summit 2026', type: 'Event', date: '2026-03-20T10:00:00Z', status: 'COMPLETED', amount: 85000, eventId: 'abc123' },
		{ id: '3', name: 'John Collection', type: 'Collection', date: '2026-03-18T09:00:00Z', status: 'PENDING', amount: 55000, eventId: '' },
	];

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function formatTime(dateStr: string): string {
		return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
	}

	function getStatusStyle(status: string): string {
		return status === 'COMPLETED' ? 'bg-green-100 text-green-700' : status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700';
	}

	function handleWithdraw() {
		const amount = parseInt(withdrawAmount);
		if (!amount || amount <= 0) { withdrawError = 'Enter a valid amount'; return; }
		if (amount > withdrawableBalance) { withdrawError = 'Amount exceeds withdrawable balance'; return; }
		if (!selectedBankId) { withdrawError = 'Select a bank account'; return; }
		withdrawing = true; withdrawError = '';
		setTimeout(() => {
			withdrawableBalance -= amount;
			withdrawSuccess = `${formatCurrency(amount)} withdrawal initiated successfully`;
			withdrawAmount = '';
			withdrawing = false;
			setTimeout(() => { showWithdrawModal = false; withdrawSuccess = ''; }, 2000);
		}, 1500);
	}

	function handleAddBank() {
		if (!newBankName.trim() || !newAccountNumber.trim() || !newAccountName.trim()) return;
		addingBank = true;
		setTimeout(() => {
			const newId = String(Date.now());
			bankAccounts = [...bankAccounts, { id: newId, bankName: newBankName, accountNumber: newAccountNumber, accountName: newAccountName }];
			newBankName = ''; newAccountNumber = ''; newAccountName = '';
			addingBank = false; showAddBankModal = false;
		}, 800);
	}

	function deleteBank(id: string) {
		if (!confirm('Remove this bank account?')) return;
		bankAccounts = bankAccounts.filter(b => b.id !== id);
		if (selectedBankId === id) selectedBankId = bankAccounts[0]?.id ?? '';
	}
</script>

<div class="mb-12">
	<!-- Balance Cards -->
	<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
		<div class="rounded-xl border bg-white p-6">
			<p class="text-xs text-gray-500">Total Balance</p>
			<p class="mt-1 text-3xl font-semibold">{formatCurrency(totalBalance)}</p>
			<p class="mt-2 text-xs text-gray-400">Across all events and collections</p>
		</div>
		<div class="rounded-xl border bg-white p-6">
			<div class="flex items-start justify-between">
				<div>
					<p class="text-xs text-gray-500">Withdrawable Balance</p>
					<p class="mt-1 text-3xl font-semibold text-green-600">{formatCurrency(withdrawableBalance)}</p>
					<p class="mt-2 text-xs text-gray-400">Available for withdrawal</p>
				</div>
				<button on:click={() => (showWithdrawModal = true)} class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
					Withdraw
				</button>
			</div>
		</div>
	</div>

	<!-- Bank Accounts -->
	<div class="mb-8 border-t pt-8">
		<div class="mb-4 flex items-center justify-between">
			<div>
				<h2 class="text-lg font-semibold">Bank Accounts</h2>
				<p class="text-sm text-[#8C8F93]">Manage your withdrawal bank accounts.</p>
			</div>
			<button on:click={() => (showAddBankModal = true)} class="flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800">
				<Icon icon="mdi:plus" class="text-base" /> Add Account
			</button>
		</div>

		{#if bankAccounts.length > 0}
			<div class="space-y-3">
				{#each bankAccounts as bank}
					<div class="flex items-center justify-between rounded-lg border bg-white p-4">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E2E8FC]">
								<Icon icon="mdi:bank" class="text-xl text-[#146AEB]" />
							</div>
							<div>
								<p class="text-sm font-medium">{bank.bankName}</p>
								<p class="text-xs text-gray-400">{bank.accountNumber} · {bank.accountName}</p>
							</div>
						</div>
						<button on:click={() => deleteBank(bank.id)} class="text-gray-400 hover:text-red-500">
							<Icon icon="mdi:trash-can-outline" class="text-lg" />
						</button>
					</div>
				{/each}
			</div>
		{:else}
			<div class="flex h-32 flex-col items-center justify-center rounded-lg border bg-white">
				<Icon icon="mdi:bank-off" class="mb-1 text-2xl text-gray-300" />
				<p class="text-sm text-gray-400">No bank accounts added yet.</p>
			</div>
		{/if}
	</div>

	<!-- Earnings by Event/Collection -->
	<div class="border-t pt-8">
		<div class="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
			<div>
				<h2 class="text-lg font-semibold">Earnings Overview</h2>
				<p class="text-sm text-[#8C8F93]">Revenue from all your events and collections.</p>
			</div>
			<div class="flex items-center gap-2">
				<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]"><img src="/download-icon.svg" alt="download" /></div>
				<div use:clickOutside={() => (showDateFilter = false)} class="relative">
					<button on:click={() => (showDateFilter = !showDateFilter)} class="flex items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
						<Icon icon="mdi:calendar-outline" class="text-base" /> {dateFilter}
					</button>
					{#if showDateFilter}
						<div class="absolute right-0 z-10 mt-1 w-40 rounded-lg border bg-white shadow-lg">
							{#each dateOptions as opt}
								<button on:click={() => { dateFilter = opt; showDateFilter = false; }} class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 {dateFilter === opt ? 'font-medium text-pink-600' : ''}">{opt}</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>

		{#if eventEarnings.length > 0}
			<div class="overflow-visible rounded-xl bg-white shadow-sm">
				<div class="hidden border-b px-4 py-3 text-xs font-medium text-gray-400 lg:flex">
					<div class="w-1/4">Event / Collection</div>
					<div class="w-1/6">Date</div>
					<div class="w-1/6">Time</div>
					<div class="w-1/6">Status</div>
					<div class="w-1/6 text-right">Amount Earned</div>
					<div class="w-1/6 text-right">Action</div>
				</div>
				{#each eventEarnings as e}
					<div class="flex flex-col gap-2 border-b px-4 py-3 last:border-none lg:flex-row lg:items-center lg:gap-0">
						<div class="flex items-center gap-3 lg:w-1/4">
							<div class="flex h-8 w-8 items-center justify-center rounded-lg {e.type === 'Event' ? 'bg-[#F2E4F8]' : 'bg-[#E2E8FC]'}">
								<Icon icon={e.type === 'Event' ? 'mdi:calendar-star' : 'mdi:folder-multiple'} class="text-base {e.type === 'Event' ? 'text-[#AB46DD]' : 'text-[#146AEB]'}" />
							</div>
							<div>
								<p class="text-sm font-medium">{e.name}</p>
								<p class="text-xs text-gray-400">{e.type}</p>
							</div>
						</div>
						<div class="text-sm text-gray-500 lg:w-1/6">{formatDate(e.date)}</div>
						<div class="text-sm text-gray-500 lg:w-1/6">{formatTime(e.date)}</div>
						<div class="lg:w-1/6">
							<span class="rounded-full px-2 py-1 text-xs font-medium {getStatusStyle(e.status)}">{e.status.charAt(0) + e.status.slice(1).toLowerCase()}</span>
						</div>
						<div class="text-sm font-medium lg:w-1/6 lg:text-right">{formatCurrency(e.amount)}</div>
						<div class="lg:w-1/6 lg:text-right">
							{#if e.eventId}
								<button on:click={() => goto(`/events/${e.eventId}/earnings`)} class="rounded-md bg-[#EBECED] px-3 py-1.5 text-xs font-medium text-[#616265] hover:bg-gray-200">
									View
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="flex h-60 flex-col items-center justify-center rounded-xl bg-white">
				<Icon icon="mdi:cash-off" class="mb-2 text-4xl text-gray-300" />
				<p class="text-lg font-medium text-[#A2ACB2]">No earnings yet</p>
				<p class="mt-1 text-sm text-gray-400">Revenue from your events will appear here.</p>
			</div>
		{/if}
	</div>
</div>

<!-- Withdraw Modal -->
{#if showWithdrawModal}
<div on:click={() => (showWithdrawModal = false)} on:keydown={(e) => e.key === 'Escape' && (showWithdrawModal = false)} class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3" role="dialog" aria-modal="true" tabindex="-1">
<div class="w-full max-w-md overflow-hidden rounded-xl bg-[#F4F5F6] shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
	<div class="px-6 py-6">
		<div class="mb-1 flex items-center justify-between">
			<h2 class="text-xl font-semibold">Withdraw Funds</h2>
			<button on:click={() => (showWithdrawModal = false)}><Icon icon="mdi:close" class="text-xl text-gray-400" /></button>
		</div>
		<p class="mb-5 text-sm text-gray-500">Available: {formatCurrency(withdrawableBalance)}</p>

		{#if withdrawError}<p class="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-600">{withdrawError}</p>{/if}
		{#if withdrawSuccess}<p class="mb-3 rounded-md bg-green-50 p-3 text-sm text-green-600">{withdrawSuccess}</p>{/if}

		<!-- Select Bank -->
		<div class="mb-4">
			<label class="mb-1 block text-sm font-medium text-gray-700">Bank Account</label>
			{#if bankAccounts.length > 0}
				<select bind:value={selectedBankId} class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none">
					{#each bankAccounts as bank}
						<option value={bank.id}>{bank.bankName} · {bank.accountNumber}</option>
					{/each}
				</select>
			{:else}
				<p class="text-sm text-gray-400">No bank accounts. <button on:click={() => { showWithdrawModal = false; showAddBankModal = true; }} class="font-medium text-pink-600">Add one</button></p>
			{/if}
		</div>

		<!-- Amount -->
		<div class="mb-5">
			<label class="mb-1 block text-sm font-medium text-gray-700">Amount</label>
			<input type="number" bind:value={withdrawAmount} placeholder="Enter amount" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none" />
		</div>

		<button on:click={handleWithdraw} disabled={withdrawing || bankAccounts.length === 0} class="w-full rounded-lg bg-gray-900 py-3 text-center font-medium text-white disabled:opacity-50">
			{withdrawing ? 'Processing...' : 'Withdraw'}
		</button>
	</div>
</div>
</div>
{/if}

<!-- Add Bank Modal -->
{#if showAddBankModal}
<div on:click={() => (showAddBankModal = false)} on:keydown={(e) => e.key === 'Escape' && (showAddBankModal = false)} class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3" role="dialog" aria-modal="true" tabindex="-1">
<div class="w-full max-w-md overflow-hidden rounded-xl bg-[#F4F5F6] shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
	<div class="px-6 py-6">
		<div class="mb-5 flex items-center justify-between">
			<h2 class="text-xl font-semibold">Add Bank Account</h2>
			<button on:click={() => (showAddBankModal = false)}><Icon icon="mdi:close" class="text-xl text-gray-400" /></button>
		</div>

		<div class="mb-4">
			<label class="mb-1 block text-sm font-medium text-gray-700">Bank Name</label>
			<input type="text" bind:value={newBankName} placeholder="e.g., Access Bank" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none" />
		</div>
		<div class="mb-4">
			<label class="mb-1 block text-sm font-medium text-gray-700">Account Number</label>
			<input type="text" bind:value={newAccountNumber} placeholder="0123456789" maxlength="10" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none" />
		</div>
		<div class="mb-5">
			<label class="mb-1 block text-sm font-medium text-gray-700">Account Name</label>
			<input type="text" bind:value={newAccountName} placeholder="John Doe" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none" />
		</div>

		<button on:click={handleAddBank} disabled={addingBank || !newBankName.trim() || !newAccountNumber.trim() || !newAccountName.trim()} class="w-full rounded-lg bg-gray-900 py-3 text-center font-medium text-white disabled:opacity-50">
			{addingBank ? 'Adding...' : 'Add Bank Account'}
		</button>
	</div>
</div>
</div>
{/if}
