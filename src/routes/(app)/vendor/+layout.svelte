<script lang="ts">
    import { page } from '$app/stores';

    // CORRECT PATHS: Go up one level to (app), then into components
    import Sidebar from '../components/Sidebar.svelte'; 
    import SideMenu from '../components/SideMenu.svelte'; 

    const vendorMenuItems = [
        { label: "Overview", icon: "heroicons:squares-2x2", link: "/vendor" },
        { label: "Product/Services", icon: "heroicons:archive-box", link: "/vendor/products" },
        { label: "Collaboration", icon: "heroicons:users", link: "/vendor/collab" },
        { label: "Insights", icon: "heroicons:chart-bar", link: "/vendor/insights" },
        { label: "Settings", icon: "heroicons:cog-6-tooth", link: "/vendor/settings" }
    ];

    $: activeItem = vendorMenuItems.find(item => $page.url.pathname === item.link)?.label || "Overview";
    
    // Check if we are on the onboarding page so we can hide sidebars
    $: isOnboarding = $page.url.pathname.includes('/onboarding');
    
    const vendorTheme = 'linear-gradient(180deg, #d1e8f5 0%, #EAF2F5 17%, #f4f5f6 35%)';
</script>

<div class="flex min-h-screen flex-col md:flex-row text-sm font-medium" style="background-image: {vendorTheme};">
    
    {#if !isOnboarding}
        <div class="hidden md:block sticky top-0 h-screen z-20">
            <Sidebar background_color="transparent" />
        </div>

        <div class="hidden w-64 flex-col border-r border-gray-200/50 bg-white/30 md:flex sticky top-0 h-screen z-10">
            <SideMenu items={vendorMenuItems} {activeItem} />
        </div>
    {/if}

    <main class="flex-1 p-4 md:p-6 overflow-y-auto h-screen relative z-0">
        <div class="min-h-full w-full rounded-2xl bg-white/60 p-6 shadow-sm backdrop-blur-sm border border-white/50">
            <slot />
        </div>
    </main>

</div>
