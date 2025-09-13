<script>
  import { onMount, onDestroy } from 'svelte';
  
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
    { icon: "/icon4.png", delay: 0, x: -2, y: 60 },      // Maps app - top left area
    { icon: "/icon6.png", delay: 1, x: 3, y: 80 },       // Avatar with mustache - left middle
    { icon: "/icon3.png", delay: 2, x: 50, y: 105 },      // Weather app - bottom center
    { icon: "/icon5.png", delay: 0.5, x: 60, y: 10 },    // Avatar with headwear - top right
    { icon: "/icon1.png", delay: 1.5, x: 93, y: 60 },    // Music app - right side
    { icon: "/icon2.png", delay: 2.5, x: 93, y: 75 }     // Photos app - bottom right
  ];
</script>

<section class="px-4 sm:px-6 py-8 sm:py-16 mt-16 sm:mt-20 lg:mt-24 relative bg-white">
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

  /* Responsive card sizing */
  .card-image {
    /* Mobile: smaller cards */
    height: 280px; 
    width: 160px;
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

  :global(body) {
    background: white !important;
  }
</style>