<!-- Hero.svelte -->
<script>
  import Button from "$lib/components/Button.svelte";

  // Main hero images
  let heroImage1 = "hero1.png";
  let heroImage2 = "hero1.png";

  // Stack images (with gradient already applied)
  let stackImage1 = "stack1.png";
  let stackImage2 = "stack2.png"; 
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
            class="bg-[#333537] text-white text-[20px] text-center h-[60px] w-[300px] px-8 py-3 rounded-[13px] transition-colors duration-200 hover:bg-gray-900 hover:text-white"
          >
            ✨ Create Event with AI
          </Button>
        </div>
      </div>

      <!-- RIGHT -->
      <div class="relative flex justify-center lg:justify-end">
        <!-- Main gradient border container -->
        <div class="gradient-border-wrapper">
          <div class="gradient-border">
            <div class="images-container">
              <img
                src={heroImage1}
                alt="Event attendees"
                class="hero-image-main"
              />
              <img 
                src={heroImage2} 
                alt="Shared album" 
                class="hero-image-album" 
              />
            </div>
          </div>

          <!-- Stack layers as real images -->
          <div class="card-stacks">
            <img src={stackImage1} alt="Stack 1" class="stack-card s1" />
            <img src={stackImage2} alt="Stack 2" class="stack-card s2" />
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  /* Wrapper for the entire card system */
  .gradient-border-wrapper {
    position: relative;
    z-index: 10;
    display: inline-block;
  }

  /* Gradient border glow */
  .gradient-border {
    position: relative;
    padding: 4px;
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
    animation: gradientShift 7.5s linear infinite;
    z-index: 11;
  }
  .gradient-border::before {
    content: "";
    position: absolute;
    inset: -20px;
    z-index: -1;
    border-radius: 30px;
    background: conic-gradient(
      from 0deg,
      #ff83b8,
      #a18cd1,
      #66d1d8,
      #ffb86b,
      #ff83b8
    );
    background-size: 300% 300%;
    filter: blur(25px) saturate(1.2) opacity(0.8);
    animation: gradientShift 7.5s linear infinite;
  }

  /* Images container - WHITE background */
  .images-container {
    position: relative;
    z-index: 12;
    border-radius: 16px;
    padding: 20px;
    width: 330px;
    background: white;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Hero images */
  .hero-image-main,
  .hero-image-album {
    width: 290px;
    height: 180px;
    border-radius: 12px;
    object-fit: cover;
    box-shadow: 0 8px 24px rgba(8, 6, 12, 0.45);
    animation: floaty 6s ease-in-out infinite;
  }
  .hero-image-album {
    animation-delay: 0.3s;
  }

  /* Card stack container - sits BELOW main card */
  .card-stacks {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(-15px);
    width: 100%;
    max-width: 330px; /* Match images-container */
    z-index: 1;
    pointer-events: none;
  }

  /* Stack cards - now images */
  .stack-card {
    position: absolute;
    width: 100%;
    border-radius: 18px;
    left: 50%;
    transform: translateX(-50%);
    object-fit: cover;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  }

  .s1 { top: 0; z-index: 2; }
  .s2 { top: 20px; z-index: 1; }

  /* Animations */
  @keyframes floaty {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
    100% { transform: translateY(0px); }
  }

  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .images-container {
      width: 300px;
    }
    .gradient-border::before {
      inset: -15px;
      filter: blur(20px) opacity(0.6);
    }
    .stack-card {
      width: 100%;
    }
  }
</style>
