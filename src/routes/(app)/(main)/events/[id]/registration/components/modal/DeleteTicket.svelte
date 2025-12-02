<script lang="ts">
	export let open = false;

	function addTag() {
		open = false;
		// Add your tag creation logic here
	}
</script>

{#if open}
	<div class="absolute -right-5 bottom-[30px] z-40 mt-2 inline-block text-left sm:right-0">
		<div class="relative w-[315px] max-w-lg rounded-lg bg-[#FFFCFC] p-4 shadow-lg">
			<!-- Collapse Icon -->
			<div
				class="mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#F7DDDF]"
			>
				<div class="flex h-9 w-9 items-center justify-center">
					<!-- SVG Icon -->
					<svg
						width="39"
						height="39"
						viewBox="0 0 39 39"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect x="9.75195" y="20.25" width="18.7505" height="14.2504" fill="#F5C0C2" />
						<path
							d="M33.4695 9.53127C28.1621 9.00532 22.8229 8.73438 17.4997 8.73438C14.344 8.73438 11.1883 8.89375 8.03258 9.21251L4.78125 9.53127"
							stroke="#ED2B32"
							stroke-width="2.25006"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							opacity="0.34"
							d="M13.5469 7.92106L13.8975 5.83319C14.1525 4.31909 14.3438 3.1875 17.0373 3.1875H21.213C23.9065 3.1875 24.1137 4.38284 24.3528 5.84913L24.7034 7.92106"
							stroke="#ED2B32"
							stroke-width="2.25006"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M30.042 14.5703L29.006 30.6198C28.8307 33.122 28.6872 35.0665 24.2406 35.0665H14.0084C9.56175 35.0665 9.41831 33.122 9.24299 30.6198L8.20703 14.5703"
							stroke="#ED2B32"
							stroke-width="2.25006"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							opacity="0.34"
							d="M16.459 26.2969H21.7663"
							stroke="#ED2B32"
							stroke-width="2.25006"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							opacity="0.34"
							d="M15.1406 19.9219H23.1096"
							stroke="#ED2B32"
							stroke-width="2.25006"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>
			</div>

			<!-- Header -->
			<h2 class="text-lg font-semibold text-black">Delete Ticket Type</h2>
			<p class="mt-1 mb-4 text-sm leading-snug font-light text-[#8E8E90]">
				Are you sure you want to delete Admin Module?
			</p>

			<!-- Button -->
			<div class="flex items-center gap-3">
				<button
					class="w-full rounded-lg bg-[#ED2B32] py-2.5 font-medium text-white transition hover:bg-gray-800"
					on:click={addTag}
				>
					Delete
				</button>
				<button
					class="w-full rounded-lg bg-[#F0F0F0] py-2.5 font-medium text-[#636466] transition"
					on:click={addTag}
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}
