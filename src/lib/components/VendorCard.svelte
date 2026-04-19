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
</script>

<a
	href="/vendor-page/{vendor.slug}"
	class="flex cursor-pointer gap-3 rounded-xl bg-[#FDFDFD] p-3 no-underline transition-shadow hover:shadow-md sm:gap-4 sm:p-4 md:p-5"
>
	<!-- Left content -->
	<div class="flex min-w-0 flex-1 flex-col justify-between">
		<div class="space-y-1 sm:space-y-1.5">
			<!-- Business type -->
			<span class="text-[11px] text-[#B9BABA] sm:text-xs">{vendor.businessType}</span>

			<!-- Business name -->
			<div class="flex items-start gap-1.5">
				<Icon icon="mdi:store" class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#146AEB] sm:h-4 sm:w-4" />
				<h3 class="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 sm:text-[15px]">
					{vendor.businessName}
				</h3>
			</div>

			<!-- Bio -->
			{#if vendor.bio}
				<p class="line-clamp-2 text-[11px] text-[#B9BABA] sm:text-xs">{vendor.bio}</p>
			{/if}

			<!-- Location -->
			{#if vendor.location || vendor.serviceArea}
				<div class="flex items-center gap-1.5 text-[11px] text-[#B9BABA] sm:text-xs">
					<Icon icon="mdi:map-marker-outline" class="h-3 w-3 flex-shrink-0 sm:h-3.5 sm:w-3.5" />
					<span class="truncate">{vendor.location || vendor.serviceArea}</span>
				</div>
			{/if}
		</div>

		<!-- Tags -->
		<div class="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
			<span class="rounded-full bg-[#E2E8FC] px-2 py-0.5 text-[10px] font-medium text-[#146AEB] sm:text-[11px]">
				Vendor
			</span>
			{#if vendor.businessType}
				<span class="rounded-full bg-[#F3F0FF] px-2 py-0.5 text-[10px] font-medium text-[#7C3AED] sm:text-[11px]">
					{vendor.businessType}
				</span>
			{/if}
			{#if vendor.productCount && vendor.productCount > 0}
				<div class="flex items-center gap-1 rounded-full bg-[#F4F4F4] px-2 py-0.5">
					<Icon icon="mdi:package-variant-closed" class="h-3 w-3 text-[#7F7F81]" />
					<span class="text-[10px] font-medium text-[#7F7F81] sm:text-[11px]">{vendor.productCount} services</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Vendor Image -->
	<div class="h-[140px] w-[100px] flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-[160px] sm:w-[120px] md:h-[170px] md:w-[130px]">
		<img
			src={vendor.coverImageUrl || vendor.logoUrl || '/events.png'}
			alt={vendor.businessName}
			class="h-full w-full object-cover"
			on:error={(e) => { (e.currentTarget as HTMLImageElement).src = '/events.png'; }}
		/>
	</div>
</a>
