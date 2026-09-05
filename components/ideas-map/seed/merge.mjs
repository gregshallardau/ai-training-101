#!/usr/bin/env node
// Merge <deck-ideas-map> batch files into one DATASET, then validate it.
// No dependencies.
//
//   node merge.mjs out.json batch-a.json batch-b.json ...
//   node merge.mjs out.json batch-*.json     (shell expands the glob)
//
// Batches are concatenated as-is (ids are expected to be domain-namespaced,
// `bio.cell` etc. — see ./generation-prompt.md). Only needed if you split the
// dataset across files; a single hand- or LLM-written file goes straight to
// ./validate.mjs. This step:
//   - drops a later duplicate topic/node id (keeps the first, warns)
//   - drops a link/relation-pair whose endpoints don't resolve after the merge
//     (warns) — so a stitch batch that references a typo'd id degrades instead
//     of failing the whole run
//   - writes out.json, then runs validate.mjs on it

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const [, , out, ...files] = process.argv;
if (!out || !files.length) {
	console.error('usage: node merge.mjs out.json batch-*.json');
	process.exit(2);
}

const merged = { topics: [], nodes: [], links: [], relations: [], contexts: {} };
const topicIds = new Set();
const nodeIds = new Set();
let dupT = 0; let dupN = 0;

for (const f of files) {
	let b;
	try { b = JSON.parse(readFileSync(f, 'utf8')); }
	catch (e) { console.error(`✘ ${f}: ${e.message}`); process.exit(1); }

	for (const t of b.topics || []) {
		if (topicIds.has(t.id)) { dupT++; continue; }
		topicIds.add(t.id); merged.topics.push(t);
	}
	for (const n of b.nodes || []) {
		if (nodeIds.has(n.id)) { dupN++; continue; }
		nodeIds.add(n.id); merged.nodes.push(n);
	}
	for (const l of b.links || []) merged.links.push(l);
	for (const r of b.relations || []) merged.relations.push(r);
	for (const [k, c] of Object.entries(b.contexts || {})) {
		if (merged.contexts[k]) console.warn(`⚠ context "${k}" in ${f} overwrites an earlier one`);
		merged.contexts[k] = c;
	}
}

// prune dangling references so a stitch typo doesn't fail the whole merge
const beforeL = merged.links.length;
merged.links = merged.links.filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target) && l.source !== l.target);
const prunedL = beforeL - merged.links.length;

let prunedP = 0;
for (const r of merged.relations) {
	const before = r.pairs.length;
	r.pairs = (r.pairs || []).filter((p) => Array.isArray(p) && p.length === 2 && nodeIds.has(p[0]) && nodeIds.has(p[1]) && p[0] !== p[1]);
	prunedP += before - r.pairs.length;
}
merged.relations = merged.relations.filter((r) => r.pairs.length);

writeFileSync(out, JSON.stringify(merged, null, '\t') + '\n');

const say = (n, what) => n && console.warn(`⚠ dropped ${n} ${what}`);
say(dupT, 'duplicate topic id(s)');
say(dupN, 'duplicate node id(s)');
say(prunedL, 'link(s) with an unresolved endpoint');
say(prunedP, 'relation pair(s) with an unresolved endpoint');
console.log(`wrote ${out} — ${merged.topics.length} topics, ${merged.nodes.length} nodes\n`);

const here = dirname(fileURLToPath(import.meta.url));
try {
	execFileSync(process.execPath, [join(here, 'validate.mjs'), out], { stdio: 'inherit' });
} catch {
	process.exit(1); // validate.mjs already printed the errors
}
