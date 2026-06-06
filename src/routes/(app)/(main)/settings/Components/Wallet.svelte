<!--
	Wallet.svelte — settings → wallet panel.

	FE-P1-05 invariant: the withdrawable amount is sourced from the canonical
	wallet balance returned by `/api/v1/payment/wallet/balance` — never from
	the `/earnings-summary` aggregation. The earnings table is display-only.
	A user with NGN 0 in their wallet but past sales must NOT be able to
	authorise a withdrawal — the backend rejects it (P1-05) and the UI reflects
	that by disabling the Withdraw button when `withdrawableByCurrency === 0`.

	FE-P1-06: withdrawal status is now a state machine — PROCESSING / COMPLETED
	/ FAILED / REVERSED. The transactions table renders coloured badges + a
	tooltip explaining each state.

	FE-P1-07/08: the withdraw modal collects BOTH `userPin` AND `otp`. The
	backend's `verify-otp` endpoint requires both — sending one without the
	other returns a structured 400 (`PIN_REQUIRED`) or 423 (`PIN_LOCKED`).
	Errors are mapped to specific copy via `$lib/utils/withdrawalErrors`.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		getBankAccounts,
		getEarningsSummary,
		getMyWalletTransactions,
		getUserTransactions,
		getWalletBalance,
		requestWithdrawalOtp,
		verifyWithdrawalOtp,
	} from '$lib/services/wallet.services';
	import { kycStore, loadKyc } from '$lib/stores/kyc.store';
	import { clickOutside } from '$lib/utils/constant';
	import { formatMoney, koboToMajor } from '$lib/utils/money';
	import { openReceipt } from '$lib/utils/receipt';
	import { COMMON_TIMEZONES, getBrowserTz } from '$lib/utils/tz';
	import { mapWithdrawalError, type MappedWithdrawalError } from '$lib/utils/withdrawalErrors';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	// P1-16: per-currency balances. Each entry is integer kobo/cents in its
	// own currency — never aggregated for commerce, only for display.
	type CurrencyKey = 'NGN' | 'USD' | 'ETH';
	const CURRENCIES: CurrencyKey[] = ['NGN', 'USD', 'ETH'];
	let balancesByCurrency: Record<CurrencyKey, number> = { NGN: 0, USD: 0, ETH: 0 };
	let reservedByCurrency: Record<CurrencyKey, number> = { NGN: 0, USD: 0, ETH: 0 };
	let disputedReserveByCurrency: Record<CurrencyKey, number> = { NGN: 0, USD: 0, ETH: 0 };
	let withdrawableByCurrency: Record<CurrencyKey, number> = { NGN: 0, USD: 0, ETH: 0 };
	let activeCurrency: CurrencyKey = 'NGN';
	let showAggregateView = false;
	let aggregateDisplayCurrency: CurrencyKey = 'NGN';
	let loadingBalance = true;
	let showBalanceBreakdown: Record<CurrencyKey, boolean> = { NGN: false, USD: false, ETH: false };

	// Bank accounts (needed for withdrawal modal bank selector)
	let bankAccounts: { id: string; bankName: string; accountNumber: string; accountName: string }[] = [];

	// Withdrawal modal — FE-P1-07/08: PIN + OTP required.
	let showWithdrawModal = false;
	let selectedBankId = '';
	let withdrawAmount = '';
	let withdrawPin = '';
	let withdrawOtp = '';
	let otpSent = false;
	let sendingOtp = false;
	let withdrawing = false;
	let mappedError: MappedWithdrawalError | null = null;
	let withdrawSuccess = '';

	// Earnings table
	let showDateFilter = false;
	let dateFilter = 'All Time';
	const dateOptions = ['All Time', 'This Week', 'This Month', 'This Year'];
	let eventEarnings: any[] = [];
	let loadingEarnings = true;

	// FE-P1-06: withdrawal transactions with status state machine.
	let withdrawalRows: any[] = [];
	let loadingWithdrawals = true;

	// FE-P3-07 (NEW-9.3) — IANA timezone for ledger / earnings calls.
	let timezone = getBrowserTz();
	let showTzDropdown = false;

	// FE-P3-12 (NEW-2.1 / FA-9.3) — cursor-paginated wallet transactions.
	let walletTxRows: any[] = [];
	let walletTxCursor: string | null = null;
	let walletTxHasMore = false;
	let loadingWalletTx = true;
	let loadingMoreTx = false;
	let txCurrencyFilter: string | '' = '';
	let useUnifiedFeed = true;
	// FE-P4-04 — error message when fetching a presigned receipt URL fails.
	let receiptError = '';
	// FE-P4-01 (P4-01) — Wallet may be frozen by a recon job. The backend
	// surfaces `frozen: true` (and optional `frozenReason`) on the balance
	// payload. We render a neutral banner so the user has a path to support
	// without leaking ops-internal language.
	let walletFrozen = false;
	let walletFrozenReason: string | null = null;

	onMount(async () => {
		await Promise.all([loadWalletBalance(), loadBankAccounts(), loadEarnings(), loadWithdrawals(), loadKyc(), loadWalletTransactions()]);
	});

	async function loadWalletBalance() {
		loadingBalance = true;
		try {
			const wallet = await getWalletBalance();
			// Backend stores all balances in integer minor units (kobo / cents).
			// Read each currency bucket independently — never coerce to NGN.
			const balance = wallet?.balance ?? {};
			const reserved = wallet?.reservedBalance ?? {};
			// P4-05: disputedReserve is the slice held back during open disputes.
			// Until the backend ships it, this is 0 across the board — we keep
			// the read defensive so future rollouts pick it up automatically.
			const disputed = wallet?.disputedReserve ?? wallet?.disputedBalance ?? {};
			balancesByCurrency = {
				NGN: Number(balance.NGN ?? 0),
				USD: Number(balance.USD ?? 0),
				ETH: Number(balance.ETH ?? 0),
			};
			reservedByCurrency = {
				NGN: Number(reserved.NGN ?? 0),
				USD: Number(reserved.USD ?? 0),
				ETH: Number(reserved.ETH ?? 0),
			};
			disputedReserveByCurrency = {
				NGN: Number(disputed.NGN ?? 0),
				USD: Number(disputed.USD ?? 0),
				ETH: Number(disputed.ETH ?? 0),
			};
			// FE-P4-01 — pick up the frozen flag from the wallet payload.
			walletFrozen = Boolean(wallet?.frozen);
			walletFrozenReason = wallet?.frozenReason ?? null;
			// FE-P1-04: prefer a backend-supplied `availableBalance` envelope
			// (P3-12) when present; fall back to balance − reserved − disputed
			// so the UI never promises more than the wallet controller will
			// allow. P1-05 keeps the canonical source of truth on the server.
			const available = wallet?.availableBalance ?? null;
			if (available && typeof available === 'object') {
				withdrawableByCurrency = {
					NGN: Math.max(0, Number(available.NGN ?? 0)),
					USD: Math.max(0, Number(available.USD ?? 0)),
					ETH: Math.max(0, Number(available.ETH ?? 0)),
				};
			} else {
				withdrawableByCurrency = {
					NGN: Math.max(0, balancesByCurrency.NGN - reservedByCurrency.NGN - disputedReserveByCurrency.NGN),
					USD: Math.max(0, balancesByCurrency.USD - reservedByCurrency.USD - disputedReserveByCurrency.USD),
					ETH: Math.max(0, balancesByCurrency.ETH - reservedByCurrency.ETH - disputedReserveByCurrency.ETH),
				};
			}
			// Pick the first non-zero currency as active so users don't land
			// on a currency that doesn't apply to them.
			const firstNonZero = CURRENCIES.find((c) => balancesByCurrency[c] > 0);
			if (firstNonZero) activeCurrency = firstNonZero;
		} catch (e: any) {
			console.error('Failed to load wallet balance:', e);
		} finally {
			loadingBalance = false;
		}
	}

	async function loadBankAccounts() {
		try {
			const result: any = await getBankAccounts();
			const items = Array.isArray(result) ? result : result?.items ?? result?.data?.items ?? result?.data ?? [];
			bankAccounts = items.map((b: any) => ({
				id: b.id ?? b._id, bankName: b.bankName, accountNumber: b.accountNumber, accountName: b.accountName
			}));
			if (bankAccounts.length > 0 && !selectedBankId) selectedBankId = bankAccounts[0].id;
		} catch (e: any) {
			console.error('Failed to load bank accounts:', e);
		}
	}

	async function loadEarnings() {
		loadingEarnings = true;
		try {
			const result = await getEarningsSummary({ tz: timezone });
			const items = Array.isArray(result) ? result : [];
			const { getEventById } = await import('$lib/services/event.services');
			for (const item of items) {
				if (!item.name && item.eventId) {
					try { const event = await getEventById(item.eventId); item.name = event?.title ?? ''; } catch {}
				}
			}
			eventEarnings = items;
		} catch (e: any) {
			console.error('Failed to load earnings:', e);
		} finally {
			loadingEarnings = false;
		}
	}

	async function loadWithdrawals() {
		loadingWithdrawals = true;
		try {
			// FE-P1-06: pull recent withdrawal transactions so the user sees
			// PROCESSING / COMPLETED / FAILED / REVERSED state machine.
			const result = await getUserTransactions({ type: 'WITHDRAWAL', limit: 10, tz: timezone });
			const items = result?.data?.items ?? result?.data ?? result?.items ?? [];
			withdrawalRows = Array.isArray(items) ? items : [];
		} catch (e: any) {
			console.warn('Failed to load withdrawals:', e?.message);
			withdrawalRows = [];
		} finally {
			loadingWithdrawals = false;
		}
	}

	/**
	 * FE-P3-12 (NEW-2.1 / FA-9.3) — cursor-paginated, ledger-backed wallet
	 * transactions. Falls back to the legacy skip/limit feed when the new
	 * endpoint isn't available in production.
	 */
	async function loadWalletTransactions(cursor: string | null = null) {
		if (cursor) loadingMoreTx = true;
		else loadingWalletTx = true;
		try {
			const page = await getMyWalletTransactions({
				cursor,
				limit: 20,
				currency: txCurrencyFilter || undefined,
				tz: timezone,
			});
			if (cursor) walletTxRows = [...walletTxRows, ...page.items];
			else walletTxRows = page.items;
			walletTxCursor = page.nextCursor;
			walletTxHasMore = page.hasMore;
			useUnifiedFeed = true;
		} catch (e: any) {
			// Endpoint not yet available — degrade gracefully so the page
			// continues to function with the legacy feed.
			console.warn('[wallet] unified transactions endpoint unavailable:', e?.message);
			useUnifiedFeed = false;
		} finally {
			loadingWalletTx = false;
			loadingMoreTx = false;
		}
	}

	async function changeTimezone(tz: string) {
		timezone = tz;
		showTzDropdown = false;
		await Promise.all([loadEarnings(), loadWithdrawals(), loadWalletTransactions()]);
	}

	async function setTxCurrency(ccy: string | '') {
		txCurrencyFilter = ccy;
		await loadWalletTransactions();
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

	// FE-P1-06: per-status badge style for the withdrawals table.
	function getWithdrawalStatusStyle(status: string): { bg: string; tooltip: string; label: string } {
		const s = (status || '').toUpperCase();
		if (s === 'PROCESSING')
			return {
				bg: 'bg-yellow-100 text-yellow-700',
				label: 'Processing',
				tooltip:
					'Bank transfer in progress. Funds typically settle within minutes; the platform watchdog will reconcile if the bank is slow.',
			};
		if (s === 'COMPLETED')
			return { bg: 'bg-green-100 text-green-700', label: 'Completed', tooltip: 'Funds delivered to the destination bank.' };
		if (s === 'FAILED')
			return { bg: 'bg-red-100 text-red-700', label: 'Failed', tooltip: 'The transfer could not be completed. Funds returned to your wallet.' };
		if (s === 'REVERSED')
			return {
				bg: 'bg-blue-100 text-blue-700',
				label: 'Reversed',
				tooltip: 'The bank rejected this transfer. Funds have been credited back to your wallet.',
			};
		if (s === 'PENDING') return { bg: 'bg-gray-100 text-gray-700', label: 'Pending', tooltip: 'Awaiting confirmation.' };
		return { bg: 'bg-gray-100 text-gray-700', label: status || 'Unknown', tooltip: '' };
	}

	function clearWithdrawalState(opts: { keepAmount?: boolean; keepBank?: boolean } = {}) {
		if (!opts.keepAmount) withdrawAmount = '';
		if (!opts.keepBank) selectedBankId = bankAccounts[0]?.id ?? '';
		withdrawPin = '';
		withdrawOtp = '';
		otpSent = false;
		sendingOtp = false;
		withdrawing = false;
		mappedError = null;
		withdrawSuccess = '';
	}

	function applyError(err: any) {
		const code = err?.code ?? err?.data?.code ?? null;
		mappedError = mapWithdrawalError({
			code,
			message: err?.message,
			attemptsRemaining: err?.data?.attemptsRemaining ?? null,
			triesLeft: err?.data?.triesLeft ?? null,
			lockedUntil: err?.data?.lockedUntil ?? null,
		});
		// Steer the user to the right field if the server hinted at one.
		if (mappedError.requireFreshOtp) {
			withdrawOtp = '';
			otpSent = false;
		}
		if (mappedError.resetToPin) {
			withdrawPin = '';
		}
	}

	async function handleRequestOtp() {
		const major = parseFloat(withdrawAmount);
		mappedError = null;
		if (!Number.isFinite(major) || major <= 0) {
			mappedError = { copy: 'Enter a valid amount.' };
			return;
		}
		if (!selectedBankId) {
			mappedError = { copy: 'Select a bank account.' };
			return;
		}
		// Compare against the active currency's withdrawable balance (in major units).
		const withdrawableMajor = koboToMajor(withdrawableByCurrency[activeCurrency], activeCurrency);
		if (major > withdrawableMajor) {
			mappedError = {
				copy: `Amount exceeds withdrawable balance (${formatMoney(
					withdrawableByCurrency[activeCurrency],
					activeCurrency
				)}).`,
			};
			return;
		}
		sendingOtp = true;
		try {
			await requestWithdrawalOtp(major);
			otpSent = true;
		} catch (e: any) {
			applyError(e);
		} finally {
			sendingOtp = false;
		}
	}

	async function handleWithdraw() {
		const major = parseFloat(withdrawAmount);
		mappedError = null;
		// FE-P1-07/08 — collect PIN BEFORE OTP. The backend rejects an
		// OTP-only verify with PIN_REQUIRED; surfacing it here keeps the
		// round-trip count down and makes the lockout copy obvious.
		if (!withdrawPin || withdrawPin.length < 4) {
			mappedError = mapWithdrawalError({ code: 'PIN_REQUIRED' });
			return;
		}
		if (!withdrawOtp || withdrawOtp.length !== 6) {
			mappedError = { copy: 'Enter the 6-digit OTP.' };
			return;
		}
		withdrawing = true;
		try {
			await verifyWithdrawalOtp(withdrawOtp, major, activeCurrency, selectedBankId, withdrawPin);
			const factor = activeCurrency === 'ETH' ? 1_000_000 : 100;
			withdrawSuccess = `${formatMoney(Math.round(major * factor), activeCurrency)} withdrawal initiated successfully`;
			await Promise.all([loadWalletBalance(), loadEarnings(), loadWithdrawals()]);
			setTimeout(() => {
				showWithdrawModal = false;
				clearWithdrawalState();
			}, 2000);
		} catch (e: any) {
			applyError(e);
		} finally {
			withdrawing = false;
		}
	}

	// P1-16: aggregate-view total. Display only — clearly labelled with `≈`
	// in the template. Never used to authorise a payment / withdrawal.
	$: aggregateApprox = (() => {
		let total = 0;
		for (const c of CURRENCIES) {
			const fromUSD: Record<CurrencyKey, number> = { NGN: 1 / 1500, USD: 1, ETH: 3500 };
			const usd = koboToMajor(balancesByCurrency[c], c) * fromUSD[c];
			total += usd;
		}
		const toUSD: Record<CurrencyKey, number> = { NGN: 1 / 1500, USD: 1, ETH: 3500 };
		const inDisplay = total / toUSD[aggregateDisplayCurrency];
		const minor = Math.round(inDisplay * (aggregateDisplayCurrency === 'ETH' ? 1_000_000 : 100));
		return formatMoney(minor, aggregateDisplayCurrency);
	})();
</script>

<div class="mb-12">
	<!-- FE-P4-01 — Wallet may be on hold pending recon review. Neutral copy
	     for the user; ops uses /hq/wallets/:id for the full picture. -->
	{#if walletFrozen}
		<div class="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
			<Icon icon="mdi:snowflake" class="mt-0.5 text-xl text-red-600" />
			<div class="flex-1">
				<p class="text-sm font-semibold text-red-900">Your wallet is temporarily on hold</p>
				<p class="mt-1 text-xs text-red-700">
					{walletFrozenReason ?? "We're verifying recent activity. Withdrawals are paused while the review is in progress."}
					Contact support and we'll get back to you within 24h.
				</p>
				<a href="/help-center?topic=wallet-hold" class="mt-2 inline-block text-xs font-medium text-red-900 underline">
					Contact support
				</a>
			</div>
		</div>
	{/if}

	<!-- P1-16: per-currency balance cards. Each currency stays in its own
	     bucket. The "view all" toggle reveals an approximate aggregated
	     figure that is display-only — never used to authorise actions. -->
	<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
		<div class="flex items-center gap-2">
			{#each CURRENCIES as ccy}
				<button
					on:click={() => (activeCurrency = ccy)}
					class="rounded-full px-3 py-1.5 text-xs font-medium transition {activeCurrency === ccy ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
				>{ccy}</button>
			{/each}
		</div>
		<button
			on:click={() => (showAggregateView = !showAggregateView)}
			class="flex items-center gap-1 rounded-md bg-[#EBECED] px-3 py-1.5 text-xs text-[#616265] hover:bg-gray-200"
			aria-pressed={showAggregateView}
		>
			<Icon icon={showAggregateView ? 'mdi:eye-off-outline' : 'mdi:eye-outline'} class="text-sm" />
			{showAggregateView ? 'Hide aggregate' : 'View all (≈ converted)'}
		</button>
	</div>

	{#if showAggregateView}
		<!-- Display-only aggregate. The `≈` and "Approximate" copy make it
		     unambiguous that this is not authoritative for commerce. -->
		<div class="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
			<div class="flex items-center justify-between gap-3">
				<div>
					<p class="text-xs font-medium text-amber-700">Approximate combined balance</p>
					<p class="mt-1 text-2xl font-semibold text-amber-900">{aggregateApprox}</p>
					<p class="mt-1 text-[11px] text-amber-700">Converted at indicative rates. Use the per-currency cards below to authorise withdrawals.</p>
				</div>
				<div class="flex items-center gap-1">
					{#each CURRENCIES as ccy}
						<button
							on:click={() => (aggregateDisplayCurrency = ccy)}
							class="rounded-md px-2 py-1 text-[11px] font-medium {aggregateDisplayCurrency === ccy ? 'bg-amber-700 text-white' : 'bg-white text-amber-700 hover:bg-amber-100'}"
						>{ccy}</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Balance Cards (per-currency) -->
	<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
		<!-- Total Balance -->
		<div class="rounded-xl border bg-white p-6">
			<div class="mb-1 flex items-center gap-2">
				<p class="text-xs text-gray-500">Total Balance</p>
				<span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">{activeCurrency}</span>
				<button
					type="button"
					class="text-gray-400 hover:text-gray-600"
					aria-label="What's included in Total Balance"
					on:click={() => (showBalanceBreakdown[activeCurrency] = !showBalanceBreakdown[activeCurrency])}
				>
					<Icon icon="mdi:information-outline" class="text-sm" />
				</button>
			</div>
			{#if loadingBalance}
				<div class="mt-1 h-9 w-40 animate-pulse rounded bg-gray-200"></div>
			{:else}
				<p class="mt-1 text-3xl font-semibold">{formatMoney(balancesByCurrency[activeCurrency], activeCurrency)}</p>
			{/if}
			<p class="mt-2 text-xs text-gray-400">Includes reserved and disputed funds</p>
			{#if showBalanceBreakdown[activeCurrency]}
				<div class="mt-3 space-y-1 rounded-lg bg-gray-50 p-3 text-[11px] text-gray-600">
					<div class="flex justify-between"><span>Total balance</span><span class="font-medium">{formatMoney(balancesByCurrency[activeCurrency], activeCurrency)}</span></div>
					<div class="flex justify-between"><span>− Reserved (in-flight withdrawals)</span><span>{formatMoney(reservedByCurrency[activeCurrency], activeCurrency)}</span></div>
					<div class="flex justify-between"><span>− Disputed (pending dispute reserve)</span><span>{formatMoney(disputedReserveByCurrency[activeCurrency], activeCurrency)}</span></div>
					<div class="mt-1 flex justify-between border-t pt-1 font-medium text-gray-900"><span>= Withdrawable</span><span class="text-green-600">{formatMoney(withdrawableByCurrency[activeCurrency], activeCurrency)}</span></div>
				</div>
			{/if}
		</div>

		<!-- Withdrawable Balance -->
		<div class="rounded-xl border bg-white p-6">
			<div class="flex items-start justify-between">
				<div>
					<div class="mb-1 flex items-center gap-2">
						<p class="text-xs text-gray-500">Withdrawable Balance</p>
						<span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">{activeCurrency}</span>
					</div>
					{#if loadingBalance}
						<div class="mt-1 h-9 w-40 animate-pulse rounded bg-gray-200"></div>
					{:else}
						<p class="mt-1 text-3xl font-semibold text-green-600">{formatMoney(withdrawableByCurrency[activeCurrency], activeCurrency)}</p>
					{/if}
					<p class="mt-2 text-xs text-gray-400">Available for withdrawal · excludes reserved &amp; disputed funds</p>
				</div>
				{#if $kycStore.loaded && $kycStore.tier === 'UNVERIFIED' && $kycStore.status !== 'PENDING_REVIEW'}
					<button
						on:click={() => goto('/account/kyc/start')}
						class="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
					>
						Verify to withdraw
					</button>
				{:else if $kycStore.loaded && $kycStore.tier === 'UNVERIFIED' && $kycStore.status === 'PENDING_REVIEW'}
					<span class="rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
						Under review
					</span>
				{:else}
					<button
						on:click={() => { clearWithdrawalState(); showWithdrawModal = true; }}
						disabled={withdrawableByCurrency[activeCurrency] === 0 || walletFrozen}
						class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
					>
						Withdraw
					</button>
				{/if}
			</div>
			<!-- FE-P2-07/09: KYC + AML pre-flight banners -->
			{#if $kycStore.loaded && $kycStore.tier === 'UNVERIFIED' && $kycStore.status !== 'PENDING_REVIEW'}
				<div class="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs">
					<Icon icon="mdi:shield-account-outline" class="mt-0.5 text-amber-600" />
					<p class="text-amber-800">
						Verify your identity to enable withdrawals.
						<a href="/account/kyc/start" class="font-medium text-amber-900 underline">Start verification</a>
					</p>
				</div>
			{:else if $kycStore.loaded && $kycStore.tier === 'UNVERIFIED' && $kycStore.status === 'PENDING_REVIEW'}
				<div class="mt-3 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-2 text-xs">
					<Icon icon="mdi:clock-outline" class="mt-0.5 text-blue-600" />
					<p class="text-blue-800">
						Your identity verification is under review. Withdrawals will be enabled once approved (typically within 24 hours).
					</p>
				</div>
			{:else if $kycStore.loaded && $kycStore.tier === 'BASIC' && $kycStore.dailyLimitKobo}
				<div class="mt-3 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-2 text-xs">
					<Icon icon="mdi:gauge" class="mt-0.5 text-blue-600" />
					<p class="text-blue-800">
						Daily limit {formatMoney($kycStore.dailyLimitKobo, activeCurrency)}
						{#if typeof $kycStore.dailyUsageKobo === 'number'}
							· used today {formatMoney($kycStore.dailyUsageKobo, activeCurrency)}
						{/if}
						·
						<a href="/account/kyc/start" class="font-medium text-blue-900 underline">Upgrade KYC</a>
					</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- FE-P1-06: Withdrawals state machine -->
	{#if !loadingWithdrawals && withdrawalRows.length > 0}
		<div class="mb-8 border-t pt-8">
			<div class="mb-4">
				<h2 class="text-lg font-semibold">Recent Withdrawals</h2>
				<p class="text-sm text-[#8C8F93]">Track the status of recent transfers.</p>
			</div>
			<div class="overflow-visible rounded-xl bg-white shadow-sm">
				<div class="hidden border-b px-4 py-3 text-xs font-medium text-gray-400 lg:flex">
					<div class="w-1/4">Date</div>
					<div class="w-1/4">Bank / Reference</div>
					<div class="w-1/4">Status</div>
					<div class="w-1/4 text-right">Amount</div>
				</div>
				{#each withdrawalRows as row}
					{@const status = getWithdrawalStatusStyle(row.settlementStatus ?? row.status ?? row.withdrawalStatus)}
					<div class="flex flex-col gap-2 border-b px-4 py-3 last:border-none lg:flex-row lg:items-center lg:gap-0">
						<div class="text-sm text-gray-500 lg:w-1/4">{row.createdAt ? formatDate(row.createdAt) : '—'}</div>
						<div class="text-sm text-gray-700 lg:w-1/4">
							<p class="truncate">{row.bankName ?? row.beneficiary?.bankName ?? row.reference ?? '—'}</p>
							{#if row.accountNumber || row.beneficiary?.accountNumber}
								<p class="truncate text-xs text-gray-400">··{(row.accountNumber ?? row.beneficiary?.accountNumber ?? '').slice(-4)}</p>
							{/if}
						</div>
						<div class="lg:w-1/4">
							<span class="rounded-full px-2 py-1 text-xs font-medium {status.bg}" title={status.tooltip}>{status.label}</span>
						</div>
						<div class="text-sm font-medium lg:w-1/4 lg:text-right">{formatMoney(row.amount ?? 0, row.currency ?? activeCurrency)}</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

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
						<div class="text-sm font-medium lg:w-1/6 lg:text-right">{formatMoney(e.netAmount ?? e.amount, e.currency ?? activeCurrency)}</div>
						<div class="lg:w-1/6 lg:text-right">
							{#if e.eventId}
								<button on:click={() => goto(`/events/${e.eventId}/earnings`)} class="rounded-md bg-[#EBECED] px-3 py-1.5 text-xs font-medium text-[#616265] hover:bg-gray-200">View</button>
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

	<!-- FE-P3-12 — Unified, ledger-backed wallet transactions feed. -->
	{#if useUnifiedFeed}
		<div class="mt-10 border-t pt-8">
			<div class="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
				<div>
					<h2 class="text-lg font-semibold">Wallet Transactions</h2>
					<p class="text-sm text-[#8C8F93]">Every credit and debit, sourced from the canonical ledger.</p>
				</div>
				<div class="flex items-center gap-2">
					<select
						bind:value={txCurrencyFilter}
						on:change={() => setTxCurrency(txCurrencyFilter)}
						class="rounded-md bg-[#EBECED] px-2 py-1.5 text-xs text-[#616265]"
					>
						<option value="">All currencies</option>
						<option value="NGN">NGN</option>
						<option value="USD">USD</option>
						<option value="ETH">ETH</option>
					</select>
				</div>
			</div>

			{#if receiptError}
				<div class="mb-3 flex items-start justify-between rounded-md bg-yellow-50 p-3 text-xs text-yellow-700">
					<span>{receiptError}</span>
					<button on:click={() => (receiptError = '')} aria-label="Dismiss"><Icon icon="mdi:close" /></button>
				</div>
			{/if}

			{#if loadingWalletTx}
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
			{:else if walletTxRows.length > 0}
				<div class="overflow-visible rounded-xl bg-white shadow-sm">
					<div class="hidden border-b px-4 py-3 text-xs font-medium text-gray-400 lg:flex">
						<div class="w-1/4">Date</div>
						<div class="w-1/4">Type</div>
						<div class="w-1/5">Status</div>
						<div class="w-1/5 text-right">Amount</div>
						<div class="w-[10%] text-right">Receipt</div>
					</div>
					{#each walletTxRows as row}
						<div class="flex flex-col gap-2 border-b px-4 py-3 last:border-none lg:flex-row lg:items-center lg:gap-0">
							<div class="text-sm text-gray-500 lg:w-1/4">{row.createdAt ? formatDate(row.createdAt) : '—'}</div>
							<div class="text-sm text-gray-700 lg:w-1/4">
								<p class="capitalize">{(row.type ?? row.transactionType ?? '—').toString().toLowerCase().replace(/_/g, ' ')}</p>
								{#if row.description}<p class="truncate text-xs text-gray-400">{row.description}</p>{/if}
							</div>
							<div class="lg:w-1/5">
								<span class="rounded-full px-2 py-1 text-xs font-medium {getStatusStyle(row.status ?? '')}">{row.status ?? '—'}</span>
							</div>
							<div class="text-sm font-medium lg:w-1/5 lg:text-right {(row.direction ?? '').toUpperCase() === 'DEBIT' ? 'text-red-500' : 'text-green-600'}">
								{(row.direction ?? '').toUpperCase() === 'DEBIT' ? '-' : '+'}{formatMoney(row.amountKobo ?? row.amount ?? 0, row.currency ?? activeCurrency)}
							</div>
							<!-- FE-P4-04 — Receipt link. Server returns presigned URL on click. -->
							<div class="text-xs lg:w-[10%] lg:text-right">
								{#if row.transactionId || row.id}
									<button
										on:click={() => openReceipt(row.transactionId ?? row.id, { onError: (m) => (receiptError = m) })}
										class="inline-flex items-center gap-1 text-pink-600 hover:underline"
										title="Open the PDF receipt for this transaction. Generated within 60s of payment."
									>
										<Icon icon="mdi:receipt-text-outline" class="text-sm" /> Receipt
									</button>
								{/if}
							</div>
						</div>
					{/each}
					{#if walletTxHasMore}
						<div class="flex justify-center border-t px-4 py-3">
							<button
								on:click={() => loadWalletTransactions(walletTxCursor)}
								disabled={loadingMoreTx}
								class="rounded-md bg-[#EBECED] px-3 py-1.5 text-xs text-[#616265] hover:bg-gray-200 disabled:opacity-40"
							>
								{loadingMoreTx ? 'Loading…' : 'Load more'}
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<div class="flex h-40 flex-col items-center justify-center rounded-xl bg-white">
					<Icon icon="mdi:scale-balance" class="mb-2 text-4xl text-gray-300" />
					<p class="text-sm text-[#A2ACB2]">No transactions yet.</p>
				</div>
			{/if}
		</div>
	{/if}

	<!-- FE-P3-07 — TZ footer + dropdown. -->
	<div class="mt-6 flex items-center justify-end gap-2 text-xs text-gray-500">
		<span title="All amounts are stored in UTC. Times are converted to your selected zone for display only.">
			Showing data in {timezone}
		</span>
		<div use:clickOutside={() => (showTzDropdown = false)} class="relative">
			<button on:click={() => (showTzDropdown = !showTzDropdown)} class="flex items-center gap-1 rounded-md bg-[#EBECED] px-2 py-1 text-xs text-[#616265]">
				<Icon icon="mdi:earth" class="text-sm" /> Change
			</button>
			{#if showTzDropdown}
				<div class="absolute right-0 z-20 mt-1 max-h-72 w-56 overflow-auto rounded-lg border bg-white shadow-lg">
					{#each COMMON_TIMEZONES as tz}
						<button on:click={() => changeTimezone(tz.value)} class="block w-full px-3 py-2 text-left text-xs hover:bg-gray-50 {timezone === tz.value ? 'font-medium text-pink-600' : ''}">{tz.label}</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Withdraw Modal — FE-P1-07/08: PIN + OTP both required -->
{#if showWithdrawModal}
<div on:click={() => (showWithdrawModal = false)} on:keydown={(e) => e.key === 'Escape' && (showWithdrawModal = false)} class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3" role="dialog" aria-modal="true" tabindex="-1">
<div class="w-full max-w-md overflow-hidden rounded-xl bg-[#F4F5F6] shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
	<div class="px-6 py-6">
		<div class="mb-1 flex items-center justify-between">
			<h2 class="text-xl font-semibold">Withdraw Funds</h2>
			<button on:click={() => (showWithdrawModal = false)}><Icon icon="mdi:close" class="text-xl text-gray-400" /></button>
		</div>
		<p class="mb-5 text-sm text-gray-500">Available: {formatMoney(withdrawableByCurrency[activeCurrency], activeCurrency)}</p>

		{#if mappedError}
			<div class="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-600">
				<p class="font-medium">{mappedError.copy}</p>
				{#if mappedError.hint}<p class="mt-0.5 text-xs">{mappedError.hint}</p>{/if}
				{#if mappedError.actionHref && mappedError.actionLabel}
					<a href={mappedError.actionHref} class="mt-1 inline-flex items-center gap-1 text-xs font-medium text-red-700 underline">
						{mappedError.actionLabel} <Icon icon="mdi:arrow-right" class="text-sm" />
					</a>
				{/if}
			</div>
		{/if}
		{#if withdrawSuccess}<p class="mb-3 rounded-md bg-green-50 p-3 text-sm text-green-600">{withdrawSuccess}</p>{/if}

		<div class="mb-4">
			<label for="withdraw-bank" class="mb-1 block text-sm font-medium text-gray-700">Bank Account</label>
			{#if bankAccounts.length > 0}
				<select id="withdraw-bank" bind:value={selectedBankId} class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none">
					{#each bankAccounts as bank}
						<option value={bank.id}>{bank.bankName} · {bank.accountNumber}</option>
					{/each}
				</select>
			{:else}
				<p class="text-sm text-gray-400">No bank accounts. <a href="/settings?tab=payments" class="font-medium text-pink-600">Add one</a></p>
			{/if}
		</div>

		<div class="mb-4">
			<label for="withdraw-amount" class="mb-1 block text-sm font-medium text-gray-700">Amount</label>
			<input id="withdraw-amount" type="number" bind:value={withdrawAmount} placeholder="Enter amount" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none" />
		</div>

		{#if withdrawAmount && parseFloat(withdrawAmount) > 0}
			{@const amt = parseFloat(withdrawAmount)}
			{@const rawFee = amt * 0.03}
			{@const fee = Math.min(rawFee, 500)}
			{@const youReceive = amt - fee}
			{@const factor = activeCurrency === 'ETH' ? 1_000_000 : 100}
			<div class="mb-4 rounded-lg border border-gray-200 bg-white p-3 text-sm">
				<div class="flex justify-between text-gray-500">
					<span>Withdrawal Fee (3%, max {formatMoney(500 * factor, activeCurrency)})</span>
					<span class="text-red-500">-{formatMoney(Math.round(fee * factor), activeCurrency)}</span>
				</div>
				<div class="mt-1 flex justify-between border-t pt-1 font-medium">
					<span>You'll receive</span>
					<span class="text-green-600">{formatMoney(Math.round((youReceive > 0 ? youReceive : 0) * factor), activeCurrency)}</span>
				</div>
			</div>
		{/if}

		<!-- FE-P1-07/08 — PIN field FIRST. Backend rejects OTP-only verifies
		     with PIN_REQUIRED, and the PIN can lock independently of the OTP
		     (PIN_LOCKED → 423). Surfacing it before OTP keeps round-trips
		     down and makes lockout copy obvious. -->
		<div class="mb-4">
			<label for="withdraw-pin" class="mb-1 block text-sm font-medium text-gray-700">Wallet PIN</label>
			<input
				id="withdraw-pin"
				type="password"
				inputmode="numeric"
				autocomplete="off"
				maxlength="6"
				bind:value={withdrawPin}
				placeholder="Enter your 4–6 digit PIN"
				class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none"
			/>
			<p class="mt-1 text-[11px] text-gray-400">
				<a href="/settings?tab=security" class="font-medium text-pink-600 hover:underline">Forgot PIN?</a>
			</p>
		</div>

		{#if !otpSent}
			<button
				on:click={handleRequestOtp}
				disabled={sendingOtp || bankAccounts.length === 0 || !withdrawAmount || !withdrawPin}
				class="w-full rounded-lg bg-gray-900 py-3 text-center font-medium text-white disabled:opacity-50"
			>
				{sendingOtp ? 'Sending OTP...' : 'Send OTP to Email'}
			</button>
		{:else}
			<div class="mb-4">
				<label for="withdraw-otp" class="mb-1 block text-sm font-medium text-gray-700">Enter OTP</label>
				<p class="mb-2 text-xs text-gray-400">A 6-digit code was sent to your email</p>
				<input
					id="withdraw-otp"
					type="text"
					inputmode="numeric"
					autocomplete="one-time-code"
					bind:value={withdrawOtp}
					placeholder="Enter 6-digit OTP"
					maxlength="6"
					class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-center text-lg font-mono tracking-widest focus:outline-none"
				/>
			</div>
			<div class="flex gap-2">
				<button on:click={handleRequestOtp} disabled={sendingOtp}
					class="flex-1 rounded-lg border border-gray-200 py-3 text-center text-sm font-medium text-gray-600 disabled:opacity-50">
					{sendingOtp ? 'Resending...' : 'Resend OTP'}
				</button>
				<button
					on:click={handleWithdraw}
					disabled={withdrawing || withdrawOtp.length !== 6 || !withdrawPin}
					class="flex-1 rounded-lg bg-gray-900 py-3 text-center font-medium text-white disabled:opacity-50"
				>
					{withdrawing ? 'Processing...' : 'Confirm Withdrawal'}
				</button>
			</div>
		{/if}
	</div>
</div>
</div>
{/if}
