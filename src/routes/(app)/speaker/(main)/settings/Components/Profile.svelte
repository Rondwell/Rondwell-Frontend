<script lang="ts">
	import Icon from '@iconify/svelte';

	type SocialLinkKey = 'instagram' | 'x' | 'youtube' | 'tiktok' | 'linkedin' | 'website';

	interface Profile {
		name: string;
		professional: string;
		bio: string;
		profilePicture: string;
		socialLinks: Record<SocialLinkKey, string>;
	}

	// Mock data for the settings page
	let profile: Profile = {
		name: 'JOHN HOUSEMAN',
		professional: 'Venue rental',
		bio: '',
		socialLinks: {
			instagram: '',
			x: '',
			youtube: '',
			tiktok: '',
			linkedin: '',
			website: ''
		},
		profilePicture: '/face-1.svg'
	};

	const socialLinks: { key: SocialLinkKey; icon: string; label: string; prefix: string }[] = [
		{ key: 'instagram', icon: 'mdi:instagram', label: 'instagram.com/', prefix: '' },
		{ key: 'x', icon: 'mdi:twitter', label: 'x.com/', prefix: '' },
		{ key: 'youtube', icon: 'mdi:youtube', label: 'youtube.com/@', prefix: '' },
		{ key: 'tiktok', icon: 'simple-icons:tiktok', label: 'tiktok.com/@', prefix: '' },
		{ key: 'linkedin', icon: 'mdi:linkedin', label: 'linkedin.com/in/', prefix: '' },
		{ key: 'website', icon: 'mdi:web', label: '', prefix: 'Your website' }
	];

	let showChangeEmail = false;

	let emails = [{ address: 'johnmedic12@gmail.com', isPrimary: true, verified: true }];

	let phoneNumber = '+234 802 143 2345';

	// Form handling functions
	const saveChanges = () => {
		console.log('Saving changes:', profile);
		// In a real app, you would send this to your backend
	};

	const addEmail = () => {
		emails.push({ address: '', isPrimary: false, verified: false });
	};

	const changeEmail = (index: number) => {
		console.log('Changing email at index:', index);
		// Implement email change logic
	};

	const updatePhoneNumber = () => {
		console.log('Updating phone number:', phoneNumber);
		// Implement phone number update logic
	};

	// Mock data for security settings
	let accountPassword = {
		isSet: false,
		status: 'Not Set'
	};

	let twoFactorAuth = {
		isEnabled: false,
		status: 'Disabled'
	};

	let passkey = {
		isSet: false,
		status: 'Not Set'
	};

	let thirdPartyAccounts = [
		{
			name: 'Google',
			status: 'Not Linked',
			icon: '/google-icon.svg'
		},
		{ name: 'Zoom', status: 'Not Linked', icon: '/zoom-icon.svg' },
		{
			name: 'Solana',
			status: 'Not Linked',
			icon: '/Element.svg'
		},
		{
			name: 'Ethereum',
			status: 'Not Linked',
			icon: '/Ethereum Classic Coin.svg'
		}
	];

	let calendarSyncing = {
		isEnabled: false,
		status: 'Disabled'
	};

	let syncContacts = {
		isEnabled: false,
		status: 'Disabled'
	};

	let activeDevices = [
		{
			browser: 'Chrome on Windows',
			location: 'Lagos, Nigeria',
			date: 'Fri 24, 2024',
			isCurrent: true
		}
	];

	// Functions for button actions
	const setAccountPassword = () => {
		console.log('Setting account password...');
		accountPassword.isSet = true;
		accountPassword.status = 'Set';
	};

	const enableTwoFactorAuth = () => {
		console.log('Enabling two-factor authentication...');
		twoFactorAuth.isEnabled = true;
		twoFactorAuth.status = 'Enabled';
	};

	const addPasskey = () => {
		console.log('Adding passkey...');
		passkey.isSet = true;
		passkey.status = 'Set';
	};

	const linkAccount = (accountName: string) => {
		console.log(`Linking ${accountName} account...`);
		const index = thirdPartyAccounts.findIndex((acc) => acc.name === accountName);
		if (index !== -1) {
			thirdPartyAccounts[index].status = 'Linked';
		}
	};

	const enableCalendarSyncing = () => {
		console.log('Enabling calendar syncing...');
		calendarSyncing.isEnabled = true;
		calendarSyncing.status = 'Enabled';
	};

	const enableSyncContacts = () => {
		console.log('Enabling contact syncing...');
		syncContacts.isEnabled = true;
		syncContacts.status = 'Enabled';
	};

	const deleteAccount = () => {
		if (
			confirm(
				'Are you sure you want to permanently delete your account? This action cannot be undone.'
			)
		) {
			console.log('Deleting account...');
			// In a real app, this would call your backend API
		}
	};
    // ============================================
	// INTERFACES
	// ============================================
	interface Expertise {
		label: string;
		icon: string;
	}
    const expertiseOptions: Expertise[] = [
		{ label: 'Technology & Software', icon: '/technology.svg' },
		{ label: 'Financial Services', icon: '/finance.svg' },
		{ label: 'Healthcare & Wellness', icon: '/healthcare.svg' },
		{ label: 'Education & Training', icon: '/education.svg' },
		{ label: 'Entertainment', icon: '/entertainment.svg' },
		{ label: 'Manufacturing', icon: '/manufacturing.svg' },
		{ label: 'Retail & E-commerce', icon: '/retail.svg' },
		{ label: 'Marketing & Advertising', icon: '/marketing.svg' },
		{ label: 'Professional Services', icon: '/professional-service.svg' },
		{ label: 'Transportation & Mobility', icon: '/transportation.svg' },
		{ label: 'Food & Hospitality', icon: '/food.svg' },
		{ label: 'Other', icon: '/other.svg' }
	];

	let selectedExpertise = $state<Expertise[]>([]);
    function selectExpertise(type: Expertise) {
	if (!selectedExpertise.some(e => e.label === type.label)) {
		selectedExpertise = [...selectedExpertise, type];
	}
	isOpen = false;
}

	let isOpen = $state(false);


	function toggleDropdown() {
		isOpen = !isOpen;
	}


function removeExpertise(label: string) {
	selectedExpertise = selectedExpertise.filter(e => e.label !== label);
}
</script>

<!-- Your Profile Section -->
<div class="mb-12">
	<h2 class="mb-1 text-2xl font-medium">Profile Details</h2>
	<p class="mb-4 text-sm text-[#8C8F93]">Manage Your Public Speaker Profile.</p>

	<div class="flex w-full flex-col-reverse gap-6 md:flex-row md:gap-12">
		<!-- Left Column - Text Fields -->
		<div class="w-full max-w-[350px] space-y-4 text-[#84857A]">
			<!-- Name -->
			<div>
				<label for="name" class="mb-1 block text-sm font-medium">Full Name</label>
				<input
					type="text"
					bind:value={profile.name}
					class="h-[42px] w-full rounded-[7.5px] bg-[#FFFFFF] px-3 py-2 shadow-sm focus:ring-0 focus:outline-none"
				/>
			</div>

			<!-- Professional/Affiliation -->
			<div>
				<label for="text" class="mb-1 block text-sm font-medium">Professional/Affiliation</label>
				<div class="flex h-[42px] items-center shadow-sm">
					
					<input
						type="text"
						bind:value={profile.professional}
						class="h-full w-full rounded-tr-[7.5px] rounded-br-[7.5px] bg-[#FFFFFF] px-3 py-2 focus:ring-0 focus:outline-none"
					/>
				</div>
			</div>

			<!-- Bio -->
			<div>
				<label for="bio" class="mb-1 block text-sm font-medium">Speaker Bio</label>
				<textarea
					rows="3"
					bind:value={profile.bio}
					placeholder="Share a little about your background and interests."
					class="w-full resize-none rounded-[7.5px] bg-[#FFFFFF] px-3 py-2 shadow-sm focus:ring-0 focus:outline-none"
				></textarea>
			</div>
		</div>

		<!-- Right Column - Profile Picture -->
		<div class="mb-8 grid gap-6 sm:grid-cols-3 bg-white p-6 rounded-2xl border border-gray-200">
				<div
					class="col-span-1 flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 text-center"
				>
					<div
						class="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400"
					>
						<Icon icon="heroicons:user" class="h-8 w-8" />
					</div>
					<h3 class="text-xs font-semibold text-gray-900">Business Logo</h3>
					<p class="mb-3 text-[10px] text-gray-400">Max file size: 1MB</p>
					<button
						class="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-[10px] font-medium text-gray-700 hover:bg-gray-50"
						>Add Image</button
					>
				</div>
				<div
					class="col-span-2 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-6 text-center"
				>
					<Icon icon="heroicons:cloud-arrow-up" class="mb-2 h-6 w-6 text-gray-400" />
					<h3 class="mb-1 text-xs font-semibold text-gray-900">Cover/Banner Image</h3>
					<p class="mb-4 text-center text-[10px] text-gray-400">
						Choose a file or drag & drop it here.<br />JPEG, PNG, PDF up to 50 MB.
					</p>
					<button
						class="rounded-full border border-gray-300 bg-white px-6 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
						>Browse File</button
					>
				</div>
			</div>
	</div>

	<!-- Save Changes Button -->
	<div class="mt-6">
		<button
			onclick={saveChanges}
			class="flex items-center gap-2 rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800"
		>
			<svg
				width="19"
				height="19"
				viewBox="0 0 19 19"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M14.731 13.5881C14.731 12.9515 14.217 12.4375 13.5803 12.4375C12.9436 12.4375 12.4297 12.9515 12.4297 13.5881C12.4297 14.2248 12.9436 14.7388 13.5803 14.7388C13.7376 14.7388 13.891 14.7081 14.0291 14.6467"
					stroke="white"
					stroke-width="1.5"
					stroke-miterlimit="10"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M11.6211 16.8778L12.0392 17.1194C12.3422 17.2997 12.7334 17.1923 12.9136 16.8893L12.9558 16.8164C13.301 16.2143 13.8687 16.2143 14.2177 16.8164L14.2599 16.8893C14.4401 17.1923 14.8314 17.2997 15.1344 17.1194L15.7979 16.7397C16.1469 16.5403 16.2658 16.0915 16.0664 15.7463C15.7174 15.1442 16.0012 14.6532 16.6954 14.6532C17.0943 14.6532 17.4241 14.3272 17.4241 13.9245V13.2495C17.4241 12.8506 17.0981 12.5207 16.6954 12.5207C16.308 12.5207 16.0472 12.3673 15.9552 12.1257C15.8823 11.9377 15.913 11.6923 16.0664 11.4276C16.2658 11.0786 16.1469 10.6337 15.7979 10.4342L15.4872 10.2578"
					stroke="white"
					stroke-width="1.5"
					stroke-miterlimit="10"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M14.2145 10.3595C13.8693 10.9617 13.3016 10.9617 12.9526 10.3595L12.9104 10.2867C12.734 9.98367 12.3428 9.87628 12.0398 10.0565L11.3762 10.4363C11.0272 10.6357 10.9083 11.0844 11.1077 11.4335C11.4568 12.0318 11.173 12.5227 10.4787 12.5227C10.0798 12.5227 9.75 12.8488 9.75 13.2515V13.9265C9.75 14.3254 10.076 14.6552 10.4787 14.6552C11.173 14.6552 11.4568 15.1462 11.1077 15.7484"
					stroke="white"
					stroke-width="1.5"
					stroke-miterlimit="10"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M12.4103 7.10898C12.8906 5.92096 12.5918 3.54116 11.8326 2.50743C11.8326 2.50743 10.9082 1.44944 10.0998 1.1653C9.59838 0.98909 8.75196 0.973571 8.75196 0.973571C8.75196 0.973571 8.04044 0.892412 7.5967 0.973571C6.73424 1.13132 6.29133 1.50652 5.67127 2.12396C5.05122 2.74141 4.74325 3.19791 4.51602 4.04129C4.30169 4.83679 4.27058 5.3638 4.51602 6.15034C4.72651 6.82491 5.47873 7.6842 5.47873 7.6842C5.47873 7.6842 6.10624 8.31368 6.2489 8.83459C6.39157 9.35551 6.27631 9.59267 6.05643 9.98496C5.8732 10.3119 5.47873 10.5602 5.47873 10.5602C5.47873 10.5602 4.79503 11.0606 4.32348 11.3271C3.67943 11.6911 3.23463 11.73 2.59059 12.094C2.59059 12.094 1.76822 12.4348 1.43533 12.861C1.22888 13.1253 1.1444 13.3064 1.05025 13.6279C0.90287 14.1311 0.896994 14.4686 1.05025 14.97C1.17791 15.3877 1.31023 15.6277 1.62788 15.9287C2.04274 16.3218 2.97575 16.6956 2.97575 16.6956C2.97575 16.6956 3.63853 16.9701 4.13093 17.0791C5.86389 17.4625 8.9445 17.2708 8.9445 17.2708"
					stroke="white"
					stroke-width="1.875"
				/>
				<rect
					x="-0.249404"
					y="-0.329115"
					width="1.22077"
					height="0.584318"
					rx="0.292159"
					transform="matrix(-0.990719 -0.13593 0.13706 -0.990563 12.8142 7.05316)"
					fill="white"
					stroke="white"
					stroke-width="0.584318"
				/>
				<rect
					x="-0.253915"
					y="0.287719"
					width="1.22319"
					height="0.542831"
					rx="0.271415"
					transform="matrix(0.0625521 0.998042 -0.998074 0.0620286 9.45538 16.8827)"
					fill="white"
					stroke="white"
					stroke-width="0.542831"
				/>
				<path
					d="M12.4103 7.10898C12.8906 5.92096 12.5918 3.54116 11.8326 2.50743C11.8326 2.50743 10.9082 1.44944 10.0998 1.1653C9.59838 0.98909 8.75196 0.973571 8.75196 0.973571C8.75196 0.973571 8.04044 0.892412 7.5967 0.973571C6.73424 1.13132 6.29133 1.50652 5.67127 2.12396C5.05122 2.74141 4.74325 3.19791 4.51602 4.04129C4.30169 4.83679 4.27058 5.3638 4.51602 6.15034C4.72651 6.82491 5.47873 7.6842 5.47873 7.6842C5.47873 7.6842 6.10624 8.31368 6.2489 8.83459C6.39157 9.35551 6.27631 9.59267 6.05643 9.98496C5.8732 10.3119 5.47873 10.5602 5.47873 10.5602C5.47873 10.5602 4.79503 11.0606 4.32348 11.3271C3.67943 11.6911 3.23463 11.73 2.59059 12.094C2.59059 12.094 1.76822 12.4348 1.43533 12.861C1.22888 13.1253 1.1444 13.3064 1.05025 13.6279C0.90287 14.1311 0.896994 14.4686 1.05025 14.97C1.17791 15.3877 1.31023 15.6277 1.62788 15.9287C2.04274 16.3218 2.97575 16.6956 2.97575 16.6956C2.97575 16.6956 3.63853 16.9701 4.13093 17.0791C5.86389 17.4625 8.9445 17.2708 8.9445 17.2708"
					stroke="white"
					stroke-width="1.875"
				/>
				<rect
					x="-0.249404"
					y="-0.329115"
					width="1.22077"
					height="0.584318"
					rx="0.292159"
					transform="matrix(-0.990719 -0.13593 0.13706 -0.990563 12.8142 7.05316)"
					fill="white"
					stroke="white"
					stroke-width="0.584318"
				/>
				<rect
					x="-0.253915"
					y="0.287719"
					width="1.22319"
					height="0.542831"
					rx="0.271415"
					transform="matrix(0.0625521 0.998042 -0.998074 0.0620286 9.45538 16.8827)"
					fill="white"
					stroke="white"
					stroke-width="0.542831"
				/>
			</svg>

			Save Changes
		</button>
	</div>
</div>
<!-- Expertise Dropdown -->
	<div class="relative">
	<label class="block text-sm font-medium text-[#171717] mb-1">
		Areas of Expertise/Speaking Topics<span class="inline-flex items-center text-[#335CFF]" aria-label="Info">
	<svg
		width="14"
		height="14"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<circle
			cx="12"
			cy="12"
			r="9"
			stroke="currentColor"
			stroke-width="2"
		/>
		<line
			x1="12"
			y1="10"
			x2="12"
			y2="16"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
		/>
		<circle
			cx="12"
			cy="7"
			r="1"
			fill="currentColor"
		/>
	</svg>
</span>

	</label>

	<!-- Input / Selected Chips -->
	<div
		class="min-h-[44px] w-full cursor-pointer rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 flex flex-wrap gap-2 items-center"
		onclick={toggleDropdown}
	>
		{#if selectedExpertise.length === 0}
			<span class="text-sm text-[#A3A3A3]">
				Select areas of expertise
			</span>
		{/if}

		{#each selectedExpertise as item}
			<span
  class="flex items-center gap-1 rounded-full bg-[#F5F6F7] px-3 py-1 text-xs text-[#171717]"
  onclick={(e) => e.stopPropagation()}
>
  <img src={item.icon} alt={item.label} class="h-4 w-4" />
        <span>{item.label}</span>

  <button
    type="button"
    class="ml-1 text-[#737373] hover:text-[#171717]"
    onclick={(e) => {
      e.stopPropagation();
      removeExpertise(item.label);
    }}
  >
    ✕
  </button>
</span>

		{/each}
	</div>

	<!-- Dropdown -->
	{#if isOpen}
    <div
      class="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-[#EBEBEB] bg-white shadow-md"
    >
      {#each expertiseOptions as option}
        <button
          type="button"
          class="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-[#F5F6F7]"
          onclick={() => selectExpertise(option)}
          disabled={selectedExpertise.some(e => e.label === option.label)}
        >
          <img src={option.icon} alt={option.label} class="h-5 w-5" />
          <span>{option.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<div class="mb-12 border-t pt-12">
	<!-- Emails Section -->
	<div class="mb-5">
		<div class="mb-2 flex items-center justify-between">
			<span>
				<h2 class="mb-1 text-lg font-semibold">Emails</h2>
				<p class="mb-4 text-sm text-[#8C8F93]">
					Add additional emails to receive events invites sent to those addresses.
				</p>
			</span>

			<button
				onclick={addEmail}
				class="flex items-center gap-1 rounded-md bg-[#EBECED] px-3 py-1 text-sm font-medium text-[#616265] transition-colors hover:bg-gray-200"
			>
				<Icon icon="mdi:plus" class="text-xl" />
				Add Email
			</button>
		</div>

		{#each emails as email, index}
			<div class="relative mb-2 rounded-md bg-[#FDFDFD] p-3 shadow-sm">
				{#if showChangeEmail}
					<button
						onclick={() => changeEmail(index)}
						class="absolute top-[-25px] right-0 flex items-center gap-1 rounded-md bg-[#FDFDFD] p-3 text-sm font-medium text-[#3E4041] shadow-sm transition-colors"
					>
						<svg
							width="18"
							height="18"
							viewBox="0 0 18 18"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M8.25 1.5H6.75C3 1.5 1.5 3 1.5 6.75V11.25C1.5 15 3 16.5 6.75 16.5H11.25C15 16.5 16.5 15 16.5 11.25V9.75"
								stroke="#A9AAAA"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M8.25 1.5H6.75C3 1.5 1.5 3 1.5 6.75V11.25C1.5 15 3 16.5 6.75 16.5H11.25C15 16.5 16.5 15 16.5 11.25V9.75"
								stroke="#A9AAAA"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M8.25 1.5H6.75C3 1.5 1.5 3 1.5 6.75V11.25C1.5 15 3 16.5 6.75 16.5H11.25C15 16.5 16.5 15 16.5 11.25V9.75"
								stroke="#A9AAAA"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M12.0324 2.26592L6.12235 8.17592C5.89735 8.40092 5.67235 8.84342 5.62735 9.16592L5.30485 11.4234C5.18485 12.2409 5.76235 12.8109 6.57985 12.6984L8.83735 12.3759C9.15235 12.3309 9.59485 12.1059 9.82735 11.8809L15.7374 5.97092C16.7574 4.95092 17.2374 3.76592 15.7374 2.26592C14.2374 0.765922 13.0524 1.24592 12.0324 2.26592Z"
								stroke="#A9AAAA"
								stroke-width="1.5"
								stroke-miterlimit="10"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M12.0324 2.26592L6.12235 8.17592C5.89735 8.40092 5.67235 8.84342 5.62735 9.16592L5.30485 11.4234C5.18485 12.2409 5.76235 12.8109 6.57985 12.6984L8.83735 12.3759C9.15235 12.3309 9.59485 12.1059 9.82735 11.8809L15.7374 5.97092C16.7574 4.95092 17.2374 3.76592 15.7374 2.26592C14.2374 0.765922 13.0524 1.24592 12.0324 2.26592Z"
								stroke="#A9AAAA"
								stroke-width="1.5"
								stroke-miterlimit="10"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M12.0324 2.26592L6.12235 8.17592C5.89735 8.40092 5.67235 8.84342 5.62735 9.16592L5.30485 11.4234C5.18485 12.2409 5.76235 12.8109 6.57985 12.6984L8.83735 12.3759C9.15235 12.3309 9.59485 12.1059 9.82735 11.8809L15.7374 5.97092C16.7574 4.95092 17.2374 3.76592 15.7374 2.26592C14.2374 0.765922 13.0524 1.24592 12.0324 2.26592Z"
								stroke="#A9AAAA"
								stroke-width="1.5"
								stroke-miterlimit="10"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M11.1836 3.10938C11.6861 4.90188 13.0886 6.30438 14.8886 6.81438"
								stroke="#A9AAAA"
								stroke-width="1.5"
								stroke-miterlimit="10"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M11.1836 3.10938C11.6861 4.90188 13.0886 6.30438 14.8886 6.81438"
								stroke="#A9AAAA"
								stroke-width="1.5"
								stroke-miterlimit="10"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M11.1836 3.10938C11.6861 4.90188 13.0886 6.30438 14.8886 6.81438"
								stroke="#A9AAAA"
								stroke-width="1.5"
								stroke-miterlimit="10"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>

						Change Email
					</button>
				{/if}
				<div class="relative flex items-center justify-between">
					<div>
						<span class="flex w-full items-center gap-2 rounded text-sm font-medium">
							{email.address}
							{#if email.isPrimary}
								<p class="w-fit rounded-md bg-[#EBECED] px-2 py-1 text-xs text-[#616265]">
									Primary
								</p>
							{/if}
						</span>
						<p class="mt-2 text-xs text-gray-500">
							This email will be shared with host when you register for their events.
						</p>
					</div>

					<button
						class="cursor-pointer"
						onclick={() => {
							showChangeEmail = !showChangeEmail;
						}}
					>
						<Icon icon="mdi:dots-horizontal" class="text-xl" />
					</button>
				</div>
			</div>
		{/each}
	</div>

	<!-- Phone Number Section -->
	<div>
		<h2 class="mb-1 text-lg font-semibold">Phone Number</h2>
		<p class="mb-4 text-sm text-[#8C8F93]">
			Manage the phone number you use to sign in to Rondwell and receive SMS updates.
		</p>

		<div>
			<label for="phoneNumber" class="mb-1 block text-sm font-medium text-[#84857A]"
				>Phone Number</label
			>
			<div class="mb-3 flex h-[42px] max-w-70 items-center gap-2">
				<input
					type="text"
					bind:value={phoneNumber}
					class="h-[42px] w-full rounded-[7.5px] bg-[#FFFFFF] px-3 py-2 shadow-sm focus:ring-0 focus:outline-none"
				/>
				<button
					onclick={updatePhoneNumber}
					class="h-full rounded-md bg-[#939596] px-3 py-2 font-medium text-white transition-colors hover:bg-gray-700"
				>
					Update
				</button>
			</div>
			<p class="mb-4 text-xs text-[#8C8F93]">
				For your security, we will send you a code to verify any change to your phone number.
			</p>
		</div>
	</div>
</div>
<!-- Social Links -->
	<div class="mt-6 text-[#84857A]">
		<h3 class="mb-3 text-sm font-medium text-[#84857A]">Social Links</h3>
		<div class="grid w-fit grid-cols-1 gap-6 md:grid-cols-2">
			{#each socialLinks as { key, icon, label, prefix }}
				<div class="flex items-center gap-2">
					<!-- Icon -->
					<div class="flex h-8 w-8 items-center justify-center rounded bg-gray-100">
						<Icon {icon} class="h-4 w-4" />
					</div>

					<div class="flex h-[42px] w-full items-center shadow-sm">
						<!-- Label (optional) -->
						{#if label}
							<div
								class="pointer-events-none flex h-full items-center rounded-tl-[7.5px] rounded-bl-[7.5px] bg-[#EBECED] p-3 text-xs text-[#84857A]"
							>
								{label}
							</div>
						{/if}

						<!-- Input -->
						<input
							type="text"
							bind:value={profile.socialLinks[key]}
							placeholder={prefix || 'username'}
							class="h-full w-full {key === 'website'
								? 'rounded-[7.5px]'
								: 'rounded-tr-[7.5px] rounded-br-[7.5px]'} bg-[#FFFFFF] px-3 py-2 focus:ring-0 focus:outline-none"
						/>
					</div>
				</div>
			{/each}
		</div>
	</div>
