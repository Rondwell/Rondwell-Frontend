import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { loadEnv } from 'vite';

/**
 * The API origins the browser is actually configured to talk to.
 *
 * `connect-src` used to hardcode `https://api.rondwell.com` and bolt on
 * `http://localhost:*` behind `process.env.NODE_ENV !== 'production'`. That guard
 * does not work: `svelte.config.js` is evaluated while Vite is still resolving
 * its own config, before `.env` has been applied to `process.env`, so NODE_ENV
 * is unreliable here. When it read as production in dev, every call to
 * `VITE_API_URL` (http://localhost:3000) was blocked — and because
 * `api.client.ts` treats a failed refresh as an invalid session, a blocked fetch
 * signed the user out and bounced them to /auth mid-navigation.
 *
 * Reading the same env vars the client reads makes the policy follow the
 * configuration instead of guessing at it: dev allows localhost because
 * `.env` points there, production allows api.rondwell.com because
 * `.env.production` does. The two cannot drift.
 */
/**
 * Which env file the policy follows is decided by the VITE COMMAND, not by
 * `NODE_ENV`.
 *
 * The docblock above already says `NODE_ENV` is unreliable here, and then this
 * line used it anyway. Vite only forces `NODE_ENV=production` for `vite build`;
 * for `vite dev` it leaves whatever the shell had. So a terminal that happened
 * to export `NODE_ENV=production` — after a build, or a stray `set`, and it
 * persists for the life of the shell — made `loadEnv` read `.env.production`
 * under `vite dev`. The dev server then served the PRODUCTION policy:
 * `connect-src` allowed `https://api.rondwell.com` and nothing on localhost, so
 * the browser refused every call to `VITE_API_URL` (http://localhost:3000) —
 * admin login included — with a CSP violation rather than a network error.
 *
 * `vite dev` puts `dev` in argv and a build does not, so the command is the one
 * signal here that cannot be polluted by the environment. `build` keeps reading
 * `NODE_ENV`, which Vite itself sets to `production` before this file loads.
 */
const viteCommand = process.argv.find((a) => a === 'dev' || a === 'build' || a === 'preview');
const mode = viteCommand === 'dev' ? 'development' : process.env.NODE_ENV || 'development';

const env = loadEnv(mode, process.cwd(), '');

/** `http://localhost:3000/api` -> `http://localhost:3000`; unparseable -> dropped. */
function toOrigin(value) {
	try {
		return new URL(value).origin;
	} catch {
		return null;
	}
}

const configuredOrigins = [
	env.VITE_API_URL,
	env.VITE_EVENT_API_URL,
	env.VITE_COMMUNITY_WS_URL
]
	.filter(Boolean)
	.map(toOrigin)
	.filter(Boolean);

// Vite's HMR socket in dev. Harmless in production, where no localhost origin is
// configured and this stays empty.
const devSocketOrigins = configuredOrigins.some((o) => o.includes('localhost'))
	? ['ws://localhost:*', 'http://localhost:*']
	: [];

/**
 * Iconify's icon API.
 *
 * `@iconify/svelte` is used for 1,587 icons across 259 components, and NO icon
 * set is bundled (`@iconify-json/*` is not installed and nothing calls
 * `addCollection`). Every icon is therefore fetched at runtime from these hosts,
 * which `connect-src` governs — so leaving them out silently blanks the icon in
 * every button, card and modal in the product.
 *
 * It did not surface the moment the CSP landed because Iconify caches icon data
 * in `localStorage`: already-cached icons kept rendering from that copy. Clearing
 * site storage (or a fresh browser profile) empties the cache, the refetch is
 * blocked, and the icons disappear all at once — which reads as "it broke today"
 * long after the actual cause.
 *
 * All three hosts are listed because the client rotates onto the fallbacks when
 * the primary fails; listing only the primary makes an outage look like a bug.
 *
 * This is a third-party runtime dependency for core UI. Bundling the sets in use
 * (`mdi`, `heroicons`, `solar`, `simple-icons`, `ri`, `line-md`, `ic`) would
 * remove the network round trip and these three entries with it.
 */
const ICONIFY_API = [
	'https://api.iconify.design',
	'https://api.simplesvg.com',
	'https://api.unisvg.com'
];

/**
 * Payment SDKs. Both are loaded as `<script>` tags at runtime, both talk to
 * their own API, and both render their card form in an iframe — so each needs
 * three directives, not one. Missing any of the three breaks checkout in a way
 * that looks like a payment bug rather than a policy problem.
 *
 * Paystack: `js.paystack.co` v1 (`GiftRegistryView`, `gift/[slug]`) and v2
 * (`RegistrationModal` — ticket purchase — and `subscription`).
 * Stripe: `js.stripe.com/v3` via `lib/utils/loadStripe.ts`.
 */
const PAYSTACK = {
	script: 'https://js.paystack.co',
	connect: ['https://api.paystack.co', 'https://checkout.paystack.com'],
	frame: ['https://js.paystack.co', 'https://checkout.paystack.com']
};
const STRIPE = {
	script: 'https://js.stripe.com',
	connect: ['https://api.stripe.com'],
	frame: ['https://js.stripe.com', 'https://hooks.stripe.com']
};

/**
 * Geocoding. HERE powers `AddressAutocomplete` (used by Create Event);
 * OpenStreetMap's Nominatim does reverse lookups in Create Event and
 * `ExternalEventModal`.
 */
const GEOCODING = [
	'https://autosuggest.search.hereapi.com',
	'https://lookup.search.hereapi.com',
	'https://nominatim.openstreetmap.org'
];

const connectSrc = [
	...new Set([
		'self',
		...configuredOrigins,
		...devSocketOrigins,
		// Google Identity Services.
		'https://accounts.google.com',
		...ICONIFY_API,
		...PAYSTACK.connect,
		...STRIPE.connect,
		...GEOCODING
	])
];

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			edge: false,
			split: false
		}),
		paths: {
			base: ''
		},

		/**
		 * M-07 — Content Security Policy.
		 *
		 * Nothing set any security header at all. With C-09's unsanitized sinks
		 * and tokens in `localStorage`, there was **no second line of defence**:
		 * one injected `<script>` anywhere read the session and kept it.
		 *
		 * ── Why this is only possible now ────────────────────────────────
		 *
		 * A CSP without `unsafe-inline` needs a per-request nonce, and a
		 * per-request nonce needs a server that handles the request. Until
		 * **H-13** added `hooks.server.ts` there was no such place — which is
		 * why M-07's "with" note says per-request nonces require H-13.
		 *
		 * `mode: 'nonce'` makes SvelteKit stamp every inline script and style it
		 * emits with a fresh nonce, and emit that nonce in the header. The one
		 * hand-written inline script in `app.html` (the theme FOUC guard) carries
		 * `nonce="%sveltekit.nonce%"` so it is covered by the same mechanism
		 * rather than forcing a hash or an `unsafe-inline` escape hatch.
		 *
		 * ── Notes on specific directives ─────────────────────────────────
		 *
		 * `script-src` includes `https://accounts.google.com` for the Google
		 * Identity Services client loaded in `app.html`; sign-in breaks without
		 * it. `strict-dynamic` is deliberately NOT used: it would let the GSI
		 * script load anything it liked, which defeats the point of naming hosts.
		 *
		 * `style-src` carries `unsafe-inline`. Svelte emits inline `style="..."`
		 * attributes for transitions and dynamic styles, and CSP nonces do not
		 * apply to style ATTRIBUTES (only to `<style>` elements) — so the choice
		 * is `unsafe-inline` on styles or no transitions. Inline styles cannot
		 * execute script; this is the standard trade and it is the reason
		 * `unsafe-inline` appears here and nowhere in `script-src`.
		 *
		 * `connect-src` must list every API origin the browser talks to. The
		 * Rondwell origins are built from the same env vars the client uses, so
		 * those two cannot drift.
		 *
		 * The third-party entries are the part that DID drift. This policy was
		 * written naming only Rondwell's own API and Google, while the app also
		 * calls Iconify (every icon in the product), Paystack and Stripe (all
		 * checkout), HERE and Nominatim (address lookup). Each was blocked, and
		 * each failed silently in a way that looks like a feature bug — blank
		 * icons, a pay button that does nothing, an address box that never
		 * suggests. They are grouped by vendor above so that adding an SDK means
		 * adding one block, not remembering three separate directives.
		 *
		 * `frame-ancestors 'none'` is the clickjacking control; `X-Frame-Options`
		 * is set alongside it in `hooks.server.ts` for older browsers.
		 */
		csp: {
			mode: 'nonce',
			directives: {
				'default-src': ['self'],
				// The payment SDKs are injected as <script> tags at runtime, so
				// without these two entries checkout never loads at all — the button
				// simply does nothing.
				'script-src': [
					'self',
					'https://accounts.google.com',
					'https://apis.google.com',
					PAYSTACK.script,
					STRIPE.script
				],
				// See the note above — style ATTRIBUTES cannot carry a nonce.
				// `accounts.google.com` serves the GSI button's stylesheet
				// (`/gsi/style`); without it the Sign in with Google button renders
				// unstyled and the console logs a style-src violation on every load.
				'style-src': [
					'self',
					'unsafe-inline',
					'https://fonts.googleapis.com',
					'https://accounts.google.com'
				],
				'font-src': ['self', 'https://fonts.gstatic.com', 'data:'],
				// S3/CloudFront event images, QR data URLs, and the Netlify Image CDN.
				'img-src': ['self', 'data:', 'blob:', 'https:'],
				// Derived from VITE_API_URL / VITE_EVENT_API_URL /
				// VITE_COMMUNITY_WS_URL — see the note at the top of this file.
				'connect-src': connectSrc,
				// Both payment SDKs render their card form in an iframe. `frame-src`
				// is what allows that frame to exist; `connect-src` above is what
				// lets it talk to its API. Both are required for a working checkout.
				//
				// `www.google.com` is the venue map on the public event page — an
				// `<iframe src="https://www.google.com/maps?...&output=embed">`. A
				// blocked frame renders as a broken-document placeholder rather than
				// an error, so it reads as "the map is down" instead of a policy
				// problem. It and the payment frames are the only third-party frames
				// in the app; the `<iframe>` in `Embed.svelte` is a copyable code
				// SAMPLE (a string), not a live frame, so it needs nothing here.
				'frame-src': [
					'self',
					'https://accounts.google.com',
					'https://www.google.com',
					...PAYSTACK.frame,
					...STRIPE.frame
				],
				// Clickjacking: this app is never framed.
				'frame-ancestors': ['none'],
				'base-uri': ['self'],
				// No <form action> may post off-origin.
				'form-action': ['self'],
				'object-src': ['none']
			}
		}
	}
};

export default config;
