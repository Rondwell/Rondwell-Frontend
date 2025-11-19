<script lang="ts">
	import Icon from '@iconify/svelte';

	export let open = false;

	// Template data
	const templates = [
		{
			label: 'Theatre / Auditorium seating',
			img: '/Theatre  Auditorium Seating ALLOCATION.png'
		},
		{
			label: 'Stadium / Arena seating',
			img: '/STADIUM SEATING POSITION.png'
		},
		{
			label: 'Round Table Seating',
			img: '/ROUND TABLE SEAT MAP.png'
		},
		{
			label: 'Big Conference Hall',
			img: '/CONFERENCE HALLExhibition SEAT ALLOCATION.png'
		}
	];
</script>

{#if open}
	<!-- Overlay -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
		<!-- Modal -->
		<div
			class="max-h-160 overflow-hidden w-full max-w-2xl rounded-[16px] bg-white p-7 shadow-lg lg:max-w-4xl"
		>
			<!-- Header -->
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold text-black">Template</h2>

				<button
					class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border text-lg text-gray-700"
					on:click={() => (open = false)}
				>
					<Icon icon="mdi:close" class="h-5 w-5" />
				</button>
			</div>

			<!-- Templates Grid -->
			<div class="custom-scrollbar max-h-150 grid grid-cols-1 gap-5 sm:grid-cols-2 overflow-y-auto pb-20 lg:pb-0">
				{#each templates as tem}
					<div class="overflow-hidden rounded-lg bg-[#EDEEEF] p-2 shadow-sm">
						<!-- Image -->
						<div class="flex h-40 w-full items-center justify-center bg-gray-300">
							<img src={tem.img} alt={tem.label} class="h-full w-full object-cover" />
						</div>

						<!-- Bottom Label + Button -->
						<div class="flex flex-col justify-between gap-3 p-4 lg:flex-row lg:items-center">
							<span class="font-medium text-gray-700">{tem.label}</span>

							<button
								class="rounded-md bg-gradient-to-r from-pink-500 to-indigo-600 p-2 text-sm text-white"
							>
								Use Template
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}
