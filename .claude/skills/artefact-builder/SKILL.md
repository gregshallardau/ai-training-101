---
name: artefact-builder
description: >-
  Generate a canonical <deck-*> Custom Element for this reveal.js presentation
  framework - a reusable slide widget defined once and referenced by tag: a D3
  chart, an SVG diagram, a GSAP hero animation, or an interactive Alpine demo
  (stepper, quiz, meter, tokeniser-style click-through). Use when the user says
  "build me a component/widget", "new reusable slide element", "make a
  <deck-...>", "a chart/diagram/interactive component", "an animated demo", or
  "something reusable across slides". Creates src/components/<kebab>/index.js,
  registers it in registry.js, optionally emits a slide. Refuses to redefine a
  component that already exists.
---

# artefact-builder

**Before anything: read `docs/framework-conventions.md`,
`src/components/README.md`, and `reference/component-styles.md`.**

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
2. **`src/components/registry.js`** - parse the import lines and the `COMPONENTS`
   map. **If `deck-<name>` (or the `<name>` key) already exists -> STOP.** Print
   the existing `src/components/<name>/index.js` path and offer to help edit it
   instead. Never overwrite.
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
   | diagram, schematic, layers, flow, boxes-and-arrows, labelled picture | `reference/svg-diagram.md` |
   | hero title, section-break, one big entrance animation | `reference/gsap-hero.md` |
   | interactive: stepper, quiz, game, meter, tokeniser-style click-through | `reference/alpine-interactive.md` |
   | anything else (badge, card, static widget) | inline from `reference/component-template.js` |

## Write

- `src/components/<name>/index.js` (new) - from the recipe picked in Read step 5,
  layered on `reference/component-template.js`. Pull shared visual pieces (button,
  chip, note, meter, card) from `reference/component-styles.md` verbatim - never
  re-declare a per-artefact class pile.
- `src/components/registry.js` - add exactly:
  - one `import './<name>/index.js';` line, beside the others,
  - one `COMPONENTS` entry `'<name>': { tag: 'deck-<name>', dir: '<name>' },`
    keeping the existing formatting / ordering. Minimal diff.
  - See `reference/registry-edit.md`.
- optional: `slides/NN-<slug>.html` -
  `<section id="<slug>" data-slug="<slug>"><deck-<name> ...></deck-<name>></section>`
  using `slide-builder` numbering (read `slides/` for the next free number).

Never touch other components, `src/styles/**`, or the root `deck.css`.

## Procedure

1. Reads above; if the component exists, STOP.
2. Validate requested custom properties are a subset of the semantic set; halt on
   any that is not (with near-matches).
3. Generate `index.js` per the chosen recipe: `class extends DeckElement`,
   `static tag`, `static observedAttributes` (if any), `static styles` (Shadow
   DOM CSS - semantic vars only, shared pieces from `component-styles.md`),
   idempotent render, `customElements.define('deck-<name>', ...)`.
4. Edit `registry.js` (import + `COMPONENTS` entry).
5. Optional slide.
6. Report: new file path, the two-line `registry.js` diff, how to drop the tag on
   a slide, and that `npm start` hot-loads it.

## Consistency

Enforce the existing-component check. Semantic custom properties only - never a
primitive, never a raw literal, never per-slide CSS, never a bespoke class pile
(reuse `component-styles.md`). A component may `import` from `@/lib/*` (GSAP / D3
/ Alpine); keep D3 imports lazy. Alpine markup in a shadow root needs
`Alpine.initTree(this.shadowRoot)` behind a ready-guard - see
`reference/alpine-interactive.md`. Say "CSS custom property" / "CSS variable",
never "token".
