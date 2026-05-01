<script lang="ts">
	import { page } from '$app/stores';
	import { getPublicExhibitorBySlug } from '$lib/services/exhibitor.public.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	export let data: any;
	$: seo = data?.seo;
	$: slug = $page.params.slug;

	let loading = true;
	let notFound = false;
	let exhibitor: any = null;
	let booths: any[] = [];
	let activeTab: 'booths' | 'about' = 'booths';

	const socialIconMap: Record<string, string> = {
		instagram: 'mdi:instagram', twitter: 'ri:twitter-x-fill', x: 'ri:twitter-x-fill',
		youtube: 'mdi:youtube', tiktok: 'ic:baseline-tiktok', linkedin: 'mdi:linkedin', website: 'mdi:web',
	};

	onMount(async () => {
		if (!slug) { notFound = true; loading = false; return; }
		try {
			const result = await getPublicExhibitorBySlug(slug);
			exhibitor = result.exhibitor;
			booths = result.booths || [];
		} catch { notFound = true; }
		finally { loading = false; }
	});
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
		<div class="flex flex-col items-center gap-5">
			<div class="relative">
				<div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-50">
					<svg width="36" height="36" viewBox="0 0 24 24" fill="none" class="animate-bounce">
						<path d="M22 8.52V3.98C22 2.57 21.36 2 19.77 2H15.73C14.14 2 13.5 2.57 13.5 3.98V8.51C13.5 9.93 14.14 10.49 15.73 10.49H19.77C21.36 10.5 22 9.93 22 8.52Z" stroke="#513BE2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M22 19.77V15.73C22 14.14 21.36 13.5 19.77 13.5H15.73C14.14 13.5 13.5 14.14 13.5 15.73V19.77C13.5 21.36 14.14 22 15.73 22H19.77C21.36 22 22 21.36 22 19.77Z" stroke="#8B3AD4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M10.5 8.52V3.98C10.5 2.57 9.86 2 8.27 2H4.23C2.64 2 2 2.57 2 3.98V8.51C2 9.93 2.64 10.49 4.23 10.49H8.27C9.86 10.5 10.5 9.93 10.5 8.52Z" stroke="#513BE2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M10.5 19.77V15.73C10.5 14.14 9.86 13.5 8.27 13.5H4.23C2.64 13.5 2 14.14 2 15.73V19.77C2 21.36 2.64 22 4.23 22H8.27C9.86 22 10.5 21.36 10.5 19.77Z" stroke="#8B3AD4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</div>
				<div class="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-[#513BE2] opacity-60 animate-ping"></div>
			</div>
			<p class="text-sm text-gray-400">Loading exhibitor</p>
		</div>
	</div>
{:else if notFound}
	<div class="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
		<p class="text-5xl">🏢</p>
		<h1 class="text-2xl font-semibold text-gray-900">Exhibitor Not Found</h1>
		<p class="text-sm text-gray-500">The exhibitor you're looking for doesn't exist or has been removed.</p>
		<a href="/discover?tab=exhibitors" class="mt-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
			Discover Exhibitors
		</a>
	</div>
{:else}
	<div class="min-h-screen bg-[#F4F5F6]">
		<!-- COVER BANNER -->
		<div class="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
			<div class="relative">
				<div class="overflow-hidden rounded-2xl bg-gray-100">
					<div class="h-48 w-full sm:h-56 md:h-64">
						{#if exhibitor.coverImageUrl || exhibitor.digitalBoothCoverImageUrl}
							<img src={exhibitor.coverImageUrl || exhibitor.digitalBoothCoverImageUrl} alt="Cover" class="h-full w-full object-cover" />
						{:else}
							<div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
								<svg width="64" height="64" viewBox="0 0 24 24" fill="none" opacity="0.3">
									<path d="M22 8.52V3.98C22 2.57 21.36 2 19.77 2H15.73C14.14 2 13.5 2.57 13.5 3.98V8.51" stroke="#513BE2" stroke-width="1.5"/>
								</svg>
							</div>
						{/if}
					</div>
				</div>
				<!-- Logo -->
				<div class="absolute bottom-0 left-6 translate-y-1/2 sm:left-8">
					<div class="h-20 w-20 overflow-hidden rounded-2xl border-4 border-[#F4F5F6] bg-white shadow-lg sm:h-24 sm:w-24">
						{#if exhibitor.logoUrl || exhibitor.profilePictureUrl}
							<img src={exhibitor.logoUrl || exhibitor.profilePictureUrl} alt={exhibitor.companyName} class="h-full w-full object-cover" />
						{:else}
							<div class="flex h-full w-full items-center justify-center bg-gray-50 text-2xl font-bold text-gray-300">
								{(exhibitor.companyName || exhibitor.name || '?')[0].toUpperCase()}
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
					<h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">{exhibitor.companyName || exhibitor.name}</h1>
					<div class="mt-1 flex flex-wrap items-center gap-3">
						{#if exhibitor.industry}
							<span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{exhibitor.industry}</span>
						{/if}
						{#if exhibitor.businessLocation}
							<span class="flex items-center gap-1 text-sm text-gray-500">
								<Icon icon="mdi:map-marker-outline" class="h-4 w-4" />
								{exhibitor.businessLocation}
							</span>
						{/if}
						<span class="text-sm text-gray-400">{booths.length} booth{booths.length !== 1 ? 's' : ''}</span>
					</div>
					{#if exhibitor.socialLinks}
						{@const links = Object.entries(exhibitor.socialLinks).filter(([, v]) => v)}
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
				{#if exhibitor.contactInfo?.email}
					<a href="mailto:{exhibitor.contactInfo.email}"
						class="w-fit rounded-lg bg-[#513BE2] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#4030c0]">
						Request Info
					</a>
				{/if}
			</div>

			<!-- About -->
			{#if exhibitor.companyDescription || exhibitor.bio}
				<div class="mt-5 rounded-2xl bg-white p-5">
					<h2 class="mb-2 text-base font-medium text-gray-900">About</h2>
					<p class="text-sm leading-relaxed text-gray-600">{exhibitor.companyDescription || exhibitor.bio}</p>
				</div>
			{/if}

			<!-- TABS -->
			<div class="mt-6 flex gap-1 border-b border-gray-200">
				<button on:click={() => (activeTab = 'booths')}
					class="relative px-5 py-3 text-sm font-medium transition {activeTab === 'booths' ? 'text-gray-900' : 'text-gray-500'}">
					Digital Booths
					{#if activeTab === 'booths'}<div class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#513BE2]"></div>{/if}
				</button>
				<button on:click={() => (activeTab = 'about')}
					class="relative px-5 py-3 text-sm font-medium transition {activeTab === 'about' ? 'text-gray-900' : 'text-gray-500'}">
					Details
					{#if activeTab === 'about'}<div class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#513BE2]"></div>{/if}
				</button>
			</div>

			{#if activeTab === 'booths'}
				<div class="mt-6 pb-16">
					{#if booths.length === 0}
						<div class="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white py-20">
							<p class="text-5xl">🏢</p>
							<p class="text-lg font-medium text-gray-900">No booths available</p>
							<p class="text-sm text-gray-500">This exhibitor hasn't published any digital booths yet.</p>
						</div>
					{:else}
						<div class="grid gap-4 sm:grid-cols-2">
							{#each booths as booth (booth._id)}
								<a href="/x/{slug}/{booth.slug}"
									class="group flex flex-col overflow-hidden rounded-2xl bg-white no-underline transition-shadow hover:shadow-md">
									<div class="relative h-48 w-full overflow-hidden">
										{#if booth.bannerUrl}
											<img src={booth.bannerUrl} alt={booth.title}
												class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
										{:else if booth.media?.[0]?.url}
											<img src={booth.media[0].url} alt={booth.title}
												class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
										{:else}
											<div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
												<Icon icon="mdi:storefront-outline" class="h-12 w-12 text-blue-200" />
											</div>
										{/if}
										{#if booth.media?.length > 0}
											<div class="absolute bottom-2 right-2 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white">
												{booth.media.length} media
											</div>
										{/if}
									</div>
									<div class="flex flex-1 flex-col p-4">
										<h3 class="text-base font-semibold text-gray-900">{booth.title}</h3>
										<p class="mt-1 text-xs text-gray-500 line-clamp-2">{booth.description}</p>
										{#if booth.resources?.length > 0}
											<div class="mt-auto flex items-center gap-2 pt-3">
												<Icon icon="mdi:file-document-outline" class="h-4 w-4 text-gray-400" />
												<span class="text-xs text-gray-400">{booth.resources.length} resource{booth.resources.length !== 1 ? 's' : ''}</span>
											</div>
										{/if}
									</div>
								</a>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<!-- DETAILS TAB -->
				<div class="mt-6 pb-16">
					<div class="rounded-2xl bg-white p-6">
						<div class="grid gap-6 sm:grid-cols-2">
							{#if exhibitor.industry}
								<div>
									<p class="text-xs font-medium text-gray-400 uppercase">Industry</p>
									<p class="mt-1 text-sm text-gray-900">{exhibitor.industry}</p>
								</div>
							{/if}
							{#if exhibitor.businessLocation}
								<div>
									<p class="text-xs font-medium text-gray-400 uppercase">Location</p>
									<p class="mt-1 text-sm text-gray-900">{exhibitor.businessLocation}</p>
								</div>
							{/if}
							{#if exhibitor.contactInfo?.email}
								<div>
									<p class="text-xs font-medium text-gray-400 uppercase">Email</p>
									<a href="mailto:{exhibitor.contactInfo.email}" class="mt-1 text-sm text-[#513BE2]">{exhibitor.contactInfo.email}</a>
								</div>
							{/if}
							{#if exhibitor.contactInfo?.phone}
								<div>
									<p class="text-xs font-medium text-gray-400 uppercase">Phone</p>
									<p class="mt-1 text-sm text-gray-900">{exhibitor.contactInfo.phone}</p>
								</div>
							{/if}
							{#if exhibitor.contactInfo?.website}
								<div>
									<p class="text-xs font-medium text-gray-400 uppercase">Website</p>
									<a href={exhibitor.contactInfo.website} target="_blank" rel="noopener noreferrer" class="mt-1 text-sm text-[#513BE2]">{exhibitor.contactInfo.website}</a>
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
	.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
