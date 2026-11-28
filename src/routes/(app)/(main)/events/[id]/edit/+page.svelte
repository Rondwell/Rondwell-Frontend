<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import AddressAutocomplete from '$lib/components/AddressAutocomplete.svelte';
	import CustomSelect, { type SelectOption } from '$lib/components/CustomSelect.svelte';
	import { bulkReplaceEventDays, getEventDays, updateEvent, uploadEventDescriptionImage, uploadEventPhoto, type EventDayPayload } from '$lib/services/event.services';
	import { getEventCache, invalidateEventCache } from '$lib/stores/eventCache.store';
	import { toast } from '$lib/stores/toast.store';
	import { colors, DEFAULT_THEME, resolveTheme, themeSwatch, type Color } from '$lib/utils/colors';
	import {
		DEFAULT_FONT,
		ensureThemeFontLoaded,
		resolveThemeFont,
		themeFonts,
		type ThemeFont
	} from '$lib/utils/themeFonts';
	import { clickOutside } from '$lib/utils/constant';
	import { cleanErrorMessage } from '$lib/utils/errorMessage';
	import { detectMeetingPlatform, PLATFORM_BRANDS } from '$lib/utils/meetingPlatform';
	import Icon from '@iconify/svelte';
	import Image from '@tiptap/extension-image';
	import Link from '@tiptap/extension-link';
	import PlaceholderExtension from '@tiptap/extension-placeholder';
	import StarterKit from '@tiptap/starter-kit';
	import { onDestroy, onMount } from 'svelte';
	import { createEditor, Editor, EditorContent } from 'svelte-tiptap';
	import type { Readable } from 'svelte/store';
	import DatePickerModal from '../../../../create-event/components/DatePickerModal.svelte';
	import EventLocationModal from '../../../../create-event/components/EventLocationModal.svelte';
	import EventTypeModal from '../../../../create-event/components/EventTypeModal.svelte';
	import TimeModal from '../../../../create-event/components/TimeModal.svelte';
	import VisibilityModal from '../../../../create-event/components/VisibilityModal.svelte';
	import { buildZonedInstant } from '$lib/utils/eventTime';

	$: eventId = $page.params.id ?? '';

	type SocialLinkKey = 'instagram' | 'x' | 'youtube' | 'tiktok' | 'linkedin' | 'website';

	let loading = true;
	let saving = false;
	let saveError = '';
	let uploadingCover = false;
	let uploadingAvatar = false;
	let coverInput: HTMLInputElement;
	let avatarInput: HTMLInputElement;
	let showDescEditor = false;
	// Description rich-text image upload + link state
	let descImageInput: HTMLInputElement;
	let uploadingDescImage = false;
	let descImageError = '';
	let showDescLinkInput = false;
	let descLinkUrl = '';

	let name = '';
	let descriptionHtml = ''; // stored as HTML for rich editor
	let selectedColor: Color = DEFAULT_THEME;
	let selectedFont: ThemeFont = DEFAULT_FONT;
	// The font picker below previews every face; the stylesheets are tiny and
	// the browser fetches font files only for the samples it actually draws.
	$: if (typeof window !== 'undefined') themeFonts.forEach(ensureThemeFontLoaded);
	let publicUrl = '';
	let socialPreviewImage: string | null = null;
	let displayPictureUrl: string | null = null;
	let rawEvent: any = null;
	let links: Record<SocialLinkKey, string> = {
		instagram: '', x: '', youtube: '', tiktok: '', linkedin: '', website: ''
	};

	// Date & Time state
	let startDate: Date = new Date();
	let endDate: Date = new Date();
	let startTime = '1:30 AM';
	let endTime = '2:30 AM';
	let timezone = '';
	let openStartDatePicker = false;
	let openEndDatePicker = false;
	let openStartTimePicker = false;
	let openEndTimePicker = false;

	// Event Type & Location state
	let eventType: 'Virtual' | 'Physical' | 'Hybrid' = 'Virtual';
	let virtualLink = '';
	/** Join-link reveal policy. Defaults match the event model's own defaults. */
	let meetingLinkVisibility: 'ON_REGISTRATION' | 'BEFORE_START' | 'AT_START' = 'BEFORE_START';
	let revealMinutesBefore = 60;

	/** Which providers Rondwell can create a meeting on for this organizer. */
	const PROVISION_OPTIONS = [
		{ provider: 'GOOGLE' as const, label: 'Google Meet', icon: 'logos:google-meet' },
		{ provider: 'ZOOM' as const, label: 'Zoom', icon: 'logos:zoom-icon' },
		{ provider: 'OUTLOOK' as const, label: 'Teams', icon: 'logos:microsoft-teams' }
	];
	let connectedProviders: Array<'GOOGLE' | 'ZOOM' | 'OUTLOOK'> = [];
	let provisioning: 'GOOGLE' | 'ZOOM' | 'OUTLOOK' | null = null;

	/**
	 * Which providers are both configured on this deployment AND connected by
	 * this organizer. Fetched quietly — a failure just leaves the buttons
	 * disabled with their "connect first" tooltip, which is the correct
	 * fallback and needs no error surface of its own.
	 */
	async function loadConnectedProviders() {
		try {
			const { listIntegrations } = await import('$lib/services/integration.services');
			const res = await listIntegrations();
			connectedProviders = res.integrations
				.filter((i) => !i.needsRefresh && res.available[i.platform] !== false)
				.map((i) => i.platform);
		} catch {
			connectedProviders = [];
		}
	}

	async function handleProvision(
		provider: 'GOOGLE' | 'ZOOM' | 'OUTLOOK',
		label: string
	) {
		// Replacing a link attendees may already hold deserves a confirmation,
		// not a silent overwrite — they would arrive at an empty room.
		const replacing = Boolean(virtualLink.trim());
		if (
			replacing &&
			!confirm(
				`This event already has a meeting link. Replace it with a new ${label} meeting? ` +
					`Anyone who already has the old link will not be able to join.`
			)
		) {
			return;
		}

		provisioning = provider;
		try {
			const { provisionMeeting } = await import('$lib/services/calendar.services');
			const meeting = await provisionMeeting(eventId, provider, replacing);
			virtualLink = meeting.joinUrl;
			toast.success(`${meeting.label} meeting created and saved to this event.`);
		} catch (e: any) {
			toast.error(e?.message ?? `Could not create the ${label} meeting`);
		} finally {
			provisioning = null;
		}
	}
	let physicalAddress = '';
	let showEventTypeModal = false;
	let showLocationModal = false;
	let showVisibilityModal = false;
	let visibility = 'Public';
	let visibilityIcon = 'mdi:web';
	let resolvedLat = 0;
	let resolvedLng = 0;
	let venueName = '';

	// Multi-day state
	let isMultiDay = false;
	let eventDays: Array<{
		dayNumber: number;
		label: string;
		date: Date;
		startTime: string;
		endTime: string;
	}> = [];
	let editDayDatePicker = -1;
	let editDayStartTime = -1;
	let editDayEndTime = -1;

	// Rich text editor
	let editorReady = false;
	let descEditor: Readable<Editor>;

	function initEditor(content: string) {
		if (editorReady && $descEditor) {
			// Editor already exists — just update content
			const current = $descEditor.getHTML();
			if (content && current !== content) {
				$descEditor.commands.setContent(content);
			}
			return;
		}
		descEditor = createEditor({
			extensions: [
				StarterKit,
				PlaceholderExtension.configure({ placeholder: "Who should come? What's the event about?" }),
				Image.configure({ inline: false, allowBase64: false, HTMLAttributes: { class: 'desc-img' } }),
				Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer nofollow', class: 'desc-link' } }),
			],
			content: content || '',
			editorProps: {
				attributes: {
					style: 'font-weight: 300;',
				},
			},
			onUpdate: ({ editor }) => {
				descriptionHtml = editor.getHTML();
			},
		});
		editorReady = true;
	}

	function stripHtml(html: string): string {
		return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
	}

	function triggerDescImageUpload() {
		descImageError = '';
		descImageInput?.click();
	}

	async function handleDescImageUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith('image/')) {
			descImageError = 'Please select an image file.';
			target.value = '';
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			descImageError = 'Image must be 5MB or smaller.';
			target.value = '';
			return;
		}
		uploadingDescImage = true;
		descImageError = '';
		try {
			const url = await uploadEventDescriptionImage(file, eventId);
			$descEditor?.chain().focus().setImage({ src: url }).run();
		} catch (err: any) {
			descImageError = err?.message ?? 'Failed to upload image.';
		} finally {
			uploadingDescImage = false;
			target.value = '';
		}
	}

	function insertDescLink() {
		const value = descLinkUrl.trim();
		if (!value) {
			$descEditor?.chain().focus().extendMarkRange('link').unsetLink().run();
			showDescLinkInput = false;
			return;
		}
		const href = /^https?:\/\//i.test(value) ? value : `https://${value}`;
		$descEditor?.chain().focus().extendMarkRange('link').setLink({ href }).run();
		descLinkUrl = '';
		showDescLinkInput = false;
	}

	onMount(async () => {
		// Which conferencing accounts this organizer has connected, so the
		// "create one for me" buttons are only enabled when they can work.
		void loadConnectedProviders();

		// Use cached event data
		const { event: eventStore, loading: loadingStore } = getEventCache(eventId);
		
		const unsubLoading = loadingStore.subscribe(() => {});
		const unsubEvent = eventStore.subscribe((event) => {
			if (!event) return;
			rawEvent = event;
			name = event.title ?? '';
			descriptionHtml = event.description ?? '';
			// resolveTheme maps retired palettes ("White Black") to their
			// replacement, so saving an old event never silently picks a
			// random palette.
			selectedColor = resolveTheme(event.themeColor);
			selectedFont = resolveThemeFont(event.themeFont);
			publicUrl = event.customLinkSlug ?? '';
			const sl = event.socialLinks ?? {};
			links = {
				instagram: sl.instagram ?? '',
				x: sl.x ?? sl.twitter ?? '',
				youtube: sl.youtube ?? '',
				tiktok: sl.tiktok ?? '',
				linkedin: sl.linkedin ?? '',
				website: sl.website ?? ''
			};
			socialPreviewImage = event.coverPictureUrl ?? event.displayPictureUrl ?? null;
			displayPictureUrl = event.displayPictureUrl ?? null;

			if (event.startDateTime) {
				const sd = new Date(event.startDateTime);
				startDate = sd;
				startTime = sd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
			}
			if (event.endDateTime) {
				const ed = new Date(event.endDateTime);
				endDate = ed;
				endTime = ed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
			}
			timezone = event.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

			const et = (event.eventType ?? 'VIRTUAL').toUpperCase();
			eventType = et === 'VIRTUAL' ? 'Virtual' : et === 'PHYSICAL' ? 'Physical' : et === 'HYBRID' ? 'Hybrid' : 'Virtual';
			virtualLink = event.locationDetails?.virtual?.meetingLink ?? '';
			// `??` on each: an event created before these fields existed has
			// neither, and must land on the same defaults the model applies.
			meetingLinkVisibility = event.meetingLinkVisibility ?? 'BEFORE_START';
			revealMinutesBefore = event.revealMinutesBefore ?? 60;
			physicalAddress = event.locationDetails?.physical?.venueAddress
				?? event.locationDetails?.physical?.resolvedAddress?.formatted_address
				?? event.locationDetails?.physical?.venueName
				?? '';
			venueName = event.locationDetails?.physical?.venueName ?? '';
			resolvedLat = event.locationDetails?.physical?.resolvedAddress?.lat ?? 0;
			resolvedLng = event.locationDetails?.physical?.resolvedAddress?.lng ?? 0;
			visibility = (event.visibility ?? 'PUBLIC').toUpperCase() === 'PRIVATE' ? 'Private' : 'Public';
			visibilityIcon = visibility === 'Private' ? 'mdi:sparkles' : 'mdi:web';

			// Load multi-day state
			isMultiDay = event.isMultiDay ?? false;

			// Initialize or update the editor with the loaded description
			initEditor(descriptionHtml);

			loading = false;
			
			unsubEvent();
			unsubLoading();
		});

		// If event data was already cached (synchronous), editor is already initialized above.
		// If not, create an empty editor now so the UI is ready.
		if (!editorReady) {
			initEditor(descriptionHtml);
		}

		// Load event days if multi-day
		try {
			const days = await getEventDays(eventId);
			if (days.length > 0) {
				eventDays = days.map((d: any) => ({
					dayNumber: d.dayNumber,
					label: d.label || `Day ${d.dayNumber}`,
					date: new Date(d.date),
					startTime: new Date(d.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
					endTime: new Date(d.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
				}));
				isMultiDay = days.length > 1;
			}
		} catch { /* no days yet */ }
	});

	onDestroy(() => {
		$descEditor?.destroy();
	});

	/**
	 * H-75 — the event's timezone is now USED, not just stored.
	 *
	 * This function assembled `"YYYY-MM-DDTHH:mm:00"` and handed it to
	 * `new Date(...)`, which parses a string with no offset as **browser-local**.
	 * So a Lagos-based organizer creating a New York event, selecting
	 * `America/New_York` and typing 7:00 PM, stored `19:00 WAT` = `18:00 UTC`.
	 * The correct instant is `23:00 UTC` — **five hours wrong, at creation.**
	 *
	 * The old body contradicted itself in three lines: one comment said *"Build
	 * a date string in the event's timezone context"* and the next said *"Use
	 * the browser's local timezone (which matches the user's intent)"*. Only the
	 * second was true, and it is the bug.
	 *
	 * `buildZonedInstant` takes the zone as a **required** argument — see
	 * `$lib/utils/eventTime.ts` for why, and for how the offset is derived
	 * without shipping a timezone database.
	 */
	function buildDateTime(date: Date, timeStr: string): string {
		return buildZonedInstant(date, timeStr, resolveEventTimeZone());
	}

	/**
	 * The zone this form is authoring in.
	 *
	 * Falls back to the browser zone only when the form has no explicit zone —
	 * which is the pre-existing behaviour for forms that do not offer a zone
	 * picker, and is correct for them: an organizer editing a session on their
	 * own event means their own clock.
	 */
	function resolveEventTimeZone(): string {
		// The event's own zone when the form has loaded one; the browser's
		// otherwise. H-75 — the point is that the event's zone is CONSULTED,
		// not that a fallback never happens.
		const explicit = timezone;
		if (explicit) return String(explicit);
		try {
			return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
		} catch {
			return 'UTC';
		}
	}

	function formatDate(date: Date) {
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatTime(timeStr: string) {
		return timeStr;
	}

	async function saveChanges() {
		saving = true;
		saveError = '';

		// Validate required fields
		if (!name || !name.trim()) {
			saveError = 'Event name is required.';
			toast.error('Event name is required.');
			saving = false;
			return;
		}

		try {
			const etMap: Record<string, string> = { 'Virtual': 'VIRTUAL', 'Physical': 'PHYSICAL', 'Hybrid': 'HYBRID' };
			const locationDetails: any = {};
			if (eventType === 'Virtual' || eventType === 'Hybrid') {
				/**
				 * Recognised from the parsed URL rather than by substring.
				 *
				 * The previous chain tested `includes('zoom')`, `includes('meet.google')`
				 * and `includes('teams')` against the whole string, so any URL with
				 * those characters anywhere in it — path, query, or a lookalike
				 * domain — was labelled as that vendor. It also could not tell a
				 * genuine link from an unusable one. `detectMeetingPlatform` matches
				 * on `URL.hostname` and rejects non-http(s) outright; the backend
				 * repeats the check on write and is the authority.
				 */
				const detected = detectMeetingPlatform(virtualLink);
				if (!detected) {
					const msg =
						'Enter a valid meeting link starting with https:// (for example a Google Meet, Zoom or Teams URL).';
					saveError = msg;
					toast.error(msg);
					saving = false;
					return;
				}
				locationDetails.virtual = {
					platform: detected.label,
					platformKey: detected.platform,
					meetingLink: detected.joinUrl,
					calendarIntegrations: []
				};
			}
			if (eventType === 'Physical' || eventType === 'Hybrid') {
				locationDetails.physical = {
					venueName: venueName || physicalAddress.split(',')[0]?.trim() || physicalAddress,
					venueAddress: physicalAddress,
					resolvedAddress: { lat: resolvedLat, lng: resolvedLng, formatted_address: physicalAddress },
				};
			}

			await updateEvent(eventId, {
				title: name.trim(),
				description: descriptionHtml,
				themeColor: selectedColor.name,
				themeFont: selectedFont.id,
				customLinkSlug: publicUrl || undefined,
				socialLinks: links,
				startDateTime: buildDateTime(startDate, startTime),
				endDateTime: buildDateTime(endDate, endTime),
				timeZone: timezone || undefined,
				eventType: etMap[eventType] ?? 'VIRTUAL',
				locationDetails,
				// Only meaningful for events that have a join link at all; sending
				// them for a purely physical event would store a policy that governs
				// nothing and read as a setting the organizer never chose.
				...(eventType === 'Virtual' || eventType === 'Hybrid'
					? { meetingLinkVisibility, revealMinutesBefore }
					: {}),
				visibility: visibility === 'Private' ? 'PRIVATE' : 'PUBLIC',
				isMultiDay,
			} as any);

			// Save multi-day data if applicable
			if (isMultiDay && eventDays.length > 0) {
				try {
					const dayPayloads: EventDayPayload[] = eventDays.map((d) => ({
						dayNumber: d.dayNumber,
						label: d.label,
						date: d.date.toISOString(),
						startTime: buildDateTime(d.date, d.startTime),
						endTime: buildDateTime(d.date, d.endTime),
						checkinEnabled: true,
					}));
					await bulkReplaceEventDays(eventId, dayPayloads);
				} catch (e) {
					console.warn('Failed to save event days:', e);
				}
			}

			toast.success('Changes saved successfully.');
			invalidateEventCache(eventId);
		} catch (e: any) {
			const msg = cleanErrorMessage(e.message ?? '');
			saveError = msg;
			toast.error(msg);
		} finally {
			saving = false;
		}
	}

	async function onCoverSelected(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		uploadingCover = true;
		try {
			const url = await uploadEventPhoto(eventId, file, 'COVER');
			socialPreviewImage = url;
		} catch (err: any) {
			toast.error(cleanErrorMessage(err.message ?? 'Failed to upload cover'));
		} finally {
			uploadingCover = false;
			input.value = '';
		}
	}

	async function onAvatarSelected(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		uploadingAvatar = true;
		try {
			const url = await uploadEventPhoto(eventId, file, 'DISPLAY');
			displayPictureUrl = url;
		} catch (err: any) {
			toast.error(cleanErrorMessage(err.message ?? 'Failed to upload display picture'));
		} finally {
			uploadingAvatar = false;
			input.value = '';
		}
	}

	function handleDragOver(event: DragEvent) { event.preventDefault(); }

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		const file = event.dataTransfer?.files?.[0];
		if (!file) return;
		uploadingCover = true;
		uploadEventPhoto(eventId, file, 'COVER')
			.then(url => { socialPreviewImage = url; })
			.catch(err => { toast.error(cleanErrorMessage(err.message ?? 'Failed to upload')); })
			.finally(() => { uploadingCover = false; });
	}

	const socialLinks: { key: SocialLinkKey; icon: string; label: string }[] = [
		{ key: 'instagram', icon: 'mdi:instagram', label: 'instagram.com/' },
		{ key: 'x', icon: 'mdi:twitter', label: 'x.com/' },
		{ key: 'youtube', icon: 'mdi:youtube', label: 'youtube.com/@' },
		{ key: 'tiktok', icon: 'simple-icons:tiktok', label: 'tiktok.com/@' },
		{ key: 'linkedin', icon: 'mdi:linkedin', label: 'linkedin.com/in/' },
		{ key: 'website', icon: 'mdi:web', label: '' },
	];

	const REVEAL_OPTIONS: SelectOption<number>[] = [
		{ value: 15, label: '15 minutes', description: 'Tight gate window right before doors open' },
		{ value: 30, label: '30 minutes', description: 'Half hour prior to event start' },
		{ value: 60, label: '1 hour', description: 'Recommended for smooth attendee arrival', badge: 'DEFAULT', badgeTone: 'purple' },
		{ value: 180, label: '3 hours', description: 'Released early on event day' },
		{ value: 1440, label: '1 day', description: '24 hours ahead of start time' },
	];

	let socialPreviewPlatform: 'all' | 'whatsapp' | 'x' | 'linkedin' | 'facebook' = 'all';
	let copiedShareLink = false;

	function copyShareUrl() {
		const slug = publicUrl || eventId;
		const fullUrl = `https://rondwell.com/e/${slug}`;
		navigator.clipboard?.writeText(fullUrl);
		copiedShareLink = true;
		toast.success('Event URL copied!');
		setTimeout(() => (copiedShareLink = false), 2000);
	}

	$: plainDesc = stripHtml(descriptionHtml);
	$: descPreview = plainDesc || 'Add a short description so guests know what to expect';
	$: sharePath = `rondwell.com/e/${publicUrl || eventId}`;
	$: previewLocation = eventType === 'Virtual' ? 'Online Event' : venueName || physicalAddress || 'Venue TBA';
	$: previewDateLine = `${formatDate(startDate)} · ${startTime}`;
</script>

<input type="file" accept="image/*" class="hidden" bind:this={coverInput} on:change={onCoverSelected} />
<input type="file" accept="image/*" class="hidden" bind:this={avatarInput} on:change={onAvatarSelected} />

<div class="mx-auto w-full max-w-5xl pb-12">
	<!-- Sticky Pro Header & Back Navigation -->
	<div class="sticky top-2 z-30 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200/85 bg-white/85 px-4 py-3 shadow-[0_8px_28px_-12px_rgba(23,22,30,0.12)] backdrop-blur-xl">
		<div class="flex min-w-0 items-center gap-3">
			<button
				type="button"
				aria-label="Back to event overview"
				on:click={() => goto(`/events/${eventId}`)}
				class="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#17161E] shadow-[0_1px_2px_rgba(23,22,30,0.04)] transition hover:border-[#513BE2]/40 hover:bg-[#513BE2]/[0.04] hover:text-[#513BE2]"
			>
				<Icon icon="solar:arrow-left-linear" class="h-4 w-4" />
				<span>Back to Event</span>
			</button>

			<div class="hidden h-5 w-px bg-gray-200 sm:block"></div>

			<div class="min-w-0">
				<div class="flex items-center gap-2">
					<h1 class="truncate text-base font-bold tracking-tight text-[#17161E] sm:text-lg">Edit Event</h1>
					<span class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold {visibility === 'Private'
						? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
						: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'}">
						<span class="h-1.5 w-1.5 rounded-full {visibility === 'Private' ? 'bg-amber-500' : 'bg-emerald-500'}"></span>
						{visibility}
					</span>
				</div>
				{#if name}
					<p class="hidden truncate text-xs text-gray-500 sm:block">{name}</p>
				{/if}
			</div>
		</div>

		<div class="flex items-center gap-2">
			<a
				href="/e/{publicUrl || eventId}"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
			>
				<Icon icon="solar:square-top-down-linear" class="h-3.5 w-3.5 text-gray-500" />
				<span class="hidden sm:inline">View Public Page</span>
				<span class="sm:hidden">View</span>
			</a>
			<button
				type="button"
				on:click={saveChanges}
				disabled={saving || loading}
				class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#513BE2] to-[#7C3AED] px-4 py-2 text-xs font-bold text-white shadow-[0_6px_18px_-6px_rgba(81,59,226,0.65)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
			>
				<Icon icon={saving ? 'solar:refresh-linear' : 'solar:check-circle-bold-duotone'} class="h-4 w-4 {saving ? 'animate-spin' : ''}" />
				{saving ? 'Saving…' : 'Save Changes'}
			</button>
		</div>
	</div>

	{#if loading}
		<div class="animate-pulse space-y-5">
			<div class="h-60 rounded-3xl bg-gray-200"></div>
			<div class="h-12 w-3/4 rounded-2xl bg-gray-200"></div>
			<div class="h-40 rounded-2xl bg-gray-100"></div>
		</div>
	{:else}
		<!-- Hero Cover & Event Identity Card -->
		<div class="mb-6 overflow-visible rounded-3xl border border-gray-200/80 bg-white shadow-[0_8px_30px_-14px_rgba(23,22,30,0.1)]">
			<!-- Cover Banner -->
			<div class="relative h-52 overflow-hidden rounded-t-3xl bg-gradient-to-br from-[#17161E] via-[#261B47] to-[#513BE2] sm:h-64">
				{#if socialPreviewImage}
					<img src={socialPreviewImage} alt="Event cover" class="h-full w-full object-cover" />
					<div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/25"></div>
				{:else}
					<div class="flex h-full w-full flex-col items-center justify-center text-white/75">
						<Icon icon="solar:gallery-wide-bold-duotone" class="h-10 w-10 opacity-70" />
						<span class="mt-2 text-xs font-medium">Upload a 1200×630 cover banner</span>
					</div>
				{/if}

				<div class="absolute top-3.5 right-3.5 flex items-center gap-2">
					<span class="hidden rounded-xl border border-white/15 bg-black/40 px-2.5 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-md sm:inline-flex">
						1200 × 630 recommended
					</span>
					<button
						type="button"
						class="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-black/55 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-black/75 disabled:opacity-60"
						on:click={() => coverInput?.click()}
						disabled={uploadingCover}
					>
						<Icon icon={uploadingCover ? 'solar:refresh-linear' : 'solar:camera-add-bold-duotone'} class="h-4 w-4 {uploadingCover ? 'animate-spin' : ''}" />
						{uploadingCover ? 'Uploading…' : 'Change Cover'}
					</button>
				</div>
			</div>

			<!-- Avatar Overlap & Title Identity -->
			<div class="px-5 pt-0 pb-5 sm:px-7 sm:pb-6">
				<div class="-mt-11 flex items-end justify-between gap-4 sm:-mt-12">
					<button
						type="button"
						class="group relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-2xl border-4 border-white bg-gray-100 shadow-lg transition-transform hover:scale-[1.03] sm:h-22 sm:w-22"
						on:click={() => avatarInput?.click()}
						disabled={uploadingAvatar}
						aria-label="Change event display picture"
					>
						{#if uploadingAvatar}
							<div class="flex h-full w-full items-center justify-center bg-black/50">
								<Icon icon="solar:refresh-linear" class="h-6 w-6 animate-spin text-white" />
							</div>
						{:else if displayPictureUrl}
							<img src={displayPictureUrl} alt="Event icon" class="h-full w-full object-cover" />
							<div class="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
								<Icon icon="solar:camera-bold-duotone" class="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
							</div>
						{:else}
							<img src="/edit-cover-photo.svg" alt="" class="h-full w-full object-cover" />
							<div class="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
								<Icon icon="solar:camera-bold-duotone" class="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
							</div>
						{/if}
					</button>

					<div class="hidden flex-wrap items-center gap-2 pb-1 sm:flex">
						<span class="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
							<Icon icon="solar:calendar-bold-duotone" class="h-3.5 w-3.5 text-[#513BE2]" />
							{previewDateLine}
						</span>
						<span class="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
							<Icon icon="solar:map-point-bold-duotone" class="h-3.5 w-3.5 text-[#513BE2]" />
							{eventType}
						</span>
					</div>
				</div>

				<div class="mt-4">
					<label for="event-title-input" class="sr-only">Event Name</label>
					<input
						id="event-title-input"
						type="text"
						placeholder="Enter your event title"
						bind:value={name}
						class="w-full rounded-xl border border-transparent bg-transparent px-2 py-1.5 text-2xl font-bold tracking-tight text-[#17161E] transition outline-none placeholder:text-gray-300 hover:bg-gray-50/70 focus:border-gray-200 focus:bg-white focus:ring-2 focus:ring-[#513BE2]/15 sm:text-3xl"
					/>
				</div>

				<!-- Description Collapsible Studio -->
				<div class="relative mt-3 rounded-2xl border border-gray-200/80 bg-gray-50/50">
					<button
						type="button"
						class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-gray-50"
						on:click={() => (showDescEditor = !showDescEditor)}
					>
						<div class="flex min-w-0 items-center gap-2.5">
							<Icon icon="solar:document-text-bold-duotone" class="h-4 w-4 shrink-0 text-[#513BE2]" />
							<span class="truncate text-xs sm:text-sm {descriptionHtml ? 'font-medium text-gray-700' : 'text-gray-400'}">
								{descPreview}
							</span>
						</div>
						<span class="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600">
							{showDescEditor ? 'Close' : 'Edit Description'}
							<Icon icon={showDescEditor ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'} class="h-3.5 w-3.5" />
						</span>
					</button>

					{#if showDescEditor && editorReady}
						<div class="border-t border-gray-200/80 bg-white">
							<!-- Toolbar -->
							<div class="flex flex-wrap items-center gap-1 border-b border-gray-100 bg-gray-50/80 px-3 py-2">
								{#if $descEditor}
									<button type="button" on:click={() => $descEditor.chain().focus().toggleBold().run()}
										class="rounded-lg px-2.5 py-1 text-xs font-bold transition hover:bg-gray-200/70 {$descEditor.isActive('bold') ? 'bg-[#17161E] text-white' : 'text-gray-700'}">B</button>
									<button type="button" on:click={() => $descEditor.chain().focus().toggleItalic().run()}
										class="rounded-lg px-2.5 py-1 text-xs italic transition hover:bg-gray-200/70 {$descEditor.isActive('italic') ? 'bg-[#17161E] text-white' : 'text-gray-700'}">I</button>
									<button type="button" on:click={() => $descEditor.chain().focus().toggleStrike().run()}
										class="rounded-lg px-2.5 py-1 text-xs line-through transition hover:bg-gray-200/70 {$descEditor.isActive('strike') ? 'bg-[#17161E] text-white' : 'text-gray-700'}">S</button>
									<div class="mx-1 h-4 w-px bg-gray-200"></div>
									<button type="button" on:click={() => $descEditor.chain().focus().toggleHeading({ level: 1 }).run()}
										class="rounded-lg px-2 py-1 text-xs font-semibold transition hover:bg-gray-200/70 {$descEditor.isActive('heading', { level: 1 }) ? 'bg-[#17161E] text-white' : 'text-gray-700'}">H1</button>
									<button type="button" on:click={() => $descEditor.chain().focus().toggleHeading({ level: 2 }).run()}
										class="rounded-lg px-2 py-1 text-xs font-semibold transition hover:bg-gray-200/70 {$descEditor.isActive('heading', { level: 2 }) ? 'bg-[#17161E] text-white' : 'text-gray-700'}">H2</button>
									<div class="mx-1 h-4 w-px bg-gray-200"></div>
									<button type="button" on:click={() => $descEditor.chain().focus().toggleBulletList().run()}
										class="rounded-lg px-2 py-1 text-xs transition hover:bg-gray-200/70 {$descEditor.isActive('bulletList') ? 'bg-[#17161E] text-white' : 'text-gray-700'}">• List</button>
									<button type="button" on:click={() => $descEditor.chain().focus().toggleOrderedList().run()}
										class="rounded-lg px-2 py-1 text-xs transition hover:bg-gray-200/70 {$descEditor.isActive('orderedList') ? 'bg-[#17161E] text-white' : 'text-gray-700'}">1. List</button>
									<div class="mx-1 h-4 w-px bg-gray-200"></div>
									<button type="button" title="Insert link" on:click={() => { showDescLinkInput = !showDescLinkInput; }}
										class="rounded-lg px-2 py-1 transition hover:bg-gray-200/70 {$descEditor.isActive('link') ? 'bg-[#17161E] text-white' : 'text-gray-700'}">
										<Icon icon="mdi:link-variant" class="text-base" />
									</button>
									<button type="button" title="Insert image" on:click={triggerDescImageUpload} disabled={uploadingDescImage}
										class="rounded-lg px-2 py-1 text-gray-700 transition hover:bg-gray-200/70 disabled:opacity-50">
										{#if uploadingDescImage}
											<Icon icon="mdi:loading" class="animate-spin text-base" />
										{:else}
											<Icon icon="mdi:image-outline" class="text-base" />
										{/if}
									</button>
									<div class="mx-1 h-4 w-px bg-gray-200"></div>
									<button type="button" on:click={() => $descEditor.chain().focus().undo().run()}
										class="rounded-lg px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/70">↩</button>
									<button type="button" on:click={() => $descEditor.chain().focus().redo().run()}
										class="rounded-lg px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/70">↪</button>
								{/if}
							</div>
							<input type="file" accept="image/*" class="hidden" bind:this={descImageInput} on:change={handleDescImageUpload} />
							{#if showDescLinkInput}
								<div class="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2">
									<!-- csp-ignore-next-line — placeholder text -->
									<input type="url" bind:value={descLinkUrl} placeholder="https://example.com"
										class="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-[#513BE2]"
										on:keydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); insertDescLink(); } }} />
									<button type="button" class="rounded-lg bg-[#17161E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2a2838]" on:click={insertDescLink}>Apply</button>
									<button type="button" class="rounded-lg px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-200" on:click={() => { showDescLinkInput = false; descLinkUrl = ''; }}>Cancel</button>
								</div>
							{/if}
							{#if descImageError}
								<div class="border-b border-gray-100 bg-rose-50 px-3 py-1.5 text-xs text-rose-600">{descImageError}</div>
							{/if}
							<div class="desc-editor min-h-[160px] max-h-[300px] overflow-y-auto p-4 text-sm text-gray-800">
								{#if $descEditor}
									<EditorContent editor={$descEditor} />
								{/if}
							</div>
							<div class="flex justify-end border-t border-gray-100 bg-gray-50/70 px-4 py-2.5">
								<button
									type="button"
									class="rounded-xl bg-[#17161E] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#2a2838]"
									on:click={() => (showDescEditor = false)}
								>Done</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Date & Time -->
		<div class="mb-6 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(23,22,30,0.05)] sm:p-6">
			<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
				<div class="flex items-center gap-3">
					<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#513BE2]/10 text-[#513BE2]">
						<Icon icon="solar:calendar-date-bold-duotone" class="h-5 w-5" />
					</span>
					<div>
						<h2 class="text-lg font-bold text-[#17161E]">Date &amp; Time</h2>
						<p class="text-xs text-gray-500">Change the schedule or switch between single-day and multi-day.</p>
					</div>
				</div>
				<div class="flex items-center gap-2.5">
					<span class="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">{timezone || 'UTC'}</span>
					<label class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-1.5">
						<span class="text-xs font-semibold text-gray-700">Multi-Day</span>
						<input type="checkbox" class="peer sr-only" bind:checked={isMultiDay}
							on:change={() => {
								if (isMultiDay && eventDays.length === 0) {
									eventDays = [
										{ dayNumber: 1, label: 'Day 1', date: new Date(startDate), startTime, endTime },
										{ dayNumber: 2, label: 'Day 2', date: new Date(startDate.getTime() + 86400000), startTime: '9:00 AM', endTime: '5:00 PM' },
									];
								} else if (!isMultiDay && eventDays.length > 0) {
									startDate = eventDays[0].date;
									startTime = eventDays[0].startTime;
									endDate = eventDays[0].date;
									endTime = eventDays[0].endTime;
									eventDays = [];
								}
							}}
						/>
						<span class="peer relative h-5 w-9 rounded-full bg-gray-300 peer-checked:bg-[#513BE2] peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-all after:content-[''] peer-checked:after:translate-x-4"></span>
					</label>
				</div>
			</div>

			{#if !isMultiDay}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="rounded-2xl border border-gray-200/80 bg-gray-50/60 p-3.5">
					<p class="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Starts</p>
					<div class="flex gap-2">
						<div class="relative flex-1" use:clickOutside={() => (openStartDatePicker = false)}>
							<button type="button" on:click={() => (openStartDatePicker = !openStartDatePicker)}
								class="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-left text-xs font-semibold text-[#17161E] shadow-xs hover:border-[#513BE2]/40">
								<span>{formatDate(startDate)}</span>
								<Icon icon="solar:calendar-linear" class="h-4 w-4 text-gray-400" />
							</button>
							<DatePickerModal open={openStartDatePicker} bind:selectedDate={startDate} />
						</div>
						<div class="relative w-[132px]" use:clickOutside={() => (openStartTimePicker = false)}>
							<button type="button" on:click={() => (openStartTimePicker = !openStartTimePicker)}
								class="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-xs font-semibold text-[#17161E] shadow-xs hover:border-[#513BE2]/40">
								<span>{startTime}</span>
								<Icon icon="solar:clock-circle-linear" class="h-4 w-4 text-gray-400" />
							</button>
							<TimeModal open={openStartTimePicker} bind:selectedTime={startTime} />
						</div>
					</div>
				</div>
				<div class="rounded-2xl border border-gray-200/80 bg-gray-50/60 p-3.5">
					<p class="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Ends</p>
					<div class="flex gap-2">
						<div class="relative flex-1" use:clickOutside={() => (openEndDatePicker = false)}>
							<button type="button" on:click={() => (openEndDatePicker = !openEndDatePicker)}
								class="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-left text-xs font-semibold text-[#17161E] shadow-xs hover:border-[#513BE2]/40">
								<span>{formatDate(endDate)}</span>
								<Icon icon="solar:calendar-linear" class="h-4 w-4 text-gray-400" />
							</button>
							<DatePickerModal open={openEndDatePicker} bind:selectedDate={endDate} {startDate} />
						</div>
						<div class="relative w-[132px]" use:clickOutside={() => (openEndTimePicker = false)}>
							<button type="button" on:click={() => (openEndTimePicker = !openEndTimePicker)}
								class="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-xs font-semibold text-[#17161E] shadow-xs hover:border-[#513BE2]/40">
								<span>{endTime}</span>
								<Icon icon="solar:clock-circle-linear" class="h-4 w-4 text-gray-400" />
							</button>
							<TimeModal open={openEndTimePicker} bind:selectedTime={endTime} referenceTime={startTime} />
						</div>
					</div>
				</div>
			</div>
			{:else}
			<div class="space-y-3">
				{#each eventDays as day, i}
				<div class="rounded-2xl border border-gray-200/80 bg-gray-50/70 p-3.5" style="overflow: visible; position: relative; z-index: {eventDays.length - i};">
					<div class="mb-2.5 flex items-center justify-between">
						<input
							type="text"
							bind:value={day.label}
							class="w-[180px] rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#17161E] focus:border-[#513BE2] focus:outline-none"
							placeholder="Day {day.dayNumber}"
						/>
						{#if eventDays.length > 2}
						<button type="button" class="text-gray-400 hover:text-rose-500" on:click={() => {
							eventDays = eventDays.filter((_, idx) => idx !== i).map((d, idx) => ({ ...d, dayNumber: idx + 1 }));
						}}>
							<Icon icon="mdi:close" class="text-lg" />
						</button>
						{/if}
					</div>
					<div class="grid grid-cols-1 gap-2 sm:grid-cols-3" style="overflow: visible;">
						<div class="relative" use:clickOutside={() => { if (editDayDatePicker === i) editDayDatePicker = -1; }}>
							<button
								type="button"
								class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-xs font-semibold text-gray-700"
								on:click={() => (editDayDatePicker = editDayDatePicker === i ? -1 : i)}
							>{day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</button>
							{#if editDayDatePicker === i}
								<DatePickerModal open={true} bind:selectedDate={eventDays[i].date} />
							{/if}
						</div>
						<div class="relative" use:clickOutside={() => { if (editDayStartTime === i) editDayStartTime = -1; }}>
							<button
								type="button"
								class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-xs font-semibold text-gray-700"
								on:click={() => (editDayStartTime = editDayStartTime === i ? -1 : i)}
							>{day.startTime}</button>
							{#if editDayStartTime === i}
								<TimeModal open={true} bind:selectedTime={eventDays[i].startTime} />
							{/if}
						</div>
						<div class="relative" use:clickOutside={() => { if (editDayEndTime === i) editDayEndTime = -1; }}>
							<button
								type="button"
								class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-xs font-semibold text-gray-700"
								on:click={() => (editDayEndTime = editDayEndTime === i ? -1 : i)}
							>{day.endTime}</button>
							{#if editDayEndTime === i}
								<TimeModal open={true} bind:selectedTime={eventDays[i].endTime} referenceTime={eventDays[i].startTime} />
							{/if}
						</div>
					</div>
				</div>
				{/each}

				{#if eventDays.length < 14}
				<button
					type="button"
					class="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 py-2.5 text-xs font-semibold text-gray-600 transition hover:border-[#513BE2] hover:text-[#513BE2]"
					on:click={() => {
						const last = eventDays[eventDays.length - 1];
						const nextDate = last ? new Date(last.date.getTime() + 86400000) : new Date();
						eventDays = [...eventDays, { dayNumber: eventDays.length + 1, label: `Day ${eventDays.length + 1}`, date: nextDate, startTime: '9:00 AM', endTime: '5:00 PM' }];
					}}
				>
					<Icon icon="mdi:plus" class="text-base" /> Add Day
				</button>
				{/if}
			</div>
			{/if}
		</div>

		<!-- Event Type & Location -->
		<div class="mb-6 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(23,22,30,0.05)] sm:p-6">
			<div class="mb-5 flex items-center gap-3">
				<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
					<Icon icon="solar:map-point-wave-bold-duotone" class="h-5 w-5" />
				</span>
				<div>
					<h2 class="text-lg font-bold text-[#17161E]">Event Type &amp; Location</h2>
					<p class="text-xs text-gray-500">Choose how guests attend and configure venue or join link privacy.</p>
				</div>
			</div>

			<div class="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
				{#each [{ label: 'Virtual', icon: 'solar:videocamera-record-bold-duotone', desc: 'Online stream or meeting' }, { label: 'Physical', icon: 'solar:map-point-bold-duotone', desc: 'In-person venue' }, { label: 'Hybrid', icon: 'solar:laptop-phone-bold-duotone', desc: 'Both online & in-person' }] as opt}
				<button
					type="button"
					class="flex items-center gap-3 rounded-2xl border p-4 text-left transition-all {eventType === opt.label
						? 'border-[#513BE2] bg-[#513BE2]/[0.05] ring-2 ring-[#513BE2]/15'
						: 'border-gray-200 bg-white hover:border-gray-300'}"
					on:click={() => { eventType = opt.label as 'Virtual' | 'Physical' | 'Hybrid'; }}
				>
					<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl {eventType === opt.label ? 'bg-[#513BE2] text-white' : 'bg-gray-100 text-gray-500'}">
						<Icon icon={opt.icon} class="h-5 w-5" />
					</span>
					<span class="min-w-0">
						<span class="block text-sm font-bold text-[#17161E]">{opt.label}</span>
						<span class="block text-xs text-gray-500">{opt.desc}</span>
					</span>
				</button>
				{/each}
			</div>

			<!-- Virtual Link -->
			{#if eventType === 'Virtual' || eventType === 'Hybrid'}
			<div class="mb-4">
				<label for="virtual-meeting-url" class="mb-1.5 block text-xs font-semibold text-gray-700">
					Virtual Meeting Link
				</label>
				<!-- csp-ignore-next-line — placeholder text -->
				<input
					id="virtual-meeting-url"
					type="url"
					bind:value={virtualLink}
					placeholder="https://meet.google.com/abc-defg-hij"
					class="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#17161E] placeholder-gray-400 outline-none focus:border-[#513BE2] focus:ring-2 focus:ring-[#513BE2]/15"
				/>

				<div class="mt-2.5 flex flex-wrap items-center gap-2">
					<span class="text-xs text-gray-500">or let Rondwell create one:</span>
					{#each PROVISION_OPTIONS as option (option.provider)}
						{@const connected = connectedProviders.includes(option.provider)}
						<button
							type="button"
							disabled={provisioning !== null || !connected}
							title={connected
								? `Create a ${option.label} meeting for this event`
								: `Connect ${option.label} in Settings first`}
							on:click={() => handleProvision(option.provider, option.label)}
							class="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
						>
							<Icon icon={option.icon} class="text-[14px]" />
							{provisioning === option.provider ? 'Creating…' : option.label}
						</button>
					{/each}
					{#if connectedProviders.length === 0}
						<a href="/settings" class="text-xs font-semibold text-[#513BE2] hover:underline">
							Connect an account
						</a>
					{/if}
				</div>
				{#if virtualLink.trim()}
					{@const detected = detectMeetingPlatform(virtualLink)}
					{#if detected && detected.platform !== 'OTHER'}
						<p class="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
							<Icon icon={PLATFORM_BRANDS[detected.platform].icon} class="text-sm" />
							Recognised as {detected.label}{detected.meetingId
								? ` · meeting ${detected.meetingId}`
								: ''}
						</p>
					{:else if detected}
						<p class="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
							<Icon icon="mdi:link-variant" class="text-sm" />
							Valid link. Attendees will see a generic “Join the event” button.
						</p>
					{:else}
						<p class="mt-2 flex items-center gap-1.5 text-xs text-rose-600">
							<Icon icon="mdi:alert-circle-outline" class="text-sm" />
							That doesn’t look like a meeting link. It should start with https://
						</p>
					{/if}
				{/if}

				<div class="mt-4 rounded-2xl border border-gray-200/80 bg-gray-50/70 p-4">
					<div class="mb-3 flex items-start gap-2.5">
						<Icon icon="solar:shield-keyhole-bold-duotone" class="mt-0.5 h-4 w-4 text-[#513BE2]" />
						<div>
							<p class="text-xs font-bold text-[#17161E]">Who can see the join link</p>
							<p class="mt-0.5 text-[11px] text-gray-500">
								Only shown to registered attendees. Control when the meeting URL becomes visible.
							</p>
						</div>
					</div>

					<div class="space-y-2">
						{#each [
							{ value: 'ON_REGISTRATION', label: 'As soon as they register', hint: 'Best for free or internal events' },
							{ value: 'BEFORE_START', label: 'Shortly before the event starts', hint: 'Recommended' },
							{ value: 'AT_START', label: 'Only once the event begins', hint: 'Strictest' }
						] as option (option.value)}
							<label
								class="flex cursor-pointer items-start gap-2.5 rounded-xl border px-3.5 py-2.5 transition-all {meetingLinkVisibility ===
								option.value
									? 'border-[#513BE2] bg-white ring-1 ring-[#513BE2]/20'
									: 'border-gray-200 bg-white hover:border-gray-300'}"
							>
								<input
									type="radio"
									bind:group={meetingLinkVisibility}
									value={option.value}
									class="mt-0.5 accent-[#513BE2]"
								/>
								<span class="flex-1">
									<span class="block text-xs font-semibold text-[#17161E]">{option.label}</span>
									<span class="block text-[11px] text-gray-500">{option.hint}</span>
								</span>
							</label>
						{/each}
					</div>

					{#if meetingLinkVisibility === 'BEFORE_START'}
						<div class="mt-3 flex flex-wrap items-center gap-2.5">
							<label for="reveal-minutes" class="text-xs font-semibold text-gray-600">Show join link</label>
							<div class="w-44">
								<CustomSelect
									id="reveal-minutes"
									options={REVEAL_OPTIONS}
									bind:value={revealMinutesBefore}
									size="sm"
									minWidth={170}
									ariaLabel="Minutes before event start to reveal link"
								/>
							</div>
							<span class="text-xs font-medium text-gray-600">before start time</span>
						</div>
					{/if}
				</div>
			</div>
			{/if}

			<!-- Physical Address -->
			{#if eventType === 'Physical' || eventType === 'Hybrid'}
			<div class="mb-2">
				<p class="mb-1.5 block text-xs font-semibold text-gray-700">
					Venue Address
				</p>
				<AddressAutocomplete
					bind:value={physicalAddress}
					placeholder="e.g. 7 Ibiyinka Olorunbe, Victoria Island, Lagos"
					on:select={(e) => {
						physicalAddress = e.detail.formatted_address;
						venueName = e.detail.venueName;
						resolvedLat = e.detail.lat;
						resolvedLng = e.detail.lng;
					}}
				/>
			</div>
			{/if}
		</div>

		<!-- Visibility -->
		<div class="mb-6 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(23,22,30,0.05)] sm:p-6">
			<div class="mb-4 flex items-center gap-3">
				<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
					<Icon icon="solar:eye-bold-duotone" class="h-5 w-5" />
				</span>
				<div>
					<h2 class="text-lg font-bold text-[#17161E]">Visibility</h2>
					<p class="text-xs text-gray-500">Control who can discover and register for this event.</p>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<button
					type="button"
					class="flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-all {visibility === 'Public'
						? 'border-[#513BE2] bg-[#513BE2]/[0.05] ring-2 ring-[#513BE2]/15'
						: 'border-gray-200 bg-white hover:border-gray-300'}"
					on:click={() => { visibility = 'Public'; visibilityIcon = 'mdi:web'; }}
				>
					<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl {visibility === 'Public' ? 'bg-[#513BE2] text-white' : 'bg-gray-100 text-gray-500'}">
						<Icon icon="solar:global-bold-duotone" class="h-5 w-5" />
					</span>
					<div class="min-w-0 flex-1">
						<p class="text-sm font-bold text-[#17161E]">Public</p>
						<p class="mt-0.5 text-xs text-gray-500">Shown on your collection and eligible to be featured on Discover.</p>
					</div>
				</button>
				<button
					type="button"
					class="flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-all {visibility === 'Private'
						? 'border-[#513BE2] bg-[#513BE2]/[0.05] ring-2 ring-[#513BE2]/15'
						: 'border-gray-200 bg-white hover:border-gray-300'}"
					on:click={() => { visibility = 'Private'; visibilityIcon = 'mdi:sparkles'; }}
				>
					<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl {visibility === 'Private' ? 'bg-[#513BE2] text-white' : 'bg-gray-100 text-gray-500'}">
						<Icon icon="solar:lock-keyhole-bold-duotone" class="h-5 w-5" />
					</span>
					<div class="min-w-0 flex-1">
						<p class="text-sm font-bold text-[#17161E]">Private</p>
						<p class="mt-0.5 text-xs text-gray-500">Unlisted. Only guests with the direct event link can view &amp; register.</p>
					</div>
				</button>
			</div>
		</div>

		<!-- Customization -->
		<div class="mb-6 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(23,22,30,0.05)] sm:p-6">
			<div class="mb-5 flex items-center gap-3">
				<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
					<Icon icon="solar:palette-bold-duotone" class="h-5 w-5" />
				</span>
				<div>
					<h2 class="text-lg font-bold text-[#17161E]">Page Appearance &amp; URL</h2>
					<p class="text-xs text-gray-500">Customize theme palette, display typography, and your custom link.</p>
				</div>
			</div>

			<!-- Theme colour -->
			<div class="mb-5">
				<p id="theme-color-label" class="mb-2 block text-xs font-semibold text-gray-700">Theme Color</p>
				<div class="flex flex-wrap items-center gap-3" role="radiogroup" aria-labelledby="theme-color-label">
					{#each colors as color (color.name)}
						{@const isSelected = selectedColor.name === color.name}
						<button
							type="button"
							role="radio"
							aria-checked={isSelected}
							title={color.name}
							aria-label={color.name}
							class="relative h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 {isSelected ? 'ring-2 ring-[#513BE2]/25 scale-105' : ''}"
							style="background: {themeSwatch(color)}; border-color: {isSelected ? color.button : '#e5e7eb'};"
							on:click={() => (selectedColor = color)}
						>
							{#if isSelected}
								<span class="absolute inset-0 flex items-center justify-center">
									<svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden="true">
										<path d="M2 6l3 3 5-5" stroke={color.scheme === 'dark' ? '#FFFFFF' : color.button} stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
								</span>
							{/if}
						</button>
					{/each}
				</div>
				<p class="mt-2 text-xs text-gray-500">Selected palette: <span class="font-semibold text-[#17161E] capitalize">{selectedColor.name}</span></p>
			</div>

			<!-- Theme font -->
			<div class="mb-5">
				<p id="theme-font-label" class="mb-2 block text-xs font-semibold text-gray-700">Display Font</p>
				<div class="grid grid-cols-3 gap-2.5 sm:grid-cols-5" role="radiogroup" aria-labelledby="theme-font-label">
					{#each themeFonts as font (font.id)}
						{@const isSelected = selectedFont.id === font.id}
						<button
							type="button"
							role="radio"
							aria-checked={isSelected}
							class="flex flex-col items-center gap-1 rounded-xl border bg-white px-2 py-3 transition hover:border-[#513BE2]/40 {isSelected ? 'border-[#513BE2] bg-[#513BE2]/[0.04] ring-2 ring-[#513BE2]/15' : 'border-gray-200'}"
							on:click={() => (selectedFont = font)}
						>
							<span class="text-xl leading-tight text-[#17161E]" style="font-family: {font.display}; font-synthesis: none;">Ag</span>
							<span class="truncate text-[11px] font-semibold text-gray-700">{font.label}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Public URL -->
			<div>
				<div class="mb-1.5 flex items-center justify-between">
					<label for="public-url" class="text-xs font-semibold text-gray-700">Custom Public URL</label>
					<button
						type="button"
						class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
						on:click={copyShareUrl}
					>
						<Icon icon={copiedShareLink ? 'solar:check-circle-bold' : 'solar:copy-linear'} class="h-3.5 w-3.5 {copiedShareLink ? 'text-emerald-600' : ''}" />
						{copiedShareLink ? 'Copied' : 'Copy URL'}
					</button>
				</div>
				<div class="flex max-w-xl items-center overflow-hidden rounded-xl border border-gray-200 bg-white focus-within:border-[#513BE2] focus-within:ring-2 focus-within:ring-[#513BE2]/15">
					<span class="border-r border-gray-200 bg-gray-50 px-3 py-2.5 font-mono text-xs text-gray-500">rondwell.com/e/</span>
					<input
						id="public-url"
						type="text"
						placeholder="some-event-slug"
						bind:value={publicUrl}
						autocomplete="off"
						autocapitalize="off"
						spellcheck="false"
						class="h-[42px] min-w-0 flex-1 bg-white px-3 font-mono text-xs text-[#17161E] focus:outline-none sm:text-sm"
					/>
				</div>
				<p class="mt-1.5 text-xs text-gray-400">
					Lowercase letters, numbers and hyphens only. Old slugs redirect automatically.
				</p>
			</div>
		</div>

		<!-- Links -->
		<div class="mb-6 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(23,22,30,0.05)] sm:p-6">
			<div class="mb-4 flex items-center gap-3">
				<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
					<Icon icon="solar:link-minimalistic-2-bold-duotone" class="h-5 w-5" />
				</span>
				<div>
					<h2 class="text-lg font-bold text-[#17161E]">Social &amp; Website Links</h2>
					<p class="text-xs text-gray-500">Displayed as clickable badges on your public event page.</p>
				</div>
			</div>
			<div class="grid w-full grid-cols-1 gap-3.5 sm:grid-cols-2">
				{#each socialLinks as { key, icon, label }}
					<div class="flex items-center gap-3">
						<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600">
							<Icon {icon} class="h-5 w-5" />
						</span>
						<div class="flex h-[42px] min-w-0 flex-1 items-center overflow-hidden rounded-xl border border-gray-200 bg-white focus-within:border-[#513BE2] focus-within:ring-2 focus-within:ring-[#513BE2]/15">
							{#if label}
								<div class="pointer-events-none flex h-full items-center border-r border-gray-200 bg-gray-50 px-2.5 text-xs text-gray-500">
									{label}
								</div>
							{/if}
							<!-- csp-ignore-next-line — placeholder text -->
							<input
								type="text"
								bind:value={links[key]}
								placeholder={key === 'website' ? 'https://yourwebsite.com' : 'username'}
								class="h-full min-w-0 flex-1 bg-white px-3 text-sm text-[#17161E] focus:outline-none"
							/>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Pro Social Media Share & Open Graph Preview Studio -->
		<div class="mb-6 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(23,22,30,0.05)] sm:p-6">
			<div class="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
				<div class="flex items-center gap-3">
					<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#513BE2]/10 text-[#513BE2]">
						<Icon icon="solar:share-circle-bold-duotone" class="h-5 w-5" />
					</span>
					<div>
						<div class="flex flex-wrap items-center gap-2">
							<h2 class="text-lg font-bold text-[#17161E]">Social Media Share Preview</h2>
							<span class="rounded-full bg-[#513BE2]/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#513BE2]">
								1200×630 (1.91:1)
							</span>
						</div>
						<p class="text-xs text-gray-500">Live preview of how your link renders across messaging &amp; social feeds.</p>
					</div>
				</div>

				<button
					type="button"
					on:click={copyShareUrl}
					class="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#17161E] transition hover:border-[#513BE2]/40 hover:bg-[#513BE2]/[0.04]"
				>
					<Icon icon={copiedShareLink ? 'solar:check-circle-bold' : 'solar:copy-linear'} class="h-3.5 w-3.5 {copiedShareLink ? 'text-emerald-600' : 'text-[#513BE2]'}" />
					{copiedShareLink ? 'Copied Share Link' : 'Copy Share Link'}
				</button>
			</div>

			<!-- Drag-and-Drop Cover Upload Bar -->
			<button
				type="button"
				on:dragover={handleDragOver}
				on:drop={handleDrop}
				on:click={() => coverInput?.click()}
				class="mt-4 flex w-full cursor-pointer flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/70 px-4 py-3 text-left transition hover:border-[#513BE2]/50 hover:bg-[#513BE2]/[0.03]"
			>
				<div class="flex items-center gap-3">
					{#if socialPreviewImage}
						<img src={socialPreviewImage} alt="Social OG cover" class="h-12 w-20 rounded-xl border border-gray-200 object-cover" />
					{:else}
						<span class="flex h-12 w-20 items-center justify-center rounded-xl bg-gray-200/70 text-gray-400">
							<Icon icon="solar:gallery-wide-linear" class="h-5 w-5" />
						</span>
					{/if}
					<div>
						<p class="text-xs font-bold text-[#17161E]">
							{uploadingCover ? 'Uploading cover image…' : 'Drop a new cover image or click to replace'}
						</p>
						<p class="text-[11px] text-gray-500">Social cards automatically sync your event cover, title &amp; description.</p>
					</div>
				</div>
				<span class="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700">
					Choose File
				</span>
			</button>

			<!-- Platform Preview Switcher -->
			<div class="mt-5 inline-flex flex-wrap gap-1 rounded-2xl border border-gray-200/80 bg-[#F3F2F8] p-1">
				{#each [
					{ id: 'all', label: 'All Platforms', icon: 'solar:widget-4-bold-duotone' },
					{ id: 'whatsapp', label: 'WhatsApp', icon: 'logos:whatsapp-icon' },
					{ id: 'x', label: 'X (Twitter)', icon: 'ri:twitter-x-fill' },
					{ id: 'linkedin', label: 'LinkedIn', icon: 'logos:linkedin-icon' },
					{ id: 'facebook', label: 'Facebook', icon: 'logos:facebook' },
				] as tab}
					<button
						type="button"
						on:click={() => (socialPreviewPlatform = tab.id as any)}
						class="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition {socialPreviewPlatform === tab.id ? 'bg-white text-[#17161E] shadow-xs' : 'text-gray-600 hover:text-[#17161E]'}"
					>
						<Icon icon={tab.icon} class="h-3.5 w-3.5" />
						{tab.label}
					</button>
				{/each}
			</div>

			<!-- Preview Cards Grid -->
			<div class="mt-5 grid grid-cols-1 gap-5 {socialPreviewPlatform === 'all' ? 'lg:grid-cols-2' : 'max-w-xl'}">
				<!-- 1. WhatsApp Rich Chat Preview -->
				{#if socialPreviewPlatform === 'all' || socialPreviewPlatform === 'whatsapp'}
					<div class="overflow-hidden rounded-2xl border border-gray-200 bg-[#EFEAE2] shadow-xs">
						<div class="flex items-center justify-between border-b border-black/5 bg-[#075E54] px-3.5 py-2 text-white">
							<div class="flex items-center gap-2">
								<Icon icon="logos:whatsapp-icon" class="h-4 w-4" />
								<span class="text-xs font-semibold">WhatsApp Link Preview</span>
							</div>
							<span class="text-[10px] text-emerald-200">Mobile &amp; Web</span>
						</div>
						<div class="p-4">
							<div class="ml-auto max-w-[92%] rounded-2xl rounded-tr-sm bg-[#D9FDD3] p-2 shadow-xs">
								<div class="overflow-hidden rounded-xl border-l-4 border-[#00A884] bg-[#CFEFD0]/75">
									<div class="aspect-[1.91/1] w-full bg-gray-200">
										{#if socialPreviewImage}
											<img src={socialPreviewImage} alt="WhatsApp OG" class="h-full w-full object-cover" />
										{:else}
											<div class="flex h-full items-center justify-center text-gray-400">
												<Icon icon="solar:gallery-wide-linear" class="h-8 w-8" />
											</div>
										{/if}
									</div>
									<div class="px-2.5 py-2">
										<p class="line-clamp-1 text-xs font-bold text-[#111B21]">{name || 'Your Event Name'}</p>
										<p class="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[#54656F]">
											{plainDesc || `${previewDateLine} · ${previewLocation}`}
										</p>
										<p class="mt-1 text-[10px] font-medium text-[#667781]">rondwell.com</p>
									</div>
								</div>
								<div class="mt-1.5 flex items-end justify-between gap-2 px-1">
									<span class="truncate text-xs text-[#027EB5] underline">{sharePath}</span>
									<span class="shrink-0 text-[10px] text-[#667781]">2:45 PM ✓✓</span>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- 2. X / Twitter Large Summary Card -->
				{#if socialPreviewPlatform === 'all' || socialPreviewPlatform === 'x'}
					<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
						<div class="flex items-center justify-between border-b border-gray-100 bg-black px-3.5 py-2 text-white">
							<div class="flex items-center gap-2">
								<Icon icon="ri:twitter-x-fill" class="h-3.5 w-3.5" />
								<span class="text-xs font-semibold">X (Twitter) Summary Large Card</span>
							</div>
							<span class="text-[10px] text-gray-400">Feed Card</span>
						</div>
						<div class="p-4">
							<div class="flex gap-2.5">
								<div class="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#17161E]">
									{#if displayPictureUrl}
										<img src={displayPictureUrl} alt="" class="h-full w-full object-cover" />
									{:else}
										<div class="flex h-full w-full items-center justify-center text-xs font-bold text-white">R</div>
									{/if}
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-1.5 text-xs">
										<span class="font-bold text-[#0F1419] truncate">{name || 'Rondwell Event'}</span>
										<Icon icon="solar:verified-check-bold" class="h-3.5 w-3.5 text-[#1D9BF0]" />
										<span class="text-[#536471]">@rondwell</span>
									</div>
									<p class="mt-1 text-xs text-[#0F1419]">
										Joining us on {previewDateLine}? Reserve your spot: <span class="text-[#1D9BF0]">{sharePath}</span>
									</p>

									<div class="relative mt-2.5 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
										<div class="aspect-[1.91/1] w-full">
											{#if socialPreviewImage}
												<img src={socialPreviewImage} alt="X Preview" class="h-full w-full object-cover" />
											{:else}
												<div class="flex h-full items-center justify-center text-gray-400">
													<Icon icon="solar:gallery-wide-linear" class="h-9 w-9" />
												</div>
											{/if}
										</div>
										<span class="absolute bottom-2.5 left-2.5 rounded-md bg-black/75 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
											{name || 'rondwell.com'}
										</span>
									</div>
									<p class="mt-1 text-[11px] text-[#536471]">From rondwell.com</p>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- 3. LinkedIn Feed Card -->
				{#if socialPreviewPlatform === 'all' || socialPreviewPlatform === 'linkedin'}
					<div class="overflow-hidden rounded-2xl border border-gray-200 bg-[#F4F2EE] shadow-xs">
						<div class="flex items-center justify-between border-b border-gray-200/70 bg-white px-3.5 py-2">
							<div class="flex items-center gap-2">
								<Icon icon="logos:linkedin-icon" class="h-3.5 w-3.5" />
								<span class="text-xs font-semibold text-[#17161E]">LinkedIn Link Post</span>
							</div>
							<span class="text-[10px] text-gray-500">Professional Feed</span>
						</div>
						<div class="p-4">
							<div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
								<div class="aspect-[1.91/1] w-full bg-gray-100">
									{#if socialPreviewImage}
										<img src={socialPreviewImage} alt="LinkedIn OG" class="h-full w-full object-cover" />
									{:else}
										<div class="flex h-full items-center justify-center text-gray-400">
											<Icon icon="solar:gallery-wide-linear" class="h-9 w-9" />
										</div>
									{/if}
								</div>
								<div class="border-t border-gray-100 bg-[#EEF3F8] px-3.5 py-2.5">
									<p class="line-clamp-1 text-[13px] font-semibold text-[#000000E6]">{name || 'Your Event Name'}</p>
									<p class="mt-0.5 text-[11px] text-[#00000099]">rondwell.com · {previewDateLine} · {previewLocation}</p>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- 4. Facebook / Open Graph Card -->
				{#if socialPreviewPlatform === 'all' || socialPreviewPlatform === 'facebook'}
					<div class="overflow-hidden rounded-2xl border border-gray-200 bg-[#F0F2F5] shadow-xs">
						<div class="flex items-center justify-between border-b border-gray-200/70 bg-white px-3.5 py-2">
							<div class="flex items-center gap-2">
								<Icon icon="logos:facebook" class="h-4 w-4" />
								<span class="text-xs font-semibold text-[#17161E]">Facebook / Open Graph</span>
							</div>
							<span class="text-[10px] text-gray-500">og:image</span>
						</div>
						<div class="p-4">
							<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
								<div class="aspect-[1.91/1] w-full bg-[#F0F2F5]">
									{#if socialPreviewImage}
										<img src={socialPreviewImage} alt="OG Preview" class="h-full w-full object-cover" />
									{:else}
										<div class="flex h-full flex-col items-center justify-center gap-2 text-gray-300">
											<Icon icon="mdi:image-outline" class="text-5xl" />
											<span class="text-xs">No cover image</span>
										</div>
									{/if}
								</div>
								<div class="border-t border-gray-200/80 bg-[#F0F2F5] px-3.5 py-2.5">
									<p class="text-[10px] font-semibold uppercase tracking-wider text-[#65676B]">rondwell.com</p>
									<p class="mt-0.5 line-clamp-1 text-[13px] font-bold leading-tight text-[#050505]">{name || 'Your Event Name'}</p>
									<p class="mt-0.5 line-clamp-2 text-xs leading-snug text-[#65676B]">{plainDesc || 'Your event description will appear here when shared.'}</p>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Bottom Action Bar -->
		<div class="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200/80 bg-white px-5 py-4 shadow-[0_2px_12px_-4px_rgba(23,22,30,0.05)]">
			<p class="text-xs text-gray-500">Changes publish immediately to your public event page and Web SDK embeds.</p>
			<div class="flex items-center gap-2.5">
				<button
					type="button"
					on:click={() => goto(`/events/${eventId}`)}
					class="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					type="button"
					on:click={saveChanges}
					disabled={saving}
					class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#513BE2] to-[#7C3AED] px-5 py-2.5 text-xs font-bold text-white shadow-[0_6px_18px_-6px_rgba(81,59,226,0.65)] transition hover:brightness-110 disabled:opacity-50"
				>
					<Icon icon={saving ? 'solar:refresh-linear' : 'solar:check-circle-bold-duotone'} class="h-4 w-4 {saving ? 'animate-spin' : ''}" />
					{saving ? 'Saving…' : 'Save Changes'}
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(.desc-editor .ProseMirror) {
		outline: none;
		min-height: 80px;
		line-height: 1.6;
		font-weight: 300 !important;
	}
	:global(.desc-editor .ProseMirror p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		color: #9ca3af;
		pointer-events: none;
		float: left;
		height: 0;
	}
	:global(.desc-editor .ProseMirror h1) { font-size: 1.4rem; font-weight: 700 !important; margin-bottom: 0.5rem; }
	:global(.desc-editor .ProseMirror h2) { font-size: 1.15rem; font-weight: 600 !important; margin-bottom: 0.4rem; }
	:global(.desc-editor .ProseMirror p) { margin-bottom: 0.5rem; font-weight: 300 !important; }
	:global(.desc-editor .ProseMirror ul) { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.5rem; font-weight: 300 !important; }
	:global(.desc-editor .ProseMirror ol) { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.5rem; font-weight: 300 !important; }
	:global(.desc-editor .ProseMirror li) { font-weight: 300 !important; }
	:global(.desc-editor .ProseMirror strong) { font-weight: 700 !important; }
	:global(.desc-editor .ProseMirror em) { font-style: italic; }
	:global(.desc-editor .ProseMirror a) { color: #7c3aed; text-decoration: underline; }
	:global(.desc-editor .ProseMirror img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
		margin: 0.5rem 0;
		display: block;
	}
	:global(.desc-editor .ProseMirror img.ProseMirror-selectednode) {
		outline: 2px solid #7c3aed;
	}
</style>
