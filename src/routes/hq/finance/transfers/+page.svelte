<!--
	Admin-assisted wallet → bank transfers.

	Support flow for when a user cannot complete a withdrawal themselves — KYC
	stuck, PIN lost, beneficiary flagged, app defect. The admin moves the money
	on their behalf, out of the user's own wallet, to an account they supply.

	This is the most dangerous screen in HQ, so the UI is built to slow the
	operator down rather than speed them up:

	  - The destination account holder's real name is resolved from the bank and
	    shown BEFORE the amount can be submitted. You always see who gets paid.
	  - The wallet breakdown separates withdrawable from held funds, so a
	    reserve or open dispute is visible rather than surfacing as a rejection.
	  - A review step restates every term, then an emailed code authorises it.

	Style follows /hq/finance/refunds: back link, summary cards, filter row,
	card rows, detail drawer.
-->
<script lang="ts">
	import {
		STATUS_STYLES,
		cancelTransfer,
		confirmTransfer,
		formatKobo,
		getBanks,
		getWalletSnapshot,
		initiateTransfer,
		listTransfers,
		resendTransferOtp,
		resolveAccount,
		type AdminTransfer,
		type Bank,
		type WalletSnapshot
	} from '$lib/services/adminTransfer.services';
	import { getAdminUser } from '$lib/services/admin.services';
	import { clickOutside } from '$lib/utils/constant';
	import { page } from '$app/stores';
	import { replaceState } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	// ── List state ───────────────────────────────────────────────────────
	let transfers: AdminTransfer[] = [];
	let total = 0;
	let loading = true;
	let error = '';
	let statusFilter = '';
	let search = '';
	let searchTimer: ReturnType<typeof setTimeout>;

	// ── Composer state ───────────────────────────────────────────────────
	type Step = 'form' | 'review' | 'otp' | 'done';
	let showComposer = false;
	let step: Step = 'form';

	let userId = '';
	let amount = '';
	let accountNumber = '';
	let bankCode = '';
	let reason = '';

	let banks: Bank[] = [];
	let bankQuery = '';
	let showBankList = false;
	let banksLoading = false;
	let banksError = '';
	/**
	 * Discards a resolve response that has been overtaken by newer input.
	 * Without it, a slow lookup for an old account number can land after the
	 * operator has typed a new one and stamp the WRONG account holder's name
	 * onto the form they are about to authorise.
	 */
	let resolveSeq = 0;

	let snapshot: WalletSnapshot | null = null;
	let snapshotLoading = false;
	let snapshotError = '';

	let resolvedName = '';
	let resolving = false;
	let resolveError = '';

	let submitting = false;
	let composerError = '';
	let activeTransfer: AdminTransfer | null = null;

	let otp = '';
	let otpError = '';
	let otpAttemptsLeft: number | null = null;
	let resending = false;
	let resentAt = '';

	// Detail drawer
	let detail: AdminTransfer | null = null;

	$: adminUser = getAdminUser();
	$: isSuperAdmin = adminUser?.role === 'super_admin';

	$: amountKobo = Math.round(Number(amount || 0) * 100);
	$: overWithdrawable =
		snapshot !== null && amountKobo > 0 && amountKobo > snapshot.withdrawableKobo;
	$: filteredBanks = bankQuery.trim()
		? banks.filter((b) => b.name.toLowerCase().includes(bankQuery.trim().toLowerCase()))
		: banks;
	$: selectedBank = banks.find((b) => b.code === bankCode) ?? null;

	// The bank must confirm the account holder before an amount can be sent —
	// this is the check that stops money going to a mistyped account number.
	$: canReview =
		Boolean(userId.trim()) &&
		amountKobo > 0 &&
		!overWithdrawable &&
		Boolean(resolvedName) &&
		Boolean(bankCode) &&
		reason.trim().length >= 10;

	onMount(() => {
		load();
		loadBanks();

		// Deep link from User Management ("Transfer funds from this wallet").
		// The composer opens with the id already filled and the wallet loading,
		// so the operator never copy-pastes an ObjectId between screens.
		const deepLinkUserId = $page.url.searchParams.get('userId');
		if (deepLinkUserId && isSuperAdmin) {
			openComposer();
			userId = deepLinkUserId;
			loadSnapshot();
			// Consume the parameter so a later refresh doesn't silently reopen
			// the composer for a user the operator has moved on from.
			const url = new URL($page.url);
			url.searchParams.delete('userId');
			replaceState(url, {});
		}
	});

	async function loadBanks() {
		banksLoading = true;
		banksError = '';
		try {
			banks = await getBanks();
			if (banks.length === 0) banksError = 'No banks were returned. Try again shortly.';
		} catch (e: any) {
			// Swallowing this is what made the picker look like "your bank isn't
			// supported" instead of "we couldn't reach the bank directory".
			banks = [];
			banksError = e?.message || 'Could not load the bank list';
		} finally {
			banksLoading = false;
		}
	}

	async function load() {
		loading = true;
		error = '';
		try {
			const result = await listTransfers({
				limit: 30,
				status: statusFilter || undefined,
				search: search.trim() || undefined
			});
			transfers = result.items;
			total = result.total;
		} catch (e: any) {
			error = e?.message || 'Failed to load transfers';
		} finally {
			loading = false;
		}
	}

	function handleSearch() {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(load, 300);
	}

	function openComposer() {
		showComposer = true;
		step = 'form';
		userId = '';
		amount = '';
		accountNumber = '';
		bankCode = '';
		bankQuery = '';
		reason = '';
		snapshot = null;
		snapshotError = '';
		resolvedName = '';
		resolveError = '';
		composerError = '';
		activeTransfer = null;
		otp = '';
		otpError = '';
		otpAttemptsLeft = null;
	}

	function closeComposer() {
		showComposer = false;
		if (step === 'done') load();
	}

	async function loadSnapshot() {
		const id = userId.trim();
		if (!id) return;
		snapshotLoading = true;
		snapshotError = '';
		snapshot = null;
		try {
			snapshot = await getWalletSnapshot(id);
		} catch (e: any) {
			snapshotError = e?.message || 'Could not load this wallet';
		} finally {
			snapshotLoading = false;
		}
	}

	/**
	 * Look the account up with the bank. Fires automatically once there is a
	 * selected bank and a complete 10-digit NUBAN — the same trigger the
	 * user-facing bank picker uses. The previous blur-based version meant the
	 * name only appeared if the operator happened to tab out of the field.
	 */
	async function handleResolve() {
		const acct = accountNumber.trim();
		resolvedName = '';
		resolveError = '';
		if (acct.length !== 10 || !bankCode) return;

		const seq = ++resolveSeq;
		resolving = true;
		try {
			const r = await resolveAccount(acct, bankCode);
			// Ignore anything the operator has already typed past.
			if (seq !== resolveSeq) return;
			if (r.accountNumber !== acct || r.bankCode !== bankCode) return;
			if (!r.accountName) {
				resolveError = 'The bank did not return an account name for those details.';
				return;
			}
			resolvedName = r.accountName;
		} catch (e: any) {
			if (seq !== resolveSeq) return;
			resolveError = e?.message || 'Could not verify those bank details';
		} finally {
			if (seq === resolveSeq) resolving = false;
		}
	}

	/**
	 * Any change to the destination invalidates a previously resolved name, so
	 * the review step can never show a name belonging to a different account.
	 * Bumping the sequence also voids an in-flight lookup.
	 */
	function invalidateResolution() {
		resolveSeq++;
		resolvedName = '';
		resolveError = '';
		resolving = false;
	}

	function onAccountNumberInput() {
		invalidateResolution();
		if (accountNumber.trim().length === 10 && bankCode) handleResolve();
	}

	function selectBank(bank: Bank) {
		bankCode = bank.code;
		bankQuery = bank.name;
		showBankList = false;
		invalidateResolution();
		// The operator may have filled the account number first.
		if (accountNumber.trim().length === 10) handleResolve();
	}

	async function handleInitiate() {
		submitting = true;
		composerError = '';
		try {
			activeTransfer = await initiateTransfer({
				userId: userId.trim(),
				amount: Number(amount),
				currency: 'NGN',
				accountNumber: accountNumber.trim(),
				bankCode,
				reason: reason.trim()
			});
			step = 'otp';
		} catch (e: any) {
			composerError = e?.message || 'Could not start this transfer';
		} finally {
			submitting = false;
		}
	}

	async function handleConfirm() {
		if (!activeTransfer) return;
		otpError = '';
		submitting = true;
		try {
			activeTransfer = await confirmTransfer(activeTransfer.id, otp.trim());
			step = 'done';
		} catch (e: any) {
			otpError = e?.message || 'Could not authorise this transfer';
			otpAttemptsLeft = e?.meta?.attemptsRemaining ?? null;
			// A consumed or locked challenge cannot be retried — send the
			// operator back rather than leaving them typing into a dead form.
			if (e?.code === 'OTP_EXPIRED') step = 'form';
		} finally {
			submitting = false;
		}
	}

	async function handleResend() {
		if (!activeTransfer) return;
		resending = true;
		otpError = '';
		try {
			await resendTransferOtp(activeTransfer.id);
			resentAt = new Date().toLocaleTimeString();
			otp = '';
		} catch (e: any) {
			otpError = e?.message || 'Could not resend the code';
		} finally {
			resending = false;
		}
	}

	async function handleCancelActive() {
		if (!activeTransfer) return;
		try {
			await cancelTransfer(activeTransfer.id);
		} catch {
			/* closing is what matters */
		}
		showComposer = false;
		load();
	}

	function fmtDate(iso?: string | null): string {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleString('en-GB', {
				day: 'numeric',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return String(iso);
		}
	}

	$: pendingCount = transfers.filter((t) => t.status === 'PENDING_OTP').length;
	$: processingCount = transfers.filter((t) => t.status === 'PROCESSING').length;
	$: completedKobo = transfers
		.filter((t) => t.status === 'COMPLETED')
		.reduce((sum, t) => sum + Number(t.amountKobo || 0), 0);
</script>

<svelte:head><title>Transfers — Rondwell HQ</title></svelte:head>

<div>
	<a href="/hq/finance" class="inline-flex items-center gap-1 text-xs text-pink-600 hover:underline">
		<Icon icon="mdi:arrow-left" /> Back to Finance
	</a>

	<div class="mt-4 flex flex-wrap items-start justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold text-gray-900">Transfers</h1>
			<p class="mt-1 max-w-2xl text-sm text-gray-500">
				Send funds from a user's wallet to a bank account on their behalf. Use this when the
				user cannot complete a withdrawal themselves. Every transfer is authorised by a code
				emailed to you and permanently recorded against your account.
			</p>
		</div>
		{#if isSuperAdmin}
			<button
				on:click={openComposer}
				class="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800"
			>
				<Icon icon="mdi:bank-transfer-out" /> New transfer
			</button>
		{/if}
	</div>

	{#if !isSuperAdmin}
		<div class="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
			<Icon icon="mdi:shield-lock-outline" class="mt-0.5 shrink-0 text-lg text-amber-600" />
			<div>
				<p class="text-sm font-semibold text-amber-900">Read-only access</p>
				<p class="mt-0.5 text-xs text-amber-800">
					You can review the transfer history here, but starting a transfer requires a super
					admin account.
				</p>
			</div>
		</div>
	{/if}

	<!-- Summary -->
	<div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-xl border border-gray-200 bg-white p-4">
			<p class="text-xs text-[#C1C2C2]">Transfers (filtered)</p>
			<p class="mt-1 text-xl font-semibold text-gray-900">{total.toLocaleString()}</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4">
			<p class="text-xs text-[#C1C2C2]">Completed on this page</p>
			<p class="mt-1 text-xl font-semibold text-gray-900">{formatKobo(completedKobo)}</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4">
			<p class="text-xs text-[#C1C2C2]">In flight</p>
			<p class="mt-1 text-xl font-semibold text-gray-900">{processingCount}</p>
			<p class="mt-1 text-[11px] text-gray-400">Awaiting bank confirmation</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4">
			<p class="text-xs text-[#C1C2C2]">Awaiting authorisation</p>
			<p class="mt-1 text-xl font-semibold {pendingCount > 0 ? 'text-amber-600' : 'text-gray-900'}">
				{pendingCount}
			</p>
			<p class="mt-1 text-[11px] text-gray-400">No money has moved for these</p>
		</div>
	</div>

	<!-- Filters -->
	<div class="mt-5 flex flex-wrap items-end gap-3">
		<div class="relative min-w-[220px] flex-1">
			<input
				type="text"
				bind:value={search}
				on:input={handleSearch}
				placeholder="Search user email, account name, reference…"
				class="h-[38px] w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm focus:ring-1 focus:ring-[#513BE2] focus:outline-none"
			/>
			<Icon icon="mdi:magnify" class="absolute top-2.5 left-2.5 text-base text-gray-400" />
		</div>
		<select
			bind:value={statusFilter}
			on:change={load}
			class="h-[38px] rounded-lg border border-gray-200 bg-white px-3 text-sm focus:ring-1 focus:ring-[#513BE2] focus:outline-none"
		>
			<option value="">All statuses</option>
			<option value="PENDING_OTP">Awaiting code</option>
			<option value="PROCESSING">Processing</option>
			<option value="COMPLETED">Completed</option>
			<option value="FAILED">Failed</option>
			<option value="REVERSED">Reversed</option>
			<option value="CANCELLED">Cancelled</option>
			<option value="EXPIRED">Expired</option>
		</select>
	</div>

	{#if error}
		<div class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
	{/if}

	<!-- List -->
	<div class="mt-5 space-y-2">
		{#if loading}
			{#each Array(4) as _}
				<div class="h-[74px] animate-pulse rounded-xl border border-gray-200 bg-white"></div>
			{/each}
		{:else if transfers.length === 0}
			<div class="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center">
				<Icon icon="mdi:bank-transfer" class="mx-auto text-3xl text-gray-300" />
				<p class="mt-2 text-sm font-medium text-gray-700">No transfers yet</p>
				<p class="mt-1 text-xs text-gray-400">
					Assisted transfers you make will be listed here with a full audit trail.
				</p>
			</div>
		{:else}
			{#each transfers as t (t.id)}
				<button
					on:click={() => (detail = t)}
					class="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-gray-300 hover:shadow-sm"
				>
					<div class="min-w-0 flex-1">
						<div class="flex flex-wrap items-center gap-2">
							<span class="text-sm font-semibold text-gray-900">
								{formatKobo(t.amountKobo, t.currency)}
							</span>
							<span
								class="rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset {STATUS_STYLES[
									t.status
								]?.class ?? 'bg-gray-100 text-gray-600 ring-gray-200'}"
							>
								{STATUS_STYLES[t.status]?.label ?? t.status}
							</span>
						</div>
						<p class="mt-1 truncate text-xs text-gray-500">
							{t.destination.accountName} · {t.destination.bankName}
							{t.destination.accountNumberMasked}
						</p>
						<p class="mt-0.5 truncate text-[11px] text-gray-400">
							From {t.userName || t.userEmail || t.userId} · by {t.initiatedByAdminEmail}
						</p>
					</div>
					<div class="shrink-0 text-right">
						<p class="text-[11px] text-gray-400">{fmtDate(t.createdAt)}</p>
						{#if t.failureReason}
							<p class="mt-0.5 max-w-[220px] truncate text-[11px] text-red-500">
								{t.failureReason}
							</p>
						{/if}
					</div>
				</button>
			{/each}
		{/if}
	</div>
</div>

<!-- ─── Detail drawer ─────────────────────────────────────────────────── -->
{#if detail}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
		on:click={() => (detail = null)}
		on:keydown={(e) => e.key === 'Escape' && (detail = null)}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl"
			on:click|stopPropagation
			on:keydown|stopPropagation
		>
			<div class="flex items-start justify-between">
				<h2 class="text-lg font-semibold text-gray-900">Transfer detail</h2>
				<button on:click={() => (detail = null)} aria-label="Close" class="text-gray-400">
					<Icon icon="mdi:close" class="text-xl" />
				</button>
			</div>

			<div class="mt-5 rounded-xl bg-gray-50 p-4">
				<p class="text-2xl font-semibold text-gray-900">
					{formatKobo(detail.amountKobo, detail.currency)}
				</p>
				<span
					class="mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset {STATUS_STYLES[
						detail.status
					]?.class ?? ''}"
				>
					{STATUS_STYLES[detail.status]?.label ?? detail.status}
				</span>
			</div>

			<dl class="mt-5 space-y-3 text-sm">
				<div>
					<dt class="text-xs text-gray-400">Paid to</dt>
					<dd class="text-gray-900">{detail.destination.accountName}</dd>
					<dd class="text-xs text-gray-500">
						{detail.destination.bankName} · {detail.destination.accountNumberMasked}
					</dd>
				</div>
				<div>
					<dt class="text-xs text-gray-400">Debited from</dt>
					<dd class="text-gray-900">{detail.userName || detail.userEmail || '—'}</dd>
					{#if detail.userName && detail.userEmail}
						<dd class="text-xs text-gray-500">{detail.userEmail}</dd>
					{/if}
					<dd class="font-mono text-[11px] break-all text-gray-400">{detail.userId}</dd>
				</div>
				<div>
					<dt class="text-xs text-gray-400">Reason</dt>
					<dd class="text-gray-700">{detail.reason}</dd>
				</div>
				<div>
					<dt class="text-xs text-gray-400">Initiated by</dt>
					<dd class="text-gray-900">{detail.initiatedByAdminEmail}</dd>
					<dd class="text-xs text-gray-500">{fmtDate(detail.createdAt)}</dd>
				</div>
				{#if detail.confirmedAt}
					<div>
						<dt class="text-xs text-gray-400">Authorised</dt>
						<dd class="text-gray-700">{fmtDate(detail.confirmedAt)}</dd>
					</div>
				{/if}
				{#if detail.reference}
					<div>
						<dt class="text-xs text-gray-400">Gateway reference</dt>
						<dd class="font-mono text-xs break-all text-gray-700">{detail.reference}</dd>
					</div>
				{/if}
				{#if detail.failureReason}
					<div class="rounded-lg bg-red-50 p-3">
						<dt class="text-xs font-medium text-red-800">Failure reason</dt>
						<dd class="mt-0.5 text-xs text-red-700">{detail.failureReason}</dd>
					</div>
				{/if}
				{#if detail.balanceSnapshot}
					<div class="rounded-lg bg-gray-50 p-3">
						<dt class="mb-1 text-xs font-medium text-gray-700">Wallet at initiation</dt>
						<dd class="space-y-0.5 text-[11px] text-gray-500">
							<p>Balance: {formatKobo(detail.balanceSnapshot.balanceKobo)}</p>
							<p>Withdrawable: {formatKobo(detail.balanceSnapshot.withdrawableKobo)}</p>
							<p>Held (reserve/dispute): {formatKobo(
								detail.balanceSnapshot.disputedKobo + detail.balanceSnapshot.payoutReserveKobo
							)}</p>
						</dd>
					</div>
				{/if}
			</dl>
		</div>
	</div>
{/if}

<!-- ─── Composer ──────────────────────────────────────────────────────── -->
{#if showComposer}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 backdrop-blur-sm">
		<div class="flex max-h-[92vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-5 py-3">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900">
						<Icon icon="mdi:bank-transfer-out" class="h-5 w-5 text-white" />
					</div>
					<div>
						<h2 class="font-semibold text-gray-800">
							{step === 'done' ? 'Transfer sent' : 'New transfer'}
						</h2>
						<p class="text-xs text-[#A5A6A6]">
							{step === 'form'
								? 'Move funds from a user wallet to a bank account'
								: step === 'review'
									? 'Check every detail before authorising'
									: step === 'otp'
										? 'Enter the code we emailed you'
										: 'On its way to the bank'}
						</p>
					</div>
				</div>
				<button
					class="flex h-8 w-8 items-center justify-center rounded-full bg-[#EBECED]"
					on:click={closeComposer}
					aria-label="Close"
				>
					<Icon icon="mdi:close" class="text-lg text-gray-700" />
				</button>
			</div>

			<div class="custom-scrollbar flex-1 overflow-y-auto px-5 py-4">
				<!-- ── Step 1: form ────────────────────────────────────────── -->
				{#if step === 'form'}
					<div class="mb-4">
						<label for="tx-user" class="mb-1.5 block text-xs font-medium text-[#666769]">
							User ID
						</label>
						<div class="flex gap-2">
							<input
								id="tx-user"
								type="text"
								bind:value={userId}
								on:blur={loadSnapshot}
								placeholder="Paste the user's ID from User Management"
								class="h-[38px] flex-1 rounded-lg border border-gray-200 bg-[#F8F8F9] px-3 text-sm focus:border-gray-400 focus:outline-none"
							/>
							<button
								on:click={loadSnapshot}
								disabled={!userId.trim() || snapshotLoading}
								class="rounded-lg border border-gray-200 px-3 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
							>
								{snapshotLoading ? '…' : 'Load'}
							</button>
						</div>
						{#if snapshotError}
							<p class="mt-1.5 text-xs text-red-500">{snapshotError}</p>
						{/if}
					</div>

					{#if snapshot}
						<!--
							Who is being debited. The destination account holder is shown
							in full further down, so without this the person LOSING the
							money was the only party identified by a raw id — and a
							mis-pasted id looks exactly like a correct one.
						-->
						<div class="mb-3 flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3">
							<div
								class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F2E4F8] text-sm font-semibold text-[#AB46DD]"
							>
								{(snapshot.userName || snapshot.userEmail || '?').charAt(0).toUpperCase()}
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium text-gray-900">
									{snapshot.userName || 'Name not on file'}
								</p>
								<p class="truncate text-xs text-gray-500">
									{snapshot.userEmail || 'No email on file'}
								</p>
							</div>
							{#if snapshot.userStatus && snapshot.userStatus !== 'ACTIVE'}
								<span
									class="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200 ring-inset"
								>
									{snapshot.userStatus}
								</span>
							{/if}
						</div>

						{#if !snapshot.userEmail}
							<!-- The debit notification has nowhere to go. Not a blocker for
							     a support transfer, but the operator must know. -->
							<div class="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
								<Icon icon="mdi:email-off-outline" class="mt-0.5 shrink-0 text-base text-amber-600" />
								<p class="text-xs text-amber-900">
									This account has no email on file, so the user will
									<span class="font-semibold">not be notified</span> that money left their wallet.
								</p>
							</div>
						{/if}

						<div class="mb-4 rounded-lg border border-gray-100 bg-[#F8F8F9] p-3">
							<div class="flex items-baseline justify-between">
								<span class="text-xs text-gray-500">Withdrawable now</span>
								<span class="text-lg font-semibold text-gray-900">
									{formatKobo(snapshot.withdrawableKobo)}
								</span>
							</div>
							<div class="mt-2 space-y-1 border-t border-gray-200 pt-2 text-[11px] text-gray-500">
								<div class="flex justify-between">
									<span>Total balance</span><span>{formatKobo(snapshot.balanceKobo)}</span>
								</div>
								{#if snapshot.reservedKobo > 0}
									<div class="flex justify-between">
										<span>Withdrawal in flight</span><span
											>−{formatKobo(snapshot.reservedKobo)}</span
										>
									</div>
								{/if}
								{#if snapshot.disputedKobo > 0}
									<div class="flex justify-between text-orange-600">
										<span>Held against a dispute</span><span
											>−{formatKobo(snapshot.disputedKobo)}</span
										>
									</div>
								{/if}
								{#if snapshot.payoutReserveKobo > 0}
									<div class="flex justify-between text-orange-600">
										<span>Rolling payout reserve</span><span
											>−{formatKobo(snapshot.payoutReserveKobo)}</span
										>
									</div>
								{/if}
							</div>
						</div>
					{/if}

					<div class="mb-4">
						<label for="tx-amount" class="mb-1.5 block text-xs font-medium text-[#666769]">
							Amount (NGN)
						</label>
						<input
							id="tx-amount"
							type="number"
							min="0"
							step="0.01"
							bind:value={amount}
							placeholder="0.00"
							class="h-[38px] w-full rounded-lg border bg-[#F8F8F9] px-3 text-sm focus:outline-none {overWithdrawable
								? 'border-red-300 focus:border-red-400'
								: 'border-gray-200 focus:border-gray-400'}"
						/>
						{#if overWithdrawable && snapshot}
							<p class="mt-1.5 text-xs text-red-500">
								That is more than the {formatKobo(snapshot.withdrawableKobo)} this user can
								currently withdraw.
							</p>
						{/if}
					</div>

					<!-- Destination -->
					<div class="mb-4">
						<label for="tx-bank" class="mb-1.5 block text-xs font-medium text-[#666769]">
							Destination bank
						</label>
						<div class="relative" use:clickOutside={() => (showBankList = false)}>
							<input
								id="tx-bank"
								type="text"
								autocomplete="off"
								bind:value={bankQuery}
								on:focus={() => (showBankList = true)}
								on:input={() => {
									showBankList = true;
									// Typing after a selection means the operator is picking
									// again — the old code must not survive into review.
									bankCode = '';
									invalidateResolution();
								}}
								placeholder={banksLoading ? 'Loading banks…' : 'Search for a bank…'}
								disabled={banksLoading}
								class="h-[38px] w-full rounded-lg border border-gray-200 bg-[#F8F8F9] px-3 pr-9 text-sm focus:border-gray-400 focus:outline-none disabled:opacity-60"
							/>
							<div class="absolute top-1/2 right-3 -translate-y-1/2">
								{#if banksLoading}
									<Icon icon="mdi:loading" class="animate-spin text-base text-gray-400" />
								{:else if bankCode}
									<Icon icon="mdi:check-circle" class="text-base text-green-600" />
								{:else}
									<Icon icon="mdi:chevron-down" class="text-base text-gray-400" />
								{/if}
							</div>

							{#if showBankList && !bankCode && !banksLoading}
								<div
									class="absolute top-full left-0 z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-100 bg-white py-1 shadow-lg"
								>
									{#if filteredBanks.length === 0}
										<p class="px-3 py-2 text-xs text-gray-400">
											No bank matches “{bankQuery}”.
										</p>
									{:else}
										{#each filteredBanks.slice(0, 60) as bank (bank.code)}
											<button
												class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
												on:click={() => selectBank(bank)}
											>
												{bank.name}
											</button>
										{/each}
									{/if}
								</div>
							{/if}
						</div>

						{#if banksError}
							<p class="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-red-500">
								{banksError}
								<button on:click={loadBanks} class="text-[#513BE2] underline">Retry</button>
							</p>
						{:else if !banksLoading && banks.length > 0}
							<p class="mt-1 text-[11px] text-gray-400">
								{banks.length} banks and fintechs available
							</p>
						{/if}
					</div>

					<div class="mb-4">
						<label for="tx-acct" class="mb-1.5 block text-xs font-medium text-[#666769]">
							Account number
						</label>
						<input
							id="tx-acct"
							type="text"
							inputmode="numeric"
							maxlength="10"
							autocomplete="off"
							bind:value={accountNumber}
							on:input={onAccountNumberInput}
							placeholder="0123456789"
							class="h-[38px] w-full rounded-lg border border-gray-200 bg-[#F8F8F9] px-3 text-sm focus:border-gray-400 focus:outline-none"
						/>

						{#if resolving}
							<p class="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
								<Icon icon="mdi:loading" class="animate-spin" /> Checking with the bank…
							</p>
						{:else if resolvedName}
							<div
								class="mt-2 flex items-start gap-2 rounded-lg bg-green-50 px-3 py-2 text-green-800"
							>
								<Icon icon="mdi:check-circle" class="mt-0.5 shrink-0 text-base" />
								<div>
									<p class="text-xs font-semibold">{resolvedName}</p>
									<p class="text-[11px] text-green-700">
										Confirmed by the bank. This is who will receive the money.
									</p>
								</div>
							</div>
						{:else if resolveError}
							<p class="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-red-500">
								{resolveError}
								<button on:click={handleResolve} class="text-[#513BE2] underline">Retry</button>
							</p>
						{:else if !bankCode}
							<p class="mt-1.5 text-xs text-gray-400">Choose a bank first.</p>
						{:else if accountNumber.trim().length > 0 && accountNumber.trim().length < 10}
							<p class="mt-1.5 text-xs text-gray-400">
								{10 - accountNumber.trim().length} more digit{10 - accountNumber.trim().length === 1
									? ''
									: 's'} — we'll check the account holder automatically.
							</p>
						{/if}
					</div>

					<div class="mb-2">
						<label for="tx-reason" class="mb-1.5 block text-xs font-medium text-[#666769]">
							Reason (recorded, and shown to the user)
						</label>
						<textarea
							id="tx-reason"
							bind:value={reason}
							rows="3"
							placeholder="e.g. User's KYC is stuck in review and they need their event payout before Friday. Ticket #4821."
							class="w-full resize-none rounded-lg border border-gray-200 bg-[#F8F8F9] px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
						></textarea>
						<p class="mt-1 text-[11px] {reason.trim().length >= 10 ? 'text-gray-400' : 'text-amber-600'}">
							{reason.trim().length}/10 characters minimum
						</p>
					</div>

					{#if composerError}
						<p class="mb-2 text-sm text-red-500">{composerError}</p>
					{/if}

				<!-- ── Step 2: review ──────────────────────────────────────── -->
				{:else if step === 'review'}
					<div class="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
						<Icon icon="mdi:alert-outline" class="mt-0.5 shrink-0 text-lg text-amber-600" />
						<p class="text-xs text-amber-900">
							You are about to move {formatKobo(amountKobo)} out of
							<span class="font-semibold"
								>{snapshot?.userName || snapshot?.userEmail || 'this user'}</span
							>'s wallet and into an account belonging to
							<span class="font-semibold">{resolvedName}</span>. Once the bank accepts it, this
							cannot be recalled.
						</p>
					</div>

					<div class="rounded-xl border border-gray-200">
						<div class="border-b border-gray-100 px-4 py-3">
							<p class="text-xs text-gray-400">Amount</p>
							<p class="text-2xl font-semibold text-gray-900">{formatKobo(amountKobo)}</p>
						</div>
						<div class="border-b border-gray-100 px-4 py-3">
							<p class="text-xs text-gray-400">To</p>
							<p class="text-sm font-medium text-gray-900">{resolvedName}</p>
							<p class="text-xs text-gray-500">{selectedBank?.name} · {accountNumber}</p>
						</div>
						<div class="border-b border-gray-100 px-4 py-3">
							<p class="text-xs text-gray-400">Debited from</p>
							{#if snapshot?.userName || snapshot?.userEmail}
								<p class="text-sm font-medium text-gray-900">
									{snapshot.userName || 'Name not on file'}
								</p>
								<p class="text-xs text-gray-500">{snapshot.userEmail || 'No email on file'}</p>
							{:else}
								<p class="text-sm font-medium text-amber-700">Wallet owner not identified</p>
							{/if}
							<p class="mt-1 font-mono text-[11px] break-all text-gray-400">{userId}</p>
							{#if snapshot}
								<p class="mt-1 text-[11px] text-gray-500">
									{formatKobo(snapshot.withdrawableKobo)} withdrawable →
									{formatKobo(snapshot.withdrawableKobo - amountKobo)} after
								</p>
							{/if}
						</div>
						<div class="px-4 py-3">
							<p class="text-xs text-gray-400">Reason</p>
							<p class="text-sm text-gray-700">{reason}</p>
						</div>
					</div>

					{#if composerError}
						<p class="mt-3 text-sm text-red-500">{composerError}</p>
					{/if}

				<!-- ── Step 3: OTP ─────────────────────────────────────────── -->
				{:else if step === 'otp' && activeTransfer}
					<div class="text-center">
						<div
							class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#513BE2]/10"
						>
							<Icon icon="mdi:email-lock-outline" class="text-2xl text-[#513BE2]" />
						</div>
						<p class="mt-3 text-sm font-medium text-gray-900">Check your email</p>
						<p class="mt-1 text-xs text-gray-500">
							We sent a 6-digit code to <span class="font-medium"
								>{activeTransfer.initiatedByAdminEmail}</span
							>. It authorises this transfer only.
						</p>
					</div>

					<div class="mt-5 rounded-lg bg-gray-50 p-3 text-center">
						<p class="text-lg font-semibold text-gray-900">
							{formatKobo(activeTransfer.amountKobo, activeTransfer.currency)}
						</p>
						<p class="text-xs text-gray-500">
							from {activeTransfer.userName || activeTransfer.userEmail || 'this user'}
						</p>
						<p class="text-xs text-gray-500">
							to {activeTransfer.destination.accountName} ·
							{activeTransfer.destination.accountNumberMasked}
						</p>
					</div>

					<input
						type="text"
						inputmode="numeric"
						maxlength="6"
						bind:value={otp}
						placeholder="······"
						class="mt-5 w-full rounded-lg border border-gray-200 bg-[#F8F8F9] px-3 py-3 text-center text-2xl tracking-[0.5em] focus:border-gray-400 focus:outline-none"
					/>

					{#if otpError}
						<p class="mt-2 text-center text-sm text-red-500">{otpError}</p>
						{#if otpAttemptsLeft !== null}
							<p class="mt-1 text-center text-xs text-gray-500">
								{otpAttemptsLeft} attempt{otpAttemptsLeft === 1 ? '' : 's'} remaining
							</p>
						{/if}
					{/if}

					<div class="mt-3 text-center">
						<button
							on:click={handleResend}
							disabled={resending}
							class="text-xs text-[#513BE2] hover:underline disabled:opacity-50"
						>
							{resending ? 'Sending…' : 'Send a new code'}
						</button>
						{#if resentAt}
							<p class="mt-1 text-[11px] text-gray-400">New code sent at {resentAt}</p>
						{/if}
					</div>

				<!-- ── Step 4: done ────────────────────────────────────────── -->
				{:else if step === 'done' && activeTransfer}
					<div class="py-6 text-center">
						<div
							class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100"
						>
							<Icon icon="mdi:check" class="text-3xl text-green-600" />
						</div>
						<p class="mt-4 text-lg font-semibold text-gray-900">
							{formatKobo(activeTransfer.amountKobo, activeTransfer.currency)} sent
						</p>
						<p class="mt-1 text-sm text-gray-500">
							On its way to {activeTransfer.destination.accountName}.
						</p>
						<p class="mx-auto mt-3 max-w-sm text-xs text-gray-400">
							The bank confirms settlement separately — this transfer will show as
							<span class="font-medium">Processing</span> until then. The user has been emailed.
						</p>
						{#if activeTransfer.reference}
							<p class="mt-3 font-mono text-[11px] break-all text-gray-400">
								{activeTransfer.reference}
							</p>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="border-t border-gray-200 px-5 py-3">
				{#if step === 'form'}
					<div class="flex items-center gap-2">
						<button
							on:click={closeComposer}
							class="flex-1 rounded-lg border bg-gray-100 py-2.5 text-sm text-[#626365]"
						>
							Cancel
						</button>
						<button
							on:click={() => {
								composerError = '';
								step = 'review';
							}}
							disabled={!canReview}
							class="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition {canReview
								? 'bg-gray-800 hover:bg-gray-700'
								: 'cursor-not-allowed bg-[#969798]'}"
						>
							Review
						</button>
					</div>
				{:else if step === 'review'}
					<div class="flex items-center gap-2">
						<button
							on:click={() => (step = 'form')}
							class="flex-1 rounded-lg border bg-gray-100 py-2.5 text-sm text-[#626365]"
						>
							Back
						</button>
						<button
							on:click={handleInitiate}
							disabled={submitting}
							class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-800 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
						>
							{#if submitting}
								<Icon icon="mdi:loading" class="animate-spin text-base" /> Sending code…
							{:else}
								<Icon icon="mdi:email-lock-outline" class="text-base" /> Email me a code
							{/if}
						</button>
					</div>
				{:else if step === 'otp'}
					<div class="flex items-center gap-2">
						<button
							on:click={handleCancelActive}
							class="flex-1 rounded-lg border bg-gray-100 py-2.5 text-sm text-[#626365]"
						>
							Abandon
						</button>
						<button
							on:click={handleConfirm}
							disabled={submitting || otp.trim().length !== 6}
							class="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition {otp.trim()
								.length === 6 && !submitting
								? 'bg-gray-800 hover:bg-gray-700'
								: 'cursor-not-allowed bg-[#969798]'}"
						>
							{#if submitting}
								<Icon icon="mdi:loading" class="animate-spin text-base" /> Sending…
							{:else}
								<Icon icon="mdi:send" class="text-base" /> Authorise transfer
							{/if}
						</button>
					</div>
				{:else}
					<button
						on:click={closeComposer}
						class="w-full rounded-lg bg-gray-800 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
					>
						Done
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
