<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getCollectionVerificationStatus } from '$lib/services/event.services';
	import { onMount } from 'svelte';

	$: collectionId = $page.params.id ?? '';

	let drafts: any[] = [];
	let published: any[] = [];
	let approvalStatus = 'PENDING';
	let loading = true;

	$: isVerified = approvalStatus === 'APPROVED';
	$: isPending = approvalStatus === 'PENDING';
	$: isRejected = approvalStatus === 'REJECTED';
	$: draftCount = drafts.length;
	$: publishedCount = published.length;

	onMount(async () => {
		try {
			const data = await getCollectionVerificationStatus(collectionId);
			approvalStatus = data.approvalStatus || 'PENDING';
		} catch {
			approvalStatus = 'PENDING';
		} finally {
			loading = false;
		}
	});
</script>

<div class="py-4">
	{#if loading}
		<div class="animate-pulse space-y-4">
			<div class="h-6 w-32 rounded bg-gray-200"></div>
			<div class="h-16 w-full rounded-lg bg-gray-200"></div>
			<div class="h-6 w-24 rounded bg-gray-200"></div>
		</div>
	{:else if isVerified}
		<!-- ✅ VERIFIED STATE — Ready to send newsletters -->
		<div class="mb-4 flex items-center justify-between">
			<h2 class="flex items-center gap-2 text-lg font-semibold">
				Drafts
				<div class="relative inline-flex items-center justify-center">
					<img src="/circle.svg" alt="" class="h-6 w-6" />
					<span class="absolute text-xs">{draftCount}</span>
				</div>
			</h2>
			<button class="flex gap-1 rounded-md bg-[#EBECED] px-3 py-1 text-sm text-[#616265]">
				<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M8.47168 0.96875C8.6804 0.760025 9.00599 0.690052 9.28711 0.807617L9.28809 0.806641L9.29004 0.808594H9.29297L9.29199 0.80957C9.57544 0.923019 9.75195 1.20299 9.75195 1.49902V5.99902C9.75195 6.41009 9.41302 6.74902 9.00195 6.74902C8.59095 6.74895 8.25196 6.41004 8.25195 5.99902V3.30957L8.03223 3.5293C7.74149 3.81994 7.26238 3.82 6.97168 3.5293C6.68098 3.23859 6.68104 2.75949 6.97168 2.46875L8.47168 0.96875Z" fill="#616265" stroke="#616265" stroke-width="0.375"/><path d="M12.7656 8.25018C14.5754 8.25024 15.5437 8.73138 16.0391 9.48944C16.5206 10.2264 16.5156 11.1784 16.5156 12.0002V12.7512C16.508 14.2128 16.1342 15.3464 15.3652 16.1135C14.5961 16.8806 13.462 17.2502 12 17.2502H6C3.81502 17.2502 2.65843 16.6703 2.06934 15.7687C1.49404 14.8883 1.5 13.7483 1.5 12.7502V12.0002C1.5 11.1785 1.49425 10.2264 1.97559 9.48944C2.47092 8.73132 3.44 8.2502 5.25 8.25018C5.71165 8.25018 6.04231 8.30601 6.32227 8.41425C6.53087 8.49493 6.70484 8.60243 6.87695 8.72382L7.0498 8.84979L7.06055 8.8576L7.07227 8.86932C7.07413 8.87081 7.07684 8.87269 7.08008 8.87518C7.08296 8.8774 7.0868 8.88081 7.09082 8.88397C7.10483 8.89498 7.12545 8.91399 7.14746 8.93964L7.14941 8.93866L7.91406 9.74921C8.48511 10.3532 9.53058 10.3533 10.1016 9.74921L10.8662 8.93866L10.8701 8.93475L10.9648 8.84979C11.1984 8.67278 11.4156 8.51804 11.6943 8.41132C11.9744 8.30411 12.3049 8.25018 12.7656 8.25018Z" fill="#616265" stroke="#616265" stroke-width="0.375"/><path d="M5.92969 3.79102C6.33747 3.74311 6.70958 4.0554 6.74902 4.46875L6.75293 4.54492C6.75136 4.92397 6.46254 5.25073 6.07031 5.28809C5.2147 5.36546 4.86343 5.5725 4.69336 5.87598C4.60314 6.03708 4.55249 6.24434 4.52637 6.51758C4.50021 6.79158 4.5 7.11476 4.5 7.50195V9.00195C4.49989 9.41293 4.161 9.75195 3.75 9.75195C3.33901 9.75195 3.00011 9.41292 3 9.00195V7.50195C3 6.78491 2.99651 5.92044 3.36621 5.20605C3.74801 4.4684 4.50447 3.92562 5.92969 3.79004V3.79102Z" fill="#616265" stroke="#616265" stroke-width="0.375"/><path d="M12.085 3.79004L12.084 3.79102C13.5072 3.9271 14.263 4.46895 14.6445 5.20605C15.0142 5.92043 15.0107 6.78493 15.0107 7.50195V9.00586C15.0008 9.41244 14.6649 9.75195 14.2529 9.75195C13.842 9.75188 13.503 9.41288 13.5029 9.00195V7.50195C13.5029 7.11477 13.5027 6.79171 13.4766 6.51758C13.4505 6.24423 13.3999 6.03666 13.3096 5.875C13.1605 5.60835 12.8725 5.41568 12.2305 5.31738L11.9326 5.28125C11.5206 5.24105 11.2218 4.87001 11.2617 4.46094C11.3014 4.05448 11.6602 3.73962 12.085 3.79004Z" fill="#616265" stroke="#616265" stroke-width="0.375"/>
				</svg>
				Create
			</button>
		</div>

		<div class="mb-4 flex items-center gap-2 rounded-lg bg-[#E3F4E1] px-4 py-3">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="#3CBD2C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="10" stroke="#3CBD2C" stroke-width="1.5"/></svg>
			<p class="text-sm text-[#3CBD2C]">Collection verified — you can now create and send newsletters to your subscribers.</p>
		</div>

		<p class="text-sm text-[#737577]">
			Manage your subscribers and events attendees.
			<span class="inline-block sm:inline">Events guests are automatically added to this list</span>
		</p>

		{#if drafts.length === 0}
			<div class="mt-6 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 py-12">
				<svg width="40" height="40" viewBox="0 0 24 24" fill="none" class="text-gray-300"><path d="M4 4h16v16H4z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 8h8M8 12h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
				<p class="text-sm text-gray-400">No drafts yet. Create your first newsletter.</p>
			</div>
		{/if}

		<!-- Published -->
		<div class="mt-6 border-t py-4">
			<h2 class="flex items-center gap-2 text-lg font-semibold">
				Published
				<div class="relative inline-flex items-center justify-center">
					<img src="/circle.svg" alt="" class="h-6 w-6" />
					<span class="absolute text-xs">{publishedCount}</span>
				</div>
			</h2>

			{#if published.length === 0}
				<div class="mt-4 flex flex-col items-center justify-center gap-4">
					<img src="/noEvent.svg" alt="No newsletters" class="ml-4 h-60 w-60" />
					<h2 class="text-lg font-semibold text-[#646568]">No Published Newsletters, yet</h2>
					<p class="max-w-md text-center text-[#A2ACB2]">
						When you publish newsletters, they will appear here.
					</p>
				</div>
			{/if}
		</div>

	{:else}
		<!-- ❌ NOT VERIFIED — Show verification prompt -->
		<div class="mb-4 flex items-center justify-between">
			<h2 class="flex items-center gap-2 text-lg font-semibold">
				Drafts
				<div class="relative inline-flex items-center justify-center">
					<img src="/circle.svg" alt="" class="h-6 w-6" />
					<span class="absolute text-xs">{draftCount}</span>
				</div>
			</h2>
			<button disabled class="flex gap-1 rounded-md bg-[#EBECED] px-3 py-1 text-sm text-[#616265] opacity-50">
				<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M8.47168 0.96875C8.6804 0.760025 9.00599 0.690052 9.28711 0.807617L9.28809 0.806641L9.29004 0.808594H9.29297L9.29199 0.80957C9.57544 0.923019 9.75195 1.20299 9.75195 1.49902V5.99902C9.75195 6.41009 9.41302 6.74902 9.00195 6.74902C8.59095 6.74895 8.25196 6.41004 8.25195 5.99902V3.30957L8.03223 3.5293C7.74149 3.81994 7.26238 3.82 6.97168 3.5293C6.68098 3.23859 6.68104 2.75949 6.97168 2.46875L8.47168 0.96875Z" fill="#616265" stroke="#616265" stroke-width="0.375"/><path d="M12.7656 8.25018C14.5754 8.25024 15.5437 8.73138 16.0391 9.48944C16.5206 10.2264 16.5156 11.1784 16.5156 12.0002V12.7512C16.508 14.2128 16.1342 15.3464 15.3652 16.1135C14.5961 16.8806 13.462 17.2502 12 17.2502H6C3.81502 17.2502 2.65843 16.6703 2.06934 15.7687C1.49404 14.8883 1.5 13.7483 1.5 12.7502V12.0002C1.5 11.1785 1.49425 10.2264 1.97559 9.48944C2.47092 8.73132 3.44 8.2502 5.25 8.25018C5.71165 8.25018 6.04231 8.30601 6.32227 8.41425C6.53087 8.49493 6.70484 8.60243 6.87695 8.72382L7.0498 8.84979L7.06055 8.8576L7.07227 8.86932C7.07413 8.87081 7.07684 8.87269 7.08008 8.87518C7.08296 8.8774 7.0868 8.88081 7.09082 8.88397C7.10483 8.89498 7.12545 8.91399 7.14746 8.93964L7.14941 8.93866L7.91406 9.74921C8.48511 10.3532 9.53058 10.3533 10.1016 9.74921L10.8662 8.93866L10.8701 8.93475L10.9648 8.84979C11.1984 8.67278 11.4156 8.51804 11.6943 8.41132C11.9744 8.30411 12.3049 8.25018 12.7656 8.25018Z" fill="#616265" stroke="#616265" stroke-width="0.375"/><path d="M5.92969 3.79102C6.33747 3.74311 6.70958 4.0554 6.74902 4.46875L6.75293 4.54492C6.75136 4.92397 6.46254 5.25073 6.07031 5.28809C5.2147 5.36546 4.86343 5.5725 4.69336 5.87598C4.60314 6.03708 4.55249 6.24434 4.52637 6.51758C4.50021 6.79158 4.5 7.11476 4.5 7.50195V9.00195C4.49989 9.41293 4.161 9.75195 3.75 9.75195C3.33901 9.75195 3.00011 9.41292 3 9.00195V7.50195C3 6.78491 2.99651 5.92044 3.36621 5.20605C3.74801 4.4684 4.50447 3.92562 5.92969 3.79004V3.79102Z" fill="#616265" stroke="#616265" stroke-width="0.375"/><path d="M12.085 3.79004L12.084 3.79102C13.5072 3.9271 14.263 4.46895 14.6445 5.20605C15.0142 5.92043 15.0107 6.78493 15.0107 7.50195V9.00586C15.0008 9.41244 14.6649 9.75195 14.2529 9.75195C13.842 9.75188 13.503 9.41288 13.5029 9.00195V7.50195C13.5029 7.11477 13.5027 6.79171 13.4766 6.51758C13.4505 6.24423 13.3999 6.03666 13.3096 5.875C13.1605 5.60835 12.8725 5.41568 12.2305 5.31738L11.9326 5.28125C11.5206 5.24105 11.2218 4.87001 11.2617 4.46094C11.3014 4.05448 11.6602 3.73962 12.085 3.79004Z" fill="#616265" stroke="#616265" stroke-width="0.375"/>
				</svg>
				Create
			</button>
		</div>

		<p class="text-sm text-[#737577]">
			Manage your subscribers and events attendees.
			<span class="inline-block sm:inline">Events guests are automatically added to this list</span>
		</p>

		{#if isPending}
			<div class="mt-4 mb-8 flex-col items-center justify-start rounded-md bg-[#F0E8D7] px-4 py-3 sm:flex sm:flex-row sm:justify-between">
				<div class="mb-4 flex items-center gap-2 sm:mb-0">
					<img src="/verify.svg" alt="verify" class="h-4 w-4" />
					<div class="flex flex-col">
						<h2 class="text-[#D69712]">Please verify your collection.</h2>
						<p class="text-[#737577]">Share information about your collection to send newsletters.</p>
					</div>
				</div>
				<button
					on:click={() => goto(`/collection/${collectionId}/engage/verify`)}
					class="flex w-[90px] items-center justify-center gap-1 rounded-md bg-[#E8E0D0] px-1 py-1 text-sm text-[#616265]"
				>
					Verify
					<svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M0.978516 0.939514C1.80208 0.135728 2.99327 -0.0435025 4.01563 0.497131L11.1172 4.23541L11.2744 4.32428C12.0405 4.79517 12.5107 5.6305 12.5107 6.5401C12.5106 7.44951 12.0404 8.28414 11.2744 8.75494L11.1172 8.84381L4.01563 12.5821C3.62002 12.7913 3.20419 12.8917 2.78809 12.8917C2.12527 12.8915 1.48426 12.6323 0.978516 12.1397C0.154115 11.3351 -0.0444085 10.1439 0.469727 9.1153L1.46289 7.12994C1.64464 6.76644 1.64469 6.3251 1.46191 5.95416V5.95319L0.469727 3.96393C-0.0444055 2.93537 0.154116 1.74413 0.978516 0.939514Z" fill="#7A7B7D" stroke="#7A7B7D" stroke-width="0.375"/>
						<rect x="6.23047" y="7.23053" width="4.15113" height="1.31904" rx="0.65952" transform="rotate(180 6.23047 7.23053)" fill="#7A7B7D" stroke="#7A7B7D" stroke-width="0.375"/>
					</svg>
				</button>
			</div>
		{:else if isRejected}
			<div class="mt-4 mb-8 flex-col items-center justify-start rounded-md bg-[#FDEAEA] px-4 py-3 sm:flex sm:flex-row sm:justify-between">
				<div class="mb-4 flex items-center gap-2 sm:mb-0">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#E53935" stroke-width="1.5"/><path d="M15 9l-6 6M9 9l6 6" stroke="#E53935" stroke-width="1.5" stroke-linecap="round"/></svg>
					<div class="flex flex-col">
						<h2 class="text-[#E53935]">Verification was declined.</h2>
						<p class="text-[#737577]">Please review the feedback and resubmit your verification request.</p>
					</div>
				</div>
				<button
					on:click={() => goto(`/collection/${collectionId}/engage/verify`)}
					class="flex w-[110px] items-center justify-center gap-1 rounded-md bg-[#F5D5D5] px-2 py-1 text-sm text-[#E53935]"
				>
					Resubmit
				</button>
			</div>
		{/if}

		<!-- Published -->
		<div class="mt-4 border-t py-4">
			<h2 class="flex items-center gap-2 text-lg font-semibold">
				Published
				<div class="relative inline-flex items-center justify-center">
					<img src="/circle.svg" alt="" class="h-6 w-6" />
					<span class="absolute text-xs">{publishedCount}</span>
				</div>
			</h2>

			{#if published.length === 0}
				<div class="mt-4 flex flex-col items-center justify-center gap-4">
					<img src="/noEvent.svg" alt="No newsletters" class="ml-4 h-60 w-60" />
					<h2 class="text-lg font-semibold text-[#646568]">No Published Newsletters, yet</h2>
					<p class="max-w-md text-center text-[#A2ACB2]">
						When you publish newsletters, they will appear here.
					</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
