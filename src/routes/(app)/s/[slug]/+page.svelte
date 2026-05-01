<script lang="ts">
	import { page } from '$app/stores';
	import { getPublicSpeakerBySlug } from '$lib/services/speaker.public.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	export let data: any;
	$: seo = data?.seo;
	$: slug = $page.params.slug;

	let loading = true;
	let notFound = false;
	let speaker: any = null;
	let portfolios: any[] = [];
	let searchQuery = '';
	let activeTab: 'portfolio' | 'about' = 'portfolio';

	const socialIconMap: Record<string, string> = {
		instagram: 'mdi:instagram', twitter: 'ri:twitter-x-fill', x: 'ri:twitter-x-fill',
		youtube: 'mdi:youtube', tiktok: 'ic:baseline-tiktok', linkedin: 'mdi:linkedin', website: 'mdi:web',
	};

	onMount(async () => {
		if (!slug) { notFound = true; loading = false; return; }
		try {
			const result = await getPublicSpeakerBySlug(slug);
			speaker = result.speaker;
			portfolios = result.portfolios || [];
		} catch { notFound = true; }
		finally { loading = false; }
	});

	$: filteredPortfolios = portfolios.filter((p: any) => {
		if (!searchQuery) return true;
		const q = searchQuery.toLowerCase();
		return (p.title ?? '').toLowerCase().includes(q) ||
			(p.description ?? '').toLowerCase().includes(q) ||
			(p.category ?? '').toLowerCase().includes(q);
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
		<meta property="og:type" content="profile" />
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
						<path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#513BE2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22" stroke="#8B3AD4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</div>
				<div class="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-[#513BE2] opacity-60 animate-ping"></div>
			</div>
			<p class="text-sm text-gray-400">Loading speaker</p>
		</div>
	</div>
{:else if notFound}
	<div class="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
		<p class="text-5xl">🎤</p>
		<h1 class="text-2xl font-semibold text-gray-900">Speaker Not Found</h1>
		<p class="text-sm text-gray-500">The speaker you're looking for doesn't exist or has been removed.</p>
		<a href="/discover?tab=speakers" class="mt-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
			Discover Speakers
		</a>
	</div>
{:else}
	<div class="min-h-screen bg-[#F4F5F6]">
		<!-- PROFILE HEADER -->
		<div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
			<div class="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
				<!-- Avatar -->
				<div class="h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg sm:h-32 sm:w-32">
					{#if speaker.profilePhotoUrl || speaker.profilePictureUrl}
						<img src={speaker.profilePhotoUrl || speaker.profilePictureUrl} alt={speaker.fullName || speaker.name} class="h-full w-full object-cover" />
					{:else}
						<div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 text-3xl font-bold text-gray-300">
							{(speaker.fullName || speaker.name || '?')[0].toUpperCase()}
						</div>
					{/if}
				</div>

				<!-- Info -->
				<div class="flex-1 text-center sm:text-left">
					<h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">{speaker.fullName || speaker.name}</h1>
					<div class="mt-1 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
						{#if speaker.title}
							<span class="text-sm text-gray-600">{speaker.title}</span>
						{/if}
						{#if speaker.affiliation}
							<span class="text-sm text-gray-400">at {speaker.affiliation}</span>
						{/if}
					</div>
					{#if speaker.expertise}
						<div class="mt-2">
							<span class="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">{speaker.expertise}</span>
						</div>
					{/if}
					<p class="mt-2 text-sm text-gray-400">{portfolios.length} portfolio item{portfolios.length !== 1 ? 's' : ''}</p>

					{#if speaker.socialLinks}
						{@const links = Object.entries(speaker.socialLinks).filter(([, v]) => v)}
						{#if links.length > 0}
							<div class="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
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

				<!-- CTA -->
				<div class="flex-shrink-0">
					<button class="rounded-lg bg-[#513BE2] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#4030c0]">
						Invite to Speak
					</button>
				</div>
			</div>

			<!-- Bio -->
			{#if speaker.speakerBio || speaker.bio}
				<div class="mt-6 rounded-2xl bg-white p-5">
					<h2 class="mb-2 text-base font-medium text-gray-900">About</h2>
					<p class="text-sm leading-relaxed text-gray-600">{speaker.speakerBio || speaker.bio}</p>
				</div>
			{/if}

			<!-- TABS -->
			<div class="mt-6 flex gap-1 border-b border-gray-200">
				<button on:click={() => (activeTab = 'portfolio')}
					class="relative px-5 py-3 text-sm font-medium transition {activeTab === 'portfolio' ? 'text-gray-900' : 'text-gray-500'}">
					Portfolio
					{#if activeTab === 'portfolio'}<div class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#513BE2]"></div>{/if}
				</button>
				<button on:click={() => (activeTab = 'about')}
					class="relative px-5 py-3 text-sm font-medium transition {activeTab === 'about' ? 'text-gray-900' : 'text-gray-500'}">
					Details
					{#if activeTab === 'about'}<div class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#513BE2]"></div>{/if}
				</button>
			</div>

			{#if activeTab === 'portfolio'}
				<div class="mt-6">
					<!-- Search -->
					<div class="relative mb-6 w-full max-w-xs">
						<svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none">
							<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.5"/>
							<path d="M20 20l-3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
						</svg>
						<input type="text" bind:value={searchQuery}
							placeholder="Search portfolio..."
							class="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#513BE2]" />
					</div>

					<!-- Portfolio Grid -->
					<div class="pb-16">
						{#if filteredPortfolios.length === 0}
							<div class="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white py-20">
								<p class="text-5xl">📁</p>
								<p class="text-lg font-medium text-gray-900">No portfolio items found</p>
								<p class="text-sm text-gray-500">
									{searchQuery ? 'Try a different search term' : 'This speaker hasn\'t added any portfolio items yet.'}
								</p>
							</div>
						{:else}
							<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{#each filteredPortfolios as item (item._id)}
									<a href="/s/{slug}/{item.slug}"
										class="group flex flex-col overflow-hidden rounded-2xl bg-white no-underline transition-shadow hover:shadow-md">
										<div class="relative h-44 w-full overflow-hidden">
											{#if item.media?.[0]?.url}
												<img src={item.media[0].url} alt={item.title}
													class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
											{:else}
												<div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
													<Icon icon="mdi:presentation" class="h-12 w-12 text-purple-200" />
												</div>
											{/if}
											{#if item.category}
												<div class="absolute top-2 right-2 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-medium text-gray-700">
													{item.category}
												</div>
											{/if}
										</div>
										<div class="flex flex-1 flex-col p-4">
											<h3 class="text-sm font-semibold text-gray-900 line-clamp-1">{item.title}</h3>
											<p class="mt-1 text-xs text-gray-500 line-clamp-2">{item.description}</p>
											{#if item.engagementStyle}
												<p class="mt-auto pt-3 text-xs text-purple-600">{item.engagementStyle}</p>
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
							{#if speaker.expertise}
								<div>
									<p class="text-xs font-medium text-gray-400 uppercase">Expertise</p>
									<p class="mt-1 text-sm text-gray-900">{speaker.expertise}</p>
								</div>
							{/if}
							{#if speaker.title}
								<div>
									<p class="text-xs font-medium text-gray-400 uppercase">Title</p>
									<p class="mt-1 text-sm text-gray-900">{speaker.title}</p>
								</div>
							{/if}
							{#if speaker.affiliation}
								<div>
									<p class="text-xs font-medium text-gray-400 uppercase">Affiliation</p>
									<p class="mt-1 text-sm text-gray-900">{speaker.affiliation}</p>
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
	.line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
	.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
