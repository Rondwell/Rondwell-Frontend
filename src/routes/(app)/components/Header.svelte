<script>
	import { clickOutside } from '$lib/utils/constant';
	import ProfileMenu from './ProfileMenu.svelte';

	let showMenu = false;
</script>

<div class="mb-3 flex items-center justify-between px-4 py-3 md:hidden">
	<!-- <img src="/face-1.svg" alt="" /> -->
	<div use:clickOutside={() => (showMenu = false)}>
		<button
			on:click={() => {
				showMenu = !showMenu;
			}}
		>
			<img src="/face-1.svg" alt="" />
		</button>
		<ProfileMenu bind:showMenu className="absolute top-20 left-2 md:hidden" />
	</div>
	<a href="/overview">
		<img src="/logo.svg" alt="Rondwell Logo" class="h-8 w-auto" />
	</a>
	<img src="/notification.svg" alt="" />
</div>
