<script lang="ts">
	export let open = false;
	export let type = 'resend';

	function addTag() {
		open = false;
		// Add your tag creation logic here
	}
</script>

{#if open}
	{#if type === 'resend'}
		<div id="capacity" class="absolute right-0 bottom-[30px] z-40 mt-2 inline-block text-left">
			<div class="relative w-[315px] max-w-lg rounded-lg bg-[#FFFCFC] p-4 shadow-lg">
				<!-- Collapse Icon -->
				<div
					class="mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#EFF0F0]"
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
							<path
								d="M3.94531 20.5156H34.7262V28.4082C34.7262 30.5876 32.9594 32.3544 30.7799 32.3544H7.89158C5.71212 32.3544 3.94531 30.5876 3.94531 28.4082V20.5156Z"
								fill="#DADBDB"
							/>
							<path
								d="M19.3402 20.738C17.9866 20.738 16.6169 20.3191 15.5695 19.4651L10.5259 15.4366C10.0102 15.0176 9.91354 14.2603 10.3325 13.7446C10.7515 13.229 11.5088 13.1323 12.0244 13.5513L17.0681 17.5797C18.2928 18.5627 20.3715 18.5627 21.5961 17.5797L23.4975 16.065C24.0132 15.6461 24.7867 15.7266 25.1895 16.2584C25.6085 16.774 25.5279 17.5475 24.9962 17.9503L23.0947 19.4651C22.0634 20.3191 20.6937 20.738 19.3402 20.738Z"
								fill="#737577"
							/>
							<path
								d="M31.4206 14.099C28.5362 14.099 26.1836 11.7464 26.1836 8.86202C26.1836 5.97763 28.5362 3.625 31.4206 3.625C34.305 3.625 36.6576 5.97763 36.6576 8.86202C36.6576 11.7464 34.305 14.099 31.4206 14.099ZM31.4206 6.04209C29.8737 6.04209 28.6007 7.31509 28.6007 8.86202C28.6007 10.409 29.8737 11.682 31.4206 11.682C32.9676 11.682 34.2406 10.409 34.2406 8.86202C34.2406 7.31509 32.9676 6.04209 31.4206 6.04209Z"
								fill="#737577"
							/>
							<path
								d="M27.395 34.2482H11.2811C5.39955 34.2482 2.01562 30.8643 2.01562 24.9827V13.703C2.01562 7.82142 5.39955 4.4375 11.2811 4.4375H22.5609C23.2215 4.4375 23.7694 4.98537 23.7694 5.64604C23.7694 6.30671 23.2215 6.85459 22.5609 6.85459H11.2811C6.67255 6.85459 4.43271 9.09442 4.43271 13.703V24.9827C4.43271 29.5913 6.67255 31.8312 11.2811 31.8312H27.395C32.0036 31.8312 34.2435 29.5913 34.2435 24.9827V16.9258C34.2435 16.2651 34.7913 15.7172 35.452 15.7172C36.1127 15.7172 36.6605 16.2651 36.6605 16.9258V24.9827C36.6605 30.8643 33.2766 34.2482 27.395 34.2482Z"
								fill="#737577"
							/>
						</svg>
					</div>
				</div>

				<!-- Header -->
				<h2 class="text-lg font-semibold text-black">Resend Confirmation Email</h2>
				<p class="mt-1 mb-4 text-sm leading-snug font-light text-[#8E8E90]">
					Please confirm that you want to resend the confirmation email to this guest
					(johnnebraskanevada@gmail.com).
				</p>

				<!-- Button -->
				<div class="flex items-center gap-3">
					<button
						class="w-full rounded-lg bg-gray-900 py-2.5 font-medium text-white transition hover:bg-gray-800"
						on:click={addTag}
					>
						Resend
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
{/if}
