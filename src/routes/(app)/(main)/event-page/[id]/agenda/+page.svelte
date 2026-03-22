<script lang="ts">
	import { page } from '$app/stores';
	import { getEventTheme } from '$lib/stores/eventTheme';
	import type { Color } from '$lib/utils/colors';
	import { colors } from '$lib/utils/colors';

	let themeColor: Color = colors[0];
	$: {
		const match = $page.url.pathname.match(/^\/event-page\/([^/]+)/);
		if (match) themeColor = getEventTheme(match[1]);
	}

	const sessions = [
		{
			date: 'Fri, Oct. 10th',
			items: [
				{
					time: '9:00 AM – 10:00 AM',
					title: 'Opening Keynote: The Future of AI',
					location: 'Grand Ballroom',
					speaker: 'Dr. Anya Sharma',
					tag: 'AI Expert',
					bio: 'A leading voice in artificial intelligence research with 15+ years of industry experience.'
				},
				{
					time: '10:30 AM – 11:30 AM',
					title: 'Panel: Blockchain Beyond Cryptocurrencies',
					location: 'Innovation Lab A',
					speaker: 'David Kim',
					tag: 'Blockchain',
					bio: 'Full-stack Blockchain Developer and open-source contributor.'
				},
				{
					time: '2:00 PM – 3:00 PM',
					title: 'Workshop: Building Scalable APIs',
					location: 'Workshop Room B',
					speaker: 'Sarah Okonkwo',
					tag: 'Engineering',
					bio: 'Senior backend engineer at a Fortune 500 company.'
				}
			]
		},
		{
			date: 'Sat, Oct. 11th',
			items: [
				{
					time: '9:30 AM – 10:30 AM',
					title: 'Startup Pitch Competition',
					location: 'Main Stage',
					speaker: 'Multiple Speakers',
					tag: 'Startups',
					bio: 'Top 10 startups pitch to a panel of investors and industry leaders.'
				},
				{
					time: '1:00 PM – 2:00 PM',
					title: 'Closing Ceremony & Networking',
					location: 'Grand Ballroom',
					speaker: 'Event Hosts',
					tag: 'Networking',
					bio: 'Wrap-up session with awards, announcements, and open networking.'
				}
			]
		}
	];

	let expandedDates: Record<string, boolean> = { 'Fri, Oct. 10th': true };

	function toggleDate(date: string) {
		expandedDates[date] = !expandedDates[date];
		expandedDates = { ...expandedDates };
	}
</script>

<div class="w-full max-w-4xl">
	<!-- Header -->
	<div class="mb-6 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold" style="color: {themeColor.text};">Event Agenda</h1>
			<p class="mt-1 text-sm" style="color: {themeColor.lightText};">
				Sessions and schedule for Megaexe Party
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<button
				class="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-xs font-medium transition-colors"
				style="background-color: {themeColor.cover}; color: {themeColor.text}; border: 1px solid {themeColor.toggle};"
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				Sync with Calendar
			</button>
			<button
				class="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-xs font-medium transition-colors"
				style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M15 12C15 13.66 13.66 15 12 15C10.34 15 9 13.66 9 12C9 10.34 10.34 9 12 9C13.66 9 15 10.34 15 12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M12 20.27C15.53 20.27 18.82 18.19 21.11 14.59C22.01 13.18 22.01 10.81 21.11 9.4C18.82 5.8 15.53 3.72 12 3.72C8.47 3.72 5.18 5.8 2.89 9.4C1.99 10.81 1.99 13.18 2.89 14.59C5.18 18.19 8.47 20.27 12 20.27Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				Preview Public Agenda
			</button>
		</div>
	</div>

	<!-- Session Groups -->
	<div class="flex flex-col gap-4">
		{#each sessions as group}
			<div class="overflow-hidden rounded-2xl" style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};">
				<!-- Date Header -->
				<button
					class="flex w-full items-center justify-between px-5 py-4 text-left transition-colors"
					style="background-color: {themeColor.smallCover};"
					on:click={() => toggleDate(group.date)}
				>
					<div class="flex items-center gap-2">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: {themeColor.text};">
							<path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
						<span class="font-semibold" style="color: {themeColor.text};">{group.date}</span>
						<span class="rounded-full px-2 py-0.5 text-xs" style="background-color: {themeColor.toggle}; color: {themeColor.text};">
							{group.items.length} sessions
						</span>
					</div>
					<svg
						width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
						style="color: {themeColor.lightText}; transform: rotate({expandedDates[group.date] ? '180deg' : '0deg'}); transition: transform 0.2s;"
					>
						<path d="M19 9L12 15L5 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>

				<!-- Session Cards -->
				{#if expandedDates[group.date]}
					<div class="flex flex-col gap-3 p-4">
						{#each group.items as session}
							<div
								class="flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:gap-5"
								style="background-color: {themeColor.bg}; border: 1px solid {themeColor.toggle};"
							>
								<!-- Time -->
								<div class="min-w-[130px]">
									<span class="text-xs font-medium" style="color: {themeColor.lightText};">{session.time}</span>
								</div>

								<!-- Content -->
								<div class="flex flex-1 flex-col gap-2">
									<h3 class="text-sm font-semibold" style="color: {themeColor.text};">{session.title}</h3>

									<div class="flex flex-wrap items-center gap-3 text-xs" style="color: {themeColor.lightText};">
										<span class="flex items-center gap-1">
											<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M12 13.43C13.7231 13.43 15.12 12.0331 15.12 10.31C15.12 8.58687 13.7231 7.19 12 7.19C10.2769 7.19 8.88 8.58687 8.88 10.31C8.88 12.0331 10.2769 13.43 12 13.43Z" stroke="currentColor" stroke-width="1.5"/>
												<path d="M3.62 8.49C5.59 -0.169998 18.42 -0.159997 20.38 8.5C21.53 13.58 18.37 17.88 15.6 20.54C13.59 22.48 10.41 22.48 8.39 20.54C5.63 17.88 2.47 13.57 3.62 8.49Z" stroke="currentColor" stroke-width="1.5"/>
											</svg>
											{session.location}
										</span>
									</div>

									<!-- Speaker -->
									<div class="mt-1 flex flex-wrap items-start gap-3 rounded-lg p-3" style="background-color: {themeColor.cover};">
										<div class="flex items-center gap-2">
											<div class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold" style="background-color: {themeColor.toggle}; color: {themeColor.text};">
												{session.speaker.charAt(0)}
											</div>
											<span class="text-xs font-medium" style="color: {themeColor.text};">{session.speaker}</span>
											<span class="rounded-full px-2 py-0.5 text-xs" style="background-color: {themeColor.smallCover}; color: {themeColor.lightText};">{session.tag}</span>
										</div>
										<p class="w-full text-xs leading-relaxed" style="color: {themeColor.lightText};">{session.bio}</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
