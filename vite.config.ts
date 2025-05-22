import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import adapter from '@sveltejs/adapter-netlify';

export default defineConfig({
	plugins: [
		adapter({
			edge: false,
			split: false,
		}),
		tailwindcss(),
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
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
		allowedHosts: []
	},
	css: {
		postcss: './postcss.config.cjs'
	}
});
