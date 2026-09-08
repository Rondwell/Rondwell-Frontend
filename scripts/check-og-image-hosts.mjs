#!/usr/bin/env node
/**
 * Share-image host coverage check — fails the build when the two allow-lists
 * that decide whether a WhatsApp preview has a picture drift apart.
 *
 * ── Why this exists ──────────────────────────────────────────────────────
 *
 * Every `og:image` is rewritten to a Netlify Image CDN transform:
 *
 *   https://rondwell.com/.netlify/images?url=<source>&w=1200&h=630&...
 *
 * The Image CDN will only fetch `<source>` from a host listed in
 * `netlify.toml` under `[images].remote_images`. For anything else it answers
 * **400** — it does not fall back to the original. So the meta tag is present,
 * well-formed and points at an error, and the share card renders with no
 * image at all. Strictly worse than the generic platform artwork, and
 * completely invisible from our side: nothing throws, nothing is logged, and
 * the page itself looks fine because the on-page `<img>` loads the source
 * directly.
 *
 * `src/lib/seo/utils.ts` therefore keeps its own copy of the list and degrades
 * an unrecognised host to the site default BEFORE building the transform. Two
 * copies of one list is the arrangement that always rots — someone adds a
 * CloudFront distribution or a second bucket to `netlify.toml`, the SEO helper
 * still rejects it, and every share card for that host silently loses its
 * image. This check is what makes that a failed build instead of a bug report
 * three weeks later.
 *
 * ── What it compares ─────────────────────────────────────────────────────
 *
 * The HOST portion of each `remote_images` pattern against the host regexes in
 * `ALLOWED_IMAGE_HOSTS`. Path constraints are deliberately out of scope: the
 * runtime helper enforces the path-style bucket segment itself, and a check
 * that tried to prove two regex dialects equivalent would be the kind of thing
 * people disable rather than fix.
 *
 * Usage:
 *   node scripts/check-og-image-hosts.mjs          # audit, exit 1 on drift
 *   node scripts/check-og-image-hosts.mjs --list   # print both lists
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const NETLIFY_TOML = path.join(ROOT, 'netlify.toml');
const SEO_UTILS = path.join(ROOT, 'src', 'lib', 'seo', 'utils.ts');
const LIST_ONLY = process.argv.includes('--list');

function read(file) {
	if (!fs.existsSync(file)) {
		console.error(`✗ Expected ${path.relative(ROOT, file)} to exist.`);
		process.exit(1);
	}
	return fs.readFileSync(file, 'utf8');
}

/**
 * Reduce a host pattern to a comparable form.
 *
 * The two files write the same host in two dialects — TOML literal strings
 * escape the dots, the TypeScript regexes anchor and flag them — so both are
 * normalised to bare lowercase text before comparing.
 */
function normalizeHost(pattern) {
	return pattern
		.replace(/^\^/, '')
		.replace(/\$$/, '')
		.replace(/\\\./g, '.')
		.trim()
		.toLowerCase();
}

/** Host patterns from `[images].remote_images` in netlify.toml. */
function hostsFromNetlifyToml(source) {
	// The closing bracket must be the one on its own line. A non-greedy `\]`
	// stops at the FIRST bracket instead, which lands inside the `[a-z0-9-]`
	// character class of the CloudFront pattern and silently drops every entry
	// after it.
	const block = /remote_images\s*=\s*\[([\s\S]*?)\n\s*\]/.exec(source);
	if (!block) {
		console.error('✗ Could not find [images].remote_images in netlify.toml.');
		process.exit(1);
	}
	const hosts = [];
	// TOML literal strings (single-quoted) so backslashes survive verbatim.
	for (const m of block[1].matchAll(/'([^']+)'/g)) {
		const pattern = m[1];
		const withoutScheme = pattern.replace(/^https?:\\?\/\\?\//, '');
		// Everything up to the first unescaped path separator is the host.
		const host = withoutScheme.split(/(?<!\\)\//)[0];
		if (host) hosts.push(normalizeHost(host));
	}
	return hosts;
}

/** Host regexes from `ALLOWED_IMAGE_HOSTS` in src/lib/seo/utils.ts. */
function hostsFromSeoUtils(source) {
	const block = /const ALLOWED_IMAGE_HOSTS[^=]*=\s*\[([\s\S]*?)\n\];/.exec(source);
	if (!block) {
		console.error('✗ Could not find ALLOWED_IMAGE_HOSTS in src/lib/seo/utils.ts.');
		process.exit(1);
	}
	const hosts = [];
	for (const m of block[1].matchAll(/\/(.+?)\/[gimsuy]*\s*,?\s*$/gm)) {
		hosts.push(normalizeHost(m[1]));
	}
	return hosts;
}

const netlifyHosts = hostsFromNetlifyToml(read(NETLIFY_TOML));
const seoHosts = hostsFromSeoUtils(read(SEO_UTILS));

if (LIST_ONLY) {
	console.log('netlify.toml  [images].remote_images:');
	for (const h of netlifyHosts) console.log(`  · ${h}`);
	console.log('\nsrc/lib/seo/utils.ts  ALLOWED_IMAGE_HOSTS:');
	for (const h of seoHosts) console.log(`  · ${h}`);
	process.exit(0);
}

if (netlifyHosts.length === 0 || seoHosts.length === 0) {
	console.error('✗ One of the allow-lists parsed as empty. Refusing to pass.');
	process.exit(1);
}

const missingInSeo = netlifyHosts.filter((h) => !seoHosts.includes(h));
const missingInNetlify = seoHosts.filter((h) => !netlifyHosts.includes(h));

if (missingInSeo.length === 0 && missingInNetlify.length === 0) {
	console.log(`✓ Share-image hosts agree (${netlifyHosts.length} host pattern(s)).`);
	process.exit(0);
}

console.error('✗ Share-image host allow-lists have drifted.\n');

if (missingInSeo.length) {
	console.error('  In netlify.toml but NOT in ALLOWED_IMAGE_HOSTS (src/lib/seo/utils.ts):');
	for (const h of missingInSeo) console.error(`    · ${h}`);
	console.error(
		'\n  Effect: the Image CDN would serve these, but the SEO helper replaces them\n' +
			'  with the default artwork — so real cover images never reach a share card.\n',
	);
}

if (missingInNetlify.length) {
	console.error('  In ALLOWED_IMAGE_HOSTS but NOT in netlify.toml [images].remote_images:');
	for (const h of missingInNetlify) console.error(`    · ${h}`);
	console.error(
		'\n  Effect: the SEO helper builds a transform URL for these, the Image CDN\n' +
			'  answers 400, and the share card renders with NO image at all.\n',
	);
}

process.exit(1);
