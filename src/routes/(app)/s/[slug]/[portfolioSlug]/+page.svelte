<script lang="ts">
	import { page } from '$app/stores';
	import { getPublicSpeakerPortfolio } from '$lib/services/speaker.public.services';
	import { formatMoney, majorToKobo } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	export let data: any;
	$: seo = data?.seo;
	$: speakerSlug = $page.params.slug;
	$: portfolioSlug = $page.params.portfolioSlug;

	let loading = true;
	let notFound = false;
	let speaker: any = null;
	let portfolio: any = null;
	let selectedMediaIndex = 0;

	onMount(async () => {
		if (!speakerSlug || !portfolioSlug) { notFound = true; loading = false; return; }
		try {
			const result = await getPublicSpeakerPortfolio(speakerSlug, portfolioSlug);
			speaker = result.speaker;
			portfolio = result.portfolio;
		} catch { notFound = true; }
		finally { loading = false; }
	});

	$: mediaItems = portfolio?.media || [];
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
		<meta property="og:type" content="article" />
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
			<p class="text-sm text-gray-400">Loading portfolio</p>
		</div>
	</div>
{:else if notFound}
	<div class="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
		<p class="text-5xl">📁</p>
		<h1 class="text-2xl font-semibold text-gray-900">Portfolio Not Found</h1>
		<p class="text-sm text-gray-500">The portfolio item you're looking for doesn't exist or has been removed.</p>
		<a href="/s/{speakerSlug}" class="mt-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
			Back to Speaker
		</a>
	</div>
{:else}
	<div class="min-h-screen bg-[#F4F5F6]">
		<div class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
			<!-- Breadcrumb -->
			<nav class="mb-6 flex items-center gap-2 text-sm text-gray-500">
				<a href="/discover?tab=speakers" class="hover:text-gray-700">Discover</a>
				<span>/</span>
				<a href="/s/{speakerSlug}" class="hover:text-gray-700">{speaker?.fullName || speaker?.name || 'Speaker'}</a>
				<span>/</span>
				<span class="text-gray-900">{portfolio.title}</span>
			</nav>

			<div class="grid gap-8 lg:grid-cols-2">
				<!-- Media Gallery -->
				<div>
					<div class="overflow-hidden rounded-2xl bg-white">
						{#if selectedMedia}
							{#if selectedMedia.type === 'VIDEO'}
								<video src={selectedMedia.url} controls class="h-80 w-full object-cover" />
							{:else}
								<img src={selectedMedia.url} alt={portfolio.title} class="h-80 w-full object-cover" />
							{/if}
						{:else}
							<div class="flex h-80 w-full items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
								<Icon icon="mdi:presentation" class="h-16 w-16 text-purple-200" />
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

					<!-- Video Links -->
					{#if portfolio.videoLinks?.length > 0}
						<div class="mt-4">
							<h3 class="text-sm font-medium text-gray-900">Video Links</h3>
							<div class="mt-2 space-y-2">
								{#each portfolio.videoLinks as link}
									<a href={link} target="_blank" rel="noopener noreferrer"
										class="flex items-center gap-2 rounded-lg bg-white p-3 text-sm text-[#513BE2] transition hover:bg-gray-50">
										<Icon icon="mdi:play-circle-outline" class="h-5 w-5" />
										{link}
									</a>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- Portfolio Details -->
				<div>
					{#if portfolio.category}
						<span class="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">{portfolio.category}</span>
					{/if}
					<h1 class="mt-3 text-2xl font-bold text-gray-900">{portfolio.title}</h1>

					<!-- Speaker link -->
					<a href="/s/{speakerSlug}" class="mt-2 flex items-center gap-2 text-sm text-gray-500 hover:text-[#513BE2]">
						{#if speaker?.profilePhotoUrl || speaker?.profilePictureUrl}
							<img src={speaker.profilePhotoUrl || speaker.profilePictureUrl} alt="" class="h-5 w-5 rounded-full object-cover" />
						{/if}
						By {speaker?.fullName || speaker?.name}
					</a>

					<!-- Description -->
					<div class="mt-6">
						<h2 class="text-sm font-medium text-gray-900">Description</h2>
						<p class="mt-2 text-sm leading-relaxed text-gray-600">{portfolio.description}</p>
					</div>

					<!-- Engagement Style -->
					{#if portfolio.engagementStyle}
						<div class="mt-4">
							<h2 class="text-sm font-medium text-gray-900">Engagement Style</h2>
							<p class="mt-1 text-sm text-gray-600">{portfolio.engagementStyle}</p>
						</div>
					{/if}

					<!-- Learning Outcomes -->
					{#if portfolio.learningOutcomes?.length > 0}
						<div class="mt-4">
							<h2 class="text-sm font-medium text-gray-900">Learning Outcomes</h2>
							<ul class="mt-2 space-y-1">
								{#each portfolio.learningOutcomes as outcome}
									<li class="flex items-start gap-2 text-sm text-gray-600">
										<Icon icon="mdi:check-circle" class="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
										{outcome}
									</li>
								{/each}
							</ul>
						</div>
					{/if}

					<!-- Original Event -->
					{#if portfolio.originalEventName}
						<div class="mt-4 rounded-xl bg-purple-50 p-4">
							<p class="text-xs font-medium text-purple-400 uppercase">Originally presented at</p>
							<p class="mt-1 text-sm font-medium text-purple-900">{portfolio.originalEventName}</p>
							{#if portfolio.originalEventDate}
								<p class="text-xs text-purple-600">{new Date(portfolio.originalEventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
							{/if}
						</div>
					{/if}

					<!-- Testimonials -->
					{#if portfolio.testimonials?.length > 0}
						<div class="mt-6">
							<h2 class="text-sm font-medium text-gray-900">Testimonials</h2>
							<div class="mt-2 space-y-3">
								{#each portfolio.testimonials as testimonial}
									<div class="rounded-xl border border-gray-100 bg-white p-4">
										<p class="text-sm italic text-gray-600">"{testimonial.quote}"</p>
										<p class="mt-2 text-xs text-gray-400">— {testimonial.organizerName}, {testimonial.eventName}</p>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Fee Info -->
					{#if portfolio.feeType}
						<div class="mt-4 rounded-xl bg-gray-50 p-4">
							<p class="text-xs font-medium text-gray-400 uppercase">Fee</p>
							<p class="mt-1 text-sm text-gray-900">
								{#if portfolio.feeType === 'PRO_BONO'}
									Pro Bono
								{:else if portfolio.feeAmount}
									{formatMoney(majorToKobo(Number(portfolio.feeAmount), portfolio.feeCurrency || 'USD'), portfolio.feeCurrency || 'USD')} ({portfolio.feeType.toLowerCase()})
								{:else}
									{portfolio.feeType}
								{/if}
							</p>
							{#if portfolio.feeNotes}
								<p class="mt-1 text-xs text-gray-500">{portfolio.feeNotes}</p>
							{/if}
						</div>
					{/if}

					<!-- CTA -->
					<div class="mt-8">
						<button class="inline-flex items-center gap-2 rounded-lg bg-[#513BE2] px-8 py-3 text-sm font-medium text-white transition hover:bg-[#4030c0]">
							<Icon icon="mdi:microphone" class="h-4 w-4" />
							Invite to Speak
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
