<script lang="ts">
	import { approveParticipant } from '$lib/services/event.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let participant = 'exhibitor';
	export let speakerData: any = null;
	export let eventId = '';

	let participantUp = participant.charAt(0).toUpperCase() + participant.slice(1);

	let requirePayment = false;
	let packageDropdownOpen = false;
	let approving = false;
	let error = '';
	let message = '';
	let contributionAmount = 0;
	let currency = 'USD';

	$: participantName = speakerData?.displayName || speakerData?.applicationDetails?.companyName || 'Participant';

	const packages = [
		{ id: 1, label: 'Bronze Package', amount: 500 },
		{ id: 2, label: 'Silver Package', amount: 1000 },
		{ id: 3, label: 'Gold Package', amount: 2500 },
		{ id: 4, label: 'Platinum Package', amount: 5000 },
		{ id: 5, label: 'Custom', amount: 0 },
	];

	let selectedPackage: typeof packages[0] | null = null;

	function selectPackage(pkg: typeof packages[0]) {
		selectedPackage = pkg;
		if (pkg.amount > 0) contributionAmount = pkg.amount;
		packageDropdownOpen = false;
	}

	async function handleApprove() {
		if (!speakerData?.id || !eventId) return;
		approving = true;
		error = '';
		try {
			await approveParticipant(eventId, speakerData.id, {
				packageName: selectedPackage?.label,
				requirePayment,
				contributionAmount: requirePayment ? contributionAmount : undefined,
				currency: requirePayment ? currency : undefined,
				message: message || undefined,
			});
			dispatch('approved');
			open = false;
		} catch (e: any) {
			error = e.message || 'Failed to approve';
		} finally {
			approving = false;
		}
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
		<div class="animate-fadeIn max-h-180 md:max-h-150 w-full max-w-2xl rounded-2xl bg-[#FDFCFB] px-4 py-6 md:p-6 shadow-xl">
			<div class="relative flex w-full flex-col items-center">
				<div class="mb-3 flex h-18 w-18 items-center justify-center rounded-full bg-gray-100">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-2xl">
						<Icon icon="mdi:check-circle-outline" class="text-2xl text-green-600" />
					</div>
				</div>
				<h2 class="text-xl font-semibold text-gray-800">Approve {participantUp}: {participantName}</h2>
				<p class="text-sm text-gray-500">Review and approve this {participant}'s participation.</p>
				<button class="absolute top-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#EBECED]" on:click={() => (open = false)}>
					<Icon icon="mdi:close" class="text-lg font-bold" />
				</button>
			</div>

			<div class="custom-scrollbar mt-6 max-h-80 overflow-y-auto rounded-lg border p-4 md:max-h-60">
				{#if error}
					<p class="mb-3 text-sm text-red-500">{error}</p>
				{/if}

				<!-- Summary -->
				<div class="mb-4 rounded-md bg-gray-50 p-3">
					<p class="text-sm text-gray-600">Company/Name: <span class="font-medium text-gray-900">{participantName}</span></p>
					{#if speakerData?.applicationDetails?.bio}
						<p class="mt-1 text-sm text-gray-500">{speakerData.applicationDetails.bio}</p>
					{/if}
				</div>

				<div class="mt-4">
					<label class="flex text-gray-900">Assign Package <span class="ml-1 text-gray-500">(Optional)</span></label>
					<div use:clickOutside={() => (packageDropdownOpen = false)} class="relative w-full">
						<button class="mb-2 flex w-full cursor-pointer items-center justify-between rounded-lg border border-[#ECEDED] bg-white p-3 text-sm font-medium text-[#3a3b3d]" on:click={() => (packageDropdownOpen = !packageDropdownOpen)}>
							<span>{selectedPackage?.label || 'Select package'}</span>
							<img src="/arrow-left.svg" alt="" class="rotate-90 transform" />
						</button>
						{#if packageDropdownOpen}
							<div class="absolute left-0 z-10 w-full rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
								{#each packages as pkg}
									<button on:click={() => selectPackage(pkg)} class="flex w-full items-center justify-between rounded-sm p-2 hover:bg-gray-50 {selectedPackage?.id === pkg.id ? 'bg-[#F0F0F0]' : ''}">
										<span class="text-sm">{pkg.label}</span>
										{#if pkg.amount > 0}
											<span class="text-xs text-gray-400">${pkg.amount}</span>
										{/if}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<div class="mt-4">
					<label class="flex text-gray-900">Message to {participantUp} <span class="ml-1 text-gray-500">(Optional)</span></label>
					<textarea placeholder="Welcome them to the event or provide next steps." rows="3" bind:value={message} class="mt-2 w-full resize-none rounded-sm bg-[#FFFFFF] px-3 py-2 shadow-xs"></textarea>
				</div>

				<div class="mt-3 flex items-center gap-2">
					<button on:click={() => (requirePayment = !requirePayment)} class="flex h-4 w-4 items-center justify-center rounded-full border-2 {requirePayment ? 'bg-black' : 'border-gray-300'}">
						{#if requirePayment}
							<Icon icon="mdi:tick" class="text-2xl text-white" />
						{/if}
					</button>
					<p class="text-xs font-light text-gray-600">Require Payment for this package</p>
				</div>

				{#if requirePayment}
					<div class="mt-3 flex items-center gap-3">
						<div>
							<label class="text-xs text-gray-600">Amount</label>
							<input type="number" bind:value={contributionAmount} min="0" class="mt-1 w-32 rounded-sm bg-white px-3 py-2 shadow-xs" />
						</div>
						<div>
							<label class="text-xs text-gray-600">Currency</label>
							<select bind:value={currency} class="mt-1 rounded-sm bg-white px-3 py-2 shadow-xs">
								<option value="USD">USD</option>
								<option value="EUR">EUR</option>
								<option value="GBP">GBP</option>
								<option value="NGN">NGN</option>
							</select>
						</div>
					</div>
				{/if}
			</div>

			<div class="mt-6 flex items-center gap-2">
				<button on:click={() => (open = false)} class="rounded-md bg-white px-4 py-2 text-gray-600 shadow-xs">Cancel</button>
				<button on:click={handleApprove} disabled={approving} class="rounded-md bg-black px-4 py-2 text-white shadow-xs disabled:opacity-50">
					{approving ? 'Approving...' : `Approve ${participantUp}`}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.animate-fadeIn { animation: fade 0.15s ease-out; }
	@keyframes fade { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
</style>
