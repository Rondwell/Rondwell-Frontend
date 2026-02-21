<script lang="ts">
  // Toggle controls for profile visibility options.
  let showReviews = false;
  let showContactInfo = false;
  let manageListings = false;

  // Listing checkboxes under "Manage Displayed Listings".
  const listings = ["List 1", "List 2", "List 3", "List 4", "List 5"];
  let selectedListings: string[] = [];

  const toggleListing = (name: string) => {
    selectedListings = selectedListings.includes(name)
      ? selectedListings.filter((item) => item !== name)
      : [...selectedListings, name];
  };
</script>

<!-- Public profile settings page -->
<section class="w-full max-w-5xl space-y-6 rounded-2xl p-4 md:p-6">
  <!-- Header -->
  <header class="space-y-1">
    <h1 class="text-3xl font-semibold text-gray-900">Public Vendor Profile</h1>
    <p class="max-w-md text-sm leading-snug text-gray-500">
      This is how Organizers and guests see your business on Rondwell
    </p>
  </header>

  <hr class="border-gray-200" />

  <!-- Main two-column content -->
  <div class="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
    <!-- Left preview card -->
    <article class="overflow-hidden rounded-xl border border-[#e6dbc6] bg-[#f5ebd7]">
      <div class="grid grid-cols-[160px_1fr]">
        <img
          src="/eventpage_sample.svg"
          alt="Vendor event preview"
          class="h-full min-h-[210px] w-full object-cover"
        />

        <div class="space-y-3 p-4">
          <h2 class="text-[40px] font-semibold leading-none text-[#241f1a]">Megaexe Party</h2>

          <div class="space-y-2 text-sm text-[#3d372f]">
            <div class="flex items-start gap-2">
              <span class="inline-flex h-6 w-6 items-center justify-center rounded bg-[#e9ddc4] text-[10px] font-bold">SEP</span>
              <div>
                <p class="font-medium">Wednesday, September 25</p>
                <p class="text-xs text-[#6f6657]">11:30 PM - 12:30 AM</p>
              </div>
            </div>
            <p class="flex items-center gap-2">Register to See Address</p>
          </div>
        </div>
      </div>

      <div class="space-y-2 border-t border-[#e6dbc6] bg-[#efe2cc] p-3 text-sm text-[#403a33]">
        <p><span class="text-xs text-[#7a7264]">Presented by</span><br />John Calendar</p>
        <p><span class="text-xs text-[#7a7264]">Hosted By</span><br />Megaexe</p>
      </div>

      <div class="mx-3 mb-3 flex items-center justify-between rounded-md bg-[#8f8b84] px-3 py-2 text-white">
        <span class="text-sm">rondwell.com/vendor/megaexelimited</span>
        <button type="button" class="text-sm font-semibold">COPY</button>
      </div>
    </article>

    <!-- Right customization panel -->
    <aside class="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
      <h3 class="text-[34px] font-semibold text-gray-900">Customization Options</h3>

      <div class="space-y-4">
        <div class="flex items-center justify-between border-b border-gray-200 pb-3">
          <p class="text-[20px] text-gray-800">Show Customer Reviews</p>
          <button
            type="button"
            aria-label="Toggle customer reviews"
            on:click={() => (showReviews = !showReviews)}
            class={`relative h-7 w-12 rounded-full transition ${showReviews ? "bg-[#DB3EC6]" : "bg-gray-300"}`}
          >
            <span
              class={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${showReviews ? "left-6" : "left-1"}`}
            ></span>
          </button>
        </div>

        <div class="flex items-center justify-between border-b border-gray-200 pb-3">
          <p class="text-[20px] text-gray-800">Show Contact Information</p>
          <button
            type="button"
            aria-label="Toggle contact information"
            on:click={() => (showContactInfo = !showContactInfo)}
            class={`relative h-7 w-12 rounded-full transition ${showContactInfo ? "bg-[#DB3EC6]" : "bg-gray-300"}`}
          >
            <span
              class={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${showContactInfo ? "left-6" : "left-1"}`}
            ></span>
          </button>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-[20px] text-gray-800">Manage Displayed Listings:</p>
            <button
              type="button"
              aria-label="Toggle listing display"
              on:click={() => (manageListings = !manageListings)}
              class={`relative h-7 w-12 rounded-full transition ${manageListings ? "bg-[#DB3EC6]" : "bg-gray-300"}`}
            >
              <span
                class={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${manageListings ? "left-6" : "left-1"}`}
              ></span>
            </button>
          </div>

          <div class="grid grid-cols-2 gap-y-3 sm:grid-cols-3">
            {#each listings as listing}
              <label class="flex cursor-pointer items-center gap-2 text-[30px] text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedListings.includes(listing)}
                  on:change={() => toggleListing(listing)}
                  class="h-5 w-5 rounded border-gray-300 text-[#DB3EC6] focus:ring-[#DB3EC6]"
                />
                {listing}
              </label>
            {/each}
          </div>
        </div>
      </div>

    </aside>
  </div>

  <!-- Footer action row -->
  <div class="flex flex-col gap-3 sm:flex-row sm:items-start">
    <div class="flex items-center gap-4 text-[#909090] sm:w-1/2">
      <span class="text-[13px] font-medium">Share Profile</span>
      <span class="text-lg"><img src="/instagram.svg"/></span>
      <span class="text-lg"><img src="/twitter.svg" alt="" srcset="" class="w-3"/></span>
      <span class="text-lg"><img src='/linkedin-icon.svg'/></span>
      <span class="text-lg"><img src="/tiktok.svg"/></span>
	  <button type="button" class="rounded-lg border border-gray-300 px-5 py-2 text-[12px] text-gray-700 hover:bg-gray-50">
        View My Public Profile
      </button>
    </div>
    <div class="space-y-3 sm:w-1/2 sm:text-right">
      <div class="rounded-lg bg-[#f6efdf] p-4 text-sm font-medium text-[#3f3a33]">
        Ensure your profile is complete and showcases your best work to attract more clients.
      </div>
    </div>
  </div>

  <!-- Save -->
      <button class="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition">
        <img src="/profile-gear.svg" class="pr-2"/>Save Changes
      </button>
</section>
