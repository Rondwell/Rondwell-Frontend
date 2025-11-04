<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	export let open = false;

	let showDropdown = false;
	let showAIModal = false;

	let moods = ['💐', '💼', '😂'];
	let selectedMood: string | null = moods[0];
	let selectedLength = 'S';

	function toggleDropdown() {
		showDropdown = !showDropdown;
	}

	function openAIModal() {
		showAIModal = true;
	}

	function closeAIModal() {
		showAIModal = false;
	}
</script>

{#if open}
	<div id="description" class="absolute top-full left-0 z-40 mt-2 w-full max-w-[662.8px]">
		<div class="w-full max-w-[662.8px] overflow-hidden rounded-sm bg-[#FFFCFC]">
			<div class="flex h-[50px] w-full items-center justify-end bg-[#F4F5F6] px-3">
				<button
					on:click={() => (open = false)}
					class="flex h-[29px] w-[29px] items-center justify-center rounded-full bg-[#EBECED] text-[#616265]"
				>
					<Icon icon="mdi:close" class="text-xl" />
				</button>
			</div>

			<!-- Text area -->
			<div class="p-2">
				<div class="flex w-full items-start rounded-md bg-white p-2">
					<div
						class=""
						use:clickOutside={() => {
							showDropdown = false;
						}}
					>
						<!-- + button -->
						<button
							class="mr-2 rounded-sm bg-[#939597] p-1 text-lg font-bold text-white"
							on:click={toggleDropdown}
						>
							<Icon icon="mdi:plus" class="text-xl" />
						</button>

						<!-- Dropdown -->
						{#if showDropdown}
							<div
								class="custom-scrollbar absolute bottom-50 left-2 z-50 w-60 overflow-y-auto rounded-md border bg-[#F8F8F9] shadow-lg"
							>
								<input
									type="text"
									class="h-8 w-full border-b px-2 text-sm text-gray-800 focus:ring-0 focus:outline-none"
									placeholder="Search"
								/>
								<div class="w-full p-1 pb-2 text-gray-700">
									<button
										class="flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-gray-100"
									>
										<svg
											width="15"
											height="14"
											viewBox="0 0 15 14"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M0 13.3502V0H1.93727V5.80365H7.50281V0H9.42367V13.3502H7.50281V7.42077H1.93727V13.3502H0Z"
												fill="#A5A6A5"
											/>
											<path
												d="M12.9279 13.397V3.75346C12.6295 3.83199 12.339 3.90529 12.0563 3.97335C11.7788 4.04141 11.4935 4.10423 11.2003 4.16182L10.9961 3.0781C11.2474 3.0048 11.5196 2.90533 11.8128 2.77968C12.1112 2.65403 12.4018 2.51791 12.6845 2.37132C12.9724 2.22473 13.229 2.08076 13.4541 1.93941C13.6792 1.79282 13.8494 1.66978 13.9645 1.57031L14.797 1.71167V13.397H12.9279Z"
												fill="#A5A6A5"
											/>
										</svg>

										Heading
									</button>
									<button
										class="flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-gray-100"
									>
										<svg
											width="18"
											height="14"
											viewBox="0 0 18 14"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M0 13.3502V0H1.93727V5.80365H7.50281V0H9.42367V13.3502H7.50281V7.42077H1.93727V13.3502H0Z"
												fill="#A5A6A5"
											/>
											<path
												d="M13.9941 2.94434C14.6934 2.94438 15.2843 3.07629 15.7529 3.35547H15.752C16.2175 3.63013 16.5643 4.00321 16.7861 4.47266C17.0039 4.93364 17.1113 5.44479 17.1113 6.00293C17.1113 6.66471 16.9468 7.32995 16.626 7.99805L16.627 7.99902C16.3114 8.66463 15.8741 9.30204 15.3184 9.91016C14.9 10.3682 14.431 10.7932 13.9141 11.1885L17.2754 11.1416L17.4746 11.1387V12.7607H11.0732L11.0312 12.6211L10.8076 11.8789L10.7656 11.7383L10.8887 11.6582C11.2775 11.4025 11.6754 11.1063 12.083 10.7705C12.4894 10.4358 12.8772 10.0759 13.2461 9.69141C13.6138 9.30807 13.9436 8.91104 14.2354 8.5C14.525 8.08766 14.7514 7.67533 14.915 7.26367V7.2627C15.081 6.85554 15.1621 6.46076 15.1621 6.07812C15.1621 5.54816 15.0279 5.17439 14.7891 4.9248L14.7881 4.92383C14.553 4.67441 14.2166 4.53809 13.751 4.53809C13.3449 4.53815 12.9697 4.62101 12.623 4.78418H12.6221C12.2689 4.94835 11.9929 5.1391 11.7881 5.35254L11.624 5.52441L11.4863 5.33008L10.8682 4.45605L10.7734 4.32324L10.8867 4.20605C11.0652 4.02098 11.2983 3.83401 11.582 3.64453L11.8154 3.50098C12.0583 3.36421 12.33 3.24705 12.6299 3.14941C13.0402 3.01156 13.4961 2.94434 13.9941 2.94434Z"
												fill="#A5A6A5"
												stroke="#A5A6A5"
												stroke-width="0.392653"
											/>
										</svg>

										Subheading
									</button>
									<button
										class="flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-gray-100"
									>
										<svg
											width="19"
											height="19"
											viewBox="0 0 19 19"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M7.06543 4.00684C8.32401 4.00684 9.34255 5.02565 9.34277 6.28418C9.34277 7.5429 8.32415 8.56152 7.06543 8.56152C5.8069 8.5613 4.78809 7.54276 4.78809 6.28418C4.78831 5.02578 5.80703 4.00706 7.06543 4.00684ZM7.06543 5.4209C6.58895 5.42112 6.20237 5.8077 6.20215 6.28418C6.20215 6.76085 6.58881 7.14822 7.06543 7.14844C7.54223 7.14844 7.92969 6.76098 7.92969 6.28418C7.92947 5.80756 7.5421 5.4209 7.06543 5.4209Z"
												fill="#A5A6A5"
												stroke="#A5A6A5"
												stroke-width="0.235592"
											/>
											<path
												d="M9.42676 0.866211C9.8136 0.866402 10.1328 1.18638 10.1328 1.57324C10.1328 1.96016 9.81363 2.28008 9.42676 2.28027H7.07031C5.2686 2.28029 4.08203 2.60156 3.3418 3.3418C2.60156 4.08203 2.28029 5.2686 2.28027 7.07031V11.7822C2.28027 13.5839 2.60164 14.7705 3.3418 15.5107C4.08203 16.251 5.2686 16.5722 7.07031 16.5723H11.7822C13.584 16.5723 14.7705 16.251 15.5107 15.5107C16.251 14.7705 16.5723 13.584 16.5723 11.7822V8.64062C16.5725 8.25386 16.8925 7.93466 17.2793 7.93457C17.6662 7.93457 17.9861 8.25381 17.9863 8.64062V11.7822C17.9863 13.9279 17.5284 15.4872 16.5078 16.5078C15.4872 17.5284 13.9279 17.9863 11.7822 17.9863H7.07031C4.92478 17.9863 3.36527 17.5284 2.34473 16.5078C1.32425 15.4872 0.866211 13.9278 0.866211 11.7822V7.07031C0.866237 4.92478 1.32418 3.36527 2.34473 2.34473C3.36527 1.32418 4.92478 0.866237 7.07031 0.866211H9.42676Z"
												fill="#A5A6A5"
												stroke="#A5A6A5"
												stroke-width="0.235592"
											/>
											<path
												d="M14.8643 1.3877C15.3096 1.13197 15.8748 1.06184 16.4092 1.2373L16.4082 1.23828C17.715 1.65724 18.115 3.12861 17.7646 4.22852C17.5074 5.04075 16.9437 5.65296 16.3721 6.06055C16.0858 6.26462 15.7952 6.41869 15.5361 6.52246C15.2794 6.62528 15.0446 6.68164 14.8721 6.68164C14.4953 6.6815 13.8996 6.45669 13.3418 6.04785C12.85 5.68737 12.3735 5.17366 12.0898 4.51855L11.9805 4.22852C11.6301 3.12856 12.03 1.6562 13.3369 1.2373C13.8632 1.06989 14.4134 1.13251 14.8643 1.3877ZM15.9746 2.57617C15.7817 2.51441 15.5585 2.56036 15.4658 2.70215L15.4648 2.70312C15.3349 2.8978 15.1187 3.02246 14.8877 3.02246C14.6746 3.02233 14.4407 2.92152 14.3057 2.72949C14.1799 2.55635 13.9501 2.52354 13.7773 2.57617L13.7783 2.57715C13.5585 2.6494 13.4085 2.8258 13.3311 3.05371C13.2532 3.28294 13.2528 3.55543 13.3281 3.7959H13.3271C13.4859 4.28609 13.8328 4.65022 14.1709 4.89648C14.3394 5.01918 14.5041 5.11052 14.6377 5.17285C14.7578 5.22886 14.8456 5.25587 14.8867 5.26465C14.928 5.25684 15.0186 5.22884 15.1445 5.16602C15.2787 5.09904 15.4418 5.00084 15.6074 4.87402C15.9403 4.61917 16.2738 4.25494 16.417 3.7959L16.459 3.61035C16.487 3.42143 16.4728 3.2248 16.415 3.05273C16.3384 2.8246 16.19 2.6482 15.9746 2.57617Z"
												fill="#A5A6A5"
												stroke="#A5A6A5"
												stroke-width="0.235592"
											/>
											<path
												d="M13.3262 9.28223C14.2029 8.52978 15.5789 8.53058 16.4629 9.28223H16.4639L17.7441 10.3818V10.3828C18.0358 10.6368 18.0739 11.0792 17.8203 11.3799L17.8184 11.3809C17.5643 11.6725 17.122 11.7107 16.8213 11.457L16.8203 11.4561L15.541 10.3564H15.54C15.1915 10.057 14.5896 10.0568 14.2412 10.3564L10.9746 13.1602C10.0978 13.9129 8.72098 13.912 7.83691 13.1602L7.83594 13.1592L7.57617 12.9316V12.9307C7.25562 12.6609 6.71863 12.6325 6.3623 12.877L6.36133 12.8779L2.49023 15.4775L2.48633 15.4795C2.36548 15.5539 2.22601 15.5917 2.09473 15.5918C1.89686 15.5918 1.69873 15.5054 1.56348 15.3506L1.50977 15.2803C1.29288 14.9593 1.3777 14.5167 1.70703 14.2998L5.57812 11.7012L5.74902 11.5957C6.62187 11.1096 7.74875 11.2147 8.50781 11.8574L8.50977 11.8594L8.76758 12.0859C8.9392 12.2335 9.17565 12.3105 9.41602 12.3105C9.65656 12.3105 9.89122 12.2338 10.0586 12.0869L10.0596 12.0859L13.3262 9.28223Z"
												fill="#A5A6A5"
												stroke="#A5A6A5"
												stroke-width="0.235592"
											/>
										</svg>

										Image
									</button>
									<button
										class="flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-gray-100"
									>
										<svg
											width="19"
											height="16"
											viewBox="0 0 19 16"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M6.28125 2.85816C6.28125 2.29753 6.38917 1.80254 6.60502 1.3732C6.82087 0.94385 7.13594 0.608535 7.55022 0.36725C7.96451 0.122417 8.46583 0 9.05419 0C9.63211 0 10.116 0.140158 10.5059 0.420475C10.8959 0.700791 11.19 1.07514 11.3885 1.54352C11.5869 2.00834 11.6861 2.51753 11.6861 3.07106C11.6861 3.67428 11.5974 4.24023 11.4198 4.76893C11.2423 5.29763 11.002 5.78197 10.6992 6.22196C10.3998 6.66195 10.0586 7.04872 9.67562 7.38226C9.29615 7.7158 8.90101 7.98902 8.4902 8.20192C8.08288 8.41482 7.68426 8.5603 7.29434 8.63836L6.91313 7.89322C7.43534 7.75838 7.90881 7.53484 8.33354 7.22258C8.75827 6.90679 9.12208 6.54131 9.42496 6.12616C9.73132 5.71101 9.96806 5.28166 10.1352 4.83812C10.3023 4.39458 10.3911 3.97588 10.4015 3.58202C10.4154 3.06751 10.3771 2.60801 10.2866 2.2035C10.1961 1.79544 10.0394 1.47255 9.81662 1.23481C9.59381 0.997075 9.28396 0.878207 8.88708 0.878207C8.60509 0.878207 8.35965 0.954496 8.15077 1.10707C7.94188 1.25965 7.78 1.45836 7.66511 1.70319C7.55022 1.94447 7.49278 2.19995 7.49278 2.46962C7.49278 3.09767 7.60767 3.5696 7.83744 3.8854C8.06721 4.19765 8.35617 4.35378 8.70431 4.35378C8.94453 4.35378 9.12382 4.33249 9.24219 4.28991C9.36056 4.24378 9.46848 4.19765 9.56596 4.15152L9.83229 4.84877C9.74873 4.94457 9.58685 5.04392 9.34663 5.14682C9.10989 5.24972 8.79134 5.30118 8.39098 5.30118C7.94188 5.30118 7.55893 5.18585 7.24212 4.95521C6.92879 4.72457 6.69032 4.42474 6.52669 4.05572C6.36306 3.68315 6.28125 3.28396 6.28125 2.85816Z"
												fill="#A5A6A5"
											/>
											<path
												d="M13.4413 2.85816C13.4413 2.29753 13.5492 1.80254 13.765 1.3732C13.9809 0.94385 14.2959 0.608535 14.7102 0.36725C15.1245 0.122417 15.6258 0 16.2142 0C16.7921 0 17.276 0.140158 17.6659 0.420475C18.0559 0.700791 18.35 1.07514 18.5485 1.54352C18.7469 2.00834 18.8461 2.51753 18.8461 3.07106C18.8461 3.67428 18.7574 4.24023 18.5798 4.76893C18.4023 5.29763 18.162 5.78197 17.8592 6.22196C17.5598 6.66195 17.2186 7.04872 16.8356 7.38226C16.4562 7.7158 16.061 7.98902 15.6502 8.20192C15.2429 8.41482 14.8443 8.5603 14.4543 8.63836L14.0731 7.89322C14.5953 7.75838 15.0688 7.53484 15.4935 7.22258C15.9183 6.90679 16.2821 6.54131 16.585 6.12616C16.8913 5.71101 17.1281 5.28166 17.2952 4.83812C17.4623 4.39458 17.5511 3.97588 17.5615 3.58202C17.5754 3.06751 17.5371 2.60801 17.4466 2.2035C17.3561 1.79544 17.1994 1.47255 16.9766 1.23481C16.7538 0.997075 16.444 0.878207 16.0471 0.878207C15.7651 0.878207 15.5197 0.954496 15.3108 1.10707C15.1019 1.25965 14.94 1.45836 14.8251 1.70319C14.7102 1.94447 14.6528 2.19995 14.6528 2.46962C14.6528 3.09767 14.7677 3.5696 14.9974 3.8854C15.2272 4.19765 15.5162 4.35378 15.8643 4.35378C16.1045 4.35378 16.2838 4.33249 16.4022 4.28991C16.5206 4.24378 16.6285 4.19765 16.726 4.15152L16.9923 4.84877C16.9087 4.94457 16.7469 5.04392 16.5066 5.14682C16.2699 5.24972 15.9513 5.30118 15.551 5.30118C15.1019 5.30118 14.7189 5.18585 14.4021 4.95521C14.0888 4.72457 13.8503 4.42474 13.6867 4.05572C13.5231 3.68315 13.4413 3.28396 13.4413 2.85816Z"
												fill="#A5A6A5"
											/>
											<rect width="2.35592" height="15.7061" fill="#A5A6A5" />
										</svg>

										Blockquote
									</button>
									<button
										class="flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-gray-100"
									>
										<svg
											width="16"
											height="16"
											viewBox="0 0 16 16"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<rect width="3.92653" height="2.35592" rx="1.17796" fill="#A5A6A5" />
											<rect
												x="11.7812"
												width="3.92653"
												height="2.35592"
												rx="1.17796"
												fill="#A5A6A5"
											/>
											<rect
												x="4.71094"
												width="6.28244"
												height="2.35592"
												rx="1.17796"
												fill="#A5A6A5"
											/>
											<rect
												y="13.3516"
												width="3.92653"
												height="2.35592"
												rx="1.17796"
												fill="#A5A6A5"
											/>
											<rect
												x="11.7812"
												y="13.3516"
												width="3.92653"
												height="2.35592"
												rx="1.17796"
												fill="#A5A6A5"
											/>
											<rect
												x="4.71094"
												y="13.3516"
												width="6.28244"
												height="2.35592"
												rx="1.17796"
												fill="#A5A6A5"
											/>
											<rect
												y="7.07031"
												width="15.7061"
												height="2.35592"
												rx="1.17796"
												fill="#A5A6A5"
											/>
										</svg>

										Divider
									</button>
									<button
										class="flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-gray-100"
									>
										<svg
											width="18"
											height="15"
											viewBox="0 0 18 15"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<ellipse cx="1.57061" cy="1.17796" rx="1.57061" ry="1.17796" fill="#A5A6A5" />
											<ellipse cx="1.57061" cy="6.67796" rx="1.57061" ry="1.17796" fill="#A5A6A5" />
											<ellipse cx="1.57061" cy="13.7405" rx="1.57061" ry="1.17796" fill="#A5A6A5" />
											<rect
												x="5.49609"
												width="11.7796"
												height="2.35592"
												rx="1.17796"
												fill="#A5A6A5"
											/>
											<rect
												x="5.49609"
												y="6.28125"
												width="11.7796"
												height="2.35592"
												rx="1.17796"
												fill="#A5A6A5"
											/>
											<rect
												x="5.49609"
												y="12.5625"
												width="11.7796"
												height="2.35592"
												rx="1.17796"
												fill="#A5A6A5"
											/>
										</svg>

										List
									</button>
									<button
										class="flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-gray-100"
									>
										<svg
											width="17"
											height="17"
											viewBox="0 0 17 17"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M2.35059 10.0146C2.79826 10.0147 3.18363 10.1047 3.49219 10.3008H3.49121C3.79466 10.4917 4.02043 10.7509 4.16406 11.0752C4.30401 11.3912 4.37207 11.7402 4.37207 12.1191C4.37207 12.5691 4.26698 13.0205 4.06348 13.4727L4.06445 13.4736C3.86459 13.9234 3.58753 14.3538 3.23633 14.7637L3.23535 14.7627C3.00886 15.0272 2.75842 15.2745 2.48633 15.5078L4.40039 15.4795L4.59961 15.4766V16.6895H0.467773L0.426758 16.5469L0.288086 16.0518L0.25 15.918L0.364258 15.8379C0.60476 15.6692 0.85145 15.4733 1.10449 15.251C1.35621 15.0298 1.59652 14.7923 1.8252 14.5381C1.99591 14.3483 2.15369 14.1531 2.29785 13.9531L2.4375 13.751C2.61611 13.4798 2.75493 13.2092 2.85547 12.9395L2.85645 12.9385C2.95777 12.6733 3.00678 12.4173 3.00684 12.1699C3.00684 11.8241 2.92476 11.5906 2.79004 11.4404L2.7373 11.3877C2.60997 11.2723 2.43633 11.208 2.19824 11.208C1.95682 11.2081 1.73469 11.2602 1.5293 11.3633L1.52832 11.3643C1.31458 11.4703 1.15024 11.5921 1.0293 11.7266L0.859375 11.915L0.719727 11.7031L0.333008 11.1201L0.249023 10.9932L0.350586 10.8799C0.466525 10.7517 0.616557 10.6235 0.796875 10.4951C0.990054 10.3566 1.21642 10.2441 1.47266 10.1553V10.1562C1.73855 10.0612 2.03212 10.0146 2.35059 10.0146Z"
												fill="#A5A6A5"
												stroke="#A5A6A5"
												stroke-width="0.392653"
											/>
											<path
												d="M2.07313 7.06775V1.30467C1.82651 1.3516 1.58637 1.3954 1.35273 1.43608C1.12341 1.47675 0.887604 1.51429 0.645306 1.54871L0.476562 0.901068C0.684247 0.857266 0.909238 0.79782 1.15154 0.722731C1.39816 0.647642 1.6383 0.566296 1.87194 0.478692C2.10991 0.391088 2.32192 0.305049 2.50797 0.220574C2.69402 0.13297 2.83464 0.0594452 2.92983 0L3.61778 0.0844751V7.06775H2.07313Z"
												fill="#A5A6A5"
											/>
											<rect
												x="8.33203"
												y="1.57031"
												width="7.85306"
												height="2.35592"
												rx="1.17796"
												fill="#A5A6A5"
											/>
											<rect
												x="8.33203"
												y="7.85156"
												width="7.85306"
												height="2.35592"
												rx="1.17796"
												fill="#A5A6A5"
											/>
											<rect
												x="8.33203"
												y="14.1328"
												width="7.85306"
												height="2.35592"
												rx="1.17796"
												fill="#A5A6A5"
											/>
										</svg>

										Numbered List
									</button>
									<button
										class="flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-gray-100"
									>
										<svg
											width="19"
											height="21"
											viewBox="0 0 19 21"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M7.0667 14.4639V9.35938L5.49609 11.0609"
												stroke="#A5A6A5"
												stroke-width="1.57061"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
											<path
												d="M7.06641 9.35938L8.63702 11.0609"
												stroke="#A5A6A5"
												stroke-width="1.57061"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
											<path
												d="M17.2764 8.50911V12.7628C17.2764 17.0166 15.7058 18.7181 11.7793 18.7181H7.06745C3.14092 18.7181 1.57031 17.0166 1.57031 12.7628V7.65836C1.57031 3.40462 3.14092 1.70312 7.06745 1.70312H10.994"
												stroke="#A5A6A5"
												stroke-width="1.57061"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
											<path
												d="M17.2785 8.50911H14.1373C11.7814 8.50911 10.9961 7.65836 10.9961 5.10612V1.70312L17.2785 8.50911Z"
												stroke="#A5A6A5"
												stroke-width="1.57061"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>

										Attachment
									</button>
								</div>
							</div>
						{/if}
					</div>

					<!-- textarea -->
					<textarea
						rows="6"
						placeholder="Who should come? What's the event about?"
						class="w-full resize-none border-none text-sm text-gray-500 outline-none focus:ring-0"
					></textarea>
				</div>
			</div>

			<div
				class="flex h-[55px] w-full items-center justify-between bg-[#F4F5F6] px-3"
				use:clickOutside={() => {
					showAIModal = false;
				}}
			>
				<!-- Suggest with AI -->
				<button class="flex items-center gap-1 text-sm text-[#B2B3B3]" on:click={openAIModal}>
					<svg
						width="23"
						height="23"
						viewBox="0 0 23 23"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect
							x="10.9964"
							y="4.03479"
							width="1.57061"
							height="4.71184"
							rx="0.785307"
							fill="#ACAEAE"
						/>
						<rect
							x="16.8948"
							y="5.60511"
							width="1.57061"
							height="4.71184"
							rx="0.785307"
							transform="rotate(48.8391 16.8948 5.60511)"
							fill="#ACAEAE"
						/>
						<rect
							x="3.13703"
							y="12.7692"
							width="1.57061"
							height="4.71184"
							rx="0.785307"
							transform="rotate(-90.9275 3.13703 12.7692)"
							fill="#ACAEAE"
						/>
						<rect
							x="14.9183"
							y="12.6754"
							width="1.57061"
							height="4.71184"
							rx="0.785307"
							transform="rotate(-90 14.9183 12.6754)"
							fill="#ACAEAE"
						/>
						<rect
							x="9.21124"
							y="8.64417"
							width="1.57061"
							height="4.71184"
							rx="0.785307"
							transform="rotate(130.233 9.21124 8.64417)"
							fill="#ACAEAE"
						/>
						<rect
							x="17.6605"
							y="16.0504"
							width="1.57061"
							height="4.71184"
							rx="0.785307"
							transform="rotate(131.574 17.6605 16.0504)"
							fill="#ACAEAE"
						/>
						<rect
							x="12.5706"
							y="19.4176"
							width="1.57061"
							height="4.71184"
							rx="0.785307"
							transform="rotate(-179.587 12.5706 19.4176)"
							fill="#ACAEAE"
						/>
						<rect
							x="8.59406"
							y="13.2535"
							width="1.57061"
							height="4.71184"
							rx="0.785307"
							transform="rotate(41.5742 8.59406 13.2535)"
							fill="#ACAEAE"
						/>
					</svg>
					Suggest with AI
				</button>

				<!-- Done button -->
				<div class="flex justify-end">
					<button
						class="rounded-md bg-gray-800 px-4 py-2 text-sm text-white"
						on:click={() => (open = false)}
					>
						Done
					</button>
				</div>

				<!-- AI Suggest Modal -->
				{#if showAIModal}
					<div
						class="absolute bottom-[50px] left-[-10px] z-50 w-85 rounded-md border bg-[#F8F8F9] p-2 shadow-lg md:left-0"
					>
						<div class="mb-4 flex items-start justify-between">
							<div
								class="mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#EFF0F0]"
							>
								<div class="flex h-9 w-9 items-center justify-center">
									<svg
										width="55"
										height="58"
										viewBox="0 0 55 58"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<rect
											width="3.89404"
											height="11.72"
											rx="1.94702"
											transform="matrix(0.967873 -0.0100048 -0.00935403 1.03084 26.5616 10.3293)"
											fill="#737577"
										/>
										<rect
											width="3.84882"
											height="11.8536"
											rx="1.92441"
											transform="matrix(0.637367 0.781083 -0.724219 0.678245 40.6866 14.2121)"
											fill="#737577"
										/>
										<rect
											width="3.90495"
											height="11.6872"
											rx="1.95248"
											transform="matrix(-0.00626614 -1.03099 0.967474 -0.0267319 7.50104 32.9152)"
											fill="#737577"
										/>
										<rect
											width="3.90665"
											height="11.6821"
											rx="1.95333"
											transform="matrix(0.00935403 -1.03084 0.967873 -0.0100048 35.7803 32.3761)"
											fill="#737577"
										/>
										<rect
											width="3.95282"
											height="11.5415"
											rx="1.97641"
											transform="matrix(-0.622912 0.784135 -0.741761 -0.668389 22.1671 22.2043)"
											fill="#737577"
										/>
										<rect
											width="3.95287"
											height="11.5413"
											rx="1.97644"
											transform="matrix(-0.639625 0.768688 -0.726593 -0.687069 42.2842 40.9699)"
											fill="#737577"
										/>
										<rect
											width="3.89328"
											height="11.7222"
											rx="1.94664"
											transform="matrix(-0.967968 0.00254488 0.01631 -1.03068 29.9835 49.7433)"
											fill="#737577"
										/>
										<rect
											width="3.84711"
											height="11.8586"
											rx="1.92355"
											transform="matrix(0.726593 0.687069 -0.639625 0.768688 20.587 34.0246)"
											fill="#737577"
										/>
									</svg>
								</div>
							</div>
							<button
								on:click={closeAIModal}
								class="flex h-[29px] w-[29px] items-center justify-center rounded-full bg-[#EBECED] text-[#616265]"
							>
								<Icon icon="mdi:close" class="text-xl" />
							</button>
						</div>
						<h3 class="mb-2 text-xl font-medium text-gray-700">Suggest Description</h3>
						<p class="mb-4 text-sm text-gray-500">Generate description for your event with AI.</p>

						<div class="flex justify-between">
							<div class="mb-3">
								<label for="" class="mb-1 block font-medium text-gray-600">Mood</label>
								<div class="flex gap-2 rounded-md bg-[#EFEFF0] p-1">
									{#each moods as mood}
										<button
											class="h-[39px] w-[43px] rounded-md px-3 py-1 {selectedMood === mood
												? 'bg-white'
												: ''}"
											on:click={() => (selectedMood = mood)}
										>
											{mood}
										</button>
									{/each}
								</div>
							</div>

							<div class="mb-3">
								<label for="" class="mb-1 block font-medium text-gray-600">Length</label>
								<div class="flex gap-2 rounded-md bg-[#EFEFF0] p-1">
									{#each ['S', 'M', 'L'] as size}
										<button
											class="h-[39px] w-[39px] rounded-md px-3 py-1 {selectedLength === size
												? 'bg-white text-black'
												: 'text-gray-400'}"
											on:click={() => (selectedLength = size)}
										>
											{size}
										</button>
									{/each}
								</div>
							</div>
						</div>

						<div class="mb-3">
							<label for="" class="mb-1 block text-sm font-medium text-gray-600"
								>Additional Instructions</label
							>
							<textarea
								rows="4"
								placeholder="For example, you could tell the AI to write about a startup pitch event."
								class="w-full resize-none rounded-md border p-2 text-xs text-gray-500 outline-none focus:ring-0"
							></textarea>
						</div>

						<button class="mb-5 w-full rounded-md bg-gray-800 py-1.5 text-sm text-white">
							Generate
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
