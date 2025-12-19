<script lang="ts">
  import Icon from '@iconify/svelte';
  import { goto } from '$app/navigation';

  // ==========================================
  // 1. APP STATE
  // ==========================================
  let currentStep = $state(1);
  let isSubmitting = $state(false);

  // Modals & Dropdowns
  let isTaxModalOpen = $state(false);
  let isCountryDropdownOpen = $state(false);
  let isProductModalOpen = $state(false);
  let isPaymentDropdownOpen = $state(false);
  let isServiceDropdownOpen = $state(false); 

  // ==========================================
  // 2. DATA & ASSETS
  // ==========================================

  // The Blue Paystack Logo (Embedded - No file needed)
  const paystackSVGCode = `
  <svg viewBox="0 0 314 76" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-full w-auto">
    <path d="M45.9221 27H29.039C28.4675 27 28 27.4762 28 28.0582V29.963C28 30.545 28.4675 31.0212 29.039 31.0212H45.8701C46.4416 31.0212 46.9091 30.545 46.9091 29.963V28.0582C46.961 27.4762 46.4935 27 45.9221 27ZM45.9221 37.6349H29.039C28.4675 37.6349 28 38.1111 28 38.6931V40.5979C28 41.1799 28.4675 41.6561 29.039 41.6561H45.8701C46.4416 41.6561 46.9091 41.1799 46.9091 40.5979V38.6931C46.961 38.1111 46.4935 37.6349 45.9221 37.6349ZM38.5455 42.9788H29.039C28.4675 42.9788 28 43.455 28 44.037V45.9418C28 46.5238 28.4675 47 29.039 47H38.5455C39.1169 47 39.5844 46.5238 39.5844 45.9418V44.037C39.5844 43.455 39.1169 42.9788 38.5455 42.9788ZM46.961 32.3439H29.039C28.4675 32.3439 28 32.8201 28 33.4021V35.3069C28 35.8889 28.4675 36.3651 29.039 36.3651H46.961C47.5325 36.3651 48 35.8889 48 35.3069V33.4021C48 32.8201 47.5325 32.3439 46.961 32.3439Z" fill="#0BA4DB"/>
  </svg>
  `;

  const countries = [
    { code: '+234', iso: 'ng', name: 'Nigeria' },
    { code: '+1',   iso: 'us', name: 'USA' },
    { code: '+44',  iso: 'gb', name: 'UK' },
    { code: '+233', iso: 'gh', name: 'Ghana' },
    { code: '+254', iso: 'ke', name: 'Kenya' },
    { code: '+27',  iso: 'za', name: 'South Africa' },
    { code: '+1',   iso: 'ca', name: 'Canada' }
  ];

  const businessCategories = [
    'Catering', 'Photography', 'Event Venue', 'Sound & Lighting',
    'Entertainment', 'Cake & Confectionery', 'Wedding Gowns',
    'Floristry', 'Security', 'Transportation', 'Printing & Branding'
  ];

  const serviceTypes = [
    { name: 'Catering', icon: 'heroicons:table-cells' },
    { name: 'Photography', icon: 'heroicons:camera' },
    { name: 'Event Venue', icon: 'heroicons:building-office-2' },
    { name: 'Sound & Lighting', icon: 'heroicons:speaker-wave' },
    { name: 'Entertainment', icon: 'heroicons:musical-note' },
    { name: 'Cake & Confectionery', icon: 'heroicons:cake' },
    { name: 'Wedding Gowns', icon: 'heroicons:sparkles' },
    { name: 'Floristry', icon: 'heroicons:heart' }, 
    { name: 'Security', icon: 'heroicons:shield-check' },
    { name: 'Transportation', icon: 'heroicons:truck' },
    { name: 'Printing & Branding', icon: 'heroicons:printer' },
    { name: 'Other', icon: 'heroicons:ellipsis-horizontal-circle' }
  ];

  const paymentMethods = [
    { 
      name: 'Paystack', 
      type: 'svg', 
      val: paystackSVGCode, 
    },
    { 
      name: 'Flutterwave', 
      type: 'icon', 
      val: 'heroicons:currency-dollar', 
      color: 'text-orange-500' 
    },
    { 
      name: 'Stripe', 
      type: 'image',
      val: 'https://avatars.githubusercontent.com/u/856813?s=200&v=4', 
    }
  ];

  // ==========================================
  // 3. FORM LOGIC
  // ==========================================
  let formData = $state({
    companyName: '', category: '', otherCategory: '', description: '',
    location: '', phone: '', phoneCode: countries[0], email: '', website: '',
    paymentMethod: null as typeof paymentMethods[0] | null,
    currency: '', taxRate: '',
    products: [] as { name: string; price: string; description: string }[]
  });

  let newProduct = $state({
    category: null as typeof serviceTypes[0] | null,
    customName: '',
    price: '',
    description: ''
  });

  let steps = [
    { number: 1, title: 'Business Details' },
    { number: 2, title: 'Payment & Pricing Setup' },
    { number: 3, title: 'Your First Listing' },
    { number: 4, title: 'Summary' }
  ];

  let currencySymbol = $derived(formData.currency.includes('Naira') ? '₦' : '$');
  let displayCategory = $derived(formData.category === 'Other' ? formData.otherCategory : formData.category);

  function selectCountry(country: typeof countries[0]) {
    formData.phoneCode = country;
    isCountryDropdownOpen = false;
  }

  function selectPaymentMethod(method: typeof paymentMethods[0]) {
    formData.paymentMethod = method;
    isPaymentDropdownOpen = false;
  }

  function selectServiceType(type: typeof serviceTypes[0]) {
    newProduct.category = type;
    if (type.name !== 'Other') isServiceDropdownOpen = false;
  }

  async function handleContinue() {
    if (currentStep === 1) {
        if (!formData.companyName || !formData.email) {
            alert('Please fill in at least Company Name and Email.');
            return;
        }
        if (formData.category === 'Other' && !formData.otherCategory) {
          alert('Please specify your category.');
          return;
        }
        currentStep = 2;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2) {
        if (!formData.paymentMethod || !formData.currency) {
            alert('Please select a Payment Method and Currency.');
            return;
        }
        currentStep = 3;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 3) {
        currentStep = 4;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 4) {
      isSubmitting = true;
      // Simulate API call or save data logic here
      await new Promise(r => setTimeout(r, 1500));
      isSubmitting = false;
      
      // Redirect to Vendor Dashboard
      goto('/vendor');
    }
  }

  function goBack() {
    if (currentStep > 1) currentStep--;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openProductModal() {
    newProduct = { category: null, customName: '', price: '', description: '' };
    isProductModalOpen = true;
  }

  function saveProduct() {
    if (!newProduct.category || !newProduct.price) {
        alert("Please select a Category and enter a Price.");
        return;
    }
    const finalName = (newProduct.category.name === 'Other' && newProduct.customName) 
        ? newProduct.customName 
        : newProduct.category.name;

    if (!finalName) {
        alert("Please enter a name for the product.");
        return;
    }

    formData.products = [...formData.products, { 
        name: finalName, 
        price: newProduct.price, 
        description: newProduct.description 
    }];
    isProductModalOpen = false;
  }

  function removeProduct(index: number) {
    formData.products = formData.products.filter((_, i) => i !== index);
  }

  function editStep(stepNumber: number) {
    currentStep = stepNumber;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

</script>

<div class="min-h-screen relative overflow-hidden bg-gray-50 font-sans">

  <div class="pointer-events-none absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-purple-200/30 blur-[120px]"></div>
  <div class="pointer-events-none absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-blue-200/30 blur-[120px]"></div>
  <div class="pointer-events-none absolute bottom-[10%] left-[20%] h-[400px] w-[400px] rounded-full bg-pink-200/20 blur-[100px]"></div>

  <div class="relative z-10 p-6">

    <header class="mx-auto mb-8 flex max-w-6xl items-center justify-between px-2 sm:px-0">
        <div class="flex items-center gap-2">
            <a href="/" class="flex items-center">
                <img 
                    src="/rondwell-logo.png" 
                    alt="Rondwell" 
                    class="h-8 w-auto object-contain" 
                />
            </a>
        </div>

        <div class="hidden items-center gap-6 text-xs font-medium text-gray-500 sm:flex">
            <span>7:29 PM GMT+1</span>
            <button class="flex items-center gap-1 hover:text-gray-800 transition">
                Create Secrets 
                <Icon icon="heroicons:heart" class="h-3 w-3" />
            </button>
            <button class="rounded-full bg-[#EBEBEB] px-5 py-2 text-gray-900 hover:bg-gray-200 transition">
                Sign In
            </button>
        </div>
    </header>

    <div class="mx-auto mb-10 max-w-5xl">
        <div class="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400 sm:justify-between sm:gap-8">
            <div class="flex items-center gap-6 overflow-x-auto pb-2 sm:pb-0">
                {#each steps as step}
                    <div class="flex items-center gap-2 whitespace-nowrap {currentStep === step.number ? 'text-purple-600 font-semibold' : ''}">
                        <span class="flex h-6 w-6 items-center justify-center rounded-full text-xs {currentStep >= step.number ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}">{step.number}</span>
                        <span class="{currentStep >= step.number ? 'text-gray-900' : ''}">{step.title}</span>
                    </div>
                    {#if step.number !== 4} <Icon icon="heroicons:chevron-right" class="h-4 w-4 text-gray-300" /> {/if}
                {/each}
            </div>
        </div>
    </div>

    <div class="mx-auto max-w-2xl rounded-3xl bg-white/80 backdrop-blur-sm p-8 shadow-sm border border-white/50 sm:p-12 relative">
        {#if currentStep > 1}
            <button onclick={goBack} class="absolute top-8 left-8 flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-black transition">
                <Icon icon="heroicons:chevron-left" class="h-3 w-3" /> Back
            </button>
        {/if}

        {#if currentStep === 1}
            <div class="text-center mb-10">
                <div class="mb-4 flex justify-center">
                    <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                        <Icon icon="heroicons:building-storefront" class="h-6 w-6 text-gray-600" />
                    </div>
                </div>
                <h1 class="text-2xl font-bold text-gray-900">Business Details</h1>
                <p class="mt-2 text-sm text-gray-500">Provide essential Business Details to proceed.</p>
            </div>

            <div class="mb-8 grid gap-6 sm:grid-cols-3">
                <div class="col-span-1 flex flex-col items-center justify-center rounded-2xl border border-gray-200 p-6 text-center bg-white">
                    <div class="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                        <Icon icon="heroicons:user" class="h-8 w-8" />
                    </div>
                    <h3 class="text-xs font-semibold text-gray-900">Business Logo</h3>
                    <p class="mb-3 text-[10px] text-gray-400">Max file size: 1MB</p>
                    <button class="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-[10px] font-medium text-gray-700 hover:bg-gray-50">Add Image</button>
                </div>
                <div class="col-span-2 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-6 text-center">
                    <Icon icon="heroicons:cloud-arrow-up" class="mb-2 h-6 w-6 text-gray-400" />
                    <h3 class="mb-1 text-xs font-semibold text-gray-900">Cover/Banner Image</h3>
                    <p class="mb-4 text-center text-[10px] text-gray-400">Choose a file or drag & drop it here.<br />JPEG, PNG, PDF up to 50 MB.</p>
                    <button class="rounded-full border border-gray-300 bg-white px-6 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Browse File</button>
                </div>
            </div>

            <div class="space-y-5">
                <div class="grid gap-5 sm:grid-cols-2">
                    <div>
                        <label class="mb-1.5 block text-xs font-semibold text-gray-700">Company Name *</label>
                        <input type="text" bind:value={formData.companyName} placeholder="Synergy HR" class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition" />
                    </div>
                    <div>
                        <label class="mb-1.5 block text-xs font-semibold text-gray-700">Business Type/Category *</label>
                        <div class="relative">
                            <select bind:value={formData.category} class="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition text-gray-600">
                                <option value="" disabled selected>Select Category</option>
                                {#each businessCategories as category}
                                  <option value={category}>{category}</option>
                                {/each}
                                <option value="Other">Other</option>
                            </select>
                            <Icon icon="heroicons:chevron-down" class="pointer-events-none absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        </div>
                        {#if formData.category === 'Other'}
                          <input type="text" bind:value={formData.otherCategory} placeholder="Enter your category" class="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition" />
                        {/if}
                    </div>
                </div>

                <div>
                    <label class="mb-1.5 block text-xs font-semibold text-gray-700">Company Description * (Optional)</label>
                    <div class="relative">
                        <textarea bind:value={formData.description} rows="3" placeholder="Describe your company..." class="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition"></textarea>
                        <span class="absolute bottom-2 right-3 text-[10px] text-gray-400">{formData.description.length}/200</span>
                    </div>
                    <p class="mt-1 text-[10px] text-gray-400 flex items-center gap-1">
                        <Icon icon="heroicons:information-circle" class="h-3 w-3" /> You can describe your company briefly.
                    </p>
                </div>

                <div>
                    <label class="mb-1.5 block text-xs font-semibold text-gray-700">Business Location/Service Area *</label>
                    <div class="relative">
                        <Icon icon="heroicons:map-pin" class="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input type="text" bind:value={formData.location} placeholder="Add Business Location" class="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition" />
                    </div>
                    <p class="mt-1 text-[10px] text-gray-400">Offline location or virtual link</p>
                </div>

                <div class="grid gap-5 sm:grid-cols-2">

                    <div class="relative z-20">
                        <label class="mb-1.5 block text-xs font-semibold text-gray-700">Phone Number *</label>
                        <div class="flex rounded-lg border border-gray-200 bg-white relative focus-within:border-black focus-within:ring-1 focus-within:ring-black transition">

                            <button
                                onclick={() => isCountryDropdownOpen = !isCountryDropdownOpen}
                                class="flex items-center gap-2 bg-gray-50 px-3 border-r border-gray-200 rounded-l-lg hover:bg-gray-100 transition min-w-[100px]"
                            >
                                <img 
                                    src={`https://flagcdn.com/w40/${formData.phoneCode.iso}.png`} 
                                    alt={formData.phoneCode.name}
                                    class="h-4 w-6 object-cover rounded-sm shadow-sm"
                                />
                                <span class="text-sm font-medium text-gray-700">{formData.phoneCode.code}</span>
                                <Icon icon="heroicons:chevron-down" class="h-3 w-3 text-gray-400 ml-auto" />
                            </button>

                            {#if isCountryDropdownOpen}
                                <div class="absolute top-[110%] left-0 w-72 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden">
                                    <div class="max-h-56 overflow-y-auto">
                                        {#each countries as country}
                                            <button
                                                onclick={() => selectCountry(country)}
                                                class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition text-sm border-b border-gray-50 last:border-0"
                                            >
                                                <img 
                                                    src={`https://flagcdn.com/w40/${country.iso}.png`} 
                                                    alt={country.name}
                                                    class="h-4 w-6 object-cover rounded-sm"
                                                />
                                                <span class="font-medium text-gray-900 flex-1">{country.name}</span>
                                                <span class="text-gray-500">{country.code}</span>
                                                {#if formData.phoneCode.code === country.code}
                                                    <Icon icon="heroicons:check" class="ml-2 h-4 w-4 text-purple-600" />
                                                {/if}
                                            </button>
                                        {/each}
                                    </div>
                                </div>
                            {/if}

                            <input
                                type="tel"
                                bind:value={formData.phone}
                                placeholder="800 000 0000"
                                class="w-full px-3 py-2.5 text-sm outline-none bg-transparent rounded-r-lg"
                            />
                        </div>
                    </div>

                    <div>
                        <label class="mb-1.5 block text-xs font-semibold text-gray-700">Email Address *</label>
                        <div class="relative">
                            <Icon icon="heroicons:envelope" class="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input type="email" bind:value={formData.email} placeholder="hello@alignui.com" class="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition" />
                        </div>
                    </div>
                </div>

                <div>
                    <label class="mb-1.5 block text-xs font-semibold text-gray-700">Website URL *</label>
                    <div class="flex rounded-lg border border-gray-200 bg-white overflow-hidden focus-within:border-black focus-within:ring-1 focus-within:ring-black transition">
                        <span class="flex items-center bg-gray-50 px-3 text-sm text-gray-500 border-r border-gray-200">alignui.com</span>
                        <input type="text" bind:value={formData.website} placeholder="synergyhr" class="w-full px-3 py-2.5 text-sm outline-none" />
                    </div>
                </div>
            </div>

        {:else if currentStep === 2}
            <div class="text-center mb-10 pt-4">
                <div class="mb-4 flex justify-center">
                    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <Icon icon="heroicons:building-library" class="h-6 w-6 text-gray-600" />
                    </div>
                </div>
                <h1 class="text-2xl font-bold text-gray-900">Payment & Pricing Setup</h1>
                <p class="mt-2 text-sm text-gray-500">Select a payment method and set up product pricing.</p>
            </div>

            <div class="space-y-6">
                <div class="grid gap-5 sm:grid-cols-2">
                    <div class="relative z-20">
                        <label class="mb-1.5 block text-xs font-semibold text-gray-700 flex items-center gap-1">
                            Select Payment Method <Icon icon="heroicons:information-circle" class="h-3 w-3 text-gray-400" />
                        </label>
                        <div class="relative">
                            <button
                                onclick={() => isPaymentDropdownOpen = !isPaymentDropdownOpen}
                                class="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                            >
                                {#if formData.paymentMethod}
                                    <div class="flex items-center gap-2">
                                        {#if formData.paymentMethod.type === 'svg'}
                                            <div class="h-4 w-auto">
                                                {@html formData.paymentMethod.val}
                                            </div>
                                        {:else if formData.paymentMethod.type === 'image'}
                                            <img src={formData.paymentMethod.val} alt={formData.paymentMethod.name} class="h-4 object-contain" />
                                        {:else}
                                            <Icon icon={formData.paymentMethod.val} class="h-4 w-4 {formData.paymentMethod.color}" />
                                        {/if}
                                        <span>{formData.paymentMethod.name}</span>
                                    </div>
                                {:else}
                                    <span class="text-gray-500">Select Method</span>
                                {/if}
                                <Icon icon="heroicons:chevron-down" class="h-4 w-4 text-gray-400" />
                            </button>

                            {#if isPaymentDropdownOpen}
                                <div class="absolute top-[110%] left-0 w-full bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-30">
                                    {#each paymentMethods as method}
                                        <button
                                            onclick={() => selectPaymentMethod(method)}
                                            class="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-left transition text-sm"
                                        >
                                            {#if method.type === 'svg'}
                                                <div class="h-4 w-auto">
                                                    {@html method.val}
                                                </div>
                                            {:else if method.type === 'image'}
                                                <img src={method.val} alt={method.name} class="h-4 object-contain" />
                                            {:else}
                                                <Icon icon={method.val} class="h-4 w-4 {method.color}" />
                                            {/if}
                                            <span class="font-medium text-gray-900">{method.name}</span>
                                        </button>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </div>

                    <div>
                        <label class="mb-1.5 block text-xs font-semibold text-gray-700 flex items-center gap-1">
                            Select Preferred Currency <Icon icon="heroicons:information-circle" class="h-3 w-3 text-gray-400" />
                        </label>
                        <div class="relative">
                            <select bind:value={formData.currency} class="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black">
                                <option value="" disabled selected>Select Currency</option>
                                <option>US Dollar ($)</option>
                                <option>Naira (₦)</option>
                            </select>
                            <Icon icon="heroicons:chevron-down" class="pointer-events-none absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        </div>
                    </div>
                </div>

                <div class="rounded-xl border border-gray-200 bg-gray-50/50 p-4 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-200">
                            <Icon icon="heroicons:banknotes" class="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                            <h4 class="text-sm font-semibold text-gray-900">Tax Information</h4>
                            <p class="text-[10px] text-gray-500">
                                {#if formData.taxRate}
                                    Current Tax Rate: <span class="font-bold text-black">{formData.taxRate}%</span>
                                {:else}
                                    Set default tax rate for all products
                                {/if}
                            </p>
                        </div>
                    </div>
                    <button onclick={() => isTaxModalOpen = true} class="rounded-lg bg-black px-4 py-2 text-xs font-medium text-white hover:bg-gray-800">
                        {formData.taxRate ? 'Edit Tax Rate' : 'Enter Tax Rate'}
                    </button>
                </div>
            </div>

        {:else if currentStep === 3}
             
            {#if formData.products.length === 0}
                <div class="flex flex-col items-center justify-center py-6 text-center">
                    <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                        <Icon icon="heroicons:building-storefront" class="h-7 w-7" />
                    </div>
                     
                    <h1 class="text-2xl font-bold text-gray-900 mb-2">Showcase Your Offerings!</h1>
                    <p class="text-sm text-gray-500 mb-8">Let's add your first product or service to attract Organizers.</p>

                    <div class="w-full max-w-lg mb-8 rounded-xl border border-[#FFDBB8] bg-[#FFF4E5] p-4 flex gap-3 text-left">
                        <Icon icon="heroicons:information-circle" class="h-5 w-5 shrink-0 text-[#E65100] mt-0.5" />
                        <div class="text-xs text-[#944216] leading-relaxed">
                            <span class="font-bold block mb-1">Adding a product grows your business.</span> 
                            It increases your visibility, helps customers find what you offer, and builds trust by showing you're active and ready to serve.
                        </div>
                    </div>

                    <div class="flex w-full max-w-lg gap-4 mb-6">
                        <button
                            onclick={() => currentStep = 4}
                            class="flex-1 rounded-lg border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                        >
                            Skip For Now
                        </button>
                        <button
                            onclick={openProductModal}
                            class="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                        >
                            Add My First Product/Service
                        </button>
                    </div>

                    <button
                        onclick={handleContinue}
                        class="w-full max-w-lg rounded-lg bg-black py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition"
                    >
                        Continue
                    </button>
                </div>
             
            {:else}
                <div class="text-center mb-10 pt-4">
                    <div class="mb-4 flex justify-center">
                        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                            <Icon icon="heroicons:building-storefront" class="h-6 w-6 text-gray-600" />
                        </div>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-900">Showcase Your Offerings!</h1>
                    <p class="mt-2 text-sm text-gray-500">Let's add your first product or service to attract Organizers.</p>
                </div>

                <div class="space-y-4">
                    {#each formData.products as product, index}
                        <div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                            <div class="flex items-center gap-4">
                                <div class="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                    <Icon icon="heroicons:photo" class="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 class="text-sm font-bold text-gray-900">{product.name}</h4>
                                    <p class="text-xs text-gray-500">{formData.currency.split(' ')[1]?.replace(/[()]/g, '') || '$'} {product.price}</p>
                                </div>
                            </div>
                            <button onclick={() => removeProduct(index)} class="text-gray-400 hover:text-red-500">
                                <Icon icon="heroicons:trash" class="h-5 w-5" />
                            </button>
                        </div>
                    {/each}

                    <button
                        onclick={openProductModal}
                        class="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 py-3 text-xs font-semibold text-gray-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition"
                    >
                        <Icon icon="heroicons:plus" class="h-4 w-4" /> Add Another Product
                    </button>
                     
                    <div class="mt-8">
                        <button
                            onclick={handleContinue}
                            disabled={isSubmitting}
                            class="w-full rounded-lg bg-black py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition disabled:opacity-70"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            {/if}

        {:else if currentStep === 4}
          <div class="text-center mb-10 pt-4">
              <div class="mb-4 flex justify-center">
                  <div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                      <Icon icon="heroicons:check-circle" class="h-6 w-6 text-green-500" />
                  </div>
              </div>
              <h1 class="text-2xl font-bold text-gray-900">Onboarding Summary</h1>
              <p class="mt-2 text-sm text-gray-500">Review and complete your account setup.</p>
          </div>

          <div class="space-y-6">
            <div class="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
              <div class="flex items-center justify-between p-4">
                <div class="flex items-center gap-4">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-500">
                    <Icon icon="heroicons:building-office" class="h-5 w-5" />
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Company Name</p>
                    <p class="text-sm font-medium text-gray-900">{formData.companyName || 'Not provided'}</p>
                  </div>
                </div>
                <button onclick={() => editStep(1)} class="text-gray-400 hover:text-gray-600"><Icon icon="heroicons:pencil-square" class="h-5 w-5" /></button>
              </div>

              <div class="flex items-center justify-between p-4">
                <div class="flex items-center gap-4">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-500">
                    <Icon icon="heroicons:briefcase" class="h-5 w-5" />
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Business Type/Category</p>
                    <p class="text-sm font-medium text-gray-900">{displayCategory || 'Not selected'}</p>
                  </div>
                </div>
                <button onclick={() => editStep(1)} class="text-gray-400 hover:text-gray-600"><Icon icon="heroicons:pencil-square" class="h-5 w-5" /></button>
              </div>

              <div class="flex items-center justify-between p-4">
                <div class="flex items-center gap-4">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-500">
                    <Icon icon="heroicons:phone" class="h-5 w-5" />
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Phone Number</p>
                    <div class="flex items-center gap-2 text-sm font-medium text-gray-900">
                       <img src={`https://flagcdn.com/w40/${formData.phoneCode.iso}.png`} alt={formData.phoneCode.name} class="h-4 w-6 object-cover rounded-sm" />
                       <span>{formData.phoneCode.code} {formData.phone || ''}</span>
                    </div>
                  </div>
                </div>
                <button onclick={() => editStep(1)} class="text-gray-400 hover:text-gray-600"><Icon icon="heroicons:pencil-square" class="h-5 w-5" /></button>
              </div>

              <div class="flex items-center justify-between p-4">
                <div class="flex items-center gap-4">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-500">
                    <Icon icon="heroicons:envelope" class="h-5 w-5" />
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Email Address</p>
                    <p class="text-sm font-medium text-gray-900">{formData.email || 'Not provided'}</p>
                  </div>
                </div>
                <button onclick={() => editStep(1)} class="text-gray-400 hover:text-gray-600"><Icon icon="heroicons:pencil-square" class="h-5 w-5" /></button>
              </div>

              <div class="flex items-center justify-between p-4">
                <div class="flex items-center gap-4">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-500">
                    <Icon icon="heroicons:globe-alt" class="h-5 w-5" />
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Website URL</p>
                    <p class="text-sm font-medium text-gray-900">{formData.website || 'Not provided'}</p>
                  </div>
                </div>
                <button onclick={() => editStep(1)} class="text-gray-400 hover:text-gray-600"><Icon icon="heroicons:pencil-square" class="h-5 w-5" /></button>
              </div>

              <div class="flex items-center justify-between p-4">
                <div class="flex items-center gap-4">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-500">
                    <Icon icon="heroicons:credit-card" class="h-5 w-5" />
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Select Payment Method</p>
                    <div class="flex items-center gap-2">
                      {#if formData.paymentMethod}
                        {#if formData.paymentMethod.type === 'svg'}
                            <div class="h-4 w-auto">
                                {@html formData.paymentMethod.val}
                            </div>
                        {:else if formData.paymentMethod.type === 'image'}
                            <img src={formData.paymentMethod.val} alt={formData.paymentMethod.name} class="h-4 object-contain" />
                        {:else}
                            <Icon icon={formData.paymentMethod.val} class="h-4 w-4 {formData.paymentMethod.color}" />
                        {/if}
                        <p class="text-sm font-medium text-gray-900">{formData.paymentMethod.name}</p>
                      {:else}
                        <p class="text-sm font-medium text-gray-900">Not selected</p>
                      {/if}
                    </div>
                  </div>
                </div>
                <button onclick={() => editStep(2)} class="text-gray-400 hover:text-gray-600"><Icon icon="heroicons:pencil-square" class="h-5 w-5" /></button>
              </div>

              <div class="flex items-center justify-between p-4">
                <div class="flex items-center gap-4">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-500">
                    <Icon icon="heroicons:currency-dollar" class="h-5 w-5" />
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Select preferred currency</p>
                    <p class="text-sm font-medium text-gray-900">{formData.currency || 'Not selected'}</p>
                  </div>
                </div>
                <button onclick={() => editStep(2)} class="text-gray-400 hover:text-gray-600"><Icon icon="heroicons:pencil-square" class="h-5 w-5" /></button>
              </div>

              <div class="flex items-center justify-between p-4">
                <div class="flex items-center gap-4">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-500">
                    <Icon icon="heroicons:shopping-bag" class="h-5 w-5" />
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Products/Services listed</p>
                    <p class="text-sm font-medium text-gray-900">{formData.products.length} Items</p>
                  </div>
                </div>
                <button onclick={() => editStep(3)} class="text-gray-400 hover:text-gray-600"><Icon icon="heroicons:pencil-square" class="h-5 w-5" /></button>
              </div>

            </div>
            
            <div class="mt-8 pt-4">
                <button
                    onclick={handleContinue}
                    disabled={isSubmitting}
                    class="w-full rounded-lg bg-black py-4 text-sm font-bold text-white shadow-lg hover:bg-gray-800 transition disabled:opacity-70 flex items-center justify-center gap-2"
                >
                    {#if isSubmitting}
                        <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Account...
                    {:else}
                        Complete Registration
                    {/if}
                </button>
            </div>

          </div>
        {/if}

        {#if currentStep < 3}
            <div class="mt-8">
                <button
                    onclick={handleContinue}
                    disabled={isSubmitting}
                    class="w-full rounded-lg bg-black py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition disabled:opacity-70 flex items-center justify-center gap-2"
                >
                    {#if isSubmitting}
                        <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Processing...
                    {:else}
                        {currentStep === 4 ? 'Complete Registration' : 'Continue'}
                    {/if}
                </button>
            </div>
        {/if}
    </div>

    {#if isTaxModalOpen}
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                <h3 class="mb-2 text-lg font-bold text-gray-900">Enter Tax Rate</h3>
                <p class="mb-4 text-sm text-gray-500">Enter the percentage tax to apply to your bookings.</p>
                <div class="relative mb-6">
                    <input type="number" bind:value={formData.taxRate} placeholder="7.5" class="w-full rounded-lg border border-gray-300 px-4 py-2 text-lg font-medium text-gray-900 focus:border-black focus:ring-1 focus:ring-black outline-none" />
                    <span class="absolute right-4 top-2.5 text-gray-400 font-bold">%</span>
                </div>
                <div class="flex gap-3">
                    <button onclick={() => isTaxModalOpen = false} class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button onclick={() => isTaxModalOpen = false} class="flex-1 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Save Rate</button>
                </div>
            </div>
        </div>
    {/if}

    {#if isProductModalOpen}
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-900">Add Product / Service</h3>
                    <button onclick={() => isProductModalOpen = false} class="text-gray-400 hover:text-gray-600">
                        <Icon icon="heroicons:x-mark" class="h-6 w-6" />
                    </button>
                </div>

                <div class="space-y-4">
                    <div class="relative z-20">
                        <label class="mb-1 block text-xs font-semibold text-gray-700">Category</label>
                        <div class="relative">
                            <button
                                onclick={() => isServiceDropdownOpen = !isServiceDropdownOpen}
                                class="w-full flex items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                            >
                                {#if newProduct.category}
                                    <div class="flex items-center gap-2">
                                        <Icon icon={newProduct.category.icon} class="h-4 w-4 text-gray-500" />
                                        <span>{newProduct.category.name}</span>
                                    </div>
                                {:else}
                                    <span class="text-gray-400">Select Service Category</span>
                                {/if}
                                <Icon icon="heroicons:chevron-down" class="h-4 w-4 text-gray-400" />
                            </button>

                            {#if isServiceDropdownOpen}
                                <div class="absolute top-[110%] left-0 w-full bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-30 max-h-48 overflow-y-auto">
                                    {#each serviceTypes as type}
                                        <button
                                            onclick={() => selectServiceType(type)}
                                            class="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-left transition text-sm"
                                        >
                                            <Icon icon={type.icon} class="h-4 w-4 text-gray-500" />
                                            <span class="font-medium text-gray-900">{type.name}</span>
                                        </button>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </div>

                    {#if newProduct.category?.name === 'Other'}
                        <div>
                            <label class="mb-1 block text-xs font-semibold text-gray-700">Custom Name</label>
                            <input type="text" bind:value={newProduct.customName} placeholder="e.g. Luxury Car Rental" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none" />
                        </div>
                    {/if}

                    <div>
                        <label class="mb-1 block text-xs font-semibold text-gray-700">Price</label>
                        <div class="relative">
                            <span class="absolute left-3 top-2.5 text-gray-500 text-sm font-medium pointer-events-none">
                                {currencySymbol}
                            </span>
                            <input
                                type="text"
                                inputmode="decimal"
                                bind:value={newProduct.price}
                                oninput={(e) => {
                                    const target = e.currentTarget as HTMLInputElement;
                                    // Replace any char that is NOT a digit or a dot
                                    let val = target.value.replace(/[^0-9.]/g, '');
                                    // Prevent multiple dots
                                    if ((val.match(/\./g) || []).length > 1) {
                                        val = val.substring(0, val.lastIndexOf('.'));
                                    }
                                    target.value = val;
                                    newProduct.price = val;
                                }}
                                placeholder="0.00"
                                class="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2.5 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                            />
                        </div>
                    </div>
                    <div>
                        <label class="mb-1 block text-xs font-semibold text-gray-700">Description</label>
                        <textarea bind:value={newProduct.description} rows="3" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none resize-none"></textarea>
                    </div>
                </div>

                <div class="mt-6">
                    <button onclick={saveProduct} class="w-full rounded-lg bg-black px-4 py-3 text-sm font-bold text-white hover:bg-gray-800">
                        Save Product
                    </button>
                </div>
            </div>
        </div>
    {/if}

  </div>
</div>