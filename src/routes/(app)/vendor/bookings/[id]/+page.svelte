<script lang="ts">
  // import Modal from '$lib/components/ui/Modal.svelte';
  
  // 1. Better Typing (Optional, but recommended)
  // interface PageData { booking: { supplies: any[], eventName: string, ... } }
  let { data } = $props(); 
  
  let activeTab = $state('logistics'); 
  let supplies = $state([...data.booking.supplies]);
  let isAddSupplyOpen = $state(false);
  let newSupplyName = $state('');

  // 2. Fix: Sync state when navigating between different booking IDs
  $effect(() => {
      supplies = [...data.booking.supplies];
  });

  function addSupply() {
    if (!newSupplyName) return;
    // Pushing to the proxy works perfectly in Svelte 5
    supplies.push({ id: Date.now().toString(), name: newSupplyName, quantity: 1 });
    newSupplyName = '';
    isAddSupplyOpen = false;
    
    // Note: You will eventually need an API call here to save this to your database!
  }
</script>

<div class="mx-auto max-w-5xl p-6">
  <div class="mb-6 flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
    <div>
        <h1 class="text-2xl font-bold text-gray-900">{data.booking.eventName}</h1>
        <p class="text-sm text-gray-500">Booth #{data.booking.booth} • {data.booking.status}</p>
    </div>
    <a href="/vendor" class="text-sm font-medium text-gray-600 hover:text-black">&larr; Back to Dashboard</a>
  </div>

  <div class="mb-6 flex space-x-6 border-b text-sm font-medium">
    {#each ['logistics', 'team', 'overview'] as tab}
      <button 
        onclick={() => activeTab = tab}
        class="pb-2 capitalize {activeTab === tab ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-gray-700'}"
      >
        {tab}
      </button>
    {/each}
  </div>

  {#if activeTab === 'logistics'}
    <div class="rounded-xl border bg-white p-6 shadow-sm">
        <div class="flex justify-between mb-4">
            <h3 class="font-semibold text-gray-900">Supplies Request</h3>
            <button onclick={() => isAddSupplyOpen = true} class="text-sm text-blue-600 font-medium">+ Request Item</button>
        </div>
        <ul class="divide-y divide-gray-100">
            {#each supplies as item (item.id)}
                <li class="flex justify-between py-3">
                    <span class="text-gray-700">{item.name}</span>
                    <span class="text-gray-500 text-sm">Qty: {item.quantity}</span>
                </li>
            {/each}
            {#if supplies.length === 0}
                <li class="text-gray-400 text-sm italic py-2">No supplies requested yet.</li>
            {/if}
        </ul>
    </div>
  {:else if activeTab === 'team'}
    <div class="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
        Team management features coming soon.
    </div>
  {:else}
    <div class="p-4 bg-gray-50 rounded-lg">
        <p class="font-bold">Contribution: ₦{data.booking.contribution.toLocaleString()}</p>
        <p class="text-sm text-gray-500">Status: {data.booking.paymentStatus}</p>
    </div>
  {/if}
</div>

<!-- <Modal bind:open={isAddSupplyOpen} title="Request Item">
    <div class="space-y-4">
        <input 
            type="text" 
            bind:value={newSupplyName} 
            class="w-full border p-2 rounded focus:border-black focus:ring-1 focus:ring-black outline-none transition" 
            placeholder="Item Name" 
        />
        <button class="w-full bg-black text-white p-2 rounded hover:bg-gray-800 transition" onclick={addSupply}>
            Add Item
        </button>
    </div>
</Modal> -->