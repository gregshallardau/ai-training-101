# Design: `<deck-ideas-map>` — the deck's key artifact

**Date:** 2026-09-03
**Status:** approved for planning
**Component:** `src/components/ideas-map/index.js` → tag `deck-ideas-map`

---

## 1. Purpose

One recurring visual that threads the whole deck: a **map of meaning**. It starts
(slide 3, "Ideas in Space") as labelled regions of disconnected word-points —
"our brain keeps different ideas in different places; you can draw a circle around
similar ones." Later slides drive the *same* map into new states from slide
attributes: switch on the association web (slide 6, "Word Association Game"), zoom
into a region, and demonstrate vector arithmetic.

The thing being visualised is **Mikolov et al. 2013, *Efficient Estimation of Word
Representations in Vector Space*** (word2vec). The core teaching points:

- **Distance ≈ similarity.** Related words sit near each other.
- **A relationship is a constant offset vector** — same direction, same length.
  `man→woman` is the same arrow as `king→queen` as `uncle→aunt`.
- **Vector arithmetic works:** `king − man + woman ≈ queen`;
  `Paris − France + Italy ≈ Rome`.

The relation set is seeded from the paper's **Table 8** plus the classic
Figure 2 / Table 1 regularities.

## 2. Non-goals (v1)

- No live force simulation. Positions are authored, not computed.
- No real embeddings / PCA bake step. (Authored coordinates only — same nature as
  the paper's arranged projection figures.)
- No keyboard navigation of nodes. Noted for a later pass.
- No per-word frequency sizing. All nodes are one size.
- Slide placements beyond slide 3 are **follow-up slide work**, not part of this
  component build.

## 3. Approach

**Authored 2-D vector space (chosen over circle-packing backbone and over a
clustered force layout).**

Circle-packing positions are arbitrary, so they cannot carry "distance and
direction" — the paper's whole point. A force layout can, but needs seeding to be
deterministic and its hulls get messy at three levels of nesting. Authored
coordinates give total control over the pedagogy, are pixel-identical on every
slide (essential for a recurring artifact), need no build pipeline, and make every
demonstrated "vector move" land exactly where it should.

Circle-packing survives only as decoration: a soft tinted **region hull** behind
each cluster says "draw a circle around similar ideas," drawn *over* the real
coordinate space rather than defining it.

**Integration follows `.claude/skills/artefact-builder/reference/d3-circle-pack.md`**
even though the packing layout itself is replaced: shadow-DOM `<svg>`, lazy
`import { d3, readPalette } from '@/lib/d3.js'`, colours only from `readPalette`,
motion only from `--motion-*` via `cssVar` with a numeric fallback, viewBox that
scales at CSS `width: 100%`. The component contract in `src/components/README.md`
and the semantic-custom-property rule in `docs/framework-conventions.md` /
`docs/cheatsheet.md` are binding; the build runs through `artefact-builder`
(§10), which re-checks both.

## 4. Data model

One `DATASET` constant inside `index.js` (overridable via the `data` attribute).
Three decoupled structures:

### 4.1 `domains` — the hierarchy (regions + zoom targets)

A tree: `knowledge → domain → subdomain → word`. Leaves carry a stable `id`, a
display `name`, and authored `x`/`y` in `-1…1`.

```jsonc
{
  "name": "knowledge",
  "children": [
    { "name": "science", "children": [
      { "name": "biology", "children": [
        { "id": "cell",      "name": "cell",      "x": -0.62, "y":  0.40 },
        { "id": "gene",      "name": "gene",      "x": -0.55, "y":  0.52 },
        { "id": "evolution", "name": "evolution", "x": -0.48, "y":  0.44 }
      ]},
      { "name": "chemistry", "children": [
        { "id": "copper", "name": "copper", "x": -0.70, "y": -0.10 },
        { "id": "cu",     "name": "Cu",     "x": -0.58, "y": -0.10 },
        { "id": "zinc",   "name": "zinc",   "x": -0.70, "y": -0.22 },
        { "id": "zn",     "name": "Zn",     "x": -0.58, "y": -0.22 }
      ]}
    ]},
    { "name": "everyday", "children": [
      { "name": "family", "children": [
        { "id": "man",      "name": "man",      "x": 0.30, "y":  0.55 },
        { "id": "woman",    "name": "woman",    "x": 0.30, "y":  0.40 },
        { "id": "king",     "name": "king",     "x": 0.55, "y":  0.55 },
        { "id": "queen",    "name": "queen",    "x": 0.55, "y":  0.40 },
        { "id": "uncle",    "name": "uncle",    "x": 0.42, "y":  0.75 },
        { "id": "aunt",     "name": "aunt",     "x": 0.42, "y":  0.60 }
      ]}
    ]}
  ]
}
```

- Missing `x`/`y` on a leaf ⇒ author error; component logs a `console.warn` and
  parks the node at the origin so it is visibly wrong.
- Domain order defines `reveal="N"` sequencing.
- A leaf may appear in only one place in the tree; a word that spans domains
  (e.g. `paris`) lives in its most natural region and reaches others via links.

### 4.2 `links` — the association web (hidden until `show-links`)

```jsonc
"links": [
  { "source": "man",  "target": "woman", "kind": "association" },
  { "source": "gene", "target": "cell",  "kind": "association" },
  { "source": "cell", "target": "man",   "kind": "cross-domain" }
]
```

`kind` supports an optional `links="association"` filter. v1 renders all when
`show-links` is present.

### 4.3 `relations` — constant-offset pairs (the word2vec regularities)

```jsonc
"relations": {
  "gender":         [["man","woman"],["king","queen"],["uncle","aunt"]],
  "capital-of":     [["france","paris"],["italy","rome"],["japan","tokyo"]],
  "city-in-state":  [["miami","florida"],["dallas","texas"]],
  "comparative":    [["big","bigger"],["cold","colder"],["quick","quicker"]],
  "profession":     [["einstein","scientist"],["mozart","violinist"],["picasso","painter"]],
  "leader-of":      [["merkel","germany"],["koizumi","japan"]],
  "element-symbol": [["copper","cu"],["zinc","zn"],["gold","au"]],
  "first-name":     [["obama","barack"],["putin","vladimir"]],
  "company-product":[["google","android"],["apple","iphone"],["microsoft","windows"]],
  "company-ceo":    [["apple","jobs"],["microsoft","ballmer"]],
  "country-food":   [["japan","sushi"],["germany","bratwurst"],["usa","pizza"]],
  "past-tense":     [["walk","walked"],["run","ran"],["go","went"]],
  "plural":         [["apple","apples"],["mouse","mice"]]
}
```

Because coordinates are authored, the two members of each pair are placed so the
screen-space offset for every pair in a relation is (near) parallel and equal
length. That parallelism *is* the lesson. The full v1 dataset covers every
relation above with ≥3 pairs where the paper does; ~40–60 leaf nodes total.

## 5. Component API

`class DeckIdeasMap extends DeckElement`, `static tag = 'deck-ideas-map'`.

`static observedAttributes = ['data','focus','highlight','show-links','links','reveal','relation','vector','analogy','measure','label']`

| Attribute | Type | Effect | Absent |
|---|---|---|---|
| `data` | JSON string | override built-in `DATASET` | built-in dataset |
| `focus` | region `name` **or** leaf `id` | camera fits that region's (or single node's) bbox, padded; non-focused regions dim | fit whole map |
| `highlight` | csv of leaf `id`s | pulsing ring on each; everything else fades back | nothing highlighted |
| `show-links` | boolean | draw the association overlay (staggered fade-in) | no links (slide-3 state) |
| `links` | `kind` value | filter the overlay to one `kind` | all kinds |
| `reveal` | integer N | render only first N domains (fragment-buildable) | all domains |
| `relation` | relation key (from §4.3) | draw the offset arrow for **every** pair in that relation; dim non-participants | none |
| `vector` | `a→b` / `a->b` / `a,b` | single labelled offset arrow a→b | none |
| `analogy` | `a-b+c` | `a−b+c` ghost point, nearest-node ring, parallelogram guides, caption | none |
| `measure` | `a,b` | segment a–b with midpoint distance label | none |
| `label` | string | `aria-label` / `<title>` of the svg | `"ideas in space"` |

Tokens in `vector`, `analogy`, `measure` (and the pairs in `relation`) are all
leaf `id`s; an unresolved id ⇒ `console.warn`, that overlay element is skipped.
`analogy`'s "nearest real node" is the smallest Euclidean distance in the
authored coordinate space **excluding `a`, `b`, `c`**.

`relation`, `vector`, `analogy`, `measure` are independent overlays; if more than
one is set they stack (author's responsibility to keep it readable).

### 5.1 Attribute changes

`attributeChangedCallback` (after `_upgraded`): positions never recompute — only
the camera transform, layer opacities, and the overlay layers redraw. Cheap
enough to run on every fragment step.

## 6. Rendering

`import { DeckElement } from '../deck-element.js';` +
`import { d3, readPalette } from '@/lib/d3.js';` (lazy — only in this component).

`static styles` opens with the shared host block from
`reference/component-styles.md` verbatim (`:host { display: block; color:
var(--fg); font: inherit; }`) then the SVG rules — mirroring the circle-pack
recipe's `svg { width: 100%; height: auto; display: block; font: inherit;
background: transparent; }`, `text { fill: var(--fg) }`, `circle { stroke:
var(--line) }`. No bespoke class pile; any DOM caption/legend uses `.note` /
`.box.bar` / `.col` from `component-styles.md`, in-canvas labels are SVG `<text>`
with semantic-var fills.

Shadow-DOM `<svg viewBox="-1000 -1000 2000 2000">`; author coords in `-1…1`
multiplied by 1000, leaving a 1000-unit margin for labels and zoom-out. The svg
scales with its container at CSS `width: 100%` — **no `ResizeObserver`** (unlike
`d3-chart.md`; all geometry is in viewBox units, resolution-independent).

One `<g class="camera">` receives the pan/zoom transform. Layers, bottom to top:

1. **region hulls** — per subdomain: `d3.polygonHull` of member node points,
   padded outward ~40 units, drawn with `d3.line().curve(d3.curveCatmullRomClosed)`.
   Fill `--primary` at a low opacity stepped per domain (`0.06 … 0.14`); 1px
   `--line` stroke. Uppercase caption in `--muted` at the hull centroid.
2. **links** — straight `<line>` per link, `--line`, `stroke-width` 1.5,
   `stroke-opacity` 0 → 0.6 when `show-links`. Staggered by index using
   `--motion-ui-duration`.
3. **vector layer** — `relation` / `vector` / `analogy` / `measure` output:
   `<line>` + `<marker>` triangle in `--primary-strong`; analogy ghost point is a
   hollow `--primary-strong` ring, the matched nearest node a solid `--success`
   ring with a short connector; guides are dashed `--muted`. Captions in `--fg`.
4. **nodes** — uniform `<circle r="7">`, fill `--primary`, `--primary-strong`
   stroke. A separate `<circle class="pulse">` per highlighted node.
5. **labels** — `<text>` in `--fg`, `text-anchor` middle, dy just below the node,
   `font: inherit`, ~13px in viewBox units scaled so it reads at slide size.

### 6.1 Camera

`d3.zoom()` bound to the svg for scroll/drag **and** programmatic control.

- `focus` set → look up the named node/region, compute the bounding box of its
  descendant leaves, derive the `d3.zoomIdentity.translate(...).scale(...)` that
  fits it with ~12% padding, and
  `svg.transition().duration(dur).call(zoom.transform, t)` where
  `dur = parseFloat(this.cssVar('--motion-hero-duration')) || 600` (recipe idiom;
  no hard-coded ms) — d3-zoom tweens it with `interpolateZoom` (the
  circle-packing "flight" feel) for free.
- `focus` absent → same fit against all visible leaves.
- Manual zoom is allowed but every attribute-driven redraw re-asserts the
  computed transform, so slides always return to a known camera.

### 6.2 `reveal="N"`

Leaves/hulls/labels for domains after index N get `opacity: 0` and
`pointer-events: none`; links with an endpoint in a hidden domain are also
withheld. Camera fit considers visible leaves only.

## 7. Determinism, theming, motion, a11y

- **Determinism:** authored coordinates ⇒ byte-identical geometry on every slide.
  No RNG, no simulation, no layout timing.
- **Theming:** `readPalette(['--bg','--fg','--muted','--line','--primary','--primary-strong','--success'])`
  at render and again inside `_draw` so a live `[data-theme]` swap re-colours
  (matching the circle-pack recipe). Every one of those names exists in `:root`
  **and** `[data-theme="dark"]` in `src/styles/vars/semantic.css`. Semantic
  custom properties only — no tier-1 primitive, no raw colour/length literal
  (numeric geometry constants in JS — `r`, viewBox, hull padding, stroke-width,
  fill-opacity steps — are allowed, exactly as the recipe hard-codes `SIZE`,
  `padding(3)`, `d.r / 5`).
- **Motion:** camera flights read `--motion-hero-duration` / `--motion-hero-ease`
  via `cssVar` (numeric fallback); link/overlay/highlight fades read
  `--motion-ui-duration` / `--motion-ui-ease`. No hard-coded ms.
  `@media (prefers-reduced-motion: reduce)` in `static styles` drops the pulse to
  a static ring; a `matchMedia('(prefers-reduced-motion: reduce)').matches` check
  passes `duration(0)` to the camera/overlay transitions.
- **Accessibility:** `<svg role="img">` with `<title>` and `<desc>` (desc names
  the current focus/overlay state); `aria-label` from `label`. Interactive
  keyboard control is out of scope v1.

## 8. Files

| File | Change |
|---|---|
| `src/components/ideas-map/index.js` | **new** — class, `DATASET` const, render, camera, overlays |
| `src/components/registry.js` | **edit** — one `import './ideas-map/index.js';` line + one `COMPONENTS` entry `'ideas-map': { tag: 'deck-ideas-map', dir: 'ideas-map' }` |
| `slides/03-ideas-in-space.html` | **edit** — keep `<section id="ideas-in-space" data-slug="ideas-in-space">` and the `<h2>`; replace the five `TODO` bullets with `<deck-ideas-map label="Ideas in space"></deck-ideas-map>`; move the narration into an `<aside class="notes">` on the section (HTML-slide speaker-notes form — the `Note:` line is Markdown-only) |
| `test/ideas-map.html` | **new** — QUnit smoke test (matches `scripts/test.js` / `test/*.html` convention) |

Slide file stays Shape 2 from `docs/cheatsheet.md` (section + `<h2>` + the tag,
no `<style>`, no behaviour). Never touches other components, `src/styles/**`, or
root `deck.css`.

## 9. Testing

- **`npm start`, slide 3:** regions with captions, disconnected word-points, no
  links, whole-map camera.
- **Scratch slide** exercising each attribute: `focus="biology"` flies and dims;
  `show-links` fades the web in; `relation="gender"` draws parallel equal arrows;
  `analogy="king-man+woman"` rings `queen` with guides + caption;
  `reveal="2"` shows two domains; `highlight="gene,cell"` pulses two nodes;
  `measure="cell,gene"` shows a distance.
- **`prefers-reduced-motion`** emulation: no tweens, static rings.
- **`[data-theme="dark"]`** on the section: palette tracks.
- **`test/ideas-map.html` (QUnit):** component upgrades; `DATASET` parses; every
  `links` / `relations` endpoint id resolves to a real leaf; every leaf has
  numeric `x`/`y`; `analogy` parser handles `a-b+c`; `attributeChangedCallback`
  does not re-create node geometry (positions stable across a `focus` change).

## 10. Build path

Built with the **`artefact-builder`** skill. Its Read step will:

- confirm `deck-ideas-map` / `ideas-map` is absent from `registry.js` (it is);
- parse `src/styles/vars/semantic.css` and validate this spec's custom-property
  list (`--bg --fg --muted --line --primary --primary-strong --success` +
  `--motion-hero-* --motion-ui-*`) — all present, no primitive invented;
- pick `reference/d3-circle-pack.md` as the recipe (concept map / "ideas in
  space" / zoom-into-a-topic row of the recipe table), layered on
  `reference/component-template.js`, shared pieces from
  `reference/component-styles.md`;
- edit `registry.js` per `reference/registry-edit.md` (one import line + one
  `COMPONENTS` entry, tabs, minimal diff).

The implementation plan wraps that invocation plus: authoring the ~40–60-word
dataset with parallel-offset coordinates, the slide-3 edit, and
`test/ideas-map.html`. Reading `docs/framework-conventions.md`,
`src/components/README.md`, and `reference/component-styles.md` first is
mandatory (artefact-builder's own opening instruction).

## 11. Open items for the plan

- Final word list per region and the exact authored coordinates (the plan's first
  task: lay out ~40–60 words on paper/grid so each relation's pairs are parallel).
- Whether slide 6's placement lands in this branch or a follow-up (default:
  follow-up).
