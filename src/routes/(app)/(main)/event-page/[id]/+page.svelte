<script lang="ts">
	import { page } from '$app/stores';
	import { getEventTheme } from '$lib/stores/eventTheme';
	import type { Color } from '$lib/utils/colors';
	import { colors } from '$lib/utils/colors';
	import RegistrationModal from '../components/modal/RegistrationModal.svelte';
	import OrganiserList from '../components/OrganiserList.svelte';

	let selectedTicket = 'standard';
	let showAddModal = false;

	let themeColor: Color = colors[0];
	$: {
		const match = $page.url.pathname.match(/^\/event-page\/([^/]+)/);
		if (match) themeColor = getEventTheme(match[1]);
	}

	const organizer = [
		{ id: 1, name: 'JOHN EMINEM ODO', avatar: '/john-avatar.svg', social: true },
		{ id: 2, name: 'Sam Adekunle', avatar: '/user1-icon.svg', social: true },
		{ id: 3, name: 'Africa Startup Festival', avatar: '/user3-icon.svg', social: false }
	];
</script>

<div class="w-full max-w-6xl">
	<div class="flex flex-col justify-start gap-6 py-4 md:flex-row md:gap-9">

		<!-- Left Column -->
		<div class="w-full md:max-w-[378px]">
			<!-- Event Image -->
			<img
				src="/eventpage_sample.svg"
				alt="Event"
				class="aspect-square w-full rounded-[27px] object-cover md:size-[378px]"
			/>

			<!-- Organizer Access Card -->
			<div
				class="mb-4 mt-3 max-w-[378px] rounded-lg px-3 py-2.5 sm:px-4 sm:py-3"
				style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};"
			>
				<div class="flex items-center justify-between gap-2">
					<div class="max-w-[220px] text-xs leading-6 font-normal sm:text-sm" style="color: {themeColor.lightText};">
						You have organizer <br /> access for this event.
					</div>
					<button
						class="flex items-center justify-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors"
						style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
					>
						Organize
						<img src="/send-white.svg" alt="icon" class="ml-1 size-4" />
					</button>
				</div>
			</div>

			<!-- Desktop Only Sections -->
			<div class="hidden md:block">
				<!-- Presented By -->
				<div class="rounded-2xl p-4" style="background-color: {themeColor.cover};">
					<div class="flex items-center justify-between gap-3">
						<div class="flex gap-3">
							<img src="/present.svg" alt="host" class="size-9 rounded-[9px]" />
							<div>
								<p class="text-xs" style="color: {themeColor.lightText};">Presented by</p>
								<h2 class="text-sm font-medium" style="color: {themeColor.text};">💰 Get Funded! Offi...</h2>
							</div>
						</div>
						<button
							class="rounded-full px-3.5 py-2 text-sm font-normal transition-colors"
							style="background-color: {themeColor.smallCover}; color: {themeColor.text};"
						>
							Subscribe
						</button>
					</div>
					<p class="mt-3 text-sm font-light leading-6" style="color: {themeColor.lightText};">
						Empowering transformational change in entrepreneurs and driven professionals through compassionate coaching.
					</p>
				</div>

				<!-- Organized By -->
				<div class="mt-6 rounded-[16px] p-4" style="background-color: {themeColor.cover};">
					<h3 class="mb-4 border-b pb-2 text-sm font-normal" style="color: {themeColor.lightText}; border-color: {themeColor.toggle};">
						Organized By
					</h3>
					<div class="space-y-3">
						{#each organizer as or}
							<OrganiserList organizerName={or.name} organizerAvatar={or.avatar} organizerSocial={or.social} />
						{/each}
					</div>

					<!-- Attending -->
					<div class="mt-6">
						<h3 class="mb-4 border-b pb-2 text-sm font-normal" style="color: {themeColor.lightText}; border-color: {themeColor.toggle};">
							119 Attending
						</h3>
						<div class="space-y-2">
							<div class="relative flex items-center gap-1 text-sm">
								<img src="/ppp.svg" alt="Attendees" class="h-auto w-auto" />
								<span
									class="absolute left-10 top-0 rounded-full border px-2 py-1 text-xs"
									style="background-color: {themeColor.smallCover}; color: {themeColor.lightText}; border-color: {themeColor.toggle};"
								>+59</span>
							</div>
							<p class="max-w-[334px] text-sm" style="color: {themeColor.lightText};">
								Tucker Cohen, Gabriel Funsho, Bbloloa, and 116 others
							</p>
						</div>
					</div>

					<!-- Footer Links -->
					<div class="mt-6 flex flex-col space-y-2">
						<a href="#" class="text-sm font-normal" style="color: {themeColor.lightText};">Contact the Organizer</a>
						<a href="#" class="text-sm font-normal" style="color: {themeColor.lightText};">Report Event</a>
					</div>
					<div class="mt-3 w-fit rounded-full border px-2 py-1 text-xs" style="border-color: {themeColor.toggle}; color: {themeColor.lightText};">
						<span class="mr-1">#</span>AI
					</div>
				</div>
			</div>
		</div>

		<!-- Right Column -->
		<div class="flex-1">
			<!-- Event Title Card -->
			<div class="mb-5 rounded-[16px] p-5" style="background-color: {themeColor.cover};">
				<h2 class="text-3xl font-bold md:text-[48px] md:leading-[56px]" style="color: {themeColor.text};">
					Megaexe Party, in mapi
				</h2>
				<div class="mt-2 flex items-center md:hidden">
					<img src="/tech-icon.svg" alt="calendar" class="mr-2 size-4 rounded-[4px] border" style="border-color: {themeColor.toggle};" />
					<p class="text-xs" style="color: {themeColor.lightText};">John Calendar</p>
				</div>

				<!-- Date -->
				<div class="mt-4 flex items-center gap-4">
					<div class="flex h-[49px] w-[44px] flex-col rounded-md border" style="border-color: {themeColor.toggle};">
						<p class="py-[2px] text-center text-xs" style="background-color: {themeColor.smallCover}; color: {themeColor.lightText};">Jun</p>
						<div class="flex flex-1 items-center justify-center border-t" style="border-color: {themeColor.toggle};">
							<p class="text-sm font-medium" style="color: {themeColor.text};">25</p>
						</div>
					</div>
					<div>
						<div class="text-base font-medium" style="color: {themeColor.text};">Wednesday, Dec 25</div>
						<div class="text-sm" style="color: {themeColor.lightText};">11:30AM - 12:30AM GMT+1</div>
					</div>
				</div>

				<!-- Location -->
				<div class="mt-3 flex items-center gap-4">
					<div class="flex w-[44px] items-center justify-center rounded-md border py-[11px]" style="border-color: {themeColor.toggle};">
						<svg width="22" height="22" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: {themeColor.text};">
							<path fill-rule="evenodd" clip-rule="evenodd" d="M2.86182 9.81725C2.86182 15.7842 10.0806 21.4847 11.4556 21.4847C12.8306 21.4847 20.0493 15.7842 20.0493 9.81725C20.0493 5.18665 16.2022 1.43262 11.4556 1.43262C6.70895 1.43262 2.86182 5.18522 2.86182 9.81725Z" stroke="currentColor" stroke-width="2.14844" stroke-linecap="round" stroke-linejoin="round"/>
							<path fill-rule="evenodd" clip-rule="evenodd" d="M13.6035 9.31055C13.6035 9.88035 13.3772 10.4268 12.9743 10.8297C12.5713 11.2326 12.0249 11.459 11.4551 11.459C10.8853 11.459 10.3388 11.2326 9.9359 10.8297C9.53299 10.4268 9.30664 9.88035 9.30664 9.31055C9.30664 8.74075 9.53299 8.19428 9.9359 7.79137C10.3388 7.38846 10.8853 7.16211 11.4551 7.16211C12.0249 7.16211 12.5713 7.38846 12.9743 7.79137C13.3772 8.19428 13.6035 8.74075 13.6035 9.31055Z" stroke="currentColor" stroke-width="2.14844" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
					<div class="text-base font-medium" style="color: {themeColor.text};">Register to See Address</div>
				</div>
			</div>

			<!-- Registration Section -->
			<div class="mb-5 flex flex-col rounded-2xl border" style="border-color: {themeColor.toggle}; background-color: {themeColor.cover};">
				<h2 class="rounded-t-2xl px-5 py-2 text-lg font-normal" style="background-color: {themeColor.smallCover}; color: {themeColor.text};">
					Registration
				</h2>
				<p class="my-4 px-5 text-base" style="color: {themeColor.text};">
					Welcome! Please choose your desired ticket type:
				</p>

				<div class="mb-5 flex flex-col gap-3 px-5">
					<!-- Standard Ticket -->
					<button
						class="relative block cursor-pointer rounded-lg border-2 p-4 transition-colors"
						style="background-color: {themeColor.bg}; border-color: {selectedTicket === 'standard' ? themeColor.button : themeColor.toggle};"
						on:click={() => (selectedTicket = 'standard')}
					>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<span class="text-sm font-medium" style="color: {themeColor.text};">Standard</span>
								<span class="rounded-full px-2 py-0.5 text-xs font-medium" style="background-color: {themeColor.smallCover}; color: {themeColor.lightText};">
									Require Approval
								</span>
							</div>
							<span class="text-sm" style="color: {themeColor.lightText};">Free</span>
						</div>
					</button>

					<!-- Salesperson Interview Ticket -->
					<button
						class="relative block cursor-pointer rounded-lg border-2 p-4 transition-colors"
						style="background-color: {themeColor.bg}; border-color: {selectedTicket === 'salesperson' ? themeColor.button : themeColor.toggle};"
						on:click={() => (selectedTicket = 'salesperson')}
					>
						<div class="flex items-start justify-between">
							<div class="flex flex-col gap-1 lg:flex-row lg:items-center">
								<span class="text-sm font-medium" style="color: {themeColor.text};">Salesperson Interview</span>
								<span class="min-w-fit rounded-full px-2 py-0.5 text-xs font-medium" style="background-color: {themeColor.smallCover}; color: {themeColor.lightText};">
									Require Approval
								</span>
							</div>
							<span class="text-sm" style="color: {themeColor.lightText};">Free</span>
						</div>
						<div class="mt-3 text-left">
							<p class="mb-1 text-sm" style="color: {themeColor.lightText};">Registration Emails</p>
							<p class="text-xs leading-relaxed" style="color: {themeColor.lightText};">
								Customize the emails sent when a guest registers for the event.
							</p>
						</div>
					</button>

					<!-- Admin Module -->
					<button
						class="relative block cursor-not-allowed rounded-lg border-2 p-4 opacity-60"
						style="background-color: {themeColor.bg}; border-color: {themeColor.toggle};"
						on:click={() => (selectedTicket = 'admin')}
					>
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium" style="color: {themeColor.text};">Admin Module</span>
							<span class="text-sm" style="color: {themeColor.lightText};">Free</span>
						</div>
						<p class="mt-2 text-left text-xs" style="color: {themeColor.lightText};">
							Sales ended Oct 22, 2024, 11:59 PM
						</p>
					</button>
				</div>

				<!-- Sign-in -->
				<div class="mb-4 flex items-center gap-3 rounded-lg px-5 py-3" style="background-color: {themeColor.bg};">
					<img src="/john-avatar.svg" alt="avatar" class="size-6 rounded-full" />
					<span class="text-sm" style="color: {themeColor.lightText};">
						<strong class="mr-2" style="color: {themeColor.text};">SIGN-IN</strong> For one-click registration
					</span>
				</div>

				<!-- Request Button -->
				<div class="px-5 pb-5">
					<button
						class="w-full cursor-pointer rounded-lg px-4 py-2.5 text-base font-medium transition-colors"
						style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
						on:click={() => (showAddModal = true)}
					>
						Request to Get In
					</button>
					<RegistrationModal bind:open={showAddModal} />
				</div>
			</div>

			<!-- About Event -->
			<div class="mb-5 max-w-2xl rounded-2xl" style="background-color: {themeColor.cover};">
				<div class="mb-4 flex items-center gap-2 border-b p-5" style="border-color: {themeColor.toggle};">
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: {themeColor.lightText};">
						<path d="M10.8446 19H6.11242C1.82978 19 0 16.9498 0 12.1512V6.84884C0 2.05023 1.82978 0 6.11242 0H10.0559C10.3793 0 10.6474 0.300465 10.6474 0.662791C10.6474 1.02512 10.3793 1.32558 10.0559 1.32558H6.11242C2.47652 1.32558 1.18305 2.77488 1.18305 6.84884V12.1512C1.18305 16.2251 2.47652 17.6744 6.11242 17.6744H10.8446C14.4805 17.6744 15.774 16.2251 15.774 12.1512V7.73256C15.774 7.37023 16.0421 7.06977 16.3655 7.06977C16.6889 7.06977 16.957 7.37023 16.957 7.73256V12.1512C16.957 16.9498 15.1272 19 10.8446 19Z" fill="currentColor"/>
						<path d="M16.364 8.39502H13.2092C10.5119 8.39502 9.46289 7.21967 9.46289 4.19735V0.662463C9.46289 0.397346 9.60486 0.149905 9.82569 0.0526953C10.0465 -0.0533512 10.2989 0.00850933 10.4724 0.194091L16.782 7.26386C16.9476 7.44944 17.0029 7.74107 16.9082 7.98851C16.8136 8.23595 16.6006 8.39502 16.364 8.39502ZM10.6459 2.262V4.19735C10.6459 6.47735 11.1744 7.06944 13.2092 7.06944H14.9365L10.6459 2.262Z" fill="currentColor"/>
					</svg>
					<h2 class="text-lg font-medium" style="color: {themeColor.text};">About Event</h2>
				</div>
				<div class="mb-6 px-5">
					<h3 class="mb-3 text-lg font-semibold" style="color: {themeColor.text};">Send Newsletters</h3>
					<p class="text-sm font-light leading-relaxed" style="color: {themeColor.lightText};">
						When guests subscribe to your Calendar, you'll be able to send them newsletters.
					</p>
				</div>
				<div class="px-5 pb-5">
					<h3 class="mb-3 text-lg font-semibold" style="color: {themeColor.text};">Highlight Community Events</h3>
					<p class="text-sm font-light leading-relaxed" style="color: {themeColor.lightText};">
						You can add events from other Calendars and even from other websites. This is a perfect way to highlight events created by your community.
					</p>
				</div>
			</div>

			<!-- Location -->
			<div class="mb-5 max-w-2xl rounded-2xl pb-5" style="background-color: {themeColor.cover};">
				<h2 class="mb-3 border-b px-5 py-3 text-lg font-medium" style="color: {themeColor.text}; border-color: {themeColor.toggle};">Location</h2>
				<div class="px-5">
					<h3 class="mb-1 text-base font-medium" style="color: {themeColor.text};">Workstation</h3>
					<p class="text-sm font-normal" style="color: {themeColor.lightText};">
						7 Ibiyinka Olorunbe, Victoria Island, Lagos 101241, Lagos, Nigeria
					</p>
				</div>
				<div class="mt-3 h-48 w-full px-5">
					<iframe
						title="map location"
						src="https://www.google.com/maps?q=7%20Ibiyinka%20Olorunbe,%20Victoria%20Island,%20Lagos,%20Nigeria&output=embed&z=14"
						width="100%"
						height="100%"
						style="border:0; border-radius: 12px;"
						allowfullscreen={true}
						loading="lazy"
						referrerpolicy="no-referrer-when-downgrade"
					></iframe>
				</div>
			</div>

			<!-- Mobile: Presented By + Organized By -->
			<div class="md:hidden">
				<div class="mb-4 rounded-2xl p-4" style="background-color: {themeColor.cover};">
					<div class="flex items-center justify-between gap-3">
						<div class="flex gap-3">
							<img src="/present.svg" alt="host" class="size-9 rounded-[9px]" />
							<div>
								<p class="text-xs" style="color: {themeColor.lightText};">Presented by</p>
								<h2 class="text-sm font-medium" style="color: {themeColor.text};">💰 Get Funded! Offi...</h2>
							</div>
						</div>
						<button
							class="rounded-full px-3 py-2 text-sm"
							style="background-color: {themeColor.smallCover}; color: {themeColor.text};"
						>Subscribe</button>
					</div>
					<p class="mt-3 text-sm font-light leading-6" style="color: {themeColor.lightText};">
						Empowering transformational change in entrepreneurs and driven professionals.
					</p>
				</div>

				<div class="rounded-[16px] p-4" style="background-color: {themeColor.cover};">
					<h3 class="mb-4 border-b pb-2 text-sm font-normal" style="color: {themeColor.lightText}; border-color: {themeColor.toggle};">
						Organized By
					</h3>
					<div class="space-y-3">
						{#each organizer as or}
							<OrganiserList organizerName={or.name} organizerAvatar={or.avatar} organizerSocial={or.social} />
						{/each}
					</div>
					<div class="mt-6">
						<h3 class="mb-4 border-b pb-2 text-sm font-normal" style="color: {themeColor.lightText}; border-color: {themeColor.toggle};">
							119 Attending
						</h3>
						<div class="space-y-2">
							<div class="relative flex items-center gap-1">
								<img src="/ppp.svg" alt="Attendees" class="h-auto w-auto" />
								<span class="absolute left-10 top-0 rounded-full border px-2 py-1 text-xs" style="background-color: {themeColor.smallCover}; color: {themeColor.lightText}; border-color: {themeColor.toggle};">+59</span>
							</div>
							<p class="max-w-[334px] text-sm" style="color: {themeColor.lightText};">Tucker Cohen, Gabriel Funsho, Bbloloa, and 116 others</p>
						</div>
					</div>
					<div class="mt-6 flex flex-col space-y-2 mb-4">
						<a href="#" class="text-sm" style="color: {themeColor.lightText};">Contact the Organizer</a>
						<a href="#" class="text-sm" style="color: {themeColor.lightText};">Report Event</a>
					</div>
					<div class="w-fit rounded-full border px-2 py-1 text-xs" style="border-color: {themeColor.toggle}; color: {themeColor.lightText};">
						<span class="mr-1">#</span>AI
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
