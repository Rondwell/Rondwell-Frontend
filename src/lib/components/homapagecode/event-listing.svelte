<script>
  let events = Array(6).fill({
    time: "12:00 PM",
    title: "Geegpay's Geegs & Groove",
    organizers: "By Cynthia Orji & Beverly",
    location: "Lagos",
    status: "Going",
    attendees: "+1.5K",
    image: "/flower.png",
  });
</script>

<section class="px-6 sm:mb-[-250px] mb-[-400px] py-20">
  <div class="max-w-7xl mx-auto">
    <!-- Section Heading -->
  <h2 class="text-[48px] md:text-[56px] font-medium text-gray-900 text-center mb-12">
  Upcoming <span class="text-[#7B2CBF]">Events.</span>
</h2>


    <!-- Events Grid -->
    <div class="grid md:grid-cols-2 gap-8 mb-12">
      {#each events as event, index}
        <div
          class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex gap-4"
          key={index}
        >
          <div class="flex-1 space-y-3">
            <!-- Event Time -->
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500">{event.time}</span>
            </div>

            <!-- Title + Organizers -->
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-pink-500">✨</span>
                <h3 class="font-semibold text-gray-900">{event.title}</h3>
              </div>

              <div class="flex items-center gap-2 text-sm text-gray-600">
                <div class="flex -space-x-1">
                  <div class="w-5 h-5 bg-orange-400 rounded-full border border-white"></div>
                  <div class="w-5 h-5 bg-pink-400 rounded-full border border-white"></div>
                </div>
                <span>{event.organizers}</span>
              </div>

              <div class="flex items-center gap-2 text-sm text-gray-500">
                <span>📍</span>
                <span>{event.location}</span>
              </div>
            </div>

            <!-- Status + Attendees -->
            <div class="flex items-center gap-4">
              <span
                class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium"
              >
                {event.status}
              </span>
              <div class="flex items-center gap-1 text-sm text-gray-600">
                <span>👥</span>
                <span>{event.attendees}</span>
              </div>
            </div>
          </div>

          <!-- Event Image -->
          <div class="w-24 h-20 rounded-xl overflow-hidden flex-shrink-0">
            <img
              src={event.image || "/favicon.png"}
              alt={event.title}
              class="w-full h-full object-cover"
            />
          </div>
        </div>
      {/each}
    </div>

    <!-- Centered Button -->
    <div class="flex justify-center">
      <button
        class="bg-[#333537] text-white text-[20px] text-center h-[60px] w-[300px] px-8 py-3 rounded-[13px] transition-colors duration-200 hover:bg-gray-900 hover:text-white"
      >
        Discover more events
      </button>
    </div>
  </div>
</section>
