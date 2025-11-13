<script>
	export let open = false;
	let allowGroupRegistration = false;

	function toggleAllow() {
		allowGroupRegistration = !allowGroupRegistration;
	}

	function confirm() {
		console.log('group registration:', allowGroupRegistration);
	}
</script>

{#if open}
	<div id="capacity" class="absolute top-[60px] left-0 z-40 mt-2 inline-block text-left">
		<div class="relative w-[315px] max-w-lg rounded-lg bg-[#FFFCFC] p-4 shadow-lg">
			<!-- Collapse Icon -->
			<div
				class="mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#EFF0F0]"
			>
				<div class="flex h-9 w-9 items-center justify-center">
					<svg
						width="40"
						height="40"
						viewBox="0 0 40 40"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							opacity="0.4"
							d="M34.2712 21.6589C34.9125 21.6589 35.4222 21.1328 35.4222 20.475V19.0281C35.4222 12.5661 33.449 10.6094 27.0035 10.6094H16.6445V14.605C17.2858 14.605 17.812 15.1311 17.812 15.7724V20.1791C17.812 20.8203 17.2858 21.3465 16.6445 21.3465V25.4736C17.2858 25.4736 17.812 25.9998 17.812 26.6411V31.0477C17.812 31.689 17.2858 32.2152 16.6445 32.2152V36.1779H27.0035C33.449 36.1779 35.4222 34.2048 35.4222 27.7592C35.4222 27.1179 34.9125 26.5918 34.2712 26.5918C32.89 26.5918 31.7883 25.4901 31.7883 24.1253C31.7883 22.7606 32.89 21.6589 34.2712 21.6589Z"
							fill="#737577"
						/>
						<path
							opacity="0.4"
							d="M30.0147 11.049H13.418L18.7676 5.6625C23.1313 1.26875 25.3223 1.26875 29.686 5.6625L30.7815 6.76553C29.6313 7.92371 29.3574 9.63341 30.0147 11.049Z"
							stroke="#737577"
							stroke-width="2.36776"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M15.4785 15.7716V20.1783C15.4785 20.8195 16.0047 21.3457 16.6459 21.3457V25.4728C16.0047 25.4728 15.4785 25.999 15.4785 26.6403V31.0469C15.4785 31.6882 16.0047 32.2144 16.6459 32.2144V36.1771H12.4695C6.02391 36.1771 4.05078 34.2039 4.05078 27.7584V27.0513C4.05078 26.3936 4.56051 25.8839 5.20178 25.8839C6.58297 25.8839 7.68463 24.7658 7.68463 23.401C7.68463 22.0363 6.58297 20.9182 5.20178 20.9182C4.56051 20.9182 4.05078 20.4085 4.05078 19.7507V19.0437C4.05078 12.5817 6.02391 10.625 12.4695 10.625H16.6295V14.6206C16.0047 14.6206 15.4785 15.1468 15.4785 15.7716Z"
							fill="#737577"
						/>
					</svg>
				</div>
			</div>

			<!-- Header -->
			<h2 class="text-lg font-semibold text-black">Group Registration</h2>
			<p class="mt-1 mb-4 text-sm leading-snug font-light text-[#8E8E90]">
				If turned on, attendees will be able to get multiple tickets at once.
			</p>
			<div class="mt-3 flex items-center gap-1 text-xs text-[#DD488B]">
				<p>Learn more about group registration</p>
				<svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect
						x="2.9625"
						y="0.37461"
						width="4.49532"
						height="0.74922"
						fill="#D9D9D9"
						stroke="#B3B5B7"
						stroke-width="0.74922"
					/>
					<rect
						x="7.45664"
						y="5.62539"
						width="5.24454"
						height="0.74922"
						transform="rotate(-90 7.45664 5.62539)"
						fill="#D9D9D9"
						stroke="#B3B5B7"
						stroke-width="0.74922"
					/>
					<rect
						x="0.529778"
						y="7.57812"
						width="8.89866"
						height="0.74922"
						transform="rotate(-45 0.529778 7.57812)"
						fill="#D9D9D9"
						stroke="#B3B5B7"
						stroke-width="0.74922"
					/>
				</svg>
			</div>

			<!-- Toggle -->
			<div class="my-4 flex items-center justify-between">
				<label for="" class="text-sm font-medium text-gray-700">Allow Group Registration</label>

				<!-- Custom Toggle Switch -->
				<button
					aria-label="toggle"
					class="relative h-6 w-10 rounded-full transition-colors duration-300"
					class:bg-gray-300={!allowGroupRegistration}
					class:bg-gray-800={allowGroupRegistration}
					on:click={toggleAllow}
				>
					<span
						class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
						class:translate-x-4={allowGroupRegistration}
					></span>
				</button>
			</div>

			<!-- Buttons -->
			<button
				class="w-full rounded-lg bg-gray-900 py-2.5 font-medium text-white transition hover:bg-gray-800"
				on:click={confirm}
			>
				Confirm
			</button>
		</div>
	</div>
{/if}
