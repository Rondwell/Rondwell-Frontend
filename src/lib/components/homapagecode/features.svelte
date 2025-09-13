<script>
  import Button from "$lib/components/Button.svelte";

  let features = [
    { icon: "🎫", title: "Ticket Sales and Group ticketing", color: "bg-purple-100" },
    { icon: "💬", title: "Event communities and forums", color: "bg-pink-100" },
    { icon: "🪑", title: "Seating and capacity management", color: "bg-blue-100" },
    { icon: "📱", title: "Multimodal check-in system", color: "bg-blue-100" },
    { icon: "🏢", title: "Vendor, Speaker & Exhibitor Management", color: "bg-blue-100" },
  ];

  let activeIndex = $state(0);
  
  let featureImages = [
    "/flower.png", // Ticket Sales
    "/flower.png", // Event communities  
    "/flower.png", // Seating management
    "/flower.png", // Multimodal check-in
    "/flower.png"  // Vendor management
  ];

  let interval;
  
  $effect(() => {
    interval = setInterval(() => {
      activeIndex = (activeIndex + 1) % features.length;
    }, 2000); // Change every 2 seconds
    
    return () => {
      if (interval) clearInterval(interval);
    };
  });
</script>

<section class="px-4 sm:px-6 py-16 sm:py-20 bg-white/50 rounded-[30px] backdrop-blur-sm">
  <div class="max-w-7xl mx-auto">
    <!-- Section Header -->
    <div class="text-center space-y-4 mb-12 sm:mb-16">
      <h2 class="text-3xl sm:text-4xl md:text-5xl text-[#000000] font-semibold">
        Rondwell
        <span class="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text font-semibold text-transparent">
          Events.
        </span>
      </h2>
      <p class="text-base sm:text-lg text-[#686768] max-w-2xl mx-auto text-balance">
        Organize any kind of event on Rondwell, manage your event pages, embeddings, attendees,
        accept payments in multiple currencies.
      </p>
      <Button 
        class="bg-[#333537] text-white text-[18px] sm:text-[20px] text-center h-[52px] sm:h-[60px] 
               w-full sm:w-[300px] px-6 sm:px-8 py-3 rounded-[13px] transition-colors duration-200">
        ✨ Create Event with AI
      </Button>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 items-center">
      
      <!-- Features List -->
      <style>
        /* Modified gradient border animation to be applied conditionally */
        @keyframes border-rotate {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .animated-border {
          position: relative;
          width: 100%;
          max-width: 500px;
          height: 66px;
          border-radius: 16px;
          padding: 2px;
          background: linear-gradient(
            90deg,
            #EFF0F0 13%,
            #AB46DD 28%,
            #AB46DD 38%,
            #AB46DD 45%,
            #AB46DD 56%,
            #EFF0F0 75%,
            #EFF0F0 88%,
            #EFF0F0 100%
          );
          background-size: 200% auto;
          animation: border-rotate 2s linear infinite;
        }
        .static-border {
          position: relative;
          width: 100%;
          max-width: 500px;
          height: 66px;
          border-radius: 16px;
          padding: 2px;
          background: #EFF0F0;
        }
        .animated-border .inner,
        .static-border .inner {
          width: 100%;
          height: 100%;
          background: white;
          border-radius: 14px;
          display: flex;
          align-items: center;
          padding-left: 1rem;
        }
      </style>

      <div class="space-y-4 w-full">
        {#each features as feature, index}
          <!-- Apply animated border only to active item -->
          <div class={activeIndex === index ? "animated-border" : "static-border"} key={index}>
            <div class="inner">
              <!-- Icon -->
              <div class={`w-10 h-10 sm:w-12 sm:h-12 ${feature.color} rounded-xl flex items-center justify-center`}>
                <span class="text-lg sm:text-xl">{feature.icon}</span>
              </div>
              <!-- Text -->
              <span class="ml-3 sm:ml-4 text-base sm:text-lg font-medium text-gray-900">
                {feature.title}
              </span>
            </div>
          </div>
        {/each}
      </div>

      <!-- Card Section -->
      <div class="relative flex flex-col items-center text-center w-full">
        <div class="w-full max-w-[444px] h-auto rounded-[20px] p-4 text-white
                    bg-[linear-gradient(135deg,#27404f_0%,#3b4756_45%,#6ab3a9_100%)]
                    flex flex-col">
          
          <h3 class="text-sm sm:text-base font-medium mb-3 text-center">Shared Albums and files</h3>
          <!-- Image changes based on active feature -->
          <img src={featureImages[activeIndex] || "/placeholder.svg"} alt="Event group"
                class="w-full h-[120px] sm:h-[140px] object-cover rounded-xl mb-3 transition-all duration-500"/>
          
          <Button class="w-[140px] sm:w-[146px] h-[30px] sm:h-[32px] bg-[#55686D] text-white text-xs sm:text-sm 
                         rounded-[30px] border-0 mx-auto">
            Add Photos
          </Button>
        </div>

        <!-- Text below card -->
        <p class="text-base sm:text-[22px] text-[#3D3D4E] text-left mt-4 max-w-[444px]">
          Rondwell brings organizers, attendees, and professionals together to create unforgettable experiences.
        </p>
      </div>

    </div>
  </div>
</section>
