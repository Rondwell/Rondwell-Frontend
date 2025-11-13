<script>
	import { goto } from '$app/navigation';
	import { activeSubItem, showSubMenu, subMenuItems } from '$lib/stores/uiStore';
	import { clickOutside } from '$lib/utils/constant';
	import ProfileMenu from './ProfileMenu.svelte';

	let showMenu = false;

	function goHome() {
		goto('/overview');
		showSubMenu.set(false);
		subMenuItems.set([]);
		activeSubItem.set('');
	}
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
		<ProfileMenu bind:showMenu className="absolute top-20 left-5 md:hidden" />
	</div>
	<button on:click={goHome}>
		<img src="/logo.svg" alt="Rondwell Logo" class="h-8 w-auto" />
	</button>
	<img src="/notification.svg" alt="" />
</div>
