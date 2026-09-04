#!/usr/bin/env node
// Validate a <deck-ideas-map> DATASET against every invariant the component
// depends on. No dependencies. Usage: node validate.mjs dataset.json
//
// Exit 0 = safe to load. Exit 1 = errors (listed, each pointing at the id).

import { readFileSync } from 'node:fs';

const RELS = new Set([
	'gender', 'parent', 'tense', 'plural', 'comparative', 'superlative',
	'capital-of', 'opposite', 'part-of', 'instance-of', 'profession', 'symbol',
]);
const SLUG = /^[a-z0-9]+([.-][a-z0-9]+)*$/;
const MAX_NODES = 5000;

const path = process.argv[2];
if (!path) { console.error('usage: node validate.mjs dataset.json'); process.exit(2); }

let ds;
try {
	ds = JSON.parse(readFileSync(path, 'utf8'));
} catch (e) {
	console.error(`not valid JSON: ${e.message}`);
	process.exit(1);
}

const errors = [];
const warns = [];
const E = (m) => errors.push(m);
const W = (m) => warns.push(m);

const arr = (v) => (Array.isArray(v) ? v : []);
const topics = arr(ds.topics);
const nodes = arr(ds.nodes);
const links = arr(ds.links);
const relations = arr(ds.relations);
const contexts = (ds.contexts && typeof ds.contexts === 'object') ? ds.contexts : {};

if (!topics.length) E('topics: empty or missing');
if (!nodes.length) E('nodes: empty or missing');

// --- topics ---------------------------------------------------------------
const topicIds = new Set();
for (const [i, t] of topics.entries()) {
	const at = `topics[${i}]`;
	if (!t || typeof t !== 'object') { E(`${at}: not an object`); continue; }
	if (typeof t.id !== 'string' || !SLUG.test(t.id)) E(`${at}: id "${t.id}" is not a kebab slug`);
	else if (topicIds.has(t.id)) E(`${at}: duplicate topic id "${t.id}"`);
	else topicIds.add(t.id);
	if (typeof t.name !== 'string' || !t.name.trim()) E(`${at} ("${t.id}"): name missing`);
}

// --- nodes ---------------------------------------------------------------
const nodeIds = new Set();
const topicNodeCount = new Map([...topicIds].map((id) => [id, 0]));
for (const [i, n] of nodes.entries()) {
	const at = `nodes[${i}]`;
	if (!n || typeof n !== 'object') { E(`${at}: not an object`); continue; }
	if (typeof n.id !== 'string' || !SLUG.test(n.id)) E(`${at}: id "${n.id}" is not a kebab slug`);
	else if (nodeIds.has(n.id)) E(`${at}: duplicate node id "${n.id}"`);
	else nodeIds.add(n.id);
	if (typeof n.name !== 'string' || !n.name.trim()) E(`${at} ("${n.id}"): name missing`);
	const nt = arr(n.topics);
	if (!nt.length) E(`${at} ("${n.id}"): topics[] is empty`);
	for (const tid of nt) {
		if (!topicIds.has(tid)) E(`${at} ("${n.id}"): unknown topic "${tid}"`);
		else topicNodeCount.set(tid, topicNodeCount.get(tid) + 1);
	}
	if (nt.length === 2 && nt[0] === nt[1]) W(`${at} ("${n.id}"): both topics are "${nt[0]}"`);
	if ('weight' in n && typeof n.weight !== 'number') E(`${at} ("${n.id}"): weight is not a number`);
}
if (nodes.length > MAX_NODES) W(`nodes: ${nodes.length} > ${MAX_NODES} — force sim will be slow; use reveal= and/or split`);
for (const [tid, c] of topicNodeCount) if (c === 0) W(`topic "${tid}": no nodes`);

// --- links -------------------------------------------------------------
for (const [i, l] of links.entries()) {
	const at = `links[${i}]`;
	if (!l || typeof l !== 'object') { E(`${at}: not an object`); continue; }
	if (!nodeIds.has(l.source)) E(`${at}: unknown source "${l.source}"`);
	if (!nodeIds.has(l.target)) E(`${at}: unknown target "${l.target}"`);
	if (l.source === l.target) E(`${at}: self-link on "${l.source}"`);
	if ('distance' in l && !(typeof l.distance === 'number' && l.distance > 0)) E(`${at}: distance must be a positive number`);
}

// --- relations -------------------------------------------------------
for (const [i, r] of relations.entries()) {
	const at = `relations[${i}]`;
	if (!r || typeof r !== 'object') { E(`${at}: not an object`); continue; }
	if (!RELS.has(r.rel)) E(`${at}: rel "${r.rel}" is not in the vocabulary`);
	const pairs = arr(r.pairs);
	if (!pairs.length) E(`${at} ("${r.rel}"): no pairs`);
	if (pairs.length === 1) W(`${at} ("${r.rel}"): only one pair — nothing to compare it against on screen`);
	for (const [j, p] of pairs.entries()) {
		const pa = `${at}.pairs[${j}]`;
		if (!Array.isArray(p) || p.length !== 2) { E(`${pa}: not a [a, b] pair`); continue; }
		if (!nodeIds.has(p[0])) E(`${pa}: unknown node "${p[0]}"`);
		if (!nodeIds.has(p[1])) E(`${pa}: unknown node "${p[1]}"`);
		if (p[0] === p[1]) E(`${pa}: a pair of one node "${p[0]}"`);
	}
}

// --- contexts -------------------------------------------------------
for (const [k, c] of Object.entries(contexts)) {
	const at = `contexts["${k}"]`;
	if (!c || typeof c !== 'object') { E(`${at}: not an object`); continue; }
	const cn = arr(c.nodes);
	if (!cn.length) E(`${at}: nodes[] is empty`);
	for (const id of cn) if (!nodeIds.has(id)) E(`${at}: unknown node "${id}"`);
	if ('from' in c && !nodeIds.has(c.from)) E(`${at}: from "${c.from}" is not a node`);
	const cnSet = new Set(cn);
	for (const [wid, wv] of Object.entries(c.weights || {})) {
		if (!cnSet.has(wid)) E(`${at}.weights: "${wid}" is not one of this context's nodes`);
		if (typeof wv !== 'number' || wv < 0 || wv > 1) E(`${at}.weights["${wid}"]: ${wv} is not in [0, 1]`);
	}
}

// --- report -------------------------------------------------------------
const fmt = (n) => n.toLocaleString('en');
console.log(`${path}: ${fmt(topics.length)} topics · ${fmt(nodes.length)} nodes · ${fmt(links.length)} links · ${fmt(relations.length)} relation groups · ${fmt(Object.keys(contexts).length)} contexts`);
for (const w of warns) console.log(`  ⚠ ${w}`);
if (errors.length) {
	console.error(`\n${errors.length} error(s):`);
	for (const e of errors) console.error(`  ✘ ${e}`);
	process.exit(1);
}
console.log(warns.length ? `\nOK (with ${warns.length} warning(s)).` : '\nOK.');
