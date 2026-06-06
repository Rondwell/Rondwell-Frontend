<!--
	FE-P2-07 — KYC submission flow.

	Multi-step form:
	  1. ID type
	  2. ID number (BVN/NIN: 11 digits)
	  3. ID document upload (S3 presigned)
	  4. Address (HERE autocomplete)
	  5. Submit

	Backend: POST /api/v1/profile/kyc/submit
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import AddressAutocomplete from '$lib/components/AddressAutocomplete.svelte';
	import {
		submitKyc,
		uploadKycDocument,
		type IdType,
		type KycAddress,
	} from '$lib/services/kyc.services';
	import { loadKyc } from '$lib/stores/kyc.store';
	import { toast } from '$lib/stores/toast.store';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import Icon from '@iconify/svelte';

	let step: 1 | 2 | 3 | 4 | 5 = 1;
	let idType: IdType = 'PASSPORT';
	let idNumber = '';
	let bvn = '';
	let nin = '';
	let idDocumentUrl = '';
	let uploadingDoc = false;
	let docUploadError = '';

	let addressInput = '';
	let address: KycAddress = { country: 'Nigeria' };

	let submitting = false;
	let error = '';

	const ID_TYPES: { value: IdType; label: string; hint?: string }[] = [
		{ value: 'PASSPORT', label: 'International passport' },
		{ value: 'DRIVERS_LICENSE', label: "Driver's licence" },
		{ value: 'NATIONAL_ID', label: 'National ID card' },
	];

	$: needsExactDigits = false;
	$: idNumberValid = idNumber.trim().length >= 4;
	$: addressValid = !!(address.country && (address.formatted || address.street));

	function next() {
		if (step === 1 && !idType) return;
		if (step === 2 && !idNumberValid) return;
		if (step === 3 && !idDocumentUrl) {
			docUploadError = 'Please upload a photo or PDF of your ID document.';
			return;
		}
		if (step === 4 && !addressValid) return;
		step = (step + 1) as typeof step;
	}

	function back() {
		if (step > 1) step = (step - 1) as typeof step;
	}

	async function handleFileChange(e: Event) {
		const file = (e.currentTarget as HTMLInputElement)?.files?.[0];
		if (!file) return;
		uploadingDoc = true;
		docUploadError = '';
		try {
			const result = await uploadKycDocument(file);
			idDocumentUrl = result.url;
		} catch (err: any) {
			docUploadError = financialErrorMessage(err);
		} finally {
			uploadingDoc = false;
		}
	}

	function handleAddressSelect(e: CustomEvent) {
		const detail = e.detail as { address: string; lat: number; lng: number; formatted_address: string };
		address = {
			...address,
			formatted: detail.formatted_address || detail.address,
			street: detail.address,
			lat: detail.lat,
			lng: detail.lng,
		};
	}

	async function handleSubmit() {
		submitting = true;
		error = '';
		try {
			await submitKyc({
				idType,
				idNumber,
				idDocumentUrl: idDocumentUrl || undefined,
				bvn: bvn || (idType === 'BVN' ? idNumber : undefined),
				nin: nin || (idType === 'NIN' ? idNumber : undefined),
				address,
			});
			await loadKyc(true);
			toast.success('KYC submitted. We\'ll email you when the review completes.');
			goto('/account/kyc/status');
		} catch (err: any) {
			error = financialErrorMessage(err);
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head><title>Verify your identity — Rondwell</title></svelte:head>

<div class="max-w-2xl">
	<button
		on:click={() => goto('/account/kyc')}
		class="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
	>
		<Icon icon="mdi:arrow-left" /> Back
	</button>

	<div class="rounded-xl border bg-white p-6">
		<!-- Important notice -->
		<div class="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
			<Icon icon="mdi:information-outline" class="mt-0.5 shrink-0 text-lg text-amber-600" />
			<p class="text-xs text-amber-800">
				<strong>Important:</strong> Please ensure your profile information (name, date of birth) matches the details on your ID document before submitting. Mismatches will result in rejection.
				<a href="/settings" class="font-medium text-amber-900 underline">Update your profile</a>
			</p>
		</div>

		<!-- Progress -->
		<div class="mb-6 flex items-center gap-2">
			{#each [1, 2, 3, 4, 5] as s}
				<div
					class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold {step >= s
						? 'bg-pink-600 text-white'
						: 'bg-gray-200 text-gray-500'}"
				>
					{s}
				</div>
				{#if s < 5}
					<div class="h-px flex-1 {step > s ? 'bg-pink-600' : 'bg-gray-200'}"></div>
				{/if}
			{/each}
		</div>

		{#if error}
			<p class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
		{/if}

		<!-- Step 1: ID type -->
		{#if step === 1}
			<h2 class="text-lg font-semibold">Choose your ID type</h2>
			<p class="text-sm text-gray-500">Pick the document you'll verify with.</p>
			<div class="mt-4 space-y-2">
				{#each ID_TYPES as t}
					<button
						type="button"
						on:click={() => (idType = t.value)}
						class="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition {idType === t.value
							? 'border-pink-500 bg-pink-50'
							: 'border-gray-200 bg-white hover:bg-gray-50'}"
					>
						<Icon
							icon={idType === t.value ? 'mdi:radiobox-marked' : 'mdi:radiobox-blank'}
							class={idType === t.value ? 'text-lg text-pink-600' : 'text-lg text-gray-400'}
						/>
						<div>
							<p class="text-sm font-medium">{t.label}</p>
							{#if t.hint}<p class="text-xs text-gray-400">{t.hint}</p>{/if}
						</div>
					</button>
				{/each}
			</div>

			<!-- Step 2: ID number -->
		{:else if step === 2}
			<h2 class="text-lg font-semibold">Enter your ID number</h2>
			<p class="text-sm text-gray-500">
				This must match the ID document you'll upload next.
			</p>
			<div class="mt-4">
				<label for="kyc-id-number" class="text-xs text-gray-500">
					{ID_TYPES.find((t) => t.value === idType)?.label} number
				</label>
				<input
					id="kyc-id-number"
					type="text"
					bind:value={idNumber}
					inputmode="text"
					maxlength={30}
					placeholder="Enter your document number"
					class="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
				/>
			</div>

			<!-- Step 3: Upload document -->
		{:else if step === 3}
			<h2 class="text-lg font-semibold">Upload your ID document</h2>
			<p class="text-sm text-gray-500">
				A clear photo or PDF of your {ID_TYPES.find((t) => t.value === idType)?.label}. JPG, PNG, or
				PDF, up to 10 MB.
			</p>
			{#if docUploadError}
				<p class="mt-3 rounded-md bg-red-50 p-2 text-xs text-red-600">{docUploadError}</p>
			{/if}
			<div class="mt-4">
				<label
					class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center transition hover:bg-gray-100"
				>
					<Icon icon="mdi:cloud-upload-outline" class="text-3xl text-gray-400" />
					<p class="mt-2 text-sm font-medium text-gray-700">
						{idDocumentUrl ? 'File uploaded' : 'Click to upload'}
					</p>
					<p class="text-xs text-gray-400">JPG, PNG, or PDF</p>
					<input
						type="file"
						accept="image/jpeg,image/png,image/jpg,application/pdf"
						class="hidden"
						on:change={handleFileChange}
					/>
				</label>
				{#if uploadingDoc}
					<p class="mt-2 flex items-center gap-2 text-xs text-gray-500">
						<Icon icon="mdi:loading" class="animate-spin" /> Uploading…
					</p>
				{:else if idDocumentUrl}
					<p class="mt-2 flex items-center gap-2 text-xs text-green-600">
						<Icon icon="mdi:check-circle" /> Document uploaded.
					</p>
				{/if}
			</div>

			<!-- Step 4: Address -->
		{:else if step === 4}
			<h2 class="text-lg font-semibold">Your residential address</h2>
			<p class="text-sm text-gray-500">Used for compliance review and tax filings.</p>
			<div class="mt-4">
				<AddressAutocomplete
					bind:value={addressInput}
					placeholder="Start typing your address…"
					on:select={handleAddressSelect}
				/>
				{#if address.formatted}
					<p class="mt-2 text-xs text-gray-500">
						<Icon icon="mdi:check-circle" class="mr-1 inline text-green-500" />
						{address.formatted}
					</p>
				{/if}
				<div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
					<input
						type="text"
						bind:value={address.city}
						placeholder="City"
						class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
					/>
					<input
						type="text"
						bind:value={address.state}
						placeholder="State / Province"
						class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
					/>
					<input
						type="text"
						bind:value={address.postalCode}
						placeholder="Postal code"
						class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
					/>
					<input
						type="text"
						bind:value={address.country}
						placeholder="Country"
						class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
					/>
				</div>
			</div>

			<!-- Step 5: Confirm -->
		{:else if step === 5}
			<h2 class="text-lg font-semibold">Review &amp; submit</h2>
			<p class="text-sm text-gray-500">Confirm everything is correct before submitting.</p>
			<dl class="mt-4 space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
				<div class="flex justify-between">
					<dt class="text-gray-500">ID type</dt>
					<dd class="font-medium">{ID_TYPES.find((t) => t.value === idType)?.label}</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-gray-500">ID number</dt>
					<dd class="font-mono">{idNumber}</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-gray-500">Document</dt>
					<dd>{idDocumentUrl ? 'Uploaded ✓' : 'None'}</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-gray-500">Address</dt>
					<dd class="text-right text-xs">{address.formatted || address.street || '—'}</dd>
				</div>
			</dl>
			<p class="mt-3 text-xs text-gray-400">
				Submitting your KYC sends it to our compliance team for review. You'll get an email when the
				review is done — typically within 24 hours.
			</p>
		{/if}

		<div class="mt-6 flex justify-between gap-2">
			<button
				on:click={back}
				disabled={step === 1 || submitting}
				class="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
			>
				Back
			</button>
			{#if step < 5}
				<button
					on:click={next}
					disabled={(step === 2 && !idNumberValid) ||
						(step === 3 && !idDocumentUrl) ||
						(step === 4 && !addressValid)}
					class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
				>
					Continue
				</button>
			{:else}
				<button
					on:click={handleSubmit}
					disabled={submitting}
					class="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-50"
				>
					{submitting ? 'Submitting…' : 'Submit verification'}
				</button>
			{/if}
		</div>
	</div>
</div>
