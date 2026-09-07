#!/usr/bin/env node
// Mechanical slide scaffolder - does the error-prone-by-hand parts of
// slide-builder's "Procedure - new / structural" (position resolution,
// zero-padded renumbering, the rename list, the file template) so an agent
// doesn't re-derive that arithmetic from prose every time. It does NOT write
// slide prose/content - see docs/cheatsheet.md for the body shapes and
// slide-builder's SKILL.md for what goes in the stub.
//
// Usage:
//   node scripts/make-slide.js --title "Text" --after <slug> [--format md|html] [--slug <slug>]
//   node scripts/make-slide.js --title "Text" --before <slug>
//   node scripts/make-slide.js --title "Text" --position <N>
//   node scripts/make-slide.js --title "Text" --vertical-of <N>
//   node scripts/make-slide.js --title "Text" --end
// Add --dry-run to print the plan (renames + new file) without touching disk.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SLIDE_RE, natSort, parseSlideFilename, padMajor, formatSlideFilename, kebabCase } from './lib/slide-files.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SLIDES_DIR = resolve(root, 'slides');

function parseArgs(argv) {
	const args = { format: 'md' };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--dry-run') { args.dryRun = true; continue; }
		if (a === '--end') { args.end = true; continue; }
		if (!a.startsWith('--')) continue;
		const key = a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
		args[key] = argv[++i];
	}
	return args;
}

function fail(message) {
	console.error(`✗ ${message}`);
	process.exit(1);
}

function listSlides() {
	if (!existsSync(SLIDES_DIR)) fail(`${SLIDES_DIR} does not exist`);
	return readdirSync(SLIDES_DIR)
		.filter((f) => SLIDE_RE.test(f) && f.toLowerCase() !== 'readme.md')
		.sort(natSort)
		.map((f) => ({ file: f, ...parseSlideFilename(f) }));
}

function isGitTracked(path) {
	try {
		execFileSync('git', ['ls-files', '--error-unmatch', path], { cwd: root, stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

function movePath(fromRel, toRel) {
	const from = resolve(SLIDES_DIR, fromRel);
	const to = resolve(SLIDES_DIR, toRel);
	if (isGitTracked(`slides/${fromRel}`)) {
		execFileSync('git', ['mv', `slides/${fromRel}`, `slides/${toRel}`], { cwd: root });
	} else {
		renameSync(from, to);
	}
}

const args = parseArgs(process.argv.slice(2));

if (!args.title) fail('--title "..." is required');
const modeFlags = ['after', 'before', 'position', 'verticalOf'].filter((k) => args[k] != null).length + (args.end ? 1 : 0);
if (modeFlags !== 1) fail('pass exactly one of --after <slug> / --before <slug> / --position <N> / --vertical-of <N> / --end');
if (!['md', 'html'].includes(args.format)) fail('--format must be "md" or "html"');

const slides = listSlides();
const slug = args.slug ? kebabCase(args.slug) : kebabCase(args.title);
if (!slug) fail('could not derive a slug - pass --slug explicitly');
if (slides.some((s) => s.slug === slug)) fail(`slug "${slug}" is already used by slides/${slides.find((s) => s.slug === slug).file}`);

let targetMajor;
let targetMinor = null;
const renames = []; // { from, to } file basenames, apply bottom-up (desc by major)

function findBySlug(s) {
	const found = slides.find((x) => x.slug === s);
	if (!found) fail(`no slide with slug "${s}" found in slides/`);
	return found;
}

if (args.end) {
	targetMajor = slides.length ? Math.max(...slides.map((s) => s.major)) + 1 : 1;
} else if (args.position != null) {
	targetMajor = Number(args.position);
	if (!Number.isInteger(targetMajor) || targetMajor < 1) fail('--position must be a positive integer');
} else if (args.after != null) {
	targetMajor = findBySlug(args.after).major + 1;
} else if (args.before != null) {
	targetMajor = findBySlug(args.before).major;
} else if (args.verticalOf != null) {
	const major = Number(args.verticalOf);
	if (!Number.isInteger(major) || major < 1) fail('--vertical-of must be a positive integer');
	const siblings = slides.filter((s) => s.major === major);
	if (!siblings.length) fail(`--vertical-of ${major}: no slide with major ${major} exists yet`);
	const bareMajor = siblings.find((s) => s.minor == null);
	if (bareMajor) {
		// promote the existing bare "NN-slug.ext" to "NN.1-slug.ext" first
		renames.push({ from: bareMajor.file, to: formatSlideFilename({ ...bareMajor, minor: 1 }) });
	}
	const usedMinors = siblings.filter((s) => s.minor != null).map((s) => s.minor);
	targetMajor = major;
	targetMinor = usedMinors.length ? Math.max(...usedMinors) + 1 : 2;
}

// shift every slide whose major >= targetMajor up by one (skip when inserting
// a vertical sibling - that never renumbers other majors)
if (args.verticalOf == null) {
	const toShift = slides
		.filter((s) => s.major >= targetMajor)
		.sort((a, b) => b.major - a.major || (b.minor ?? -1) - (a.minor ?? -1)); // bottom-up
	for (const s of toShift) {
		renames.push({ from: s.file, to: formatSlideFilename({ ...s, major: s.major + 1 }) });
	}
}

const newFile = formatSlideFilename({ major: targetMajor, minor: targetMinor, slug, ext: args.format });

const body =
	args.format === 'md'
		? `## ${args.title}\n\n- TODO: content\n`
		: `<section id="${slug}" data-slug="${slug}">\n\t<h2>${args.title}</h2>\n\t<!-- TODO: content -->\n</section>\n`;

console.log(args.dryRun ? '(dry run - no files touched)' : 'Applying:');
for (const { from, to } of renames) console.log(`  git mv slides/${from} slides/${to}`);
console.log(`  write slides/${newFile}`);

if (args.dryRun) process.exit(0);

for (const { from, to } of renames) movePath(from, to);
mkdirSync(SLIDES_DIR, { recursive: true });
writeFileSync(resolve(SLIDES_DIR, newFile), body, 'utf8');

console.log(`\n✓ created slides/${newFile}`);
if (renames.length) console.log(`✓ renamed ${renames.length} file${renames.length === 1 ? '' : 's'}`);
console.log(`\nNext: write the slide's real content (this is a TODO stub), and if an overview/menu slide exists, add a link to #/${slug}.`);
