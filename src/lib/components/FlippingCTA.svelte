<script lang="ts">
	import { onMount } from 'svelte';

	type AnimationType = 'flip' | 'fade' | 'slide' | 'none';

	interface Phrase {
		firstWord: string;
		staticWords: string;
		secondWord: string;
		animation?: AnimationType;
	}

	const phrases: Phrase[] = [
		{ firstWord: 'Embark', staticWords: 'on Your', secondWord: 'Adventure!', animation: 'flip' },
		{ firstWord: 'Deliver', staticWords: 'on Your', secondWord: 'Event!', animation: 'flip' },
		{ firstWord: 'Create', staticWords: 'on Your', secondWord: 'Experience!', animation: 'flip' },
		{ firstWord: 'Build', staticWords: 'on Your', secondWord: 'Moment!', animation: 'flip' },
		{ firstWord: 'Launch', staticWords: 'on Your', secondWord: 'Vision!', animation: 'flip' },
		{ firstWord: 'Command', staticWords: 'on Your', secondWord: 'Stage', animation: 'flip' },
		{ firstWord: 'Inspire', staticWords: 'on Your', secondWord: 'Audience', animation: 'flip' }
	];

	let index = 0;
	let firstIsAnimated = true; // Which word should be animated in flip mode
	let isAnimating = false;

	let currentPhrase = phrases[0];
	let nextPhrase = phrases[1];

	const intervalDuration = 3500;
	const animationDuration = 1200;

	function cycleToNext() {
		isAnimating = true;

		setTimeout(() => {
			// Update to next phrase
			index = (index + 1) % phrases.length;
			currentPhrase = phrases[index];
			nextPhrase = phrases[(index + 1) % phrases.length];

			// For flip animation, alternate which word gets animated
			if (currentPhrase.animation === 'flip') {
				firstIsAnimated = !firstIsAnimated;
			}

			isAnimating = false;
		}, animationDuration);
	}

	let interval: any;

	onMount(() => {
		interval = setInterval(cycleToNext, intervalDuration);
		return () => clearInterval(interval);
	});
</script>

<h1
	class="transition-container relative mb-6 w-[300px] md:w-auto md:px-20 text-[30px] font-bold text-[#06142D] md:text-[40px] md:leading-[45px] dark:text-white"
>
	{#if currentPhrase.animation === 'flip'}
		{#if firstIsAnimated}
			<span class="flip-container {isAnimating ? 'flipped' : ''}">
				<span class="flip-inner">
					<span class="flip-front">{currentPhrase.firstWord}</span>
					<span class="flip-back">{currentPhrase.firstWord}</span>
				</span>
			</span>
			<span class="static-words">{currentPhrase.staticWords}</span>
			<span class="gradient">{currentPhrase.secondWord}</span>
		{:else}
			<span class="gradient">{currentPhrase.firstWord}</span>
			<span class="static-words">{currentPhrase.staticWords}</span>
			<span class="flip-container {isAnimating ? 'flipped' : ''}">
				<span class="flip-inner">
					<span class="flip-front">{currentPhrase.secondWord}</span>
					<span class="flip-back">{currentPhrase.secondWord}</span>
				</span>
			</span>
		{/if}
	{:else if currentPhrase.animation === 'fade'}
		<span class="fade-element" class:fade-out={isAnimating}>
			<span class="gradient">{currentPhrase.firstWord}</span>
			<span class="static-words">{currentPhrase.staticWords}</span>
			<span class="gradient">{currentPhrase.secondWord}</span>
		</span>
	{:else if currentPhrase.animation === 'slide'}
		<span class="slide-element" class:slide-out={isAnimating}>
			<span class="gradient">{currentPhrase.firstWord}</span>
			<span class="static-words">{currentPhrase.staticWords}</span>
			<span class="gradient">{currentPhrase.secondWord}</span>
		</span>
	{:else}
		<!-- No animation -->
		<span class="gradient">{currentPhrase.firstWord}</span>
		<span class="static-words">{currentPhrase.staticWords}</span>
		<span class="gradient">{currentPhrase.secondWord}</span>
	{/if}
</h1>

<style>
	.gradient {
		background: linear-gradient(90deg, #db3ec6 0%, #513be2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* Smooth transition container */
	.transition-container {
		transition:
			opacity 1s ease,
			transform 1s ease;
		opacity: 1;
		transform: translateY(0);
	}

	.transition-container.transitioning {
		opacity: 1;
		transform: translateY(-2px);
	}

	/* Flip animation */
	.flip-container {
		display: inline-block;
		perspective: 600px;
	}

	.flip-inner {
		display: inline-block;
		transition: transform 0.6s ease;
		transform-style: preserve-3d;
		position: relative;
	}

	.flipped .flip-inner {
		transform: rotateX(180deg);
	}

	.flip-front,
	.flip-back {
		display: inline-block;
		backface-visibility: hidden;
		position: relative;
	}

	.flip-back {
		position: absolute;
		top: 0;
		left: 0;
		transform: rotateX(180deg);
	}

	/* Fade animation */
	.fade-element {
		display: inline-block;
		transition: opacity 0.6s ease;
		opacity: 1;
	}

	.fade-element.fade-out {
		opacity: 0;
	}

	/* Slide animation */
	.slide-element {
		display: inline-block;
		transition:
			transform 0.6s ease,
			opacity 0.6s ease;
		transform: translateY(0);
		opacity: 1;
	}

	.slide-element.slide-out {
		transform: translateY(-20px);
		opacity: 0;
	}
</style>
