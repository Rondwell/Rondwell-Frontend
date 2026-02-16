<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import Icon from "@iconify/svelte";

  const user = {
    name: "Innocent James"
  };

  const stats = {
    revenue: "$24,895",
    growth: "+4.5%"
  };
  type RevenueDatum = {
  month: string;
  pending: number;
  accepted: number;
  completed: number;
};


  const chartData: RevenueDatum[] = [
  { month: "J", pending: 2200, accepted: 3000, completed: 10000 },
  { month: "F", pending: 2000, accepted: 3200, completed: 10000 },
  { month: "Ma", pending: 2000, accepted: 3100, completed: 10000 },
  { month: "A", pending: 2000, accepted: 3300, completed: 10000 },
  { month: "Ma", pending: 2000, accepted: 3500, completed: 10000 },
  { month: "Ju", pending: 2000, accepted: 3600, completed: 10000 },
  { month: "Jul", pending: 2000, accepted: 3700, completed: 10000 },
  { month: "Au", pending: 2000, accepted: 3800, completed: 10000 },
  { month: "S", pending: 2000, accepted: 3900, completed: 10000 },
  { month: "O", pending: 2000, accepted: 4000, completed: 10000 },
  { month: "N", pending: 2000, accepted: 4100, completed: 10000 },
  { month: "D", pending: 2000, accepted: 4300, completed: 10000 }
];


  onMount(() => {
    const container = document.getElementById("revenue-chart");
    if (!container) return;

    const width = container.clientWidth;
    const height = 220;
    const margin = { top: 10, right: 10, bottom: 30, left: 40 };

    d3.select(container).selectAll("*").remove();

    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height + margin.top + margin.bottom);

    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const stack = d3
  .stack<RevenueDatum>()
  .keys(["pending", "accepted", "completed"]);

const series = stack(chartData);
type StackKey = "pending" | "accepted" | "completed";



    const x = d3
      .scaleBand()
      .domain(chartData.map(d => d.month))
      .range([0, width - margin.left - margin.right])
      .padding(0.45);

    const y = d3
      .scaleLinear()
      .domain([0, 20000])
      .range([height, 0]);

   const colors: Record<StackKey, string> = {
  pending: "#fb923c",
  accepted: "#60a5fa",
  completed: "#22c55e"
};


    chart
      .selectAll("g")
      .data(series)
      .enter()
      .append("g")
      .attr("fill", d => colors[d.key as StackKey])
      .selectAll("rect")
      .data(d => d)
      .enter()
      .append("rect")
      .attr("x", d => x(d.data.month)!)
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth())
      .attr("rx", 4);

    chart.append("g")
      .call(d3.axisLeft(y).ticks(4).tickFormat(d => `${Number(d) / 1000}k`))
      .selectAll("path,line")
      .remove();

    chart.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("path,line")
      .remove();
  });
</script>


<div class="min-h-screen px-0.5 py-2 space-y-2">

  <!-- ================= PRODUCTS / SERVICES ================= -->
  <div class=" bg-white rounded-xl p-4 shadow-sm space-y-6">
   <!-- Header Row -->
<div class="flex items-center justify-between gap-6 whitespace-nowrap">
  <!-- LEFT -->
  <div class="flex items-center gap-6 text-sm flex-nowrap">
    <span class="text-base text-black-900">Products/Services</span>

    <span class="flex items-center gap-2 text-gray-500">
      <span class="w-2 h-2 bg-orange-500 rounded-full"></span>
      Pending orders
    </span>

    <span class="flex items-center gap-2 text-gray-500">
      <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
      Accepted orders
    </span>

    <span class="flex items-center gap-2 text-gray-500">
      <span class="w-2 h-2 bg-green-500 rounded-full"></span>
      Completed orders
    </span>
  </div>

  <!-- RIGHT -->
  <button
  class="border px-4 py-1.5 rounded-lg text-sm text-gray-600 flex items-center gap-2 flex-shrink-0"
>
  This Month
  <img src="/arrow-down.png"class="h-2 w-3"/>
</button>

</div>

    <!-- Revenue -->
    <div class="flex items-center gap-4">
      <div class="text-sm text-gray-500">TOTAL REVENUE</div>
      <div class="text-xl font-semibold">{stats.revenue}</div>
      <span class="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
        {stats.growth}
      </span>
    </div>

<!-- Chart Wrapper -->
<div class="bg-white rounded-xl p-4">
  <div class="flex">
    <!-- Y Axis labels -->
    <div class="flex flex-col justify-between h-56 text-xs text-gray-400 pr-3">
      <span>15k</span>
      <span>10k</span>
      <span>5k</span>
      <span>0</span>
    </div>

    <!-- Chart Area -->
    <div class="flex-1">
      <div
        id="revenue-chart"
        class="h-56 border-l border-b border-gray-300"
      ></div>
    </div>
  </div>
</div>
</div>





  <!-- ================= QUICK ACTIONS ================= -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="relative overflow-hidden rounded-xl p-4 flex items-start gap-3
            bg-gradient-to-br from-green-50 via-green-100 to-green-50">

  <!-- Decorative lines -->
  <span class="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-green-200/60"></span>
  <span class="absolute bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-green-200/60"></span>

  <!-- Icon -->
  <img src="/acc2.svg" />

  <!-- Text -->
  <div class="z-10">
    <h3 class="font-medium text-green-900">Manage Product/Services</h3>
    <p class="text-sm text-green-700/70">View and manage listings</p>
  </div>
</div>

   <div class="relative overflow-hidden rounded-xl p-4 flex items-start gap-3
            bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-50">

  <!-- Icon -->
  <img src="/acc3.svg"/>

  <!-- Text wrapper -->
  <div>
    <h3 class="font-medium">Manage Orders</h3>
    <p class="text-sm text-gray-500">Unlimited</p>
  </div>

</div>


    <div class="bg-purple-50 p-4 rounded-xl flex items-start gap-3">
  <!-- In Progress Icon -->
  <img src="/acc.svg"/>

  <!-- Text -->
  <div>
    <h3 class="font-medium">Manage Profile</h3>
    <p class="text-sm text-gray-500">View and manage your profile</p>
  </div>
</div>

  </div>

  <!-- ================= PERFORMANCE ================= -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

    <!-- Performance Insights -->
    <div class="bg-white rounded-xl p-6 shadow-sm space-y-4">
      <h3 class="font-medium">Performance Insights</h3>

      <div class="flex gap-10">
        <div>
          <p class="text-xs text-gray-500">Yesterday</p>
          <p class="text-2xl font-semibold">4</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Past Month</p>
          <p class="text-2xl font-semibold">6</p>
        </div>
      </div>

      <div>
  <div>
  <p class="text-sm font-medium mb-2">Live Traffic</p>
  <div class="space-y-2">

    <!-- Visitor from Direct -->
    <div class="bg-gray-100 rounded-lg p-3 text-sm flex justify-between items-start">
      <!-- Left: Icon + Text -->
      <div class="flex flex-col">
        <div class="flex items-center gap-2">
          <Icon icon="mdi:account" class="w-4 h-4 text-gray-500" />
          <span>Visitor from Direct</span>
        </div>
        <div class="flex items-center gap-1 ml-6 mt-1 text-gray-500">
          <Icon icon="mdi:map-marker" class="w-3 h-3 text-gray-500" />
          <span>Lagos,Lagos</span>
        </div>
      </div>

      <!-- Right: Time + Slide-down Icon -->
      <div class="flex items-center gap-2 mt-1">
        <span class="text-xs text-gray-400">18m</span>
        <Icon icon="mdi:chevron-down" class="w-4 h-4 text-gray-400" />
      </div>
    </div>

    <!-- Visitor from rondwell.com -->
    <div class="bg-gray-100 rounded-lg p-3 text-sm flex justify-between items-start">
      <div class="flex flex-col">
        <div class="flex items-center gap-2">
          <Icon icon="mdi:web" class="w-4 h-4 text-gray-500" />
          <span>Visitor from rondwell.com</span>
        </div>
        <div class="flex items-center gap-1 ml-6 mt-1 text-gray-500">
          <Icon icon="mdi:map-marker" class="w-3 h-3 text-gray-500" />
          <span>Lagos,Lagos</span>
        </div>
      </div>

      <!-- Right: Time + Slide-down Icon -->
      <div class="flex items-center gap-2 mt-1">
        <span class="text-xs text-gray-400">1h</span>
        <Icon icon="mdi:chevron-down" class="w-4 h-4 text-gray-400" />
      </div>
    </div>  

  </div>
</div>


</div>

    </div>

    <!-- Top Stats -->
  <div class="bg-white rounded-xl p-6 shadow-sm space-y-4">
  <!-- Top Product -->
  <div class="flex justify-between items-center">
    <p class="text-sm font-large">Top Product</p>
  </div>
  <div class="flex justify-between items-center">
  <p class="text-sm text-gray-500">rondwell.com</p>
  <span class="text-sm text-gray-500">100%</span>
  </div>
  <!-- Top Cities Orders -->
  <div>
    <p class="text-sm font-large mt-4">Top Cities Orders</p>
    <div class="flex justify-between text-sm text-gray-500 mt-6">
      <span>Lagos</span>
      <span>67%</span>
    </div>
    <div class="flex justify-between text-sm text-gray-500">
      <span>Port Harcourt</span>
      <span>33%</span>
    </div>
  </div>

  <!-- Top Sources -->
  <div>
    <p class="text-sm font-medium">Top <br>Sources</p>
    <p class="text-xs text-gray-400">
      Set up a tracking link by adding? 
    </p>
    <div class="mt-4 space-y-2 text-gray-500">
    <span class="text-sm text-gray-400">utm_source=your-link-name</span> <span class="text-sm font-medium text-gray-500">to your URL</span>
    </div>
  </div>
</div>


  </div>

  <!-- ================= PRODUCT LISTING ================= -->
  <div class="bg-white rounded-xl p-6 shadow-sm space-y-4">
    <div class="flex justify-between items-center">
      <h3 class="font-medium">Product/Service Listing</h3>
      <div class="flex gap-2">
        <button class="px-3 py-1 rounded bg-gray-200 text-sm">Active</button>
        <button class="px-3 py-1 rounded text-sm">Inactive</button>
      </div>
    </div>
<div
								class="absolute top-0 -left-[29px] h-3 w-3 rounded-full bg-gray-300 ring-4 ring-gray-50"
							></div>
    <div class="flex gap-4 items-center">
      <div class="text-center text-sm text-gray-500">
        <p>Sep</p>
        <p class="font-semibold">25</p>
        <p>Wednesday</p>
      </div>

     <div class="flex-1 bg-gray-50 rounded-lg p-4 flex justify-between items-center">
  <div>
    <h4 class="font-medium">Cake Making</h4>
    <p class="text-sm text-gray-500">
      Baking and delivery of all kinds of cakes at affordable rates
    </p>
    <!-- Customers icons -->
    <div class="flex items-center mt-3 gap-2">
      <div class="flex -space-x-2">
        <img src="/user1.png" alt="customer" class="w-6 h-6 rounded-full border-2 border-white" />
        <img src="/user2.png" alt="customer" class="w-6 h-6 rounded-full border-2 border-white" />
        <img src="/user3.png" alt="customer" class="w-6 h-6 rounded-full border-2 border-white" />
      </div>
      <span class="text-xs text-gray-500 ml-2">+4 customers</span>
    </div>

    <!-- Active badge -->
    <span class="inline-block mt-2 text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
      Active
    </span>

    
  </div>

  <!-- Cover image -->
  <div class="w-20 h-20 bg-gray-200 rounded-lg">
    <img src="/eventcard.png" alt="cover" class="object-cover w-full h-full rounded-lg" />
  </div>
</div>

    </div>
  </div>

</div>
