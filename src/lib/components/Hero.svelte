<script lang="ts">
	// Image imports
	import HeroBg from '$lib/assets/images/hero-bg.png';
	import UserSvg from '$lib/assets/images/user.svg';

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
	<div class="absolute inset-0 -z-10 bg-black/40"></div>

	<!-- ===================== Hero Content ===================== -->
	<div
		class="z-10 flex w-full items-center justify-center px-4 py-16 pt-[280px] text-center text-white md:py-24 lg:py-32"
	>
		<div
			class="flex h-[206px] w-full flex-col items-center justify-center rounded-[15px] border border-white/20 bg-white/45 backdrop-blur-md md:h-[224px] md:w-[502.5px]"
		>
			<h1 class="mb-6 text-[30px] font-bold text-[#06142D] md:text-[40px] md:leading-[45px]">
				Embark on Your <br />
				<span class="bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] bg-clip-text text-transparent"
					>Adventure!</span
				>
			</h1>

			<div class="flex flex-wrap justify-center gap-4">
				<button
					type="button"
					on:click={openModal}
					class="flex h-[36px] items-center justify-center gap-1 rounded-[9px] bg-white/90 px-6 py-3 text-[12px] font-medium text-nowrap text-[#06142D] transition-colors hover:bg-white md:w-[161.25px]"
				>
					Join Waitlist
					<img src={UserSvg} alt="User Icon" />
				</button>
			</div>
		</div>
	</div>
</section>

<!-- ===================== WAITLIST MODAL ===================== -->
{#if showModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="mx-4 w-full max-w-md rounded-[15px] bg-white p-6 shadow-2xl">
			{#if submitted}
				<!-- Success State -->
				<div class="text-center">
					<div class="mb-4 text-4xl">🎉</div>
					<h3 class="mb-2 text-xl font-bold text-[#06142D]">You're on the list!</h3>
					<p class="mb-6 text-gray-600">
						Thanks for joining our waitlist. We'll keep you updated on our progress and let you know
						when we launch!
					</p>
					<button
						type="button"
						on:click={closeModal}
						class="w-full rounded-[9px] bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
					>
						Close
					</button>
				</div>
			{:else}
				<!-- Form State -->
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-xl font-bold text-[#06142D]">Join the Waitlist</h2>
					<button
						type="button"
						on:click={closeModal}
						class="text-2xl text-gray-400 hover:text-gray-600"
						aria-label="Close modal"
					>
						×
					</button>
				</div>

				<p class="mb-6 text-gray-600">
					Be the first to know when we launch. Get early access and exclusive updates!
				</p>

				<form on:submit={handleSubmit} class="space-y-4">
					<div>
						<label for="modal-email" class="mb-2 block text-sm font-medium text-[#06142D]">
							Email Address *
						</label>
						<input
							type="email"
							id="modal-email"
							bind:value={email}
							required
							disabled={isSubmitting}
							class="w-full rounded-[9px] border border-gray-300 px-4 py-3 text-[#06142D] focus:border-[#513BE2] focus:ring-2 focus:ring-[#513BE2]/20 focus:outline-none disabled:bg-gray-100"
							placeholder="your@email.com"
						/>
					</div>

					<div>
						<label for="modal-name" class="mb-2 block text-sm font-medium text-[#06142D]">
							Name (optional)
						</label>
						<input
							type="text"
							id="modal-name"
							bind:value={name}
							disabled={isSubmitting}
							class="w-full rounded-[9px] border border-gray-300 px-4 py-3 text-[#06142D] focus:border-[#513BE2] focus:ring-2 focus:ring-[#513BE2]/20 focus:outline-none disabled:bg-gray-100"
							placeholder="Your name"
						/>
					</div>

					<div class="flex gap-3 pt-2">
						<button
							type="button"
							on:click={closeModal}
							disabled={isSubmitting}
							class="flex-1 rounded-[9px] border border-gray-300 px-6 py-3 font-medium text-[#06142D] transition-colors hover:bg-gray-50 disabled:bg-gray-100"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting || !email}
							class="flex-1 rounded-[9px] bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] px-6 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
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

	@media (max-width: 425px) {
		#hero {
			background-position: calc(50% + 130px) 50%;
		}
	}
</style>
