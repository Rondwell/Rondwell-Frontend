<script lang="ts">
	import { onMount } from 'svelte';

	type Category = 'email' | 'inApp' | 'sms';

	type NotificationPrefs = {
		email: Record<string, boolean>;
		inApp: Record<string, boolean>;
		sms: Record<string, boolean>;
	};

	type NotificationTypes = {
		email: string[];
		inApp: string[];
		sms: string[];
	};

	let saving = false;
	let saveSuccess = false;

	let notificationPrefs: NotificationPrefs = {
		email: {
			'New Speaker Invitation': true,
			'Application Status Update': true,
			'New Message from Organizer': true,
			'Engagement Confirmation': false,
			'Payment Status Update': true
		},
		inApp: {
			'New Speaker Invitation': true,
			'Application Status Update': true,
			'New Message from Organizer': false,
			'Engagement Confirmation': true,
			'Payment Status Update': false
		},
		sms: {
			'New Speaker Invitation': false,
			'Engagement Confirmation (Critical)': true
		}
	};

	const notificationTypes: NotificationTypes = {
		email: [
			'New Speaker Invitation',
			'Application Status Update',
			'New Message from Organizer',
			'Engagement Confirmation',
			'Payment Status Update'
		],
		inApp: [
			'New Speaker Invitation',
			'Application Status Update',
			'New Message from Organizer',
			'Engagement Confirmation',
			'Payment Status Update'
		],
		sms: [
			'New Speaker Invitation',
			'Engagement Confirmation (Critical)'
		]
	};

	const notificationSubtext: Record<string, string> = {
		'New Speaker Invitation': 'Receive notifications when organizers invite you to speak.',
		'Application Status Update': 'Get updates when your applications are reviewed.',
		'New Message from Organizer': 'Receive messages from event organizers.',
		'Engagement Confirmation': 'Get notified when engagements are confirmed.',
		'Payment Status Update': 'Receive updates on payment processing.',
		'Engagement Confirmation (Critical)': 'Critical engagement confirmations via SMS.'
	};

	let smsConsent = false;

	onMount(() => {
		const saved = localStorage.getItem('speakerNotificationPreferences');
		if (saved) {
			try {
				notificationPrefs = JSON.parse(saved);
			} catch {
				// use defaults
			}
			smsConsent = localStorage.getItem('speakerSmsConsent') === 'true';
		}
	});

	function handleCheckboxChange(category: Category, type: string) {
		notificationPrefs[category][type] = !notificationPrefs[category][type];
	}

	function handleSmsConsent() {
		smsConsent = !smsConsent;
		if (!smsConsent) {
			Object.keys(notificationPrefs.sms).forEach(key => {
				notificationPrefs.sms[key] = false;
			});
		}
	}

	function handleSave() {
		saving = true;
		saveSuccess = false;
		localStorage.setItem('speakerNotificationPreferences', JSON.stringify(notificationPrefs));
		localStorage.setItem('speakerSmsConsent', String(smsConsent));
		setTimeout(() => {
			saving = false;
			saveSuccess = true;
			setTimeout(() => (saveSuccess = false), 3000);
		}, 500);
	}
</script>

<div class="w-full max-w-5xl p-4 md:p-6">
	<h1 class="text-lg font-bold text-gray-900">Notification Preferences</h1>
	<p class="text-sm text-gray-400">Manage how you receive notifications about your speaking engagements.</p>

	<!-- Success Banner -->
	{#if saveSuccess}
		<div class="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
			Notification preferences saved.
		</div>
	{/if}

	<hr class="my-4 border-gray-200" />

	<!-- Email Notifications -->
	<div class="mb-8">
		<h2 class="text-base font-semibold text-gray-900 mb-1">Email Notifications</h2>
		<p class="text-sm text-gray-400 mb-4">Receive notifications via email</p>
		<div class="space-y-3">
			{#each notificationTypes.email as type}
				<div class="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50">
					<div>
						<p class="text-sm text-gray-700 font-medium">{type}</p>
						<p class="text-xs text-gray-400">
							{notificationSubtext[type] ?? 'Notification update'}
						</p>
					</div>
					<button
						aria-label="Toggle {type} email notification"
						on:click={() => handleCheckboxChange('email', type)}
						class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors
							{notificationPrefs.email[type] ? 'bg-gray-800' : 'bg-gray-300'}"
					>
						<span
							class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform
								{notificationPrefs.email[type] ? 'translate-x-6' : 'translate-x-1'}"
						></span>
					</button>
				</div>
			{/each}
		</div>
	</div>

	<hr class="my-4 border-gray-200" />

	<!-- In-App Notifications -->
	<div class="mb-8">
		<h2 class="text-base font-semibold text-gray-900 mb-1">In-App Notifications</h2>
		<p class="text-sm text-gray-400 mb-4">Notifications within the application</p>
		<div class="space-y-3">
			{#each notificationTypes.inApp as type}
				<div class="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50">
					<div>
						<p class="text-sm text-gray-700 font-medium">{type}</p>
						<p class="text-xs text-gray-400">
							{type.includes('Payment') ? 'Delayed' : 'Instant'}
						</p>
					</div>
					<button
						aria-label="Toggle {type} in-app notification"
						on:click={() => handleCheckboxChange('inApp', type)}
						class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors
							{notificationPrefs.inApp[type] ? 'bg-gray-800' : 'bg-gray-300'}"
					>
						<span
							class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform
								{notificationPrefs.inApp[type] ? 'translate-x-6' : 'translate-x-1'}"
						></span>
					</button>
				</div>
			{/each}
		</div>
	</div>

	<hr class="my-4 border-gray-200" />

	<!-- SMS Notifications -->
	<div class="mb-8">
		<div class="flex items-center justify-between mb-4">
			<div>
				<h2 class="text-base font-semibold text-gray-900 mb-1">SMS Notifications</h2>
				<p class="text-sm text-gray-400">Text message notifications (Optional)</p>
			</div>
			<button
				aria-label="Toggle SMS notifications"
				on:click={handleSmsConsent}
				class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {smsConsent ? 'bg-gray-800' : 'bg-gray-300'}"
			>
				<span
					class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {smsConsent ? 'translate-x-6' : 'translate-x-1'}"
				></span>
			</button>
		</div>

		{#if smsConsent}
			<div class="space-y-3">
				{#each notificationTypes.sms as type}
					<div class="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50">
						<div>
							<p class="text-sm text-gray-700 font-medium">{type}</p>
							<p class="text-xs text-gray-400">
								{type.includes('Critical') ? 'Always sent' : 'Opt-in required'}
							</p>
						</div>
						<button
							aria-label="Toggle {type} SMS notification"
							on:click={() => handleCheckboxChange('sms', type)}
							class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors
								{notificationPrefs.sms[type] ? 'bg-gray-800' : 'bg-gray-300'}"
						>
							<span
								class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform
									{notificationPrefs.sms[type] ? 'translate-x-6' : 'translate-x-1'}"
							></span>
						</button>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-sm text-gray-400 py-4 text-center">
				SMS notifications are disabled. Enable the toggle above to receive text message notifications.
			</p>
		{/if}
	</div>

	<!-- Save -->
	<button
		on:click={handleSave}
		disabled={saving}
		class="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50 sm:w-auto sm:justify-start"
	>
		{#if saving}
			Saving...
		{:else}
			<img src="/profile-gear.svg" alt="Save icon" class="pr-2" />Save Changes
		{/if}
	</button>
</div>
