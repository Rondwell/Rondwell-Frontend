<script>
    const sidebarItems = [
  {
    type: "header",
    label: "Home",
    img: '/home-com-icon.svg'
  },
  {
    type: "link",
    label: "Recent comments",
    href: "#",
    img: '/message-com-icon.svg'
  },
  {
    type: "link",
    label: "Search all threads",
    href: "/search",
    img: '/search-com-icon.svg'

  },
  {
    type: "link",
    label: "Start new thread",
    href: "/new-thread",
    img: '/message-com-icon.svg'

  },
  {
    type: "header",
    label: "Topic Forums",
    
  },
  {
    type: "link",
    label: "General",
    href: "/forums/general",
    img: '/menu-com-icon.svg'

  },
  {
    type: "link",
    label: "Main Stage",
    href: "/forums/main-stage",
    count: 15, // notification badge
    img: '/stage-com-icon.svg'

  },
  {
    type: "link",
    label: "Networking",
    href: "/forums/networking",
    img: '/network-com-icon.svg'

  },
];
</script>

<aside class="col-span-1 mt-35">
  <nav aria-label="Sidebar navigation" class="">
    <ul class="space-y-1">
      {#each sidebarItems as item}
        {#if item.type === "header"}
          <li class="mb-5 text-base font-medium text-[#290900] flex justify-start items-center gap-[6px]">
            {#if item.img}
                <img src={item.img} alt="filter icon" class="h-7 w-7" />
            {/if}
            {item.label}
          </li>
        {:else}
          <li>
            <a
              href={item.href}
              class="flex items-center justify-between rounded-md mb-5 text-base font-normal text-[#646D7C]"
            >
                
<span class='flex gap-[6px] items-center justify-center'>
    <img src={item.img} alt="filter icon" class="h-7 w-7" />
              <span>{item.label}</span>
</span>
              {#if item.count}
                <span
                  class="ml-2 rounded-full bg-[#FF3A44] size-[20px] inline-flex items-center justify-center text-[10px] font-medium text-white"
                >
                  {item.count}
                </span>
              {/if}
            </a>
          </li>
        {/if}
      {/each}
    </ul>
  </nav>
</aside>