// src/components/ideas-map/dataset.js
// Data + tuning constants for <deck-ideas-map>. No logic here.

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
	capital: [D * 0.7, -D * 0.55],
};

export const DATASET = {
	topics: [
		{ id: 'family',   name: 'People & family' },
		{ id: 'animals',  name: 'Animals' },
		{ id: 'places',   name: 'Places' },
		{ id: 'sciences', name: 'Sciences' },
		{ id: 'grammar',  name: 'Word forms' },
		{ id: 'music',    name: 'Music' },
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
		{ rel: 'capital', pairs: [['france', 'paris'], ['italy', 'rome'], ['japan', 'tokyo']] },
	],
	contexts: {
		royalty: {
			from: 'king',
			nodes: ['king', 'queen', 'france', 'paris', 'father'],
			weights: { queen: 1, france: 0.7, paris: 0.5, father: 0.4 },
		},
	},
};
