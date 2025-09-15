<script>
  import Button from "$lib/components/Button.svelte";

  let features = [
    { icon: "/ico1.png", title: "Ticket Sales and Group ticketing", color: "bg-purple-100" },
    { icon: "/ico2.png", title: "Event communities and forums", color: "bg-pink-100" },
    { icon: "/ico3.png", title: "Seating and capacity management", color: "bg-blue-100" },
    { icon: "/ico3.png", title: "Multimodal check-in system", color: "bg-blue-100" },
    { icon: "/ico3.png", title: "Vendor, Speaker & Exhibitor Management", color: "bg-blue-100" },
  ];

  let activeIndex = 0;

  let featureImages = [
    "/hero2.png", // Ticket Sales
    "/hero2.png", // Event communities  
    "/hero2.png", // Seating management
    "/hero2.png", // Multimodal check-in
    "/hero2.png"  // Vendor management
  ];
</script>

<section class="px-4 sm:px-6 bg-[#ffe0f0]/20 py-16 sm:py-20  rounded-[30px] backdrop-blur-sm">
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
        <img src="/Aiicon.png" alt="AI Icon" class="w-6 h-6 object-contain" />
        Create Event with AI
      </Button>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 items-center">
      
      <!-- Features List -->
      <style>
        .feature-border {
          position: relative;
          width: 100%;
          max-width: 500px;
          height: 66px;
          border-radius: 16px;
          padding: 2px;
          background: #EFF0F0;
          transition: background 0.3s ease;
        }
        .feature-border:hover {
          background: linear-gradient(
            90deg,
            #EFF0F0 13%,
            #AB46DD 28%,
            #AB46DD 56%,
            #EFF0F0 88%
          );
          background-size: 200% auto;
          animation: border-rotate 2s linear infinite;
        }
        @keyframes border-rotate {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .feature-border .inner {
          width: 100%;
          height: 100%;
          background: white;
          border-radius: 14px;
          display: flex;
          align-items: center;
          padding-left: 1rem;
        }
      </style>
<div class="flex flex-col lg:flex-row 
w-full lg:w-[1257px] h-auto lg:h-[528px] 
            bg-gradient-to-br 
            from-[#ffe0f0] via-white to-[#fce7f3] 
            rounded-[24px] px-4 sm:px-6 py-6 sm:py-10 
            shadow-lg shadow-pink-200/50 border border-pink-100 
            gap-6 lg:gap-16 mx-auto">

  <!-- Features Section (Left on desktop, Bottom on mobile) -->
  <div class="order-2 lg:order-1 space-y-4 w-full lg:w-1/2">
    {#each features as feature, index}
      <div 
        class="feature-border" 
        key={index}
        on:mouseenter={() => activeIndex = index}
      >
        <div class="inner flex items-center">
          <!-- Icon -->
          <div class={`w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 ${feature.color} rounded-xl flex items-center justify-center`}>
            <img src={feature.icon} alt={feature.title} 
                 class="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 object-contain" />
          </div>
          <!-- Text -->
          <span class="ml-2 sm:ml-3 md:ml-4 text-sm sm:text-base md:text-lg font-medium text-gray-900">
            {feature.title}
          </span>
        </div>
      </div>
    {/each}
  </div>

  <!-- Card Section (Right on desktop, Top on mobile) -->
  <div class="order-1 lg:order-2 relative flex flex-col items-center text-center w-full lg:w-1/2 mt-6 lg:mt-0">
    <div class="w-full max-w-[444px] h-auto rounded-[20px] p-4 text-white
                bg-[linear-gradient(135deg,#27404f_0%,#3b4756_45%,#6ab3a9_100%)]
                flex flex-col">
      <h3 class="text-xs sm:text-sm md:text-base font-medium mb-3 text-center">
        Shared Albums and files
      </h3>
      <img src={featureImages[activeIndex] || "/placeholder.svg"} alt="Event group"
           class="w-full h-[100px] sm:h-[120px] md:h-[140px] object-cover rounded-xl mb-3 transition-all duration-500"/>
      <Button class="w-[120px] sm:w-[140px] md:w-[146px] h-[28px] sm:h-[30px] md:h-[32px] bg-[#55686D] text-white text-xs sm:text-sm 
                     rounded-[30px] border-0 mx-auto">
        Add Photos
      </Button>
    </div>
    <p class="text-sm sm:text-base md:text-[22px] text-[#3D3D4E] text-left mt-4 sm:mt-6 max-w-[444px]">
      Rondwell brings organizers, attendees, and professionals together to create unforgettable experiences.
    </p>
  </div>
</div>



</section>
