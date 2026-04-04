<script lang="ts">
	import {
		addAttendeeTag as addAttendeeTagApi,
		getAttendeeDetail,
		getAttendeeTimeline,
		removeAttendeeTag,
		updateAttendeeStatus
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
	let showDeleteConfirm = false;
	let deleting = false;
	let approving = false;
	let declining = false;

	// Detail data (loaded async)
	let detailLoading = true;
	let timelineLoading = true;
	let attendee: any = {};
	let registration: any = null;
	let formAnswers: Array<{ question: string; answer: string; fieldType: string }> = [];
	let ticketTypeName = '';
	let ticketPrice = 0;
	let ticketCurrency = 'NGN';
	let seatInfo: any = null;
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

		// Always fetch fresh data (clear cache for this attendee)
		detailCache.delete(attendeeId);
		timelineCache.delete(attendeeId);

		detailLoading = true;
		loadDetail();

		timelineLoading = true;
		loadTimeline();
	}

	async function loadDetail() {
		try {
			const detail = await getAttendeeDetail(eventId, attendeeId);
			attendee = detail.attendee;
			registration = detail.registration;
			formAnswers = detail.formAnswers;
			ticketTypeName = detail.ticketTypeName;
			ticketPrice = detail.ticketPrice || 0;
			ticketCurrency = detail.ticketCurrency || 'NGN';
			seatInfo = detail.seatInfo || null;
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

	async function handleApprove() {
		approving = true;
		try {
			await updateAttendeeStatus(eventId, attendeeId, 'ATTENDING', true);
			handleStatusUpdated();
		} catch (e: any) {
			console.error('Failed to approve attendee:', e);
		} finally {
			approving = false;
		}
	}

	async function handleDecline() {
		declining = true;
		try {
			await updateAttendeeStatus(eventId, attendeeId, 'DECLINED', true);
			handleStatusUpdated();
		} catch (e: any) {
			console.error('Failed to decline attendee:', e);
		} finally {
			declining = false;
		}
	}

	async function handleDeleteAttendee() {
		deleting = true;
		try {
			const { deleteAttendee } = await import('$lib/services/event.services');
			await deleteAttendee(eventId, attendeeId);
			open = false;
			window.location.reload();
		} catch (e: any) {
			console.error('Failed to delete attendee:', e);
		} finally {
			deleting = false;
			showDeleteConfirm = false;
		}
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

	$: statusColors = getStatusColor(attendee?.attendeeStatus || '');
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
							{getStatusLabel(attendee?.attendeeStatus || '')}
							<img src="/edit.svg" alt="" class="h-3 w-3" />
						</button>
						<EditStatus bind:open={showEditStatus} attendee={{ ...attendee, name: attendeeName, status: attendee?.attendeeStatus }} {eventId} on:updated={handleStatusUpdated} />
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
							<p class="text-sm font-semibold text-black">
								{ticketPrice > 0
									? new Intl.NumberFormat('en-NG', { style: 'currency', currency: ticketCurrency, minimumFractionDigits: 0 }).format(ticketPrice)
									: 'Free'}
							</p>
						</div>
						{#if ticketTypeName}
							<div class="border-r border-gray-200 pr-6">
								<p class="text-xs text-[#C1C2C2]">Ticket Type</p>
								<p class="text-sm font-semibold text-black">{ticketTypeName}</p>
							</div>
						{/if}
						{#if registration?.checked_in_at}
							<div class="border-r border-gray-200 pr-6">
								<p class="text-xs text-[#C1C2C2]">Checked-in Time</p>
								<p class="text-sm font-semibold text-black">{formatTime(registration.checked_in_at)}</p>
							</div>
						{/if}
						{#if registration?.event_passcode}
							<div>
								<p class="text-xs text-[#C1C2C2]">Event Passcode</p>
								<p class="text-sm font-semibold font-mono text-black">{registration.event_passcode}</p>
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

				<!-- Approve/Decline buttons for UNAPPROVED attendees -->
				{#if attendee?.attendeeStatus === 'UNAPPROVED' && !detailLoading}
				<div class="mt-5 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
					<div class="flex-1">
						<p class="text-sm font-medium text-amber-800">Pending Approval</p>
						<p class="text-xs text-amber-600">This attendee is waiting for your approval to attend.</p>
					</div>
					<div class="flex gap-2">
						<button
							on:click={handleDecline}
							disabled={declining || approving}
							class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
						>
							{declining ? 'Declining...' : 'Decline'}
						</button>
						<button
							on:click={handleApprove}
							disabled={approving || declining}
							class="rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
						>
							{approving ? 'Approving...' : 'Approve'}
						</button>
					</div>
				</div>
				{/if}

				<!-- Seat Info -->
				{#if seatInfo && !detailLoading}
				<div class="mt-5 flex items-center gap-3 rounded-lg border border-gray-200 p-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18v-6a8 8 0 0116 0v6"/><path d="M2 18h20"/></svg>
					</div>
					<div>
						<p class="text-xs text-[#C1C2C2]">Assigned Seat</p>
						<p class="text-sm font-semibold text-gray-900">
							{seatInfo.seatNumber}{seatInfo.row ? ` · Row ${seatInfo.row}` : ''}{seatInfo.section ? ` · ${seatInfo.section}` : ''}
						</p>
					</div>
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
										{#if item.fieldType === 'CHECKBOX'}
											<p class="mt-1 text-sm font-medium text-gray-800">{item.answer === 'true' || item.answer === 'Yes' ? '✓ Yes' : '✗ No'}</p>
										{:else if item.fieldType === 'TERMS_CHECKBOX'}
											<p class="mt-1 text-sm font-medium text-green-700">{item.answer === 'true' ? '✓ Accepted' : item.answer}</p>
										{:else if item.answer.startsWith('http')}
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
				{:else if !registration}
					<div class="mt-6 border-t border-gray-200 pt-6">
						<div class="flex flex-col items-center gap-2 py-4 text-center">
							<p class="text-sm text-gray-400">No registration found for this attendee.</p>
							<p class="text-xs text-gray-300">This attendee was added but hasn't completed registration yet.</p>
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
				<div class="flex items-center gap-4">
					<button on:click={() => (showReportModal = true)} class="text-xs font-semibold text-[#A6A7A7] transition hover:text-gray-600">Report Attendee</button>
					<button on:click={() => (showDeleteConfirm = true)} class="text-xs font-semibold text-red-400 transition hover:text-red-600">Delete Attendee</button>
				</div>
				<span class="text-xs text-[#C1C2C2]">{registration?.checkinDetails?.checkinLocation?.resolvedAddress || ''}</span>
			</div>
		</div>
	</div>
{/if}

<ReportAttendeeModal bind:open={showReportModal} {eventId} {attendeeId} />
<CreateTagModal bind:open={showCreateTagModal} {eventId} on:tagAssigned={handleTagAssigned} />
<ResendEmailModal bind:open={showResendEmailModal} email={attendee?.email || ''} />

{#if showDeleteConfirm}
<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" on:click={() => showDeleteConfirm = false} on:keydown={(e) => e.key === 'Escape' && (showDeleteConfirm = false)} role="dialog" aria-modal="true" tabindex="-1">
	<div class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" on:click|stopPropagation on:keydown|stopPropagation role="document">
		<div class="flex flex-col items-center gap-4 text-center">
			<div class="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D92D20" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
			</div>
			<h3 class="text-lg font-semibold text-gray-900">Delete Attendee</h3>
			<p class="text-sm text-gray-500">This will permanently delete this attendee's registration, form answers, and seat assignment. Transaction records will be kept for audit purposes. This action cannot be undone.</p>
			<div class="mt-2 flex w-full gap-3">
				<button on:click={() => showDeleteConfirm = false} class="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">Cancel</button>
				<button on:click={handleDeleteAttendee} disabled={deleting} class="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50">
					{deleting ? 'Deleting...' : 'Delete'}
				</button>
			</div>
		</div>
	</div>
</div>
{/if}
