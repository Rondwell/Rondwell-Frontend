<!-- src/routes/event/+page.svelte -->
<script lang="ts">
	// Mock data for the event
	export let eventData: any = {};
</script>

<div class="max-w-6xl">
	<!-- Event Header -->
	<div class="mb-6">
		<div class="mb-4 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span class="text-sm text-gray-500">John Collection</span>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-gray-400"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
						clip-rule="evenodd"
					/>
				</svg>
				<h1 class="text-2xl font-bold">{eventData.title}</h1>
			</div>
			<button
				class="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium hover:bg-gray-50"
			>
				Event Page
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="ml-1 inline h-4 w-4"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>
		</div>

		<!-- Event Status Banner -->
		<div class="mb-4 rounded-lg bg-gray-50 p-4">
			<div class="flex items-center gap-4">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-full bg-pink-500 text-xl font-bold text-white"
				>
					J
				</div>
				<div>
					<h2 class="text-lg font-semibold">{eventData.status}</h2>
					<p class="text-sm text-gray-600">
						Thank you for hosting. We trust it was a huge success!
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Event Details Section -->
	<div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Left Column - Event Info -->
		<div class="lg:col-span-2">
			<div class="rounded-lg bg-white p-4 shadow-md">
				<!-- Event Recap -->
				<div class="mb-4">
					<h3 class="mb-2 font-semibold">EVENT RECAP</h3>
					<div class="mb-2 flex items-center gap-4">
						<div class="flex items-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-gray-500"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1H7a1 1 0 00-1 1v1z"
									clip-rule="evenodd"
								/>
							</svg>
							<div>
								<div class="text-sm font-medium">{eventData.date}</div>
								<div class="text-xs text-gray-500">{eventData.time}</div>
							</div>
						</div>

						<div class="flex items-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-gray-500"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 019.9-9.9l-4.95 4.95a7 7 0 01-9.9-9.9l4.95 4.95z"
									clip-rule="evenodd"
								/>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 11-2 0 1 1 0 012 0z"
									clip-rule="evenodd"
								/>
							</svg>
							<div>
								<div class="text-sm font-medium">{eventData.location}</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Feedback Section -->
				<div class="border-t border-gray-200 pt-4">
					<h3 class="mb-2 font-semibold">FEEDBACK</h3>
					<div class="rounded-lg bg-gray-50 p-3">
						<div class="mb-2 flex items-center gap-3">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-8 w-8 text-gray-400"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M18 10c0 3.086-1.634 5.83-4.097 7.274a1 1 0 01-1.029-.134A10.002 10.002 0 012 10c0-5.523 4.477-10 10-10 3.638 0 6.88 1.925 8.71 4.856a1 1 0 01.134 1.029 10.002 10.002 0 01-7.274 18.097 1 1 0 01-.134-1.029A10.002 10.002 0 0118 10z"
									clip-rule="evenodd"
								/>
							</svg>
							<div>
								<div class="text-sm text-gray-500">No Feedback Collected</div>
								<div class="text-xs text-gray-500">
									You are not collecting feedback for this event.
								</div>
							</div>
						</div>
						<button class="text-sm font-medium text-blue-600 hover:text-blue-700">
							Schedule Feedback Email
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Right Column - Insights Button -->
		<div class="rounded-lg bg-white p-4 shadow-md">
			<button
				class="w-full rounded-md bg-gray-100 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200"
			>
				Insights
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="ml-1 inline h-4 w-4"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M5.293 7.293a1 1 0 00-1.414 0L2 9a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V9a1 1 0 00-1-1L5.293 7.293zM10 10a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1v-6a1 1 0 00-1-1h-6z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>
		</div>
	</div>

	<!-- Invites Section -->
	<div class="mb-6 rounded-lg bg-white p-4 shadow-md">
		<h3 class="mb-3 font-semibold">Invites</h3>
		<p class="mb-4 text-sm text-gray-600">
			Invite subscribers, contacts and past guests via email or SMS.
		</p>

		<div class="mb-4 flex items-center justify-between">
			<div class="flex items-center gap-4">
				<div class="text-center">
					<div class="text-2xl font-bold">1/1</div>
					<div class="text-xs text-gray-500">Invite Accepted</div>
				</div>
				<div class="text-center">
					<div class="text-xs text-gray-500">1 Email Opened</div>
					<div class="text-xs text-gray-500">0 Declined</div>
				</div>
			</div>

			<button
				class="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium hover:bg-gray-50"
			>
				+ Invite Guests
			</button>
		</div>

		<!-- Invite List -->
		<div class="border-t border-gray-200 pt-4">
			<div class="flex items-center justify-between rounded-lg bg-gray-50 p-3">
				<div class="flex items-center gap-3">
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-blue-600"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 11-2 0 1 1 0 012 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<div>
						<div class="font-medium">John Odoemenem</div>
						<div class="text-sm text-gray-500">johnmedic23@gmail.com</div>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<div class="h-3 w-3 rounded-full bg-green-500"></div>
					<div class="text-xs text-gray-500">13 Minutes Ago</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Attendees Section -->
	<div class="mb-6 rounded-lg bg-white p-4 shadow-md">
		<h3 class="mb-3 font-semibold">Attendees</h3>

		<!-- Stats -->
		<div class="mb-4 flex items-center gap-4">
			<div class="text-sm text-gray-600">0 guests</div>
			<div class="h-px flex-1 bg-gray-300"></div>
			<div class="text-sm text-gray-600">• 1 Invited • 2 Not Attending</div>
		</div>

		<!-- Recent Registrations -->
		<div class="mb-4">
			<div class="mb-3 flex items-center justify-between">
				<h4 class="font-medium">Recent Registrations</h4>
				<button class="text-sm text-gray-500 hover:text-gray-700">All Guests →</button>
			</div>

			{#each eventData.recentRegistrations as reg}
				<div class="mb-2 flex items-center justify-between rounded-lg bg-gray-50 p-3">
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-blue-600"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 11-2 0 1 1 0 012 0z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div>
							<div class="font-medium">{reg.name}</div>
							<div class="text-sm text-gray-500">{reg.email}</div>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<span
							class={`rounded px-2 py-0.5 text-xs font-medium ${reg.status === 'Unregistered' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}
						>
							{reg.status}
						</span>
						<div class="text-xs text-gray-500">{reg.time}</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Admins Section -->
		<div>
			<div class="mb-3 flex items-center justify-between">
				<h4 class="font-medium">Admins</h4>
				<button class="text-sm text-gray-500 hover:text-gray-700">All Admins →</button>
				<button
					class="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium hover:bg-gray-50"
				>
					+ Add Admin
				</button>
			</div>

			{#each eventData.admins as admin}
				<div class="mb-2 flex items-center justify-between rounded-lg bg-gray-50 p-3">
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-blue-600"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 11-2 0 1 1 0 012 0z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div>
							<div class="font-medium">{admin.name}</div>
							<div class="text-sm text-gray-500">{admin.email}</div>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<span
							class={`rounded px-2 py-0.5 text-xs font-medium ${admin.role === 'Creator' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}
						>
							{admin.role}
						</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 cursor-pointer text-gray-400"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm3 6a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H6a1 1 0 01-1-1v-6zm6 3a1 1 0 11-2 0 1 1 0 012 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
				</div>
			{/each}

			<div class="mt-3 text-xs text-gray-500">Learn more about managing event admins →</div>
		</div>
	</div>

	<!-- Visibility & Discovery Section -->
	<div class="rounded-lg bg-white p-4 shadow-md">
		<h3 class="mb-3 font-semibold">Visibility & Discovery</h3>
		<p class="mb-4 text-sm text-gray-600">Control how people can find your event.</p>

		<!-- Managing Calendar -->
		<div class="mb-4 rounded-lg bg-gray-50 p-3">
			<div class="mb-2 flex items-center gap-3">
				<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 text-blue-600"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 11-2 0 1 1 0 012 0z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div>
					<div class="font-medium">Managing Calendar</div>
					<div class="text-sm text-gray-500">{eventData.visibility.calendar}</div>
				</div>
			</div>

			<div class="mb-3 flex items-center gap-2">
				<div class="h-3 w-3 rounded-full bg-green-500"></div>
				<div class="text-sm text-gray-500">
					{eventData.visibility.status} — This event is listed on the calendar page. Calendar admins
					have manage access to the event.
				</div>
			</div>

			<div class="flex gap-2">
				<button
					class="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium hover:bg-gray-50"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mr-1 inline h-4 w-4"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 11-2 0 1 1 0 012 0z"
							clip-rule="evenodd"
						/>
					</svg>
					Change Visibility
				</button>
				<button
					class="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium hover:bg-gray-50"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mr-1 inline h-4 w-4"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 11-2 0 1 1 0 012 0z"
							clip-rule="evenodd"
						/>
					</svg>
					Transfer Calendar
				</button>
			</div>
		</div>

		<!-- Additional Information -->
		<div class="text-xs text-gray-500">
			You can submit the event to a relevant Rondwell discovery page or other community Collection
			for a chance to be featured, such as the discover more page.
		</div>
	</div>
</div>
