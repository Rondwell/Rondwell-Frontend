<script lang="ts">
	import {
		addAttendeeTag as addAttendeeTagApi,
		getAttendeeDetail,
		getAttendeeTimeline,
		removeAttendeeTag
	} from '$lib/services/event.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import CreateTagModal from './CreateTagModal.svelte';
	import EditStatus from './EditStatus.svelte';
	import ReportAttendeeModal from './ReportAttendeeModal.svelte';
	import ResendEmailModal from './ResendEmailModal.svelte';

	export let open = false;
	export let attendeeId = '';
	export let eventId = '';
	export let attendeeData: any = null; // basic data from the list — shown instantly

	let showEditStatus = false;
	let showReportModal = false;
	let showCreateTagModal = false;
	let showResendEmailModal = false;
	let showViewEmail: any = null;

	// Detail data (loaded async)
	let detailLoading = true;
	let timelineLoading = true;
	let attendee: any = {};
	let registration: any = null;
	let formAnswers: Array<{ question: string; answer: string; fieldType: string }> = [];
	let ticketTypeName = '';
	let timeline: any[] = [];

	// Cache to avoid re-fetching
	const detailCache = new Map<string, any>();
	const timelineCache = new Map<string, any[]>();

	$: if (open && attendeeId && eventId) {
		initModal();
	}

	function initModal() {
		// Use attendeeData from list for instant display
		if (attendeeData) {
			attendee = attendeeData;
		}

		// Check cache first
		if (detailCache.has(attendeeId)) {
			const cached = detailCache.get(attendeeId);
			attendee = cached.attendee;
			registration = cached.registration;
			formAnswers = cached.formAnswers;
			ticketTypeName = cached.ticketTypeName;
			detailLoading = false;
		} else {
			detailLoading = true;
			loadDetail();
		}

		if (timelineCache.has(attendeeId)) {
			timeline = timelineCache.get(attendeeId) || [];
			timelineLoading = false;
		} else {
			timelineLoading = true;
			loadTimeline();
		}
	}

	async function loadDetail() {
		try {
			const detail = await getAttendeeDetail(eventId, attendeeId);
			attendee = detail.attendee;
			registration = detail.registration;
			formAnswers = detail.formAnswers;
			ticketTypeName = detail.ticketTypeName;
			detailCache.set(attendeeId, detail);
		} catch (e) { console.error('Failed to load detail:', e); }
		finally { detailLoading = false; }
	}

	async function loadTimeline() {
		try {
			timeline = await getAttendeeTimeline(eventId, attendeeId);
			timelineCache.set(attendeeId, timeline);
		} catch (e) { console.error('Failed to load timeline:', e); }
		finally { timelineLoading = false; }
	}

	async function handleRemoveTag(tagName: string) {
		try {
			await removeAttendeeTag(eventId, attendeeId, tagName);
			attendee.tags = attendee.tags.filter((t: string) => t !== tagName);
			attendee = attendee;
			detailCache.delete(attendeeId);
		} catch (e) { console.error(e); }
	}

	async function handleTagAssigned(e: CustomEvent<{ tagName: string }>) {
		try {
			await addAttendeeTagApi(eventId, attendeeId, e.detail.tagName);
			if (!attendee.tags?.includes(e.detail.tagName)) {
				attendee.tags = [...(attendee.tags || []), e.detail.tagName];
			}
			detailCache.delete(attendeeId);
		} catch (err) { console.error(err); }
	}

	function handleStatusUpdated() {
		detailCache.delete(attendeeId);
		timelineCache.delete(attendeeId);
		detailLoading = true;
		timelineLoading = true;
		loadDetail();
		loadTimeline();
	}

	function getStatusColor(s: string) {
		switch (s) {
			case 'CHECKED_IN': case 'ATTENDING': return { bg: '#E3F4E1', text: '#3CBD2C' };
			case 'PENDING': case 'WAITLISTED': return { bg: '#F4ECDA', text: '#D79B1B' };
			case 'DECLINED': return { bg: '#FEF3F2', text: '#D92D20' };
			default: return { bg: '#DCDCDC', text: '#A9AAAA' };
		}
	}
	function getStatusLabel(s: string) {
		const m: Record<string,string> = { CHECKED_IN:'Checked-In', ATTENDING:'Attending', PENDING:'Pending', WAITLISTED:'Waitlisted', DECLINED:'Declined', UNREGISTERED:'Unregistered', UNAPPROVED:'Unapproved' };
		return m[s] || s;
	}
	function formatTime(iso: string) {
		if (!iso) return '';
		const d = new Date(iso);
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
	}
	function getTimelineIcon(type: string) {
		if (type === 'checkedIn') return { svg: true, src: '/checked In.svg' };
		if (type === 'uncheckedIn') return { svg: true, src: '/Unchecked In.svg' };
		if (type === 'email') return { bg: '#ECECEC', color: '#A9AAAA' };
		if (type === 'registered') return { bg: '#DFF1DE', color: '#3CBD2C' };
		if (type === 'invited') return { bg: '#F4ECDA', color: '#EAAB26' };
		if (type === 'payment') return { bg: '#DFF1DE', color: '#3CBD2C' };
		if (type === 'report') return { bg: '#FEF3F2', color: '#D92D20' };
		return { bg: '#ECECEC', color: '#A9AAAA' };
	}

	$: statusColors = getStatusColor(attendee?.guestStatus || '');
	$: attendeeName = `${attendee?.firstName || ''} ${attendee?.lastName || ''}`.trim() || 'Anonymous';
</script>

{#if open}
	<div on:click={() => (open = false)} on:keydown={(e) => e.key === 'Escape' && (open = false)}
		class="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-5 lg:justify-end lg:p-0 lg:pr-10"
		role="dialog" aria-modal="true" tabindex="-1">
		<div class="flex h-full w-full max-w-xl flex-col rounded-xl bg-[#F4F5F6] shadow-xl lg:max-w-lg lg:rounded-none"
			role="document" on:click|stopPropagation on:keydown|stopPropagation>

			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<button aria-label="Close" on:click={() => (open = false)}>
					<Icon icon="mdi:chevron-double-right" class="text-lg text-gray-500" />
				</button>
				<div class="flex items-center gap-2">
					<button aria-label="Previous" class="rounded-md bg-[#F0F1F1] p-1.5 text-[#68696B] transition hover:bg-gray-200">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
					</button>
					<button aria-label="Next" class="rounded-md bg-[#F0F1F1] p-1.5 text-[#68696B] transition hover:bg-gray-200">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 -rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
					</button>
				</div>
			</div>

			<!-- Content -->
			<div class="custom-scrollbar flex-1 overflow-y-auto px-6 pt-5 pb-6">
				<!-- Attendee Info (always visible immediately) -->
				<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div class="flex items-center gap-3">
						<img src={attendee?.profilePictureUrl || '/rondwell-attendee.png'} alt="" class="h-11 w-11 rounded-full object-cover" on:error={(e) => { (e.currentTarget as HTMLImageElement).src = '/rondwell-attendee.png'; }} />
						<div>
							<p class="font-semibold text-gray-900">{attendeeName}</p>
							<p class="text-xs text-gray-400">{attendee?.email || ''}</p>
						</div>
					</div>
					<div class="relative" use:clickOutside={() => { showEditStatus = false; }}>
						<button class="flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium"
							style="background-color: {statusColors.bg}; color: {statusColors.text}"
							on:click={() => (showEditStatus = !showEditStatus)}>
							{getStatusLabel(attendee?.guestStatus || '')}
							<img src="/edit.svg" alt="" class="h-3 w-3" />
						</button>
						<EditStatus bind:open={showEditStatus} attendee={{ ...attendee, name: attendeeName, status: attendee?.guestStatus }} {eventId} on:updated={handleStatusUpdated} />
					</div>
				</div>

				<!-- Registration Info -->
				{#if detailLoading}
					<div class="mt-5 flex items-center gap-6">
						<div class="h-10 w-28 animate-pulse rounded bg-gray-200"></div>
						<div class="h-10 w-20 animate-pulse rounded bg-gray-200"></div>
						<div class="h-10 w-28 animate-pulse rounded bg-gray-200"></div>
					</div>
					<div class="mt-5 flex gap-2">
						<div class="h-7 w-20 animate-pulse rounded-full bg-gray-200"></div>
						<div class="h-7 w-16 animate-pulse rounded-full bg-gray-200"></div>
					</div>
				{:else}
					<div class="mt-5 flex flex-wrap items-center gap-6">
						<div class="border-r border-gray-200 pr-6">
							<p class="text-xs text-[#C1C2C2]">Registration Time</p>
							<p class="text-sm font-semibold text-black">{formatTime(registration?.registered_at || attendee?.createdAt)}</p>
						</div>
						<div class="border-r border-gray-200 pr-6">
							<p class="text-xs text-[#C1C2C2]">Amount Paid</p>
							<p class="text-sm font-semibold text-black">$0.00</p>
						</div>
						{#if ticketTypeName}
							<div>
								<p class="text-xs text-[#C1C2C2]">Ticket Type</p>
								<p class="text-sm font-semibold text-black">{ticketTypeName}</p>
							</div>
						{/if}
					</div>

					<!-- Tags -->
					<div class="mt-5 flex flex-wrap items-center gap-2">
						<button class="flex items-center rounded-2xl bg-[#EFEFEF] px-2 py-0.5 text-xs text-[#A0A1A3] transition hover:bg-gray-200"
							on:click={() => (showCreateTagModal = true)}>
							<Icon icon="mdi:plus" class="text-lg" /> Add Tag
						</button>
						{#each attendee?.tags || [] as tag}
							<button class="rounded-[22px] bg-[#F4ECDA] px-2.5 py-1 text-xs font-medium text-[#D79B1B]">
								{tag} <span class="ml-1 cursor-pointer font-semibold" on:click|stopPropagation={() => handleRemoveTag(tag)}>×</span>
							</button>
						{/each}
					</div>
				{/if}

				<!-- Registration Questions -->
				{#if detailLoading}
					<div class="mt-6 border-t border-gray-200 pt-6">
						<div class="flex items-center justify-between">
							<div class="h-5 w-40 animate-pulse rounded bg-gray-200"></div>
							<div class="h-6 w-14 animate-pulse rounded bg-gray-200"></div>
						</div>
						<div class="mt-4 flex flex-col gap-4">
							{#each Array(4) as _}
								<div>
									<div class="h-4 w-48 animate-pulse rounded bg-gray-200"></div>
									<div class="mt-2 h-4 w-24 animate-pulse rounded bg-gray-200"></div>
								</div>
							{/each}
						</div>
					</div>
				{:else if formAnswers.length > 0}
					<div class="mt-6 border-t border-gray-200 pt-6">
						<div class="flex items-center justify-between">
							<h3 class="font-semibold text-gray-900">Registration Questions</h3>
							<button class="flex items-center gap-1 rounded-md bg-[#EFEFEF] px-3 py-1 text-xs text-[#A9AAAA] transition hover:bg-gray-200">
								<img src="/edit.svg" alt="" class="h-3 w-3" /> Edit
							</button>
						</div>
						<div class="mt-4 flex flex-col gap-4">
							{#each formAnswers as item}
								<div>
									<p class="text-sm text-[#B6B8BA]">{item.question}</p>
									{#if item.answer}
										{#if item.answer.startsWith('http')}
											<a href={item.answer} target="_blank" rel="noopener" class="mt-1 text-sm font-medium text-[#D92D20] break-all">{item.answer}</a>
										{:else}
											<p class="mt-1 text-sm font-medium text-gray-800">{item.answer}</p>
										{/if}
									{:else}
										<p class="mt-1 text-xs text-[#B6B8BA]">──</p>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Timeline -->
				{#if timelineLoading}
					<div class="mt-6 border-t border-gray-200 pt-6">
						<div class="mb-4 h-5 w-20 animate-pulse rounded bg-gray-200"></div>
						{#each Array(4) as _}
							<div class="mt-4 flex items-start gap-3">
								<div class="h-[30px] w-[30px] animate-pulse rounded-full bg-gray-200"></div>
								<div class="flex-1">
									<div class="h-4 w-40 animate-pulse rounded bg-gray-200"></div>
									<div class="mt-1 h-3 w-52 animate-pulse rounded bg-gray-200"></div>
								</div>
							</div>
						{/each}
					</div>
				{:else if timeline.length > 0}
					<div class="mt-6 border-t border-gray-200 pt-6">
						<h3 class="mb-4 font-semibold text-gray-900">Timeline</h3>
						{#each timeline as item, i (item.id)}
							{@const iconInfo = getTimelineIcon(item.type)}
							<div class="relative mt-4 flex items-start gap-3">
								{#if i < timeline.length - 1}
									<div class="absolute top-[30px] left-[14px] h-[calc(100%+2px)] w-0.5 bg-gray-200"></div>
								{/if}
								{#if iconInfo.svg}
									<div class="z-10 flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center">
										<img src={iconInfo.src} alt={item.type} class="h-[30px] w-[30px]" />
									</div>
								{:else}
									<div class="z-10 flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full" style="background-color: {iconInfo.bg}">
										{#if item.type === 'email'}
											<svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M11.5761 5.52693V8.15778C11.5761 9.99937 10.5238 10.7886 8.94526 10.7886H3.68358C2.10507 10.7886 1.05273 9.99937 1.05273 8.15778V4.47459C1.05273 2.633 2.10507 1.84375 3.68358 1.84375H7.36676" stroke={iconInfo.color} stroke-width="1.18388" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
												<path d="M3.68359 4.73438L5.3305 6.0498C5.87246 6.48126 6.76168 6.48126 7.30364 6.0498L7.92451 5.5552" stroke={iconInfo.color} stroke-width="1.18388" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
												<path d="M10.2607 4.20897C10.9872 4.20897 11.5762 3.62003 11.5762 2.89355C11.5762 2.16706 10.9872 1.57812 10.2607 1.57812C9.53425 1.57812 8.94531 2.16706 8.94531 2.89355C8.94531 3.62003 9.53425 4.20897 10.2607 4.20897Z" stroke={iconInfo.color} stroke-width="1.18388" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
											</svg>
										{:else if item.type === 'registered'}
											<svg width="16" height="16" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M9.76566 13.4154C9.53926 13.4154 9.31286 13.3125 9.14306 13.1509L7.36017 11.2995C7.02057 10.9469 7.02057 10.3591 7.36017 10.0065C7.69977 9.65385 8.26577 9.65385 8.60536 10.0065L9.76566 11.2114L12.7089 8.15511C13.0485 7.80246 13.6144 7.80246 13.954 8.15511C14.2936 8.50775 14.2936 9.09549 13.954 9.44814L10.3883 13.1509C10.2185 13.3272 9.99206 13.4154 9.76566 13.4154Z" fill={iconInfo.color}/>
												<path d="M17.3158 11.0941C17.3158 9.86879 18.3102 8.87433 19.5355 8.87433V7.98642C19.5355 4.43478 18.6476 3.54688 15.096 3.54688H6.21689C2.66525 3.54688 1.77734 4.43478 1.77734 7.98642V8.43038C3.00266 8.43038 3.99712 9.42484 3.99712 10.6502C3.99712 11.8755 3.00266 12.8699 1.77734 12.8699V13.3139C1.77734 16.8655 2.66525 17.7534 6.21689 17.7534H15.096C18.6476 17.7534 19.5355 16.8655 19.5355 13.3139C18.3102 13.3139 17.3158 12.3194 17.3158 11.0941Z" stroke={iconInfo.color} stroke-width="1.57851" stroke-linecap="round" stroke-linejoin="round"/>
											</svg>
										{:else if item.type === 'invited'}
											<Icon icon="mdi:email-send-outline" class="text-sm" style="color: {iconInfo.color}" />
										{:else if item.type === 'payment'}
											<Icon icon="mdi:credit-card-check-outline" class="text-sm" style="color: {iconInfo.color}" />
										{:else if item.type === 'report'}
											<Icon icon="mdi:flag-outline" class="text-sm" style="color: {iconInfo.color}" />
										{:else}
											<Icon icon="mdi:account-convert-outline" class="text-sm" style="color: {iconInfo.color}" />
										{/if}
									</div>
								{/if}
								<div class="flex-1">
									<p class="font-semibold text-gray-700">{item.title}</p>
									{#if item.subtitle}<p class="text-xs text-gray-400">{item.subtitle}</p>{/if}
									<p class="mt-1 text-xs text-gray-300 uppercase">{formatTime(item.time)}{item.actor ? ` – ${item.actor}` : ''}</p>
								</div>
								{#if item.metadata?.canResend || item.type === 'email'}
									<div class="relative" use:clickOutside={() => { if (showViewEmail === item.id) showViewEmail = null; }}>
										<button aria-label="More" on:click={() => (showViewEmail = showViewEmail === item.id ? null : item.id)} class="text-gray-400 transition hover:text-gray-600">
											<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4"><path d="M6 12a2 2 0 114 0 2 2 0 01-4 0zm5 0a2 2 0 114 0 2 2 0 01-4 0zm5 0a2 2 0 114 0 2 2 0 01-4 0z" /></svg>
										</button>
										{#if showViewEmail === item.id}
											<div class="absolute top-0 right-6 z-10">
												{#if item.metadata?.canResend}
													<button on:click={() => { showResendEmailModal = true; showViewEmail = null; }} class="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-white bg-[#F0F0F0] px-3 py-2 text-xs shadow-sm transition hover:bg-gray-200">
														<img src="/resend email.svg" alt="" class="h-4 w-4" /> Resend Confirmation Email
													</button>
												{:else}
													<button class="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-white bg-[#F0F0F0] px-3 py-2 text-xs shadow-sm transition hover:bg-gray-200">
														<Icon icon="mdi:eye-outline" class="text-sm text-gray-500" /> View Email
													</button>
												{/if}
											</div>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-between border-t border-gray-200 px-6 py-4">
				<button on:click={() => (showReportModal = true)} class="text-xs font-semibold text-[#A6A7A7] transition hover:text-gray-600">Report Attendee</button>
				<span class="text-xs text-[#C1C2C2]">{registration?.checkinDetails?.checkinLocation?.resolvedAddress || ''}</span>
			</div>
		</div>
	</div>
{/if}

<ReportAttendeeModal bind:open={showReportModal} {eventId} {attendeeId} />
<CreateTagModal bind:open={showCreateTagModal} {eventId} on:tagAssigned={handleTagAssigned} />
<ResendEmailModal bind:open={showResendEmailModal} email={attendee?.email || ''} />
