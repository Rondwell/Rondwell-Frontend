<!-- src/routes/auth/login/+page.svelte -->
<script>
	import { goto } from '$app/navigation';
	import Header from './components/Header.svelte';

	export let mode = 'login';

	let email = '';
	let password = '';
	let phone = '';
	let usePhone = false;

	// Toggle between email and phone
	const toggleInputType = () => {
		usePhone = !usePhone;
	};

	function handleClick() {
		// if (mode === 'signup') {
		goto('/auth/verify');
		// } else {
		// 	goto('/auth/dashboard');
		// }
	}
</script>

<main class="bg min-h-screen">
	<Header />

	<div class="mx-4">
		<div class="mx-auto my-15 w-full max-w-[405px] rounded-[12px] bg-[#FDFCFB] p-6 shadow-sm">
			<div class="mb-6 space-y-3 text-left">
				<div class="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#F4F3F3]">
					<img src="/logo1.svg" alt="logo" />
				</div>
				<h2 class="text-2xl font-semibold">
					Welcome to <span class="gradient-text">Rondwell</span>
				</h2>
				<p class="text-[#919091]">
					{mode === 'login' ? 'Please sign in below' : 'Please sign up below'}
				</p>
			</div>

			<div class="space-y-4">
				<div>
					<div class="mb-2 flex items-center justify-between">
						<label for="contact" class="mb-1 block text-sm font-medium">
							{usePhone ? 'Phone Number' : 'Email'}
						</label>

						<!-- Toggle between phone/email -->
						<button
							type="button"
							on:click={toggleInputType}
							class="flex items-center gap-1 text-xs text-gray-600 hover:underline"
						>
							<svg
								width="14"
								height="18"
								viewBox="0 0 14 18"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M9.4375 17.0625H4.9375C1.63 17.0625 0.625 16.0575 0.625 12.75V5.25C0.625 1.9425 1.63 0.9375 4.9375 0.9375H9.4375C12.745 0.9375 13.75 1.9425 13.75 5.25V12.75C13.75 16.0575 12.745 17.0625 9.4375 17.0625ZM4.9375 2.0625C2.2525 2.0625 1.75 2.5725 1.75 5.25V12.75C1.75 15.4275 2.2525 15.9375 4.9375 15.9375H9.4375C12.1225 15.9375 12.625 15.4275 12.625 12.75V5.25C12.625 2.5725 12.1225 2.0625 9.4375 2.0625H4.9375Z"
									fill="#A9A8A7"
								/>
							</svg>

							Use {usePhone ? 'Email' : 'Phone Number'}
						</button>
					</div>

					{#if usePhone}
						<input
							bind:value={phone}
							type="tel"
							placeholder="+1 234 567 8901"
							class="h-[41.25px] w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none"
						/>
					{:else}
						<input
							bind:value={email}
							type="email"
							placeholder="you@email.com"
							class="h-[41.25px] w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none"
						/>
					{/if}
				</div>

				<div class="hidden">
					<label for="password" class="mb-2 block text-sm font-medium text-gray-700">Password</label
					>
					<input
						id="password"
						bind:value={password}
						type="password"
						placeholder="Enter password"
						class="h-[41.25px] w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none"
					/>
				</div>

				{#if mode === 'login'}
					<div class="flex justify-between text-sm">
						<a href="/auth" class="text-purple-600 hover:underline">Forgot password?</a>
					</div>
				{/if}

				<!-- Main action button -->
				<button
					on:click={handleClick}
					class="w-full rounded-md bg-black py-2 font-medium text-white hover:bg-gray-800"
				>
					{mode === 'login' ? 'Login' : 'Sign Up'}
				</button>

				<!-- Switch between login/signup -->
				<div class="mt-4 text-left text-sm text-gray-500">
					{mode === 'login' ? 'I don’t have an account' : 'Already have an account? '}
					<button
						on:click={() => (mode = mode === 'login' ? 'signup' : 'login')}
						class="text-purple-600 hover:underline"
					>
						{mode === 'login' ? 'Sign up' : 'Login'}
					</button>
				</div>

				<!-- Google sign in button -->
				<button
					class="flex w-full items-center justify-center space-x-2 rounded-md bg-[#F4F2F1] py-2 text-[#7C7C7E]"
				>
					<svg
						width="17"
						height="18"
						viewBox="0 0 17 18"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M16.6653 8.27563C16.6247 7.86126 16.2753 7.55249 15.8609 7.55249H9.72656C9.27969 7.55249 8.91406 7.91812 8.91406 8.36499V9.75439C8.91406 10.2013 9.27969 10.5669 9.72656 10.5669H13.3909C13.3016 11.3144 12.8141 12.4438 11.7334 13.1994C11.0428 13.6788 10.1247 14.0119 8.91406 14.0119C8.85719 14.0119 8.80844 14.0119 8.75157 14.0037C6.67969 13.9387 4.92469 12.5494 4.29094 10.64C4.12032 10.1281 4.02282 9.59187 4.02282 9.03125C4.02282 8.47063 4.12032 7.92624 4.28282 7.42249C4.33157 7.27624 4.38844 7.13001 4.45344 6.98376C5.20094 5.30188 6.83407 4.11563 8.75157 4.05875C8.80032 4.05063 8.85719 4.05062 8.91406 4.05062C10.0759 4.05062 10.9453 4.43249 11.5547 4.85499C11.8716 5.07436 12.2941 5.02562 12.5703 4.75749L13.6997 3.6525C14.0572 3.30313 14.0247 2.70999 13.6184 2.41749C12.3266 1.46686 10.7503 0.90625 8.91406 0.90625C8.85719 0.90625 8.80844 0.906258 8.75157 0.914383C5.63969 0.971258 2.96656 2.77501 1.65844 5.38313C1.10594 6.48813 0.789062 7.72312 0.789062 9.03125C0.789062 10.3394 1.10594 11.5744 1.65844 12.6794H1.66656C2.97469 15.2875 5.64782 17.0912 8.75157 17.1481C8.80844 17.1562 8.85719 17.1562 8.91406 17.1562C11.1078 17.1562 12.9522 16.4331 14.2928 15.19C15.8284 13.7681 16.7141 11.6881 16.7141 9.21C16.7141 8.86063 16.6978 8.56001 16.6653 8.27563Z"
							fill="black"
						/>
					</svg>

					<span>Sign in with Google</span>
				</button>
			</div>
		</div>
	</div>
</main>

<style>
	.gradient-text {
		background: linear-gradient(90deg, #db3ec6 0%, #513be2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		color: transparent;
	}

	.bg {
		background: conic-gradient(
			from 10.7deg at 50.03% 44.27%,
			rgba(242, 243, 246, 0.923391) -135.02deg,
			rgba(240, 245, 245, 0.985181) 34.46deg,
			#f0f5f5 75.11deg,
			#fae9fa 134.76deg,
			#ffefec 175.96deg,
			#fbebf6 184.8deg,
			rgba(250, 233, 250, 0.36) 203.89deg,
			rgba(242, 243, 246, 0.923391) 224.98deg,
			rgba(240, 245, 245, 0.985181) 394.46deg
		);
	}
</style>
