<script lang="ts">
	import { goto } from '$app/navigation';
	const used = 0;
	const remaining = 15;
	const total = used + remaining;
	const usagePercent = (used / total) * 100;

	let isCalendarVerified = false;
	const totalSteps = 3;
	let currentStep = $state(1);
</script>

<section class="p-4">
	<div class="lg-block hidden sm:justify-between md:mb-10 md:flex">
		<div class="flex items-center justify-between">
			<img src="/tech-icon.svg" alt="icon" class="h-7 w-7" />
			<h1 class="text-md ml-2 lg:text-2xl">Business Collection</h1>
		</div>
		<button
			class="flex w-fit items-center gap-2 whitespace-nowrap rounded-md bg-[#DCE4EE] px-3 text-[#5D646F] md:text-sm"
		>
			<span class="md:text-sm">Calendar Page</span>
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
	<div class="mb-4 flex flex-col justify-between gap-2">
		<h2 class="text-lg font-semibold">Send Limit</h2>
		<p class="text-[#8C8F93]">
			Your calendar has a weekly quota for sending invites and newsletters. It resets every Monday.
		</p>
	</div>

	{#if !isCalendarVerified}
		<div
			class="mb-8 mt-4 w-full flex-col items-center justify-start overflow-hidden rounded-md bg-[#F0E8D7] px-4 py-3 sm:flex sm:flex-row sm:justify-between lg:w-[670.5px]"
		>
			<div class="mb-4 flex items-center gap-2">
				<img src="/verify.svg" alt="add people" class="h-4 w-4" />
				<div class="flex flex-col">
					<h2 class="text-[#D69712]">Please verify your calendar.</h2>
					<p class="text-[#737577]">
						Share information about your calendar for higher invite and newsletter limits
					</p>
				</div>
			</div>
			<button
				onclick={() => goto('newsletter/verify')}
				class="flex w-[90px] items-center justify-center gap-1 rounded-md bg-[#E8E0D0] px-1 py-1 text-sm text-[#616265]"
			>
				Verify<svg
					width="13"
					height="14"
					viewBox="0 0 13 14"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M0.978516 0.939514C1.80208 0.135728 2.99327 -0.0435025 4.01563 0.497131L11.1172 4.23541L11.2744 4.32428C12.0405 4.79517 12.5107 5.6305 12.5107 6.5401C12.5106 7.44951 12.0404 8.28414 11.2744 8.75494L11.1172 8.84381L4.01563 12.5821L4.01465 12.5811C3.62002 12.7913 3.20419 12.8917 2.78809 12.8917C2.12527 12.8915 1.48426 12.6323 0.978516 12.1397C0.154115 11.3351 -0.0444085 10.1439 0.469727 9.1153L1.46289 7.12994C1.64464 6.76644 1.64469 6.3251 1.46191 5.95416V5.95319L0.469727 3.96393C-0.0444055 2.93537 0.154116 1.74413 0.978516 0.939514ZM2.79492 1.48151C2.47652 1.48151 2.18938 1.61145 1.97266 1.7901L1.88379 1.87018C1.54868 2.19448 1.31625 2.76415 1.62695 3.39166L2.61914 5.37701V5.37799C2.98213 6.11056 2.98209 6.97451 2.61914 7.70709V7.70807L1.62695 9.69342L1.62598 9.6944C1.3106 10.3203 1.54754 10.8895 1.88379 11.2149C2.22203 11.5421 2.79159 11.7677 3.41211 11.4415L10.5137 7.70319C10.9546 7.47199 11.2167 7.03961 11.2168 6.54596C11.2168 6.05222 10.9546 5.61997 10.5137 5.38873V5.38776L3.41211 1.63776C3.1954 1.52403 2.98656 1.48154 2.79492 1.48151Z"
						fill="#7A7B7D"
						stroke="#7A7B7D"
						stroke-width="0.375009"
					/>
					<rect
						x="6.23047"
						y="7.23053"
						width="4.15113"
						height="1.31904"
						rx="0.65952"
						transform="rotate(180 6.23047 7.23053)"
						fill="#7A7B7D"
						stroke="#7A7B7D"
						stroke-width="0.375009"
					/>
				</svg>
			</button>
		</div>
	{/if}

	<div class="mb-4 w-full rounded-lg bg-gray-50 p-4 shadow-sm lg:w-[670.5px]">
		<!-- Header -->
		<div class="mb-2 flex justify-between text-sm font-medium text-gray-500">
			<div class="text-[#CFD0D2]"><span class="text-2xl text-[#A3A5A5]">{used} </span>Used</div>
			<div class="text-[#CFD0D2]">
				<span class="text-2xl text-[#A3A5A5]">{remaining}</span>/{total} Remaining
			</div>
		</div>

		<!-- Progress Bar -->
		<div class="mb-4 h-2 w-full rounded-full bg-gray-200">
			<div
				class="h-2 rounded-full bg-blue-500 transition-all duration-300"
				style="width: {usagePercent}%"
			></div>
		</div>

		<div class="mb-2 flex justify-between text-sm font-medium text-gray-500">
			<div class="text-[#646568]">Usage</div>
			<div class="flex items-center justify-between gap-3 text-[#CFD0D2]">
				<div class="flex h-6 w-6 items-center justify-center rounded-full bg-[#EDEDEE]">
					<svg
						width="10"
						height="10"
						viewBox="0 0 10 10"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M8.59375 8.89667C7.98361 9.49216 7.09946 9.62561 6.3418 9.22479L1.2207 6.52948C0.584186 6.19653 0.1875 5.53972 0.1875 4.8205C0.187607 4.14632 0.536505 3.52791 1.10449 3.17889L1.2207 3.11249L6.3418 0.418152C6.63431 0.262149 6.94302 0.187683 7.25195 0.187683C7.74381 0.1878 8.21862 0.380034 8.59277 0.744324H8.59375C9.20457 1.34053 9.35159 2.22447 8.9707 2.98651L8.25488 4.41815C8.13131 4.66531 8.13047 4.96599 8.25488 5.21893L8.9707 6.65448L9.03613 6.79901C9.33163 7.52608 9.1662 8.33768 8.59375 8.89667ZM7.24707 8.4162C7.49314 8.4162 7.71332 8.30156 7.86719 8.15155L7.86816 8.15057C8.09724 7.92875 8.25447 7.54193 8.04297 7.11444L7.32715 5.6828L7.32617 5.68182C7.05722 5.13889 7.05719 4.49818 7.32617 3.95526L7.32715 3.95428L8.04297 2.52264C8.25788 2.09646 8.09851 1.70952 7.86816 1.48651C7.63584 1.26168 7.24868 1.11003 6.82617 1.33221L1.7041 4.02753L1.59668 4.09296C1.36118 4.25957 1.22559 4.52212 1.22559 4.81659C1.22565 5.11086 1.3614 5.37267 1.59668 5.53925L1.7041 5.60468L6.82617 8.30975C6.97464 8.38766 7.11686 8.4162 7.24707 8.4162Z"
							fill="#8E8E90"
							stroke="#8E8E90"
							stroke-width="0.375"
						/>
						<rect
							x="4.73047"
							y="4.2746"
							width="3.0984"
							height="1.05585"
							rx="0.527925"
							fill="#919091"
							stroke="#8E8E90"
							stroke-width="0.375"
						/>
					</svg>
				</div>
				This Week

				<div class="flex h-6 w-6 items-center justify-center rounded-full bg-[#EDEDEE]">
					<svg
						width="10"
						height="10"
						viewBox="0 0 10 10"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M0.773437 0.745117C1.38357 0.149623 2.26773 0.0161795 3.02539 0.416992L8.14648 3.1123C8.783 3.44525 9.17969 4.10206 9.17969 4.82129C9.17958 5.49547 8.83068 6.11387 8.2627 6.46289L8.14648 6.5293L3.02539 9.22363C2.73287 9.37964 2.42417 9.4541 2.11523 9.4541C1.62338 9.45398 1.14857 9.26175 0.774414 8.89746H0.773437C0.162616 8.30125 0.0156019 7.41732 0.396484 6.65527L1.1123 5.22363C1.23588 4.97648 1.23671 4.6758 1.1123 4.42285L0.396484 2.9873L0.331055 2.84277C0.035562 2.1157 0.200989 1.3041 0.773437 0.745117ZM2.12012 1.22559C1.87405 1.22559 1.65387 1.34022 1.5 1.49023L1.49902 1.49121C1.26995 1.71304 1.11272 2.09986 1.32422 2.52734L2.04004 3.95898L2.04102 3.95996C2.30997 4.50289 2.31 5.1436 2.04102 5.68652L2.04004 5.6875L1.32422 7.11914C1.10931 7.54532 1.26868 7.93226 1.49902 8.15527C1.73135 8.3801 2.11851 8.53175 2.54102 8.30957L7.66309 5.61426L7.77051 5.54883C8.00601 5.38222 8.1416 5.11966 8.1416 4.8252C8.14154 4.53092 8.00579 4.26912 7.77051 4.10254L7.66309 4.03711L2.54102 1.33203C2.39254 1.25412 2.25033 1.22559 2.12012 1.22559Z"
							fill="#8E8E90"
							stroke="#8E8E90"
							stroke-width="0.375"
						/>
						<rect
							x="4.63867"
							y="5.36719"
							width="3.0984"
							height="1.05585"
							rx="0.527925"
							transform="rotate(-180 4.63867 5.36719)"
							fill="#919091"
							stroke="#8E8E90"
							stroke-width="0.375"
						/>
					</svg>
				</div>
			</div>
		</div>

		<!-- Usage Card -->
		<div class="my-4 flex items-start gap-3 rounded-lg bg-white md:p-4">
			<!-- Icon -->
			<div class="flex items-center justify-center rounded-full">
				<svg
					width="45"
					height="45"
					viewBox="0 0 45 45"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						opacity="0.4"
						d="M29.8484 3.6875H14.3977C7.68648 3.6875 3.68555 7.68844 3.68555 14.3997V29.8319C3.68555 36.5616 7.68648 40.5625 14.3977 40.5625H29.8299C36.5412 40.5625 40.5421 36.5616 40.5421 29.8503V14.3997C40.5606 7.68844 36.5596 3.6875 29.8484 3.6875Z"
						fill="#E8E8E8"
					/>
					<path
						d="M39.2699 22.5508H32.8537C31.0468 22.5508 29.4427 23.5464 28.6315 25.1689L27.0827 28.2295C26.714 28.967 25.9765 29.428 25.1652 29.428H19.1177C18.5462 29.428 17.7349 29.2989 17.2002 28.2295L15.6515 25.1873C14.8402 23.5833 13.2177 22.5692 11.4293 22.5692H4.97617C4.25711 22.5692 3.68555 23.1408 3.68555 23.8598V29.8705C3.68555 36.5633 7.70492 40.5642 14.4162 40.5642H29.8668C36.1909 40.5642 40.0812 37.098 40.5606 30.9398V23.8414C40.5606 23.1408 39.989 22.5508 39.2699 22.5508Z"
						fill="#E8E8E8"
					/>
					<path
						d="M24.9828 14.382H19.2672C18.5481 14.382 17.9766 13.8105 17.9766 13.0914C17.9766 12.3723 18.5481 11.8008 19.2672 11.8008H24.9828C25.7019 11.8008 26.2734 12.3723 26.2734 13.0914C26.2734 13.8105 25.6834 14.382 24.9828 14.382Z"
						fill="#E8E8E8"
					/>
					<path
						d="M26.4177 19.5266H17.8258C17.1067 19.5266 16.5352 18.955 16.5352 18.2359C16.5352 17.5169 17.1067 16.9453 17.8258 16.9453H26.3992C27.1183 16.9453 27.6898 17.5169 27.6898 18.2359C27.6898 18.955 27.1183 19.5266 26.4177 19.5266Z"
						fill="#E8E8E8"
					/>
				</svg>
			</div>

			<!-- Text -->
			<div class="text-[#A9AAAA]">
				<h3 class="text-sm font-semibold text-[#A9AAAA]">No Usage This Week</h3>
				<p class="text-xs">You haven’t sent anything this week that counts towards your quota.</p>
			</div>
		</div>
	</div>

	<svg width="121" height="10" viewBox="0 0 121 10" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M1.19531 1.51133C1.19531 1.51133 6.06949 7.95241 10.5703 8.26133C15.5571 8.60361 16.4494 1.34886 21.4453 1.51133C26.195 1.66579 26.8254 8.52493 31.5703 8.26133C35.957 8.01763 36.1801 1.67805 40.5703 1.51133C45.198 1.33559 45.6901 8.3469 50.3203 8.26133C54.831 8.17797 55.1945 1.82025 59.6953 1.51133C64.6821 1.16905 65.5911 8.70067 70.5703 8.26133C74.9467 7.87518 75.1801 1.67805 79.5703 1.51133C84.198 1.33559 84.6893 8.26133 89.3203 8.26133C93.9514 8.26133 94.44 1.59256 99.0703 1.51133C103.822 1.42797 104.483 8.87392 109.195 8.26133C112.915 7.77782 113.008 2.95049 116.695 2.26133C118.135 1.99226 120.445 2.26133 120.445 2.26133"
			stroke="#E2E3E5"
			stroke-width="3"
		/>
	</svg>

	<p class="my-4 text-[#999A9C]">
		Only event invites and newsletters sent through Rondwell are subject to the quota. You will
		always get:
	</p>

	<div class="mb-4 text-[#999A9C]">
		<div class="flex items-center gap-1">
			<svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M4.21315 9C3.85458 9 3.49602 8.83245 3.22709 8.56915L0.403387 5.55319C-0.134462 4.97872 -0.134462 4.02128 0.403387 3.44681C0.941235 2.87234 1.83765 2.87234 2.3755 3.44681L4.21315 5.40958L8.87451 0.430851C9.41235 -0.143617 10.3088 -0.143617 10.8466 0.430851C11.3845 1.00532 11.3845 1.96276 10.8466 2.53723L5.19921 8.56915C4.93028 8.85638 4.57171 9 4.21315 9Z"
					fill="#646568"
				/>
			</svg>
			<p>Unlimited number of guests per event</p>
		</div>
		<div class="flex items-center gap-1">
			<svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M4.21315 9C3.85458 9 3.49602 8.83245 3.22709 8.56915L0.403387 5.55319C-0.134462 4.97872 -0.134462 4.02128 0.403387 3.44681C0.941235 2.87234 1.83765 2.87234 2.3755 3.44681L4.21315 5.40958L8.87451 0.430851C9.41235 -0.143617 10.3088 -0.143617 10.8466 0.430851C11.3845 1.00532 11.3845 1.96276 10.8466 2.53723L5.19921 8.56915C4.93028 8.85638 4.57171 9 4.21315 9Z"
					fill="#646568"
				/>
			</svg>
			<p>Unlimited number of guests per event</p>
		</div>
	</div>
	<p class="mb-4 text-[#999A9C]">
		Scheduled newsletters count towards the quota of the week when it is sent.
	</p>

	<svg width="121" height="10" viewBox="0 0 121 10" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M1.19531 1.51133C1.19531 1.51133 6.06949 7.95241 10.5703 8.26133C15.5571 8.60361 16.4494 1.34886 21.4453 1.51133C26.195 1.66579 26.8254 8.52493 31.5703 8.26133C35.957 8.01763 36.1801 1.67805 40.5703 1.51133C45.198 1.33559 45.6901 8.3469 50.3203 8.26133C54.831 8.17797 55.1945 1.82025 59.6953 1.51133C64.6821 1.16905 65.5911 8.70067 70.5703 8.26133C74.9467 7.87518 75.1801 1.67805 79.5703 1.51133C84.198 1.33559 84.6893 8.26133 89.3203 8.26133C93.9514 8.26133 94.44 1.59256 99.0703 1.51133C103.822 1.42797 104.483 8.87392 109.195 8.26133C112.915 7.77782 113.008 2.95049 116.695 2.26133C118.135 1.99226 120.445 2.26133 120.445 2.26133"
			stroke="#E2E3E5"
			stroke-width="3"
		/>
	</svg>

	<div class="my-4 mb-4 flex flex-col justify-between gap-2">
		<h2 class="text-lg font-semibold">Need more sends?</h2>
		<p class="text-[#8C8F93]">Your calendar currently has 15 sends per week.</p>
	</div>

	<!-- Verify Calendar page -->
	<div
		class="mb-1 mt-4 w-full flex-col items-center justify-start overflow-hidden rounded-md bg-[#FFFFFF] px-4 py-3 sm:flex sm:flex-row sm:justify-between lg:w-[670.5px]"
	>
		<div class="mb-4 flex items-center gap-2">
			<img src="/verify-white.svg" alt="add people" class="h-4 w-4 text-[#FFFFFF]" />
			<div class="flex flex-col">
				<h2 class="text-[#131517]">Verify Calendar</h2>
				<p class="text-[#B6B7B7]">
					Verify to increase your weekly limit to 500
				</p>
			</div>
		</div>
		<button
			class="flex w-22.5 items-center justify-center gap-1 rounded-md bg-[#131517] px-1 py-1 text-sm text-[#FAFAFB]"
		>
			Verify
		</button>
	</div>

	<div
		class="mb-1 lg:mb-14 mt-2 w-full flex-col items-center justify-start overflow-hidden rounded-md bg-[#FFFFFF] px-4 py-3 sm:flex sm:flex-row sm:justify-between lg:w-[670.5px]"
	>
		<div class="mb-4 flex items-center gap-2">
			<img src="/verify-white.svg" alt="add people" class="h-4 w-4 text-[#FFFFFF]" />
			<div class="flex flex-col">
				<h2 class="text-[#131517]">Upgrade to Rondwell Plus</h2>
				<p class="text-[#B6B7B7]">
					Get 5,000 to 100,000 sends per week
				</p>
			</div>
		</div>
		<button
			class="flex w-22.5 items-center justify-center gap-1 rounded-md bg-[#131517] px-1 py-1 text-sm text-[#FAFAFB]"
		>
			Upgrade
		</button>
	</div>
</section>
