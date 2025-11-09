<!-- src/routes/auth/verify/+page.svelte -->
<script lang="ts">
	import Header from '../components/Header.svelte';

	let code = Array(6).fill('');
	let email = 'you@gmail.com'; // In real app, this would come from session or URL param

	function handleInput(e: Event, index: number) {
		const target = e.target as HTMLInputElement | null;
		const value = target?.value ?? '';
		if (value.length === 1 && /[0-9]/.test(value)) {
			code[index] = value;
			if (index < 6) {
				document.getElementById(`code-${index + 1}`)?.focus();
			}
		} else if (value.length === 0) {
			code[index] = '';
			if (index > 0) {
				document.getElementById(`code-${index - 1}`)?.focus();
			}
		}
	}

	function pasteCode(e: Event) {
		e.preventDefault();
		const clipboardEvent = e as ClipboardEvent;
		const pasted = clipboardEvent.clipboardData?.getData('text').trim().slice(0, 6) ?? '';
		if (/^[0-9]{6}$/.test(pasted)) {
			for (let i = 0; i < 6; i++) {
				code[i] = pasted[i];
			}
			const lastInput = document.getElementById('code-5');
			if (lastInput) lastInput.focus();
		}
	}

	function resendCode() {
		// Add logic here
		console.log('Resend code');
	}
</script>

<main class="bg flex h-full min-h-screen flex-col items-stretch">
	<Header />

	<div class="flex h-full flex-1 items-center justify-center px-4 py-15">
		<div class="mx-auto w-full max-w-[405px] rounded-[12px] bg-[#FDFCFB] px-4 py-6 md:px-6 shadow-sm">
			<div class="mb-6 space-y-3 text-left">
				<button
					aria-label="Go back"
					type="button"
					on:click={() => history.back()}
					class="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F3F3]"
				>
					<svg
						width="11"
						height="11"
						viewBox="0 0 11 11"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M8.32471 0.252009C8.81153 0.252009 9.28374 0.441866 9.65858 0.806975C10.2671 1.40089 10.4131 2.27715 10.0334 3.03658L9.24479 4.61385C9.07927 4.94488 9.07927 5.34407 9.24479 5.67997L10.0334 7.26211C10.4131 8.02154 10.2671 8.8978 9.65858 9.49172C9.05007 10.0856 8.1738 10.2171 7.41924 9.81788L1.77708 6.84832C1.14422 6.51729 0.749907 5.86496 0.749907 5.14935C0.749907 4.43373 1.14422 3.7814 1.77708 3.45037L7.41924 0.480811C7.71133 0.325031 8.01802 0.252009 8.32471 0.252009ZM8.31985 9.31646C8.65575 9.31646 8.94783 9.16068 9.14743 8.96596C9.44925 8.67387 9.66345 8.15298 9.3811 7.58341L8.59246 6.00614C8.32471 5.46577 8.32471 4.82805 8.59246 4.28769L9.3811 2.71041C9.66832 2.14084 9.44925 1.61995 9.14743 1.32786C8.8456 1.03578 8.32471 0.826448 7.76001 1.1234L2.11785 4.09296C1.71866 4.30229 1.48013 4.69661 1.48013 5.14448C1.48013 5.59235 1.71866 5.98666 2.11785 6.19599L7.76001 9.17529C7.95474 9.27752 8.14459 9.31646 8.31985 9.31646Z"
							fill="#131517"
						/>
					</svg>
				</button>
				<h2 class="mt-6 text-3xl font-semibold">Enter code</h2>
				<span class="space-y-1">
					<p class="text-[#919091]">Please enter the 5 digit code we sent to</p>
					<p>{email}</p>
				</span>
			</div>
			<div class="space-y-4">
				<div class="flex space-x-2">
					{#each code as _, i (i)}
						<input
							id={`code-${i}`}
							on:input={(e) => handleInput(e, i)}
							on:paste={pasteCode}
							type="text"
							maxlength="1"
							pattern="[0-9]"
							class="h-[48.75px] w-[45px] sm:w-[48.75px] rounded-md border border-gray-300 text-center text-lg focus:ring-2 focus:ring-black focus:outline-none md:w-full"
							value={_}
						/>
					{/each}
				</div>

				<div class="flex justify-between text-xs">
					<button
						on:click={pasteCode}
						class="flex items-center gap-1 rounded-md bg-[#F4F1F1] px-3 py-1 text-[#646466]"
					>
						<svg
							width="17"
							height="17"
							viewBox="0 0 17 17"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M7.375 4.125H10.125C11.5 4.125 11.5 3.4375 11.5 2.75C11.5 1.375 10.8125 1.375 10.125 1.375H7.375C6.6875 1.375 6 1.375 6 2.75C6 4.125 6.6875 4.125 7.375 4.125Z"
								stroke="#646466"
								stroke-width="1.125"
								stroke-miterlimit="10"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M10.125 15.1269H6.6875C3.25 15.1269 2.5625 13.7519 2.5625 11.0019V6.87688C2.5625 3.74188 3.71063 2.88938 6 2.76562"
								stroke="#646466"
								stroke-width="1.125"
								stroke-miterlimit="10"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M11.5 2.76562C13.7894 2.88938 14.9375 3.735 14.9375 6.87688V10.3144"
								stroke="#646466"
								stroke-width="1.125"
								stroke-miterlimit="10"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M14.9375 13.0625V15.125H12.875"
								stroke="#646466"
								stroke-width="1.125"
								stroke-miterlimit="10"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M10.8125 11L14.91 15.0975"
								stroke="#646466"
								stroke-width="1.125"
								stroke-miterlimit="10"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>

						Paste Code
					</button>
					<button on:click={resendCode} class="text-[#B9B7B7]"> Resend code in 42s </button>
				</div>
			</div>
		</div>
	</div>
</main>

<style>
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
