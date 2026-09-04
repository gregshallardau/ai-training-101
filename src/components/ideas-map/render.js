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
	// Empty / unknown topic (spec §4.2): drawn in --muted, still placed by forces.
	const c = state.colors.get(n.topics[0]) || { fill: 'var(--muted)', stroke: 'var(--muted)' };
	return c;
}

function labelled(n, state) {
	// 'topics' is out of v1 scope for node labels — treat it as 'none' here.
	if (state.labelsMode === 'none' || state.labelsMode === 'topics') return false;
	if (state.labelsMode === 'all') return true;
	// 'auto'
	if (state.activate) return state.activate.ids.has(n.id);
	if (state.spotlight) return true; // spotlight involves few; cheap
	if (state.scope) return n.topics[0] === state.scope || state.highlight.has(n.id);
	if (state.highlight.size) return state.highlight.has(n.id);
	return state.nodes.length <= 60;
}

export function drawGraph(svgOrEl, state) {
	const svg = svgOrEl.node ? svgOrEl.node() : svgOrEl;
	const view = svg.querySelector('g.view');
	const gLinks = layer(view, 'links');
	const gSpotlight = layer(view, 'spotlight');
	const gAtt = layer(view, 'attention');
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
				if (revealHidden && (revealHidden.has(a.topics[0]) || revealHidden.has(b.topics[0]))) return;
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
		// only dim links that are ALREADY visible — never turn a hidden link on
		if (state.spotlight && strokeOpacity > 0 && !(spotIds.has(s.id) && spotIds.has(t.id))) strokeOpacity = 0.12;
		gLinks.appendChild(make('line', {
			class: 'link',
			'data-s': s.id, 'data-t': t.id,
			x1: s.x, y1: s.y, x2: t.x, y2: t.y,
			stroke: 'var(--line)', 'stroke-width': 1.5,
			'stroke-opacity': strokeOpacity,
		}));
	}

	const act = state.activate;
	if (act) {
		const list = [...act.ids].filter((id) => byId.has(id));
		// halos — one per activated node, sized by attention weight
		for (const id of list) {
			const n = byId.get(id);
			const w = id === act.from ? 1 : (act.weights.get(id) || 0);
			const col = (state.colors.get(n.topics[0]) || {}).fill || 'var(--primary)';
			gAtt.appendChild(make('circle', {
				class: 'halo', 'data-id': id, cx: n.x, cy: n.y, r: NODE_R + 4 + w * 60,
				fill: col, 'fill-opacity': 0.18,
			}));
		}
		// attention edges — fixed ink budget (fan weights sum to 1)
		if (act.from && byId.has(act.from)) {
			const f = byId.get(act.from);
			for (const id of list) {
				if (id === act.from) continue;
				const n = byId.get(id);
				gAtt.appendChild(make('line', {
					x1: f.x, y1: f.y, x2: n.x, y2: n.y,
					stroke: 'var(--primary-strong)', 'stroke-opacity': 0.8,
					'stroke-width': 0.5 + (act.weights.get(id) || 0) * 16, 'stroke-linecap': 'round',
				}));
			}
		} else {
			for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
				const a = byId.get(list[i]); const b = byId.get(list[j]);
				gAtt.appendChild(make('line', {
					x1: a.x, y1: a.y, x2: b.x, y2: b.y,
					stroke: 'var(--primary-strong)', 'stroke-opacity': 0.55, 'stroke-width': 1.4,
				}));
			}
		}
		if (act.constellation && list.length > 1) {
			gAtt.appendChild(make('polyline', {
				class: 'constellation',
				points: list.map((id) => `${byId.get(id).x},${byId.get(id).y}`).join(' '),
				fill: 'none', stroke: 'var(--primary-strong)', 'stroke-width': 1, 'stroke-dasharray': '2 6',
			}));
		}
	}

	// Topic captions — an uppercase label at each cluster's centroid so the bare
	// map reads as groups, not a scatter. On for labels 'topics' and 'all'.
	if (state.labelsMode === 'topics' || state.labelsMode === 'all') {
		for (const id of state.topicOrder) {
			if (revealHidden && revealHidden.has(id)) continue;
			const pts = state.nodes.filter((n) => n.topics[0] === id);
			if (!pts.length) continue;
			const cx = pts.reduce((a, n) => a + n.x, 0) / pts.length;
			const cy = Math.min(...pts.map((n) => n.y)) - NODE_R - 24;
			const cap = make('text', {
				class: 'topic-caption', x: cx, y: cy, 'text-anchor': 'middle',
				'font-size': 20, 'letter-spacing': '2.5', 'font-weight': 600,
				fill: 'var(--muted)', 'fill-opacity': 0.85,
			});
			cap.textContent = (state.topicNames.get(id) || id).toUpperCase();
			gLabels.appendChild(cap);
		}
	}

	for (const n of state.nodes) {
		const c = nodeColor(n, state);
		const scopedOut = state.scope && n.topics[0] !== state.scope;
		const dimByTag = tagged.size > 0 && !tagged.has(n.topics[0]);
		const dimBySpot = state.spotlight && !spotIds.has(n.id);
		const dimByAct = act && !act.ids.has(n.id);
		// A node that any overlay is actively pointing at must never be dimmed to
		// near-invisible by a *different* overlay (spec §5 / review I4).
		const emphasised = (act && act.ids.has(n.id))
			|| (state.spotlight && spotIds.has(n.id))
			|| state.highlight.has(n.id)
			|| (state.scope && n.topics[0] === state.scope);

		const attrs = {
			class: 'node', 'data-id': n.id, 'data-topic': n.topics[0] || '',
			cx: n.x, cy: n.y, r: NODE_R,
			fill: scopedOut ? 'var(--muted)' : c.fill,
			stroke: c.stroke, 'stroke-width': 1.5,
		};
		// `scopedOut` still mutes the *fill* of an out-of-scope node, but an
		// emphasised one keeps full opacity — the opacity-dim cascade is skipped.
		if (emphasised) { /* full opacity; fill may still be --muted if scopedOut */ }
		else if (state.starmap) { attrs.fill = 'var(--muted)'; attrs.opacity = 0.22; }
		else if (scopedOut) { attrs.opacity = 0.15; }
		else if (dimByAct) { attrs.fill = 'var(--muted)'; attrs.opacity = 0.12; }
		else if (dimBySpot) { attrs.opacity = 0.15; }
		else if (dimByTag && !(state.spotlight && spotIds.has(n.id))) { attrs.opacity = 0.35; }
		else if (state.highlight.size > 0 && !state.highlight.has(n.id)) { attrs.opacity = 0.5; }

		if (state.dragId) {
			const nbr = new Set([state.dragId]);
			for (const l of state.links) {
				const sid = l.source.id ?? l.source; const tid = l.target.id ?? l.target;
				if (sid === state.dragId) nbr.add(tid);
				if (tid === state.dragId) nbr.add(sid);
			}
			attrs.class = 'node ' + (nbr.has(n.id) ? 'lit' : 'dim');
			if (!nbr.has(n.id)) attrs.opacity = Math.min(attrs.opacity ?? 1, 0.3);
		}

		const hidden = revealHidden && revealHidden.has(n.topics[0]);
		if (hidden) attrs.display = 'none';

		if (!hidden && state.highlight.has(n.id)) {
			gNodes.appendChild(make('circle', {
				class: 'pulse', 'data-id': n.id, cx: n.x, cy: n.y, r: NODE_R + 6,
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
