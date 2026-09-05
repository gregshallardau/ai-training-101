// src/components/ideas-map/simulation.js
import { d3 } from '@/lib/d3.js';
import {
	W, H, LINK_DIST, CHARGE, CLUSTER, HOMING, COLLIDE, SEED, WARMUP, REL,
} from './dataset.js';

export function topicCentroids(nodes, topics) {
	const R = Math.min(W, H) * 0.32;
	const m = new Map();
	topics.forEach((t, i) => {
		const a = (2 * Math.PI * i) / topics.length - Math.PI / 2;
		m.set(t.id, { x: W / 2 + R * Math.cos(a), y: H / 2 + R * Math.sin(a) });
	});
	return m;
}

export function forceRelations(relations, strength = REL) {
	let steps = [];
	let k = strength;

	function force(alpha) {
		const a = k * alpha;
		for (const p of steps) {
			const errx = p.s.x + p.dx - p.t.x;
			const erry = p.s.y + p.dy - p.t.y;
			p.t.vx += errx * a; p.t.vy += erry * a;
			p.s.vx -= errx * a; p.s.vy -= erry * a;
		}
	}
	force.initialize = (nodes) => {
		const by = new Map(nodes.map((n) => [n.id, n]));
		steps = [];
		for (const r of relations) {
			for (const st of r.steps || []) {
				// every step carries its own dx/dy (authored per idea in the
				// dataset JSON) — "not exact" gaps are intentional per step.
				if (!Number.isFinite(st.dx) || !Number.isFinite(st.dy)) {
					console.warn(`[ideas-map] relation step "${r.rel}" ${st.a} → ${st.b} has no offset vector — add "offset": [dx, dy] to it in the dataset`);
					continue;
				}
				const s = by.get(st.a); const t = by.get(st.b);
				if (!s || !t) { console.warn(`[ideas-map] relation step ${st.a},${st.b} unresolved`); continue; }
				steps.push({ s, t, dx: st.dx, dy: st.dy });
			}
		}
	};
	force.strength = (v) => (v === undefined ? k : (k = v, force));
	return force;
}

export function buildSimulation(dataset, opts = {}) {
	const {
		seed = SEED, warmup = WARMUP, relations = true,
	} = opts;
	const rng = d3.randomLcg(seed);
	const cents = topicCentroids(dataset.nodes, dataset.topics);

	// seeded initial positions near the topic centroid
	for (const n of dataset.nodes) {
		const c = cents.get(n.topics[0]) || { x: W / 2, y: H / 2 };
		n.x = c.x + (rng() - 0.5) * 220;
		n.y = c.y + (rng() - 0.5) * 220;
		n.vx = 0;
		n.vy = 0;
	}

	const sim = d3.forceSimulation(dataset.nodes)
		.randomSource(d3.randomLcg(seed ^ 0x9e3779b9))
		.force('charge', d3.forceManyBody().strength(CHARGE))
		.force('x', d3.forceX((n) => (cents.get(n.topics[0]) || { x: W / 2 }).x).strength(CLUSTER))
		.force('y', d3.forceY((n) => (cents.get(n.topics[0]) || { y: H / 2 }).y).strength(CLUSTER))
		.force('collide', d3.forceCollide(COLLIDE))
		.force('center', d3.forceCenter(W / 2, H / 2))
		.stop();

	// NB: there is deliberately NO link force. Position encodes meaning — topic
	// cluster + the directional `forceRelations` offset — and a scalar link
	// spring pulling associated words together shears the authored relation
	// parallelograms (son→daughter must equal king→queen). The association web
	// (`show-links`) is a pure DRAW overlay: edges are painted between wherever
	// the nodes already settled, and toggling it never moves anything.
	if (relations) {
		sim.force('relations', forceRelations(dataset.relations));
	}

	sim.alpha(1);
	for (let i = 0; i < warmup; i++) sim.tick();

	// Freeze the settled layout as each node's "home", then re-aim the x/y
	// springs at home (not the topic centroid). Now any drag perturbation
	// relaxes back to *exactly* this shape — yank `son` aside, release, and it
	// (and any neighbour the relation force tugged along) springs back into
	// place. forceRelations still holds because home already satisfies every
	// authored offset.
	for (const n of dataset.nodes) { n.home = { x: n.x, y: n.y }; }
	sim.force('x', d3.forceX((n) => (n.home ? n.home.x : W / 2)).strength(HOMING));
	sim.force('y', d3.forceY((n) => (n.home ? n.home.y : H / 2)).strength(HOMING));

	sim.alpha(0).stop();
	return sim;
}
