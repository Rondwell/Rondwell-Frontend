<script lang="ts">
	import { updateSpeakerDetails } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let participant = 'Speaker';
	export let speakerData: any = null;
	export let eventId = '';
	export let eventTitle = '';
	participant = participant.charAt(0).toUpperCase() + participant.slice(1);

	let editDisplayName = '';
	let editBio = '';
	let editIsPublic = true;
	let isSaving = false;
	let saveError = '';

	$: if (speakerData && open) {
		editDisplayName = speakerData.displayName || '';
		editBio = speakerData.bio || '';
		editIsPublic = speakerData.isPublic ?? true;
	}

	function closeModal() {
		open = false;
		dispatch('close');
	}

	async function saveChanges() {
		if (isSaving || !speakerData?.id || !eventId) return;
		isSaving = true;
		saveError = '';
		try {
			await updateSpeakerDetails(eventId, speakerData.id, {
				displayName: editDisplayName,
				bio: editBio,
				isPublic: editIsPublic,
			});
			dispatch('save');
			closeModal();
		} catch (e: any) {
			saveError = e.message || 'Failed to save changes';
		} finally {
			isSaving = false;
		}
	}

	function getDisplayName(): string {
		return speakerData?.displayName || speakerData?.applicationDetails?.contactEmail || 'Unknown Speaker';
	}

	function getEmail(): string {
		return speakerData?.applicationDetails?.contactEmail || 'Not provided';
	}

	function getSessions(): any[] {
		return (speakerData?.assignedSessions || []).map((id: string, i: number) => ({
			id, title: `Session ${i + 1}`
		}));
	}
</script>

{#if open && speakerData}
	<div on:click={() => (open = false)} class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-3 py-10">
		<div class="h-155 w-full max-w-xl rounded-xl overflow-hidden bg-[#F4F5F6] shadow-xl" on:click|stopPropagation>
			<!-- Header -->
			<div class="flex items-start md:items-center justify-between border-b border-gray-200 px-6 py-4">
				<div class="flex flex-col gap-3 md:flex-row md:items-center">
					<div class="flex items-center gap-3">
						<button aria-label="Close" on:click={closeModal}>
							<svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
								<rect y="12.8203" width="9.9258" height="1.96151" rx="0.980754" transform="rotate(-45 0 12.8203)" fill="#68696B"/>
								<rect x="1.38867" width="10.0318" height="1.96151" rx="0.980754" transform="rotate(45 1.38867 0)" fill="#68696B"/>
								<rect x="7.10547" y="12.8203" width="9.9258" height="1.96151" rx="0.980754" transform="rotate(-45 7.10547 12.8203)" fill="#68696B"/>
								<rect x="8.49414" width="10.0318" height="1.96151" rx="0.980754" transform="rotate(45 8.49414 0)" fill="#68696B"/>
							</svg>
						</button>
						<p>{participant} Details</p>
					</div>
					<div class="flex items-center gap-3">
						<button on:click={saveChanges} disabled={isSaving} class="flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
							{isSaving ? 'Saving...' : 'Save Changes'}
						</button>
						<button on:click={closeModal} class="flex items-center gap-1 rounded-lg bg-[#F0F1F1] px-3 py-1.5 text-sm font-medium text-[#727375]">
							Close
						</button>
					</div>
				</div>
			</div>

			<!-- Content -->
			<div class="custom-scrollbar h-134 space-y-6 overflow-hidden overflow-y-auto px-4 md:px-6 py-6">
				{#if saveError}
					<p class="text-sm text-red-500">{saveError}</p>
				{/if}

				<!-- Speaker Avatar and Name -->
				<div class="flex flex-col items-start space-x-4 border-b pb-2">
					{#if speakerData.profilePictureUrl}
						<img src={speakerData.profilePictureUrl} alt={getDisplayName()} class="h-18 w-18 rounded-full object-cover" />
					{:else}
						<div class="flex h-18 w-18 items-center justify-center rounded-full bg-purple-100 text-2xl font-medium text-purple-600">
							{getDisplayName().charAt(0).toUpperCase()}
						</div>
					{/if}
					<div>
						<h1 class="mt-3 text-xl font-bold">{getDisplayName()}</h1>
					</div>
				</div>

				<!-- Editable Display Name -->
				<div class="rounded-lg bg-gray-50 p-4">
					<h3 class="mb-6 text-2xl font-medium">{participant} profile details</h3>

					<div class="mb-4">
						<label class="mb-1 block font-medium" for="edit_display_name">Display Name</label>
						<input id="edit_display_name" type="text" bind:value={editDisplayName} placeholder="Speaker's display name for this event" class="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-800 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none" />
					</div>

					<!-- Contact Details (Read-only) -->
					<div class="mt-6">
						<div class="mb-4 flex items-start gap-2">
							<Icon icon="mdi:email-outline" width="22" class="text-[#919293]" />
							<div>
								<p class="font-medium">Email Address</p>
								<p class="text-[#919293]">{getEmail()}</p>
							</div>
						</div>

						{#if speakerData.socialLinks}
							<div class="mt-3 flex items-center gap-4">
								{#if speakerData.socialLinks.twitter}
									<a href="https://x.com/{speakerData.socialLinks.twitter}" target="_blank" rel="noopener noreferrer">
										<Icon icon="simple-icons:x" width="24" class="cursor-pointer text-black" />
									</a>
								{/if}
								{#if speakerData.socialLinks.linkedin}
									<a href="https://linkedin.com/in/{speakerData.socialLinks.linkedin}" target="_blank" rel="noopener noreferrer">
										<Icon icon="simple-icons:linkedin" width="24" class="cursor-pointer text-black" />
									</a>
								{/if}
								{#if speakerData.socialLinks.website}
									<a href={speakerData.socialLinks.website.startsWith('http') ? speakerData.socialLinks.website : `https://${speakerData.socialLinks.website}`} target="_blank" rel="noopener noreferrer">
										<Icon icon="mdi:web" width="24" class="cursor-pointer text-black" />
									</a>
								{/if}
							</div>
						{/if}
					</div>
				</div>

				<!-- Speaker Bio Section (Editable) -->
				<div class="space-y-6 rounded-lg bg-gray-50 p-4">
					<div>
						<div class="flex items-center gap-1">
							<h3 class="font-medium">{participant} Bio</h3>
							<span class="text-sm text-gray-400">(Editable for this event)</span>
						</div>
						<div class="relative">
							<textarea bind:value={editBio} rows="3" maxlength="2000" placeholder="Speaker bio for this event..." class="mt-2 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-gray-800 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
							<div class="absolute right-2 bottom-3 text-xs text-gray-500">
								{editBio.length}/2000
							</div>
						</div>
					</div>

					<!-- Assigned Sessions -->
					<div>
						<div class="mb-2 flex items-center gap-1">
							<h3 class="font-medium">Assigned Sessions</h3>
							<Icon icon="mdi:information-outline" width="14" class="text-gray-400" />
						</div>
						{#if getSessions().length > 0}
							<div class="overflow-hidden rounded-lg border border-gray-200">
								{#each getSessions() as session, i}
									<div class="flex items-center justify-between border p-4 text-sm" class:bg-[#EFEFEF]={i === 0} class:bg-white={i !== 0}>
										<span>{session.title}</span>
										<button class="text-[#909EA3] underline">Manage Sessions</button>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-gray-400">No sessions assigned yet.</p>
						{/if}
					</div>

					<!-- Public Visibility -->
					<div class="flex items-center justify-between">
						<div>
							<div class="mb-1 flex items-center gap-1">
								<h3 class="font-medium">Public Visibility</h3>
								<Icon icon="mdi:information-outline" width="14" class="text-gray-400" />
							</div>
							<p class="mb-2 text-xs font-light text-gray-700">Show on Public Event Page</p>
						</div>
						<label class="relative inline-flex cursor-pointer items-center">
							<button aria-label="toggle" class="relative h-6 w-10 rounded-full transition-colors duration-300" class:bg-gray-300={!editIsPublic} class:bg-gray-800={editIsPublic} on:click={() => (editIsPublic = !editIsPublic)}>
								<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300" class:translate-x-4={editIsPublic}></span>
							</button>
						</label>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	::-webkit-scrollbar { width: 6px; }
	::-webkit-scrollbar-thumb { background: rgba(107, 114, 128, 0.5); border-radius: 3px; }
	::-webkit-scrollbar-thumb:hover { background: rgba(107, 114, 128, 0.8); }
</style>
