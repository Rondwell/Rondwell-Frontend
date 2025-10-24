<!-- src/routes/auth/login/+page.svelte -->
<script>
	import { goto } from '$app/navigation';
	import Header from './components/Header.svelte';

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

<main class="bg flex h-full min-h-screen flex-col items-stretch">
	<Header />

	<div class="h-full flex-1 px-4 py-15">
		<div class="mx-auto w-full max-w-[405px] rounded-[12px] bg-[#FDFCFB] p-6 shadow-sm">
			<div class="mb-6 space-y-3 text-left">
				<div class="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#F4F3F3]">
					<img src="/logo1.svg" alt="logo" />
				</div>
				<h2 class="text-2xl font-semibold">
					Welcome to <span class="gradient-text">Rondwell</span>
				</h2>
				<p class="text-sm text-[#919091]">Please sign in or sign up below</p>
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
								height="17"
								viewBox="0 0 14 17"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M8.0625 3.75H5.0625C4.755 3.75 4.5 3.495 4.5 3.1875C4.5 2.88 4.755 2.625 5.0625 2.625H8.0625C8.37 2.625 8.625 2.88 8.625 3.1875C8.625 3.495 8.37 3.75 8.0625 3.75Z"
									fill="#A9A8A7"
								/>
								<path
									d="M6.56094 13.9578C5.60844 13.9578 4.83594 13.1853 4.83594 12.2328C4.83594 11.2803 5.60844 10.5078 6.56094 10.5078C7.51344 10.5078 8.28594 11.2803 8.28594 12.2328C8.28594 13.1853 7.51344 13.9578 6.56094 13.9578ZM6.56094 11.6253C6.23094 11.6253 5.96094 11.8953 5.96094 12.2253C5.96094 12.5553 6.23094 12.8253 6.56094 12.8253C6.89094 12.8253 7.16094 12.5553 7.16094 12.2253C7.16094 11.8953 6.89094 11.6253 6.56094 11.6253Z"
									fill="#A9A8A7"
								/>
								<path
									d="M8.8125 16.125H4.3125C1.005 16.125 0 15.12 0 11.8125V4.3125C0 1.005 1.005 0 4.3125 0H8.8125C12.12 0 13.125 1.005 13.125 4.3125V11.8125C13.125 15.12 12.12 16.125 8.8125 16.125ZM4.3125 1.125C1.6275 1.125 1.125 1.635 1.125 4.3125V11.8125C1.125 14.49 1.6275 15 4.3125 15H8.8125C11.4975 15 12 14.49 12 11.8125V4.3125C12 1.635 11.4975 1.125 8.8125 1.125H4.3125Z"
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

				<div class="hidden justify-between text-sm">
					<a href="/auth" class="text-purple-600 hover:underline">Forgot password?</a>
				</div>

				<!-- Main action button -->
				<button
					on:click={handleClick}
					class="w-full rounded-md bg-black py-2 font-medium text-white hover:bg-gray-800"
				>
					Continue With {usePhone ? 'Phone' : 'Email'}
				</button>

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

				<button
					class="flex w-full items-center justify-center space-x-2 rounded-md bg-[#F4F2F1] py-2 text-[#7C7C7E]"
				>
					<svg
						width="21"
						height="20"
						viewBox="0 0 21 20"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							opacity="0.4"
							d="M14.4701 8.45339C12.861 8.45611 11.5542 9.76299 11.5569 11.3666C11.5514 12.4884 12.1858 13.4604 13.1115 13.9504L13.1115 16.5097C13.1143 16.6921 13.234 16.9372 13.3838 17.0488L14.059 17.5607C14.285 17.7268 14.6526 17.7295 14.8758 17.5607L15.551 17.0488C15.7008 16.9372 15.8233 16.6949 15.8206 16.507L15.8206 16.0605C15.8233 15.9543 15.7362 15.8672 15.6273 15.8672L14.5709 15.8672C14.413 15.8672 14.2823 15.7365 14.2823 15.5786C14.2823 15.4207 14.413 15.29 14.5709 15.29L15.6327 15.29C15.7362 15.29 15.8233 15.2029 15.8233 15.0994L15.826 13.9477C16.7517 13.4631 17.3834 12.4884 17.3861 11.3694C17.3861 9.76299 16.0765 8.45339 14.4701 8.45339ZM15.1481 12.0119C14.7723 12.3876 14.1625 12.3876 13.7867 12.0119C13.411 11.6362 13.411 11.0263 13.7867 10.6506C14.1625 10.2748 14.7723 10.2748 15.1481 10.6506C15.5238 11.0263 15.5238 11.6362 15.1481 12.0119Z"
							fill="#292D32"
						/>
						<path
							d="M15.1475 12.0166C15.5234 11.6407 15.5234 11.0312 15.1475 10.6553C14.7715 10.2794 14.1621 10.2794 13.7861 10.6553C13.4102 11.0312 13.4102 11.6407 13.7861 12.0166C14.1621 12.3925 14.7715 12.3925 15.1475 12.0166Z"
							fill="#292D32"
						/>
						<path
							d="M6.99885 7.70083C9.12538 7.70083 10.8493 5.97694 10.8493 3.85042C10.8493 1.72389 9.12538 0 6.99885 0C4.87233 0 3.14844 1.72389 3.14844 3.85042C3.14844 5.97694 4.87233 7.70083 6.99885 7.70083Z"
							fill="#292D32"
						/>
						<path
							opacity="0.4"
							d="M7 9.63281C8.18471 9.63281 9.30183 9.87719 10.2812 10.3076C10.1102 10.6907 10.0146 11.1149 10.0146 11.5615C10.0147 12.701 10.6349 13.6928 11.5547 14.2256V15.793H0.385742C0.170194 15.793 0.000117394 15.6237 0 15.4082C0 12.2201 3.14202 9.63295 7 9.63281Z"
							fill="#292D32"
						/>
					</svg>

					<span>Sign in with Passkey</span>
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
