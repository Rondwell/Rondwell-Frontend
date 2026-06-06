<script lang="ts">
	import { page } from '$app/stores';
	import { getPublicVendorProduct } from '$lib/services/vendor.services';
	import { formatMoney, majorToKobo } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	export let data: any;
	$: seo = data?.seo;
	$: vendorSlug = $page.params.slug;
	$: productSlug = $page.params.productSlug;

	let loading = true;
	let notFound = false;
	let vendor: any = null;
	let product: any = null;
	let selectedMediaIndex = 0;

	onMount(async () => {
		if (!vendorSlug || !productSlug) { notFound = true; loading = false; return; }
		try {
			const result = await getPublicVendorProduct(vendorSlug, productSlug);
			vendor = result.vendor;
			product = result.product;
		} catch { notFound = true; }
		finally { loading = false; }
	});

	$: mediaItems = product?.media || [];
	$: selectedMedia = mediaItems[selectedMediaIndex] || null;
</script>

<svelte:head>
	{#if seo}
		<title>{seo.title}</title>
		<meta name="description" content={seo.description} />
		<meta property="og:title" content={seo.title} />
		<meta property="og:description" content={seo.description} />
		<meta property="og:image" content={seo.image} />
		<meta property="og:url" content={seo.url} />
		<meta property="og:type" content="product" />
		<meta property="og:site_name" content="Rondwell" />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content={seo.title} />
		<meta name="twitter:description" content={seo.description} />
		<meta name="twitter:image" content={seo.image} />
		<link rel="canonical" href={seo.url} />
		{#if seo.jsonLd}
			{@html `<script type="application/ld+json">${JSON.stringify(seo.jsonLd)}</script>`}
		{/if}
	{/if}
</svelte:head>

{#if loading}
	<div class="flex min-h-screen items-center justify-center bg-[#F4F5F6]">
		<div class="flex flex-col items-center gap-4">
			<div class="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#513BE2]"></div>
			<p class="text-sm text-gray-400">Loading product</p>
		</div>
	</div>
{:else if notFound}
	<div class="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
		<p class="text-5xl">📦</p>
		<h1 class="text-2xl font-semibold text-gray-900">Product Not Found</h1>
		<p class="text-sm text-gray-500">The product you're looking for doesn't exist or has been removed.</p>
		<a href="/v/{vendorSlug}" class="mt-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
			Back to Vendor
		</a>
	</div>
{:else}
	<div class="min-h-screen bg-[#F4F5F6]">
		<div class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
			<!-- Breadcrumb -->
			<nav class="mb-6 flex items-center gap-2 text-sm text-gray-500">
				<a href="/discover?tab=vendors" class="hover:text-gray-700">Discover</a>
				<span>/</span>
				<a href="/v/{vendorSlug}" class="hover:text-gray-700">{vendor?.businessName || vendor?.name || 'Vendor'}</a>
				<span>/</span>
				<span class="text-gray-900">{product.productName}</span>
			</nav>

			<div class="grid gap-8 lg:grid-cols-2">
				<!-- Media Gallery -->
				<div>
					<div class="overflow-hidden rounded-2xl bg-white">
						{#if selectedMedia}
							{#if selectedMedia.type === 'VIDEO'}
								<video src={selectedMedia.url} controls class="h-80 w-full object-cover" />
							{:else}
								<img src={selectedMedia.url} alt={product.productName} class="h-80 w-full object-cover" />
							{/if}
						{:else}
							<div class="flex h-80 w-full items-center justify-center bg-gray-50">
								<svg width="64" height="64" viewBox="0 0 24 24" fill="none">
									<path d="M3.17 7.44L12 12.55L20.77 7.47" stroke="#D1D5DB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M12 21.61V12.54" stroke="#D1D5DB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							</div>
						{/if}
					</div>
					{#if mediaItems.length > 1}
						<div class="mt-3 flex gap-2 overflow-x-auto">
							{#each mediaItems as media, i}
								<button on:click={() => (selectedMediaIndex = i)}
									class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition {i === selectedMediaIndex ? 'border-[#513BE2]' : 'border-transparent'}">
									<img src={media.url} alt="" class="h-full w-full object-cover" />
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Product Details -->
				<div>
					<h1 class="text-2xl font-bold text-gray-900">{product.productName}</h1>

					<!-- Vendor link -->
					<a href="/v/{vendorSlug}" class="mt-2 flex items-center gap-2 text-sm text-gray-500 hover:text-[#513BE2]">
						{#if vendor?.logoUrl || vendor?.profilePictureUrl}
							<img src={vendor.logoUrl || vendor.profilePictureUrl} alt="" class="h-5 w-5 rounded-full object-cover" />
						{/if}
						By {vendor?.businessName || vendor?.name}
					</a>

					<!-- Price -->
					{#if product.price}
						<p class="mt-4 text-2xl font-bold text-[#513BE2]">
							{formatMoney(majorToKobo(Number(product.price?.$numberDecimal || product.price), product.currency || 'USD'), product.currency || 'USD')}
							{#if product.pricingType && product.pricingType !== 'FIXED'}
								<span class="text-sm font-normal text-gray-400">/ {product.pricingType.toLowerCase()}</span>
							{/if}
						</p>
					{:else if product.pricingType === 'CUSTOM_QUOTE'}
						<p class="mt-4 text-lg font-semibold text-gray-700">Custom Quote</p>
					{/if}

					<!-- Description -->
					<div class="mt-6">
						<h2 class="text-sm font-medium text-gray-900">Description</h2>
						<p class="mt-2 text-sm leading-relaxed text-gray-600">{product.description}</p>
					</div>

					<!-- Packages -->
					{#if product.packages?.length > 0}
						<div class="mt-6">
							<h2 class="text-sm font-medium text-gray-900">Packages</h2>
							<div class="mt-2 space-y-2">
								{#each product.packages as pkg}
									<div class="rounded-xl border border-gray-100 bg-white p-4">
										<div class="flex items-center justify-between">
											<p class="text-sm font-semibold text-gray-900">{pkg.packageName}</p>
											<p class="text-sm font-bold text-[#513BE2]">
												{formatMoney(majorToKobo(Number(pkg.packagePrice?.$numberDecimal || pkg.packagePrice), pkg.packageCurrency || 'USD'), pkg.packageCurrency || 'USD')}
											</p>
										</div>
										{#if pkg.packageInclusions}
											<p class="mt-1 text-xs text-gray-500">{pkg.packageInclusions}</p>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Add-ons -->
					{#if product.addOns?.length > 0}
						<div class="mt-6">
							<h2 class="text-sm font-medium text-gray-900">Add-ons</h2>
							<div class="mt-2 flex flex-wrap gap-2">
								{#each product.addOns as addon}
									<span class="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-700">
										{addon.name} — {formatMoney(majorToKobo(Number(addon.price?.$numberDecimal || addon.price), addon.currency || 'USD'), addon.currency || 'USD')}
									</span>
								{/each}
							</div>
						</div>
					{/if}

					<!-- CTA -->
					<div class="mt-8">
						{#if vendor?.contactInfo?.email}
							<a href="mailto:{vendor.contactInfo.email}?subject=Inquiry about {product.productName}"
								class="inline-flex items-center gap-2 rounded-lg bg-[#513BE2] px-8 py-3 text-sm font-medium text-white transition hover:bg-[#4030c0]">
								<Icon icon="mdi:email-outline" class="h-4 w-4" />
								Request Quote
							</a>
						{/if}
					</div>

					<!-- Terms -->
					{#if product.termsConditions}
						<div class="mt-6 rounded-xl bg-gray-50 p-4">
							<h3 class="text-xs font-medium text-gray-400 uppercase">Terms & Conditions</h3>
							<p class="mt-1 text-xs text-gray-500">{product.termsConditions}</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
