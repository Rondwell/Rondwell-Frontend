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
		<div class="highlight highlight-1"></div>
		<div class="highlight highlight-2"></div>
		<div class="highlight highlight-3"></div>
		<div class="highlight highlight-4"></div>
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
		overflow: hidden;
		background:
			linear-gradient(0deg, rgba(251, 219, 231, 0.33), rgba(251, 219, 231, 0.33)), #ffffff;
	}

	/* highlight */
	.highlight {
		position: absolute;
		border-radius: 50%;
		z-index: 1;
	}

	/* Example highlight 1 */
	.highlight-1 {
		width: 693px;
		height: 662px;
		left: -60px;
		top: 58px;
		background: rgba(255, 117, 169, 0.55);
		filter: blur(189px);
	}

	/* Example highlight 2 */
	.highlight-2 {
		width: 547px;
		height: 549px;
		left: 892px;
		top: 58px;
		background: rgba(255, 195, 124, 0.44);
		filter: blur(189px);
	}

	.highlight-3 {
		width: 312px;
		height: 299px;
		left: 210px;
		top: 683px;
		background: #ff7eaf;
		filter: blur(189px);
	}

	.highlight-4 {
		width: 609px;
		height: 613px;
		left: 1044px;
		top: 817px;
		background: rgba(231, 126, 231, 0.66);
		filter: blur(189px);
	}
</style>
