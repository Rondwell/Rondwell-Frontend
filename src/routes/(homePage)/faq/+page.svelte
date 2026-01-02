<script>
    import Accordion from "./components/Accordion.svelte";
</script>


<section>
    <div class="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8 lg:py-10">
        <div class="mb-8 md:mb-12 flex flex-col items-center gap-4 md:gap-6 text-center">
            <img src="/logo.svg" alt="" class="h-6 md:h-8" />
            <h1 class="text-2xl md:text-3xl lg:text-4xl font-bold">Frequently asked questions</h1>
        </div>
        <Accordion />
    </div>
</section>