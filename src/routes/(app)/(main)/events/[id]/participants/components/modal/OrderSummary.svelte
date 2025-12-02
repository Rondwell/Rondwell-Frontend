<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';
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
			image: '/tech-icon.svg'
		},
		{
			id: 2,
			name: 'Onsite Registration Kiosk',
			price: 478.8,
			original: 478.8,
			quantity: 20,
			image: '/tech-icon.svg'
		},
		{
			id: 3,
			name: 'Conference Photography Package',
			price: 478.8,
			original: 478.8,
			quantity: 20,
			image: '/tech-icon.svg'
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

	let buttonOpen = false;

	// ✅ Payment Method Options
	let paymentOptions = [
		{ id: 'paystack', label: 'Paystack', icon: '/paystack.svg', enabled: false },
		{ id: 'flutterwave', label: 'Flutterwave', icon: '/Logo_Flutterwave Logo.svg', enabled: false },
		{ id: 'stripe', label: 'Stripe', icon: '/Stripe.svg', enabled: false }
	];

	const toggleOption = (id: string) => {
		paymentOptions = paymentOptions.map((option) =>
			option.id === id ? { ...option, enabled: !option.enabled } : option
		);
	};
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
			<div
				class="flex items-start justify-between border-b border-gray-200 px-6 py-4 md:items-center"
			>
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
				class="custom-scrollbar h-134 space-y-8 overflow-hidden overflow-y-auto bg-[#F4F5F6] px-5 py-6 text-gray-700"
			>
				<!-- Title -->
				<h2 class="text-2xl font-semibold text-gray-900">Order Summary</h2>

				<div class="rounded-2xl bg-white p-4">
					<!-- ITEMS LIST -->
					<div class="space-y-3">
						{#each items as item}
							<div class="flex items-start justify-between px-2 py-4 md:px-4">
								<div class="flex gap-3">
									<div class="flex h-22 w-22 items-center justify-center rounded-lg bg-gray-200">
										<img src={item.image} class="h-12 w-12" />
									</div>

									<div>
										<p class=" font-medium">{item.name}</p>
										<div class="mt-1 flex items-center gap-2 text-sm">
											<span class="font-semibold text-gray-800">${item.price}</span>
											<span class="text-gray-400 line-through">${item.original}</span>
										</div>

										<!-- Qty -->
										<div
											class="mt-3 flex w-fit items-center gap-3 rounded-lg border border-gray-500 px-2 py-1.5"
										>
											<button class="" on:click={() => decrease(item.id)}>–</button>
											<p>{item.quantity}</p>
											<button class="" on:click={() => increase(item.id)}>+</button>
										</div>
									</div>
								</div>

								<!-- Delete -->
								<button on:click={() => removeItem(item.id)} class="">
									<Icon icon="mdi:trash-can-outline" class="h-5 w-5 text-gray-400" />
								</button>
							</div>
						{/each}
					</div>

					<!-- Total Amount -->
					<div class="mt-6 border-t-3 border-dashed pt-6">
						<p class="mb-1 text-sm text-gray-500">Total Amount</p>
						<input
							class="w-full rounded-lg border bg-white px-3 py-2.5"
							value={`$${totalAmount()}`}
							disabled
						/>
					</div>

					<!-- Date/Time Needed -->
					<div class="mt-5">
						<p class="mb-1 text-sm text-gray-500">Date/Time Needed</p>
						<input
							type="text"
							bind:value={dateTime}
							class="w-full rounded-lg border bg-white px-3 py-2.5"
						/>
					</div>

					<!-- Delivery Notes -->
					<div class="mt-5">
						<p class="mb-1 text-sm text-gray-500">Delivery/Logistics Notes</p>
						<div class="relative">
							<textarea
								bind:value={logisticsNotes}
								class="h-20 w-full rounded-lg border bg-white px-3 py-2"
								maxlength={100}
							/>
							<p class="absolute right-2 bottom-3 mt-1 text-xs text-gray-400">
								{logisticsNotes.length}/100
							</p>
						</div>
						<p class="mb-1 text-xs text-gray-500">
							You can describe your personal message briefly.
						</p>
					</div>

					<!-- Payment Method Dropdown -->
					<div class="mt-6">
						<label class="flex text-gray-900"> Select Payment Method </label>

						<div use:clickOutside={() => (buttonOpen = false)} class="relative w-full">
							<button
								class="mb-2 flex w-full cursor-pointer items-center justify-between rounded-lg border bg-white p-3 text-sm font-medium text-[#B3B5B7]"
								on:click={() => (buttonOpen = !buttonOpen)}
							>
								<span class="flex items-center gap-1">
									{paymentMethod ? paymentMethod : 'Select option'}
								</span>
								<img src="/arrow-left.svg" alt="" class="rotate-90" />
							</button>

							{#if buttonOpen}
								<div class="absolute left-0 z-10 w-full rounded-lg border bg-white p-2 shadow-lg">
									<div class="flex flex-col gap-2">
										{#each paymentOptions as option}
											<button
												class="flex w-full items-center justify-between rounded-sm p-2"
												on:click={() => (paymentMethod = option.label)}
											>
												<div class="flex items-center gap-2">
													<div
														class="flex h-12 w-12 items-center justify-center rounded-full border"
													>
														<img src={option.icon} alt="" />
													</div>
													<div class="truncate rounded-2xl px-2 py-1 text-xs font-medium">
														{option.label}
													</div>
													<span class="rounded-xl bg-gray-100 px-2 py-1 text-gray-300">soon</span>
												</div>

												<!-- Toggle Switch -->
												<div
													class="flex h-5 w-8 cursor-pointer items-center rounded-full p-1"
													class:bg-gray-300={!option.enabled}
													class:bg-black={option.enabled}
													on:click|stopPropagation={() => toggleOption(option.id)}
												>
													<div
														class="h-4 w-4 rounded-full bg-white shadow-md transition-all"
														class:translate-x-2={option.enabled}
													></div>
												</div>
											</button>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
