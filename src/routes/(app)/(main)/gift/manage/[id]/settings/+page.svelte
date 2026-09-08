<!--
	Gift link — Settings.

	Everything editable about the link, plus the two lifecycle controls.

	There is deliberately no DELETE. The gifts attached to this link are
	financial records under a retention guard, and removing the link would
	orphan them. Closing stops new money and keeps the history — which is what
	someone reaching for "delete" actually wants, so the destructive-looking
	option is simply not offered rather than offered and refused.

	Saving calls the shared `reload()` so the header above and the other tabs
	pick up a renamed link immediately, rather than showing the old title until
	a hard refresh.
-->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import Icon from '@iconify/svelte';
	import { toast } from '$lib/stores/toast.store';
	import { cleanErrorMessage } from '$lib/utils/errorMessage';
	import { majorToKobo, koboToMajor } from '$lib/utils/money';
	import {
		updateGiftLink,
		closeGiftLink,
		discardGiftCoverImage
	} from '$lib/services/giftLink.services';
	import { getGiftLinkCtx } from '../context';
	import CoverImagePicker from '../../../components/CoverImagePicker.svelte';

	const { link, reload } = getGiftLinkCtx();

	let sTitle = '';
	let sMessage = '';
	let sCover = '';
	let sTargetMajor: number | null = null;
	let sStatus: 'ACTIVE' | 'PAUSED' | 'CLOSED' = 'ACTIVE';
	let sShowWall = true;
	let sAllowAnon = true;
	let seededId = '';
	let saving = false;
	let closing = false;
	let confirmingClose = false;

	// Seed once per link. Keyed on id so navigating between links re-seeds,
	// and editing does not get stomped by the store updating underneath.
	$: if ($link && seededId !== $link._id) {
		sTitle = $link.title;
		sMessage = $link.message ?? '';
		sCover = $link.coverImageUrl ?? '';
		sTargetMajor = $link.targetAmountKobo
			? koboToMajor($link.targetAmountKobo, $link.currency)
			: null;
		sStatus = $link.status;
		sShowWall = $link.showContributorWall !== false;
		sAllowAnon = $link.allowAnonymous !== false;
		seededId = $link._id;
	}

	$: isClosed = $link?.status === 'CLOSED';

	/**
	 * The cover as it is SAVED right now, mirrored into a plain variable.
	 *
	 * `onDestroy` below needs it, and reading `$link` from a destroy callback
	 * depends on when the store auto-subscription is torn down relative to the
	 * callback. Mirroring it reactively removes the question.
	 */
	$: savedCover = $link?.coverImageUrl ?? '';

	/**
	 * Drop an uploaded-but-unsaved cover when the user navigates away.
	 *
	 * Uploading happens as soon as an image is picked so the preview is real,
	 * but "Save changes" is what actually attaches it. Leaving without saving
	 * would otherwise strand the object. Best-effort by design — the S3
	 * lifecycle rule sweeps whatever this misses.
	 */
	onDestroy(() => {
		if (sCover && sCover !== savedCover) void discardGiftCoverImage(sCover);
	});

	async function save() {
		if (!$link) return;
		if (!sTitle.trim()) {
			toast.error('Give the link a title');
			return;
		}
		saving = true;
		try {
			await updateGiftLink($link._id, {
				title: sTitle.trim(),
				message: sMessage,
				// `null` is a deliberate REMOVE. An empty string would be
				// stored as one and the page would render a broken <img>.
				coverImageUrl: sCover || null,
				targetAmountKobo: sTargetMajor ? majorToKobo(sTargetMajor, $link.currency) : 0,
				status: sStatus,
				showContributorWall: sShowWall,
				allowAnonymous: sAllowAnon
			} as any);
			seededId = '';
			await reload();
			toast.success('Saved.');
		} catch (e: any) {
			toast.error(cleanErrorMessage(e?.message || 'Could not save'));
		} finally {
			saving = false;
		}
	}

	async function doClose() {
		if (!$link) return;
		closing = true;
		try {
			await closeGiftLink($link._id);
			seededId = '';
			await reload();
			confirmingClose = false;
			toast.info('Link closed. Your gifts and history are kept.');
		} catch (e: any) {
			toast.error(cleanErrorMessage(e?.message || 'Could not close the link'));
		} finally {
			closing = false;
		}
	}
</script>

<h2 class="mb-5 text-lg font-semibold text-gray-900">Settings</h2>

{#if $link}
	<div class="space-y-4">
		<!-- Details -->
		<div class="rounded-2xl bg-[#FDFDFD] p-5 shadow-sm">
			<label class="block">
				<span class="text-sm font-medium text-gray-900">Title</span>
				<input
					bind:value={sTitle}
					disabled={isClosed}
					class="mt-1.5 w-full rounded-lg border border-[#EBECED] px-3 py-2.5 text-sm outline-none focus:border-[#F31A7C] disabled:bg-gray-50 disabled:text-gray-400"
					placeholder="Birthday fund"
				/>
			</label>

			<label class="mt-4 block">
				<span class="text-sm font-medium text-gray-900">Message to givers</span>
				<textarea
					bind:value={sMessage}
					disabled={isClosed}
					rows="3"
					class="mt-1.5 w-full resize-y rounded-lg border border-[#EBECED] px-3 py-2.5 text-sm outline-none focus:border-[#F31A7C] disabled:bg-gray-50 disabled:text-gray-400"
					placeholder="A note people see before they give."
				></textarea>
			</label>

			<div class="mt-4">
				<CoverImagePicker
					bind:value={sCover}
					savedValue={savedCover}
					disabled={isClosed}
					hint="Shown at the top of your gift page and used as the preview when the link is shared. Changes take effect when you save."
				/>
			</div>

			<label class="mt-4 block">
				<span class="text-sm font-medium text-gray-900">Target ({$link.currency})</span>
				<input
					type="number"
					min="0"
					bind:value={sTargetMajor}
					disabled={isClosed}
					class="mt-1.5 w-full rounded-lg border border-[#EBECED] px-3 py-2.5 text-sm outline-none focus:border-[#F31A7C] disabled:bg-gray-50 disabled:text-gray-400"
					placeholder="Optional"
				/>
				<span class="mt-1 block text-xs text-[#83808D]">
					Leave empty for no target. A target shows a progress bar to givers.
				</span>
			</label>
		</div>

		<!-- Privacy -->
		<div class="rounded-2xl bg-[#FDFDFD] p-5 shadow-sm">
			<p class="mb-3 text-sm font-medium text-gray-900">Privacy</p>

			<label class="flex items-start justify-between gap-4 py-2">
				<span class="min-w-0">
					<span class="block text-sm text-gray-900">Show the contributor wall</span>
					<span class="block text-xs text-[#83808D]">
						Names and messages are public. Amounts never are.
					</span>
				</span>
				<input type="checkbox" bind:checked={sShowWall} disabled={isClosed} class="mt-1 h-4 w-4 flex-shrink-0" />
			</label>

			<label class="flex items-start justify-between gap-4 py-2">
				<span class="min-w-0">
					<span class="block text-sm text-gray-900">Allow anonymous gifts</span>
					<span class="block text-xs text-[#83808D]">
						Turn this off and everyone who gives must show their name.
					</span>
				</span>
				<input type="checkbox" bind:checked={sAllowAnon} disabled={isClosed} class="mt-1 h-4 w-4 flex-shrink-0" />
			</label>
		</div>

		<!-- Status -->
		<div class="rounded-2xl bg-[#FDFDFD] p-5 shadow-sm">
			<p class="mb-1 text-sm font-medium text-gray-900">Accepting gifts</p>
			<p class="mb-3 text-xs text-[#83808D]">
				Pausing hides the give button. Nothing already received is affected.
			</p>
			<div class="inline-flex rounded-lg border border-[#EBECED] p-0.5">
				{#each ['ACTIVE', 'PAUSED'] as s}
					<button
						on:click={() => (sStatus = s as 'ACTIVE' | 'PAUSED')}
						disabled={isClosed}
						class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 {sStatus ===
						s
							? 'bg-gray-900 text-white'
							: 'text-[#5D646F] hover:bg-gray-50'}"
					>
						{s === 'ACTIVE' ? 'Open' : 'Paused'}
					</button>
				{/each}
			</div>
		</div>

		{#if !isClosed}
			<div class="flex justify-end">
				<button
					on:click={save}
					disabled={saving}
					class="rounded-lg bg-[#F31A7C] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#d81869] disabled:opacity-50"
				>
					{saving ? 'Saving…' : 'Save changes'}
				</button>
			</div>
		{/if}

		<!-- Close -->
		<div class="rounded-2xl border border-[#F5C2C7] bg-[#FDF9F9] p-5">
			<p class="text-sm font-medium text-[#B02A37]">Close this link</p>
			<p class="mt-1 text-xs text-[#8A5A5F]">
				Stops new gifts for good. Everything you've already received — and the record of who sent
				it — is kept. This can't be undone.
			</p>

			{#if isClosed}
				<p class="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#83808D]">
					<Icon icon="mdi:lock-outline" /> This link is closed.
				</p>
			{:else if confirmingClose}
				<div class="mt-3 flex flex-wrap gap-2">
					<button
						on:click={doClose}
						disabled={closing}
						class="rounded-lg bg-[#B02A37] px-4 py-2 text-sm font-medium text-white hover:bg-[#96232e] disabled:opacity-50"
					>
						{closing ? 'Closing…' : 'Yes, close it'}
					</button>
					<button
						on:click={() => (confirmingClose = false)}
						class="rounded-lg border border-[#EBECED] bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						Keep it open
					</button>
				</div>
			{:else}
				<button
					on:click={() => (confirmingClose = true)}
					class="mt-3 rounded-lg border border-[#B02A37] px-4 py-2 text-sm font-medium text-[#B02A37] transition-colors hover:bg-[#B02A37] hover:text-white"
				>
					Close link
				</button>
			{/if}
		</div>
	</div>
{/if}
