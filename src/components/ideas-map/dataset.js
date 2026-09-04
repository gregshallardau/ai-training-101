// src/components/ideas-map/dataset.js
// Data + tuning constants for <deck-ideas-map>. No logic here.

/*
 * Force-simulation tuning guide:
 *
 * SEED / WARMUP: Deterministic settle. Change SEED for a different fixed layout;
 *   raise WARMUP (→500) if the graph hasn't visually settled.
 * CLUSTER (per-topic pull, weak by design): Clusters too separate → lower (~0.03)
 *   or increase |CHARGE|. Not distinct enough → raise (~0.08). Keep weak for overlap.
 * CHARGE (node repulsion, negative): More negative spreads the graph out.
 * LINK_DIST (edge length under show-links): Lower to pull linked words tighter.
 * COLLIDE (min node separation): Raise if node circles overlap.
 * REL (forceRelations strength): Parallelograms drifting → raise (→0.5); too rigid
 *   / grid-like → lower (→0.25).
 * D (base step for RELATION_OFFSETS): Offset vectors are multiples/fractions of D.
 * NODE_R (circle radius in px): Adjust if nodes look too large or small at viewBox scale.
 * Graph overflow: Lower LINK_DIST and the 0.32 centroid-ring factor in
 *   simulation.js topicCentroids (only if needed for label clipping).
 */

export const W = 1600;
export const H = 1000;
export const NODE_R = 9;
export const LINK_DIST = 150;
export const CHARGE = -340;
export const CLUSTER = 0.05;   // weak, so topic clusters overlap
export const COLLIDE = NODE_R * 1.7;
export const D = 90;           // base step length for RELATION_OFFSETS
export const REL = 0.35;       // forceRelations strength
export const SEED = 0x1d4a5;
export const WARMUP = 320;     // synchronous settle ticks at mount

export const RELATION_OFFSETS = {
	gender:  [-D, 0],           // one step left  = male -> female
	parent:  [0, -D],           // one step up    = child -> parent
	tense:   [D, 0],            // one step right
	'capital-of': [D * 0.7, -D * 0.55],
};

export const DATASET = {
	topics: [
		{ id: 'family',   name: 'People & family' },
		{ id: 'animals',  name: 'Animals' },
		{ id: 'places',   name: 'Places' },
		{ id: 'sciences', name: 'Sciences' },
		{ id: 'grammar',  name: 'Word forms' },
		{ id: 'music',    name: 'Music' },   // 'music' is intentionally both a topic id and a node id — the spec §4.2 cross-topic overlap pattern
		{ id: 'arts',     name: 'Arts' },
	],
	nodes: [
		{ id: 'man',    name: 'man',    topics: ['family'] },
		{ id: 'woman',  name: 'woman',  topics: ['family'] },
		{ id: 'king',   name: 'king',   topics: ['family'] },
		{ id: 'queen',  name: 'queen',  topics: ['family'] },
		{ id: 'son',    name: 'son',    topics: ['family'] },
		{ id: 'daughter', name: 'daughter', topics: ['family'] },
		{ id: 'father', name: 'father', topics: ['family'] },
		{ id: 'mother', name: 'mother', topics: ['family'] },
		{ id: 'bull',   name: 'bull',   topics: ['animals'] },
		{ id: 'cow',    name: 'cow',    topics: ['animals'] },
		{ id: 'lion',   name: 'lion',   topics: ['animals'] },
		{ id: 'lioness', name: 'lioness', topics: ['animals'] },
		{ id: 'calf',   name: 'calf',   topics: ['animals'] },
		{ id: 'france', name: 'France', topics: ['places'] },
		{ id: 'paris',  name: 'Paris',  topics: ['places'] },
		{ id: 'italy',  name: 'Italy',  topics: ['places'] },
		{ id: 'rome',   name: 'Rome',   topics: ['places'] },
		{ id: 'japan',  name: 'Japan',  topics: ['places'] },
		{ id: 'tokyo',  name: 'Tokyo',  topics: ['places'] },
		{ id: 'cell',   name: 'cell',   topics: ['sciences'] },
		{ id: 'gene',   name: 'gene',   topics: ['sciences'] },
		{ id: 'atom',   name: 'atom',   topics: ['sciences'] },
		{ id: 'energy', name: 'energy', topics: ['sciences'] },
		{ id: 'walk',   name: 'walk',   topics: ['grammar'] },
		{ id: 'walked', name: 'walked', topics: ['grammar'] },
		{ id: 'run',    name: 'run',    topics: ['grammar'] },
		{ id: 'ran',    name: 'ran',    topics: ['grammar'] },
		{ id: 'go',     name: 'go',     topics: ['grammar'] },
		{ id: 'went',   name: 'went',   topics: ['grammar'] },
		{ id: 'music',  name: 'music',  topics: ['music'] },
		{ id: 'painting', name: 'painting', topics: ['arts'] },
		{ id: 'mozart', name: 'Mozart', topics: ['arts', 'music'] },
	],
	links: [
		{ source: 'king', target: 'france' },
		{ source: 'gene', target: 'cell' },
		{ source: 'atom', target: 'energy' },
		{ source: 'paris', target: 'rome' },
		{ source: 'music', target: 'painting' },
		{ source: 'lion', target: 'cell' },
	],
	relations: [
		{ rel: 'gender', pairs: [['man', 'woman'], ['king', 'queen'], ['son', 'daughter'], ['bull', 'cow'], ['lion', 'lioness']] },
		{ rel: 'parent', pairs: [['son', 'father'], ['daughter', 'mother'], ['calf', 'cow']] },
		{ rel: 'tense',  pairs: [['walk', 'walked'], ['run', 'ran'], ['go', 'went']] },
		{ rel: 'capital-of', pairs: [['france', 'paris'], ['italy', 'rome'], ['japan', 'tokyo']] },
	],
	contexts: {
		royalty: {
			from: 'king',
			nodes: ['king', 'queen', 'france', 'paris', 'father'],
			weights: { queen: 1, france: 0.7, paris: 0.5, father: 0.4 },
		},
	},
};
