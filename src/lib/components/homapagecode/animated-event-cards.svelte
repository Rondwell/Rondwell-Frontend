<script>
  let attendees = [1, 2, 3, 4, 5];
</script>

<div class="relative">
  <!-- Animated border wrapper -->
  <div class="relative p-1 rounded-3xl animate-pulse-border">
    <div class="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-500 to-orange-400 rounded-3xl opacity-75 animate-border-fade"></div>

    <!-- Main card content -->
    <div class="relative bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600 rounded-3xl p-6 space-y-6">
      <!-- Top section - Attendees -->
      <div class="space-y-4">
        <div class="text-center">
          <p class="text-white text-lg font-medium">+ 250 Attending</p>
        </div>

        <div class="flex justify-center">
          <div class="grid grid-cols-5 gap-2">
            {#each attendees as i}
              <div class="w-12 h-12 rounded-full overflow-hidden">
                <img
                  src={`/diverse-group-portrait.png?height=48&width=48&query=person-${i}`}
                  alt={`Attendee ${i}`}
                  class="w-full h-full object-cover"
                />
              </div>
            {/each}
          </div>
        </div>

        <div class="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-center">
          <p class="text-white/90 text-sm">
            Can't wait to be there! <span class="text-white/70">- Sarah</span>
          </p>
        </div>
      </div>

      <!-- Bottom section - Shared Albums -->
      <div class="space-y-4">
        <h3 class="text-white text-lg font-medium text-center">Shared Albums and files</h3>

        <div class="grid grid-cols-3 gap-2">
          <img src="/placeholder-h7078.png" alt="Event photo 1" class="w-full h-20 object-cover rounded-lg" />
          <img src="/party-photo-2.jpg" alt="Event photo 2" class="w-full h-20 object-cover rounded-lg" />
          <img src="/placeholder-lzw58.png" alt="Event photo 3" class="w-full h-20 object-cover rounded-lg" />
        </div>

        <button class="w-full bg-gray-900 text-white border-0 hover:bg-gray-800 rounded-lg py-2">
          Add Photos
        </button>
      </div>
    </div>
  </div>
</div>
