/**
 * deck-slides - assembles slides/*.{html,md} into Reveal's <div class="slides">
 * at the `<!-- @slides -->` marker in index.html.
 *
 * - Runs via transformIndexHtml (order: 'pre'), so it fires identically for
 *   `npm start`, `vite build`, and `build:deck`.
 * - Slide files are read with fs, never imported - they stay out of the module
 *   graph. The dev watcher triggers a full reload on add/change/unlink; the reload
 *   re-runs transformIndexHtml. Reveal restores position from `hash: true`.
 *
 * Conventions (see slides/README.md):
 *   NN[.M]-<slug>.<html|md>   NN = zero-padded major, .M = vertical-stack minor
 *   one file  = one horizontal slide position
 *   shared NN = one vertical <section> stack, files ordered by .M
 *   .html body = exactly one <section>...</section> (may nest <section>s)
 *   .md body   = raw Markdown (wrapped here as an inline text/template)
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'slides';
const MARKER = '<!-- @slides -->';
const SLIDE_RE = /\.(html|md)$/i;
const VSEP = '\\r?\\n--\\r?\\n'; // "--" fence => vertical sub-slide within one .md file
const NSEP = '^Note:';

const natSort = (a, b) => a.localeCompare(b, undefined, { numeric: true });

// "03.1-architecture.html" -> { major: 3, minor: 1, slug: "architecture", ext: "html" }
function parse(file) {
	const m = /^(\d+)(?:\.(\d+))?[-_.]?(.*?)\.(html|md)$/i.exec(file);
	if (!m) {
		return {
			major: Infinity,
			minor: null,
			slug: file.replace(SLIDE_RE, '').toLowerCase(),
			ext: file.split('.').pop().toLowerCase(),
		};
	}
	return {
		major: Number(m[1]),
		minor: m[2] != null ? Number(m[2]) : null,
		slug: (m[3] || `slide-${m[1]}`).toLowerCase(),
		ext: m[4].toLowerCase(),
	};
}

function renderMd(raw, slug) {
	const safe = raw.replace(/<\/script>/gi, '<\\/script>');
	return (
		`<section data-markdown id="${slug}" data-slug="${slug}" ` +
		`data-separator-vertical="${VSEP}" data-separator-notes="${NSEP}">` +
		`<script type="text/template">\n${safe}\n</script></section>`
	);
}

function injectAttrs(html, slug) {
	const openTag = html.slice(0, html.indexOf('>') + 1);
	if (/\bdata-slug=/.test(openTag) || /\bid=/.test(openTag)) return html; // author set one
	return html.replace(/<section(\s|>)/i, `<section id="${slug}" data-slug="${slug}"$1`);
}

function assemble(root) {
	const dir = path.join(root, DIR);
	if (!fs.existsSync(dir)) return '';

	const files = fs
		.readdirSync(dir)
		.filter((f) => SLIDE_RE.test(f) && f.toLowerCase() !== 'readme.md')
		.sort(natSort);

	const groups = new Map();
	for (const f of files) {
		const meta = parse(f);
		if (!groups.has(meta.major)) groups.set(meta.major, []);
		groups.get(meta.major).push({ f, meta });
	}

	const out = [];
	for (const [, items] of [...groups.entries()].sort((a, b) => a[0] - b[0])) {
		const sections = items.map(({ f, meta }) => {
			const raw = fs.readFileSync(path.join(dir, f), 'utf8');
			return meta.ext === 'md'
				? renderMd(raw, meta.slug)
				: injectAttrs(raw.trim(), meta.slug);
		});
		out.push(
			sections.length > 1
				? `<section class="stack">\n${sections.join('\n')}\n</section>`
				: sections[0]
		);
	}
	return out.join('\n');
}

export default function slidesPlugin() {
	let root = process.cwd();
	return {
		name: 'deck-slides',
		enforce: 'pre',
		configResolved(cfg) {
			root = cfg.root;
		},
		transformIndexHtml: {
			order: 'pre',
			handler(html) {
				if (!html.includes(MARKER)) {
					this?.warn?.(`[deck-slides] "${MARKER}" not found in index.html - no slides injected`);
					return html;
				}
				return html.replace(MARKER, () => assemble(root));
			},
		},
		configureServer(server) {
			const dir = path.join(root, DIR);
			server.watcher.add(dir);
			const reload = (file) => {
				if (file.startsWith(dir) && SLIDE_RE.test(file)) {
					server.ws.send({ type: 'full-reload' });
				}
			};
			server.watcher.on('add', reload).on('unlink', reload).on('change', reload);
		},
	};
}
