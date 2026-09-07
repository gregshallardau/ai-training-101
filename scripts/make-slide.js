#!/usr/bin/env node
// Mechanical slide scaffolder - does the error-prone-by-hand parts of
// slide-builder's "Procedure - new / structural" (gap-based position
// resolution, the rebalance-if-exhausted fallback, the file template) so an
// agent doesn't re-derive that arithmetic from prose every time. It does NOT
// write slide prose/content - see docs/cheatsheet.md for the body shapes and
// slide-builder's SKILL.md for what goes in the stub.
//
// Numbering follows slides/README.md: >=3-digit majors, step 10, gap-based -
// most inserts land in the existing gap between neighbours and touch no
// other file; only an exhausted gap (neighbours are consecutive integers)
// triggers a whole-deck rebalance back to round step-10 numbers.
//
// Usage:
//   node scripts/make-slide.js --title "Text" --after <slug> [--format md|html] [--slug <slug>]
//   node scripts/make-slide.js --title "Text" --before <slug>
//   node scripts/make-slide.js --title "Text" --position <N>   (N must be a free major)
//   node scripts/make-slide.js --title "Text" --vertical-of <N>
//   node scripts/make-slide.js --title "Text" --end
// Add --dry-run to print the plan (rebalance + new file) without touching disk.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	SLIDE_RE,
	natSort,
	parseSlideFilename,
	formatSlideFilename,
	kebabCase,
	pickGapMajor,
	rebalanceMajors,
} from './lib/slide-files.js';

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

let slides = listSlides();
const slug = args.slug ? kebabCase(args.slug) : kebabCase(args.title);
if (!slug) fail('could not derive a slug - pass --slug explicitly');
if (slides.some((s) => s.slug === slug)) fail(`slug "${slug}" is already used by slides/${slides.find((s) => s.slug === slug).file}`);

function findBySlug(s) {
	const found = slides.find((x) => x.slug === s);
	if (!found) fail(`no slide with slug "${s}" found in slides/`);
	return found;
}

function majorsSorted() {
	return [...new Set(slides.map((s) => s.major))].sort((a, b) => a - b);
}

function neighbours(major) {
	const majors = majorsSorted();
	const idx = majors.indexOf(major);
	return { lower: majors[idx - 1] ?? null, upper: majors[idx + 1] ?? null };
}

const pendingRenames = []; // applied first, bottom-up: either a vertical promotion or a full rebalance
let rebalanced = false; // true only when the gap was actually exhausted (deck-wide rename)
let targetMajor;
let targetMinor = null;

if (args.end) {
	const majors = majorsSorted();
	targetMajor = pickGapMajor(majors.length ? majors[majors.length - 1] : null, null);
} else if (args.position != null) {
	targetMajor = Number(args.position);
	if (!Number.isInteger(targetMajor) || targetMajor < 0) fail('--position must be a non-negative integer');
	if (slides.some((s) => s.major === targetMajor)) {
		fail(`major ${targetMajor} is already used - pick a free number (see slides/README.md's gap rule), or use --after/--before to have it computed`);
	}
} else if (args.verticalOf != null) {
	const major = Number(args.verticalOf);
	if (!Number.isInteger(major) || major < 0) fail('--vertical-of must be a non-negative integer');
	const siblings = slides.filter((s) => s.major === major);
	if (!siblings.length) fail(`--vertical-of ${major}: no slide with major ${major} exists yet`);
	const bareMajor = siblings.find((s) => s.minor == null);
	if (bareMajor) {
		pendingRenames.push({ from: bareMajor.file, to: formatSlideFilename({ ...bareMajor, minor: 1 }) });
	}
	const usedMinors = siblings.filter((s) => s.minor != null).map((s) => s.minor);
	targetMajor = major;
	targetMinor = usedMinors.length ? Math.max(...usedMinors) + 1 : 2;
} else {
	// --after / --before: resolve to the anchor's major, then find the gap
	const anchor = args.after != null ? findBySlug(args.after) : findBySlug(args.before);
	let { lower, upper } = neighbours(anchor.major);
	if (args.after != null) {
		lower = anchor.major;
	} else {
		upper = anchor.major;
	}
	let gap = pickGapMajor(lower, upper);
	if (gap == null) {
		// exhausted - rebalance the whole deck, then re-resolve the same anchor relationship
		rebalanced = true;
		const { renames } = rebalanceMajors(slides);
		pendingRenames.push(...renames);
		const renameMap = new Map(renames.map((r) => [r.from, r.to]));
		slides = slides.map((s) => {
			const to = renameMap.get(s.file);
			if (!to) return s;
			return { ...s, ...parseSlideFilename(to), file: to };
		});
		const freshAnchor = findBySlug(args.after != null ? args.after : args.before);
		const n2 = neighbours(freshAnchor.major);
		gap = args.after != null
			? pickGapMajor(freshAnchor.major, n2.upper)
			: pickGapMajor(n2.lower, freshAnchor.major);
	}
	targetMajor = gap;
}

const newFile = formatSlideFilename({ major: targetMajor, minor: targetMinor, slug, ext: args.format });

const body =
	args.format === 'md'
		? `## ${args.title}\n\n- TODO: content\n`
		: `<section id="${slug}" data-slug="${slug}">\n\t<h2>${args.title}</h2>\n\t<!-- TODO: content -->\n</section>\n`;

console.log(args.dryRun ? '(dry run - no files touched)' : 'Applying:');
if (rebalanced) {
	console.log(`  [gap exhausted - rebalancing ${pendingRenames.length} file(s) to round step-10 numbers first]`);
} else if (pendingRenames.length) {
	console.log(`  [promoting the bare major to .1 so it can take a vertical sibling]`);
}
for (const { from, to } of pendingRenames) console.log(`  git mv slides/${from} slides/${to}`);
console.log(`  write slides/${newFile}`);

if (args.dryRun) process.exit(0);

for (const { from, to } of pendingRenames) movePath(from, to);
mkdirSync(SLIDES_DIR, { recursive: true });
writeFileSync(resolve(SLIDES_DIR, newFile), body, 'utf8');

console.log(`\n✓ created slides/${newFile}`);
if (rebalanced) console.log(`✓ rebalanced ${pendingRenames.length} file(s)`);
else if (pendingRenames.length) console.log(`✓ renamed ${pendingRenames.length} file(s)`);
console.log(`\nNext: write the slide's real content (this is a TODO stub), and if an overview/menu slide exists, add a link to #/${slug}.`);
