<script lang="ts">
	import { getActiveProfile } from '$lib/services/profile.services';
	import { deleteProduct, duplicateProduct, getProducts, type ProductFilters } from '$lib/services/vendor.services';
	import { formatMoney, majorToKobo } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import AddProductModal from '../../component/AddProductModal.svelte';
	import ConfirmActionModal from '../../component/ConfirmActionModal.svelte';
	import ViewProductModal from '../../component/ViewProductModal.svelte';

	let loading = true;
	let vendorName = '';
	let logoUrl = '';
	let vendorProfileSlug = '';
	let products: any[] = [];
	let showModal = false;
	let editingProduct: any = null;
	let viewMode: 'grid' | 'list' = 'grid';
	let searchQuery = '';
	let statusFilter = '';
	let showStatusDropdown = false;
	let showActionMenu: string | null = null;

	// Delete confirmation state
	let showDeleteConfirm = false;
	let deleteTargetProduct: any = null;
	let deleting = false;

	// Duplicate confirmation state
	let showDuplicateConfirm = false;
	let duplicateTargetProduct: any = null;
	let duplicating = false;

	// View modal state
	let showViewModal = false;
	let viewingProduct: any = null;

	const statusStyles: Record<string, string> = {
		ACTIVE: 'bg-green-100 text-green-700',
		DRAFT: 'bg-purple-100 text-purple-700',
		ARCHIVED: 'bg-pink-100 text-pink-700',
	};

	const statusOptions = [
		{ value: '', label: 'All Statuses' },
		{ value: 'ACTIVE', label: 'Active' },
		{ value: 'DRAFT', label: 'Draft' },
		{ value: 'ARCHIVED', label: 'Archived' },
	];

	async function loadProducts() {
		loading = true;
		try {
			const filters: ProductFilters = { limit: 100 };
			if (statusFilter) filters.status = statusFilter;
			if (searchQuery) filters.search = searchQuery;
			const result = await getProducts(filters);
			products = result?.data || result?.products || result || [];
			if (!Array.isArray(products)) products = [];
		} catch {
			products = [];
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		try {
			const profile = await getActiveProfile();
			const vd = (profile as any)?.vendorDetails;
			vendorName = vd?.businessName || '';
			logoUrl = vd?.logoUrl || profile?.profilePictureUrl || '';
			vendorProfileSlug = profile?.publicProfileSlug || '';
		} catch {
			// silent
		}
		await loadProducts();
	});

	function handleSearch() {
		loadProducts();
	}

	function selectStatus(value: string) {
		statusFilter = value;
		showStatusDropdown = false;
		loadProducts();
	}

	// ─── Edit ─────────────────────────────────────────────────────────────
	function handleView(product: any) {
		viewingProduct = product;
		showViewModal = true;
		showActionMenu = null;
	}

	function handleEdit(product: any) {
		editingProduct = product;
		showModal = true;
		showActionMenu = null;
	}

	function handleProductSuccess() {
		showModal = false;
		editingProduct = null;
		loadProducts();
	}

	$: if (!showModal) editingProduct = null;

	// ─── Delete ───────────────────────────────────────────────────────────
	function promptDelete(product: any) {
		deleteTargetProduct = product;
		showDeleteConfirm = true;
		showActionMenu = null;
	}

	async function confirmDelete() {
		if (!deleteTargetProduct) return;
		deleting = true;
		try {
			await deleteProduct(deleteTargetProduct._id);
			products = products.filter((p) => p._id !== deleteTargetProduct._id);
			showDeleteConfirm = false;
			deleteTargetProduct = null;
		} catch (e) {
			console.error('Failed to delete product', e);
		} finally {
			deleting = false;
		}
	}

	// ─── Duplicate ────────────────────────────────────────────────────────
	function promptDuplicate(product: any) {
		duplicateTargetProduct = product;
		showDuplicateConfirm = true;
		showActionMenu = null;
	}

	async function confirmDuplicate() {
		if (!duplicateTargetProduct) return;
		duplicating = true;
		try {
			await duplicateProduct(duplicateTargetProduct._id);
			showDuplicateConfirm = false;
			duplicateTargetProduct = null;
			await loadProducts();
		} catch (e) {
			console.error('Failed to duplicate product', e);
		} finally {
			duplicating = false;
		}
	}

	function formatPrice(product: any) {
		// FE-P1-01 / FE-P1-16 — every monetary string routes through the
		// canonical helper. Server still ships the legacy major-unit `price`,
		// so we convert at the boundary exactly once via majorToKobo.
		if (!product.price && product.pricingType === 'CUSTOM_QUOTE') return 'Custom Quote';
		const amount = parseFloat(product.price?.$numberDecimal || product.price || 0);
		if (amount === 0) return 'Free';
		const ccy = product.currency || 'NGN';
		return formatMoney(majorToKobo(amount, ccy), ccy);
	}

	/**
	 * FE-P3-03 (NEW-1.1 vendor variant) — Stock badge for the vendor's own
	 * product listing. Mirrors the marketplace's `stockLabel` so vendors see
	 * the same numbers their customers see, with a red "Out of stock" state
	 * when atomic stock decrement on the backend has zeroed the counter.
	 */
	function stockBadge(product: any): { label: string; tone: 'ok' | 'warn' | 'out' } | null {
		if (product?.unlimited) return { label: 'Unlimited', tone: 'ok' };
		const qty = Number(product?.stockQuantity ?? 0);
		if (Number.isNaN(qty)) return null;
		if (qty === 0) return { label: 'Out of stock', tone: 'out' };
		if (qty < 10) return { label: `${qty} left`, tone: 'warn' };
		return { label: `${qty} in stock`, tone: 'ok' };
	}

	function timeAgo(dateStr: string) {
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		const days = Math.floor(hrs / 24);
		return `${days}d ago`;
	}
</script>

<div class="w-full text-[#101828]">
	<!-- Header -->
	<div class="mb-6 flex flex-col gap-4 rounded-2xl border border-white/85 bg-white/80 p-4 shadow-[0_1px_3px_rgba(19,21,23,0.04)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-5">
		<div class="flex items-center gap-3.5">
			{#if logoUrl}
				<img src={logoUrl} alt="logo" class="h-10 w-10 rounded-2xl object-cover ring-1 ring-black/8 shadow-xs" />
			{:else}
				<div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] text-white shadow-xs ring-1 ring-white/40">
					<Icon icon="solar:shop-2-bold-duotone" class="h-5 w-5" />
				</div>
			{/if}
			<div>
				<p class="text-[11px] font-semibold tracking-wider text-[#6E6B7B] uppercase">Catalog</p>
				<h1 class="text-xl font-bold tracking-tight text-[#17161E] sm:text-2xl">{vendorName}</h1>
			</div>
		</div>

		<div class="flex flex-wrap items-center gap-2.5">
			<button
				on:click={() => { editingProduct = null; showModal = true; }}
				class="inline-flex items-center gap-2 rounded-full bg-[#17161E] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#2A2836] active:scale-[0.98]"
			>
				<Icon icon="mdi:plus" class="h-4 w-4" />
				Add New Product / Service
			</button>
			<div class="inline-flex rounded-full border border-black/8 bg-white/75 p-0.5 backdrop-blur-sm">
				<button
					class="rounded-full p-2 transition-all {viewMode === 'grid' ? 'bg-[#17161E] text-white shadow-xs' : 'text-[#6E6B7B] hover:text-[#17161E]'}"
					on:click={() => (viewMode = 'grid')}
					aria-label="Grid view"
				>
					<Icon icon="mdi:view-grid-outline" class="h-4 w-4" />
				</button>
				<button
					class="rounded-full p-2 transition-all {viewMode === 'list' ? 'bg-[#17161E] text-white shadow-xs' : 'text-[#6E6B7B] hover:text-[#17161E]'}"
					on:click={() => (viewMode = 'list')}
					aria-label="List view"
				>
					<Icon icon="mdi:view-list-outline" class="h-4 w-4" />
				</button>
			</div>
		</div>
	</div>

	<!-- Title + Filters -->
	<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<h2 class="text-lg font-bold tracking-tight text-[#17161E]">My Products & Services</h2>
		<div class="flex flex-wrap items-center gap-2">
			<!-- Search -->
			<div class="relative flex h-9 w-full items-center rounded-full border border-black/8 bg-white/85 shadow-[0_1px_2px_rgba(19,21,23,0.03)] backdrop-blur-sm transition focus-within:border-black/20 sm:w-60">
				<img class="absolute left-3.5 h-3.5 w-3.5 opacity-60" alt="search" src="/search.svg" />
				<input
					type="text"
					placeholder="Search products..."
					bind:value={searchQuery}
					on:input={handleSearch}
					class="w-full bg-transparent py-2 pr-3.5 pl-9 text-xs text-[#17161E] placeholder:text-[#8E8B99] focus:outline-none"
				/>
			</div>
			<!-- Status Filter -->
			<div class="relative">
				<button
					on:click={() => (showStatusDropdown = !showStatusDropdown)}
					class="flex h-9 items-center gap-2 rounded-full border border-black/8 bg-white/85 px-3.5 text-xs font-medium text-[#3B3846] shadow-[0_1px_2px_rgba(19,21,23,0.03)] backdrop-blur-sm transition hover:bg-white"
				>
					<Icon icon="mdi:filter-variant" class="h-3.5 w-3.5 text-[#6E6B7B]" />
					{statusFilter ? statusOptions.find(s => s.value === statusFilter)?.label : 'Status'}
					<Icon icon="mdi:chevron-down" class="h-3.5 w-3.5 text-[#6E6B7B]" />
				</button>
				{#if showStatusDropdown}
					<button class="fixed inset-0 z-40 cursor-default" on:click={() => (showStatusDropdown = false)} aria-label="Close dropdown"></button>
					<div class="absolute left-0 z-50 mt-1.5 w-44 rounded-2xl border border-white/90 bg-white/95 p-1.5 shadow-xl backdrop-blur-xl sm:left-auto sm:right-0">
						{#each statusOptions as opt}
							<button
								on:click={() => selectStatus(opt.value)}
								class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs transition hover:bg-black/5 {statusFilter === opt.value ? 'bg-black/5 font-semibold text-[#17161E]' : 'text-[#3B3846]'}"
							>
								{#if opt.value}
									<span class="h-2 w-2 rounded-full {statusStyles[opt.value]?.split(' ')[0] || 'bg-gray-200'}"></span>
								{/if}
								{opt.label}
								{#if statusFilter === opt.value}
									<Icon icon="mdi:check" class="ml-auto h-3.5 w-3.5 text-[#17161E]" />
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Content -->
	{#if loading}
		<!-- Skeleton Loader -->
		<div class="animate-pulse">
			{#if viewMode === 'grid'}
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each [1, 2, 3, 4, 5, 6] as _}
						<div class="rounded-2xl border border-white/85 bg-white/75 p-3.5 backdrop-blur-md">
							<div class="mb-3 h-[180px] rounded-xl bg-black/8"></div>
							<div class="mb-2 h-4 w-3/4 rounded bg-black/8"></div>
							<div class="mb-2 h-3 w-1/2 rounded bg-black/5"></div>
							<div class="h-3 w-1/3 rounded bg-black/5"></div>
							<div class="mt-3 flex gap-2">
								<div class="h-7 w-16 rounded-full bg-black/8"></div>
								<div class="h-7 w-14 rounded-full bg-black/8"></div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="space-y-3">
					{#each [1, 2, 3, 4] as _}
						<div class="flex items-center gap-4 rounded-2xl border border-white/85 bg-white/75 p-4 backdrop-blur-md">
							<div class="h-20 w-20 shrink-0 rounded-xl bg-black/8"></div>
							<div class="flex-1">
								<div class="mb-2 h-4 w-1/2 rounded bg-black/8"></div>
								<div class="mb-2 h-3 w-1/3 rounded bg-black/5"></div>
								<div class="h-3 w-1/4 rounded bg-black/5"></div>
							</div>
							<div class="h-7 w-20 rounded-full bg-black/8"></div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

	{:else if products.length === 0}
		<!-- Empty State -->
		<div class="flex flex-col items-center justify-center rounded-3xl border border-white/85 bg-white/80 py-16 text-center shadow-[0_1px_3px_rgba(19,21,23,0.04)] backdrop-blur-md">
			<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#8B5CF6]/10 text-[#7C3AED]">
				<Icon icon="mdi:package-variant-closed-plus" class="h-8 w-8" />
			</div>
			<h3 class="mb-1 text-base font-bold text-[#17161E]">No Products or Services yet</h3>
			<p class="mb-6 max-w-[280px] text-xs leading-relaxed text-[#6E6B7B]">
				Start showcasing your offerings to event organizers. Add your first product or service to get discovered.
			</p>
			<button
				on:click={() => { editingProduct = null; showModal = true; }}
				class="inline-flex items-center gap-2 rounded-full bg-[#17161E] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#2A2836] active:scale-[0.98]"
			>
				<Icon icon="mdi:plus" class="h-4 w-4" />
				Add Your First Product / Service
			</button>
		</div>

	{:else}
		<!-- Grid View -->
		{#if viewMode === 'grid'}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each products as product (product._id)}
					<div class="group relative rounded-2xl border border-white/85 bg-white/88 p-3.5 shadow-[0_1px_3px_rgba(19,21,23,0.04)] backdrop-blur-md transition-all hover:shadow-md">
						<!-- Image -->
						<div class="relative mb-3 h-[180px] overflow-hidden rounded-xl bg-black/5">
							{#if product.media?.[0]?.url}
								<img src={product.media[0].url} alt={product.productName} class="h-full w-full object-cover" />
							{:else}
								<div class="flex h-full w-full items-center justify-center">
									<Icon icon="mdi:image-outline" class="h-12 w-12 text-gray-300" />
								</div>
							{/if}
							<span class="absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium {statusStyles[product.status] || 'bg-gray-100 text-gray-600'}">
								{product.status}
							</span>
						</div>

						<!-- Text -->
						<h3 class="text-sm font-semibold leading-tight text-gray-900 line-clamp-2">{product.productName}</h3>
						<p class="mt-1 text-xs text-gray-500 line-clamp-1">{product.description || ''}</p>
						<div class="mt-1 flex items-center gap-2">
							<span class="text-sm font-bold text-gray-900">{formatPrice(product)}</span>
							{#if product.createdAt}
								<span class="text-[10px] text-gray-400">{timeAgo(product.createdAt)}</span>
							{/if}
							{#if stockBadge(product)}
								{@const sb = stockBadge(product)}
								<span class="ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium {sb.tone === 'out' ? 'bg-red-100 text-red-700' : sb.tone === 'warn' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}">
									{sb.label}
								</span>
							{/if}
						</div>

						<!-- Actions -->
						<div class="mt-3 flex items-center gap-2">
							<button on:click={() => handleView(product)} class="flex items-center gap-1 rounded-md bg-black px-3 py-1.5 text-[10px] font-bold text-white">
								<Icon icon="mdi:eye-outline" class="h-3 w-3" /> View
							</button>
							<button on:click={() => handleEdit(product)} class="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-50">
								<Icon icon="mdi:pencil-outline" class="h-3 w-3" /> Edit
							</button>
							{#if vendorProfileSlug && product.slug && product.isPublic}
								<a href="/v/{vendorProfileSlug}/{product.slug}" target="_blank" rel="noopener noreferrer"
									class="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1.5 text-[10px] font-bold text-[#5D646F] hover:bg-gray-50">
									<Icon icon="mdi:open-in-new" class="h-3 w-3" />
								</a>
							{/if}
							<div class="relative ml-auto">
								<button on:click={() => (showActionMenu = showActionMenu === product._id ? null : product._id)} class="rounded p-1 hover:bg-gray-100">
									<Icon icon="mdi:dots-horizontal" class="h-4 w-4 text-gray-400" />
								</button>
								{#if showActionMenu === product._id}
									<button class="fixed inset-0 z-40 cursor-default" on:click={() => (showActionMenu = null)} aria-label="Close menu"></button>
									<div class="absolute right-0 bottom-full z-50 mb-1 w-36 rounded-lg border bg-white p-1 shadow-lg">
										<button on:click={() => promptDuplicate(product)} class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-gray-50">
											<Icon icon="mdi:content-duplicate" class="h-3.5 w-3.5 text-gray-500" /> Duplicate
										</button>
										<button on:click={() => promptDelete(product)} class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-red-500 hover:bg-red-50">
											<Icon icon="mdi:trash-can-outline" class="h-3.5 w-3.5" /> Delete
										</button>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>

		{:else}
			<!-- List View -->
			<div class="space-y-3">
				{#each products as product (product._id)}
					<div class="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
						<!-- Image -->
						<div class="relative h-24 w-full shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-20 sm:w-20">
							{#if product.media?.[0]?.url}
								<img src={product.media[0].url} alt={product.productName} class="h-full w-full object-cover" />
							{:else}
								<div class="flex h-full w-full items-center justify-center">
									<Icon icon="mdi:image-outline" class="h-8 w-8 text-gray-300" />
								</div>
							{/if}
							<span class="absolute right-1 top-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium sm:hidden {statusStyles[product.status] || 'bg-gray-100 text-gray-600'}">
								{product.status}
							</span>
						</div>

						<!-- Info -->
						<div class="flex-1 min-w-0">
							<h3 class="text-sm font-semibold text-gray-900 truncate">{product.productName}</h3>
							<p class="text-xs text-gray-500 truncate">{product.description || ''}</p>
							<div class="mt-1 flex items-center gap-2">
								<span class="text-sm font-bold text-gray-900">{formatPrice(product)}</span>
								<span class="hidden rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline {statusStyles[product.status] || 'bg-gray-100 text-gray-600'}">
									{product.status}
								</span>
								{#if product.createdAt}
									<span class="text-[10px] text-gray-400">{timeAgo(product.createdAt)}</span>
								{/if}
								{#if stockBadge(product)}
									{@const sb = stockBadge(product)}
									<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {sb.tone === 'out' ? 'bg-red-100 text-red-700' : sb.tone === 'warn' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}">
										{sb.label}
									</span>
								{/if}
							</div>
						</div>

						<!-- Actions -->
						<div class="flex items-center gap-2 shrink-0">
							<button on:click={() => handleView(product)} class="flex items-center gap-1 rounded-md bg-black px-3 py-1.5 text-[10px] font-bold text-white">
								<Icon icon="mdi:eye-outline" class="h-3 w-3" /> View
							</button>
							<button on:click={() => handleEdit(product)} class="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-50">
								<Icon icon="mdi:pencil-outline" class="h-3 w-3" /> Edit
							</button>
							<div class="relative">
								<button on:click={() => (showActionMenu = showActionMenu === product._id ? null : product._id)} class="rounded p-1 hover:bg-gray-100">
									<Icon icon="mdi:dots-horizontal" class="h-4 w-4 text-gray-400" />
								</button>
								{#if showActionMenu === product._id}
									<button class="fixed inset-0 z-40 cursor-default" on:click={() => (showActionMenu = null)} aria-label="Close menu"></button>
									<div class="absolute right-0 bottom-full z-50 mb-1 w-36 rounded-lg border bg-white p-1 shadow-lg">
										<button on:click={() => promptDuplicate(product)} class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-gray-50">
											<Icon icon="mdi:content-duplicate" class="h-3.5 w-3.5 text-gray-500" /> Duplicate
										</button>
										<button on:click={() => promptDelete(product)} class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-red-500 hover:bg-red-50">
											<Icon icon="mdi:trash-can-outline" class="h-3.5 w-3.5" /> Delete
										</button>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<!-- Add/Edit Product Modal -->
<AddProductModal bind:show={showModal} editProduct={editingProduct} onSuccess={handleProductSuccess} />

<!-- View Product Modal -->
<ViewProductModal bind:open={showViewModal} product={viewingProduct} onEdit={handleEdit} />

<!-- Delete Confirmation Modal -->
<ConfirmActionModal
	bind:show={showDeleteConfirm}
	title="Delete Product"
	message="Are you sure you want to delete &quot;{deleteTargetProduct?.productName || 'this product'}&quot;? This will permanently remove the product and all associated files. This action cannot be undone."
	confirmLabel={deleting ? 'Deleting...' : 'Delete Product'}
	confirmColor="red"
	icon="mdi:trash-can-outline"
	iconColor="text-red-500"
	loading={deleting}
	onConfirm={confirmDelete}
	onCancel={() => { deleteTargetProduct = null; }}
/>

<!-- Duplicate Confirmation Modal -->
<ConfirmActionModal
	bind:show={showDuplicateConfirm}
	title="Duplicate Product"
	message="This will create a copy of &quot;{duplicateTargetProduct?.productName || 'this product'}&quot; with all basic information. Transaction and sales data will not be copied. The duplicate will be created as a draft."
	confirmLabel={duplicating ? 'Duplicating...' : 'Duplicate Product'}
	confirmColor="black"
	icon="mdi:content-duplicate"
	iconColor="text-gray-600"
	loading={duplicating}
	onConfirm={confirmDuplicate}
	onCancel={() => { duplicateTargetProduct = null; }}
/>
