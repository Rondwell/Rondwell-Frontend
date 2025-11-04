<script>
	import Icon from '@iconify/svelte';

	export let open = false;
	let tickets = false;

	function toggleTickect() {
		tickets = !tickets;
	}

	function updateTickect() {
		console.log(`Updated tickets`);
		open = false;
	}
</script>

{#if open}
	<div
		class="absolute top-[20px] right-[-10px] z-40 mt-2 inline-block text-left lg:top-auto lg:right-0 lg:bottom-[30px]"
	>
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
							d="M34.2712 21.6511C34.9125 21.6511 35.4222 21.1249 35.4222 20.4672V19.0203C35.4222 12.5583 33.449 10.6016 27.0035 10.6016H16.6445V14.5972C17.2858 14.5972 17.812 15.1233 17.812 15.7646V20.1713C17.812 20.8125 17.2858 21.3387 16.6445 21.3387V25.4658C17.2858 25.4658 17.812 25.992 17.812 26.6333V31.0399C17.812 31.6812 17.2858 32.2074 16.6445 32.2074V36.1701H27.0035C33.449 36.1701 35.4222 34.1969 35.4222 27.7514C35.4222 27.1101 34.9125 26.5839 34.2712 26.5839C32.89 26.5839 31.7883 25.4823 31.7883 24.1175C31.7883 22.7528 32.89 21.6511 34.2712 21.6511Z"
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
			<div class="mb-4">
				<h2 class="text-lg font-semibold text-black">Ticket Regiatration</h2>
				<p class="mt-1 text-sm leading-snug font-light text-[#8E8E90]">
					If turned on, attendees will be able to purchase a ticket while registering for event.
				</p>
				<div class="mt-1 flex items-start gap-1 text-gray-400">
					<p class="text-sm">Learn more about ticket registration</p>
					<Icon icon="mdi:arrow-top-right" class="text-md" />
				</div>
			</div>
			<!-- Toggle -->
			<div class="mt-4 flex items-center justify-between">
				<label for="" class="text-sm font-medium text-gray-700">Allow Ticket Registration</label>

				<!-- Custom Toggle Switch -->
				<button
					aria-label="toggle"
					class="relative h-6 w-10 rounded-full transition-colors duration-300"
					class:bg-gray-300={!tickets}
					class:bg-gray-800={tickets}
					on:click={toggleTickect}
				>
					<span
						class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
						class:translate-x-4={tickets}
					></span>
				</button>
			</div>

			<!-- Buttons -->
			<button
				class="mt-5 w-full rounded-lg bg-gray-900 py-2.5 font-medium text-white transition hover:bg-gray-800"
				on:click={updateTickect}
			>
				Confirm
			</button>
		</div>
	</div>
{/if}
