<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getCollectionVerificationStatus, requestCollectionVerification } from '$lib/services/event.services';
	import { onMount } from 'svelte';

	$: collectionId = $page.params.id ?? '';

	let estimatedAudience = 100;
	let eventsInfo = '';
	let guestsInfo = '';
	let confirmInactive = false;
	let confirmOptIn = false;

	let submitting = false;
	let submitted = false;
	let errorMsg = '';
	let currentStatus = '';
	let loading = true;

	$: canSubmit = confirmInactive && confirmOptIn && eventsInfo.trim().length > 0 && guestsInfo.trim().length > 0;

	onMount(async () => {
		try {
			const data = await getCollectionVerificationStatus(collectionId);
			currentStatus = data.approvalStatus || 'PENDING';
			if (currentStatus === 'APPROVED') {
				goto(`/collection/${collectionId}/engage`);
			}
			if (data.verificationRequest) {
				estimatedAudience = data.verificationRequest.estimatedAudience || 100;
				eventsInfo = data.verificationRequest.eventsInfo || '';
				guestsInfo = data.verificationRequest.guestsInfo || '';
			}
		} catch { /* first time */ }
		finally { loading = false; }
	});

	const increment = () => { estimatedAudience += 1; };
	const decrement = () => { if (estimatedAudience > 1) estimatedAudience -= 1; };

	async function handleSubmit() {
		if (!canSubmit) return;
		submitting = true;
		errorMsg = '';
		try {
			await requestCollectionVerification(collectionId, {
				estimatedAudience,
				eventsInfo,
				guestsInfo,
			});
			submitted = true;
		} catch (err: any) {
			errorMsg = err.message || 'Failed to submit verification request';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="px-4 py-2">
	<!-- Back button -->
	<a
		href="/collection/{collectionId}/engage"
		class="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#616265] transition hover:bg-[#F4F4F4]"
	>
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<line x1="19" y1="12" x2="5" y2="12"></line>
			<polyline points="12 19 5 12 12 5"></polyline>
		</svg>
		Back to Engage
	</a>

	{#if loading}
		<div class="animate-pulse space-y-4">
			<div class="h-8 w-48 rounded bg-gray-200"></div>
			<div class="h-4 w-full max-w-md rounded bg-gray-200"></div>
			<div class="h-32 w-full max-w-[630px] rounded-lg bg-gray-200"></div>
		</div>
	{:else if submitted}
		<!-- Success State -->
		<div class="flex flex-col items-center justify-center gap-4 py-16 text-center">
			<div class="flex h-16 w-16 items-center justify-center rounded-full bg-[#E3F4E1]">
				<svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="#3CBD2C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="10" stroke="#3CBD2C" stroke-width="1.5"/></svg>
			</div>
			<h2 class="text-2xl font-semibold text-gray-900">Verification Request Submitted</h2>
			<p class="max-w-md text-sm text-gray-500">
				Your collection verification request has been submitted. The Rondwell team will review it and you'll be notified once it's approved.
			</p>
			<a
				href="/collection/{collectionId}/engage"
				class="mt-4 rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
			>
				Back to Engage
			</a>
		</div>
	{:else}
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-lg md:text-2xl">Verify Collection</h1>
			<p class="mt-2 text-sm text-[#828587]">
				Verify your collection to unlock newsletter sending. Share some details about your events and audience so we can review your request.
			</p>
		</div>

		<!-- Collection Card -->
		<div class="mb-8 w-full rounded-lg border bg-[#FDFDFD] p-4 md:max-w-[630px]">
			<div class="mb-3 flex items-center gap-3">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F2E4F8] text-sm font-semibold text-[#AB46DD]">
					<svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M14.167 8.333h1.666c1.667 0 2.5-.833 2.5-2.5V4.167c0-1.667-.833-2.5-2.5-2.5h-1.666c-1.667 0-2.5.833-2.5 2.5v1.666c0 1.667.833 2.5 2.5 2.5z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 8.333A3.333 3.333 0 105 1.667a3.333 3.333 0 000 6.666zM15 18.333a3.333 3.333 0 100-6.666 3.333 3.333 0 000 6.666z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/></svg>
				</div>
				<div class="flex flex-col">
					<p class="text-xs text-[#ABADAD]">For Collection</p>
					<p class="text-sm font-medium">ID: {collectionId.slice(0, 8)}...</p>
				</div>
			</div>
			<div class="border-t pt-2 md:ml-11">
				<p class="text-sm text-gray-500">
					To ensure timely verification, please complete your collection information with a profile picture and description.
				</p>
				<a href="/collection/{collectionId}/settings" class="mt-2 inline-flex items-center gap-1 text-sm font-medium text-pink-600 hover:underline">
					Complete Collection Info →
				</a>
			</div>
		</div>

		<!-- Audience size -->
		<div class="mb-8">
			<label class="mb-2 block text-lg font-medium">
				How many people would you like to send newsletters to?
			</label>
			<p class="mb-2 text-sm text-[#8F8F91]">
				Please share an estimate of the number of messages you plan to send at once.
			</p>
			<div class="inline-flex h-13 w-full items-center overflow-hidden rounded-md border bg-white sm:max-w-50">
				<div class="flex flex-col gap-2">
					<button type="button" class="px-3 pt-3 text-sm text-[#D9D9D9]" on:click={increment}>
						<svg width="12" height="6" viewBox="0 0 12 6" fill="none"><path d="M5.846 0L11.692 5.786H0L5.846 0Z" fill="#D9D9D9"/></svg>
					</button>
					<button type="button" class="px-3 pb-3 text-sm text-[#D9D9D9]" on:click={decrement}>
						<svg width="12" height="6" viewBox="0 0 12 6" fill="none"><path d="M5.846 5.786L0 0h11.692L5.846 5.786Z" fill="#D9D9D9"/></svg>
					</button>
				</div>
				<input type="number" min="1" bind:value={estimatedAudience} class="w-full px-3 py-2 text-right text-lg text-[#C8C9C9] focus:outline-none sm:w-40" />
			</div>
		</div>

		<!-- Events info -->
		<div class="mb-8">
			<label class="block text-lg font-medium">
				Please share some information about your events.
			</label>
			<p class="mb-2 text-sm text-gray-500">
				What kind of events are you hosting? How often? How do you plan to market them?
			</p>
			<textarea bind:value={eventsInfo} rows="4" placeholder="Describe your events..." class="w-full resize-none rounded-md border bg-[#fdfdfd] px-3 py-2 focus:border-[#513BE2] focus:outline-none md:max-w-[630px]" />
		</div>

		<!-- Guests info -->
		<div class="mb-8">
			<label class="mb-2 block text-lg font-medium">
				Please share some information about your guests.
			</label>
			<p class="mb-2 text-sm text-gray-500">
				How did you build your contact list? Did people opt in to receive emails?
			</p>
			<textarea bind:value={guestsInfo} rows="4" placeholder="Describe your audience..." class="w-full resize-none rounded-md border bg-[#fdfdfd] px-3 py-2 focus:border-[#513BE2] focus:outline-none md:max-w-[630px]" />
		</div>

		<!-- Confirmations -->
		<div class="mb-6 space-y-4">
			<label class="flex items-start gap-2">
				<input type="checkbox" bind:checked={confirmInactive} class="mt-0.5 h-5 w-5 rounded-sm accent-black" />
				<span class="text-sm">I confirm I will not import or contact people with inactive email addresses or who have unsubscribed.</span>
			</label>
			<label class="flex items-start gap-2">
				<input type="checkbox" bind:checked={confirmOptIn} class="mt-0.5 h-5 w-5 rounded-sm accent-black" />
				<span class="text-sm">I confirm that I will only message people who have opted in and consented to receiving emails.</span>
			</label>
		</div>

		{#if errorMsg}
			<p class="mb-4 text-sm text-red-500">{errorMsg}</p>
		{/if}

		<!-- Submit -->
		<button
			on:click={handleSubmit}
			disabled={!canSubmit || submitting}
			class="rounded-md bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-40"
		>
			{submitting ? 'Submitting...' : 'Submit Verification Request'}
		</button>
	{/if}
</div>

<style>
	input[type='number']::-webkit-inner-spin-button,
	input[type='number']::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	input[type='number'] {
		-moz-appearance: textfield;
	}
</style>
