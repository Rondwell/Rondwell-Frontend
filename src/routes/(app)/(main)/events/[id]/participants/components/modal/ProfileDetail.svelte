<script lang="ts">
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let participant = 'Speaker';
	participant = participant.charAt(0).toUpperCase() + participant.slice(1);

	let speakerData = {
		id: null,
		name: 'Edima Atahnasius',
		avatar: '/face-2.svg',
		aboutMe:
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint...',
		email: 'arthur@gmail.com',
		phone: '+1 (012) 345-6789',
		bio: 'UX Designer, 8+ years of experience in fintech...',
		sessions: [
			{ id: 1, title: 'Opening Prayer', assigned: true },
			{ id: 2, title: 'Opening Remark', assigned: true },
			{ id: 3, title: 'Taking of the Toast', assigned: true }
		],
		isPublic: true
	};

	let editingAboutMe = false;
	let editingBio = false;
	let isSaving = false;

	function closeModal() {
		open = false;
		dispatch('close');
	}

	function toggleEditAboutMe() {
		editingAboutMe = !editingAboutMe;
	}

	function toggleEditBio() {
		editingBio = !editingBio;
	}

	function updateAboutMe(e: any) {
		speakerData.aboutMe = e.target.value;
	}

	function updateBio(e: any) {
		speakerData.bio = e.target.value;
	}

	function updateEmail(e: any) {
		speakerData.email = e.target.value;
	}

	function updatePhone(e: any) {
		speakerData.phone = e.target.value;
	}

	function togglePublicVisibility() {
		speakerData.isPublic = !speakerData.isPublic;
	}

	function saveChanges() {
		if (isSaving) return;
		isSaving = true;
		setTimeout(() => {
			isSaving = false;
			dispatch('save', speakerData);
		}, 800);
	}

	function sendMessage() {
		dispatch('sendMessage', speakerData.id);
	}

	function manageSession(sessionId: any) {
		dispatch('manageSession', sessionId);
	}
</script>

{#if open}
	<div
		on:click={() => (open = false)}
		class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-3 py-10"
	>
		<!-- Modal container -->
		<div class="h-155 w-full max-w-xl rounded-xl overflow-hidden bg-[#F4F5F6] shadow-xl" on:click|stopPropagation>
			<!-- Header -->
			<div class="flex items-start md:items-center justify-between border-b border-gray-200 px-6 py-4">
				<div class="flex flex-col gap-3 md:flex-row md:items-center">
					<div class="flex items-center gap-3">
						<button aria-label="Close" on:click={() => (open = false)}>
							<svg
								width="16"
								height="15"
								viewBox="0 0 16 15"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<rect
									y="12.8203"
									width="9.9258"
									height="1.96151"
									rx="0.980754"
									transform="rotate(-45 0 12.8203)"
									fill="#68696B"
								/>
								<rect
									x="1.38867"
									width="10.0318"
									height="1.96151"
									rx="0.980754"
									transform="rotate(45 1.38867 0)"
									fill="#68696B"
								/>
								<rect
									x="7.10547"
									y="12.8203"
									width="9.9258"
									height="1.96151"
									rx="0.980754"
									transform="rotate(-45 7.10547 12.8203)"
									fill="#68696B"
								/>
								<rect
									x="8.49414"
									width="10.0318"
									height="1.96151"
									rx="0.980754"
									transform="rotate(45 8.49414 0)"
									fill="#68696B"
								/>
							</svg>
						</button>
						<p>{participant} Details</p>
					</div>
					<div class="flex items-center gap-3">
						<button
							class="flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
						>
							Send Message
						</button>
						<button
							class="flex items-center gap-1 rounded-lg bg-[#F0F1F1] px-3 py-1.5 text-sm font-medium text-[#727375]"
						>
							Save Changes
						</button>
					</div>
				</div>

				<div class="flex gap-2">
					<button
						aria-label="revert"
						class="bg-[#F5F5F5] p-1 text-[#68696B] transition-transform duration-300"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 rotate-90"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
					<button
						aria-label="forward"
						class="bg-[#F5F5F5] p-1 text-[#68696B] transition-transform duration-300"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 -rotate-90"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</div>
			</div>

			<!-- Content -->
			<div class="custom-scrollbar h-134 space-y-6 overflow-hidden overflow-y-auto px-4 md:px-6 py-6">
				<!-- Speaker Avatar and Name -->
				<div class="flex flex-col items-start space-x-4 border-b pb-2">
					<img
						src={speakerData.avatar}
						alt={speakerData.name}
						class="h-18 w-18 rounded-full object-cover"
					/>
					<div>
						<h1 class="mt-3 text-xl font-bold">{speakerData.name}</h1>
					</div>
				</div>

				<!-- About Me Section -->
				<div class="rounded-lg bg-gray-50 p-4">
					<h3 class="mb-6 text-2xl font-medium">{participant} profile details</h3>

					<div class="mb-2 flex items-center justify-between">
						<p>About me</p>

						<!-- Edit Button -->
						<button
							on:click={toggleEditAboutMe}
							class="text-gray-500 transition-colors hover:text-gray-700"
						>
							<img src="/edit-icon.svg" alt="" />
						</button>
					</div>

					<p class="font-medium whitespace-pre-wrap text-[#919293]">
						{speakerData.aboutMe}
					</p>

					<!-- Contact Details -->
					<div class="mt-6">
						<!-- Email -->
						<div class="mb-4 flex items-start gap-2">
							<Icon icon="mdi:email-outline" width="22" class="text-[#919293]" />

							<div class="">
								<p class="font-medium">Email Address</p>
								<p class="text-[#919293]">{speakerData.email}</p>
							</div>
						</div>

						<!-- Phone -->
						<div class="mb-4 flex items-start gap-2">
							<Icon icon="mdi:phone-outline" width="22" class="text-[#919293]" />

							<div class="">
								<p class="font-medium">Phone Number</p>
								<p class="text-[#919293]">{speakerData.phone}</p>
							</div>
						</div>

						<!-- Social Icons -->
						<div class="mt-3 flex items-center gap-4">
							<Icon icon="simple-icons:x" width="24" class="cursor-pointer text-black" />
							<Icon icon="simple-icons:facebook" width="24" class="cursor-pointer text-black" />
							<Icon icon="simple-icons:instagram" width="24" class="cursor-pointer text-black" />
							<Icon icon="simple-icons:youtube" width="26" class="cursor-pointer text-black" />
						</div>
					</div>
				</div>

				<!-- Speaker Bio Section -->
				<div class="space-y-6 rounded-lg bg-gray-50 p-4">
					<!-- Speaker Bio -->
					<div>
						<div class="flex items-center gap-1">
							<h3 class="font-medium">{participant} Bio*</h3>
							<span class="text-sm text-gray-400">(Optional)</span>
						</div>

						<div class="relative">
							<textarea
								bind:value={speakerData.bio}
								on:input={updateBio}
								rows="3"
								maxlength="200"
								placeholder="UX Designer, 8+ years of experience in fintech…"
								class="mt-2 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-gray-800
				   focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
							></textarea>
							<div class="absolute right-2 bottom-3 text-xs text-gray-500">
								{speakerData.bio.length}/200
							</div>
						</div>

						<div class="mt-1 flex items-center gap-1 text-xs font-light text-gray-700">
							<Icon icon="mdi:information-outline" width="14" class="text-gray-400" />
							<span>You can describe your company briefly.</span>
						</div>
					</div>

					<!-- Assigned Sessions -->
					<div>
						<div class="mb-2 flex items-center gap-1">
							<h3 class="font-medium">Assigned Sessions</h3>
							<Icon icon="mdi:information-outline" width="14" class="text-gray-400" />
						</div>

						<div class="overflow-hidden rounded-lg border border-gray-200">
							{#each speakerData.sessions as session, i}
								<div
									class="flex items-center justify-between border p-4 text-sm"
									class:bg-[#EFEFEF]={i === 0}
									class:bg-white={i !== 0}
									class:border-t={i !== speakerData.sessions.length - 1}
								>
									<span>{session.title}</span>

									<button
										class="text-[#909EA3] underline"
										on:click={() => manageSession(session.id)}
									>
										Manage Sessions
									</button>
								</div>
							{/each}
						</div>
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

						<!-- Toggle Switch -->
						<label class="relative inline-flex cursor-pointer items-center">
							<button
								aria-label="toggle"
								class="relative h-6 w-10 rounded-full transition-colors duration-300"
								class:bg-gray-300={!speakerData.isPublic}
								class:bg-gray-800={speakerData.isPublic}
								on:click={togglePublicVisibility}
							>
								<span
									class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
									class:translate-x-4={speakerData.isPublic}
								></span>
							</button>
						</label>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Scrollbar styling for webkit */
	::-webkit-scrollbar {
		width: 6px;
	}
	::-webkit-scrollbar-thumb {
		background: rgba(107, 114, 128, 0.5);
		border-radius: 3px;
	}
	::-webkit-scrollbar-thumb:hover {
		background: rgba(107, 114, 128, 0.8);
	}
</style>
