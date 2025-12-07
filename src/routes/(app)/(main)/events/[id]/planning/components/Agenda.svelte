<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';

	let showFilter = false;

	// Agenda days
	let days: any[] = [
		{
			id: 1,
			dateLabel: 'Fri, Oct. 10th',
			expanded: true,
			agenda: [
				{
					id: 1,
					sessions: [
						{
							id: 1,
							time: '9:00 AM – 10:00 AM',
							title: 'Opening Keynote: The Future of AI',
							discription: '',
							details: {
								location: 'Grand Ballroom',
								speakers: [
									{
										speaker: 'Dr. Anya Sharma',
										speakerTag: 'AI Expert',
										speakerBio:
											'John Odoemenem is a respected FinTech expert. David Kim is a full-stack Blockchain Developer.'
									}
								]
							}
						},
						{
							id: 2,
							time: '2:00 AM – 3:00 AM',
							title: 'Panel: Blockchain Beyond Cryptocurrencies',
							discription:
								'Participate in a dynamic session exploring practical applications of Agile and Scrum frameworks.',
							details: {
								location: 'Innovation Lab A',
								speakers: [
									{
										speaker: 'Mark Chen',
										speakerTag: 'Data Scientist',
										speakerBio:
											'Mark Chen is a respected FinTech expert. David Kim is a full-stack Blockchain Developer.'
									}
								]
							}
						},
						{
							id: 3,
							time: '12:00 PM – 1:00 PM',
							title: 'Lunch Break',
							details: {
								location: 'Summit Cafeteria'
							}
						},
						{
							id: 4,
							time: '2:00 PM – 3:00 PM',
							title: 'Panel: Blockchain Beyond Cryptocurrencies',
							details: {
								location: 'Grand Ballroom',
								speakers: [
									{
										speaker: 'Sarah Lee',
										speakerTag: 'FinTech Expert'
									},
									{
										speaker: 'David Kim',
										speakerTag: 'Blockchain Developer'
									}
								]
							}
						},
						{
							id: 5,
							time: '3:30 PM – 4:30 PM',
							title: 'Building Scalable Microservices with Kubernetes',
							details: {
								location: 'Innovation Lab B',
								speakers: [
									{
										speaker: 'Jessica Wong',
										speakerTag: 'DevOps Engineer'
									}
								]
							}
						},
						{
							id: 6,
							time: '5:00 PM – 6:00 PM',
							title: 'Evening Reception',
							details: {
								location: 'Sky Lounge'
							}
						}
					],
					joinLink: 'meet.google.com/bbg-qnqx-dkh'
				}
			]
		},

		{
			id: 2,
			dateLabel: 'Thu, Oct. 9th',
			expanded: true,
			agenda: [
				{
					id: 1,
					sessions: [
						{
							id: 1,
							time: '9:00 AM – 10:00 AM',
							title: 'Keynote: Cybersecurity in the Age of Quantum Computing',
							details: {
								location: 'Grand Ballroom',
								speakers: [
									{
										speaker: 'Alex Miller',
										speakerTag: 'Security Architect'
									}
								]
							}
						},
						{
							id: 2,
							time: '10:30 AM – 11:30 AM',
							title: 'Interactive Session: Agile Methodologies in Practice',
							details: {
								location: 'Collaboration Hub',
								speakers: [
									{
										speaker: 'Emily Roberts',
										speakerTag: 'Agile Coach'
									}
								]
							}
						},
						{
							id: 3,
							time: '12:00 PM – 1:00 PM',
							title: 'Lunch Break',
							details: {
								location: 'Summit Cafeteria'
							}
						},
						{
							id: 4,
							time: '2:00 PM – 3:00 PM',
							title: 'Workshop: UI/UX Design Principles for Developers',
							details: {
								location: 'Innovation Lab A',
								speakers: [
									{
										speaker: 'Carlos Rodriguez',
										speakerTag: 'Product Designer'
									}
								]
							}
						}
					],
					joinLink: 'meet.google.com/bbg-qnqx-dkh'
				}
			]
		},

		{ id: 3, dateLabel: 'Fri, Oct. 10th', expanded: false, agenda: [] },
		{ id: 4, dateLabel: 'Sat, Oct. 11th', expanded: false, agenda: [] },
		{ id: 5, dateLabel: 'Sun, Oct. 12th', expanded: false, agenda: [] },
		{ id: 6, dateLabel: 'Mon, Oct. 13th', expanded: false, agenda: [] }
	];

	function toggleDay(day: any) {
		day.expanded = !day.expanded;
		days = days; // Trigger Svelte reactivity
	}
</script>

<div class="">
	<!-- Top Section -->
	<div class="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
		<div>
			<h1 class="text-2xl font-semibold">Event Agenda for Megaexe Party</h1>
			<p class="text-sm text-gray-500">
				Configure how your event's sessions and rooms are displayed to attendees
			</p>
		</div>

		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<button
				class="flex items-center justify-center gap-1 rounded-md bg-gray-300 px-3 py-1 text-sm font-medium text-[#5D646F] md:items-start"
			>
				Sync with Calendar
				<img src="/arrow-up-right.svg" alt="" />
			</button>
			<button
				class="flex items-center justify-center gap-1 rounded-md bg-gray-300 px-3 py-1 text-sm font-medium text-[#5D646F] md:items-start"
			>
				Preview Public Agenda
				<img src="/arrow-up-right.svg" alt="" />
			</button>
		</div>
	</div>

	<div class="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
		<div class="flex items-center justify-between gap-3 md:justify-normal">
			<button
				class="flex items-center gap-2 rounded-md bg-gray-300 px-3 py-2 text-xs text-[#616265] md:text-sm"
			>
				<div class="flex items-center gap-1">
					<Icon icon="mdi:web" class="text-xl" />
					<label for="public-agenda" class="text-sm">Public Agenda</label>
				</div>
				<label class="relative inline-flex cursor-pointer items-center">
					<input id="public-agenda" type="checkbox" class="peer sr-only" />
					<div class="h-5 w-9 rounded-full bg-gray-400 transition-all peer-checked:bg-black"></div>
					<div
						class="absolute top-0 left-0 h-5 w-5 rounded-full bg-white transition-all peer-checked:translate-x-4"
					></div>
				</label>
			</button>

			<div class="flex items-center gap-1 md:hidden">
				<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-gray-300">
					<img src="/download-icon.svg" alt="download icon" />
				</div>
				<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-gray-300">
					<img src="/export.svg" alt="export icon" />
				</div>
			</div>
		</div>

		<div class="flex items-center gap-1 md:flex-row">
			<div class="hidden items-center gap-1 md:flex">
				<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-gray-300">
					<img src="/download-icon.svg" alt="download icon" />
				</div>
				<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-gray-300">
					<img src="/export.svg" alt="export icon" />
				</div>
			</div>

			<div use:clickOutside={() => (showFilter = false)} class="relative">
				<button
					class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-gray-300 px-3 py-2 text-xs text-[#616265] md:text-sm"
				>
					<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
					Organized By Chronological Order
				</button>
				<!-- <Status bind:open={showStatus} participant="speaker" /> -->
			</div>
		</div>
	</div>

	<!-- Event Agenda Block -->
	<div class="mt-12">
		<div class="flex flex-col justify-between gap-2 lg:flex-row lg:items-center">
			<h2 class="flex items-center gap-2 text-2xl font-semibold">
				<img src="/calendar.svg" alt="" />
				Event Agenda for Tech Innovators Summit 2025
			</h2>

			<button
				class="flex items-center justify-center gap-2 rounded-md bg-gray-300 px-4 py-2 text-[#616265] sm:w-fit"
			>
				<img src="/green-filter.svg" alt="" />
				Customize Agenda
			</button>
		</div>

		<div class="space-y-4">
			<!-- DAYS -->
			{#each days as day}
				<div class="mt-6 rounded-lg bg-white p-6">
					<!-- Day Header -->
					<div class="flex cursor-pointer items-center justify-between">
						<div class="flex items-center gap-3 rounded-lg border p-2">
							<img src="/calendar-line.svg" alt="" />
							<p class="font-medium">{day.dateLabel}</p>
						</div>

						<button on:click={() => toggleDay(day)}>
							<img
								src="/arrow-down.svg"
								alt=""
								class="h-5 w-5 cursor-pointer {day.expanded ? 'rotate-180' : ''}"
							/>
						</button>
					</div>

					<!-- Expanded Content -->
					{#if day.expanded}
						<div class="mt-4 space-y-6">
							{#if day.agenda.length === 0}
								<!-- Empty State -->
								<div class="flex flex-col items-center justify-center py-8 text-center">
									<Icon icon="mdi:calendar-blank-outline" class="mb-3 text-5xl text-gray-400" />
									<p class="text-sm text-gray-500">No agenda scheduled for this day</p>
								</div>
							{:else}
								{#each day.agenda as agenda}
									<!-- Sessions -->
									<div class="space-y-6">
										{#each agenda.sessions as session}
											<div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-2 lg:grid-cols-3">
												<div class="text-sm text-gray-500">{session.time}</div>

												<div class="flex flex-col justify-start gap-2">
													<h3 class="font-medium">{session.title}</h3>
													<p class="mt-2 text-sm">{session.description}</p>
												</div>

												<div class="flex flex-col justify-start gap-3 text-sm">
													{#if session.details.location}
														<p>
															<span class="text-gray-500">Location:</span>
															{session.details.location}
														</p>
													{/if}

													{#if session.details.speakers}
														{#each session.details.speakers as speaker}
															<div class="flex flex-col items-start gap-3">
																<p class="flex items-start gap-2 sm:items-center">
																	<span class="flex-shrink-0 text-gray-500">Speaker:</span>
																	<span
																		class="flex flex-col gap-2 text-xs sm:flex-row sm:items-center md:text-sm"
																	>
																		<span class="flex items-center gap-2">
																			<img src="/face-2.svg" alt="speaker icon" />
																			{speaker.speaker}
																		</span>
																		<span
																			class="ml-2 rounded-full bg-[#E3F4E1] px-2 py-1 text-center text-xs text-[#3CBD2C]"
																		>
																			{speaker.speakerTag}
																		</span>
																	</span>
																</p>
																{#if speaker.speakerBio}
																	<p class="flex items-start gap-2">
																		<span class="flex-shrink-0 text-gray-500">Speaker Bio:</span>
																		<span class="text-xs md:text-sm">{speaker.speakerBio}</span>
																	</p>
																{/if}
															</div>
														{/each}
													{/if}
												</div>
											</div>
										{/each}

										<!-- Join Link -->
										{#if agenda.joinLink}
											<div
												class="flex flex-col justify-between gap-3 md:flex-row md:items-center lg:w-[50%]"
											>
												<div class="flex items-center gap-2">
													<img src="/google-meet-icon.svg" alt="" />
													<p class="text-sm text-gray-500">{agenda.joinLink}</p>
												</div>
												<a
													href={agenda.joinLink}
													class="flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-1.5 text-sm text-white"
												>
													Join Session
													<p class="rounded-lg bg-red-500 px-2 py-1 text-xs">Live</p>
												</a>
											</div>
										{/if}
									</div>
								{/each}
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	/* Small switch toggle style */
	.toggle {
		width: 40px;
		height: 20px;
		appearance: none;
		background: #d1d5db;
		border-radius: 9999px;
		position: relative;
		cursor: pointer;
	}

	.toggle:checked {
		background: #4ade80;
	}

	.toggle:after {
		content: '';
		width: 16px;
		height: 16px;
		background: white;
		border-radius: 50%;
		position: absolute;
		top: 2px;
		left: 2px;
		transition: 0.2s;
	}

	.toggle:checked:after {
		transform: translateX(20px);
	}
</style>
