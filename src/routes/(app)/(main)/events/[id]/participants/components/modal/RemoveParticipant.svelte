<script lang="ts">
	export let open = false;
	export let participant = 'speaker';
	export let participantName = 'Innocent Tamunosiki';

	participant = participant.charAt(0).toUpperCase() + participant.slice(1);

	function addTag() {
		open = false;
		// Add your tag creation logic here
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2 backdrop-blur-sm"
		on:click={() => (open = false)}
	>
		<div class="inline-block text-left sm:right-0">
			<div class="relative w-[330px] max-w-lg rounded-lg bg-[#FFFCFC] p-4 shadow-lg">
				<!-- Collapse Icon -->
				<div
					class="mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#EFEFF0]"
				>
					<div class="flex h-9 w-9 items-center justify-center">
						<!-- SVG Icon -->
						<svg
							width="32"
							height="32"
							viewBox="0 0 32 32"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								opacity="0.4"
								d="M28.4935 15.1858V23.1725C28.4935 26.8525 25.5068 29.8392 21.8268 29.8392H10.1735C6.4935 29.8392 3.50684 26.8525 3.50684 23.1725V15.2792C4.52017 16.3725 5.96017 16.9992 7.52017 16.9992C9.20017 16.9992 10.8135 16.1592 11.8268 14.8125C12.7335 16.1592 14.2802 16.9992 16.0002 16.9992C17.7068 16.9992 19.2268 16.1992 20.1468 14.8658C21.1735 16.1858 22.7602 16.9992 24.4135 16.9992C26.0268 16.9992 27.4935 16.3458 28.4935 15.1858Z"
								fill="#2A2D32"
							/>
							<path
								d="M19.9868 1.66406H11.9868L11.0001 11.4774C10.9201 12.3841 11.0535 13.2374 11.3868 14.0107C12.1601 15.8241 13.9735 16.9974 16.0001 16.9974C18.0535 16.9974 19.8268 15.8507 20.6268 14.0241C20.8668 13.4507 21.0135 12.7841 21.0268 12.1041V11.8507L19.9868 1.66406Z"
								fill="#2A2D32"
							/>
							<path
								opacity="0.6"
								d="M29.8137 11.0241L29.427 7.33073C28.867 3.30406 27.0403 1.66406 23.1337 1.66406H18.0137L19.0003 11.6641C19.0137 11.7974 19.027 11.9441 19.027 12.1974C19.107 12.8907 19.3203 13.5307 19.6403 14.1041C20.6003 15.8641 22.467 16.9974 24.4137 16.9974C26.187 16.9974 27.787 16.2107 28.787 14.8241C29.587 13.7574 29.947 12.4107 29.8137 11.0241Z"
								fill="#2A2D32"
							/>
							<path
								opacity="0.6"
								d="M8.7862 1.66406C4.8662 1.66406 3.05287 3.30406 2.47953 7.37073L2.11953 11.0374C1.9862 12.4641 2.37287 13.8507 3.21287 14.9307C4.2262 16.2507 5.7862 16.9974 7.51953 16.9974C9.4662 16.9974 11.3329 15.8641 12.2795 14.1307C12.6262 13.5307 12.8529 12.8374 12.9195 12.1174L13.9595 1.6774H8.7862V1.66406Z"
								fill="#2A2D32"
							/>
							<path
								d="M15.1335 22.2111C13.4402 22.3844 12.1602 23.8244 12.1602 25.5311V29.8377H19.8268V25.9977C19.8402 23.2111 18.2002 21.8911 15.1335 22.2111Z"
								fill="#2A2D32"
							/>
						</svg>
					</div>
				</div>

				<!-- Header -->
				<h2 class="text-lg font-semibold text-black">Remove {participant}</h2>
				<p class="mt-1 mb-4 text-sm leading-snug font-light text-[#8E8E90]">
					Are you sure you want to remove <span class="text-black font-bold">{participantName}</span> from this
					event? This action cannot be undone.
				</p>

				<!-- Button -->
				<div class="flex items-center gap-3">
					<button
						class="w-full rounded-lg bg-[#F0F0F0] p-2.5 font-medium text-[#636466] transition"
						on:click={addTag}
					>
						Cancel
					</button>
					<button
						class="w-full rounded-lg bg-black p-2.5 font-medium text-white transition"
						on:click={addTag}
					>
						Remove {participant}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
