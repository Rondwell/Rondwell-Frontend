<script lang="ts">
	import Icon from '@iconify/svelte';
	import {
		DISCOVER_TABS,
		discoverTab,
		setTab,
		TAB_SHORTCUTS,
		type DiscoverTab
	} from '$lib/stores/discover.store';

	const TAB_META: Record<DiscoverTab, { icon: string; subtitle: string; accent: string }> = {
		Events: {
			icon: 'solar:ticket-bold-duotone',
			subtitle: 'Concerts, summits & mixers',
			accent: '#DB3E6C'
		},
		Exhibitors: {
			icon: 'solar:buildings-2-bold-duotone',
			subtitle: 'Expo brands & booths',
			accent: '#AB46DD'
		},
		Vendors: {
			icon: 'solar:shop-2-bold-duotone',
			subtitle: 'Production & catering',
			accent: '#2563EB'
		},
		Speakers: {
			icon: 'solar:microphone-3-bold-duotone',
			subtitle: 'Keynote voices & panel',
			accent: '#7C3AED'
		},
		Community: {
			icon: 'solar:users-group-rounded-bold-duotone',
			subtitle: 'Curated collections',
			accent: '#059669'
		}
	};
</script>

<aside class="hidden w-64 shrink-0 md:block">
	<div class="sticky top-20 space-y-4">
		<div class="rounded-3xl border border-black/8 bg-white/82 p-2.5 shadow-[0_10px_30px_rgba(18,16,28,0.05)] backdrop-blur-xl">
			<div class="px-3 py-2">
				<p class="text-[11px] font-bold tracking-[0.14em] text-[#7A7787] uppercase">
					Explore Directory
				</p>
			</div>

			<nav class="space-y-1" aria-label="Discover categories">
				{#each DISCOVER_TABS as tab}
					{@const meta = TAB_META[tab]}
					{@const active = $discoverTab === tab}
					<button
						type="button"
						aria-current={active ? 'page' : undefined}
						on:click={() => setTab(tab as DiscoverTab)}
						class={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all duration-150 ${
							active
								? 'bg-[#17161E] text-white shadow-sm'
								: 'text-[#32303B] hover:bg-black/5'
						}`}
					>
						<span
							class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
							style={`background: ${active ? 'rgba(255,255,255,0.14)' : `${meta.accent}15`}; color: ${active ? '#FFFFFF' : meta.accent};`}
						>
							<Icon icon={meta.icon} class="h-4.5 w-4.5" />
						</span>

						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-semibold leading-tight">{tab}</p>
							<p class={`truncate text-[11px] ${active ? 'text-white/70' : 'text-[#7A7787]'}`}>
								{meta.subtitle}
							</p>
						</div>

						<span
							title={`Press ${TAB_SHORTCUTS[tab]} to switch`}
							class={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold ${
								active
									? 'bg-white/15 text-white'
									: 'bg-black/5 text-[#878495]'
							}`}
						>
							{TAB_SHORTCUTS[tab]}
						</span>
					</button>
				{/each}
			</nav>
		</div>

		<!-- Host CTA Rail Card -->
		<div class="relative overflow-hidden rounded-3xl border border-[#AB46DD]/20 bg-gradient-to-br from-[#F7E8F6] via-white to-[#EDE8FA] p-4 shadow-xs">
			<p class="text-xs font-bold text-[#17161E]">Hosting something special?</p>
			<p class="mt-1 text-xs leading-relaxed text-[#5F5C6D]">
				Launch a themed event page with dynamic QR passes in 60 seconds.
			</p>
			<a
				href="/create-event"
				class="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#DB3E6C] to-[#AB46DD] text-xs font-semibold text-white no-underline shadow-xs transition hover:opacity-95"
			>
				<Icon icon="solar:add-circle-bold" class="h-4 w-4" />
				<span>Create Event</span>
			</a>
		</div>
	</div>
</aside>
