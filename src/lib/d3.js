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
 * @param {string[]} varNames  e.g. ['--accent', '--accent-strong', '--surface-fg-muted']
 * @returns {string[]} resolved colour strings
 */
export function readPalette(varNames, root = document.documentElement) {
	const cs = getComputedStyle(root);
	return varNames.map((n) => cs.getPropertyValue(n).trim());
}

export { d3, topojson };
