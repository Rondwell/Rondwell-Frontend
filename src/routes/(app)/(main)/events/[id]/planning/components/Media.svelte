<script lang="ts">
	import { page } from '$app/stores';
	import { getEventFaqs, getEventMedia } from '$lib/services/event.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import AddEditFaq from './modal/AddEditFaq.svelte';
	import FaqDropdown from './modal/FaqDropdown.svelte';
	import MediaDropdown from './modal/MediaDropdown.svelte';
	import UploadMedia from './modal/UploadMedia.svelte';

	export let eventTitle = '';
	$: eventId = $page.params.id ?? '';

	let mediaSearch = '';
	let faqSearch = '';
	let faqCategoryFilter = 'All';
	const faqCategories = ['All', 'General', 'Registration', 'Venue', 'Schedule', 'Payment', 'Technical'];
	let showUploadModal = false;
	let showFaqModal = false;
	let editFaq: any = null;
	let showMediaFilter = false;
	let showFaqFilter = false;
	let showMediaAction: string | null = null;
	let showFaqAction: string | null = null;
	let mediaButtonEls: Record<string, HTMLElement> = {};
	let faqButtonEls: Record<string, HTMLElement> = {};

	let mediaItems: any[] = [];
	let faqs: any[] = [];
	let loadingMedia = true;
	let loadingFaqs = true;
	let mediaTypeFilter = 'All';

	const mediaTypes = [
		{ label: 'All', value: 'All', icon: 'mdi:view-grid-outline' },
		{ label: 'Image', value: 'IMAGE', icon: 'mdi:image-outline' },
		{ label: 'Video', value: 'VIDEO', icon: 'mdi:video-outline' },
		{ label: 'Document', value: 'DOCUMENT', icon: 'mdi:file-document-outline' },
	];

	async function loadMedia() {
		if (!eventId) return;
		loadingMedia = true;
		try {
			const typeParam = mediaTypeFilter !== 'All' ? mediaTypeFilter : undefined;
			mediaItems = await getEventMedia(eventId, typeParam);
		} catch (e) { console.error('Failed to load media:', e); }
		finally { loadingMedia = false; }
	}

	async function loadFaqs() {
		if (!eventId) return;
		loadingFaqs = true;
		try { faqs = await getEventFaqs(eventId); }
		catch (e) { console.error('Failed to load faqs:', e); }
		finally { loadingFaqs = false; }
	}

	onMount(() => { loadMedia(); loadFaqs(); });

	function applyMediaTypeFilter(type: string) {
		mediaTypeFilter = type;
		showMediaFilter = false;
		loadMedia();
	}

	$: filteredMedia = mediaItems.filter(m => !mediaSearch || (m.title || '').toLowerCase().includes(mediaSearch.toLowerCase()));
	$: filteredFaqs = faqs.filter(f => {
		if (faqSearch) {
			const q = faqSearch.toLowerCase();
			if (!f.question?.toLowerCase().includes(q) && !f.answer?.toLowerCase().includes(q)) return false;
		}
		if (faqCategoryFilter !== 'All' && f.category !== faqCategoryFilter) return false;
		return true;
	});

	function getFileIcon(media: any): string {
		if (media.type === 'VIDEO' || media.url?.includes('.mp4')) return '/mp4-file.svg';
		if (media.type === 'DOCUMENT' || media.url?.includes('.pdf')) return '/pdf-file.svg';
		return '';
	}

	function openCreateFaq() { editFaq = null; showFaqModal = true; }
	function openEditFaq(faq: any) { editFaq = faq; showFaqModal = true; }

	let expandedFaqs: Record<string, boolean> = {};
	function toggleFaq(id: string) { expandedFaqs[id] = !expandedFaqs[id]; expandedFaqs = { ...expandedFaqs }; }

	function handleFaqAction(e: CustomEvent) {
		const { type, faq } = e.detail;
		if (type === 'create') openCreateFaq();
		else if (type === 'edit') openEditFaq(faq);
	}

	function handleMediaSaved() { showUploadModal = false; loadMedia(); }
	function handleFaqSaved() { showFaqModal = false; loadFaqs(); }
</script>

<div>
	<!-- Media Header -->
	<div class="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
		<div>
			<h1 class="text-2xl font-semibold">Event Media for {eventTitle || 'Event'}</h1>
			<p class="text-sm text-gray-500">Upload and manage event images, videos, and files. Create photo albums</p>
		</div>
		<button on:click={() => (showUploadModal = true)} class="flex items-center justify-center gap-2 rounded-md bg-black px-4 py-2 font-medium text-white hover:bg-gray-800 sm:w-fit">
			<Icon icon="mdi:plus" class="text-xl" /> Upload Files
		</button>
	</div>

	<!-- Media Search -->
	<div class="mb-4 flex flex-col justify-between lg:flex-row lg:items-center">
		<div class="relative mb-4 w-full max-w-xl">
			<input type="text" bind:value={mediaSearch} placeholder="Search media by name or type.." class="h-[43px] w-full rounded-lg bg-white py-2 pr-4 pl-10 text-gray-500 focus:ring-0 focus:outline-none" />
			<span class="absolute top-2.5 left-3"><img src="/search-favorite.png" alt="" class="h-5 w-5" /></span>
		</div>
		<div class="flex items-center gap-1">
			<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]"><img src="/download-icon.svg" alt="" /></div>
			<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]"><img src="/export.svg" alt="" /></div>
			<div use:clickOutside={() => (showMediaFilter = false)} class="relative">
				<button on:click={() => (showMediaFilter = !showMediaFilter)} class="flex flex-shrink-0 items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
					<img src="/filter-edit.svg" alt="" class="h-5 w-5" /> Media Type
				</button>
				{#if showMediaFilter}
				<div class="absolute right-0 z-50 mt-2 w-48 rounded-xl bg-white p-2 text-[15px] text-[#768387] shadow-lg">
					{#each mediaTypes as mt}
					<button on:click={() => applyMediaTypeFilter(mt.value)} class="flex w-full cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-[#EBECED] {mediaTypeFilter === mt.value ? 'bg-[#EBECED]' : ''}">
						<Icon icon={mt.icon} class="text-lg" /> {mt.label}
					</button>
					{/each}
				</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Media Grid -->
	{#if loadingMedia}
	<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each [1, 2, 3] as _}
		<div class="animate-pulse rounded-lg bg-white p-2 shadow-sm">
			<div class="h-40 rounded-t-lg bg-gray-200"></div>
			<div class="flex items-start gap-2 py-3">
				<div class="h-5 w-5 rounded bg-gray-200"></div>
				<div class="flex-1"><div class="mb-1 h-4 w-24 rounded bg-gray-200"></div><div class="h-3 w-16 rounded bg-gray-200"></div></div>
			</div>
		</div>
		{/each}
	</div>
	{:else if filteredMedia.length > 0}
	<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each filteredMedia as media}
		{@const mediaId = media._id || media.id}
		<div class="relative overflow-visible rounded-lg bg-white p-2 shadow-sm">
			{#if media.type === 'VIDEO' && media.url}
			<div class="relative flex h-40 items-center justify-center rounded-t-lg bg-gray-900">
				<Icon icon="mdi:play-circle-outline" class="text-5xl text-white/70" />
			</div>
			{:else if media.type === 'DOCUMENT'}
			<div class="flex h-40 items-center justify-center rounded-t-lg bg-gray-50">
				<Icon icon="mdi:file-pdf-box" class="text-5xl text-red-400" />
			</div>
			{:else if media.url}
			<img src={media.url} alt={media.title || 'preview'} class="h-40 w-full rounded-t-lg object-cover" />
			{:else}
			<div class="flex h-40 items-center justify-center rounded-t-lg bg-gray-100"><Icon icon="mdi:image-outline" class="text-4xl text-gray-300" /></div>
			{/if}
			<div class="flex items-start justify-between py-3">
				<div class="flex items-start gap-2">
					{#if media.type === 'VIDEO'}<Icon icon="mdi:video-outline" class="text-xl text-purple-500" />
					{:else if media.type === 'DOCUMENT'}<Icon icon="mdi:file-pdf-box" class="text-xl text-red-500" />
					{:else}<Icon icon="mdi:image-outline" class="text-xl text-blue-500" />{/if}
					<div>
						<p class="text-sm font-medium">{media.title || 'Untitled'}</p>
						<p class="text-xs text-gray-400">{media.type || 'IMAGE'}{media.isPublic ? '' : ' · Private'}</p>
					</div>
				</div>
				<div class="relative" use:clickOutside={() => { if (showMediaAction === mediaId) showMediaAction = null; }}>
					<button bind:this={mediaButtonEls[mediaId]} on:click={() => (showMediaAction = showMediaAction === mediaId ? null : mediaId)} class="text-gray-500">
						<Icon icon="mdi:dots-vertical" class="h-5 w-5" />
					</button>
					<MediaDropdown open={showMediaAction === mediaId} buttonEl={mediaButtonEls[mediaId]} {media} {eventId} on:updated={() => { showMediaAction = null; loadMedia(); }} />
				</div>
			</div>
		</div>
		{/each}
	</div>
	{:else}
	<div class="mb-8 flex h-40 flex-col items-center justify-center rounded-xl bg-white">
		<Icon icon="mdi:image-multiple-outline" class="mb-2 text-4xl text-gray-300" />
		<p class="text-sm text-gray-400">No media uploaded yet</p>
	</div>
	{/if}

	<!-- FAQ Section -->
	<div class="mt-6">
		<div class="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
			<div>
				<h2 class="text-2xl font-semibold">Event FAQ for {eventTitle || 'Event'}</h2>
				<p class="text-sm text-gray-500">Provide quick answers to common attendee questions</p>
			</div>
			<button on:click={openCreateFaq} class="flex items-center justify-center gap-2 rounded-md bg-black px-4 py-2 font-medium text-white hover:bg-gray-800 sm:w-fit">
				<Icon icon="mdi:plus" class="text-xl" /> Add New FAQ
			</button>
		</div>

		<!-- FAQ Search -->
		<div class="mb-4 flex flex-col justify-between lg:flex-row lg:items-center">
			<div class="relative mb-4 w-full max-w-xl">
				<input type="text" bind:value={faqSearch} placeholder="Search FAQs by question or answer..." class="h-[43px] w-full rounded-lg bg-white py-2 pr-4 pl-10 text-gray-500 focus:ring-0 focus:outline-none" />
				<span class="absolute top-2.5 left-3"><img src="/search-favorite.png" alt="" class="h-5 w-5" /></span>
			</div>
			<div class="flex items-center gap-1">
				<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]"><img src="/download-icon.svg" alt="" /></div>
				<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]"><img src="/export.svg" alt="" /></div>
				<div use:clickOutside={() => (showFaqFilter = false)} class="relative">
					<button on:click={() => (showFaqFilter = !showFaqFilter)} class="flex flex-shrink-0 items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
						<img src="/filter-edit.svg" alt="" class="h-5 w-5" /> Category
					</button>
					{#if showFaqFilter}
					<div class="absolute right-0 z-50 mt-2 w-44 rounded-xl bg-white p-2 text-[15px] text-[#768387] shadow-lg">
						{#each faqCategories as cat}
						<button on:click={() => { faqCategoryFilter = cat; showFaqFilter = false; }} class="flex w-full cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-[#EBECED] {faqCategoryFilter === cat ? 'bg-[#EBECED]' : ''}">
							{cat}
						</button>
						{/each}
					</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- FAQ List -->
		{#if loadingFaqs}
		<div class="space-y-3">
			{#each [1, 2, 3] as _}
			<div class="animate-pulse rounded-xl bg-white p-4 shadow-sm">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3"><div class="h-7 w-7 rounded bg-gray-200"></div><div class="h-4 w-48 rounded bg-gray-200"></div></div>
					<div class="flex items-center gap-2"><div class="h-5 w-14 rounded-full bg-gray-200"></div><div class="h-5 w-5 rounded bg-gray-200"></div></div>
				</div>
			</div>
			{/each}
		</div>
		{:else if filteredFaqs.length > 0}
		<div class="space-y-3">
			{#each filteredFaqs as faq}
			{@const faqId = faq._id || faq.id}
			{@const isExpanded = expandedFaqs[faqId] ?? false}
			<div class="overflow-visible rounded-xl bg-white shadow-sm">
				<!-- Accordion Header -->
				<div class="flex items-center justify-between px-4 py-3">
					<button on:click={() => toggleFaq(faqId)} class="flex flex-1 items-center gap-3 text-left">
						<img src="/faq.svg" alt="" class="h-7 w-7 flex-shrink-0" />
						<span class="font-medium text-gray-900">{faq.question}</span>
						<Icon icon="mdi:chevron-down" class="ml-auto flex-shrink-0 text-xl text-gray-400 transition-transform duration-200 {isExpanded ? 'rotate-180' : ''}" />
					</button>
					<div class="ml-3 flex flex-shrink-0 items-center gap-2">
						{#if faq.category}
						<span class="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">{faq.category}</span>
						{/if}
						<span class="rounded-full px-2 py-0.5 text-xs {faq.isPublic ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}">{faq.isPublic ? 'Public' : 'Private'}</span>
						<div class="relative" use:clickOutside={() => { if (showFaqAction === faqId) showFaqAction = null; }}>
							<button bind:this={faqButtonEls[faqId]} on:click={() => (showFaqAction = showFaqAction === faqId ? null : faqId)} class="text-gray-400 hover:text-gray-600">
								<Icon icon="mdi:dots-horizontal" class="h-5 w-5" />
							</button>
							<FaqDropdown open={showFaqAction === faqId} buttonEl={faqButtonEls[faqId]} {faq} {eventId} on:action={handleFaqAction} on:updated={() => { showFaqAction = null; loadFaqs(); }} />
						</div>
					</div>
				</div>
				<!-- Accordion Body -->
				{#if isExpanded}
				<div class="border-t border-gray-100 px-4 py-3">
					<p class="text-sm leading-relaxed text-gray-600">{faq.answer}</p>
				</div>
				{/if}
			</div>
			{/each}
		</div>
		{:else}
		<div class="flex h-40 flex-col items-center justify-center rounded-xl bg-white">
			<Icon icon="mdi:help-circle-outline" class="mb-2 text-4xl text-gray-300" />
			<p class="text-sm text-gray-400">No FAQs added yet</p>
		</div>
		{/if}
	</div>
</div>

<UploadMedia bind:open={showUploadModal} {eventId} on:saved={handleMediaSaved} />
<AddEditFaq bind:open={showFaqModal} {eventId} faq={editFaq} on:saved={handleFaqSaved} />
