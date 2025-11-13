<script lang="ts">
	export let open = false;

	let block = false;

	function toggleTickect() {
		block = !block;
	}

	function submitReport() {
		console.log('report submitted');
	}
</script>

{#if open}
	<div id="aiModal" class="absolute left-0 bottom-10 z-40 mt-2 inline-block text-left">
		<div class="relative w-full rounded-lg bg-[#FFFCFC] p-4 shadow-lg md:w-[390px]">
			<div
				class="mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#F5DCDD]"
			>
				<div class="flex h-9 w-9 items-center justify-center">
					<svg
						width="42"
						height="42"
						viewBox="0 0 42 42"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M26.2607 34.4785H11.1699C6.81105 34.4785 3.27743 30.9448 3.27734 26.5859V25.0146C5.69845 24.242 7.38379 22.5239 7.38379 20.5264C7.38371 18.5288 5.69859 16.8097 3.27734 16.0371V14.4629C3.27734 10.104 6.811 6.57031 11.1699 6.57031H26.2607V34.4785Z"
							fill="#F4BFC1"
						/>
						<path
							d="M28.7305 7.38281L28.7305 33.6492"
							stroke="#ED2B32"
							stroke-width="2.36776"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-dasharray="3.95 3.95"
						/>
						<path
							d="M37.6267 17.0962V15.3862C37.6267 8.54599 35.9167 6.83594 29.0765 6.83594H11.976C5.13583 6.83594 3.42578 8.54599 3.42578 15.3862V16.2412C5.78565 16.2412 7.7009 18.1565 7.7009 20.5163C7.7009 22.8762 5.78565 24.7914 3.42578 24.7914V25.6465C3.42578 32.4867 5.13583 34.1967 11.976 34.1967H29.0765C35.9167 34.1967 37.6267 32.4867 37.6267 25.6465C35.2669 25.6465 33.3516 23.7312 33.3516 21.3713"
							stroke="#ED2B32"
							stroke-width="2.36776"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M15.475 26.4636L15.2413 18.1562H17.1938L16.9978 26.4636H15.475ZM16.1158 29.995C15.8092 29.995 15.5478 29.8964 15.3317 29.6991C15.1156 29.4973 15.0026 29.2484 14.9925 28.9524C14.9875 28.7327 15.0428 28.5331 15.1584 28.3538C15.2739 28.1744 15.4272 28.0309 15.6182 27.9233C15.8142 27.8156 16.0178 27.7618 16.2288 27.7618C16.5957 27.7618 16.8746 27.865 17.0656 28.0712C17.2566 28.2775 17.3546 28.5197 17.3596 28.7977C17.3647 29.0219 17.3094 29.226 17.1938 29.4098C17.0782 29.5892 16.9249 29.7327 16.7339 29.8403C16.548 29.9435 16.3419 29.995 16.1158 29.995Z"
							fill="#ED2B32"
						/>
					</svg>
				</div>
			</div>

			<h3 class="mb-2 text-xl font-medium text-gray-700">Report Attendee</h3>
			<p class="mb-4 text-sm text-gray-500">
				Please share any information about the guest being disruptive, abusive, or otherwise a
				related issue.
			</p>

			<!-- Notes -->
			<div class="mb-3">
				<label for="" class="mb-1 block text-sm font-medium text-gray-600">Notes</label>
				<textarea
					rows="4"
					placeholder="Provide any additional information that may be helpful."
					class="w-full resize-none rounded-md border p-2 text-xs text-gray-500 outline-none focus:ring-0"
				></textarea>
			</div>

			<!-- Toggle -->
			<div class="my-4 flex items-center justify-between">
				<label for="" class="text-sm font-medium text-gray-700">Block guest for future events</label
				>

				<!-- Custom Toggle Switch -->
				<button
					aria-label="toggle"
					class="relative h-6 w-10 rounded-full transition-colors duration-300"
					class:bg-gray-300={!block}
					class:bg-gray-800={block}
					on:click={toggleTickect}
				>
					<span
						class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
						class:translate-x-4={block}
					></span>
				</button>
			</div>

			<!-- Generate Button -->
			<button
				class="w-full rounded-md bg-[#DE292F] py-2 text-sm font-medium text-white"
				on:click={submitReport}
			>
				Submit Report
			</button>
		</div>
	</div>
{/if}
