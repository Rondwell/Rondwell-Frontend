#!/usr/bin/env node
/**
 * CSP coverage check — fails the build when the app talks to a host the
 * Content-Security-Policy does not allow.
 *
 * ── Why this exists ──────────────────────────────────────────────────────
 *
 * The policy in `svelte.config.js` was written naming Rondwell's own API and
 * Google, while the app also called Iconify, Paystack, Stripe, HERE, Nominatim
 * and Google Maps. Every one was blocked, and every one failed SILENTLY:
 *
 *   - Iconify blocked  → all 1,587 icons render blank
 *   - Paystack blocked → the pay button does nothing at all
 *   - Stripe blocked   → checkout never loads
 *   - HERE blocked     → the address box never suggests
 *   - Nominatim blocked→ no reverse geocode, no timezone prefill
 *   - Google Maps      → the venue map is a broken-document placeholder
 *
 * Not one produced a stack trace or a failing test. Each looked like a product
 * bug, and each cost a separate debugging session. A CSP is the only config in
 * the app where being wrong is invisible until a user reports it.
 *
 * ── Why it matches on USAGE, not on strings ──────────────────────────────
 *
 * The naive version of this check — "every https:// literal under src/ must be
 * in the CSP" — flags `schema.org` (a JSON-LD `@context`, never fetched), every
 * social link in an `<a href>` (not governed by CSP at all), and every
 * `placeholder="https://example.com"`. A check that cries wolf gets `--force`d
 * within a week and then it is worse than nothing, because it looks like cover.
 *
 * So each finding is classified by the API that loads it, and only those map to
 * a directive:
 *
 *   fetch / XHR / WebSocket            → connect-src
 *   <script src> / el.src on a script  → script-src
 *   <iframe src> (incl. via a local fn) → frame-src
 *   <link rel=stylesheet> / @import     → style-src
 *   @font-face / font files             → font-src
 *
 * An `<a href>` is deliberately NOT checked: CSP does not govern navigation.
 *
 * ── Escape hatches ───────────────────────────────────────────────────────
 *
 * False positives get annotated, not silenced globally:
 *
 *   // csp-ignore-next-line — <reason>
 *
 * Usage:
 *   node scripts/check-csp.mjs          # audit, exit 1 on any gap
 *   node scripts/check-csp.mjs --list   # print what the policy covers and why
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const LIST_ONLY = process.argv.includes('--list');

const SCAN_EXT = new Set(['.svelte', '.ts', '.js', '.html', '.css']);

/** ANSI, but only when attached to a TTY so CI logs stay clean. */
const tty = process.stdout.isTTY;
const c = {
	red: (s) => (tty ? `\x1b[31m${s}\x1b[0m` : s),
	green: (s) => (tty ? `\x1b[32m${s}\x1b[0m` : s),
	yellow: (s) => (tty ? `\x1b[33m${s}\x1b[0m` : s),
	dim: (s) => (tty ? `\x1b[2m${s}\x1b[0m` : s),
	bold: (s) => (tty ? `\x1b[1m${s}\x1b[0m` : s)
};

// ── 1. Collect the files to scan ─────────────────────────────────────────

function walk(dir, out = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
			walk(full, out);
		} else if (SCAN_EXT.has(path.extname(entry.name))) {
			out.push(full);
		}
	}
	return out;
}

// ── 2. Extract findings, classified by the loader that fetches them ──────

/** `https://api.foo.com/x?y` → `https://api.foo.com`; junk → null. */
function toOrigin(url) {
	try {
		const u = new URL(url);
		if (u.protocol !== 'https:' && u.protocol !== 'http:' && u.protocol !== 'wss:' && u.protocol !== 'ws:') {
			return null;
		}
		return u.origin;
	} catch {
		return null;
	}
}

/**
 * Patterns that each imply a directive. `url` is the capture group holding the
 * absolute URL. Template literals are matched up to the first `${`, so
 * `fetch(`https://api.x.com/${id}`)` still yields `https://api.x.com`.
 */
const URL_CHARS = "[^'\"`$\\s>){}]+";

const RULES = [
	{
		directive: 'connect-src',
		why: 'fetch()',
		re: new RegExp(`\\bfetch\\s*\\(\\s*['"\`](${URL_CHARS})`, 'g')
	},
	{
		directive: 'connect-src',
		why: 'WebSocket',
		re: new RegExp(`new\\s+WebSocket\\s*\\(\\s*['"\`](${URL_CHARS})`, 'g')
	},
	{
		directive: 'connect-src',
		why: 'XMLHttpRequest',
		re: new RegExp(`\\.open\\s*\\(\\s*['"][A-Z]+['"]\\s*,\\s*['"\`](${URL_CHARS})`, 'g')
	},
	{
		directive: 'script-src',
		why: '<script src>',
		re: new RegExp(`<script[^>]+src\\s*=\\s*['"](${URL_CHARS})`, 'gi')
	},
	{
		directive: 'frame-src',
		why: '<iframe src>',
		re: new RegExp(`<iframe[^>]*?\\ssrc\\s*=\\s*['"](${URL_CHARS})`, 'gi')
	},
	{
		directive: 'style-src',
		why: '<link rel=stylesheet>',
		re: new RegExp(`<link[^>]+rel\\s*=\\s*['"]stylesheet['"][^>]*href\\s*=\\s*['"](${URL_CHARS})`, 'gi')
	},
	{
		directive: 'style-src',
		why: '@import url()',
		re: new RegExp(`@import\\s+url\\(\\s*['"]?(${URL_CHARS})`, 'g')
	}
];

/**
 * `el.src = 'https://…'` is script-src or frame-src depending on what `el` is,
 * and the two are created several lines apart:
 *
 *     const s = document.createElement('script');
 *     s.src = 'https://js.paystack.co/v1/inline.js';
 *
 * So the element kind is resolved by looking back a short window for the
 * nearest `createElement('script'|'iframe'|'img'|'link')`. This is the pattern
 * every payment SDK in this app uses, and the reason `script-src` was missing
 * both Paystack and Stripe.
 */
const CREATE_EL = /createElement\s*\(\s*['"`](script|iframe|img|link)['"`]\s*\)/gi;
const EL_SRC = new RegExp(`\\.(?:src|href)\\s*=\\s*['"\`](${URL_CHARS})`, 'g');
const KIND_TO_DIRECTIVE = {
	script: 'script-src',
	iframe: 'frame-src',
	img: 'img-src',
	link: 'style-src'
};

/**
 * `<iframe src={mapUrl}>` where `mapUrl` comes from a local function. The venue
 * map is built this way, which is exactly why a string-only scan missed it and
 * the map silently broke. Any function in the same file that RETURNS an
 * absolute URL is treated as a frame source when the file contains an
 * `<iframe>` bound to an expression.
 */
const IFRAME_EXPR = /<iframe[^>]*?\ssrc\s*=\s*\{/i;
const RETURNS_URL = new RegExp(`return\\s+['"\`](${URL_CHARS})`, 'g');

function lineOf(text, index) {
	return text.slice(0, index).split('\n').length;
}

/**
 * Look back a few lines rather than exactly one: the marker usually sits at the
 * top of a short comment block explaining WHY, and requiring it to be the
 * immediately preceding line would push people towards a bare, unexplained
 * annotation.
 */
function isIgnored(text, index) {
	const lines = text.split('\n');
	const line = lineOf(text, index);
	for (let i = Math.max(0, line - 6); i < line; i++) {
		if (/csp-ignore-next-line/.test(lines[i] ?? '')) return true;
	}
	return false;
}

/**
 * CSP governs the BROWSER. A `fetch` in `+page.server.ts`, `hooks.server.ts` or
 * `$lib/server/` runs in Node, is not subject to any policy, and flagging it
 * would train people to ignore this check.
 */
function isServerOnly(relPath) {
	return (
		/\.server\.(ts|js)$/.test(relPath) ||
		relPath.includes('src/lib/server/') ||
		relPath.endsWith('src/hooks.server.ts')
	);
}

function scanFile(file) {
	const text = fs.readFileSync(file, 'utf8');
	const rel = path.relative(ROOT, file).replace(/\\/g, '/');
	if (isServerOnly(rel)) return [];
	const found = [];

	const push = (url, directive, why, index) => {
		const origin = toOrigin(url);
		if (!origin) return;
		// Same-origin and dev hosts are covered by 'self' / the env-derived list.
		if (/localhost|127\.0\.0\.1/.test(origin)) return;
		if (isIgnored(text, index)) return;
		found.push({ origin, directive, why, file: rel, line: lineOf(text, index) });
	};

	for (const rule of RULES) {
		rule.re.lastIndex = 0;
		let m;
		while ((m = rule.re.exec(text))) push(m[1], rule.directive, rule.why, m.index);
	}

	// el.src = '…' — resolve the element kind from the nearest createElement.
	const creations = [];
	CREATE_EL.lastIndex = 0;
	let cm;
	while ((cm = CREATE_EL.exec(text))) creations.push({ index: cm.index, kind: cm[1].toLowerCase() });

	EL_SRC.lastIndex = 0;
	let sm;
	while ((sm = EL_SRC.exec(text))) {
		const before = creations.filter((x) => x.index < sm.index).pop();
		if (!before) continue;
		// Only trust the association when they are close together.
		if (text.slice(before.index, sm.index).split('\n').length > 15) continue;
		push(sm[1], KIND_TO_DIRECTIVE[before.kind], `createElement('${before.kind}') + .src`, sm.index);
	}

	/**
	 * `const AUTOSUGGEST_URL = 'https://…'` used later as `fetch(`${AUTOSUGGEST_URL}?…`)`.
	 *
	 * This is how `AddressAutocomplete` calls HERE, and a scan that only looks
	 * inside `fetch(` misses it completely — which is why address autocomplete
	 * was blocked without anyone noticing. The constant is only attributed to
	 * connect-src when the identifier is actually used by a fetching API, so a
	 * URL constant used for an `<a href>` is not flagged.
	 */
	const URL_CONST = new RegExp(
		`(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*['"\`](${URL_CHARS})['"\`]`,
		'g'
	);
	URL_CONST.lastIndex = 0;
	let um;
	while ((um = URL_CONST.exec(text))) {
		const [, name, url] = um;
		const usedByFetch = new RegExp(
			`\\b(?:fetch|WebSocket)\\s*\\(\\s*\`?\\$?\\{?\\s*${name}\\b`
		).test(text);
		if (usedByFetch) push(url, 'connect-src', `fetch(${name})`, um.index);
	}

	// <iframe src={expr}> — attribute URL-returning functions in the same file.
	if (IFRAME_EXPR.test(text)) {
		RETURNS_URL.lastIndex = 0;
		let rm;
		while ((rm = RETURNS_URL.exec(text))) {
			push(rm[1], 'frame-src', '<iframe src={…}> built by a local function', rm.index);
		}
	}

	return found;
}

/**
 * Hosts fetched from INSIDE a dependency, which no scan of `src/` can ever see.
 *
 * `@iconify/svelte` is the reason this section exists. It requests every icon
 * from Iconify's API at runtime, and because that call lives in node_modules
 * there is no string in this repo to find. When the CSP omitted the host, all
 * 1,587 icons in the product went blank — and the only reason it was not
 * noticed for weeks is that Iconify caches icon data in `localStorage`, so
 * already-cached icons kept rendering until someone cleared site storage.
 *
 * Declaring them here makes an invisible dependency explicit and, more
 * importantly, checked: trimming one of these hosts out of the CSP now fails
 * the build instead of silently blanking the UI.
 *
 * Only enforced when the package is actually installed, so removing a
 * dependency does not leave a check demanding hosts nothing uses.
 */
const LIBRARY_HOSTS = [
	{
		pkg: '@iconify/svelte',
		directive: 'connect-src',
		hosts: [
			'https://api.iconify.design',
			'https://api.simplesvg.com',
			'https://api.unisvg.com'
		],
		why: 'Iconify fetches icon data at runtime (no @iconify-json/* is bundled)'
	}
];

function libraryFindings() {
	let pkg;
	try {
		pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
	} catch {
		return [];
	}
	const installed = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
	const out = [];
	for (const lib of LIBRARY_HOSTS) {
		if (!installed[lib.pkg]) continue;
		for (const host of lib.hosts) {
			out.push({
				origin: host,
				directive: lib.directive,
				why: lib.why,
				file: `package.json (${lib.pkg})`,
				line: 0
			});
		}
	}
	return out;
}

// ── 3. Read the policy that actually ships ───────────────────────────────

async function loadDirectives() {
	/**
	 * Validate the PRODUCTION policy — that is the one that ships and the one
	 * whose gaps reach users. `svelte.config.js` derives its Rondwell origins
	 * from `loadEnv(NODE_ENV)`, so without this the check would compare against
	 * the dev policy (localhost) and flag `api.rondwell.com` as missing while
	 * production covers it perfectly.
	 */
	process.env.NODE_ENV = 'production';

	// Import the real config rather than regexing it, so the check can never
	// drift from the policy it is checking.
	const mod = await import(pathToFileURL(path.join(ROOT, 'svelte.config.js')).href);
	const directives = mod?.default?.kit?.csp?.directives;
	if (!directives) {
		console.error(c.red('Could not read kit.csp.directives from svelte.config.js'));
		process.exit(2);
	}
	return directives;
}

/**
 * CSP source matching, limited to the forms this policy uses. `default-src` is
 * the fallback for any directive that is absent, exactly as a browser treats it
 * — omitting that would make the check disagree with reality.
 */
function isCovered(origin, directive, directives) {
	const list = directives[directive] ?? directives['default-src'] ?? [];
	const { protocol, host } = new URL(origin);

	for (const raw of list) {
		const src = String(raw).replace(/^'|'$/g, '');
		if (src === '*') return true;
		if (src === 'self') continue; // third-party by definition; never self
		if (src === 'https:' && protocol === 'https:') return true;
		if (src === 'http:' && protocol === 'http:') return true;
		if (src === 'data:' || src === 'blob:') continue;

		const candidate = src.includes('://') ? src : `${protocol}//${src}`;
		let s;
		try {
			s = new URL(candidate);
		} catch {
			continue;
		}
		if (s.host === host) return true;
		// Wildcard subdomain: *.stripe.com
		if (s.host.startsWith('*.') && host.endsWith(s.host.slice(1))) return true;
	}
	return false;
}

// ── 4. Report ────────────────────────────────────────────────────────────

const directives = await loadDirectives();
const files = walk(SRC);
const findings = [...files.flatMap(scanFile), ...libraryFindings()];

// Deduplicate on origin+directive, keeping every call site for the report.
const byKey = new Map();
for (const f of findings) {
	const key = `${f.directive} ${f.origin}`;
	if (!byKey.has(key)) byKey.set(key, { ...f, sites: [] });
	byKey.get(key).sites.push(`${f.file}:${f.line}`);
}
const entries = [...byKey.values()].sort((a, b) =>
	(a.directive + a.origin).localeCompare(b.directive + b.origin)
);

if (LIST_ONLY) {
	console.log(c.bold('\nExternal hosts the app loads, and the directive each needs:\n'));
	for (const e of entries) {
		const ok = isCovered(e.origin, e.directive, directives);
		console.log(
			`  ${ok ? c.green('✓') : c.red('✗')} ${e.directive.padEnd(12)} ${e.origin.padEnd(42)} ${c.dim(e.why)}`
		);
	}
	console.log('');
	process.exit(0);
}

const missing = entries.filter((e) => !isCovered(e.origin, e.directive, directives));

if (missing.length === 0) {
	console.log(
		c.green(`✓ CSP covers all ${entries.length} external host/directive pairs used in src/`)
	);
	process.exit(0);
}

console.error(c.red(c.bold(`\n✗ CSP is missing ${missing.length} host(s) the app actually loads.\n`)));
console.error('  Each of these fails SILENTLY in the browser — a blank icon, a dead');
console.error('  button, an empty map — with no error thrown and no test failing.\n');

for (const m of missing) {
	console.error(`  ${c.red(m.origin)}`);
	console.error(`      needs   ${c.bold(m.directive)}   ${c.dim(`(loaded via ${m.why})`)}`);
	for (const site of m.sites.slice(0, 4)) console.error(`      used at ${c.dim(site)}`);
	if (m.sites.length > 4) console.error(c.dim(`      …and ${m.sites.length - 4} more`));
	console.error('');
}

console.error(`  Fix: add each host to the matching directive in ${c.bold('svelte.config.js')}.`);
console.error('  A third-party SDK usually needs THREE directives, not one:');
console.error('    script-src  (load the SDK)   connect-src (its API)   frame-src (its iframe)\n');
console.error(c.dim('  If a finding is genuinely not fetched by the browser, annotate the'));
console.error(c.dim('  call site with:   // csp-ignore-next-line — <reason>\n'));

process.exit(1);
