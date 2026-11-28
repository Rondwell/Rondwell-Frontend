<script lang="ts">
	import Icon from '@iconify/svelte';

	const currentYear = new Date().getFullYear();

	const platformLinks = [
		{ label: 'Discover Events', href: '/discover' },
		{ label: 'Vendor Marketplace', href: '/discover?tab=vendors' },
		{ label: 'Speakers Directory', href: '/discover?tab=speakers' },
		{ label: 'Exhibitors', href: '/discover?tab=exhibitors' },
		{ label: 'Create an Event', href: '/create-event' },
		{ label: 'Pricing', href: '/pricing' }
	];

	const developerLinks = [
		{ label: 'API & Web SDK Docs', href: '/api-docs' },
		{ label: 'Event Page SDK', href: '/api-docs#sdk-event-page' },
		{ label: 'Collection Web SDK', href: '/api-docs#sdk-collection' },
		{ label: 'Webhooks & Security', href: '/api-docs#webhooks' },
		{ label: 'Interactive Console', href: '/api-docs#console' },
		{ label: 'Developer Settings', href: '/settings?tab=developers' }
	];

	const resourceLinks = [
		{ label: 'Help Center', href: '/help-center' },
		{ label: 'FAQ', href: '/faq' },
		{ label: 'Contact Support', href: '/contact' },
		{ label: 'Selling Tickets', href: '/help-center/selling-tickets' },
		{ label: 'Understanding Analytics', href: '/help-center/understanding-analytics' }
	];

	const legalLinks = [
		{ label: 'Terms of Service', href: '/terms' },
		{ label: 'Privacy Policy', href: '/privacy' },
		{ label: 'Refund Policy', href: '/legal/refund-policy' },
		{ label: 'AML Policy', href: '/legal/aml-policy' },
		{ label: 'KYC Policy', href: '/legal/kyc-policy' },
		{ label: 'Data Retention', href: '/legal/data-retention' },
		{ label: 'Vendor Payouts', href: '/legal/vendor-payout-policy' },
		{ label: 'PCI Scope', href: '/legal/pci-scope' }
	];
</script>

<footer class="w-full border-t border-black/8 bg-[#FAF9FC] text-[#17161E]">
	<div class="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
		<!-- Obsidian Brand & Developer CTA Banner -->
		<div
			class="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#14131A] p-6 text-white shadow-[0_24px_60px_-20px_rgba(20,19,26,0.45)] sm:rounded-[28px] sm:p-8 lg:p-10"
		>
			<div
				class="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full bg-[#DB3E6C]/25 blur-3xl"
				aria-hidden="true"
			></div>
			<div
				class="pointer-events-none absolute -right-16 -bottom-24 h-72 w-72 rounded-full bg-[#513BE2]/30 blur-3xl"
				aria-hidden="true"
			></div>

			<div class="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
				<div class="max-w-2xl space-y-2.5">
					<span
						class="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-purple-200 uppercase"
					>
						<Icon icon="solar:bolt-bold-duotone" class="h-3.5 w-3.5 text-[#F472B6]" />
						<span>Rondwell Event Infrastructure</span>
					</span>
					<h2 class="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
						Host unforgettable rooms — or embed Rondwell inside your own product.
					</h2>
					<p class="text-xs leading-relaxed text-slate-300 sm:text-sm">
						From sold-out concerts and tech conferences to programmable REST APIs, interactive seat pickers, and drop-in Web SDK modals.
					</p>
				</div>

				<div class="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center lg:shrink-0">
					<a
						href="/create-event"
						class="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#DB3E6C] via-[#AB46DD] to-[#513BE2] px-5 py-2.5 text-sm font-semibold text-white no-underline shadow-lg transition hover:opacity-95 sm:w-auto"
					>
						<Icon icon="solar:magic-stick-3-bold-duotone" class="h-4 w-4" />
						<span>Create an Event</span>
					</a>
					<a
						href="/api-docs"
						class="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white no-underline backdrop-blur-md transition hover:bg-white/15 sm:w-auto"
					>
						<Icon icon="solar:code-square-bold-duotone" class="h-4 w-4 text-purple-200" />
						<span>Explore API &amp; SDKs</span>
					</a>
				</div>
			</div>
		</div>

		<!-- Main Multi-Column Navigation -->
		<div class="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:mt-12 sm:grid-cols-3 lg:grid-cols-12">
			<!-- Brand Column -->
			<div class="col-span-2 space-y-5 sm:col-span-3 lg:col-span-4">
				<div class="space-y-3">
					<a href="/" class="inline-flex items-center gap-2 no-underline">
						<img src="/logo.svg" alt="Rondwell" class="h-7 w-auto object-contain" />
					</a>
					<p class="max-w-sm text-xs leading-relaxed text-[#5F5C6D] sm:text-sm">
						Africa’s modern event infrastructure for ticketing, spatial seating, exhibitor ecosystems, real-time analytics, and developer-first Web SDKs.
					</p>
				</div>

				<a
					href="/api-docs"
					class="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-800 no-underline transition hover:bg-emerald-100"
				>
					<span class="relative flex h-2 w-2">
						<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
						<span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
					</span>
					<span>All systems operational · API v1</span>
				</a>

				<div class="space-y-2 text-xs text-[#5F5C6D]">
					<div class="flex items-center gap-2">
						<Icon icon="solar:map-point-bold-duotone" class="h-4 w-4 shrink-0 text-[#AB46DD]" />
						<span>Surulere, Lagos State, Nigeria</span>
					</div>
					<div class="flex items-center gap-2">
						<Icon icon="solar:letter-bold-duotone" class="h-4 w-4 shrink-0 text-[#DB3E6C]" />
						<a href="mailto:info@rondwell.com" class="text-[#3C3947] no-underline transition hover:text-[#17161E]">
							info@rondwell.com
						</a>
					</div>
					<div class="flex items-center gap-2">
						<Icon icon="solar:phone-calling-rounded-bold-duotone" class="h-4 w-4 shrink-0 text-[#513BE2]" />
						<a href="tel:+2349165904428" class="text-[#3C3947] no-underline transition hover:text-[#17161E]">
							+234 916 590 4428
						</a>
					</div>
				</div>

				<!-- Social & Contact Icon Pills -->
				<div class="flex flex-wrap items-center gap-2.5 pt-1">
					<a
						href="https://www.linkedin.com/company/rondwell"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Rondwell on LinkedIn"
						class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-[#4A4754] shadow-2xs transition hover:-translate-y-0.5 hover:border-[#7C3AED]/40 hover:text-[#7C3AED]"
					>
						<svg class="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
							<path
								d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"
							/>
						</svg>
					</a>
					<a
						href="https://web.facebook.com/rondwellhq/"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Rondwell on Facebook"
						class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-[#4A4754] shadow-2xs transition hover:-translate-y-0.5 hover:border-[#7C3AED]/40 hover:text-[#7C3AED]"
					>
						<svg class="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
							<path
								d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z"
							/>
						</svg>
					</a>
					<a
						href="mailto:info@rondwell.com"
						aria-label="Email Rondwell"
						class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-[#4A4754] shadow-2xs transition hover:-translate-y-0.5 hover:border-[#DB3E6C]/40 hover:text-[#DB3E6C]"
					>
						<Icon icon="solar:letter-linear" class="h-4 w-4" />
					</a>
					<a
						href="tel:+2349165904428"
						aria-label="Call Rondwell"
						class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-[#4A4754] shadow-2xs transition hover:-translate-y-0.5 hover:border-[#513BE2]/40 hover:text-[#513BE2]"
					>
						<Icon icon="solar:phone-linear" class="h-4 w-4" />
					</a>
				</div>
			</div>

			<!-- Platform Links -->
			<div class="col-span-1 lg:col-span-2">
				<h3 class="text-[11px] font-bold tracking-[0.14em] text-[#7A7787] uppercase">Platform</h3>
				<ul class="mt-3.5 space-y-2.5 text-sm">
					{#each platformLinks as link}
						<li>
							<a href={link.href} class="text-[#3D3A49] no-underline transition hover:text-[#17161E]">
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Developers Links -->
			<div class="col-span-1 lg:col-span-2">
				<h3 class="text-[11px] font-bold tracking-[0.14em] text-[#7A7787] uppercase">Developers</h3>
				<ul class="mt-3.5 space-y-2.5 text-sm">
					{#each developerLinks as link}
						<li>
							<a href={link.href} class="text-[#3D3A49] no-underline transition hover:text-[#7C3AED]">
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Resources Links -->
			<div class="col-span-1 lg:col-span-2">
				<h3 class="text-[11px] font-bold tracking-[0.14em] text-[#7A7787] uppercase">Resources</h3>
				<ul class="mt-3.5 space-y-2.5 text-sm">
					{#each resourceLinks as link}
						<li>
							<a href={link.href} class="text-[#3D3A49] no-underline transition hover:text-[#17161E]">
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Legal & Compliance Links (FE-P4-10) -->
			<div class="col-span-1 lg:col-span-2">
				<h3 class="text-[11px] font-bold tracking-[0.14em] text-[#7A7787] uppercase">Legal &amp; Trust</h3>
				<ul class="mt-3.5 space-y-2.5 text-sm">
					{#each legalLinks as link}
						<li>
							<a href={link.href} class="text-[#5F5C6D] no-underline transition hover:text-[#17161E]">
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>

		<!-- Bottom Trust & Copyright Bar -->
		<div
			class="mt-12 flex flex-col gap-4 border-t border-black/8 pt-6 text-xs text-[#6B6878] sm:flex-row sm:items-center sm:justify-between"
		>
			<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
				<span>© {currentYear} Rondwell. All rights reserved.</span>
				<span class="hidden text-black/20 sm:inline">•</span>
				<span
					class="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#DB3E6C] via-[#AB46DD] to-[#513BE2] bg-clip-text font-semibold text-transparent"
				>
					Organize unforgettable events with Rondwell
					<img src="/send-icon.svg" alt="" class="h-3.5 w-3.5 object-contain" />
				</span>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<span class="inline-flex items-center gap-1 rounded-full border border-black/8 bg-white px-2.5 py-1 text-[11px] font-medium text-[#4A4754]">
					<Icon icon="solar:shield-check-bold-duotone" class="h-3.5 w-3.5 text-emerald-600" />
					PCI-Scoped Checkout
				</span>
				<span class="inline-flex items-center gap-1 rounded-full border border-black/8 bg-white px-2.5 py-1 text-[11px] font-medium text-[#4A4754]">
					<Icon icon="solar:key-minimalistic-square-2-bold-duotone" class="h-3.5 w-3.5 text-purple-600" />
					HMAC Webhooks
				</span>
				<span class="inline-flex items-center gap-1 rounded-full border border-black/8 bg-white px-2.5 py-1 text-[11px] font-medium text-[#4A4754]">
					NGN · USD Multi-Currency
				</span>
			</div>
		</div>
	</div>
</footer>
