<script lang="ts">
	export let events: any[] = [];
</script>

<div class="mb-12 grid gap-4 lg:grid-cols-2">
	{#each events as event, index (index)}
		<div class="flex flex-col gap-4 rounded-md bg-[#FDFDFD] p-3 md:flex-row md:p-6">
			<div class="flex-1 space-y-3">
				<!-- Event Time -->
				<div class="flex items-center gap-2">
					<span class="text-sm text-gray-500">{event.time}</span>
				</div>

				<!-- Title + Organizers -->
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-lg">
						<img src="/star.svg" alt="Featured" class="h-5 w-5" />
						<h3 class="font-semibold text-gray-900">{event.title}</h3>
					</div>

					<div
						class="flex items-center gap-2 font-['Merriweather_Sans'] text-[16px] leading-[17px] font-normal text-[#B9BABA]"
					>
						<img src="/moon.svg" alt="Featured" class="h-5 w-7" />
						<span>{event.organizers}</span>
					</div>

					<div class="flex items-center gap-5">
						<div class="flex items-center gap-2 text-sm text-gray-500">
							<img src={event.locationIcon} alt="Location" class="h-4 w-4" />
							<span>{event.location}</span>
						</div>
						<span class="rounded-2xl bg-[#FFECEC] px-3 py-1 text-sm text-[#FF0004]"
							>{event.availability}</span
						>
					</div>

					<!-- Status + Attendees -->
					<div class="relatve flex items-center gap-4">
						<span class="rounded-sm bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
							{event.status}
						</span>
						<div class="relative flex items-center gap-1 text-sm text-gray-600">
							<img src="/ppp.svg" alt="Featured" class="h-auto w-auto" />
							<span
								class="absolute top-0 left-8 rounded-[11.2503px] bg-[#F4F4F4] px-2 py-1 text-xs text-[#7F7F81]"
								>{event.attendees}</span
							>
						</div>
						{#if event.tag}
							<div class="ml-7 flex items-center gap-2 text-sm">
								<img src="/tech-icon.svg" alt="icon" class="" />
								<span>{event.tag}</span>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Event Image -->
			<div class="h-[218px] w-full flex-shrink-0 overflow-hidden rounded-xl md:h-30 md:w-30">
				<img
					src={event.image || '/favicon.png'}
					alt={event.title}
					class="h-full w-full object-cover"
				/>
			</div>
		</div>
	{/each}
</div>
