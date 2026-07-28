<!--
	FE-P2-07 / FE-P5-08 — KYC status page.

	Linked from the `KYC_APPROVED`, `KYC_REJECTED` and `KYC_REVOKED` emails.

	── What was broken ────────────────────────────────────────────────────────

	1. The `APPROVED` and `NOT_SUBMITTED` branches were UNREACHABLE. The backend
	   emits `UNVERIFIED | PENDING_REVIEW | VERIFIED | REJECTED`, so a verified
	   user matched no branch at all and saw a blank page.

	2. The rejection reason never displayed. The backend returns
	   `rejectionReason`; the client read `rejectedReason`. The names never
	   matched, so this page always fell through to the generic "We couldn't
	   verify your submission" copy even though the real reason was in the
	   database and in the email.

	3. "Submitted {date}" was always blank — nothing recorded `submittedAt`.

	All three are fixed; this page now also distinguishes a REVOCATION (a
	previously verified profile withdrawn) from a first-pass rejection, because
	the two need very different copy.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { kycStore, loadKyc } from '$lib/stores/kyc.store';
	import { normaliseKycStatus } from '$lib/services/kyc.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	onMount(() => loadKyc(true));

	$: status = normaliseKycStatus($kycStore.status);
	$: tier = $kycStore.tier ?? 'UNVERIFIED';
	$: wasRevoked = !!$kycStore.wasRevoked;
	$: rejectionReason = $kycStore.rejectedReason ?? null;
	$: reviewerNotes = $kycStore.reviewerNotes ?? null;
	$: attempts = $kycStore.resubmissionCount ?? 0;

	function fmt(iso?: string | null): string {
		if (!iso) return '';
		try {
			return new Date(iso).toLocaleString('en-GB', {
				day: 'numeric',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return '';
		}
	}
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
	{:else if status === 'UNVERIFIED'}
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
			{#if $kycStore.submittedAt}
				<p class="mt-1 text-xs text-blue-700">Submitted {fmt($kycStore.submittedAt)}</p>
			{/if}
			{#if attempts > 1}
				<p class="mt-1 text-xs text-blue-700">
					This is submission #{attempts}. It replaces everything you sent before — you don't need to
					submit again.
				</p>
			{/if}
		</div>
	{:else if status === 'VERIFIED'}
		<div class="rounded-xl border bg-green-50 p-6 text-center">
			<Icon icon="mdi:check-circle-outline" class="mb-2 text-5xl text-green-500" />
			<h1 class="text-xl font-semibold text-green-900">Verified</h1>
			<p class="mt-2 text-sm text-green-800">
				Your tier is <strong>{tier}</strong>. Withdrawals are unlocked.
			</p>
			{#if $kycStore.reviewedAt}
				<p class="mt-1 text-xs text-green-700">Verified {fmt($kycStore.reviewedAt)}</p>
			{/if}
			<button
				on:click={() => goto('/settings?tab=wallet')}
				class="mt-4 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
			>
				Go to wallet
			</button>
		</div>
	{:else if status === 'REJECTED'}
		<div class="rounded-xl border border-red-200 bg-red-50 p-6">
			<div class="text-center">
				<Icon icon="mdi:close-circle-outline" class="mb-2 text-5xl text-red-500" />
				<h1 class="text-xl font-semibold text-red-900">
					{wasRevoked ? 'Verification withdrawn' : 'Verification rejected'}
				</h1>
				<p class="mt-2 text-sm text-red-800">
					{wasRevoked
						? 'Our compliance team has withdrawn the verification on your account. Withdrawals are paused until you verify again — money already in your wallet stays safe.'
						: "We couldn't verify your submission. Here's what to fix:"}
				</p>
			</div>

			<!--
				The reason. This is the block that never rendered because of the
				`rejectionReason` / `rejectedReason` field-name mismatch — the user was
				told they'd been rejected but never told why, so they had nothing to
				correct and simply re-submitted the same document.
			-->
			{#if rejectionReason}
				<div class="mt-4 rounded-lg border border-red-200 bg-white p-4 text-left">
					<p class="text-xs font-medium uppercase tracking-wide text-red-500">Reason</p>
					<p class="mt-1 text-sm text-gray-800">{rejectionReason}</p>
					{#if reviewerNotes}
						<p class="mt-3 text-xs font-medium uppercase tracking-wide text-red-500">
							Reviewer notes
						</p>
						<p class="mt-1 text-sm text-gray-700">{reviewerNotes}</p>
					{/if}
				</div>
			{:else}
				<p class="mt-4 text-center text-sm text-red-800">
					Please review your details and try again.
				</p>
			{/if}

			<div class="mt-4 flex flex-col items-center gap-2">
				<button
					on:click={() => goto('/account/kyc/start')}
					class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
				>
					{wasRevoked ? 'Re-verify my identity' : 'Fix and resubmit'}
				</button>
				<p class="text-xs text-red-700">
					{#if $kycStore.reviewedAt}Reviewed {fmt($kycStore.reviewedAt)} · {/if}
					We'll keep your previous details so you only change what's needed.
				</p>
			</div>
		</div>
	{/if}
</div>
