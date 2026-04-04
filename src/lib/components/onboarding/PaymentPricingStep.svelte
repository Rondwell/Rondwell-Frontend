<script lang="ts">
	interface Props {
		paymentMethods: string[];
		currencies: string[];
		taxRate: number;
		onTogglePayment: (method: string) => void;
		onToggleCurrency: (curr: string) => void;
		onOpenTaxModal: () => void;
	}

	let {
		paymentMethods,
		currencies,
		taxRate,
		onTogglePayment,
		onToggleCurrency,
		onOpenTaxModal
	}: Props = $props();

	let isDropdownOpen = $state(false);
	let isCurrencyDropdownOpen = $state(false);

	function getPaymentMethodDisplay() {
		return paymentMethods
			.map((m) => {
				if (m === 'paystack') return 'Paystack';
				if (m === 'flutterwave') return 'Flutterwave';
				if (m === 'stripe') return 'Stripe';
				return m;
			})
			.join(', ');
	}

	function getCurrencyDisplay() {
		return currencies
			.map((c) => {
				if (c === 'NGN') return 'NGN';
				if (c === 'USD') return 'USD';
				if (c === 'EUR') return 'EUR';
				if (c === 'GBP') return 'GBP';
				return c;
			})
			.join(', ');
	}
</script>

<div class="space-y-6 rounded-xl">
	<div class="mb-6 text-center">
		<div class="mx-auto h-[96px] w-[96px]">
			<img src="/payment-Icon.svg" alt="payment-icon" class="h-full w-full" />
		</div>
		<div class="text-[24px] font-[500] text-[#171717]">Payment & Pricing Setup</div>
		<p class="mt-1 text-[16px] text-[#5C5C5C]">
			Select a payment method and setup products pricing.
		</p>
	</div>
	<div class="my-8 h-[1px] w-full bg-[#EBEBEB]"></div>

	<div
		class="flex flex-col gap-5 rounded-2xl border bg-white px-4 py-6 md:grid md:grid-cols-2"
		style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
	>
		<!-- Payment Method -->
		<div class="relative space-y-4 rounded-2xl">
			<div class="flex items-center gap-0">
				<label class="text-sm font-medium text-[#1A1A1A]" for="payment-method-btn"
					>Select Payment Method</label
				>
				<img src="/info-itallic.svg" alt="information" class="h-5 w-5" />
			</div>

			<div class="relative">
				<button
					id="payment-method-btn"
					type="button"
					onclick={() => (isDropdownOpen = !isDropdownOpen)}
					class="focus:ring-none w-full appearance-none rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-3 pr-10 text-left text-sm focus:ring-0 focus:outline-none"
				>
					{getPaymentMethodDisplay()}
				</button>
				<img
					src="/arrow-dropdown.svg"
					alt="arrow"
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
					{#each [
						{ key: 'paystack', label: 'Paystack', icon: '/paystack.svg', activeColor: 'bg-[#00C3F7]', bgColor: 'bg-blue-50' },
						{ key: 'flutterwave', label: 'Flutterwave', icon: '/flutter.svg', activeColor: 'bg-[#F5A623]', bgColor: 'bg-orange-50' },
						{ key: 'stripe', label: 'Stripe', icon: '/Stripe.svg', activeColor: 'bg-[#635BFF]', bgColor: 'bg-purple-50' }
					] as item, i}
						<button
							type="button"
							class="flex w-full items-center justify-between px-2 py-3 transition-colors hover:bg-gray-50 {i < 2 ? 'border-b' : ''} {paymentMethods.includes(item.key) ? item.bgColor : ''}"
							onclick={() => onTogglePayment(item.key)}
						>
							<div class="flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-full border border-[#EBEBEB]"
									style="box-shadow: 0px 1px 2px 0px #0A0D1408;"
								>
									<img src={item.icon} alt={item.label} class="h-5 w-5" />
								</div>
								<div class="text-left">
									<div class="text-sm font-medium text-[#171717]">{item.label}</div>
								</div>
								<div
									class="rounded-full bg-[#F5F5F5] p-1 text-[11px] font-medium text-[#7B7B7B] uppercase"
								>
									SOON
								</div>
							</div>
							<div
								class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {paymentMethods.includes(item.key) ? item.activeColor : 'bg-gray-300'}"
							>
								<span
									class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {paymentMethods.includes(item.key) ? 'translate-x-6' : 'translate-x-1'}"
								></span>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Currency -->
		<div class="relative space-y-4">
			<div class="flex items-center gap-0">
				<label class="text-sm font-medium text-[#1A1A1A]" for="currency-btn"
					>Select Preferred Currency</label
				>
				<img src="/info-itallic.svg" alt="information" class="h-5 w-5" />
			</div>

			<div class="relative">
				<button
					id="currency-btn"
					type="button"
					onclick={() => (isCurrencyDropdownOpen = !isCurrencyDropdownOpen)}
					class="focus:ring-none w-full appearance-none rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-3 pr-10 text-left text-sm focus:ring-0 focus:outline-none"
				>
					{getCurrencyDisplay()}
				</button>
				<img
					src="/arrow-dropdown.svg"
					alt="arrow"
					class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-transform {isCurrencyDropdownOpen ? 'rotate-180' : ''}"
				/>
			</div>

			{#if isCurrencyDropdownOpen}
				<div
					class="absolute z-50 mt-1 w-full space-y-2 rounded-[12px] border bg-white md:w-[310px]"
					style="box-shadow: 0px 4px 6px -1px rgba(0, 0, 0, 0.1);"
				>
					{#each [
						{ key: 'NGN', label: 'Naira (₦)', activeColor: 'bg-[#22C55E]', bgColor: 'bg-green-50' },
						{ key: 'USD', label: 'US Dollar ($)', activeColor: 'bg-[#3B82F6]', bgColor: 'bg-blue-50' }
					] as item, i}
						<button
							type="button"
							class="flex w-full items-center justify-between px-2 py-3 transition-colors hover:bg-gray-50 {i === 0 ? 'border-b' : ''} {currencies.includes(item.key) ? item.bgColor : ''}"
							onclick={() => onToggleCurrency(item.key)}
						>
							<div class="flex items-center gap-3">
								<div class="text-left">
									<div class="text-sm font-medium text-[#171717]">{item.label}</div>
								</div>
								<div
									class="rounded-full bg-[#F5F5F5] p-1 text-[11px] font-medium text-[#7B7B7B] uppercase"
								>
									SOON
								</div>
							</div>
							<div
								class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {currencies.includes(item.key) ? item.activeColor : 'bg-gray-300'}"
							>
								<span
									class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {currencies.includes(item.key) ? 'translate-x-6' : 'translate-x-1'}"
								></span>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Tax Information -->
		<div class="col-span-2 space-y-4 rounded-2xl">
			<div class="flex items-center justify-between gap-1">
				<div class="flex items-center gap-1">
					<img
						src="/bank-line.svg"
						alt="bank"
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
					onclick={onOpenTaxModal}
					class="min-h-[30px] rounded-lg bg-black p-2 text-xs font-medium text-white transition-colors hover:bg-gray-800"
				>
					{taxRate > 0 ? 'Edit Tax Rate' : 'Enter Tax Rate'}
				</button>
			</div>
		</div>
	</div>
</div>
