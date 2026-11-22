<script>
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import Toast from '$lib/components/Toast.svelte';
	import { syncRouteThemeColor } from '$lib/stores/themeColor';
	import '../app.css';

	$: if (browser && $page?.url?.pathname) {
		syncRouteThemeColor($page.url.pathname);
	}
</script>

<slot />
<Toast />
