<script lang="ts">
  let paymentMethod = 'Paystack';
  let currency = 'USD';
  let companyDescription = '';
</script>

<div class="min-h-screen px-6 py-8">
  <div class="max-w-3xl">

    <!-- Header -->
    <div class="mb-10">
      <h1 class="text-2xl font-semibold text-gray-900">
        Manage Your Payment Preferences
      </h1>
      <p class="text-sm text-gray-500 mt-1">
        Set up how you receive payments for your speaking engagements through Rondwell.
      </p>
    </div>

    <!-- Payment Methods -->
    <div class=" rounded-xl shadow-sm border border-gray-200 p-6 mb-10">
      <h2 class="text-lg font-medium text-gray-900 mb-1">
        Payment Methods
      </h2>
      <p class="text-sm text-gray-500 mb-6">
        Your saved payment methods are encrypted and stored securely by PayPal & Flutterwave.
      </p>

      <!-- Selects -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Select Payment Method
          </label>
          <div class="relative">
            <select
              bind:value={paymentMethod}
              class="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option>Paystack</option>
              <option>Flutterwave</option>
              <option>PayPal</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Select Preferred Currency
          </label>
          <div class="relative">
            <select
              bind:value={currency}
              class="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="USD">US Dollar ($)</option>
              <option value="NGN">Nigerian Naira (₦)</option>
              <option value="GBP">British Pound (£)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Buttons -->
      <div class="flex items-center gap-4">
        <button class="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition">
          Connect Bank Account
        </button>
        <button class="px-5 py-2.5 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-100 transition">
          Connect
        </button>
      </div>
    </div>

    <!-- Tax Information -->
    <div class=" rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 class="text-lg font-medium text-gray-900 mb-1">
        Tax Information
      </h2>
      <p class="text-sm text-gray-500 mb-6">
        Enter your tax identification number if applicable
      </p>

      <!-- Company Description -->
      <div class="mb-2">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Company Description <span class="text-gray-400">(Optional)</span>
        </label>

        <textarea
          bind:value={companyDescription}
          rows="4"
          maxlength="200"
          placeholder="Describe your company..."
          class="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        <div class="flex justify-between mt-1">
          <p class="text-xs text-gray-400">
            Rondwell does not provide tax advice. Please consult with a tax professional.
          </p>
          <p class="text-xs text-gray-400">
            {companyDescription.length}/200
          </p>
        </div>
      </div>

      <!-- Save -->
      <button class="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition">
        Save Changes
      </button>
    </div>

  </div>
</div>
