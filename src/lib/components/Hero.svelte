<script lang="ts">
	// Image imports
	import HeroBg from '$lib/assets/images/hero-bg.png';
	import UserSvg from '$lib/assets/images/user.svg';
</script>

<!-- ===================== HERO SECTION ===================== -->
<section
	id="hero"
	style="background-image: url({HeroBg}); background-size: cover; background-position: center;"
	class="relative flex min-h-screen w-full items-center overflow-x-hidden"
>
	<!-- ===================== Hero Background Overlay ===================== -->
	<div class="absolute inset-0 -z-10 bg-black/40"></div>

	<!-- ===================== Hero Content ===================== -->
	<div
		class="z-10 w-full flex items-center justify-center px-4 py-16 text-center text-white pt-[280px] md:py-24 lg:py-32"
	>
		<div class="w-full w-[339px] h-[206px] md:w-[502.5px] md:h-[224px] bg-white/45 backdrop-blur-md border border-white/20 rounded-[15px] flex flex-col items-center justify-center">
			<h1 class="mb-6 text-[30px] md:text-[40px] text-[#06142D] font-bold md:leading-[45px]">
				Embark on Your <br /> <span class="bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] text-transparent bg-clip-text">Adventure!</span>
			</h1>

			<div class="flex flex-wrap justify-center gap-4">
				<button
					type="button"
					class="rounded-[9px] bg-white/90 text-[12px] text-[#06142D] px-6 py-3 font-medium transition-colors md:w-[161.25px] h-[36px] flex items-center justify-center gap-1 text-nowrap"
				>
					Join Waitlist

					<img src={UserSvg} alt="User Icon" />
				</button>
			</div>
		</div>
	</div>
</section>
