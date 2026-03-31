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
	import { createEventDispatcher } from 'svelte';
	import CreateTagModal from '../../components/CreateTagModal.svelte';
	import ReportAttendeeModal from '../../components/ReportAttendeeModal.svelte';
	import ResendEmailModal from '../../components/ResendEmailModal.svelte';

	export let open = false;
	export let attendeeId = '';
	export let eventId = '';
	export let attendeeData: any = null;

	const dispatch = createEventDispatcher();

	let showReportModal = false;
	let showCreateTagModal = false;
	let showResendEmailModal = false;
	let showViewEmail: any = null;
	let showUndoConfirm = false;
	let undoing = false;

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

	$: if (open && attendeeId && eventId) { initModal(); }

	function initModal() {
		if (attendeeData) attendee = attendeeData;
		detailLoading = true; timelineLoading = true;
		loadDetail(); loadTimeline();
	}

	async function loadDetail() {
		try {
			const d: any = await getAttendeeDetail(eventId, attendeeId);
			attendee = d.attendee; registration = d.registration; formAnswers = d.formAnswers;
			ticketTypeName = d.ticketTypeName; ticketPrice = d.ticketPrice || 0;
			ticketCurrency = d.ticketCurrency || 'NGN'; seatInfo = d.seatInfo || null;
		} catch (e) { console.error(e); }
		finally { detailLoading = false; }
	}

	async function loadTimeline() {
		try { timeline = await getAttendeeTimeline(eventId, attendeeId); }
		catch (e) { console.error(e); }
		finally { timelineLoading = false; }
	}

	async function handleUndoCheckIn() {
		undoing = true;
		try {
			await updateAttendeeStatus(eventId, attendeeId, 'ATTENDING');
			dispatch('undone');
			open = false;
		} catch (e) { console.error('Undo failed:', e); }
		finally { undoing = false; showUndoConfirm = false; }
	}

	async function handleRemoveTag(tagName: string) {
		try { await removeAttendeeTag(eventId, attendeeId, tagName); attendee.tags = attendee.tags.filter((t: string) => t !== tagName); attendee = attendee; } catch (e) { console.error(e); }
	}

	async function handleTagAssigned(e: CustomEvent<{ tagName: string }>) {
		try { await addAttendeeTagApi(eventId, attendeeId, e.detail.tagName); if (!attendee.tags?.includes(e.detail.tagName)) attendee.tags = [...(attendee.tags || []), e.detail.tagName]; } catch (err) { console.error(err); }
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
		const m: Record<string,string> = { CHECKED_IN:'Checked-In', ATTENDING:'Attending', PENDING:'Pending', WAITLISTED:'Waitlisted', DECLINED:'Declined' };
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
				<!-- Attendee Info -->
				<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div class="flex items-center gap-3">
						<img src={attendee?.profilePictureUrl || '/rondwell-attendee.png'} alt="" class="h-11 w-11 rounded-full object-cover"
							on:error={(e) => { (e.currentTarget as HTMLImageElement).src = '/rondwell-attendee.png'; }} />
						<div>
							<p class="font-semibold text-gray-900">{attendeeName}</p>
							<p class="text-xs text-gray-400">{attendee?.email || ''}</p>
						</div>
					</div>
					<span class="flex w-fit items-center gap-1 rounded-md px-3 py-1 text-xs font-medium"
						style="background-color: {statusColors.bg}; color: {statusColors.text}">
						{getStatusLabel(attendee?.attendeeStatus || '')}
					</span>
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
								{ticketPrice > 0 ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: ticketCurrency, minimumFractionDigits: 0 }).format(ticketPrice) : 'Free'}
							</p>
						</div>
						{#if ticketTypeName}
							<div><p class="text-xs text-[#C1C2C2]">Ticket Type</p><p class="text-sm font-semibold text-black">{ticketTypeName}</p></div>
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

				<!-- Seat Info -->
				{#if seatInfo && !detailLoading}
				<div class="mt-5 flex items-center gap-3 rounded-lg border border-gray-200 p-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18v-6a8 8 0 0116 0v6"/><path d="M2 18h20"/></svg>
					</div>
					<div>
						<p class="text-xs text-[#C1C2C2]">Assigned Seat</p>
						<p class="text-sm font-semibold text-gray-900">{seatInfo.seatNumber}{seatInfo.row ? ` · Row ${seatInfo.row}` : ''}{seatInfo.section ? ` · ${seatInfo.section}` : ''}</p>
					</div>
				</div>
				{/if}

				<!-- Registration Questions -->
				{#if detailLoading}
					<div class="mt-6 border-t border-gray-200 pt-6">
						<div class="flex items-center justify-between"><div class="h-5 w-40 animate-pulse rounded bg-gray-200"></div></div>
						<div class="mt-4 flex flex-col gap-4">
							{#each Array(3) as _}<div><div class="h-4 w-48 animate-pulse rounded bg-gray-200"></div><div class="mt-2 h-4 w-24 animate-pulse rounded bg-gray-200"></div></div>{/each}
						</div>
					</div>
				{:else if formAnswers.length > 0}
					<div class="mt-6 border-t border-gray-200 pt-6">
						<h3 class="font-semibold text-gray-900">Registration Questions</h3>
						<div class="mt-4 flex flex-col gap-4">
							{#each formAnswers as item}
								<div>
									<p class="text-sm text-[#B6B8BA]">{item.question}</p>
									{#if item.answer}
										{#if item.fieldType === 'CHECKBOX' || item.fieldType === 'TERMS_CHECKBOX'}
											<p class="mt-1 text-sm font-medium text-gray-800">{item.answer === 'true' || item.answer === 'Yes' ? '✓ Yes' : item.answer}</p>
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
				{/if}

				<!-- Timeline -->
				{#if timelineLoading}
					<div class="mt-6 border-t border-gray-200 pt-6">
						<div class="mb-4 h-5 w-20 animate-pulse rounded bg-gray-200"></div>
						{#each Array(4) as _}
							<div class="mt-4 flex items-start gap-3">
								<div class="h-[30px] w-[30px] animate-pulse rounded-full bg-gray-200"></div>
								<div class="flex-1"><div class="h-4 w-40 animate-pulse rounded bg-gray-200"></div><div class="mt-1 h-3 w-52 animate-pulse rounded bg-gray-200"></div></div>
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
											<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M11.576 5.527V8.158C11.576 10 10.524 10.789 8.945 10.789H3.684C2.105 10.789 1.053 10 1.053 8.158V4.475C1.053 2.633 2.105 1.844 3.684 1.844H7.367" stroke={iconInfo.color} stroke-width="1.18" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.684 4.734L5.33 6.05C5.872 6.481 6.762 6.481 7.304 6.05L7.925 5.555" stroke={iconInfo.color} stroke-width="1.18" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10.261" cy="2.894" r="1.316" stroke={iconInfo.color} stroke-width="1.18"/></svg>
										{:else if item.type === 'registered'}
											<svg width="16" height="16" viewBox="0 0 22 22" fill="none"><path d="M9.766 13.415a1.1 1.1 0 01-.623-.264L7.36 11.3a.78.78 0 011.245-.976l1.16 1.205 2.944-3.056a.78.78 0 011.245.976l-3.566 3.703a1.1 1.1 0 01-.623.264z" fill={iconInfo.color}/><path d="M17.316 11.094c0-1.225.994-2.22 2.22-2.22V7.986c0-3.551-.888-4.44-4.44-4.44H6.217c-3.551 0-4.44.889-4.44 4.44v.444c1.226 0 2.22.994 2.22 2.22s-.994 2.22-2.22 2.22v.444c0 3.551.889 4.44 4.44 4.44h8.879c3.551 0 4.44-.889 4.44-4.44-1.226 0-2.22-.994-2.22-2.22z" stroke={iconInfo.color} stroke-width="1.58" stroke-linecap="round" stroke-linejoin="round"/></svg>
										{:else if item.type === 'invited'}
											<Icon icon="mdi:email-send-outline" class="text-sm" style="color: {iconInfo.color}" />
										{:else if item.type === 'payment'}
											<Icon icon="mdi:credit-card-check-outline" class="text-sm" style="color: {iconInfo.color}" />
										{:else}
											<Icon icon="mdi:account-convert-outline" class="text-sm" style="color: {iconInfo.color}" />
										{/if}
									</div>
								{/if}
								<div class="flex-1">
									<p class="font-semibold text-gray-700">{item.title}</p>
									{#if item.subtitle}<p class="text-xs text-gray-400">{item.subtitle}</p>{/if}
									<p class="mt-1 text-xs uppercase text-gray-300">{formatTime(item.time)}{item.actor ? ` – ${item.actor}` : ''}</p>
								</div>
								{#if item.metadata?.canResend || item.type === 'email'}
									<div class="relative" use:clickOutside={() => { if (showViewEmail === item.id) showViewEmail = null; }}>
										<button aria-label="More" on:click={() => (showViewEmail = showViewEmail === item.id ? null : item.id)} class="text-gray-400 transition hover:text-gray-600">
											<svg viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4"><path d="M6 12a2 2 0 114 0 2 2 0 01-4 0zm5 0a2 2 0 114 0 2 2 0 01-4 0zm5 0a2 2 0 114 0 2 2 0 01-4 0z"/></svg>
										</button>
										{#if showViewEmail === item.id}
											<div class="absolute top-0 right-6 z-10">
												{#if item.metadata?.canResend}
													<button on:click={() => { showResendEmailModal = true; showViewEmail = null; }} class="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-white bg-[#F0F0F0] px-3 py-2 text-xs shadow-sm transition hover:bg-gray-200">
														<img src="/resend email.svg" alt="" class="h-4 w-4" /> Resend Email
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
			<div class="border-t border-gray-200 px-6 py-4">
				<div class="flex items-center justify-between">
					<button on:click={() => (showReportModal = true)} class="text-xs font-semibold text-[#A6A7A7] transition hover:text-gray-600">Report Attendee</button>
				</div>
				<button on:click={() => (showUndoConfirm = true)} disabled={undoing}
					class="mt-3 w-full rounded-lg bg-[#FEF3F2] px-4 py-2.5 text-sm font-medium text-[#D92D20] transition hover:bg-[#FEE4E2] disabled:opacity-50">
					Undo Check In
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Undo Confirmation Modal -->
{#if showUndoConfirm}
<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
	on:click={() => (showUndoConfirm = false)} on:keydown={(e) => e.key === 'Escape' && (showUndoConfirm = false)} role="dialog" aria-modal="true" tabindex="-1">
	<div class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" on:click|stopPropagation on:keydown|stopPropagation role="document">
		<div class="flex flex-col items-center gap-4 text-center">
			<div class="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
			</div>
			<h3 class="text-lg font-semibold text-gray-900">Undo Check-In</h3>
			<p class="text-sm text-gray-500">This will change {attendeeName}'s status from Checked-In back to Attending. Are you sure?</p>
			<div class="mt-2 flex w-full gap-3">
				<button on:click={() => (showUndoConfirm = false)} class="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">Cancel</button>
				<button on:click={handleUndoCheckIn} disabled={undoing}
					class="flex-1 rounded-lg bg-amber-500 py-2.5 text-sm font-medium text-white transition hover:bg-amber-600 disabled:opacity-50">
					{undoing ? 'Undoing...' : 'Confirm'}
				</button>
			</div>
		</div>
	</div>
</div>
{/if}

<ReportAttendeeModal bind:open={showReportModal} {eventId} {attendeeId} />
<CreateTagModal bind:open={showCreateTagModal} {eventId} on:tagAssigned={handleTagAssigned} />
<ResendEmailModal bind:open={showResendEmailModal} email={attendee?.email || ''} />
