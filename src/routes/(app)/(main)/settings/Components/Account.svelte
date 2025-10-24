<script lang="ts">
	import Icon from '@iconify/svelte';

	type SocialLinkKey = 'instagram' | 'x' | 'youtube' | 'tiktok' | 'linkedin' | 'website';

	interface Profile {
		name: string;
		username: string;
		bio: string;
		profilePicture: string;
		socialLinks: Record<SocialLinkKey, string>;
	}

	// Mock data for the settings page
	let profile: Profile = {
		name: 'JOHN HOUSEMAN',
		username: '',
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
</script>

<!-- Your Profile Section -->
<div class="mb-12">
	<h2 class="mb-1 text-2xl font-medium">Your Profile</h2>
	<p class="mb-4 text-sm text-[#8C8F93]">Choose how you are displayed as a host or guest.</p>

	<div class="flex w-full flex-col-reverse gap-6 md:flex-row md:gap-12">
		<!-- Left Column - Text Fields -->
		<div class="w-full max-w-[350px] space-y-4 text-[#84857A]">
			<!-- Name -->
			<div>
				<label for="name" class="mb-1 block text-sm font-medium">Name</label>
				<input
					type="text"
					bind:value={profile.name}
					class="h-[42px] w-full rounded-[7.5px] bg-[#FFFFFF] px-3 py-2 shadow-sm focus:ring-0 focus:outline-none"
				/>
			</div>

			<!-- Username -->
			<div>
				<label for="username" class="mb-1 block text-sm font-medium">Username</label>
				<div class="flex h-[42px] items-center shadow-sm">
					<div
						class="pointer-events-none flex h-full items-center rounded-tl-[7.5px] rounded-bl-[7.5px] bg-[#EBECED] p-3"
					>
						<svg
							width="18"
							height="18"
							viewBox="0 0 18 18"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M9 9C11.0711 9 12.75 7.32107 12.75 5.25C12.75 3.17893 11.0711 1.5 9 1.5C6.92893 1.5 5.25 3.17893 5.25 5.25C5.25 7.32107 6.92893 9 9 9Z"
								stroke="#616265"
								stroke-width="1.125"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M2.55859 16.5C2.55859 13.5975 5.44611 11.25 9.00111 11.25"
								stroke="#616265"
								stroke-width="1.125"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M13.65 16.05C14.9755 16.05 16.05 14.9755 16.05 13.65C16.05 12.3245 14.9755 11.25 13.65 11.25C12.3245 11.25 11.25 12.3245 11.25 13.65C11.25 14.9755 12.3245 16.05 13.65 16.05Z"
								stroke="#616265"
								stroke-width="1.125"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M16.5 16.5L15.75 15.75"
								stroke="#616265"
								stroke-width="1.125"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
					<input
						type="text"
						bind:value={profile.username}
						class="h-full w-full rounded-tr-[7.5px] rounded-br-[7.5px] bg-[#FFFFFF] px-3 py-2 focus:ring-0 focus:outline-none"
					/>
				</div>
			</div>

			<!-- Bio -->
			<div>
				<label for="bio" class="mb-1 block text-sm font-medium">Bio</label>
				<textarea
					rows="3"
					bind:value={profile.bio}
					placeholder="Share a little about your background and interests."
					class="w-full resize-none rounded-[7.5px] bg-[#FFFFFF] px-3 py-2 shadow-sm focus:ring-0 focus:outline-none"
				></textarea>
			</div>
		</div>

		<!-- Right Column - Profile Picture -->
		<div>
			<label for="profilePicture" class="mb-2 block text-sm font-medium text-[#84857A]"
				>Profile Picture</label
			>
			<div class="relative h-30 w-30">
				<img
					src={profile.profilePicture}
					alt="Profile"
					class="h-full w-full rounded-full object-cover"
				/>
				<div class="absolute right-0 bottom-0 cursor-pointer">
					<svg
						width="31"
						height="32"
						viewBox="0 0 31 32"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M28.6875 13.0528H24.0816C20.3044 13.0528 17.2284 9.97687 17.2284 6.19969V1.59375C17.2284 0.717187 16.5113 0 15.6347 0H8.87719C3.96844 0 0 3.1875 0 8.87719V22.9978C0 28.6875 3.96844 31.875 8.87719 31.875H21.4041C26.3128 31.875 30.2812 28.6875 30.2812 22.9978V14.6466C30.2812 13.77 29.5641 13.0528 28.6875 13.0528ZM14.3916 18.3759C14.1525 18.615 13.8497 18.7266 13.5469 18.7266C13.2441 18.7266 12.9413 18.615 12.7022 18.3759L11.5547 17.2284V23.9062C11.5547 24.5597 11.0128 25.1016 10.3594 25.1016C9.70594 25.1016 9.16406 24.5597 9.16406 23.9062V17.2284L8.01656 18.3759C7.55438 18.8381 6.78937 18.8381 6.32719 18.3759C5.865 17.9137 5.865 17.1488 6.32719 16.6866L9.51469 13.4991C9.62625 13.4034 9.73781 13.3237 9.86531 13.26C9.89719 13.2441 9.945 13.2281 9.97688 13.2122C10.0725 13.1803 10.1681 13.1644 10.2797 13.1484C10.3275 13.1484 10.3594 13.1484 10.4072 13.1484C10.5347 13.1484 10.6622 13.1803 10.7897 13.2281C10.8056 13.2281 10.8056 13.2281 10.8216 13.2281C10.9491 13.2759 11.0766 13.3716 11.1722 13.4672C11.1881 13.4831 11.2041 13.4831 11.2041 13.4991L14.3916 16.6866C14.8537 17.1488 14.8537 17.9137 14.3916 18.3759Z"
							fill="#292D32"
						/>
						<path
							d="M23.7969 10.8527C25.3109 10.8687 27.4147 10.8687 29.2156 10.8687C30.1241 10.8687 30.6022 9.80086 29.9647 9.16336C27.6697 6.85243 23.5578 2.69274 21.1991 0.33399C20.5456 -0.319448 19.4141 0.126802 19.4141 1.03524V6.59743C19.4141 8.9243 21.3903 10.8527 23.7969 10.8527Z"
							fill="#292D32"
						/>
					</svg>
				</div>
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

	<!-- Save Changes Button -->
	<div class="mt-6">
		<button
			on:click={saveChanges}
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
				on:click={addEmail}
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
						on:click={() => changeEmail(index)}
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
						on:click={() => {
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
					on:click={updatePhoneNumber}
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

<div class="mb-12 border-t pt-12">
	<!-- Page Header -->
	<h1 class="mb-1 text-xl font-bold">Password & Security</h1>
	<p class="mb-4 text-sm text-[#8C8F93]">
		Secure your account with password and two-factor authentication.
	</p>

	<!-- Account Security Section -->
	<div>
		<!-- Account Password -->
		<div class="mb-4 rounded-lg bg-[#FDFDFD] p-4">
			<div class="flex flex-col items-start justify-between gap-3 md:flex-row">
				<div class="flex items-start gap-3">
					<svg
						width="18"
						height="18"
						viewBox="0 0 18 18"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M4.5 7.5V6C4.5 3.5175 5.25 1.5 9 1.5C12.75 1.5 13.5 3.5175 13.5 6V7.5"
							stroke="#A3A5A5"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M7.125 12C7.125 13.035 7.965 13.875 9 13.875C10.035 13.875 10.875 13.035 10.875 12C10.875 10.965 10.035 10.125 9 10.125"
							stroke="#A3A5A5"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M16.5 12.75V11.25C16.5 8.25 15.75 7.5 12.75 7.5H5.25C2.25 7.5 1.5 8.25 1.5 11.25V12.75C1.5 15.75 2.25 16.5 5.25 16.5H12.75C14.07 16.5 14.955 16.3575 15.5325 15.9375"
							stroke="#A3A5A5"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>

					<div>
						<h3 class="font-medium">Account Password</h3>
						<p class="mt-1 text-xs text-gray-500">
							Please follow the instructions in the email to finish setting your password.
						</p>
					</div>
				</div>
				<button
					on:click={setAccountPassword}
					class="rounded bg-black px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-gray-800"
				>
					Set Password
				</button>
			</div>
		</div>

		<!-- Two-Factor Authentication -->
		<div class="mb-4 rounded-lg bg-[#FDFDFD] p-4">
			<div class="flex flex-col items-start justify-between gap-3 md:flex-row">
				<div class="flex items-start gap-3">
					<svg
						width="18"
						height="18"
						viewBox="0 0 18 18"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M6.78906 8.90031L7.99656 10.1078L11.2216 6.88281"
							stroke="#A3A5A5"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M15.4436 4.59187C15.4436 3.66937 14.7386 2.64937 13.8761 2.32687L10.1336 0.924375C9.51109 0.691875 8.49109 0.691875 7.86859 0.924375L4.12609 2.33438C3.26359 2.65688 2.55859 3.67687 2.55859 4.59187V10.1644C2.55859 11.0494 3.14359 12.2119 3.85609 12.7444L7.08109 15.1519C8.13859 15.9469 9.87859 15.9469 10.9361 15.1519L14.1611 12.7444C14.8736 12.2119 15.4586 11.0494 15.4586 10.1644V7.52437"
							stroke="#A3A5A5"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>

					<div>
						<h3 class="font-medium">Two-Factor Authentication</h3>
						<p class="mt-1 text-xs text-gray-500">
							Please set a password before enabling two-factor authentication.
						</p>
					</div>
				</div>
				<button
					on:click={enableTwoFactorAuth}
					class="rounded bg-[#939596] px-3 py-1 text-sm font-medium text-white transition-colors"
				>
					Enable 2FA
				</button>
			</div>
		</div>

		<!-- Passkey -->
		<div class="rounded-lg bg-[#FDFDFD] p-4">
			<div class="flex flex-col items-start justify-between gap-3 md:flex-row">
				<div class="flex items-start gap-3">
					<svg
						width="18"
						height="18"
						viewBox="0 0 18 18"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							fill-rule="evenodd"
							clip-rule="evenodd"
							d="M9.00259 5.4375C7.8635 5.4375 6.94009 6.36091 6.94009 7.5C6.94009 8.44408 7.5744 9.24001 8.44009 9.48486V12C8.44009 12.3107 8.69193 12.5625 9.00259 12.5625C9.31325 12.5625 9.56509 12.3107 9.56509 12V9.48486C10.4308 9.24001 11.0651 8.44408 11.0651 7.5C11.0651 6.36091 10.1417 5.4375 9.00259 5.4375ZM8.06509 7.5C8.06509 6.98223 8.48482 6.5625 9.00259 6.5625C9.52035 6.5625 9.94009 6.98223 9.94009 7.5C9.94009 8.01777 9.52035 8.4375 9.00259 8.4375C8.48482 8.4375 8.06509 8.01777 8.06509 7.5Z"
							fill="#A3A5A5"
						/>
						<path
							fill-rule="evenodd"
							clip-rule="evenodd"
							d="M7.17481 0.9375C6.01847 0.9375 5.08106 1.8749 5.08106 3.03125C5.08106 3.56628 4.64734 4 4.11231 4H3.88067C2.69862 4 1.64569 4.91454 1.70982 6.18486C1.78596 7.69312 2.12095 10.0439 3.34281 12.2706C3.68503 12.8943 4.14208 13.5069 4.63615 14.0777L4.67335 14.1207C5.3841 14.942 5.97672 15.6267 6.61382 16.0934C7.29908 16.5955 8.03047 16.8455 9.00269 16.8455C9.97491 16.8455 10.7063 16.5955 11.3916 16.0934C12.0287 15.6267 12.6213 14.942 13.332 14.1207L13.3692 14.0777C13.8633 13.5069 14.3204 12.8943 14.6626 12.2706C15.9251 9.96983 16.2399 7.37 16.302 5.74921C16.3504 4.48499 15.305 3.5625 14.1163 3.5625H13.6743C13.2601 3.5625 12.9243 3.22671 12.9243 2.8125C12.9243 1.77697 12.0849 0.9375 11.0493 0.9375H7.17481ZM6.20606 3.03125C6.20606 2.49622 6.63979 2.0625 7.17481 2.0625H11.0493C11.4635 2.0625 11.7993 2.39829 11.7993 2.8125C11.7993 3.84803 12.6388 4.6875 13.6743 4.6875H14.1163C14.7446 4.6875 15.1989 5.15483 15.1778 5.70614C15.1185 7.2547 14.8165 9.65148 13.6763 11.7294C13.3846 12.261 12.9807 12.8076 12.5186 13.3415C11.761 14.2168 11.2495 14.803 10.7267 15.1859C10.2411 15.5417 9.7443 15.7205 9.00269 15.7205C8.26109 15.7205 7.76433 15.5417 7.27867 15.1859C6.75593 14.803 6.24437 14.2168 5.48678 13.3415C5.02472 12.8076 4.62079 12.261 4.32909 11.7294C3.22022 9.7086 2.90497 7.54619 2.83339 6.12814C2.80615 5.58862 3.25056 5.125 3.88067 5.125H4.11231C5.26866 5.125 6.20606 4.1876 6.20606 3.03125Z"
							fill="#A3A5A5"
						/>
					</svg>

					<div>
						<h3 class="font-medium">Passkey</h3>
						<p class="mt-1 text-xs text-gray-500">
							Please set a passkey as a second step when signing in with your password.
						</p>
					</div>
				</div>
				<button
					on:click={addPasskey}
					class="rounded bg-[#939596] px-3 py-1 text-sm font-medium text-white transition-colors"
				>
					Add Passkey
				</button>
			</div>
		</div>
	</div>
</div>

<div class="mb-12 border-t pt-12">
	<!-- Third Party Accounts Section -->
	<div class="mb-8">
		<h2 class="mb-1 text-lg font-semibold">Third Party Accounts</h2>
		<p class="mb-4 text-sm text-[#8C8F93]">
			Link your accounts to sign in to Rondwell and automate your workflow.
		</p>

		<div class="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
			{#each thirdPartyAccounts as account}
				<div class="flex items-center justify-between rounded-lg bg-[#FDFDFD] p-3">
					<div class="flex items-center gap-2">
						<img src={account.icon} alt={account.name} class="rounded" />
						<div>
							<div class="font-medium">{account.name}</div>
							<div class="mt-1 text-xs text-gray-400">{account.status}</div>
						</div>
					</div>
					<button
						aria-label="link-acount"
						on:click={() => linkAccount(account.name)}
						class="rounded bg-black p-1 text-sm font-medium text-white transition-colors"
					>
						<Icon icon="mdi:plus" class="text-xl" />
					</button>
				</div>
			{/each}
		</div>
	</div>

	<!-- Account Syncing Section -->
	<div class="">
		<h2 class="mb-1 text-lg font-semibold">Account Syncing</h2>

		<div class="mb-4 rounded-lg bg-[#FDFDFD] p-6">
			<!-- Calendar Syncing -->
			<div class="flex flex-col items-start justify-between gap-3 pb-4 md:flex-row">
				<div class="flex items-start gap-3">
					<svg
						width="26"
						height="26"
						viewBox="0 0 26 26"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M9.53876 4.71392C15.5844 5.55796 19.9535 10.0281 20.6647 16.0965L20.6701 16.1732C20.679 16.5528 20.3968 16.8792 20.0096 16.924L20.0096 16.9254C19.769 16.959 19.5372 16.8624 19.385 16.7069C19.2731 16.5925 19.1973 16.4419 19.178 16.266L19.1773 16.2667C18.5494 10.892 14.6882 6.94203 9.3347 6.19703L9.33332 6.19701C8.92788 6.13637 8.64204 5.76287 8.69442 5.35896C8.74205 4.94526 9.12811 4.65259 9.53876 4.71392Z"
							fill="#A3A5A5"
							stroke="#A3A5A5"
							stroke-width="0.375"
						/>
						<path
							d="M9.12195 9.98911C12.4366 10.4514 14.8359 12.9061 15.2225 16.2304L15.2218 16.2297C15.2732 16.6423 14.977 17.0136 14.5611 17.0584L14.5612 17.0571C14.3249 17.0883 14.0999 17.0001 13.9469 16.8436C13.8352 16.7292 13.7599 16.579 13.7406 16.4034L13.7399 16.4041C13.436 13.7754 11.5461 11.8413 8.91928 11.4722L8.9179 11.4722C8.51131 11.4114 8.22389 11.0359 8.27835 10.6307L8.27906 10.6286C8.33986 10.2222 8.7155 9.93487 9.12057 9.98909L9.12195 9.98911Z"
							fill="#A3A5A5"
							stroke="#A3A5A5"
							stroke-width="0.375"
						/>
						<path
							d="M7.62392 14.3302C9.4551 14.5845 10.7791 15.9379 10.9927 17.7739C11.0449 18.1872 10.7478 18.5601 10.3313 18.6047L10.3313 18.6033C10.1071 18.6341 9.8767 18.5532 9.71773 18.3905C9.60574 18.2759 9.52917 18.1251 9.51007 17.949L9.51076 17.9483C9.38007 16.8076 8.56031 15.9695 7.42263 15.8134L7.41987 15.8133C7.01341 15.7524 6.72656 15.3763 6.78102 14.9711L6.78173 14.9691C6.84253 14.5626 7.2181 14.2752 7.62324 14.3295L7.62392 14.3302Z"
							fill="#A3A5A5"
							stroke="#A3A5A5"
							stroke-width="0.375"
						/>
					</svg>

					<div>
						<h3 class="font-medium">Calendar Syncing</h3>
						<p class="mt-1 text-xs text-gray-500">
							Sync all of your events with your Google, Apple, or Outlook calendar.
						</p>
					</div>
				</div>
				<button
					on:click={enableCalendarSyncing}
					class="rounded-md bg-[#F4F4F4] px-3 py-2 text-xs font-medium text-[#939596] transition-colors"
				>
					Add iCal Subscription
				</button>
			</div>

			<!-- Sync Contacts with Google -->
			<div class="flex flex-col items-start justify-between gap-3 border-t pt-4 md:flex-row">
				<div class="flex items-start gap-3">
					<svg
						width="20"
						height="20"
						viewBox="0 0 20 20"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M17.6653 8.99438C17.6247 8.58001 17.2753 8.27124 16.8609 8.27124H10.7266C10.2797 8.27124 9.91406 8.63687 9.91406 9.08374V10.4731C9.91406 10.92 10.2797 11.2856 10.7266 11.2856H14.3909C14.3016 12.0331 13.8141 13.1625 12.7334 13.9181C12.0428 14.3975 11.1247 14.7306 9.91406 14.7306C9.85719 14.7306 9.80844 14.7306 9.75157 14.7225C7.67969 14.6575 5.92469 13.2681 5.29094 11.3588C5.12032 10.8469 5.02282 10.3106 5.02282 9.75C5.02282 9.18937 5.12032 8.64499 5.28282 8.14124C5.33157 7.99499 5.38844 7.84876 5.45344 7.70251C6.20094 6.02063 7.83407 4.83438 9.75157 4.7775C9.80032 4.76938 9.85719 4.76937 9.91406 4.76937C11.0759 4.76937 11.9453 5.15124 12.5547 5.57374C12.8716 5.79311 13.2941 5.74437 13.5703 5.47624L14.6997 4.37125C15.0572 4.02188 15.0247 3.42874 14.6184 3.13624C13.3266 2.18561 11.7503 1.625 9.91406 1.625C9.85719 1.625 9.80844 1.62501 9.75157 1.63313C6.63969 1.69001 3.96656 3.49376 2.65844 6.10188C2.10594 7.20688 1.78906 8.44187 1.78906 9.75C1.78906 11.0581 2.10594 12.2931 2.65844 13.3981H2.66656C3.97469 16.0062 6.64782 17.81 9.75157 17.8669C9.80844 17.875 9.85719 17.875 9.91406 17.875C12.1078 17.875 13.9522 17.1519 15.2928 15.9087C16.8284 14.4869 17.7141 12.4069 17.7141 9.92875C17.7141 9.57938 17.6978 9.27876 17.6653 8.99438Z"
							fill="#A3A5A5"
						/>
					</svg>

					<div>
						<h3 class="font-medium">Sync Contacts with Google</h3>
						<p class="mt-1 text-xs font-light text-gray-500">
							Sync your Gmail contacts to easily invite them to your events.
						</p>
					</div>
				</div>
				<button
					on:click={enableSyncContacts}
					class="rounded-md bg-black px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-800"
				>
					Enable Syncing
				</button>
			</div>
		</div>
	</div>
</div>

<div class="border-t pt-12">
	<!-- Active Devices Section -->
	<div class="mb-8">
		<h2 class="mb-1 text-lg font-semibold">Active Devices</h2>
		<p class="mb-4 text-sm text-[#8C8F93]">
			See the list of devices you are currently signed into Rondwell from.
		</p>

		{#each activeDevices as device}
			<div class="mb-3 rounded-lg bg-[#FDFDFD] p-4">
				<div class="flex items-center gap-3">
					<svg
						width="18"
						height="18"
						viewBox="0 0 18 18"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M4.83 1.5H13.1625C15.8325 1.5 16.5 2.1675 16.5 4.83V9.5775C16.5 12.2475 15.8325 12.9075 13.17 12.9075H4.83C2.1675 12.915 1.5 12.2475 1.5 9.585V4.83C1.5 2.1675 2.1675 1.5 4.83 1.5Z"
							stroke="#A3A5A5"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M9 12.9141V16.4991"
							stroke="#A3A5A5"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M5.625 16.5H12.375"
							stroke="#A3A5A5"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>

					<div>
						<div class="flex items-center gap-2">
							<span class="font-medium">{device.browser}</span>
							{#if device.isCurrent}
								<span class="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-600"
									>This Device</span
								>
							{/if}
						</div>
						<div class="mt-1 text-sm font-light text-gray-500">
							{device.location} | {device.date}
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Delete Account Section -->
	<div>
		<h2 class="mb-1 text-lg font-semibold">Delete Account</h2>
		<p class="mb-4 text-sm text-[#8C8F93]">
			If you no longer wish to use Rondwell, you can permanently delete your account.
		</p>

		<button
			on:click={deleteAccount}
			class="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
		>
			<svg
				width="18"
				height="18"
				viewBox="0 0 18 18"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M9 6.75V10.5"
					stroke="white"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M8.99958 16.0584H4.45458C1.85208 16.0584 0.764583 14.1984 2.02458 11.9259L4.36458 7.71094L6.56958 3.75094C7.90458 1.34344 10.0946 1.34344 11.4296 3.75094L13.6346 7.71844L15.9746 11.9334C17.2346 14.2059 16.1396 16.0659 13.5446 16.0659H8.99958V16.0584Z"
					stroke="white"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M8.99609 12.75H9.00283"
					stroke="white"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>

			Delete Account
		</button>
	</div>
</div>
