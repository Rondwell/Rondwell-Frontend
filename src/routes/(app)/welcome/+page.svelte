<script>
	let fromEventPage = false;
	let header = fromEventPage ? 'Your  Event is Launched' : 'Welcome to Rondwell';
	let fullName = 'JOHN NEBRASKA';
	let eventName = 'SPREAD THE WORD';
	let name = fromEventPage ? eventName : fullName;

	// setTimeout(() => {
	// 	window.location.href = fromEventPage ? '/event-page' : '/dashboard';
	// }, 2000);
</script>

<section class="relative flex min-h-screen items-center justify-center bg-[#f4f1f0]">
	<div class="highlight highlight-1"></div>
	<div class="highlight highlight-2"></div>

	<div class="z-50 mx-auto space-y-4 text-center">
		<img src={fromEventPage ? '/add.svg' : '/face.svg'} alt="" class="mx-auto" />
		<span class="space-y-2">
			<h1 class="text-2xl font-medium text-white">{header}</h1>
			<p class="text-lg font-light text-white">{name}</p>
		</span>
	</div>
</section>

<style>
	.highlight {
		position: absolute;
		border-radius: 50%;
		z-index: 1;
	}

	.highlight-1 {
		width: 456.75px;
		height: 459.75px;
		left: 492px;
		top: 79.5px;

		background: rgba(231, 126, 231, 0.66);
		filter: blur(112.5px);
	}

	.highlight-2 {
		width: 392.25px;
		height: 273px;
		left: 514.5px;
		top: 36px;

		background: #dac5fe;
		filter: blur(112.5px);
	}
</style>
