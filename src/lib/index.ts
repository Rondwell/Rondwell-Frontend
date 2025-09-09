<script>
  import Header from "@/components/header.svelte";
  import HeroSection from "@/components/hero-section.svelte";
  import EventCards from "@/components/event-cards.svelte";
  import FeaturesSection from "@/components/features-section.svelte";
  import EventListings from "@/components/event-listings.svelte";
  import Footer from "@/components/footer.svelte";
</script>

<div class="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-orange-100 flex flex-col">
  <Header />
  <HeroSection />
  <EventCards />
  <FeaturesSection />
  <EventListings />
  <Footer />
</div>
