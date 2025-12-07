<script>
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';

	let searchQuery = '';
	let showFilter = false;

	// Moderation Queue items
	let moderationQueue = [
		{
			id: 1,
			message: 'This speaker is spreading lies about...',
			user: 'Cole Palmer',
			room: 'Main Stage Chat',
			tag: 'Offensive',
			tagColor: 'bg-red-100 text-red-600',
			statusColor: 'bg-green-100'
		},
		{
			id: 2,
			message: 'This event is a total waste of time...',
			user: 'Pedro Neto',
			room: 'Workshop Room A',
			tag: 'Spam',
			tagColor: 'bg-orange-100 text-orange-600',
			statusColor: 'bg-yellow-100'
		},
		{
			id: 3,
			message: "You're an idiot if you believe that...",
			user: 'Joao Pedro',
			room: 'Event-Wide Forum',
			tag: 'Irrelevant',
			tagColor: 'bg-gray-200 text-gray-700',
			statusColor: 'bg-blue-100'
		}
	];

	// Predefined Chat Rooms
	let chatRooms = [
		{ id: 1, name: 'General Chat', description: 'Open discussion for all topics' },
		{ id: 2, name: 'Help Desk', description: 'Get assistance during event' },
		{ id: 3, name: 'Networking Hub', description: 'Connect with other attendees' }
	];

	// Settings toggles
	let createPolls = false;
	let privateChats = false;
	let fileSharing = false;
	let upvoteDownvote = false;

	let profanityKeywords = '';
</script>

<div class="">
	<!-- Live View Community Card -->
	<div class="mb-4 rounded-lg border border-gray-300 p-4">
		<div class="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
			<div class="flex flex-col items-start gap-2 md:flex-row md:items-center">
				<div class="flex -space-x-3 rounded-full bg-white">
					<img src="/face-1.svg" alt="avatar" class="h-8 w-8 rounded-full border" />
					<img src="/face-2.svg" alt="avatar" class="h-8 w-8 rounded-full border" />
					<img src="/face.svg" alt="avatar" class="h-8 w-8 rounded-full border" />
					<p class="mx-2 flex h-8 w-8 items-center justify-center rounded-full text-gray-600">
						+ 4
					</p>
				</div>
				<p class="flex flex-col items-start gap-1 text-sm text-gray-600">
					<span class="font-medium text-black">View Live Community</span>
					<span>View live community page</span>
				</p>
			</div>
			<div class="flex w-full items-center gap-2 md:w-fit">
				<button
					class="flex w-full items-center justify-center gap-1 rounded-md bg-[#EBECED] px-3 py-2 text-xs font-medium text-[#616265] transition-colors hover:bg-gray-200 md:w-fit md:text-sm"
				>
					<img src="/link-2.svg" alt="link-2" />
					View Live Community
				</button>
				<button>
					<Icon icon="mdi:close" class="h-4 w-4 text-gray-600" />
				</button>
			</div>
		</div>
	</div>

	<!-- Event Header -->
	<div class="my-8 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
		<div>
			<h1 class="text-2xl font-semibold">Event Community for Megaexe Party</h1>
			<p class="text-sm text-gray-500">
				Manage your event’s community forums, chats, and engagement features.
			</p>
		</div>

		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<button
				class="flex items-center justify-center gap-1 rounded-md bg-gray-300 px-3 py-2 text-sm font-medium text-[#5D646F] md:items-start"
			>
				<img src="/link-2.svg" alt="" />
				View Live Community
			</button>
			<button
				class="flex items-center justify-center gap-1 rounded-md bg-gray-300 px-3 py-2 text-sm font-medium text-[#5D646F] md:items-start"
			>
				Event-Wide Community Forum
				<label class="relative inline-flex cursor-pointer items-center">
					<input id="public-agenda" type="checkbox" class="peer sr-only" />
					<div class="h-5 w-9 rounded-full bg-gray-400 transition-all peer-checked:bg-black"></div>
					<div
						class="absolute top-0 left-0 h-5 w-5 rounded-full bg-white transition-all peer-checked:translate-x-4"
					></div>
				</label>
			</button>
		</div>
	</div>

	<!-- Action Buttons -->
	<div class="mb-6 flex w-full flex-wrap gap-3">
		<div class="relative w-full md:w-fit">
			<button
				class="flex w-full items-center gap-2 rounded-[12.75px] bg-[#FDFDFD] p-2 text-left text-sm font-medium shadow-sm sm:min-w-70 md:w-fit"
			>
				<div class="flex h-[44px] w-[44px] items-center justify-center rounded-sm bg-[#DBF4DA]">
					<svg
						width="32"
						height="32"
						viewBox="0 0 32 32"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							opacity="0.4"
							d="M11.9993 2.66797C8.50602 2.66797 5.66602 5.50797 5.66602 9.0013C5.66602 12.428 8.34602 15.2013 11.8393 15.3213C11.946 15.308 12.0527 15.308 12.1327 15.3213C12.1593 15.3213 12.1727 15.3213 12.1993 15.3213C12.2127 15.3213 12.2127 15.3213 12.226 15.3213C15.6393 15.2013 18.3193 12.428 18.3327 9.0013C18.3327 5.50797 15.4927 2.66797 11.9993 2.66797Z"
							fill="#3CBD2C"
						/>
						<path
							d="M18.7733 18.8678C15.0533 16.3878 8.98661 16.3878 5.23995 18.8678C3.54661 20.0011 2.61328 21.5345 2.61328 23.1745C2.61328 24.8145 3.54661 26.3345 5.22661 27.4545C7.09328 28.7078 9.54661 29.3345 11.9999 29.3345C14.4533 29.3345 16.9066 28.7078 18.7733 27.4545C20.4533 26.3211 21.3866 24.8011 21.3866 23.1478C21.3733 21.5078 20.4533 19.9878 18.7733 18.8678Z"
							fill="#3CBD2C"
						/>
						<path
							opacity="0.4"
							d="M26.6525 9.7881C26.8658 12.3748 25.0258 14.6414 22.4792 14.9481C22.4658 14.9481 22.4658 14.9481 22.4525 14.9481H22.4125C22.3325 14.9481 22.2525 14.9481 22.1858 14.9748C20.8925 15.0414 19.7058 14.6281 18.8125 13.8681C20.1858 12.6414 20.9725 10.8014 20.8125 8.80143C20.7192 7.72143 20.3458 6.73477 19.7858 5.89477C20.2925 5.64144 20.8792 5.48144 21.4792 5.4281C24.0925 5.20144 26.4258 7.1481 26.6525 9.7881Z"
							fill="#3CBD2C"
						/>
						<path
							d="M29.321 22.1218C29.2143 23.4152 28.3876 24.5352 27.001 25.2952C25.6676 26.0285 23.9876 26.3752 22.321 26.3352C23.281 25.4685 23.841 24.3885 23.9476 23.2418C24.081 21.5885 23.2943 20.0018 21.721 18.7352C20.8276 18.0285 19.7876 17.4685 18.6543 17.0552C21.601 16.2018 25.3076 16.7752 27.5876 18.6152C28.8143 19.6018 29.441 20.8418 29.321 22.1218Z"
							fill="#3CBD2C"
						/>
					</svg>
				</div>
				<div>
					<p>1123</p>
					<p class="text-left text-xs text-[#B8BABA]">Active Users</p>
				</div>
			</button>
		</div>
		<button
			class="flex w-full items-center gap-2 rounded-[12.75px] bg-[#FDFDFD] p-2 text-left text-sm font-medium shadow-sm sm:min-w-70 md:w-fit"
		>
			<div class="flex h-[44px] w-[44px] items-center justify-center rounded-sm bg-[#F8E8E0]">
				<svg
					width="32"
					height="32"
					viewBox="0 0 32 32"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						opacity="0.4"
						d="M21.3327 2.66797H10.666C5.33268 2.66797 2.66602 5.33464 2.66602 10.668V28.0013C2.66602 28.7346 3.26602 29.3346 3.99935 29.3346H21.3327C26.666 29.3346 29.3327 26.668 29.3327 21.3346V10.668C29.3327 5.33464 26.666 2.66797 21.3327 2.66797Z"
						fill="#F87937"
					/>
					<path
						d="M22.6673 11.668H9.33398C8.78732 11.668 8.33398 12.1213 8.33398 12.668C8.33398 13.2146 8.78732 13.668 9.33398 13.668H22.6673C23.214 13.668 23.6673 13.2146 23.6673 12.668C23.6673 12.1213 23.214 11.668 22.6673 11.668Z"
						fill="#F87937"
					/>
					<path
						d="M18.6673 18.3359H9.33398C8.78732 18.3359 8.33398 18.7893 8.33398 19.3359C8.33398 19.8826 8.78732 20.3359 9.33398 20.3359H18.6673C19.214 20.3359 19.6673 19.8826 19.6673 19.3359C19.6673 18.7893 19.214 18.3359 18.6673 18.3359Z"
						fill="#F87937"
					/>
				</svg>
			</div>
			<div>
				<p>1123</p>
				<p class="text-left text-xs text-[#B8BABA]">Total Posts</p>
			</div>
		</button>

		<div class="relative w-full md:w-fit">
			<button
				class="flex w-full items-center gap-2 rounded-[12.75px] bg-[#FDFDFD] p-2 text-left text-sm font-medium sm:min-w-70 md:w-fit"
			>
				<div class="flex h-[44px] w-[44px] items-center justify-center rounded-sm bg-[#FFD8D9]">
					<svg
						width="32"
						height="32"
						viewBox="0 0 32 32"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							opacity="0.4"
							d="M27.334 13.588H23.4807C20.3207 13.588 17.7473 11.0146 17.7473 7.85463V4.0013C17.7473 3.26797 17.1473 2.66797 16.414 2.66797H10.7607C6.65398 2.66797 3.33398 5.33464 3.33398 10.0946V21.908C3.33398 26.668 6.65398 29.3346 10.7607 29.3346H21.2407C25.3473 29.3346 28.6673 26.668 28.6673 21.908V14.9213C28.6673 14.188 28.0673 13.588 27.334 13.588Z"
							fill="#FF0007"
						/>
						<path
							d="M21.0676 2.94731C20.5209 2.40064 19.5742 2.77398 19.5742 3.53398V8.18731C19.5742 10.134 21.2276 11.7473 23.2409 11.7473C24.5076 11.7606 26.2676 11.7606 27.7742 11.7606C28.5342 11.7606 28.9342 10.8673 28.4009 10.334C26.4809 8.40064 23.0409 4.92064 21.0676 2.94731Z"
							fill="#FF0007"
						/>
						<path
							d="M17.3336 18.9993H11.747L12.707 18.0393C13.0936 17.6526 13.0936 17.0126 12.707 16.6259C12.3203 16.2393 11.6803 16.2393 11.2936 16.6259L8.62698 19.2926C8.61365 19.3059 8.61365 19.3193 8.60031 19.3193C8.52031 19.3993 8.45365 19.5059 8.40031 19.6126C8.40031 19.6259 8.40031 19.6259 8.38698 19.6393C8.34698 19.7459 8.33365 19.8526 8.32031 19.9593C8.32031 19.9993 8.32031 20.0259 8.32031 20.0659C8.32031 20.1459 8.34698 20.2259 8.37365 20.3059C8.38698 20.3459 8.40031 20.3726 8.41365 20.3993C8.46698 20.5059 8.52031 20.6126 8.61365 20.6926L11.2803 23.3593C11.4803 23.5593 11.7336 23.6526 11.987 23.6526C12.2403 23.6526 12.4936 23.5593 12.6936 23.3593C13.0803 22.9726 13.0803 22.3326 12.6936 21.9459L11.7336 20.9859H17.3336C17.8803 20.9859 18.3336 20.5326 18.3336 19.9859C18.3336 19.4393 17.8803 18.9993 17.3336 18.9993Z"
							fill="#FF0007"
						/>
					</svg>
				</div>
				<div>
					<p>8435</p>
					<p class="text-left text-xs text-[#B8BABA]">Reported Content</p>
				</div>
			</button>
		</div>
	</div>

	<!-- Moderation Queue Section -->
	<div class="mt-8">
		<h2 class="mb-4 text-lg font-semibold">Moderation Queues</h2>

		<!-- Search Bar -->
		<div class="mb-4 flex flex-col justify-between lg:flex-row lg:items-center">
			<div class="mb-4 flex items-center gap-2">
				<div class="relative w-full max-w-xl">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search discussions, users, or reported content..."
						class="h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-gray-500 focus:ring-0 focus:outline-none"
					/>
					<span class="absolute top-2.5 left-3 text-gray-400">
						<img src="/search-favorite.png" alt="search icon" class="h-5 w-5" />
					</span>
				</div>
				<div class="flex items-center gap-1 md:hidden">
					<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]">
						<img src="/download-icon.svg" alt="download icon" />
					</div>
					<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]">
						<img src="/export.svg" alt="export icon" />
					</div>
				</div>
			</div>

			<div class="flex items-center gap-1 md:flex-row">
				<div class="hidden items-center gap-1 md:flex">
					<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]">
						<img src="/download-icon.svg" alt="download icon" />
					</div>
					<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]">
						<img src="/export.svg" alt="export icon" />
					</div>
				</div>

				<div use:clickOutside={() => (showFilter = false)} class="relative">
					<button
						class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
					>
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
						Room Name
					</button>
					<!-- <Status bind:open={showStatus} participant="speaker" /> -->
				</div>
				<div use:clickOutside={() => (showFilter = false)} class="relative">
					<button
						class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
					>
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
						Report Reason
					</button>
					<!-- <Status bind:open={showStatus} participant="speaker" /> -->
				</div>
			</div>
		</div>

		<div class="overflow-hidden rounded-xl bg-white shadow-sm">
			{#each moderationQueue as item}
				<div
					class="flex flex-col justify-between gap-3 border-b px-4 py-3 last:border-none lg:flex-row lg:items-center"
				>
					<div
						class="flex w-full flex-col justify-between gap-3 md:flex-row md:items-center lg:w-[70%]"
					>
						<!-- Icon + Title -->
						<div class="flex items-center gap-3">
							<img src="/faq.svg" alt="" class="h-7 w-7" />
							<div class="w-full truncate font-medium md:max-w-70">{item.message}</div>
						</div>

						<div class="flex items-center gap-3">
							<img src="/face-2.svg" alt="" class="h-7 w-7" />
							<div class="text-gray-500">{item.user}</div>
						</div>

						<div class="truncate text-gray-500">{item.room}</div>
					</div>

					<div class="flex items-center justify-between gap-3">
						<!-- STATUS BADGE -->
						<span
							class="rounded-full px-3 py-1 text-xs
              						{item.tag === 'Spam'
								? 'bg-[#FFE1D2] text-[#FF5700]'
								: item.tag === 'Offensive'
									? 'bg-[#FFD8D9] text-[#FF0007]'
									: 'bg-[#E4E0FF] text-[#7762F6]'}"
						>
							{item.tag}
						</span>

						<!-- Actions menu -->
						<button class="ml-4 text-gray-400 hover:text-gray-600">
							<Icon icon="mdi:dots-horizontal" class="h-5 w-5 text-gray-500" />
						</button>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Community Settings -->
	<div class="mt-8">
		<h2 class="text-lg font-semibold">Community Settings</h2>

		<div class="mt-4 space-y-4 rounded-xl bg-white p-3 md:p-6 shadow">
			<h3 class="mb-4 border-b py-3 font-semibold">General Community Settings</h3>

			<!-- Toggle Settings -->
			<div class="my-4 rounded-xl border p-4">
				<div class="flex items-center justify-between border-b pb-4">
					<span>Allow Attendees to Create Public Polls</span>
					<label class="relative inline-flex cursor-pointer items-center">
						<input type="checkbox" class="peer sr-only" checked={createPolls} />
						<div
							class="peer h-6 w-10 rounded-full bg-gray-200 transition-all
            peer-checked:bg-black peer-focus:ring-offset-1"
						></div>
						<span
							class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow
            transition peer-checked:translate-x-4"
						></span>
					</label>
				</div>

				<div class="mt-4 flex items-center justify-between border-b pb-4">
					<span>Allow Attendees to Initiate Private Chats</span>
					<label class="relative inline-flex cursor-pointer items-center">
						<input type="checkbox" class="peer sr-only" checked={privateChats} />
						<div
							class="peer h-6 w-10 rounded-full bg-gray-200 transition-all
            peer-checked:bg-black peer-focus:ring-offset-1"
						></div>
						<span
							class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow
            transition peer-checked:translate-x-4"
						></span>
					</label>
				</div>

				<div class="mt-4 flex items-center justify-between border-b pb-4">
					<span>Allow File Sharing in Public Chats</span>
					<label class="relative inline-flex cursor-pointer items-center">
						<input type="checkbox" class="peer sr-only" checked={fileSharing} />
						<div
							class="peer h-6 w-10 rounded-full bg-gray-200 transition-all
            peer-checked:bg-black peer-focus:ring-offset-1"
						></div>
						<span
							class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow
            transition peer-checked:translate-x-4"
						></span>
					</label>
				</div>

				<div class="mt-4 flex items-center justify-between">
					<span>Enable Upvote/Downvote on Posts</span>
					<label class="relative inline-flex cursor-pointer items-center">
						<input type="checkbox" class="peer sr-only" checked={upvoteDownvote} />
						<div
							class="peer h-6 w-10 rounded-full bg-gray-200 transition-all
            peer-checked:bg-black peer-focus:ring-offset-1"
						></div>
						<span
							class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow
            transition peer-checked:translate-x-4"
						></span>
					</label>
				</div>
			</div>
			<!-- Moderation Policy -->
			<div>
				<p class="flex items-center gap-1 text-sm">
					Default Moderation Policy
					<Icon icon="mdi:information" class="h-4  w-4 text-gray-400" />
				</p>
				<button
					class="mt-1 flex w-full items-center justify-between rounded-md border border px-3 py-2 text-gray-600"
				>
					<p>Select moderation policy</p>
					<img src="/arrow-left.svg" alt="" class="rotate-90 transform" />
				</button>
			</div>

			<!-- Profanity Filter -->
			<div>
				<p class="flex items-center gap-1 text-sm">
					Profanity Filter Keywords
					<Icon icon="mdi:information" class="h-4  w-4 text-gray-400" />
				</p>
				<textarea
					bind:value={profanityKeywords}
					class="mt-1 h-20 w-full rounded-md border px-3 py-2 text-gray-600"
					placeholder="e.g., damn, crap, idiot"
				></textarea>
				<p class="mt-1 flex items-center gap-1 text-xs text-gray-500">
					<Icon icon="mdi:information" class="h-4  w-4" />

					You can describe your room message briefly.
				</p>
			</div>
		</div>
	</div>

	<!-- Pre-defined Chat Rooms -->
	<div class="mt-8">
		<h2 class="mb-4 text-lg font-semibold">Pre-defined Chat Rooms</h2>

		<!-- Search Bar -->
		<div class="mb-4 flex flex-col justify-between lg:flex-row lg:items-center">
			<div class="relative mb-4 w-full max-w-xl">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search room name"
					class="h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-gray-500 focus:ring-0 focus:outline-none"
				/>
				<span class="absolute top-2.5 left-3 text-gray-400">
					<img src="/search-favorite.png" alt="search icon" class="h-5 w-5" />
				</span>
			</div>

			<div class="flex items-center gap-1 md:flex-row">
				<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]">
					<img src="/download-icon.svg" alt="download icon" />
				</div>
				<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]">
					<img src="/export.svg" alt="export icon" />
				</div>

				<div use:clickOutside={() => (showFilter = false)} class="relative">
					<button
						class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
					>
						<Icon icon="mdi:plus" class="h-5 w-5" />
						Add New Room
					</button>
					<!-- <Status bind:open={showStatus} participant="speaker" /> -->
				</div>
			</div>
		</div>

		<div class="overflow-hidden rounded-xl bg-white shadow-sm">
			{#each chatRooms as room}
				<div
					class="flex flex-col justify-between gap-3 border-b px-4 py-3 last:border-none md:flex-row md:items-center"
				>
					<div class="flex w-[70%] flex-col justify-between gap-3 md:flex-row md:items-center">
						<!-- Icon + Title -->
						<div class="flex items-center gap-3">
							<img src="/faq.svg" alt="" class="h-7 w-7" />
							<div class="font-medium">{room.name}</div>
						</div>

						<div class="truncate text-gray-500">{room.description}</div>
					</div>

					<div class="flex items-center justify-between gap-3">
						<button class="text-gray-400 hover:text-gray-600">
							<img src="/edit-icon.svg" alt="" class="h-4 w-4 text-gray-500" />
						</button>
						<!-- Actions menu -->
						<button class="text-gray-400 hover:text-gray-600">
							<img src="/delete-icon.svg" alt="" class="h-4 w-4 text-gray-500" />
						</button>
					</div>
				</div>
			{/each}
		</div>

		<!-- Save Button -->
		<button class="mt-4 flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-white">
			<svg
				width="19"
				height="18"
				viewBox="0 0 19 18"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M8.87891 0.197266C9.31143 0.197266 9.66789 0.553826 9.66797 0.986328C9.66797 1.41889 9.31147 1.77539 8.87891 1.77539C4.96276 1.77544 1.77544 4.96276 1.77539 8.87891C1.77539 12.7951 4.96273 15.9824 8.87891 15.9824C12.7951 15.9824 15.9824 12.7951 15.9824 8.87891C15.9825 8.4464 16.339 8.08987 16.7715 8.08984C17.204 8.08984 17.5605 8.44638 17.5605 8.87891C17.5605 13.6681 13.6681 17.5605 8.87891 17.5605C4.08971 17.5605 0.197266 13.6681 0.197266 8.87891C0.197317 4.08974 4.08974 0.197317 8.87891 0.197266Z"
					fill="white"
					stroke="white"
					stroke-width="0.394627"
				/>
				<rect
					x="4.33984"
					y="8.38281"
					width="2.36776"
					height="6.568"
					rx="1.18388"
					transform="rotate(-45 4.33984 8.38281)"
					fill="white"
				/>
				<rect
					x="17.0117"
					y="1.65625"
					width="2.36776"
					height="13.7152"
					rx="1.18388"
					transform="rotate(45 17.0117 1.65625)"
					fill="white"
				/>
			</svg>
			Save Community Settings
		</button>
	</div>
</div>
