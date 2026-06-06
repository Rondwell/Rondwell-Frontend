<!--
	FE-P2-07 — KYC status page.

	Linked from `KYC_APPROVED` and `KYC_REJECTED` emails. Shows the
	review state plus next steps.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { kycStore, loadKyc } from '$lib/stores/kyc.store';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	onMount(() => loadKyc(true));

	$: status = $kycStore.status ?? 'NOT_SUBMITTED';
	$: tier = $kycStore.tier ?? 'UNVERIFIED';
</script>

<svelte:head><title>Verification status — Rondwell</title></svelte:head>

<div class="max-w-2xl">
	<button
		on:click={() => goto('/account/kyc')}
		class="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
	>
		<Icon icon="mdi:arrow-left" /> Back to KYC
	</button>

	{#if !$kycStore.loaded}
		<div class="h-32 animate-pulse rounded-xl bg-gray-100"></div>
	{:else if status === 'NOT_SUBMITTED'}
		<div class="rounded-xl border bg-white p-6 text-center">
			<Icon icon="mdi:shield-account-outline" class="mb-2 text-5xl text-gray-300" />
			<h1 class="text-xl font-semibold">Not yet submitted</h1>
			<p class="mt-1 text-sm text-gray-500">
				You haven't submitted your KYC. Start verification to unlock withdrawals.
			</p>
			<button
				on:click={() => goto('/account/kyc/start')}
				class="mt-4 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
			>
				Start verification
			</button>
		</div>
	{:else if status === 'PENDING_REVIEW'}
		<div class="rounded-xl border bg-blue-50 p-6 text-center">
			<Icon icon="mdi:clock-outline" class="mb-2 text-5xl text-blue-500" />
			<h1 class="text-xl font-semibold text-blue-900">Under review</h1>
			<p class="mt-2 text-sm text-blue-800">
				Your KYC is with our compliance team. We'll email you when it's done — typically within 24
				hours.
			</p>
			<p class="mt-1 text-xs text-blue-700">
				Submitted {$kycStore.submittedAt ? new Date($kycStore.submittedAt).toLocaleString() : ''}
			</p>
		</div>
	{:else if status === 'APPROVED'}
		<div class="rounded-xl border bg-green-50 p-6 text-center">
			<Icon icon="mdi:check-circle-outline" class="mb-2 text-5xl text-green-500" />
			<h1 class="text-xl font-semibold text-green-900">Verified</h1>
			<p class="mt-2 text-sm text-green-800">
				Your tier is <strong>{tier}</strong>. Withdrawals are unlocked.
			</p>
			<button
				on:click={() => goto('/settings?tab=wallet')}
				class="mt-4 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
			>
				Go to wallet
			</button>
		</div>
	{:else if status === 'REJECTED'}
		<div class="rounded-xl border bg-red-50 p-6 text-center">
			<Icon icon="mdi:close-circle-outline" class="mb-2 text-5xl text-red-500" />
			<h1 class="text-xl font-semibold text-red-900">Verification rejected</h1>
			{#if $kycStore.rejectedReason}
				<p class="mt-2 text-sm text-red-800">{$kycStore.rejectedReason}</p>
			{:else}
				<p class="mt-2 text-sm text-red-800">
					We couldn't verify your submission. Please review and try again.
				</p>
			{/if}
			<button
				on:click={() => goto('/account/kyc/start')}
				class="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
			>
				Resubmit
			</button>
		</div>
	{/if}
</div>
