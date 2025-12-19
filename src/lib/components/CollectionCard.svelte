<script lang="ts">
	export let collection: any;
	export let type: string = 'subscription';

	$: subscribersCount = collection?.subscribers?.length ?? 0;
	$: adminsCount = collection?.admins?.length ?? 1;
</script>

<div class="w-full rounded-md bg-[#FDFDFD] p-3 md:p-6">
	<div class="flex flex-col gap-6 md:flex-row">
		<div
			class="flex w-full {type === 'subscription'
				? 'items-center md:flex-col'
				: 'flex-col'} gap-3 md:max-w-50 md:items-start lg:max-w-70"
		>
			<img
				src={collection.image}
				alt="Collection"
				class="h-16 w-20 rounded-[7.5px] object-cover md:h-20"
			/>

			<div class="text-sm text-[#132B3C] md:w-30 md:text-xl">
				{collection.name}
			</div>

			<!-- Subscribers -->
			<div class="text-xs text-[#616265]">
				{#if subscribersCount > 0}
					{subscribersCount} Subscriber{subscribersCount > 1 ? 's' : ''}
				{:else}
					No subscribers
				{/if}
			</div>

			<!-- Admin indicator  -->
			{#if type === 'mine'}
				<div class="flex items-center gap-1 text-xs text-[#616265]">
					<img src="/face-1.svg" alt="profile icon" class="h-6 w-6" />
					{adminsCount} Admin{adminsCount > 1 ? 's' : ''}
				</div>
			{/if}

			{#if type !== 'mine'}
				<span
					class="{type === 'subscription'
						? 'hidden'
						: 'flex'} w-fit max-w-[182.31px] items-center gap-1 rounded-md bg-[#F4F4F4] p-2 text-sm font-medium text-[#616265] md:flex md:w-full md:justify-between"
				>
					Collection

					<svg
						width="12"
						height="11"
						viewBox="0 0 12 11"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M0.94043 0.786133C1.71239 0.144501 2.81818 0.00551646 3.7666 0.432617L10.3916 3.40234..."
							fill="#616265"
							stroke="#616265"
							stroke-width="0.375009"
						/>
					</svg>
				</span>
			{/if}
		</div>

		{#if collection?.events?.length > 0}
			<div class="w-full flex-1">
				<p class="mb-6 text-sm text-[#B3B4B4]">Upcoming events</p>
				<div class="space-y-3">
					{#each collection.events as event}
						<div class="border-b pb-5 last:border-0 last:pb-0 md:border-0">
							<div class="font-light">{event.title}</div>
							<div class="text-xs text-[#B3B4B4]">{event.date}</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if type === 'subscription'}
			<span
				class="flex w-full items-center justify-center gap-2 rounded-md bg-[#F4F4F4] p-2 font-medium text-[#616265] md:hidden"
			>
				View Collection
				<svg
					width="17"
					height="17"
					viewBox="0 0 17 17"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M1.22949 1.14551C2.31302 0.120655 3.87632 -0.106141 5.21875 0.582031L14.7285 5.43262L14.9346 5.5459C15.9417 6.14555 16.5624 7.21088 16.5625 8.375C16.5625 9.53912 15.9417 10.6044 14.9346 11.2041L14.7285 11.3174L5.21875 16.167C4.69957 16.4353 4.1537 16.5624 3.60742 16.5625C2.73852 16.5625 1.89671 16.2333 1.23047 15.6045H1.22949C0.144026 14.5776 -0.118138 13.0557 0.560547 11.7402L1.88965 9.16406C2.14058 8.6777 2.14063 8.08941 1.88867 7.59375V7.59277L0.560547 5.00977C-0.118171 3.69427 0.143894 2.17243 1.22949 1.14551ZM3.61523 1.75586C3.10583 1.75587 2.65822 1.98559 2.34961 2.27734H2.34863C1.8852 2.71197 1.56446 3.47511 1.99316 4.31348L3.32227 6.88965V6.89063C3.80091 7.82689 3.80096 8.93192 3.32227 9.86816V9.86914L1.99316 12.4453C1.55777 13.282 1.88406 14.0447 2.34863 14.4805C2.81515 14.918 3.60933 15.2246 4.47363 14.7842L13.9844 9.93359C14.5965 9.62247 14.957 9.0413 14.957 8.38281C14.9569 7.7245 14.5963 7.1441 13.9844 6.83301L13.9834 6.83203L4.47363 1.96582C4.17331 1.81306 3.88273 1.75586 3.61523 1.75586Z"
						fill="#616265"
						stroke="#616265"
						stroke-width="0.375009"
					/>
					<rect
						x="8.14063"
						y="9.21094"
						width="5.43175"
						height="1.60014"
						rx="0.800071"
						transform="rotate(-180 8.14063 9.21094)"
						fill="#616265"
						stroke="#616265"
						stroke-width="0.375009"
					/>
				</svg></span
			>
		{/if}
	</div>
</div>
