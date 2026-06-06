<script lang="ts">
	import { page } from '$app/stores';
	import { getPublicExhibitorBooth } from '$lib/services/exhibitor.public.services';
	import { formatMoney, majorToKobo } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	export let data: any;
	$: seo = data?.seo;
	$: exhibitorSlug = $page.params.slug;
	$: boothSlug = $page.params.boothSlug;

	let loading = true;
	let notFound = false;
	let exhibitor: any = null;
	let booth: any = null;
	let selectedMediaIndex = 0;

	onMount(async () => {
		if (!exhibitorSlug || !boothSlug) { notFound = true; loading = false; return; }
		try {
			const result = await getPublicExhibitorBooth(exhibitorSlug, boothSlug);
			exhibitor = result.exhibitor;
			booth = result.booth;
		} catch { notFound = true; }
		finally { loading = false; }
	});

	$: mediaItems = booth?.media || [];
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
		<meta property="og:type" content="website" />
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
			<p class="text-sm text-gray-400">Loading booth</p>
		</div>
	</div>
{:else if notFound}
	<div class="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
		<p class="text-5xl">🏢</p>
		<h1 class="text-2xl font-semibold text-gray-900">Booth Not Found</h1>
		<p class="text-sm text-gray-500">The booth you're looking for doesn't exist or has been removed.</p>
		<a href="/x/{exhibitorSlug}" class="mt-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
			Back to Exhibitor
		</a>
	</div>
{:else}
	<div class="min-h-screen bg-[#F4F5F6]">
		<div class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
			<!-- Breadcrumb -->
			<nav class="mb-6 flex items-center gap-2 text-sm text-gray-500">
				<a href="/discover?tab=exhibitors" class="hover:text-gray-700">Discover</a>
				<span>/</span>
				<a href="/x/{exhibitorSlug}" class="hover:text-gray-700">{exhibitor?.companyName || exhibitor?.name || 'Exhibitor'}</a>
				<span>/</span>
				<span class="text-gray-900">{booth.title}</span>
			</nav>

			<!-- Banner -->
			{#if booth.bannerUrl}
				<div class="mb-8 overflow-hidden rounded-2xl">
					<img src={booth.bannerUrl} alt={booth.title} class="h-64 w-full object-cover" />
				</div>
			{/if}

			<div class="grid gap-8 lg:grid-cols-3">
				<!-- Main Content (2 cols) -->
				<div class="lg:col-span-2">
					<h1 class="text-2xl font-bold text-gray-900">{booth.title}</h1>

					<!-- Exhibitor link -->
					<a href="/x/{exhibitorSlug}" class="mt-2 flex items-center gap-2 text-sm text-gray-500 hover:text-[#513BE2]">
						{#if exhibitor?.logoUrl || exhibitor?.profilePictureUrl}
							<img src={exhibitor.logoUrl || exhibitor.profilePictureUrl} alt="" class="h-5 w-5 rounded-full object-cover" />
						{/if}
						By {exhibitor?.companyName || exhibitor?.name}
					</a>

					<!-- Description -->
					<div class="mt-6">
						<h2 class="text-sm font-medium text-gray-900">About this Booth</h2>
						<p class="mt-2 text-sm leading-relaxed text-gray-600">{booth.description}</p>
					</div>

					<!-- Media Gallery -->
					{#if mediaItems.length > 0}
						<div class="mt-8">
							<h2 class="mb-3 text-sm font-medium text-gray-900">Gallery</h2>
							<div class="overflow-hidden rounded-2xl bg-white">
								{#if selectedMedia}
									{#if selectedMedia.type === 'VIDEO'}
										<video src={selectedMedia.url} controls class="h-80 w-full object-cover" />
									{:else}
										<img src={selectedMedia.url} alt={booth.title} class="h-80 w-full object-cover" />
									{/if}
								{/if}
							</div>
							{#if mediaItems.length > 1}
								<div class="mt-3 flex gap-2 overflow-x-auto">
									{#each mediaItems as media, i}
										<button on:click={() => (selectedMediaIndex = i)}
											class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition {i === selectedMediaIndex ? 'border-[#513BE2]' : 'border-transparent'}">
											{#if media.type === 'VIDEO'}
												<div class="flex h-full w-full items-center justify-center bg-gray-100">
													<Icon icon="mdi:play-circle" class="h-6 w-6 text-gray-400" />
												</div>
											{:else}
												<img src={media.url} alt="" class="h-full w-full object-cover" />
											{/if}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{/if}

					<!-- Featured Products -->
					{#if booth.featuredProductIds?.length > 0}
						<div class="mt-8">
							<h2 class="mb-3 text-sm font-medium text-gray-900">Featured Products</h2>
							<div class="grid gap-3 sm:grid-cols-2">
								{#each booth.featuredProductIds as product}
									<div class="rounded-xl border border-gray-100 bg-white p-4">
										<div class="flex items-center gap-3">
											{#if product.media?.[0]?.url}
												<img src={product.media[0].url} alt={product.productName} class="h-12 w-12 rounded-lg object-cover" />
											{:else}
												<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-50">
													<Icon icon="mdi:package-variant" class="h-6 w-6 text-gray-300" />
												</div>
											{/if}
											<div>
												<p class="text-sm font-medium text-gray-900">{product.productName || 'Product'}</p>
												{#if product.price}
													<p class="text-xs text-[#513BE2]">{formatMoney(majorToKobo(Number(product.price?.$numberDecimal || product.price), product.currency || 'USD'), product.currency || 'USD')}</p>
												{/if}
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- Sidebar (1 col) -->
				<div class="space-y-4">
					<!-- CTA Card -->
					<div class="rounded-2xl bg-white p-6">
						<h3 class="text-base font-semibold text-gray-900">Interested?</h3>
						<p class="mt-1 text-sm text-gray-500">Get in touch with {exhibitor?.companyName || 'this exhibitor'} for more information.</p>
						{#if exhibitor?.contactInfo?.email}
							<a href="mailto:{exhibitor.contactInfo.email}?subject=Inquiry about {booth.title}"
								class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#513BE2] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#4030c0]">
								<Icon icon="mdi:email-outline" class="h-4 w-4" />
								Request Info
							</a>
						{/if}
					</div>

					<!-- Resources -->
					{#if booth.resources?.length > 0}
						<div class="rounded-2xl bg-white p-6">
							<h3 class="text-base font-semibold text-gray-900">Resources</h3>
							<div class="mt-3 space-y-2">
								{#each booth.resources as resource}
									<a href={resource.url} target="_blank" rel="noopener noreferrer"
										class="flex items-center gap-3 rounded-xl border border-gray-100 p-3 transition hover:bg-gray-50">
										<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
											{#if resource.type === 'PDF'}
												<Icon icon="mdi:file-pdf-box" class="h-5 w-5 text-red-500" />
											{:else}
												<Icon icon="mdi:link-variant" class="h-5 w-5 text-blue-500" />
											{/if}
										</div>
										<div>
											<p class="text-sm font-medium text-gray-900">{resource.title}</p>
											<p class="text-xs text-gray-400">{resource.type}</p>
										</div>
									</a>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Exhibitor Info Card -->
					<div class="rounded-2xl bg-white p-6">
						<a href="/x/{exhibitorSlug}" class="flex items-center gap-3">
							{#if exhibitor?.logoUrl || exhibitor?.profilePictureUrl}
								<img src={exhibitor.logoUrl || exhibitor.profilePictureUrl} alt="" class="h-10 w-10 rounded-lg object-cover" />
							{:else}
								<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-sm font-bold text-gray-300">
									{(exhibitor?.companyName || '?')[0].toUpperCase()}
								</div>
							{/if}
							<div>
								<p class="text-sm font-semibold text-gray-900">{exhibitor?.companyName || exhibitor?.name}</p>
								{#if exhibitor?.industry}
									<p class="text-xs text-gray-400">{exhibitor.industry}</p>
								{/if}
							</div>
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
