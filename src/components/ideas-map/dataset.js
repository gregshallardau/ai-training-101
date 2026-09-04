// src/components/ideas-map/dataset.js
// Loader + tuning constants for <deck-ideas-map>. The DATA is authored in
// ./dataset.json and is NODE-CENTRIC: every idea is one entry carrying all its
// own variables — which cluster it is in (`topic`, rare second cluster in
// `also`), its associations (`links`), its relation steps (`rels`: each step is
// a rel name, a target id and its OWN `offset: [dx, dy]` vector), and its
// constellation membership (`contexts` weights, `from` focus). Editing one idea
// never leaves its block. Clusters/labels derive from `topicLabels` + the first
// cluster seen in the node list — there is no separate topics list to maintain.
//
// The component itself simulates the FLAT shape (topics[], nodes with
// topics[], links, relation steps, contexts); `expandDataset()` below converts
// the authored JSON to that. It also accepts the legacy flat/seed shape
// ({topics, nodes:[{topics:[...]}], links, relations, contexts}) unchanged.
//
// One quirk: 'music' is intentionally both a topic id and a node id — the
// spec §4.2 cross-topic overlap pattern.
//
// Force-simulation tuning guide (edit THIS file to tune the layout):
//
// SEED / WARMUP: Deterministic settle. Change SEED for a different fixed layout;
//   raise WARMUP (→500) if the graph hasn't visually settled.
// CLUSTER (per-topic pull, weak by design): Clusters too separate → lower (~0.03)
//   or increase |CHARGE|. Not distinct enough → raise (~0.08). Keep weak for overlap.
// CHARGE (node repulsion, negative): More negative spreads the graph out.
// LINK_DIST (edge length under show-links): Lower to pull linked words tighter.
// COLLIDE (min node separation): Raise if node circles overlap.
// REL (forceRelations strength): Parallelograms drifting → raise (→0.5); too rigid
//   / grid-like → lower (→0.25).
// D (base step for authoring offsets): When you hand-code a step's offset in
//   dataset.json, think in steps of D — [-D, 0] = one step left, [0, -D] = up,
//   fractions/multiples of D for diagonals. Keep common relations at clearly
//   distinct angles. A step's vector is what its target SHOULD sit at relative
//   to the source idea; steps are editable per step, so "not exact" gaps are
//   fine — but note the map's demo claim (son→daughter == king→queen) only
//   holds while every step of a rel shares one vector.
// NODE_R (circle radius in px): Adjust if nodes look too large or small at viewBox scale.
// Graph overflow: Lower LINK_DIST and the 0.32 centroid-ring factor in
//   simulation.js topicCentroids (only if needed for label clipping).

import dataset from './dataset.json';

export const W = 1600;
export const H = 1000;
export const NODE_R = 9;
export const LINK_DIST = 150;
export const CHARGE = -340;
export const CLUSTER = 0.05;   // weak, so topic clusters overlap
export const COLLIDE = NODE_R * 1.7;
export const D = 90;           // base step length for hand-coding offsets in dataset.json
export const REL = 0.35;       // forceRelations strength
export const SEED = 0x1d4a5;
export const WARMUP = 320;     // synchronous settle ticks at mount

// Fallback vectors for legacy flat datasets whose relation groups omit an
// offset, and for an authored step without one: the first offset the built-in
// map authors per rel name.
function rawOffsets(doc) {
	const m = {};
	for (const e of doc.nodes || []) {
		for (const s of e.rels || []) {
			if (s && s.rel && !m[s.rel] && Array.isArray(s.offset) && s.offset.length === 2) m[s.rel] = s.offset;
		}
	}
	return m;
}

const builtinOffsets = rawOffsets(dataset);

/** Turn a cluster id into a readable default label ("capital-of" → "Capital Of").
 *  Override per cluster with `topicLabels` in the authored JSON. */
export function defaultTopicLabel(id) {
	return String(id).split(/[.-]/).map((part) => part ? part[0].toUpperCase() + part.slice(1) : part).join(' ');
}

/**
 * Convert an authored (or legacy flat) dataset document into the internal shape
 * the component simulates: `{ topics, nodes, links, relations, contexts }`.
 *  - authored node-centric (./dataset.json): topics derive from the node list
 *    (`topic` + `also`), links gather from each node's `links`, relation steps
 *    carry their own dx/dy, contexts collect membership weights + `from`.
 *  - flat ({topics, nodes:[{topics:[]}], links, relations:[{rel,pairs,offset}],
 *    contexts}): passes through; each relation group's offset becomes the dx/dy
 *    of every one of its steps (falling back to the built-in per-rel vector).
 */
export function expandDataset(doc) {
	if (!doc || typeof doc !== 'object') return { topics: [], nodes: [], links: [], relations: [], contexts: {} };
	if (Array.isArray(doc.topics)) return expandFlat(doc);
	return expandAuthored(doc);
}

function expandAuthored(doc) {
	const labels = (doc.topicLabels && typeof doc.topicLabels === 'object') ? doc.topicLabels : {};
	const topicOrder = [];
	const topicSeen = new Set();
	const nodes = [];
	const links = [];
	const linkSeen = new Set();
	const rels = new Map();   // rel -> { rel, steps: [{ a, b, dx, dy }] }
	const ctxOrder = [];
	const ctxSeen = new Set();
	const ctxs = new Map();   // key -> { from, members, weights }

	const pushTopic = (t) => {
		if (t == null || t === '') return;
		if (!topicSeen.has(t)) { topicSeen.add(t); topicOrder.push(t); }
	};
	const ctxGet = (k) => {
		if (!ctxSeen.has(k)) { ctxSeen.add(k); ctxOrder.push(k); ctxs.set(k, { from: null, members: [], weights: {} }); }
		return ctxs.get(k);
	};
	const ctxMember = (c, id) => { if (!c.members.includes(id)) c.members.push(id); };

	for (const e of doc.nodes || []) {
		if (!e || typeof e !== 'object') continue;
		const id = e.id;
		if (id == null) continue;
		const topics = [];
		if (e.topic != null) { pushTopic(e.topic); topics.push(e.topic); }
		for (const t of e.also || []) { pushTopic(t); topics.push(t); }
		nodes.push({ id, name: (e.name != null && e.name !== '') ? e.name : id, topics });

		for (const t of e.links || []) {
			const key = [id, t].sort().join('\u0001');
			if (linkSeen.has(key)) continue;
			linkSeen.add(key);
			links.push({ source: id, target: t });
		}

		for (const s of e.rels || []) {
			if (!s || typeof s !== 'object' || !s.rel || s.to == null) continue;
			const off = (Array.isArray(s.offset) && s.offset.length === 2) ? s.offset : builtinOffsets[s.rel];
			if (!off) {
				console.warn(`[ideas-map] relation step "${s.rel}" (${id} → ${s.to}) has no offset — give it "offset": [dx, dy]`);
				continue;
			}
			let g = rels.get(s.rel);
			if (!g) { g = { rel: s.rel, steps: [] }; rels.set(s.rel, g); }
			g.steps.push({ a: id, b: s.to, dx: off[0], dy: off[1] });
		}

		for (const [k, w] of Object.entries(e.contexts || {})) {
			const c = ctxGet(k);
			ctxMember(c, id);
			c.weights[id] = w;
		}
		for (const k of e.from || []) {
			const c = ctxGet(k);
			if (c.from == null) c.from = id;
			ctxMember(c, id);
		}
	}

	const topics = topicOrder.map((id) => ({ id, name: labels[id] || defaultTopicLabel(id) }));
	const contexts = {};
	for (const k of ctxOrder) {
		const c = ctxs.get(k);
		// order membership focus-first, then fan nodes by attention weight
		// (strongest first) so it doesn't depend on where the node sits in the file
		const fan = c.members
			.filter((id) => id !== c.from)
			.sort((a, b) => (c.weights[b] ?? 0) - (c.weights[a] ?? 0));
		const nodes = c.from ? [c.from, ...fan] : fan;
		contexts[k] = Object.assign(c.from ? { from: c.from } : {}, { nodes, weights: c.weights });
	}
	return { topics, nodes, links, relations: [...rels.values()], contexts };
}

function expandFlat(doc) {
	const relations = (doc.relations || []).map((r) => {
		// already-internal (clone of DATASET) groups pass through untouched
		if (Array.isArray(r.steps)) return { rel: r.rel, steps: r.steps };
		const off = (Array.isArray(r.offset) && r.offset.length === 2) ? r.offset : builtinOffsets[r.rel];
		return {
			rel: r.rel,
			steps: (r.pairs || []).map(([a, b]) => ({
				a, b,
				dx: off ? off[0] : NaN,
				dy: off ? off[1] : NaN,
			})),
		};
	});
	return {
		topics: doc.topics || [],
		nodes: doc.nodes || [],
		links: doc.links || [],
		relations,
		contexts: doc.contexts || {},
	};
}

/** The built-in map, expanded to the internal shape at load. The component
 *  deep-clones this per instance (buildSimulation mutates nodes). */
export const DATASET = expandDataset(dataset);

/** One default vector per relation, read from the first step the built-in map
 *  authors for it (steps may carry their own, different vectors). Derived, not
 *  authored. */
export const RELATION_OFFSETS = Object.fromEntries(
	DATASET.relations
		.filter((r) => r.steps.length && Number.isFinite(r.steps[0].dx))
		.map((r) => [r.rel, [r.steps[0].dx, r.steps[0].dy]]),
);
