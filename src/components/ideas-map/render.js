// src/components/ideas-map/render.js
import { NODE_R } from './dataset.js';

const NS = 'http://www.w3.org/2000/svg';
const make = (tag, attrs = {}) => {
	const e = document.createElementNS(NS, tag);
	for (const k in attrs) e.setAttribute(k, attrs[k]);
	return e;
};

function layer(view, cls) {
	let g = view.querySelector(`:scope > g.${cls}`);
	if (!g) { g = make('g', { class: cls }); view.appendChild(g); }
	g.textContent = '';
	return g;
}

function nodeColor(n, state) {
	const c = state.colors.get(n.topics[0]) || { fill: 'currentColor', stroke: 'currentColor' };
	return c;
}

function labelled(n, state) {
	if (state.labelsMode === 'none' || state.labelsMode === 'topics') return false;
	if (state.labelsMode === 'all') return true;
	return true; // 'auto' — Task 8 refines with scope/highlight
}

export function drawGraph(svgOrEl, state) {
	const svg = svgOrEl.node ? svgOrEl.node() : svgOrEl;
	const view = svg.querySelector('g.view');
	const gLinks = layer(view, 'links');
	layer(view, 'spotlight');
	layer(view, 'attention');
	const gNodes = layer(view, 'nodes');
	const gLabels = layer(view, 'labels');

	const byId = new Map(state.nodes.map((n) => [n.id, n]));

	for (const l of state.links) {
		const s = byId.get(l.source.id ?? l.source);
		const t = byId.get(l.target.id ?? l.target);
		if (!s || !t) continue;
		gLinks.appendChild(make('line', {
			x1: s.x, y1: s.y, x2: t.x, y2: t.y,
			stroke: 'var(--line)', 'stroke-width': 1.5,
			'stroke-opacity': state.showLinks ? 0.55 : 0,
		}));
	}

	for (const n of state.nodes) {
		const c = nodeColor(n, state);
		gNodes.appendChild(make('circle', {
			class: 'node', 'data-id': n.id, 'data-topic': n.topics[0],
			cx: n.x, cy: n.y, r: NODE_R,
			fill: c.fill, stroke: c.stroke, 'stroke-width': 1.5,
		}));
		if (labelled(n, state)) {
			const t = make('text', {
				class: 'node-label', x: n.x, y: n.y + NODE_R + 14,
				'text-anchor': 'middle', 'font-size': 13,
			});
			t.textContent = n.name;
			gLabels.appendChild(t);
		}
	}
}
