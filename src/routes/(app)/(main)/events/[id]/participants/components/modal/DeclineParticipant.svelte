<script lang="ts">
	import Icon from '@iconify/svelte';

	export let open = false;
	export let participant = 'speaker';
	export let participantName = 'Gabriela Walker ';
	let participantUp = participant.charAt(0).toUpperCase() + participant.slice(1);
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
		<div class="animate-fadeIn max-h-180 md:max-h-150 w-full max-w-2xl rounded-2xl bg-[#FDFCFB] px-4 py-6 md:p-6 shadow-xl">
			<!-- Modal Header -->
			<div class="relative flex w-full flex-col items-center">
				<div class="mb-3 flex h-18 w-18 items-center justify-center rounded-full bg-gray-100">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-2xl">
						<svg
							width="32"
							height="32"
							viewBox="0 0 32 32"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M19.2529 25.4017L21.2796 27.4283L25.3329 23.375"
								stroke="black"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M16.2135 14.4907C16.0801 14.4774 15.9201 14.4774 15.7735 14.4907C12.6001 14.3841 10.0801 11.7841 10.0801 8.58406C10.0668 5.3174 12.7201 2.66406 15.9868 2.66406C19.2535 2.66406 21.9068 5.3174 21.9068 8.58406C21.9068 11.7841 19.3735 14.3841 16.2135 14.4907Z"
								stroke="black"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M15.9867 29.077C13.5601 29.077 11.1467 28.4636 9.30672 27.237C6.08005 25.077 6.08005 21.557 9.30672 19.4103C12.9734 16.957 18.9867 16.957 22.6534 19.4103"
								stroke="black"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
				</div>

				<h2 class="text-xl font-semibold text-gray-800">Decline {participantUp}</h2>
				<p class="text-sm text-gray-500">Provide details of {participant} to proceed.</p>
				<button
					class="absolute top-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#EBECED] text-xl leading-none text-gray-700"
					on:click={() => (open = false)}
				>
					<Icon icon="mdi:close" class="text-lg font-bold" />
				</button>
			</div>

			<!-- TAB CONTENT -->
			<div class="custom-scrollbar mt-6 h-80 md:h-60 overflow-y-auto rounded-lg border p-4">
				<div>
					<h3 class="mb-4 flex items-center gap-1 text-lg font-semibold text-gray-700">
						Are you sure you want to decline {participantName} participation?
						<img src="/warning-icon.svg" alt="" />
					</h3>

					<div class="mt-6">
						<label class="flex text-gray-900" for="first_name">
							Reason for Decline <span class="text-blue-600">*</span>
							<span class="ml-1 text-gray-700">(Optional)</span></label
						>
						<textarea
							placeholder="Welcome them to the event or provide next steps."
							rows="4"
							class="mt-2 w-full resize-none rounded-sm bg-[#FFFFFF] px-3 py-2 shadow-xs"
						></textarea>
						<p class="flex items-center gap-1 text-xs font-light text-gray-500">
							<img src="/information-fill.svg" alt="" />
							You can describe your personal message briefly.
						</p>
					</div>
				</div>
			</div>

			<div class="mt-6 flex items-center gap-2">
				<button
					on:click={() => (open = false)}
					class="rounded-md bg-white px-4 py-2 text-gray-600 shadow-xs"
				>
					cancel
				</button>

				<button
					on:click={() => (open = false)}
					class="rounded-md bg-black px-4 py-2 text-white shadow-xs"
				>
					Decline {participantUp}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.animate-fadeIn {
		animation: fade 0.15s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
			transform: scale(0.97);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
