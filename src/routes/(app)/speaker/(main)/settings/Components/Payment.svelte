<script lang="ts">
	let paymentMethod = 'Paystack';
	let currency = 'USD';
	let taxDescription = '';
	let saving = false;
	let saveSuccess = false;
	let saveError = '';

	function handleSave() {
		saving = true;
		saveError = '';
		saveSuccess = false;
		// Placeholder — wire to backend when payment API is ready
		setTimeout(() => {
			saving = false;
			saveSuccess = true;
			setTimeout(() => (saveSuccess = false), 3000);
		}, 800);
	}
</script>

<div class="w-full max-w-5xl p-4 md:p-6">
	<!-- Header -->
	<h1 class="text-lg font-bold text-gray-900">Payment & Financial Settings</h1>
	<p class="text-sm text-gray-400 mt-1">Set up how you receive payments for your speaking engagements through Rondwell.</p>

	<!-- Success / Error Banners -->
	{#if saveSuccess}
		<div class="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
			<img src="/profile-gear.svg" alt="Success" class="h-4 w-4" /> Payment settings saved successfully.
		</div>
	{/if}
	{#if saveError}
		<div class="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
			{saveError}
		</div>
	{/if}

	<hr class="mt-4 border-gray-200" />

	<!-- Payment Methods -->
	<div class="pt-4">
		<h2 class="text-lg font-medium text-gray-900 mb-1">Payment Methods</h2>
		<p class="text-sm text-gray-500 mb-6">
			Your saved payment methods are encrypted and stored securely by PayPal & Flutterwave.
		</p>

		<!-- Selects -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
			<div>
				<label for="payment-method" class="block text-sm font-medium text-gray-700 mb-1">
					Select Payment Method <img src="/info-itallic.svg" alt="Info" class="w-6 h-6 ml-1 inline" />
				</label>
				<div class="relative">
					<select
						id="payment-method"
						bind:value={paymentMethod}
						class="w-full appearance-none rounded-lg border border-gray-300 bg-white pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
					>
						<option>Paystack</option>
						<option>Flutterwave</option>
						<option>PayPal</option>
					</select>
					<img
						src="/arrow-dropdown.svg"
						alt="Dropdown arrow"
						class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
					/>
				</div>
			</div>

			<div>
				<label for="currency" class="block text-sm font-medium text-gray-700 mb-1">
					Select Preferred Currency <img src="/info-itallic.svg" alt="Info" class="w-6 h-6 ml-1 inline" />
				</label>
				<div class="relative">
					<select
						id="currency"
						bind:value={currency}
						class="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
					>
						<option value="USD">US Dollar ($)</option>
						<option value="NGN">Nigerian Naira (₦)</option>
						<option value="GBP">British Pound (£)</option>
						<option value="EUR">Euro (€)</option>
						<option value="GHS">Ghanaian Cedi (₵)</option>
						<option value="KES">Kenyan Shilling (KSh)</option>
						<option value="ZAR">South African Rand (R)</option>
					</select>
					<img
						src="/arrow-dropdown.svg"
						alt="Dropdown arrow"
						class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
					/>
				</div>
			</div>
		</div>

		<!-- Buttons -->
		<div class="flex flex-col items-start gap-4 pb-2 sm:flex-row sm:items-center">
			<button class="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
				<img src="/plus.svg" alt="Plus icon" class="mr-2 inline h-4 w-4" />Link Bank Account
			</button>
		</div>
	</div>

	<hr class="my-6 border-gray-200" />

	<!-- Tax Information -->
	<div class="p-2">
		<h2 class="text-lg font-medium text-gray-900 mb-1">Tax Information</h2>
		<p class="text-sm text-gray-500 mb-6">Enter your tax identification number if applicable</p>

		<div class="mb-2">
			<label for="tax-desc" class="block text-sm font-medium text-gray-700 mb-1">
				Company Description <span class="text-blue-500">*</span> <span class="text-gray-400">(Optional)</span>
			</label>
			<div class="relative">
				<textarea
					id="tax-desc"
					bind:value={taxDescription}
					rows="1"
					maxlength="200"
					placeholder="Describe your company or practice..."
					class="w-full resize-none rounded-lg border border-gray-300 pl-4 pr-28 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
				></textarea>
				<p class="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 text-xs text-gray-400">
					{taxDescription.length}/200
				</p>
				<img
					src="/Resize.svg"
					alt="Resize icon"
					class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
				/>
			</div>

			<div class="mt-1">
				<p class="text-xs text-gray-400">
					<img src="/info-itallic.svg" alt="Info icon" class="w-6 h-6 mr-1 inline" />Rondwell does not provide tax advice. Please consult with a tax professional.
				</p>
			</div>
		</div>

		<!-- Save -->
		<button
			on:click={handleSave}
			disabled={saving}
			class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50 sm:w-auto sm:justify-start"
		>
			{#if saving}
				Saving...
			{:else}
				<img src="/profile-gear.svg" alt="Save icon" class="pr-2" />Save Changes
			{/if}
		</button>
	</div>
</div>
