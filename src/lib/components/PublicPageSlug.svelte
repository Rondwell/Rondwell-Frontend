<!--
  PublicPageSlug — Reusable slug view/copy component for vendor, speaker, and exhibitor settings.

  Usage:
    <PublicPageSlug slug={profile.publicProfileSlug} prefix="v" label="Vendor" />
    <PublicPageSlug slug={profile.publicProfileSlug} prefix="s" label="Speaker" />
    <PublicPageSlug slug={profile.publicProfileSlug} prefix="x" label="Exhibitor" />
-->
<script lang="ts">
	import Icon from '@iconify/svelte';

	/** The 6-char slug (e.g. "a3f9k2") */
	export let slug: string = '';

	/** URL prefix: "v" for vendor, "s" for speaker, "x" for exhibitor */
	export let prefix: 'v' | 's' | 'x' = 'v';

	/** Display label (e.g. "Vendor", "Speaker", "Exhibitor") */
	export let label: string = 'Profile';

	let copied = false;

	$: fullUrl = slug ? `rondwell.com/${prefix}/${slug}` : '';
	$: fullLink = slug ? `https://rondwell.com/${prefix}/${slug}` : '';

	function copyUrl() {
		if (!fullLink) return;
		navigator.clipboard.writeText(fullLink).then(() => {
			copied = true;
			setTimeout(() => (copied = false), 2000);
		});
	}
</script>

<div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
	<div class="mb-4">
		<h3 class="text-base font-bold text-gray-900">Public {label} Page</h3>
		<p class="mt-1 text-sm text-gray-400">
			Share this link so people can view your public {label.toLowerCase()} profile on Rondwell.
		</p>
	</div>

	{#if slug}
		<div class="space-y-3">
			<!-- URL Display -->
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
				<div class="flex min-w-0 flex-1 items-center overflow-hidden rounded-lg border border-gray-200 bg-[#F4F5F6]">
					<span class="flex-shrink-0 bg-[#EBECED] px-3 py-2.5 text-xs text-gray-500 sm:text-sm">
						rondwell.com/{prefix}/
					</span>
					<span class="truncate px-3 py-2.5 text-xs font-medium text-gray-900 sm:text-sm">
						{slug}
					</span>
				</div>
				<div class="flex gap-2">
					<button
						on:click={copyUrl}
						class="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 sm:text-sm"
					>
						{#if copied}
							<Icon icon="mdi:check" class="h-4 w-4 text-green-500" />
							Copied!
						{:else}
							<Icon icon="mdi:content-copy" class="h-4 w-4 text-gray-400" />
							Copy
						{/if}
					</button>
					<a
						href={fullLink}
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800 sm:text-sm"
					>
						<Icon icon="mdi:open-in-new" class="h-3.5 w-3.5" />
						View Page
					</a>
				</div>
			</div>

			<!-- Info note -->
			<div class="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2.5">
				<Icon icon="mdi:information-outline" class="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
				<p class="text-xs text-gray-500">
					This URL is auto-generated and unique to your profile. Share it on social media, business cards, or your website to drive traffic to your Rondwell {label.toLowerCase()} page.
				</p>
			</div>
		</div>
	{:else}
		<!-- No slug yet -->
		<div class="flex items-center gap-3 rounded-lg bg-amber-50 px-4 py-3">
			<Icon icon="mdi:alert-circle-outline" class="h-5 w-5 flex-shrink-0 text-amber-500" />
			<div>
				<p class="text-sm font-medium text-amber-800">Public page URL not generated yet</p>
				<p class="mt-0.5 text-xs text-amber-600">
					Your public page URL will be generated automatically. If you don't see it after saving your profile, please contact support.
				</p>
			</div>
		</div>
	{/if}
</div>
