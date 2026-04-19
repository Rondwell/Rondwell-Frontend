<script lang="ts">
	import Icon from '@iconify/svelte';

	export let open = false;
	export let booth: any = null;
	export let onEdit: (booth: any) => void = () => {};

	$: statusColor = booth?.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : booth?.status === 'DRAFT' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700';

	function handleEdit() { open = false; onEdit(booth); }
	function formatDate(d: string) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''; }

	$: detailToggles = [
		{ icon: 'mdi:eye-outline', label: 'Visibility', desc: 'Whether this booth is publicly visible to attendees.', active: booth?.status === 'PUBLISHED' },
		{ icon: 'mdi:image-multiple-outline', label: 'Media Gallery', desc: 'Images and videos showcasing your booth.', active: (booth?.media?.length || 0) > 0 },
		{ icon: 'mdi:file-download-outline', label: 'Downloadable Resources', desc: 'PDFs, brochures, and links for visitors.', active: (booth?.resources?.length || 0) > 0 },
	];
</script>

{#if open && booth}
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
				<span class="text-sm font-semibold text-gray-700">Booth Details</span>
			</div>
			<div class="flex items-center gap-1.5 sm:gap-2">
				<button on:click={handleEdit} class="hidden items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:flex">
					<Icon icon="mdi:pencil-outline" class="h-3.5 w-3.5" /> Edit Booth
				</button>
				<button on:click={handleEdit} class="flex items-center rounded-md bg-white p-1.5 text-gray-700 shadow-sm hover:bg-gray-50 sm:hidden" aria-label="Edit Booth">
					<Icon icon="mdi:pencil-outline" class="h-4 w-4" />
				</button>
			</div>
		</div>

		<!-- Content -->
		<div class="custom-scrollbar flex-1 overflow-y-auto px-4 pt-4 pb-6 sm:px-6 sm:pt-5">
			<!-- Hero Image -->
			{#if booth.media?.length > 0}
				<div class="relative mb-5 h-44 w-full overflow-hidden rounded-xl bg-gray-100 sm:h-60">
					<img src={booth.media[0].url} alt={booth.title} class="h-full w-full object-cover" />
					{#if booth.media.length > 1}
						<div class="absolute right-2 bottom-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
							<Icon icon="mdi:image-multiple" class="h-3 w-3" /> {booth.media.length} files
						</div>
					{/if}
				</div>
			{:else}
				<div class="mb-5 flex h-44 w-full items-center justify-center rounded-xl bg-gray-100 sm:h-60">
					<Icon icon="mdi:image-outline" class="h-16 w-16 text-gray-300" />
				</div>
			{/if}

			<!-- Booth Name & Status -->
			<div class="mb-1 flex items-center gap-2">
				<span class="rounded bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-400">Booth Name</span>
				<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {statusColor}">{booth.status}</span>
			</div>
			<h2 class="text-xl font-bold text-gray-900 leading-tight">{booth.title}</h2>
			{#if booth.createdAt}<p class="mt-1 text-xs text-gray-400">Created {formatDate(booth.createdAt)}</p>{/if}

			<!-- ═══ Basic Information ═══ -->
			<div class="mt-6 border-t border-gray-200 pt-5">
				<h3 class="mb-4 text-base font-bold text-gray-900">Basic Information</h3>
				<div class="space-y-4">
					<div class="flex items-start gap-3">
						<div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-50">
							<Icon icon="mdi:store-outline" class="h-3.5 w-3.5 text-purple-500" />
						</div>
						<div class="min-w-0">
							<p class="text-xs text-gray-400">Booth Title</p>
							<p class="text-sm font-medium text-gray-800">{booth.title}</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50">
							<Icon icon="mdi:text-box-outline" class="h-3.5 w-3.5 text-blue-500" />
						</div>
						<div class="min-w-0">
							<p class="text-xs text-gray-400">Booth Description</p>
							<p class="text-sm font-medium text-gray-800">{booth.description || 'No description provided'}</p>
						</div>
					</div>
				</div>
			</div>

			<!-- ═══ Resources ═══ -->
			{#if booth.resources?.length > 0}
				<div class="mt-6 border-t border-gray-200 pt-5">
					<h3 class="mb-4 text-base font-bold text-gray-900">Downloadable Resources</h3>
					<div class="space-y-2">
						{#each booth.resources as res, idx}
							<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
								<div class="flex items-center gap-3 min-w-0">
									<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full {res.type === 'PDF' ? 'bg-red-50' : 'bg-blue-50'}">
										<Icon icon={res.type === 'PDF' ? 'mdi:file-pdf-box' : 'mdi:link-variant'} class="h-4 w-4 {res.type === 'PDF' ? 'text-red-500' : 'text-blue-500'}" />
									</div>
									<div class="min-w-0">
										<p class="truncate text-sm font-medium text-gray-800">{res.title}</p>
										<p class="truncate text-[10px] text-gray-400">{res.url}</p>
									</div>
								</div>
								<a href={res.url} target="_blank" rel="noopener noreferrer" class="shrink-0 rounded-md bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200">
									<Icon icon="mdi:open-in-new" class="h-3.5 w-3.5" />
								</a>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- ═══ Additional Details ═══ -->
			<div class="mt-6 border-t border-gray-200 pt-5">
				<h3 class="mb-4 text-base font-bold text-gray-900">Additional Details</h3>
				<div class="space-y-3">
					{#each detailToggles as row}
						<div class="flex items-center gap-3 rounded-lg bg-white p-3">
							<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100">
								<Icon icon={row.icon} class="h-3 w-3 text-gray-500" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-medium text-gray-800">{row.label}</p>
								<p class="text-[11px] leading-tight text-gray-400">{row.desc}</p>
							</div>
							<div class="h-[18px] w-8 shrink-0 rounded-full {row.active ? 'bg-black' : 'bg-gray-200'} relative">
								<div class="absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-all {row.active ? 'left-[15px]' : 'left-[2px]'}"></div>
							</div>
						</div>
					{/each}

					<!-- Files -->
					{#if booth.media?.length > 0}
						<div>
							<div class="flex items-center gap-3 mb-2">
								<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-50">
									<Icon icon="mdi:paperclip" class="h-3 w-3 text-red-400" />
								</div>
								<p class="text-sm font-medium text-gray-800">Files/Attachments</p>
							</div>
							<div class="space-y-2 pl-9">
								{#each booth.media as file, idx}
									<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-2">
										<div class="flex items-center gap-2 min-w-0">
											{#if file.type === 'IMAGE'}
												<img src={file.url} alt="" class="h-8 w-8 shrink-0 rounded object-cover" />
											{:else}
												<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-red-50 text-[8px] font-bold text-red-500">VID</div>
											{/if}
											<div class="min-w-0">
												<p class="truncate text-xs font-medium text-gray-800">File {idx + 1}.{file.type === 'IMAGE' ? 'jpg' : 'mp4'}</p>
												<p class="text-[10px] text-gray-400">Uploaded</p>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Footer -->
		<div class="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
			<span class="text-[10px] text-[#C1C2C2] sm:text-xs">
				{#if booth.updatedAt}Last updated {formatDate(booth.updatedAt)}{/if}
			</span>
			<button on:click={handleEdit} class="flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-bold text-white hover:bg-gray-800">
				<Icon icon="mdi:pencil-outline" class="h-3.5 w-3.5" /> Edit Booth
			</button>
		</div>
	</div>
</div>
{/if}

<style>
	.custom-scrollbar::-webkit-scrollbar { width: 4px; }
	.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
	.custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 9999px; }
</style>
