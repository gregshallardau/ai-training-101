import { d3 } from '@/lib/d3.js';

/**
 * Generated categorical scale for topic colours: an evenly-spaced hue wheel
 * anchored on --primary's HCL, keeping its chroma and lightness. A deliberate,
 * documented exception to "semantic vars only" (spec §7) — the only computed
 * colour in the component.
 *
 * @param {string[]} topicIds
 * @param {(cssVarName: string) => string} resolve
 * @returns {Map<string, {fill: string, stroke: string}>}
 */
export function topicColors(topicIds, resolve) {
	const base = d3.hcl(resolve('--primary') || '#2563eb');
	const c = Number.isFinite(base.c) ? base.c : 45;
	const l = Number.isFinite(base.l) ? base.l : 50;
	const h0 = Number.isFinite(base.h) ? base.h : 250;
	const n = Math.max(topicIds.length, 1);
	const out = new Map();
	topicIds.forEach((id, i) => {
		const h = (h0 + (360 * i) / n) % 360;
		out.set(id, {
			fill: d3.hcl(h, c, l).formatHex(),
			stroke: d3.hcl(h, c, Math.max(l - 18, 0)).formatHex(),
		});
	});
	return out;
}
