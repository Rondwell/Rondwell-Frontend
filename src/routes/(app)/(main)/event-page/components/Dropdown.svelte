<script lang="ts">
	import { form } from "$app/server";
  import { createEventDispatcher, onMount, onDestroy } from "svelte";

interface DropdownOption {
    label: string;
    value: string;
  }

  export let options: DropdownOption[] = [];
  export let value: string | null = null;
  export let placeholder = "Select an option";
  export let disabled = false;

  const dispatch = createEventDispatcher<{
    change: { value: string | null };
  }>();

  let open = false;
  let buttonRef: HTMLButtonElement;
  let menuRef: HTMLDivElement;

$: selectedOption = options.find((opt) => opt.value === value) ?? null;

  function toggle(event: MouseEvent) {
    event.preventDefault();
    if (disabled) return;
    open = !open;
  }

  function select(option: DropdownOption) {
    dispatch("change", { value: option.value });
    open = false;
  }

  function handleClickOutside(event: MouseEvent) {
    if (
      open &&
      !buttonRef.contains(event.target as Node) &&
      !menuRef.contains(event.target as Node)
    ) {
      open = false;
    }
  }

  onMount(() => {
    document.addEventListener("mousedown", handleClickOutside);
  });

  onDestroy(() => {
    document.removeEventListener("mousedown", handleClickOutside);
  });

  console.log('Dropdown options:', selectedOption?.label);
</script>

<div class="relative w-full">
  <!-- Button -->
  <button
    bind:this={buttonRef}
    on:click={toggle}
    disabled={disabled}
    class="flex w-full items-center justify-between  px-5 py-3 pr-12 *:text-sm transition  rounded-[9px] bg-[#EBEBEC] border border-[#ECEDED] 
      focus:outline-none focus:ring-none
      disabled:cursor-not-allowed disabled:bg-gray-100 shadow-none"
  >
    <span class="truncate text-left text-[#3C3D3F] ">
      {selectedOption?.label ?? placeholder}
    </span>

   <svg class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#696B6D] transition-transform duration-200 {open ? 'rotate-180' : ''}" width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
					  <path d="M9.64673 0.779297C10.2857 1.434 10.4282 2.38163 9.99829 3.19434V3.19336L7.02954 8.83594V8.83496C6.67257 9.5174 5.96877 9.94333 5.19751 9.94336C4.42623 9.94336 3.72344 9.51741 3.36646 8.83496L3.36548 8.83594L0.395752 3.19336L0.396729 3.19238C0.229793 2.87882 0.149658 2.54839 0.149658 2.21777C0.149783 1.69095 0.355805 1.18125 0.747314 0.779297C1.38686 0.124028 2.33407 -0.0336343 3.15161 0.375L4.72876 1.16406C4.98125 1.29031 5.2809 1.30613 5.54907 1.21094L5.66138 1.16406L7.24341 0.375C8.06077 -0.0334866 9.00722 0.124375 9.64673 0.779297ZM9.21411 2.22266C9.21398 1.97004 9.11179 1.74227 8.96997 1.57031L8.90649 1.5C8.64907 1.23399 8.19657 1.04922 7.69849 1.2959L6.12134 2.08496H6.12036C5.61103 2.3372 5.02177 2.36885 4.49243 2.17969L4.2688 2.08496L2.69165 1.2959H2.69067C2.19381 1.04545 1.74196 1.23307 1.48364 1.5C1.22394 1.76844 1.04521 2.2205 1.30396 2.71289L4.27368 8.35547C4.45721 8.70546 4.80075 8.91309 5.19263 8.91309C5.58448 8.91307 5.92805 8.70544 6.11157 8.35547L9.09106 2.71289H9.09009C9.18044 2.54077 9.21411 2.37483 9.21411 2.22266Z" fill="#A9AAAA" stroke="#A9AAAA" stroke-width="0.3"/>
					</svg>
  </button>

  <!-- Menu -->
  <div
    bind:this={menuRef}
    class="absolute z-10 mt-2 w-full origin-top rounded-lg border bg-white shadow-lg
      transition-all duration-200 ease-out {open ? 'scale-y-100 opacity-100' : 'pointer-events-none scale-y-95 opacity-0'}"
    style="transform-origin: top"
  >
    <!-- Header / placeholder shown at top when open -->
    <div class="px-4 py-3 text-sm text-[#B3B4B4] text-base">
      {placeholder}
    </div>

    <div class="max-h-60 overflow-y-auto">
      {#each options as option, i (option.value)}
        <button
          type="button"
          on:click={() => select(option)}
          on:keydown={(e) => e.key === 'Enter' && select(option)}
          class="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-gray-100 focus:outline-none"
        >
          <span class="w-4 flex items-start justify-center">
            {#if option.value === value}
              <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect y="4.95703" width="2.25006" height="7.50019" rx="1.12503" transform="rotate(-45 0 4.95703)" fill="#3E4041"/>
<rect x="12.3906" width="2.228" height="12.2572" rx="1.114" transform="rotate(45 12.3906 0)" fill="#3E4041"/>
</svg>

            {/if}
          </span>

          <span class="flex-1 text-[#3E4041] text-base {option.value === value ? 'font-medium' : ''}">
            {option.label}
          </span>
        </button>
      {/each}
    </div>
  </div>
</div>
