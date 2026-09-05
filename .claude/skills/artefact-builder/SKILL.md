---
name: artefact-builder
description: >-
  Generate a canonical <deck-*> Custom Element for this reveal.js presentation
  framework - a reusable slide widget defined once and referenced by tag: a D3
  chart, a zoomable concept map / circle packing, an SVG diagram, a GSAP hero
  animation, or an interactive Alpine demo (stepper, quiz, meter, tokeniser-style
  click-through). Use when the user says
  "build me a component/widget", "new reusable slide element", "make a
  <deck-...>", "a chart/diagram/interactive component", "an animated demo", or
  "something reusable across slides". Creates components/<kebab>/index.js (repo
  root - deck content, not src/); src/components/registry.js auto-discovers it,
  no manual registration. Optionally emits a slide. Refuses to redefine a
  component that already exists.
---

# artefact-builder

**Before anything: read `docs/framework-conventions.md`,
`src/components/README.md`, and `reference/component-styles.md`.**

Component **implementations** live at the repo-root `components/` (deck
content, same standing as `slides/`); the base class, registry, and shared
style vocabulary they import are framework machinery in `src/components/` and
never move.

## Inputs

- component name (kebab) -> tag `deck-<name>`
- purpose / behaviour
- which **semantic** custom properties it should consume
- observed attributes (name -> meaning)
- whether to also emit a slide, and roughly where (numbering delegated to
  `slide-builder` conventions)

## Read (detect state)

1. `docs/framework-conventions.md`, `src/components/README.md`,
   `src/components/deck-element.js` (base-class API).
2. **`components/`** (repo root) - list its folders (this **is** the manifest;
   `src/components/registry.js` auto-discovers whatever is here, there is no
   separate list to parse). **If a `components/<name>/` folder (or `deck-<name>`
   tag) already exists -> STOP.** Print its `index.js` path and offer to help
   edit it instead. Never overwrite.
3. **`src/styles/vars/semantic.css`** - parse `:root` and every `[data-theme]`
   block into the set of valid semantic names. For each custom property the
   component wants: if there is no matching semantic, **warn**, list the nearest
   names, and do **not** invent a primitive - tell the user to extend
   `semantic.css` or run `skin-builder`.
4. `slides/` + `slides/README.md` - only if emitting a slide.
5. **Pick the recipe** for the artefact kind and read it:

   | Kind (from the purpose) | Recipe |
   |---|---|
   | chart, graph, plot, data-bound viz | `reference/d3-chart.md` |
   | concept map, topics/ideas in space, circle packing, zoom-into-a-topic | `reference/d3-circle-pack.md` |
   | diagram, schematic, layers, flow, boxes-and-arrows, labelled picture | `reference/svg-diagram.md` |
   | hero title, section-break, one big entrance animation | `reference/gsap-hero.md` |
   | interactive with its own internal state: quiz, game, tokeniser-style click-through | `reference/alpine-interactive.md` |
   | 0-100 circular fill, confidence/completion dial | `reference/radial-meter.md` |
   | a number ticking up to a target on slide arrival | `reference/animated-counter.md` |
   | row of big numbers with labels (KPI strip) | `reference/stat-tiles.md` |
   | horizontal pipeline/process walkthrough, "you are here" indicator | `reference/timeline-stepper.md` |
   | horizontal bars comparing a few labelled values | `reference/confidence-bars.md` |
   | anything else (badge, card, static widget) | inline from `reference/component-template.js` |

## Write

- `components/<name>/index.js` (new, repo root) - from the recipe picked in
  Read step 5, layered on `reference/component-template.js`. Import
  `SHARED_STYLES` from `@/components/shared-styles.js` for any shared visual
  piece (button, chip, note, meter, card) - never copy its rules, never
  re-declare a per-artefact class pile.
- Nothing else to register - `src/components/registry.js` auto-discovers any
  `components/<name>/index.js` at build time. Do not touch `registry.js`.
- optional: `slides/NN-<slug>.html` -
  `<section id="<slug>" data-slug="<slug>"><deck-<name> ...></deck-<name>></section>`
  using `slide-builder` numbering (read `slides/` for the next free number).

Never touch other components, `src/components/*` (machinery), `src/styles/**`,
or the root `deck.css`.

## Procedure

1. Reads above; if the component exists, STOP.
2. Validate requested custom properties are a subset of the semantic set; halt on
   any that is not (with near-matches).
3. Generate `index.js` per the chosen recipe: `class extends DeckElement`,
   `static tag`, `static observedAttributes` (if any), `static styles` (Shadow
   DOM CSS - `${SHARED_STYLES}` plus semantic-var-only rules of its own),
   idempotent render, `customElements.define('deck-<name>', ...)`.
4. Optional slide.
5. Report: new file path, how to drop the tag on a slide, and that `npm start`
   picks it up (auto-discovered, no registry edit needed).

## Consistency

Enforce the existing-component check. Semantic custom properties only - never a
primitive, never a raw literal, never per-slide CSS, never a bespoke class pile
(import `SHARED_STYLES` from `@/components/shared-styles.js`, never copy its
rules - see `component-styles.md`). A component may `import` from `@/lib/*` (GSAP / D3
/ Alpine); keep D3 imports lazy. Alpine markup in a shadow root needs
`Alpine.initTree(this.shadowRoot)` behind a ready-guard - see
`reference/alpine-interactive.md`. Say "CSS custom property" / "CSS variable",
never "token".
