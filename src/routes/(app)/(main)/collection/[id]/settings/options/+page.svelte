<script lang="ts">
	import { options } from '@carbon/charts';

	let enabled = false;
	let toggler = false;
</script>

<div class="mb-6">
	<div class="hidden sm:justify-between lg-block md:mb-10 md:flex">
		<div class="flex items-center justify-between">
			<img src="/tech-icon.svg" alt="icon" class="h-7 w-7" />
			<h1 class="ml-2 lg:text-2xl text-md">Business Collection</h1>
		</div>
		<button
			class="flex items-center gap-2 w-fit rounded-md bg-[#DCE4EE] px-3 whitespace-nowrap md:text-sm text-[#5D646F]"
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
	<div class="mb-3 flex items-center justify-between">
		<h2 class="text-lg font-semibold">Ticket Sales</h2>
	</div>
	<p class="text-[#8C8F93]">Default settings for new events created on this calendar.</p>

	<div class="mt-6 rounded-md bg-[#FFFFFF] p-4">
		<div class="flex justify-between border-b border-gray-300 pt-6">
			<div class="flex flex-col">
				<span class="text-[#131517]">Event Visibility</span>
				<span class="text-[#C0C2C2]">Whether events are shown on the calendar page.</span>
			</div>

			<div class="mb-4 flex items-center justify-between">
				<button
					class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
				>
					<svg
						width="18"
						height="18"
						viewBox="0 0 18 18"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M16.9875 13.5983C16.9125 13.2983 16.6125 13.1108 16.3125 13.1858C16.0125 13.2608 15.825 13.5608 15.8925 13.8608C15.9225 13.9883 15.9375 14.1158 15.9375 14.2508C15.9375 15.1808 15.18 15.9383 14.25 15.9383C13.32 15.9383 12.5625 15.1808 12.5625 14.2508C12.5625 13.4258 13.155 12.7433 13.9425 12.5933C13.8675 12.7658 13.875 12.9758 13.995 13.1408C14.1075 13.2908 14.28 13.3733 14.4525 13.3733C14.565 13.3733 14.685 13.3358 14.7825 13.2683L15.66 12.6308C15.6675 12.6233 15.6675 12.6158 15.675 12.6158C15.6825 12.6083 15.69 12.6083 15.6975 12.6008C15.72 12.5783 15.735 12.5558 15.75 12.5258C15.7725 12.4958 15.8025 12.4733 15.8175 12.4358C15.8325 12.4058 15.84 12.3683 15.855 12.3383C15.8625 12.3008 15.8775 12.2708 15.885 12.2333C15.8925 12.1958 15.885 12.1658 15.8775 12.1283C15.8775 12.0908 15.8775 12.0533 15.8625 12.0158C15.855 11.9783 15.8325 11.9483 15.8175 11.9183C15.8025 11.8883 15.795 11.8583 15.78 11.8358C15.7725 11.8283 15.765 11.8283 15.7575 11.8208C15.75 11.8133 15.75 11.8058 15.7425 11.7983L14.9925 10.9358C14.79 10.7033 14.43 10.6733 14.1975 10.8833C14.0325 11.0333 13.9725 11.2508 14.0325 11.4533C12.585 11.5658 11.4375 12.7658 11.4375 14.2433C11.4375 15.7958 12.6975 17.0558 14.25 17.0558C15.8025 17.0558 17.0625 15.7958 17.0625 14.2433C17.0625 14.0333 17.04 13.8083 16.9875 13.5983Z"
							fill="#616265"
						/>
						<path
							opacity="0.4"
							d="M1.5228 10.9727C1.5228 10.9952 1.50781 11.0252 1.50781 11.0477C2.19781 12.4277 3.3228 13.5601 4.7028 14.2426C4.7253 14.2426 4.7553 14.2277 4.7778 14.2277C4.5228 13.3577 4.3278 12.4651 4.1853 11.5726C3.2853 11.4226 2.3928 11.2277 1.5228 10.9727Z"
							fill="#616265"
						/>
						<path
							opacity="0.4"
							d="M14.3011 4.82062C13.5961 3.34312 12.4036 2.15063 10.9336 1.45312C11.2036 2.34563 11.4286 3.26063 11.5786 4.17563C12.4936 4.32563 13.4086 4.54312 14.3011 4.82062Z"
							fill="#616265"
						/>
						<path
							opacity="0.4"
							d="M1.44922 4.82313C2.34922 4.55313 3.26423 4.32814 4.17923 4.17814C4.32923 3.28564 4.51671 2.40064 4.77171 1.53064C4.74921 1.53064 4.71923 1.51562 4.69673 1.51562C3.28673 2.21313 2.13922 3.39063 1.44922 4.82313Z"
							fill="#616265"
						/>
						<path
							opacity="0.4"
							d="M10.3667 4.01968C10.1867 3.04468 9.96173 2.0697 9.63923 1.12469C9.62423 1.07219 9.62423 1.0272 9.61673 0.967201C9.06173 0.832201 8.47673 0.742188 7.87672 0.742188C7.26922 0.742188 6.69173 0.824701 6.12923 0.967201C6.12173 1.0197 6.12922 1.06469 6.11422 1.12469C5.79922 2.0697 5.56672 3.04468 5.38672 4.01968C7.04422 3.83968 8.70923 3.83968 10.3667 4.01968Z"
							fill="#616265"
						/>
						<path
							opacity="0.4"
							d="M4.01968 5.38672C3.03718 5.56672 2.0697 5.79172 1.12469 6.11422C1.07219 6.12922 1.0272 6.12922 0.967201 6.13672C0.832201 6.69172 0.742188 7.27672 0.742188 7.87672C0.742188 8.48423 0.824701 9.06172 0.967201 9.62422C1.0197 9.63172 1.06469 9.62423 1.12469 9.63923C2.0697 9.95423 3.03718 10.1867 4.01968 10.3667C3.83968 8.70923 3.83968 7.04422 4.01968 5.38672Z"
							fill="#616265"
						/>
						<path
							opacity="0.4"
							d="M14.7752 6.13672C14.7227 6.13672 14.6776 6.12922 14.6176 6.11422C13.6726 5.79922 12.6977 5.56672 11.7227 5.38672C11.9102 7.04422 11.9102 8.70922 11.7227 10.3592C12.6977 10.1792 13.6726 9.95422 14.6176 9.63172C14.6701 9.61672 14.7152 9.62423 14.7752 9.61673C14.9102 9.05423 15.0002 8.47672 15.0002 7.86922C15.0002 7.27672 14.9177 6.69922 14.7752 6.13672Z"
							fill="#616265"
						/>
						<path
							opacity="0.4"
							d="M5.38672 11.7305C5.56672 12.713 5.79172 13.6805 6.11422 14.6255C6.12922 14.678 6.12173 14.723 6.12923 14.783C6.69173 14.918 7.26922 15.008 7.87672 15.008C8.47673 15.008 9.06173 14.9255 9.61673 14.783C9.62423 14.7305 9.62423 14.6855 9.63923 14.6255C9.95423 13.6805 10.1867 12.713 10.3667 11.7305C9.54173 11.8205 8.70923 11.888 7.87672 11.888C7.04422 11.8805 6.21172 11.8205 5.38672 11.7305Z"
							fill="#616265"
						/>
						<path
							opacity="0.4"
							d="M5.21172 5.21172C4.98672 6.98172 4.98672 8.76671 5.21172 10.5442C6.98172 10.7692 8.76671 10.7692 10.5442 10.5442C10.7692 8.77421 10.7692 6.98922 10.5442 5.21172C8.76671 4.98672 6.98172 4.98672 5.21172 5.21172Z"
							fill="#616265"
						/>
					</svg>

					Public
					<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
				</button>
			</div>
		</div>
		<div class="item-center flex justify-between border-b border-gray-300 pb-3 pt-6">
			<div class="flex flex-col">
				<span class="text-[#131517]">Public Guest List</span>
				<span class="text-[#C0C2C2]">Whether to show guest list on the event pages.</span>
			</div>

			<div
				class="w-10.5 h-5.5 flex cursor-pointer items-center rounded-full p-1 transition-colors duration-200"
				class:bg-gray-300={!enabled}
				class:bg-black={enabled}
				on:click={() => (enabled = !enabled)}
			>
				<div
					class="h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200"
					class:translate-x-4={enabled}
				></div>
			</div>
		</div>

		<div class="item-center item-center flex justify-between border-b border-gray-300 pb-3 pt-6">
			<div class="flex flex-col">
				<span class="text-[#131517]">Collect Feedback</span>
				<span class="text-[#C0C2C2]">Email guests after the event to collect feedback.</span>
			</div>

			<div
				class="w-10.5 h-5.5 flex cursor-pointer items-center rounded-full p-1 transition-colors duration-200"
				class:bg-gray-300={!toggler}
				class:bg-black={toggler}
				on:click={() => (toggler = !toggler)}
			>
				<div
					class="h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200"
					class:translate-x-4={toggler}
				></div>
			</div>
		</div>
	</div>

	<p class="border-b pb-8 pt-4 text-xs text-[#7F8082]">
		Changing these defaults does not affect existing events. You can always change these settings
		for each individual event.
	</p>

	<div class="border-b">
		<div class="py-5">
			<h1 class="my-2 text-lg">API Keys</h1>
			<label class="text-[#84857A]">
				Create API Keys to send data to Zapier or use <span class="text-[#F3358B]"
					>Rondwell API</span
				>
			</label>
			<div
				class="my-4 flex justify-between gap-2 rounded-md bg-[#EBECED] px-5 py-3 sm:mb-0 sm:flex-row sm:items-center"
			>
				<div class="text-xs text-[#7A7C7E] sm:text-sm">
					Upgrade to Rondwell Plus <br class="block sm:hidden" /> to create API keys.
				</div>
				<button
					class="flex w-fit items-center justify-center gap-1 rounded-md bg-[#E3E4E5] px-3 py-2 text-xs font-medium text-[#7A7C7E] transition-colors hover:bg-gray-200 sm:justify-start sm:text-sm"
				>
					Learn More
					<svg
						width="14"
						height="14"
						viewBox="0 0 14 14"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M12.1191 4.23145H12.1201C13.051 4.67637 13.6415 5.55992 13.6416 6.53906C13.6416 7.51825 13.051 8.40166 12.1201 8.84668L4.3457 12.585L4.34473 12.584C3.91647 12.7923 3.4663 12.8906 3.0166 12.8906C2.30105 12.8905 1.606 12.6359 1.05469 12.1455V12.1445C0.15368 11.3412 -0.0686642 10.1438 0.498047 9.1084L1.58496 7.12305C1.78188 6.76301 1.78213 6.32842 1.58398 5.96094V5.95996L0.498047 3.96973C-0.0684195 2.93442 0.153752 1.73684 1.05469 0.933594C1.951 0.13468 3.24035 -0.0405148 4.34668 0.494141H4.3457L12.1191 4.23145ZM3.02344 1.48145C2.66491 1.48152 2.34492 1.61538 2.10547 1.7959L2.00781 1.87598C1.63799 2.20291 1.39036 2.76718 1.72656 3.38672L2.8125 5.37109L2.88281 5.51074C3.21041 6.21541 3.18669 7.0229 2.8125 7.71289V7.71387L1.72559 9.69922V9.7002C1.38475 10.3179 1.63673 10.8809 2.00781 11.209C2.38069 11.5385 3.0187 11.7714 3.71387 11.4375L11.4883 7.7002C11.9795 7.46487 12.2606 7.03043 12.2607 6.5459C12.2607 6.06122 11.9797 5.62601 11.4883 5.39063L3.71387 1.64063C3.4727 1.52502 3.23872 1.48145 3.02344 1.48145Z"
							fill="#7A7B7D"
							stroke="#7A7B7D"
							stroke-width="0.375"
						/>
						<rect
							x="6.76855"
							y="7.22656"
							width="4.5086"
							height="1.31901"
							rx="0.659503"
							transform="rotate(180 6.76855 7.22656)"
							fill="#7A7B7D"
							stroke="#7A7B7D"
							stroke-width="0.375"
						/>
					</svg>
				</button>
			</div>
			<button
				class="mb-4 mt-6 flex w-fit items-center justify-center gap-1 rounded-md bg-[#949597] px-3 py-2 text-xs font-medium text-[#7A7C7E] text-[#FFFFFF] transition-colors sm:justify-start sm:text-sm"
			>
				<svg
					width="18"
					height="18"
					viewBox="0 0 18 18"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M14.8405 11.1958C13.2955 12.7333 11.083 13.2058 9.14054 12.5983L5.60804 16.1233C5.35304 16.3858 4.85054 16.5433 4.49054 16.4908L2.85553 16.2658C2.31553 16.1908 1.81303 15.6808 1.73053 15.1408L1.50553 13.5058C1.45303 13.1458 1.62553 12.6433 1.87303 12.3883L5.39804 8.86328C4.79804 6.91328 5.26304 4.70078 6.80804 3.16328C9.02054 0.950781 12.613 0.950781 14.833 3.16328C17.053 5.37578 17.053 8.98328 14.8405 11.1958Z"
						stroke="white"
						stroke-width="1.5"
						stroke-miterlimit="10"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						opacity="0.4"
						d="M5.16797 13.1172L6.89297 14.8422"
						stroke="white"
						stroke-width="1.5"
						stroke-miterlimit="10"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						opacity="0.4"
						d="M10.875 8.25C11.4963 8.25 12 7.74632 12 7.125C12 6.50368 11.4963 6 10.875 6C10.2537 6 9.75 6.50368 9.75 7.125C9.75 7.74632 10.2537 8.25 10.875 8.25Z"
						stroke="white"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>

				Create API Key
			</button>
		</div>
	</div>

	<div class="border-b">
		<div class="py-5">
			<h1 class="my-2 text-lg">Tracking</h1>
			<label class="text-[#84857A]">
				Track event registrations and conversions from Google or Facebook ads.
			</label>
			<div
				class="my-4 flex flex-col justify-between gap-2 rounded-md bg-[#EBECED] px-5 py-3 sm:mb-0 sm:flex-row sm:items-center"
			>
				<div class="text-xs text-[#7A7C7E] sm:text-sm">
					Upgrade to Rondwell Plus to integrate with Google or Facebook ads. 
				</div>
				<button
					class="flex w-fit items-center justify-center gap-1 rounded-md bg-[#E3E4E5] px-3 py-2 text-xs font-medium text-[#7A7C7E] transition-colors hover:bg-gray-200 sm:justify-start sm:text-sm"
				>
					Learn More
					<svg
						width="14"
						height="14"
						viewBox="0 0 14 14"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M12.1191 4.23145H12.1201C13.051 4.67637 13.6415 5.55992 13.6416 6.53906C13.6416 7.51825 13.051 8.40166 12.1201 8.84668L4.3457 12.585L4.34473 12.584C3.91647 12.7923 3.4663 12.8906 3.0166 12.8906C2.30105 12.8905 1.606 12.6359 1.05469 12.1455V12.1445C0.15368 11.3412 -0.0686642 10.1438 0.498047 9.1084L1.58496 7.12305C1.78188 6.76301 1.78213 6.32842 1.58398 5.96094V5.95996L0.498047 3.96973C-0.0684195 2.93442 0.153752 1.73684 1.05469 0.933594C1.951 0.13468 3.24035 -0.0405148 4.34668 0.494141H4.3457L12.1191 4.23145ZM3.02344 1.48145C2.66491 1.48152 2.34492 1.61538 2.10547 1.7959L2.00781 1.87598C1.63799 2.20291 1.39036 2.76718 1.72656 3.38672L2.8125 5.37109L2.88281 5.51074C3.21041 6.21541 3.18669 7.0229 2.8125 7.71289V7.71387L1.72559 9.69922V9.7002C1.38475 10.3179 1.63673 10.8809 2.00781 11.209C2.38069 11.5385 3.0187 11.7714 3.71387 11.4375L11.4883 7.7002C11.9795 7.46487 12.2606 7.03043 12.2607 6.5459C12.2607 6.06122 11.9797 5.62601 11.4883 5.39063L3.71387 1.64063C3.4727 1.52502 3.23872 1.48145 3.02344 1.48145Z"
							fill="#7A7B7D"
							stroke="#7A7B7D"
							stroke-width="0.375"
						/>
						<rect
							x="6.76855"
							y="7.22656"
							width="4.5086"
							height="1.31901"
							rx="0.659503"
							transform="rotate(180 6.76855 7.22656)"
							fill="#7A7B7D"
							stroke="#7A7B7D"
							stroke-width="0.375"
						/>
					</svg>
				</button>
			</div>
		</div>
	</div>

	<div class="border-b">
		<div class="py-5">
			<h1 class="my-2 text-lg">Archive Collection</h1>
			<div class="flex flex-col">
				<label class="text-[#8C8F93]">
					Archive this calendar to stop accepting subscriptions or events submissions.
				</label>
				<label class="text-[#8C8F93]">
					We will indicate on the calendar page that it has been archived.
				</label>
			</div>
			
			<button
				class="mb-4 mt-6 flex w-fit items-center justify-center gap-1 rounded-md bg-[#333537] px-3 py-2 text-xs font-medium text-[#7A7C7E] text-[#FFFFFF] transition-colors sm:justify-start sm:text-sm"
			>
				<svg
					width="24"
					height="21"
					viewBox="0 0 24 21"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M8.72709 18.5625H14.5451C19.3934 18.5625 21.3327 16.875 21.3327 12.6563V7.59375C21.3327 3.375 19.3934 1.6875 14.5451 1.6875H8.72709C3.87878 1.6875 1.93945 3.375 1.93945 7.59375V12.6563C1.93945 16.875 3.87878 18.5625 8.72709 18.5625Z"
						stroke="white"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<g opacity="0.4">
						<path
							d="M17.4563 6.53906V12.2344C17.4563 11.3063 16.5836 10.5469 15.5169 10.5469H7.75964C6.69301 10.5469 5.82031 11.3063 5.82031 12.2344V6.53906C5.82031 5.61094 6.69301 4.85156 7.75964 4.85156H15.5169C16.5836 4.85156 17.4563 5.61094 17.4563 6.53906Z"
							stroke="white"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M18.4247 13.2891H17.4551"
							stroke="white"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M5.8183 13.2891H4.84863"
							stroke="white"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M17.4563 11.8125V9.28125C17.4563 8.35313 16.5836 7.59375 15.5169 7.59375H7.75964C6.69301 7.59375 5.82031 8.35313 5.82031 9.28125V11.8125"
							stroke="white"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M17.4563 12.2344V13.2891H14.0624C14.0624 14.4534 12.9764 15.3984 11.6383 15.3984C10.3002 15.3984 9.21413 14.4534 9.21413 13.2891H5.82031V12.2344C5.82031 11.3063 6.69301 10.5469 7.75964 10.5469H15.5169C16.5836 10.5469 17.4563 11.3063 17.4563 12.2344Z"
							stroke="white"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</g>
				</svg>

				Archive Collection
			</button>
		</div>
	</div>

	<div class="border-b">
		<div class="py-5">
			<h1 class="my-2 text-lg">Delete Calendar</h1>
			<div class="flex flex-col">
				<label class="text-[#8C8F93]">
				Permanently delete this calendar.  This operation cannot be undone. 
				</label>
				<label class="text-[#8C8F93]">
				Subscribers won't be notified.
				</label>
			</div>
			
			<button
				class="mb-4 mt-6 flex w-fit items-center justify-center gap-1 rounded-md bg-[#ED2B32] pl-5 pr-8 py-2 text-xs font-medium  text-[#FFFFFF] transition-colors sm:justify-start sm:text-sm"
			>
				<svg
					width="25"
					height="22"
					viewBox="0 0 25 22"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<rect
						x="6.7334"
						y="11.8906"
						width="11.476"
						height="7.35294"
						fill="#F5C0C2"
						stroke="white"
						stroke-width="0.75"
					/>
					<path
						d="M21.825 5.41406C18.3644 5.115 14.883 4.96094 11.4121 4.96094C9.35441 4.96094 7.29677 5.05156 5.23913 5.23281L3.11914 5.41406"
						stroke="white"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						opacity="0.34"
						d="M8.83984 4.50406L9.06847 3.31688C9.23474 2.45594 9.35945 1.8125 11.1157 1.8125H13.8385C15.5947 1.8125 15.7298 2.49219 15.8857 3.32594L16.1143 4.50406"
						stroke="white"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M19.5868 8.28125L18.9113 17.4072C18.797 18.83 18.7035 19.9356 15.8041 19.9356H9.13234C6.23294 19.9356 6.13941 18.83 6.0251 17.4072L5.34961 8.28125"
						stroke="white"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						opacity="0.34"
						d="M10.7334 14.9531H14.194"
						stroke="white"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						opacity="0.34"
						d="M9.87402 11.3281H15.0701"
						stroke="white"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>

				Delete Collection
			</button>
		</div>
	</div>
</div>
