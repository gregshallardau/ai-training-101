---
name: ideas-map
description: >-
  Customise the deck's key artifact - the <deck-ideas-map> force-directed
  "constellation of ideas" - to a specific presentation. Use when the user says
  "customise the ideas map", "set up the constellation map for my talk", "add my
  topics/words to the map", "wire the ideas map onto slide X", "make the map
  activate <these ideas>", "tune the map layout", or "/ideas-map". Authors the
  DATASET (topics, nodes, links, relations, RELATION_OFFSETS, contexts) and wires
  the <deck-ideas-map> tag onto slides in the right state per beat. Does NOT
  change the component's JavaScript - that is artefact-builder's job.
---

# ideas-map

The artifact is self-contained in **`src/components/ideas-map/`**. This skill is
a thin entry point; the procedure lives with the code.

**Do this:**

1. Read `src/components/ideas-map/README.md` — the index of the whole artifact.
2. Follow `src/components/ideas-map/authoring.md` — the step-by-step: detect
   state, elicit the map, draft the `DATASET`, wire the per-slide beats.
3. Reference as you go: `src/components/ideas-map/design.md` (behaviour +
   attribute API + data shape — source of truth),
   `src/components/ideas-map/attributes.md` (per-slide state cheatsheet),
   `src/components/ideas-map/storyboard.html` (the key views rendered),
   `src/components/ideas-map/dataset-template.jsonc` (annotated starter).
4. Also read the deck rules: `docs/framework-conventions.md`,
   `docs/cheatsheet.md`, and `slides/README.md` if wiring the tag onto slides.

**For a large map** (hundreds+ of topics), use the `ideas-map-seed` skill /
`src/components/ideas-map/seed/` instead of hand-authoring.

**Boundary:** this skill authors the `DATASET` and per-slide attribute state
only. Any change to `src/components/ideas-map/*.js` goes through
`artefact-builder` against `design.md`. Adding / reordering slides is
`slide-builder`. Semantic CSS custom properties only — a slide never carries
`<style>` for the map.
