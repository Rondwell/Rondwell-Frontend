<script lang="ts">
	import Icon from '@iconify/svelte';

	export let open = false;
	export let product: any = null;
	export let onEdit: (product: any) => void = () => {};

	$: pricingType = product?.pricingType || 'FIXED';
	$: priceVal = parseFloat(product?.price?.$numberDecimal || product?.price || 0);
	$: currency = product?.currency || 'NGN';
	$: currencySymbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency;
	$: formattedPrice = priceVal > 0 ? `${currencySymbol}${priceVal.toLocaleString()}` : 'Free';
	$: isCustomQuote = pricingType === 'CUSTOM_QUOTE';
	$: isHourly = pricingType === 'HOURLY' || pricingType === 'DAILY';
	$: statusColor = product?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : product?.status === 'DRAFT' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700';

	function handleEdit() { open = false; onEdit(product); }
	function formatDate(d: string) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''; }

	$: pricingToggles = [
		{ icon: 'mdi:message-text-outline', label: 'Custom Quote', desc: 'Organizers will be prompted to request a custom quote for this service.', active: isCustomQuote },
		{ icon: 'mdi:package-variant-closed', label: 'Offer as Package Options', desc: 'Organizers will be prompted to request a custom quote for this service.', active: !!product?.hasPackages },
		{ icon: 'mdi:calendar-clock', label: 'Availability', desc: 'Allow Vendors to select specific dates/time blocks as unavailable.', active: !!product?.availabilityCalendar?.length }
	];

	$: additionalToggles = [
		{ icon: 'mdi:message-text-outline', label: 'Custom Quote', desc: 'Organizers will be prompted to request a custom quote for this service.', active: isCustomQuote },
		{ icon: 'mdi:package-variant-closed', label: 'Offer as Package Options', desc: 'Organizers will be prompted to request a custom quote for this service.', active: !!product?.hasPackages },
		{ icon: 'mdi:calendar-clock', label: 'Availability', desc: 'Allow Vendors to select specific dates/time blocks as unavailable.', active: !!product?.availabilityCalendar?.length },
		{ icon: 'mdi:eye-outline', label: 'Toggle Visibility', desc: 'Set to "Off" to keep this listing private (e.g. for drafts).', active: !!product?.isPublic }
	];
</script>

{#if open && product}
<div on:click={() => (open = false)} on:keydown={(e) => e.key === 'Escape' && (open = false)}
	class="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-5 lg:justify-end lg:p-0 lg:pr-10"
	role="dialog" aria-modal="true" tabindex="-1">
	<div class="flex h-full w-full max-w-xl flex-col rounded-xl bg-[#F4F5F6] shadow-xl lg:max-w-lg lg:rounded-none"
		role="document" on:click|stopPropagation on:keydown|stopPropagation>

		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
			<div class="flex items-center gap-2">
				<button aria-label="Close" on:click={() => (open = false)}>
					<Icon icon="mdi:chevron-double-right" class="text-lg text-gray-500" />
				</button>
				<span class="text-sm font-semibold text-gray-700">Product Details</span>
			</div>
			<div class="flex items-center gap-1.5 sm:gap-2">
				<button on:click={handleEdit} class="hidden items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:flex">
					<Icon icon="mdi:pencil-outline" class="h-3.5 w-3.5" /> Edit Product
				</button>
				<button on:click={handleEdit} class="flex items-center rounded-md bg-white p-1.5 text-gray-700 shadow-sm hover:bg-gray-50 sm:hidden" aria-label="Edit Product">
					<Icon icon="mdi:pencil-outline" class="h-4 w-4" />
				</button>
				<button aria-label="Previous" class="rounded-md bg-[#F0F1F1] p-1.5 text-[#68696B] hover:bg-gray-200">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
				</button>
				<button aria-label="Next" class="rounded-md bg-[#F0F1F1] p-1.5 text-[#68696B] hover:bg-gray-200">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 -rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
				</button>
			</div>
		</div>

		<!-- Content -->
		<div class="custom-scrollbar flex-1 overflow-y-auto px-4 pt-4 pb-6 sm:px-6 sm:pt-5">
			<!-- Hero Image -->
			{#if product.media?.length > 0}
				<div class="relative mb-5 h-44 w-full overflow-hidden rounded-xl bg-gray-100 sm:h-60">
					<img src={product.media[0].url} alt={product.productName} class="h-full w-full object-cover" />
					{#if product.media.length > 1}
						<div class="absolute right-2 bottom-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
							<Icon icon="mdi:image-multiple" class="h-3 w-3" /> {product.media.length} files
						</div>
					{/if}
				</div>
			{:else}
				<div class="mb-5 flex h-44 w-full items-center justify-center rounded-xl bg-gray-100 sm:h-60">
					<Icon icon="mdi:image-outline" class="h-16 w-16 text-gray-300" />
				</div>
			{/if}

			<!-- Product Name & Status -->
			<div class="mb-1 flex items-center gap-2">
				<span class="rounded bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-400">Product Name</span>
				<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {statusColor}">{product.status}</span>
			</div>
			<h2 class="text-xl font-bold text-gray-900 leading-tight">{product.productName}</h2>
			{#if product.createdAt}<p class="mt-1 text-xs text-gray-400">Created {formatDate(product.createdAt)}</p>{/if}

			<!-- ═══ Basic Information ═══ -->
			<div class="mt-6 border-t border-gray-200 pt-5">
				<h3 class="mb-4 text-base font-bold text-gray-900">Basic Information</h3>
				<div class="space-y-4">
					<div class="flex items-start gap-3">
						<div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-50">
							<Icon icon="mdi:tag-outline" class="h-3.5 w-3.5 text-purple-500" />
						</div>
						<div class="min-w-0">
							<p class="text-xs text-gray-400">Product Category</p>
							<p class="text-sm font-medium text-gray-800">{product.tags?.join(', ') || product.pricingType || 'Uncategorized'}</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50">
							<Icon icon="mdi:text-box-outline" class="h-3.5 w-3.5 text-blue-500" />
						</div>
						<div class="min-w-0">
							<p class="text-xs text-gray-400">Product Description</p>
							<p class="text-sm font-medium text-gray-800">{product.description || 'No description provided'}</p>
						</div>
					</div>
				</div>
			</div>

			<!-- ═══ Pricing & Availability ═══ -->
			<div class="mt-6 border-t border-gray-200 pt-5">
				<h3 class="mb-4 text-base font-bold text-gray-900">Pricing & Availability</h3>
				<div class="space-y-3">
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div class="flex items-start gap-3">
							<div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-50">
								<Icon icon="mdi:cash" class="h-3.5 w-3.5 text-green-600" />
							</div>
							<div><p class="text-xs text-gray-400">Fixed price</p><p class="text-sm font-medium text-gray-800">{currencySymbol} ({currency})</p></div>
						</div>
						<div class="flex items-start gap-3">
							<div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-50">
								<Icon icon="mdi:currency-usd" class="h-3.5 w-3.5 text-green-600" />
							</div>
							<div><p class="text-xs text-gray-400">Price</p><p class="text-sm font-bold text-gray-900">{isCustomQuote ? 'Custom Quote' : formattedPrice}</p></div>
						</div>
					</div>
					{#if isHourly}
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div class="flex items-start gap-3">
								<div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-50">
									<Icon icon="mdi:clock-outline" class="h-3.5 w-3.5 text-orange-500" />
								</div>
								<div><p class="text-xs text-gray-400">Hourly rate/Daily rate</p><p class="text-sm font-medium text-gray-800">{currencySymbol} ({currency})</p></div>
							</div>
							<div class="flex items-start gap-3">
								<div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-50">
									<Icon icon="mdi:calculator" class="h-3.5 w-3.5 text-orange-500" />
								</div>
								<div><p class="text-xs text-gray-400">Amount</p><p class="text-sm font-bold text-gray-900">{formattedPrice}</p></div>
							</div>
						</div>
					{/if}

					<!-- Toggle rows -->
					{#each pricingToggles as row}
						<div class="flex items-center gap-3 rounded-lg bg-white p-3">
							<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100">
								<Icon icon={row.icon} class="h-3 w-3 text-gray-500" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-medium text-gray-800">{row.label}</p>
								<p class="text-[11px] leading-tight text-gray-400">{row.desc}</p>
							</div>
							<div class="h-[18px] w-8 shrink-0 rounded-full {row.active ? 'bg-black' : 'bg-gray-200'} relative">
								<div class="absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-all {row.active ? 'left-[15px]' : 'left-[2px]'}"></div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- ═══ Additional Details ═══ -->
			<div class="mt-6 border-t border-gray-200 pt-5">
				<h3 class="mb-4 text-base font-bold text-gray-900">Additional Details</h3>
				<div class="space-y-3">
					<!-- Delivery -->
					<div class="flex items-start gap-3">
						<div class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50">
							<Icon icon="mdi:truck-delivery-outline" class="h-3 w-3 text-blue-500" />
						</div>
						<div class="min-w-0">
							<p class="text-xs text-gray-400">Delivery and Logistics</p>
							<p class="text-sm font-medium text-gray-800">{product.deliveryLogistics || 'Describe how your product is delivered or service is rendered (e.g. On-site setup, Digital delivery via email, Shipping within 3–5 business days'}</p>
						</div>
					</div>

					<!-- Additional toggle rows -->
					{#each additionalToggles as row}
						<div class="flex items-center gap-3 rounded-lg bg-white p-3">
							<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100">
								<Icon icon={row.icon} class="h-3 w-3 text-gray-500" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-medium text-gray-800">{row.label}</p>
								<p class="text-[11px] leading-tight text-gray-400">{row.desc}</p>
							</div>
							<div class="h-[18px] w-8 shrink-0 rounded-full {row.active ? 'bg-black' : 'bg-gray-200'} relative">
								<div class="absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-all {row.active ? 'left-[15px]' : 'left-[2px]'}"></div>
							</div>
						</div>
					{/each}

					<!-- Files -->
					{#if product.media?.length > 0}
						<div>
							<div class="flex items-center gap-3 mb-2">
								<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-50">
									<Icon icon="mdi:paperclip" class="h-3 w-3 text-red-400" />
								</div>
								<p class="text-sm font-medium text-gray-800">Files/Attachments</p>
							</div>
							<div class="space-y-2 pl-9">
								{#each product.media as file, idx}
									<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-2">
										<div class="flex items-center gap-2 min-w-0">
											{#if file.type === 'IMAGE'}
												<img src={file.url} alt="" class="h-8 w-8 shrink-0 rounded object-cover" />
											{:else}
												<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-red-50 text-[8px] font-bold text-red-500">PDF</div>
											{/if}
											<div class="min-w-0">
												<p class="truncate text-xs font-medium text-gray-800">File {idx + 1}.{file.type === 'IMAGE' ? 'jpg' : 'pdf'}</p>
												<p class="text-[10px] text-gray-400">Uploaded</p>
											</div>
										</div>
										<button class="shrink-0 p-1 text-gray-300 hover:text-red-400" aria-label="Delete file">
											<Icon icon="mdi:trash-can-outline" class="h-3.5 w-3.5" />
										</button>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Footer -->
		<div class="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
			<span class="text-[10px] text-[#C1C2C2] sm:text-xs">
				{#if product.updatedAt}Last updated {formatDate(product.updatedAt)}{/if}
			</span>
			<button on:click={handleEdit} class="flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-bold text-white hover:bg-gray-800">
				<Icon icon="mdi:pencil-outline" class="h-3.5 w-3.5" /> Edit Product
			</button>
		</div>
	</div>
</div>
{/if}

<style>
	.custom-scrollbar::-webkit-scrollbar { width: 4px; }
	.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
	.custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 9999px; }
</style>
