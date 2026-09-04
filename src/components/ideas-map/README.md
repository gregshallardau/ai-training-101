# `<deck-ideas-map>` — The Ideas in Space

The deck's key artifact: one force-directed "map of meaning" reused across many
slides, driven per-slide by attributes. It goes from a dim **star map** (loose
colour-coded topic clusters) to an association **web** to a lit **constellation**
(a context's ideas activated, attention edges between them). It visualises the
word2vec regularity from [arxiv 1301.3781](https://arxiv.org/pdf/1301.3781) —
*meaning is relative position; a relationship is a constant offset vector that
holds across topics* ("one step left = son→daughter AND king→queen").

Everything for the artifact lives in this folder.

## Component code (change via `artefact-builder`)

| File | Responsibility |
|---|---|
| `index.js` | the `DeckElement` — attribute API, state derivation, controls, drag, camera wiring |
| `render.js` | `drawGraph(svg, state)` — pure SVG painting, 5 layers, no attribute parsing |
| `simulation.js` | `buildSimulation()` — seeded + settled + frozen d3 force sim; `forceRelations` |
| `camera.js` | `bboxOf()` + `makeCamera()` — view-state `[cx, cy, w]`, `interpolateZoom` |
| `palette.js` | `topicColors()` — generated HCL topic hue wheel off `--primary` |
| `dataset.js` | the built-in `DATASET`, `RELATION_OFFSETS` (the only authored geometry), force constants + tuning guide |

Registered in `src/components/registry.js`. Tests: `test/ideas-map.html`
(`node scripts/test.js`).

## Authoring & docs

| File | What it's for |
|---|---|
| `design.md` | the design spec — behaviour, attribute API, data shape. Source of truth. |
| `plan.md` | the implementation plan (15 TDD tasks) this was built from. |
| `storyboard.html` | the key views rendered — open it to show what each state looks like. |
| `authoring.md` | how to make it *your* map: author the `DATASET`, wire slides per beat. |
| `attributes.md` | per-slide state cheatsheet (one row per beat). |
| `dataset-template.jsonc` | annotated starting point for a hand-authored `DATASET`. |
| `seed/` | bulk-generate a large `DATASET` with a local LLM — schema, relation vocabulary, prompt, validator, merge. |

## Standalone page

`standalone.html` — the artifact full-viewport with no reveal.js, usable on a
phone. Served by the dev server at
`/src/components/ideas-map/standalone.html`.

## Skills

`/ideas-map` (author a dataset + wire slides) and `/ideas-map-seed` (bulk-seed a
large one) are thin entry points — their `.claude/skills/*/SKILL.md` files point
back here.
