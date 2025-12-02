<script lang="ts">
	import Icon from '@iconify/svelte';

	export let open = false;

	// Example data – replace with real API data
	export let request = {
		organizer: {
			name: 'Shivani Chauhan',
			role: 'Speaker',
			email: 'ShivaniChauhan@gmail.com',
			image: '/face-1.svg'
		},
		publicProfile: 'rondwell.com/speaker/[yourname]',
		serviceDescription:
			"I’d like to deliver a keynote on the topic ‘Harnessing AI for Social Good’ during your innovation track. My talk covers practical frameworks, ethical considerations, and real-world case studies from Sub-Saharan Africa. I'm also open to participating in a panel discussion if needed.",
		attachment: {
			name: 'Speaker Portfolio.pdf',
			size: '94 KB',
			icon: '/pdf-icon.svg'
		}
	};

	const close = () => (open = false);
</script>

{#if open}
	<div
		on:click={() => (open = false)}
		class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-3 py-10"
	>
		<!-- Modal container -->
		<div
			class="h-155 w-full max-w-xl overflow-hidden rounded-xl bg-[#F4F5F6] shadow-xl"
			on:click|stopPropagation
		>
			<!-- Header -->
			<div class="flex items-start md:items-center justify-between border-b border-gray-200 px-6 py-4">
				<div class="flex flex-col gap-3 md:flex-row md:items-center">
					<div class="flex items-center gap-3">
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
						<p>Review & Respond</p>
					</div>
					<div class="flex items-center gap-3">
						<button
							class="flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
						>
							Accept
						</button>
						<button
							class="flex items-center gap-1 rounded-lg bg-[#F0F1F1] px-3 py-1.5 text-sm font-medium text-[#727375]"
						>
							Decline
						</button>
					</div>
				</div>

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
			<div
				class="custom-scrollbar h-134 space-y-8 overflow-hidden overflow-y-auto px-5 py-6  text-gray-700"
			>
				<!-- Title -->
				<h2 class="text-2xl font-semibold text-gray-900">
					Collaboration Request from Sleekwaresandslide (Vendor)
				</h2>

				<!-- Sender Details -->
				<section class="rounded-xl bg-white p-4">
					<p class="mb-3 text-lg font-medium text-gray-900">Sender Details</p>
					<p class="text-sm font-medium text-[#919293]">Organized By</p>
					<div class="mt-2 flex items-center gap-3 border-t pt-4">
						<img src={request.organizer.image} class="h-10 w-10 rounded-full" />
						<div>
							<p class="flex items-center gap-1 font-semibold">
								{request.organizer.name}
								<span
									class="ml-auto flex items-center gap-1 rounded-md bg-[#EFEBFF] px-2 py-1 text-xs font-semibold text-purple-500"
								>
									<Icon icon="mdi:star" />
									{request.organizer.role}
								</span>
							</p>
							<p class="text-xs text-gray-500">{request.organizer.email}</p>
						</div>
					</div>

					<div class="mt-4 flex items-start gap-2">
						<img src="/box.svg" alt="" />
						<div class="">
							<p class="mb-1 text-gray-400">Public Profile URL</p>
							<p class=" underline">{request.publicProfile}</p>
						</div>
					</div>
				</section>

				<!-- Requested Service -->
				<section class="rounded-xl bg-white p-4">
					<p class="mb-3 text-lg font-medium">Requested Service/Product</p>

					<div class="mb-4 flex items-start gap-2">
						<img src="/box.svg" alt="" />
						<div class="">
							<p class="mb-1 font-medium text-gray-400">Product/Service Name</p>
							<p class="text-xs leading-relaxed">
								{request.serviceDescription}
							</p>
						</div>
					</div>

					<!-- Attachment -->
					<div>
						<div class="mb-1 flex items-start gap-2">
							<img src="/box.svg" alt="" />
							<div class="w-full">
								<p class="text-gray-400">Attached Portfolio/Services</p>
								<div
									class="flex w-full items-center justify-between gap-3 rounded-lg border bg-gray-50 p-3"
								>
									<div class="flex w-full items-center gap-3">
										<img src="/File Format Icons [1.1].svg" alt="" class="h-7 w-7" />
										<div>
											<p class="text-sm font-medium text-gray-400">{request.attachment.name}</p>
											<p class="">{request.attachment.size}</p>
										</div>
									</div>
									<Icon icon="mdi:trash-can-outline" class="h-5 w-5" />
								</div>
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	</div>

	<!-- Clicking backdrop closes -->
	<div class="fixed inset-0 z-40" on:click={close}></div>
{/if}
