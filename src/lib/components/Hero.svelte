<script lang="ts">
	// Image imports
	import HeroBg from '$lib/assets/images/hero-bg.png';
	import UserSvg from '$lib/assets/images/user.svg';
</script>

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
					class="flex h-[36px] items-center justify-center gap-1 rounded-[9px] bg-white/90 px-6 py-3 text-[12px] font-medium text-nowrap text-[#06142D] transition-colors md:w-[161.25px]"
				>
					Join Waitlist

					<img src={UserSvg} alt="User Icon" />
				</button>
			</div>
		</div>
	</div>
</section>

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
