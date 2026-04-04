<script lang="ts">
	export let open = false;
	export let selectedTimezone = '';
	export let selectedLocationName = '';

	let search = '';
	let searchInput: HTMLInputElement;

	interface TzEntry {
		iana: string;
		label: string;
		city: string;
		offset: string;
	}

	const popularIana = [
		'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
		'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
		'Africa/Lagos', 'Africa/Cairo', 'Asia/Dubai', 'Asia/Kolkata',
		'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney',
		'Pacific/Auckland',
	];

	function getOffset(iana: string): string {
		try {
			const now = new Date();
			const fmt = new Intl.DateTimeFormat('en-US', { timeZone: iana, timeZoneName: 'shortOffset' });
			const parts = fmt.formatToParts(now);
			const tzPart = parts.find(p => p.type === 'timeZoneName');
			return tzPart?.value?.replace('GMT', 'GMT') || '';
		} catch { return ''; }
	}

	function getCity(iana: string): string {
		return iana.split('/').pop()?.replace(/_/g, ' ') || iana;
	}

	function getRegion(iana: string): string {
		const parts = iana.split('/');
		if (parts.length < 2) return '';
		return parts[0].replace(/_/g, ' ');
	}

	function buildEntry(iana: string): TzEntry {
		const offset = getOffset(iana);
		const city = getCity(iana);
		return { iana, label: `${getRegion(iana)} – ${city}`, city, offset };
	}

	// Get all IANA timezones from the browser
	function getAllTimezones(): string[] {
		try {
			return (Intl as any).supportedValuesOf('timeZone');
		} catch {
			return popularIana;
		}
	}

	const allTimezones = getAllTimezones();
	const popularEntries = popularIana.map(buildEntry);
	const allEntries = allTimezones.map(buildEntry);

	$: filteredEntries = search.trim()
		? allEntries.filter(e =>
			e.label.toLowerCase().includes(search.toLowerCase()) ||
			e.iana.toLowerCase().includes(search.toLowerCase()) ||
			e.offset.toLowerCase().includes(search.toLowerCase()) ||
			e.city.toLowerCase().includes(search.toLowerCase())
		)
		: [];

	$: showPopular = !search.trim();

	$: if (open && searchInput) {
		setTimeout(() => searchInput?.focus(), 50);
	}

	function selectTimezone(iana: string) {
		selectedTimezone = getOffset(iana);
		selectedLocationName = getCity(iana);
		open = false;
		search = '';
	}
</script>

{#if open}
	<div id="timezone" class="triangle absolute top-full left-0 right-auto md:left-auto md:right-0 z-40 mt-2 w-[calc(100vw-3rem)] max-w-[340px]">
		<div class="relative overflow-hidden rounded-2xl bg-[#FFFCFC] shadow-xl" style="backdrop-filter: blur(20px);">
			<!-- Search -->
			<div class="border-b border-gray-100 px-4 py-3">
				<input
					bind:this={searchInput}
					bind:value={search}
					type="text"
					placeholder="Search for a timezone"
					class="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
				/>
			</div>

			<!-- List -->
			<div class="custom-scrollbar max-h-[320px] overflow-y-auto">
				{#if showPopular}
				<p class="px-4 pt-3 pb-1 text-xs font-medium text-gray-400">Popular Timezones</p>
				{#each popularEntries as tz}
					<button
						class="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 {selectedTimezone === tz.offset ? 'bg-gray-50' : ''}"
						on:click={() => selectTimezone(tz.iana)}
					>
						<img src="/globe-icon.svg" alt="" class="h-5 w-5 opacity-40" />
						<span class="flex-1 text-sm font-medium text-gray-800">{tz.label}</span>
						<span class="text-xs text-gray-400">{tz.offset}</span>
					</button>
				{/each}

				<p class="px-4 pt-4 pb-1 text-xs font-medium text-gray-400">All Timezones</p>
				{#each allEntries as tz}
					<button
						class="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 {selectedTimezone === tz.offset ? 'bg-gray-50' : ''}"
						on:click={() => selectTimezone(tz.iana)}
					>
						<img src="/globe-icon.svg" alt="" class="h-5 w-5 opacity-40" />
						<span class="flex-1 text-sm font-medium text-gray-800">{tz.label}</span>
						<span class="text-xs text-gray-400">{tz.offset}</span>
					</button>
				{/each}
				{:else}
				{#if filteredEntries.length === 0}
					<div class="flex flex-col items-center gap-2 py-8">
						<p class="text-sm text-gray-400">No timezones found</p>
					</div>
				{:else}
					<p class="px-4 pt-3 pb-1 text-xs font-medium text-gray-400">Results</p>
					{#each filteredEntries as tz}
						<button
							class="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
							on:click={() => selectTimezone(tz.iana)}
						>
							<img src="/globe-icon.svg" alt="" class="h-5 w-5 opacity-40" />
							<span class="flex-1 text-sm font-medium text-gray-800">{tz.label}</span>
							<span class="text-xs text-gray-400">{tz.offset}</span>
						</button>
					{/each}
				{/if}
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.triangle::before {
		content: '';
		position: absolute;
		top: -16px;
		left: 30px;
		border-width: 8px;
		border-style: solid;
		border-color: transparent transparent #FFFCFC transparent;
	}
	@media (min-width: 768px) {
		.triangle::before {
			left: auto;
			right: 30px;
		}
	}
</style>
