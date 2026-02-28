<script lang="ts">
	type Category = 'email';
	type NotificationPrefs = {
    email: Record<string, boolean>;
	}
	// Define notification types for each category
  type NotificationTypes = {
    email: string[];
  };
	 let notificationPrefs: NotificationPrefs = {
    email: {
      'New Speaker Invitation': true,
      'Application Status Update (Accepted/Rejected)': true,
      'New Message from Organizer': true,
      'Engagement Confirmation': false,
      'Payment Status Update': true
    }
}
const notificationTypes: NotificationTypes = {
    email: [
      'New Order Request',
      'Quote Accepted',
      'New Message from Organizer',
      'Payout Confirmation',
      'Event Invitation'
    ]
};
const notificationSubtext: Record<string, string> = {
	'New Order Request': 'Receive new order request notifications instantly.',
	'Quote Accepted': 'Allow you accept quotes.',
	'New Message from Organizer': 'Allow you accept New Message from Organizer.',
	'Payout Confirmation': 'Allow you confirm payout.',
	'Event Invitation': 'Allow you send Event Invitation.'
};
function handleCheckboxChange(category: Category, type: string) {
    notificationPrefs[category][type] = !notificationPrefs[category][type];
  }
</script>

<div class="w-full max-w-5xl p-4 md:p-6">
	<h1 class="text-xl font-semibold text-gray-900 md:text-2xl">Notification Preferences</h1>
	<p class="text-sm text-gray-500">Checkboxes for various notification types.</p>
	<hr
		class="my-4 w-[90%] border-gray-200"
	/>
		<div>
	            <h2 class="text-xl font-semibold text-gray-900 mb-1">Email Notifications</h2>
	          </div>
		<div class="space-y-4">
	         {#each notificationTypes.email as type}
	  <div class="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50">
		    <div>
		      <p class="text-gray-700 font-medium">{type}</p>
		      <p class="text-xs text-gray-400">
		        {notificationSubtext[type] ?? 'Notification update'}
		      </p>
		    </div>

	    <button
	      aria-label={`Toggle ${type}`}
	      on:click={() => handleCheckboxChange('email', type)}
	      class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
	        ${notificationPrefs.email[type] ? 'bg-blue-600' : 'bg-gray-300'}`}
	    >
	      <span
	        class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
	          ${notificationPrefs.email[type] ? 'translate-x-6' : 'translate-x-1'}`}
	      ></span>
	    </button>
	  </div>
{/each}

	        </div>
			<!-- Save -->
	      <button class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 sm:w-auto sm:justify-start">
	        <img src="/profile-gear.svg" alt="Save icon" class="pr-2"/>Save Changes
	      </button>
</div>
