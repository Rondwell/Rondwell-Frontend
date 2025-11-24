<script>
	import { clickOutside } from '$lib/utils/constant';
	import TemplateEditor from './modal/TemplateEditor.svelte';
	import TemplateModal from './modal/TemplateModal.svelte';

	const cards = [
		{
			title: 'Theatre / Auditorium seating',
			img: '/Theatre  Auditorium Seating ALLOCATION.png',
			event: 'Attached event',
			created: '10/12/2025'
		},
		{
			title: 'Theatre / Auditorium seating',
			img: '/Theatre  Auditorium Seating ALLOCATION.png',
			event: 'Attached event',
			created: '10/12/2025'
		}
	];

	let showTemplateModal = false;
	let showEditorModal = false;
</script>

<div class="relative">
	<div class="mb-6">
		<h2 class="mb-1 text-lg font-semibold">Seating & Capacity Management for Megaexe Party</h2>
		<p class="mb-4 w-[70%] text-sm text-[#8C8F93]">
			Design and manage your event's seating plan. Create a layout from scratch, use a template, and
			map seats to your ticket types
		</p>
	</div>
	<div>
		<div class="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
			<!-- Label -->
			<span class="text-lg font-semibold text-gray-900">Your design</span>

			<!-- Buttons -->
			<div class="flex items-center gap-2">
				<div use:clickOutside={() => (showTemplateModal = false)} class="relative">
					<button
						on:click={() => (showTemplateModal = !showTemplateModal)}
						class="rounded-md bg-gray-800 p-3 text-sm font-medium text-white hover:bg-gray-700"
					>
						Browse template
					</button>
					<TemplateModal bind:open={showTemplateModal} />
				</div>
				<div>
					<button
						on:click={() => (showEditorModal = true)}
						class="rounded-md bg-gray-800 p-3 text-sm font-medium text-white hover:bg-gray-700"
					>
						Create from scratch
					</button>
					<!-- <TemplateEditor bind:open={showEditorModal} /> -->
				</div>
			</div>
		</div>

		<div class="mt-4 grid gap-6 lg:grid-cols-2">
			{#each cards as card}
				<div class="w-full overflow-hidden rounded-xl bg-white p-4 shadow-md">
					<!-- Image placeholder -->
					<img src={card.img} alt="" class="h-60 w-full" />

					<!-- Content -->
					<div class="pt-4">
						<h2 class="mb-1 text-lg font-semibold">{card.title}</h2>
						<p class="text-sm text-gray-600">{card.event}</p>
						<p class="mt-1 text-xs text-gray-500">
							Created on {card.created}
						</p>

						<!-- Buttons -->
						<div class="mt-4 flex items-center gap-2">
							<button
								class="flex items-center gap-1 rounded-md bg-black px-3 py-1.5 text-sm text-white"
							>
								<svg
									width="20"
									height="20"
									viewBox="0 0 20 20"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M9.86008 13.4204C7.89629 13.4204 6.30225 11.8263 6.30225 9.86252C6.30225 7.89873 7.89629 6.30469 9.86008 6.30469C11.8239 6.30469 13.4179 7.89873 13.4179 9.86252C13.4179 11.8263 11.8239 13.4204 9.86008 13.4204ZM9.86008 7.53719C8.57827 7.53719 7.53475 8.58071 7.53475 9.86252C7.53475 11.1443 8.57827 12.1878 9.86008 12.1878C11.1419 12.1878 12.1854 11.1443 12.1854 9.86252C12.1854 8.58071 11.1419 7.53719 9.86008 7.53719Z"
										fill="white"
									/>
									<path
										d="M9.86032 17.2683C6.77084 17.2683 3.8539 15.4606 1.84903 12.3218C0.978058 10.966 0.978058 8.75574 1.84903 7.39177C3.86212 4.25299 6.77905 2.44531 9.86032 2.44531C12.9416 2.44531 15.8585 4.25299 17.8634 7.39177C18.7344 8.74753 18.7344 10.9578 17.8634 12.3218C15.8585 15.4606 12.9416 17.2683 9.86032 17.2683ZM9.86032 3.67782C7.20632 3.67782 4.66736 5.27186 2.89255 8.05732C2.2763 9.01868 2.2763 10.6949 2.89255 11.6562C4.66736 14.4417 7.20632 16.0357 9.86032 16.0357C12.5143 16.0357 15.0533 14.4417 16.8281 11.6562C17.4443 10.6949 17.4443 9.01868 16.8281 8.05732C15.0533 5.27186 12.5143 3.67782 9.86032 3.67782Z"
										fill="white"
									/>
								</svg>
								View
							</button>
							<button
								class="flex items-center gap-1 rounded-md border border-gray-800 px-3 py-1.5 text-sm"
							>
								<svg
									width="16"
									height="16"
									viewBox="0 0 16 16"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M8.73818 2.0399L1.88904 8.97025C1.62829 9.23409 1.36753 9.75299 1.31538 10.1312L0.941637 12.7784C0.802568 13.7371 1.47184 14.4055 2.41924 14.2735L5.03548 13.8954C5.40053 13.8426 5.91335 13.5788 6.18279 13.3149L13.0319 6.38456C14.214 5.18846 14.7703 3.79887 13.0319 2.0399C11.2936 0.280932 9.92027 0.843802 8.73818 2.0399Z"
										fill="black"
										stroke="white"
										stroke-width="1.84684"
										stroke-miterlimit="10"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
									<path
										d="M7.75684 3.03906C8.33919 5.14103 9.96455 6.78567 12.0506 7.38372L7.75684 3.03906Z"
										fill="black"
									/>
									<path
										d="M7.75684 3.03906C8.33919 5.14103 9.96455 6.78567 12.0506 7.38372"
										stroke="white"
										stroke-width="1.84684"
										stroke-miterlimit="10"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
									<rect
										x="10.052"
										y="13.6741"
										width="5.20478"
										height="0.879486"
										fill="black"
										stroke="black"
										stroke-width="0.879486"
									/>
								</svg>

								Edit
							</button>
							<button
								class="flex items-center gap-1 rounded-md border border-red-400 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
							>
								<svg
									width="21"
									height="20"
									viewBox="0 0 21 20"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M16.2025 10.647L16.9447 10.7554L16.2025 10.647ZM15.973 12.2178L16.7151 12.3263L15.973 12.2178ZM5.02699 12.2178L5.76911 12.1094L5.02699 12.2178ZM4.79745 10.647L4.05533 10.7554L4.79745 10.647ZM8.03569 18.1114L7.75601 18.8073L8.03569 18.1114ZM5.6657 15.4643L6.36543 15.1944L5.6657 15.4643ZM15.3343 15.4643L16.034 15.7343L15.3343 15.4643ZM12.9643 18.1114L12.6846 17.4155V17.4155L12.9643 18.1114ZM5.1213 7.42294C5.08018 7.01078 4.71271 6.70998 4.30055 6.7511C3.88838 6.79222 3.58759 7.15968 3.6287 7.57185L4.375 7.4974L5.1213 7.42294ZM17.3713 7.57185C17.4124 7.15968 17.1116 6.79222 16.6995 6.7511C16.2873 6.70998 15.9198 7.01077 15.8787 7.42294L16.625 7.4974L17.3713 7.57185ZM17.5 6.58073C17.9142 6.58073 18.25 6.24494 18.25 5.83073C18.25 5.41652 17.9142 5.08073 17.5 5.08073V5.83073V6.58073ZM3.5 5.08073C3.08579 5.08073 2.75 5.41652 2.75 5.83073C2.75 6.24494 3.08579 6.58073 3.5 6.58073V5.83073V5.08073ZM8 14.9974C8 15.4116 8.33579 15.7474 8.75 15.7474C9.16421 15.7474 9.5 15.4116 9.5 14.9974H8.75H8ZM9.5 8.33073C9.5 7.91652 9.16421 7.58073 8.75 7.58073C8.33579 7.58073 8 7.91652 8 8.33073H8.75H9.5ZM11.5 14.9974C11.5 15.4116 11.8358 15.7474 12.25 15.7474C12.6642 15.7474 13 15.4116 13 14.9974H12.25H11.5ZM13 8.33073C13 7.91652 12.6642 7.58073 12.25 7.58073C11.8358 7.58073 11.5 7.91652 11.5 8.33073H12.25H13ZM14 5.83073V6.58073H14.75V5.83073H14ZM7 5.83073H6.25V6.58073H7V5.83073ZM16.2025 10.647L15.4604 10.5385L15.2309 12.1094L15.973 12.2178L16.7151 12.3263L16.9447 10.7554L16.2025 10.647ZM5.02699 12.2178L5.76911 12.1094L5.53957 10.5385L4.79745 10.647L4.05533 10.7554L4.28488 12.3263L5.02699 12.2178ZM10.5 18.3307V17.5807C9.15609 17.5807 8.69396 17.5677 8.31537 17.4155L8.03569 18.1114L7.75601 18.8073C8.4688 19.0938 9.28577 19.0807 10.5 19.0807V18.3307ZM5.02699 12.2178L4.28488 12.3263C4.52846 13.9932 4.66363 14.9506 4.96596 15.7343L5.6657 15.4643L6.36543 15.1944C6.13879 14.6069 6.02448 13.857 5.76911 12.1094L5.02699 12.2178ZM8.03569 18.1114L8.31537 17.4155C7.53401 17.1015 6.80511 16.3341 6.36543 15.1944L5.6657 15.4643L4.96596 15.7343C5.51548 17.1587 6.49648 18.3011 7.75601 18.8073L8.03569 18.1114ZM15.973 12.2178L15.2309 12.1094C14.9755 13.857 14.8612 14.6069 14.6346 15.1944L15.3343 15.4643L16.034 15.7343C16.3364 14.9506 16.4715 13.9932 16.7151 12.3263L15.973 12.2178ZM10.5 18.3307V19.0807C11.7142 19.0807 12.5312 19.0938 13.244 18.8073L12.9643 18.1114L12.6846 17.4155C12.306 17.5677 11.8439 17.5807 10.5 17.5807V18.3307ZM15.3343 15.4643L14.6346 15.1944C14.1949 16.3341 13.466 17.1015 12.6846 17.4155L12.9643 18.1114L13.244 18.8073C14.5035 18.3011 15.4845 17.1587 16.034 15.7343L15.3343 15.4643ZM4.79745 10.647L5.53957 10.5385C5.34501 9.20709 5.20051 8.21695 5.1213 7.42294L4.375 7.4974L3.6287 7.57185C3.71211 8.40784 3.86273 9.43735 4.05533 10.7554L4.79745 10.647ZM16.2025 10.647L16.9447 10.7554C17.1373 9.43735 17.2879 8.40784 17.3713 7.57185L16.625 7.4974L15.8787 7.42294C15.7995 8.21694 15.655 9.20709 15.4604 10.5385L16.2025 10.647ZM17.5 5.83073V5.08073H3.5V5.83073V6.58073H17.5V5.83073ZM8.75 14.9974H9.5V8.33073H8.75H8V14.9974H8.75ZM12.25 14.9974H13V8.33073H12.25H11.5V14.9974H12.25ZM14 4.9974H13.25V5.83073H14H14.75V4.9974H14ZM14 5.83073V5.08073H7V5.83073V6.58073H14V5.83073ZM7 5.83073H7.75V4.9974H7H6.25V5.83073H7ZM10.5 1.66406V2.41406C12.0537 2.41406 13.25 3.60472 13.25 4.9974H14H14.75C14.75 2.70817 12.8123 0.914062 10.5 0.914062V1.66406ZM10.5 1.66406V0.914062C8.18769 0.914062 6.25 2.70817 6.25 4.9974H7H7.75C7.75 3.60472 8.94631 2.41406 10.5 2.41406V1.66406Z"
										fill="#FF5F57"
									/>
								</svg>

								Delete
							</button>
						</div>

						<!-- Use design button -->
						<button
							class="mt-4 w-full rounded-md bg-gradient-to-r from-pink-500 to-indigo-600 py-3 text-sm font-medium text-white"
						>
							Use design
						</button>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
