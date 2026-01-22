<script lang="ts">
  import { onMount } from 'svelte';

  // Define notification categories
  type Category = 'email' | 'inApp' | 'sms';

  // Define notification preferences for each category
  type NotificationPrefs = {
    email: Record<string, boolean>;
    inApp: Record<string, boolean>;
    sms: Record<string, boolean>;
  };

  // Define notification types for each category
  type NotificationTypes = {
    email: string[];
    inApp: string[];
    sms: string[];
  };

  // Initial state for notifications
  let notificationPrefs: NotificationPrefs = {
    email: {
      'New Speaker Invitation': true,
      'Application Status Update (Accepted/Rejected)': true,
      'New Message from Organizer': true,
      'Engagement Confirmation': false,
      'Payment Status Update': true
    },
    inApp: {
      'New Speaker Invitation': true,
      'Application Status Update (Accepted/Rejected)': true,
      'New Message from Organizer': false,
      'Engagement Confirmation': true,
      'Payment Status Update': false
    },
    sms: {
      'New Speaker Invitation': false,
      'Engagement Confirmation (Critical)': true
    }
  };

  // All notification types grouped by category
  const notificationTypes: NotificationTypes = {
    email: [
      'New Speaker Invitation',
      'Application Status Update (Accepted/Rejected)',
      'New Message from Organizer',
      'Engagement Confirmation',
      'Payment Status Update'
    ],
    inApp: [
      'New Speaker Invitation',
      'Application Status Update (Accepted/Rejected)',
      'New Message from Organizer',
      'Engagement Confirmation',
      'Payment Status Update'
    ],
    sms: [
      'New Speaker Invitation',
      'Engagement Confirmation (Critical)'
    ]
  };

  // Track SMS consent
  let smsConsent = false;
  let isSaving = false;
  let saveSuccess = false;

  // Load saved preferences
  onMount(() => {
    const saved = localStorage.getItem('notificationPreferences');
    if (saved) {
      notificationPrefs = JSON.parse(saved);
      smsConsent = localStorage.getItem('smsConsent') === 'true';
    }
  });

  // Handle checkbox change
  function handleCheckboxChange(category: Category, type: string) {
    notificationPrefs[category][type] = !notificationPrefs[category][type];
  }

  // Handle SMS consent toggle
  function handleSmsConsent() {
    smsConsent = !smsConsent;
    if (!smsConsent) {
      Object.keys(notificationPrefs.sms).forEach(key => {
        notificationPrefs.sms[key] = false;
      });
    }
  }

  // Handle save
  async function savePreferences() {
    isSaving = true;
    saveSuccess = false;

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      localStorage.setItem('notificationPreferences', JSON.stringify(notificationPrefs));
      localStorage.setItem('smsConsent', smsConsent.toString());
      saveSuccess = true;
      setTimeout(() => (saveSuccess = false), 3000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      isSaving = false;
    }
  }

  // Select all in category
  function selectAll(category: Category) {
    notificationTypes[category].forEach(type => {
      notificationPrefs[category][type] = true;
    });
  }

  // Deselect all in category
  function deselectAll(category: Category) {
    notificationTypes[category].forEach(type => {
      notificationPrefs[category][type] = false;
    });
  }
</script>


<div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-10">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Notification Preferences</h1>
      <p class="text-gray-600">
        Manage how you receive notifications about your speaking engagements
      </p>
    </div>
    
    <!-- Main Content -->
    <div class="space-y-10">
      <!-- Email Notifications Section -->
      <section class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-1">Email Notifications</h2>
            <p class="text-gray-500 text-sm">Receive notifications via email</p>
          </div>
          <div class="flex space-x-3">
            <button
              on:click={() => selectAll('email')}
              class="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Select All
            </button>
            <button
              on:click={() => deselectAll('email')}
              class="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>
        
        <div class="space-y-4">
         {#each notificationTypes.email as type}
  <div class="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg">
    <div>
      <p class="text-gray-700 font-medium">{type}</p>
      <p class="text-xs text-gray-400">
        {type.includes('Engagement') ? 'Once per engagement' : 'Real-time'}
      </p>
    </div>

    <button
      on:click={() => handleCheckboxChange('email', type)}
      class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${notificationPrefs.email[type] ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span
        class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${notificationPrefs.email[type] ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  </div>
{/each}

        </div>
      </section>
      
      <!-- In-App Notifications Section -->
      <section class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-1">In-App Notifications</h2>
            <p class="text-gray-500 text-sm">Notifications within the application</p>
          </div>
          <div class="flex space-x-3">
            <button
              on:click={() => selectAll('inApp')}
              class="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Select All
            </button>
            <button
              on:click={() => deselectAll('inApp')}
              class="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>
        
        <div class="space-y-4">
         {#each notificationTypes.inApp as type}
  <div class="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg">
    <div>
      <p class="text-gray-700 font-medium">{type}</p>
      <p class="text-xs text-gray-400">
        {type.includes('Payment') ? 'Delayed' : 'Instant'}
      </p>
    </div>

    <button
      on:click={() => handleCheckboxChange('inApp', type)}
      class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${notificationPrefs.inApp[type] ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span
        class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${notificationPrefs.inApp[type] ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  </div>
{/each}

        </div>
      </section>
      
      <!-- SMS Notifications Section -->
      <section class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-1">SMS Notifications</h2>
            <p class="text-gray-500 text-sm">Text message notifications (Optional)</p>
          </div>
          <div class="flex items-center space-x-3">
            <span class="text-sm text-gray-600">Enable SMS Notifications</span>
            <button
              on:click={handleSmsConsent}
              class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                smsConsent ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span class="sr-only">Enable SMS Notifications</span>
              <span
                class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  smsConsent ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        
        {#if smsConsent}
          <div class="space-y-4">
            {#each notificationTypes.sms as type}
  <div class="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg">
    <div>
      <p class="text-gray-700 font-medium">
        {type}
        {#if type.includes('Critical')}
          <span class="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
            Critical
          </span>
        {/if}
      </p>
      <p class="text-xs text-gray-400">
        {type.includes('Critical') ? 'Always sent' : 'Opt-in required'}
      </p>
    </div>

    <button
      disabled={!smsConsent}
      on:click={() => handleCheckboxChange('sms', type)}
      class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${notificationPrefs.sms[type] ? 'bg-blue-600' : 'bg-gray-300'}
        ${!smsConsent ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${notificationPrefs.sms[type] ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  </div>
{/each}

            
            <!-- Phone Number Input -->
            <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <label for="phone-number" class="block text-sm font-medium text-gray-700 mb-2">
                Phone Number for SMS Notifications
              </label>
              <div class="flex space-x-3">
                <input
                  type="tel"
                  id="phone-number"
                  placeholder="+1 (555) 123-4567"
                  class="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
                <button class="px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  Verify
                </button>
              </div>
              <p class="mt-2 text-sm text-gray-500">
                Standard message rates may apply. Only used for critical notifications.
              </p>
            </div>
          </div>
        {:else}
          <div class="text-center py-8">
            <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p class="text-gray-500">
              SMS notifications are disabled. Enable the toggle above to receive text message notifications.
            </p>
          </div>
        {/if}
      </section>
      
      <!-- Save Button -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
        <div class="text-sm text-gray-500">
          Your preferences are automatically saved to this device.
        </div>
        
        <div class="flex items-center space-x-4">
          {#if saveSuccess}
            <div class="flex items-center text-green-600 font-medium">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              Settings saved successfully!
            </div>
          {/if}
          
          <button
            on:click={savePreferences}
            disabled={isSaving}
            class="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {#if isSaving}
              <span class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            {:else}
              Save Notification Settings
            {/if}
          </button>
        </div>
      </div>
      
      <!-- Additional Information -->
      <div class="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 class="font-medium text-gray-900 mb-3">About Notification Types</h3>
        <ul class="space-y-2 text-sm text-gray-600">
          <li class="flex items-start">
            <svg class="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span><strong>Email Notifications:</strong> Sent to your registered email address with full details</span>
          </li>
          <li class="flex items-start">
            <svg class="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span><strong>In-App Notifications:</strong> Appear within the platform with quick actions</span>
          </li>
          <li class="flex items-start">
            <svg class="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span><strong>SMS Notifications:</strong> Critical alerts sent via text message for urgent updates</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</div>

<style>
  /* Custom checkbox styling */
 
</style>