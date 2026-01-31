<script lang="ts">
	import Icon from '@iconify/svelte';
	import Dropdown from '../Dropdown.svelte';

	export let open = false;

	  const profileOptions = [
    { value: 'founder', label: 'Founder' },
    { value: 'investor', label: 'Investor' },
    { value: 'operator', label: 'Operator' },
    { value: 'student', label: 'Student' },
    { value: 'other', label: 'Other' }
  ];

  const defaultSelectOption = [
	{ value: 'yes', label: 'Yes' },
	{ value: 'no', label: 'No' }
  ]

	let form = {
		name: '',
		email: '',
		company: '',
		website: '',
		location: '',
		pitchSession1: false,
		pitchSession2: false,
		profileType: '',
		invest: '',
		attend: '',
	};

	let errors: Record<string, string> = {};

	function isValidEmail(email: string) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	function validate() {
  		errors = {};

  		if (!form.name.trim()) {
  		  errors.name = 'Name is required.';
  		}

  		const requiredSelectFields: (keyof typeof form)[] = ['profileType','invest','attend'];

  		requiredSelectFields.forEach((field) => {
    	if (!form[field] || !form[field].toString().trim()) {
    	  errors[field] = 'This field is required.';
    	}
		});	

		if (!form.email.trim()) {
		  errors.email = 'Email is required.';
		} else if (!isValidEmail(form.email)) {
		  errors.email = 'Please enter a valid email address.';
		}	
		return Object.keys(errors).length === 0;
	}

	function submitForm() {
		if (!validate()) return;

		console.log('Form Data:', form);

		// clear form data after submission 
		form = {
			name: '',
			email: '',
			company: '',
			website: '',
			location: '',
			pitchSession1: false,
			pitchSession2: false,
			profileType: '',
			invest: '',
			attend: '',
		};


		// Close modal (optional)
		open = false;
	}
</script>

{#if open}
<div class="fixed inset-0 z-50 flex items-center justify-center ">
	<div
		class="animate-fadeIn h-full w-full bg-[#FDFCFB]/80 backdrop-blur-3xl 
		       flex flex-col items-center justify-start px-5 overflow-y-auto"
	>
		<button
			class="absolute right-5 top-6.5 flex h-8 w-8 items-center justify-center
			       rounded-full bg-[#EBECED] text-gray-700"
			on:click={() => (open = false)}
		>
			<Icon icon="mdi:close" class="text-lg font-bold" />
		</button>

		<div class="mt-[77px] mb-13 flex flex-col md:flex-row-reverse  gap-8 md:gap-11 items-start justify-start">
			<div class='max-w-107.5 w-full flex flex-col gap-[19px] border border-[#EAEAEA] bg-[#FDFCFC] rounded-[15px] p-[24px_22.5px_18px_17px]'>
			<div class=" flex">
				<img src="/eventpage_sample.svg" class="size-16 rounded-lg mr-3" alt='event_img' />
				<div class='space-y-[11px]'>
					<h2 class="text-[#131517] text-xl">Megaexe Party, in mapi</h2>
					<p class="text-[#B3B4B4] text-sm">May 2, 12:30PM</p>
				</div>
			</div>
			<hr class="border-[#FDFCFC]"  />
			<div class="flex justify-between items-center">
				<p class="text-[#B3B4B4] text-[17px]">Ticket</p>
				<p class="text-[#131517] text-[18px]">Investor Only -In Person</p>
				<svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M0.778564 0.749023C1.43327 0.110033 2.3809 -0.0324866 3.1936 0.397461H3.19263L8.83521 3.36621H8.83423C9.51667 3.72318 9.9426 4.42698 9.94263 5.19824C9.94263 5.96952 9.51668 6.67231 8.83423 7.0293L8.83521 7.03027L3.19263 10L3.19165 9.99902C2.87809 10.166 2.54766 10.2461 2.21704 10.2461C1.69022 10.246 1.18051 10.0399 0.778564 9.64844C0.123296 9.00889 -0.0343667 8.06168 0.374268 7.24414L1.16333 5.66699C1.28957 5.41451 1.3054 5.11485 1.21021 4.84668L1.16333 4.73438L0.374268 3.15234C-0.034219 2.33498 0.123643 1.38853 0.778564 0.749023ZM2.22192 1.18164C1.96931 1.18177 1.74153 1.28396 1.56958 1.42578L1.49927 1.48926C1.23326 1.74668 1.04849 2.19918 1.29517 2.69727L2.08423 4.27441V4.27539C2.33646 4.78472 2.36812 5.37398 2.17896 5.90332L2.08423 6.12695L1.29517 7.7041V7.70508C1.04472 8.20195 1.23234 8.65379 1.49927 8.91211C1.76771 9.17181 2.21976 9.35055 2.71216 9.0918L8.35474 6.12207C8.70473 5.93854 8.91235 5.595 8.91235 5.20313C8.91233 4.81127 8.70471 4.4677 8.35474 4.28418L2.71216 1.30469V1.30566C2.54003 1.21531 2.3741 1.18164 2.22192 1.18164Z" fill="#A9AAAA" stroke="#A9AAAA" stroke-width="0.3"/>
				</svg>
			</div>
			<hr class="border-[#EAEAEA]" />
			<div class="flex justify-between items-center">
				<p class="text-[#B3B4B4] text-[17px]">Total</p>
				<p class="text-[#131517] text-[20px]">FREE</p>
			</div>
			</div>

			<div class="max-w-107.5 w-full rounded-lg">
			<h3 class="mb-6 text-2xl font-normal text-black">Attendance Registration</h3>
			<div class="mb-[33px] flex justify-start items-center gap-3">
				<img src="/user1-icon.svg" alt='user-avatar' class="size-[50px] rounded-full" />
				<div class="">
					<h3 class="text-[#27292B] font-normal text-lg inline-flex gap-3 justify-center items-center">JOHN NEBRASKA NEVADA JAMES <span> <img src="/edit.svg" alt='editIcon' class="size-4" /></span> </h3>
					<p class="text-[#6A6B6D] text-[15px] font-normal">johnmedoc23@gmail.com</p>
				</div>
			</div>
			<form class="flex w-full flex-col gap-8" on:submit|preventDefault={submitForm}>
				<!-- Form -->
				<div class="w-full">
					<label class="text-[15px] text-[#696B6D]" for="name">
						Name *
					</label>
					<input
						bind:value={form.name}
						type="text"
						placeholder="James Brown"
						class="mt-2 w-full rounded-[9px] bg-white border px-5 py-3 text-sm text-[#3C3D3F]
						       {errors.name ? 'border-red-500' : 'border-[#ECEDED]'}"
					/>
					{#if errors.name}
						<p class="mt-1 text-sm text-red-500">{errors.name}</p>
					{/if}
				</div>

				<!-- Email -->
				<div class="w-full">
					<label class="text-[15px] text-[#696B6D]" for="email">
						Email *
					</label>
					<input
						bind:value={form.email}
						type="email"
						placeholder="jamesbrown@email.com"
						class="mt-2 w-full rounded-[9px] bg-white border px-5 py-3 text-sm text-[#3C3D3F]
						       {errors.email ? 'border-red-500' : 'border-[#ECEDED]'}"
					/>
					{#if errors.email}
						<p class="mt-1 text-sm text-red-500">{errors.email}</p>
					{/if}
				</div>

				<!-- Checkboxes -->
				<div class="flex flex-col gap-3">
					<label class="flex items-center gap-3 cursor-pointer select-none">
						<input
						   type="checkbox"
						   bind:checked={form.pitchSession1}
						   class="peer hidden"
						 />

						   <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg" class="peer-checked:hidden">
								<rect x="0.5" y="0.5" width="21.5006" height="21.5006" rx="4.75013" fill="white" stroke="black"/>
							</svg>

						   <!-- Checked SVG -->
						   <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg" class=" hidden peer-checked:block">
								<rect width="22.5006" height="22.5006" rx="5.25013" fill="#131517"/>
								<path d="M9.46325 15.7502C9.10468 15.7502 8.7461 15.5827 8.47717 15.3194L5.6534 12.3033C5.11553 11.7288 5.11553 10.7714 5.6534 10.1969C6.19126 9.62241 7.0877 9.62241 7.62556 10.1969L9.46325 12.1597L14.1247 7.18086C14.6626 6.60638 15.559 6.60638 16.0969 7.18086C16.6347 7.75534 16.6347 8.71281 16.0969 9.2873L10.4493 15.3194C10.1804 15.6066 9.82183 15.7502 9.46325 15.7502Z" fill="white"/>
							</svg>
						<span class="text-sm text-[#132B3C]">I am interested in Pitching for Session #1</span>
					</label>

					<label class="flex items-center gap-3 cursor-pointer select-none">
						<input
						   type="checkbox"
						   bind:checked={form.pitchSession2}
						   class="peer hidden"
						 />

						   <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg" class="peer-checked:hidden">
								<rect x="0.5" y="0.5" width="21.5006" height="21.5006" rx="4.75013" fill="white" stroke="black"/>
							</svg>

						   <!-- Checked SVG -->
						   <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg" class=" hidden peer-checked:block">
								<rect width="22.5006" height="22.5006" rx="5.25013" fill="#131517"/>
								<path d="M9.46325 15.7502C9.10468 15.7502 8.7461 15.5827 8.47717 15.3194L5.6534 12.3033C5.11553 11.7288 5.11553 10.7714 5.6534 10.1969C6.19126 9.62241 7.0877 9.62241 7.62556 10.1969L9.46325 12.1597L14.1247 7.18086C14.6626 6.60638 15.559 6.60638 16.0969 7.18086C16.6347 7.75534 16.6347 8.71281 16.0969 9.2873L10.4493 15.3194C10.1804 15.6066 9.82183 15.7502 9.46325 15.7502Z" fill="white"/>
							</svg>
						<span class="text-sm text-[#132B3C]">I am interested in Pitching for Session #2</span>
					</label>
				</div>

				<!-- Company -->
				<div class="w-full">
					<label class="text-[15px] text-[#696B6D]" for="company">
						What is the name of your company?
					</label>
					<input
						bind:value={form.company}
						type="text"
						class="mt-2 w-full rounded-[9px] bg-white border border-[#ECEDED] px-5 py-3 text-sm text-[#3C3D3F]"
					/>
				</div>

				<!-- Website -->
				<div class="w-full">
					<label class="text-[15px] text-[#696B6D]" for="website">
						What is your company’s website?
					</label>
					<input
						bind:value={form.website}
						type="text"
						class="mt-2 w-full rounded-[9px] bg-white border border-[#ECEDED] px-5 py-3 text-sm text-[#3C3D3F]"
					/>
				</div>

				<!-- Location -->
				<div class="w-full">
					<label class="text-[15px] text-[#696B6D]" for="location">
						Where is your company based? (City, State)
					</label>
					<input
						bind:value={form.location}
						type="text"
						class="mt-2 w-full rounded-[9px] bg-white border border-[#ECEDED] px-5 py-3 text-sm text-[#3C3D3F]"
					/>
				</div>

				<!-- How would you describe yourself -->
				<div class="w-full relative">
				  <label class="text-[15px] text-[#696B6D]" for='profileType'>
				    How would you describe yourself? *
				  </label>
			  
				   <div class="relative mt-2 ">

					
				  <Dropdown
  options={profileOptions}
  value={form.profileType}
  placeholder="Select an option"
  on:change ={(e) => form.profileType = e.detail.value || ''}
/>
				   </div>


				  {#if errors.profileType}
				    <p class="mt-1 text-sm text-red-500">{errors.profileType}</p>
				  {/if}
				</div>

				<div class="w-full relative">
				  <label class="text-[15px] text-[#696B6D]" for='invest'>
				   Are you interested in investing with us? *
				  </label>
			  
				   <div class="mt-2 ">
									  <Dropdown
  options={defaultSelectOption}
  value={form.invest}
  placeholder="Select an option"
  on:change ={(e) => form.invest = defaultSelectOption.find(opt => opt.value === e.detail.value)?.value || ''}
/>
					
				   </div>

				  {#if errors.invest}
				    <p class="mt-1 text-sm text-red-500">{errors.invest}</p>
				  {/if}
				</div>

				<div class="w-full relative">
				  <label class="text-[15px] text-[#696B6D]" for='attend'>
				    Have you previously attended the Invest in the Future Summit? *
				  </label>
			  
				   <div class="relative mt-2 ">
									  <Dropdown
  options={defaultSelectOption}
  value={form.attend}
  placeholder="Select an option"
  on:change ={(e) => form.attend = defaultSelectOption.find(opt => opt.value === e.detail.value)?.value || ''}
/>
				   </div>

				  {#if errors.attend}
				    <p class="mt-1 text-sm text-red-500">{errors.attend}</p>
				  {/if}
				</div>

				<button
				type='submit'
					class="w-full rounded-md bg-[#333537] py-[10px] text-white"
				>
					Register
				</button>
			</form>
			</div>
		</div>
	</div>
</div>
{/if}

<style>
	.animate-fadeIn {
		animation: fade 0.15s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
			transform: scale(0.97);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
