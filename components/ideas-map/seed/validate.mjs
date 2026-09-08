#!/usr/bin/env node
// Validate a <deck-ideas-map> dataset against every invariant the component
// depends on. No dependencies. Usage: node validate.mjs dataset.json
//
// Accepts BOTH shapes:
//   - authored node-centric (./dataset.json / ./dataset-template.jsonc style):
//     every idea is one entry carrying topic, links, rels (+ own offsets),
//     contexts. Clusters derive from the node list.
//   - legacy flat / seed batch ({ topics, nodes:[{topics:[]}], links,
//     relations:[{rel,pairs}], contexts }) — bulk-generated files merge flat.
//
// Exit 0 = safe to load. Exit 1 = errors (listed, each pointing at the id).

import { readFileSync } from 'node:fs';

const RELS = new Set([
	'gender', 'parent', 'tense', 'plural', 'comparative', 'superlative',
	'capital-of', 'opposite', 'part-of', 'instance-of', 'profession', 'symbol',
	'produces',
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
const num = (v) => typeof v === 'number' && Number.isFinite(v);
const offsetOk = (o) => Array.isArray(o) && o.length === 2 && o.every(num);

// --- detect shape ---------------------------------------------------------
const hasTopLevelTopics = Array.isArray(ds.topics);
const nodeSamples = (ds.nodes || []).slice(0, 5);
const hasTopicVar = nodeSamples.some((n) => n && typeof n === 'object' && 'topic' in n);
const authored = !hasTopLevelTopics || hasTopicVar;

if (authored) validateAuthored(ds); else validateFlat(ds);

// --- report ---------------------------------------------------------------
let summary;
if (authored) {
	const topicSet = new Set();
	let linkN = 0;
	const relSet = new Set();
	for (const n of ds.nodes || []) {
		if (n.topic != null) topicSet.add(n.topic);
		for (const t of n.also || []) topicSet.add(t);
		linkN += (n.links || []).length;
		for (const s of n.rels || []) relSet.add(s && s.rel);
	}
	summary = `${topicSet.size} topics (derived) · ${(ds.nodes || []).length} nodes · ${linkN} links · ${relSet.size} relation kinds · ${allContextIds(ds).size} contexts`;
} else {
	summary = `${(ds.topics || []).length} topics · ${(ds.nodes || []).length} nodes · ${(ds.links || []).length} links · ${(ds.relations || []).length} relation groups · ${Object.keys(ds.contexts || {}).length} contexts`;
}
console.log(`${path}: ${summary}`);
for (const w of warns) console.log(`  ⚠ ${w}`);
if (errors.length) {
	console.error(`\n${errors.length} error(s):`);
	for (const e of errors) console.error(`  ✘ ${e}`);
	process.exit(1);
}
console.log(warns.length ? `\nOK (with ${warns.length} warning(s)).` : '\nOK.');

function nodeTopicCount(doc) {
	const s = new Set();
	for (const n of doc.nodes || []) {
		if (n && n.topic != null) s.add(n.topic);
		for (const t of n.also || []) s.add(t);
	}
	return s.size;
}

// --- authored, node-centric ----------------------------------------------
function validateAuthored(doc) {
	const nodes = doc.nodes || [];
	const nodeIds = new Set();
	const topicCount = new Map();
	const ctxNames = allContextIds(doc);

	if (!nodes.length) E('nodes: empty or missing');
	if (doc.topicLabels != null && (typeof doc.topicLabels !== 'object' || Array.isArray(doc.topicLabels))) {
		E('topicLabels: must be an object of { topicId: "Label" }');
	}

	// pass 1: id + primary-topic census (so links/rels/from may reference any node)
	for (const [i, n] of nodes.entries()) {
		const at = `nodes[${i}]`;
		if (!n || typeof n !== 'object') { E(`${at}: not an object`); continue; }
		if (typeof n.id !== 'string' || !SLUG.test(n.id)) E(`${at}: id "${n.id}" is not a kebab slug`);
		else if (nodeIds.has(n.id)) E(`${at}: duplicate node id "${n.id}"`);
		else nodeIds.add(n.id);
		if (n.name != null && (typeof n.name !== 'string' || !n.name.trim())) E(`${at} ("${n.id}"): name must be a non-empty string`);
		if (n.topic == null || n.topic === '') E(`${at} ("${n.id}"): topic missing — every idea belongs to a cluster`);
		else {
			if (!SLUG.test(n.topic)) E(`${at} ("${n.id}"): topic "${n.topic}" is not a kebab slug`);
			else topicCount.set(n.topic, (topicCount.get(n.topic) || 0) + 1);
		}
		if (n.links != null && !Array.isArray(n.links)) E(`${at} ("${n.id}"): links must be a list of node ids`);
		if (n.rels != null && !Array.isArray(n.rels)) E(`${at} ("${n.id}"): rels must be a list of steps`);
	}

	// pass 2: referential + value checks
	for (const [i, n] of nodes.entries()) {
		if (!n || typeof n !== 'object') continue;
		const at = `nodes[${i}]`;
		if (n.also != null) {
			if (!Array.isArray(n.also)) { /* reported above */ }
			else for (const t of n.also) {
				if (typeof t !== 'string' || !SLUG.test(t)) E(`${at} ("${n.id}"): also topic "${t}" is not a kebab slug`);
				else if (t === n.topic) W(`${at} ("${n.id}"): also repeats its own topic "${t}"`);
			}
		}
		for (const l of n.links || []) {
			const t = (typeof l === 'string') ? l : (l && l.to);
			if (t == null) { E(`${at} ("${n.id}"): link must be a node id or { to, weight }`); continue; }
			if (!nodeIds.has(t)) E(`${at} ("${n.id}"): link to unknown node "${t}"`);
			else if (t === n.id) E(`${at} ("${n.id}"): self-link`);
			if (l && typeof l === 'object' && l.weight != null
				&& !(Number.isFinite(l.weight) && l.weight >= 0 && l.weight <= 1)) {
				E(`${at} ("${n.id}"): link weight for "${t}" must be a number 0..1`);
			}
		}
		for (const [j, s] of (n.rels || []).entries()) {
			const sa = `${at} ("${n.id}").rels[${j}]`;
			if (!s || typeof s !== 'object') { E(`${sa}: not an object`); continue; }
			if (!RELS.has(s.rel)) E(`${sa}: rel "${s.rel}" is not in the vocabulary`);
			if (!nodeIds.has(s.to)) E(`${sa}: step to unknown node "${s.to}"`);
			else if (s.to === n.id) E(`${sa}: step from "${n.id}" to itself`);
			if (s.offset != null && !offsetOk(s.offset)) E(`${sa}: offset must be [dx, dy] — two finite numbers`);
		}
		const mine = new Set();
		if (n.contexts != null) {
			if (typeof n.contexts !== 'object' || Array.isArray(n.contexts)) E(`${at} ("${n.id}"): contexts must be an object of { contextId: weight }`);
			else for (const [k, w] of Object.entries(n.contexts)) {
				if (mine.has(k)) W(`${at} ("${n.id}"): context "${k}" listed twice`);
				mine.add(k);
				if (typeof w !== 'number' || !Number.isFinite(w) || w < 0 || w > 1) E(`${at} ("${n.id}"): contexts["${k}"] weight ${w} is not in [0, 1]`);
			}
		}
		if (n.from != null) {
			if (!Array.isArray(n.from)) E(`${at} ("${n.id}"): from must be a list of context ids`);
			else for (const k of n.from) {
				if (mine.has(k)) W(`${at} ("${n.id}"): "${k}" is both a context member and a from focus`);
				if (!ctxNames.has(k)) E(`${at} ("${n.id}"): from "${k}" is not a context any idea belongs to`);
			}
		}
		if ('weight' in n && typeof n.weight !== 'number') E(`${at} ("${n.id}"): weight is not a number`);
	}

	if (nodes.length > MAX_NODES) W(`nodes: ${nodes.length} > ${MAX_NODES} — force sim will be slow; use reveal= and/or split`);

	// topicLabels: warn about typos (a label whose topic no idea uses)
	const used = new Set(topicCount.keys());
	for (const k of Object.keys(doc.topicLabels || {})) {
		if (!used.has(k)) W(`topicLabels: "${k}" labels a topic no node uses`);
	}
}

function allContextIds(doc) {
	const s = new Set();
	for (const n of doc.nodes || []) {
		for (const k of Object.keys(n.contexts || {})) s.add(k);
		for (const k of n.from || []) s.add(k);
	}
	return s;
}

// --- legacy flat / seed batch ---------------------------------------------
function validateFlat(doc) {
	const topics = doc.topics || [];
	const nodes = doc.nodes || [];
	const links = doc.links || [];
	const relations = doc.relations || [];
	const contexts = (doc.contexts && typeof doc.contexts === 'object') ? doc.contexts : {};

	if (!topics.length) E('topics: empty or missing');
	if (!nodes.length) E('nodes: empty or missing');

	const topicIds = new Set();
	for (const [i, t] of topics.entries()) {
		const at = `topics[${i}]`;
		if (!t || typeof t !== 'object') { E(`${at}: not an object`); continue; }
		if (typeof t.id !== 'string' || !SLUG.test(t.id)) E(`${at}: id "${t.id}" is not a kebab slug`);
		else if (topicIds.has(t.id)) E(`${at}: duplicate topic id "${t.id}"`);
		else topicIds.add(t.id);
		if (typeof t.name !== 'string' || !t.name.trim()) E(`${at} ("${t.id}"): name missing`);
	}

	const nodeIds = new Set();
	const topicNodeCount = new Map([...topicIds].map((id) => [id, 0]));
	for (const [i, n] of nodes.entries()) {
		const at = `nodes[${i}]`;
		if (!n || typeof n !== 'object') { E(`${at}: not an object`); continue; }
		if (typeof n.id !== 'string' || !SLUG.test(n.id)) E(`${at}: id "${n.id}" is not a kebab slug`);
		else if (nodeIds.has(n.id)) E(`${at}: duplicate node id "${n.id}"`);
		else nodeIds.add(n.id);
		if (typeof n.name !== 'string' || !n.name.trim()) E(`${at} ("${n.id}"): name missing`);
		const nt = Array.isArray(n.topics) ? n.topics : [];
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

	for (const [i, l] of links.entries()) {
		const at = `links[${i}]`;
		if (!l || typeof l !== 'object') { E(`${at}: not an object`); continue; }
		if (!nodeIds.has(l.source)) E(`${at}: unknown source "${l.source}"`);
		if (!nodeIds.has(l.target)) E(`${at}: unknown target "${l.target}"`);
		if (l.source === l.target) E(`${at}: self-link on "${l.source}"`);
		if ('distance' in l && !(typeof l.distance === 'number' && l.distance > 0)) E(`${at}: distance must be a positive number`);
	}

	for (const [i, r] of relations.entries()) {
		const at = `relations[${i}]`;
		if (!r || typeof r !== 'object') { E(`${at}: not an object`); continue; }
		if (!RELS.has(r.rel)) E(`${at}: rel "${r.rel}" is not in the vocabulary`);
		if (r.offset != null && !offsetOk(r.offset)) E(`${at} ("${r.rel}"): offset must be [dx, dy] — two finite numbers`);
		const pairs = Array.isArray(r.pairs) ? r.pairs : [];
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

	for (const [k, c] of Object.entries(contexts)) {
		const at = `contexts["${k}"]`;
		if (!c || typeof c !== 'object') { E(`${at}: not an object`); continue; }
		const cn = Array.isArray(c.nodes) ? c.nodes : [];
		if (!cn.length) E(`${at}: nodes[] is empty`);
		for (const id of cn) if (!nodeIds.has(id)) E(`${at}: unknown node "${id}"`);
		if ('from' in c && !nodeIds.has(c.from)) E(`${at}: from "${c.from}" is not a node`);
		const cnSet = new Set(cn);
		for (const [wid, wv] of Object.entries(c.weights || {})) {
			if (!cnSet.has(wid)) E(`${at}.weights: "${wid}" is not one of this context's nodes`);
			if (typeof wv !== 'number' || wv < 0 || wv > 1) E(`${at}.weights["${wid}"]: ${wv} is not in [0, 1]`);
		}
	}
}
