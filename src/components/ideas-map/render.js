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
	// 'auto' — highlighted nodes always label; in-scope topic labels, else all
	return state.highlight.has(n.id) || (state.scope ? n.topics[0] === state.scope : true);
}

export function drawGraph(svgOrEl, state) {
	const svg = svgOrEl.node ? svgOrEl.node() : svgOrEl;
	const view = svg.querySelector('g.view');
	const gLinks = layer(view, 'links');
	const gSpotlight = layer(view, 'spotlight');
	layer(view, 'attention');
	const gNodes = layer(view, 'nodes');
	const gLabels = layer(view, 'labels');

	const byId = new Map(state.nodes.map((n) => [n.id, n]));

	const revealHidden = state.reveal == null ? null
		: new Set(state.topicOrder.slice(state.reveal));

	const tagged = state.scope ? new Set([...state.tag, state.scope]) : state.tag;

	const spotIds = new Set();
	if (state.spotlight) {
		const rel = state.relations.find((r) => r.rel === state.spotlight);
		if (rel) {
			rel.pairs.forEach(([aId, bId], i) => {
				const a = byId.get(aId); const b = byId.get(bId);
				if (!a || !b) return;
				spotIds.add(aId); spotIds.add(bId);
				gSpotlight.appendChild(make('line', {
					class: 'vec',
					x1: a.x, y1: a.y, x2: b.x, y2: b.y,
					stroke: 'var(--primary-strong)', 'stroke-width': 2.5, 'stroke-linecap': 'round',
				}));
				const ang = Math.atan2(b.y - a.y, b.x - a.x);
				const h = 12;
				gSpotlight.appendChild(make('path', {
					d: `M ${b.x} ${b.y} L ${b.x - h * Math.cos(ang - 0.4)} ${b.y - h * Math.sin(ang - 0.4)} `
						+ `L ${b.x - h * Math.cos(ang + 0.4)} ${b.y - h * Math.sin(ang + 0.4)} Z`,
					fill: 'var(--primary-strong)',
				}));
				if (i === 0) {
					const cap = make('text', {
						class: 'rel-caption', x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 12,
						'text-anchor': 'middle', 'font-size': 12, fill: 'var(--muted)',
					});
					cap.textContent = `one step = ${state.spotlight}`;
					gSpotlight.appendChild(cap);
				}
			});
		}
	}

	for (const l of state.links) {
		const s = byId.get(l.source.id ?? l.source);
		const t = byId.get(l.target.id ?? l.target);
		if (!s || !t) continue;
		if (revealHidden && (revealHidden.has(s.topics[0]) || revealHidden.has(t.topics[0]))) continue;
		let strokeOpacity = state.showLinks ? 0.55 : 0;
		if (state.spotlight && !(spotIds.has(s.id) && spotIds.has(t.id))) strokeOpacity = 0.12;
		gLinks.appendChild(make('line', {
			class: 'link',
			x1: s.x, y1: s.y, x2: t.x, y2: t.y,
			stroke: 'var(--line)', 'stroke-width': 1.5,
			'stroke-opacity': strokeOpacity,
		}));
	}

	for (const n of state.nodes) {
		const c = nodeColor(n, state);
		const scopedOut = state.scope && n.topics[0] !== state.scope;
		const dimByTag = tagged.size > 0 && !tagged.has(n.topics[0]);
		const dimBySpot = state.spotlight && !spotIds.has(n.id);

		const attrs = {
			class: 'node', 'data-id': n.id, 'data-topic': n.topics[0],
			cx: n.x, cy: n.y, r: NODE_R,
			fill: scopedOut ? 'var(--muted)' : c.fill,
			stroke: c.stroke, 'stroke-width': 1.5,
		};
		if (scopedOut) attrs.opacity = 0.15;
		else if (dimBySpot) attrs.opacity = 0.15;
		else if (dimByTag) attrs.opacity = 0.35;

		const hidden = revealHidden && revealHidden.has(n.topics[0]);
		if (hidden) attrs.display = 'none';

		if (!hidden && state.highlight.has(n.id)) {
			gNodes.appendChild(make('circle', {
				class: 'pulse', cx: n.x, cy: n.y, r: NODE_R + 6,
				fill: 'none', stroke: 'var(--primary-strong)', 'stroke-width': 2,
			}));
		}
		gNodes.appendChild(make('circle', attrs));
		if (hidden) continue; // no label
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
