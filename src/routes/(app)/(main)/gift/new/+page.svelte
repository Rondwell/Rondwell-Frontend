<!--
	GAP 4 — the gift-link creation wizard.

	Three steps, because the alternative — one long form — is what makes people
	abandon. Only the occasion and the title are actually required; everything
	else has a sensible default so someone can create a link in about fifteen
	seconds and share it before the moment passes.

	The final step is the SHARE step, not a "done" screen: a link nobody sends
	raises nothing.
-->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	import { toast } from '$lib/stores/toast.store';
	import { cleanErrorMessage } from '$lib/utils/errorMessage';
	import { majorToKobo, formatMoney } from '$lib/utils/money';
	import { colors, type Color } from '$lib/utils/colors';
	import {
		createGiftLink,
		discardGiftCoverImage,
		GIFT_OCCASIONS,
		type GiftLinkOccasion,
		type GiftLink
	} from '$lib/services/giftLink.services';
	import CoverImagePicker from '../components/CoverImagePicker.svelte';

	let step: 1 | 2 | 3 = 1;

	let occasion: GiftLinkOccasion = 'BIRTHDAY';
	let title = '';
	let message = '';
	let coverImageUrl = '';
	let currency: 'NGN' | 'USD' = 'NGN';
	let targetMajor: number | null = null;
	let suggestedMajor: number[] = [2000, 5000, 10000];
	let minMajor = 500;
	let allowAnonymous = true;
	let showContributorWall = true;
	let selectedColor: Color = colors[0];

	let creating = false;
	let created: GiftLink | null = null;

	/**
	 * Discard an uploaded cover if the wizard is abandoned before the link is
	 * created.
	 *
	 * The image is uploaded the moment it is picked, because the preview has
	 * to be real — but a link that is never created leaves an object nothing
	 * points at. This is the tidy path; the server-side lifecycle rule sweeps
	 * anything it misses (a hard tab close, a lost connection), so it is
	 * deliberately fire-and-forget rather than something to block navigation on.
	 */
	onDestroy(() => {
		if (coverImageUrl && !created) void discardGiftCoverImage(coverImageUrl);
	});

	$: shareUrl = created ? `${typeof window !== 'undefined' ? window.location.origin : ''}/gift/${created.slug}` : '';
	$: canContinue1 = !!occasion;
	$: canContinue2 = title.trim().length > 1;

	function addSuggestion() {
		if (suggestedMajor.length >= 6) return;
		suggestedMajor = [...suggestedMajor, 0];
	}
	function removeSuggestion(i: number) {
		suggestedMajor = suggestedMajor.filter((_, idx) => idx !== i);
	}

	async function submit() {
		creating = true;
		try {
			created = await createGiftLink({
				title: title.trim(),
				occasion,
				message: message.trim() || undefined,
				coverImageUrl: coverImageUrl || undefined,
				themeColor: selectedColor.name,
				currency,
				targetAmountKobo: targetMajor ? majorToKobo(targetMajor, currency) : undefined,
				suggestedAmountsKobo: suggestedMajor
					.map((v) => majorToKobo(v, currency))
					.filter((k) => k > 0),
				// Floor is enforced server-side too — this only keeps the UI honest.
				minKobo: Math.max(10000, majorToKobo(minMajor, currency)),
				allowAnonymous,
				showContributorWall
			});
			step = 3;
		} catch (e: any) {
			toast.error(cleanErrorMessage(e.message || 'Could not create your gift link'));
		} finally {
			creating = false;
		}
	}

	function copyShare() {
		navigator.clipboard.writeText(shareUrl);
		toast.success('Link copied — go share it!');
	}

	$: whatsappHref = created
		? `https://wa.me/?text=${encodeURIComponent(`${created.title} 🎁 ${shareUrl}`)}`
		: '';
	$: xHref = created
		? `https://x.com/intent/tweet?text=${encodeURIComponent(created.title + ' 🎁')}&url=${encodeURIComponent(shareUrl)}`
		: '';
</script>

<svelte:head>
	<title>Create a gift link · Rondwell</title>
</svelte:head>

<div class="mx-auto max-w-xl px-4 py-8">
	<button
		on:click={() => (step > 1 && step < 3 ? (step = (step - 1) as 1 | 2) : goto('/gift'))}
		class="mb-6 flex items-center gap-1 text-sm text-[#83808D] hover:text-gray-700"
	>
		<Icon icon="mdi:arrow-left" />
		{step > 1 && step < 3 ? 'Back' : 'All gifts'}
	</button>

	<!-- Progress -->
	{#if step < 3}
		<div class="mb-6 flex gap-2">
			{#each [1, 2] as s}
				<div
					class="h-1 flex-1 rounded-full transition-colors {step >= s ? 'bg-[#F31A7C]' : 'bg-[#EBECED]'}"
				></div>
			{/each}
		</div>
	{/if}

	{#if step === 1}
		<h1 class="text-2xl font-bold">What's the occasion?</h1>
		<p class="mt-1 mb-6 text-sm text-[#83808D]">We'll use it to set the tone of your page.</p>

		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{#each GIFT_OCCASIONS as o}
				<button
					on:click={() => (occasion = o.value)}
					class="flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-all {occasion === o.value
						? 'border-[#F31A7C] bg-[#FBDEEC]'
						: 'border-gray-200 bg-white hover:border-gray-300'}"
				>
					<span class="text-3xl">{o.emoji}</span>
					<span class="text-sm font-medium">{o.label}</span>
				</button>
			{/each}
		</div>

		<button
			on:click={() => (step = 2)}
			disabled={!canContinue1}
			class="mt-6 w-full rounded-lg bg-[#F31A7C] py-3 text-sm font-medium text-white hover:bg-[#d81869] disabled:opacity-50"
		>
			Continue
		</button>
	{:else if step === 2}
		<h1 class="text-2xl font-bold">Set it up</h1>
		<p class="mt-1 mb-6 text-sm text-[#83808D]">Only the title is required — the rest has defaults.</p>

		<div class="space-y-4">
			<div>
				<label class="mb-1 block text-xs font-medium text-gray-700" for="g-title">Title *</label>
				<input
					id="g-title"
					bind:value={title}
					placeholder="Ada's 30th 🎉"
					class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
				/>
			</div>

			<div>
				<label class="mb-1 block text-xs font-medium text-gray-700" for="g-msg">
					A note to your friends
				</label>
				<textarea
					id="g-msg"
					rows="3"
					maxlength="1000"
					bind:value={message}
					placeholder="Turning 30 and saving up for a trip — anything helps 💛"
					class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none"
				></textarea>
			</div>

			<CoverImagePicker bind:value={coverImageUrl} />

			<div>
				<span class="mb-2 block text-xs font-medium text-gray-700">Page colour</span>
				<div class="flex flex-wrap gap-2">
					{#each colors as c}
						<button
							type="button"
							aria-label={c.name}
							on:click={() => (selectedColor = c)}
							class="h-8 w-8 rounded-full border-2 transition-transform {selectedColor.name === c.name
								? 'scale-110 border-gray-900'
								: 'border-transparent'}"
							style="background-color: {c.bg};"
						></button>
					{/each}
				</div>
			</div>

			<div class="flex flex-wrap items-end gap-4">
				<div>
					<label class="mb-1 block text-xs font-medium text-gray-700" for="g-ccy">Currency</label>
					<select
						id="g-ccy"
						bind:value={currency}
						class="rounded-lg border border-gray-200 bg-white px-2 py-2.5 text-sm focus:outline-none"
					>
						<option value="NGN">NGN (₦)</option>
						<option value="USD">USD ($)</option>
					</select>
				</div>
				<div>
					<label class="mb-1 block text-xs font-medium text-gray-700" for="g-target">Goal (optional)</label>
					<input
						id="g-target"
						type="number"
						min="0"
						bind:value={targetMajor}
						placeholder="No goal"
						class="w-32 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none"
					/>
				</div>
				<div>
					<label class="mb-1 block text-xs font-medium text-gray-700" for="g-min">Minimum gift</label>
					<input
						id="g-min"
						type="number"
						min="100"
						bind:value={minMajor}
						class="w-28 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none"
					/>
				</div>
			</div>

			<div>
				<span class="mb-1 block text-xs font-medium text-gray-700">Suggested amounts</span>
				<div class="flex flex-wrap items-center gap-2">
					{#each suggestedMajor as _, i}
						<div class="flex items-center gap-1">
							<input
								type="number"
								min="0"
								bind:value={suggestedMajor[i]}
								class="w-24 rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm focus:outline-none"
							/>
							<button
								type="button"
								on:click={() => removeSuggestion(i)}
								aria-label="Remove amount"
								class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
							>
								<Icon icon="mdi:close" class="text-sm" />
							</button>
						</div>
					{/each}
					{#if suggestedMajor.length < 6}
						<button
							type="button"
							on:click={addSuggestion}
							class="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-[#83808D] hover:bg-gray-50"
						>
							+ Add
						</button>
					{/if}
				</div>
			</div>

			<label class="flex items-center gap-2 text-sm">
				<input type="checkbox" bind:checked={allowAnonymous} class="h-4 w-4 rounded" />
				Let people give anonymously
			</label>
			<label class="flex items-center gap-2 text-sm">
				<input type="checkbox" bind:checked={showContributorWall} class="h-4 w-4 rounded" />
				Show a wall of well-wishers on the page
			</label>
			{#if showContributorWall}
				<p class="rounded-lg bg-[#F6F6F6] p-2 text-xs text-[#5D646F]">
					Names and notes only — how much each person gave is never shown publicly.
				</p>
			{/if}
		</div>

		<button
			on:click={submit}
			disabled={!canContinue2 || creating}
			class="mt-6 w-full rounded-lg bg-[#F31A7C] py-3 text-sm font-medium text-white hover:bg-[#d81869] disabled:opacity-50"
		>
			{creating ? 'Creating…' : 'Create my gift link'}
		</button>
	{:else if created}
		<div class="text-center">
			<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E3F4E1]">
				<Icon icon="mdi:check" class="text-3xl text-[#3CBD2C]" />
			</div>
			<h1 class="text-2xl font-bold">Your link is live</h1>
			<p class="mt-1 text-sm text-[#83808D]">
				Share it anywhere. Friends don't need a Rondwell account to send you something.
			</p>
		</div>

		<div class="mt-6 rounded-2xl bg-[#F6F6F6] p-4">
			<p class="mb-2 text-xs font-medium text-gray-700">Your link</p>
			<div class="flex items-center gap-2">
				<code class="flex-1 truncate rounded-lg bg-white px-3 py-2.5 text-sm">{shareUrl}</code>
				<button
					on:click={copyShare}
					class="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
				>
					Copy
				</button>
			</div>
		</div>

		<div class="mt-4 grid grid-cols-2 gap-3">
			<a
				href={whatsappHref}
				target="_blank"
				rel="noopener"
				class="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] py-3 text-sm font-medium text-white no-underline"
			>
				<Icon icon="mdi:whatsapp" class="text-lg" />
				WhatsApp
			</a>
			<a
				href={xHref}
				target="_blank"
				rel="noopener"
				class="flex items-center justify-center gap-2 rounded-lg bg-gray-900 py-3 text-sm font-medium text-white no-underline"
			>
				<Icon icon="ri:twitter-x-fill" class="text-lg" />
				Share on X
			</a>
		</div>

		<div class="mt-6 flex gap-2">
			<button
				on:click={() => goto(`/gift/manage/${created?._id}`)}
				class="flex-1 rounded-lg bg-[#EBECED] py-3 text-sm font-medium text-[#5D646F] hover:bg-gray-200"
			>
				Manage it
			</button>
			<a
				href={`/gift/${created.slug}`}
				target="_blank"
				rel="noopener"
				class="flex-1 rounded-lg border border-gray-200 py-3 text-center text-sm font-medium text-gray-700 no-underline hover:bg-gray-50"
			>
				Preview
			</a>
		</div>

		{#if targetMajor}
			<p class="mt-4 text-center text-xs text-[#83808D]">
				Goal: {formatMoney(majorToKobo(targetMajor, currency), currency)}
			</p>
		{/if}
	{/if}
</div>
