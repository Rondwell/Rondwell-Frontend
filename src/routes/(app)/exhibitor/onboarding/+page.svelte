<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';
	import { colors, type Color } from '$lib/utils/colors';
	import { goto } from '$app/navigation';
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
	// REACTIVE STATE - All UI state using $state()
	// ============================================

	let now = $state(formatTime());
	let selectedStyle = $state('Minimal');
	let selectedFont = $state('Default');
	let selectedColor = $state<Color>(colors[7]);
	let background_color = $state('#F5F6F7');
	let showModal = $state(false);
	let open = $state(false);
	let currentStep = $state(1);
	let isDropdownOpen = $state(false);
	let isCurrencyDropdownOpen = $state(false);

	// ============================================
	// STEP 1: EXHIBITOR DETAILS STATE
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

	// Business type dropdown state
	let showBusinessTypeDropdown = $state(false);
	let otherBusinessType = $state('');

	// ============================================
	// STEP 2: PAYMENT & PRICING STATE
	// ============================================

	let pricingModel = $state('free');
	let basePrice = $state('');
	let paymentMethods = $state<string[]>(['paystack']);
	let showTaxModal = $state(false);
	let taxRate = $state(0);
	let tempTaxRate = $state(0);
	let currencies = $state<string[]>(['NGN']);

	// ============================================
	// CONSTANTS (don't need $state)
	// ============================================

	const totalSteps = 3;
	const steps = ['Exhibitor Details', 'Payment & Pricing Setup', 'Summary'];
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
	// DERIVED STATE - Computed values using $derived
	// ============================================

	let canProceedStep1 = $derived(
		!!(companyName && selectedBusinessType && emailAddress && phoneNumber)
	);

	let canProceedStep2 = $derived(
		pricingModel === 'free' || !!(basePrice && paymentMethods.length > 0)
	);

	// ============================================
	// TIME UPDATE LOGIC
	// ============================================
	function formatTime() {
		let rawTime = new Date().toLocaleString('en-GB', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: true,
			timeZoneName: 'short'
		});
		return rawTime.replace(/am|pm/, (match) => match.toUpperCase());
	}

	const updateTime = () => {
		now = formatTime();
	};

	const interval = setInterval(updateTime, 60000);
	onDestroy(() => clearInterval(interval));

	// ============================================
	// FILE UPLOAD HANDLERS
	// ============================================

	function handleLogoUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			businessLogo = file;
			const reader = new FileReader();
			reader.onload = (e) => {
				businessLogoPreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	async function handleCoverUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
		const validExtensions = ['.jpeg', '.jpg', '.png', '.pdf', '.afra'];
		const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

		if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
			alert('Please upload a valid file: JPEG, PNG, PDF, or AFRA format');
			target.value = '';
			return;
		}

		const maxSize = 50 * 1024 * 1024;
		if (file.size > maxSize) {
			alert('File size must be less than 50MB');
			target.value = '';
			return;
		}

		coverImage = file;

		if (file.type.startsWith('image/')) {
			const reader = new FileReader();
			reader.onload = (e) => {
				const result = e.target?.result;
				if (typeof result === 'string') {
					coverImagePreview = result;
				}
			};
			reader.readAsDataURL(file);
		} else if (file.type === 'application/pdf') {
			coverImagePreview = '/pdf-placeholder.svg';
		} else {
			coverImagePreview = '/file-placeholder.svg';
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

	function openModal() {
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

	function openTaxModal() {
		tempTaxRate = taxRate;
		showTaxModal = true;
	}

	function saveTaxRate() {
		taxRate = tempTaxRate;
		showTaxModal = false;
	}

	function cancelTaxModal() {
		showTaxModal = false;
	}

	// ============================================
	// NAVIGATION HANDLERS
	// ============================================

	function nextStep() {
		if (currentStep < totalSteps) {
			currentStep++;
		}
	}

	function prevStep() {
		if (currentStep > 1) {
			currentStep--;
		}
	}

	function editField(step: number) {
		// Allow navigation to any completed step or current step
		if (step <= currentStep) {
			currentStep = step;
		}
	}

	// ============================================
	// SELECTION HANDLERS
	// ============================================

	function togglePaymentMethod(method: string) {
		const index = paymentMethods.indexOf(method);
		if (index > -1) {
			if (paymentMethods.length > 1) {
				paymentMethods = paymentMethods.filter((m) => m !== method);
			}
		} else {
			paymentMethods = [...paymentMethods, method];
		}
	}

	function toggleCurrency(curr: string) {
		const index = currencies.indexOf(curr);
		if (index > -1) {
			if (currencies.length > 1) {
				currencies = currencies.filter((c) => c !== curr);
			}
		} else {
			currencies = [...currencies, curr];
		}
	}

	function selectBusinessType(type: BusinessType) {
		selectedBusinessType = type;
		showBusinessTypeDropdown = false;
		if (type.label !== 'Other') {
			otherBusinessType = '';
		}
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

	function getPaymentMethodDisplay() {
		return paymentMethods
			.map((method) => {
				if (method === 'paystack') return 'Paystack';
				if (method === 'flutterwave') return 'Flutterwave';
				if (method === 'stripe') return 'Stripe';
				return method;
			})
			.join(', ');
	}

	function getCurrencyDisplay() {
		return currencies
			.map((curr) => {
				if (curr === 'NGN') return 'NGN';
				if (curr === 'USD') return 'USD';
				if (curr === 'EUR') return 'EUR';
				if (curr === 'GBP') return 'GBP';
				return curr;
			})
			.join(', ');
	}

	// Function to handle horizontal scrolling
	function handleHorizontalScroll(event: WheelEvent) {
    const container = event.currentTarget as HTMLElement;
    event.preventDefault();
    container.scrollLeft += event.deltaY;
}

	// ============================================
	// FORM SUBMISSION
	// ============================================

	function submitOnboarding() {
		console.log('Onboarding data:', {
			businessLogo,
			coverImage,
			companyName,
			businessType: selectedBusinessType?.label,
			companyDescription,
			businessLocation,
			phoneNumber,
			emailAddress,
			websiteURL,
			pricingModel,
			basePrice,
			currencies,
			paymentMethods
		});
		goto('/exhibitor');
	}
</script>

<div
	class="relative flex min-h-screen flex-col overflow-auto bg-cover bg-center bg-no-repeat"
	style="
		background-image: url('/exhibitor-bg.png');
		color: {selectedColor.text};
		font-family: {selectedFont};
	"
>
	<OnboardingNavbar />
	<!-- Main Content -->
	<main class="relative mb-[106px] flex-1 px-5 md:mb-0">
		<!-- Header -->
		<div class="mx-auto mb-8 overflow-x-hidden">
			<!-- Progress Indicator - SCROLLABLE -->
			<div class="mb-8  w-full border-b border-[#EBEBEB] py-3 pt-10 md:mx-auto md:w-[518px]">
				<div
					class="custom-scrollbar overflow-x-auto overflow-y-hidden scroll-smooth cursor-grab active:cursor-grabbing"
					 onwheel={handleHorizontalScroll}
				>
					<div class="flex min-w-max items-center justify-start gap-4 px-4 md:px-0">
						{#each Array(totalSteps) as _, index}
							<button
								type="button"
								class="flex cursor-pointer items-center focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:mx-auto"
								onclick={() => editField(index + 1)}
								disabled={index + 1 > currentStep}
							>
								<div
									class="mr-2 flex h-6 w-5 items-center justify-center rounded-full text-sm font-normal transition-all"
									style="background: {currentStep > index
										? 'linear-gradient(90deg, #DB3EC6 0%, #963DD4 50%, #513BE2 100%)'
										: '#FFFFFF'}; color: {currentStep > index ? '#FFFFFF' : '#5C5C5C'}"
								>
									{index + 1}
								</div>
								<!-- Step Text -->
								<span
									class="text-sm font-normal whitespace-nowrap transition-all"
									style="color: {currentStep > index ? '#171717' : '#5C5C5C'}"
								>
									{steps[index]}
								</span>
								{#if index < totalSteps - 1}
									<div class="ml-2">
										<img src="/arrow-right-s-line.svg" alt="arrow" class="h-5 w-5" />
									</div>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<!-- Step Content -->
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
						<div class=" text-[24px] font-semibold text-[#171717]">Exhibitor Details</div>
						<p class=" mt-1 text-sm text-[#5C5C5C]">
							Provide essential Exhibitor Details to proceed.
						</p>
					</div>

					<div class="my-8 h-[1px] w-full bg-[#EBEBEB]"></div>

					<!-- Images Upload Section -->
					<div
						class="grid grid-cols-1 items-center gap-6 rounded-2xl border p-3 md:grid-cols-3"
						style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
					>
						<!-- Business Logo -->
						<div class="col-span-1 space-y-2 md:border-r-1">
							<div
								class="hover:border-opacity-50 flex h-40 cursor-pointer flex-col items-center justify-center space-y-2 rounded-[10px] transition-colors"
								style="border-color: {selectedColor.lightText}"
								onclick={() => document.getElementById('logoInput')?.click()}
								onkeydown={(e) =>
									e.key === 'Enter' && document.getElementById('logoInput')?.click()}
								role="button"
								tabindex="0"
							>
								{#if businessLogoPreview}
									<img
										src={businessLogoPreview}
										alt="Business Logo"
										class="h-full w-full rounded-[10px] object-cover px-10 py-5"
									/>
								{:else}
									<img src="/avatar.svg" alt="avatar" />
									<div class="text-sm font-medium">Business Logo</div>

									<span class="mt-1 text-xs" style="color: {selectedColor.lightText}"
										>Max file size: 1MB</span
									>
									<button
										class="h-[32px] rounded-[10px] border px-6 text-sm"
										style="color: {selectedColor.lightText}">Add Image</button
									>
								{/if}
							</div>
							<input
								id="logoInput"
								type="file"
								accept="image/*"
								class="hidden"
								onchange={handleLogoUpload}
							/>
						</div>

						<!-- Cover/Banner Image -->
						<div class="col-span-2 space-y-2">
							<div class="text-sm font-medium">Cover/Banner Image</div>
							<div
								class="hover:border-opacity-50 relative flex h-40 cursor-pointer flex-col items-center justify-around rounded-[10px]"
								style="border: 1px dashed #D1D1D1; border-spacing: 5px;"
								onclick={() => !coverImagePreview && document.getElementById('coverInput')?.click()}
								onkeydown={(e) =>
									e.key === 'Enter' &&
									!coverImagePreview &&
									document.getElementById('coverInput')?.click()}
								role="button"
								tabindex="0"
							>
								{#if coverImagePreview}
									<img
										src={coverImagePreview}
										alt="Cover"
										class="h-full w-full rounded-[10px] object-cover"
									/>
									<div
										class="absolute inset-0 flex items-center justify-center gap-3 rounded-[10px] bg-black/40 opacity-0 transition-opacity hover:opacity-100"
									>
										<button
											type="button"
											class="rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#171717] hover:bg-gray-100"
											onclick={(e) => {
												e.stopPropagation();
												document.getElementById('coverInput')?.click();
											}}
										>
											Change
										</button>
										<button
											type="button"
											class="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
											onclick={(e) => {
												e.stopPropagation();
												removeCoverImage();
											}}
										>
											Remove
										</button>
									</div>
								{:else}
									<img src="/upload.svg" alt="upload-icon" />
									<div class="px-4 text-center">
										<p class="text-sm">Choose a file or drag & drop it here.</p>
										<p class="mt-1 text-xs" style="color: {selectedColor.lightText}">
											JPEG, PNG, PDF, and AFRA formats, up to 50 MB
										</p>
									</div>
									<button
										type="button"
										class="mx-auto flex h-[32px] items-center rounded-[10px] border px-6 text-sm font-medium text-[#5C5C5C] hover:bg-gray-50"
										onclick={(e) => {
											e.stopPropagation();
											document.getElementById('coverInput')?.click();
										}}
									>
										Browse File
									</button>
								{/if}
							</div>
							<input
								id="coverInput"
								type="file"
								accept="image/jpeg,image/jpg,image/png,application/pdf,.afra"
								class="hidden"
								onchange={handleCoverUpload}
							/>

							{#if coverImage}
								<div class="text-xs text-gray-500">
									Selected: {coverImage.name} ({(coverImage.size / 1024 / 1024).toFixed(2)} MB)
								</div>
							{/if}
						</div>
					</div>

					<!-- Company Information -->
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="space-y-2 md:col-span-1">
							<label class="text-sm font-medium"
								>Company Name <span class="text-[#335CFF]">*</span></label
							>
							<input
								type="text"
								bind:value={companyName}
								placeholder="Synergy HR"
								class=" h-[40px] w-full rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-3 text-sm focus:outline-none"
								style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
							/>
						</div>

						<div class="relative space-y-2">
							<label class="text-sm font-medium">
								Business Type/Category <span class="text-[#335CFF]">*</span>
							</label>

							<!-- Dropdown button -->
							<button
								type="button"
								class="h-[40px] w-full appearance-none rounded-[10px] border border-[#EBEBEB] bg-white px-4 pr-10 text-left text-sm focus:outline-none"
								style="
									box-shadow: 0px 1px 2px 0px #0A0D1408;
									background-image: url('/arrow-dropdown.svg');
									background-repeat: no-repeat;
									background-position: right 12px center;
									background-size: 14px;
								"
								onclick={() => (showBusinessTypeDropdown = !showBusinessTypeDropdown)}
							>
								{#if selectedBusinessType}
									<div class="flex items-center gap-2">
										<img src={selectedBusinessType.icon} alt="icon" class="h-5 w-5" />
										<span>{selectedBusinessType.label}</span>
									</div>
								{:else}
									<span class="text-[#A3A3A3]">Select business type</span>
								{/if}
							</button>

							<!-- Dropdown options -->
							{#if showBusinessTypeDropdown}
								<div
									class="absolute top-full left-0 z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border bg-white p-2 shadow-lg"
									style="box-shadow: 0px 4px 6px -1px rgba(0, 0, 0, 0.1);"
								>
									{#each businessTypes as type}
										{#if type.label !== 'Other'}
											<button
												type="button"
												class="flex w-full items-center gap-2 rounded-md px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 {selectedBusinessType?.label ===
												type.label
													? 'bg-blue-50'
													: ''}"
												onclick={() => selectBusinessType(type)}
											>
												<img src={type.icon} alt={type.label} class="h-5 w-5" />
												<span>{type.label}</span>
											</button>
										{/if}
									{/each}

									<!-- Other input inside dropdown -->
									<div class="mt-1 flex items-center gap-2 border-t px-4 py-2 pt-3">
										<img src="/other.svg" alt="other" class="h-5 w-5" />
										<input
											type="text"
											bind:value={otherBusinessType}
											placeholder="Other business type..."
											class="w-full rounded border border-[#EBEBEB] px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
											onclick={(e) => e.stopPropagation()}
											onkeydown={(e) => {
												e.stopPropagation();
												if (e.key === 'Enter') confirmOther();
											}}
										/>
										<button
											type="button"
											class="rounded bg-blue-500 px-3 py-1 text-sm font-medium whitespace-nowrap text-white hover:bg-blue-600"
											onclick={confirmOther}
										>
											Add
										</button>
									</div>
								</div>
							{/if}
						</div>

						<div class="space-y-2 md:col-span-2">
							<label class="text-sm font-medium"
								>Company Description<span class="text-[#335CFF]">*</span>
								<span class="font-normal text-[#5C5C5C]"> (Optional)</span></label
							>
							<div class="relative w-full">
								<textarea
									bind:value={companyDescription}
									placeholder="Describe your company..."
									maxlength="200"
									rows="3"
									class="textarea-custom placeholder:text-[#A3A3A3} h-[56px] w-full resize-none rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-3 pr-14 text-sm focus:outline-none"
									style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
								/>

								<span
									class="pointer-events-none absolute right-5 bottom-3 text-xs"
									style="color: {selectedColor.lightText}"
								>
									{companyDescription.length}/200
								</span>
							</div>
						</div>
					</div>

					<!-- Business Location -->
					<div class="space-y-2">
						<label class="text-sm font-medium">
							Business Location/Service Area <span class="text-[#335CFF]">*</span>
						</label>

						<button
							class="flex h-14 w-full items-start gap-2 rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-3 text-left shadow-[0_1px_2px_0_#0A0D1408]"
							onclick={openModal}
						>
							<img src="/location-add.svg" alt="location-add-icon" class="h-4 w-4" />

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

					<!-- Modal -->
					{#if showModal}
						<div
							class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
						>
							<div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
								<h3 class="mb-4 text-lg font-semibold">Add Business Location</h3>

								<input
									type="text"
									bind:value={tempLocation}
									placeholder="e.g. Ikeja, Lagos or Online (Zoom)"
									class="w-full rounded-lg border border-[#EBEBEB] px-4 py-3 text-sm focus:ring-2 focus:ring-[#335CFF] focus:outline-none"
								/>

								{#if error}
									<p class="mt-2 text-xs text-red-500">{error}</p>
								{/if}

								<p class="mt-2 text-xs text-[#A9AAAA]">
									Enter a physical address or an online meeting link
								</p>

								<div class="mt-6 flex justify-end gap-3">
									<button
										class="rounded-lg px-4 py-2 text-sm text-gray-600"
										onclick={() => (showModal = false)}
									>
										Cancel
									</button>

									<button
										class="rounded-lg bg-[#335CFF] px-4 py-2 text-sm text-white"
										onclick={saveLocation}
									>
										Save Location
									</button>
								</div>
							</div>
						</div>
					{/if}
					<!-- Contact Information -->
					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div class="space-y-2">
							<label class="text-sm font-medium">
								Phone Number <span class="text-[#335CFF]">*</span>
							</label>

							<div class="relative flex rounded-[10px] border border-[#EBEBEB] bg-white text-sm">
								<button
									type="button"
									class="flex w-[96px] items-center gap-2 border-r border-[#EBEBEB] px-2 py-3"
									style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
									onclick={() => (open = !open)}
								>
									<img
										src={selectedCountry.flag}
										alt={selectedCountry.name}
										class="h-5 w-5 rounded-full object-cover"
									/>

									<span class="text-xs">{selectedCountry.dial_code}</span>

									<svg
										class="ml-auto h-4 w-4 text-gray-500 transition-transform duration-200"
										class:rotate-180={open}
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
											clip-rule="evenodd"
										/>
									</svg>
								</button>

								<input
									type="tel"
									bind:value={phoneNumber}
									placeholder="(555) 000-0000"
									class="w-full flex-1 px-4 py-3 text-sm placeholder:text-[#A3A3A3] focus:outline-none"
									style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
									oninput={(e) => {
										const target = e.target as HTMLInputElement;
										target.value = target.value.replace(/[^0-9]/g, '');
										phoneNumber = target.value;
									}}
								/>

								{#if open}
									<ul
										class="absolute top-full left-0 z-50 mt-1 max-h-64 w-72 overflow-auto rounded-lg border bg-white shadow-lg"
									>
										{#each countries as country}
											<li
												class="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-gray-100"
												onclick={() => selectCountry(country)}
												onkeydown={(e) => e.key === 'Enter' && selectCountry(country)}
												role="option"
												tabindex="0"
												aria-selected={selectedCountry === country}
											>
												<img
													src={country.flag}
													alt={country.name}
													class="h-5 w-7 rounded-sm object-cover"
												/>
												<span class="text-sm">{country.name}</span>
												<span class="ml-auto text-xs text-gray-500">
													{country.dial_code}
												</span>
											</li>
										{/each}
									</ul>
								{/if}
							</div>
						</div>

						<div class="space-y-2">
							<label class="text-sm font-medium"
								>Email Address <span class="text-[#335CFF]">*</span></label
							>
							<div
								class="flex items-center gap-0 rounded-[10px] border border-[#EBEBEB] bg-white px-3 text-sm placeholder:text-[#A3A3A3]"
							>
								<img src="/mail-line.svg" alt="mail" class="h-5 w-5" />

								<input
									type="email"
									bind:value={emailAddress}
									placeholder="hello@sitigou.com"
									style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
									class="w-full rounded-[10px] px-4 py-3 focus:outline-none"
								/>
							</div>
						</div>

						<div class="space-y-2">
							<label class="text-sm font-medium"
								>Website URL<span class="text-[#335CFF]">*</span></label
							>
							<div
								class="flex w-full items-center rounded-[10px] border border-[#EBEBEB] bg-white px-3 text-sm focus:outline-none"
								style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
							>
								<div class="border-r py-3 pr-3 text-[#5C5C5C]">alignui.com</div>
								<input
									type="url"
									bind:value={websiteURL}
									placeholder="synergyhr"
									class="w-full pl-3 placeholder:text-[#171717] focus:outline-none"
								/>
							</div>
						</div>
					</div>
				</div>
			{:else if currentStep === 2}
				<!-- Step 2: Payment & Pricing Setup -->
				<div class="space-y-6 rounded-xl">
					<div class="mb-6 text-center">
						<div class="mx-auto h-[96px] w-[96px]">
							<img src="/payment-Icon.svg" alt="detail-icon" class="h-full w-full" />
						</div>
						<div class=" text-[24px] font-[500] text-[#171717]">Payment & Pricing Setup</div>
						<p class=" mt-1 text-[16px] text-[#5C5C5C]">
							Select a payment method and setup products pricing.
						</p>
					</div>
					<div class="my-8 h-[1px] w-full bg-[#EBEBEB]"></div>
					<!-- Payment Method Section -->
					<div
						class=" flex flex-col gap-5 rounded-2xl border bg-white px-4 py-6 md:grid md:grid-cols-2"
						style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
					>
						<div class="relative space-y-4 rounded-2xl">
							<div class="flex items-center gap-0">
								<!-- svelte-ignore a11y_label_has_associated_control -->
								<label class="text-sm font-medium text-[#1A1A1A]">Select Payment Method</label>
								<img src="/info-itallic.svg" alt="information-fill" class="h-5 w-5" />
							</div>

							<div class="relative">
								<button
									type="button"
									onclick={() => (isDropdownOpen = !isDropdownOpen)}
									class="focus:ring-none w-full appearance-none rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-3 pr-10 text-left text-sm focus:ring-0 focus:outline-none"
								>
									{getPaymentMethodDisplay()}
								</button>

								<img
									src="/arrow-dropdown.svg"
									alt="arrow-dropdown"
									class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-transform {isDropdownOpen
										? 'rotate-180'
										: ''}"
								/>
							</div>

							{#if isDropdownOpen}
								<div
									class="absolute z-10 mt-1 w-full space-y-2 rounded-[12px] border bg-white md:w-[310px]"
									style="box-shadow: 0px 4px 6px -1px rgba(0, 0, 0, 0.1);"
								>
									<button
										type="button"
										class="flex w-full items-center justify-between border-b px-2 py-3 transition-colors hover:bg-gray-50 {paymentMethods.includes(
											'paystack'
										)
											? 'bg-blue-50'
											: ''}"
										onclick={() => togglePaymentMethod('paystack')}
									>
										<div class="flex items-center gap-3">
											<div
												class="flex h-10 w-10 items-center justify-center rounded-full border border-[#EBEBEB]"
												style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
											>
												<img src="/paystack.svg" alt="paystack" class="h-5 w-5" />
											</div>
											<div class="text-left">
												<div class="text-sm font-medium text-[#171717]">Paystack</div>
											</div>
											<div
												class="rounded-full bg-[#F5F5F5] p-1 text-[11px] font-medium text-[#7B7B7B] uppercase"
											>
												SOON
											</div>
										</div>

										<div
											class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {paymentMethods.includes(
												'paystack'
											)
												? 'bg-[#00C3F7]'
												: 'bg-gray-300'}"
										>
											<span
												class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {paymentMethods.includes(
													'paystack'
												)
													? 'translate-x-6'
													: 'translate-x-1'}"
											></span>
										</div>
									</button>

									<button
										type="button"
										class="flex w-full items-center justify-between border-b px-2 py-3 transition-colors hover:bg-gray-50 {paymentMethods.includes(
											'flutterwave'
										)
											? 'bg-orange-50'
											: ''}"
										onclick={() => togglePaymentMethod('flutterwave')}
									>
										<div class="flex items-center gap-3">
											<div
												class="flex h-10 w-10 items-center justify-center rounded-full border border-[#EBEBEB]"
												style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
											>
												<img src="/flutter.svg" alt="flutter" class="h-5 w-5" />
											</div>
											<div class="text-left">
												<div class="text-sm font-medium text-[#171717]">Flutterwave</div>
											</div>
											<div
												class="rounded-full bg-[#F5F5F5] p-1 text-[11px] font-medium text-[#7B7B7B] uppercase"
											>
												SOON
											</div>
										</div>

										<div
											class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {paymentMethods.includes(
												'flutterwave'
											)
												? 'bg-[#F5A623]'
												: 'bg-gray-300'}"
										>
											<span
												class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {paymentMethods.includes(
													'flutterwave'
												)
													? 'translate-x-6'
													: 'translate-x-1'}"
											></span>
										</div>
									</button>

									<button
										type="button"
										class="flex w-full items-center justify-between px-2 py-3 transition-colors hover:bg-gray-50 {paymentMethods.includes(
											'stripe'
										)
											? 'bg-purple-50'
											: ''}"
										onclick={() => togglePaymentMethod('stripe')}
									>
										<div class="flex items-center gap-3">
											<div
												class="flex h-10 w-10 items-center justify-center rounded-full border border-[#EBEBEB]"
												style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
											>
												<img src="/Stripe.svg" alt="stripe" class="h-5 w-5" />
											</div>
											<div class="text-left">
												<div class="text-sm font-medium">Stripe</div>
											</div>
											<div
												class="rounded-full bg-[#F5F5F5] p-1 text-[11px] font-medium text-[#7B7B7B] uppercase"
											>
												SOON
											</div>
										</div>

										<div
											class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {paymentMethods.includes(
												'stripe'
											)
												? 'bg-[#635BFF]'
												: 'bg-gray-300'}"
										>
											<span
												class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {paymentMethods.includes(
													'stripe'
												)
													? 'translate-x-6'
													: 'translate-x-1'}"
											></span>
										</div>
									</button>
								</div>
							{/if}
						</div>

						<!-- Currency Section -->
						<div class="relative space-y-4">
							<div class="flex items-center gap-0">
								<!-- svelte-ignore a11y_label_has_associated_control -->
								<label class="text-sm font-medium text-[#1A1A1A]">Select Proffered Currency</label>
								<img src="/info-itallic.svg" alt="information-fill" class="h-5 w-5" />
							</div>

							<div class="relative">
								<button
									type="button"
									onclick={() => (isCurrencyDropdownOpen = !isCurrencyDropdownOpen)}
									class="focus:ring-none w-full appearance-none rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-3 pr-10 text-left text-sm focus:ring-0 focus:outline-none"
								>
									{getCurrencyDisplay()}
								</button>

								<img
									src="/arrow-dropdown.svg"
									alt="arrow-dropdown"
									class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-transform {isCurrencyDropdownOpen
										? 'rotate-180'
										: ''}"
								/>
							</div>

							{#if isCurrencyDropdownOpen}
								<div
									class="absolute z-50 mt-1 w-full space-y-2 rounded-[12px] border bg-white md:w-[310px]"
									style="box-shadow: 0px 4px 6px -1px rgba(0, 0, 0, 0.1);"
								>
									<button
										type="button"
										class="flex w-full items-center justify-between border-b px-2 py-3 transition-colors hover:bg-gray-50 {currencies.includes(
											'NGN'
										)
											? 'bg-green-50'
											: ''}"
										onclick={() => toggleCurrency('NGN')}
									>
										<div class="flex items-center gap-3">
											<div class="text-left">
												<div class="text-sm font-medium text-[#171717]">Naira (₦)</div>
											</div>
											<div
												class="rounded-full bg-[#F5F5F5] p-1 text-[11px] font-medium text-[#7B7B7B] uppercase"
											>
												SOON
											</div>
										</div>

										<div
											class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {currencies.includes(
												'NGN'
											)
												? 'bg-[#22C55E]'
												: 'bg-gray-300'}"
										>
											<span
												class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {currencies.includes(
													'NGN'
												)
													? 'translate-x-6'
													: 'translate-x-1'}"
											></span>
										</div>
									</button>

									<button
										type="button"
										class="flex w-full items-center justify-between px-2 py-3 transition-colors hover:bg-gray-50 {currencies.includes(
											'USD'
										)
											? 'bg-blue-50'
											: ''}"
										onclick={() => toggleCurrency('USD')}
									>
										<div class="flex items-center gap-3">
											<div class="text-left">
												<div class="text-sm font-medium text-[#171717]">US Dollar ($)</div>
											</div>
											<div
												class="rounded-full bg-[#F5F5F5] p-1 text-[11px] font-medium text-[#7B7B7B] uppercase"
											>
												SOON
											</div>
										</div>

										<div
											class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {currencies.includes(
												'USD'
											)
												? 'bg-[#3B82F6]'
												: 'bg-gray-300'}"
										>
											<span
												class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {currencies.includes(
													'USD'
												)
													? 'translate-x-6'
													: 'translate-x-1'}"
											></span>
										</div>
									</button>
								</div>
							{/if}
						</div>

						<!-- Tax Information Section -->
						<div class="col-span-2 space-y-4 rounded-2xl">
							<div class="flex items-center justify-between gap-1">
								<div class="flex items-center gap-1">
									<img
										src="/bank-line.svg"
										alt="bank-line"
										class="h-10 w-10 rounded-full border bg-white p-2"
										style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
									/>
									<div>
										<div class="text-sm font-medium text-[#1A1A1A]">Tax Information</div>
										<div class="text-xs text-gray-500">
											{#if taxRate > 0}
												Current rate: {taxRate}%
											{:else}
												Set default tax rate for all products
											{/if}
										</div>
									</div>
								</div>
								<button
									onclick={openTaxModal}
									class="min-h-[30px] rounded-lg bg-black p-2 text-xs font-medium text-white transition-colors hover:bg-gray-800"
								>
									{taxRate > 0 ? 'Edit Tax Rate' : 'Enter Tax Rate'}
								</button>
							</div>
						</div>

						<!-- Tax Rate Modal -->
						{#if showTaxModal}
							<div
								class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5"
								onclick={cancelTaxModal}
								onkeydown={(e) => e.key === 'Escape' && cancelTaxModal()}
								role="button"
								tabindex="0"
							>
								<div
									class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
									onclick={(e) => e.stopPropagation()}
									onkeydown={(e) => e.stopPropagation()}
									role="dialog"
									tabindex="0"
								>
									<div class="mb-4">
										<h3 class="text-lg font-semibold text-[#1A1A1A]">Set Tax Rate</h3>
										<p class="text-sm text-gray-500">Enter the default tax rate for all products</p>
									</div>

									<div class="mb-6">
										<label for="taxRate" class="mb-2 block text-sm font-medium text-[#1A1A1A]">
											Tax Rate (%)
										</label>
										<div class="relative">
											<input
												id="taxRate"
												type="number"
												bind:value={tempTaxRate}
												min="0"
												max="100"
												step="0.01"
												class="w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 pr-8 text-sm focus:ring-2 focus:ring-black focus:outline-none"
												placeholder="0.00"
											/>
											<span class="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-400"
												>%</span
											>
										</div>
									</div>

									<div class="flex gap-3">
										<button
											onclick={cancelTaxModal}
											class="flex-1 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-gray-50"
										>
											Cancel
										</button>
										<button
											onclick={saveTaxRate}
											class="flex-1 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
										>
											Save Tax Rate
										</button>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
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

					<!-- Summary Cards -->
					<div
						class="space-y-3 rounded-2xl border bg-white px-4"
						style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
					>
						<!-- Company Name -->
						<div class="flex items-center justify-between border-b border-[#E5E7EB] py-4">
							<div class="flex items-center gap-3">
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5]">
									<img src="/account-pin-box-line.svg" alt="company" class="h-5 w-5" />
								</div>
								<div>
									<div class="text-xs tracking-wider text-[#5C5C5C] uppercase">Company Name</div>
									<div class="text-sm font-medium text-[#171717]">
										{companyName || 'Not provided'}
									</div>
								</div>
							</div>
							<button
								class="text-gray-400 transition-colors hover:text-gray-600"
								onclick={() => editField(1)}
							>
								<img src="/edit-icon.svg" alt="edit" class="h-[11.42px] w-[11.98px]" />
							</button>
						</div>

						<!-- Business Type/Category -->
						<div class="flex items-center justify-between border-b border-[#E5E7EB] py-4">
							<div class="flex items-center gap-3">
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5]">
									<img src="/grid-icon.svg" alt="category" class="h-5 w-5" />
								</div>
								<div>
									<div class="text-xs tracking-wider text-[#5C5C5C] uppercase">
										Business Type/Category
									</div>
									<div class="text-sm font-medium text-[#171717]">
										{#if otherBusinessType}
											{otherBusinessType}
										{:else if selectedBusinessType}
											{selectedBusinessType.label}
										{:else}
											Not selected
										{/if}
									</div>
								</div>
							</div>
							<button
								class="text-gray-400 transition-colors hover:text-gray-600"
								onclick={() => editField(1)}
							>
								<img src="/edit-icon.svg" alt="edit" class="h-[11.42px] w-[11.98px]" />
							</button>
						</div>

						<!-- Phone Number -->
						<div class="flex items-center justify-between border-b border-[#E5E7EB] py-4">
							<div class="flex items-center gap-3">
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5]">
									<img src="/phone-icon.svg" alt="phone" class="h-5 w-5" />
								</div>
								<div>
									<div class="text-xs tracking-wider text-[#5C5C5C] uppercase">Phone Number</div>
									<div class="text-sm font-medium text-[#171717]">
										{phoneNumber || 'Not provided'}
									</div>
								</div>
							</div>
							<button
								class="text-gray-400 transition-colors hover:text-gray-600"
								onclick={() => editField(1)}
							>
								<img src="/edit-icon.svg" alt="edit" class="h-[11.42px] w-[11.98px]" />
							</button>
						</div>

						<!-- Email Address -->
						<div class="flex items-center justify-between border-b border-[#E5E7EB] py-4">
							<div class="flex items-center gap-3">
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5]">
									<img src="/mail-icon.svg" alt="email" class="h-5 w-5" />
								</div>
								<div>
									<div class="text-xs tracking-wider text-[#5C5C5C] uppercase">Email Address</div>
									<div class="text-sm font-medium text-[#171717]">
										{emailAddress || 'Not provided'}
									</div>
								</div>
							</div>
							<button
								class="text-gray-400 transition-colors hover:text-gray-600"
								onclick={() => editField(1)}
							>
								<img src="/edit-icon.svg" alt="edit" class="h-[11.42px] w-[11.98px]" />
							</button>
						</div>

						<!-- Website URL -->
						{#if websiteURL}
							<div class="flex items-center justify-between border-b border-[#E5E7EB] py-4">
								<div class="flex items-center gap-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5]">
										<img src="/globe-icon.svg" alt="website" class="h-5 w-5" />
									</div>
									<div>
										<div class="text-xs tracking-wider text-[#5C5C5C] uppercase">Website URL</div>
										<div class="text-sm font-medium text-[#171717]">{websiteURL}</div>
									</div>
								</div>
								<button
									class="text-gray-400 transition-colors hover:text-gray-600"
									onclick={() => editField(1)}
								>
									<img src="/edit-icon.svg" alt="edit" class="h-[11.42px] w-[11.98px]" />
								</button>
							</div>
						{/if}

						<!-- Payment Method -->
						<div class="flex items-center justify-between border-b border-[#E5E7EB] py-4">
							<div class="flex items-center gap-3">
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5]">
									<img src="/bank-icon.svg" alt="payment" class="h-5 w-5" />
								</div>
								<div>
									<div class="text-xs tracking-wider text-[#5C5C5C] uppercase">
										Select Payment Method
									</div>
									<div class="text-sm font-medium text-[#171717] capitalize">
										{getPaymentMethodDisplay() || 'Not selected'}
									</div>
								</div>
							</div>b                             
							<button
								class="text-gray-400 transition-colors hover:text-gray-600"
								onclick={() => editField(2)}
							>
								<img src="/edit-icon.svg" alt="edit" class="h-[11.42px] w-[11.98px]" />
							</button>
						</div>

						<!-- Preferred Currency -->
						<div class="flex items-center justify-between py-4">
							<div class="flex items-center gap-3">
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5]">
									<img src="/currency-icon.svg" alt="currency" class="h-5 w-5" />
								</div>
								<div>
									<div class="text-xs tracking-wider text-[#5C5C5C] uppercase">
										Select Proffered Currency
									</div>
									<div class="text-sm font-medium text-[#171717]">
										{getCurrencyDisplay() || 'Not selected'}
									</div>
								</div>
							</div>
							<button
								class="text-gray-400 transition-colors hover:text-gray-600"
								onclick={() => editField(2)}
							>
								<img src="/edit-icon.svg" alt="edit" class="h-[11.42px] w-[11.98px]" />
							</button>
						</div>
					</div>
				</div>
			{/if}

			<!-- Navigation Buttons -->
			<div class="mt-8 flex gap-4">
				{#if currentStep === 2}
					<button
						onclick={prevStep}
						class="h-[40px] flex-1 rounded-[10px] py-2 font-medium transition"
						style="background-color: {selectedColor.cover}; color: {selectedColor.text}"
					>
						Back
					</button>
				{/if}

				{#if currentStep < totalSteps}
					<button
						onclick={nextStep}
						disabled={currentStep === 1
							? !canProceedStep1
							: currentStep === 2
								? !canProceedStep2
								: false}
						class="h-[40px] flex-1 rounded-[10px] bg-black py-2 text-white transition disabled:opacity-60"
					>
						Continue
					</button>
				{:else}
					<button
						onclick={submitOnboarding}
						class="h-[40px] flex-1 rounded-[10px] bg-black py-2 font-medium text-white transition disabled:opacity-50"
					>
						Complete Registration
					</button>
				{/if}
			</div>
		</div>
	</main>
</div>

<style>
	:global(.custom-scrollbar::-webkit-scrollbar) {
		width: 6px;
		height: 6px;
	}

	:global(.custom-scrollbar::-webkit-scrollbar-track) {
		background: transparent;
	}

	:global(.custom-scrollbar::-webkit-scrollbar-thumb) {
		background: #888;
		border-radius: 3px;
	}

	:global(.custom-scrollbar::-webkit-scrollbar-thumb:hover) {
		background: #555;
	}
</style>