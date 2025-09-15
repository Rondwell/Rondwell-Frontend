<!-- +page.svelte or your main page file -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import Button from "$lib/components/Button.svelte";

  // Hero section variables
  let heroImage1 = "hero1.png";
  let heroImage2 = "hero1.png";

  // Event cards section variables
  let mounted = false;
  let currentSet = $state(0); // 0 for first set (f1-f3), 1 for second set (f4-f6)
  let intervalId;
  
  const allEvents = [
    // First set (f1-f3)
    [
      {
        id: 1,
        image: "/f1.jpg"
      },
      {
        id: 2,
        image: "/f2.jpg"
      },
      {
        id: 3,
        image: "/f3.jpg"
      }
    ],
    // Second set (f4-f6)
    [
      {
        id: 4,
        image: "/f4.jpg"
      },
      {
        id: 5,
        image: "/f5.jpg"
      },
      {
        id: 6,
        image: "/f6.jpg"
      }
    ]
  ];

  // Reactive statement to fix the warning
  let events = $derived(allEvents[currentSet]);

  onMount(() => {
    mounted = true;
    intervalId = setInterval(() => {
      currentSet = currentSet === 0 ? 1 : 0;
    }, 4000);
  });

  onDestroy(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  const floatingIcons = [
    { icon: "/icon4.png", delay: 0, x: 5, y: 60 },      // Maps app - top left area
    { icon: "/icon6.png", delay: 1, x: 10, y: 80 },       // Avatar with mustache - left middle
    { icon: "/icon3.png", delay: 2, x: 50, y: 105 },      // Weather app - bottom center
    { icon: "/icon5.png", delay: 0.5, x: 60, y: 10 },    // Avatar with headwear - top right
    { icon: "/icon1.png", delay: 1.5, x: 94, y: 60 },    // Music app - right side
    { icon: "/icon2.png", delay: 2.5, x: 93, y: 75 }     // Photos app - bottom right
  ];
</script>

<!-- HERO SECTION -->
<section class="hero-section px-8 sm:px-12 md:px-16 lg:px-20 xl:px-24 py-20 pb-0">
  <div class="max-w-7xl mx-auto">
    <div class="grid lg:grid-cols-2 gap-12 items-center">
      <!-- LEFT -->
      <div class="space-y-8 relative z-10 text-center lg:text-left">
        <div class="space-y-4">
          <h1 class="text-5xl lg:text-6xl text-[#000000] font-bold leading-tight">
            Organize
            <span class="bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] bg-clip-text text-transparent">
              Unforgettable
            </span>
            <br />
            <span class="bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] bg-clip-text text-transparent">
              Events.
            </span>
          </h1>

          <p class="text-[22px] md:text-[24px] leading-[40px] text-[#686768] max-w-[566px] mx-auto lg:mx-0 lg:text-left">
            Rondwell brings organizers, attendees, exhibitors and vendors
            together to create unforgettable experiences.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-6 justify-center lg:justify-start">
          <Button
            class="bg-[#333537] text-white text-[20px] text-center h-[60px] w-[300px] px-8 py-3 rounded-[13px] transition-colors duration-200 hover:bg-gray-900 hover:text-white flex items-center justify-center gap-2"
          >
            <img src="/Aiicon.png" alt="AI Icon" class="w-6 h-6 object-contain" />
            Create Event with AI
          </Button>
        </div>
      </div>

      <!-- RIGHT -->
      <div class="relative flex justify-center lg:justify-end">
        <div class="gradient-border-wrapper">
          <div class="gradient-border">
            <div class="images-container">
              <img src={heroImage1} alt="Event attendees" class="hero-image-main" />
              <img src={heroImage2} alt="Shared album" class="hero-image-album" />
            </div>
          </div>
        </div>
      </div>
    </div>

  <!-- STACKED FLOATING CARDS -->
  <div class="relative flex flex-col items-center mt-20 mb-0 z-20">
    <!-- First Card -->
    <div class="w-[320px] h-[48px] flex items-center justify-center text-[#3D235E] font-medium text-[12px] shadow-xl rounded-full border-[3px] border-white bg-[rgba(255,255,255,0.65)] backdrop-blur-md whitespace-nowrap relative z-30">
      <span class="flex items-center gap-2">
        <img src="/heart-icon.png" alt="Heart" class="w-4 h-4" />
        Trusted by over 100,000 people worldwide.
      </span>
    </div>

    <!-- Second Card -->
    <div class="glass-card w-[280px] h-[70px] flex items-center justify-center text-[#3D3D4E] font-medium text-[12px] shadow-xl border-[3px] border-white bg-[rgba(255,255,255,0.65)] backdrop-blur-md rounded-2xl relative z-20 -mt-8">
      <div class="mt-6">See Latest Events</div>
    </div>

    <!-- Arrow Card -->
    <div class="w-[58px] h-[58px] flex items-center justify-center shadow-xl border-[3px] border-white bg-[rgba(255,255,255,0.65)] backdrop-blur-md rounded-full relative z-10 mt-[-21px]">
      <img src="/arrow-down.png" alt="Arrow Down" class="w-5 h-5" />
    </div>
  </div>
</section>

<!-- EVENT CARDS SECTION -->
<section class="px-4 sm:px-6 py-8 sm:py-16 relative bg-[#ffe0f0]/20">
  <div class="max-w-7xl mx-auto">
    <!-- Responsive container with adjusted heights -->
    <div class="relative flex justify-center items-center min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
      
      <!-- Event Cards Container - Responsive layout -->
      <div class="flex gap-2 sm:gap-4 lg:gap-6 flex-wrap justify-center items-center z-10 relative transition-all duration-500 ease-in-out px-2">
        {#each events as event, index (event.id)}
          <div 
            class="event-card rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl relative"
            style="
              transform: rotate({index === 0 ? '-8deg' : index === 1 ? '2deg' : '6deg'});
            "
          >
            <!-- Responsive card sizing -->
            <div 
              class="bg-cover bg-center rounded-2xl sm:rounded-3xl card-image"
              style="background-image: url('{event.image}');"
            >
            </div>
          </div>
        {/each}
      </div>

      <!-- Floating Icons - Responsive positioning and sizing -->
      {#each floatingIcons as iconData}
        <div 
          class="absolute animate-float z-30 pointer-events-none floating-icon"
          style="
            left: {iconData.x}%; 
            top: {iconData.y}%; 
            animation-delay: {iconData.delay}s;
            transform: translate(-50%, -50%);
          "
        >
          <!-- Responsive icon container -->
          <div class="bg-white rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-md sm:shadow-lg border border-gray-100">
            <img 
              src={iconData.icon || "/placeholder.svg"} 
              alt="App icon" 
              class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl"
            />
          </div>
        </div>
      {/each}

      <!-- Responsive indicator dots -->
      <div class="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1.5 sm:gap-2 z-40">
        {#each [0, 1] as setIndex}
          <button 
            class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 {currentSet === setIndex ? 'bg-blue-500' : 'bg-gray-300'}"
            aria-label={`Go to set ${setIndex + 1}`}
            onclick={() => currentSet = setIndex}
          ></button>
        {/each}
      </div>
    </div>
  </div>
</section>

<style>
  /* HERO SECTION STYLES */
  .hero-section {
    position: relative;
    background: linear-gradient(135deg, #eb9ec4ff 0%, #ffe0f0 20%, #ffd1e8 40%, #ffffff 70%, #ffd1e8 100%);
  }

  /* Floating stacked cards */
  .glass-card {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6));
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 12px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  .glass-card:hover {
    transform: translateY(-3px);
    transition: 0.3s ease;
    box-shadow: 0 12px 25px rgba(0, 0, 0, 0.25);
  }

  /* EVENT CARDS SECTION STYLES */
  @keyframes float {
    0%, 100% { 
      transform: translate(-50%, -50%) translateY(0px) rotate(0deg); 
    }
    25% { 
      transform: translate(-50%, -50%) translateY(-10px) rotate(2deg); 
    }
    50% { 
      transform: translate(-50%, -50%) translateY(-5px) rotate(-1deg); 
    }
    75% { 
      transform: translate(-50%, -50%) translateY(-15px) rotate(1deg); 
    }
  }

  .animate-float {
    animation: float 4s ease-in-out infinite;
  }

  .event-card {
    backdrop-filter: blur(10px);
  }

  /* Responsive card sizing - Mobile optimized overlapping */
  .card-image {
    /* Mobile: smaller overlapping cards */
    height: 240px; 
    width: 140px;
  }

  /* Small mobile */
  @media (min-width: 480px) {
    .card-image {
      height: 260px; 
      width: 150px;
    }
  }

  /* Tablet and up */
  @media (min-width: 640px) {
    .card-image {
      height: 380px; 
      width: 220px;
    }
  }

  /* Desktop */
  @media (min-width: 1024px) {
    .card-image {
      height: 540px; 
      width: 314px;
    }
  }

  /* Mobile-specific overlapping adjustments */
  @media (max-width: 639px) {
    .event-card:nth-child(1) {
      transform: rotate(-8deg) translateX(-40px) !important;
    }
    .event-card:nth-child(2) {
      transform: rotate(2deg) translateX(0px) !important;
      z-index: 25 !important;
    }
    .event-card:nth-child(3) {
      transform: rotate(6deg) translateX(40px) !important;
    }
  }

  /* Tablet overlapping adjustments */
  @media (min-width: 640px) and (max-width: 1023px) {
    .event-card:nth-child(1) {
      transform: rotate(-8deg) translateX(-50px) !important;
    }
    .event-card:nth-child(2) {
      transform: rotate(2deg) translateX(0px) !important;
      z-index: 25 !important;
    }
    .event-card:nth-child(3) {
      transform: rotate(6deg) translateX(50px) !important;
    }
  }

  /* Show floating icons on mobile too, but smaller */
  @media (max-width: 639px) {
    .floating-icon {
      opacity: 0.8;
    }
  }

  /* Show some icons on tablet */
  @media (min-width: 640px) and (max-width: 1023px) {
    .floating-icon:nth-child(n+5) {
      display: none;
    }
  }

  /* Reduce float animation intensity on mobile */
  @media (max-width: 639px) {
    @keyframes float {
      0%, 100% { 
        transform: translate(-50%, -50%) translateY(0px) rotate(0deg); 
      }
      25% { 
        transform: translate(-50%, -50%) translateY(-5px) rotate(1deg); 
      }
      50% { 
        transform: translate(-50%, -50%) translateY(-2px) rotate(-0.5deg); 
      }
      75% { 
        transform: translate(-50%, -50%) translateY(-7px) rotate(0.5deg); 
      }
    }
  }
</style>