<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';

	export let showMenu = false;

	let activeProfile = {
		name: 'Shivani Chauhan',
		email: 'ShivaniChauhan@gmail.com',
		role: 'Organizer',
		roleColor: 'text-purple-500'
	};

	let profiles = [
		{
			img: '/face.svg',
			name: 'Innocent Tamunosiki',
			email: 'InnocentTamunosiki@gmail.com',
			role: 'Vendor',
			roleColor: '#146AEB',
			roleBgColor: '#E2E8FC'
		},
		{
			img: '/face-1.svg',
			name: 'Edima Athansius',
			email: 'EdimaAthansius@gmail.com',
			role: 'Exhibitor',
			roleColor: '#3CBD2C',
			roleBgColor: '#E3F4E1'
		},
		{
			img: '/face-2.svg',
			name: 'Emabong Ekpenyong',
			email: 'Emabong Ekpenyong@gmail.com',
			role: 'Speaker',
			roleColor: '#AB46DD',
			roleBgColor: 'rgba(171, 70, 221, 0.1)'
		}
	];

	let showAll = false;

	$: displayedProfiles = showAll ? profiles : profiles.slice(0, 2);

	function onClose() {
		showMenu = false;
	}
</script>

{#if showMenu}
	<div
		class="bg fixed bottom-10 left-30 z-50 hidden w-90 rounded-xl p-6 text-sm md:block"
		use:clickOutside={onClose}
	>
		<!-- Active Profile -->
		<div class="flex items-center space-x-3">
			<img src="/face-1.svg" alt="profile icon" class="h-10 w-10" />
			<div>
				<div class="flex items-center justify-between gap-2">
					<div class="font-semibold">{activeProfile.name}</div>
					<span
						class="ml-auto flex items-center gap-1 bg-[#EFEBFF] text-xs font-semibold {activeProfile.roleColor} rounded-md px-2 py-1"
					>
						<Icon icon="mdi:star" />
						{activeProfile.role}
					</span>
				</div>
				<div class="text-sm font-light text-gray-500">{activeProfile.email}</div>
			</div>
		</div>

		<!-- Switchable Profiles -->
		<div class="mt-4 space-y-2 rounded-md bg-[#FFFFFF] p-2 shadow-sm">
			{#each displayedProfiles as profile}
				<div class="selected flex cursor-pointer items-center p-2 transition">
					<!-- <div class="flex items-center justify-center rounded-full">
						<img src={profile.img} alt="profile icon" class="h-8 w-8" />
					</div> -->

					<div class="relative inline-flex items-center justify-center">
						<!-- Rotating arrow ring -->
						<img src="/arrow-round.svg" alt="arrow" class="animate-spin-once h-12 w-12" />

						<!-- Profile image -->
						<img src={profile.img} alt="profile icon" class="absolute z-10 h-8 w-8 rounded-full" />
					</div>

					<div class="ml-3">
						<div class="flex items-center justify-between gap-2">
							<div class="text-sm font-medium">{profile.name}</div>
							<span
								class="ml-auto rounded-md px-2 py-1 text-xs font-semibold"
								style="background-color: {profile.roleBgColor}; color: {profile.roleColor}"
							>
								{profile.role}
							</span>
						</div>
						<div class="mt-1 text-xs font-light text-gray-500">{profile.email}</div>
					</div>
				</div>
			{/each}
			<div class="mt-3 border-t pt-3">
				<button
					on:click={() => (showAll = !showAll)}
					class="flex h-[36px] w-full items-center justify-center gap-2 rounded-sm bg-[#EBECED] text-center text-sm"
				>
					<img src="/profile-2.svg" alt="icon" />
					{showAll ? 'View less' : 'View all profile'}
				</button>
			</div>
		</div>

		<!-- Options -->
		<div class="mt-4 space-y-3">
			<a href="/settings" on:click={onClose} class="flex cursor-pointer items-center gap-2">
				<div
					class="flex h-[36px] w-[36px] cursor-pointer items-center rounded-full bg-[#E2E4E5] p-2"
				>
					<svg
						width="18"
						height="18"
						viewBox="0 0 18 18"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M9.12187 8.1525C9.04687 8.145 8.95687 8.145 8.87437 8.1525C7.08937 8.0925 5.67188 6.63 5.67188 4.83C5.67187 2.9925 7.15688 1.5 9.00188 1.5C10.8394 1.5 12.3319 2.9925 12.3319 4.83C12.3244 6.63 10.9069 8.0925 9.12187 8.1525Z"
							stroke="#2A2D32"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M5.36906 10.92C3.55406 12.135 3.55406 14.115 5.36906 15.3225C7.43156 16.7025 10.8141 16.7025 12.8766 15.3225C14.6916 14.1075 14.6916 12.1275 12.8766 10.92C10.8216 9.5475 7.43906 9.5475 5.36906 10.92Z"
							stroke="#2A2D32"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>

				<span>View profile</span>
			</a>

			<a href="/settings" on:click={onClose} class="flex cursor-pointer items-center gap-2">
				<div
					class="flex h-[36px] w-[36px] cursor-pointer items-center rounded-full bg-[#E2E4E5] p-2"
				>
					<svg
						width="18"
						height="18"
						viewBox="0 0 18 18"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M2.25 6.83594V11.1634C2.25 12.7534 2.25 12.7534 3.75 13.7659L7.875 16.1509C8.4975 16.5109 9.51 16.5109 10.125 16.1509L14.25 13.7659C15.75 12.7534 15.75 12.7534 15.75 11.1709V6.83594C15.75 5.25344 15.75 5.25344 14.25 4.24094L10.125 1.85594C9.51 1.49594 8.4975 1.49594 7.875 1.85594L3.75 4.24094C2.25 5.25344 2.25 5.25344 2.25 6.83594Z"
							stroke="#2A2D32"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z"
							stroke="#2A2D32"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>
				<span>Settings</span>
			</a>

			<div class="flex cursor-pointer items-center gap-2">
				<div
					class="flex h-[36px] w-[36px] cursor-pointer items-center rounded-full bg-[#E2E4E5] p-2"
				>
					<svg
						width="18"
						height="18"
						viewBox="0 0 18 18"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M13.5 14.1453H12.93C12.33 14.1453 11.76 14.3778 11.34 14.7978L10.0575 16.0653C9.4725 16.6428 8.52 16.6428 7.935 16.0653L6.6525 14.7978C6.2325 14.3778 5.655 14.1453 5.0625 14.1453H4.5C3.255 14.1453 2.25 13.1478 2.25 11.9178V3.73529C2.25 2.50529 3.255 1.50781 4.5 1.50781H13.5C14.745 1.50781 15.75 2.50529 15.75 3.73529V11.9178C15.75 13.1403 14.745 14.1453 13.5 14.1453Z"
							stroke="#2A2D32"
							stroke-width="1.5"
							stroke-miterlimit="10"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M5.25 6.86911C5.25 6.17161 5.82 5.60156 6.5175 5.60156C7.215 5.60156 7.785 6.17161 7.785 6.86911C7.785 8.27911 5.7825 8.42911 5.34 9.77161C5.25 10.0491 5.4825 10.3266 5.775 10.3266H7.785"
							stroke="#2A2D32"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M12.0303 10.3206V6.03816C12.0303 5.84316 11.9028 5.67062 11.7153 5.61812C11.5278 5.56562 11.3253 5.64062 11.2203 5.80562C10.6803 6.67562 10.0953 7.66563 9.58531 8.53563C9.50281 8.67813 9.50281 8.86563 9.58531 9.00813C9.66781 9.15063 9.82531 9.24059 9.99781 9.24059H12.7503"
							stroke="#2A2D32"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>
				<span>Support</span>
			</div>
		</div>

		<!-- Log out -->
		<div class="mt-4 border-t pt-4">
			<div
				class="flex cursor-pointer items-center space-x-3 rounded p-2 text-sm text-red-600 hover:bg-red-50"
			>
				<svg
					width="18"
					height="18"
					viewBox="0 0 18 18"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M6.67578 5.66969C6.90828 2.96969 8.29578 1.86719 11.3333 1.86719H11.4308C14.7833 1.86719 16.1258 3.20969 16.1258 6.56219V11.4522C16.1258 14.8047 14.7833 16.1472 11.4308 16.1472H11.3333C8.31828 16.1472 6.93078 15.0597 6.68328 12.4047"
						stroke="#FF0004"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M11.2498 9H2.71484"
						stroke="#FF0004"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M4.3875 6.48438L1.875 8.99688L4.3875 11.5094"
						stroke="#FF0004"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>

				<span>Log out</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.bg {
		background: #f4f5f6;
		box-shadow: 0px 0px 80px rgba(0, 0, 0, 0.08);
		border-radius: 8px;
	}

	.selected:hover {
		background: #f9f9f9;
		box-shadow: inset 0px 0px 0px 3px #ffffff;
		border-radius: 11px;
	}

	@keyframes spin-once {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(180deg);
		}
	}

	.animate-spin-once {
		animation: spin-once 1s ease-in-out 1;
	}
</style>
