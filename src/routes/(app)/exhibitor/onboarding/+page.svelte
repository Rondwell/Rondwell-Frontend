<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';
	import { colors, type Color } from '$lib/utils/colors';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import countries from '$lib/utils/countries.json';
	import { onDestroy } from 'svelte';

	let now = $state(formatTime());

	const updateTime = () => {
		now = formatTime();
	};

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

		// Convert am/pm to AM/PM
		return rawTime.replace(/am|pm/, (match) => match.toUpperCase());
	}

	const interval = setInterval(updateTime, 60000);
	onDestroy(() => clearInterval(interval));

	let selectedStyle = 'Minimal';
	let selectedFont = 'Default';
	let selectedColor: Color = colors[7];
	let background_color = '#F5F6F7';
	let showModal = false;
	let open = false;
	// Current step in onboarding
	let currentStep = 1;
	const totalSteps = 3;

	let steps = ['Exhibitor Details', 'Payment & Pricing Setup', 'Summary'];
	let isDropdownOpen = false;
	let isCurrencyDropdownOpen = false;

	// Step 1: Exhibitor Details
	let businessLogo: File | null = null;
	let businessLogoPreview = '';
	let coverImage: File | null = null;
	let coverImagePreview: string = '';
	let companyName = '';
	let businessType = '';
	let companyDescription = '';
	let businessLocation = '';
	let phoneNumber = '';
	let emailAddress = '';
	let websiteURL = '';
	let tempLocation = '';
	let error = '';
	let selectedCountry = countries[0];

	// Step 2: Payment & Pricing Setup
	let pricingModel = 'free'; // free, paid, tiered
	let basePrice = '';
	let currency = 'NGN';
	let paymentMethod = 'paystack';
	let showTaxModal = false;
	let taxRate = 0;
	let tempTaxRate = 0;

	// Step 3: Summary

	let businessTypes = [
		'Technology',
		'Healthcare',
		'Finance',
		'Education',
		'Retail',
		'Manufacturing',
		'Services',
		'Other'
	];

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

		// Validate file type
		const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
		const validExtensions = ['.jpeg', '.jpg', '.png', '.pdf', '.afra'];
		const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

		if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
			alert('Please upload a valid file: JPEG, PNG, PDF, or AFRA format');
			target.value = ''; // Reset input
			return;
		}

		// Validate file size (50MB)
		const maxSize = 50 * 1024 * 1024; // 50MB in bytes
		if (file.size > maxSize) {
			alert('File size must be less than 50MB');
			target.value = ''; // Reset input
			return;
		}

		// Store the file
		coverImage = file;

		// Create preview for images only
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
			// For PDFs, show a PDF icon or placeholder
			coverImagePreview = '/pdf-placeholder.svg'; // Add your PDF icon
		} else {
			// For AFRA or other formats
			coverImagePreview = '/file-placeholder.svg'; // Add your file icon
		}
	}

	function removeCoverImage() {
		coverImage = null;
		coverImagePreview = '';
		const input = document.getElementById('coverInput') as HTMLInputElement | null;
		if (input) input.value = '';
	}

	function openModal() {
		tempLocation = businessLocation;
		error = '';
		showModal = true;
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

	function saveLocation() {
		if (tempLocation.trim().length < 5) {
			error = 'Please enter a valid location';
			return;
		}

		businessLocation = tempLocation;
		showModal = false;
	}
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

	// Function to handle payment method selection
	function selectPaymentMethod(method: string) {
		// If clicking the currently selected method, do nothing
		if (paymentMethod === method) {
			return;
		}
		// Set the new payment method
		paymentMethod = method;
	}

	// Function to handle currency selection
	function selectCurrency(curr: string) {
		// If clicking the currently selected currency, do nothing
		if (currency === curr) {
			return;
		}
		// Set the new currency
		currency = curr;
	}

	//  function to handle editing
	function editField(step: number) {
		currentStep = step;
	}

	function submitOnboarding() {
		console.log('Onboarding data:', {
			businessLogo,
			coverImage,
			companyName,
			businessType,
			companyDescription,
			businessLocation,
			phoneNumber,
			emailAddress,
			websiteURL,
			pricingModel,
			basePrice,
			currency,
			paymentMethod
		});
		// Redirect to exhibitor dashboard
		goto('/exhibitor/dashboard');
	}

	let canProceedStep1 = companyName && businessType && emailAddress && phoneNumber;
	let canProceedStep2 = pricingModel === 'free' || (basePrice && paymentMethod);
</script>

<div
	class="relative flex min-h-screen flex-col overflow-auto bg-cover bg-center bg-no-repeat md:flex-row"
	style="
		background-image: url('/exhibitor-bg.png');
		color: {selectedColor.text};
		font-family: {selectedFont};
	"
>
	<!-- Main Content -->
	<main class="relative mb-[106px] flex-1 px-5 md:mb-0">
		<!-- Header -->
		<div class="mx-auto mb-8 overflow-x-hidden">
			<div class="relative w-full border-b border-[#AAA19F]">
				<header
					class="relative z-20 mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-3 md:px-10"
				>
					<a href="/" class="flex items-center gap-2">
						<img src="/logo.svg" alt="Rondwell Logo" class="h-8 w-auto" />
					</a>

					<div class="flex items-center gap-3 text-[#909EA3] md:gap-6">
						<span class="hidden text-sm md:inline">{now}</span>

						<button class="flex items-center gap-1 transition hover:text-gray-800">
							Create Secrets
							<Icon icon="heroicons:heart" class="h-3 w-3" />
						</button>
						<button
							class="rounded-full bg-[#EBEBEB] px-5 py-2 text-gray-900 transition hover:bg-gray-200"
						>
							Sign In
						</button>
					</div>
				</header>
			</div>
			<!-- Progress Indicator -->
			<div class="mb-8 w-full overflow-hidden border-b border-[#EBEBEB] py-3 pt-10">
				<div
					class="flex w-[518px] items-center justify-center gap-4 transition-transform duration-300 ease-in-out md:w-full
		       {currentStep === 2 ? '-translate-x-[33.33%] md:translate-x-0' : ''}
		       {currentStep === 3 ? 'ml-[33.33%] -translate-x-[66.66%] md:ml-0 md:translate-x-0' : ''}"
				>
					{#each Array(totalSteps) as _, index}
						<div class="flex items-center">
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
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Step Content -->
		<div
			class="mx-auto mb-20 w-full rounded-[16px] p-6 md:max-w-[716px]"
			style="background-color: {selectedColor.cover}; box-shadow: 0px 1px 2px 0px #0A0D1408;"
		>
			{#if currentStep === 1}
				<!-- Step 1: Exhibitor Details -->
				<div class="space-y-6 rounded-xl">
					<div class="mb-6 text-center">
						<!-- <div class="text-sm" style="color: {selectedColor.lightText}">
							Step {currentStep} of {totalSteps}
						</div> -->
						<div class="mx-auto h-[96px] w-[96px]">
							<img src="/detail-icon.svg" alt="detail-icon" class="h-full w-full" />
						</div>
						<div class=" text-[24px] font-semibold text-[#171717]">
							{#if currentStep === 1}
								Exhibitor Details
							{:else if currentStep === 2}
								Payment & Pricing Setup
							{:else}
								Summary
							{/if}
						</div>
						<p class=" mt-1 text-sm text-[#5C5C5C]">
							{#if currentStep === 1}
								Provide essential Exhibitor Details to proceed.
							{:else if currentStep === 2}
								Set up your pricing and payment options.
							{:else}
								Review and complete your account setup.
							{/if}
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
								on:click={() => document.getElementById('logoInput')?.click()}
								on:keydown={(e) =>
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
								on:change={handleLogoUpload}
							/>
						</div>

						<!-- Cover/Banner Image -->
						<div class="col-span-2 space-y-2">
							<div class="text-sm font-medium">Cover/Banner Image</div>
							<div
								class="hover:border-opacity-50 relative flex h-40 cursor-pointer flex-col items-center justify-around rounded-[10px]"
								style="border: 1px dashed #D1D1D1; border-spacing: 5px;"
								on:click={() =>
									!coverImagePreview && document.getElementById('coverInput')?.click()}
								on:keydown={(e) =>
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
									<!-- Remove/Change buttons overlay -->
									<div
										class="absolute inset-0 flex items-center justify-center gap-3 rounded-[10px] bg-black/40 opacity-0 transition-opacity hover:opacity-100"
									>
										<button
											type="button"
											class="rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#171717] hover:bg-gray-100"
											on:click|stopPropagation={() =>
												document.getElementById('coverInput')?.click()}
										>
											Change
										</button>
										<button
											type="button"
											class="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
											on:click|stopPropagation={removeCoverImage}
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
										on:click|stopPropagation={() => document.getElementById('coverInput')?.click()}
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
								on:change={handleCoverUpload}
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
							<!-- svelte-ignore a11y_label_has_associated_control -->
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
							<!-- svelte-ignore a11y_label_has_associated_control -->
							<label class="text-sm font-medium">
								Business Type/Category <span class="text-[#335CFF]">*</span>
							</label>

							<select
								bind:value={businessType}
								class="h-[40px] w-full appearance-none rounded-[10px] border border-[#EBEBEB] bg-white px-4 pr-10 text-sm focus:outline-none"
								style="
												box-shadow: 0px 1px 2px 0px #0A0D1408;
												background-image: url('/arrow-dropdown.svg');
												background-repeat: no-repeat;
												background-position: right 12px center;
												background-size: 14px;
												"
							>
								<!-- Placeholder -->
								<option value="" disabled selected class="text-[#A3A3A3]"> James Brown </option>

								{#each businessTypes as type}
									<option value={type} class="border-white bg-white shadow-lg">{type}</option>
								{/each}
							</select>
						</div>

						<div class="space-y-2 md:col-span-2">
							<!-- svelte-ignore a11y_label_has_associated_control -->
							<label class="text-sm font-medium"
								>Company Description<span class="text-[#335CFF]">*</span>
								<span class="font-normal text-[#5C5C5C]"> (Optional)</span></label
							>
							<!-- svelte-ignore element_invalid_self_closing_tag -->
							<div class="relative w-full">
								<textarea
									bind:value={companyDescription}
									placeholder="Describe your company..."
									maxlength="200"
									rows="3"
									class="textarea-custom placeholder:text-[#A3A3A3} h-[56px] w-full resize-none rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-3 pr-14 text-sm focus:outline-none"
									style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
								/>

								<!-- Character Counter INSIDE textarea -->
								<span
									class="pointer-events-none absolute right-5 bottom-3 text-xs"
									style="color: {selectedColor.lightText}"
								>
									{companyDescription.length}/200
								</span>
							</div>

							<div class="-mt-3 flex items-center gap-1 text-xs text-[#5C5C5C]">
								<img src="/information-fill.svg" alt="information-fill" class="h-4 w-4" />
								<span>You can describe your company briefly.</span>
							</div>
						</div>
					</div>

					<!-- Business Location -->
					<div class="space-y-2">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="text-sm font-medium">
							Business Location/Service Area <span class="text-[#335CFF]">*</span>
						</label>

						<!-- Button to open modal -->
						<button
							class="flex h-14 w-full items-start gap-2 rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-3 text-left shadow-[0_1px_2px_0_#0A0D1408]"
							on:click={openModal}
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
										on:click={() => (showModal = false)}
									>
										Cancel
									</button>

									<button
										class="rounded-lg bg-[#335CFF] px-4 py-2 text-sm text-white"
										on:click={saveLocation}
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
							<!-- svelte-ignore a11y_label_has_associated_control -->
							<label class="text-sm font-medium">
								Phone Number <span class="text-[#335CFF]">*</span>
							</label>

							<div class="relative flex rounded-[10px] border border-[#EBEBEB] bg-white text-sm">
								<!-- Country picker -->
								<button
									type="button"
									class="flex w-[96px] items-center gap-2 border-r border-[#EBEBEB] px-2 py-3"
									style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
									on:click={() => (open = !open)}
								>
									<img
										src={selectedCountry.flag}
										alt={selectedCountry.name}
										class="h-5 w-5 rounded-full object-cover"
									/>

									<span class="text-xs">{selectedCountry.dial_code}</span>

									<!-- Dropdown icon -->
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

								<!-- Phone input -->
								<input
									type="tel"
									bind:value={phoneNumber}
									placeholder="(555) 000-0000"
									class="w-full flex-1 px-4 py-3 text-sm placeholder:text-[#A3A3A3] focus:outline-none"
									style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
									on:input={(e) => {
										const target = e.target as HTMLInputElement;
										target.value = target.value.replace(/[^0-9]/g, '');
										phoneNumber = target.value;
									}}
								/>

								<!-- Dropdown -->
								{#if open}
									<ul
										class="absolute top-full left-0 z-50 mt-1 max-h-64 w-72 overflow-auto rounded-lg border bg-white shadow-lg"
									>
										{#each countries as country}
											<!-- svelte-ignore a11y_click_events_have_key_events -->
											<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
											<li
												class="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-gray-100"
												on:click={() => {
													selectedCountry = country;
													open = false;
												}}
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
							<!-- svelte-ignore a11y_label_has_associated_control -->
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
							<!-- svelte-ignore a11y_label_has_associated_control -->
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
						<!-- <div class="text-sm" style="color: {selectedColor.lightText}">
							Step {currentStep} of {totalSteps}
						</div> -->
						<div class="mx-auto h-[96px] w-[96px]">
							<img src="/payment-Icon.svg" alt="detail-icon" class="h-full w-full" />
						</div>
						<div class=" text-[24px] font-[500] text-[#171717]">
							{#if currentStep === 2}
								Payment & Pricing Setup
							{:else}
								Summary
							{/if}
						</div>
						<p class=" mt-1 text-[16px] text-[#5C5C5C]">
							{#if currentStep === 2}
								Select a payment method and setup products pricing.
							{:else}
								Review your information and complete setup.
							{/if}
						</p>
					</div>
					<div class="my-8 h-[1px] w-full bg-[#EBEBEB]"></div>
					<!-- Payment Method Section -->
					<div
						class=" flex flex-col gap-5 rounded-2xl border bg-white px-4 py-6 md:grid md:grid-cols-2"
						style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
					>
						<div class="space-y-4 rounded-2xl">
							<div class="flex items-center gap-0">
								<!-- svelte-ignore a11y_label_has_associated_control -->
								<label class="text-sm font-medium text-[#1A1A1A]">Select Payment Method</label>
								<img src="/info-itallic.svg" alt="information-fill" class="h-5 w-5" />
							</div>

							<div class="relative">
								<!-- Custom Select Button -->
								<button
									type="button"
									on:click={() => (isDropdownOpen = !isDropdownOpen)}
									class="focus:ring-none w-full appearance-none rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-3 pr-10 text-left text-sm focus:ring-0 focus:outline-none"
								>
									{#if paymentMethod === 'paystack'}
										Paystack
									{:else if paymentMethod === 'flutterwave'}
										Flutterwave
									{:else if paymentMethod === 'stripe'}
										Stripe
									{/if}
								</button>

								<img
									src="/arrow-dropdown.svg"
									alt="arrow-dropdown"
									class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-transform {isDropdownOpen
										? 'rotate-180'
										: ''}"
								/>
							</div>

							<!-- Payment Method Options (Dropdown) -->
							{#if isDropdownOpen}
								<div
									class="mt-2 w-full space-y-2 rounded-[12px] border bg-white md:w-[310px]"
									style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
								>
									<button
										type="button"
										class="flex w-full items-center justify-between border-b px-2 py-3 transition-colors hover:bg-gray-50 {paymentMethod ===
										'paystack'
											? 'bg-blue-50'
											: ''}"
										on:click={() => selectPaymentMethod('paystack')}
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

										<!-- Toggle Switch -->
										<div
											class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {paymentMethod ===
											'paystack'
												? 'bg-[#00C3F7]'
												: 'bg-gray-300'}"
										>
											<span
												class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {paymentMethod ===
												'paystack'
													? 'translate-x-6'
													: 'translate-x-1'}"
											></span>
										</div>
									</button>

									<button
										type="button"
										class="flex w-full items-center justify-between border-b px-2 py-3 transition-colors hover:bg-gray-50 {paymentMethod ===
										'flutterwave'
											? 'bg-orange-50'
											: ''}"
										on:click={() => selectPaymentMethod('flutterwave')}
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

										<!-- Toggle Switch -->
										<div
											class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {paymentMethod ===
											'flutterwave'
												? 'bg-[#F5A623]'
												: 'bg-gray-300'}"
										>
											<span
												class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {paymentMethod ===
												'flutterwave'
													? 'translate-x-6'
													: 'translate-x-1'}"
											></span>
										</div>
									</button>

									<button
										type="button"
										class="flex w-full items-center justify-between px-2 py-3 transition-colors hover:bg-gray-50 {paymentMethod ===
										'stripe'
											? 'bg-purple-50'
											: ''}"
										on:click={() => selectPaymentMethod('stripe')}
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

										<!-- Toggle Switch -->
										<div
											class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {paymentMethod ===
											'stripe'
												? 'bg-[#635BFF]'
												: 'bg-gray-300'}"
										>
											<span
												class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {paymentMethod ===
												'stripe'
													? 'translate-x-6'
													: 'translate-x-1'}"
											></span>
										</div>
									</button>
								</div>
							{/if}
						</div>

						<!-- Currency Section -->
						<div class="space-y-4">
							<div class="flex items-center gap-0">
								<!-- svelte-ignore a11y_label_has_associated_control -->
								<label class="text-sm font-medium text-[#1A1A1A]">Select Proffered Currency</label>
								<img src="/info-itallic.svg" alt="information-fill" class="h-5 w-5" />
							</div>

							<div class="relative">
								<!-- Custom Select Button -->
								<button
									type="button"
									on:click={() => (isCurrencyDropdownOpen = !isCurrencyDropdownOpen)}
									class="focus:ring-none w-full appearance-none rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-3 pr-10 text-left text-sm focus:ring-0 focus:outline-none"
								>
									{#if currency === 'NGN'}
										Naira (₦)
									{:else if currency === 'USD'}
										US Dollar ($)
									{:else if currency === 'EUR'}
										Euro (€)
									{:else if currency === 'GBP'}
										British Pound (£)
									{/if}
								</button>

								<img
									src="/arrow-dropdown.svg"
									alt="arrow-dropdown"
									class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-transform {isCurrencyDropdownOpen
										? 'rotate-180'
										: ''}"
								/>
							</div>

							<!-- Currency Options (Dropdown) -->
							{#if isCurrencyDropdownOpen}
								<div
									class="mt-2 w-full space-y-2 rounded-[12px] border bg-white md:w-[310px]"
									style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
								>
									<button
										type="button"
										class="flex w-full items-center justify-between border-b px-2 py-3 transition-colors hover:bg-gray-50 {currency ===
										'NGN'
											? 'bg-green-50'
											: ''}"
										on:click={() => selectCurrency('NGN')}
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

										<!-- Toggle Switch -->
										<div
											class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {currency ===
											'NGN'
												? 'bg-[#22C55E]'
												: 'bg-gray-300'}"
										>
											<span
												class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {currency ===
												'NGN'
													? 'translate-x-6'
													: 'translate-x-1'}"
											></span>
										</div>
									</button>

									<button
										type="button"
										class="flex w-full items-center justify-between px-2 py-3 transition-colors hover:bg-gray-50 {currency ===
										'USD'
											? 'bg-blue-50'
											: ''}"
										on:click={() => selectCurrency('USD')}
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

										<!-- Toggle Switch -->
										<div
											class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {currency ===
											'USD'
												? 'bg-[#3B82F6]'
												: 'bg-gray-300'}"
										>
											<span
												class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {currency ===
												'USD'
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
								<div class="flex items-center gap-3">
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
									on:click={openTaxModal}
									class="min-h-[30px] min-w-[106px] rounded-lg bg-black text-xs font-medium text-white transition-colors hover:bg-gray-800"
								>
									{taxRate > 0 ? 'Edit Tax Rate' : 'Enter Tax Rate'}
								</button>
							</div>
						</div>

						<!-- Tax Rate Modal -->
						{#if showTaxModal}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5"
								on:click={cancelTaxModal}
							>
								<div
									class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
									on:click|stopPropagation
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
											on:click={cancelTaxModal}
											class="flex-1 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-gray-50"
										>
											Cancel
										</button>
										<button
											on:click={saveTaxRate}
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
						<div
							class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
							style="background-color: {selectedColor.button}"
						>
							<div class="mx-auto h-[96px] w-[96px]">
								<img src="/summary-icon.svg" alt="sumamry-icon" class="h-full w-full" />
							</div>
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
								on:click={() => editField(1)}
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
										{businessType || 'Not selected'}
									</div>
								</div>
							</div>
							<button
								class="text-gray-400 transition-colors hover:text-gray-600"
								on:click={() => editField(1)}
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
								on:click={() => editField(1)}
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
								on:click={() => editField(1)}
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
									on:click={() => editField(1)}
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
										{paymentMethod?.replace('_', ' ') || 'Not selected'}
									</div>
								</div>
							</div>
							<button
								class="text-gray-400 transition-colors hover:text-gray-600"
								on:click={() => editField(2)}
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
										{#if currency === 'NGN'}
											Naira (₦)
										{:else if currency === 'USD'}
											US Dollar ($)
										{:else}
											Not selected
										{/if}
									</div>
								</div>
							</div>
							<button
								class="text-gray-400 transition-colors hover:text-gray-600"
								on:click={() => editField(2)}
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
						on:click={prevStep}
						class="h-[40px] flex-1 rounded-[10px] py-2 font-medium transition"
						style="background-color: {selectedColor.cover}; color: {selectedColor.text}"
					>
						Back
					</button>
				{/if}

				{#if currentStep < totalSteps}
					<button
						on:click={nextStep}
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
						on:click={submitOnboarding}
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
	/* Custom scrollbar */
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
