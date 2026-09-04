---
name: ideas-map-seed
description: >-
  Generate a large <deck-ideas-map> DATASET (hundreds to thousands of topics)
  with a local LLM, then validate it. Use when the user says "seed the ideas
  map", "generate 1000 topics for the map", "bulk-build the map dataset", "make a
  big knowledge map", or "/ideas-map-seed". Provides a JSON schema, a fixed
  relation vocabulary, a generation prompt, a no-deps validator, and an optional
  merge script. Companion to the `ideas-map` skill (hand authoring + slide
  wiring).
---

# ideas-map-seed

The artifact is self-contained in **`src/components/ideas-map/`**. Everything for
seeding is in **`src/components/ideas-map/seed/`**. This skill is a thin entry
point.

**Do this:**

1. Read `src/components/ideas-map/README.md`, then `src/components/ideas-map/seed/schema.md`
   (the exact JSON shape + a JSON Schema) and `src/components/ideas-map/design.md`
   §4 (data model). A seeded dataset must satisfy that contract.
2. Pick the shape of the map with the user: the top-level domains, roughly how
   many topics total, and which relations matter (from
   `src/components/ideas-map/seed/relation-vocabulary.md` — a **closed set**; the
   LLM picks names from it, never invents geometry).
3. **Extend `RELATION_OFFSETS`** in `src/components/ideas-map/dataset.js` so
   every vocabulary name it will use resolves (paste-in block is at the bottom of
   `relation-vocabulary.md`; an `artefact-builder` change if you want it done
   properly). The validator's allowed-`rel` list is that same vocabulary.
4. **Generate.** Fill the `<<…>>` placeholders in
   `src/components/ideas-map/seed/generation-prompt.md` and run it through the
   local LLM. One file is fine. Splitting into per-domain batches is **optional**
   — see "One file or many?" below.
5. **Validate:** `node src/components/ideas-map/seed/validate.mjs dataset.json`.
   Exit 0 = safe to load. Fix any errors it names (they point at the offending
   id) and re-run.
6. **Wire it in.** Either drop it on one slide
   (`<deck-ideas-map data='<contents of dataset.json>'>` — a large single-line
   attribute is fine) or replace the `DATASET` const in
   `src/components/ideas-map/dataset.js` (an `artefact-builder` change), keeping
   the exported constants + `RELATION_OFFSETS` above it.
7. **Tune for scale.** A large force sim needs a bigger `WARMUP` and a smaller
   `CHARGE` magnitude / `LINK_DIST` to settle inside the frame — see the
   tuning-guide comment in `dataset.js`. Consider `reveal="N"` on opening slides
   so only a few domains show at first.

## One file or many?

**You do not have to split by domain.** The schema, `generation-prompt.md`, and
`validate.mjs` all work on a single file. Batching is only a reliability aid for
*local* LLMs:

- Small local models truncate or emit invalid JSON when asked for one massive
  output. A few hundred topics per call stays well inside their context and
  output limits.
- Per-domain regeneration is cheap — redo one weak batch instead of the whole
  map.
- Namespaced ids (`bio.cell`, `music.mozart`) keep domains from colliding and
  make cross-domain "stitch" links easy to add later.

If you do batch: save each reply as `batch-<slug>.json`, optionally add one
`batch-stitch.json` for cross-domain links/relations, then
`node src/components/ideas-map/seed/merge.mjs dataset.json batch-*.json` —
it id-dedupes, prunes dangling references, writes the file, and runs the
validator. If you generated one file, skip `merge.mjs` entirely.

## Boundaries

- **This skill:** the generation prompt, the relation vocabulary, validation,
  optional merge.
- **`ideas-map`:** hand-authoring a small dataset, wiring the tag onto slides.
- **`artefact-builder`:** any change to `src/components/ideas-map/*.js`
  (extending `RELATION_OFFSETS`, swapping the built-in `DATASET`, force
  constants).
- The LLM output is data, never code. Never let a `rel` name outside the
  vocabulary through — the validator rejects it; do not add offsets on the fly
  to make it pass.
