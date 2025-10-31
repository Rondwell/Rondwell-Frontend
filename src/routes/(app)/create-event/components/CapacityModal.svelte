<script>
	export let open = false;
	let capacity = 50;
	let overCapacityWaitlist = false;

	function toggleWaitlist() {
		overCapacityWaitlist = !overCapacityWaitlist;
	}

	function setLimit() {
		console.log('Set limit:', capacity, 'waitlist:', overCapacityWaitlist);
	}

	function removeLimit() {
		console.log('Remove limit');
	}
</script>

{#if open}
	<div class="absolute right-0 bottom-[30px] z-40 mt-2 inline-block text-left">
		<div class="relative w-[315px] max-w-lg rounded-lg bg-[#FFFCFC] p-4 shadow-lg">
			<!-- Collapse Icon -->
			<div
				class="mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#EFF0F0]"
			>
				<div class="flex h-9 w-9 items-center justify-center">
					<svg
						width="41"
						height="41"
						viewBox="0 0 41 41"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M19.8061 8.42059C23.361 8.42059 26.9327 8.9934 30.3191 10.1222C30.9762 10.3412 31.33 11.0657 31.111 11.7227C30.8919 12.3798 30.1675 12.7505 29.5104 12.5146C23.243 10.4255 16.3523 10.4255 10.0849 12.5146C9.42783 12.7336 8.70338 12.3798 8.48436 11.7227C8.26533 11.0657 8.61914 10.3412 9.2762 10.1222C12.6795 8.97655 16.2512 8.42059 19.8061 8.42059Z"
							fill="#737577"
						/>
						<path
							d="M25.2712 38.3321H15.1625C6.01416 38.3321 2.10547 34.4234 2.10547 25.2751V15.1664C2.10547 6.01806 6.01416 2.10938 15.1625 2.10938H25.2712C34.4195 2.10938 38.3282 6.01806 38.3282 15.1664V25.2751C38.3282 34.4234 34.4195 38.3321 25.2712 38.3321ZM15.1625 4.63654C7.39567 4.63654 4.63264 7.39958 4.63264 15.1664V25.2751C4.63264 33.0419 7.39567 35.805 15.1625 35.805H25.2712C33.038 35.805 35.801 33.0419 35.801 25.2751V15.1664C35.801 7.39958 33.038 4.63654 25.2712 4.63654H15.1625Z"
							fill="#737577"
						/>
						<path
							d="M26.1637 27.314C25.8436 27.314 25.5235 27.196 25.2707 26.9433L20.2164 21.889L15.1621 26.9433C14.6735 27.4319 13.8648 27.4319 13.3762 26.9433C12.8876 26.4547 12.8876 25.646 13.3762 25.1575L19.3235 19.2102C19.8121 18.7216 20.6208 18.7216 21.1093 19.2102L27.0566 25.1575C27.5452 25.646 27.5452 26.4547 27.0566 26.9433C26.8039 27.196 26.4838 27.314 26.1637 27.314Z"
							fill="#737577"
						/>
					</svg>
				</div>
			</div>

			<!-- Header -->
			<h2 class="text-lg font-semibold text-black">Max Capacity</h2>
			<p class="mt-1 mb-4 text-sm leading-snug font-light text-[#8E8E90]">
				Auto-close registration when the capacity is reached. Only approved guests count toward the
				cap.
			</p>

			<!-- Capacity Input -->
			<label for="capacity" class="mb-1 block text-sm font-medium text-gray-700">Capacity</label>
			<input
				type="text"
				bind:value={capacity}
				class="h-[40px] w-full rounded-md border border-gray-300 bg-[#FFFFFF] px-3 py-1 text-sm text-black focus:ring-2 focus:ring-gray-400 focus:outline-none"
			/>

			<!-- Toggle -->
			<div class="mt-4 flex items-center justify-between">
				<label for="" class="text-sm font-medium text-gray-700">Over-Capacity Waitlist</label>

				<!-- Custom Toggle Switch -->
				<button
					aria-label="toggle"
					class="relative h-6 w-10 rounded-full transition-colors duration-300"
					class:bg-gray-300={!overCapacityWaitlist}
					class:bg-gray-800={overCapacityWaitlist}
					on:click={toggleWaitlist}
				>
					<span
						class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
						class:translate-x-4={overCapacityWaitlist}
					></span>
				</button>
			</div>

			<!-- Buttons -->
			<div class="mt-6 flex justify-between gap-4">
				<button
					class="w-full rounded-md bg-gray-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
					on:click={setLimit}
				>
					Set Limit
				</button>
				<button
					class="w-full cursor-not-allowed rounded-md bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-400"
					on:click={removeLimit}
				>
					Remove Limit
				</button>
			</div>
		</div>
	</div>
{/if}
