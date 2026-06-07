<script lang="ts">
	/**
	 * Settings → Subscription tab.
	 *
	 * Intentionally a thin summary. All subscription management — upgrade /
	 * checkout, cancel-at-period-end, billing-cycle switch with proration,
	 * lifecycle banners and usage metering — lives on the dedicated
	 * `/subscription` page so the logic isn't duplicated in two places.
	 *
	 * This panel only surfaces the current plan at a glance and routes to
	 * `/subscription` to manage it.
	 */
	import { goto } from '$app/navigation';
	import {
		isCanceledScheduled,
		isPlusUser,
		isTrialing,
		loadSubscription,
		subscriptionStore,
	} from '$lib/stores/subscription.store';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		loadSubscription();
	});

	$: status = $subscriptionStore.subscriptionStatus;
	$: tierLabel = $subscriptionStore.tier === 'PLUS' ? 'Rondwell PLUS' : 'FREE';

	// Single CTA label — the full lifecycle is handled on /subscription.
	$: ctaLabel = !$isPlusUser && !$isTrialing
		? 'Upgrade to PLUS'
		: $isCanceledScheduled
			? 'Resume subscription'
			: 'Manage subscription';
</script>

<div class="mb-12">
	<div class="mb-6">
		<h2 class="text-lg font-semibold">Subscription</h2>
		<p class="text-sm text-[#8C8F93]">Manage your plan, billing cycle, and renewal.</p>
	</div>

	{#if !$subscriptionStore.loaded}
		<div class="space-y-3">
			<div class="h-32 animate-pulse rounded-xl bg-gray-100"></div>
		</div>
	{:else}
		<!-- Current plan summary -->
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

		<!-- All management happens on the dedicated /subscription page -->
		<button
			on:click={() => goto('/subscription')}
			class="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
		>
			{ctaLabel}
		</button>
	{/if}
</div>
