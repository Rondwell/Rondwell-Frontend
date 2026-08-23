import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
			workbox: {
				// Large hero/marketing images don't need to live in the precache
				// (they'd bloat the service worker and be re-fetched on every SW
				// update). Exclude them so they're served at runtime instead.
				globIgnores: [
					'**/present.svg',
					'**/jennifer.svg',
					'**/hero-event-1.png'
				],
				// Safety net so a single near-limit asset can't fail the build.
				// (Default is 2 MiB.)
				maximumFileSizeToCacheInBytes: 4 * 1024 * 1024
			},
			manifest: {
				name: 'Rondwell - Smart Event Management Platform',
				short_name: 'Rondwell',
				description:
					'AI-powered, real-time, multi-tenant event management SaaS with payment, analytics, chat, Web3, and more.',
				theme_color: '#513BE2',
				background_color: '#D4C0F4',
				icons: [
					{
						src: '/android-chrome-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: '/android-chrome-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: '/apple-touch-icon.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					}
				],
				start_url: '/',
				display: 'standalone',
				scope: '/',
				orientation: 'portrait'
			}
		})
	],
	server: {
		allowedHosts: [],

		/**
		 * Pre-transform the two modules every single page depends on, at startup.
		 *
		 * `src/app.css` is a Tailwind v4 entry, and its first transform costs ~25s
		 * on this project (the scan touches every file under `src/`, and cold reads
		 * on Windows run ~40ms each). The root `+layout.svelte` imports it, so that
		 * cost landed on whichever request arrived first.
		 *
		 * In SSR that request goes through Vite 6's module-runner transport, which
		 * gives up after a hard-coded 60s and is not configurable:
		 *
		 *   Error when evaluating SSR module /src/routes/+layout.svelte:
		 *   transport invoke timed out after 60000ms  ... fetchModule /src/app.css
		 *
		 * The render then aborts with a 500, and reloading starts over from cold —
		 * so the dev server could sit there failing every request indefinitely.
		 *
		 * Warmup does the same work at boot, where nothing is waiting on a 60s
		 * budget, and the first real request hits an already-warm cache (~1s).
		 * It does not make the total work smaller, it stops it landing inside a
		 * request that is allowed to time out.
		 */
		warmup: {
			ssrFiles: ['./src/app.css', './src/routes/+layout.svelte'],
			clientFiles: ['./src/app.css', './src/routes/+layout.svelte']
		}
	}
});
