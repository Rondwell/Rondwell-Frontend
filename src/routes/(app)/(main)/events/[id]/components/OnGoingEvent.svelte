<!-- src/routes/event/+page.svelte -->
<script lang="ts">
	import Icon from '@iconify/svelte';

	// Mock data for the event
	export let eventData: any = {};
	let value = 100;
</script>

<div class="max-w-6xl">
	<!-- Event Header -->
	<div class="mb-6">
		<div class="mb-2 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span class="text-sm text-[#83808D]">John Collection</span>
				<svg
					width="11"
					height="11"
					viewBox="0 0 11 11"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M0.827148 0.795898C1.49266 0.146359 2.45588 0.00140483 3.28223 0.438477L8.91895 3.4043H8.91797C9.61211 3.76739 10.0449 4.48319 10.0449 5.26758C10.0449 6.05184 9.61196 6.76678 8.91797 7.12988L8.91895 7.13086L3.28223 10.0957C2.96323 10.2657 2.62676 10.3467 2.29004 10.3467C1.75372 10.3466 1.23549 10.137 0.827148 9.73926C0.160836 9.0889 0.000384912 8.12521 0.416016 7.29395L1.2041 5.71875C1.34288 5.44119 1.34292 5.10404 1.20312 4.82031V4.81934L0.416016 3.24023C0.000612916 2.4091 0.161042 1.44617 0.827148 0.795898ZM2.29492 1.29199C2.01826 1.29212 1.77162 1.42109 1.59961 1.58887L1.59863 1.58984C1.34194 1.83849 1.16551 2.27322 1.40332 2.75293L2.19043 4.32812L2.28711 4.55469C2.47977 5.09324 2.44715 5.69271 2.19043 6.21094V6.21191L1.40234 7.78711V7.78809C1.16122 8.26626 1.34076 8.7005 1.59863 8.9502C1.85851 9.20169 2.2935 9.37235 2.76758 9.12305L8.40332 6.15723H8.4043C8.74149 5.98034 8.94037 5.64982 8.94043 5.27246C8.94043 4.89509 8.74146 4.56463 8.4043 4.3877H8.40332L2.76758 1.41113C2.60129 1.32386 2.44117 1.29199 2.29492 1.29199Z"
						fill="#83808D"
						stroke="#83808D"
						stroke-width="0.37461"
					/>
					<rect
						x="5.0584"
						y="5.85137"
						width="3.37149"
						height="1.12383"
						rx="0.561915"
						transform="rotate(-180 5.0584 5.85137)"
						fill="#83808D"
						stroke="#83808D"
						stroke-width="0.37461"
					/>
				</svg>
			</div>
			<button class="flex items-start gap-1 px-3 py-1 text-sm font-medium text-[#5D646F]">
				Event Page
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M1.24306 6.4387C1.40611 5.40243 2.12888 4.62786 3.0931 4.47826L9.69034 3.43935L9.8408 3.42097C10.5948 3.35739 11.3249 3.72187 11.7721 4.3912C12.2195 5.06073 12.3131 5.92902 12.0244 6.68931L11.9618 6.83923L9.01457 13.3413L9.01326 13.3411C8.84871 13.7088 8.61528 14.0066 8.33157 14.2308C7.8792 14.5883 7.31432 14.7405 6.72781 14.6481C5.77143 14.4963 5.05093 13.7247 4.89305 12.6922L4.591 10.7138C4.53659 10.3578 4.3245 10.0403 4.02548 9.86912L4.02494 9.8683L2.3872 8.94152C1.53287 8.45922 1.08026 7.47484 1.24306 6.4387ZM2.76439 5.88928C2.52769 6.07636 2.39626 6.36366 2.35324 6.63719L2.35378 6.638C2.28828 7.04462 2.40721 7.57568 2.91465 7.86476L4.55152 8.78851L4.66279 8.85692C5.17357 9.19045 5.53909 9.73754 5.67294 10.3689L5.69839 10.5051L6.00044 12.4835L6.00098 12.4843C6.09306 13.0997 6.52266 13.3845 6.9 13.4426C7.27991 13.5012 7.75745 13.3662 8.00792 12.8142L10.9559 6.31145C11.1348 5.91836 11.1012 5.47237 10.8636 5.11651C10.6258 4.7606 10.2457 4.58735 9.84651 4.65089L9.84575 4.6515L3.24253 5.68148C3.04601 5.71271 2.88934 5.79056 2.76439 5.88928Z"
						fill="#5D646F"
						stroke="#5D646F"
						stroke-width="0.37461"
					/>
					<rect
						x="7.25931"
						y="8.68484"
						width="3.5114"
						height="1.15881"
						rx="0.579404"
						transform="rotate(144 7.25931 8.68484)"
						fill="#5D646F"
						stroke="#5D646F"
						stroke-width="0.37461"
					/>
				</svg>
			</button>
		</div>
		<h1 class="mb-4 text-4xl font-bold">{eventData.title}</h1>

		<!-- Action Buttons -->
		<div class="mb-4 flex w-full flex-wrap gap-3">
			<button
				class="flex w-full items-center gap-2 rounded-md bg-[#FDFDFD] px-3 py-1 text-sm font-medium md:min-w-70 lg:w-fit"
			>
				<div class="flex h-[44px] w-[44px] items-center justify-center rounded-sm bg-[#E2E8FC]">
					<svg
						width="20"
						height="22"
						viewBox="0 0 20 22"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M17.2196 10.4232C16.5968 10.2593 15.8647 10.1719 14.9906 10.1719C13.7778 10.1719 13.3299 10.4669 12.7071 10.9367C12.6743 10.9586 12.6415 10.9913 12.6087 11.0241L11.5708 12.1277C10.6967 13.0454 9.12331 13.0564 8.24922 12.1167L7.21124 11.0241C7.17846 10.9913 7.14568 10.9586 7.1129 10.9367C6.49011 10.4669 6.04214 10.1719 4.82934 10.1719C3.95526 10.1719 3.22321 10.2593 2.60042 10.4232C-2.60499e-07 11.1224 0 13.1875 0 15.0012V16.0173C0 18.7598 -5.20998e-07 21.8628 5.84547 21.8628H13.9745C17.8533 21.8628 19.82 19.8961 19.82 16.0173V15.0012C19.82 13.1875 19.82 11.1224 17.2196 10.4232ZM12.4558 17.9294H7.3642C6.94901 17.9294 6.6103 17.5907 6.6103 17.1646C6.6103 16.7385 6.94901 16.3998 7.3642 16.3998H12.4558C12.871 16.3998 13.2097 16.7385 13.2097 17.1646C13.2097 17.5907 12.871 17.9294 12.4558 17.9294Z"
							fill="#146AEB"
						/>
						<path
							d="M17.7867 4.82934V8.87201C17.743 8.85016 17.6884 8.83923 17.6447 8.8283C16.8798 8.62071 16.0167 8.52237 14.9896 8.52237C13.307 8.52237 12.5203 9.01405 11.7118 9.62591C11.6025 9.70239 11.5042 9.80073 11.4168 9.88814L10.3679 10.9917C10.2695 11.1009 10.0947 11.1665 9.90898 11.1665C9.72324 11.1665 9.54842 11.1009 9.43916 10.9808L8.4121 9.89906C8.31377 9.7898 8.20451 9.69147 8.09525 9.61499C7.30857 9.01405 6.51096 8.52237 4.82834 8.52237C3.80128 8.52237 2.93812 8.62071 2.17329 8.8283C2.12959 8.83923 2.07495 8.85016 2.03125 8.87201V4.82934C2.03125 2.56764 2.03125 0 6.86059 0H12.9574C17.7867 0 17.7867 2.56764 17.7867 4.82934Z"
							fill="#146AEB"
						/>
					</svg>
				</div>
				Invite Attendee
			</button>

			<button
				class="flex w-full items-center gap-2 rounded-md bg-[#FDFDFD] px-3 py-1 text-sm font-medium md:min-w-70 lg:w-fit"
			>
				<div class="flex h-[44px] w-[44px] items-center justify-center rounded-sm bg-[#F2E4F8]">
					<svg
						width="27"
						height="27"
						viewBox="0 0 27 27"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M17.6353 3.23798L7.76904 6.51582C1.13688 8.73382 1.13688 12.3504 7.76904 14.5574L10.6972 15.5299L11.6697 18.4581C13.8767 25.0902 17.5042 25.0902 19.7113 18.4581L23 8.6027C24.4641 4.17763 22.0604 1.76295 17.6353 3.23798ZM17.985 9.11623L13.833 13.29C13.6691 13.4539 13.4615 13.5304 13.2539 13.5304C13.0464 13.5304 12.8388 13.4539 12.6749 13.29C12.358 12.9732 12.358 12.4487 12.6749 12.1318L16.8268 7.95806C17.1436 7.64121 17.6681 7.64121 17.985 7.95806C18.3018 8.27492 18.3018 8.79937 17.985 9.11623Z"
							fill="#AB46DD"
						/>
					</svg>
				</div>
				Send a Post
			</button>

			<button
				class="flex w-full items-center gap-2 rounded-md bg-[#FDFDFD] px-3 py-1 text-sm font-medium md:min-w-70 lg:w-fit"
			>
				<div class="flex h-[44px] w-[44px] items-center justify-center rounded-sm bg-[#FBDEEC]">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M21.1082 12.7701C20.693 12.7701 20.3434 12.4533 20.2887 12.0381C20.0265 9.56879 18.6935 7.32894 16.6394 5.90855C16.2679 5.64632 16.1805 5.14372 16.4318 4.77223C16.694 4.40074 17.2076 4.31333 17.5681 4.56463C20.0156 6.25818 21.5889 8.92415 21.9058 11.8633C21.9495 12.3113 21.6327 12.7155 21.1738 12.7701C21.1628 12.7701 21.1301 12.7701 21.1082 12.7701Z"
							fill="#F31A7C"
						/>
						<path
							d="M2.39563 12.8285C2.36286 12.8285 2.341 12.8285 2.30822 12.8285C1.86025 12.7739 1.53247 12.3696 1.57617 11.9217C1.87118 8.98254 3.43361 6.32749 5.84829 4.61209C6.21978 4.34987 6.7333 4.43728 6.99553 4.80876C7.25776 5.18025 7.17035 5.69378 6.79886 5.95601C4.7666 7.38733 3.45547 9.62718 3.20417 12.0965C3.17139 12.5117 2.81083 12.8285 2.39563 12.8285Z"
							fill="#F31A7C"
						/>
						<path
							d="M11.7537 23.1937C10.1366 23.1937 8.59604 22.8222 7.15379 22.1011C6.74952 21.8935 6.58563 21.4018 6.79323 20.9975C7.00082 20.5933 7.4925 20.4294 7.89677 20.637C10.2568 21.8279 13.0976 21.8498 15.4795 20.7025C15.8838 20.5059 16.3754 20.6807 16.5721 21.0849C16.7688 21.4892 16.594 21.9809 16.1897 22.1776C14.7911 22.855 13.3052 23.1937 11.7537 23.1937Z"
							fill="#F31A7C"
						/>
						<path
							d="M11.7573 7.71384C9.62672 7.71384 7.90039 5.98751 7.90039 3.85692C7.90039 1.72633 9.62672 0 11.7573 0C13.8879 0 15.6142 1.72633 15.6142 3.85692C15.6142 5.98751 13.877 7.71384 11.7573 7.71384ZM11.7573 1.64984C10.5336 1.64984 9.53931 2.64412 9.53931 3.86785C9.53931 5.09157 10.5336 6.08585 11.7573 6.08585C12.981 6.08585 13.9753 5.09157 13.9753 3.86785C13.9753 2.64412 12.9701 1.64984 11.7573 1.64984Z"
							fill="#F31A7C"
						/>
						<path
							d="M3.85692 21.0732C1.72633 21.0732 0 19.3469 0 17.2163C0 15.0966 1.72633 13.3594 3.85692 13.3594C5.98751 13.3594 7.71384 15.0857 7.71384 17.2163C7.71384 19.336 5.98751 21.0732 3.85692 21.0732ZM3.85692 14.9983C2.63319 14.9983 1.63892 15.9926 1.63892 17.2163C1.63892 18.44 2.63319 19.4343 3.85692 19.4343C5.08064 19.4343 6.07492 18.44 6.07492 17.2163C6.07492 15.9926 5.08064 14.9983 3.85692 14.9983Z"
							fill="#F31A7C"
						/>
						<path
							d="M19.5229 21.0732C17.3923 21.0732 15.666 19.3469 15.666 17.2163C15.666 15.0966 17.3923 13.3594 19.5229 13.3594C21.6535 13.3594 23.3799 15.0857 23.3799 17.2163C23.3689 19.336 21.6426 21.0732 19.5229 21.0732ZM19.5229 14.9983C18.2992 14.9983 17.3049 15.9926 17.3049 17.2163C17.3049 18.44 18.2992 19.4343 19.5229 19.4343C20.7467 19.4343 21.7409 18.44 21.7409 17.2163C21.73 15.9926 20.7467 14.9983 19.5229 14.9983Z"
							fill="#F31A7C"
						/>
					</svg>
				</div>
				Share Event
			</button>
		</div>
	</div>

	<!-- Event Details Section -->
	<div class="mb-12 rounded-lg bg-[#FDFDFD] p-4 shadow-md">
		<!-- Two-column layout -->
		<div class="flex flex-col gap-6 lg:flex-row lg:items-stretch">
			<!-- Left Column: Event Image + Share -->
			<div class="w-full lg:w-1/2">
				<div class="relative w-full">
					<img src="/event_pic1.png" alt="Event" class="mb-4 h-70 w-full rounded-lg object-cover" />

					<!-- Copy link overlay -->
					<div
						class="absolute bottom-2 left-2.5 flex w-full max-w-[96%] items-center justify-between gap-2 rounded-md bg-[#B3ACA0] p-2 text-[#EFEEEC]"
					>
						<span class="text-xs">rondwell.com/copylink</span>
						<p class="cursor-pointer hover:underline">Copy</p>
					</div>
				</div>

				<!-- Share section -->
				<div class="flex w-full items-center justify-between">
					<p class="text-sm text-[#838485]">Share event</p>
					<div class="flex items-center gap-2 text-xl text-[#A3A5A5]">
						<Icon icon="mdi:instagram" />
						<Icon icon="mdi:twitter" />
						<Icon icon="mdi:linkedin" />
						<Icon icon="simple-icons:tiktok" />
					</div>
				</div>
			</div>

			<!-- Right Column: When & Where -->
			<div class="flex w-full flex-col justify-between rounded-md p-4 lg:w-1/2">
				<div class="w-full">
					<h3 class="mb-3 text-lg font-semibold text-gray-800">When & Where</h3>

					<!-- Date and Location Blocks -->
					<div class="mb-3 space-y-3">
						<!-- Date -->
						<div class="flex items-center gap-2">
							<div class="flex h-[49.45px] w-[49.45px] flex-col rounded-md border">
								<p class="bg-[#EBECED] py-[2px] text-center text-xs text-[#C7C9CB]">Jun</p>
								<div class="flex flex-1 items-center justify-center border-t">
									<p class="text-sm font-medium text-gray-700">25</p>
								</div>
							</div>

							<div>
								<div class="text-lg font-medium text-gray-800">{eventData.date}</div>
								<div class="text-sm text-gray-500">{eventData.time}</div>
							</div>
						</div>

						<!-- Location -->
						<div class="flex items-center gap-2">
							<div
								class="flex h-[49.45px] w-[49.45px] items-center justify-center rounded-md border"
							>
								<svg
									width="27"
									height="27"
									viewBox="0 0 27 27"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										opacity="0.4"
										d="M23.7738 17.3967L16.7811 4.80977C15.8414 3.11622 14.5412 2.1875 13.1099 2.1875C11.6786 2.1875 10.3784 3.11622 9.43873 4.80977L2.44601 17.3967C1.561 19.0028 1.46266 20.5434 2.17286 21.7562C2.88306 22.969 4.2816 23.6355 6.11719 23.6355H20.1026C21.9382 23.6355 23.3368 22.969 24.047 21.7562C24.7571 20.5434 24.6588 18.9919 23.7738 17.3967Z"
										fill="#B3B5B7"
									/>
									<path
										d="M13.1105 16.1176C12.6625 16.1176 12.291 15.7461 12.291 15.2981V9.83508C12.291 9.38711 12.6625 9.01562 13.1105 9.01562C13.5584 9.01562 13.9299 9.38711 13.9299 9.83508V15.2981C13.9299 15.7461 13.5584 16.1176 13.1105 16.1176Z"
										fill="#B3B5B7"
									/>
									<path
										d="M13.1121 19.6723C13.0466 19.6723 12.9701 19.6614 12.8936 19.6505C12.8281 19.6396 12.7625 19.6177 12.697 19.5849C12.6314 19.5631 12.5658 19.5303 12.5003 19.4866C12.4456 19.4429 12.391 19.3992 12.3364 19.3555C12.1397 19.1479 12.0195 18.8638 12.0195 18.5797C12.0195 18.2956 12.1397 18.0116 12.3364 17.804C12.391 17.7603 12.4456 17.7166 12.5003 17.6729C12.5658 17.6291 12.6314 17.5964 12.697 17.5745C12.7625 17.5417 12.8281 17.5199 12.8936 17.509C13.0357 17.4762 13.1886 17.4762 13.3197 17.509C13.3962 17.5199 13.4618 17.5417 13.5273 17.5745C13.5929 17.5964 13.6584 17.6291 13.724 17.6729C13.7786 17.7166 13.8333 17.7603 13.8879 17.804C14.0846 18.0116 14.2048 18.2956 14.2048 18.5797C14.2048 18.8638 14.0846 19.1479 13.8879 19.3555C13.8333 19.3992 13.7786 19.4429 13.724 19.4866C13.6584 19.5303 13.5929 19.5631 13.5273 19.5849C13.4618 19.6177 13.3962 19.6396 13.3197 19.6505C13.2542 19.6614 13.1777 19.6723 13.1121 19.6723Z"
										fill="#B3B5B7"
									/>
								</svg>
							</div>

							<div>
								<div class="text-lg font-medium text-[#D79917]">
									{eventData.location}
								</div>
								<div class="text-sm text-gray-500">
									Please enter the location of the event before it starts
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Buttons -->
				<div class="mt-4 flex w-full items-center gap-2">
					<button
						class="w-35 rounded-md bg-[#F4F4F4] px-3 py-2 text-center text-sm font-medium text-[#939495] hover:bg-gray-100"
					>
						Edit Event
					</button>
					<button
						class="w-35 rounded-md bg-[#F4F4F4] px-3 py-2 text-center text-sm font-medium text-[#939495] hover:bg-gray-100"
					>
						Change Photo
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Invites Section -->
	<div class="mb-12">
		<div class="flex w-full items-center justify-between">
			<span>
				<h3 class="mb-1 font-semibold">Invites</h3>
				<p class="mb-4 text-sm text-gray-600">
					Invite subscribers, contacts and past attendee via email or SMS.
				</p>
			</span>
			<button
				class="flex w-60 items-center gap-1 rounded-md bg-[#EBECED] px-3 py-2 text-sm font-medium text-[#616265] transition-colors hover:bg-gray-200"
			>
				<Icon icon="mdi:plus" class="text-xl" />
				Invite Attendee
			</button>
		</div>

		<div class="flex h-full flex-col gap-4 lg:flex-row">
			<div class="w-full max-w-[284.7px] rounded-md bg-[#FDFDFD]">
				<div class="flex w-full flex-col gap-5 p-3">
					<div class="text-sm font-medium text-[#B6B7B7]">
						<div class="flex items-center">
							<p class="text-3xl font-bold text-black">1</p>
							/1
						</div>
						<div class="">Invite Accepted</div>
					</div>
					<div class="text-sm font-medium text-[#B6B7B7]">
						<div class="flex gap-1">
							<p>1 Email Opened</p>
							<svg
								width="18"
								height="18"
								viewBox="0 0 18 18"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M8.61453 1.43451C4.66552 1.43451 1.43451 4.66552 1.43451 8.61453C1.43451 12.5635 4.66552 15.7945 8.61453 15.7945C12.5635 15.7945 15.7945 12.5635 15.7945 8.61453C15.7945 4.66552 12.5635 1.43451 8.61453 1.43451Z"
									stroke="#ADAEAE"
									stroke-width="1.49844"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									opacity="0.34"
									d="M8.61486 11.4899V7.89985"
									stroke="#ADAEAE"
									stroke-width="1.49844"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									opacity="0.34"
									d="M8.61877 5.73986H8.61232"
									stroke="#ADAEAE"
									stroke-width="1.49844"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
						<div class="">0 Declined</div>
					</div>
				</div>
			</div>

			<!-- Invite List -->
			<div class="w-full rounded-md bg-[#FDFDFD]">
				<div class="w-full rounded-lg">
					<p class="w-full border-b p-3 text-[#A9AAAA]">RECENTLY ACCEPTED</p>
					<div class="flex items-start gap-2 p-3">
						<img src="/face-1.svg" alt="profile icon" class="h-6 w-6" />
						<div class="flex items-center gap-1">
							<div class="font-medium">John Odoemenem</div>
							<span class="h-2 w-2 rounded-full bg-[#EAAB26]"></span>
							<div class="text-sm text-gray-500">johnmedic23@gmail.com</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Attendees Section -->
	<div class="mb-12 border-t pt-12">
		<h3 class="mb-3 font-semibold">Attendees</h3>

		<!-- Tabs -->
		<div class="mb-6 w-full max-w-2xl text-xs font-medium text-green-600">
			<!-- Top label -->
			<p class="mb-1">Attendee</p>

			<!-- Progress bar -->
			<div class="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
				<div
					class="h-full rounded-full bg-green-500 transition-all duration-500"
					style="width: {value}%;"
				></div>
			</div>

			<!-- Sub label -->
			<div class="flex items-center space-x-1 text-green-600">
				<span class="h-2 w-2 rounded-full bg-green-500"></span>
				<span>1 Attending</span>
			</div>
		</div>

		<!-- Recent Registrations -->
		<div class="mb-4">
			<div class="mb-3 flex items-center justify-between">
				<h4 class="text-lg font-medium">Recent Registrations</h4>
				<button
					class="flex w-35 items-center gap-1 rounded-sm bg-[#EBECED] px-3 py-2 text-sm font-medium text-[#616265]"
				>
					<p>All Attendee</p>
					<svg
						width="11"
						height="11"
						viewBox="0 0 11 11"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M0.827148 0.795898C1.49266 0.146359 2.45588 0.00140483 3.28223 0.438477L8.91895 3.4043H8.91797C9.61211 3.76739 10.0449 4.48319 10.0449 5.26758C10.0449 6.05184 9.61196 6.76678 8.91797 7.12988L8.91895 7.13086L3.28223 10.0957C2.96323 10.2657 2.62676 10.3467 2.29004 10.3467C1.75372 10.3466 1.23549 10.137 0.827148 9.73926C0.160836 9.0889 0.000384912 8.12521 0.416016 7.29395L1.2041 5.71875C1.34288 5.44119 1.34292 5.10404 1.20312 4.82031V4.81934L0.416016 3.24023C0.000612916 2.4091 0.161042 1.44617 0.827148 0.795898ZM2.29492 1.29199C2.01826 1.29212 1.77162 1.42109 1.59961 1.58887L1.59863 1.58984C1.34194 1.83849 1.16551 2.27322 1.40332 2.75293L2.19043 4.32812L2.28711 4.55469C2.47977 5.09324 2.44715 5.69271 2.19043 6.21094V6.21191L1.40234 7.78711V7.78809C1.16122 8.26626 1.34076 8.7005 1.59863 8.9502C1.85851 9.20169 2.2935 9.37235 2.76758 9.12305L8.40332 6.15723H8.4043C8.74149 5.98034 8.94037 5.64982 8.94043 5.27246C8.94043 4.89509 8.74146 4.56463 8.4043 4.3877H8.40332L2.76758 1.41113C2.60129 1.32386 2.44117 1.29199 2.29492 1.29199Z"
							fill="#616265"
							stroke="#616265"
							stroke-width="0.37461"
						/>
						<rect
							x="5.06035"
							y="5.85137"
							width="3.37149"
							height="1.12383"
							rx="0.561915"
							transform="rotate(-180 5.06035 5.85137)"
							fill="#616265"
							stroke="#616265"
							stroke-width="0.37461"
						/>
					</svg>
				</button>
			</div>

			<div class="flex w-full items-center justify-between rounded-md bg-[#FDFDFD] p-4">
				<div class="flex items-start gap-2">
					<img src="/face-1.svg" alt="profile icon" class="h-6 w-6" />
					<div class="flex flex-col items-start gap-1 lg:flex-row lg:items-center">
						<span class="flex items-center gap-1">
							<p class="font-medium">John Odoemenem</p>
							<span class="h-2 w-2 rounded-full bg-[#EAAB26]"></span>
						</span>
						<p class="text-sm text-gray-500">johnmedic23@gmail.com</p>
					</div>
				</div>
				<div class="flex flex-col items-center gap-1 lg:flex-row lg:gap-4">
					<div
						class="flex items-center justify-center rounded-full bg-[#E3F4E1] px-2 py-1 text-xs text-[#3CBD2C]"
					>
						Attending
					</div>
					<div class="text-xs text-gray-500">13 Minutes Ago</div>
				</div>
			</div>
		</div>
	</div>

	<div class="mb-12 border-t pt-12">
		<!-- Admins Section -->
		<div>
			<div class="mb-3 flex items-center justify-between">
				<span>
					<span class="flex items-center gap-1">
						<h4 class="text-lg font-medium">Admins</h4>
						<p
							class="hidden h-[22px] w-[22px] items-center justify-center rounded-full bg-[#EBECED] lg:flex"
						>
							1
						</p>
					</span>
					<p class="hidden text-sm text-[#737577] lg:block">
						Add hosts, special guests, and even managers.
					</p>
				</span>
				<div class="flex gap-2">
					<button
						class="flex w-35 items-center gap-1 rounded-sm bg-[#EBECED] px-3 py-2 text-sm font-medium text-[#616265]"
					>
						<p>All Admins</p>
						<svg
							width="11"
							height="11"
							viewBox="0 0 11 11"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M0.827148 0.795898C1.49266 0.146359 2.45588 0.00140483 3.28223 0.438477L8.91895 3.4043H8.91797C9.61211 3.76739 10.0449 4.48319 10.0449 5.26758C10.0449 6.05184 9.61196 6.76678 8.91797 7.12988L8.91895 7.13086L3.28223 10.0957C2.96323 10.2657 2.62676 10.3467 2.29004 10.3467C1.75372 10.3466 1.23549 10.137 0.827148 9.73926C0.160836 9.0889 0.000384912 8.12521 0.416016 7.29395L1.2041 5.71875C1.34288 5.44119 1.34292 5.10404 1.20312 4.82031V4.81934L0.416016 3.24023C0.000612916 2.4091 0.161042 1.44617 0.827148 0.795898ZM2.29492 1.29199C2.01826 1.29212 1.77162 1.42109 1.59961 1.58887L1.59863 1.58984C1.34194 1.83849 1.16551 2.27322 1.40332 2.75293L2.19043 4.32812L2.28711 4.55469C2.47977 5.09324 2.44715 5.69271 2.19043 6.21094V6.21191L1.40234 7.78711V7.78809C1.16122 8.26626 1.34076 8.7005 1.59863 8.9502C1.85851 9.20169 2.2935 9.37235 2.76758 9.12305L8.40332 6.15723H8.4043C8.74149 5.98034 8.94037 5.64982 8.94043 5.27246C8.94043 4.89509 8.74146 4.56463 8.4043 4.3877H8.40332L2.76758 1.41113C2.60129 1.32386 2.44117 1.29199 2.29492 1.29199Z"
								fill="#616265"
								stroke="#616265"
								stroke-width="0.37461"
							/>
							<rect
								x="5.06035"
								y="5.85137"
								width="3.37149"
								height="1.12383"
								rx="0.561915"
								transform="rotate(-180 5.06035 5.85137)"
								fill="#616265"
								stroke="#616265"
								stroke-width="0.37461"
							/>
						</svg>
					</button>
					<button
						class="flex w-35 items-center gap-1 rounded-md bg-[#EBECED] px-3 py-2 text-sm font-medium text-[#616265] transition-colors hover:bg-gray-200"
					>
						<Icon icon="mdi:plus" class="text-xl" />
						Add Admin
					</button>
				</div>
			</div>

			<div class="flex items-center justify-between rounded-md bg-[#FDFDFD] p-3">
				<div class="flex items-start gap-2">
					<img src="/face-1.svg" alt="profile icon" class="h-6 w-6" />
					<div class="flex flex-col items-start gap-1 lg:flex-row lg:items-center">
						<span class="flex items-center gap-1">
							<p class="font-medium">John Odoemenem</p>
							<span class="h-2 w-2 rounded-full bg-[#EAAB26]"></span>
						</span>
						<p class="text-sm text-gray-500">johnmedic23@gmail.com</p>
					</div>
					<div
						class="hidden items-center justify-center rounded-full bg-[#E3F4E1] px-2 py-1 text-xs text-[#3CBD2C] lg:flex"
					>
						Attending
					</div>
				</div>
				<div class="flex flex-col items-center gap-1 lg:flex-row lg:justify-between">
					<div
						class="flex items-center justify-center rounded-full bg-[#E3F4E1] px-2 py-1 text-xs text-[#3CBD2C] lg:hidden"
					>
						Attending
					</div>
					<div class="flex items-center gap-1">
						<svg
							width="13"
							height="13"
							viewBox="0 0 13 13"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M7.09062 1.65712L1.53353 7.28009C1.32196 7.49416 1.1104 7.91517 1.06809 8.22201L0.764845 10.3699C0.652011 11.1477 1.19503 11.69 1.96371 11.5829L4.0864 11.2761C4.38259 11.2333 4.79867 11.0192 5.01729 10.8052L10.5744 5.18218C11.5335 4.21172 11.9848 3.08427 10.5744 1.65712C9.16394 0.229967 8.04971 0.686655 7.09062 1.65712Z"
								stroke="#A9AAAA"
								stroke-width="1.49844"
								stroke-miterlimit="10"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M6.29297 2.46094C6.76546 4.16638 8.08421 5.50077 9.77673 5.986"
								stroke="#A9AAAA"
								stroke-width="1.49844"
								stroke-miterlimit="10"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<rect
								x="8.15757"
								y="11.0912"
								width="4.22292"
								height="0.713575"
								fill="#A9AAAA"
								stroke="#A9AAAA"
								stroke-width="0.713575"
							/>
						</svg>
						<p class="text-sm text-gray-400 lg:hidden">Edit</p>
					</div>
				</div>
			</div>

			<div class="mt-3 flex items-start gap-1 text-xs text-gray-500">
				<p>Learn more about adding hosts / managers</p>
				<svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect
						x="2.9625"
						y="0.37461"
						width="4.49532"
						height="0.74922"
						fill="#D9D9D9"
						stroke="#B3B5B7"
						stroke-width="0.74922"
					/>
					<rect
						x="7.45664"
						y="5.62539"
						width="5.24454"
						height="0.74922"
						transform="rotate(-90 7.45664 5.62539)"
						fill="#D9D9D9"
						stroke="#B3B5B7"
						stroke-width="0.74922"
					/>
					<rect
						x="0.529778"
						y="7.57812"
						width="8.89866"
						height="0.74922"
						transform="rotate(-45 0.529778 7.57812)"
						fill="#D9D9D9"
						stroke="#B3B5B7"
						stroke-width="0.74922"
					/>
				</svg>
			</div>
		</div>
	</div>

	<!-- Visibility & Discovery Section -->
	<div class="mb-12 border-t pt-12">
		<div class="">
			<h3 class="mb-1 text-lg font-medium">Visibility & Discovery</h3>
			<p class="mb-4 text-sm text-[#737577]">Control how people can find your event.</p>

			<!-- Managing Calendar -->
			<div class="mb-4 rounded-md bg-[#FDFDFD] p-3">
				<div class="flex flex-col items-start gap-3 lg:flex-row">
					<div class="flex gap-3">
						<img src="/tech-icon.svg" alt="icon" class="h-10 w-10" />
						<span class="lg:hidden">
							<div class="text-xs font-medium text-[#ABADAD]">Managing Calendar</div>
							<div class="text-sm text-gray-500">{eventData.visibility.calendar}</div>
						</span>
					</div>
					<div>
						<span class="hidden lg:inline">
							<div class="text-xs font-medium text-[#ABADAD]">Managing Calendar</div>
							<div class="text-sm text-gray-500">{eventData.visibility.calendar}</div>
						</span>
						<div class="mt-1 mb-3 flex flex-col items-start gap-1 lg:flex-row lg:items-center">
							<span class="flex items-center text-[#46C036]">
								<Icon icon="mdi:web" class="rounded-full text-xl " />
								<p>{eventData.visibility.status}</p>
							</span>
							<p class="text-sm text-gray-500">
								— This event is listed on the calendar page. Calendar admins have manage access to
								the event.
							</p>
						</div>
						<div class="flex gap-2">
							<button
								class="flex items-center gap-1 rounded-sm bg-[#EBECED] px-3 py-2 text-sm font-medium text-[#616265]"
							>
								<svg
									width="18"
									height="18"
									viewBox="0 0 18 18"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M11.675 8.99471C11.675 10.4782 10.4762 11.6769 8.99275 11.6769C7.5093 11.6769 6.31055 10.4782 6.31055 8.99471C6.31055 7.51125 7.5093 6.3125 8.99275 6.3125C10.4762 6.3125 11.675 7.51125 11.675 8.99471Z"
										stroke="#646567"
										stroke-width="1.12383"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
									<path
										d="M8.99127 15.1886C11.636 15.1886 14.1009 13.6303 15.8167 10.9331C16.491 9.87668 16.491 8.10103 15.8167 7.04463C14.1009 4.34744 11.636 2.78906 8.99127 2.78906C6.34652 2.78906 3.88159 4.34744 2.16588 7.04463C1.49158 8.10103 1.49158 9.87668 2.16588 10.9331C3.88159 13.6303 6.34652 15.1886 8.99127 15.1886Z"
										stroke="#646567"
										stroke-width="1.12383"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>

								<p>Change Visibility</p>
							</button>
							<button
								class="flex items-center gap-1 rounded-md bg-[#EBECED] px-3 py-2 text-sm font-medium text-[#616265] transition-colors hover:bg-gray-200"
							>
								<svg
									width="18"
									height="18"
									viewBox="0 0 18 18"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M12.7328 3H5.24056C2.37105 3 1.56938 3.68928 1.50195 6.37149C2.94795 6.37149 4.11673 7.54776 4.11673 8.99376C4.11673 10.4397 2.94795 11.6085 1.50195 11.616C1.56938 14.2982 2.37105 14.9875 5.24056 14.9875H12.7328C15.7296 14.9875 16.4789 14.2383 16.4789 11.2414V6.7461C16.4789 3.74922 15.7296 3 12.7328 3Z"
										stroke="#616265"
										stroke-width="1.49844"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
									<path
										opacity="0.4"
										d="M6.73633 3V5.62227"
										stroke="#616265"
										stroke-width="1.49844"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
									<path
										opacity="0.4"
										d="M6.73633 12.3594V14.9816"
										stroke="#616265"
										stroke-width="1.49844"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
									<path
										d="M8.23828 7.2848L11.0479 5.51523V9.05437L8.23828 7.2848Z"
										fill="#D9D9D9"
									/>
									<rect
										x="10.4863"
										y="7.96875"
										width="1.36222"
										height="3.7461"
										transform="rotate(-90 10.4863 7.96875)"
										fill="#D9D9D9"
									/>
									<path
										d="M14.2305 10.6918L11.4209 12.4613V8.92219L14.2305 10.6918Z"
										fill="#D9D9D9"
									/>
									<rect
										x="11.9824"
										y="10.0156"
										width="1.36222"
										height="3.7461"
										transform="rotate(90 11.9824 10.0156)"
										fill="#D9D9D9"
									/>
								</svg>

								Transfer Calendar
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Additional Information -->
			<div class="flex items-center gap-1 text-xs text-gray-500">
				<svg
					width="20"
					height="20"
					viewBox="0 0 20 20"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M12.4934 4.22825L13.6378 6.51711C13.7921 6.83365 14.206 7.13396 14.555 7.19889L16.6248 7.53979C17.9478 7.75893 18.2562 8.71669 17.3065 9.67444L15.6913 11.2896C15.4235 11.5575 15.2693 12.0851 15.3586 12.4665L15.8212 14.4632C16.1864 16.0378 15.3423 16.6547 13.9544 15.8268L12.0145 14.6742C11.6655 14.4632 11.0811 14.4632 10.7321 14.6742L8.79227 15.8268C7.40434 16.6466 6.56023 16.0378 6.92547 14.4632L7.38812 12.4665C7.4774 12.0932 7.32319 11.5656 7.05534 11.2896L5.44015 9.67444C4.49052 8.72481 4.79894 7.76705 6.12194 7.53979L8.19165 7.19889C8.54066 7.14208 8.95461 6.83365 9.10882 6.51711L10.2533 4.22825C10.862 2.98642 11.8685 2.98642 12.4934 4.22825Z"
						stroke="#C2C4C4"
						stroke-width="1.87305"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M6.49493 4.05469H1.625"
						stroke="#C2C4C4"
						stroke-width="1.87305"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M4.05996 15.4219H1.625"
						stroke="#C2C4C4"
						stroke-width="1.87305"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M2.43665 9.73438H1.625"
						stroke="#C2C4C4"
						stroke-width="1.87305"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<p>
					You can submit the event to a relevant Rondwell discovery page or other community
					Collection for a chance to be featured, such as the discover more page.
				</p>
			</div>
		</div>
	</div>
</div>
