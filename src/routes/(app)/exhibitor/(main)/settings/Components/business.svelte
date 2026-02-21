<script lang="ts">
  let companyName = "Megaexe Limited";
  let companyCategory = "Venue Rental";
  let companyDescription = "Share a little about your background and interests.";

  // Example values shown to the user
  let email = "johnmedic12@gmail.com";
  let phone = "+234 800 000 0000";
  let website = "yourwebsite.com";
  let businessLocation = "";
</script>

<div class="w-full max-w-5xl rounded-2xl border  p-4 shadow-sm">
  <!-- HEADER -->
  <h2 class="mb-1 text-lg font-bold text-gray-900">Business Details</h2>
  <p class="mb-6 text-sm text-gray-400">Choose how you are displayed as a host or guest</p>

  <!-- TOP SECTION -->
  <div class="flex flex-col lg:flex-row gap-6">
    <!-- LEFT FORM -->
    <div class="flex-1 space-y-2">
      <!-- Company Name -->
      <div class="pb-4">
        <label class="mb-1 block text-sm font-medium text-gray-500">
          Company Name
        </label>
        <input
          type="text"
          placeholder={companyName}
          class="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
        />
      </div>

      <!-- Category -->
      <div class="pb-4">
        <label class="mb-1 block text-sm font-medium text-gray-500">
          Company Category
        </label>
        <div class="relative">
          <input
            type="text"
            placeholder={companyCategory}
            class="w-full rounded-lg border px-3 py-2 pr-20 text-sm outline-none focus:border-black"
          />
          <button
            type="button"
            class="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm font-medium hover:bg-gray-100"
            on:click={() => console.log('Company category action')}
            aria-label="Open category selector"
          >
            <img
              src="/arrow-dropdown.svg"
              alt="Dropdown icon"
            />
          </button>
        </div>
      </div>

      <!-- Description -->
      <div class="pb-4">
        <label class="mb-1 block text-sm font-medium text-gray-500">
          Company Description
        </label>
        <textarea
          rows="3"
          placeholder={companyDescription}
          class="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
        />
      </div>
    </div>

    <!-- PROFILE IMAGE CARD -->
    <div class="relative rounded-xl  flex-1">
      <div class="relative h-50 w-full">
        <img
          src="/events.png"
          alt="Business cover"
          class="h-full w-full object-cover rounded-xl"
        />
        <div class="absolute left-40 top-15">
          <div class="h-20 w-20">
            <img
              src="/face-1.svg"
              alt="Profile"
              class="h-full w-full rounded-full object-cover"
            />
          </div>
          <div class="absolute right-0  bottom-0  cursor-pointer">
            <svg
              width="31"
              height="32"
              viewBox="0 0 31 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M28.6875 13.0528H24.0816C20.3044 13.0528 17.2284 9.97687 17.2284 6.19969V1.59375C17.2284 0.717187 16.5113 0 15.6347 0H8.87719C3.96844 0 0 3.1875 0 8.87719V22.9978C0 28.6875 3.96844 31.875 8.87719 31.875H21.4041C26.3128 31.875 30.2812 28.6875 30.2812 22.9978V14.6466C30.2812 13.77 29.5641 13.0528 28.6875 13.0528ZM14.3916 18.3759C14.1525 18.615 13.8497 18.7266 13.5469 18.7266C13.2441 18.7266 12.9413 18.615 12.7022 18.3759L11.5547 17.2284V23.9062C11.5547 24.5597 11.0128 25.1016 10.3594 25.1016C9.70594 25.1016 9.16406 24.5597 9.16406 23.9062V17.2284L8.01656 18.3759C7.55438 18.8381 6.78937 18.8381 6.32719 18.3759C5.865 17.9137 5.865 17.1488 6.32719 16.6866L9.51469 13.4991C9.62625 13.4034 9.73781 13.3237 9.86531 13.26C9.89719 13.2441 9.945 13.2281 9.97688 13.2122C10.0725 13.1803 10.1681 13.1644 10.2797 13.1484C10.3275 13.1484 10.3594 13.1484 10.4072 13.1484C10.5347 13.1484 10.6622 13.1803 10.7897 13.2281C10.8056 13.2281 10.8056 13.2281 10.8216 13.2281C10.9491 13.2759 11.0766 13.3716 11.1722 13.4672C11.1881 13.4831 11.2041 13.4831 11.2041 13.4991L14.3916 16.6866C14.8537 17.1488 14.8537 17.9137 14.3916 18.3759Z" fill="#292D32"/>
              <pfontath d="M23.7969 10.8527C25.3109 10.8687 27.4147 10.8687 29.2156 10.8687C30.1241 10.8687 30.6022 9.80086 29.9647 9.16336C27.6697 6.85243 23.5578 2.69274 21.1991 0.33399C20.5456 -0.319448 19.4141 0.126802 19.4141 1.03524V6.59743C19.4141 8.9243 21.3903 10.8527 23.7969 10.8527Z" fill="#292D32"/>
            </svg>
          </div>
        </div>

      </div>
    </div>
  </div>
  <!-- Business Location and Services -->
  <div class="mt-8">
    <label class="mb-3 block text-sm font-medium text-gray-500">
      Business Location/Service Area<span class="text-blue-500">*</span>
    </label>
    <div class="relative">
      <input
        type="text"
        bind:value={businessLocation}
        class="w-full rounded-lg border px-3 py-2 pl-14 text-sm outline-none focus:border-black bg-white cursor-pointer"
        readOnly
      />
      <div class="absolute left-3 top-1/2 transform -translate-y-1/2 flex-shrink-0 pointer-events-none">
        <svg
          width="24"
          height="24"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="24" cy="24" r="23" fill="#F5F5F5" stroke="#D9D9D9" stroke-width="2" />
          <path
            d="M24 12C19.04 12 15 16.04 15 21C15 27.16 24 36 24 36S33 27.16 33 21C33 16.04 28.96 12 24 12ZM24 24.5C22.07 24.5 20.5 22.93 20.5 21C20.5 19.07 22.07 17.5 24 17.5C25.93 17.5 27.5 19.07 27.5 21C27.5 22.93 25.93 24.5 24 24.5Z"
            fill="#000000"
          />
        </svg>
      </div>
      <div class="absolute left-10 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none gap-4">
        <h1 class="">Add Business Location</h1>
        <p class="text-xs leading-tight">Offline location or virtual link</p>
      </div>
    </div>
  </div>

  <!-- EMAILS -->
  <div class="mt-8">
    <div class="mb-2 flex flex-wrap gap-4 items-center justify-between">
      <div>
        <h3 class="text-[19px] font-bold text-gray-900">Emails</h3>
        <p class="mt-1 text-[15px] text-gray-400">
        Add additional emails to receive events invites sent to those addresses.
      </p>
    </div>
      <button class="text-sm font-semibold text-gray-400 bg-gray-200 rounded-md p-2 flex">
        <img src="/plus-icon.svg" alt="plus icon" class="pr-2"/> 
        Add Email
      </button>
    </div>

    <div class="w-full rounded-lg border px-3 py-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <p class="truncate text-sm font-semibold text-gray-900"><a href="mailto:{email}">{email}</a></p>
            <span class="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-500 ml-4">
              Primary
            </span>
          </div>
          <p class="mt-1 text-xs text-gray-500">
            This email will be shared with host when you register for their events
          </p>
        </div>

        <button
          type="button"
          aria-label="More email actions"
          class="rounded-md p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>
      </div>
    </div>

    
    
  </div>

  <!-- PHONE -->
  <div class="mt-6">
    <h3 class="text-[19px] font-bold text-gray-900">Phone Number</h3>
    <div class="mb-2 flex items-center justify-between">
      <p class="mt-1 text-[15px] text-gray-400">Manage the phone number you use to sign in to Rondwell and receive SMS updates.</p>
      
    </div>

    <div class="flex gap-3">
      <input
        type="text"
        bind:value={phone}
        class="w-full max-w-60 text-gray-400 rounded-lg px-3 py-2 text-sm  bg-white"
      />
      <button class="rounded-lg border px-4 py-2 text-sm font-semibold bg-gray-500 text-white">
        Update
      </button>
    </div>
  </div>

  <!-- SOCIAL LINKS -->
  <div class="mt-6">
    <label class="mb-1 block text-[19px] font-medium text-black">
      Social Links
    </label>
    <div class="relative">
      <div class="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center rounded-l-lg bg-gray-100">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="#A3A5A5" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6.00313 2.25H6.75313C5.29063 6.63 5.29063 11.37 6.75313 15.75H6.00313" stroke="#A3A5A5" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M11.25 2.25C12.7125 6.63 12.7125 11.37 11.25 15.75" stroke="#A3A5A5" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2.25 12V11.25C6.63 12.7125 11.37 12.7125 15.75 11.25V12" stroke="#A3A5A5" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2.25 6.75313C6.63 5.29063 11.37 5.29063 15.75 6.75313" stroke="#A3A5A5" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>

      </div>
      <input
        type="url"
        bind:value={website}
        placeholder="yourwebsite.com"
        class="w-full max-w-60 text-gray-400 rounded-lg py-2 pl-12 pr-3 text-sm outline-none bg-white"
      />
    </div>
  </div>

  <!-- SAVE BUTTON -->
  <div class="mt-8 flex gap-4">
    
        <button
          class="flex items-center rounded-lg bg-black px-6 py-2 text-sm font-bold text-white hover:bg-gray-900"
        >
          <img src="/profile-gear.svg" class="pr-2"/>Save Changes
      </button>
  </div>
</div>
