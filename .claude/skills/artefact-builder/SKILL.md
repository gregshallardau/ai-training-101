---
name: artefact-builder
description: >-
  Generate a canonical <deck-*> Custom Element for this reveal.js presentation
  framework - a reusable slide widget (diagram, badge, card, chart, animated
  hero) defined once and referenced by tag. Use when the user says "build me a
  component/widget", "new reusable slide element", "make a <deck-...>", "a
  diagram/chart/card component", or "something reusable across slides". Creates
  src/components/<kebab>/index.js, registers it in registry.js, and optionally
  emits a slide that uses it. Refuses to redefine a component that already exists.
---

# artefact-builder

**Before anything: read `docs/framework-conventions.md` and
`src/components/README.md`.**

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

## Write

- `src/components/<name>/index.js` (new) - from `reference/component-template.js`.
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
3. Generate `index.js`: `class extends DeckElement`, `static tag`, `static
   observedAttributes` (if any), `static styles` (Shadow DOM CSS, semantic vars
   only), idempotent render, `customElements.define('deck-<name>', ...)`.
4. Edit `registry.js` (import + `COMPONENTS` entry).
5. Optional slide.
6. Report: new file path, the two-line `registry.js` diff, how to drop the tag on
   a slide, and that `npm start` hot-loads it.

## Consistency

Enforce the existing-component check. Semantic custom properties only - never a
primitive, never a raw literal, never per-slide CSS. A component may `import` from
`@/lib/*` (GSAP / D3 / Alpine); keep D3 imports lazy. Say "CSS custom property" /
"CSS variable", never "token".
