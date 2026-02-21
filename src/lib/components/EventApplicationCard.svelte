<script lang="ts">
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';

	export let event: any;
	
</script>

	<div class='rounded-md bg-[#FDFDFD] p-3 md:p-6'>
		<div class="flex cursor-pointer flex-col gap-4 md:flex-row">
			<div class="flex-1 space-y-1">
				<!-- Event Time -->
				<div class="flex items-center gap-2">
					<span class="text-sm text-[#B9BABA]">{event.time}</span>
				</div>

				<!-- Title + Organizers -->
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-lg">
						
						<h3
							class="mine
								text-gray-900
								font-semibold text-gray-900"
						>
							{event.title}
						</h3>
					</div>

				
					<div
						class="flex items-center gap-2 font-['Merriweather_Sans'] text-[16px] leading-[17px] font-normal text-[#B9BABA]"
					>
						<img src="/moon.svg" alt="Featured" class="h-5 w-7" />
						<span>{event.organizers}</span>
					</div>
					

					<div class="flex items-center gap-5">
						<div class="flex items-center gap-2 text-sm text-[#B9BABA]">
							<img src={event.locationIcon} alt="Location" class="h-4 w-4" />
							<span>{event.location}</span>
						</div>
						
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
		
		<!-- Status + Attendees -->
		<div class='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 mt-2'>
			<div class="sm:order-2 self-center sm:justify-self-end">
				<div class=" flex items-center gap-2">
					<span class="{event.status === 'Invited' ? 'bg-[#146AEB]' : 'bg-[#3CBD2C]'} rounded-sm px-3 py-1 text-xs font-medium text-[#ffffff]">
						{event.status}
					</span>
					{#if event.attendees > 0}
						<div class="relative sm:mr-5 flex items-center gap-1 text-sm text-gray-600">
							<img src="/ppp.svg" alt="Featured" class="h-auto w-auto" />
							<span
								class="absolute top-0 left-8 rounded-[11.2503px] bg-[#F4F4F4] px-2 py-1 text-xs text-[#7F7F81]"
								>{event.attendees}<span>+</span>
							</span>	
						</div>
					{/if}
				</div>
			</div>
			<div class='sm:order-1 '>
				<button
					on:click={() => goto('/events/1')}
					class="flex items-center sm:w-[200px] w-full justify-center gap-1 rounded-sm bg-[#000000] px-2 py-2 text-sm font-medium text-[#616265]"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
					<path d="M8.87518 8.87518V4.55762H10.3144V8.87518H14.6319V10.3144H10.3144V14.6319H8.87518V10.3144H4.55762V8.87518H8.87518Z" fill="white"/>
					</svg>

					<p class="text-white font-thin text-xs">View Details & Apply</p>
					
				</button>
			</div>
		</div>		

	</div>

