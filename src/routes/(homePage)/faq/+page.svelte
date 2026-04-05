<script>
	import Accordion from './components/Accordion.svelte';
</script>

<svelte:head>
	<title>FAQ | Rondwell</title>
	<meta name="description" content="Frequently asked questions about Rondwell. Find answers about event creation, ticketing, payments, and more." />
	<meta property="og:title" content="FAQ | Rondwell" />
	<meta property="og:description" content="Frequently asked questions about Rondwell. Find answers about event creation, ticketing, payments, and more." />
	<meta property="og:url" content="https://rondwell.com/faq" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Rondwell" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="FAQ | Rondwell" />
	<meta name="twitter:description" content="Frequently asked questions about Rondwell. Find answers about event creation, ticketing, payments, and more." />
	<meta name="twitter:site" content="@rondwellhq" />
	<link rel="canonical" href="https://rondwell.com/faq" />
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
  <div class="mb-8 sm:mb-12 flex flex-col items-center gap-4 sm:gap-6 text-center">
    <img
      src="/logo.svg"
      alt="Company logo"
      class="h-6 sm:h-8"
    />

    <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
      Frequently asked questions
    </h1>
  </div>

  <Accordion />
</div>



