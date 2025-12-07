<script>
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';

	let searchQuery = '';
	let showModal = false;

	let openShowAttendeeList = false;
	let admins = [
		{
			id: 1,
			name: 'Anonymous',
			email: 'johnmedoc23@gmail.com',
			role: 'Creator',
			dateJoined: 'Sep 21',
			avatarColor: 'bg-pink-300'
		},
		{
			id: 2,
			name: 'John Odoemenem',
			email: 'johnmedoc23@gmail.com',
			role: 'Manager',
			dateJoined: 'Sep 21',
			avatarColor: 'bg-pink-300'
		}
	];

	const roleColor = {
		Creator: 'bg-green-100 text-green-700',
		Manager: 'bg-yellow-100 text-yellow-700'
	};
</script>

<div>
	<div class="">
		<div class="mb-3 flex flex-col justify-between gap-2 md:flex-row md:items-center">
			<span>
				<span class="flex items-center gap-1">
					<h4 class="text-lg font-medium">Admins</h4>
					<p
						class="hidden h-[22px] w-[22px] items-center justify-center rounded-full border border-black bg-[#EBECED] lg:flex"
					>
						{admins?.length}
					</p>
				</span>
				<p class="text-sm text-[#737577]">
					Admins have full access to the calendar and can approve events.
				</p>
			</span>

			<button
				class="flex w-full justify-center items-center gap-1 rounded-md bg-[#EBECED] px-3 py-2 text-xs font-medium text-[#616265] transition-colors hover:bg-gray-200 sm:w-fit md:text-sm"
			>
				<img src="/profile-add-2.svg" alt="" class="h-4 w-4" />
				Add Admin
			</button>
		</div>
		<div class="mb-4 flex items-center gap-3">
			<div class="relative w-full">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search"
					class="h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none"
				/>
				<span class="absolute top-2.5 left-3 text-gray-400">
					<img src="/search-favorite.png" alt="search icon" class="h-5 w-5" />
				</span>
				<span class="absolute top-2.5 right-0 border-l px-4 py-1.5 text-gray-400">
					<img src="/search-download.svg" alt="" class="h-4 w-4" />
				</span>
			</div>
			<button
				class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:hidden md:text-sm"
			>
				<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
				Filter
				<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
			</button>
		</div>

		<div class="mb-4">
			<div class="mb-3 flex items-center justify-between">
				<button
					class="hidden flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:flex md:text-sm"
				>
					<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
					Filter
					<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
				</button>
				<div class="flex items-center gap-3">
					<button
						class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
					>
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
						All Admin
						<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
					</button>
					<button
						class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
					>
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
						Recently Joined
						<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
					</button>
				</div>
			</div>

			{#if admins?.length > 0}
				<div class="" use:clickOutside={() => (showModal = false)}>
					<div class="flex flex-col rounded-md bg-[#FDFDFD] px-3">
						{#each admins as admin}
							<div
								class="flex items-center justify-between rounded-md border-b py-3 last:border-b-0"
							>
								<div class="flex items-start gap-2">
									<img src="/face-1.svg" alt="profile icon" class="h-6 w-6" />
									<div class="flex flex-col items-start gap-1 lg:flex-row lg:items-center">
										<span class="flex items-center gap-1">
											<p class="font-medium">{admin.name}</p>
											<span class="h-2 w-2 rounded-full bg-[#EAAB26]"></span>
										</span>
										<p class="text-sm text-gray-500">{admin.email}</p>
									</div>
									<div
										class="hidden items-center justify-center rounded-full px-2 py-1 text-xs {admin.role ===
										'Creator'
											? 'bg-[#E3F4E1] text-[#3CBD2C]'
											: 'bg-[#F8EFDD] text-[#D69712]'} lg:flex"
									>
										{admin.role}
									</div>
								</div>
								<div class="flex flex-col items-center gap-1 lg:flex-row lg:justify-between">
									<div
										class="flex items-center justify-center rounded-full px-2 py-1 text-xs {admin.role ===
										'Creator'
											? 'bg-[#E3F4E1] text-[#3CBD2C]'
											: 'bg-[#F8EFDD] text-[#D69712]'} lg:hidden"
									>
										{admin.role}
									</div>
									<div class="flex flex-row gap-1 md:flex-col md:items-center">
										<span class="mr-3 text-gray-400">{admin.dateJoined}</span>

										<img src="/edit-icon.svg" alt="edit icon" class="h-4 w-4" />
									</div>
								</div>
							</div>
						{/each}
					</div>
					<!-- <AttendeeDetailModal bind:open={showModal} /> -->
				</div>
			{:else}
				<div class="flex h-50 flex-col items-center justify-center">
					<img src="/profile-2user.svg" alt="" />
					<p class="text-[#646568]">No Guests Found</p>
					<p class="text-sm text-gray-500">Try searching for something else</p>
				</div>
			{/if}
		</div>
	</div>
</div>
