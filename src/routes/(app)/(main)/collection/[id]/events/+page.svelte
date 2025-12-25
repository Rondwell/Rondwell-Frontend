<script lang="ts">
	let activeTab: 'Upcoming' | 'Past' = 'Upcoming';

	type EventItem = {
		id: number;
		title: string;
		date: string;
		day: string;
		time: string;
		location: string;
		guests: number;
		image: string;
	};

	let events: EventItem[] = [
		{
			id: 1,
			title: 'Megaexe Party',
			date: 'Sep 25',
			day: 'Wednesday',
			time: '11:00 PM',
			location: 'To be announced',
			guests: 2,
			image: '/Megaexe-party.png'
		}
	];

	//Testing Adding New Event UI
	function addEvent() {
		events = [
			...events,
			{
				id: events.length + 1,
				title: `New Event ${events.length + 1}`,
				date: 'Oct 1',
				day: 'Monday',
				time: '9:00 PM',
				location: 'To be announced',
				guests: 0,
				image: '/Megaexe-party.png'
			}
		];
	}
</script>

<!-- Event Header Section -->
<div class="p-6">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="flex items-center gap-2 text-xl font-semibold">
			Events
			<button
				on:click={addEvent}
				class="rounded bg-[#EBECED] p-1 transition-colors duration-500 hover:bg-[#E8E8E8] hover:text-[#5555658]"
			>
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<rect width="23.4774" height="23.4774" rx="11.7387" fill="#EBECED" />
					<g opacity="0.4">
						<path
							d="M6.80078 11.7383H16.686"
							stroke="#616265"
							stroke-width="2.25006"
							stroke-linecap="round"
						/>
						<path
							d="M11.7422 16.6821V6.79688"
							stroke="#616265"
							stroke-width="2.25006"
							stroke-linecap="round"
						/>
					</g>
					<g opacity="0.4">
						<path
							d="M6.80078 11.7383H16.686"
							stroke="#616265"
							stroke-width="2.25006"
							stroke-linecap="round"
						/>
						<path
							d="M11.7422 16.6821V6.79688"
							stroke="#616265"
							stroke-width="2.25006"
							stroke-linecap="round"
						/>
					</g>
					<g opacity="0.4">
						<path
							d="M11.7422 6.79688V16.6821"
							stroke="#616265"
							stroke-width="2.25006"
							stroke-linecap="round"
						/>
						<path
							d="M6.79839 11.7383H16.6836"
							stroke="#616265"
							stroke-width="2.25006"
							stroke-linecap="round"
						/>
					</g>
					<g opacity="0.4">
						<path
							d="M11.7422 6.79688V16.6821"
							stroke="#616265"
							stroke-width="2.25006"
							stroke-linecap="round"
						/>
						<path
							d="M6.79839 11.7383H16.6836"
							stroke="#616265"
							stroke-width="2.25006"
							stroke-linecap="round"
						/>
					</g>
				</svg>
			</button>
		</h1>

		<div class="h-[40px] w-fit rounded bg-[#EBECED] p-1 text-[#A1A2A2]">
			<button
				class={`h-full cursor-pointer rounded px-3 py-1 text-sm ${
					activeTab === 'Upcoming' ? 'bg-white text-black' : ''
				}`}
				on:click={() => (activeTab = 'Upcoming')}
			>
				Upcoming
			</button>
			<button
				class={`h-full cursor-pointer rounded px-3 py-1 text-sm ${
					activeTab === 'Past' ? 'bg-white text-black' : ''
				}`}
				on:click={() => (activeTab = 'Past')}
			>
				Past
			</button>
		</div>
	</div>

	<!-- Event List Section -->

	{#each events as event (event.id)}
		<div class=" mb-6 flex flex-col justify-between space-y-4 sm:flex-row">
			<div class="flex w-[320px] flex-col justify-between sm:flex-row">
				<div class="w-[300px]">
					<h2>{event.date}</h2>
					<h2 class="text-[#B9BABA]">{event.day}</h2>
				</div>
				<svg
					class="mr-10 hidden sm:inline-block"
					width="20"
					height="300"
					viewBox="0 0 10 191"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<circle cx="4.87512" cy="4.87512" r="4.87512" fill="#D9D9D9" />
					<rect x="3.75" y="10.5" width="2.25006" height="4.50011" fill="#EBECED" />
					<rect x="3.75" y="17.2501" width="2.25006" height="4.50011" fill="#EBECED" />
					<rect x="3.75" y="24" width="2.25006" height="4.50011" fill="#EBECED" />
					<rect x="3.75" y="30.75" width="2.25006" height="4.50011" fill="#EBECED" />
					<rect x="3.75" y="37.5" width="2.25006" height="4.50011" fill="#EBECED" />
					<rect x="3.75" y="44.25" width="2.25006" height="4.50011" fill="#EBECED" />
					<rect x="3.75" y="51" width="2.25006" height="4.50011" fill="#EBECED" />
					<rect x="3.75" y="57.75" width="2.25006" height="4.50011" fill="#EBECED" />
					<rect x="3.75" y="64.5" width="2.25006" height="4.50011" fill="#EBECED" />
					<rect x="3.75" y="71.25" width="2.25006" height="4.50011" fill="#EBECED" />
					<rect x="3.75" y="78" width="2.25006" height="4.50011" fill="#EBECED" />
					<rect x="3.75" y="84.75" width="2.25006" height="4.50011" fill="#EBECED" />
					<rect x="3.75" y="91.5039" width="2.25006" height="4.50011" fill="#EBECED" />
					<rect x="3.75" y="98.2539" width="2.25006" height="4.50011" fill="#EBECED" />
					<rect x="3.75" y="105.004" width="2.25006" height="4.50011" fill="#EBECED" />
					<rect x="3.75" y="111.754" width="2.25006" height="4.50011" fill="#EBECED" />
					<rect x="3.75" y="118.504" width="2.25006" height="4.50011" fill="#EBECED" />
					<rect x="3.75" y="125.254" width="2.25006" height="4.50011" fill="#EFF0F1" />
					<rect x="3.75" y="132.004" width="2.25006" height="4.50011" fill="#EFF0F1" />
					<rect x="3.75" y="138.754" width="2.25006" height="4.50011" fill="#EFF0F1" />
					<rect x="3.75" y="145.504" width="2.25006" height="4.50011" fill="#EFF0F1" />
					<rect x="3.75" y="152.254" width="2.25006" height="4.50011" fill="#EFF0F1" />
					<rect x="3.75" y="159.004" width="2.25006" height="4.50011" fill="#EFF0F1" />
					<rect x="3.75" y="165.754" width="2.25006" height="4.50011" fill="#F2F3F4" />
					<rect x="3.75" y="172.504" width="2.25006" height="4.50011" fill="#F2F3F4" />
					<rect x="3.75" y="179.254" width="2.25006" height="4.50011" fill="#F2F3F4" />
					<rect x="3.75" y="186.004" width="2.25006" height="4.50011" fill="#F2F3F4" />
				</svg>
			</div>

			<!-- Event Card Section -->
			<div class="min-h-[249px] w-full rounded-md bg-[#FDFDFD] p-3">
				<div class="flex flex-col justify-center sm:flex-row sm:justify-between">
					<div class="mt-2 mr-4 w-40 space-y-1">
						<p class="text-sm text-[#B9BABA]">{event.time}</p>
						<p class="text-lg font-semibold text-[#131517]">{event.title}</p>
						<div class="mb-2 flex items-center text-sm text-[#B9BABA]">
							<svg
								width="18"
								height="18"
								viewBox="0 0 18 18"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M9 4.64453C10.7007 4.64453 12.0897 6.02557 12.0898 7.73438C12.0898 9.44392 10.7001 10.8174 9 10.8174C7.29947 10.8173 5.91039 9.43617 5.91016 7.72754C5.91016 6.01807 7.29996 4.64465 9 4.64453ZM9 6.14453C8.1282 6.14466 7.41028 6.8561 7.41016 7.73438C7.41016 8.61327 8.12114 9.3241 9 9.32422C9.87897 9.32422 10.5898 8.61334 10.5898 7.73438C10.5897 6.85603 9.87191 6.14453 9 6.14453Z"
									fill="#CDCED0"
									stroke="#CDCED0"
									stroke-width="0.375009"
								/>
								<path
									d="M9.00879 0.75C11.8714 0.75 15.168 2.43315 16.0244 6.21387C16.9623 10.3576 14.453 13.8125 12.2295 15.9531H12.2285C11.3228 16.8198 10.1582 17.2578 9.00098 17.2578C7.84386 17.2577 6.67998 16.8197 5.77441 15.9531H5.77344C3.5498 13.8124 1.04072 10.3499 1.98633 6.20605L2.07324 5.8584C3.04798 2.32949 6.22805 0.750163 9.00098 0.75H9.00879ZM9.00098 2.25C6.94101 2.25015 4.33982 3.31002 3.52734 6.24609L3.4541 6.53711C2.66781 9.96633 4.82013 12.9462 6.82129 14.8652L6.93848 14.9727C8.16569 16.0465 10.0019 16.0107 11.1885 14.8652C13.1821 12.9463 15.3349 9.96655 14.5635 6.53711L14.4902 6.24707C13.6708 3.3101 11.0613 2.25 9.00098 2.25Z"
									fill="#CDCED0"
									stroke="#CDCED0"
									stroke-width="0.375009"
								/>
							</svg>
							<span class="ml-1">{event.location}</span>
						</div>

						<div class="mb-2 flex items-center text-sm text-[#B9BABA]">
							<svg
								width="15"
								height="15"
								viewBox="0 0 15 15"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M5.36119 6.459C5.29347 6.45257 5.21221 6.45257 5.13772 6.459C3.52599 6.40751 2.24609 5.15243 2.24609 3.60772C2.24609 2.03082 3.58694 0.75 5.25284 0.75C6.91197 0.75 8.25958 2.03082 8.25958 3.60772C8.25281 5.15243 6.97291 6.40751 5.36119 6.459Z"
									stroke="#A2A5A6"
									stroke-width="1.50004"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M1.97911 8.8326C0.340297 9.87528 0.340297 11.5745 1.97911 12.6107C3.84139 13.795 6.89554 13.795 8.75783 12.6107C10.3966 11.568 10.3966 9.86885 8.75783 8.8326C6.90232 7.65476 3.84817 7.65476 1.97911 8.8326Z"
									stroke="#A2A5A6"
									stroke-width="1.50004"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M10.2755 2.03906C11.5893 2.03906 12.6457 3.04956 12.6457 4.29177C12.6457 5.50823 11.6299 6.49942 10.3636 6.54448C10.3094 6.53804 10.2484 6.53804 10.1875 6.54448"
									stroke="#A2A5A6"
									stroke-width="1.50004"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M11.582 12.3383C12.0696 12.2418 12.5301 12.0551 12.9093 11.7784C13.9658 11.0253 13.9658 9.78313 12.9093 9.03008C12.5369 8.75976 12.0832 8.57954 11.6023 8.47656"
									stroke="#A2A5A6"
									stroke-width="1.50004"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>

							<span class="ml-2">{event.guests} Guests</span>
						</div>
						<button
							class=" item-center flex h-[27px] w-[102px] justify-center rounded-lg bg-[#F4F4F4] py-1 text-[#7A7B7D] transition-colors duration-500 hover:bg-[#E8E8E8] hover:text-[#5555658]"
						>
							<svg
								class="mt-1"
								width="12"
								height="12"
								viewBox="0 0 12 12"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<rect x="4.5" width="2.25006" height="11.2503" rx="1.12503" fill="#A0A1A3" />
								<rect
									y="6.75012"
									width="2.25006"
									height="11.2503"
									rx="1.12503"
									transform="rotate(-90 0 6.75012)"
									fill="#A0A1A3"
								/>
							</svg>

							<span class="ml-1">Add Tag</span></button
						>
					</div>
					<div class="sm:mt:0 mt-4">
						<img
							src={event.image}
							alt={event.title}
							class="h-[180px] w-full rounded-md object-cover sm:h-[220px]"
						/>
					</div>
				</div>

				<!-- Manage Event Button -->
				<button
					class="my-4 flex w-[153.75px] items-center justify-center gap-2 rounded-md bg-[#F4F4F4] px-4 py-2 text-[#7A7B7D] transition-colors duration-500 hover:bg-[#E8E8E8] hover:text-[#5555658]"
				>
					<span>Manage Event</span>
					<svg
						width="13"
						height="14"
						viewBox="0 0 13 14"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M0.978516 0.939453C1.80208 0.135667 2.99327 -0.0435635 4.01563 0.49707L11.1172 4.23535L11.2744 4.32422C12.0405 4.79511 12.5107 5.63044 12.5107 6.54004C12.5106 7.44945 12.0404 8.28408 11.2744 8.75488L11.1172 8.84375L4.01563 12.582L4.01465 12.5811C3.62002 12.7912 3.20419 12.8916 2.78809 12.8916C2.12527 12.8915 1.48426 12.6323 0.978516 12.1396C0.154115 11.335 -0.0444085 10.1438 0.469727 9.11524L1.46289 7.12988C1.64464 6.76638 1.64469 6.32504 1.46191 5.9541V5.95313L0.469727 3.96387C-0.0444055 2.93531 0.154116 1.74407 0.978516 0.939453ZM2.79492 1.48145C2.47652 1.48145 2.18938 1.61139 1.97266 1.79004L1.88379 1.87012C1.54868 2.19442 1.31625 2.76409 1.62695 3.3916L2.61914 5.37695V5.37793C2.98213 6.1105 2.98209 6.97444 2.61914 7.70703V7.70801L1.62695 9.69336L1.62598 9.69434C1.3106 10.3203 1.54754 10.8894 1.88379 11.2148C2.22203 11.5421 2.79159 11.7677 3.41211 11.4414L10.5137 7.70313C10.9546 7.47192 11.2167 7.03955 11.2168 6.5459C11.2168 6.05216 10.9546 5.61991 10.5137 5.38867V5.3877L3.41211 1.6377C3.1954 1.52397 2.98656 1.48148 2.79492 1.48145Z"
							fill="#7A7B7D"
							stroke="#7A7B7D"
							stroke-width="0.375009"
						/>
						<rect
							x="6.23194"
							y="7.22974"
							width="4.15113"
							height="1.31904"
							rx="0.65952"
							transform="rotate(180 6.23194 7.22974)"
							fill="#7A7B7D"
							stroke="#7A7B7D"
							stroke-width="0.375009"
						/>
					</svg>
				</button>
			</div>
		</div>
	{/each}
</div>
