<script lang="ts">
	import Icon from '@iconify/svelte';

	export let vendor: {
		slug: string;
		businessName: string;
		businessType: string;
		bio: string;
		logoUrl: string;
		coverImageUrl: string;
		location: string;
		serviceArea: string;
		productCount?: number;
	};

	/** Open the vendor profile in a new tab (Discover uses this, matching events). */
	export let newTab = false;
</script>

<a
	href="/v/{vendor.slug}"
	target={newTab ? '_blank' : undefined}
	rel={newTab ? 'noopener noreferrer' : undefined}
	class="group flex cursor-pointer gap-3.5 rounded-[22px] border border-black/8 bg-white/88 p-3.5 no-underline shadow-[0_1px_3px_rgba(19,21,23,0.04)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-black/15 hover:shadow-[0_12px_30px_-10px_rgba(19,21,23,0.12)] sm:gap-4 sm:p-4 md:p-5"
>
	<!-- Left content -->
	<div class="flex min-w-0 flex-1 flex-col justify-between">
		<div class="space-y-1.5">
			<!-- Business type -->
			{#if vendor.businessType}
				<span class="inline-block text-[11px] font-semibold tracking-wide text-[#7C3AED] sm:text-xs">
					{vendor.businessType}
				</span>
			{/if}

			<!-- Business name -->
			<div class="flex items-start gap-2">
				<Icon icon="solar:shop-2-bold-duotone" class="mt-0.5 h-4 w-4 flex-shrink-0 text-[#7C3AED]" />
				<h3 class="line-clamp-2 text-sm font-bold leading-snug text-[#17161E] transition-colors group-hover:text-[#7C3AED] sm:text-base">
					{vendor.businessName}
				</h3>
			</div>

			<!-- Bio -->
			{#if vendor.bio}
				<p class="line-clamp-2 text-xs leading-relaxed text-[#5F5C6D]">{vendor.bio}</p>
			{/if}

			<!-- Location -->
			{#if vendor.location || vendor.serviceArea}
				<div class="flex items-center gap-1.5 text-xs text-[#6B6878]">
					<Icon icon="solar:map-point-bold-duotone" class="h-3.5 w-3.5 flex-shrink-0 text-[#8E8B99]" />
					<span class="truncate">{vendor.location || vendor.serviceArea}</span>
				</div>
			{/if}
		</div>

		<!-- Tags -->
		<div class="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
			<span class="rounded-full bg-[#146AEB]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#146AEB]">
				Vendor
			</span>
			{#if vendor.businessType}
				<span class="rounded-full bg-[#7C3AED]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#7C3AED]">
					{vendor.businessType}
				</span>
			{/if}
			{#if vendor.productCount && vendor.productCount > 0}
				<div class="flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5">
					<Icon icon="solar:box-bold-duotone" class="h-3 w-3 text-[#5F5C6D]" />
					<span class="text-[11px] font-medium text-[#5F5C6D]">{vendor.productCount} services</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Vendor Image -->
	<div class="h-[132px] w-[104px] flex-shrink-0 overflow-hidden rounded-2xl bg-black/5 ring-1 ring-black/6 sm:h-[156px] sm:w-[124px] md:h-[164px] md:w-[132px]">
		<img
			src={vendor.coverImageUrl || vendor.logoUrl || '/events.png'}
			alt={vendor.businessName}
			class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
			on:error={(e) => { (e.currentTarget as HTMLImageElement).src = '/events.png'; }}
		/>
	</div>
</a>
