<!-- src/routes/event/+page.svelte -->
<script lang="ts">
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { getEventAttendees, updateEvent, uploadEventPhoto } from '$lib/services/event.services';
import { getEventEarnings } from '$lib/services/wallet.services';
import { getEventCache, invalidateEventCache } from '$lib/stores/eventCache.store';
import { toast } from '$lib/stores/toast.store';
import { clickOutside } from '$lib/utils/constant';
import { cleanErrorMessage } from '$lib/utils/errorMessage';
import Icon from '@iconify/svelte';
import InviteGuestsModal from './components/InviteGuestsModal.svelte';
import SendPostModal from './components/SendPostModal.svelte';
import TransferEventModal from './settings/components/TransferEventModal.svelte';

$: eventId = $page.params.id;

let uploadingPhoto = false;
let photoInput: HTMLInputElement;
let attendeesLoading = true;
let fetchedAttendees: any[] = [];
let earningsTotal = 0;
let earningsLoading = true;

// Use cached event data — no re-fetch on tab switch
$: ({ event: eventStore, collections: collectionsStore, loading: loadingStore, error: errorStore } = getEventCache(eventId!));
$: rawEvent = $eventStore;
$: collections = $collectionsStore;
$: loading = $loadingStore;
$: error = $errorStore;

// Fetch attendees when eventId is available
$: if (eventId) {
	fetchAttendees(eventId);
	fetchEarnings(eventId);
}

async function fetchEarnings(eid: string) {
	earningsLoading = true;
	try {
		const result = await getEventEarnings(eid, { limit: 100 });
		const items = result?.data ?? [];
		earningsTotal = items
			.filter((item: any) => item.status === 'COMPLETED')
			.reduce((sum: number, item: any) => sum + (item.totalAmount ?? 0) / 100, 0);
	} catch {
		earningsTotal = 0;
	} finally {
		earningsLoading = false;
	}
}

async function fetchAttendees(eid: string) {
	attendeesLoading = true;
	try {
		const attendees = await getEventAttendees(eid);
		fetchedAttendees = attendees.map((a: any) => ({
			name: [a.firstName, a.lastName].filter(Boolean).join(' ') || a.email?.split('@')[0] || 'Unknown',
			email: a.email ?? '',
			status: a.attendeeStatus === 'ATTENDING' ? 'Attending' : a.attendeeStatus === 'PENDING' ? 'Pending' : a.attendeeStatus ?? 'Pending',
			time: a.createdAt ? timeAgo(a.createdAt) : '',
		}));
	} catch {
		fetchedAttendees = [];
	} finally {
		attendeesLoading = false;
	}
}

function timeAgo(dateStr: string): string {
	if (!dateStr) return '';
	const now = new Date();
	const date = new Date(dateStr);
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	if (diffMins < 1) return 'Just now';
	if (diffMins < 60) return `${diffMins} Minutes Ago`;
	const diffHours = Math.floor(diffMins / 60);
	if (diffHours < 24) return `${diffHours} Hours Ago`;
	const diffDays = Math.floor(diffHours / 24);
	if (diffDays < 7) return `${diffDays} Days Ago`;
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

$: collectionName = collections.find((c: any) => c._id === rawEvent?.collectionId || c.id === rawEvent?.collectionId)?.name ?? 'My Collection';
$: collectionImage = collections.find((c: any) => c._id === rawEvent?.collectionId || c.id === rawEvent?.collectionId)?.profilePictureUrl ?? '';

let showVisibilityDropdown = false;
let showTransferModal = false;
let visibilityUpdating = false;

$: eventData = rawEvent ? {
id: rawEvent._id ?? rawEvent.id,
title: rawEvent.title ?? 'Untitled Event',
collection: collectionName,
collectionId: rawEvent.collectionId ?? '',
date: formatEventDate(rawEvent.startDateTime),
time: formatEventTime(rawEvent.startDateTime, rawEvent.endDateTime, rawEvent.timeZone),
location: getLocationLabel(rawEvent),
description: rawEvent.description ?? '',
organizer: rawEvent.eventOrganizerName ?? '',
approvalRequired: false,
displayPictureUrl: rawEvent.displayPictureUrl ?? null,
coverPictureUrl: rawEvent.coverPictureUrl ?? null,
eventStatus: rawEvent.eventStatus ?? 'DRAFT',
visibility: {
collection: collectionName,
status: rawEvent.visibility === 'PUBLIC' ? 'Public' : 'Private'
},
invites: { accepted: 0, opened: 0, declined: 0 },
attendees: fetchedAttendees,
admins: [] as any[],
customLinkSlug: rawEvent.customLinkSlug ?? '',
startDateTime: rawEvent.startDateTime,
endDateTime: rawEvent.endDateTime,
meetingLink: rawEvent.locationDetails?.virtual?.meetingLink ?? null,
venueAddress: rawEvent.locationDetails?.physical?.venueAddress ?? rawEvent.locationDetails?.physical?.venueName ?? null,
socialLinks: rawEvent.socialLinks ?? {},
} : {
id: eventId,
title: 'Event',
collection: 'Collection',
collectionId: '',
date: 'Date TBD',
time: '',
location: 'Location TBD',
description: '',
organizer: '',
approvalRequired: false,
displayPictureUrl: null,
coverPictureUrl: null,
eventStatus: 'DRAFT',
visibility: { collection: 'Collection', status: 'Public' },
invites: { accepted: 0, opened: 0, declined: 0 },
attendees: fetchedAttendees,
admins: [] as any[],
customLinkSlug: '',
startDateTime: '',
endDateTime: '',
meetingLink: null,
venueAddress: null,
socialLinks: {},
};

function formatEventDate(dt: string): string {
if (!dt) return 'Date TBD';
const d = new Date(dt);
return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function formatEventTime(start: string, end: string, tz: string): string {
if (!start) return '';
const sDate = new Date(start);
const s = sDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
if (!end) return tz ? `${s} ${tz}` : s;
const eDate = new Date(end);
const e = eDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const tzLabel = tz ? ` ${tz}` : '';
const sameDay = sDate.getFullYear() === eDate.getFullYear() && sDate.getMonth() === eDate.getMonth() && sDate.getDate() === eDate.getDate();
if (sameDay) {
return `${s} – ${e}${tzLabel}`;
}
const endDateStr = eDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
return `${s} – ${endDateStr}, ${e}${tzLabel}`;
}

function getLocationLabel(event: any): string {
if (event.eventType === 'VIRTUAL' && event.locationDetails?.virtual?.platform) {
return event.locationDetails.virtual.platform;
}
if (event.locationDetails?.physical?.venueName) {
return event.locationDetails.physical.venueName;
}
return 'Location Missing';
}

function getEventMonth(dt: string): string {
if (!dt) return 'Jan';
return new Date(dt).toLocaleDateString('en-US', { month: 'short' });
}

function getEventDay(dt: string): string {
if (!dt) return '--';
return new Date(dt).getDate().toString();
}

function isFutureEvent(event: any) {
if (!event?.endDateTime) return true;
if (event.eventStatus === 'ENDED' || event.eventStatus === 'CANCELLED') return false;
return new Date(event.endDateTime).getTime() > Date.now();
}

$: eventIsFuture = eventData ? isFutureEvent(eventData) : true;
$: value = eventData?.attendees?.length ? (rawEvent?.maxAttendees > 0 ? Math.min((eventData.attendees.length / rawEvent.maxAttendees) * 100, 100) : 100) : 0;
let showInviteGuestsModal = false;
	let showSendPostModal = false;

async function handleChangePhoto() {
photoInput?.click();
}

async function onPhotoSelected(e: Event) {
const input = e.target as HTMLInputElement;
const file = input.files?.[0];
if (!file || !eventData) return;
uploadingPhoto = true;
try {
const url = await uploadEventPhoto(eventId!, file, 'DISPLAY');
eventData = { ...eventData, displayPictureUrl: url };
} catch (err: any) {
toast.error(cleanErrorMessage(err.message ?? 'Failed to upload photo'));
} finally {
uploadingPhoto = false;
input.value = '';
}
}

$: eventImageSrc = eventData?.coverPictureUrl || eventData?.displayPictureUrl || '/events.png';
$: eventLink = eventData?.customLinkSlug
? `rondwell.com/e/${eventData.customLinkSlug}`
: `rondwell.com/event-page/${eventId}`;

async function handleVisibilityChange(newVisibility: string) {
	visibilityUpdating = true;
	showVisibilityDropdown = false;
	try {
		await updateEvent(eventId!, { visibility: newVisibility === 'Private' ? 'PRIVATE' : 'PUBLIC' } as any);
		invalidateEventCache(eventId!);
		toast.success(`Event visibility changed to ${newVisibility}.`);
		// Update local state immediately
		if (eventData) {
			eventData = { ...eventData, visibility: { ...eventData.visibility, status: newVisibility } };
		}
	} catch (e: any) {
		toast.error(cleanErrorMessage(e.message || 'Failed to update visibility'));
	} finally {
		visibilityUpdating = false;
	}
}
</script>

<input
	type="file"
	accept="image/*"
	class="hidden"
	bind:this={photoInput}
	on:change={onPhotoSelected}
/>

<div class="max-w-6xl">
	<!-- Event Header -->
	<div class="mb-6">
		<div class="mb-2 flex items-center justify-between">
			{#if loading}
				<div class="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
			{:else}
				<a href="/collection/{eventData.collectionId}/events" class="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-[#83808D] transition-colors hover:bg-[#F0EFF1]">
					<span class="flex-shrink-0">In</span>
					<span class="hidden sm:inline">{eventData.collection}</span>
					<span class="inline sm:hidden">{eventData.collection.length > 20 ? eventData.collection.slice(0, 20) + '...' : eventData.collection}</span>
				</a>
			{/if}
			<a
				class="flex items-center gap-1.5 rounded-md bg-[#F0EFF1] px-3 py-1.5 text-sm font-medium text-[#5D646F] transition-colors hover:bg-[#E4E3E6]"
				href={eventData?.customLinkSlug ? `/e/${eventData.customLinkSlug}` : `/event-page/${eventId}`}
				target="_blank"
				rel="noopener noreferrer"
			>
				Event Page
				<Icon icon="mdi:open-in-new" class="h-3.5 w-3.5 text-[#8A8D90]" />
			</a>
		</div>
		{#if loading}
			<div class="mb-4 h-9 w-3/4 animate-pulse rounded bg-gray-200"></div>
		{:else if eventData}
			<h1 class="mb-4 text-3xl font-bold md:text-4xl">{eventData.title}</h1>
		{/if}
	</div>

	{#if error}
		<div class="mb-4 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3">
			<p class="text-sm text-red-600">{error}</p>
			<button on:click={() => (error = '')} class="text-red-400 hover:text-red-600"><Icon icon="mdi:close" class="text-lg" /></button>
		</div>
	{/if}

	{#if loading}
		<!-- Action button skeletons -->
		<div class="mb-4 flex flex-wrap gap-3">
			<div class="h-[60px] w-full animate-pulse rounded-[12.75px] bg-gray-200 sm:w-[200px]"></div>
			<div class="h-[60px] w-full animate-pulse rounded-[12.75px] bg-gray-200 sm:w-[200px]"></div>
			<div class="h-[60px] w-full animate-pulse rounded-[12.75px] bg-gray-200 sm:w-[200px]"></div>
		</div>

		<!-- Event details card skeleton -->
		<div class="mb-12 animate-pulse rounded-lg bg-[#FDFDFD] p-4 shadow-md">
			<div class="flex flex-col gap-6 lg:flex-row">
				<div class="w-full lg:w-1/2">
					<div class="mb-4 h-70 w-full rounded-lg bg-gray-200"></div>
					<div class="flex items-center justify-between">
						<div class="h-4 w-20 rounded bg-gray-200"></div>
						<div class="flex gap-2">
							<div class="h-5 w-5 rounded bg-gray-200"></div>
							<div class="h-5 w-5 rounded bg-gray-200"></div>
							<div class="h-5 w-5 rounded bg-gray-200"></div>
							<div class="h-5 w-5 rounded bg-gray-200"></div>
						</div>
					</div>
				</div>
				<div class="flex w-full flex-col gap-4 rounded-md md:p-4 lg:w-1/2">
					<div class="h-5 w-32 rounded bg-gray-200"></div>
					<div class="flex items-center gap-3">
						<div class="h-[49px] w-[49px] rounded-md bg-gray-200"></div>
						<div class="flex flex-col gap-2">
							<div class="h-4 w-40 rounded bg-gray-200"></div>
							<div class="h-3 w-28 rounded bg-gray-200"></div>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<div class="h-[49px] w-[49px] rounded-md bg-gray-200"></div>
						<div class="flex flex-col gap-2">
							<div class="h-4 w-36 rounded bg-gray-200"></div>
							<div class="h-3 w-52 rounded bg-gray-200"></div>
						</div>
					</div>
					<div class="mt-4 flex gap-2">
						<div class="h-9 w-28 rounded-md bg-gray-200"></div>
						<div class="h-9 w-28 rounded-md bg-gray-200"></div>
					</div>
				</div>
			</div>
		</div>

		<!-- Invites section skeleton -->
		<div class="mb-12 animate-pulse">
			<div class="mb-4 flex items-center justify-between">
				<div class="h-5 w-20 rounded bg-gray-200"></div>
				<div class="h-8 w-32 rounded-md bg-gray-200"></div>
			</div>
			<div class="flex flex-col gap-4 lg:flex-row">
				<div class="h-32 w-full rounded-md bg-gray-200 lg:max-w-[284px]"></div>
				<div class="h-32 w-full rounded-md bg-gray-200"></div>
			</div>
		</div>

		<!-- Attendees section skeleton -->
		<div class="mb-12 animate-pulse border-t pt-12">
			<div class="mb-3 h-5 w-24 rounded bg-gray-200"></div>
			<div class="mb-6 h-8 w-full max-w-2xl rounded-full bg-gray-200"></div>
			<div class="flex flex-col gap-3 rounded-md bg-[#FDFDFD] p-3">
				{#each [1, 2, 3] as _}
					<div class="flex items-center justify-between border-b py-3 last:border-b-0">
						<div class="flex items-center gap-2">
							<div class="h-6 w-6 rounded-full bg-gray-200"></div>
							<div class="h-4 w-32 rounded bg-gray-200"></div>
						</div>
						<div class="h-6 w-20 rounded-full bg-gray-200"></div>
					</div>
				{/each}
			</div>
		</div>
	{:else if eventData}

		{#if eventIsFuture}
			<!-- Action Buttons -->
			<div class="mb-4 flex w-full flex-wrap gap-3">
				<div
					class="relative w-full md:w-fit"
					use:clickOutside={() => {
						showInviteGuestsModal = false;
					}}
				>
					<button
						on:click={() => (showInviteGuestsModal = !showInviteGuestsModal)}
						class="flex w-full items-center gap-2 rounded-[12.75px] bg-[#FDFDFD] p-2 text-sm font-medium shadow-sm sm:min-w-70 md:w-fit"
					>
						<div class="flex h-[44px] w-[44px] items-center justify-center rounded-sm bg-[#E2E8FC]">
							<svg
								width="20"
								height="22"
								viewBox="0 0 20 22"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M17.2196 10.4232C16.5968 10.2593 15.8647 10.1719 14.9906 10.1719C13.7778 10.1719 13.3299 10.4669 12.7071 10.9367C12.6743 10.9586 12.6415 10.9913 12.6087 11.0241L11.5708 12.1277C10.6967 13.0454 9.12331 13.0564 8.24922 12.1167L7.21124 11.0241C7.17846 10.9913 7.14568 10.9586 7.1129 10.9367C6.49011 10.4669 6.04214 10.1719 4.82934 10.1719C3.95526 10.1719 3.22321 10.2593 2.60042 10.4232C-2.60499e-07 11.1224 0 13.1875 0 15.0012V16.0173C0 18.7598 -5.20998e-07 21.8628 5.84547 21.8628H13.9745C17.8533 21.8628 19.82 19.8961 19.82 16.0173V15.0012C19.82 13.1875 19.82 11.1224 17.2196 10.4232ZM12.4558 17.9294H7.3642C6.94901 17.9294 6.6103 17.5907 6.6103 17.1646C6.6103 16.7385 6.94901 16.3998 7.3642 16.3998H12.4558C12.871 16.3998 13.2097 16.7385 13.2097 17.1646C13.2097 17.5907 12.871 17.9294 12.4558 17.9294Z"
									fill="#146AEB"
								/>
								<path
									d="M17.7867 4.82934V8.87201C17.743 8.85016 17.6884 8.83923 17.6447 8.8283C16.8798 8.62071 16.0167 8.52237 14.9896 8.52237C13.307 8.52237 12.5203 9.01405 11.7118 9.62591C11.6025 9.70239 11.5042 9.80073 11.4168 9.88814L10.3679 10.9917C10.2695 11.1009 10.0947 11.1665 9.90898 11.1665C9.72324 11.1665 9.54842 11.1009 9.43916 10.9808L8.4121 9.89906C8.31377 9.7898 8.20451 9.69147 8.09525 9.61499C7.30857 9.01405 6.51096 8.52237 4.82834 8.52237C3.80128 8.52237 2.93812 8.62071 2.17329 8.8283C2.12959 8.83923 2.07495 8.85016 2.03125 8.87201V4.82934C2.03125 2.56764 2.03125 0 6.86059 0H12.9574C17.7867 0 17.7867 2.56764 17.7867 4.82934Z"
									fill="#146AEB"
								/>
							</svg>
						</div>
						Invite Attendee
					</button>
					<InviteGuestsModal bind:open={showInviteGuestsModal} />
				</div>

				<button
					on:click={() => (showSendPostModal = !showSendPostModal)}
					class="flex w-full items-center gap-2 rounded-[12.75px] bg-[#FDFDFD] p-2 text-sm font-medium sm:min-w-70 md:w-fit"
				>
					<div class="flex h-[44px] w-[44px] items-center justify-center rounded-sm bg-[#F2E4F8]">
						<svg
							width="27"
							height="27"
							viewBox="0 0 27 27"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M17.6353 3.23798L7.76904 6.51582C1.13688 8.73382 1.13688 12.3504 7.76904 14.5574L10.6972 15.5299L11.6697 18.4581C13.8767 25.0902 17.5042 25.0902 19.7113 18.4581L23 8.6027C24.4641 4.17763 22.0604 1.76295 17.6353 3.23798ZM17.985 9.11623L13.833 13.29C13.6691 13.4539 13.4615 13.5304 13.2539 13.5304C13.0464 13.5304 12.8388 13.4539 12.6749 13.29C12.358 12.9732 12.358 12.4487 12.6749 12.1318L16.8268 7.95806C17.1436 7.64121 17.6681 7.64121 17.985 7.95806C18.3018 8.27492 18.3018 8.79937 17.985 9.11623Z"
								fill="#AB46DD"
							/>
						</svg>
					</div>
					Send a Post
				</button>
				<SendPostModal bind:open={showSendPostModal} eventTitle={eventData?.title ?? ''} />

				<button
					on:click={() => goto(`/events/${eventId}/earnings`)}
					class="flex w-full items-center gap-2 rounded-[12.75px] bg-[#FDFDFD] p-2 text-sm font-medium shadow-sm sm:min-w-70 md:w-fit"
				>
					<svg width="44" height="44" viewBox="0 0 47 47" fill="none" xmlns="http://www.w3.org/2000/svg">
						<rect width="46.713" height="46.713" rx="8.99063" fill="#F2E4F8"/>
						<path opacity="0.4" d="M33.0463 24.247C33.4891 24.247 33.8411 23.8837 33.8411 23.4295V22.4304C33.8411 17.9683 32.4786 16.6172 28.0279 16.6172H20.875V19.3762C21.3178 19.3762 21.6811 19.7395 21.6811 20.1823V23.2251C21.6811 23.6679 21.3178 24.0313 20.875 24.0313V26.8811C21.3178 26.8811 21.6811 27.2444 21.6811 27.6872V30.73C21.6811 31.1728 21.3178 31.5362 20.875 31.5362V34.2724H28.0279C32.4786 34.2724 33.8411 32.91 33.8411 28.4593C33.8411 28.0165 33.4891 27.6531 33.0463 27.6531C32.0926 27.6531 31.3319 26.8924 31.3319 25.9501C31.3319 25.0077 32.0926 24.247 33.0463 24.247Z" fill="#AB46DD"/>
						<path opacity="0.4" d="M26.5848 16.9033H19.5078L21.789 14.6221C23.6497 12.7614 24.584 12.7614 26.4447 14.6221L26.9118 15.0892C26.4213 15.5797 26.3046 16.3038 26.5848 16.9033Z" stroke="#AB46DD" stroke-width="1.12383" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M20.0706 20.2803V23.3232C20.0706 23.766 20.4339 24.1293 20.8767 24.1293V26.9791C20.4339 26.9791 20.0706 27.3424 20.0706 27.7852V30.8281C20.0706 31.2709 20.4339 31.6342 20.8767 31.6342V34.3705H17.9929C13.5422 34.3705 12.1797 33.008 12.1797 28.5573V28.0691C12.1797 27.6149 12.5317 27.2629 12.9745 27.2629C13.9282 27.2629 14.6889 26.4909 14.6889 25.5485C14.6889 24.6061 13.9282 23.8341 12.9745 23.8341C12.5317 23.8341 12.1797 23.4821 12.1797 23.028V22.5397C12.1797 18.0777 13.5422 16.7266 17.9929 16.7266H20.8654V19.4856C20.4339 19.4856 20.0706 19.8489 20.0706 20.2803Z" fill="#AB46DD"/>
					</svg>
					Earnings <span class="text-[#838485]">|</span>
					{#if earningsLoading}
						<span class="inline-block h-4 w-16 animate-pulse rounded bg-gray-200"></span>
					{:else}
						<span class="font-semibold">N{earningsTotal.toLocaleString()}</span>
					{/if}
				</button>
			</div>
		{/if}

	<!-- Event Details Section -->
	{#if eventIsFuture}
		<div class="mb-12 overflow-hidden rounded-xl bg-[#FDFDFD] shadow-md">
			<!-- Two-column layout -->
			<div class="flex flex-col lg:flex-row lg:items-stretch">
				<!-- Left Column: Event Image + Share -->
				<div class="w-full p-4 lg:w-1/2">
					<!-- Image container -->
					<div class="relative w-full overflow-hidden rounded-xl">
						<img
							src={eventImageSrc}
							alt="Event"
							class="h-72 w-full object-cover"
						/>

						<!-- Copy link pill overlay -->
						<div
							class="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 rounded-full bg-black/60 px-4 py-2 backdrop-blur-sm"
						>
							<span class="truncate text-xs text-white/80">{eventLink}</span>
							<button class="flex-shrink-0 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-white/30">
								Copy
							</button>
						</div>
					</div>

					<!-- Share section -->
					<div class="mt-4 flex w-full items-center justify-between rounded-lg bg-[#F4F4F4]/60 px-4 py-3">
						<p class="text-sm font-medium text-[#616265]">Share event</p>
						<div class="flex items-center gap-3 text-lg text-[#83808D]">
							{#if eventData?.socialLinks?.instagram}
								<a href="https://instagram.com/{eventData.socialLinks.instagram}" target="_blank" rel="noopener noreferrer" class="rounded-full p-1 transition-colors hover:bg-[#EBECED] hover:text-[#E1306C]">
									<Icon icon="mdi:instagram" />
								</a>
							{:else}
								<span class="rounded-full p-1 opacity-30"><Icon icon="mdi:instagram" /></span>
							{/if}
							{#if eventData?.socialLinks?.x}
								<a href="https://x.com/{eventData.socialLinks.x}" target="_blank" rel="noopener noreferrer" class="rounded-full p-1 transition-colors hover:bg-[#EBECED] hover:text-black">
									<Icon icon="mdi:twitter" />
								</a>
							{:else}
								<span class="rounded-full p-1 opacity-30"><Icon icon="mdi:twitter" /></span>
							{/if}
							{#if eventData?.socialLinks?.linkedin}
								<a href="https://linkedin.com/in/{eventData.socialLinks.linkedin}" target="_blank" rel="noopener noreferrer" class="rounded-full p-1 transition-colors hover:bg-[#EBECED] hover:text-[#0A66C2]">
									<Icon icon="mdi:linkedin" />
								</a>
							{:else}
								<span class="rounded-full p-1 opacity-30"><Icon icon="mdi:linkedin" /></span>
							{/if}
							{#if eventData?.socialLinks?.tiktok}
								<a href="https://tiktok.com/@{eventData.socialLinks.tiktok}" target="_blank" rel="noopener noreferrer" class="rounded-full p-1 transition-colors hover:bg-[#EBECED] hover:text-black">
									<Icon icon="simple-icons:tiktok" />
								</a>
							{:else}
								<span class="rounded-full p-1 opacity-30"><Icon icon="simple-icons:tiktok" /></span>
							{/if}
						</div>
					</div>
				</div>

				<!-- Right Column: When & Where -->
				<div class="flex w-full flex-col justify-between border-t p-5 lg:w-1/2 lg:border-l lg:border-t-0">
					<div class="w-full">
						<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
							<Icon icon="mdi:calendar-clock-outline" class="text-[#83808D]" />
							When & Where
						</h3>

						<!-- Date and Location Blocks -->
						<div class="mb-4 space-y-3">
							<!-- Date Block -->
							<div class="flex items-center gap-3 rounded-lg bg-[#F4F4F4]/70 p-3">
								<div class="flex h-12 w-12 flex-col overflow-hidden rounded-lg border border-[#EBECED] bg-white">
									<p class="bg-[#EBECED] py-0.5 text-center text-[10px] font-medium uppercase text-[#83808D]">{getEventMonth(eventData.startDateTime)}</p>
									<div class="flex flex-1 items-center justify-center">
										<p class="text-sm font-semibold text-gray-700">{getEventDay(eventData.startDateTime)}</p>
									</div>
								</div>

								<div>
									<div class="text-base font-medium text-gray-800">{eventData.date}</div>
									<div class="text-sm text-[#83808D]">{eventData.time}</div>
								</div>
							</div>

							<!-- Location Block -->
							<div class="flex items-center gap-3 rounded-lg bg-[#F4F4F4]/70 p-3">
								<div
									class="flex h-12 w-12 items-center justify-center rounded-lg border border-[#EBECED] bg-white"
								>
									<Icon icon="mdi:map-marker-outline" class="text-xl text-[#B9BABA]" />
								</div>

								<div class="min-w-0 flex-1">
									<div class="text-base font-medium text-[#D79917]">
										{eventData.location}
									</div>
									<div class="max-w-50 text-sm text-[#83808D] sm:max-w-full">
										{#if eventData.meetingLink}
											<a href={eventData.meetingLink} target="_blank" rel="noopener noreferrer" class="block truncate text-blue-500 hover:underline">{eventData.meetingLink}</a>
										{:else if eventData.venueAddress}
											{eventData.venueAddress}
										{:else}
											Add location details
										{/if}
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Buttons -->
					<div class="mt-4 flex w-full items-center gap-3">
						<button
							on:click={() => goto(`/events/${eventId}/edit`)}
							class="flex items-center gap-2 rounded-lg border border-[#EBECED] bg-white px-4 py-2.5 text-sm font-medium text-[#616265] shadow-sm transition-colors hover:bg-[#F4F4F4]"
						>
							<Icon icon="mdi:pencil-outline" class="text-base" />
							Edit Event
						</button>
						<button
							class="flex items-center gap-2 rounded-lg border border-[#EBECED] bg-white px-4 py-2.5 text-sm font-medium text-[#616265] shadow-sm transition-colors hover:bg-[#F4F4F4] disabled:opacity-50"
							on:click={handleChangePhoto}
							disabled={uploadingPhoto}
						>
							<Icon icon="mdi:camera-outline" class="text-base" />
							{uploadingPhoto ? 'Uploading...' : 'Change Photo'}
						</button>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="mb-6 w-full">
			<!-- Event Ended Banner -->
			<div class="mb-4 flex w-full items-center justify-between rounded-xl bg-[#F4F4F4] px-5 py-4">
				<div class="flex items-center gap-3">
					<div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#EBECED]">
						<Icon icon="mdi:calendar-check" class="text-lg text-[#83808D]" />
					</div>
					<div>
						<h4 class="text-base font-semibold text-[#616265]">This Event Has Ended</h4>
						<p class="text-xs text-[#83808D] lg:text-sm">
							Thank you for organizing. We trust it was a huge success!
						</p>
					</div>
				</div>
				<button
					class="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#616265] shadow-sm transition-colors hover:bg-[#EBECED]"
				>
					<Icon icon="mdi:chart-line" class="text-base" />
					<p>Insights</p>
				</button>
			</div>

			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
				<!-- Event Recap -->
				<div class="overflow-hidden rounded-xl bg-[#FDFDFD] shadow-md">
					<!-- Event image thumbnail -->
					<div class="relative h-32 w-full">
						<img
							src={eventImageSrc}
							alt="Event recap"
							class="h-full w-full object-cover"
						/>
						<div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
						<div class="absolute bottom-3 left-4 flex items-center gap-2">
							<span class="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">Recap</span>
						</div>
					</div>

					<div class="p-4">
						<div class="mb-3 flex items-center justify-between">
							<p class="text-xs font-medium uppercase tracking-wide text-[#83808D]">Event Recap</p>
							<button
								on:click={() => goto(`/events/${eventId}/edit`)}
								class="rounded-md p-1.5 text-[#B9BABA] transition-colors hover:bg-[#F4F4F4] hover:text-[#616265]"
								aria-label="Edit event"
							>
								<Icon icon="mdi:pencil-outline" class="text-sm" />
							</button>
						</div>

						<div class="space-y-2.5">
							<div class="flex items-center gap-3 rounded-lg bg-[#F4F4F4]/60 px-3 py-2">
								<Icon icon="mdi:calendar-outline" class="flex-shrink-0 text-lg text-[#B9BABA]" />
								<div class="text-sm text-[#616265]">{eventData.date}</div>
							</div>

							<div class="flex items-center gap-3 rounded-lg bg-[#F4F4F4]/60 px-3 py-2">
								<Icon icon="mdi:clock-outline" class="flex-shrink-0 text-lg text-[#B9BABA]" />
								<p class="text-sm text-[#616265]">{eventData.time}</p>
							</div>

							<div class="flex items-center gap-3 rounded-lg bg-[#F4F4F4]/60 px-3 py-2">
								<Icon icon="mdi:map-marker-outline" class="flex-shrink-0 text-lg text-[#B9BABA]" />
								<div class="text-sm text-[#616265]">{eventData.location}</div>
							</div>

							<div class="flex items-center gap-3 rounded-lg bg-[#F4F4F4]/60 px-3 py-2">
								<Icon icon="mdi:account-group-outline" class="flex-shrink-0 text-lg text-[#B9BABA]" />
								<div class="text-sm text-[#616265]">{eventData?.attendees?.length} Attendee{eventData?.attendees?.length !== 1 ? 's' : ''}</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Feedback Section -->
				<div class="flex flex-col rounded-xl bg-[#FDFDFD] p-5 shadow-md">
					<div class="mb-4 flex items-center gap-2">
						<Icon icon="mdi:message-text-outline" class="text-lg text-[#83808D]" />
						<h3 class="text-xs font-medium uppercase tracking-wide text-[#83808D]">Feedback</h3>
					</div>

					<div class="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg bg-[#F4F4F4]/40 p-6">
						<div class="flex h-14 w-14 items-center justify-center rounded-full bg-[#EBECED]">
							<Icon icon="mdi:message-reply-text-outline" class="text-2xl text-[#B9BABA]" />
						</div>
						<div class="text-center">
							<div class="text-sm font-medium text-[#616265]">No Feedback Collected</div>
							<div class="mt-1 text-xs text-[#B9BABA]">
								You are not collecting feedback for this event.
							</div>
						</div>
						<button class="mt-2 rounded-lg bg-[#F31A7C]/10 px-4 py-2 text-sm font-medium text-[#F31A7C] transition-colors hover:bg-[#F31A7C]/20">
							Schedule Feedback Email
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
	<!-- Invites Section -->
	<div class="mb-12">
		<div class="flex w-full flex-col">
			<span class="flex w-full items-center justify-between">
				<h3 class="mb-1 text-lg font-medium">Invites</h3>
				<button
					class="flex w-fit items-center gap-1 rounded-md bg-[#EBECED] px-3 py-2 text-xs font-medium text-[#616265] transition-colors hover:bg-gray-200 md:text-sm"
				>
					<Icon icon="mdi:plus" class="text-xl" />
					Invite Attendee
				</button>
			</span>
			<p class="mb-4 text-sm text-gray-600">
				Invite subscribers, contacts and past attendee via email or SMS.
			</p>
		</div>

		<div class="flex h-full flex-col gap-4 lg:flex-row">
			<div class="w-full rounded-md bg-[#FDFDFD] md:max-w-[284.7px]">
				<div class="flex w-full flex-col gap-5 p-3">
					<div class="text-sm font-medium text-[#B6B7B7]">
						<div class="flex items-center">
							<p class="text-3xl font-bold text-black">{eventData?.invites?.accepted}</p>
							/{eventData?.attendees.length}
						</div>
						<div class="">Invite Accepted</div>
					</div>
					<div class="text-sm font-medium text-[#B6B7B7]">
						<div class="flex gap-1">
							<p>{eventData?.invites.opened} Email Opened</p>
							<img src="/information.svg" alt="" />
						</div>
						<div class="">{eventData?.invites.declined} Declined</div>
					</div>
				</div>
			</div>

			<!-- Invite List -->
			<div class="w-full rounded-md bg-[#FDFDFD]">
				<div class="w-full rounded-lg">
					<p class="w-full border-b p-3 text-[#A9AAAA]">RECENTLY ACCEPTED</p>
					<div class="w-full px-3">
						{#each eventData.attendees as attendee}
							<div class="flex items-start gap-2 border-b py-3 last:border-b-0">
								<img src={attendee.profilePicture || '/rondwell-attendee.png'} alt="profile icon" class="h-6 w-6 rounded-full object-cover" />
								<div class="flex flex-col items-start gap-1 md:flex-row">
									<div class="flex items-center gap-1">
										<div class="font-medium">{attendee.name}</div>
										<span class="h-2 w-2 rounded-full bg-[#EAAB26]"></span>
									</div>
									<div class="text-sm text-gray-500">{attendee.email}</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Attendees Section -->
	<div class="mb-12 border-t pt-12">
		<h3 class="mb-3 text-lg font-medium">Attendees</h3>

		<!-- Tabs -->
		<div class="mb-6 w-full max-w-2xl text-xs font-medium text-green-600">
			<!-- Top label -->
			<p class="mb-1">Attendee</p>

			<!-- Progress bar -->
			<div class="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
				<div
					class="h-full rounded-full bg-green-500 transition-all duration-500"
					style="width: {value}%;"
				></div>
			</div>

			<!-- Sub label -->
			<div class="flex gap-1">
				{#if !eventIsFuture}
					<div class="flex items-center space-x-1 text-blue-600">
						<span class="h-2 w-2 rounded-full bg-green-500"></span>
						<span>1 Invited</span>
					</div>
				{/if}
				<div class="flex items-center space-x-1 text-green-600">
					<span class="h-2 w-2 rounded-full bg-green-500"></span>
					<span>{eventData?.attendees.length} Attending</span>
				</div>
			</div>
		</div>

		<!-- Recent Registrations -->
		<div class="mb-4">
			<div class="mb-3 flex items-center justify-between">
				<h4 class="text-lg font-medium">Recent Registrations</h4>
				<button
					on:click={() => goto(`/events/${eventId}/attendees`)}
					class="flex w-32 items-center gap-1 rounded-sm bg-[#EBECED] px-3 py-2 text-sm font-medium text-[#616265]"
				>
					<p>All Attendee</p>
					<img src="/arrow-left.svg" alt="arrow icon" class="h-3 w-3" />
				</button>
			</div>

			<div class="flex flex-col rounded-md bg-[#FDFDFD] px-3">
				{#each eventData.attendees as attendee}
					<div class="flex items-center justify-between rounded-md border-b py-3 last:border-b-0">
						<div class="flex items-start gap-2">
							<img src={attendee.profilePicture || '/rondwell-attendee.png'} alt="profile icon" class="h-6 w-6 rounded-full object-cover" />
							<div class="flex flex-col items-start gap-1 lg:flex-row lg:items-center">
								<span class="flex items-center gap-1">
									<p class="font-medium">{attendee.name}</p>
									<span class="h-2 w-2 rounded-full bg-[#EAAB26]"></span>
								</span>
								<p class="text-xs text-gray-500 md:text-sm">{attendee.email}</p>
							</div>
						</div>
						<div class="flex flex-col items-center gap-1 lg:flex-row lg:gap-4">
							<div
								class="flex items-center justify-center rounded-full px-2 py-1 text-xs {attendee.status ===
								'Attending'
									? 'bg-[#E3F4E1] text-[#3CBD2C]'
									: 'bg-[#EBECED] text-[#616265]'}"
							>
								{attendee.status}
							</div>
							<div class="text-xs text-gray-500">{attendee.time}</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div class="mb-12 border-t pt-12">
		<!-- Admins Section -->
		<div>
			<div class="mb-3 flex items-center justify-between">
				<span>
					<span class="flex items-center gap-1">
						<h4 class="text-lg font-medium">Admins</h4>
						<p
							class="hidden h-[22px] w-[22px] items-center justify-center rounded-full bg-[#EBECED] lg:flex"
						>
							{eventData?.admins?.length}
						</p>
					</span>
					<p class="hidden text-sm text-[#737577] lg:block">
						Add hosts, special guests, and event managers.
					</p>
				</span>
				<div class="flex gap-2">
					<button
						class="flex w-fit items-center gap-1 rounded-sm bg-[#EBECED] px-3 py-2 text-xs font-medium text-[#616265] md:text-sm"
					>
						<p>All Admins</p>
						<img src="/arrow-left.svg" alt="arrow icon" class="h-3 w-3" />
					</button>
					<button
						class="flex w-fit items-center gap-1 rounded-md bg-[#EBECED] px-3 py-2 text-xs font-medium text-[#616265] transition-colors hover:bg-gray-200 md:text-sm"
					>
						<Icon icon="mdi:plus" class="text-xl" />
						Add Admin
					</button>
				</div>
			</div>

			<div class="flex flex-col rounded-md bg-[#FDFDFD] px-3">
				{#each eventData.admins as admin}
					<div class="flex items-center justify-between rounded-md border-b py-3 last:border-b-0">
						<div class="flex items-start gap-2">
							<img src="/rondwell-attendee.png" alt="profile icon" class="h-6 w-6 rounded-full" />
							<div class="flex flex-col items-start gap-1 lg:flex-row lg:items-center">
								<span class="flex items-center gap-1">
									<p class="font-medium">{admin.name}</p>
									<span class="h-2 w-2 rounded-full bg-[#EAAB26]"></span>
								</span>
								<p class="text-sm text-gray-500">{admin.email}</p>
							</div>
							<div
								class="hidden items-center justify-center rounded-full px-2 py-1 text-xs {admin.role ===
								'Creator'
									? 'bg-[#E3F4E1] text-[#3CBD2C]'
									: 'bg-[#F8EFDD] text-[#D69712]'} lg:flex"
							>
								{admin.role}
							</div>
						</div>
						<div class="flex flex-col items-center gap-1 lg:flex-row lg:justify-between">
							<div
								class="flex items-center justify-center rounded-full px-2 py-1 text-xs {admin.role ===
								'Creator'
									? 'bg-[#E3F4E1] text-[#3CBD2C]'
									: 'bg-[#F8EFDD] text-[#D69712]'} lg:hidden"
							>
								{admin.role}
							</div>
							<div class="flex items-center gap-1">
								<img src="/edit.svg" alt="edit icon" class="h-4 w-4" />

								<p class="text-sm text-gray-400 lg:hidden">Edit</p>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<div class="mt-3 flex items-center gap-1 text-xs text-gray-500">
				<p>Learn more about adding hosts / managers</p>
				<svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect
						x="2.9625"
						y="0.37461"
						width="4.49532"
						height="0.74922"
						fill="#D9D9D9"
						stroke="#B3B5B7"
						stroke-width="0.74922"
					/>
					<rect
						x="7.45664"
						y="5.62539"
						width="5.24454"
						height="0.74922"
						transform="rotate(-90 7.45664 5.62539)"
						fill="#D9D9D9"
						stroke="#B3B5B7"
						stroke-width="0.74922"
					/>
					<rect
						x="0.529778"
						y="7.57812"
						width="8.89866"
						height="0.74922"
						transform="rotate(-45 0.529778 7.57812)"
						fill="#D9D9D9"
						stroke="#B3B5B7"
						stroke-width="0.74922"
					/>
				</svg>
			</div>
		</div>
	</div>

	<!-- Visibility & Discovery Section -->
	<div class="mb-12 border-t pt-12">
		<div class="">
			<h3 class="mb-1 text-lg font-medium">Visibility & Discovery</h3>
			<p class="mb-4 text-sm text-[#737577]">Control how people can find your event.</p>

			<!-- Managing Calendar -->
			<div class="mb-4 rounded-md bg-[#FDFDFD] p-3">
				<div class="flex flex-col items-start gap-3 lg:flex-row">
					<div class="flex gap-3">
						{#if collectionImage}
							<img src={collectionImage} alt="collection" class="h-10 w-10 rounded-lg object-cover" />
						{:else}
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg">🎪</div>
						{/if}
						<span class="lg:hidden">
							<div class="text-xs font-medium text-[#ABADAD]">Managing Collection</div>
							<div class="text-sm text-gray-500">{eventData.visibility.collection}</div>
						</span>
					</div>
					<div>
						<span class="hidden lg:inline">
							<div class="text-xs font-medium text-[#ABADAD]">Managing Collection</div>
							<div class="text-sm text-gray-500">{eventData.visibility.collection}</div>
						</span>
						<div class="mt-1 mb-3 flex flex-col items-start gap-1 lg:flex-row lg:items-center">
							<span class="flex items-center {eventData.visibility.status === 'Public' ? 'text-[#46C036]' : 'text-[#D69712]'}">
								<Icon icon={eventData.visibility.status === 'Public' ? 'mdi:web' : 'mdi:lock-outline'} class="rounded-full text-xl" />
								<p>{eventData.visibility.status}</p>
							</span>
							<p class="hidden lg:flex">—</p>
							<p class="text-sm text-gray-500">
								{eventData.visibility.status === 'Public'
									? 'This event is listed on the collection page. Collection admins have manage access to the event.'
									: 'This event is unlisted. Only people with the link can register.'}
							</p>
						</div>
						<div class="relative flex flex-col gap-2 sm:flex-row">
							<button
								on:click={() => (showVisibilityDropdown = !showVisibilityDropdown)}
								disabled={visibilityUpdating}
								class="flex items-center justify-center gap-1 rounded-sm bg-[#EBECED] px-3 py-2 text-sm font-medium text-[#616265] transition-colors hover:bg-gray-200 disabled:opacity-50"
							>
								<Icon icon="mdi:eye-outline" class="text-lg" />
								{visibilityUpdating ? 'Updating...' : 'Change Visibility'}
							</button>

							{#if showVisibilityDropdown}
							<div class="absolute top-full left-0 z-50 mt-1 w-64 rounded-lg border bg-white p-2 shadow-lg">
								<button
									on:click={() => handleVisibilityChange('Public')}
									class="flex w-full items-start gap-2 rounded-md p-2 text-left hover:bg-gray-50 {eventData.visibility.status === 'Public' ? 'bg-gray-50' : ''}"
								>
									<Icon icon="mdi:web" class="mt-0.5 text-base text-gray-500" />
									<div>
										<p class="text-sm font-medium">Public</p>
										<p class="text-xs text-gray-400">Shown on your collection and eligible to be featured.</p>
									</div>
									{#if eventData.visibility.status === 'Public'}<Icon icon="mdi:check" class="ml-auto text-base" />{/if}
								</button>
								<button
									on:click={() => handleVisibilityChange('Private')}
									class="flex w-full items-start gap-2 rounded-md p-2 text-left hover:bg-gray-50 {eventData.visibility.status === 'Private' ? 'bg-gray-50' : ''}"
								>
									<Icon icon="mdi:lock-outline" class="mt-0.5 text-base text-gray-500" />
									<div>
										<p class="text-sm font-medium">Private</p>
										<p class="text-xs text-gray-400">Unlisted. Only people with the link can register.</p>
									</div>
									{#if eventData.visibility.status === 'Private'}<Icon icon="mdi:check" class="ml-auto text-base" />{/if}
								</button>
							</div>
							{/if}

							<button
								on:click={() => (showTransferModal = true)}
								class="flex items-center justify-center gap-1 rounded-md bg-[#EBECED] px-3 py-2 text-sm font-medium text-[#616265] transition-colors hover:bg-gray-200"
							>
								<Icon icon="mdi:swap-horizontal" class="text-lg" />
								Transfer Collection
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Additional Information -->
			<div class="flex items-start gap-1 text-xs text-gray-500">
				<Icon icon="mdi:star-outline" class="mt-0.5 shrink-0 text-base text-gray-300" />
				<p>
					You can submit the event to a relevant Rondwell discovery page or other community
					Collection for a chance to be featured, such as the discover more page.
				</p>
			</div>
		</div>
	</div>

	<TransferEventModal
		bind:open={showTransferModal}
		eventId={eventId ?? ''}
		currentCollectionName={eventData.visibility.collection}
	/>
{/if}
</div>
