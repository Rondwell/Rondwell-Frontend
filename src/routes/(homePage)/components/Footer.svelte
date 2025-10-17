<script lang="ts">
	import { Mail, CheckCircle } from 'lucide-svelte';
</script>

<footer class="flex min-h-[300px] w-full items-center justify-center bg-[#F4F5F6] px-4">
	<div
		class="flex h-[200px] w-full items-center justify-center border-t border-[#E2E4E5] py-6 md:h-[150px] md:max-w-5xl"
	>
		<div class="flex w-full flex-wrap items-center justify-between gap-4">
			<div class="flex w-full flex-col gap-3 md:w-auto">
				<div class="flex w-full gap-5">
					<!-- Logo -->
					<a href="/" class="text-xl font-bold text-indigo-600">
						<img
							src="/logo.svg"
							alt="Rondwell Logo"
							class="h-[20.98px] w-[68.18px] object-contain"
						/>
					</a>

					<!-- Nav Links -->
					<div class="flex flex-row space-x-8">
						<a
							href="https://rondwell.com/api-docs"
							class="merriweather-sans text-[15px] font-bold text-nowrap text-[#7A7B7E] transition-colors"
							>API Docs</a
						>
						<a
							href="/discover"
							class="merriweather-sans text-[15px] font-bold text-[#7A7B7E] transition-colors"
							>Discover</a
						>
						<a
							href="/pricing"
							class="merriweather-sans text-[15px] font-bold text-[#7A7B7E] transition-colors"
							>Pricing</a
						>
					</div>
				</div>
				<div class="flex flex-wrap space-x-8">
					<a
						href="/"
						class="merriweather-sans text-[15px] font-normal text-[#A9AAAA] transition-colors"
						>Terms</a
					>
					<a
						href="/"
						class="merriweather-sans text-[15px] font-normal text-[#A9AAAA] transition-colors"
						>Privacy Policy</a
					>
					<a
						href="/"
						class="merriweather-sans text-[15px] font-normal text-[#A9AAAA] transition-colors"
						>Security</a
					>

					<a
						href="/help-center"
						class="merriweather-sans text-[15px] font-normal text-[#A9AAAA] transition-colors"
						>Help Center</a
					>
				</div>
			</div>
			<div class="flex w-full flex-row gap-5 md:w-auto">
				<a
					href="https://www.linkedin.com/company/rondwell"
					target="_blank"
					rel="noopener noreferrer"
					class="merriweather-sans text-[15px] font-light text-[#A9AAAA] transition-colors"
					aria-label="LinkedIn"
				>
					<svg
						width="18"
						height="18"
						viewBox="0 0 18 18"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M0 1.27797C0 0.572165 0.572164 0 1.27796 0H16.7265C17.4323 0 18.0045 0.572166 18.0045 1.27797V16.7265C18.0045 17.4323 17.4323 18.0045 16.7265 18.0045H1.27797C0.572165 18.0045 0 17.4323 0 16.7265V1.27797Z"
							fill="#AEA3C8"
						/>
						<path
							d="M4.04089 5.59131C4.9035 5.59131 5.60278 4.89203 5.60278 4.02942C5.60278 3.16681 4.9035 2.46753 4.04089 2.46753C3.17828 2.46753 2.479 3.16681 2.479 4.02942C2.479 4.89203 3.17828 5.59131 4.04089 5.59131Z"
							fill="white"
						/>
						<path
							d="M7.0332 6.74559H9.62175V7.93142C9.62175 7.93142 10.3242 6.52654 12.2354 6.52654C13.9403 6.52654 15.3527 7.36642 15.3527 9.92644V15.3248H12.6702V10.5806C12.6702 9.07041 11.8639 8.90431 11.2496 8.90431C9.97456 8.90431 9.75627 10.0041 9.75627 10.7776V15.3248H7.0332V6.74559Z"
							fill="white"
						/>
						<path d="M2.67935 6.7456H5.40243V15.3248H2.67935V6.7456Z" fill="white" />
					</svg>
				</a>
				<a
					href="https://web.facebook.com/rondwellhq/"
					target="_blank"
					rel="noopener noreferrer"
					class="merriweather-sans text-[15px] font-light text-[#A9AAAA] transition-colors"
					aria-label="Facebook"
				>
					<svg
						width="21"
						height="21"
						viewBox="0 0 21 21"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M12.3 8.06998V10.68H14.64C14.82 10.68 14.91 10.86 14.91 11.04L14.55 12.75C14.55 12.84 14.37 12.93 14.28 12.93H12.3V19.5H9.60005V13.02H8.07005C7.89005 13.02 7.80005 12.93 7.80005 12.75V11.04C7.80005 10.86 7.89005 10.77 8.07005 10.77H9.60005V7.79998C9.60005 6.26998 10.77 5.09998 12.3 5.09998H14.73C14.91 5.09998 15 5.18998 15 5.36998V7.52998C15 7.70998 14.91 7.79998 14.73 7.79998H12.57C12.39 7.79998 12.3 7.88998 12.3 8.06998Z"
							stroke="#AEA3C8"
							stroke-width="1.5"
							stroke-miterlimit="10"
							stroke-linecap="round"
						/>
						<path
							d="M13.2 19.5H7.8C3.3 19.5 1.5 17.7 1.5 13.2V7.8C1.5 3.3 3.3 1.5 7.8 1.5H13.2C17.7 1.5 19.5 3.3 19.5 7.8V13.2C19.5 17.7 17.7 19.5 13.2 19.5Z"
							stroke="#AEA3C8"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</a>
				<a
					href="mailto:info@rondwell.com"
					target="_blank"
					rel="noopener noreferrer"
					class="merriweather-sans text-[15px] font-light text-[#A9AAAA] transition-colors"
				>
					<Mail size={18} />
				</a>
			</div>
			<div class="w-full md:mt-4 md:text-center">
				<div
					class="merriweather-sans flex items-center gap-1 bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] bg-clip-text text-[14.25px] text-transparent md:justify-center"
				>
					Organize your event with Rondwell

					<img src="/send-icon.svg" alt="send icon" class="self-start" />
				</div>
			</div>
		</div>
	</div>
</footer>
