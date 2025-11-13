<script>
	import Icon from '@iconify/svelte';

	export let open = false;

	function update() {
		console.log(`Updated tickets`);
		open = false;
	}
</script>

{#if open}
	<div id="ticket" class="triangle top-30px absolute right-0 z-40 mt-2 inline-block text-left">
		<div class="relative w-[315px] max-w-lg rounded-lg bg-[#FFFCFC] p-4 shadow-lg">
			<!-- Collapse Icon -->
			<div
				class="mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#EFF0F0]"
			>
				<div class="flex h-9 w-9 items-center justify-center">
					<svg
						width="37"
						height="32"
						viewBox="0 0 37 32"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M14.1738 8.31446C14.1738 4.37835 17.3647 1.1875 21.3008 1.1875C25.2369 1.1875 28.4277 4.37835 28.4277 8.31446V9.3326H14.1738V8.31446Z"
							fill="#DBDCDC"
						/>
						<path
							d="M28.2906 12.1114C29.137 10.0086 28.6104 5.79615 27.2723 3.96638C27.2723 3.96638 25.6429 2.09366 24.2179 1.59073C23.3342 1.27882 21.8423 1.25135 21.8423 1.25135C21.8423 1.25135 20.5881 1.10769 19.806 1.25135C18.2858 1.53057 17.5051 2.1947 16.4122 3.28762C15.3193 4.38054 14.7764 5.18859 14.3759 6.68141C13.9981 8.08951 13.9433 9.02235 14.3759 10.4146C14.7469 11.6086 16.0728 13.1296 16.0728 13.1296C16.0728 13.1296 17.1789 14.2438 17.4303 15.1659C17.6818 16.0879 17.4786 16.5077 17.0911 17.2021C16.7681 17.7808 16.0728 18.2203 16.0728 18.2203C16.0728 18.2203 14.8677 19.106 14.0365 19.5778C12.9013 20.2222 12.1173 20.291 10.9821 20.9353C10.9821 20.9353 9.53261 21.5384 8.94585 22.2929C8.58195 22.7607 8.43305 23.0814 8.26709 23.6504C8.00732 24.541 7.99696 25.1385 8.26709 26.026C8.4921 26.7653 8.72535 27.1902 9.28523 27.7229C10.0165 28.4187 11.661 29.0804 11.661 29.0804C11.661 29.0804 12.8292 29.5663 13.6972 29.7592C16.7517 30.4379 22.1816 30.0986 22.1816 30.0986"
							stroke="#737577"
							stroke-width="2.36776"
						/>
						<rect
							x="29.377"
							y="13.1797"
							width="2.30177"
							height="2.0684"
							rx="1.0342"
							transform="rotate(-172.155 29.377 13.1797)"
							fill="#737577"
						/>
						<rect
							x="23.0137"
							y="28.8672"
							width="2.3538"
							height="1.91363"
							rx="0.956817"
							transform="rotate(86.4287 23.0137 28.8672)"
							fill="#737577"
						/>
						<path
							d="M12.7731 4.65401C10.2316 3.92106 7.59475 5.38844 6.86558 7.91682C6.15153 10.3928 7.53476 12.977 9.95809 13.7752C10.0667 13.7923 10.1846 13.8263 10.2987 13.8734"
							stroke="#737577"
							stroke-width="2.36776"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M4.27417 24.9149C3.38761 24.4464 2.60635 23.8096 2.03518 23.0347C0.433554 20.9126 1.16272 18.3842 3.64842 17.4408C4.52762 17.0984 5.51114 16.9847 6.50171 17.0434"
							stroke="#737577"
							stroke-width="2.36776"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<rect
							x="24.6426"
							y="16.1797"
							width="11.8388"
							height="2.36776"
							rx="1.18388"
							fill="#737577"
						/>
						<rect
							x="24.6426"
							y="21.7031"
							width="11.8388"
							height="2.36776"
							rx="1.18388"
							fill="#737577"
						/>
						<rect
							x="24.6426"
							y="27.2266"
							width="11.8388"
							height="2.36776"
							rx="1.18388"
							fill="#737577"
						/>
					</svg>
				</div>
			</div>

			<!-- Header -->
			<div class="mb-4">
				<h2 class="text-lg font-semibold text-black">Public Guest List</h2>
				<p class="mt-1 text-sm leading-snug font-light text-[#8E8E90]">
					Display the guest count and a few guests on the event page.
				</p>
				<p class="mt-1 text-sm leading-snug font-light text-[#8E8E90]">
					Even when it is turned on, only registered guests can access the full list.
				</p>
			</div>

			<!-- Buttons -->
			<button
				class="mt-5 w-full rounded-lg bg-gray-900 py-2.5 font-medium text-white transition hover:bg-gray-800"
				on:click={update}
			>
				Show Gest List
			</button>
		</div>
	</div>
{/if}

<style>
	/* Triangle pointer */
	.triangle::before {
		content: '';
		position: absolute;
		top: -18px;
		left: 90px;
		border-width: 8px;
		border-style: solid;
		border-color: transparent transparent white transparent;
	}
</style>
