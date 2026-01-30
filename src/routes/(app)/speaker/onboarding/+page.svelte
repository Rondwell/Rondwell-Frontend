<script lang="ts">
	import { goto } from '$app/navigation';
	//import countries from '$lib/utils/countries.json';
	import { colors, type Color } from '$lib/utils/colors';
	import { onDestroy } from 'svelte';
	import OnboardingNavbar from '../../components/OnboardingNavbar.svelte';


/*let isPaymentDropdownOpen = false;
let isTaxModalOpen = false;

const paymentMethods = [
	{
		name: 'Paystack',
		value: 'paystack',
		icon: '/paystack.svg'
	},
	{
		name: 'Flutterwave',
		value: 'flutterwave',
		icon: '/flutter.svg'
	},
	{
		name: 'Stripe',
		value: 'stripe',
		icon: '/Stripe.svg'
	}
];

let formData = {
	paymentMethod: null as null | typeof paymentMethods[number],
	currency: '',
	taxRate: 0
};

function selectPaymentMethod(method) {
	formData.paymentMethod = method;
	isPaymentDropdownOpen = false;
}

*/
	// ============================================
	// INTERFACES
	// ============================================
	interface Expertise {
		label: string;
		icon: string;
	}

	// ============================================
	// STEP CONTROL
	// ============================================
	const totalSteps = 3;
	const steps = ['Speaker Details', 'Payment & Pricing', 'Summary'];
	let currentStep = $state(1);


	// ============================================
	// STEP 1 — SPEAKER DETAILS
	// ============================================
	//let profilePhoto: File | null = null;
	//let profilePhotoPreview = '';
	let fullName = $state('');
let professionalTitle = $state('');
let speakerDescription = $state('');
let otherExpertise = $state('');

	let socialMediaLinks = $state({
  linkedin: '',
  x: '',
  website: ''
});

let portfolioFiles = $state<PortfolioFile[]>([]);


	let portfolioLinks: string[] = [];

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

	let selectedExpertise = $state<Expertise[]>([]);
	let isOpen = $state(false);


	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function selectExpertise(type: Expertise) {
	if (!selectedExpertise.some(e => e.label === type.label)) {
		selectedExpertise = [...selectedExpertise, type];
	}
	isOpen = false;
}

function removeExpertise(label: string) {
	selectedExpertise = selectedExpertise.filter(e => e.label !== label);
}

	onDestroy(() => {
	portfolioFiles.forEach(f => {
		if (f.preview) URL.revokeObjectURL(f.preview);
	});
});

	type PortfolioFile = {
	file: File;
	preview?: string;
};

let isDragging = $state(false);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
	'image/jpeg',
	'image/png',
	'video/mp4',
	'application/pdf'
];

function handleFiles(files: FileList | null) {
	if (!files) return;

	Array.from(files).forEach((file) => {
		if (!ALLOWED_TYPES.includes(file.type)) {
			alert(`${file.name} is not a supported format.`);
			return;
		}

		if (file.size > MAX_FILE_SIZE) {
			alert(`${file.name} exceeds 50MB limit.`);
			return;
		}

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
// ============================================
	// DISPLAY HELPERS
	// ============================================
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
	// STEP 2 — PAYMENT
	// ============================================
	let pricingModel = $state<'free' | 'paid'>('free');
let basePrice = $state('');
let paymentMethods = $state<string[]>(['paystack']);
let currencies = $state<string[]>(['NGN']);
let taxRate = $state(0);
	let showTaxModal = $state(false);
	let tempTaxRate = $state(0);

	// ============================================
	// DERIVED / REACTIVE STATE
	// ============================================
	let canProceedStep1 = $derived(
	!!(fullName && professionalTitle && selectedExpertise.length > 0)
);


	let canProceedStep2 = $derived(
		pricingModel === 'free' ||
		(!!basePrice && paymentMethods.length > 0)
	);
		// ============================================
	// REACTIVE STATE - All UI state using $state()
	// ============================================


	//let now = $state(formatTime());
	let selectedStyle = 'Minimal';
let selectedFont = 'Default';
let selectedColor: Color = colors[7];
let background_color = '#F5F6F7';
let showModal = false;
let open = false;
let isDropdownOpen = $state(false);
let isCurrencyDropdownOpen = $state(false);

	// ============================================
	// TIME
	// ============================================
	function formatTime() {
		return new Date().toLocaleString('en-GB', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	let now = formatTime();
	const interval = setInterval(() => {
		now = formatTime();
	}, 60000);

	onDestroy(() => clearInterval(interval));
	function editField(step: number) {
		// Allow navigation to any completed step or current step
		if (step <= currentStep) {
			currentStep = step;
		}
	}

	// ============================================
	// HANDLERS
	// ============================================
	function handleHorizontalScroll(event: WheelEvent) {
    const container = event.currentTarget as HTMLElement;
    event.preventDefault();
    container.scrollLeft += event.deltaY;
}
  // Profile Image Upload
	let profilePhoto: File | null = null;
	let profilePreview = $state('');

	function handleImageUpload(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;

		profilePhoto = file;

		const reader = new FileReader();
		reader.onload = () => {
			profilePreview = reader.result as string;
		};
		reader.readAsDataURL(file);
	}



	function nextStep() {
		if (currentStep < totalSteps) {
			currentStep += 1;
		}
	}

	function prevStep() {
		if (currentStep > 1) {
			currentStep -= 1;
		}
	}
	/*function togglePayment(method: string) {
	if (paymentMethods.includes(method)) {
		paymentMethods = paymentMethods.filter(m => m !== method);
	} else {
		paymentMethods = [...paymentMethods, method];
	}
}
*/

	function submitOnboarding() {
		const payload = {
			fullName,
			professionalTitle,
			expertise: selectedExpertise.map(e => e.label),
			socialMediaLinks,
			portfolioLinks,
			pricingModel,
			basePrice,
			paymentMethods,
			currencies,
			taxRate
		};
		

		console.log('Speaker onboarding payload:', payload);

		goto('/speaker');
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
  <!-- ===================== STEP 1 — SPEAKER DETAILS ===================== -->
  {#if currentStep === 1}
<div class="space-y-6">

	<!-- Header -->
	<div class="text-center">
		<div class="mx-auto h-[96px] w-[96px]">
							<img src="/detail-icon.svg" alt="detail-icon" class="h-full w-full" />
						</div>
		<h2 class="teoverflow-auto bg-cover bg-center bg-no-repeat"
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
		<div class="mx-auto  mb-8 overflow-x-hiddxt-[24px] font-semibold text-[#171717]">Speaker Details</h2>
		<p class="mt-1 text-sm text-[#5C5C5C]">
			Provide essential speaker information
		</p>
	</div>

	<!-- Profile Image -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-3 rounded-xl border p-4 bg-white">

	<!-- Image Preview / Upload -->
	<div class="flex h-[96px] w-[96px] cursor-pointer items-center justify-center rounded-full border border-dashed border-[#D4D4D4]"
	onclick={() => document.getElementById('profileUpload')?.click()}
>

		{#if profilePreview}
			<img
				src={profilePreview}
				alt="Profile preview"
				class="h-full w-full rounded-full object-cover"
			/>
		{:else}
			<div class="flex flex-col items-center gap-2">
				<img src="/avatar.svg" alt="upload icon" class="h-8 w-8 opacity-60" />
			</div>
		{/if}
	</div>

	<!-- Info -->
	<div class="md:col-span-2 ">
		<p class="text-sm font-medium text-[#171717]">Upload Image</p>
		<p class="text-xs text-[#5C5C5C]">
			Min 400×400px, PNG or JPEG
		</p>

		<button
			type="button"
			class="mt-2 inline-flex items-center rounded-md border border-[#EBEBEB] bg-white px-4 py-1.5 text-sm text-[#171717] hover:bg-[#F5F6F7]"
			onclick={() => document.getElementById('profileUpload')?.click()}
		>
			Upload
		</button>
	</div>

	<input
		id="profileUpload"
		type="file"
		accept="image/png, image/jpeg"
		class="hidden"
		onchange={handleImageUpload}
	/>
</div>


	<!-- Inputs -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<div class="space-y-2 md:col-span-1">
			<label class="text-sm font-medium"
								>Full Name <span class="text-[#335CFF]">*</span></label
							><br>
		<input
			bind:value={fullName}
			placeholder="john brown"
			class=" h-[40px] w-full rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-3 text-sm focus:outline-none"
								style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
		/>
	</div>
	<div class="space-y-2 md:col-span-1">
			<label class="text-sm font-medium"
								>Professional Title/Affiliation <span class="text-[#335CFF]">*</span></label
							><br>
		<input
			bind:value={professionalTitle}
			placeholder="UI/UX Designer / Creative Bloom Studio"
			class=" h-[40px] w-full rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-3 text-sm focus:outline-none"
								style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
		/>
	</div>
	</div>
	<div class="space-y-2 md:col-span-2">
		<label class="text-sm font-medium"
								>Speaker Bio <span class="text-[#335CFF]">*</span>
								<span class="font-normal text-[#5C5C5C]"> (Optional)</span></label
							>
							<div class="relative w-full">
								<textarea
									bind:value={speakerDescription}
									placeholder="Describe yourself"
									maxlength="200"
									rows="3"
									class="placeholder:text-[#A3A3A3} h-[56px] w-full resize-none rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-3 pr-14 text-sm focus:outline-none"
									style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
								/>
								<span
									class="pointer-events-none absolute right-5 bottom-3 text-xs"
									style="color: {selectedColor.lightText}"
								>
									{speakerDescription.length}/200
								</span>
							</div>
							<div class="mt-1 flex items-start gap-2 text-xs text-[#5C5C5C]">
								<img src="/information-fill.svg" alt="information-fill" class=" mt- [2px] h-4 w-4 opacity-70" />
								<span>You can describe yourself briefly.</span>
								</div>
	</div>
	<!-- Expertise Dropdown -->
	<div class="relative">
	<label class="block text-sm font-medium text-[#171717] mb-1">
		Areas of Expertise <span class="text-[#335CFF]">*</span>
	</label>

	<!-- Input / Selected Chips -->
	<div
		class="min-h-[44px] w-full cursor-pointer rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 flex flex-wrap gap-2 items-center"
		onclick={toggleDropdown}
	>
		{#if selectedExpertise.length === 0}
			<span class="text-sm text-[#A3A3A3]">
				Select areas of expertise
			</span>
		{/if}

		{#each selectedExpertise as item}
			<span
  class="flex items-center gap-1 rounded-full bg-[#F5F6F7] px-3 py-1 text-xs text-[#171717]"
  onclick={(e) => e.stopPropagation()}
>
  <img src={item.icon} alt={item.label} class="h-4 w-4" />
        <span>{item.label}</span>

  <button
    type="button"
    class="ml-1 text-[#737373] hover:text-[#171717]"
    onclick={(e) => {
      e.stopPropagation();
      removeExpertise(item.label);
    }}
  >
    ✕
  </button>
</span>

		{/each}
	</div>

	<!-- Dropdown -->
	{#if isOpen}
    <div
      class="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-[#EBEBEB] bg-white shadow-md"
    >
      {#each expertiseOptions as option}
        <button
          type="button"
          class="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-[#F5F6F7]"
          onclick={() => selectExpertise(option)}
          disabled={selectedExpertise.some(e => e.label === option.label)}
        >
          <img src={option.icon} alt={option.label} class="h-5 w-5" />
          <span>{option.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<!-- Contact Information -->
					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
  <!-- LinkedIn -->
  <div class="space-y-2">
	<label class="text-sm font-medium"
								>LinkedIn<span class="text-[#335CFF]">*</span></label
							>
    <div class="flex w-full items-center rounded-[10px] border border-[#EBEBEB] bg-white px-3 text-sm focus:outline-none"
								style="box-shadow: 0px 1px 2px 0px #0A0D1408;">
		<div class="border-r py-3 pr-3 text-[#5C5C5C]">linkedin.com</div>
		<input
      type="url"
      bind:value={socialMediaLinks.linkedin}
      placeholder="Username"
      style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
									class="w-full rounded-[10px] px-4 py-3 focus:outline-none"
    />
	</div>
    
  </div>

  <!-- X / Twitter -->
  <div class="space-y-2">
	<label class="text-sm font-medium"
								>X<span class="text-[#335CFF]">*</span></label
							>
    <div class="flex w-full items-center rounded-[10px] border border-[#EBEBEB] bg-white px-3 text-sm focus:outline-none"
								style="box-shadow: 0px 1px 2px 0px #0A0D1408;">
		<div class="border-r py-3 pr-3 text-[#5C5C5C]">twitter.com</div>
    <input
      type="url"
      bind:value={socialMediaLinks.x}
      placeholder="Username"
      class="w-full pl-3 placeholder:text-[#171717] focus:outline-none py-3"
    />
  </div>
  </div>

  <!-- Website -->
  <div class="space-y-2">
	<label class="text-sm font-medium"
								>Website URL<span class="text-[#335CFF]">*</span></label
							>
    <div class="flex w-full items-center rounded-[10px] border border-[#EBEBEB] bg-white px-3 text-sm focus:outline-none"
								style="box-shadow: 0px 1px 2px 0px #0A0D1408;">
    <div class="border-r py-3 px-3 text-[#5C5C5C]">https</div>
    <input
      type="url"
      bind:value={socialMediaLinks.website}
      placeholder="www.example.com"
      class="w-full pl-3 placeholder:text-[#171717] focus:outline-none py-3"
    />
  </div>
  </div>
					</div>
<div class="mt-6">
  <label class="mb-2 block text-sm font-medium text-[#171717]">
    Upload Speaking Portfolio
  </label>

  <!-- DROP ZONE -->
  <div
    class="relative flex min-h-[200px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D1D1D1] bg-white p-6 text-center transition hover:border-[#D1D1D1]"
    class:border-[#513BE2]={isDragging}
    ondragover={(e) => { e.preventDefault(); isDragging = true; }}
    ondragleave={() => (isDragging = false)}
    ondrop={(e) => { e.preventDefault(); isDragging = false; handleFiles(e.dataTransfer?.files ?? null); }}
  >
    <!-- Cloud + arrow icon -->
    <img src="/upload.svg" alt="upload-icon" />

    <!-- Main text -->
    <p class="mt-2 text-sm font-medium text-[#171717]">
      Choose a file or drag & drop it here
    </p>

    <!-- Subtitle -->
    <p class="mt-1 text-xs text-[#737373]">
      JPEG, PNG, PDF, MP4 • Max 50MB per file
    </p>

    <!-- Browse file button -->
    <label
      class="mt-4 inline-block cursor-pointer rounded-md border border-[#EBEBEB] bg-white px-4 py-2 text-sm font-medium text-[#171717] hover:bg-[#F5F5F5]"
    >
      Browse File
      <input
        type="file"
        class="hidden"
        multiple
        accept=".jpg,.jpeg,.png,.pdf,.mp4"
        onchange={(e) => handleFiles((e.target as HTMLInputElement).files)}
      />
    </label>
  </div>

  <!-- FILE PREVIEW LIST -->
  {#if portfolioFiles.length > 0}
    <div class="mt-4 space-y-3">
      {#each portfolioFiles as item, index}
        <div class="flex items-center justify-between rounded-lg border border-[#EBEBEB] bg-white p-3">
          <div class="flex items-center gap-3">
            {#if item.file.type.startsWith('image')}
              <img
                src={item.preview}
                alt="preview"
                class="h-10 w-10 rounded object-cover"
              />
            {:else if item.file.type.startsWith('video')}
              <video
                src={item.preview}
                class="h-10 w-10 rounded object-cover"
              />
            {:else}
              📄
            {/if}

            <div>
              <p class="text-sm font-medium text-[#171717]">
                {item.file.name}
              </p>
              <p class="text-xs text-[#737373]">
                {(item.file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
          </div>

          <button
            type="button"
            class="text-sm text-[#737373] hover:text-[#171717]"
            onclick={() => removeFile(index)}
          >
            ✕
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

</div>
{/if}
  				{#if currentStep === 2}
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
			{/if}		
						
  <!-- ===================== STEP 3 — SUMMARY ===================== -->
  {#if currentStep === 3}
    <div class="space-y-6">
      <div class="text-center">
						<div class="mx-auto h-[96px] w-[96px]">
							<img src="/summary-icon.svg" alt="summary-icon" class="h-full w-full" />
						</div>
						<h3 class="mb-2 text-2xl font-medium">Onboarding Summary</h3>
						<p class="-mt-2 text-[16px] text-[#5C5C5C]">Review and complete your account setup.</p>
					</div>
					<div class="my-8 h-[1px] w-full bg-[#EBEBEB]"></div>
					<div
						class="space-y-3 rounded-2xl border bg-white px-4"
						style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
					><!-- Full Name -->
						<div class="flex items-center justify-between border-b border-[#E5E7EB] py-4">
							<div class="flex items-center gap-3">
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5]">
									<img src="/account-pin-box-line.svg" alt="company" class="h-5 w-5" />
								</div>
								<div>
									<div class="text-xs tracking-wider text-[#5C5C5C] uppercase">Full Name</div>
									<div class="text-sm font-medium text-[#171717]">
										{fullName || 'Not provided'}
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
						<!-- Professional Title/Affiliation -->
						<div class="flex items-center justify-between border-b border-[#E5E7EB] py-4">
							<div class="flex items-center gap-3">
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5]">
									<img src="/account-pin-box-line.svg" alt="company" class="h-5 w-5" />
								</div>
								<div>
									<div class="text-xs tracking-wider text-[#5C5C5C] uppercase">Professional title/Affiliation</div>
									<div class="text-sm font-medium text-[#171717]">
										{professionalTitle || 'Not provided'}
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
						<!-- Expertise Type/Category -->
						<div class="flex items-center justify-between border-b border-[#E5E7EB] py-4">
							<div class="flex items-center gap-3">
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5]">
									<img src="/grid-icon.svg" alt="category" class="h-5 w-5" />
								</div>
								<div>
									<div class="text-xs tracking-wider text-[#5C5C5C] uppercase">
										Areas of Expertise/Topics
									</div>
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

								</div>
							</div>
							<button
								class="text-gray-400 transition-colors hover:text-gray-600"
								onclick={() => editField(1)}
							>
								<img src="/edit-icon.svg" alt="edit" class="h-[11.42px] w-[11.98px]" />
							</button>
						</div>
						<!-- Social Media Links -->
<div class="flex items-start justify-between border-b border-[#E5E7EB] py-4">
	<div class="flex items-start gap-3">
		<div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5]">
			<img src="/link-2.svg" alt="social links" class="h-5 w-5" />
		</div>

		<div class="space-y-2">
			<div class="text-xs tracking-wider text-[#5C5C5C] uppercase">
				Social Media Links
			</div>

			<div class="space-y-1 text-sm font-medium text-[#171717]">
				{#if socialMediaLinks.linkedin}
					<div class="flex items-center gap-2">
						<img src="/linkedin.svg" alt="LinkedIn" class="h-4 w-4" />
						<span>{socialMediaLinks.linkedin}</span>
					</div>
				{/if}

				{#if socialMediaLinks.x}
					<div class="flex items-center gap-2">
						<img src="/x.svg" alt="X" class="h-4 w-4" />
						<span>{socialMediaLinks.x}</span>
					</div>
				{/if}

				{#if socialMediaLinks.website}
					<div class="flex items-center gap-2">
						<img src="/globe.svg" alt="Website" class="h-4 w-4" />
						<span>{socialMediaLinks.website}</span>
					</div>
				{/if}

				{#if
					!socialMediaLinks.linkedin &&
					!socialMediaLinks.x &&
					!socialMediaLinks.website
				}
					<span class="text-[#A3A3A3]">Not provided</span>
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
						<!-- Speaking Portfolio -->
<div class="flex items-start justify-between border-b border-[#E5E7EB] py-4">
	<div class="flex items-start gap-3">
		<div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5]">
			<img src="/upload.svg" alt="portfolio" class="h-5 w-5" />
		</div>

		<div class="w-full">
			<div class="text-xs tracking-wider text-[#5C5C5C] uppercase">
				Speaking Portfolio
			</div>

			{#if portfolioFiles.length > 0}
				<div class="mt-2 space-y-2">
					{#each portfolioFiles as item}
						<div class="flex items-center gap-3">
							<!-- Preview -->
							{#if item.file.type.startsWith('image')}
								<img
									src={item.preview}
									alt="preview"
									class="h-8 w-8 rounded object-cover"
								/>
							{:else if item.file.type.startsWith('video')}
								<div class="flex h-8 w-8 items-center justify-center rounded bg-[#E5E7EB] text-xs">
									🎥
								</div>
							{:else}
								<div class="flex h-8 w-8 items-center justify-center rounded bg-[#E5E7EB] text-xs">
									📄
								</div>
							{/if}

							<!-- File info -->
							<div>
								<div class="text-sm font-medium text-[#171717]">
									{item.file.name}
								</div>
								<div class="text-xs text-[#737373]">
									{(item.file.size / (1024 * 1024)).toFixed(1)} MB
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="mt-1 text-sm text-gray-400">
					No files uploaded
				</div>
			{/if}
		</div>
	</div>

	<button
		class="text-gray-400 transition-colors hover:text-gray-600"
		onclick={() => editField(1)}
	>
		<img src="/edit-icon.svg" alt="edit" class="h-[11.42px] w-[11.98px]" />
	</button>
</div>
     <!-- <p><strong>Portfolio Links:</strong></p>
      <ul>
		{#each portfolioLinks as link}
		  <li>{link}</li>
		{/each}
      </ul>-->
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
										{ getCurrencyDisplay()|| 'Not selected'}
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

  <!-- ===================== NAVIGATION BUTTONS ===================== -->
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