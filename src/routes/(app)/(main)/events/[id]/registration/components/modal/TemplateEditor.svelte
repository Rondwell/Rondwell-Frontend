<script lang="ts">
	import Icon from '@iconify/svelte';

	export let open = false;

	let layoutTypes = ['Stadium', 'Theatre', 'Round Table', 'Conference'];
	let selectedLayout = 'Stadium';
	let activeTab = 'layout'; // 'layout' or 'shapes'
	let showSidebar = false;
</script>

{#if open}
	<!-- MAIN WRAPPER -->
	<div class="fixed inset-0 z-50 flex h-screen w-full flex-col bg-[#F6F3F7]">
		<!-- TOP BAR -->
		<div class="flex items-center justify-between border-b bg-white px-3 py-2 sm:px-6 sm:py-3">
			<!-- Left Section - Hidden on mobile -->
			<div class="hidden items-center gap-6 sm:flex">
			<button class="rounded-lg border border-pink-300 px-5 py-2 text-black hover:bg-pink-50">
				New project
			</button>

			<h1 class="text-lg font-semibold">Title of the project</h1>
		</div>

		<!-- Mobile Title -->
		<h1 class="text-sm font-semibold sm:hidden">Rondwell</h1>

		<!-- Center tools - Hidden on mobile -->
		<div class="hidden items-center gap-3 sm:flex">
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

		<!-- Right buttons - Compact on mobile -->
		<div class="flex items-center gap-2 sm:gap-4">
			<!-- Mobile Menu Toggle -->
			<button
				on:click={() => (showSidebar = !showSidebar)}
				class="rounded-md border p-2 sm:hidden hover:bg-gray-100"
			>
				<Icon icon="mdi:menu" class="h-5 w-5" />
			</button>

			<button on:click={() => (open = false)} class="rounded-md border px-2 py-1 text-xs text-gray-700 sm:px-4 sm:py-2 sm:text-base">
				Exit
			</button>

			<button
				class="rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-1 text-xs text-white sm:px-5 sm:py-2 sm:text-base"
			>
				Save
			</button>
		</div>
	</div>

		<!-- BODY SECTION -->
	<div class="flex flex-1 overflow-hidden bg-[#FBF8FC]">
		<!-- LEFT SIDEBAR - Desktop only, or mobile overlay -->
		<div
			class={`absolute bottom-0 left-0 top-12 z-40 w-full overflow-y-auto border-r bg-white transition-transform duration-300 sm:relative sm:top-0 sm:z-0 sm:w-[260px] sm:translate-x-0 ${
				showSidebar ? 'translate-x-0' : '-translate-x-full'
			}`}
		>
			<div class="flex flex-col gap-5 p-5">
				<!-- Search -->
				<div class="flex items-center rounded-lg bg-[#F6F6F7] p-2">
					<Icon icon="mdi:magnify" class="mr-2 text-gray-500" />
					<input
						type="text"
						placeholder="Search element"
						class="w-full bg-transparent text-sm outline-none"
					/>
				</div>

				<!-- Tabs for mobile -->
				<div class="flex gap-2 sm:hidden">
					<button
						on:click={() => (activeTab = 'layout')}
						class={`flex-1 rounded-lg py-2 text-xs font-medium ${
							activeTab === 'layout' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
						}`}
					>
						Layout
					</button>
					<button
						on:click={() => (activeTab = 'shapes')}
						class={`flex-1 rounded-lg py-2 text-xs font-medium ${
							activeTab === 'shapes' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
						}`}
					>
						Shapes
					</button>
				</div>

				<!-- Layout Elements -->
				{#if activeTab === 'layout'}
					<div>
						<h2 class="mb-2 font-semibold text-gray-700">Layout Element</h2>

						<div class="grid grid-cols-3 gap-2 sm:gap-4">
							<div class="flex cursor-pointer flex-col items-center justify-center  text-xs text-gray-700">
								<div class="border border-[#A7A7A7] rounded-xl p-3 flex items-center mb-1 justify-center">
									<div class="h-10 w-10 rounded-full bg-gray-200"></div>
								</div>
								Round Table
							</div>

							<div class="flex cursor-pointer flex-col items-center justify-center  text-xs text-gray-700">
								<div class="border border-[#A7A7A7] rounded-xl p-3 flex items-center mb-1 justify-center">
									<div class="h-10 w-10 rounded bg-gray-200"></div>
								</div>
								Square Table
							</div>

							<div class="flex cursor-pointer flex-col items-center justify-center  text-xs text-gray-700">
								<div class="border border-[#A7A7A7] rounded-xl p-3 flex items-center mb-1 justify-center">
									<Icon icon="mdi:seat" class="h-10 w-10 text-gray-300" />
								</div>
								Chair
							</div>

							<div class="flex cursor-pointer flex-col items-center justify-center  text-xs text-gray-700">
								<div class="border border-[#A7A7A7] rounded-xl p-3 flex items-center mb-1 justify-center">
									<Icon icon="mdi:door" class="h-10 w-10 text-gray-300" />
								</div>
								Door
							</div>

							<div class="flex cursor-pointer flex-col items-center justify-center  text-xs text-gray-700">
								<div class="border border-[#A7A7A7] rounded-xl p-3 flex items-center mb-1 justify-center">
									<Icon icon="mdi:podium" class="h-10 w-10 text-gray-300" />
								</div>
								Stage
							</div>

							<div class="flex cursor-pointer flex-col items-center justify-center  text-xs text-gray-700">
								<div class="border border-[#A7A7A7] rounded-xl p-3 flex items-center mb-1 justify-center">
									<Icon icon="mdi:toilet" class="h-10 w-10 text-gray-300" />
								</div>
								Rest room
							</div>

							<div class="flex cursor-pointer flex-col items-center justify-center  text-xs text-gray-700">
								<div class="border border-[#A7A7A7] rounded-xl p-3 flex items-center mb-1 justify-center">
									<div class="h-10 w-10 rounded-md border-2 border-gray-300"></div>
								</div>
								Rectangle
							</div>

							<div class="flex cursor-pointer flex-col items-center justify-center  text-xs text-gray-700">
								<div class="border border-[#A7A7A7] rounded-xl p-3 flex items-center mb-1 justify-center">
									<div class="h-10 w-10 rounded-full border-2 border-gray-300"></div>
								</div>
								Circle
							</div>

							<div class="flex cursor-pointer flex-col items-center justify-center  text-xs text-gray-700">
								<div class="border border-[#A7A7A7] rounded-xl w-16 h-16 p-3 flex items-center mb-1 justify-center">
									<div class="w-1 h-10 bg-gray-300"></div>
								</div>
								Straight
							</div>
						</div>
					</div>
				{/if}

					<!-- Shapes -->
					{#if activeTab === 'shapes'}
						<div>
							<h2 class="mb-2 font-semibold text-gray-700">Shapes Element</h2>

							<div class="grid grid-cols-3 gap-2 sm:gap-4">
								<div class="flex flex-col items-center text-xs sm:text-sm text-gray-700">
									<div class="h-10 w-10 rounded-full border-2 border-gray-300 mb-1"></div>
									Circle
								</div>

								<div class="flex flex-col items-center text-xs sm:text-sm text-gray-700">
									<div class="h-10 w-10 rounded border-2 border-gray-300 mb-1"></div>
									Square
								</div>

								<div class="flex flex-col items-center text-xs sm:text-sm text-gray-700">
									<div class="w-0 h-0 
										border-l-[20px] border-l-transparent 
										border-r-[20px] border-r-transparent 
										border-b-[35px] border-b-gray-500 mb-1">
									</div>
									Triangle
								</div>
							</div>
						</div>
					{/if}

					<!-- Desktop Shapes Section (always visible on desktop) -->
					<div class="hidden sm:block">
						{#if activeTab === 'layout'}
							<div>
								<h2 class="mb-2 font-semibold text-gray-700">Shapes Element</h2>

								<div class="grid grid-cols-3 gap-4">
									<div class="flex flex-col items-center text-sm text-gray-700">
										<div class="h-10 w-10 rounded-full border-2 border-gray-300 mb-1"></div>
										Circle
									</div>

									<div class="flex flex-col items-center text-sm text-gray-700">
										<div class="h-10 w-10 rounded border-2 border-gray-300 mb-1"></div>
										Square
									</div>

									<div class="flex flex-col items-center text-sm text-gray-700">
										<div class="w-0 h-0 
											border-l-[20px] border-l-transparent 
											border-r-[20px] border-r-transparent 
											border-b-[35px] border-b-gray-500 mb-1">
										</div>
										Triangle
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- WORKSPACE / CANVAS -->
			<div class="flex flex-1 items-center justify-center p-2 sm:p-4">
				<div class="text-lg sm:text-xl text-gray-400">Canvas Area</div>
			</div>

			<!-- RIGHT SIDEBAR - Hidden on mobile, visible on desktop -->
			<div class="hidden w-[260px] flex-col gap-6 border-l bg-white p-5 md:flex">
				<div>
					<h2 class="mb-1 font-semibold text-gray-700">Layout type</h2>

					<select bind:value={selectedLayout} class="w-full rounded-lg border bg-white p-2 text-sm">
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

		<!-- MOBILE BOTTOM PANEL - Settings accessible via sheet on mobile -->
		<div class="flex md:hidden border-t bg-white gap-2 p-3">
			<select bind:value={selectedLayout} class="flex-1 rounded-lg border bg-white p-2 text-xs">
				{#each layoutTypes as t}
					<option value={t}>{t}</option>
				{/each}
			</select>

			<select class="flex-1 rounded-lg border bg-white p-2 text-xs">
				<option>PNG</option>
				<option>JPG</option>
				<option>SVG</option>
			</select>

			<button class="rounded-lg bg-gray-200 px-3 py-2 text-xs text-gray-700">Export</button>
		</div>
	</div>
{/if}
