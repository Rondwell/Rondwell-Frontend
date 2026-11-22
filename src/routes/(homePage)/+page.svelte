<script>
	import Header from './home/Header.svelte';
	import Hero from './home/Hero.svelte';
	import Features from './home/Features.svelte';
	import EventList from './home/EventList.svelte';
	import EventSlide from './home/EventSlide.svelte';
</script>

<svelte:head>
	<title>Rondwell — Create, Manage & Grow Unforgettable Events</title>
	<meta name="description" content="Rondwell is the all-in-one event platform for organizers. Create events, sell tickets, manage check-ins, engage attendees with community chat, and track everything with real-time analytics. Free to start." />

	<!-- Open Graph -->
	<meta property="og:title" content="Rondwell — Create, Manage & Grow Unforgettable Events" />
	<meta property="og:description" content="The all-in-one event platform. Create events, sell tickets, manage check-ins, engage attendees, and track analytics — all in one place. Free to start." />
	<meta property="og:image" content="https://res.cloudinary.com/dksfuytfd/image/upload/v1747893120/Rodwell_uedn7l.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:url" content="https://rondwell.com" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Rondwell" />
	<meta property="og:locale" content="en_US" />

	<!-- Twitter / X -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Rondwell — Create, Manage & Grow Unforgettable Events" />
	<meta name="twitter:description" content="The all-in-one event platform. Create events, sell tickets, manage check-ins, engage attendees, and track analytics. Free to start." />
	<meta name="twitter:image" content="https://res.cloudinary.com/dksfuytfd/image/upload/v1747893120/Rodwell_uedn7l.png" />
	<meta name="twitter:site" content="@rondwellhq" />

	<link rel="canonical" href="https://rondwell.com" />

	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@type": "WebApplication",
		"name": "Rondwell",
		"url": "https://rondwell.com",
		"description": "All-in-one event management platform with ticketing, check-in, community engagement, and real-time analytics.",
		"applicationCategory": "EventManagement",
		"operatingSystem": "Web",
		"offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "description": "Free plan available" },
		"creator": { "@type": "Organization", "name": "Rondwell", "url": "https://rondwell.com" }
	})}</script>`}
</svelte:head>

<main class="relative w-full">
	<div class="hero-section">
		<div class="hero-mesh" aria-hidden="true"></div>
		<Header />

		<!-- Landing Section -->
		<Hero />

		<!-- Event Card Section -->
		<EventSlide />
	</div>

	<!-- Features Section -->
	<Features />

	<!-- Events Section -->
	<EventList />
</main>

<style>
	.hero-section {
		position: relative;
		overflow-x: clip;
		background: linear-gradient(180deg, #fbdbe7 0%, #fef4f8 46%, #ffffff 100%);
	}

	.hero-mesh {
		pointer-events: none;
		position: absolute;
		inset: 0;
		background:
			radial-gradient(60% 42% at 15% 12%, rgba(219, 62, 108, 0.16) 0%, rgba(219, 62, 108, 0) 70%),
			radial-gradient(52% 40% at 88% 18%, rgba(171, 70, 221, 0.16) 0%, rgba(171, 70, 221, 0) 72%),
			radial-gradient(65% 45% at 50% 62%, rgba(226, 216, 255, 0.45) 0%, rgba(255, 255, 255, 0) 75%);
		transform: translateZ(0);
	}
</style>
