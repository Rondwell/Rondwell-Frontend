<!-- src/routes/settings/preferences/+page.svelte -->
<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';
	import { onMount } from 'svelte';

	let selectedTheme = 'light';

	const themes = [
		{
			key: 'system',
			label: 'System',
			img: '/system-theme.png'
		},
		{
			key: 'light',
			label: 'Light',
			img: '/light-theme.png'
		},
		{
			key: 'dark',
			label: 'Dark',
			img: '/dark-theme.png'
		}
	];

	function applyTheme(theme: any) {
		const html = document.documentElement;

		if (theme === 'light') {
			html.classList.remove('dark');
		} else if (theme === 'dark') {
			html.classList.add('dark');
		} else {
			// system: follow OS preference
			if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
				html.classList.add('dark');
			} else {
				html.classList.remove('dark');
			}
		}
	}

	function selectTheme(theme: any) {
		selectedTheme = theme;
		localStorage.setItem('theme', theme);
		applyTheme(theme);
	}

	onMount(() => {
		const savedTheme = localStorage.getItem('theme') || 'system';
		selectedTheme = savedTheme;
		applyTheme(savedTheme);

		// react to system theme changes
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
			if (selectedTheme === 'system') applyTheme('system');
		});
	});

	// Mock data for notification settings
	type NotificationSettings = {
		emailReminders: boolean;
		smsReminders: boolean;
		newSessions: boolean;
		eventMarketing: boolean;
		feedbackRequests: boolean;
		feedbackResponses: boolean;
		newGuestRegistered: boolean;
		newSubscriber: boolean;
		eventSubmission: boolean;
		marketingEmails: boolean;
	};

	let notificationSettings: NotificationSettings = {
		emailReminders: true,
		smsReminders: true,
		newSessions: true,
		eventMarketing: true,
		feedbackRequests: true,
		feedbackResponses: true,
		newGuestRegistered: true,
		newSubscriber: true,
		eventSubmission: true,
		marketingEmails: true
	};

	const notificationGroups: {
		title: string;
		items: { key: keyof NotificationSettings; label: string }[];
	}[] = [
		{
			title: 'Events You Attend',
			items: [
				{ key: 'emailReminders', label: 'Email Reminders' },
				{ key: 'smsReminders', label: 'SMS Reminders' },
				{ key: 'newSessions', label: 'New Sessions' },
				{ key: 'eventMarketing', label: 'Event Marketing' },
				{ key: 'feedbackRequests', label: 'Feedback Request' }
			]
		},
		{
			title: 'Events You Host',
			items: [
				{ key: 'feedbackResponses', label: 'Feedback Responses' },
				{ key: 'newGuestRegistered', label: 'New Guest Registered' }
			]
		},
		{
			title: 'Collection You Manage',
			items: [
				{ key: 'newSubscriber', label: 'New Subscriber' },
				{ key: 'eventSubmission', label: 'Event Submission' }
			]
		},
		{
			title: 'Rondwell',
			items: [{ key: 'marketingEmails', label: 'Marketing Emails' }]
		}
	];

	function toggleNotification(key: keyof NotificationSettings) {
		notificationSettings[key] = !notificationSettings[key];
	}

	// Mock data for individual event/collection notifications
	let individualNotifications = [
		{ name: 'Anchor', type: 'event', enabled: false },
		{ name: 'Cynthia Orji', type: 'collection', enabled: true },
		{ name: 'Dan Oslon', type: 'collection', enabled: false },
		{ name: 'Fileean Orbit Community', type: 'collection', enabled: true },
		{ name: 'Anchor', type: 'event', enabled: false },
		{ name: 'Anchor', type: 'event', enabled: false },
		{ name: 'Anchor', type: 'event', enabled: false },
		{ name: 'Anchor', type: 'event', enabled: false },
		{ name: 'Anchor', type: 'event', enabled: false },
		{ name: 'Anchor', type: 'event', enabled: false },
		{ name: 'Anchor', type: 'event', enabled: false }
	];

	// Function to toggle individual notifications
	const toggleIndividualNotification = (index: any) => {
		individualNotifications[index].enabled = !individualNotifications[index].enabled;
		console.log(
			'Toggled individual notification:',
			individualNotifications[index].name,
			'to',
			individualNotifications[index].enabled
		);
	};

	let open = false;
	let options = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'];
	let language = options[0];

	function selectOption(option: string) {
		language = option;
		open = false;
	}
</script>

<div class="mb-12">
	<!-- Page Header -->
	<h1 class="mb-1 text-2xl font-medium">Display Theme</h1>
	<p class="mb-4 text-sm text-[#8C8F93]">Choose your desired Rondwell interface.</p>

	<!-- Theme Selection -->
	<div class="mb-4 flex flex-col gap-4 md:flex-row">
		{#each themes as theme}
			<button
				class="w-fit flex-1 cursor-pointer rounded-lg"
				on:click={() => selectTheme(theme.key)}
			>
				<img src={theme.img} alt={theme.label} />

				<div
					class="flex h-[48px] items-center justify-between rounded-md bg-[#FFFFFF] px-3 py-2 text-[#464749]"
				>
					<div class="font-medium">{theme.label}</div>

					{#if selectedTheme === theme.key}
						<div class="flex h-7 w-7 items-center justify-center rounded-full bg-black">
							<svg
								width="12"
								height="9"
								viewBox="0 0 12 9"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M4.21325 9.00023C3.85468 9.00023 3.4961 8.83267 3.22717 8.56936L0.403397 5.55333C-0.134466 4.97885 -0.134466 4.02138 0.403397 3.4469C0.941259 2.87241 1.8377 2.87241 2.37556 3.4469L4.21325 5.40971L8.87472 0.430862C9.41259 -0.143621 10.309 -0.143621 10.8469 0.430862C11.3847 1.00534 11.3847 1.96281 10.8469 2.5373L5.19933 8.56936C4.9304 8.8566 4.57183 9.00023 4.21325 9.00023Z"
									fill="white"
								/>
							</svg>
						</div>
					{/if}
				</div>
			</button>
		{/each}
	</div>

	<!-- Language Selection -->
	<div class="mt-6">
		<label for="language" class="mb-2 block text-sm font-medium text-[#8C8F93]">Language</label>
		<div class="relative inline-block text-left">
			<!-- Trigger button -->
			<button
				on:click={() => (open = !open)}
				class="flex w-[282.01px] items-center gap-2 rounded-sm bg-[#FFFFFF] px-3 py-2 text-sm font-medium text-[#616265]"
			>
				<span>{language}</span>
				<img src="/arrow-down.svg" alt="arrow" class="ml-auto h-2 w-3" />
			</button>

			<!-- Dropdown -->
			{#if open}
				<div
					class="absolute left-0 z-10 mt-1 flex w-full flex-col items-start rounded-sm bg-[#FFFFFF] shadow-lg"
					use:clickOutside={() => {
						open = false;
					}}
				>
					{#each options as option}
						<button
							class="w-full cursor-pointer px-3 py-2 text-start text-sm text-gray-700 hover:bg-gray-100"
							on:click={() => selectOption(option)}
						>
							{option}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Notifications & Reminders Section -->
<div class="mb-12 border-t pt-12">
	<h2 class="mb-1 text-lg font-semibold">Notifications & Reminders</h2>
	<p class="mb-4 text-sm text-[#8C8F93]">
		These options apply to all events, Collection, secrets you are part of.
	</p>

	<div class="space-y-4 rounded-lg bg-[#FDFDFD] p-4">
		{#each notificationGroups as group}
			<div>
				<h3 class="mb-2 text-xs font-light text-[#B3B4B4]">{group.title}</h3>
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
					{#each group.items as item}
						<div class="flex items-center">
							<input
								type="checkbox"
								checked={notificationSettings[item.key]}
								on:change={() => toggleNotification(item.key)}
								class="h-[22px] w-[22px] rounded border-gray-300 accent-black focus:ring-0"
							/>
							<label for={item.key} class="ml-2 text-sm">{item.label}</label>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- Individual Notifications Section -->
<div class="border-t pt-12">
	<h2 class="mb-1 text-lg font-semibold">Notifications & Reminders</h2>
	<p class="mb-4 text-sm text-[#8C8F93]">
		These options apply to all events, Collection, secrets you are part of.
	</p>

	<div class="rounded-lg bg-[#FDFDFD] p-4">
		{#each individualNotifications as notification, index}
			<div class="flex items-center justify-between border-b border-gray-100 py-3 last:border-b-0">
				<div class="flex items-center gap-3">
					{#if notification.type === 'event'}
						<img src="/face.svg" alt="icon" class="h-6 w-6" />
					{:else}
						<img src="/face-1.svg" alt="icon" class="h-6 w-6" />
					{/if}
					<span class="font-medium">{notification.name}</span>
				</div>

				<button
					aria-label="save"
					on:click={() => toggleIndividualNotification(index)}
					class={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-0 focus:ring-offset-0 focus:outline-none ${notification.enabled ? 'bg-black' : 'bg-gray-200'}`}
				>
					<span
						class={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notification.enabled ? 'translate-x-5' : 'translate-x-0'}`}
					></span>
				</button>
			</div>
		{/each}
	</div>
</div>
