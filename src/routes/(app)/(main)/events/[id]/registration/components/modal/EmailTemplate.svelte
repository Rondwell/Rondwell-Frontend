<script lang="ts">
	export let open: boolean = false;
	export let title: string = 'Declined Email';
	export let description: string =
		'This email is sent when you decline a guest who is pending approval or on the waitlist.';
	export let subject: string = 'Registration not accepted for Megaexe Party';
	export let message: string = '';
	export let onSave: ((message?: string) => void) | undefined;
	export let onPreview: ((e?: Event) => void) | undefined;

	function handleSave() {
		onSave?.(message);
		open = false;
	}
</script>

{#if open}
	<!-- Overlay -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm md:inset-y-0 md:right-10 md:left-auto md:w-lg md:justify-start md:bg-transparent md:backdrop-blur-none"
	>
		<!-- Panel -->
		<div
			class="custom-scrollbar flex h-full max-h-120 w-full max-w-lg flex-col rounded-t-lg bg-white shadow-lg md:w-full md:max-w-none md:rounded-none md:shadow-none"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<button aria-label="Close" on:click={() => (open = false)}>
					<svg
						width="16"
						height="15"
						viewBox="0 0 16 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect
							y="12.8203"
							width="9.9258"
							height="1.96151"
							rx="0.980754"
							transform="rotate(-45 0 12.8203)"
							fill="#68696B"
						/>
						<rect
							x="1.38867"
							width="10.0318"
							height="1.96151"
							rx="0.980754"
							transform="rotate(45 1.38867 0)"
							fill="#68696B"
						/>
						<rect
							x="7.10547"
							y="12.8203"
							width="9.9258"
							height="1.96151"
							rx="0.980754"
							transform="rotate(-45 7.10547 12.8203)"
							fill="#68696B"
						/>
						<rect
							x="8.49414"
							width="10.0318"
							height="1.96151"
							rx="0.980754"
							transform="rotate(45 8.49414 0)"
							fill="#68696B"
						/>
					</svg>
				</button>

				<div class="flex gap-2">
					<button
						aria-label="revert"
						class="bg-[#F5F5F5] p-1 text-[#68696B] transition-transform duration-300"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 rotate-90"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
					<button
						aria-label="forward"
						class="bg-[#F5F5F5] p-1 text-[#68696B] transition-transform duration-300"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 -rotate-90"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</div>
			</div>

			<!-- Body -->
			<div class="px-5 py-4">
				<h3 class="mb-1 font-semibold text-gray-800">{title}</h3>
				<p class="text-xs font-medium text-gray-500">{description}</p>

				<div class="mt-4">
					<div class="relative mb-2 rounded-md border border-gray-200 bg-white p-3 shadow-sm">
						<div class="flex items-center justify-between">
							<p class="font-medium text-gray-700">{subject}</p>
						</div>

						<textarea
							rows="4"
							placeholder="Add your custom message here."
							bind:value={message}
							class="mt-2 w-full resize-none rounded-md border border-gray-800 bg-white p-2 text-sm text-gray-700 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
						></textarea>

						<p class="mt-1 text-xs text-gray-300">
							You can insert variables by typing <code>{'{'}</code>.
						</p>
					</div>
				</div>
			</div>

			<!-- Footer -->
			<div class="mt-auto flex items-center justify-between border-t px-5 py-3">
				<button
					on:click={handleSave}
					class="flex items-center gap-2 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-gray-800"
				>
					<svg
						width="19"
						height="18"
						viewBox="0 0 19 18"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M8.87891 0.197266C9.31143 0.197266 9.66789 0.553826 9.66797 0.986328C9.66797 1.41889 9.31147 1.77539 8.87891 1.77539C4.96276 1.77544 1.77544 4.96276 1.77539 8.87891C1.77539 12.7951 4.96273 15.9824 8.87891 15.9824C12.7951 15.9824 15.9824 12.7951 15.9824 8.87891C15.9825 8.4464 16.339 8.08987 16.7715 8.08984C17.204 8.08984 17.5605 8.44638 17.5605 8.87891C17.5605 13.6681 13.6681 17.5605 8.87891 17.5605C4.08971 17.5605 0.197266 13.6681 0.197266 8.87891C0.197317 4.08974 4.08974 0.197317 8.87891 0.197266Z"
							fill="white"
							stroke="white"
							stroke-width="0.394627"
						/>
						<rect
							x="4.33984"
							y="8.38281"
							width="2.36776"
							height="6.568"
							rx="1.18388"
							transform="rotate(-45 4.33984 8.38281)"
							fill="white"
						/>
						<rect
							x="17.0117"
							y="1.65625"
							width="2.36776"
							height="13.7152"
							rx="1.18388"
							transform="rotate(45 17.0117 1.65625)"
							fill="white"
						/>
					</svg>

					Update Email
				</button>

				<button on:click={onPreview} class="text-sm font-medium text-gray-500 hover:text-gray-700">
					Send a Preview
				</button>
			</div>
		</div>
	</div>
{/if}
