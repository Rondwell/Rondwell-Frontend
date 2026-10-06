<!--
	Full-viewport premium theme background (the Default theme's light-ray
	artwork, the brand themes' glows). Renders nothing for flat palettes.

	Rendered as a FIXED layer rather than a background on the page wrapper so
	it stays viewport-sized on long pages — a `background-size: cover` on a
	tall wrapper would stretch the artwork across the whole scroll height,
	and `background-attachment: fixed` is ignored by iOS Safari.

	Two ways to place it:
	 - default: make it the FIRST child of the themed wrapper. It has no
	   z-index, so it paints right after the wrapper's flat `bg` and before
	   every later POSITIONED sibling (the app layouts' sidebar/main are all
	   `relative`). Nothing about the surrounding stacking order changes.
	 - `behind`: for wrappers whose content is not positioned. The layer gets
	   `-z-10`, and the wrapper must have the `isolate` class so the layer sits
	   above the wrapper's background instead of disappearing behind it.
-->
<script lang="ts">
	import type { Color } from '$lib/utils/colors';

	export let theme: Color | null | undefined = null;
	export let behind = false;
</script>

{#if theme?.backdrop}
	<div
		aria-hidden="true"
		class="pointer-events-none fixed inset-0 {behind ? '-z-10' : ''}"
		style="background: {theme.backdrop};"
	></div>
{/if}
