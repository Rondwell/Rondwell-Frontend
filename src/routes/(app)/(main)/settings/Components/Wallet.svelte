<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		addBankAccount,
		getBankAccounts,
		getBankList,
		getEarningsSummary,
		getWalletBalance,
		removeBankAccount,
		requestWithdrawalOtp,
		resolveBankAccount,
		verifyWithdrawalOtp,
	} from '$lib/services/wallet.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	// Balances
	let totalBalance = 0;
	let withdrawableBalance = 0;
	let loadingBalance = true;

	// Bank accounts
	let bankAccounts: { id: string; bankName: string; accountNumber: string; accountName: string }[] = [];
	let loadingBanks = true;

	// Withdrawal modal
	let showWithdrawModal = false;
	let showAddBankModal = false;
	let selectedBankId = '';
	let withdrawAmount = '';
	let withdrawOtp = '';
	let otpSent = false;
	let sendingOtp = false;
	let withdrawing = false;
	let withdrawError = '';
	let withdrawSuccess = '';

	// Add bank form
	let banks: { name: string; code: string }[] = [];
	let bankSearchQuery = '';
	let showBankDropdown = false;
	let selectedBank: { name: string; code: string } | null = null;
	let newAccountNumber = '';
	let newAccountName = '';
	let resolvingAccount = false;
	let resolveError = '';
	let addingBank = false;
	let addBankError = '';

	// Earnings table
	let showDateFilter = false;
	let dateFilter = 'All Time';
	const dateOptions = ['All Time', 'This Week', 'This Month', 'This Year'];

	let eventEarnings: any[] = [];
	let loadingEarnings = true;

	$: filteredBanks = bankSearchQuery
		? banks.filter((b) => b.name.toLowerCase().includes(bankSearchQuery.toLowerCase()))
		: banks;

	onMount(async () => {
		await Promise.all([loadWalletBalance(), loadBankAccounts(), loadBankList(), loadEarnings()]);
	});

	async function loadWalletBalance() {
		loadingBalance = true;
		try {
			const wallet = await getWalletBalance();
			const agg = wallet?.aggregatedBalance;
			if (agg) {
				totalBalance = agg.totalEarnings ?? 0;
				withdrawableBalance = agg.withdrawable ?? 0;
			} else {
				const ngnBalance = wallet?.balance?.NGN ?? 0;
				totalBalance = ngnBalance > 100000 ? ngnBalance / 100 : ngnBalance;
				withdrawableBalance = totalBalance;
			}
		} catch (e: any) {
			console.error('Failed to load wallet balance:', e);
		} finally {
			loadingBalance = false;
		}
	}

	async function loadBankAccounts() {
		loadingBanks = true;
		try {
			const result: any = await getBankAccounts();
			const items = Array.isArray(result) ? result : result?.items ?? result?.data?.items ?? result?.data ?? [];
			bankAccounts = items.map((b: any) => ({
				id: b.id ?? b._id,
				bankName: b.bankName,
				accountNumber: b.accountNumber,
				accountName: b.accountName
			}));
			if (bankAccounts.length > 0 && !selectedBankId) {
				selectedBankId = bankAccounts[0].id;
			}
		} catch (e: any) {
			console.error('Failed to load bank accounts:', e);
		} finally {
			loadingBanks = false;
		}
	}

	async function loadBankList() {
		try {
			const result: any = await getBankList();
			const items = Array.isArray(result) ? result : result?.data ?? [];
			banks = items.map((b: any) => ({ name: b.name ?? b.bankName, code: b.code ?? b.bankCode }));
		} catch (e: any) {
			console.error('Failed to load bank list:', e);
		}
	}

	async function loadEarnings() {
		loadingEarnings = true;
		try {
			const result = await getEarningsSummary();
			const items = Array.isArray(result) ? result : [];
			// Enrich event names from the event service for items without names
			const { getEventById } = await import('$lib/services/event.services');
			for (const item of items) {
				if (!item.name && item.eventId) {
					try {
						const event = await getEventById(item.eventId);
						item.name = event?.title ?? '';
					} catch { /* non-critical */ }
				}
			}
			eventEarnings = items;
		} catch (e: any) {
			console.error('Failed to load earnings:', e);
		} finally {
			loadingEarnings = false;
		}
	}

	function koboToNaira(amount: number): number {
		return amount / 100;
	}

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
		if (status === 'COMPLETED') return 'bg-green-100 text-green-700';
		if (status === 'PENDING') return 'bg-yellow-100 text-yellow-700';
		if (status === 'PARTIAL') return 'bg-blue-100 text-blue-700';
		if (status === 'FAILED') return 'bg-red-100 text-red-700';
		return 'bg-gray-100 text-gray-700';
	}

	async function handleRequestOtp() {
		const amount = parseInt(withdrawAmount);
		if (!amount || amount <= 0) { withdrawError = 'Enter a valid amount'; return; }
		if (amount > withdrawableBalance) { withdrawError = 'Amount exceeds withdrawable balance'; return; }
		if (!selectedBankId) { withdrawError = 'Select a bank account'; return; }

		sendingOtp = true;
		withdrawError = '';
		try {
			await requestWithdrawalOtp(amount);
			otpSent = true;
		} catch (e: any) {
			withdrawError = e.message ?? 'Failed to send OTP';
		} finally {
			sendingOtp = false;
		}
	}

	async function handleWithdraw() {
		const amount = parseInt(withdrawAmount);
		if (!withdrawOtp || withdrawOtp.length !== 6) { withdrawError = 'Enter the 6-digit OTP'; return; }

		withdrawing = true;
		withdrawError = '';
		try {
			await verifyWithdrawalOtp(withdrawOtp, amount, 'NGN', selectedBankId);
			withdrawSuccess = `${formatCurrency(amount)} withdrawal initiated successfully`;
			withdrawAmount = '';
			withdrawOtp = '';
			otpSent = false;
			// Refresh balance and earnings after successful withdrawal
			await Promise.all([loadWalletBalance(), loadEarnings()]);
			setTimeout(() => { showWithdrawModal = false; withdrawSuccess = ''; }, 2000);
		} catch (e: any) {
			withdrawError = e.message ?? 'Withdrawal failed';
		} finally {
			withdrawing = false;
		}
	}

	async function handleResolveAccount() {
		if (newAccountNumber.length !== 10 || !selectedBank) return;
		resolvingAccount = true;
		resolveError = '';
		newAccountName = '';
		try {
			const result = await resolveBankAccount(newAccountNumber, selectedBank.code);
			newAccountName = result?.accountName ?? result?.account_name ?? '';
			if (!newAccountName) resolveError = 'Could not resolve account name';
		} catch (e: any) {
			resolveError = e.message ?? 'Failed to resolve account';
		} finally {
			resolvingAccount = false;
		}
	}

	function selectBank(bank: { name: string; code: string }) {
		selectedBank = bank;
		bankSearchQuery = bank.name;
		showBankDropdown = false;
		if (newAccountNumber.length === 10) handleResolveAccount();
	}

	function onAccountNumberInput() {
		if (newAccountNumber.length === 10 && selectedBank) {
			handleResolveAccount();
		}
	}

	async function handleAddBank() {
		if (!selectedBank || !newAccountNumber.trim() || !newAccountName.trim()) return;
		addingBank = true;
		addBankError = '';
		try {
			await addBankAccount(newAccountNumber, selectedBank.code, selectedBank.name);
			await loadBankAccounts();
			selectedBank = null;
			bankSearchQuery = '';
			newAccountNumber = '';
			newAccountName = '';
			showAddBankModal = false;
		} catch (e: any) {
			addBankError = e.message ?? 'Failed to add bank account';
		} finally {
			addingBank = false;
		}
	}

	async function deleteBank(id: string) {
		if (!confirm('Remove this bank account?')) return;
		try {
			await removeBankAccount(id);
			bankAccounts = bankAccounts.filter((b) => b.id !== id);
			if (selectedBankId === id) selectedBankId = bankAccounts[0]?.id ?? '';
		} catch (e: any) {
			console.error('Failed to remove bank account:', e);
		}
	}
</script>

<div class="mb-12">
	<!-- Balance Cards -->
	<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
		<div class="rounded-xl border bg-white p-6">
			<p class="text-xs text-gray-500">Total Balance</p>
			{#if loadingBalance}
				<div class="mt-1 h-9 w-40 animate-pulse rounded bg-gray-200"></div>
			{:else}
				<p class="mt-1 text-3xl font-semibold">{formatCurrency(totalBalance)}</p>
			{/if}
			<p class="mt-2 text-xs text-gray-400">Across all events and collections</p>
		</div>
		<div class="rounded-xl border bg-white p-6">
			<div class="flex items-start justify-between">
				<div>
					<p class="text-xs text-gray-500">Withdrawable Balance</p>
					{#if loadingBalance}
						<div class="mt-1 h-9 w-40 animate-pulse rounded bg-gray-200"></div>
					{:else}
						<p class="mt-1 text-3xl font-semibold text-green-600">{formatCurrency(withdrawableBalance)}</p>
					{/if}
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

		{#if loadingBanks}
			<div class="space-y-3">
				{#each [1, 2] as _}
					<div class="flex animate-pulse items-center justify-between rounded-lg border bg-white p-4">
						<div class="flex items-center gap-3">
							<div class="h-10 w-10 rounded-lg bg-gray-200"></div>
							<div>
								<div class="h-4 w-24 rounded bg-gray-200"></div>
								<div class="mt-1 h-3 w-40 rounded bg-gray-200"></div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else if bankAccounts.length > 0}
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

		{#if loadingEarnings}
			<div class="space-y-3">
				{#each [1, 2, 3] as _}
					<div class="flex animate-pulse items-center gap-4 rounded-xl bg-white px-4 py-4">
						<div class="h-8 w-8 rounded-lg bg-gray-200"></div>
						<div class="h-4 w-32 rounded bg-gray-200"></div>
						<div class="h-4 w-20 rounded bg-gray-200"></div>
						<div class="h-4 w-16 rounded bg-gray-200"></div>
					</div>
				{/each}
			</div>
		{:else if eventEarnings.length > 0}
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
								<p class="text-sm font-medium truncate max-w-[180px]" title={e.name || 'Event'}>{e.name || 'Event'}</p>
								<p class="text-xs text-gray-400">{e.type}</p>
							</div>
						</div>
						<div class="text-sm text-gray-500 lg:w-1/6">{formatDate(e.date)}</div>
						<div class="text-sm text-gray-500 lg:w-1/6">{formatTime(e.date)}</div>
						<div class="lg:w-1/6">
							<span class="rounded-full px-2 py-1 text-xs font-medium {getStatusStyle(e.status)}">{e.status.charAt(0) + e.status.slice(1).toLowerCase()}</span>
						</div>
						<div class="text-sm font-medium lg:w-1/6 lg:text-right">{formatCurrency(e.netAmount ?? e.amount)}</div>
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
			<label for="withdraw-bank" class="mb-1 block text-sm font-medium text-gray-700">Bank Account</label>
			{#if bankAccounts.length > 0}
				<select id="withdraw-bank" bind:value={selectedBankId} class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none">
					{#each bankAccounts as bank}
						<option value={bank.id}>{bank.bankName} · {bank.accountNumber}</option>
					{/each}
				</select>
			{:else}
				<p class="text-sm text-gray-400">No bank accounts. <button on:click={() => { showWithdrawModal = false; showAddBankModal = true; }} class="font-medium text-pink-600">Add one</button></p>
			{/if}
		</div>

		<!-- Amount -->
		<div class="mb-4">
			<label for="withdraw-amount" class="mb-1 block text-sm font-medium text-gray-700">Amount</label>
			<input id="withdraw-amount" type="number" bind:value={withdrawAmount} placeholder="Enter amount" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none" />
		</div>

		<!-- Withdrawal Fee Breakdown -->
		{#if withdrawAmount && parseInt(withdrawAmount) > 0}
			{@const amt = parseInt(withdrawAmount)}
			{@const rawFee = amt * 0.03}
			{@const fee = Math.min(rawFee, 500)}
			{@const youReceive = amt - fee}
			<div class="mb-4 rounded-lg border border-gray-200 bg-white p-3 text-sm">
				<div class="flex justify-between text-gray-500">
					<span>Withdrawal Fee (3%, max ₦500)</span>
					<span class="text-red-500">-{formatCurrency(fee)}</span>
				</div>
				<div class="mt-1 flex justify-between border-t pt-1 font-medium">
					<span>You'll receive</span>
					<span class="text-green-600">{formatCurrency(youReceive > 0 ? youReceive : 0)}</span>
				</div>
			</div>
		{/if}

		<!-- PIN → OTP -->
		{#if !otpSent}
			<button on:click={handleRequestOtp} disabled={sendingOtp || bankAccounts.length === 0 || !withdrawAmount}
				class="w-full rounded-lg bg-gray-900 py-3 text-center font-medium text-white disabled:opacity-50">
				{sendingOtp ? 'Sending OTP...' : 'Send OTP to Email'}
			</button>
		{:else}
			<div class="mb-4">
				<label for="withdraw-otp" class="mb-1 block text-sm font-medium text-gray-700">Enter OTP</label>
				<p class="mb-2 text-xs text-gray-400">A 6-digit code was sent to your email</p>
				<input id="withdraw-otp" type="text" bind:value={withdrawOtp} placeholder="Enter 6-digit OTP" maxlength="6"
					class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-center text-lg font-mono tracking-widest focus:outline-none" />
			</div>
			<div class="flex gap-2">
				<button on:click={handleRequestOtp} disabled={sendingOtp}
					class="flex-1 rounded-lg border border-gray-200 py-3 text-center text-sm font-medium text-gray-600 disabled:opacity-50">
					{sendingOtp ? 'Resending...' : 'Resend OTP'}
				</button>
				<button on:click={handleWithdraw} disabled={withdrawing || withdrawOtp.length !== 6}
					class="flex-1 rounded-lg bg-gray-900 py-3 text-center font-medium text-white disabled:opacity-50">
					{withdrawing ? 'Processing...' : 'Confirm Withdrawal'}
				</button>
			</div>
		{/if}
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

		{#if addBankError}<p class="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-600">{addBankError}</p>{/if}

		<!-- Bank Name (searchable dropdown) -->
		<div class="mb-4">
			<label for="bank-search" class="mb-1 block text-sm font-medium text-gray-700">Bank Name</label>
			<div use:clickOutside={() => (showBankDropdown = false)} class="relative">
				<input
					id="bank-search"
					type="text"
					bind:value={bankSearchQuery}
					on:focus={() => (showBankDropdown = true)}
					on:input={() => { showBankDropdown = true; selectedBank = null; }}
					placeholder="Search for a bank..."
					class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none"
				/>
				{#if showBankDropdown && filteredBanks.length > 0}
					<div class="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
						{#each filteredBanks as bank}
							<button on:click={() => selectBank(bank)} class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50">{bank.name}</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Account Number -->
		<div class="mb-4">
			<label for="account-number" class="mb-1 block text-sm font-medium text-gray-700">Account Number</label>
			<input
				id="account-number"
				type="text"
				bind:value={newAccountNumber}
				on:input={onAccountNumberInput}
				placeholder="0123456789"
				maxlength="10"
				class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none"
			/>
		</div>

		<!-- Account Name (auto-resolved) -->
		<div class="mb-5">
			<label for="account-name" class="mb-1 block text-sm font-medium text-gray-700">Account Name</label>
			{#if resolvingAccount}
				<div class="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-400">
					<Icon icon="mdi:loading" class="animate-spin" /> Resolving...
				</div>
			{:else}
				<input
					id="account-name"
					type="text"
					bind:value={newAccountName}
					placeholder="Will auto-fill when account is resolved"
					readonly
					class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none"
				/>
			{/if}
			{#if resolveError}<p class="mt-1 text-xs text-red-500">{resolveError}</p>{/if}
		</div>

		<button on:click={handleAddBank} disabled={addingBank || !selectedBank || !newAccountNumber.trim() || !newAccountName.trim()} class="w-full rounded-lg bg-gray-900 py-3 text-center font-medium text-white disabled:opacity-50">
			{addingBank ? 'Adding...' : 'Add Bank Account'}
		</button>
	</div>
</div>
</div>
{/if}
