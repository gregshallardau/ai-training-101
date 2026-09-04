# Authoring the ideas map

How to make `<deck-ideas-map>` *your* map — your domains, your words, the
relationships and contexts your talk demonstrates — and wire it onto slides in
the right state per beat.

This is content + slide wiring. It never edits the component's JavaScript
(`index.js`, `render.js`, `simulation.js`, `camera.js`, `palette.js`). Behaviour
changes go through `artefact-builder` against `./design.md`.

**Read alongside this:** `./design.md` (behaviour + attribute API + data shape —
the source of truth), `./attributes.md` (the per-slide state cheatsheet),
`./storyboard.html` (the key views rendered), and the repo's
`docs/framework-conventions.md` + `docs/cheatsheet.md`.

## What this is

`<deck-ideas-map>` is the deck's spine: one force-directed graph of ideas, reused
across many slides, driven per-slide by attributes. It goes from a dim **star
map** (loose colour-coded topic clusters) to a lit **constellation** (a context's
ideas activated, attention edges between them).

## Detect state first

1. `src/components/registry.js` — is `ideas-map` / `deck-ideas-map` registered?
   - **Not registered** → the component is not built. The next step is
     `artefact-builder` against `./design.md` §10, not authoring.
   - **Registered** → read `./index.js` + `./dataset.json` + `./dataset.js` to
     see which attributes and `DATASET` shape actually ship (design.md is the
     design; the code is what exists). Author against the code.
2. `slides/` — which slides already place `<deck-ideas-map>` and in what state.
3. Any presentation plan the user points at — for the list of ideas and the beats
   the map must hit.

## Procedure

The authored map is **node-centric**: one flat `nodes` list where EVERYTHING
about an idea sits on that idea's entry. There is no separate topics / links /
relations / contexts section — clusters derive from the `topic` values in the
list, links gather from each idea's `links`, relation steps live on the source
idea, and contexts collect from membership + `from` markers.

1. **Elicit the map** (one topic at a time, multiple-choice where you can):
   - the **domains/topics** the talk covers — each becomes a `topic` value,
     colour-coded; clusters are invented on the fly by giving an idea
     `"topic": "new-slug"`;
   - the **key words/ideas** per topic (`nodes`, one entry each: `id`, optional
     `name`, `topic`; an idea in two topics adds the second in `also`);
   - the **relationships** to demonstrate — directed steps written ONCE on the
     source idea: `rels: [{ "rel": "gender", "to": "woman", "offset": [-90, 0] }]`.
     Each step carries its own vector (any angle; keep common relations at
     distinct angles; think in steps of `D = 90`). Steps are per-step editable,
     so "not exact" gaps are fine — but the map's parallelogram demo
     (`son→daughter == king→queen`) only holds while the steps of a rel share
     one vector;
   - the **associations** for the word-web (`links: ["other-idea-id"]`);
   - the **contexts** the talk builds up — membership + weight on each idea
     (`contexts: { "royalty": 0.7 }`), the focus idea marked `from: ["royalty"]`.
     Layers compose via `activate="a,b,c"`.
2. **Draft the `DATASET`** from `./dataset-template.jsonc`. Real words, no
   placeholders. Start ~6–10 topics / ~40–60 nodes; it can grow. For a *large*
   map (hundreds+), use `./seed/` instead (bulk batches are flat; the component
   accepts both shapes).
3. **Place it.** Either inline on a slide — `<deck-ideas-map data='{...}' ...>`
   (Shape 2, no `<style>`, same node-centric JSON) — or, if every slide uses the
   same map, edit the built-in `./dataset.json` (data only, no code).
4. **Wire the beats.** For each slide that shows the map, pick the state from
   `./attributes.md` and `./storyboard.html`: star map (`mode="star-map"` or
   `labels="none"`), name the ideas (`labels="all"`), relationship
   (`spotlight="<rel>"`), web (`show-links`), tag (`tag="..."`), scope
   (`scope="..."`), constellation (`activate="..."` + `attention-from` +
   `constellation`), growing across fragments. Keep each slide Shape 2.
5. **Tune notes.** If the layout needs adjusting (clusters not overlapping,
   parallelograms drifting, frame under/overfilled), record the `SEED` / force
   constants to try — see the tuning-guide comment in `./dataset.js` — and hand
   the actual change to `artefact-builder`.
6. **Report:** the `DATASET` (or its diff), the per-slide tag placements, and
   anything handed off to `artefact-builder`.

## Boundary

- **Authoring (this doc / the `ideas-map` skill):** the node-centric `DATASET`
  (`dataset.json`, a `data='...'` attribute, or a merged `seed/` file) — each
  idea entry with `topic` / `name` / `also` / `links` / `rels` (+ per-step
  `offset`) / `contexts` / `from`, plus `topicLabels` — the per-slide attribute
  state, tuning *recommendations*.
- **`artefact-builder`:** any change to `./index.js` / `./render.js` /
  `./simulation.js` / `./camera.js` / `./palette.js` / `./dataset.js` (force
  constants, `expandDataset`) — new attributes, `forceRelations`, the colour
  scale, the attention layer, adopting a deferred design.md §12 overlay.
- **`slide-builder`:** adding / reordering / renumbering slides.
- Semantic CSS custom properties only; the component owns all styling — a slide
  never carries `<style>` for the map.
