<script lang="ts">
	export let open = false;
	let name = '';
	let selectedColor = '';
	const colors = ['#FF3CAC', '#A84DFF', '#4D7CFF', '#3DDC97', '#FFD23F', '#FF8C42', '#FF3B30'];

	function selectColor(color: string) {
		selectedColor = color;
	}

	function addTag() {
		console.log('New tag:', { name, selectedColor });
        open = false;
		// Add your tag creation logic here
	}
</script>

{#if open}
	<div id="capacity" class="absolute top-[20px] left-0 z-40 mt-2 inline-block text-left">
		<div class="relative w-[315px] max-w-lg rounded-lg bg-[#FFFCFC] p-4 shadow-lg">
			<!-- Collapse Icon -->
			<div
				class="mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#EFF0F0]"
			>
				<div class="flex h-9 w-9 items-center justify-center">
					<!-- SVG Icon -->
					<svg
						width="41"
						height="41"
						viewBox="0 0 41 41"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M33.4103 25.7747C35.0108 24.1741 35.87 21.9671 35.7521 19.7095L35.3477 11.2856C35.1961 7.91603 32.5173 5.23723 29.1646 5.06875L20.7407 4.6644C18.4831 4.56332 16.276 5.4057 14.6755 7.00624L7.04346 14.6383C3.90977 17.772 3.90977 22.86 7.04346 26.0106L14.4396 33.4067C17.5733 36.5404 22.6614 36.5404 25.8119 33.4067L27.7157 31.5029"
							stroke="#737577"
							stroke-width="2.37851"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M20.5548 14.3409C20.3358 14.8463 20.2178 15.4192 20.2178 16.0088C20.2178 18.3338 22.1048 20.2208 24.4298 20.2208C26.7548 20.2208 28.6417 18.3338 28.6417 16.0088C28.6417 13.6838 26.7548 11.7969 24.4298 11.7969"
							stroke="#737577"
							stroke-width="2.37851"
							stroke-linecap="round"
						/>
						<path
							d="M11.7932 21.9062L18.5324 28.6454"
							stroke="#737577"
							stroke-width="2.37851"
							stroke-miterlimit="10"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>
			</div>

			<!-- Header -->
			<h2 class="text-lg font-semibold text-black">Create Attendee Tag</h2>
			<p class="mt-1 mb-4 text-sm leading-snug font-light text-[#8E8E90]">
				Event tags let collection visitors filter events by category.
			</p>

			<!-- Name Input -->
			<div>
				<label for="name" class="mb-1 block text-sm font-medium text-gray-700">Name</label>
				<input
					type="text"
					bind:value={name}
					class="h-[40px] w-full rounded-md border border-gray-300 bg-[#FFFFFF] px-3 py-1 text-sm text-black focus:ring-0 focus:outline-none"
				/>
			</div>

			<!-- Color Picker -->
			<div class="mt-3">
				<label for="color" class="mb-1 block text-sm font-medium text-gray-700">Color</label>
				<div class="mt-2 flex space-x-2">
					{#each colors as color}
						<button
							aria-label="color picker"
							type="button"
							on:click={() => selectColor(color)}
							class="h-7 w-7 rounded-full border-2"
							style="background-color: {color}; border-color: {selectedColor === color
								? '#000'
								: 'transparent'}"
						></button>
					{/each}
				</div>
			</div>

			<!-- Create Button -->
			<button
				class="mt-5 w-full rounded-lg bg-gray-900 py-2.5 font-medium text-white transition hover:bg-gray-800"
				on:click={addTag}
			>
				Create
			</button>
		</div>
	</div>
{/if}
