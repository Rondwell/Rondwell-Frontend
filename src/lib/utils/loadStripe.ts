/**
 * CC-6 / FE-P2-05 — Stripe inline checkout loader.
 *
 * Mirrors `loadPaystackScript` from RegistrationModal — lazy-injects the
 * `<script src="https://js.stripe.com/v3/">` tag and resolves once the
 * `Stripe` global is ready. Used by USD subscription checkout (and any
 * other USD payment flow) where Paystack/Flutterwave aren't available.
 *
 * Usage:
 *   await loadStripeScript();
 *   const stripe = (window as any).Stripe(publishableKey);
 *   const result = await stripe.redirectToCheckout({ sessionId });
 */

import { browser } from '$app/environment';

declare global {
	interface Window {
		Stripe?: any;
	}
}

let loadPromise: Promise<void> | null = null;

export function loadStripeScript(): Promise<void> {
	if (!browser) return Promise.resolve();
	if (typeof window.Stripe !== 'undefined') return Promise.resolve();
	if (loadPromise) return loadPromise;

	loadPromise = new Promise<void>((resolve, reject) => {
		const existing = document.querySelector('script[src="https://js.stripe.com/v3/"]');
		if (existing) {
			// Another caller already injected the script. Wait for it to load.
			existing.addEventListener('load', () => resolve(), { once: true });
			existing.addEventListener('error', () => reject(new Error('Failed to load Stripe.js')), { once: true });
			// If the script is already finished loading, the Stripe global is set.
			if (typeof window.Stripe !== 'undefined') resolve();
			return;
		}

		const script = document.createElement('script');
		script.src = 'https://js.stripe.com/v3/';
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => {
			loadPromise = null;
			reject(new Error('Failed to load Stripe.js'));
		};
		document.head.appendChild(script);
	});

	return loadPromise;
}

/**
 * Initialise a Stripe instance with the supplied publishable key. Returns
 * the global Stripe object. Throws if the key is empty.
 */
export async function getStripe(publishableKey: string): Promise<any> {
	if (!publishableKey) throw new Error('Stripe publishable key is required');
	await loadStripeScript();
	if (typeof window === 'undefined' || typeof window.Stripe === 'undefined') {
		throw new Error('Stripe.js failed to load');
	}
	return window.Stripe(publishableKey);
}
