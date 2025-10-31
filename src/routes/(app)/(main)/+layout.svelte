<script>
	import Header from '../components/Header.svelte';
	import Sidebar from '../components/Sidebar.svelte';
	import SideMenu from '../components/SideMenu.svelte';

	const themes = ['linear-gradient(180deg, #d1e8f5 0%, #EAF2F5 17%, #f4f5f6 35%)'];

	let selectedTheme = themes[0];
</script>

<div
	class="relative flex min-h-screen text-sm font-medium"
	style="background-image: {selectedTheme};"
>
	<!-- Sidebar -->
	<div class="relative md:min-w-[117px]">
		<Sidebar background_color="#f4f5f6" />
		<!-- <SideMenu /> -->
	</div>
	<main class="relative mb-[106px] flex min-h-screen w-full flex-col p-3 md:mb-0 md:p-5">
		<Header />
		<div class="bg flex w-full flex-1 p-3 md:p-6 lg:p-8">
			<slot class="h-full w-full flex-1" />
		</div>
	</main>
</div>

<style>
	.bg {
		background: rgba(255, 255, 255, 0.08);
		box-shadow:
			0px 0px 0px 1px rgba(64, 87, 109, 0.04),
			0px 6px 20px -4px rgba(64, 87, 109, 0.3);
		border-radius: 12px;
	}
</style>
