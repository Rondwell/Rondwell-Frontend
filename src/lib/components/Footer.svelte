<script lang="ts">
	import LogoSvg from '$lib/assets/images/logo.svg';
	import ArowSvg from '$lib/assets/images/arow.svg';
	import LinkedInSvg from '$lib/assets/images/linkedin.svg';
	import FacebookSvg from '$lib/assets/images/facebook.svg';
	import SocialSvg from '$lib/assets/images/social.svg';
</script>

<footer class="relative flex min-h-screen w-full items-center overflow-x-hidden">
	<div class="absolute left-0 bottom-0 pb-[100px] md:pb-[150px] w-full px-5 md:px-10">
		<div
			class="w-full md:container mx-auto flex h-[200px] items-center justify-between border-t border-[#E2E4E5] px-0 py-5 md:h-[123px]"
		>
			<div class="flex w-full flex-wrap items-center justify-between gap-4">
				<div class="flex w-full flex-col gap-3 md:w-auto">
					<div class="flex w-full gap-5">
						<!-- Logo -->
						<a href="/" class="text-xl font-bold text-indigo-600">
							<img src={LogoSvg} alt="Logo" class="h-[20.98px] w-[68.18px]" />
						</a>

						<!-- Nav Links -->
						<div class="flex space-x-8 flex-row">
							<a
								href="https://rondwell.com/api-docs"
								class="merriweather-sans text-[15px] font-bold text-[#7A7B7E] transition-colors text-nowrap"
								>API Docs</a
							>
							<a
								href="/"
								class="merriweather-sans text-[15px] font-bold text-[#7A7B7E] transition-colors"
								>Discover</a
							>
							<a
								href="/"
								class="merriweather-sans text-[15px] font-bold text-[#7A7B7E] transition-colors"
								>Pricing</a
							>
						</div>
					</div>
					<div class="flex space-x-8">
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
					</div>
				</div>
				<div class="flex w-full flex-row gap-5 md:w-auto">
					<a
						href="https://www.linkedin.com/company/rondwell"
						target="_blank"
						rel="noopener noreferrer"
						class="merriweather-sans text-[15px] font-light text-[#A9AAAA] transition-colors"
					>
						<img src={LinkedInSvg} alt="LinkedIn" class="h-[18px] w-[18px]" />
					</a>
					<a
						href="https://web.facebook.com/rondwellhq/"
						target="_blank"
						rel="noopener noreferrer"
						class="merriweather-sans text-[15px] font-light text-[#A9AAAA] transition-colors"
					>
						<img src={FacebookSvg} alt="Facebook" class="h-[18px] w-[18px]" />
					</a>
					<a
						href="https://www.rondwell.com"
						target="_blank"
						rel="noopener noreferrer"
						class="merriweather-sans text-[15px] font-light text-[#A9AAAA] transition-colors"
					>
						<img src={SocialSvg} alt="Social" class="h-[18px] w-[18px]" />
					</a>
				</div>
				<div class="w-full md:mt-4 md:text-center">
					<p
						class="merriweather-sans flex items-center bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] bg-clip-text text-[14.25px] text-transparent md:justify-center"
					>
						Host your event with Rondwell

						<img src={ArowSvg} alt="Arrow Icon" class="mb-1 ml-1" />
					</p>
				</div>
			</div>
		</div>
	</div>
</footer>
