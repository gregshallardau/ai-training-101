// src/components/ideas-map/simulation.js
import { d3 } from '@/lib/d3.js';
import {
	W, H, LINK_DIST, CHARGE, CLUSTER, COLLIDE, NODE_R, SEED, WARMUP,
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

// Placeholder — real implementation lands in Task 4.
export function forceRelations() {
	const f = () => {};
	f.initialize = () => {};
	f.strength = () => f;
	return f;
}

export function buildSimulation(dataset, opts = {}) {
	const {
		seed = SEED, warmup = WARMUP, showLinks = false, relations = true,
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

	if (showLinks) {
		const relPairs = relations
			? dataset.relations.flatMap((r) => r.pairs.map(([a, b]) => ({ source: a, target: b })))
			: [];
		const links = dataset.links.map((l) => ({ ...l })).concat(relPairs);
		sim.force('link', d3.forceLink(links).id((n) => n.id).distance((l) => l.distance ?? LINK_DIST));
	}

	if (relations) {
		sim.force('relations', forceRelations(dataset.relations));
	}

	sim.alpha(1);
	for (let i = 0; i < warmup; i++) sim.tick();
	sim.alpha(0).stop();
	return sim;
}
