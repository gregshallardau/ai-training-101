/**
 * D3 integration - data-driven visuals (charts, hierarchies, maps with drill-down).
 * Imported lazily by the components that need it, not from main.js.
 */
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

/**
 * Build a palette from CSS custom properties so a visualisation tracks the deck
 * theme and re-themes live when [data-theme] changes.
 *
 * @param {string[]} varNames  e.g. ['--primary', '--primary-strong', '--muted']
 * @returns {string[]} resolved colour strings
 */
export function readPalette(varNames, root = document.documentElement) {
	const cs = getComputedStyle(root);
	return varNames.map((n) => cs.getPropertyValue(n).trim());
}

/**
 * Path `d` for a rectangle with selected corners rounded - SVG has no
 * `border-radius`, so a bar/cell that should match the deck's
 * `--radius-control` / `--radius-card` look needs its outline drawn as a path
 * instead of a plain `<rect>`. `r` is in the same units as x/y/width/height
 * (viewBox units, not CSS px - see `pxToViewBoxUnits`).
 *
 * @param {number} x @param {number} y @param {number} width @param {number} height
 * @param {number} r corner radius, clamped to half the shorter side
 * @param {{tl?: boolean, tr?: boolean, br?: boolean, bl?: boolean}} corners which corners round (default: top only - the standard bar-chart look)
 */
export function roundedRectPath(x, y, width, height, r, corners = { tl: true, tr: true }) {
	r = Math.max(0, Math.min(r, width / 2, height / 2));
	const { tl, tr, br, bl } = corners;
	const rTL = tl ? r : 0, rTR = tr ? r : 0, rBR = br ? r : 0, rBL = bl ? r : 0;
	return [
		`M${x + rTL},${y}`,
		`H${x + width - rTR}`,
		rTR ? `A${rTR},${rTR} 0 0 1 ${x + width},${y + rTR}` : '',
		`V${y + height - rBR}`,
		rBR ? `A${rBR},${rBR} 0 0 1 ${x + width - rBR},${y + height}` : '',
		`H${x + rBL}`,
		rBL ? `A${rBL},${rBL} 0 0 1 ${x},${y + height - rBL}` : '',
		`V${y + rTL}`,
		rTL ? `A${rTL},${rTL} 0 0 1 ${x + rTL},${y}` : '',
		'Z',
	].filter(Boolean).join(' ');
}

/**
 * A CSS radius/space token (`--radius-control`, resolved by `cssVar`) is a px
 * value against the *rendered* element - but a chart's marks are drawn in
 * `viewBox` units, which only equal CSS px when the SVG happens to render at
 * 1:1. `svg.getBoundingClientRect().width / viewBoxWidth` is that ratio;
 * dividing the px radius by it converts to viewBox units so the rounding
 * reads as the same physical size the token specifies everywhere else.
 *
 * @param {number} px value read from a CSS custom property
 * @param {SVGSVGElement} svg the element whose rendered size to measure
 * @param {number} viewBoxWidth the `viewBox` width (the `W` a recipe already defines)
 */
export function pxToViewBoxUnits(px, svg, viewBoxWidth) {
	const scale = svg.getBoundingClientRect().width / viewBoxWidth;
	return scale > 0 ? px / scale : px;
}

export { d3, topojson };
