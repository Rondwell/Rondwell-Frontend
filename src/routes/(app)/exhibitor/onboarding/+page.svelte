<script lang="ts">
	import { goto } from '$app/navigation';
	import OnboardingNavButtons from '$lib/components/onboarding/OnboardingNavButtons.svelte';
	import OnboardingProgressBar from '$lib/components/onboarding/OnboardingProgressBar.svelte';
	import PaymentPricingStep from '$lib/components/onboarding/PaymentPricingStep.svelte';
	import SummaryRow from '$lib/components/onboarding/SummaryRow.svelte';
	import TaxRateModal from '$lib/components/onboarding/TaxRateModal.svelte';
	import { completeOnboarding } from '$lib/services/profile.services';
	import { setActiveProfile } from '$lib/stores/auth.store';
	import { toast } from '$lib/stores/toast.store';
	import { colors, type Color } from '$lib/utils/colors';
	import countries from '$lib/utils/countries.json';
	import { onDestroy } from 'svelte';
	import OnboardingNavbar from '../../components/OnboardingNavbar.svelte';

	// ============================================
	// INTERFACES
	// ============================================
	interface BusinessType {
		label: string;
		icon: string;
	}

	// ============================================
	// THEME
	// ============================================
	let selectedColor: Color = colors[7];

	// ============================================
	// STEP CONTROL
	// ============================================
	const totalSteps = 3;
	const steps = ['Exhibitor Details', 'Payment & Pricing Setup', 'Summary'];
	let currentStep = $state(1);
	let isSubmitting = $state(false);

	// ============================================
	// STEP 1: EXHIBITOR DETAILS
	// ============================================
	let businessLogo = $state<File | null>(null);
	let businessLogoPreview = $state('');
	let coverImage = $state<File | null>(null);
	let coverImagePreview = $state('');
	let companyName = $state('');
	let selectedBusinessType = $state<BusinessType | null>(null);
	let companyDescription = $state('');
	let businessLocation = $state('');
	let phoneNumber = $state('');
	let emailAddress = $state('');
	let websiteURL = $state('');
	let tempLocation = $state('');
	let error = $state('');
	let selectedCountry = $state(countries[0]);
	let showBusinessTypeDropdown = $state(false);
	let otherBusinessType = $state('');
	let showModal = $state(false);
	let open = $state(false);

	// ============================================
	// STEP 2: PAYMENT & PRICING
	// ============================================
	let paymentMethods = $state<string[]>(['paystack']);
	let currencies = $state<string[]>(['NGN']);
	let taxRate = $state(0);
	let showTaxModal = $state(false);

	// ============================================
	// CONSTANTS
	// ============================================
	const businessTypes: BusinessType[] = [
		{ label: 'Technology & Software', icon: '/technology.svg' },
		{ label: 'Financial Services', icon: '/finance.svg' },
		{ label: 'Healthcare & Wellness', icon: '/healthcare.svg' },
		{ label: 'Education & Training', icon: '/education.svg' },
		{ label: 'Entertainment', icon: '/entertainment.svg' },
		{ label: 'Manufacturing', icon: '/manufacturing.svg' },
		{ label: 'Retail & E-commerce', icon: '/retail.svg' },
		{ label: 'Marketing & Advertising', icon: '/marketing.svg' },
		{ label: 'Professional Services', icon: '/professional-service.svg' },
		{ label: 'Transportation & Mobility', icon: '/transportation.svg' },
		{ label: 'Food & Hospitality', icon: '/food.svg' },
		{ label: 'Other', icon: '/other.svg' }
	];

	// ============================================
	// DERIVED
	// ============================================
	let canProceedStep1 = $derived(
		!!(companyName && selectedBusinessType && emailAddress && phoneNumber)
	);
	let canProceedStep2 = $derived(paymentMethods.length > 0);
	let canProceed = $derived(
		currentStep === 1 ? canProceedStep1 : currentStep === 2 ? canProceedStep2 : true
	);

	// ============================================
	// FILE UPLOAD HANDLERS
	// ============================================
	function handleLogoUpload(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;
		businessLogo = file;
		const reader = new FileReader();
		reader.onload = (e) => { businessLogoPreview = e.target?.result as string; };
		reader.readAsDataURL(file);
	}

	function handleCoverUpload(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
		if (!validTypes.includes(file.type)) {
			alert('Please upload a valid file: JPEG, PNG, or PDF format');
			return;
		}
		if (file.size > 50 * 1024 * 1024) {
			alert('File size must be less than 50MB');
			return;
		}
		coverImage = file;
		if (file.type.startsWith('image/')) {
			const reader = new FileReader();
			reader.onload = (e) => { coverImagePreview = e.target?.result as string; };
			reader.readAsDataURL(file);
		} else {
			coverImagePreview = '/pdf-placeholder.svg';
		}
	}

	function removeCoverImage() {
		coverImage = null;
		coverImagePreview = '';
		const input = document.getElementById('coverInput') as HTMLInputElement | null;
		if (input) input.value = '';
	}

	// ============================================
	// MODAL HANDLERS
	// ============================================
	function openLocationModal() {
		tempLocation = businessLocation;
		error = '';
		showModal = true;
	}

	function saveLocation() {
		if (tempLocation.trim().length < 5) {
			error = 'Please enter a valid location';
			return;
		}
		businessLocation = tempLocation;
		showModal = false;
	}

	// ============================================
	// SELECTION HANDLERS
	// ============================================
	function selectBusinessType(type: BusinessType) {
		selectedBusinessType = type;
		showBusinessTypeDropdown = false;
		if (type.label !== 'Other') otherBusinessType = '';
	}

	function confirmOther() {
		if (otherBusinessType.trim()) {
			selectedBusinessType = { label: otherBusinessType, icon: '/other.svg' };
			showBusinessTypeDropdown = false;
		}
	}

	function selectCountry(country: (typeof countries)[0]) {
		selectedCountry = country;
		open = false;
	}

	function togglePaymentMethod(method: string) {
		const idx = paymentMethods.indexOf(method);
		if (idx > -1) {
			if (paymentMethods.length > 1) paymentMethods = paymentMethods.filter((m) => m !== method);
		} else {
			paymentMethods = [...paymentMethods, method];
		}
	}

	function toggleCurrency(curr: string) {
		const idx = currencies.indexOf(curr);
		if (idx > -1) {
			if (currencies.length > 1) currencies = currencies.filter((c) => c !== curr);
		} else {
			currencies = [...currencies, curr];
		}
	}

	function getPaymentMethodDisplay() {
		return paymentMethods.map((m) => m === 'paystack' ? 'Paystack' : m === 'flutterwave' ? 'Flutterwave' : m === 'stripe' ? 'Stripe' : m).join(', ');
	}

	function getCurrencyDisplay() {
		return currencies.join(', ');
	}

	// ============================================
	// NAVIGATION
	// ============================================
	function editField(step: number) {
		if (step <= currentStep) currentStep = step;
	}

	function nextStep() {
		if (currentStep < totalSteps) currentStep++;
	}

	function prevStep() {
		if (currentStep > 1) currentStep--;
	}

	// ============================================
	// SUBMIT
	// ============================================
	async function submitOnboarding() {
		isSubmitting = true;
		try {
			const data = await completeOnboarding('exhibitor', {
				companyName,
				industry: selectedBusinessType?.label || '',
				companyDescription,
				businessLocation,
				contactInfo: {
					email: emailAddress,
					phone: `${selectedCountry.dial_code}${phoneNumber}`,
					website: websiteURL
				},
				paymentMethods,
				currencies,
				taxRate
			});

			if (data?.profile) {
				setActiveProfile({
					_id: data.profile._id,
					role: 'EXHIBITOR',
					name: data.profile.name || companyName,
					profilePictureUrl: data.profile.profilePictureUrl,
					onboardingStatus: 'COMPLETED'
				});
			}

			toast.success('Exhibitor profile created successfully!');
			goto('/exhibitor');
		} catch (err: any) {
			toast.error(err.message || 'Failed to complete onboarding');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div
	class="relative flex min-h-screen flex-col overflow-auto bg-cover bg-center bg-no-repeat"
	style="background-image: url('/exhibitor-bg.png'); color: {selectedColor.text};"
>
	<OnboardingNavbar />
	<main class="relative mb-[106px] flex-1 px-5 md:mb-0">
		<div class="mx-auto mb-8 overflow-x-hidden">
			<OnboardingProgressBar {steps} {currentStep} onStepClick={editField} />
		</div>

		<div
			class="mx-auto mb-20 w-full rounded-[16px] p-3 md:max-w-[716px]"
			style="background-color: {selectedColor.cover}; box-shadow: 0px 1px 2px 0px #0A0D1408;"
		>
			{#if currentStep === 1}
				<!-- Step 1: Exhibitor Details -->
				<div class="space-y-6 rounded-xl">
					<div class="mb-6 text-center">
						<div class="mx-auto h-[96px] w-[96px]">
							<img src="/detail-icon.svg" alt="detail-icon" class="h-full w-full" />
						</div>
						<div class="text-[24px] font-semibold text-[#171717]">Exhibitor Details</div>
						<p class="mt-1 text-sm text-[#5C5C5C]">Provide essential Exhibitor Details to proceed.</p>
					</div>
					<div class="my-8 h-[1px] w-full bg-[#EBEBEB]"></div>

					<!-- Images Upload -->
					<div class="grid grid-cols-1 items-center gap-6 rounded-2xl border p-3 md:grid-cols-3" style="box-shadow: 0px 1px 2px 0px #0A0D1408;">
						<div class="col-span-1 space-y-2 md:border-r-1">
							<div
								class="flex h-40 cursor-pointer flex-col items-center justify-center space-y-2 rounded-[10px] transition-colors"
								onclick={() => document.getElementById('logoInput')?.click()}
								onkeydown={(e) => e.key === 'Enter' && document.getElementById('logoInput')?.click()}
								role="button"
								tabindex="0"
							>
								{#if businessLogoPreview}
									<img src={businessLogoPreview} alt="Business Logo" class="h-full w-full rounded-[10px] object-cover px-10 py-5" />
								{:else}
									<img src="/avatar.svg" alt="avatar" />
									<div class="text-sm font-medium">Business Logo</div>
									<span class="mt-1 text-xs" style="color: {selectedColor.lightText}">Max file size: 1MB</span>
									<button class="h-[32px] rounded-[10px] border px-6 text-sm" style="color: {selectedColor.lightText}">Add Image</button>
								{/if}
							</div>
							<input id="logoInput" type="file" accept="image/*" class="hidden" onchange={handleLogoUpload} />
						</div>

						<div class="col-span-2 space-y-2">
							<div class="text-sm font-medium">Cover/Banner Image</div>
							<div
								class="relative flex h-40 cursor-pointer flex-col items-center justify-around rounded-[10px]"
								style="border: 1px dashed #D1D1D1;"
								onclick={() => !coverImagePreview && document.getElementById('coverInput')?.click()}
								onkeydown={(e) => e.key === 'Enter' && !coverImagePreview && document.getElementById('coverInput')?.click()}
								role="button"
								tabindex="0"
							>
								{#if coverImagePreview}
									<img src={coverImagePreview} alt="Cover" class="h-full w-full rounded-[10px] object-cover" />
									<div class="absolute inset-0 flex items-center justify-center gap-3 rounded-[10px] bg-black/40 opacity-0 transition-opacity hover:opacity-100">
										<button type="button" class="rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#171717] hover:bg-gray-100" onclick={(e) => { e.stopPropagation(); document.getElementById('coverInput')?.click(); }}>Change</button>
										<button type="button" class="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-red-600" onclick={(e) => { e.stopPropagation(); removeCoverImage(); }}>Remove</button>
									</div>
								{:else}
									<img src="/upload.svg" alt="upload-icon" />
									<div class="px-4 text-center">
										<p class="text-sm">Choose a file or drag & drop it here.</p>
										<p class="mt-1 text-xs" style="color: {selectedColor.lightText}">JPEG, PNG, PDF formats, up to 50 MB</p>
									</div>
									<button type="button" class="mx-auto flex h-[32px] items-center rounded-[10px] border px-6 text-sm font-medium text-[#5C5C5C] hover:bg-gray-50" onclick={(e) => { e.stopPropagation(); document.getElementById('coverInput')?.click(); }}>Browse File</button>
								{/if}
							</div>
							<input id="coverInput" type="file" accept="image/jpeg,image/jpg,image/png,application/pdf" class="hidden" onchange={handleCoverUpload} />
							{#if coverImage}
								<div class="text-xs text-gray-500">Selected: {coverImage.name} ({(coverImage.size / 1024 / 1024).toFixed(2)} MB)</div>
							{/if}
						</div>
					</div>

					<!-- Company Information -->
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="space-y-2 md:col-span-1">
							<label for="companyName" class="text-sm font-medium">Company Name <span class="text-[#335CFF]">*</span></label>
							<input id="companyName" type="text" bind:value={companyName} placeholder="Synergy HR" class="h-[40px] w-full rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-3 text-sm focus:outline-none" style="box-shadow: 0px 1px 2px 0px #0A0D1408;" />
						</div>

						<div class="relative space-y-2">
							<label for="businessType" class="text-sm font-medium">Business Type/Category <span class="text-[#335CFF]">*</span></label>
							<button id="businessType" type="button" class="h-[40px] w-full appearance-none rounded-[10px] border border-[#EBEBEB] bg-white px-4 pr-10 text-left text-sm focus:outline-none" style="box-shadow: 0px 1px 2px 0px #0A0D1408; background-image: url('/arrow-dropdown.svg'); background-repeat: no-repeat; background-position: right 12px center; background-size: 14px;" onclick={() => (showBusinessTypeDropdown = !showBusinessTypeDropdown)}>
								{#if selectedBusinessType}
									<div class="flex items-center gap-2">
										<img src={selectedBusinessType.icon} alt="icon" class="h-5 w-5" />
										<span>{selectedBusinessType.label}</span>
									</div>
								{:else}
									<span class="text-[#A3A3A3]">Select business type</span>
								{/if}
							</button>
							{#if showBusinessTypeDropdown}
								<div class="absolute top-full left-0 z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border bg-white p-2 shadow-lg">
									{#each businessTypes as type}
										{#if type.label !== 'Other'}
											<button type="button" class="flex w-full items-center gap-2 rounded-md px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 {selectedBusinessType?.label === type.label ? 'bg-blue-50' : ''}" onclick={() => selectBusinessType(type)}>
												<img src={type.icon} alt={type.label} class="h-5 w-5" />
												<span>{type.label}</span>
											</button>
										{/if}
									{/each}
									<div class="mt-1 flex items-center gap-2 border-t px-4 py-2 pt-3">
										<img src="/other.svg" alt="other" class="h-5 w-5" />
										<input type="text" bind:value={otherBusinessType} placeholder="Other business type..." class="w-full rounded border border-[#EBEBEB] px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none" onclick={(e) => e.stopPropagation()} onkeydown={(e) => { e.stopPropagation(); if (e.key === 'Enter') confirmOther(); }} />
										<button type="button" class="rounded bg-blue-500 px-3 py-1 text-sm font-medium whitespace-nowrap text-white hover:bg-blue-600" onclick={confirmOther}>Add</button>
									</div>
								</div>
							{/if}
						</div>

						<div class="space-y-2 md:col-span-2">
							<label for="companyDesc" class="text-sm font-medium">Company Description <span class="font-normal text-[#5C5C5C]">(Optional)</span></label>
							<div class="relative w-full">
								<textarea id="companyDesc" bind:value={companyDescription} placeholder="Describe your company..." maxlength="200" rows="3" class="h-[56px] w-full resize-none rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-3 pr-14 text-sm placeholder:text-[#A3A3A3] focus:outline-none" style="box-shadow: 0px 1px 2px 0px #0A0D1408;"></textarea>
								<span class="pointer-events-none absolute right-5 bottom-3 text-xs" style="color: {selectedColor.lightText}">{companyDescription.length}/200</span>
							</div>
						</div>
					</div>

					<!-- Business Location -->
					<div class="space-y-2">
						<label class="text-sm font-medium" for="location-btn">Business Location/Service Area <span class="text-[#335CFF]">*</span></label>
						<button id="location-btn" class="flex h-14 w-full items-start gap-2 rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-3 text-left shadow-[0_1px_2px_0_#0A0D1408]" onclick={openLocationModal}>
							<img src="/location-add.svg" alt="location" class="h-4 w-4" />
							<div>
								{#if businessLocation}
									<p class="text-sm text-[#111]">{businessLocation}</p>
									<p class="text-xs text-[#A9AAAA]">Click to edit location</p>
								{:else}
									<p class="text-sm text-[#616265]">Add Business Location</p>
									<p class="text-xs text-[#A9AAAA]">Offline location or virtual link</p>
								{/if}
							</div>
						</button>
					</div>

					<!-- Location Modal -->
					{#if showModal}
						<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
							<div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
								<h3 class="mb-4 text-lg font-semibold">Add Business Location</h3>
								<input type="text" bind:value={tempLocation} placeholder="e.g. Ikeja, Lagos or Online (Zoom)" class="w-full rounded-lg border border-[#EBEBEB] px-4 py-3 text-sm focus:ring-2 focus:ring-[#335CFF] focus:outline-none" />
								{#if error}
									<p class="mt-2 text-xs text-red-500">{error}</p>
								{/if}
								<p class="mt-2 text-xs text-[#A9AAAA]">Enter a physical address or an online meeting link</p>
								<div class="mt-6 flex justify-end gap-3">
									<button class="rounded-lg px-4 py-2 text-sm text-gray-600" onclick={() => (showModal = false)}>Cancel</button>
									<button class="rounded-lg bg-[#335CFF] px-4 py-2 text-sm text-white" onclick={saveLocation}>Save Location</button>
								</div>
							</div>
						</div>
					{/if}

					<!-- Contact Information -->
					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div class="space-y-2">
							<label for="phone" class="text-sm font-medium">Phone Number <span class="text-[#335CFF]">*</span></label>
							<div class="relative flex rounded-[10px] border border-[#EBEBEB] bg-white text-sm">
								<button type="button" class="flex w-[96px] items-center gap-2 border-r border-[#EBEBEB] px-2 py-3" style="box-shadow: 0px 1px 2px 0px #0A0D1408;" onclick={() => (open = !open)}>
									<img src={selectedCountry.flag} alt={selectedCountry.name} class="h-5 w-5 rounded-full object-cover" />
									<span class="text-xs">{selectedCountry.dial_code}</span>
									<svg class="ml-auto h-4 w-4 text-gray-500 transition-transform duration-200" class:rotate-180={open} viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd" />
									</svg>
								</button>
								<input id="phone" type="tel" bind:value={phoneNumber} placeholder="(555) 000-0000" class="w-full flex-1 px-4 py-3 text-sm placeholder:text-[#A3A3A3] focus:outline-none" oninput={(e) => { const t = e.target as HTMLInputElement; t.value = t.value.replace(/[^0-9]/g, ''); phoneNumber = t.value; }} />
								{#if open}
									<ul class="absolute top-full left-0 z-50 mt-1 max-h-64 w-72 overflow-auto rounded-lg border bg-white shadow-lg">
										{#each countries as country}
											<li class="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-gray-100" onclick={() => selectCountry(country)} onkeydown={(e) => e.key === 'Enter' && selectCountry(country)} role="option" tabindex="0" aria-selected={selectedCountry === country}>
												<img src={country.flag} alt={country.name} class="h-5 w-7 rounded-sm object-cover" />
												<span class="text-sm">{country.name}</span>
												<span class="ml-auto text-xs text-gray-500">{country.dial_code}</span>
											</li>
										{/each}
									</ul>
								{/if}
							</div>
						</div>

						<div class="space-y-2">
							<label for="email" class="text-sm font-medium">Email Address <span class="text-[#335CFF]">*</span></label>
							<div class="flex items-center gap-0 rounded-[10px] border border-[#EBEBEB] bg-white px-3 text-sm">
								<img src="/mail-line.svg" alt="mail" class="h-5 w-5" />
								<input id="email" type="email" bind:value={emailAddress} placeholder="hello@company.com" class="w-full rounded-[10px] px-4 py-3 focus:outline-none" />
							</div>
						</div>

						<div class="space-y-2">
							<label for="website" class="text-sm font-medium">Website URL</label>
							<div class="flex w-full items-center rounded-[10px] border border-[#EBEBEB] bg-white px-3 text-sm focus:outline-none" style="box-shadow: 0px 1px 2px 0px #0A0D1408;">
								<div class="border-r py-3 pr-3 text-[#5C5C5C]">https://</div>
								<input id="website" type="url" bind:value={websiteURL} placeholder="www.example.com" class="w-full pl-3 placeholder:text-[#171717] focus:outline-none" />
							</div>
						</div>
					</div>
				</div>
			{:else if currentStep === 2}
				<PaymentPricingStep
					{paymentMethods}
					{currencies}
					{taxRate}
					onTogglePayment={togglePaymentMethod}
					onToggleCurrency={toggleCurrency}
					onOpenTaxModal={() => (showTaxModal = true)}
				/>
			{:else}
				<!-- Step 3: Summary -->
				<div class="space-y-6">
					<div class="text-center">
						<div class="mx-auto h-[96px] w-[96px]">
							<img src="/summary-icon.svg" alt="summary-icon" class="h-full w-full" />
						</div>
						<h3 class="mb-2 text-2xl font-medium">Onboarding Summary</h3>
						<p class="-mt-2 text-[16px] text-[#5C5C5C]">Review and complete your account setup.</p>
					</div>
					<div class="my-8 h-[1px] w-full bg-[#EBEBEB]"></div>

					<div class="space-y-3 rounded-2xl border bg-white px-4" style="box-shadow: 0px 1px 2px 0px #0A0D1408;">
						<SummaryRow icon="/account-pin-box-line.svg" label="Company Name" value={companyName} editStep={1} onEdit={editField} />
						<SummaryRow icon="/grid-icon.svg" label="Business Type/Category" value={otherBusinessType || selectedBusinessType?.label || 'Not selected'} editStep={1} onEdit={editField} />
						<SummaryRow icon="/phone-icon.svg" label="Phone Number" value={phoneNumber || 'Not provided'} editStep={1} onEdit={editField} />
						<SummaryRow icon="/mail-icon.svg" label="Email Address" value={emailAddress} editStep={1} onEdit={editField} />
						{#if websiteURL}
							<SummaryRow icon="/globe-icon.svg" label="Website URL" value={websiteURL} editStep={1} onEdit={editField} />
						{/if}
						<SummaryRow icon="/bank-icon.svg" label="Payment Method" value={getPaymentMethodDisplay()} editStep={2} onEdit={editField} />
						<SummaryRow icon="/currency-icon.svg" label="Preferred Currency" value={getCurrencyDisplay()} editStep={2} onEdit={editField} showBorder={false} />
					</div>
				</div>
			{/if}

			<OnboardingNavButtons
				{currentStep}
				{totalSteps}
				{canProceed}
				{isSubmitting}
				onNext={nextStep}
				onPrev={prevStep}
				onSubmit={submitOnboarding}
			/>
		</div>
	</main>
</div>

<TaxRateModal
	show={showTaxModal}
	{taxRate}
	onSave={(rate) => { taxRate = rate; showTaxModal = false; }}
	onCancel={() => (showTaxModal = false)}
/>
