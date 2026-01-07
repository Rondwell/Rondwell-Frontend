<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';

	let searchQuery = '';
	let showFilter = false;

	// PDF items array
	let files = [
		{ id: 1, title: 'Presentation.pdf', type: 'pdf', size: '5mb', src: '/media-image.png' },
		{ id: 2, title: 'Presentation.pdf', type: 'mp4', size: '5mb', src: '/media-image.png' },
		{ id: 3, title: 'Presentation.pdf', type: 'pdf', size: '5mb', src: '/media-image.png' },
		{ id: 4, title: 'Presentation.pdf', type: 'mp4', size: '5mb', src: '/media-image.png' },
		{ id: 5, title: 'Presentation.pdf', type: 'pdf', size: '5mb', src: '/media-image.png' },
		{ id: 6, title: 'Presentation.pdf', type: 'mp4', size: '5mb', src: '/media-image.png' }
	];

	const faqStatus: any = {
		workshop: {
			label: 'Workshop',
			color: 'bg-blue-100 text-blue-700'
		},
		keynote: {
			label: 'Keynote',
			color: 'bg-green-100 text-green-700'
		},
		panel: {
			label: 'Panel',
			color: 'bg-purple-100 text-purple-700'
		}
	};

	// FAQ array
	let faqs = [
		{
			id: 1,
			question: 'How do I register on Rondwell?',
			answer: 'Go to the website, then click on sign up',
			status: 'Public'
		},
		{
			id: 2,
			question: 'How do I register to attend an event?',
			answer: 'Go to the event page, then click on sign up',
			status: 'Draft'
		},
		{
			id: 3,
			question: 'How do I pay for Rondwell plus?',
			answer: 'Go to your profile, then click on rondwell plus',
			status: 'Public'
		}
	];
</script>

<div class="">
	<!-- Top Section -->
	<div class="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
		<div>
			<h1 class="text-2xl font-semibold">Event Media for Megaexe Party</h1>
			<p class="text-sm text-gray-500 max-w-sm mt-2 font-light">
				Upload and manage event images, videos, and files. Create photo albums
			</p>
		</div>

		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<button
				class="flex items-center justify-center gap-1 rounded-md bg-gray-300 px-4 py-2 text-sm text-[#616265]"
			>
				<Icon icon="mdi:plus" class="h-4 w-4" />
				Upload Files</button
			>
			<button
				class="flex items-center justify-center gap-1 rounded-md bg-gray-300 px-4 py-2 text-sm text-[#616265]"
			>
				<img src="/photo-icon.svg" alt="" />
				Generate Photo Album</button
			>
		</div>
	</div>

	<!-- Search Bar -->
	<div class="mb-4 flex flex-col justify-between lg:flex-row lg:items-center">
		<div class="relative mb-4 w-full max-w-xl">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search media by name or type.."
				class="h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-gray-500 focus:ring-0 focus:outline-none"
			/>
			<span class="absolute top-2.5 left-3 text-gray-400">
				<img src="/search-favorite.png" alt="search icon" class="h-5 w-5" />
			</span>
		</div>

		<div class="flex items-center gap-1 md:flex-row">
			<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-gray-300">
				<img src="/download-icon.svg" alt="download icon" />
			</div>
			<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-gray-300">
				<img src="/export.svg" alt="export icon" />
			</div>

			<div use:clickOutside={() => (showFilter = false)} class="relative">
				<button
					class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-gray-300 px-3 py-2 text-xs text-[#616265] md:text-sm"
				>
					<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
					Media Type
				</button>
				<!-- <Status bind:open={showStatus} participant="speaker" /> -->
			</div>
		</div>
	</div>

	<!-- PDF Grid -->
	<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each files as file}
			<div class="overflow-hidden rounded-lg bg-white p-2 shadow">
				<img src={file.src} alt="preview" class="h-40 w-full rounded-t-lg object-cover" />

				<div class="flex items-start justify-between py-4">
					<div class="flex items-start gap-2">
						<img
							src={file.type === 'pdf'
								? '/pdf-file.svg'
								: file.type === 'mp4'
									? '/mp4-file.svg'
									: ''}
							alt=""
						/>
						<div class="">
							<p class="font-medium">{file.title}</p>
							<p class="text-xs text-gray-400">Max size. {file.size} • Max size. 5mb</p>
						</div>
					</div>
					<button class="text-gray-500">
						<Icon icon="mdi:dots-vertical" class="h-5 w-5 text-gray-500" />
					</button>
				</div>
			</div>
		{/each}
	</div>

	<!-- FAQ Section -->
	<div class="mt-6">
		<div class="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
			<div>
				<h2 class="text-2xl font-semibold">Event FAQ for Megaexe Party</h2>
				<p class="text-sm text-gray-500">Provide quick answers to common attendee questions</p>
			</div>

			<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
				<button
					class="flex items-center gap-1 rounded-md bg-[#EBECED] justify-center px-4 py-2 text-sm text-[#616265]"
				>
					<Icon icon="mdi:plus" class="h-4 w-4" />
					Add New FAQ</button
				>
				<button
					class="flex items-center gap-1 rounded-md bg-[#EBECED] justify-center px-4 py-2 text-sm text-[#616265]"
				>
					<img src="/photo-icon.svg" alt="" />
					Generate Photo Album</button
				>
			</div>
		</div>

		<!-- Search Bar -->
		<div class="mb-4 flex flex-col justify-between lg:flex-row lg:items-center">
			<div class="relative mb-4 w-full max-w-xl">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search FAQs by question or answer..."
					class="h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-gray-500 focus:ring-0 focus:outline-none"
				/>
				<span class="absolute top-2.5 left-3 text-gray-400">
					<img src="/search-favorite.png" alt="search icon" class="h-5 w-5" />
				</span>
			</div>

			<div class="flex items-center gap-1 md:flex-row">
				<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]">
					<img src="/download-icon.svg" alt="download icon" />
				</div>
				<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]">
					<img src="/export.svg" alt="export icon" />
				</div>

				<div use:clickOutside={() => (showFilter = false)} class="relative">
					<button
						class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
					>
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
						Category
					</button>
					<!-- <Status bind:open={showStatus} participant="speaker" /> -->
				</div>
			</div>
		</div>

		<div class="overflow-hidden rounded-xl bg-white shadow-sm">
			{#each faqs as faq}
				<div
					class="flex flex-col justify-between gap-3 border-b px-4 py-3 last:border-none lg:flex-row lg:items-center"
				>
					<div class="flex flex-col gap-3 md:flex-row md:items-center">
						<!-- Icon + Title -->
						<div class="flex items-center gap-3">
							<img src="/faq.svg" alt="" class="h-7 w-7" />
							<div class="font-medium">{faq.question}</div>
						</div>

						<div class="w-full truncate text-gray-500 md:max-w-70">{faq.answer}</div>
					</div>

					<div class="flex items-center justify-between gap-3">
						<!-- STATUS BADGE -->
						<span
							class="rounded-full px-3 py-1 text-xs
              						{faq.status === 'Public'
								? 'bg-green-100 text-green-600'
								: 'bg-gray-100 text-gray-600'}"
						>
							{faq.status}
						</span>

						<!-- Actions menu -->
						<button class="ml-4 text-gray-400 hover:text-gray-600">
							<Icon icon="mdi:dots-horizontal" class="h-5 w-5 text-gray-500" />
						</button>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
