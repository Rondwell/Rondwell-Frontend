<!--
	Platform broadcasts — Rondwell's own marketing and announcement emails.

	Distinct from the organizer-owned event blast and the collection newsletter:
	these go out under Rondwell's name to Rondwell's users, so they use the
	platform's own template and draw on no organizer allowance.

	The composer reuses the TipTap setup from the collection newsletter modal
	(same extensions, same toolbar, same ProseMirror styling) and adds the two
	things a marketing send needs on top: a configurable call-to-action button
	and an audience picker that shows the reach before anything is sent.
-->
<script lang="ts">
	import {
		AUDIENCE_OPTIONS,
		BLAST_STATUS_STYLES,
		cancelBlast,
		createBlast,
		deleteBlast,
		getBlast,
		listBlasts,
		previewAudience,
		sendBlast,
		sendTestBlast,
		updateBlast,
		type AudienceCounts,
		type BlastAudience,
		type BlastPayload,
		type EmailBlast
	} from '$lib/services/adminBlast.services';
	import { getAdminUser } from '$lib/services/admin.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import Image from '@tiptap/extension-image';
	import Link from '@tiptap/extension-link';
	import PlaceholderExtension from '@tiptap/extension-placeholder';
	import StarterKit from '@tiptap/starter-kit';
	import { onDestroy, onMount } from 'svelte';
	import { createEditor, Editor, EditorContent } from 'svelte-tiptap';
	import type { Readable } from 'svelte/store';

	// ── List ─────────────────────────────────────────────────────────────
	let blasts: EmailBlast[] = [];
	let total = 0;
	let loading = true;
	let listError = '';
	let statusFilter = '';
	let refreshTimer: ReturnType<typeof setInterval> | null = null;

	// ── Composer ─────────────────────────────────────────────────────────
	let showComposer = false;
	let editingId: string | null = null;
	let subject = '';
	let heading = '';
	let previewText = '';
	let htmlContent = '';
	let heroImageUrl = '';

	// CTA
	let ctaEnabled = false;
	let ctaText = '';
	let ctaUrl = '';
	let ctaColor = '#513BE2';
	let ctaTextColor = '#FFFFFF';
	let ctaStyle: 'solid' | 'outline' = 'solid';

	// Audience
	let audience: BlastAudience = 'ALL';
	let customEmailsRaw = '';
	let counts: AudienceCounts | null = null;
	let countsLoading = false;
	let countsError = '';
	let countsTimer: ReturnType<typeof setTimeout>;

	// Channels
	let channelEmail = true;
	let channelInApp = false;
	let inAppTitle = '';
	let inAppBody = '';

	// Scheduling
	let mode: 'now' | 'schedule' | 'draft' = 'now';
	let scheduledLocal = '';

	// Flow
	let saving = false;
	let composerError = '';
	let successMsg = '';
	let testing = false;
	let confirmSend = false;
	let showPreview = false;

	let emailEditor: Readable<Editor>;
	let showLinkInput = false;
	let linkUrl = '';

	$: adminUser = getAdminUser();
	$: isSuperAdmin = adminUser?.role === 'super_admin';

	$: customEmails = customEmailsRaw
		.split(/[\s,;]+/)
		.map((e) => e.trim().toLowerCase())
		.filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

	$: reach = audience === 'CUSTOM' ? customEmails.length : (counts?.withEmail ?? null);

	$: canSubmit =
		subject.trim().length >= 3 &&
		htmlContent.replace(/<[^>]*>/g, '').trim().length >= 10 &&
		(channelEmail || channelInApp) &&
		(audience !== 'CUSTOM' || customEmails.length > 0) &&
		(!ctaEnabled || (ctaText.trim() && /^https?:\/\//i.test(ctaUrl.trim()))) &&
		(mode !== 'schedule' || Boolean(scheduledLocal)) &&
		!saving;

	onMount(() => {
		load();
		// A send runs in the background on the server, so the list needs to keep
		// itself current while a blast is in flight.
		refreshTimer = setInterval(() => {
			if (!showComposer && blasts.some((b) => b.status === 'SENDING')) load(true);
		}, 5000);
	});

	onDestroy(() => {
		if (refreshTimer) clearInterval(refreshTimer);
		$emailEditor?.destroy();
	});

	async function load(silent = false) {
		if (!silent) loading = true;
		listError = '';
		try {
			const result = await listBlasts({ limit: 30, status: statusFilter || undefined });
			blasts = result.blasts;
			total = result.total;
		} catch (e: any) {
			listError = e?.message || 'Failed to load broadcasts';
		} finally {
			loading = false;
		}
	}

	function initEditor(initialHtml = '') {
		emailEditor = createEditor({
			extensions: [
				StarterKit,
				PlaceholderExtension.configure({ placeholder: 'Write your announcement…' }),
				Image.configure({ inline: false, allowBase64: false }),
				Link.configure({
					openOnClick: false,
					HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer' }
				})
			],
			content: initialHtml,
			onUpdate: ({ editor }) => {
				htmlContent = editor.getHTML();
			}
		});
		htmlContent = initialHtml;
	}

	function resetComposer() {
		editingId = null;
		subject = '';
		heading = '';
		previewText = '';
		htmlContent = '';
		heroImageUrl = '';
		ctaEnabled = false;
		ctaText = '';
		ctaUrl = '';
		ctaColor = '#513BE2';
		ctaTextColor = '#FFFFFF';
		ctaStyle = 'solid';
		audience = 'ALL';
		customEmailsRaw = '';
		counts = null;
		countsError = '';
		channelEmail = true;
		channelInApp = false;
		inAppTitle = '';
		inAppBody = '';
		mode = 'now';
		scheduledLocal = '';
		composerError = '';
		successMsg = '';
		confirmSend = false;
		showPreview = false;
	}

	function openComposer() {
		resetComposer();
		showComposer = true;
		initEditor('');
		refreshCounts();
	}

	async function openForEdit(id: string) {
		resetComposer();
		showComposer = true;
		try {
			const b = await getBlast(id);
			editingId = b._id;
			subject = b.subject;
			heading = b.heading ?? '';
			previewText = b.previewText ?? '';
			heroImageUrl = b.heroImageUrl ?? '';
			if (b.cta) {
				ctaEnabled = true;
				ctaText = b.cta.text;
				ctaUrl = b.cta.url;
				ctaColor = b.cta.color;
				ctaTextColor = b.cta.textColor;
				ctaStyle = b.cta.style;
			}
			audience = b.audience;
			customEmailsRaw = (b.filters?.emails ?? []).join('\n');
			channelEmail = b.channels?.email ?? true;
			channelInApp = b.channels?.inApp ?? false;
			inAppTitle = b.inAppTitle ?? '';
			inAppBody = b.inAppBody ?? '';
			if (b.scheduledAt) {
				mode = 'schedule';
				// datetime-local wants local wall-clock with no zone suffix.
				const d = new Date(b.scheduledAt);
				scheduledLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
					.toISOString()
					.slice(0, 16);
			} else {
				mode = 'draft';
			}
			initEditor(b.htmlContent);
			refreshCounts();
		} catch (e: any) {
			composerError = e?.message || 'Could not load that broadcast';
			initEditor('');
		}
	}

	function closeComposer() {
		showComposer = false;
		$emailEditor?.destroy();
		load();
	}

	function refreshCounts() {
		if (audience === 'CUSTOM') {
			counts = null;
			return;
		}
		clearTimeout(countsTimer);
		countsTimer = setTimeout(async () => {
			countsLoading = true;
			countsError = '';
			try {
				counts = await previewAudience(audience, { respectOptOut: true });
			} catch (e: any) {
				countsError = e?.message || 'Could not size this audience';
				counts = null;
			} finally {
				countsLoading = false;
			}
		}, 250);
	}

	function insertLink() {
		if (!linkUrl.trim()) return;
		$emailEditor
			?.chain()
			.focus()
			.setLink({ href: linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}` })
			.run();
		linkUrl = '';
		showLinkInput = false;
	}

	function promptImage() {
		const url = window.prompt('Image URL (must be a public https:// link)');
		if (!url) return;
		if (!/^https?:\/\//i.test(url)) {
			composerError = 'Images must use a full http:// or https:// URL';
			return;
		}
		$emailEditor?.chain().focus().setImage({ src: url }).run();
	}

	function buildPayload(sendNow: boolean): BlastPayload {
		return {
			subject: subject.trim(),
			heading: heading.trim() || undefined,
			previewText: previewText.trim() || undefined,
			htmlContent,
			heroImageUrl: heroImageUrl.trim() || null,
			cta: ctaEnabled
				? {
						text: ctaText.trim(),
						url: ctaUrl.trim(),
						color: ctaColor,
						textColor: ctaTextColor,
						style: ctaStyle
					}
				: null,
			audience,
			filters: {
				status: ['ACTIVE'],
				emails: audience === 'CUSTOM' ? customEmails : [],
				respectOptOut: true
			},
			channels: { email: channelEmail, inApp: channelInApp },
			inAppTitle: inAppTitle.trim() || undefined,
			inAppBody: inAppBody.trim() || undefined,
			scheduledAt:
				mode === 'schedule' && scheduledLocal ? new Date(scheduledLocal).toISOString() : null,
			sendNow
		};
	}

	async function handleSave() {
		// A send-to-everyone is irreversible and instantaneous. One deliberate
		// confirmation beats an undo that cannot exist.
		if (mode === 'now' && !confirmSend) {
			confirmSend = true;
			return;
		}

		saving = true;
		composerError = '';
		try {
			const payload = buildPayload(mode === 'now');
			const saved = editingId
				? await updateBlast(editingId, payload)
				: await createBlast(payload);
			editingId = saved._id;

			// An edit that switches to "send now" saves first, then sends.
			if (mode === 'now' && saved.status !== 'SENDING') {
				await sendBlast(saved._id);
			}

			successMsg =
				mode === 'now'
					? 'Your broadcast is going out now.'
					: mode === 'schedule'
						? 'Broadcast scheduled.'
						: 'Draft saved.';
			setTimeout(closeComposer, 1400);
		} catch (e: any) {
			composerError = e?.message || 'Could not save this broadcast';
			confirmSend = false;
		} finally {
			saving = false;
		}
	}

	async function handleTest() {
		testing = true;
		composerError = '';
		try {
			// A test needs a saved record to render from, so an unsaved composer
			// is persisted as a draft first.
			let id = editingId;
			if (!id) {
				const draft = await createBlast({ ...buildPayload(false), scheduledAt: null });
				id = draft._id;
				editingId = id;
			} else {
				await updateBlast(id, { ...buildPayload(false), scheduledAt: null });
			}
			successMsg = await sendTestBlast(id!);
			setTimeout(() => (successMsg = ''), 4000);
		} catch (e: any) {
			composerError = e?.message || 'Could not send the test email';
		} finally {
			testing = false;
		}
	}

	async function handleSendExisting(b: EmailBlast) {
		if (!window.confirm(`Send "${b.subject}" to ${b.recipientCount.toLocaleString()} people now?`))
			return;
		try {
			await sendBlast(b._id);
			load();
		} catch (e: any) {
			listError = e?.message || 'Could not send that broadcast';
		}
	}

	async function handleCancel(b: EmailBlast) {
		if (!window.confirm(`Cancel "${b.subject}"?`)) return;
		try {
			await cancelBlast(b._id);
			load();
		} catch (e: any) {
			listError = e?.message || 'Could not cancel that broadcast';
		}
	}

	async function handleDelete(b: EmailBlast) {
		if (!window.confirm(`Delete "${b.subject}"? This cannot be undone.`)) return;
		try {
			await deleteBlast(b._id);
			load();
		} catch (e: any) {
			listError = e?.message || 'Could not delete that broadcast';
		}
	}

	function fmtDate(iso?: string | null): string {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleString('en-GB', {
				day: 'numeric',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return String(iso);
		}
	}

	const PRESET_COLORS = ['#513BE2', '#DB3EC6', '#131517', '#16A34A', '#EA580C', '#2563EB'];
</script>

<svelte:head><title>Broadcasts — Rondwell HQ</title></svelte:head>

<div>
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold text-gray-900">Broadcasts</h1>
			<p class="mt-1 max-w-2xl text-sm text-gray-500">
				Send announcements and marketing emails to the platform, from Rondwell. Choose an
				audience, compose with images and a call-to-action button, and send now or schedule it.
			</p>
		</div>
		{#if isSuperAdmin}
			<button
				on:click={openComposer}
				class="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800"
			>
				<Icon icon="mdi:bullhorn-variant-outline" /> New broadcast
			</button>
		{/if}
	</div>

	{#if !isSuperAdmin}
		<div class="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
			<Icon icon="mdi:shield-lock-outline" class="mt-0.5 shrink-0 text-lg text-amber-600" />
			<div>
				<p class="text-sm font-semibold text-amber-900">Read-only access</p>
				<p class="mt-0.5 text-xs text-amber-800">
					You can review what has been sent, but composing a broadcast requires a super admin
					account.
				</p>
			</div>
		</div>
	{/if}

	<!-- Filter -->
	<div class="mt-5 flex flex-wrap items-center gap-3">
		<select
			bind:value={statusFilter}
			on:change={() => load()}
			class="h-[38px] rounded-lg border border-gray-200 bg-white px-3 text-sm focus:ring-1 focus:ring-[#513BE2] focus:outline-none"
		>
			<option value="">All statuses</option>
			<option value="DRAFT">Draft</option>
			<option value="SCHEDULED">Scheduled</option>
			<option value="SENDING">Sending</option>
			<option value="SENT">Sent</option>
			<option value="PARTIALLY_SENT">Partially sent</option>
			<option value="FAILED">Failed</option>
			<option value="CANCELLED">Cancelled</option>
		</select>
		<span class="text-xs text-gray-400">{total.toLocaleString()} total</span>
	</div>

	{#if listError}
		<div class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{listError}</div>
	{/if}

	<!-- List -->
	<div class="mt-5 space-y-2">
		{#if loading}
			{#each Array(3) as _}
				<div class="h-[96px] animate-pulse rounded-xl border border-gray-200 bg-white"></div>
			{/each}
		{:else if blasts.length === 0}
			<div class="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center">
				<Icon icon="mdi:bullhorn-outline" class="mx-auto text-3xl text-gray-300" />
				<p class="mt-2 text-sm font-medium text-gray-700">No broadcasts yet</p>
				<p class="mt-1 text-xs text-gray-400">
					Product announcements and marketing emails you send will be listed here.
				</p>
			</div>
		{:else}
			{#each blasts as b (b._id)}
				<div class="rounded-xl border border-gray-200 bg-white p-4">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-center gap-2">
								<h3 class="truncate text-sm font-semibold text-gray-900">{b.subject}</h3>
								<span
									class="rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset {BLAST_STATUS_STYLES[
										b.status
									]?.class ?? 'bg-gray-100 text-gray-600 ring-gray-200'}"
								>
									{BLAST_STATUS_STYLES[b.status]?.label ?? b.status}
								</span>
								<span class="rounded-full bg-gray-50 px-2 py-0.5 text-[11px] text-gray-500">
									{AUDIENCE_OPTIONS.find((a) => a.value === b.audience)?.label ?? b.audience}
								</span>
								{#if b.channels?.inApp}
									<span
										class="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[11px] text-purple-700"
									>
										<Icon icon="mdi:bell-outline" class="text-xs" /> In-app
									</span>
								{/if}
							</div>
							{#if b.excerpt}
								<p class="mt-1 line-clamp-2 text-xs text-gray-500">{b.excerpt}</p>
							{/if}
							<p class="mt-1.5 text-[11px] text-gray-400">
								{#if b.status === 'SENT' || b.status === 'PARTIALLY_SENT'}
									{b.publishedCount.toLocaleString()} sent
									{#if b.failedCount > 0}· <span class="text-red-500"
											>{b.failedCount.toLocaleString()} failed</span
										>{/if}
									· {fmtDate(b.sentAt)}
								{:else if b.status === 'SENDING'}
									<span class="inline-flex items-center gap-1 text-blue-600">
										<Icon icon="mdi:loading" class="animate-spin text-xs" />
										{b.publishedCount.toLocaleString()} of ~{b.recipientCount.toLocaleString()} queued
									</span>
								{:else if b.status === 'SCHEDULED'}
									Scheduled for {fmtDate(b.scheduledAt)} · ~{b.recipientCount.toLocaleString()} recipients
								{:else}
									~{b.recipientCount.toLocaleString()} recipients · by {b.createdByAdminEmail}
								{/if}
							</p>
							{#if b.failureReason}
								<p class="mt-1 text-[11px] text-red-500">{b.failureReason}</p>
							{/if}
						</div>

						{#if isSuperAdmin}
							<div class="flex shrink-0 items-center gap-1">
								{#if ['DRAFT', 'SCHEDULED'].includes(b.status)}
									<button
										on:click={() => openForEdit(b._id)}
										class="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
										aria-label="Edit"
									>
										<Icon icon="mdi:pencil-outline" class="text-base" />
									</button>
									<button
										on:click={() => handleSendExisting(b)}
										class="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-green-600"
										aria-label="Send now"
									>
										<Icon icon="mdi:send-outline" class="text-base" />
									</button>
									<button
										on:click={() => handleCancel(b)}
										class="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-amber-600"
										aria-label="Cancel"
									>
										<Icon icon="mdi:cancel" class="text-base" />
									</button>
									<button
										on:click={() => handleDelete(b)}
										class="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-red-600"
										aria-label="Delete"
									>
										<Icon icon="mdi:trash-can-outline" class="text-base" />
									</button>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<!-- ─── Composer ──────────────────────────────────────────────────────── -->
{#if showComposer}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 backdrop-blur-sm">
		<div class="flex h-full max-h-[94vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-5 py-3">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-[#DB3EC6] to-[#513BE2]"
					>
						<Icon icon="mdi:bullhorn-variant-outline" class="h-5 w-5 text-white" />
					</div>
					<div>
						<h2 class="font-semibold text-gray-800">
							{editingId ? 'Edit broadcast' : 'New broadcast'}
						</h2>
						<p class="text-xs text-[#A5A6A6]">Sent from Rondwell to your users</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					{#if reach !== null}
						<span
							class="hidden items-center gap-1.5 rounded-full border-2 border-[#E5E6E6] px-3 py-1 sm:flex"
						>
							<Icon icon="mdi:account-group-outline" class="text-sm text-gray-400" />
							<span class="text-xs whitespace-nowrap text-[#A8A9A9]">
								{countsLoading ? '…' : `${reach.toLocaleString()} recipients`}
							</span>
						</span>
					{/if}
					<button
						class="flex h-8 w-8 items-center justify-center rounded-full bg-[#EBECED]"
						on:click={closeComposer}
						aria-label="Close"
					>
						<Icon icon="mdi:close" class="text-lg text-gray-700" />
					</button>
				</div>
			</div>

			<div class="custom-scrollbar flex-1 overflow-y-auto px-5 py-4">
				<!-- Audience -->
				<div class="mb-4">
					<span class="mb-1.5 block text-xs font-medium text-[#666769]">Send to</span>
					<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
						{#each AUDIENCE_OPTIONS as opt (opt.value)}
							<button
								on:click={() => {
									audience = opt.value;
									refreshCounts();
								}}
								class="rounded-lg border p-2.5 text-left transition {audience === opt.value
									? 'border-gray-800 bg-gray-50'
									: 'border-gray-200 hover:border-gray-300'}"
							>
								<div class="flex items-center gap-1.5">
									<span
										class="h-2 w-2 shrink-0 rounded-full"
										style="background-color: {opt.color}"
									></span>
									<span class="truncate text-xs font-medium text-gray-800">{opt.label}</span>
								</div>
								<p class="mt-0.5 line-clamp-2 text-[10px] text-gray-400">{opt.description}</p>
							</button>
						{/each}
					</div>

					{#if audience === 'CUSTOM'}
						<textarea
							bind:value={customEmailsRaw}
							rows="3"
							placeholder="Paste email addresses, separated by commas, spaces or new lines"
							class="mt-2 w-full resize-none rounded-lg border border-gray-200 bg-[#F8F8F9] px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
						></textarea>
						<p class="mt-1 text-[11px] text-gray-400">
							{customEmails.length} valid address{customEmails.length === 1 ? '' : 'es'} detected
						</p>
					{:else if countsError}
						<p class="mt-2 text-xs text-red-500">{countsError}</p>
					{:else if counts}
						<p class="mt-2 text-[11px] text-gray-500">
							<span class="font-medium text-gray-700"
								>{counts.withEmail.toLocaleString()} will receive this</span
							>
							{#if counts.total > counts.withEmail}
								· {(counts.total - counts.withEmail).toLocaleString()} have no email on file
							{/if}
							{#if counts.optedOut > 0}
								· {counts.optedOut.toLocaleString()} opted out of marketing and are excluded
							{/if}
						</p>
					{/if}
				</div>

				<!-- Channels -->
				<div class="mb-4">
					<span class="mb-1.5 block text-xs font-medium text-[#666769]">Deliver via</span>
					<div class="flex flex-wrap gap-2">
						<button
							on:click={() => (channelEmail = !channelEmail)}
							class="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition {channelEmail
								? 'border-gray-800 bg-gray-50 text-gray-900'
								: 'border-gray-200 text-gray-500'}"
						>
							<Icon icon={channelEmail ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'} />
							Email
						</button>
						<button
							on:click={() => (channelInApp = !channelInApp)}
							class="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition {channelInApp
								? 'border-gray-800 bg-gray-50 text-gray-900'
								: 'border-gray-200 text-gray-500'}"
						>
							<Icon icon={channelInApp ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'} />
							In-app notification
						</button>
					</div>
					{#if channelInApp}
						<!-- The email body is rich HTML and would render as markup in a
						     notification row, so the in-app copy is written separately. -->
						<div class="mt-2 grid gap-2 rounded-lg border border-gray-100 bg-[#F8F8F9] p-3 sm:grid-cols-2">
							<input
								type="text"
								bind:value={inAppTitle}
								maxlength="120"
								placeholder="In-app title (defaults to the subject)"
								class="h-[36px] rounded-lg border border-gray-200 bg-white px-3 text-xs focus:border-gray-400 focus:outline-none"
							/>
							<input
								type="text"
								bind:value={inAppBody}
								maxlength="300"
								placeholder="In-app message (defaults to the opening line)"
								class="h-[36px] rounded-lg border border-gray-200 bg-white px-3 text-xs focus:border-gray-400 focus:outline-none"
							/>
						</div>
					{/if}
				</div>

				<!-- Subject / heading -->
				<div class="mb-4 grid gap-3 sm:grid-cols-2">
					<div>
						<label for="bl-subject" class="mb-1.5 block text-xs font-medium text-[#666769]">
							Subject line
						</label>
						<input
							id="bl-subject"
							type="text"
							bind:value={subject}
							maxlength="200"
							placeholder="What lands in the inbox"
							class="h-[38px] w-full rounded-lg border border-gray-200 bg-[#F8F8F9] px-3 text-sm focus:border-gray-400 focus:outline-none"
						/>
					</div>
					<div>
						<label for="bl-heading" class="mb-1.5 block text-xs font-medium text-[#666769]">
							Headline <span class="font-normal text-gray-400">(optional)</span>
						</label>
						<input
							id="bl-heading"
							type="text"
							bind:value={heading}
							maxlength="200"
							placeholder="Large text at the top of the email"
							class="h-[38px] w-full rounded-lg border border-gray-200 bg-[#F8F8F9] px-3 text-sm focus:border-gray-400 focus:outline-none"
						/>
					</div>
				</div>

				<div class="mb-4 grid gap-3 sm:grid-cols-2">
					<div>
						<label for="bl-preview" class="mb-1.5 block text-xs font-medium text-[#666769]">
							Preview text <span class="font-normal text-gray-400">(optional)</span>
						</label>
						<input
							id="bl-preview"
							type="text"
							bind:value={previewText}
							maxlength="200"
							placeholder="The grey line shown after the subject"
							class="h-[38px] w-full rounded-lg border border-gray-200 bg-[#F8F8F9] px-3 text-sm focus:border-gray-400 focus:outline-none"
						/>
					</div>
					<div>
						<label for="bl-hero" class="mb-1.5 block text-xs font-medium text-[#666769]">
							Hero image URL <span class="font-normal text-gray-400">(optional)</span>
						</label>
						<input
							id="bl-hero"
							type="url"
							bind:value={heroImageUrl}
							placeholder="https://…"
							class="h-[38px] w-full rounded-lg border border-gray-200 bg-[#F8F8F9] px-3 text-sm focus:border-gray-400 focus:outline-none"
						/>
					</div>
				</div>

				<!-- Editor -->
				<div class="mb-4">
					<span class="mb-1.5 block text-xs font-medium text-[#666769]">Message</span>
					<div class="overflow-hidden rounded-lg border border-gray-200">
						<div
							class="flex flex-wrap items-center gap-0.5 border-b border-gray-100 bg-[#F8F9FA] px-3 py-1.5"
						>
							{#if $emailEditor}
								<button
									type="button"
									on:click={() => $emailEditor.chain().focus().toggleBold().run()}
									class="rounded px-2 py-1 text-sm font-bold hover:bg-gray-200 {$emailEditor.isActive(
										'bold'
									)
										? 'bg-gray-800 text-white'
										: 'text-gray-700'}">B</button
								>
								<button
									type="button"
									on:click={() => $emailEditor.chain().focus().toggleItalic().run()}
									class="rounded px-2 py-1 text-sm italic hover:bg-gray-200 {$emailEditor.isActive(
										'italic'
									)
										? 'bg-gray-800 text-white'
										: 'text-gray-700'}">I</button
								>
								<button
									type="button"
									on:click={() => $emailEditor.chain().focus().toggleStrike().run()}
									class="rounded px-2 py-1 text-sm line-through hover:bg-gray-200 {$emailEditor.isActive(
										'strike'
									)
										? 'bg-gray-800 text-white'
										: 'text-gray-700'}">S</button
								>
								<div class="mx-1 h-4 w-px bg-gray-300"></div>
								<button
									type="button"
									on:click={() => $emailEditor.chain().focus().toggleHeading({ level: 1 }).run()}
									class="rounded px-2 py-1 text-xs font-semibold hover:bg-gray-200 {$emailEditor.isActive(
										'heading',
										{ level: 1 }
									)
										? 'bg-gray-800 text-white'
										: 'text-gray-700'}">H1</button
								>
								<button
									type="button"
									on:click={() => $emailEditor.chain().focus().toggleHeading({ level: 2 }).run()}
									class="rounded px-2 py-1 text-xs font-semibold hover:bg-gray-200 {$emailEditor.isActive(
										'heading',
										{ level: 2 }
									)
										? 'bg-gray-800 text-white'
										: 'text-gray-700'}">H2</button
								>
								<div class="mx-1 h-4 w-px bg-gray-300"></div>
								<button
									type="button"
									on:click={() => $emailEditor.chain().focus().toggleBulletList().run()}
									class="rounded px-2 py-1 hover:bg-gray-200 {$emailEditor.isActive('bulletList')
										? 'bg-gray-800 text-white'
										: 'text-gray-700'}"
									aria-label="Bullet list"
									><Icon icon="mdi:format-list-bulleted" class="text-base" /></button
								>
								<button
									type="button"
									on:click={() => $emailEditor.chain().focus().toggleOrderedList().run()}
									class="rounded px-2 py-1 hover:bg-gray-200 {$emailEditor.isActive('orderedList')
										? 'bg-gray-800 text-white'
										: 'text-gray-700'}"
									aria-label="Numbered list"
									><Icon icon="mdi:format-list-numbered" class="text-base" /></button
								>
								<div class="mx-1 h-4 w-px bg-gray-300"></div>
								<div class="relative" use:clickOutside={() => (showLinkInput = false)}>
									<button
										type="button"
										on:click={() => {
											if ($emailEditor.isActive('link'))
												$emailEditor.chain().focus().unsetLink().run();
											else showLinkInput = !showLinkInput;
										}}
										class="rounded px-2 py-1 hover:bg-gray-200 {$emailEditor.isActive('link')
											? 'bg-gray-800 text-white'
											: 'text-gray-700'}"
										aria-label="Link"><Icon icon="mdi:link-variant" class="text-base" /></button
									>
									{#if showLinkInput}
										<div
											class="absolute top-full left-0 z-20 mt-1 flex items-center gap-1 rounded-lg border bg-white p-2 shadow-lg"
										>
											<input
												type="url"
												bind:value={linkUrl}
												placeholder="https://…"
												class="w-48 rounded border px-2 py-1 text-xs focus:outline-none"
												on:keydown={(e) => e.key === 'Enter' && insertLink()}
											/>
											<button
												on:click={insertLink}
												class="rounded bg-gray-800 px-2 py-1 text-xs text-white">Add</button
											>
										</div>
									{/if}
								</div>
								<button
									type="button"
									on:click={promptImage}
									class="rounded px-2 py-1 text-gray-700 hover:bg-gray-200"
									aria-label="Image"><Icon icon="mdi:image-outline" class="text-base" /></button
								>
								<div class="mx-1 h-4 w-px bg-gray-300"></div>
								<button
									type="button"
									on:click={() => $emailEditor.chain().focus().toggleBlockquote().run()}
									class="rounded px-2 py-1 hover:bg-gray-200 {$emailEditor.isActive('blockquote')
										? 'bg-gray-800 text-white'
										: 'text-gray-700'}"
									aria-label="Quote"
									><Icon icon="mdi:format-quote-close" class="text-base" /></button
								>
								<button
									type="button"
									on:click={() => $emailEditor.chain().focus().setHorizontalRule().run()}
									class="rounded px-2 py-1 text-gray-700 hover:bg-gray-200"
									aria-label="Divider"><Icon icon="mdi:minus" class="text-base" /></button
								>
								<div class="mx-1 h-4 w-px bg-gray-300"></div>
								<button
									type="button"
									on:click={() => $emailEditor.chain().focus().undo().run()}
									class="rounded px-2 py-1 text-gray-700 hover:bg-gray-200">↩</button
								>
								<button
									type="button"
									on:click={() => $emailEditor.chain().focus().redo().run()}
									class="rounded px-2 py-1 text-gray-700 hover:bg-gray-200">↪</button
								>
							{/if}
						</div>
						<div class="max-h-[320px] min-h-[200px] overflow-y-auto p-4 text-sm text-gray-800">
							<EditorContent editor={$emailEditor} />
						</div>
					</div>
				</div>

				<!-- CTA builder -->
				<div class="mb-4 rounded-lg border border-gray-100 bg-[#F8F8F9] p-3">
					<button
						on:click={() => (ctaEnabled = !ctaEnabled)}
						class="flex w-full items-center justify-between text-left"
					>
						<span class="flex items-center gap-2 text-xs font-medium text-[#666769]">
							<Icon
								icon={ctaEnabled ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'}
								class="text-base"
							/>
							Add a call-to-action button
						</span>
						<Icon
							icon="mdi:chevron-down"
							class="text-lg text-gray-400 transition-transform {ctaEnabled ? 'rotate-180' : ''}"
						/>
					</button>

					{#if ctaEnabled}
						<div class="mt-3 space-y-3">
							<div class="grid gap-2 sm:grid-cols-2">
								<input
									type="text"
									bind:value={ctaText}
									maxlength="60"
									placeholder="Button label, e.g. Browse events"
									class="h-[36px] rounded-lg border border-gray-200 bg-white px-3 text-xs focus:border-gray-400 focus:outline-none"
								/>
								<input
									type="url"
									bind:value={ctaUrl}
									placeholder="https://rondwell.com/…"
									class="h-[36px] rounded-lg border border-gray-200 bg-white px-3 text-xs focus:border-gray-400 focus:outline-none"
								/>
							</div>

							<div class="flex flex-wrap items-center gap-4">
								<div>
									<span class="mb-1 block text-[11px] text-gray-500">Button colour</span>
									<div class="flex items-center gap-1.5">
										{#each PRESET_COLORS as preset}
											<button
												on:click={() => (ctaColor = preset)}
												aria-label="Use {preset}"
												class="h-6 w-6 rounded-full ring-2 ring-offset-1 transition {ctaColor ===
												preset
													? 'ring-gray-800'
													: 'ring-transparent'}"
												style="background-color: {preset}"
											></button>
										{/each}
										<input
											type="color"
											bind:value={ctaColor}
											aria-label="Custom button colour"
											class="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
										/>
									</div>
								</div>

								<div>
									<span class="mb-1 block text-[11px] text-gray-500">Label colour</span>
									<div class="flex items-center gap-1.5">
										{#each ['#FFFFFF', '#131517'] as preset}
											<button
												on:click={() => (ctaTextColor = preset)}
												aria-label="Use {preset}"
												class="h-6 w-6 rounded-full border border-gray-300 ring-2 ring-offset-1 transition {ctaTextColor ===
												preset
													? 'ring-gray-800'
													: 'ring-transparent'}"
												style="background-color: {preset}"
											></button>
										{/each}
									</div>
								</div>

								<div>
									<span class="mb-1 block text-[11px] text-gray-500">Style</span>
									<div class="flex gap-1">
										{#each ['solid', 'outline'] as s}
											<button
												on:click={() => (ctaStyle = s as 'solid' | 'outline')}
												class="rounded-lg px-2.5 py-1 text-[11px] capitalize transition {ctaStyle ===
												s
													? 'bg-gray-800 text-white'
													: 'bg-white text-gray-600 ring-1 ring-gray-200'}">{s}</button
											>
										{/each}
									</div>
								</div>
							</div>

							<!-- Live button preview: exactly what renders in the email -->
							<div class="rounded-lg border border-dashed border-gray-200 bg-white p-4 text-center">
								<p class="mb-2 text-[10px] tracking-wide text-gray-400 uppercase">Preview</p>
								<span
									class="inline-block rounded-[10px] px-9 py-3.5 text-sm font-semibold"
									style="background-color: {ctaStyle === 'outline'
										? 'transparent'
										: ctaColor}; color: {ctaStyle === 'outline'
										? ctaColor
										: ctaTextColor}; border: {ctaStyle === 'outline'
										? `2px solid ${ctaColor}`
										: 'none'};"
								>
									{ctaText || 'Button label'}
								</span>
							</div>

							{#if ctaUrl && !/^https?:\/\//i.test(ctaUrl.trim())}
								<p class="text-xs text-red-500">
									The button link must be a full http:// or https:// URL.
								</p>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Scheduling -->
				<div class="mb-4 rounded-lg border border-gray-100 bg-[#F8F8F9] p-3">
					<div class="flex flex-wrap items-center gap-2">
						{#each [{ v: 'now', icon: 'mdi:send', label: 'Send now' }, { v: 'schedule', icon: 'mdi:clock-outline', label: 'Schedule' }, { v: 'draft', icon: 'mdi:content-save-outline', label: 'Save as draft' }] as opt}
							<button
								on:click={() => {
									mode = opt.v as typeof mode;
									confirmSend = false;
								}}
								class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition {mode ===
								opt.v
									? 'bg-gray-800 text-white'
									: 'bg-white text-gray-600 shadow-sm'}"
							>
								<Icon icon={opt.icon} class="text-sm" />
								{opt.label}
							</button>
						{/each}
					</div>
					{#if mode === 'schedule'}
						<input
							type="datetime-local"
							bind:value={scheduledLocal}
							class="mt-3 h-[36px] rounded-lg border border-gray-200 bg-white px-3 text-xs focus:border-gray-400 focus:outline-none"
						/>
						<p class="mt-1 text-[11px] text-gray-400">
							Uses your local time. Broadcasts go out within a minute of the scheduled time.
						</p>
					{/if}
				</div>

				{#if composerError}
					<p class="mb-3 text-sm text-red-500">{composerError}</p>
				{/if}
				{#if successMsg}
					<div
						class="mb-3 flex items-center gap-2 rounded-lg bg-[#E3F4E1] px-4 py-3 text-sm text-[#3CBD2C]"
					>
						<Icon icon="mdi:check-circle" class="text-lg" />
						{successMsg}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="border-t border-gray-200 px-5 py-3">
				{#if confirmSend && mode === 'now'}
					<!--
						Last stop before an irreversible send. The recipient count is
						restated here because it is the number that matters and the
						operator may have changed the audience since they last looked.
					-->
					<div class="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
						<Icon icon="mdi:alert-outline" class="mt-0.5 shrink-0 text-lg text-amber-600" />
						<p class="text-xs text-amber-900">
							This sends immediately to
							<span class="font-semibold">{(reach ?? 0).toLocaleString()} people</span> and cannot
							be recalled. Send a test to yourself first if you haven't.
						</p>
					</div>
				{/if}

				<div class="mb-2 flex items-center justify-between">
					<span class="text-xs text-[#B9BABA]">
						{#if reach !== null}
							Reaching <span class="font-medium text-gray-700">{reach.toLocaleString()}</span>
							{reach === 1 ? 'person' : 'people'}
						{:else}
							Audience not sized yet
						{/if}
					</span>
					<button
						on:click={handleTest}
						disabled={testing || !canSubmit}
						class="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-[#626365] transition hover:bg-gray-50 disabled:opacity-40"
					>
						{#if testing}
							<Icon icon="mdi:loading" class="animate-spin text-sm" /> Sending…
						{:else}
							<Icon icon="mdi:email-fast-outline" class="text-sm" /> Send test to me
						{/if}
					</button>
				</div>

				<div class="flex items-center gap-2">
					<button
						on:click={confirmSend ? () => (confirmSend = false) : closeComposer}
						class="flex-1 rounded-lg border bg-gray-100 py-2.5 text-sm text-[#626365]"
					>
						{confirmSend ? 'Back' : 'Cancel'}
					</button>
					<button
						on:click={handleSave}
						disabled={!canSubmit}
						class="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition {canSubmit
							? 'bg-gray-800 hover:bg-gray-700'
							: 'cursor-not-allowed bg-[#969798]'}"
					>
						{#if saving}
							<Icon icon="mdi:loading" class="animate-spin text-base" /> Working…
						{:else if mode === 'now'}
							<Icon icon="mdi:send" class="text-base" />
							{confirmSend ? 'Yes, send it now' : 'Send now'}
						{:else if mode === 'schedule'}
							<Icon icon="mdi:clock-outline" class="text-base" /> Schedule
						{:else}
							<Icon icon="mdi:content-save-outline" class="text-base" /> Save draft
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(.ProseMirror) {
		outline: none;
		min-height: 120px;
		line-height: 1.6;
	}
	:global(.ProseMirror p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		color: #9ca3af;
		pointer-events: none;
		float: left;
		height: 0;
	}
	:global(.ProseMirror h1) {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}
	:global(.ProseMirror h2) {
		font-size: 1.2rem;
		font-weight: 600;
		margin-bottom: 0.4rem;
	}
	:global(.ProseMirror p) {
		margin-bottom: 0.5rem;
	}
	:global(.ProseMirror ul) {
		list-style: disc;
		padding-left: 1.5rem;
		margin-bottom: 0.5rem;
	}
	:global(.ProseMirror ol) {
		list-style: decimal;
		padding-left: 1.5rem;
		margin-bottom: 0.5rem;
	}
	:global(.ProseMirror blockquote) {
		border-left: 3px solid #d1d5db;
		padding-left: 1rem;
		margin: 0 0 0.5rem;
		color: #6b7280;
	}
	:global(.ProseMirror a) {
		color: #2563eb;
		text-decoration: underline;
	}
	:global(.ProseMirror img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.375rem;
		margin: 0.5rem 0;
	}
	:global(.ProseMirror hr) {
		border: none;
		border-top: 1px solid #e5e7eb;
		margin: 1rem 0;
	}
</style>
