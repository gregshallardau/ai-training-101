// Executable version of slide-builder's "Portability lint" class/tag/var rules
// (.claude/skills/slide-builder/SKILL.md). Catches exactly the failure mode
// found in the real deck ai-training-101-v2: a `.title-slide` class was
// referenced in a slide but never defined anywhere, so it silently did
// nothing - nothing caught it because the check only ever existed as prose
// an agent reasoned about, never ran.
//
// The allowlist of "real" classes is auto-extracted from deck.css itself
// (plus a small static list of Reveal-native fragment/layout classes), so
// it can't go stale as deck.css grows. Registered <deck-*> tags are read from
// the repo-root components/ folder listing - that IS the manifest under the
// auto-discovery model (src/components/registry.js just globs it at build
// time; there is no separate list to parse). A slide's own scoped <style>
// block (the "fully inlined artefact" shape) may define additional classes
// local to that one file - those are allowed only in the file that defines
// them.

import { readFile, readdir } from 'fs/promises';
import { dirname, resolve, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const DECK_CSS = resolve(root, 'deck.css');
const PRIMITIVES_CSS = resolve(root, 'src/styles/vars/primitives.css');
const COMPONENTS_DIR = resolve(root, 'components');
const SLIDES_DIR = resolve(root, 'slides');

// Reveal-native classes: not defined in deck.css, not invented by a slide author.
const REVEAL_NATIVE_CLASSES = new Set([
	'fragment', 'visible', 'current-fragment',
	'fade-in-then-out', 'fade-in-then-semi-out', 'fade-up', 'fade-down',
	'fade-left', 'fade-right', 'fade-out', 'semi-fade-out',
	'grow', 'shrink', 'strike', 'zoom-in',
	'highlight-red', 'highlight-green', 'highlight-blue',
	'highlight-current-red', 'highlight-current-green', 'highlight-current-blue',
	'current-visible',
	'stack',
	'r-fit-text', 'r-stretch', 'r-stack', 'r-hstack', 'r-vstack',
]);

function extractClassSelectors(cssText) {
	const classes = new Set();
	const re = /\.([a-zA-Z][\w-]*)/g;
	let match;
	while ((match = re.exec(cssText))) classes.add(match[1]);
	return classes;
}

function extractDeclaredCustomProperties(cssText) {
	const names = new Set();
	const re = /(--[a-zA-Z][\w-]*)\s*:/g;
	let match;
	while ((match = re.exec(cssText))) names.add(match[1]);
	return names;
}

async function listRegisteredComponentNames() {
	try {
		const entries = await readdir(COMPONENTS_DIR, { withFileTypes: true });
		return new Set(entries.filter((e) => e.isDirectory()).map((e) => e.name));
	} catch {
		return new Set(); // components/ doesn't exist yet - nothing registered
	}
}

function lineOf(text, index) {
	return text.slice(0, index).split('\n').length;
}

const [deckCss, primitivesCss, registeredComponentNames] = await Promise.all([
	readFile(DECK_CSS, 'utf8'),
	readFile(PRIMITIVES_CSS, 'utf8'),
	listRegisteredComponentNames(),
]);

const frameworkClasses = new Set([...extractClassSelectors(deckCss), ...REVEAL_NATIVE_CLASSES]);
const tier1Names = extractDeclaredCustomProperties(primitivesCss);

const slideFiles = (await readdir(SLIDES_DIR))
	.filter((name) => ['.html', '.md'].includes(extname(name)))
	.sort();

let issues = [];

for (const name of slideFiles) {
	const path = resolve(SLIDES_DIR, name);
	const fileText = await readFile(path, 'utf8');
	// HTML comments (illustrative/commented-out markup) aren't live content -
	// blank them out (preserving offsets, so reported line numbers stay accurate).
	const text = fileText.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));

	// classes defined in this slide's own scoped <style> block (shape 3:
	// fully inlined artefact) are locally allowed, in this file only.
	const localClasses = new Set();
	for (const styleMatch of text.matchAll(/<style>([\s\S]*?)<\/style>/g)) {
		for (const c of extractClassSelectors(styleMatch[1])) localClasses.add(c);
	}

	for (const classMatch of text.matchAll(/\bclass=["']([^"']*)["']/g)) {
		for (const token of classMatch[1].split(/\s+/).filter(Boolean)) {
			if (!frameworkClasses.has(token) && !localClasses.has(token)) {
				issues.push(`${name}:${lineOf(text, classMatch.index)} — unknown class "${token}" (not in deck.css, Reveal's built-ins, or this file's own scoped <style>)`);
			}
		}
	}

	for (const tagMatch of text.matchAll(/<(deck-[\w-]+)[\s>]/g)) {
		const componentName = tagMatch[1].replace(/^deck-/, '');
		if (!registeredComponentNames.has(componentName)) {
			issues.push(`${name}:${lineOf(text, tagMatch.index)} — <${tagMatch[1]}> has no matching components/${componentName}/ folder`);
		}
	}

	for (const varMatch of text.matchAll(/var\((--[a-zA-Z][\w-]*)/g)) {
		if (tier1Names.has(varMatch[1])) {
			issues.push(`${name}:${lineOf(text, varMatch.index)} — var(${varMatch[1]}) is a tier-1 primitive; use the tier-2 semantic property instead`);
		}
	}
}

if (issues.length) {
	console.error(issues.map((line) => `✗ ${line}`).join('\n'));
	process.exit(1);
}

console.log(`✓ ${slideFiles.length} slide file${slideFiles.length === 1 ? '' : 's'} clean (${frameworkClasses.size} known classes, ${registeredComponentNames.size} registered <deck-*> component${registeredComponentNames.size === 1 ? '' : 's'})`);
