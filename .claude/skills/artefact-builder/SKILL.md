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

## The hard rule: compose from `.box` / `.chip`, don't reinvent them

Component **implementations** live at the repo-root `components/` (deck
content, same standing as `slides/`); the base class, registry, and shared
style vocabulary they import are framework machinery in `src/components/` and
never move.

Any generic card, tag, pill, or row-of-either need in a new component is
`.box` / `.chip` (+ `.token-row` for a wrapping chip row) from
`SHARED_STYLES` (`@/components/shared-styles.js`) - **import it, never copy
its rules** (a hand-pasted copy is the one thing guaranteed to drift the next
time `shared-styles.js` changes). This is the same "compose, never invent"
instinct `slide-builder` enforces for slides, one layer down for components.
Bespoke component CSS is reserved for what those two tiers genuinely can't
express - SVG paths/connectors, canvas drawing, physics-driven layout (a
force-directed map and the like).

This is exactly what would have stopped two earlier components from each
independently declaring the same "row of chips" CSS as a bespoke `.line`
before `.token-row` existed in the shared vocabulary - import `SHARED_STYLES`
(which includes `.chip` and `.token-row`), don't re-derive them.

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
   block into the set of valid semantic names. Also parse root `deck.css`'s
   `TOPIC COLOURS` section for any `--topic-<name>` / `--topic-<name>-fg` pairs
   the deck has defined - these are also valid, deck-owned semantics, just not
   in `semantic.css`. For each custom property the component wants: if there is
   no matching semantic (tier-2 or `--topic-*`), **warn**, list the nearest
   names, and do **not** invent a primitive - tell the user to extend
   `semantic.css` / `deck.css`'s `TOPIC COLOURS`, or run `skin-builder`.
4. `slides/` + `slides/README.md` - only if emitting a slide.
5. Before hand-writing any chip/box/colour-modifier CSS, run
   `npm run check:vocab` - it confirms `deck.css` and
   `src/components/shared-styles.js` haven't drifted. On failure, fix
   `shared-styles.js` to match `deck.css`, never the reverse, before continuing.
6. **Pick the recipe** for the artefact kind and read it:

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

1. Run `scripts/make-component.js` to do the mechanical scaffold - do not
   hand-write the skeleton:

   ```
   node scripts/make-component.js --name <kebab> --kind <kind>
   ```

   (`<kind>` is one of the Read-step-6 table's keys: `chart`, `circle-pack`,
   `diagram`, `hero`, `interactive`, `radial-meter`, `animated-counter`,
   `stat-tiles`, `timeline-stepper`, `confidence-bars`, or `basic`.) It aborts
   (matching the Read step 2 check) if `components/<name>/` already exists,
   and writes `components/<name>/index.js` (repo root) from
   `reference/component-template.js` with `<Name>`/`<name>` substituted -
   `SHARED_STYLES` is already imported and prepended in the template. Use
   `--dry-run` first if unsure. **Nothing else to register** -
   `src/components/registry.js` auto-discovers it at build time; the script
   does not (and must not) touch `registry.js`. This is the mechanical part
   done; nothing here is kind-specific yet.
2. Flesh out `render()` / `static styles` in the generated `index.js` per the
   recipe picked in Read step 6. Pull any further shared visual pieces from
   `SHARED_STYLES` (button, chip, chip row (`.token-row`), note, meter, box) -
   never re-declare a per-artefact class pile.
3. optional: `slides/NN-<slug>.html` -
   `<section id="<slug>" data-slug="<slug>"><deck-<name> ...></deck-<name>></section>`,
   scaffolded via `slide-builder`'s `scripts/make-slide.js` (numbering delegated
   there, not re-derived here).

Never touch other components, `src/components/*` (machinery), `src/styles/**`,
or the root `deck.css`.

## Procedure

1. Reads above; if the component exists, STOP (the script also enforces this).
2. Validate requested custom properties are a subset of the semantic set; halt on
   any that is not (with near-matches).
3. Run `scripts/make-component.js` (see Write step 1) to scaffold.
4. Fill in `index.js` per the chosen recipe: `static observedAttributes` (if
   any), `static styles` (`${SHARED_STYLES}` plus semantic-var-only rules of
   its own), idempotent render.
5. Optional slide, via `scripts/make-slide.js`.
6. Report: new file path, how to drop the tag on a slide, and that `npm start`
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
