<script lang="ts">
    import Icon from '@iconify/svelte';

    const vendorName = "Megaexe Limited";
    
    const stats = [
        { 
            title: "Total Listings", 
            count: 8, 
            // Design: Primary is Black, Secondary is White with border
            buttons: [
                { label: "View All Listings", primary: true }, 
                { label: "Review Orders", primary: false }     
            ],
            icon: "heroicons:building-storefront",
            iconColor: "text-[#008f51]", 
            iconBg: "bg-[#e5fcf4]", 
            barColor: "bg-[#008f51]"
        },
        { 
            title: "Pending Orders", 
            count: 0, 
            buttons: [
                { label: "View Orders", primary: true }
            ],
            icon: "heroicons:shopping-bag",
            iconColor: "text-[#9d5bd2]", 
            iconBg: "bg-[#f5eafa]", 
            barColor: "bg-[#9d5bd2]"
        },
        { 
            title: "Total Revenue", 
            count: "₦0.00", 
            buttons: [
                { label: "View Financials", primary: true }
            ],
            icon: "heroicons:banknotes",
            iconColor: "text-[#0ea5e9]", 
            iconBg: "bg-[#e0f2fe]", 
            barColor: "bg-[#0ea5e9]"
        }
    ];
</script>

<div class="w-full h-full">
    
    <header class="flex flex-col justify-between gap-4 md:flex-row md:items-center mb-8">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">{vendorName}</h1>
            <div class="mt-1 flex items-center gap-2">
                <div class="h-2 w-2 rounded-full bg-green-500"></div>
                <span class="text-xs font-medium text-gray-500">Online</span>
            </div>
        </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {#each stats as stat}
            <div class="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm h-full">
                <div class="flex items-start justify-between mb-6">
                    <div class="flex h-10 w-10 items-center justify-center rounded-full {stat.iconBg} {stat.iconColor}">
                        <Icon icon={stat.icon} class="h-5 w-5" />
                    </div>
                    <div class="flex gap-2">
                         {#each stat.buttons as btn}
                            <button class="rounded-lg border px-3 py-1.5 text-[10px] font-bold transition
                                {btn.primary 
                                    ? 'bg-black text-white border-black hover:bg-gray-800' 
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}">
                                {btn.label}
                            </button>
                         {/each}
                    </div>
                </div>
                
                <div>
                    <h3 class="text-3xl font-bold text-gray-900 mb-1">{stat.count}</h3>
                    <p class="mb-4 text-xs font-medium text-gray-400">{stat.title}</p>
                    <div class="flex gap-1 h-1.5 w-full max-w-[120px]">
                        {#each Array(10) as _, i}
                            <div class="flex-1 rounded-full {i < 4 ? stat.barColor : 'bg-gray-100'}"></div>
                        {/each}
                    </div>
                </div>
            </div>
        {/each}
    </div>

    <div class="grid gap-8 lg:grid-cols-3">
        
        <div class="lg:col-span-1 space-y-6">
            <section>
                <div class="flex items-center gap-2 mb-4">
                    <h2 class="text-lg font-bold text-gray-900">Collaboration Request</h2>
                    <span class="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">0</span>
                </div>
                
                <div class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
                    <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100">
                        <Icon icon="heroicons:user-group" class="h-6 w-6 text-gray-300" />
                    </div>
                    <h3 class="text-sm font-semibold text-gray-900">No Collaboration Request, yet</h3>
                    <p class="mt-1 px-8 text-[11px] leading-relaxed text-gray-400 max-w-[200px]">
                        Collaboration requests will display here once you send/receive one.
                    </p>
                </div>
            </section>
        </div>

        <div class="lg:col-span-2 space-y-10">
            <section>
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-lg font-bold text-gray-900">Your Latest Products</h2>
                    <div class="flex gap-2">
                        <button class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50">+ Add New Product</button>
                        <button class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50">View All Products</button>
                    </div>
                </div>

                <div class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
                    <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100">
                        <Icon icon="heroicons:squares-plus" class="h-6 w-6 text-gray-300" />
                    </div>
                    <h3 class="text-sm font-semibold text-gray-900">No Product/Services, yet</h3>
                    <p class="mt-1 mb-5 px-8 text-[11px] text-gray-400">
                        You haven't added any products yet. Start by adding your first one!
                    </p>
                    <button class="rounded-lg bg-white border border-gray-200 px-5 py-2.5 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50">
                        + ADD NEW PRODUCT
                    </button>
                </div>
            </section>

            <section>
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                        Recent Transactions 
                        <Icon icon="heroicons:information-circle" class="h-4 w-4 text-gray-300" />
                    </h2>
                    <button class="text-xs font-medium text-gray-400 hover:text-gray-600">View transaction history</button>
                </div>

                 <div class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-12 text-center">
                    <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100">
                        <Icon icon="heroicons:receipt-refund" class="h-6 w-6 text-gray-300" />
                    </div>
                    <h3 class="text-sm font-semibold text-gray-900">No Transaction history, yet</h3>
                    <p class="mt-1 text-[11px] text-gray-400">No recent transactions.</p>
                </div>
            </section>
        </div>
    </div>
</div>