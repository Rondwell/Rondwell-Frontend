/**
 * Scale down animation - scales element from large to original size
 * @param {HTMLElement} element - The DOM element to animate
 * @param {Object} options - Animation options
 */
export function scaleDownAnimation(element: gsap.TweenTarget, options = {}) {
	const defaults = {
		duration: 1.5,
		scale: 1.5, // Starting scale
		ease: 'power3.out',
		delay: 0
	};

	const settings = { ...defaults, ...options };

	return gsap.fromTo(
		element,
		{
			scale: settings.scale,
			opacity: 0
		},
		{
			scale: 1,
			opacity: 1,
			duration: settings.duration,
			ease: settings.ease,
			delay: settings.delay
		}
	);
}

/**
 * Staggered scale down animation for multiple elements
 * @param {Array|NodeList} elements - Array of DOM elements to animate
 * @param {Object} options - Animation options
 */
export function staggeredScaleDown(elements: gsap.TweenTarget, options = {}) {
	const defaults = {
		duration: 1.5,
		scale: 1.5,
		stagger: 0.2,
		ease: 'power3.out',
		delay: 0
	};

	const settings = { ...defaults, ...options };

	return gsap.fromTo(
		elements,
		{
			scale: settings.scale,
			opacity: 0
		},
		{
			scale: 1,
			opacity: 1,
			duration: settings.duration,
			ease: settings.ease,
			stagger: settings.stagger,
			delay: settings.delay
		}
	);
}

/**
 * Floating animation for images
 * @param {HTMLElement} element - The DOM element to animate
 */
export function floatingAnimation(element: gsap.TweenTarget) {
	// Random values for more natural movement
	const xMovement = Math.random() * 20 - 10; // -10 to 10
	const yMovement = Math.random() * 20 - 10; // -10 to 10
	const duration = 3 + Math.random() * 2; // 3-5 seconds

	// Create floating timeline
	const tl = gsap.timeline({
		repeat: -1, // Infinite repeat
		yoyo: true, // Yoyo effect for smooth transition
		ease: 'sine.inOut'
	});

	tl.to(element, {
		x: xMovement,
		y: yMovement,
		rotation: Math.random() * 5 - 2.5, // Slight rotation
		duration: duration
	});

	return tl;
}

/**
 * Scroll-triggered animation for elements
 * @param {string} selector - CSS selector for elements to animate
 * @param {Object} options - Animation and trigger options
 */
export function scrollAnimation(selector: gsap.DOMTarget, options = {}) {
	// Check if browser is ready for scroll trigger
	if (typeof window === 'undefined' || !document) {
		console.warn('ScrollTrigger is not available in this environment.');
		return;
	}

	const defaults = {
		y: 50,
		opacity: 0,
		duration: 1,
		stagger: 0.2,
		trigger: selector,
		start: 'top 80%',
		toggleActions: 'play none none none'
	};

	const settings = { ...defaults, ...options };

	return gsap.from(selector, {
		y: settings.y,
		opacity: settings.opacity,
		duration: settings.duration,
		stagger: settings.stagger,
		scrollTrigger: {
			trigger: settings.trigger,
			start: settings.start,
			toggleActions: settings.toggleActions
		}
	});
}

/**
 * Initialize hero animations
 * @param {Array} imageElements - Array of image elements to animate
 */
export function initHeroAnimations(imageElements: gsap.DOMTarget[]) {
	// First scale down all images from larger size
	scaleDownAnimation(imageElements, {
		scale: 2,
		stagger: 0.15,
		duration: 1.2
	});
}

/**
 * Fade in animation for elements
 * @param {HTMLElement} element - The DOM element to animate
 * @param {Object} options - Animation options
 */
export function fadeInAnimation(element: gsap.TweenTarget, options = {}) {
	const defaults = {
		duration: 1,
		opacity: 0,
		delay: 0
	};

	const settings = { ...defaults, ...options };

	return gsap.fromTo(
		element,
		{
			opacity: settings.opacity
		},
		{
			opacity: 1,
			duration: settings.duration,
			delay: settings.delay
		}
	);
}
