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
  "something reusable across slides". Creates src/components/<kebab>/index.js,
  registers it in registry.js, optionally emits a slide. Refuses to redefine a
  component that already exists.
---

# artefact-builder

**Before anything: read `docs/framework-conventions.md`,
`src/components/README.md`, and `reference/component-styles.md`.**

## The hard rule: compose from `.box` / `.chip`, don't reinvent them

Any generic card, tag, pill, or row-of-either need in a new component is
`.box` / `.chip` (+ `.token-row` for a wrapping chip row) from
`component-styles.md`, copied verbatim into `static styles`. This is the same
"compose, never invent" instinct `slide-builder` enforces for slides, one layer
down for components. Bespoke component CSS is reserved for what those two
tiers genuinely can't express - SVG paths/connectors, canvas drawing,
physics-driven layout (a force-directed map and the like).

This is exactly what would have stopped two earlier components from each
independently declaring the same "row of chips" CSS as a bespoke `.line`
before `.token-row` existed in `component-styles.md` - copy `.chip` +
`.token-row`, don't re-derive them.

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
   block into the set of valid semantic names. Also parse root `deck.css`'s
   `TOPIC COLOURS` section for any `--topic-<name>` / `--topic-<name>-fg` pairs
   the deck has defined - these are also valid, deck-owned semantics, just not
   in `semantic.css`. For each custom property the component wants: if there is
   no matching semantic (tier-2 or `--topic-*`), **warn**, list the nearest
   names, and do **not** invent a primitive - tell the user to extend
   `semantic.css` / `deck.css`'s `TOPIC COLOURS`, or run `skin-builder`.
4. `slides/` + `slides/README.md` - only if emitting a slide.
5. Before hand-writing any chip/box/colour-modifier CSS, run
   `npm run check:vocab` - it confirms `deck.css` and `component-styles.md`
   haven't drifted. On failure, fix `component-styles.md` to match `deck.css`,
   never the reverse, before continuing.
6. **Pick the recipe** for the artefact kind and read it:

   | Kind (from the purpose) | Recipe |
   |---|---|
   | chart, graph, plot, data-bound viz | `reference/d3-chart.md` |
   | concept map, topics/ideas in space, circle packing, zoom-into-a-topic | `reference/d3-circle-pack.md` |
   | diagram, schematic, layers, flow, boxes-and-arrows, labelled picture | `reference/svg-diagram.md` |
   | hero title, section-break, one big entrance animation | `reference/gsap-hero.md` |
   | interactive: stepper, quiz, game, meter, tokeniser-style click-through | `reference/alpine-interactive.md` |
   | anything else (badge, card, static widget) | inline from `reference/component-template.js` |

## Write

1. Run `scripts/make-component.js` to do the mechanical scaffold - do not
   hand-write the skeleton or hand-edit `registry.js`:

   ```
   node scripts/make-component.js --name <kebab> --kind chart|circle-pack|diagram|hero|interactive|basic
   ```

   It aborts (matching the Read step 2 check) if the name/tag already exists,
   writes `src/components/<name>/index.js` from `reference/component-template.js`
   with `<Name>`/`<name>` substituted, and edits `registry.js` (import line +
   `COMPONENTS` entry, minimal diff, existing formatting preserved - the exact
   shape `reference/registry-edit.md` documents). Use `--dry-run` first if
   unsure. This is the mechanical part done; nothing here is kind-specific yet.
2. Flesh out `render()` / `static styles` in the generated `index.js` per the
   recipe picked in Read step 6. Pull shared visual pieces (button, chip, chip
   row (`.token-row`), note, meter, box) from `reference/component-styles.md`
   verbatim - never re-declare a per-artefact class pile.
3. optional: `slides/NN-<slug>.html` -
   `<section id="<slug>" data-slug="<slug>"><deck-<name> ...></deck-<name>></section>`,
   scaffolded via `slide-builder`'s `scripts/make-slide.js` (numbering delegated
   there, not re-derived here).

Never touch other components, `src/styles/**`, or the root `deck.css`.

## Procedure

1. Reads above; if the component exists, STOP (the script also enforces this).
2. Validate requested custom properties are a subset of the semantic set; halt on
   any that is not (with near-matches).
3. Run `scripts/make-component.js` (see Write step 1) to scaffold + register.
4. Fill in `index.js` per the chosen recipe: `static observedAttributes` (if
   any), `static styles` (Shadow DOM CSS - semantic vars only, shared pieces
   from `component-styles.md`), idempotent render.
5. Optional slide, via `scripts/make-slide.js`.
6. Report: new file path, the `registry.js` diff (from the script's own
   output), how to drop the tag on a slide, and that `npm start` hot-loads it.

## Consistency

Enforce the existing-component check. Semantic custom properties only - never a
primitive, never a raw literal, never per-slide CSS, never a bespoke class pile
(reuse `component-styles.md`). A component may `import` from `@/lib/*` (GSAP / D3
/ Alpine); keep D3 imports lazy. Alpine markup in a shadow root needs
`Alpine.initTree(this.shadowRoot)` behind a ready-guard - see
`reference/alpine-interactive.md`. Say "CSS custom property" / "CSS variable",
never "token".
