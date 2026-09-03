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

**Before anything: read**
- `docs/superpowers/specs/2026-09-03-ideas-map-design.md` - the component design spec (the source of truth for behaviour, the attribute API, and the data shape).
- `docs/framework-conventions.md` and `docs/cheatsheet.md` - the deck rules.
- `slides/README.md` - if wiring the tag onto slides.

**Storyboard / live reference:** the seven-plus-"up the sleeve" key views are in
`docs/superpowers/specs/2026-09-03-ideas-map-storyboard.html`, published as an
Artifact at <https://claude.ai/code/artifact/dc3b413d-cd03-4955-96c1-86b98084fc11>.
Open it to show the presenter what each state looks like before choosing beats.

## What this is

`<deck-ideas-map>` is the deck's spine: one force-directed graph of ideas, reused
across many slides, driven per-slide by attributes. It goes from a dim **star
map** (loose colour-coded topic clusters) to a lit **constellation** (a context's
ideas activated, attention edges between them). It is close to an app in itself -
a presenter will want to make it *their* map: their domains, their words, the
relationships and contexts their talk demonstrates.

**This skill authors content and slide wiring. It never edits
`src/components/ideas-map/index.js`.** Component behaviour changes go through
`artefact-builder` against the spec.

## Read (detect state)

1. The spec + deck docs above.
2. **`src/components/registry.js`** - is `ideas-map` / `deck-ideas-map` registered?
   - **Not registered** -> the component has not been built yet. Say so; the next
     step is `artefact-builder` against the spec (design phase §10), not this
     skill. Offer to hand off.
   - **Registered** -> read `src/components/ideas-map/index.js` to see which
     attributes and the `DATASET` shape it actually ships (the spec is the
     design; the code is what exists). Author against the code.
3. `slides/` - which slides already place `<deck-ideas-map>` and in what state.
4. Any presentation plan / outline the user points at - for the list of ideas and
   the beats the map must hit.

## Procedure

1. **Elicit the map** (one topic at a time, multiple-choice where you can):
   - the **domains/topics** the talk covers (these become `topics`, colour-coded);
   - the **key words/ideas** per topic (`nodes`, with `topics: [...]`; a word in
     two topics sits between clusters);
   - the **relationships** to demonstrate (`relations` + one `RELATION_OFFSETS`
     direction each - any angle; keep the common ones at distinct angles) -
     relationships are topic-agnostic (`gender` can span family, animals,
     clothing);
   - the **associations** for the word-web (`links`);
   - the **contexts** the talk builds up (`contexts`: named activation sets with a
     `from` node and per-node `weights`; layers compose via
     `activate="a,b,c"`).
2. **Draft the `DATASET`** from `reference/dataset-template.jsonc`. Keep it one
   JSON block. Real words, no placeholders. Start ~6-10 topics / ~40-60 nodes;
   it can grow.
3. **Place it.** Either:
   - inline on a slide: `<deck-ideas-map data='{...}' ...>` (Shape 2, no `<style>`);
   - or, if every slide uses the same map, propose overriding the built-in
     `DATASET` const in the component - which is an `artefact-builder` change,
     not this skill.
4. **Wire the beats.** For each slide that shows the map, pick the state from
   `reference/attributes.md` and the storyboard: star map (`labels="none"`),
   name the ideas (`labels="all"`), relationship (`spotlight="<rel>"`), web
   (`show-links`), tag (`tag="..."`), scope (`scope="..."`), constellation
   (`activate="..."` + `attention-from` + `constellation`), growing across
   fragments. Keep each slide Shape 2.
5. **Tune notes.** If the layout needs adjusting (clusters not overlapping,
   parallelograms drifting, frame under/overfilled), record the `SEED` / force
   constants to try - and hand the actual change to `artefact-builder`.
6. **Report:** the `DATASET` (or its diff), the per-slide tag placements, the
   storyboard link, and anything handed off to `artefact-builder`.

## Boundary

- **This skill:** the `DATASET` (topics / nodes / links / relations /
  `RELATION_OFFSETS` / contexts), the `data='...'` attribute on slides, the
  per-slide attribute state, tuning *recommendations*.
- **`artefact-builder`:** any change to `src/components/ideas-map/index.js` -
  new attributes, the force constants, `forceRelations`, the colour scale, the
  attention layer, adopting a deferred §12 overlay.
- **`slide-builder`:** adding / reordering / renumbering the slides themselves.
- Semantic CSS custom properties only; the component owns all styling - a slide
  never carries `<style>` for the map.
