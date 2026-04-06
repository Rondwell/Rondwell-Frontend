<script lang="ts">
	import {
		addBankAccount,
		getBankAccounts,
		getBankList,
		removeBankAccount,
		resolveBankAccount,
	} from '$lib/services/wallet.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	// Bank accounts
	let bankAccounts: { id: string; bankName: string; accountNumber: string; accountName: string }[] = [];
	let loadingBanks = true;
	let showAddBankModal = false;

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

	$: filteredBanks = bankSearchQuery
		? banks.filter((b) => b.name.toLowerCase().includes(bankSearchQuery.toLowerCase()))
		: banks;

	onMount(async () => {
		await Promise.all([loadBankAccounts(), loadBankList()]);
	});

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
		if (newAccountNumber.length === 10 && selectedBank) handleResolveAccount();
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
		} catch (e: any) {
			console.error('Failed to remove bank account:', e);
		}
	}
</script>

<div class="mb-12">
	<!-- Withdrawal Methods (Bank Accounts) -->
	<div class="mb-8">
		<div class="mb-4 flex items-center justify-between">
			<div>
				<h2 class="text-lg font-semibold">Withdrawal Methods</h2>
				<p class="text-sm text-[#8C8F93]">Bank accounts for receiving withdrawals.</p>
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
							<div><div class="h-4 w-24 rounded bg-gray-200"></div><div class="mt-1 h-3 w-40 rounded bg-gray-200"></div></div>
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

	<!-- Payment Cards (Coming Soon) -->
	<div class="border-t pt-8">
		<div class="mb-4">
			<h2 class="text-lg font-semibold">Payment Cards</h2>
			<p class="text-sm text-[#8C8F93]">Saved cards for ticket purchases and subscriptions.</p>
		</div>
		<div class="flex h-32 flex-col items-center justify-center rounded-lg border bg-white">
			<Icon icon="mdi:credit-card-outline" class="mb-1 text-2xl text-gray-300" />
			<p class="text-sm text-gray-400">Card management coming soon.</p>
		</div>
	</div>
</div>

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

		<div class="mb-4">
			<label for="pm-bank-search" class="mb-1 block text-sm font-medium text-gray-700">Bank Name</label>
			<div use:clickOutside={() => (showBankDropdown = false)} class="relative">
				<input id="pm-bank-search" type="text" bind:value={bankSearchQuery}
					on:focus={() => (showBankDropdown = true)}
					on:input={() => { showBankDropdown = true; selectedBank = null; }}
					placeholder="Search for a bank..."
					class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none" />
				{#if showBankDropdown && filteredBanks.length > 0}
					<div class="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
						{#each filteredBanks as bank}
							<button on:click={() => selectBank(bank)} class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50">{bank.name}</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<div class="mb-4">
			<label for="pm-account-number" class="mb-1 block text-sm font-medium text-gray-700">Account Number</label>
			<input id="pm-account-number" type="text" bind:value={newAccountNumber} on:input={onAccountNumberInput}
				placeholder="0123456789" maxlength="10"
				class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none" />
		</div>

		<div class="mb-5">
			<label for="pm-account-name" class="mb-1 block text-sm font-medium text-gray-700">Account Name</label>
			{#if resolvingAccount}
				<div class="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-400">
					<Icon icon="mdi:loading" class="animate-spin" /> Resolving...
				</div>
			{:else}
				<input id="pm-account-name" type="text" bind:value={newAccountName} placeholder="Will auto-fill when account is resolved" readonly
					class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none" />
			{/if}
			{#if resolveError}<p class="mt-1 text-xs text-red-500">{resolveError}</p>{/if}
		</div>

		<button on:click={handleAddBank} disabled={addingBank || !selectedBank || !newAccountNumber.trim() || !newAccountName.trim()}
			class="w-full rounded-lg bg-gray-900 py-3 text-center font-medium text-white disabled:opacity-50">
			{addingBank ? 'Adding...' : 'Add Bank Account'}
		</button>
	</div>
</div>
</div>
{/if}
