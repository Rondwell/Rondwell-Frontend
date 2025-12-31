<script lang="ts">
	export let pageName: string;
	export let pageText: string;
	export let link: string;
</script>

<a href={link} class="flex w-full items-center gap-2 rounded-[12.75px] bg-[#FDFDFD] p-2 ">
	  <slot />
<h2 class="merriweather-sans text-sm font-medium inline-flex flex-col  items-start gap-1">
    {pageName}

{#if pageText}
    <span class="text-xs font-normal text-[#B8BABA]">{pageText}</span>
{/if}
</h2>
</a>