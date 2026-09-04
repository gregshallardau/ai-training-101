---
name: ideas-map-seed
description: >-
  Generate a large <deck-ideas-map> DATASET (hundreds to thousands of topics)
  with a local LLM, then validate and merge it. Use when the user says "seed the
  ideas map", "generate 1000 topics for the map", "bulk-build the map dataset",
  "make a big knowledge map", or "/ideas-map-seed". Produces batch-generation
  prompts, a fixed relation vocabulary, a no-deps validator, and a merge script.
  Companion to the `ideas-map` skill (which does hand authoring + slide wiring).
---

# ideas-map-seed

**Read first:** `docs/superpowers/specs/2026-09-03-ideas-map-design.md` §4 (data
model) and `reference/schema.md` here. The component is
`src/components/ideas-map/`; its data contract is what a seeded dataset must
satisfy.

## What this does

A hand-authored map tops out around ~60 nodes. To seed a *large* one — a domain
map of hundreds or thousands of topics — you drive a local LLM in batches, then
validate and stitch the batches into one `DATASET`. This skill gives you:

- `reference/schema.md` — the exact JSON shape + a JSON Schema.
- `reference/relation-vocabulary.md` — the **closed set** of relation names and
  their authored offset vectors. The LLM picks names from this list only; it
  never invents geometry.
- `reference/generation-prompt.md` — the per-batch prompt to hand the local LLM.
- `scripts/validate.mjs` — `node scripts/validate.mjs file.json` — checks every
  invariant the component depends on. Exit 0 = safe to load.
- `scripts/merge.mjs` — `node scripts/merge.mjs out.json batch-*.json` — id-namespaces
  and concatenates batches into one dataset, then runs the validator.

## Procedure

1. **Pick the shape of the map** with the user: the top-level domains (Science,
   Arts, Everyday, Places, Language…), roughly how many topics total, and which
   relations matter for the talk (from `reference/relation-vocabulary.md`).
2. **Extend `RELATION_OFFSETS`.** The shipped `src/components/ideas-map/dataset.js`
   defines only a few. Copy the full block from
   `reference/relation-vocabulary.md` into `dataset.js` (or run `artefact-builder`
   to do it) so every vocabulary name resolves. The validator's allowed-`rel`
   list is that same vocabulary.
3. **Generate in batches.** One batch = one domain (or sub-domain): ~20–40
   topics, ~5–15 nodes each, plus that batch's internal links and relations.
   For each batch, fill the placeholders in `reference/generation-prompt.md`
   (domain name, topic budget, allowed relations) and run it through the local
   LLM. Save each batch as `batch-<slug>.json`. Namespace every id with the
   domain slug (`bio.cell`, `music.mozart`) — the merge step relies on this to
   avoid collisions.
4. **Stitch pass (optional).** One more LLM call for cross-domain links and
   relations (e.g. `music.mozart` → `places.vienna`) — same schema, only `links`
   and `relations`, referencing ids from any batch. Save as `batch-stitch.json`.
5. **Merge + validate:**
   `node .claude/skills/ideas-map-seed/scripts/merge.mjs dataset.json batch-*.json`
   — writes `dataset.json`, then validates it. Fix any errors it names (they
   point at the offending id) and re-run.
6. **Wire it in.** Either:
   - drop it on one slide: `<deck-ideas-map data='<contents of dataset.json>'>` —
     large blobs are fine as a single-line attribute; or
   - make it the built-in: replace the `DATASET` const in `dataset.js` (an
     `artefact-builder` change), keeping the exported constants and
     `RELATION_OFFSETS` above it.
7. **Tune for scale.** A 1000-node force sim needs a bigger `WARMUP` and a
   smaller `CHARGE` magnitude / `LINK_DIST` so it settles inside the frame — see
   the tuning-guide comment in `dataset.js` and the `/ideas-map` skill. Consider
   `reveal="N"` on the opening slides so only a few domains show at first.

## Boundaries

- **This skill:** generation prompts, the relation vocabulary, validation, merge.
- **`ideas-map`:** hand-authoring a small dataset, wiring the tag onto slides.
- **`artefact-builder`:** any change to `src/components/ideas-map/*.js`
  (extending `RELATION_OFFSETS`, swapping the built-in `DATASET`, force constants).
- The LLM output is data, never code. Never let a generated `rel` name outside
  the vocabulary through — the validator rejects it; do not add offsets on the
  fly to make it pass.
