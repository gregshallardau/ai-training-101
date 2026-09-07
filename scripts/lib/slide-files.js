// Shared slide-filename parsing, used by both build/vite-plugin-slides.js (the
// runtime assembler) and scripts/make-slide.js (the scaffolder) so the
// NN[.M]-<slug>.<ext> convention is defined in exactly one place - two parsers
// drifting apart would silently misnumber or misassemble slides.
//
// See slides/README.md for the convention itself.

export const SLIDE_RE = /\.(html|md)$/i;

export const natSort = (a, b) => a.localeCompare(b, undefined, { numeric: true });

// "03.1-architecture.html" -> { major: 3, minor: 1, slug: "architecture", ext: "html" }
export function parseSlideFilename(file) {
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

// zero-pad to at least 2 digits, per slides/README.md ("NN = zero-padded major (>= 2 digits)")
export function padMajor(n) {
	return String(n).padStart(2, '0');
}

// "<major>[.<minor>]-<slug>.<ext>"
export function formatSlideFilename({ major, minor, slug, ext }) {
	const majorPart = padMajor(major);
	const minorPart = minor != null ? `.${minor}` : '';
	return `${majorPart}${minorPart}-${slug}.${ext}`;
}

export function kebabCase(text) {
	return text
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}
