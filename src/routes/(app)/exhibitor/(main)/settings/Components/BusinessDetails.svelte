<script lang="ts">
	import Icon from '@iconify/svelte';

	type SocialLinkKey = 'instagram' | 'x' | 'youtube' | 'tiktok' | 'linkedin' | 'website';

	interface Profile {
		name: string;
		industry: string;
		description: string;
		profilePicture: string;
		socialLinks: Record<SocialLinkKey, string>;
	}

	// Mock data for the settings page
	let profile: Profile = {
		name: 'Magaexe Limited',
		industry: 'Venue Rental',
		description: '',
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
    const updateWebsite = (url: string) => {}
</script>

<!-- Your Profile Section -->
<div class="mb-12">
	<h2 class="mb-1 text-2xl font-medium">Business Details</h2>
	<p class="mb-4 text-sm text-[#8C8F93]">Update your company information visble on your public <br> profile and application</p>

	<div class="flex w-full flex-col-reverse gap-6 md:flex-row md:gap-12">
		<!-- Left Column - Text Fields -->
		<div class="w-full mt-2 max-w-[350px] space-y-4 text-[#84857A]">
			<!-- Name -->
			<div>
				<label for="exhibitor/companyname" class="mb-1 block text-sm font-medium">Exhibitor/Company Name</label>
				<input
					type="text"
					bind:value={profile.name}
					class="h-[42px] w-full rounded-[7.5px] bg-[#FFFFFF] px-3 py-2 shadow-sm focus:ring-0 focus:outline-none"
				/>
			</div>

			<!-- Username -->
			<div>
				<label for="industry/category" class="mb-1 mt-3 block text-sm font-medium">Industry/Category</label>
				<div class="flex h-[42px] items-center shadow-sm">
					<input
						type="text"
						bind:value={profile.industry}
						class="h-[42px] w-full rounded-[7.5px] bg-[#FFFFFF] px-3 py-2 shadow-sm focus:ring-0 focus:outline-none"
					/>
				</div>
			</div>

			<!-- Bio -->
			<div>
				<label for="bio" class="mb-1 block text-sm font-medium">Company Description</label>
				<textarea
					rows="3"
					bind:value={profile.description}
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

	
</div>

<div class="mb-12 border-t pt-5">
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
    <!-- website Section -->
	<div>
		<h2 class="mb-1 text-lg font-semibold">Social Links</h2>
		<div>
			<div class="mb-3 flex h-[42px] max-w-70 items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="#A3A5A5" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M6.00313 2.25H6.75313C5.29063 6.63 5.29063 11.37 6.75313 15.75H6.00313" stroke="#A3A5A5" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M11.25 2.25C12.7125 6.63 12.7125 11.37 11.25 15.75" stroke="#A3A5A5" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2.25 12V11.25C6.63 12.7125 11.37 12.7125 15.75 11.25V12" stroke="#A3A5A5" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2.25 6.75313C6.63 5.29063 11.37 5.29063 15.75 6.75313" stroke="#A3A5A5" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>

				<input
					type="text"
					bind:value={profile.socialLinks.website}
                    placeholder="Your website"
					class="h-[42px] w-full rounded-[7.5px] bg-[#FFFFFF] px-3 py-2 shadow-sm focus:ring-0 focus:outline-none"
				/>
				
			</div>
			
		</div>
	</div>
</div>




    
 <!-- Save Changes Button -->
  <div class="flex gap-4 mt-2">
        <button
            on:click={saveChanges}
            class="flex items-center gap-2 rounded-md bg-[#00000080] px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800"
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

            discard Changes
        </button>
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

            save Changes
        </button>
    </div>


