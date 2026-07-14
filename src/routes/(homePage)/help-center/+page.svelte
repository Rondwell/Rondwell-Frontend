<!-- src/routes/help-center/+page.svelte -->
<script>
	let searchQuery = '';

	const articles = [
		{
			title: 'Creating Your First Event',
			excerpt: 'Learn how to create an event on Rondwell — from setting a title and date to configuring tickets, themes, and publishing your event page.',
			category: 'Events',
			slug: 'creating-your-first-event'
		},
		{
			title: 'Selling Tickets & Managing Registrations',
			excerpt: 'Set up free or paid tickets, configure multi-currency pricing (NGN, USD, EUR), manage attendee registrations, and handle check-ins.',
			category: 'Ticketing',
			slug: 'selling-tickets'
		},
		{
			title: 'Withdrawals & Wallet Management',
			excerpt: 'Understand how your Rondwell wallet works, add bank accounts, request withdrawals in NGN or USD, and track your earnings.',
			category: 'Payments',
			slug: 'withdrawals-and-wallets'
		},
		{
			title: 'Setting Up a Vendor Profile',
			excerpt: 'Create your public vendor profile, list your services, set pricing, and get discovered by event organizers on the Rondwell marketplace.',
			category: 'Vendors',
			slug: 'vendor-profile-setup'
		},
		{
			title: 'Managing Event Collections',
			excerpt: 'Group related events into collections, customize collection themes, manage subscribers, and send newsletters to your audience.',
			category: 'Collections',
			slug: 'managing-collections'
		},
		{
			title: 'Inviting Event Admins & Collaborators',
			excerpt: 'Invite team members to help manage your event with role-based permissions — assign roles like Registration Manager or Support Manager.',
			category: 'Team',
			slug: 'inviting-event-admins'
		},
		{
			title: 'Understanding Analytics & Insights',
			excerpt: 'Track ticket sales, revenue, attendee demographics, and event performance with Rondwell\'s real-time analytics dashboard.',
			category: 'Analytics',
			slug: 'understanding-analytics'
		},
		{
			title: 'Account Security & Verification',
			excerpt: 'Enable two-factor authentication, complete KYC identity verification, manage connected devices, and keep your account secure.',
			category: 'Account',
			slug: 'account-security'
		}
	];

	$: filteredArticles = searchQuery
		? articles.filter(a =>
			a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			a.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
			a.category.toLowerCase().includes(searchQuery.toLowerCase())
		)
		: articles;
</script>

<svelte:head>
	<title>Help Center | Rondwell</title>
	<meta name="theme-color" content="#f5efec" />
	<meta name="description" content="Get help with Rondwell. Browse guides, tutorials, and support articles for event management." />
	<meta property="og:title" content="Help Center | Rondwell" />
	<meta property="og:description" content="Get help with Rondwell. Browse guides, tutorials, and support articles for event management." />
	<meta property="og:url" content="https://rondwell.com/help-center" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Rondwell" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Help Center | Rondwell" />
	<meta name="twitter:description" content="Get help with Rondwell. Browse guides, tutorials, and support articles for event management." />
	<meta name="twitter:site" content="@rondwellhq" />
	<link rel="canonical" href="https://rondwell.com/help-center" />
</svelte:head>

<div class="mx-auto max-w-4xl py-10">
	<!-- Hero -->
	<div class="mb-10 flex flex-col items-center gap-6 text-center">
		<img src="/logo.svg" alt="" class="h-8" />
		<h1 class="mb-4 text-4xl font-bold">Welcome. How can we help?</h1>
		<div class="relative w-full max-w-2xl lg:max-w-3xl">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search help docs, tutorials, and more..."
				class="h-[43px] w-full rounded-lg border border-gray-300 bg-[#FFFFFF] py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-2 focus:ring-purple-500 focus:outline-none"
			/>
			<span class="absolute top-2.5 left-3 text-gray-400">
				<img src="/search-favorite.png" alt="search icon" class="h-5 w-5" />
			</span>
		</div>
	</div>

	<!-- Articles Grid -->
	<div>
		<h3 class="mb-4 text-2xl font-bold">Help Articles</h3>

		{#if filteredArticles.length === 0}
			<div class="flex flex-col items-center gap-3 py-16 text-center">
				<p class="text-4xl">🔍</p>
				<p class="text-gray-500">No articles found for "{searchQuery}"</p>
			</div>
		{:else}
			<div class="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
				{#each filteredArticles as article}
					<a href="/help-center/{article.slug}">
						<article
							class="flex h-[164px] flex-col justify-between rounded-lg border border-gray-100 bg-[#FDFDFD] p-5 shadow-sm transition hover:shadow-md"
						>
							<div>
								<h2 class="mb-2 text-lg font-semibold">{article.title}</h2>
								<p class="line-clamp-2 text-sm text-[#949596]">{article.excerpt}</p>
							</div>
							<span class="mt-2 w-fit rounded-full bg-[#F0E0D8] px-3 py-0.5 text-xs text-[#F77A3A]">{article.category}</span>
						</article>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
