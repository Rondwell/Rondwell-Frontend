<script lang="ts">
	/**
	 * /subscription — Standalone subscription management page.
	 *
	 * Entry points:
	 *   - Pricing page "Get Rondwell Plus" button (logged-in users)
	 *   - Overview page subscription tier card "Manage" button
	 *   - Settings → Subscription tab "Upgrade to PLUS" button
	 *   - Post-auth redirect after registration from pricing page
	 *
	 * This page surfaces the full subscription lifecycle:
	 *   - Current plan + status
	 *   - Upgrade flow (Paystack checkout via proration/initiate)
	 *   - Downgrade / cancel-at-period-end
	 *   - Billing cycle switch (monthly ↔ yearly) with proration preview
	 *   - Free trial activation
	 *   - Billing history
	 *
	 * Backend endpoints used:
	 *   - GET  /api/v1/payment/subscription/my-tier
	 *   - GET  /api/v1/payment/subscription/plans
	 *   - POST /api/v1/payment/subscription/proration/preview
	 *   - POST /api/v1/payment/subscription/proration/initiate
	 *   - POST /api/v1/payment/subscription/cancel
	 *   - POST /api/v1/payment/subscription/free-trial
	 */
	import { goto } from '$app/navigation';
	import {
		cancelSubscription,
		initiateProration,
		previewProration,
	} from '$lib/services/subscription.services';
	import {
		daysUntilRenewal,
		isCanceledScheduled,
		isComp,
		isPastDue,
		isPlusUser,
		isTrialing,
		loadSubscription,
		subscriptionStore,
	} from '$lib/stores/subscription.store';
	import { authState } from '$lib/stores/auth.store';
	import { loadUsage, usageStore } from '$lib/stores/usage.store';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let cancelling = false;
	let cancelError = '';
	let cancelSuccess = '';
	let showCancelConfirm = false;
	let upgradeSuccess = false;

	// Upgrade flow state
	let upgrading = false;
	let upgradeCycle: 'MONTHLY' | 'YEARLY' = 'YEARLY';
	let upgradeCurrency: 'NGN' | 'USD' = 'NGN';
	let upgradeError = '';

	$: userEmail = $authState.user?.email || '';

	// Proration / billing cycle switch
	let switchingCycle = false;
	let switchTarget: 'MONTHLY' | 'YEARLY' = 'YEARLY';
	let switchCurrency: 'NGN' | 'USD' = 'NGN';
	let prorationPreview: any = null;
	let switchError = '';

	// Plans data (for showing pricing on upgrade card)
	let plusMonthlyNGN = 1_200_000; // kobo fallback (₦12,000)
	let plusYearlyNGN = 12_000_000; // ₦120,000
	let plusMonthlyUSD = 800; // cents fallback ($8)
	let plusYearlyUSD = 8_000; // $80
	let plansLoaded = false;

	onMount(async () => {
		await loadSubscription(true);
		loadUsage();
		// Fetch plans for pricing display
		try {
			const BASE_URL = import.meta.env.VITE_API_URL;
			const res = await fetch(`${BASE_URL}/api/v1/payment/subscription/plans`);
			const data = await res.json();
			const plans = data.data ?? [];
			for (const p of plans) {
				if (p.planId === 'PLUS') {
					const byCurrency = p.pricing?.byCurrency;
					plusMonthlyNGN = byCurrency?.NGN?.monthly ?? p.pricing?.monthly ?? 1_200_000;
					plusYearlyNGN = byCurrency?.NGN?.yearly ?? p.pricing?.yearly ?? 12_000_000;
					plusMonthlyUSD = byCurrency?.USD?.monthly ?? 800;
					plusYearlyUSD = byCurrency?.USD?.yearly ?? 8_000;
				}
			}
		} catch { /* use defaults */ }
		plansLoaded = true;
	});

	function formatDate(iso: string | null): string {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleDateString(undefined, {
				month: 'long',
				day: 'numeric',
				year: 'numeric',
			});
		} catch {
			return '—';
		}
	}

	function fmtPrice(kobo: number, ccy: 'NGN' | 'USD'): string {
		const major = (kobo ?? 0) / 100;
		const sym = ccy === 'NGN' ? '₦' : '$';
		return `${sym}${major.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
	}

	// Upgrade handler — uses Paystack inline popup
	async function handleUpgrade() {
		upgrading = true;
		upgradeError = '';
		try {
			const result = await initiateProration({
				targetPlan: 'PLUS',
				billingCycle: upgradeCycle,
				currency: upgradeCurrency,
			});
			const data = result?.data;
			const ref = data?.reference || data?.transactionId;
			const pubKey = data?.paystackPublicKey || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';
			const amount = data?.amount || data?.chargeKobo;

			if (data?.requiresPayment && ref && pubKey) {
				// Use Paystack inline popup
				await loadPaystackScript();
				const handler = (window as any).PaystackPop.setup({
					key: pubKey,
					email: userEmail,
					amount: amount,
					currency: data.currency || upgradeCurrency,
					ref: ref,
					channels: ['card', 'bank', 'ussd', 'bank_transfer'],
					callback: async (_response: any) => {
						// Payment successful — refresh subscription state
						upgradeSuccess = true;
						await loadSubscription(true);
						upgrading = false;
					},
					onClose: () => {
						upgradeError = 'Payment window was closed. You can try again.';
						upgrading = false;
					},
				});
				handler.openIframe();
			} else if (data?.checkoutUrl) {
				// Fallback to redirect if inline data not available
				window.location.href = data.checkoutUrl;
			} else {
				// No payment needed (credit covered it)
				upgradeSuccess = true;
				await loadSubscription(true);
			}
		} catch (e: any) {
			upgradeError = financialErrorMessage(e);
			upgrading = false;
		}
	}

	function loadPaystackScript(): Promise<void> {
		return new Promise((resolve, reject) => {
			if ((window as any).PaystackPop) { resolve(); return; }
			const script = document.createElement('script');
			script.src = 'https://js.paystack.co/v2/inline.js';
			script.onload = () => resolve();
			script.onerror = () => reject(new Error('Failed to load Paystack script'));
			document.head.appendChild(script);
		});
	}

	async function handleCancel() {
		cancelling = true;
		cancelError = '';
		cancelSuccess = '';
		try {
			const result = await cancelSubscription();
			cancelSuccess =
				result?.message ||
				'Subscription will end at the end of your current period. You keep PLUS benefits until then.';
			showCancelConfirm = false;
			await loadSubscription(true);
		} catch (e: any) {
			cancelError = e?.message ?? 'Failed to cancel subscription. Please try again.';
		} finally {
			cancelling = false;
		}
	}

	async function handlePreviewSwitch(target: 'MONTHLY' | 'YEARLY') {
		switchTarget = target;
		switchError = '';
		prorationPreview = null;
		switchingCycle = true;
		try {
			prorationPreview = await previewProration({
				targetPlan: 'PLUS',
				billingCycle: target,
				currency: switchCurrency,
			});
		} catch (e: any) {
			switchError = financialErrorMessage(e);
		} finally {
			switchingCycle = false;
		}
	}

	async function handleConfirmSwitch() {
		switchingCycle = true;
		switchError = '';
		try {
			const result = await initiateProration({
				targetPlan: 'PLUS',
				billingCycle: switchTarget,
				currency: switchCurrency,
			});
			if (result?.data?.checkoutUrl) {
				window.location.href = result.data.checkoutUrl;
				return;
			}
			await loadSubscription(true);
			prorationPreview = null;
		} catch (e: any) {
			switchError = financialErrorMessage(e);
		} finally {
			switchingCycle = false;
		}
	}

	$: status = $subscriptionStore.subscriptionStatus;
	$: tierLabel = $subscriptionStore.tier === 'PLUS' ? 'Rondwell PLUS' : 'Rondwell FREE';

	// Usage rows
	const USAGE_LABELS: Record<string, string> = {
		maxParticipantsPerEvent: 'Participants per event',
		maxAdminsPerEvent: 'Admins per event',
		maxVendorsPerEvent: 'Vendors per event',
		maxSpeakersPerEvent: 'Speakers per event',
		maxExhibitorsPerEvent: 'Exhibitors per event',
		maxCollections: 'Collections',
		seatingLayoutEvents: 'Seating-layout events',
		activePaidEvents: 'Active paid events',
		emails: 'Emails this period',
		aiPrompts: 'AI prompts this period',
	};

	function usageRows(snapshot: typeof $usageStore) {
		const out: Array<{ key: string; label: string; current: number; limit: number }> = [];
		for (const [key, limit] of Object.entries(snapshot.limits)) {
			out.push({
				key,
				label: USAGE_LABELS[key] ?? key,
				current: snapshot.usage[key] ?? 0,
				limit: limit as number,
			});
		}
		return out;
	}
</script>

<svelte:head>
	<title>Subscription | Rondwell</title>
	<meta name="description" content="Manage your Rondwell subscription plan, billing, and usage." />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="mx-auto w-full max-w-4xl px-4 py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-semibold text-gray-900">Subscription</h1>
		<p class="mt-1 text-sm text-gray-500">Manage your plan, billing cycle, and usage limits.</p>
	</div>

	{#if !$subscriptionStore.loaded}
		<div class="space-y-4">
			<div class="h-40 animate-pulse rounded-xl bg-gray-100"></div>
			<div class="h-32 animate-pulse rounded-xl bg-gray-100"></div>
		</div>
	{:else}
		<!-- Current Plan Card -->
		<div
			class="mb-6 rounded-xl border p-6 {$isPlusUser
				? 'border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50'
				: 'border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100'}"
		>
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div>
					<div class="flex items-center gap-3">
						<Icon
							icon={$isPlusUser ? 'mdi:star-circle' : 'mdi:account-circle-outline'}
							class={$isPlusUser ? 'text-3xl text-pink-500' : 'text-3xl text-gray-400'}
						/>
						<h2 class="text-2xl font-bold text-gray-900">{tierLabel}</h2>
						{#if status}
							<span
								class="rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide
								{status === 'ACTIVE' ? 'bg-green-100 text-green-700' : ''}
								{status === 'TRIALING' ? 'bg-blue-100 text-blue-700' : ''}
								{status === 'PAST_DUE' ? 'bg-red-100 text-red-700' : ''}
								{status === 'CANCELED' ? 'bg-gray-200 text-gray-700' : ''}
								{status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : ''}"
							>
								{status.toLowerCase().replace('_', ' ')}
							</span>
						{/if}
					</div>
					{#if $isPlusUser && $subscriptionStore.billingCycle}
						<p class="mt-2 text-sm text-gray-500">
							Billed {$subscriptionStore.billingCycle.toLowerCase()}
							{#if $subscriptionStore.currency} · {$subscriptionStore.currency}{/if}
						</p>
					{:else if !$isPlusUser}
						<p class="mt-2 text-sm text-gray-500">
							Upgrade to PLUS to lower your platform fee and unlock unlimited features.
						</p>
					{/if}
				</div>
				<div class="text-right">
					<p class="text-[11px] uppercase tracking-wide text-gray-500">Platform fee</p>
					<p class="text-2xl font-bold text-gray-900">{$subscriptionStore.feePercent}%</p>
				</div>
			</div>
		</div>

		<!-- Lifecycle Banners -->
		{#if status === 'ACTIVE' && $isComp}
			<div class="mb-4 flex items-start gap-3 rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm">
				<Icon icon="mdi:gift-outline" class="mt-0.5 shrink-0 text-lg text-purple-600" />
				<div>
					<p class="font-medium text-purple-900">Complimentary Rondwell PLUS</p>
					<p class="mt-0.5 text-purple-800">
						Granted by the Rondwell team — no charge. You keep PLUS benefits until {formatDate($subscriptionStore.currentPeriodEnd)}, then your account moves to FREE.
					</p>
				</div>
			</div>
		{:else if status === 'ACTIVE' && $isCanceledScheduled}
			<div class="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
				<Icon icon="mdi:clock-alert-outline" class="mt-0.5 shrink-0 text-lg text-amber-600" />
				<div>
					<p class="font-medium text-amber-900">
						Subscription expires {$daysUntilRenewal !== null ? `in ${$daysUntilRenewal} day${$daysUntilRenewal === 1 ? '' : 's'}` : 'soon'}.
					</p>
					<p class="mt-0.5 text-amber-800">
						PLUS benefits remain active until {formatDate($subscriptionStore.currentPeriodEnd)}, then your account moves to FREE.
					</p>
				</div>
			</div>
		{:else if status === 'ACTIVE' && $subscriptionStore.currentPeriodEnd}
			<div class="mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
				<Icon icon="mdi:autorenew" class="mt-0.5 shrink-0 text-lg text-emerald-600" />
				<div>
					<p class="font-medium text-emerald-900">Renews on {formatDate($subscriptionStore.currentPeriodEnd)}</p>
					<p class="mt-0.5 text-emerald-800">We'll charge your saved payment method automatically. Cancel anytime.</p>
				</div>
			</div>
		{/if}

		{#if $isPastDue}
			<div class="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm">
				<Icon icon="mdi:credit-card-off-outline" class="mt-0.5 shrink-0 text-lg text-red-600" />
				<div class="flex-1">
					<p class="font-medium text-red-900">Payment failed</p>
					<p class="mt-0.5 text-red-800">We couldn't charge your card. We'll retry on +1, +3, and +7 days.</p>
					<button
						on:click={handleUpgrade}
						class="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
					>
						Renew now
					</button>
				</div>
			</div>
		{/if}

		{#if $isTrialing && $subscriptionStore.trialEndsAt}
			<div class="mb-4 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">
				<Icon icon="mdi:gift-outline" class="mt-0.5 shrink-0 text-lg text-blue-600" />
				<div class="flex-1">
					<p class="font-medium text-blue-900">Free trial active</p>
					<p class="mt-0.5 text-blue-800">
						Your trial ends on {formatDate($subscriptionStore.trialEndsAt)}. After that, your account moves to the FREE tier unless you upgrade.
					</p>
					<button
						on:click={() => (showCancelConfirm = true)}
						class="mt-3 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
					>
						Cancel trial
					</button>
				</div>
			</div>
		{/if}

		<!-- Upgrade success banner -->
		{#if upgradeSuccess}
			<div class="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-5">
				<Icon icon="mdi:check-circle" class="mt-0.5 shrink-0 text-2xl text-green-600" />
				<div>
					<p class="text-lg font-semibold text-green-900">You're now on Rondwell Plus!</p>
					<p class="mt-1 text-sm text-green-800">
						Your subscription is active. Enjoy lower fees, unlimited events, and priority support.
					</p>
				</div>
			</div>
		{/if}

		<!-- Upgrade Card (shown for FREE users who are NOT trialing) -->
		{#if !$isPlusUser && !$isTrialing && !upgradeSuccess}
			<div class="mb-6 rounded-xl border border-pink-200 bg-white p-6 shadow-sm">
				<div class="mb-4 flex items-center justify-between">
					<div>
						<h3 class="text-lg font-semibold text-pink-600">Upgrade to Rondwell Plus</h3>
						<p class="mt-0.5 text-sm text-gray-500">Lower fees, unlimited events, priority support.</p>
					</div>
					<div class="flex gap-1 rounded-md bg-gray-100 p-1 text-xs">
						<button
							class="rounded px-2.5 py-1 transition {upgradeCycle === 'MONTHLY' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}"
							on:click={() => (upgradeCycle = 'MONTHLY')}
						>Monthly</button>
						<button
							class="rounded px-2.5 py-1 transition {upgradeCycle === 'YEARLY' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}"
							on:click={() => (upgradeCycle = 'YEARLY')}
						>Annual</button>
					</div>
				</div>

				<!-- Currency toggle -->
				<div class="mb-4 flex gap-1 rounded-full bg-gray-100 p-1 text-xs w-fit">
					<button class="rounded-full px-3 py-1 transition {upgradeCurrency === 'NGN' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}" on:click={() => (upgradeCurrency = 'NGN')}>NGN</button>
					<button class="rounded-full px-3 py-1 transition {upgradeCurrency === 'USD' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}" on:click={() => (upgradeCurrency = 'USD')}>USD</button>
				</div>

				<div class="mb-4 flex items-baseline gap-2">
					<span class="text-3xl font-bold text-gray-900">
						{#if upgradeCurrency === 'NGN'}
							{fmtPrice(upgradeCycle === 'YEARLY' ? Math.round(plusYearlyNGN / 12) : plusMonthlyNGN, 'NGN')}
						{:else}
							{fmtPrice(upgradeCycle === 'YEARLY' ? Math.round(plusYearlyUSD / 12) : plusMonthlyUSD, 'USD')}
						{/if}
					</span>
					<span class="text-sm text-gray-500">/month{upgradeCycle === 'YEARLY' ? ', billed annually' : ''}</span>
					{#if upgradeCycle === 'YEARLY'}
						<span class="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">Save 17%</span>
					{/if}
				</div>

				<ul class="mb-5 space-y-2 text-sm text-gray-700">
					<li class="flex items-center gap-2"><Icon icon="mdi:check-circle" class="text-pink-500" /> 1% platform fee (vs 4%)</li>
					<li class="flex items-center gap-2"><Icon icon="mdi:check-circle" class="text-pink-500" /> Unlimited active paid events</li>
					<li class="flex items-center gap-2"><Icon icon="mdi:check-circle" class="text-pink-500" /> Unlimited participants per event</li>
					<li class="flex items-center gap-2"><Icon icon="mdi:check-circle" class="text-pink-500" /> 50 AI prompts/month</li>
					<li class="flex items-center gap-2"><Icon icon="mdi:check-circle" class="text-pink-500" /> Priority support + API access</li>
				</ul>

				{#if upgradeError}
					<p class="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-600">{upgradeError}</p>
				{/if}

				<div class="flex flex-wrap gap-3">
					<button
						on:click={handleUpgrade}
						disabled={upgrading}
						class="rounded-lg bg-pink-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-50"
					>
						{upgrading ? 'Processing…' : 'Upgrade Now'}
					</button>
				</div>
			</div>
		{/if}

		<!-- Manage Subscription (shown for paid PLUS users — not comps) -->
		{#if $isPlusUser && status === 'ACTIVE' && !$isCanceledScheduled && !$isComp}
			<div class="mb-6 rounded-xl border border-gray-200 bg-white p-6">
				<h3 class="mb-4 text-lg font-semibold text-gray-900">Manage Subscription</h3>
				<div class="flex flex-wrap gap-3">
					<button
						on:click={() => handlePreviewSwitch($subscriptionStore.billingCycle === 'YEARLY' ? 'MONTHLY' : 'YEARLY')}
						disabled={$isTrialing || switchingCycle}
						class="rounded-lg border border-pink-300 bg-white px-4 py-2 text-sm font-medium text-pink-700 hover:bg-pink-50 disabled:opacity-50"
					>
						Switch to {$subscriptionStore.billingCycle === 'YEARLY' ? 'monthly' : 'yearly'} billing
					</button>
					<button
						on:click={() => (showCancelConfirm = true)}
						class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						Cancel at period end
					</button>
				</div>

				<!-- Proration preview -->
				{#if prorationPreview}
					<div class="mt-4 rounded-xl border border-pink-200 bg-pink-50 p-4">
						<p class="text-sm font-semibold text-pink-900">Switch to {switchTarget.toLowerCase()} billing</p>
						<div class="mt-2 space-y-1 text-sm text-pink-800">
							{#if prorationPreview.kind === 'NO_CHARGE'}
								<p>No charge — benefits continue until the end of the current period.</p>
							{:else}
								{#if prorationPreview.chargeKobo}
									<p>You'll be charged <strong>{formatMoney(prorationPreview.chargeKobo, prorationPreview.currency)}</strong> now.</p>
								{/if}
								{#if prorationPreview.creditKobo}
									<p>Credited <strong>{formatMoney(prorationPreview.creditKobo, prorationPreview.currency)}</strong> for unused time.</p>
								{/if}
							{/if}
						</div>
						{#if switchError}
							<p class="mt-2 text-sm text-red-700">{switchError}</p>
						{/if}
						<div class="mt-3 flex gap-2">
							<button on:click={() => (prorationPreview = null)} class="rounded-md border border-pink-300 bg-white px-3 py-1.5 text-xs font-medium text-pink-700 hover:bg-pink-100">Cancel</button>
							<button on:click={handleConfirmSwitch} disabled={switchingCycle} class="rounded-md bg-pink-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-pink-700 disabled:opacity-50">
								{switchingCycle ? 'Processing…' : 'Confirm switch'}
							</button>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		{#if $isCanceledScheduled}
			<div class="mb-6">
				<button
					on:click={handleUpgrade}
					disabled={upgrading}
					class="rounded-lg bg-pink-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-50"
				>
					{upgrading ? 'Processing…' : 'Resume subscription'}
				</button>
			</div>
		{/if}

		<!-- Inline messages -->
		{#if cancelError}
			<p class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{cancelError}</p>
		{/if}
		{#if cancelSuccess}
			<p class="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">{cancelSuccess}</p>
		{/if}

		<!-- Usage this period -->
		{#if $usageStore.loaded && Object.keys($usageStore.limits).length > 0}
			<div class="mb-6 rounded-xl border border-gray-200 bg-white p-6">
				<div class="mb-4 flex items-center justify-between">
					<h3 class="text-lg font-semibold text-gray-900">Usage this period</h3>
					<span class="text-xs text-gray-400">{$usageStore.tier} plan</span>
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					{#each usageRows($usageStore) as row (row.key)}
						{@const isUnlimited = row.limit < 0}
						{@const pct = isUnlimited || row.limit === 0 ? 0 : Math.min(100, Math.round((row.current / row.limit) * 100))}
						{@const tone = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}
						<div>
							<div class="flex items-center justify-between text-xs text-gray-700">
								<span>{row.label}</span>
								<span class="font-medium">
									{row.current}{#if !isUnlimited}<span class="text-gray-400"> / {row.limit}</span>{:else}<span class="text-gray-400"> · unlimited</span>{/if}
								</span>
							</div>
							<div class="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
								<div class="h-full {tone} transition-all" style="width: {pct}%;"></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Quick links -->
		<div class="flex flex-wrap gap-3 text-sm">
			<a href="/pricing" class="text-pink-600 hover:underline">View full pricing comparison</a>
			<span class="text-gray-300">·</span>
			<a href="/settings" class="text-gray-600 hover:underline">Account settings</a>
		</div>
	{/if}
</div>

<!-- Cancel confirmation modal -->
{#if showCancelConfirm}
	<div
		on:click={() => (showCancelConfirm = false)}
		on:keydown={(e) => e.key === 'Escape' && (showCancelConfirm = false)}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
			<div class="mb-3 flex items-center gap-2">
				<Icon icon="mdi:alert-circle-outline" class="text-2xl text-amber-500" />
				<h3 class="text-lg font-semibold">Cancel subscription?</h3>
			</div>
			<p class="mb-5 text-sm text-gray-600">
				You'll keep PLUS benefits until <strong>{formatDate($subscriptionStore.currentPeriodEnd)}</strong>, then your account moves to FREE. No mid-cycle refund.
			</p>
			<div class="flex justify-end gap-2">
				<button on:click={() => (showCancelConfirm = false)} class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Keep subscription</button>
				<button on:click={handleCancel} disabled={cancelling} class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
					{cancelling ? 'Cancelling…' : 'Yes, cancel'}
				</button>
			</div>
		</div>
	</div>
{/if}
