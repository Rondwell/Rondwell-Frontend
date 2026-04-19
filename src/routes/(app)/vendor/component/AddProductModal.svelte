<script lang="ts">
	import { createProduct, deleteVendorMedia, updateProduct, uploadVendorMedia } from '$lib/services/vendor.services';
	import Icon from '@iconify/svelte';
	import { onDestroy } from 'svelte';

	export let show = false;
	export let onSuccess: () => void = () => {};
	export let editProduct: any = null;

	$: isEditMode = !!editProduct;
	$: if (show && editProduct) populateFromProduct(editProduct);
	$: if (!show) { lastPopulatedId = ''; }

	type Section = 'basic' | 'pricing' | 'additional';
	let openSection: Section | null = null;
	let submitting = false;
	let error = '';

	let productName = '';
	let selectedCategories: string[] = [];
	let categorySearch = '';
	let showCategoryDropdown = false;
	let customCategoryInput = '';
	let showCustomCategoryInput = false;
	let description = '';
	let priceCurrency = 'NGN';
	let priceAmount = '';
	let hourlyAmount = '';
	let isCustomQuote = false;
	let offerPackages = false;
	let hasAvailability = false;
	let deliveryLogistics = '';
	let isPublic = true;

	const PRESET_CATEGORIES = [
		'Catering', 'Photography', 'Videography', 'Event Venue', 'Sound & Lighting',
		'Entertainment', 'Cake & Confectionery', 'Floristry', 'Security',
		'Transportation', 'Printing & Branding', 'Decoration', 'MC / Host',
		'DJ Services', 'Makeup & Styling', 'Event Planning', 'AV Equipment',
		'Furniture Rental', 'Cleaning Services', 'Stage Design', 'Ushering',
		'Live Band / Music', 'Photo Booth', 'Cocktail / Bartending', 'Tent & Canopy',
		'Power / Generator', 'Invitation & Stationery', 'Gift & Souvenirs',
		'Drone / Aerial', 'Content Creation', 'Social Media Management',
		'Graphic Design', 'Web Development', 'Consulting', 'Training & Workshop',
		'Health & Wellness', 'Fashion & Apparel', 'Jewelry & Accessories',
		'Food & Beverage', 'Real Estate', 'Technology', 'Other'
	];

	$: filteredCategories = PRESET_CATEGORIES.filter(
		(c) => !selectedCategories.includes(c) && c.toLowerCase().includes(categorySearch.toLowerCase())
	);

	function addCategory(cat: string) {
		if (!selectedCategories.includes(cat)) selectedCategories = [...selectedCategories, cat];
		categorySearch = '';
		showCategoryDropdown = false;
	}
	function removeCategory(cat: string) { selectedCategories = selectedCategories.filter((c) => c !== cat); }
	function addCustomCategory() {
		const val = customCategoryInput.trim();
		if (val && !selectedCategories.includes(val)) selectedCategories = [...selectedCategories, val];
		customCategoryInput = '';
		showCustomCategoryInput = false;
	}

	// ─── File Upload ──────────────────────────────────────────────────────
	type UploadedFile = { file: File; preview: string };
	type ExistingMedia = { url: string; type: 'IMAGE' | 'VIDEO' };
	let files: UploadedFile[] = [];
	let existingMedia: ExistingMedia[] = [];
	let removedMediaUrls: string[] = [];
	let isDragging = false;
	let fileInput: HTMLInputElement;
	const MAX_FILE_SIZE = 5 * 1024 * 1024;

	function browseFiles() { fileInput?.click(); }
	function handleFiles(fl: FileList | null) {
		if (!fl) return;
		for (const f of Array.from(fl)) {
			if (f.size > MAX_FILE_SIZE) { error = `File "${f.name}" exceeds 5MB limit.`; continue; }
			files = [...files, { file: f, preview: URL.createObjectURL(f) }];
		}
	}
	function removeFile(i: number) {
		URL.revokeObjectURL(files[i].preview);
		files = files.filter((_, idx) => idx !== i);
	}
	function removeExistingMedia(i: number) {
		removedMediaUrls = [...removedMediaUrls, existingMedia[i].url];
		existingMedia = existingMedia.filter((_, idx) => idx !== i);
	}

	onDestroy(() => files.forEach((f) => URL.revokeObjectURL(f.preview)));

	function toggle(s: Section) { openSection = openSection === s ? null : s; }
	function closeModal() { show = false; editProduct = null; resetForm(); }

	function resetForm() {
		productName = ''; selectedCategories = []; categorySearch = '';
		showCategoryDropdown = false; customCategoryInput = ''; showCustomCategoryInput = false;
		description = ''; priceCurrency = 'NGN'; priceAmount = ''; hourlyAmount = '';
		isCustomQuote = false; offerPackages = false; hasAvailability = false;
		deliveryLogistics = ''; isPublic = true; error = '';
		files.forEach((f) => URL.revokeObjectURL(f.preview));
		files = []; existingMedia = []; removedMediaUrls = []; openSection = null;
	}

	let lastPopulatedId = '';
	function populateFromProduct(p: any) {
		if (!p || lastPopulatedId === p._id) return;
		lastPopulatedId = p._id;
		productName = p.productName || '';
		description = p.description || '';
		selectedCategories = p.tags || [];
		deliveryLogistics = p.deliveryLogistics || '';
		isPublic = p.isPublic ?? true;
		isCustomQuote = p.pricingType === 'CUSTOM_QUOTE';
		offerPackages = p.hasPackages ?? false;
		hasAvailability = !!p.availabilityCalendar?.length;
		const priceVal = parseFloat(p.price?.$numberDecimal || p.price || 0);
		priceCurrency = p.currency || 'NGN';
		if (p.pricingType === 'HOURLY' || p.pricingType === 'DAILY') {
			hourlyAmount = priceVal ? String(priceVal) : '';
			priceAmount = '';
		} else {
			priceAmount = priceVal ? String(priceVal) : '';
			hourlyAmount = '';
		}
		existingMedia = (p.media || []).map((m: any) => ({ url: m.url, type: m.type }));
		files = []; removedMediaUrls = [];
	}

	async function handleSubmit() {
		error = '';
		if (!productName.trim()) { error = 'Product name is required.'; openSection = 'basic'; return; }
		submitting = true;
		try {
			// 1. Upload new media files
			const newMedia: { url: string; type: 'IMAGE' | 'VIDEO' }[] = [];
			for (const f of files) {
				try {
					const url = await uploadVendorMedia(f.file);
					newMedia.push({ url, type: f.file.type.startsWith('video') ? 'VIDEO' : 'IMAGE' });
				} catch (uploadErr: any) {
					console.error('Upload failed for', f.file.name, uploadErr);
				}
			}

			// 2. In edit mode, delete removed media from S3
			if (isEditMode) {
				for (const url of removedMediaUrls) {
					try { await deleteVendorMedia(url); } catch (e) { console.error('Failed to delete media:', e); }
				}
			}

			// 3. Combine existing + new media
			const allMedia = [...existingMedia, ...newMedia];

			// 4. Determine pricing type
			let pricingType: string = 'FIXED';
			if (isCustomQuote) pricingType = 'CUSTOM_QUOTE';
			else if (hourlyAmount && !priceAmount) pricingType = 'HOURLY';

			// 5. Build payload
			const payload: Record<string, unknown> = {
				productName: productName.trim(),
				description: description.trim() || 'No description provided',
				pricingType,
				media: allMedia,
				termsConditions: 'Standard terms apply',
				isPublic,
				status: isPublic ? 'ACTIVE' : 'DRAFT',
			};
			if (!isCustomQuote) {
				if (priceAmount) { payload.price = parseFloat(priceAmount); payload.currency = priceCurrency; }
				else if (hourlyAmount) { payload.price = parseFloat(hourlyAmount); payload.currency = priceCurrency; }
			}
			if (selectedCategories.length > 0) payload.tags = selectedCategories;
			if (deliveryLogistics.trim()) payload.deliveryLogistics = deliveryLogistics.trim();
			payload.hasPackages = offerPackages;

			// 6. Create or Update
			if (isEditMode) {
				await updateProduct(editProduct._id, payload);
			} else {
				await createProduct(payload);
			}
			closeModal();
			onSuccess();
		} catch (e: any) {
			error = e.message || `Failed to ${isEditMode ? 'update' : 'create'} product. Please try again.`;
		} finally {
			submitting = false;
		}
	}
</script>

{#if show}
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
	on:click|self={closeModal}
	on:keydown={(e) => e.key === 'Escape' && closeModal()}
	role="dialog"
	aria-modal="true"
	tabindex="-1"
>
	<div
		class="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[#FDFCFB]"
		on:click|stopPropagation
		on:keydown|stopPropagation
		role="document"
	>
		<!-- ═══ HEADER ═══ -->
		<div class="relative border-b border-[#EBEBEB] px-6 pb-5 pt-6">
			<button on:click={closeModal} class="absolute right-4 top-4 rounded-full bg-[#EBECED] p-2 hover:bg-gray-200" aria-label="Close modal">
				<Icon icon="heroicons:x-mark" class="h-4 w-4 text-[#5C5C5C]" />
			</button>
			<div class="flex flex-col items-center text-center">
				<div class="mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#F0F0F0]">
					<img src="/NDB.svg" alt="" class="h-[72px] w-[72px] rounded-full" />
				</div>
				<h2 class="text-xl font-semibold text-[#171717]">{isEditMode ? 'Edit Product/Service' : 'Add Product/Service'}</h2>
				<p class="text-sm text-[#5C5C5C]">{isEditMode ? 'Update the details of your product/service.' : 'Provide details of product/service to proceed.'}</p>
			</div>
		</div>

		<!-- ═══ SCROLLABLE BODY ═══ -->
		<div class="custom-scrollbar flex-1 overflow-y-auto px-4 py-5 sm:px-6">
			{#if error}
				<div class="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
			{/if}

			<!-- Upload Area -->
			<div class="mb-5">
				<p class="mb-2 text-sm font-medium text-[#171717]">Images/Videos</p>
				<div
					class="flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition {isDragging ? 'border-black bg-gray-50' : 'border-gray-300 bg-white'}"
					on:drop|preventDefault={(e) => { isDragging = false; handleFiles(e.dataTransfer?.files ?? null); }}
					on:dragover|preventDefault={() => (isDragging = true)}
					on:dragleave={() => (isDragging = false)}
					role="region"
					aria-label="File upload area"
				>
					<img src="/upload.svg" alt="" class="mb-2 h-7 w-7 opacity-50" />
					<p class="text-sm text-[#171717]">Choose a file or drag & drop it here.</p>
					<p class="mt-1 text-xs text-[#737373]">JPEG, PNG, PDF, and MP4 formats, up to 5 MB.</p>
					<button type="button" on:click={browseFiles} class="mt-3 rounded-lg border border-gray-300 px-5 py-1.5 text-sm font-medium text-[#5C5C5C] hover:bg-gray-50">Browse File</button>
					<input bind:this={fileInput} type="file" class="hidden" multiple accept=".jpg,.jpeg,.png,.pdf,.mp4" on:change={(e) => handleFiles((e.target as HTMLInputElement).files)} />
				</div>

				<!-- Existing media (edit mode) -->
				{#if existingMedia.length > 0}
					<div class="mt-3 space-y-2">
						{#each existingMedia as item, idx}
							<div class="flex items-center justify-between rounded-lg border bg-white p-2.5">
								<div class="flex items-center gap-2 min-w-0">
									{#if item.type === 'IMAGE'}
										<img src={item.url} alt="" class="h-10 w-10 shrink-0 rounded object-cover" />
									{:else}
										<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-blue-50 text-[10px] font-bold text-blue-500">VID</div>
									{/if}
									<div class="min-w-0">
										<p class="truncate text-xs font-medium">Existing file</p>
										<p class="text-[10px] text-gray-400"><span class="text-green-600">✓ Uploaded</span></p>
									</div>
								</div>
								<button on:click={() => removeExistingMedia(idx)} class="shrink-0 p-1 text-gray-400 hover:text-red-500" aria-label="Remove file">
									<Icon icon="mdi:trash-can-outline" class="h-4 w-4" />
								</button>
							</div>
						{/each}
					</div>
				{/if}

				<!-- New files -->
				{#if files.length > 0}
					<div class="mt-3 space-y-2">
						{#each files as item, idx}
							<div class="flex items-center justify-between rounded-lg border bg-white p-2.5">
								<div class="flex items-center gap-2 min-w-0">
									{#if item.file.type.startsWith('image')}
										<img src={item.preview} alt="" class="h-10 w-10 shrink-0 rounded object-cover" />
									{:else}
										<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-red-50 text-[10px] font-bold text-red-500">PDF</div>
									{/if}
									<div class="min-w-0">
										<p class="truncate text-xs font-medium">{item.file.name}</p>
										<p class="text-[10px] text-gray-400">{(item.file.size / 1024).toFixed(0)} KB · <span class="text-green-600">✓ Completed</span></p>
									</div>
								</div>
								<button on:click={() => removeFile(idx)} class="shrink-0 p-1 text-gray-400 hover:text-red-500" aria-label="Remove file">
									<Icon icon="mdi:trash-can-outline" class="h-4 w-4" />
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- ═══ ACCORDIONS ═══ -->
			<div class="space-y-3">
				<!-- ── Basic Information ── -->
				<div>
					<button on:click={() => toggle('basic')} class="flex w-full items-center justify-between rounded-lg bg-[#F0F0F0] px-4 py-3 text-sm font-medium text-[#171717] transition hover:bg-gray-200">
						<span class="flex items-center gap-2"><Icon icon="mdi:help-circle-outline" class="h-4 w-4 text-gray-400" /> Basic Information</span>
						<Icon icon={openSection === 'basic' ? 'mdi:minus' : 'mdi:plus'} class="h-4 w-4 text-[#5C5C5C]" />
					</button>
					{#if openSection === 'basic'}
						<div class="mt-2 space-y-4 rounded-lg border border-gray-200 bg-white p-4">
							<div>
								<label for="prod-name" class="mb-1 flex items-center gap-1 text-sm font-medium">Product name <Icon icon="mdi:information-outline" class="h-3.5 w-3.5 text-gray-400" /></label>
								<input id="prod-name" bind:value={productName} placeholder="e.g Premium Wedding Photography Package..." class="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
							</div>
							<div>
								<div class="mb-1 flex items-center justify-between">
									<label class="text-sm font-medium">Category <span class="text-[#335CFF]">*</span></label>
									<button type="button" on:click|stopPropagation={() => (showCustomCategoryInput = !showCustomCategoryInput)} class="text-xs font-medium text-[#335CFF]">+ Add New Category</button>
								</div>
								{#if selectedCategories.length > 0}
									<div class="mb-2 flex flex-wrap gap-1.5">
										{#each selectedCategories as cat}
											<span class="flex items-center gap-1 rounded-full bg-[#F3F0FF] px-2.5 py-1 text-xs font-medium text-[#7C3AED]">
												{cat}
												<button type="button" on:click|stopPropagation={() => removeCategory(cat)} class="ml-0.5 text-[#7C3AED]/60 hover:text-red-500" aria-label="Remove {cat}">✕</button>
											</span>
										{/each}
									</div>
								{/if}
								<div class="relative">
									<button type="button" class="flex w-full items-center justify-between rounded-lg border border-[#EBEBEB] bg-white px-3 py-2.5 text-left text-sm" on:click|stopPropagation={() => (showCategoryDropdown = !showCategoryDropdown)}>
										<span class="text-gray-400">{selectedCategories.length === 0 ? 'Select relevant categories' : `${selectedCategories.length} selected`}</span>
										<Icon icon="mdi:chevron-down" class="h-4 w-4 text-gray-400 transition-transform {showCategoryDropdown ? 'rotate-180' : ''}" />
									</button>
									{#if showCategoryDropdown}
										<button class="fixed inset-0 z-10 cursor-default" on:click={() => (showCategoryDropdown = false)} aria-label="Close dropdown"></button>
										<div class="absolute left-0 z-20 mt-1 w-full rounded-lg border border-[#EBEBEB] bg-white shadow-lg">
											<div class="border-b px-3 py-2">
												<input bind:value={categorySearch} placeholder="Search categories..." class="w-full text-sm placeholder:text-gray-400 focus:outline-none" on:click|stopPropagation={() => {}} />
											</div>
											<div class="max-h-48 overflow-auto">
												{#each filteredCategories as cat}
													<button type="button" on:click|stopPropagation={() => addCategory(cat)} class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#F5F6F7]">
														<span class="flex h-4 w-4 items-center justify-center rounded border border-gray-300 text-[10px]">
															{#if selectedCategories.includes(cat)}<Icon icon="mdi:check" class="h-3 w-3 text-[#7C3AED]" />{/if}
														</span>
														{cat}
													</button>
												{/each}
												{#if filteredCategories.length === 0}
													<p class="px-3 py-3 text-center text-xs text-gray-400">No matching categories. Use "+ Add New Category" above.</p>
												{/if}
											</div>
										</div>
									{/if}
								</div>
								{#if showCustomCategoryInput}
									<div class="mt-2 flex items-center gap-2">
										<input bind:value={customCategoryInput} placeholder="Type custom category..." on:keydown={(e) => e.key === 'Enter' && addCustomCategory()} class="flex-1 rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
										<button type="button" on:click={addCustomCategory} class="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white hover:bg-gray-800">Add</button>
									</div>
								{/if}
							</div>
							<div>
								<label for="prod-desc" class="mb-1 block text-sm font-medium">Product/service Description <span class="text-gray-400">(Optional)</span></label>
								<div class="relative">
									<textarea id="prod-desc" bind:value={description} maxlength="200" rows="2" placeholder="Describe your product or service..." class="w-full resize-none rounded-lg border border-[#EBEBEB] bg-white px-3 py-2.5 pr-16 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"></textarea>
									<span class="pointer-events-none absolute right-3 bottom-2 text-[10px] text-gray-400">{description.length}/200</span>
								</div>
								<p class="mt-1 flex items-center gap-1 text-[10px] text-gray-400"><Icon icon="mdi:information-outline" class="h-3 w-3" /> You can describe your product briefly.</p>
							</div>
						</div>
					{/if}
				</div>

				<!-- ── Pricing ── -->
				<div>
					<button on:click={() => toggle('pricing')} class="flex w-full items-center justify-between rounded-lg bg-[#F0F0F0] px-4 py-3 text-sm font-medium text-[#171717] transition hover:bg-gray-200">
						<span class="flex items-center gap-2"><Icon icon="mdi:currency-usd" class="h-4 w-4 text-gray-400" /> Pricing</span>
						<Icon icon={openSection === 'pricing' ? 'mdi:minus' : 'mdi:plus'} class="h-4 w-4 text-[#5C5C5C]" />
					</button>
					{#if openSection === 'pricing'}
						<div class="mt-2 space-y-4 rounded-lg border border-gray-200 bg-white p-4">
							<!-- Custom Quote Toggle -->
							<label class="flex items-center gap-3 cursor-pointer">
								<input id="custom-quote" type="checkbox" bind:checked={isCustomQuote} class="h-4 w-4 rounded border-gray-300 text-black focus:ring-black" />
								<span class="text-sm font-medium text-[#171717]">Custom Quote (no fixed price)</span>
							</label>

							{#if !isCustomQuote}
								<!-- Currency -->
								<div>
									<label class="mb-1 block text-sm font-medium">Currency</label>
									<select bind:value={priceCurrency} class="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300">
										<option value="NGN">NGN (₦)</option>
										<option value="USD">USD ($)</option>
										<option value="GBP">GBP (£)</option>
										<option value="EUR">EUR (€)</option>
									</select>
								</div>
								<!-- Fixed Price -->
								<div>
									<label for="price-fixed" class="mb-1 block text-sm font-medium">Fixed Price</label>
									<input id="price-fixed" type="number" bind:value={priceAmount} placeholder="0.00" min="0" step="0.01" class="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
								</div>
								<!-- Hourly / Daily Rate -->
								<div>
									<label for="price-hourly" class="mb-1 block text-sm font-medium">Hourly / Daily Rate <span class="text-gray-400">(Optional)</span></label>
									<input id="price-hourly" type="number" bind:value={hourlyAmount} placeholder="0.00" min="0" step="0.01" class="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
								</div>
							{/if}

							<!-- Packages Toggle -->
							<label class="flex items-center gap-3 cursor-pointer">
								<input id="offer-packages" type="checkbox" bind:checked={offerPackages} class="h-4 w-4 rounded border-gray-300 text-black focus:ring-black" />
								<span class="text-sm font-medium text-[#171717]">I offer packages</span>
							</label>
						</div>
					{/if}
				</div>

				<!-- ── Additional Details ── -->
				<div>
					<button on:click={() => toggle('additional')} class="flex w-full items-center justify-between rounded-lg bg-[#F0F0F0] px-4 py-3 text-sm font-medium text-[#171717] transition hover:bg-gray-200">
						<span class="flex items-center gap-2"><Icon icon="mdi:cog-outline" class="h-4 w-4 text-gray-400" /> Additional Details</span>
						<Icon icon={openSection === 'additional' ? 'mdi:minus' : 'mdi:plus'} class="h-4 w-4 text-[#5C5C5C]" />
					</button>
					{#if openSection === 'additional'}
						<div class="mt-2 space-y-4 rounded-lg border border-gray-200 bg-white p-4">
							<!-- Delivery / Logistics -->
							<div>
								<label for="delivery" class="mb-1 block text-sm font-medium">Delivery / Logistics <span class="text-gray-400">(Optional)</span></label>
								<textarea id="delivery" bind:value={deliveryLogistics} maxlength="300" rows="2" placeholder="Describe delivery or logistics details..." class="w-full resize-none rounded-lg border border-[#EBEBEB] bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"></textarea>
							</div>
							<!-- Visibility -->
							<label class="flex items-center gap-3 cursor-pointer">
								<input id="is-public" type="checkbox" bind:checked={isPublic} class="h-4 w-4 rounded border-gray-300 text-black focus:ring-black" />
								<div>
									<span class="text-sm font-medium text-[#171717]">Make publicly visible</span>
									<p class="text-[10px] text-gray-400">When enabled, this product will be visible on your public vendor profile.</p>
								</div>
							</label>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- ═══ FOOTER ═══ -->
		<div class="border-t border-[#EBEBEB] px-6 py-4">
			<div class="flex items-center justify-end gap-3">
				<button on:click={closeModal} class="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-[#5C5C5C] hover:bg-gray-50">
					Cancel
				</button>
				<button
					on:click={handleSubmit}
					disabled={submitting}
					class="flex items-center gap-2 rounded-lg bg-black px-6 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if submitting}
						<Icon icon="mdi:loading" class="h-4 w-4 animate-spin" />
						{isEditMode ? 'Saving...' : 'Creating...'}
					{:else}
						<Icon icon={isEditMode ? 'mdi:content-save-outline' : 'mdi:plus'} class="h-4 w-4" />
						{isEditMode ? 'Save Changes' : 'Create Product'}
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>
{/if}

<style>
	.custom-scrollbar::-webkit-scrollbar { width: 4px; }
	.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
	.custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 9999px; }
</style>
