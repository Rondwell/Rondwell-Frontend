<!-- Notification preferences section. Rendered as a section inside the Account tab. -->
<script lang="ts">
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
</script>

<div class="mb-12 border-t pt-12">
	<h2 class="mb-1 text-lg font-semibold">Notifications & Reminders</h2>
	<p class="mb-4 text-sm text-[#8C8F93]">
		These options apply to all events, Collections, and groups you are part of.
	</p>

	<div class="space-y-4 rounded-lg bg-[#FDFDFD] p-4">
		{#each notificationGroups as group}
			<div>
				<h3 class="mb-2 text-xs font-light text-[#B3B4B4]">{group.title}</h3>
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
					{#each group.items as item}
						<div class="flex items-center">
							<input
								id={item.key}
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
