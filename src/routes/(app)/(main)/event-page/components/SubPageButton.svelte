<script lang="ts">
	export let pageName: string;
	export let link: string;
</script>

<a href={link} class="flex w-full items-center gap-2 rounded-[12.75px] bg-[#FDFDFD] p-[6px] md:p-2">
	  <slot />
<h2 class="merriweather-sans text-xs md:text-sm font-medium inline-flex flex-col  items-start gap-1">
    {pageName}
</h2>
</a>