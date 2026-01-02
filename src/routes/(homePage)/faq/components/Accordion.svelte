<script>
/**
 * @type {number}
 */
  let openItem;
  
const items = [
    {
      question: "What is Rondwell?",
      answer: "Rondwell is an all-in-one event technology platform that helps organizers create, manage, promote, and monetize virtual, physical, and hybrid events."
    },
    {
      question: "Who can use Rondwell?",
      answer: "Event organizers, businesses, communities, vendors, exhibitors, speakers, and attendees can all use Rondwell."
    },
    {
      question: "Does Rondwell support paid and free events?",
      answer: "Yes. Organizers can create free or paid events with flexible ticketing, pricing, and capacity controls."
    },
    {
      question: "What payment currencies does Rondwell support?",
      answer: "Rondwell supports multi-currency payments and settlements, including NGN, USD, and other supported currencies via integrated payment partners."
    },
    {
      question: "Can organizers manage vendors, speakers, and exhibitors?",
      answer: "Yes. Rondwell provides dedicated tools for managing vendors, speakers, exhibitors, schedules, and event resources."
    },
    {
      question: "Does Rondwell support virtual events?",
      answer: "Yes. Rondwell supports virtual, physical, and hybrid events with integrations for meeting platforms and custom links."
    },
    {
      question: "Is my data secure on Rondwell?",
      answer: "Absolutely. We use industry-standard security practices and continuously improve our infrastructure to protect user data."
    }
  ];
  /**
   * @param {number} index
   */

  function toggleItem(index) {
    openItem = openItem === index ? -1 : index;
  }
</script>

<div class="p-4 md:p-6 lg:p-8">
  <div class="max-w-5xl mx-auto space-y-4">
    {#each items as item, i}
      <div class="rounded-lg shadow-sm overflow-hidden">
        <button
          on:click={() => toggleItem(i)}
          class="w-full px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6 flex items-center justify-between text-left transition-colors"
        >
          <h3 class="text-lg md:text-xl font-semibold text-gray-900 pr-4">
            {item.question}
          </h3>
          <div class="flex-shrink-0">
            {#if openItem === i}
              <svg class="w-5 h-5 md:w-6 md:h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            {:else}
              <svg class="w-5 h-5 md:w-6 md:h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            {/if}
          </div>
        </button>
        
        {#if openItem === i}
          <div class="px-4 pb-4 md:px-6 md:pb-5 lg:px-8 lg:pb-6 text-gray-700 text-base md:text-lg leading-relaxed">
            {item.answer}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>