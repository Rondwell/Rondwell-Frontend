<script lang="ts">
	import Icon from '@iconify/svelte';

	export let event: any;
	export let type: string = 'attending';
</script>

<a href="/events/1">
	<div class="flex cursor-pointer flex-col gap-4 rounded-md bg-[#FDFDFD] p-3 md:flex-row md:p-6">
		<div class="flex-1 space-y-1">
			<!-- Event Time -->
			<div class="flex items-center gap-2">
				<span class="text-sm text-[#B9BABA]">{event.time}</span>
			</div>

			<!-- Title + Organizers -->
			<div class="space-y-2">
				<div class="flex items-center gap-2 text-lg">
					{#if type !== 'mine'}
						<img src="/star.svg" alt="Featured" class="h-5 w-5" />
					{/if}
					<h3
						class="{type !== 'mine'
							? 'text-gray-900'
							: 'text-lg text-black'} font-semibold text-gray-900"
					>
						{event.title}
					</h3>
				</div>

				{#if type !== 'mine'}
					<div
						class="flex items-center gap-2 font-['Merriweather_Sans'] text-[16px] leading-[17px] font-normal text-[#B9BABA]"
					>
						<img src="/moon.svg" alt="Featured" class="h-5 w-7" />
						<span>{event.organizers}</span>
					</div>
				{/if}

				<div class="flex items-center gap-5">
					<div class="flex items-center gap-2 text-sm text-[#B9BABA]">
						<img src={event.locationIcon} alt="Location" class="h-4 w-4" />
						<span>{event.location}</span>
					</div>
					{#if type !== 'mine'}
						<span class="rounded-2xl bg-[#FFECEC] px-3 py-1 text-sm text-[#FF0004]"
							>{event.availability}</span
						>
					{/if}
				</div>

				{#if type === 'mine'}
					<div class="flex items-center gap-2 text-sm text-[#B9BABA]">
						<img src="/group-icon.svg" alt="Location" class="h-4 w-4" />
						<span>20+ Attendees</span>
					</div>
				{/if}

				<!-- Status + Attendees -->
				<div class="relatve flex items-center {type !== 'mine' ? 'gap-4' : 'gap-3'}">
					{#if type !== 'mine'}
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
					{:else}
						<div class="flex items-center rounded-2xl bg-[#EFEFEF] px-1 py-0.5 text-[#A0A1A3]">
							<Icon icon="mdi:plus" class="text-xl" />
							Add Tag
						</div>
					{/if}
					{#if event.tag}
						<div class="{type !== 'mine' ? 'ml-7' : ''} flex items-center gap-1 text-sm">
							<img src="/tech-icon.svg" alt="icon" class="" />
							<span>{event.tag}</span>
						</div>
					{/if}
				</div>

				{#if type === 'mine'}
					<button
						class="flex w-35 items-center gap-1 rounded-sm bg-[#F4F4F4] px-3 py-2 text-sm font-medium text-[#616265]"
					>
						<p>Manage Event</p>
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
				{/if}
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
</a>
