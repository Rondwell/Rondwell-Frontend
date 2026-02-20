<script lang="ts">
	import { goto } from '$app/navigation';

	let drafts = [];
	let published = [];
	let isCalendarVerified = false;
	$: draftCount = drafts.length;
	$: peopleCount = published.length;
</script>

<section class="p-4 ">
	<!-- Header -->

	<div class="mb-6 flex flex-col gap-4 justify-between sm:flex-row md:mb-6">
		<div class="flex gap-2 items-center md:justify-between">
			<img src="/tech-icon.svg" alt="icon" class="h-7 w-7 hidden sm:block" />
			<h1 class="text-xl lg:text-2xl font-bold sm:font-medium">Business Collection</h1>
		</div>
		<button
			class="flex items-center gap-2 w-fit rounded-md bg-[#EBECED] px-3 whitespace-nowrap md:text-sm text-[#5D646F]"
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

	<!-- Drafts -->

	<div class="py-4">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="align-center flex justify-center gap-2 text-lg font-semibold">
				<span> Drafts </span>
				<div class="relative inline-flex items-center justify-center">
					<img src="/circle.svg" alt="" class="h-6 w-6" />
					<span class="absolute text-xs">{draftCount}</span>
				</div>
			</h2>
			<button class="flex gap-1 rounded-md bg-[#EBECED] px-3 py-1 text-sm text-[#616265]">
				<svg
					width="18"
					height="18"
					viewBox="0 0 18 18"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M8.47168 0.96875C8.6804 0.760025 9.00599 0.690052 9.28711 0.807617L9.28809 0.806641L9.29004 0.808594H9.29297L9.29199 0.80957C9.57544 0.923019 9.75195 1.20299 9.75195 1.49902V5.99902C9.75195 6.41009 9.41302 6.74902 9.00195 6.74902C8.59095 6.74895 8.25196 6.41004 8.25195 5.99902V3.30957L8.03223 3.5293C7.74149 3.81994 7.26238 3.82 6.97168 3.5293C6.68098 3.23859 6.68104 2.75949 6.97168 2.46875L8.47168 0.96875Z"
						fill="#616265"
						stroke="#616265"
						stroke-width="0.375009"
					/>
					<path
						d="M8.47168 0.967773C8.76238 0.677073 9.24149 0.677135 9.53223 0.967773L11.0322 2.46777C11.323 2.7585 11.323 3.23759 11.0322 3.52832C10.8827 3.67784 10.6915 3.74805 10.502 3.74805C10.3124 3.74801 10.1212 3.67781 9.97168 3.52832L8.47168 2.02832C8.18104 1.73758 8.18098 1.25847 8.47168 0.967773Z"
						fill="#616265"
						stroke="#616265"
						stroke-width="0.375009"
					/>
					<path
						d="M12.7656 8.25018C14.5754 8.25024 15.5437 8.73138 16.0391 9.48944C16.5206 10.2264 16.5156 11.1784 16.5156 12.0002V12.7512C16.508 14.2128 16.1342 15.3464 15.3652 16.1135C14.5961 16.8806 13.462 17.2502 12 17.2502H6C3.81502 17.2502 2.65843 16.6703 2.06934 15.7687C1.49404 14.8883 1.5 13.7483 1.5 12.7502V12.0002C1.5 11.1785 1.49425 10.2264 1.97559 9.48944C2.47092 8.73132 3.44 8.2502 5.25 8.25018C5.71165 8.25018 6.04231 8.30601 6.32227 8.41425C6.53087 8.49493 6.70484 8.60243 6.87695 8.72382L7.0498 8.84979L7.06055 8.8576L7.07227 8.86932C7.07413 8.87081 7.07684 8.87269 7.08008 8.87518C7.08296 8.8774 7.0868 8.88081 7.09082 8.88397C7.10483 8.89498 7.12545 8.91399 7.14746 8.93964L7.14941 8.93866L7.91406 9.74921C8.48511 10.3532 9.53058 10.3533 10.1016 9.74921L10.8662 8.93866L10.8701 8.93475L10.9648 8.84979C11.1984 8.67278 11.4156 8.51804 11.6943 8.41132C11.9744 8.30411 12.3049 8.25018 12.7656 8.25018ZM12.75 9.75018C12.4843 9.7502 12.3472 9.76768 12.2422 9.80389C12.1407 9.83891 12.0557 9.89543 11.9014 10.0099L11.1846 10.7717H11.1836C10.6085 11.3786 9.83198 11.715 9 11.715C8.21999 11.715 7.48893 11.4192 6.92676 10.882L6.81641 10.7717L6.10059 10.0119C5.9449 9.89634 5.85978 9.83905 5.75781 9.80389C5.65279 9.76771 5.51576 9.75018 5.25 9.75018C4.0302 9.75019 3.51092 9.94691 3.2666 10.2678C3.14277 10.4305 3.07326 10.6455 3.03711 10.9367C3.00076 11.2297 3 11.5784 3 12.0002V12.7502C3 13.2675 3.0008 13.7109 3.04883 14.092C3.09664 14.4712 3.18984 14.7694 3.3623 15.0031C3.7022 15.4637 4.4111 15.7502 6 15.7502H12C13.0961 15.7502 13.8334 15.5163 14.2998 15.05C14.7662 14.5836 15 13.8463 15 12.7502V12.0002C15 11.5784 15.0002 11.2297 14.9639 10.9367C14.9277 10.6456 14.8581 10.4305 14.7344 10.2678C14.4901 9.94682 13.97 9.75018 12.75 9.75018Z"
						fill="#616265"
						stroke="#616265"
						stroke-width="0.375009"
					/>
					<path
						d="M5.92969 3.79102C6.33747 3.74311 6.70958 4.0554 6.74902 4.46875L6.75293 4.54492C6.75136 4.92397 6.46254 5.25073 6.07031 5.28809H6.06934C5.2147 5.36546 4.86343 5.5725 4.69336 5.87598C4.60314 6.03708 4.55249 6.24434 4.52637 6.51758C4.50021 6.79158 4.5 7.11476 4.5 7.50195V9.00195C4.49989 9.41293 4.161 9.75195 3.75 9.75195C3.33901 9.75195 3.00011 9.41292 3 9.00195V7.50195C3 6.78491 2.99651 5.92044 3.36621 5.20605C3.74801 4.4684 4.50447 3.92562 5.92969 3.79004V3.79102Z"
						fill="#616265"
						stroke="#616265"
						stroke-width="0.375009"
					/>
					<path
						d="M12.085 3.79004L12.084 3.79102C13.5072 3.9271 14.263 4.46895 14.6445 5.20605C15.0142 5.92043 15.0107 6.78493 15.0107 7.50195V9.00586C15.0008 9.41244 14.6649 9.75195 14.2529 9.75195C13.842 9.75188 13.503 9.41288 13.5029 9.00195V7.50195C13.5029 7.11477 13.5027 6.79171 13.4766 6.51758C13.4505 6.24423 13.3999 6.03666 13.3096 5.875C13.1605 5.60835 12.8725 5.41568 12.2305 5.31738L11.9326 5.28125C11.5206 5.24105 11.2218 4.87001 11.2617 4.46094C11.3014 4.05448 11.6602 3.73962 12.085 3.79004Z"
						fill="#616265"
						stroke="#616265"
						stroke-width="0.375009"
					/>
				</svg>
				Create
			</button>
		</div>

		<p class="text-sm text-[#737577]">
			Manage your subscribers and events attendees. <span class="inline-block sm:inline"
				>Events guests are automatically added to this list</span
			>
		</p>
	</div>

	{#if !isCalendarVerified}
		<div
			class="mt-4 mb-8 flex-col items-center justify-start rounded-md bg-[#F0E8D7] px-4 py-3 sm:flex sm:flex-row sm:justify-between"
		>
			<div class="mb-4 flex items-center gap-2">
				<img src="/verify.svg" alt="add people" class="h-4 w-4" />
				<div class="flex flex-col">
					<h2 class="text-[#D69712]">Please verify your calendar.</h2>
					<p class="text-[#737577]">Share information about your calendar to send newsletters.</p>
				</div>
			</div>
			<button
				on:click={() => goto('newsletter/verify')}
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

	<!-- Published -->

	<div class="mt-4 border-t py-4">
		<h2 class="item-center flex gap-2 text-lg font-semibold">
			<span> Published </span>
			<div class="relative inline-flex items-center justify-center">
				<img src="/circle.svg" alt="" class="h-6 w-6" />
				<span class="absolute text-xs">{peopleCount}</span>
			</div>
		</h2>

		{#if published.length === 0}
			<div class="mt-4 flex flex-col items-center justify-center gap-4">
				<img src="/noEvent.svg" alt="No Events" class="ml-4 h-60 w-60" />
				<h2 class="text-lg font-semibold text-[#646568]">No Subscribers, yet</h2>
				<p class="max-w-md text-center text-[#A2ACB2]">
					When people subscribe to your <span class="inline-block sm:inline"
						>calendar, they will appear here.</span
					>
				</p>
			</div>
		{:else}
			<!-- <div class="flex flex-col rounded-md bg-[#FDFDFD] px-3">
      {#each published as item}
        <div class="my-0.5 flex items-center justify-between rounded-md border-b py-3 last:border-b-0">
          <div class="flex items-start gap-2">
            <img src="/face-1.svg" alt="profile icon" class="h-6 w-6" />

            <div class="flex flex-col items-start gap-1 lg:flex-row lg:items-center">
              <span class="flex items-center gap-1">
                {#if !item?.name}
                  <p class="font-medium text-gray-500">Anonymous</p>
                {:else}
                  <p class="font-medium">{item.name}</p>
                  <span class="h-2 w-2 rounded-full bg-[#EAAB26]"></span>
                {/if}
              </span>

              <p class="text-xs text-gray-500 md:text-sm">
                {item?.email}
              </p>
              </div>    
            </div>
        </div>
    </div> -->
		{/if}
	</div>
</section>
