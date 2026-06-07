<!--
	FE-P2-07 — KYC overview page.

	Shows the user's current tier, status, and a CTA to start (or
	resubmit) verification.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { kycStore, loadKyc } from '$lib/stores/kyc.store';
	import { formatMoney } from '$lib/utils/money';
	import SettingsBackButton from '$lib/components/SettingsBackButton.svelte';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	onMount(() => loadKyc());

	$: tier = $kycStore.tier ?? 'UNVERIFIED';
	$: status = $kycStore.status ?? 'NOT_SUBMITTED';

	function tierColor(t: string): string {
		if (t === 'VERIFIED') return 'bg-green-100 text-green-700';
		if (t === 'BASIC') return 'bg-blue-100 text-blue-700';
		return 'bg-gray-100 text-gray-700';
	}
</script>

<svelte:head><title>Identity verification — Rondwell</title></svelte:head>

<div class="max-w-3xl">
	<SettingsBackButton fallbackTab="wallet" />
	<div class="mb-6">
		<h1 class="text-2xl font-bold sm:text-3xl">Identity verification</h1>
		<p class="mt-1 text-sm text-[#8C8F93]">
			Verify your identity to unlock withdrawals, raise daily limits, and stay compliant with
			Nigerian regulations.
		</p>
	</div>

	{#if !$kycStore.loaded}
		<div class="space-y-3">
			<div class="h-20 animate-pulse rounded-xl bg-gray-100"></div>
			<div class="h-32 animate-pulse rounded-xl bg-gray-100"></div>
		</div>
	{:else}
		<div class="rounded-xl border bg-white p-6">
			<div class="flex items-center gap-3">
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-50 text-pink-600">
					<Icon icon="mdi:shield-account-outline" class="text-2xl" />
				</div>
				<div>
					<p class="text-xs uppercase tracking-wide text-gray-400">Current tier</p>
					<div class="flex items-center gap-2">
						<span class="text-lg font-semibold">{tier}</span>
						<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {tierColor(tier)}">
							{status.replace(/_/g, ' ').toLowerCase()}
						</span>
					</div>
				</div>
			</div>

			<div class="mt-6 space-y-3 text-sm">
				<div
					class="flex items-start gap-3 rounded-lg p-3 {tier === 'UNVERIFIED'
						? 'border border-amber-200 bg-amber-50'
						: 'border border-gray-100'}"
				>
					<Icon
						icon={tier === 'UNVERIFIED' ? 'mdi:circle-outline' : 'mdi:check-circle-outline'}
						class={tier === 'UNVERIFIED' ? 'text-lg text-amber-500' : 'text-lg text-green-500'}
					/>
					<div>
						<p class="font-medium">UNVERIFIED</p>
						<p class="text-xs text-gray-500">No withdrawals allowed. Verify to unlock.</p>
					</div>
				</div>
				<div
					class="flex items-start gap-3 rounded-lg p-3 {tier === 'BASIC'
						? 'border border-blue-200 bg-blue-50'
						: 'border border-gray-100'}"
				>
					<Icon
						icon={tier === 'UNVERIFIED' ? 'mdi:circle-outline' : 'mdi:check-circle-outline'}
						class={tier === 'UNVERIFIED' ? 'text-lg text-gray-300' : 'text-lg text-green-500'}
					/>
					<div>
						<p class="font-medium">BASIC</p>
						<p class="text-xs text-gray-500">
							BVN matched. Daily withdrawal cap of {formatMoney(5_000_000, 'NGN')} (₦50,000).
						</p>
					</div>
				</div>
				<div
					class="flex items-start gap-3 rounded-lg p-3 {tier === 'VERIFIED'
						? 'border border-green-200 bg-green-50'
						: 'border border-gray-100'}"
				>
					<Icon
						icon={tier === 'VERIFIED' ? 'mdi:check-circle' : 'mdi:circle-outline'}
						class={tier === 'VERIFIED' ? 'text-lg text-green-500' : 'text-lg text-gray-300'}
					/>
					<div>
						<p class="font-medium">VERIFIED</p>
						<p class="text-xs text-gray-500">
							Full KYC. No daily cap. AML review threshold at {formatMoney(500_000_000, 'NGN')} per
							transaction.
						</p>
					</div>
				</div>
			</div>

			<div class="mt-6 flex flex-wrap items-center gap-2">
				{#if status === 'NOT_SUBMITTED' || status === 'REJECTED'}
					<button
						on:click={() => goto('/account/kyc/start')}
						class="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
					>
						{status === 'REJECTED' ? 'Resubmit' : 'Start verification'}
					</button>
				{:else if status === 'PENDING_REVIEW'}
					<button
						on:click={() => goto('/account/kyc/status')}
						class="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						View submission
					</button>
				{:else if status === 'APPROVED'}
					<button
						on:click={() => goto('/account/kyc/status')}
						class="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						View details
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>
