<script lang="ts">
	import Icon from '@iconify/svelte';

	export let open = false;

	let layoutTypes = ['Stadium', 'Theatre', 'Round Table', 'Conference'];
	let selectedLayout = 'Stadium';
</script>

{#if open}
	<!-- MAIN WRAPPER -->
	<div class="fixed inset-0 z-50 flex h-screen w-full flex-col bg-[#F6F3F7]">
		<!-- TOP BAR -->
		<div class="flex items-center justify-between border-b bg-white px-6 py-3">
			<!-- Left Section -->
			<div class="flex items-center gap-6">
				<button class="rounded-xl border border-pink-300 px-5 py-2 text-black hover:bg-pink-50">
					New project
				</button>

				<h1 class="text-lg font-semibold">Title of the project</h1>
			</div>

			<!-- Center tools -->
			<div class="flex items-center gap-3">
				<button class="rounded-md border p-2 hover:bg-gray-100">
					<Icon icon="mdi:arrow-left" class="h-5 w-5" />
				</button>

				<button class="rounded-md border p-2 hover:bg-gray-100">
					<Icon icon="mdi:arrow-right" class="h-5 w-5" />
				</button>

				<div class="flex items-center gap-1 rounded-md border px-2 py-1">
					<Icon icon="mdi:magnify" class="h-5 w-5 text-gray-500" />
					<span class="text-sm text-gray-700">100%</span>
				</div>
			</div>

			<!-- Right buttons -->
			<div class="flex items-center gap-4">
				<button on:click={() => (open = false)} class="rounded-md border px-4 py-2 text-gray-700">
					Exit
				</button>

				<button
					class="rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2 text-white"
				>
					Save & Publish
				</button>
			</div>
		</div>

		<!-- BODY SECTION -->
		<div class="flex flex-1 overflow-hidden bg-[#FBF8FC] p-4">
			<!-- LEFT SIDEBAR -->
			<div class="flex w-[260px] flex-col gap-5 border-r bg-white p-5">
				<!-- Search -->
				<div class="flex items-center rounded-lg bg-[#F6F6F7] p-2">
					<Icon icon="mdi:magnify" class="mr-2 text-gray-500" />
					<input
						type="text"
						placeholder="Search element"
						class="w-full bg-transparent text-sm outline-none"
					/>
				</div>

				<!-- Layout Elements -->
				<div>
					<h2 class="mb-2 font-semibold text-gray-700">Layout Element</h2>

					<div class="grid grid-cols-3 gap-4">
						<div class="flex cursor-pointer flex-col items-center text-sm text-gray-700">
							<div class="h-10 w-10 rounded-full bg-gray-200"></div>
							Round Table
						</div>

						<div class="flex cursor-pointer flex-col items-center text-sm text-gray-700">
							<div class="h-10 w-10 rounded bg-gray-200"></div>
							Square Table
						</div>

						<div class="flex cursor-pointer flex-col items-center text-sm text-gray-700">
							<Icon icon="mdi:seat" class="h-10 w-10 text-gray-300" />
							Chair
						</div>

						<div class="flex cursor-pointer flex-col items-center text-sm text-gray-700">
							<Icon icon="mdi:door" class="h-10 w-10 text-gray-300" />
							Door
						</div>

						<div class="flex cursor-pointer flex-col items-center text-sm text-gray-700">
							<Icon icon="mdi:podium" class="h-10 w-10 text-gray-300" />
							Stage
						</div>

						<div class="flex cursor-pointer flex-col items-center text-sm text-gray-700">
							<Icon icon="mdi:toilet" class="h-10 w-10 text-gray-300" />
							Rest room
						</div>

						<div class="flex cursor-pointer flex-col items-center text-sm text-gray-700">
							<div class="h-10 w-10 rounded-md border-2 border-gray-300"></div>
							Rectangle
						</div>

						<div class="flex cursor-pointer flex-col items-center text-sm text-gray-700">
							<div class="h-10 w-10 rounded-full border-2 border-gray-300"></div>
							Circle
						</div>

						<div class="flex cursor-pointer flex-col items-center text-sm text-gray-700">
							<div class="h-1 w-10 bg-gray-300"></div>
							Straight
						</div>
					</div>
				</div>

				<!-- Shapes -->
				<div>
					<h2 class="mb-2 font-semibold text-gray-700">Shapes Element</h2>

					<div class="grid grid-cols-4 gap-4">
						<div class="flex flex-col items-center text-sm text-gray-700">
							<div class="h-10 w-10 rounded-full border-2 border-gray-300"></div>
							Circle
						</div>

						<div class="flex flex-col items-center text-sm text-gray-700">
							<div class="h-10 w-10 rounded border-2 border-gray-300"></div>
							Square
						</div>

						<div class="flex flex-col items-center text-sm text-gray-700">
							<div class="h-10 w-10 border-2 border-gray-300"></div>
							Rectangle
						</div>

						<div class="flex flex-col items-center text-sm text-gray-700">
							<div class="h-10 w-10 border-2 border-gray-300"></div>
							Triangle
						</div>
					</div>
				</div>
			</div>

			<!-- WORKSPACE / CANVAS -->
			<div class="flex flex-1 items-center justify-center">
				<div class="text-xl text-gray-400"></div>
			</div>

			<!-- RIGHT SIDEBAR -->
			<div class="flex w-[260px] flex-col gap-6 border-l bg-white p-5">
				<div>
					<h2 class="mb-1 font-semibold text-gray-700">Layout type</h2>

					<select bind:value={selectedLayout} class="w-full rounded-lg border bg-white p-2">
						{#each layoutTypes as t}
							<option value={t}>{t}</option>
						{/each}
					</select>
				</div>

				<div>
					<h2 class="mb-1 font-semibold text-gray-700">Layout</h2>

					<div class="flex items-center gap-2">
						<input placeholder="W 400" class="w-full rounded-lg border bg-[#F7F8F9] p-2 text-sm" />
						<input placeholder="H 400" class="w-full rounded-lg border bg-[#F7F8F9] p-2 text-sm" />
					</div>
				</div>

				<!-- Export -->
				<div>
					<h2 class="mb-1 font-semibold text-gray-700">Export Layout</h2>

					<div class="mb-3 flex items-center gap-2">
						<select class="w-full rounded-lg border bg-white p-2 text-sm">
							<option>PNG</option>
							<option>JPG</option>
							<option>SVG</option>
						</select>
						<button class="rounded-lg bg-gray-200 p-2 px-4 text-gray-700">Export</button>
					</div>

					<button class="mb-2 w-full rounded-lg bg-gray-200 py-2 text-gray-700"> Preview </button>

					<button class="w-full rounded-lg bg-gray-200 py-2 text-gray-700"> Save update </button>
				</div>
			</div>
		</div>
	</div>
{/if}
