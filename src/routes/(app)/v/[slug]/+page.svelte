<script lang="ts">
	import { page } from '$app/stores';
	import { getPublicVendorBySlug } from '$lib/services/vendor.services';
	import { formatMoney, majorToKobo } from '$lib/utils/money';
	import Seo from '$lib/components/Seo.svelte';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	export let data: any;
	$: seo = data?.seo;
	$: slug = $page.params.slug;

	let loading = true;
	let notFound = false;
	let vendor: any = null;
	let products: any[] = [];
	let searchQuery = '';
	let activeTab: 'products' | 'about' = 'products';

	const socialIconMap: Record<string, string> = {
		instagram: 'mdi:instagram', twitter: 'ri:twitter-x-fill', x: 'ri:twitter-x-fill',
		youtube: 'mdi:youtube', tiktok: 'ic:baseline-tiktok', linkedin: 'mdi:linkedin', website: 'mdi:web',
	};

	onMount(async () => {
		if (!slug) { notFound = true; loading = false; return; }
		try {
			const result = await getPublicVendorBySlug(slug);
			vendor = result.vendor;
			products = result.products || [];
		} catch { notFound = true; }
		finally { loading = false; }
	});

	$: filteredProducts = products.filter((p: any) => {
		if (!searchQuery) return true;
		const q = searchQuery.toLowerCase();
		return (p.productName ?? '').toLowerCase().includes(q) ||
			(p.description ?? '').toLowerCase().includes(q);
	});
</script>

<Seo {seo} />

{#if loading}
	<div class="flex min-h-screen items-center justify-center bg-[#F4F5F6]">
		<div class="flex flex-col items-center gap-5">
			<div class="relative">
				<div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-50">
					<svg width="36" height="36" viewBox="0 0 24 24" fill="none" class="animate-bounce">
						<path d="M3.01 11.22V15.71C3.01 20.2 4.81 22 9.3 22H14.69C19.18 22 20.98 20.2 20.98 15.71V11.22" stroke="#513BE2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M12 12C13.83 12 15.18 10.51 15 8.68L14.34 2H9.67L9 8.68C8.82 10.51 10.17 12 12 12Z" stroke="#513BE2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M18.31 12C20.33 12 21.81 10.36 21.61 8.35L21.33 5.6C20.97 3 19.97 2 17.35 2H14.3L15 9.01C15.17 10.66 16.66 12 18.31 12Z" stroke="#8B3AD4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M5.64 12C7.29 12 8.78 10.66 8.94 9.01L9.16 6.8L9.64 2H6.59C3.97 2 2.97 3 2.61 5.6L2.34 8.35C2.14 10.36 3.62 12 5.64 12Z" stroke="#8B3AD4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</div>
				<div class="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-[#513BE2] opacity-60 animate-ping"></div>
			</div>
			<div class="flex items-center gap-2">
				<span class="inline-block h-2 w-2 rounded-full bg-[#513BE2] animate-[pulse-dot_1.6s_ease-in-out_infinite]"></span>
				<span class="inline-block h-2 w-2 rounded-full bg-[#8B3AD4] animate-[pulse-dot_1.6s_ease-in-out_0.2s_infinite]"></span>
				<span class="inline-block h-2 w-2 rounded-full bg-[#DB3EC6] animate-[pulse-dot_1.6s_ease-in-out_0.4s_infinite]"></span>
			</div>
			<p class="text-sm text-gray-400">Loading vendor</p>
		</div>
	</div>
{:else if notFound}
	<div class="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
		<p class="text-5xl">🏪</p>
		<h1 class="text-2xl font-semibold text-gray-900">Vendor Not Found</h1>
		<p class="text-sm text-gray-500">The vendor you're looking for doesn't exist or has been removed.</p>
		<a href="/discover?tab=vendors" class="mt-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
			Discover Vendors
		</a>
	</div>
{:else}
	<div class="min-h-screen bg-[#F4F5F6]">
		<!-- COVER BANNER -->
		<div class="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
			<div class="relative">
				<div class="overflow-hidden rounded-2xl bg-gray-100">
					<div class="h-48 w-full sm:h-56 md:h-64">
						{#if vendor.coverImageUrl}
							<img src={vendor.coverImageUrl} alt="Cover" class="h-full w-full object-cover" />
						{:else}
							<div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
								<svg width="64" height="64" viewBox="0 0 24 24" fill="none" opacity="0.3">
									<path d="M3.01 11.22V15.71C3.01 20.2 4.81 22 9.3 22H14.69C19.18 22 20.98 20.2 20.98 15.71V11.22" stroke="#513BE2" stroke-width="1.5"/>
								</svg>
							</div>
						{/if}
					</div>
				</div>
				<!-- Logo -->
				<div class="absolute bottom-0 left-6 translate-y-1/2 sm:left-8">
					<div class="h-20 w-20 overflow-hidden rounded-2xl border-4 border-[#F4F5F6] bg-white shadow-lg sm:h-24 sm:w-24">
						{#if vendor.logoUrl || vendor.profilePictureUrl}
							<img src={vendor.logoUrl || vendor.profilePictureUrl} alt={vendor.businessName} class="h-full w-full object-cover" />
						{:else}
							<div class="flex h-full w-full items-center justify-center bg-gray-50 text-2xl font-bold text-gray-300">
								{(vendor.businessName || vendor.name || '?')[0].toUpperCase()}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- HEADER -->
		<div class="mx-auto max-w-5xl px-4 sm:px-6">
			<div class="mt-14 flex flex-col gap-4 sm:mt-16 sm:flex-row sm:items-start sm:justify-between">
				<div class="flex-1">
					<h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">{vendor.businessName || vendor.name}</h1>
					<div class="mt-1 flex flex-wrap items-center gap-3">
						{#if vendor.businessType}
							<span class="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">{vendor.businessType}</span>
						{/if}
						{#if vendor.businessLocation}
							<span class="flex items-center gap-1 text-sm text-gray-500">
								<Icon icon="mdi:map-marker-outline" class="h-4 w-4" />
								{vendor.businessLocation}
							</span>
						{/if}
						<span class="text-sm text-gray-400">{products.length} product{products.length !== 1 ? 's' : ''}</span>
					</div>
					{#if vendor.socialLinks}
						{@const links = Object.entries(vendor.socialLinks).filter(([, v]) => v)}
						{#if links.length > 0}
							<div class="mt-3 flex flex-wrap items-center gap-2">
								{#each links as [key, value]}
									<a href={key === 'website' ? String(value) : `https://${key === 'twitter' || key === 'x' ? 'x.com' : key + '.com'}/${value}`}
										target="_blank" rel="noopener noreferrer"
										class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition hover:bg-gray-200">
										<Icon icon={socialIconMap[key] ?? 'mdi:link'} class="h-4 w-4 text-gray-600" />
									</a>
								{/each}
							</div>
						{/if}
					{/if}
				</div>
				{#if vendor.contactInfo?.email}
					<a href="mailto:{vendor.contactInfo.email}"
						class="w-fit rounded-lg bg-[#513BE2] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#4030c0]">
						Contact Vendor
					</a>
				{/if}
			</div>

			<!-- ABOUT -->
			{#if vendor.businessDescription || vendor.bio}
				<div class="mt-5 rounded-2xl bg-white p-5">
					<h2 class="mb-2 text-base font-medium text-gray-900">About</h2>
					<p class="text-sm leading-relaxed text-gray-600">{vendor.businessDescription || vendor.bio}</p>
				</div>
			{/if}

			<!-- TABS -->
			<div class="mt-6 flex gap-1 border-b border-gray-200">
				<button on:click={() => (activeTab = 'products')}
					class="relative px-5 py-3 text-sm font-medium transition {activeTab === 'products' ? 'text-gray-900' : 'text-gray-500'}">
					Products & Services
					{#if activeTab === 'products'}<div class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#513BE2]"></div>{/if}
				</button>
				<button on:click={() => (activeTab = 'about')}
					class="relative px-5 py-3 text-sm font-medium transition {activeTab === 'about' ? 'text-gray-900' : 'text-gray-500'}">
					Details
					{#if activeTab === 'about'}<div class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#513BE2]"></div>{/if}
				</button>
			</div>

			{#if activeTab === 'products'}
				<div class="mt-6">
					<!-- Search -->
					<div class="relative mb-6 w-full max-w-xs">
						<svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none">
							<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.5"/>
							<path d="M20 20l-3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
						</svg>
						<input type="text" bind:value={searchQuery}
							placeholder="Search products..."
							class="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#513BE2]" />
					</div>

					<!-- Products Grid -->
					<div class="pb-16">
						{#if filteredProducts.length === 0}
							<div class="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white py-20">
								<svg width="64" height="64" viewBox="0 0 24 24" fill="none">
									<path d="M3.17 7.44L12 12.55L20.77 7.47" stroke="#D1D5DB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M12 21.61V12.54" stroke="#D1D5DB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M9.93 2.48L4.59 5.44C3.38 6.11 2.39 7.79 2.39 9.17V14.82C2.39 16.2 3.38 17.88 4.59 18.55L9.93 21.52C11.07 22.15 12.94 22.15 14.08 21.52L19.42 18.55C20.63 17.88 21.62 16.2 21.62 14.82V9.17C21.62 7.79 20.63 6.11 19.42 5.44L14.08 2.47C12.93 1.84 11.07 1.84 9.93 2.48Z" stroke="#D1D5DB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<p class="text-lg font-medium text-gray-900">No products found</p>
								<p class="text-sm text-gray-500">
									{searchQuery ? 'Try a different search term' : 'This vendor hasn\'t listed any products yet.'}
								</p>
							</div>
						{:else}
							<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{#each filteredProducts as product (product._id)}
									<a href="/v/{slug}/{product.slug}"
										class="group flex flex-col overflow-hidden rounded-2xl bg-white no-underline transition-shadow hover:shadow-md">
										<!-- Product Image -->
										<div class="relative h-44 w-full overflow-hidden">
											{#if product.media?.[0]?.url}
												<img src={product.media[0].url} alt={product.productName}
													class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
											{:else}
												<div class="flex h-full w-full items-center justify-center bg-gray-50">
													<svg width="40" height="40" viewBox="0 0 24 24" fill="none">
														<path d="M3.17 7.44L12 12.55L20.77 7.47" stroke="#D1D5DB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
														<path d="M12 21.61V12.54" stroke="#D1D5DB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
													</svg>
												</div>
											{/if}
											{#if product.pricingType}
												<div class="absolute top-2 right-2 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-medium text-gray-700">
													{product.pricingType === 'CUSTOM_QUOTE' ? 'Custom Quote' : product.pricingType}
												</div>
											{/if}
										</div>
										<!-- Product Info -->
										<div class="flex flex-1 flex-col p-4">
											<h3 class="text-sm font-semibold text-gray-900 line-clamp-1">{product.productName}</h3>
											<p class="mt-1 text-xs text-gray-500 line-clamp-2">{product.description}</p>
											{#if product.price}
												<p class="mt-auto pt-3 text-sm font-bold text-[#513BE2]">
													{formatMoney(majorToKobo(Number(product.price?.$numberDecimal || product.price), product.currency || 'USD'), product.currency || 'USD')}
												</p>
											{/if}
										</div>
									</a>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{:else}
				<!-- DETAILS TAB -->
				<div class="mt-6 pb-16">
					<div class="rounded-2xl bg-white p-6">
						<div class="grid gap-6 sm:grid-cols-2">
							{#if vendor.businessType}
								<div>
									<p class="text-xs font-medium text-gray-400 uppercase">Business Type</p>
									<p class="mt-1 text-sm text-gray-900">{vendor.businessType}</p>
								</div>
							{/if}
							{#if vendor.businessLocation}
								<div>
									<p class="text-xs font-medium text-gray-400 uppercase">Location</p>
									<p class="mt-1 text-sm text-gray-900">{vendor.businessLocation}</p>
								</div>
							{/if}
							{#if vendor.contactInfo?.email}
								<div>
									<p class="text-xs font-medium text-gray-400 uppercase">Email</p>
									<a href="mailto:{vendor.contactInfo.email}" class="mt-1 text-sm text-[#513BE2]">{vendor.contactInfo.email}</a>
								</div>
							{/if}
							{#if vendor.contactInfo?.phone}
								<div>
									<p class="text-xs font-medium text-gray-400 uppercase">Phone</p>
									<p class="mt-1 text-sm text-gray-900">{vendor.contactInfo.phone}</p>
								</div>
							{/if}
							{#if vendor.contactInfo?.website}
								<div>
									<p class="text-xs font-medium text-gray-400 uppercase">Website</p>
									<a href={vendor.contactInfo.website} target="_blank" rel="noopener noreferrer" class="mt-1 text-sm text-[#513BE2]">{vendor.contactInfo.website}</a>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	@keyframes pulse-dot {
		0%, 100% { opacity: 0.3; transform: scale(1); }
		50% { opacity: 1; transform: scale(1.4); }
	}
	.line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
	.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
