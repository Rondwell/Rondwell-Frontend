<script lang="ts">
	import { goto } from '$app/navigation';
	import OnboardingNavButtons from '$lib/components/onboarding/OnboardingNavButtons.svelte';
	import OnboardingProgressBar from '$lib/components/onboarding/OnboardingProgressBar.svelte';
	import PaymentPricingStep from '$lib/components/onboarding/PaymentPricingStep.svelte';
	import SummaryRow from '$lib/components/onboarding/SummaryRow.svelte';
	import TaxRateModal from '$lib/components/onboarding/TaxRateModal.svelte';
	import { completeOnboarding } from '$lib/services/profile.services';
	import { uploadSpeakerPhoto, uploadSpeakerPortfolio } from '$lib/services/speaker.services';
	import { setActiveProfile } from '$lib/stores/auth.store';
	import { toast } from '$lib/stores/toast.store';
	import { colors, type Color } from '$lib/utils/colors';
	import { onDestroy } from 'svelte';
	import OnboardingNavbar from '../../components/OnboardingNavbar.svelte';

	// ============================================
	// INTERFACES
	// ============================================
	interface Expertise {
		label: string;
		icon: string;
	}

	type PortfolioFile = {
		file: File;
		preview?: string;
	};

	// ============================================
	// THEME
	// ============================================
	let selectedColor: Color = colors[7];

	// ============================================
	// STEP CONTROL
	// ============================================
	const totalSteps = 3;
	const steps = ['Speaker Details', 'Payment & Pricing', 'Summary'];
	let currentStep = $state(1);
	let isSubmitting = $state(false);

	// ============================================
	// STEP 1: SPEAKER DETAILS
	// ============================================
	let profilePhoto: File | null = null;
	let profilePreview = $state('');
	let fullName = $state('');
	let professionalTitle = $state('');
	let speakerDescription = $state('');
	let otherExpertise = $state('');
	let socialMediaLinks = $state({ linkedin: '', x: '', website: '' });
	let portfolioFiles = $state<PortfolioFile[]>([]);
	let selectedExpertise = $state<Expertise[]>([]);
	let isExpertiseOpen = $state(false);
	let isDragging = $state(false);

	const expertiseOptions: Expertise[] = [
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
	// STEP 2: PAYMENT & PRICING
	// ============================================
	let paymentMethods = $state<string[]>(['paystack']);
	let currencies = $state<string[]>(['NGN']);
	let taxRate = $state(0);
	let showTaxModal = $state(false);

	// ============================================
	// DERIVED
	// ============================================
	let canProceedStep1 = $derived(
		!!(fullName && professionalTitle && selectedExpertise.length > 0)
	);
	let canProceedStep2 = $derived(paymentMethods.length > 0);
	let canProceed = $derived(
		currentStep === 1 ? canProceedStep1 : currentStep === 2 ? canProceedStep2 : true
	);

	// ============================================
	// FILE HANDLERS
	// ============================================
	const MAX_FILE_SIZE = 50 * 1024 * 1024;
	const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'video/mp4', 'application/pdf'];

	function handleImageUpload(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;
		profilePhoto = file;
		const reader = new FileReader();
		reader.onload = () => { profilePreview = reader.result as string; };
		reader.readAsDataURL(file);
	}

	function handleFiles(files: FileList | null) {
		if (!files) return;
		Array.from(files).forEach((file) => {
			if (!ALLOWED_TYPES.includes(file.type)) { alert(`${file.name} is not a supported format.`); return; }
			if (file.size > MAX_FILE_SIZE) { alert(`${file.name} exceeds 50MB limit.`); return; }
			const entry: PortfolioFile = { file };
			if (file.type.startsWith('image') || file.type.startsWith('video')) {
				entry.preview = URL.createObjectURL(file);
			}
			portfolioFiles = [...portfolioFiles, entry];
		});
	}

	function removeFile(index: number) {
		const file = portfolioFiles[index];
		if (file.preview) URL.revokeObjectURL(file.preview);
		portfolioFiles = portfolioFiles.filter((_, i) => i !== index);
	}

	onDestroy(() => {
		portfolioFiles.forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });
	});

	// ============================================
	// EXPERTISE HANDLERS
	// ============================================
	function selectExpertise(type: Expertise) {
		if (!selectedExpertise.some((e) => e.label === type.label)) {
			selectedExpertise = [...selectedExpertise, type];
		}
		isExpertiseOpen = false;
	}

	function removeExpertise(label: string) {
		selectedExpertise = selectedExpertise.filter((e) => e.label !== label);
	}

	// ============================================
	// PAYMENT HANDLERS
	// ============================================
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
			const data = await completeOnboarding('speaker', {
				expertise: selectedExpertise.map((e) => e.label).join(', '),
				title: professionalTitle,
				affiliation: professionalTitle,
				bio: speakerDescription,
				fullName,
				socialLinks: socialMediaLinks,
				paymentMethods,
				currencies,
				taxRate
			});

			const profileId = data?.profile?._id;

			// Upload profile photo if provided
			if (profileId) {
				if (profilePhoto) {
					try {
						await uploadSpeakerPhoto(profileId, profilePhoto);
					} catch (e) {
						console.error('Failed to upload speaker photo:', e);
					}
				}

				// Upload portfolio files if provided
				if (portfolioFiles.length > 0) {
					try {
						const files = portfolioFiles.map((pf) => pf.file);
						await uploadSpeakerPortfolio(profileId, files);
					} catch (e) {
						console.error('Failed to upload speaker portfolio:', e);
					}
				}
			}

			if (data?.profile) {
				setActiveProfile({
					_id: data.profile._id,
					role: 'SPEAKER',
					name: data.profile.name || fullName,
					profilePictureUrl: data.profile.profilePictureUrl,
					onboardingStatus: 'COMPLETED'
				});
			}

			toast.success('Speaker profile created successfully!');
			goto('/speaker');
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
				<!-- Step 1: Speaker Details -->
				<div class="space-y-6 rounded-xl">
					<div class="mb-6 text-center">
						<div class="mx-auto h-[96px] w-[96px]">
							<img src="/detail-icon.svg" alt="detail-icon" class="h-full w-full" />
						</div>
						<div class="text-[24px] font-semibold text-[#171717]">Speaker Details</div>
						<p class="mt-1 text-sm text-[#5C5C5C]">Provide essential speaker information to proceed.</p>
					</div>
					<div class="my-8 h-[1px] w-full bg-[#EBEBEB]"></div>

					<!-- Profile Image Upload -->
					<div class="grid grid-cols-1 gap-4 rounded-xl border bg-white p-4 md:grid-cols-3">
						<div
							class="flex h-[96px] w-[96px] cursor-pointer items-center justify-center rounded-full border border-dashed border-[#D4D4D4]"
							onclick={() => document.getElementById('profileUpload')?.click()}
							onkeydown={(e) => e.key === 'Enter' && document.getElementById('profileUpload')?.click()}
							role="button"
							tabindex="0"
						>
							{#if profilePreview}
								<img src={profilePreview} alt="Profile" class="h-full w-full rounded-full object-cover" />
							{:else}
								<img src="/avatar.svg" alt="upload" class="h-8 w-8 opacity-60" />
							{/if}
						</div>
						<div class="md:col-span-2">
							<p class="text-sm font-medium text-[#171717]">Upload Image</p>
							<p class="text-xs text-[#5C5C5C]">Min 400×400px, PNG or JPEG</p>
							<button type="button" class="mt-2 inline-flex items-center rounded-md border border-[#EBEBEB] bg-white px-4 py-1.5 text-sm text-[#171717] hover:bg-[#F5F6F7]" onclick={() => document.getElementById('profileUpload')?.click()}>Upload</button>
						</div>
						<input id="profileUpload" type="file" accept="image/png, image/jpeg" class="hidden" onchange={handleImageUpload} />
					</div>

					<!-- Name & Title -->
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<label for="fullName" class="text-sm font-medium">Full Name <span class="text-[#335CFF]">*</span></label>
							<input id="fullName" bind:value={fullName} placeholder="John Brown" class="h-[40px] w-full rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-3 text-sm focus:outline-none" style="box-shadow: 0px 1px 2px 0px #0A0D1408;" />
						</div>
						<div class="space-y-2">
							<label for="profTitle" class="text-sm font-medium">Professional Title/Affiliation <span class="text-[#335CFF]">*</span></label>
							<input id="profTitle" bind:value={professionalTitle} placeholder="UI/UX Designer / Creative Bloom Studio" class="h-[40px] w-full rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-3 text-sm focus:outline-none" style="box-shadow: 0px 1px 2px 0px #0A0D1408;" />
						</div>
					</div>

					<!-- Speaker Bio -->
					<div class="space-y-2">
						<label for="speakerBio" class="text-sm font-medium">Speaker Bio <span class="font-normal text-[#5C5C5C]">(Optional)</span></label>
						<div class="relative w-full">
							<textarea id="speakerBio" bind:value={speakerDescription} placeholder="Describe yourself" maxlength="200" rows="3" class="h-[56px] w-full resize-none rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-3 pr-14 text-sm placeholder:text-[#A3A3A3] focus:outline-none" style="box-shadow: 0px 1px 2px 0px #0A0D1408;"></textarea>
							<span class="pointer-events-none absolute right-5 bottom-3 text-xs" style="color: {selectedColor.lightText}">{speakerDescription.length}/200</span>
						</div>
						<div class="mt-1 flex items-start gap-2 text-xs text-[#5C5C5C]">
							<img src="/information-fill.svg" alt="info" class="mt-[2px] h-4 w-4 opacity-70" />
							<span>You can describe yourself briefly.</span>
						</div>
					</div>

					<!-- Expertise Dropdown -->
					<div class="relative">
						<label class="mb-1 block text-sm font-medium text-[#171717]" for="expertise-btn">Areas of Expertise <span class="text-[#335CFF]">*</span></label>
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							id="expertise-btn"
							class="flex min-h-[44px] w-full cursor-pointer flex-wrap items-center gap-2 rounded-lg border border-[#EBEBEB] bg-white px-3 py-2"
							onclick={() => (isExpertiseOpen = !isExpertiseOpen)}
						>
							{#if selectedExpertise.length === 0}
								<span class="text-sm text-[#A3A3A3]">Select areas of expertise</span>
							{/if}
							{#each selectedExpertise as item}
								<span class="flex items-center gap-1 rounded-full bg-[#F5F6F7] px-3 py-1 text-xs text-[#171717]">
									<img src={item.icon} alt={item.label} class="h-4 w-4" />
									<span>{item.label}</span>
									<button type="button" class="ml-1 text-[#737373] hover:text-[#171717]" onclick={(e) => { e.stopPropagation(); removeExpertise(item.label); }}>✕</button>
								</span>
							{/each}
						</div>
						{#if isExpertiseOpen}
							<div class="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-[#EBEBEB] bg-white shadow-md">
								{#each expertiseOptions as option}
									<button type="button" class="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-[#F5F6F7] disabled:opacity-50" onclick={() => selectExpertise(option)} disabled={selectedExpertise.some((e) => e.label === option.label)}>
										<img src={option.icon} alt={option.label} class="h-5 w-5" />
										<span>{option.label}</span>
									</button>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Social Media Links -->
					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div class="space-y-2">
							<label for="linkedin" class="text-sm font-medium">LinkedIn</label>
							<div class="flex w-full items-center rounded-[10px] border border-[#EBEBEB] bg-white px-3 text-sm" style="box-shadow: 0px 1px 2px 0px #0A0D1408;">
								<div class="border-r py-3 pr-3 text-[#5C5C5C]">linkedin.com</div>
								<input id="linkedin" type="url" bind:value={socialMediaLinks.linkedin} placeholder="Username" class="w-full rounded-[10px] px-4 py-3 focus:outline-none" />
							</div>
						</div>
						<div class="space-y-2">
							<label for="xHandle" class="text-sm font-medium">X</label>
							<div class="flex w-full items-center rounded-[10px] border border-[#EBEBEB] bg-white px-3 text-sm" style="box-shadow: 0px 1px 2px 0px #0A0D1408;">
								<div class="border-r py-3 pr-3 text-[#5C5C5C]">twitter.com</div>
								<input id="xHandle" type="url" bind:value={socialMediaLinks.x} placeholder="Username" class="w-full py-3 pl-3 placeholder:text-[#171717] focus:outline-none" />
							</div>
						</div>
						<div class="space-y-2">
							<label for="speakerWebsite" class="text-sm font-medium">Website URL</label>
							<div class="flex w-full items-center rounded-[10px] border border-[#EBEBEB] bg-white px-3 text-sm" style="box-shadow: 0px 1px 2px 0px #0A0D1408;">
								<div class="border-r py-3 px-3 text-[#5C5C5C]">https</div>
								<input id="speakerWebsite" type="url" bind:value={socialMediaLinks.website} placeholder="www.example.com" class="w-full py-3 pl-3 placeholder:text-[#171717] focus:outline-none" />
							</div>
						</div>
					</div>

					<!-- Portfolio Upload -->
					<div class="mt-6">
						<label class="mb-2 block text-sm font-medium text-[#171717]" for="portfolio-upload">Upload Speaking Portfolio</label>
						<div
							class="relative flex min-h-[200px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D1D1D1] bg-white p-6 text-center transition hover:border-[#D1D1D1]"
							class:border-[#513BE2]={isDragging}
							ondragover={(e) => { e.preventDefault(); isDragging = true; }}
							ondragleave={() => (isDragging = false)}
							ondrop={(e) => { e.preventDefault(); isDragging = false; handleFiles(e.dataTransfer?.files ?? null); }}
							role="region"
							aria-label="File upload drop zone"
						>
							<img src="/upload.svg" alt="upload-icon" />
							<p class="mt-2 text-sm font-medium text-[#171717]">Choose a file or drag & drop it here</p>
							<p class="mt-1 text-xs text-[#737373]">JPEG, PNG, PDF, MP4 • Max 50MB per file</p>
							<label id="portfolio-upload" class="mt-4 inline-block cursor-pointer rounded-md border border-[#EBEBEB] bg-white px-4 py-2 text-sm font-medium text-[#171717] hover:bg-[#F5F5F5]">
								Browse File
								<input type="file" class="hidden" multiple accept=".jpg,.jpeg,.png,.pdf,.mp4" onchange={(e) => handleFiles((e.target as HTMLInputElement).files)} />
							</label>
						</div>

						{#if portfolioFiles.length > 0}
							<div class="mt-4 space-y-3">
								{#each portfolioFiles as item, index}
									<div class="flex items-center justify-between rounded-lg border border-[#EBEBEB] bg-white p-3">
										<div class="flex items-center gap-3">
											{#if item.file.type.startsWith('image')}
												<img src={item.preview} alt="preview" class="h-10 w-10 rounded object-cover" />
											{:else if item.file.type.startsWith('video')}
												<div class="flex h-10 w-10 items-center justify-center rounded bg-[#E5E7EB] text-xs">🎥</div>
											{:else}
												<div class="flex h-10 w-10 items-center justify-center rounded bg-[#E5E7EB] text-xs">📄</div>
											{/if}
											<div>
												<p class="text-sm font-medium text-[#171717]">{item.file.name}</p>
												<p class="text-xs text-[#737373]">{(item.file.size / (1024 * 1024)).toFixed(1)} MB</p>
											</div>
										</div>
										<button type="button" class="text-sm text-[#737373] hover:text-[#171717]" onclick={() => removeFile(index)}>✕</button>
									</div>
								{/each}
							</div>
						{/if}
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
						<SummaryRow icon="/account-pin-box-line.svg" label="Full Name" value={fullName} editStep={1} onEdit={editField} />
						<SummaryRow icon="/account-pin-box-line.svg" label="Professional Title/Affiliation" value={professionalTitle} editStep={1} onEdit={editField} />
						<SummaryRow icon="/grid-icon.svg" label="Areas of Expertise" editStep={1} onEdit={editField}>
							{#snippet children()}
								<div class="flex flex-wrap gap-2 text-sm font-medium text-[#171717]">
									{#if selectedExpertise.length > 0}
										{#each selectedExpertise as item}
											<span class="flex items-center gap-2 rounded-full bg-[#F5F6F7] px-3 py-1">
												<img src={item.icon} alt={item.label} class="h-4 w-4" />
												<span>{item.label}</span>
											</span>
										{/each}
									{:else}
										<span class="text-[#A3A3A3]">Not selected</span>
									{/if}
								</div>
							{/snippet}
						</SummaryRow>
						<SummaryRow icon="/link-2.svg" label="Social Media Links" editStep={1} onEdit={editField}>
							{#snippet children()}
								<div class="space-y-1 text-sm font-medium text-[#171717]">
									{#if socialMediaLinks.linkedin}
										<div class="flex items-center gap-2"><img src="/linkedin.svg" alt="LinkedIn" class="h-4 w-4" /><span>{socialMediaLinks.linkedin}</span></div>
									{/if}
									{#if socialMediaLinks.x}
										<div class="flex items-center gap-2"><img src="/x.svg" alt="X" class="h-4 w-4" /><span>{socialMediaLinks.x}</span></div>
									{/if}
									{#if socialMediaLinks.website}
										<div class="flex items-center gap-2"><img src="/globe.svg" alt="Website" class="h-4 w-4" /><span>{socialMediaLinks.website}</span></div>
									{/if}
									{#if !socialMediaLinks.linkedin && !socialMediaLinks.x && !socialMediaLinks.website}
										<span class="text-[#A3A3A3]">Not provided</span>
									{/if}
								</div>
							{/snippet}
						</SummaryRow>
						<SummaryRow icon="/upload.svg" label="Speaking Portfolio" editStep={1} onEdit={editField}>
							{#snippet children()}
								{#if portfolioFiles.length > 0}
									<div class="space-y-1">
										{#each portfolioFiles as item}
											<div class="flex items-center gap-2 text-sm font-medium text-[#171717]">
												{#if item.file.type.startsWith('image')}
													<img src={item.preview} alt="preview" class="h-6 w-6 rounded object-cover" />
												{:else}
													<span>📄</span>
												{/if}
												<span>{item.file.name}</span>
												<span class="text-xs text-[#737373]">({(item.file.size / (1024 * 1024)).toFixed(1)} MB)</span>
											</div>
										{/each}
									</div>
								{:else}
									<div class="text-sm text-gray-400">No files uploaded</div>
								{/if}
							{/snippet}
						</SummaryRow>
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
