// Keeps deck.css (light-DOM, slide-level utilities) and
// src/components/shared-styles.js's SHARED_STYLES (the shadow-DOM copy every
// <deck-*> component imports into `static styles`) from silently drifting
// apart. Each shared block is wrapped in matching
// `/* SHARED-VOCAB:start <name> */` / `/* SHARED-VOCAB:end */` sentinels in
// both files. This script extracts every named region, strips documentation
// comments and deck.css's light-DOM selector prefix, and diffs what's left.
// A region present in only one file (e.g. .token-row, which has no deck.css
// counterpart) is not compared - only names that exist in both.
//
// On drift: fix shared-styles.js to match deck.css, never the reverse -
// deck.css is the source of truth a deck author actually edits.
//
// .claude/skills/artefact-builder/reference/component-styles.md is pure human
// documentation of shared-styles.js (components import the real file, never
// copy from the doc) - not checked here, since it holds no CSS of its own.

import { readFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const DECK_CSS = resolve(root, 'deck.css');
const SHARED_STYLES_JS = resolve(root, 'src/components/shared-styles.js');
const LIGHT_DOM_PREFIX = '.reveal .slides section ';

function extractRegions(text) {
	const regions = new Map();
	const re = /\/\*\s*SHARED-VOCAB:start\s+(\S+)\s*\*\/([\s\S]*?)\/\*\s*SHARED-VOCAB:end\s*\*\//g;
	let match;
	while ((match = re.exec(text))) {
		const [, name, body] = match;
		if (regions.has(name)) {
			throw new Error(`duplicate SHARED-VOCAB region "${name}"`);
		}
		regions.set(name, body);
	}
	return regions;
}

function normalize(body) {
	return body
		.replace(/\/\*[\s\S]*?\*\//g, ' ')            // strip comments (docs are allowed to differ)
		.split(LIGHT_DOM_PREFIX).join('')             // deck.css's only mechanical difference
		.replace(/\s+/g, ' ')
		.trim();
}

const [deckCss, sharedStylesJs] = await Promise.all([
	readFile(DECK_CSS, 'utf8'),
	readFile(SHARED_STYLES_JS, 'utf8'),
]);

const deckRegions = extractRegions(deckCss);
const sharedRegions = extractRegions(sharedStylesJs);

const sharedNames = [...deckRegions.keys()].filter((name) => sharedRegions.has(name));

let failed = false;
for (const name of sharedNames) {
	const deckNormalized = normalize(deckRegions.get(name));
	const sharedNormalized = normalize(sharedRegions.get(name));
	if (deckNormalized !== sharedNormalized) {
		failed = true;
		console.error(`✗ "${name}" has drifted between deck.css and src/components/shared-styles.js\n`);
		console.error(`  deck.css:\n    ${deckNormalized}\n`);
		console.error(`  shared-styles.js:\n    ${sharedNormalized}\n`);
		console.error(`  Fix shared-styles.js to match deck.css, never the reverse.\n`);
	}
}

if (failed) {
	process.exit(1);
}

console.log(`✓ shared vocabulary in sync (${sharedNames.length} region${sharedNames.length === 1 ? '' : 's'}: ${sharedNames.join(', ')})`);
