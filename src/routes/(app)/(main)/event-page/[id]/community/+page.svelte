<script lang="ts">
	import { page } from '$app/stores';
	import { getEventTheme } from '$lib/stores/eventTheme';
	import type { Color } from '$lib/utils/colors';
	import { colors } from '$lib/utils/colors';

	let themeColor: Color = colors[0];
	$: {
		const match = $page.url.pathname.match(/^\/event-page\/([^/]+)/);
		if (match) themeColor = getEventTheme(match[1]);
	}

	const posts = [
		{
			id: 1,
			author: 'Jennifer Mendy',
			avatar: '/user1-icon.svg',
			time: '13 days ago',
			pinned: true,
			comments: 13,
			likes: 24,
			title: 'How Online Learning is Completely Transforming the Western Education',
			image: '/community-image.png',
			description: null
		},
		{
			id: 2,
			author: 'Alex Johnson',
			avatar: '/user2-icon.svg',
			time: '2 days ago',
			pinned: false,
			comments: 8,
			likes: 15,
			title: 'Are startup accelerators still worth it in 2025?',
			image: null,
			description: 'Online learning isn\'t just an alternative — it\'s redefining the foundation of education in the West. As technology continues to advance, the traditional classroom model is likely to become just one part of a much larger, more flexible, and inclusive system.'
		},
		{
			id: 3,
			author: 'Jennifer Mendy',
			avatar: '/user3-icon.svg',
			time: '1 day ago',
			pinned: true,
			comments: 23,
			likes: 10,
			title: 'How Interactive and Skill-Based Learning Is Revolutionizing Modern Education',
			image: '/community-image.png',
			description: null
		}
	];

	let likedPosts: Set<number> = new Set();

	function toggleLike(id: number) {
		if (likedPosts.has(id)) {
			likedPosts.delete(id);
		} else {
			likedPosts.add(id);
		}
		likedPosts = new Set(likedPosts);
	}
</script>

<div class="w-full max-w-4xl">
	<!-- Banner -->
	<div class="relative mb-16 overflow-hidden rounded-2xl">
		<img src="/community-banner.png" alt="Community Banner" class="h-36 w-full rounded-2xl object-cover" />
		<div
			class="absolute -bottom-10 left-5 flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg"
			style="background-color: {themeColor.cover}; border: 2px solid {themeColor.toggle};"
		>
			<img src="/community-user.svg" alt="Community" class="h-16 w-16 rounded-xl object-cover" />
		</div>
	</div>

	<!-- Community Header -->
	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold" style="color: {themeColor.text};">Megaexe Party Community</h1>
			<p class="mt-1 text-sm" style="color: {themeColor.lightText};">Share, discuss, and connect with other attendees</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<button
				class="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-xs font-medium transition-colors"
				style="background-color: {themeColor.cover}; color: {themeColor.text}; border: 1px solid {themeColor.toggle};"
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M8 12H16M12 8V16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				Subscribe
			</button>
			<button
				class="flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-xs font-medium transition-colors"
				style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M8.5 19H8C4 19 2 18 2 13V8C2 4 4 2 8 2H16C20 2 22 4 22 8V13C22 18 20 19 16 19H15.5C15.19 19 14.89 19.15 14.7 19.4L13.2 21.4C12.54 22.28 11.46 22.28 10.8 21.4L9.3 19.4C9.14 19.18 8.77 19 8.5 19Z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M15.9965 11H16.0054M11.9955 11H12.0045M7.99451 11H8.00349" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				Start Thread
			</button>
		</div>
	</div>

	<!-- Posts -->
	<div class="flex flex-col gap-4">
		{#each posts as post (post.id)}
			<div
				class="overflow-hidden rounded-2xl transition-shadow hover:shadow-md"
				style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};"
			>
				<!-- Post image -->
				{#if post.image}
					<img src={post.image} alt={post.title} class="h-44 w-full object-cover" />
				{/if}

				<div class="p-4">
					<!-- Author row -->
					<div class="mb-3 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<img src={post.avatar} alt={post.author} class="h-8 w-8 rounded-full object-cover" style="border: 1.5px solid {themeColor.toggle};" />
							<div>
								<p class="text-xs font-semibold" style="color: {themeColor.text};">{post.author}</p>
								<p class="text-xs" style="color: {themeColor.lightText};">{post.time}</p>
							</div>
						</div>
						{#if post.pinned}
							<span class="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs" style="background-color: {themeColor.smallCover}; color: {themeColor.lightText};">
								<svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								Pinned
							</span>
						{/if}
					</div>

					<!-- Title & description -->
					<h3 class="mb-2 text-sm font-semibold leading-snug" style="color: {themeColor.text};">{post.title}</h3>
					{#if post.description}
						<p class="mb-3 text-xs leading-relaxed" style="color: {themeColor.lightText};">{post.description}</p>
					{/if}

					<!-- Actions -->
					<div class="flex items-center gap-4 border-t pt-3" style="border-color: {themeColor.toggle};">
						<button
							class="flex items-center gap-1.5 text-xs transition-colors"
							style="color: {likedPosts.has(post.id) ? themeColor.button : themeColor.lightText};"
							on:click={() => toggleLike(post.id)}
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="{likedPosts.has(post.id) ? 'currentColor' : 'none'}" xmlns="http://www.w3.org/2000/svg">
								<path d="M12 21.65C11.69 21.65 11.38 21.61 11.12 21.52C7.37 20.26 1.5 15.9 1.5 9.19C1.5 5.8 4.24 3.05 7.62 3.05C9.25 3.05 10.77 3.69 11.9 4.82L12 4.92L12.1 4.82C13.23 3.69 14.75 3.05 16.38 3.05C19.76 3.05 22.5 5.81 22.5 9.19C22.5 15.91 16.63 20.26 12.88 21.52C12.62 21.61 12.31 21.65 12 21.65Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
							{post.likes + (likedPosts.has(post.id) ? 1 : 0)}
						</button>
						<button
							class="flex items-center gap-1.5 text-xs"
							style="color: {themeColor.lightText};"
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M8.5 19H8C4 19 2 18 2 13V8C2 4 4 2 8 2H16C20 2 22 4 22 8V13C22 18 20 19 16 19H15.5C15.19 19 14.89 19.15 14.7 19.4L13.2 21.4C12.54 22.28 11.46 22.28 10.8 21.4L9.3 19.4C9.14 19.18 8.77 19 8.5 19Z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
							{post.comments} comments
						</button>
						<button
							class="ml-auto flex items-center gap-1.5 text-xs"
							style="color: {themeColor.lightText};"
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								<path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								<path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								<path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
							Share
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
