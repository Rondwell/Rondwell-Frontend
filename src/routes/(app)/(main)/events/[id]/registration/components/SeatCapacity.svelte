<script lang="ts">
	import { page } from '$app/stores';
	import { deleteSeatLayout, getSeatLayouts } from '$lib/services/event.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import TemplateModal from './modal/TemplateModal.svelte';
	import SeatCanvasBuilder from './SeatCanvasBuilder.svelte';

	export let eventData: any = null;

	$: eventId = $page.params.id as string;

	let layouts: any[] = [];
	let loading = true;
	let showTemplateModal = false;
	let showEditor = false;
	let editingLayoutId: string | null = null;

	onMount(async () => {
		await fetchLayouts();
	});

	async function fetchLayouts() {
		loading = true;
		try {
			layouts = await getSeatLayouts(eventId);
		} catch {
			layouts = [];
		} finally {
			loading = false;
		}
	}

	function openCreateFromScratch() {
		editingLayoutId = null;
		showEditor = true;
	}

	function openEditLayout(layoutId: string) {
		editingLayoutId = layoutId;
		showEditor = true;
	}

	async function handleDelete(layoutId: string) {
		if (!confirm('Are you sure you want to delete this design?')) return;
		try {
			await deleteSeatLayout(eventId, layoutId);
			await fetchLayouts();
		} catch (e: any) {
			alert(e.message ?? 'Failed to delete');
		}
	}

	function handleEditorClose() {
		showEditor = false;
		editingLayoutId = null;
		fetchLayouts();
	}

	function formatDate(d: string) {
		return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
	}
</script>

{#if showEditor}
	<SeatCanvasBuilder
		{eventId}
		layoutId={editingLayoutId}
		on:close={handleEditorClose}
	/>
{:else}
	<div class="relative">
		{#if loading}
			<div class="flex items-center justify-center py-20">
				<Icon icon="mdi:loading" class="h-8 w-8 animate-spin text-gray-400" />
			</div>
		{:else if layouts.length === 0}
			<!-- Empty State (reusing Rooms pattern) -->
			<div class="mb-6">
				<h2 class="mb-1 text-lg font-semibold">
					Seating & Capacity Management for {eventData?.title ?? 'Your Event'}
				</h2>
				<p class="mb-4 w-[70%] text-sm text-[#8C8F93]">
					Design and manage your event's seating plan. Create a layout from scratch, use a template,
					and map seats to your ticket types
				</p>
			</div>
			<div
				class="relative flex flex-col justify-between gap-3 rounded-lg border-3 border-dashed border-gray-300 p-6 lg:flex-row lg:items-center lg:pr-10"
			>
				<div class="space-y-3">
					<h2 class="text-xl font-semibold text-gray-600">Create Seating Layout</h2>
					<p class="max-w-[70%] text-sm text-gray-400">
						Set up and manage the seating arrangement for your event venue. Design how seats will be
						positioned and map them to ticket types.
					</p>
					<div class="flex items-center gap-2">
						<button
							on:click={openCreateFromScratch}
							class="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700"
						>
							<Icon icon="mdi:plus" class="text-xl" />
							Create from scratch
						</button>
						<div use:clickOutside={() => (showTemplateModal = false)} class="relative">
							<button
								on:click={() => (showTemplateModal = !showTemplateModal)}
								class="flex items-center gap-2 rounded-lg bg-[#EBECED] px-4 py-2 text-sm text-black"
							>
								<Icon icon="mdi:view-grid-outline" class="text-xl" />
								Browse template
							</button>
							<TemplateModal bind:open={showTemplateModal} />
						</div>
					</div>
				</div>
				<img src="/rooms.svg" alt="" class="w-50" />
			</div>
		{:else}
			<!-- Has Designs -->
			<div class="mb-6">
				<h2 class="mb-1 text-lg font-semibold">
					Seating & Capacity Management for {eventData?.title ?? 'Your Event'}
				</h2>
				<p class="mb-4 w-[70%] text-sm text-[#8C8F93]">
					Design and manage your event's seating plan. Create a layout from scratch, use a template,
					and map seats to your ticket types
				</p>
			</div>
			<div>
				<div class="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
					<span class="text-lg font-semibold text-gray-900">Your design</span>
					<div class="flex items-center gap-2">
						<div use:clickOutside={() => (showTemplateModal = false)} class="relative">
							<button
								on:click={() => (showTemplateModal = !showTemplateModal)}
								class="rounded-md bg-gray-800 p-3 text-sm font-medium text-white hover:bg-gray-700"
							>
								Browse template
							</button>
							<TemplateModal bind:open={showTemplateModal} />
						</div>
						<button
							on:click={openCreateFromScratch}
							class="rounded-md bg-gray-800 p-3 text-sm font-medium text-white hover:bg-gray-700"
						>
							Create from scratch
						</button>
					</div>
				</div>

				<div class="mt-4 grid gap-6 lg:grid-cols-2">
					{#each layouts as layout}
						<div class="w-full overflow-hidden rounded-xl bg-white p-4 shadow-md">
							<!-- Canvas Preview -->
							<div
								class="relative flex h-60 w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-gray-50 to-gray-100"
							>
								{#if layout.elements && layout.elements.length > 0}
									<svg
										viewBox="0 0 {layout.canvasWidth || 1200} {layout.canvasHeight || 800}"
										class="h-full w-full"
										preserveAspectRatio="xMidYMid meet"
									>
										{#each layout.elements as el}
											{#if el.type === 'CHAIR' || el.type === 'BIG_CHAIR'}
												<rect
													x={el.x}
													y={el.y}
													width={el.width}
													height={el.height}
													rx="4"
													fill={el.ticketColor || (el.type === 'BIG_CHAIR' ? '#8B5CF6' : '#F5A623')}
													opacity="0.85"
												/>
											{:else if el.type === 'STAGE'}
												<rect
													x={el.x}
													y={el.y}
													width={el.width}
													height={el.height}
													rx="8"
													fill="#E8E8E8"
													stroke="#BDBDBD"
													stroke-width="2"
												/>
												<text
													x={el.x + el.width / 2}
													y={el.y + el.height / 2 + 5}
													text-anchor="middle"
													font-size="14"
													fill="#666">Stage</text
												>
											{:else if el.type === 'ROUND_TABLE'}
												<circle
													cx={el.x + el.width / 2}
													cy={el.y + el.height / 2}
													r={Math.min(el.width, el.height) / 2}
													fill={el.ticketColor || '#D4A574'}
													opacity="0.7"
												/>
											{:else if el.type === 'SQUARE_TABLE'}
												<rect
													x={el.x}
													y={el.y}
													width={el.width}
													height={el.height}
													fill={el.ticketColor || '#D4A574'}
													opacity="0.7"
												/>
											{:else if el.type === 'RECTANGLE'}
												<rect
													x={el.x}
													y={el.y}
													width={el.width}
													height={el.height}
													fill="none"
													stroke="#999"
													stroke-width="2"
												/>
											{:else if el.type === 'CIRCLE'}
												<circle
													cx={el.x + el.width / 2}
													cy={el.y + el.height / 2}
													r={Math.min(el.width, el.height) / 2}
													fill="none"
													stroke="#999"
													stroke-width="2"
												/>
											{:else}
												<rect
													x={el.x}
													y={el.y}
													width={el.width}
													height={el.height}
													rx="2"
													fill={el.ticketColor || '#CCC'}
													opacity="0.6"
												/>
											{/if}
										{/each}
									</svg>
								{:else}
									<span class="text-sm text-gray-400">No elements</span>
								{/if}
								<!-- Status badge -->
								<span
									class="absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium {layout.status ===
									'PUBLISHED'
										? 'bg-green-100 text-green-700'
										: 'bg-gray-200 text-gray-600'}"
								>
									{layout.status}
								</span>
							</div>

							<div class="pt-4">
								<h2 class="mb-1 text-lg font-semibold">{layout.title}</h2>
								<p class="text-sm text-gray-600">{layout.layoutType}</p>
								<p class="mt-1 text-xs text-gray-500">
									Created on {formatDate(layout.createdAt)}
								</p>

								<div class="mt-4 flex items-center gap-2">
									<button
										on:click={() => openEditLayout(layout.layoutId)}
										class="flex items-center gap-1 rounded-md bg-black px-3 py-1.5 text-sm text-white"
									>
										<Icon icon="mdi:eye-outline" class="text-base" />
										View
									</button>
									<button
										on:click={() => openEditLayout(layout.layoutId)}
										class="flex items-center gap-1 rounded-md border border-gray-800 px-3 py-1.5 text-sm"
									>
										<Icon icon="mdi:pencil-outline" class="text-base" />
										Edit
									</button>
									<button
										on:click={() => handleDelete(layout.layoutId)}
										class="flex items-center gap-1 rounded-md border border-red-400 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
									>
										<Icon icon="mdi:delete-outline" class="text-base" />
										Delete
									</button>
								</div>

								{#if layout.status === 'DRAFT'}
									<button
										on:click={() => openEditLayout(layout.layoutId)}
										class="mt-4 w-full rounded-md bg-gradient-to-r from-pink-500 to-indigo-600 py-3 text-sm font-medium text-white"
									>
										Continue editing
									</button>
								{:else}
									<button
										class="mt-4 w-full rounded-md bg-gradient-to-r from-pink-500 to-indigo-600 py-3 text-sm font-medium text-white"
									>
										Use design
									</button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}
