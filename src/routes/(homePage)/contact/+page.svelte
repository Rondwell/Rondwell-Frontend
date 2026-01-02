<!-- src/routes/(homePage)/contact/+page.svelte -->
<script>
	let formData = {
		name: '',
		email: '',
		company: '',
		message: ''
	};

	let agreeToPolicy = false;
	let createAccount = true;
	let isSubmitting = false;
	/**
	 * @type {string | null}
	 */
	let submitStatus = null; // 'success' or 'error'
	let emailError = '';

	const validateEmail = (/** @type {string} */ email) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const handleEmailBlur = () => {
		if (formData.email && !validateEmail(formData.email)) {
			emailError = 'Please enter a vaid email address.';
		} else {
			emailError = '';
		}
	};

	const handleSubmit = async (/** @type {{ preventDefault: () => void; }} */ e) => {
		e.preventDefault();
		
		// Validate email before submission
		if (!validateEmail(formData.email)) {
			emailError = 'Please enter a vaid email address.';
			return;
		}

		if (!agreeToPolicy) {
			return;
		}

		isSubmitting = true;
		submitStatus = null;

		// Simulate form submission (replace with actual API call)
		try {
			await new Promise((resolve) => setTimeout(resolve, 1500));
			
			// Reset form on success
			formData = {
				name: '',
				email: '',
				company: '',
				message: ''
			};
			agreeToPolicy = false;
			createAccount = true;
			submitStatus = 'success';
		} catch (error) {
			submitStatus = 'error';
		} finally {
			isSubmitting = false;
			// Clear status after 5 seconds
			setTimeout(() => {
				submitStatus = null;
			}, 5000);
		}
	};
</script>

<section class="min-h-screen">
	<main class="bg-color px-4 py-8 sm:px-6 md:py-12 lg:px-8">
		<div class="mx-auto max-w-lg">
			<!-- Logo and Title -->
			<div class="mb-12 flex flex-col items-center gap-4 text-center">
				<img src="/logo.svg" alt="Rondwell" class="h-8" />
				<h1 class="text-4xl font-semibold leading-tight tracking-wide text-[#192226] sm:text-5xl">Get in touch with us</h1>
			</div>

			<!-- Contact Form -->
			<div class="ml-6">
				<h2 class="mb-6 text-xl font-bold text-[#192226]">Fill Contact form</h2>

				<form on:submit={handleSubmit} class="space-y-5">
					<!-- Name -->
					<div>
						<label for="name" class="mb-2 block text-sm font-normal text-[#192226]">
							Name <span class="text-[#696B6D]">*</span>
						</label>
						<input
							type="text"
							id="name"
							bind:value={formData.name}
							required
							placeholder="John Mebosn"
							class="w-full rounded-lg border-0 bg-[#EFEFEF] px-4 py-3 text-[#192226] placeholder-gray-500 transition focus:outline-none focus:ring-2 focus:ring-gray-200"
						/>
					</div>

					<!-- Email -->
					<div>
						<label for="email" class="mb-2 block text-sm font-normal text-[#192226]">
							Email <span class="text-[#696B6D]">*</span>
						</label>
						<input
							type="email"
							id="email"
							bind:value={formData.email}
							on:blur={handleEmailBlur}
							required
							placeholder="johnebosn@gmail.com"
							class="w-full rounded-lg border-0 bg-[#EFEFEF] px-4 py-3 text-[#192226] placeholder-gray-500 transition focus:outline-none focus:ring-2 focus:ring-gray-200"
						/>
						{#if emailError}
							<p class="mt-2 text-sm font-medium text-[#F31A7C]">{emailError}</p>
						{/if}
					</div>

					<!-- Company -->
					<div>
						<label for="company" class="mb-2 block text-sm font-normal text-[#192226]">
							What is the name of your company?
						</label>
						<input
							type="text"
							id="company"
							bind:value={formData.company}
							placeholder="Rondwell Inc."
							class="w-full rounded-lg border-0 bg-[#EFEFEF] px-4 py-3 text-[#192226] placeholder-gray-500 transition focus:outline-none focus:ring-2 focus:ring-gray-200"
						/>
					</div>

					<!-- Message -->
					<div>
						<label for="message" class="mb-2 block text-sm font-normal text-[#192226]">
							Message
						</label>
						<textarea
							id="message"
							bind:value={formData.message}
							rows="4"
							placeholder="Share a message with our team..."
							class="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[#192226] placeholder-gray-400 transition focus:outline-none focus:ring-2 focus:ring-gray-200"
						></textarea>
					</div>

					<!-- Checkboxes -->
					<div class="space-y-3 pt-2">
						<label class="flex cursor-pointer items-start gap-3">
							<input
								type="checkbox"
								bind:checked={agreeToPolicy}
								class="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#131517] accent-[#131517] focus:ring-[#131517]"
							/>
							<span class="text-sm text-[#192226]">
								I agree to <a href="/privacy" class="font-semibold text-[#192226] underline hover:text-[#131517]"
									>Rondwell's privacy policy</a
								>
							</span>
						</label>

						<label class="flex cursor-pointer items-start gap-3">
							<input
								type="checkbox"
								bind:checked={createAccount}
								class="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#131517] accent-[#131517] focus:ring-[#131517]"
							/>
							<span class="text-sm text-[#192226]">Automatically create Rondwell Account</span>
						</label>
					</div>

					<!-- Submit Button -->
					<button
						type="submit"
						disabled={isSubmitting || !agreeToPolicy}
						class="mt-4 w-full rounded-lg bg-[#3D3D3D] px-8 py-3.5 font-semibold text-white transition hover:bg-[#2D2D2D] disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSubmitting ? 'Submitting...' : 'Submit'}
					</button>

					<!-- Success/Error Messages -->
					{#if submitStatus === 'success'}
						<div
							class="flex w-full items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-green-800"
						>
							<img src="/tick.png" alt="success" class="h-5 w-5" />
							<span class="text-sm font-medium"
								>Thank you! Your message has been sent successfully.</span
							>
						</div>
					{/if}

					{#if submitStatus === 'error'}
						<div
							class="flex w-full items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-red-800"
						>
							<span class="text-sm font-medium"
								>Oops! Something went wrong. Please try again.</span
							>
						</div>
					{/if}
				</form>
			</div>
		</div>
	</main>
</section>

<style>
	/* .bg-color {
		background: linear-gradient(180deg, #f5efec 0%, #f4edea 17%, #f4f5f6 43%);
	} */
</style>
