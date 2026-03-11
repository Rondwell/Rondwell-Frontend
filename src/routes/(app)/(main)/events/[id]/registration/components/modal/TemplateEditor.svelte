<script lang="ts">
	import { goto } from '$app/navigation';
	// import { activeSubItem, showSubMenu, subMenuItems } from '$lib/stores/uiStore.js';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import ProfileMenu from '../../../../../../components/ProfileMenu.svelte';

	export let open = false;

	let layoutTypes = ['Stadium', 'Theatre', 'Round Table', 'Conference'];
	let selectedLayout = 'Stadium';
	let activeTab = 'layout'; // 'layout' or 'shapes'
	let showSidebar = false;
	let showAddElement = false;
	let showMenu = false;
	let showMoreMenu = false;

	function goHome() {
		goto('/overview');
		// showSubMenu.set(false);
		// subMenuItems.set([]);
		// activeSubItem.set('');
	}
</script>

{#if open}
	<!-- MAIN WRAPPER -->
	<div class="fixed inset-0 z-50 flex h-screen w-full flex-col bg-[#F6F3F7]">
		<!-- TOP BAR -->
		<div class="border-b bg-white">
			<!-- MOBILE HEADER -->
			<div class="relative md:hidden">
				<div class="flex items-center justify-between bg-[#FCF9FB] px-4 py-3">
					<div use:clickOutside={() => (showMenu = false)}>
						<button
							on:click={() => {
								showMenu = !showMenu;
							}}
						>
							<img src="/face-1.svg" alt="" />
						</button>

						<ProfileMenu bind:showMenu className="absolute top-15 left-5 md:hidden" />
					</div>

					<button on:click={goHome}>
						<img src="/logo.svg" alt="Rondwell Logo" class="h-8 w-auto" />
					</button>

					<img src="/notification.svg" alt="" />
				</div>
				<!-- Row 2 (Editor tools) -->
				<div class="flex items-center gap-2 bg-[#FFFFFF] p-4">
					<button class="rounded-md border p-2 hover:bg-gray-100">
						<img src="/Undo.svg" alt="Undo" class="h-5 w-5" />
					</button>

					<button class="rounded-md border p-2 hover:bg-gray-100">
						<img src="/redo.svg" alt="Redo" class="h-5 w-5" />
					</button>

					<button class="rounded-md border p-2 hover:bg-gray-100">
						<img src="/search-zoom-in.svg" alt="Zoom In" class="h-5 w-5" />
					</button>

					<button class="rounded-md border p-2 hover:bg-gray-100">
						<img src="/search-zoom-out.svg" alt="Zoom Out" class="h-5 w-5" />
					</button>

					<button
						class="rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2 text-white"
					>
						Save & Publish
					</button>
					<button on:click={() => (showMoreMenu = !showMoreMenu)}>
						<Icon icon="mdi:dots-horizontal" class="h-6 w-6 text-gray-600" />
					</button>
				</div>

				{#if showMoreMenu}
					<div class="top-38 absolute z-50 w-full px-4 md:hidden">
						<div class="w-full rounded-xl border bg-white p-4 shadow-lg">
							<h2 class="mb-3 text-sm font-semibold text-gray-700">Export Layout</h2>

							<div class="mb-3 flex gap-2">
								<select class="flex-1 rounded-lg border bg-white p-2 text-sm">
									<option>PNG</option>
									<option>JPG</option>
									<option>SVG</option>
								</select>

								<button class="flex-1 rounded-lg bg-gray-200 py-2 text-sm"> Export </button>
							</div>

							<button class="mb-2 w-full rounded-lg bg-gray-200 py-2 text-sm"> Preview </button>

							<button class="w-full rounded-lg bg-gray-200 py-2 text-sm"> New design </button>
						</div>
					</div>
				{/if}
			</div>

			<!-- DESKTOP HEADER -->
			<div class="hidden items-center justify-between px-6 py-3 sm:flex">
				<div class="flex items-center gap-6">
					<button class="rounded-lg border border-pink-300 px-5 py-2 text-black hover:bg-pink-50">
						New project
					</button>

					<h1 class="text-lg font-semibold">Title of the project</h1>
				</div>

				<div class="flex items-center gap-3">
					<button class="rounded-md border p-2 hover:bg-gray-100">
						<img src="/Undo.svg" alt="Undo" class="h-5 w-5" />
					</button>

					<button class="rounded-md border p-2 hover:bg-gray-100">
						<img src="/redo.svg" alt="Redo" class="h-5 w-5" />
					</button>

					<div class="flex items-center gap-2 rounded-md border p-2">
						<img src="/search-zoom-in.svg" alt="Zoom In" class="h-5 w-5" />
						<img src="/search-zoom-out.svg" alt="Zoom Out" class="h-5 w-5 text-gray-500" />
						<span class="text-sm text-gray-700">100%</span>
					</div>
				</div>

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
								activeTab === 'layout'
									? 'bg-purple-100 text-purple-700'
									: 'bg-gray-100 text-gray-700'
							}`}
						>
							Layout
						</button>
						<button
							on:click={() => (activeTab = 'shapes')}
							class={`flex-1 rounded-lg py-2 text-xs font-medium ${
								activeTab === 'shapes'
									? 'bg-purple-100 text-purple-700'
									: 'bg-gray-100 text-gray-700'
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
								<div
									class="flex cursor-pointer flex-col items-center justify-center text-xs text-gray-700"
								>
									<div
										class="mb-1 flex items-center justify-center rounded-xl border border-[#A7A7A7] p-3"
									>
										<div class="h-8 w-8 rounded-full bg-gray-200"></div>
									</div>
									Round Table
								</div>

								<div
									class="flex cursor-pointer flex-col items-center justify-center text-xs text-gray-700"
								>
									<div
										class="mb-1 flex items-center justify-center rounded-xl border border-[#A7A7A7] p-3"
									>
										<div class="h-8 w-8 rounded bg-gray-200"></div>
									</div>
									Square Table
								</div>

								<div
									class="flex cursor-pointer flex-col items-center justify-center text-xs text-gray-700"
								>
									<div
										class="mb-1 flex items-center justify-center rounded-xl border border-[#A7A7A7] p-3"
									>
										<Icon icon="mdi:seat" class="h-8 w-8 text-gray-300" />
									</div>
									Chair
								</div>

								<div
									class="flex cursor-pointer flex-col items-center justify-center text-xs text-gray-700"
								>
									<div
										class="mb-1 flex items-center justify-center rounded-xl border border-[#A7A7A7] p-3"
									>
										<Icon icon="mdi:door" class="h-8 w-8 text-gray-300" />
									</div>
									Door
								</div>

								<div
									class="flex cursor-pointer flex-col items-center justify-center text-xs text-gray-700"
								>
									<div
										class="mb-1 flex items-center justify-center rounded-xl border border-[#A7A7A7] p-3"
									>
										<Icon icon="mdi:podium" class="h-8 w-8 text-gray-300" />
									</div>
									Stage
								</div>

								<div
									class="flex cursor-pointer flex-col items-center justify-center text-xs text-gray-700"
								>
									<div
										class="mb-1 flex items-center justify-center rounded-xl border border-[#A7A7A7] p-3"
									>
										<Icon icon="mdi:toilet" class="h-8 w-8 text-gray-300" />
									</div>
									Rest room
								</div>

								<div
									class="flex cursor-pointer flex-col items-center justify-center text-xs text-gray-700"
								>
									<div
										class="mb-1 flex items-center justify-center rounded-xl border border-[#A7A7A7] p-3"
									>
										<div class="h-8 w-8 rounded-md border-2 border-gray-300"></div>
									</div>
									Rectangle
								</div>

								<div
									class="flex cursor-pointer flex-col items-center justify-center text-xs text-gray-700"
								>
									<div
										class="mb-1 flex items-center justify-center rounded-xl border border-[#A7A7A7] p-3"
									>
										<div class="h-8 w-8 rounded-full border-2 border-gray-300"></div>
									</div>
									Circle
								</div>

								<div
									class="flex cursor-pointer flex-col items-center justify-center text-xs text-gray-700"
								>
									<div
										class="mb-1 flex h-16 w-16 items-center justify-center rounded-xl border border-[#A7A7A7] p-3"
									>
										<div class="h-8 w-1 bg-gray-300"></div>
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
								<div class="flex flex-col items-center text-xs text-gray-700 sm:text-sm">
									<div class="mb-1 h-8 w-8 rounded-full border-2 border-gray-300"></div>
									Circle
								</div>

								<div class="flex flex-col items-center text-xs text-gray-700 sm:text-sm">
									<div class="mb-1 h-8 w-8 rounded border-2 border-gray-300"></div>
									Square
								</div>

								<div class="flex flex-col items-center text-xs text-gray-700 sm:text-sm">
									<div
										class="mb-1 h-0
										w-0 border-b-[35px]
										border-l-[20px] border-r-[20px]
										border-b-gray-500 border-l-transparent border-r-transparent"
									></div>
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
										<div class="mb-1 h-8 w-8 rounded-full border-2 border-gray-300"></div>
										Circle
									</div>

									<div class="flex flex-col items-center text-sm text-gray-700">
										<div class="mb-1 h-8 w-8 rounded border-2 border-gray-300"></div>
										Square
									</div>

									<div class="flex flex-col items-center text-sm text-gray-700">
										<div
											class="mb-1 h-0
											w-0 border-b-[35px]
											border-l-[20px] border-r-[20px]
											border-b-gray-500 border-l-transparent border-r-transparent"
										></div>
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
				<div class="text-lg text-gray-400 sm:text-xl">Canvas Area</div>
			</div>

			<!-- RIGHT SIDEBAR - Hidden on mobile, visible on desktop -->
			<div class="hidden w-[300px] flex-col gap-6 overflow-y-auto border-l bg-white p-5 md:flex">
				<!-- Layout Type -->
				<div>
					<h2 class="mb-1 text-sm font-semibold text-gray-700">Layout type</h2>

					<select bind:value={selectedLayout} class="w-full rounded-lg border bg-white p-2 text-sm">
						{#each layoutTypes as t}
							<option value={t}>{t}</option>
						{/each}
					</select>
				</div>

				<!-- Layout -->
				<div>
					<h2 class="mb-2 text-sm font-semibold text-gray-700">Layout</h2>

					<div class="mb-2 grid grid-cols-2 gap-2">
						<input placeholder="W 400" class="rounded-lg border bg-[#F7F8F9] p-2 text-sm" />

						<input placeholder="H 400" class="rounded-lg border bg-[#F7F8F9] p-2 text-sm" />
					</div>

					<div class="flex items-center gap-2">
						<input placeholder="0°" class="w-[70px] rounded-lg border bg-[#F7F8F9] p-2 text-sm" />

						<button class="rounded-md border p-2 hover:bg-gray-100">
							<Icon icon="mdi:lock-outline" class="h-4 w-4" />
						</button>

						<button class="rounded-md border p-2 hover:bg-gray-100">
							<Icon icon="mdi:flip-horizontal" class="h-4 w-4" />
						</button>

						<button class="rounded-md border p-2 hover:bg-gray-100">
							<Icon icon="mdi:flip-vertical" class="h-4 w-4" />
						</button>
					</div>
				</div>

				<!-- Select Ticket Type -->
				<div>
					<h2 class="mb-1 text-sm font-semibold text-gray-700">Select Ticket Type</h2>

					<select class="w-full rounded-lg border bg-white p-2 text-sm">
						<option>VIP Ticket</option>
						<option>Standard Ticket</option>
						<option>Premium Ticket</option>
					</select>
				</div>

				<!-- Ticket Price -->
				<div>
					<h2 class="mb-1 text-sm font-semibold text-gray-700">Ticket price</h2>

					<input placeholder="10 USD" class="w-full rounded-lg border bg-[#F7F8F9] p-2 text-sm" />
				</div>

				<!-- Ticket Color -->
				<div>
					<h2 class="mb-1 text-sm font-semibold text-gray-700">ticket color</h2>

					<div class="flex items-center gap-2 rounded-lg border p-2">
						<input type="color" value="#f72424" class="h-6 w-6 border-none p-0 outline-none" />

						<input value="#f72424" class="flex-1 bg-transparent text-sm outline-none" />
					</div>
				</div>

				<!-- Export Layout -->
				<div>
					<h2 class="mb-2 text-sm font-semibold text-gray-700">Export Layout</h2>

					<div class="mb-2 flex gap-2">
						<select class="flex-1 rounded-lg border bg-white p-2 text-sm">
							<option>PNG</option>
							<option>JPG</option>
							<option>SVG</option>
						</select>

						<button class="rounded-lg bg-gray-200 px-4 text-sm text-gray-700"> Export </button>
					</div>

					<button class="w-full rounded-lg bg-gray-200 py-2 text-sm text-gray-700">
						Preview
					</button>
				</div>
			</div>
		</div>

		<!-- MOBILE BOTTOM PANEL - Settings accessible via sheet on mobile -->
		<div class="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-2 md:hidden">
			<div class="flex items-center gap-2 overflow-x-auto rounded-xl border bg-[#F7F7F8] p-2">
				<!-- Add Button -->
				<button
					on:click={() => (showAddElement = true)}
					class="h-15 w-15 flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
				>
					<div class="flex h-8 w-8 items-center justify-center rounded-full border border-white">
						<Icon icon="mdi:plus" class="h-5 w-5" />
					</div>
				</button>

				<!-- Ticket Type -->
				<select class="h-10 rounded-md border border-[#B0B0B0] bg-white px-2 py-1 text-xs">
					<option>VIP Ticket</option>
					<option>Standard</option>
				</select>

				<!-- Width -->
				<input
					placeholder="W 400"
					class="h-10 w-[70px] rounded-md border border-[#B0B0B0] bg-white px-2 py-1 text-xs"
				/>

				<!-- Height -->
				<input
					placeholder="H 400"
					class="h-10 w-[70px] rounded-md border border-[#B0B0B0] bg-white px-2 py-1 text-xs"
				/>

				<!-- Rotate -->
				<input
					placeholder="0°"
					class="h-10 w-[50px] rounded-md border border-[#B0B0B0] bg-white px-2 py-1 text-xs"
				/>

				<!-- Lock -->
				<button class="h-10 rounded-md border border-[#B0B0B0] p-1">
					<Icon icon="mdi:lock-outline" class="h-4 w-4 text-gray-600" />
				</button>

				<!-- Flip -->
				<button class="h-10 rounded-md border border-[#B0B0B0] p-1">
					<Icon icon="mdi:flip-horizontal" class="h-4 w-4 text-gray-600" />
				</button>

				<!-- Seat -->
				<input
					placeholder="Seat no"
					class="h-10 w-[70px] rounded-md border border-[#B0B0B0] bg-white px-2 py-1 text-xs"
				/>

				<!-- Price -->
				<input
					placeholder="Price 10 USD"
					class="h-10 w-[95px] rounded-md border border-[#B0B0B0] bg-white px-2 py-1 text-xs"
				/>

				<!-- Color -->
				<div class="flex h-10 items-center gap-1 rounded-md border border-[#B0B0B0] px-2 py-1">
					<input type="color" value="#f72424" class="h-4 w-4 border-none p-0 outline-none" />
					<span class="text-xs text-gray-600">#f72424</span>
				</div>
			</div>
		</div>
	</div>

	{#if showAddElement}
		<div class="fixed inset-0 z-50 flex items-end bg-black/30 md:hidden">
			<!-- PANEL -->
			<div class="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4">
				<!-- HEADER -->
				<div class="mb-3 flex items-center justify-between">
					<h2 class="text-sm font-semibold">Add element</h2>

					<button on:click={() => (showAddElement = false)}>
						<Icon icon="mdi:close" class="h-5 w-5 text-gray-500" />
					</button>
				</div>

				<!-- SEARCH -->
				<div class="mb-4 flex items-center rounded-lg border px-3 py-2">
					<Icon icon="mdi:magnify" class="mr-2 text-gray-400" />
					<input type="text" placeholder="Search element" class="w-full text-sm outline-none" />
				</div>

				<!-- Layout Elements -->
				<h3 class="mb-2 text-sm font-semibold text-gray-700">Layout Element</h3>

				<div class="mb-5 grid grid-cols-3 gap-4">
					<div class="flex flex-col items-center text-xs">
						<div class="mb-1 rounded-xl border p-3">
							<div class="h-8 w-8 rounded-full bg-gray-300"></div>
						</div>
						Round Table
					</div>

					<div class="flex flex-col items-center text-xs">
						<div class="mb-1 rounded-xl border p-3">
							<div class="h-8 w-8 bg-gray-300"></div>
						</div>
						Square Table
					</div>

					<div class="flex flex-col items-center text-xs">
						<div class="mb-1 rounded-xl border p-3">
							<Icon icon="mdi:seat" class="h-8 w-8 text-gray-300" />
						</div>
						Chair
					</div>

					<div class="flex flex-col items-center text-xs">
						<div class="mb-1 rounded-xl border p-3">
							<Icon icon="mdi:door" class="h-8 w-8 text-gray-300" />
						</div>
						Door
					</div>

					<div class="flex flex-col items-center text-xs">
						<div class="mb-1 rounded-xl border p-3">
							<Icon icon="mdi:podium" class="h-8 w-8 text-gray-300" />
						</div>
						Stage
					</div>

					<div class="flex flex-col items-center text-xs">
						<div class="mb-1 rounded-xl border p-3">
							<Icon icon="mdi:toilet" class="h-8 w-8 text-gray-300" />
						</div>
						Rest room
					</div>

					<div
						class="flex cursor-pointer flex-col items-center justify-center text-xs text-gray-700"
					>
						<div
							class="mb-1 flex items-center justify-center rounded-xl border border-[#A7A7A7] p-3"
						>
							<div class="h-8 w-8 rounded-md border-2 border-gray-300"></div>
						</div>
						Rectangle
					</div>

					<div
						class="flex cursor-pointer flex-col items-center justify-center text-xs text-gray-700"
					>
						<div
							class="mb-1 flex items-center justify-center rounded-xl border border-[#A7A7A7] p-3"
						>
							<div class="h-8 w-8 rounded-full border-2 border-gray-300"></div>
						</div>
						Circle
					</div>

					<div
						class="flex cursor-pointer flex-col items-center justify-center text-xs text-gray-700"
					>
						<div
							class="mb-1 flex h-16 w-16 items-center justify-center rounded-xl border border-[#A7A7A7] p-3"
						>
							<div class="h-8 w-1 bg-gray-300"></div>
						</div>
						Straight
					</div>
				</div>

				<!-- Shapes -->
				<h3 class="mb-2 text-sm font-semibold text-gray-700">Shapes Element</h3>

				<div class="grid grid-cols-4 gap-4">
					<div class="flex flex-col items-center text-xs">
						<div class="mb-1 h-8 w-8 rounded-full border-2"></div>
						Circle
					</div>

					<div class="flex flex-col items-center text-xs">
						<div class="mb-1 h-8 w-8 border-2"></div>
						Square
					</div>

					<div class="flex flex-col items-center text-xs">
						<div class="mb-1 h-6 w-10 border-2"></div>
						Rectangle
					</div>

					<div class="flex flex-col items-center text-xs">
						<div
							class="mb-1 h-0 w-0 border-b-[20px] border-l-[12px] border-r-[12px] border-b-gray-500 border-l-transparent border-r-transparent"
						></div>
						Triangle
					</div>
				</div>
			</div>
		</div>
	{/if}
{/if}
