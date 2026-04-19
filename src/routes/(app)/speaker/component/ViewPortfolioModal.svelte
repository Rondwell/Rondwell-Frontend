<script lang="ts">
	import Icon from '@iconify/svelte';

	export let open = false;
	export let portfolio: any = null;
	export let onEdit: (portfolio: any) => void = () => {};

	$: statusColor = portfolio?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : portfolio?.status === 'DRAFT' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700';
	$: feeLabel = getFeeLabel(portfolio);
	$: currencySymbol = portfolio?.feeCurrency === 'NGN' ? '₦' : portfolio?.feeCurrency === 'USD' ? '$' : portfolio?.feeCurrency === 'GBP' ? '£' : portfolio?.feeCurrency || '$';

	function getFeeLabel(p: any): string {
		if (!p?.feeType) return 'Not specified';
		if (p.feeType === 'PRO_BONO') return 'Pro Bono / Negotiable';
		if (p.feeType === 'NOT_APPLICABLE') return 'Not Applicable';
		if (p.feeType === 'VARIABLE') return p.feeAmount ? `${currencySymbol}${p.feeAmount.toLocaleString()} (Variable)` : 'Custom Quote';
		if (p.feeType === 'FIXED') return p.feeAmount ? `${currencySymbol}${p.feeAmount.toLocaleString()}` : 'Free';
		return 'Not specified';
	}

	function handleEdit() { open = false; onEdit(portfolio); }
	function formatDate(d: string) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''; }
</script>

{#if open && portfolio}
<div on:click={() => (open = false)} on:keydown={(e) => e.key === 'Escape' && (open = false)}
	class="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-5 lg:justify-end lg:p-0 lg:pr-10"
	role="dialog" aria-modal="true" tabindex="-1">
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="flex h-full w-full max-w-xl flex-col rounded-xl bg-[#F4F5F6] shadow-xl lg:max-w-lg lg:rounded-none"
		role="document" on:click|stopPropagation on:keydown|stopPropagation>

		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
			<div class="flex items-center gap-2">
				<button aria-label="Close" on:click={() => (open = false)}>
					<Icon icon="mdi:chevron-double-right" class="text-lg text-gray-500" />
				</button>
				<span class="text-sm font-semibold text-gray-700">Portfolio Details</span>
			</div>
			<div class="flex items-center gap-1.5 sm:gap-2">
				<button on:click={handleEdit} class="hidden items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:flex">
					<Icon icon="mdi:pencil-outline" class="h-3.5 w-3.5" /> Edit Entry
				</button>
				<button on:click={handleEdit} class="flex items-center rounded-md bg-white p-1.5 text-gray-700 shadow-sm hover:bg-gray-50 sm:hidden" aria-label="Edit Entry">
					<Icon icon="mdi:pencil-outline" class="h-4 w-4" />
				</button>
			</div>
		</div>

		<!-- Content -->
		<div class="custom-scrollbar flex-1 overflow-y-auto px-4 pt-4 pb-6 sm:px-6 sm:pt-5">
			<!-- Hero Image -->
			{#if portfolio.media?.length > 0}
				<div class="relative mb-5 h-44 w-full overflow-hidden rounded-xl bg-gray-100 sm:h-60">
					<img src={portfolio.media[0].url} alt={portfolio.title} class="h-full w-full object-cover" />
					{#if portfolio.media.length > 1}
						<div class="absolute right-2 bottom-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
							<Icon icon="mdi:image-multiple" class="h-3 w-3" /> {portfolio.media.length} files
						</div>
					{/if}
				</div>
			{:else}
				<div class="mb-5 flex h-44 w-full items-center justify-center rounded-xl bg-gray-100 sm:h-60">
					<Icon icon="mdi:microphone-variant" class="h-16 w-16 text-gray-300" />
				</div>
			{/if}

			<!-- Title & Status -->
			<div class="mb-4">
				<div class="mb-2 flex items-center gap-2">
					<h2 class="text-lg font-bold text-gray-900">{portfolio.title}</h2>
					<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {statusColor}">{portfolio.status}</span>
				</div>
				{#if portfolio.category}
					<span class="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">{portfolio.category}</span>
				{/if}
			</div>

			<!-- Description -->
			{#if portfolio.description}
				<div class="mb-5 rounded-xl bg-white p-4">
					<h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Description</h3>
					<p class="text-sm leading-relaxed text-gray-700">{portfolio.description}</p>
				</div>
			{/if}

			<!-- Event Details -->
			{#if portfolio.originalEventName || portfolio.originalEventDate || portfolio.engagementStyle}
				<div class="mb-5 rounded-xl bg-white p-4">
					<h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Event Details</h3>
					<div class="space-y-2">
						{#if portfolio.originalEventName}
							<div class="flex items-center gap-2">
								<Icon icon="mdi:calendar-star" class="h-4 w-4 text-gray-400" />
								<span class="text-sm text-gray-700">{portfolio.originalEventName}</span>
							</div>
						{/if}
						{#if portfolio.originalEventDate}
							<div class="flex items-center gap-2">
								<Icon icon="mdi:calendar" class="h-4 w-4 text-gray-400" />
								<span class="text-sm text-gray-700">{formatDate(portfolio.originalEventDate)}</span>
							</div>
						{/if}
						{#if portfolio.engagementStyle}
							<div class="flex items-center gap-2">
								<Icon icon="mdi:account-group" class="h-4 w-4 text-gray-400" />
								<span class="text-sm text-gray-700">{portfolio.engagementStyle}</span>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Learning Outcomes -->
			{#if portfolio.learningOutcomes?.length > 0}
				<div class="mb-5 rounded-xl bg-white p-4">
					<h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Key Learning Outcomes</h3>
					<ul class="space-y-1.5">
						{#each portfolio.learningOutcomes as outcome}
							<li class="flex items-start gap-2 text-sm text-gray-700">
								<Icon icon="mdi:check-circle" class="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
								{outcome}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- Video Links -->
			{#if portfolio.videoLinks?.length > 0}
				<div class="mb-5 rounded-xl bg-white p-4">
					<h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Speaker Reels / Demo Videos</h3>
					<div class="space-y-2">
						{#each portfolio.videoLinks as link}
							<a href={link} target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 transition">
								<Icon icon="mdi:play-circle-outline" class="h-4 w-4 shrink-0" />
								<span class="truncate">{link}</span>
								<Icon icon="mdi:open-in-new" class="ml-auto h-3 w-3 shrink-0 text-gray-400" />
							</a>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Testimonials -->
			{#if portfolio.testimonials?.length > 0}
				<div class="mb-5 rounded-xl bg-white p-4">
					<h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">References & Testimonials</h3>
					<div class="space-y-3">
						{#each portfolio.testimonials as t}
							<div class="rounded-lg border border-gray-100 p-3">
								{#if t.quote}
									<p class="mb-2 text-sm italic text-gray-600">"{t.quote}"</p>
								{/if}
								<div class="flex items-center gap-2 text-xs text-gray-500">
									<Icon icon="mdi:account" class="h-3.5 w-3.5" />
									<span class="font-medium">{t.organizerName}</span>
									<span class="text-gray-300">·</span>
									<span>{t.eventName}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Availability & Fees -->
			<div class="mb-5 rounded-xl bg-white p-4">
				<h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Availability & Fees</h3>
				<div class="space-y-3">
					{#if portfolio.generalAvailability}
						<div>
							<span class="text-xs font-medium text-gray-500">Availability</span>
							<p class="mt-0.5 text-sm text-gray-700">{portfolio.generalAvailability}</p>
						</div>
					{/if}
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
							<Icon icon="mdi:currency-usd" class="h-5 w-5 text-green-600" />
						</div>
						<div>
							<span class="text-xs text-gray-500">Speaking Fee</span>
							<p class="text-sm font-semibold text-gray-900">{feeLabel}</p>
						</div>
					</div>
					{#if portfolio.feeNotes}
						<div>
							<span class="text-xs font-medium text-gray-500">Fee Notes</span>
							<p class="mt-0.5 text-sm text-gray-700">{portfolio.feeNotes}</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Meta -->
			<div class="rounded-xl bg-white p-4">
				<h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Details</h3>
				<div class="grid grid-cols-2 gap-3 text-xs">
					<div>
						<span class="text-gray-500">Visibility</span>
						<p class="font-medium text-gray-900">{portfolio.isPublic ? 'Public' : 'Private'}</p>
					</div>
					{#if portfolio.createdAt}
						<div>
							<span class="text-gray-500">Created</span>
							<p class="font-medium text-gray-900">{formatDate(portfolio.createdAt)}</p>
						</div>
					{/if}
					{#if portfolio.updatedAt}
						<div>
							<span class="text-gray-500">Last Updated</span>
							<p class="font-medium text-gray-900">{formatDate(portfolio.updatedAt)}</p>
						</div>
					{/if}
				</div>
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
