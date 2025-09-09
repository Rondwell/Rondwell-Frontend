<!-- Hero.svelte -->
<script>
  import Button from "$lib/components/Button.svelte";

  let avatars = [
    "/favicon.png",
    "/favicon.png",
    "/favicon.png",
    "/favicon.png"
  ];

  let albums = [
    "/flower.png",
    "/flower.png",
    "/flower.png",
    "/flower.png"
  ];
</script>

<section class="px-6 py-20">
  <div class="max-w-7xl mx-auto">
    <div class="grid lg:grid-cols-2 gap-12 items-center">
      <!-- LEFT -->
      <div class="space-y-8">
        <div class="space-y-4">
          <h1 class="text-5xl lg:text-6xl text-[#000000] font-bold leading-tight">
            Organize
            <span
              class="bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] bg-clip-text text-transparent"
            >
              Unforgettable
            </span>
            <br />
            <span
              class="bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] bg-clip-text text-transparent"
            >
              Events.
            </span>
          </h1>

          <p
            class="text-[22px] md:text-[24px] leading-[40px] text-[#686768] max-w-[566px] text-left"
          >
            Rondwell brings organizers, attendees, exhibitors and vendors
            together to create unforgettable experiences.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-6">
          <Button
            class="bg-[#333537]  text-white  text-[20px] text-center h-[60px] w-[300px] px-8 py-3 rounded-[13px] transition-colors duration-200 hover:bg-gray-900 hover:text-white"
          >
            ✨ Create Event with AI
          </Button>
        </div>
      </div>

      <!-- RIGHT: stacked gradient cards -->
      <div class="relative flex justify-center lg:justify-end">
        <div class="gradient-border">
          <div class="card-inner" role="group" aria-label="event-cards">
            <!-- Top card -->
            <div class="event-card top-card">
              <div class="flex items-center justify-between">
                <span class="attending-label">+250 Attending</span>

                <div class="avatar-row" aria-hidden="true">
                  {#each avatars as avatar, i}
                    <img
                      src={avatar}
                      alt={"attendee-" + i}
                      class="avatar-small"
                      style="margin-left: {i === 0 ? '0px' : '-10px'}"
                    />
                  {/each}
                </div>
              </div>

              <div class="mt-4 flex justify-center">
                <button class="rsvp-pill">Can’t wait to be there! — Sarah</button>
              </div>
            </div>

            <!-- Bottom card -->
            <div class="event-card bottom-card">
              <p class="card-title">Shared Albums and Files</p>

              <div class="albums-grid">
                {#each albums.slice(0, 3) as img, idx}
                  <img src={img} alt={"album-" + idx} class="album-thumb" />
                {/each}

                {#if albums.length > 3}
                  <div class="album-thumb more-overlay">
                    +{albums.length - 3}
                  </div>
                {/if}
              </div>

              <div class="mt-4 flex justify-end">
                <button class="addphotos-pill">Add Photos</button>
              </div>
            </div>
          </div>

          <!-- Card shadow stack -->
          <div class="card-stacks" aria-hidden="true">
            <span class="stack s1"></span>
            <span class="stack s2"></span>
            <span class="stack s3"></span>
            <span class="stack s4"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  /* Gradient border glow */
  .gradient-border {
    position: relative;
    padding: 8px;
    border-radius: 20px;
    background: conic-gradient(
      from 0deg,
      #ff83b8,
      #a18cd1,
      #66d1d8,
      #ffb86b,
      #ff83b8
    );
    background-size: 300% 300%;
    animation: gradientShift 7.5s linear infinite;
    z-index: 0;
  }
  .gradient-border::before {
    content: "";
    position: absolute;
    inset: -14px;
    z-index: -2;
    border-radius: 24px;
    background: conic-gradient(
      from 0deg,
      #ff83b8,
      #a18cd1,
      #66d1d8,
      #ffb86b,
      #ff83b8
    );
    background-size: 300% 300%;
    filter: blur(18px) saturate(1.05) opacity(0.55);
    animation: gradientShift 7.5s linear infinite;
  }

  /* Inner glassy card container */
  .card-inner {
    position: relative;
    z-index: 1;
    border-radius: 14px;
    padding: 20px;
    width: 330px;
    backdrop-filter: blur(10px);
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.04),
      rgba(6, 7, 11, 0.25)
    );
    box-shadow: 0 10px 40px rgba(5, 6, 12, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.02);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Card styles */
  .event-card {
    border-radius: 12px;
    padding: 14px;
    color: #fff;
    box-shadow: 0 8px 24px rgba(12, 8, 18, 0.45);
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .event-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 32px rgba(12, 8, 18, 0.55);
  }

  /* Top card */
  .top-card {
    background: linear-gradient(135deg, #27404f 0%, #3b4756 45%, #6ab3a9 100%);
    min-height: 120px;
    display: flex;
    flex-direction: column;
  }
  .attending-label {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.95);
  }
  .avatar-row {
    display: flex;
    align-items: center;
  }
  .avatar-small {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 2.5px solid white;
    object-fit: cover;
    box-shadow: 0 6px 14px rgba(8, 6, 12, 0.45);
  }
  .rsvp-pill {
    border: none;
    padding: 8px 14px;
    border-radius: 999px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    background: linear-gradient(90deg, #ffdff3 0%, #d9b8ff 100%);
    color: #221b2b;
    box-shadow: 0 8px 20px rgba(214, 150, 240, 0.25);
    transition: transform 0.15s ease;
  }
  .rsvp-pill:hover {
    transform: translateY(-2px);
  }

  /* Bottom card */
  .bottom-card {
    background: linear-gradient(135deg, #27404f 0%, #3b4756 45%, #6ab3a9 100%);
    min-height: 120px;
    display: flex;
    flex-direction: column;
  }
  .card-title {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.95);
  }
  .albums-grid {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .album-thumb {
    width: 76px;
    height: 56px;
    border-radius: 8px;
    object-fit: cover;
    box-shadow: 0 8px 18px rgba(8, 8, 12, 0.35);
  }
  .more-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.35);
    color: white;
    font-weight: 700;
    font-size: 14px;
  }
  .addphotos-pill {
    border: none;
    padding: 8px 14px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    background: linear-gradient(90deg, #6b7b86 0%, #7f98a0 100%);
    color: #fff;
    box-shadow: 0 8px 20px rgba(11, 16, 28, 0.18);
    transition: transform 0.15s ease;
  }
  .addphotos-pill:hover {
    transform: translateY(-2px);
  }

  /* Stacked shadow layers */
  .card-stacks {
    position: absolute;
    right: 10px;
    bottom: -34px;
    z-index: -1;
    width: 320px;
    height: 64px;
    display: flex;
    justify-content: center;
  }
  .stack {
    width: 100%;
    height: 12px;
    border-radius: 12px;
    margin-top: 6px;
    filter: blur(8px);
    opacity: 0.7;
  }
  .s1 {
    background: linear-gradient(
      90deg,
      rgba(255, 122, 182, 0.12),
      rgba(161, 140, 209, 0.12)
    );
    transform: translateY(12px);
  }
  .s2 {
    background: linear-gradient(
      90deg,
      rgba(161, 140, 209, 0.1),
      rgba(102, 209, 216, 0.08)
    );
    transform: translateY(8px);
  }
  .s3 {
    background: linear-gradient(
      90deg,
      rgba(102, 209, 216, 0.08),
      rgba(255, 184, 107, 0.07)
    );
    transform: translateY(4px);
  }
  .s4 {
    background: linear-gradient(
      90deg,
      rgba(255, 184, 107, 0.06),
      rgba(255, 122, 182, 0.05)
    );
  }

  /* Animations */
  .top-card {
    animation: floaty 6s ease-in-out infinite;
    animation-delay: 0s;
  }
  .bottom-card {
    animation: floaty 6s ease-in-out infinite;
    animation-delay: 0.3s;
  }
  @keyframes floaty {
    0% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-6px);
    }
    100% {
      transform: translateY(0px);
    }
  }
  @keyframes gradientShift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .card-inner {
      width: 300px;
    }
    .gradient-border::before {
      inset: -10px;
      filter: blur(12px) opacity(0.45);
    }
  }

  /* Custom bounce animation (slower + smoother than Tailwind’s default) */
  @keyframes bounce-slow {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(8px);
    }
  }
  .animate-bounce-slow {
    animation: bounce-slow 2s infinite;
  }
</style>
<!-- TRUSTED SECTION -->
<!-- TRUSTED SECTION -->
<section class="py-16">
  <div class="flex flex-col items-center text-center relative">
    
    <!-- Trusted Badge -->
    <div
      class="flex items-center justify-center gap-2 w-[320px] h-[48px] rounded-full bg-white/30 border border-white/50 drop-shadow-lg relative z-30"
    >
      <span class="text-pink-500 text-lg">💜</span>
      <p class="text-sm font-medium text-gray-900">
        Trusted by over <span class="font-semibold">100,000</span> people worldwide.
      </p>
    </div>

    <!-- See Latest Events Button (pushed deeper under Trusted badge) -->
    <button
      class="-mt-10 w-[228px] h-[77px] rounded-[12.73px] 
             bg-gradient-to-b from-white/0 to-white 
             border border-white/50 
             drop-shadow-lg shadow-inner 
             backdrop-blur-md 
             flex items-center justify-center
             text-gray-800 font-medium hover:bg-white/80 transition relative z-20"
    >
        <span class="mb-[-30px] text-sm text-[#3D3D4E] block">See Latest Events</span>
    </button>

    <!-- Down Arrow (half inside button) -->
  <!-- Down Arrow -->
<div 
  class="-mt-3 w-[57px] h-[57px] flex items-center justify-center 
         rounded-full bg-white drop-shadow-lg 
         border border-white/50 animate-bounce-slow relative z-10"
>
  <svg xmlns="http://www.w3.org/2000/svg" 
    class="w-9 h-9 text-gray-800" fill="none"
    viewBox="0 0 26 26" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M19 9l-7 7-7-7" />
  </svg>
</div>


</section>
