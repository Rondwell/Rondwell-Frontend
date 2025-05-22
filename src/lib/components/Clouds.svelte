<script>
	import CloudPng from '$lib/assets/images/clouds.png';
	// Speed of cloud movement in pixels per second
	const speed = 20;
</script>

<div class="sky">
	<div class="cloud-layer background" style="background-image: url({CloudPng});"></div>
	<div class="cloud-layer middle" style="background-image: url({CloudPng});"></div>
	<div class="cloud-layer foreground" style="background-image: url({CloudPng});"></div>
</div>

<style>
	.sky {
		position: relative;
		overflow: hidden;
		width: 100%;
		background: transparent;
	}

	.cloud-layer {
		position: absolute;
		top: 0;
		left: 0;
		width: 200%;
		background-repeat: repeat-x;
		background-size: contain;
		animation: moveClouds linear infinite;
		opacity: 0.6;
	}

	.cloud-layer.middle {
		animation-duration: calc(200 / (speed * 0.75) * 1s);
		opacity: 0.8;
		z-index: 2;
	}

	.cloud-layer.foreground {
		animation-duration: calc(200 / (speed * 1.2) * 1s);
		opacity: 1;
		z-index: 3;
	}

	.cloud-layer.background {
		animation-duration: calc(200 / (speed * 0.5) * 1s);
		opacity: 0.4;
		z-index: 1;
	}

	@keyframes moveClouds {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}
</style>
