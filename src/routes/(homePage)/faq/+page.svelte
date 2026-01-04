<script>
	import Accordion from './components/Accordion.svelte';
</script>

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



