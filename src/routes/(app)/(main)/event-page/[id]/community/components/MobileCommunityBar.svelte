<script>
    const MobileNavLink = [
        {
      type: "link",
      label: "Home",
      href: "/",
      img: "/home-com-icon.svg",
      active: true
    },
    {
      type: "link",
      label: "Recent comments",
      href: "#",
      img: "/message-com-icon.svg"
    },
    {
      type: "link",
      label: "Search",
      href: "/search",
      img: "/search-com-icon.svg"
    },
    ]
  const sidebarItems = [
    {
      type: "link",
      label: "General",
      href: "/forums/general",
      img: "/menu-com-icon.svg"
    },
    {
      type: "link",
      label: "Main Stage",
      href: "/forums/main-stage",
      img: "/stage-com-icon.svg",
      count: 15
    },
    {
      type: "link",
      label: "Networking",
      href: "/forums/networking",
      img: "/network-com-icon.svg"
    }
  ];
</script>

<!-- MOBILE ONLY -->
<nav class="md:hidden bg-transparent pt-3 pb-2 no-scrollbar">
  <div class="flex flex-col items-start gap-3 overflow-x-auto no-scrollbar">
    <div class='flex items-center gap-3 overflow-x-auto no-scrollbar'>
        {#each MobileNavLink as item}
        <a
          href={item.href}
          class="relative inline-flex items-center gap-1.5 whitespace-nowrap text-base font-normal
          
            {item.active
              ? 'text-[#141219]'
              : 'text-[#6B7280] hover:text-[#141219]'}"
          
        >
          <img
            src={item.img}
            alt={item.label}
            class="w-6.5 h-6.5 shrink-0 opacity-80"
          />

          <span class='text-base'>{item.label}</span>
        </a>
    {/each}
    </div>

    <h3 class='mt-1 ml-1 text-lg text-[#290900] font-normal'>
        Topic Forums
    </h3>

        <div class='flex items-center gap-3 overflow-x-auto no-scrollbar'>
            {#each sidebarItems as item}
        <a
          href={item.href}
          class="relative inline-flex items-center gap-1 whitespace-nowrap text-base font-normal text-[#6B7280] hover:text-[#141219]">
          <img
            src={item.img}
            alt={item.label}
            class="w-6.5 h-6.5 shrink-0 opacity-80"
          />

          <span class='text-base'>{item.label}</span>
          {#if item.count}
                <span
                  class="ml-0.5 rounded-full bg-[#FF3A44] size-[20px] inline-flex items-center justify-center text-[10px] font-medium text-white"
                >
                  {item.count}
                </span>
              {/if}
        </a>
    {/each}
        </div>
  </div>
</nav>
