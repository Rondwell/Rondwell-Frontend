<script lang="ts">
	/**
	 * FE-P1-11 (FA-5.4, PA-5.2) — Subscription management panel.
	 *
	 * The settings page has had no place a PLUS user could manage billing
	 * cycle, see their renewal date, or schedule a cancellation. This panel
	 * fills that gap. It surfaces every lifecycle state the backend cron
	 * drives:
	 *   - ACTIVE             — show renewal date + downgrade controls.
	 *   - ACTIVE + cancelAtPeriodEnd — show "expires on" banner.
	 *   - TRIALING            — show trial countdown.
	 *   - PAST_DUE            — show dunning ladder (+1 / +3 / +7 retries).
	 *   - CANCELED            — show "benefits expire on" banner if still
	 *     within the period; otherwise route to upgrade.
	 *   - FREE                — promote the upgrade.
	 *
	 * Driven by `$lib/stores/subscription.store`. Mutations call
	 * `loadSubscription(true)` to refresh the cache after the round trip.
	 */
	import { goto } from '$app/navigation';
	import {
		applyFreeTrial,
		cancelSubscription,
		initiateProration,
		previewProration,
	} from '$lib/services/subscription.services';
	import {
		daysUntilRenewal,
		isCanceledScheduled,
		isPastDue,
		isPlusUser,
		isTrialing,
		loadSubscription,
		subscriptionStore,
	} from '$lib/stores/subscription.store';
	import { loadUsage, usageStore } from '$lib/stores/usage.store';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let cancelling = false;
	let cancelError = '';
	let cancelSuccess = '';
	let showCancelConfirm = false;

	// FE-P2-04 / FE-P2-05 / FE-P2-06 — proration / currency switch / trial.
	let switchingCycle = false;
	let switchTarget: 'MONTHLY' | 'YEARLY' = 'YEARLY';
	let switchCurrency: 'NGN' | 'USD' = 'NGN';
	let prorationPreview: any = null;
	let switchError = '';

	let startingTrial = false;
	let trialError = '';

	onMount(() => {
		loadSubscription();
		// FE-P3-01 (NEW-8.1) — populate the live usage snapshot so the
		// "Usage this period" block renders alongside the plan card.
		loadUsage();
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

	/**
	 * FE-P2-04 — Preview the proration so the user sees what they'll be charged
	 * (or credited) before confirming.
	 */
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

	/**
	 * FE-P2-06 — Start a 14-day free trial. Backend rejects with TRIAL_ALREADY_USED
	 * (403) if the user has used a trial before.
	 */
	async function handleStartTrial(billingCycle: 'MONTHLY' | 'YEARLY' = 'YEARLY') {
		startingTrial = true;
		trialError = '';
		try {
			await applyFreeTrial({ billingCycle, currency: 'NGN' });
			await loadSubscription(true);
		} catch (e: any) {
			trialError = financialErrorMessage(e);
		} finally {
			startingTrial = false;
		}
	}

	$: status = $subscriptionStore.subscriptionStatus;
	$: tierLabel = $subscriptionStore.tier === 'PLUS' ? 'Rondwell PLUS' : 'FREE';

	// FE-P3-01 — friendly labels for the per-key usage rows.
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
		maxRegistrationFields: 'Registration fields',
		maxTicketTypes: 'Ticket types',
		maxCustomDomains: 'Custom domains',
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

<div class="mb-12">
	<div class="mb-6">
		<h2 class="text-lg font-semibold">Subscription</h2>
		<p class="text-sm text-[#8C8F93]">Manage your plan, billing cycle, and renewal.</p>
	</div>

	{#if !$subscriptionStore.loaded}
		<div class="space-y-3">
			<div class="h-32 animate-pulse rounded-xl bg-gray-100"></div>
			<div class="h-20 animate-pulse rounded-xl bg-gray-100"></div>
		</div>
	{:else}
		<!-- Current plan card -->
		<div
			class="mb-4 rounded-xl border bg-gradient-to-br p-6 {$isPlusUser
				? 'from-pink-50 to-purple-50 border-pink-200'
				: 'from-gray-50 to-gray-100 border-gray-200'}"
		>
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div>
					<div class="flex items-center gap-2">
						<Icon
							icon={$isPlusUser ? 'mdi:star-circle' : 'mdi:account-circle-outline'}
							class={$isPlusUser ? 'text-2xl text-pink-500' : 'text-2xl text-gray-400'}
						/>
						<h3 class="text-xl font-bold text-gray-900">{tierLabel}</h3>
						{#if status}
							<span
								class="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide
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
						<p class="mt-1 text-xs text-gray-500">
							Billed {$subscriptionStore.billingCycle.toLowerCase()}
							{#if $subscriptionStore.currency}
								· {$subscriptionStore.currency}
							{/if}
						</p>
					{:else if !$isPlusUser}
						<p class="mt-1 text-xs text-gray-500">
							Upgrade to PLUS to lower your platform fee from {$subscriptionStore.feePercent}%.
						</p>
					{/if}
				</div>
				<div class="text-right">
					<p class="text-[10px] uppercase tracking-wide text-gray-500">Platform fee</p>
					<p class="text-lg font-semibold text-gray-900">{$subscriptionStore.feePercent}%</p>
				</div>
			</div>
		</div>

		<!-- Lifecycle banners -->
		{#if status === 'ACTIVE' && $isCanceledScheduled}
			<div
				class="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm"
			>
				<Icon icon="mdi:clock-alert-outline" class="mt-0.5 shrink-0 text-lg text-amber-600" />
				<div>
					<p class="font-medium text-amber-900">
						Subscription expires {$daysUntilRenewal !== null
							? `in ${$daysUntilRenewal} day${$daysUntilRenewal === 1 ? '' : 's'}`
							: 'soon'}.
					</p>
					<p class="mt-0.5 text-amber-800">
						You scheduled a cancellation. PLUS benefits remain active until {formatDate(
							$subscriptionStore.currentPeriodEnd
						)}, then your account moves to FREE.
					</p>
				</div>
			</div>
		{:else if status === 'ACTIVE' && $subscriptionStore.currentPeriodEnd}
			<div
				class="mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm"
			>
				<Icon icon="mdi:autorenew" class="mt-0.5 shrink-0 text-lg text-emerald-600" />
				<div>
					<p class="font-medium text-emerald-900">
						Renews on {formatDate($subscriptionStore.currentPeriodEnd)}
					</p>
					<p class="mt-0.5 text-emerald-800">
						We'll charge your saved payment method automatically. You can cancel anytime — you keep
						PLUS until the end of the current period.
					</p>
				</div>
			</div>
		{/if}

		{#if $isPastDue}
			<div
				class="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm"
			>
				<Icon icon="mdi:credit-card-off-outline" class="mt-0.5 shrink-0 text-lg text-red-600" />
				<div class="flex-1">
					<p class="font-medium text-red-900">Payment failed</p>
					<p class="mt-0.5 text-red-800">
						We couldn't charge your card for the most recent renewal. We'll retry on +1, +3, and +7
						days. If all retries fail, your account moves to FREE.
					</p>
					<div class="mt-3 flex flex-wrap items-center gap-2">
						<button
							on:click={() => goto('/settings?tab=payments')}
							class="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
						>
							Update payment method
						</button>
						<button
							on:click={() => goto('/pricing')}
							class="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
						>
							Renew now
						</button>
					</div>
				</div>
			</div>
		{/if}

		{#if $isTrialing && $subscriptionStore.trialEndsAt}
			<div
				class="mb-4 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm"
			>
				<Icon icon="mdi:gift-outline" class="mt-0.5 shrink-0 text-lg text-blue-600" />
				<div>
					<p class="font-medium text-blue-900">Free trial active</p>
					<p class="mt-0.5 text-blue-800">
						Your trial ends on {formatDate($subscriptionStore.trialEndsAt)}.
						{#if !$subscriptionStore.cancelAtPeriodEnd}
							We'll start your paid subscription automatically — cancel anytime before then to avoid
							charges.
						{/if}
					</p>
				</div>
			</div>
		{/if}

		{#if status === 'CANCELED' && $subscriptionStore.currentPeriodEnd && new Date($subscriptionStore.currentPeriodEnd).getTime() > Date.now()}
			<div
				class="mb-4 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm"
			>
				<Icon icon="mdi:account-off-outline" class="mt-0.5 shrink-0 text-lg text-gray-500" />
				<div>
					<p class="font-medium text-gray-900">Subscription canceled</p>
					<p class="mt-0.5 text-gray-700">
						Your PLUS benefits expire on {formatDate($subscriptionStore.currentPeriodEnd)}. After
						that you'll be on the FREE tier with the standard {$subscriptionStore.feePercent}%
						platform fee.
					</p>
				</div>
			</div>
		{/if}

		<!-- Inline messages -->
		{#if cancelError}
			<p class="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-600">{cancelError}</p>
		{/if}
		{#if cancelSuccess}
			<p class="mb-3 rounded-md bg-green-50 p-3 text-sm text-green-700">{cancelSuccess}</p>
		{/if}

		<!-- Action row -->
		<div class="flex flex-wrap items-center gap-2">
			{#if !$isPlusUser && !$isTrialing}
				<button
					on:click={() => goto('/pricing')}
					class="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
				>
					Upgrade to PLUS
				</button>
			{:else if status === 'ACTIVE' && !$isCanceledScheduled}
				<button
					on:click={() => (showCancelConfirm = true)}
					class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					Cancel at period end
				</button>
				<button
					on:click={() => handlePreviewSwitch($subscriptionStore.billingCycle === 'YEARLY' ? 'MONTHLY' : 'YEARLY')}
					disabled={$isTrialing || switchingCycle}
					title={$isTrialing ? 'Wait for your trial to end before switching billing cycle' : ''}
					class="rounded-lg border border-pink-300 bg-white px-4 py-2 text-sm font-medium text-pink-700 hover:bg-pink-50 disabled:opacity-50"
				>
					Switch to {$subscriptionStore.billingCycle === 'YEARLY' ? 'monthly' : 'yearly'} billing
				</button>
			{:else if $isCanceledScheduled}
				<button
					on:click={() => goto('/pricing')}
					class="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
				>
					Resume subscription
				</button>
			{/if}
		</div>

		<!-- FE-P2-04: Proration preview card -->
		{#if prorationPreview}
			<div class="mt-4 rounded-xl border border-pink-200 bg-pink-50 p-4">
				<p class="text-sm font-semibold text-pink-900">Switch to {switchTarget.toLowerCase()} billing</p>
				<div class="mt-2 space-y-1 text-sm text-pink-800">
					{#if prorationPreview.kind === 'NO_CHARGE'}
						<p>
							No charge — your benefits continue until {prorationPreview.benefitsKeptUntil
								? new Date(prorationPreview.benefitsKeptUntil).toLocaleDateString()
								: 'the end of the current period'}.
						</p>
					{:else}
						{#if prorationPreview.chargeKobo}
							<p>
								You'll be charged
								<strong>{formatMoney(prorationPreview.chargeKobo, prorationPreview.currency)}</strong>
								now.
							</p>
						{/if}
						{#if prorationPreview.creditKobo}
							<p>
								Credited <strong>{formatMoney(prorationPreview.creditKobo, prorationPreview.currency)}</strong>
								for unused time on the current cycle.
							</p>
						{/if}
					{/if}
				</div>
				{#if switchError}
					<p class="mt-2 text-sm text-red-700">{switchError}</p>
				{/if}
				<div class="mt-3 flex gap-2">
					<button
						on:click={() => (prorationPreview = null)}
						class="rounded-md border border-pink-300 bg-white px-3 py-1.5 text-xs font-medium text-pink-700 hover:bg-pink-100"
					>
						Cancel
					</button>
					<button
						on:click={handleConfirmSwitch}
						disabled={switchingCycle}
						class="rounded-md bg-pink-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-pink-700 disabled:opacity-50"
					>
						{switchingCycle ? 'Processing…' : 'Confirm switch'}
					</button>
				</div>
			</div>
		{/if}
		<!-- FE-P3-01 (NEW-8.1) — Usage this period. Live counters from the
		     UsageTracker RPC, polled by `usage.store`. Each row shows
		     current / limit and turns amber at ≥80%, red at 100%. -->
		{#if $usageStore.loaded && Object.keys($usageStore.limits).length > 0}
			<div class="mt-6 rounded-xl border bg-white p-4">
				<div class="mb-3 flex items-center justify-between">
					<h3 class="text-sm font-semibold text-gray-900">Usage this period</h3>
					<span class="text-[11px] text-gray-400">{$usageStore.tier} plan</span>
				</div>
				<div class="grid gap-3 sm:grid-cols-2">
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
							<div class="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
								<div class="h-full {tone} transition-all" style="width: {pct}%;"></div>
							</div>
						</div>
					{/each}
				</div>
				{#if !$isPlusUser}
					<button
						on:click={() => goto('/pricing')}
						class="mt-4 rounded-md bg-pink-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-pink-700"
					>
						Upgrade to remove these limits
					</button>
				{/if}
			</div>
		{/if}
	{/if}
</div>

{#if showCancelConfirm}
	<div
		on:click={() => (showCancelConfirm = false)}
		on:keydown={(e) => e.key === 'Escape' && (showCancelConfirm = false)}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
			role="document"
			on:click|stopPropagation
			on:keydown|stopPropagation
		>
			<div class="mb-3 flex items-center gap-2">
				<Icon icon="mdi:alert-circle-outline" class="text-2xl text-amber-500" />
				<h3 class="text-lg font-semibold">Cancel subscription?</h3>
			</div>
			<p class="mb-5 text-sm text-gray-600">
				You'll keep PLUS benefits until <strong
					>{formatDate($subscriptionStore.currentPeriodEnd)}</strong
				>, then your account moves to FREE. No mid-cycle refund. You can resume anytime before that
				date.
			</p>
			<div class="flex justify-end gap-2">
				<button
					on:click={() => (showCancelConfirm = false)}
					class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					Keep subscription
				</button>
				<button
					on:click={handleCancel}
					disabled={cancelling}
					class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
				>
					{cancelling ? 'Cancelling…' : 'Yes, schedule cancellation'}
				</button>
			</div>
		</div>
	</div>
{/if}
