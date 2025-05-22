<script lang="ts">
	// Image imports
	import HeroBg from '$lib/assets/images/hero-bg.png';
	import Hero1Bg from '$lib/assets/images/hero-1-bg.png';
	import Clouds from './Clouds.svelte';
	import FlippingCta from './FlippingCTA.svelte';

	// Modal and form state
	let showModal = false;
	let email = '';
	let name = '';
	let isSubmitting = false;
	let submitted = false;

	function openModal() {
		showModal = true;
		// Prevent body scroll when modal is open
		document.body.style.overflow = 'hidden';
	}

	function closeModal() {
		showModal = false;
		document.body.style.overflow = 'auto';
		// Reset form if needed
		if (submitted) {
			email = '';
			name = '';
			submitted = false;
		}
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		isSubmitting = true;

		try {
			const params = new URLSearchParams();
			params.append('form-name', 'waitlist');
			params.append('email', email);
			params.append('name', name);

			const response = await fetch('/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: params.toString()
			});

			if (response.ok) {
				submitted = true;
			}
		} catch (error) {
			console.error('Error:', error);
		} finally {
			isSubmitting = false;
		}
	}

	// Close modal on escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && showModal) {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Hidden form for Netlify detection -->
<form name="waitlist" netlify netlify-honeypot="bot-field" hidden>
	<input name="email" type="email" />
	<input name="name" type="text" />
</form>

<!-- ===================== HERO SECTION ===================== -->
<section
	id="hero"
	style="background-image: url({HeroBg}); background-size: cover;"
	class="relative flex min-h-screen w-full items-center overflow-x-hidden"
>
	<!-- ===================== Hero Background Overlay ===================== -->
	<div class="absolute inset-0 -z-10 bg-black/40 dark:bg-black/60"></div>

	<!-- ===================== Hero Content ===================== -->
	<div
		class="z-10 flex w-full items-center justify-center px-4 py-16 pt-[280px] text-center text-white md:py-24 lg:py-32"
	>
		<div
			class="flex h-[206px] w-full flex-col items-center justify-center rounded-[15px] border border-white/20 bg-white/45 backdrop-blur-md md:h-[224px] md:w-[502.5px] dark:border-black/45 dark:bg-black/45"
		>
			<FlippingCta />

			<div class="flex flex-wrap justify-center gap-4">
				<button
					type="button"
					aria-haspopup="dialog"
					aria-controls="waitlist-modal"
					aria-expanded={showModal}
					on:click={openModal}
					class="flex h-[36px] cursor-pointer items-center justify-center gap-1 rounded-[9px] bg-white/90 px-6 py-3 text-[12px] font-medium text-nowrap text-[#06142D] transition-colors md:w-[161.25px] dark:bg-[#06142D] dark:text-white"
				>
					Join Waitlist
					<svg
						width="19"
						height="18"
						viewBox="0 0 19 18"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							fill-rule="evenodd"
							clip-rule="evenodd"
							d="M9.75007 8.67861C11.7028 8.67861 13.2858 7.09561 13.2858 5.14289C13.2858 3.19017 11.7028 1.60718 9.75007 1.60718C7.79735 1.60718 6.21436 3.19017 6.21436 5.14289C6.21436 7.09561 7.79735 8.67861 9.75007 8.67861ZM9.75007 7.39289C10.9927 7.39289 12.0001 6.38553 12.0001 5.14289C12.0001 3.90025 10.9927 2.89289 9.75007 2.89289C8.50743 2.89289 7.50007 3.90025 7.50007 5.14289C7.50007 6.38553 8.50743 7.39289 9.75007 7.39289Z"
							fill="#06142D"
							class="dark:fill-white"
						/>
						<path
							fill-rule="evenodd"
							clip-rule="evenodd"
							d="M12.9644 16.7143C15.0946 16.7143 16.8215 14.9874 16.8215 12.8572C16.8215 10.7269 15.0946 9.00004 12.9644 9.00004C10.8341 9.00004 9.10721 10.7269 9.10721 12.8572C9.10721 14.9874 10.8341 16.7143 12.9644 16.7143ZM13.6072 10.9286C13.6072 10.5736 13.3194 10.2857 12.9644 10.2857C12.6093 10.2857 12.3215 10.5736 12.3215 10.9286V12.2143H11.0358C10.6807 12.2143 10.3929 12.5021 10.3929 12.8572C10.3929 13.2122 10.6807 13.5 11.0358 13.5H12.3215V14.7858C12.3215 15.1408 12.6093 15.4286 12.9644 15.4286C13.3194 15.4286 13.6072 15.1408 13.6072 14.7858V13.5H14.8929C15.248 13.5 15.5358 13.2122 15.5358 12.8572C15.5358 12.5021 15.248 12.2143 14.8929 12.2143H13.6072V10.9286Z"
							fill="#06142D"
							class="dark:fill-white"
						/>
						<path
							d="M7.94199 11.4034C8.29074 11.3369 8.51951 11.0002 8.45296 10.6515C8.38642 10.3027 8.04976 10.074 7.70101 10.1405C5.94744 10.4751 4.98323 11.2423 4.47339 12.0105C4.22443 12.3855 4.09734 12.7409 4.03256 13.009C4.00018 13.143 3.98317 13.256 3.97424 13.3399C3.96977 13.382 3.9673 13.4169 3.96595 13.4439C3.96527 13.4573 3.96487 13.4688 3.96464 13.4782L3.96441 13.4907L3.96437 13.4957L3.96436 13.498L3.96436 13.499C3.96436 13.499 3.96436 13.5 4.60721 13.5H3.96436V13.8214C3.96436 14.709 4.6839 15.4285 5.5715 15.4285H7.50007C7.85511 15.4285 8.14293 15.1407 8.14293 14.7857C8.14293 14.4307 7.85511 14.1428 7.50007 14.1428H5.5715C5.39398 14.1428 5.25007 13.9989 5.25007 13.8214V13.5078C5.25031 13.5032 5.25099 13.4923 5.25274 13.4759C5.25637 13.4418 5.26447 13.3848 5.28231 13.311C5.31798 13.1634 5.39179 12.9517 5.54461 12.7215C5.83834 12.2789 6.48127 11.6822 7.94199 11.4034Z"
							fill="#06142D"
							class="dark:fill-white"
						/>
					</svg>
				</button>
			</div>
		</div>
	</div>
</section>

<!-- ===================== WAITLIST MODAL ===================== -->
{#if showModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm dark:bg-black/70"
	>
		<div class="mx-4 w-full max-w-md rounded-[15px] bg-white p-6 shadow-2xl dark:bg-[#06142D]">
			{#if submitted}
				<!-- Success State -->
				<div class="text-center">
					<div class="mb-4 text-4xl">🎉</div>
					<h3 class="mb-2 text-xl font-bold text-[#06142D] dark:text-white">You're on the list!</h3>
					<p class="mb-6 text-gray-600">
						Thanks for joining our waitlist. We'll keep you updated on our progress and let you know
						when we launch!
					</p>
					<button
						type="button"
						on:click={closeModal}
						class="w-full rounded-[9px] bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] px-6 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-[#513BE2] dark:hover:opacity-80"
					>
						Close
					</button>
				</div>
			{:else}
				<!-- Form State -->
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-xl font-bold text-[#06142D] dark:text-white">Join the Waitlist</h2>
					<button
						type="button"
						on:click={closeModal}
						class="text-2xl text-gray-400 hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
						aria-label="Close modal"
					>
						×
					</button>
				</div>

				<p class="mb-6 text-gray-600 dark:text-gray-300">
					Be the first to know when we launch. Get early access and exclusive updates!
				</p>

				<form on:submit={handleSubmit} class="space-y-4">
					<div>
						<label
							for="modal-email"
							class="mb-2 block text-sm font-medium text-[#06142D] dark:text-white"
						>
							Email Address *
						</label>
						<input
							type="email"
							id="modal-email"
							bind:value={email}
							required
							disabled={isSubmitting}
							class="w-full rounded-[9px] border border-gray-300 px-4 py-3 text-[#06142D] focus:border-[#513BE2] focus:ring-2 focus:ring-[#513BE2]/20 focus:outline-none disabled:bg-gray-100 dark:border-white/30 dark:bg-[#06142D] dark:text-white dark:focus:border-[#513BE2] dark:focus:ring-[#513BE2]/20"
							placeholder="your@email.com"
						/>
					</div>

					<div>
						<label
							for="modal-name"
							class="mb-2 block text-sm font-medium text-[#06142D] dark:text-white"
						>
							Name (optional)
						</label>
						<input
							type="text"
							id="modal-name"
							bind:value={name}
							disabled={isSubmitting}
							class="w-full rounded-[9px] border border-gray-300 px-4 py-3 text-[#06142D] focus:border-[#513BE2] focus:ring-2 focus:ring-[#513BE2]/20 focus:outline-none disabled:bg-gray-100 dark:border-white/30 dark:bg-[#06142D] dark:text-white dark:focus:border-[#513BE2] dark:focus:ring-[#513BE2]/20"
							placeholder="Your name"
						/>
					</div>

					<div class="flex flex-col-reverse md:flex-row gap-3 pt-2">
						<button
							type="button"
							on:click={closeModal}
							disabled={isSubmitting}
							class="flex-1 rounded-[9px] border border-gray-300 px-6 py-3 font-medium text-[#06142D] transition-colors hover:bg-gray-50 disabled:bg-gray-100 dark:border-white/30 dark:bg-[#06142D] dark:text-white dark:hover:bg-[#513BE2] dark:hover:text-white"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting || !email}
							class="flex-1 rounded-[9px] bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] px-6 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-[#513BE2] dark:hover:opacity-80"
						>
							{isSubmitting ? 'Joining...' : 'Join Waitlist'}
						</button>
					</div>
				</form>
			{/if}
		</div>
	</div>
{/if}

<style>
	#hero {
		background-position: center;
		background-repeat: no-repeat;
	}

	@media (max-width: 600px) {
		#hero {
			background-position: calc(50% + 130px) 50%;
		}
	}

	.cursor-pointer {
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.cursor-pointer:hover {
		opacity: 0.8;
	}
</style>
