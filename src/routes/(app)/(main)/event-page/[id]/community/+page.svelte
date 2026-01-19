<script>
	import CommunitySideBar from "./components/CommunitySideBar.svelte";
	import FeaturesPost from "./components/FeaturesPost.svelte";
	import MobileCommunityBar from "./components/MobileCommunityBar.svelte";

      const posts = [
    {
      id: 1,
      author: "Jennifer Mendy",
      avatar: "/user1-icon.svg",
      time: "13 days ago",
      featured: true,
      pinned: true,
      comments: 13,
      likes: 24,
      title: "How Online Learning is Completely Transforming the Western Education",
      image: '/community-image.png'
    },
    {
      id: 2,
      author: "Alex Johnson",
      avatar: "/user2-icon.svg",
      time: "2 days ago",
      featured: true,
      pinned: false,
      comments: 8,
      likes: 15,
      title: "Are startup accelerators still worth it in 2025?",
      description: "Online learning isn’t just an alternative—it's redefining the foundation of education in the West. As technology continues to advance, the traditional classroom model is likely to become just one part of a much larger, more flexible, and inclusive.",
      image: null
    },
    {
      id: 3,
      author: "Jennifer Mendy",
      avatar: "/user3-icon.svg",
      time: "1 days ago",
      featured: false,
      pinned: true,
      comments: 23,
      likes: 10,
      title: "How Interactive and Skill-Based Learning Is Revolutionizing the Mo....",
      image: '/community-image.png'
    },
  ];

</script>

<div class='w-full'>
    <MobileCommunityBar/>
    <div class='my-8.5 relative'>
        <div class='relative'>
            <img src="/community-banner.png" alt="community-banner" srcset="" class='h-[153px] w-full rounded-[20px]'>
            <div class='bg-white size-30.5 rounded-2xl inline-flex items-center justify-center absolute -bottom-15 left-4 md:left-10'>
                <img src="/community-user.svg" alt="community-user" srcset="" class='size-27.5 border border-[#F2F2F2] rounded-[12px]'>
            </div>
        </div>
    </div>

    <div class='grid grid-cols-5 gap-10 mt-20 md:mt-1'>
    <CommunitySideBar />
    
    <div class='flex flex-col gap-5 col-span-5 md:col-span-4'>
        <div class='mb-7'>
            <h2 class='text-[32px] text-[#192226] font-bold mb-6'>
            Megaexe Party Community
        </h2>
        <div class='flex flex-col sm:flex-row justify-between items-center'>
            <div class='space-x-[13px] space-y-[13px] sm:space-y-0'>
                <button class='inline-flex items-center justify-center gap-[3px] px-4 py-2 border border-[#AA5C00] rounded-[8px] text-[#AA5C00]'>
                    <span>
                        <img src="/bell.svg" alt="message" class="h-5 w-5" />
                    </span> Subscribe
                </button>
            <button class='inline-flex items-center justify-center gap-[3px] px-4 py-2 border border-[#AA5C00] rounded-[8px] text-[#AA5C00]'>
                <span>
                    <img src="/award.svg" alt="message" class="h-5 w-5" />
                </span> Leaderboard
            </button>
            <button class='inline-flex items-center justify-center gap-[3px] px-4 py-2 border border-[#AA5C00] rounded-[8px] text-[#AA5C00]'>
                <span class=''>
                    <img src="/message-add.svg" alt="message" class="h-5 w-5" />
                </span> Start new thread
            </button>
             <button
					class="inline-flex sm:hidden cursor-pointer items-center gap-2 rounded-md bg-gray-300 px-3 py-2 text-xs text-[#616265] md:text-sm"
				>
					<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
					Trending
				</button>
            </div>
            <button
					class="hidden sm:inline-flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-gray-300 px-3 py-2 text-xs text-[#616265] md:text-sm"
				>
					<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
					Trending
				</button>
        </div>
        </div>
        <div class='p-[22.5px] bg-white outline-2 outline-black/3 rounded-[15px] flex flex-col sm:flex-row gap-3.5 sma:gap-0 justify-between items-center'>
            <div class='flex items-center justify-center gap-3.5'>
                <button class='size-[37.8px] bg-[#F6F5F3] inline-flex justify-center items-center p-[9.45px] rounded-full shadow-[0_4px_3px_rgba(16,24,40,0.1)]' aria-label='back' >
                    <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.9569 9.44623H3.93945M3.93945 9.44623L9.44818 14.955M3.93945 9.44623L9.44818 3.9375" stroke="#344054" stroke-width="1.57433" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <div class='flex items-center justify-center gap-4'>
                    <img src='/table-tennis.svg' class='w-8.5 h-8.5' alt='icon' />
                    <span class='flex flex-col gap-1'>
                        <h3 class='text-black text-base font-bold leading-5'>Home</h3>
                        <p class='text-black/50 text-sm font-light'>Share and discuss tech, products, business, startups, or product recommendations.</p>
                    </span>
                </div>
            </div>
            <button class='inline-flex w-full max-w-[255px] sm:max-w-[160px] items-center text-sm sm:text-xs xl:text-sm justify-center gap-[3px] px-4 py-2 border-2 border-[#AA5C00] rounded-full text-[#AA5C00]'>
                <span>
                    <img src="/message-add.svg" alt="message" class="h-5 w-5" />
                </span> Start thread
            </button>
        </div>
          {#each posts as post (post.id)}
    <FeaturesPost {post} />
  {/each}
    </div>
</div>
</div>