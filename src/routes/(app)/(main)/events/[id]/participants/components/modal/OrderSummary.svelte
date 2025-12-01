<script lang="ts">
	import Icon from '@iconify/svelte';

	export let open = false;

	// Example cart items (replace with real API data)
	let items = [
		{
			id: 1,
			name: 'Conference Photography Package',
			price: 478.8,
			original: 478.8,
			quantity: 20,
			image: '/placeholder-img.svg'
		},
		{
			id: 2,
			name: 'Onsite Registration Kiosk',
			price: 478.8,
			original: 478.8,
			quantity: 20,
			image: '/placeholder-img.svg'
		},
		{
			id: 3,
			name: 'Conference Photography Package',
			price: 478.8,
			original: 478.8,
			quantity: 20,
			image: '/placeholder-img.svg'
		}
	];

	let dateTime = '';
	let logisticsNotes = '';
	let personalMessage = '';
	let paymentMethod = 'Paystack';

	const removeItem = (id: number) => {
		items = items.filter((i) => i.id !== id);
	};

	const increase = (id: number) => {
		const item = items.find((i) => i.id === id);
		if (item) item.quantity++;
	};

	const decrease = (id: number) => {
		const item = items.find((i) => i.id === id);
		if (item && item.quantity > 1) item.quantity--;
	};

	const totalAmount = () => items.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2);
</script>

{#if open}
	<div
		on:click={() => (open = false)}
		class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-3 py-10"
	>
		<!-- Modal container -->
		<div
			class="h-155 w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-xl"
			on:click|stopPropagation
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<div class="flex flex-col gap-3 md:flex-row md:items-center">
					<div class="flex items-center gap-3">
						<button aria-label="Close" on:click={() => (open = false)}>
							<svg
								width="16"
								height="15"
								viewBox="0 0 16 15"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<rect
									y="12.8203"
									width="9.9258"
									height="1.96151"
									rx="0.980754"
									transform="rotate(-45 0 12.8203)"
									fill="#68696B"
								/>
								<rect
									x="1.38867"
									width="10.0318"
									height="1.96151"
									rx="0.980754"
									transform="rotate(45 1.38867 0)"
									fill="#68696B"
								/>
								<rect
									x="7.10547"
									y="12.8203"
									width="9.9258"
									height="1.96151"
									rx="0.980754"
									transform="rotate(-45 7.10547 12.8203)"
									fill="#68696B"
								/>
								<rect
									x="8.49414"
									width="10.0318"
									height="1.96151"
									rx="0.980754"
									transform="rotate(45 8.49414 0)"
									fill="#68696B"
								/>
							</svg>
						</button>
						<p>Order Summary</p>
					</div>
					<div class="flex items-center gap-3">
						<button
							class="flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
						>
							Send Quote Request
						</button>
						<button
							class="flex items-center gap-1 rounded-lg bg-[#F0F1F1] px-3 py-1.5 text-sm font-medium text-[#727375]"
						>
							Cancel
						</button>
					</div>
				</div>

				<div class="flex gap-2">
					<button
						aria-label="revert"
						class="bg-[#F5F5F5] p-1 text-[#68696B] transition-transform duration-300"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 rotate-90"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
					<button
						aria-label="forward"
						class="bg-[#F5F5F5] p-1 text-[#68696B] transition-transform duration-300"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 -rotate-90"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</div>
			</div>

			<!-- Body -->
			<div
				class="custom-scrollbar bg-[#F4F5F6] h-134 space-y-8 overflow-hidden overflow-y-auto px-5 py-6 text-gray-700"
			>
				<!-- Title -->
				<h2 class="text-2xl font-semibold text-gray-900">Order Summary</h2>
				<!-- ITEMS LIST -->
				<div class="space-y-5">
					{#each items as item}
						<div class="flex items-start justify-between rounded-xl bg-white p-4">
							<div class="flex gap-3">
								<img src={item.image} class="h-14 w-14 rounded-lg bg-gray-200" />

								<div>
									<p class="font-medium">{item.name}</p>
									<div class="mt-1 flex items-center gap-2 text-sm">
										<span class="font-semibold text-gray-800">${item.price}</span>
										<span class="text-gray-400 line-through">${item.original}</span>
									</div>

									<!-- Qty -->
									<div class="mt-3 flex items-center gap-3">
										<button class="rounded-md bg-gray-100 px-2" on:click={() => decrease(item.id)}
											>–</button
										>
										<p>{item.quantity}</p>
										<button class="rounded-md bg-gray-100 px-2" on:click={() => increase(item.id)}
											>+</button
										>
									</div>
								</div>
							</div>

							<!-- Delete -->
							<button on:click={() => removeItem(item.id)}>
								<Icon icon="mdi:trash-can-outline" class="h-5 w-5 text-gray-400" />
							</button>
						</div>
					{/each}
				</div>

				<!-- Total Amount -->
				<div class="mt-6">
					<p class="mb-1 text-sm text-gray-500">Total Amount</p>
					<input
						class="w-full rounded-lg bg-white px-3 py-2"
						value={`$${totalAmount()}`}
						disabled
					/>
				</div>

				<!-- Date/Time Needed -->
				<div class="mt-5">
					<p class="mb-1 text-sm text-gray-500">Date/Time Needed</p>
					<input
						type="datetime-local"
						bind:value={dateTime}
						class="w-full rounded-lg bg-white px-3 py-2"
					/>
				</div>

				<!-- Delivery Notes -->
				<div class="mt-5">
					<p class="mb-1 text-sm text-gray-500">Delivery/Logistics Notes</p>
					<textarea
						bind:value={logisticsNotes}
						class="h-20 w-full rounded-lg bg-white px-3 py-2"
						maxlength={100}
					/>
					<p class="mt-1 text-xs text-gray-400">{logisticsNotes.length}/100</p>
				</div>

				<!-- Personal Message -->
				<div class="mt-5">
					<p class="mb-1 text-xs text-gray-500">You can describe your personal message briefly.</p>
					<textarea
						bind:value={personalMessage}
						class="h-20 w-full rounded-lg bg-white px-3 py-2"
					/>
				</div>

				<!-- Payment Method Dropdown -->
				<div class="mt-5">
					<p class="mb-1 text-sm text-gray-500">Select Payment Method</p>
					<select bind:value={paymentMethod} class="w-full rounded-lg bg-white px-3 py-2">
						<option>Paystack</option>
						<option>Flutterwave</option>
						<option>Stripe</option>
					</select>
				</div>
			</div>

			<!-- RIGHT PANEL PAYMENT LIST -->
			<!-- <div class="h-fit rounded-xl bg-white p-5 shadow-sm">
					<p class="mb-3 font-semibold">Select Payment Method</p>

					<div class="space-y-3">
						<div class="gray-50 flex items-center justify-between rounded-lg border p-3">
							<div class="flex items-center gap-3">
								<img src="/paystack.svg" class="h-6" />
								<p class="text-sm font-medium">Paystack</p>
							</div>
							<span class="rounded-md bg-gray-200 px-2 py-1 text-xs">SOON</span>
						</div>

						<div class="gray-50 flex items-center justify-between rounded-lg border p-3">
							<div class="flex items-center gap-3">
								<img src="/flutterwave.svg" class="h-6" />
								<p class="text-sm font-medium">Flutterwave</p>
							</div>
							<span class="rounded-md bg-gray-200 px-2 py-1 text-xs">SOON</span>
						</div>

						<div class="gray-50 flex items-center justify-between rounded-lg border p-3">
							<div class="flex items-center gap-3">
								<img src="/stripe.svg" class="h-6" />
								<p class="text-sm font-medium">Stripe</p>
							</div>
							<span class="rounded-md bg-gray-200 px-2 py-1 text-xs">SOON</span>
						</div>
					</div>
				</div> -->
		</div>
	</div>
{/if}
