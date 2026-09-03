# Design: `<deck-ideas-map>` — the deck's key artifact

**Date:** 2026-09-03
**Status:** in design (rewritten around a force-directed model)
**Component:** `src/components/ideas-map/index.js` → tag `deck-ideas-map`

---

## 1. Purpose

One recurring visual that threads the whole deck: a **map of meaning**, drawn as a
**force-directed graph** of ideas. It starts (slide 3, "Ideas in Space") as loose
clusters of disconnected word-nodes grouped by topic — "our brain keeps different
ideas in different places; similar things sit together, and the groups overlap."
Later slides drive the *same* graph from slide attributes: switch the association
web on (slide 6, "Word Association Game") and watch related words pull together;
**tag** a topic so it takes a legend colour; **zoom** into a tagged topic so the
view scopes down to just that idea and its neighbours.

The concept behind it is **Mikolov et al. 2013** (word2vec):

- **Meaning is relative position.** Where the map sits on screen is meaningless;
  only the arrangement of ideas relative to each other carries information.
- **A relationship is a consistent step.** This is the property to preserve: one
  step in a fixed direction is the *same* relationship everywhere. "One step
  left" turns `son → daughter` **and** `king → queen` (male → female); "one step
  up" turns `son → father` **and** `daughter → mother` (child → parent). Those
  four words form a parallelogram, and so does every other pair sharing those
  relationships. §3.1 makes the simulation hold this.

The reference examples are the two the deck was pitched from:
[zoomable circle packing](https://observablehq.com/@d3/zoomable-circle-packing)
(for the zoom-into-a-scope camera) and
[force-directed graph](https://observablehq.com/@d3/force-directed-graph/2) (for
the layout, the overlap, and drag-to-explore).

## 2. Non-goals (v1)

- **No free-form vector-arithmetic calculator.** No `analogy="a-b+c"` input box,
  no "type any two words and measure them" readout. Consistent per-relationship
  offsets *are* preserved (§3.1) and a slide may draw the arrows for one
  relationship (`spotlight`), but the component is not a general vector sandbox.
- No authored *coordinates*. The only authored geometry is one direction vector
  per relationship (§4.4, ~6 values). No real embeddings, no PCA bake step —
  layout is the simulation's.
- No pixel-identical determinism. Seeded → *recognisably the same shape* between
  appearances, not byte-identical (§7).
- No cross-slide state / `Alpine.store`. Each slide re-declares its attributes.
- No keyboard drag; pointer drag only in v1. Node keyboard-nav is a later pass.
- No per-word frequency sizing — uniform node radius in v1.
- Slide placements beyond slide 3 are **follow-up slide work**, not part of this
  component build.

## 3. Approach

**A single `d3.forceSimulation`, seeded for stability, with a scoping camera.**

### 3.1 The simulation

Forces (all from d3-force core via `@/lib/d3.js`):

| Force | Role |
|---|---|
| `forceLink(links).id(d => d.id).distance(d => d.distance ?? LINK_DIST)` | linked ideas pull to a target distance — the association web (see [d3-force/link](https://d3js.org/d3-force/link)) |
| `forceManyBody().strength(CHARGE)` | nodes repel so the graph spreads |
| `forceX`/`forceY` toward each node's **topic centroid**, `strength(CLUSTER)` — *weak* | groups form, but loosely, so topics **overlap** |
| `forceCollide(NODE_R * 1.4)` | stops exact overlap of node circles, not of clusters |
| `forceCenter(W/2, H/2)` | keeps the whole graph in frame |
| **`forceRelations(relations, RELATION_OFFSETS).strength(REL)`** — custom, *strong* | every pair sharing a relationship is pulled to the **same offset vector**, so the parallelograms hold (§3.1a) |

A node with several `topics` is pulled toward the mean of its topics' centroids —
that is what places shared ideas *between* clusters.

### 3.1a `forceRelations` — the consistent-step constraint

A custom d3-force. Given the `relations` list (§4.4) and `RELATION_OFFSETS`
(one `[dx, dy]` per relationship id, authored), on each tick, for every pair
`(s, t)` with relationship `r`:

```
want   = [s.x + Δr[0], s.y + Δr[1]]          // where t "should" be
err    = [want[0] - t.x, want[1] - t.y]
t.vx  += err[0] * k ;  t.vy += err[1] * k     // k = REL * alpha
s.vx  -= err[0] * k ;  s.vy -= err[1] * k     // push both halves, half each
```

`REL` is set high enough that these pairs snap into a rigid parallelogram lattice
while `forceLink` / charge / clustering arrange the unconstrained words around
it. Δr is a **direction shared by all pairs of that relationship**, so "one step
left" means the same thing at `son→daughter` and `king→queen`. The lattice's
absolute position on screen is left to the other forces — only the relative steps
are pinned.

A dragged node (`fx/fy` set) is exempt while held; on release `forceRelations`
pulls it back into its slot — you can yank `son` aside and watch it settle back
level with `daughter` and below `father`.

**Seeding & freeze.** On first mount the component seeds initial positions from a
fixed PRNG (`d3.randomLcg(SEED)` feeding `simulation.randomSource` and the initial
`x`/`y`), runs `WARMUP` ticks synchronously, then `simulation.alpha(0).stop()`.
Result: the same starting shape every time the component mounts, no animated
settling on load. The sim **re-heats** briefly (`alphaTarget`) only on two
events: `show-links` toggling (the web snapping into place is the point of slide
6) and a drag.

`show-links` **absent** → the `forceLink` force is not added and no edges draw;
the graph is just topic clusters. Present → link force added, edges drawn with a
staggered fade, sim re-heats and settles.

### 3.2 The camera (scope)

Camera math is lifted from
`.claude/skills/artefact-builder/reference/d3-circle-pack.md` (the `zoomTo` /
`d3.interpolateZoom` block): a view state `[cx, cy, w]`, tweened with
`d3.interpolateZoom`. But the *target* is a **topic's bounding box** (computed
from its nodes' settled positions), not a packed circle.

`scope="families"` → camera eases to fit that topic's nodes with padding.
**Out-of-scope nodes do not disappear** — they go `--muted` fill at ~0.15 opacity
and stay where they are, so the overlap between topics is still visible.
Out-of-scope links drop to ~0.08. `scope` implies `tag` (the scoped topic also
gets its legend colour).

### 3.3 Integration

Follows `reference/d3-chart.md` (force is in its "layout families") for the
DeckElement wiring and `reference/component-template.js` for the class shape:
lazy `import { d3, readPalette } from '@/lib/d3.js'`, shadow-DOM `<svg>` with
`viewBox` scaling at CSS `width: 100%`, colours only from `readPalette`, motion
only from `--motion-*` via `cssVar` + numeric fallback, `role="img"` +
`<title>`/`<desc>`. Shared host / legend pieces (`:host`, `.row`, `.chip`,
`.note`) copied verbatim from `reference/component-styles.md` — no bespoke class
pile. The component contract in `src/components/README.md` and the
semantic-custom-property rule in `docs/framework-conventions.md` /
`docs/cheatsheet.md` are binding; the build runs through `artefact-builder`
(§10), which re-checks both.

## 4. Data model

One `DATASET` constant inside `index.js` (overridable via the `data` attribute).

### 4.1 `topics` — ordered groups (drive colour, legend, reveal, scope)

```jsonc
"topics": [
  { "id": "family",   "name": "People & family" },
  { "id": "places",   "name": "Places" },
  { "id": "sciences", "name": "Sciences" },
  { "id": "materials","name": "Materials" },
  { "id": "grammar",  "name": "Word forms" },
  { "id": "arts",     "name": "Arts" }
]
```

Array order drives `reveal="N"` and the legend-colour assignment order.

### 4.2 `nodes` — the ideas (no coordinates)

```jsonc
"nodes": [
  { "id": "man",   "name": "man",   "topics": ["family"] },
  { "id": "woman", "name": "woman", "topics": ["family"] },
  { "id": "king",  "name": "king",  "topics": ["family"] },
  { "id": "queen", "name": "queen", "topics": ["family"] },
  { "id": "paris", "name": "Paris", "topics": ["places"] },
  { "id": "france","name": "France","topics": ["places"] },
  { "id": "einstein", "name": "Einstein", "topics": ["sciences", "family"] }  // between two clusters
]
```

- `topics` is a **list** — a node in more than one topic is pulled between
  clusters (the overlap). Empty/unknown topic ⇒ `console.warn`, node still placed
  by link + charge forces alone.
- `weight` is reserved for later frequency sizing; ignored in v1.

### 4.3 `links` — the association web (hidden until `show-links`)

```jsonc
"links": [
  { "source": "king",  "target": "france" },
  { "source": "gene",  "target": "cell" },
  { "source": "paris", "target": "rome" }
]
```

Plain associations — they drive `forceLink` and draw as edges on `show-links`.
`distance` (optional) overrides `LINK_DIST` for that edge. ~30–50 links.

### 4.4 `relations` + `RELATION_OFFSETS` — the consistent steps

```jsonc
"relations": [
  { "rel": "gender", "pairs": [["son","daughter"],["king","queen"],["man","woman"],["uncle","aunt"]] },
  { "rel": "parent", "pairs": [["son","father"],["daughter","mother"],["nephew","uncle"]] },
  { "rel": "tense",  "pairs": [["walk","walked"],["run","ran"],["go","went"]] },
  { "rel": "capital","pairs": [["france","paris"],["italy","rome"],["japan","tokyo"]] }
]
```

`RELATION_OFFSETS` — one authored direction per `rel`, in coordinate units
(`D ≈ 90` on the 1600×1000 field), the **only authored geometry in the whole
component**:

```js
const RELATION_OFFSETS = {
  gender:  [-D, 0],     // one step left  = male → female
  parent:  [0, -D],     // one step up    = child → parent
  tense:   [D, 0],
  capital: [D * 0.6, -D * 0.5],
};
```

- Every `pairs` entry also implicitly acts as a link for `forceLink` and can draw
  as an edge (so `son–daughter` is both a consistent step *and* an association).
- Consistency check at load: a `rel` with no `RELATION_OFFSETS` entry ⇒
  `console.warn`, that relation falls back to plain `forceLink` behaviour.
- Pairs must reference real node ids; unresolved ⇒ `console.warn`, pair skipped.
- ~40–60 nodes total across §4.2 + §4.4.

## 5. Component API

`class DeckIdeasMap extends DeckElement`, `static tag = 'deck-ideas-map'`.

`static observedAttributes = ['data','show-links','reveal','tag','scope','highlight','spotlight','label']`

| Attribute | Type | Effect | Absent |
|---|---|---|---|
| `data` | JSON string | override built-in `DATASET` | built-in dataset |
| `show-links` | boolean | add the link force, draw edges (staggered fade), re-heat + settle | link force off, no edges — just clusters (slide-3 state) |
| `reveal` | integer N | only the first N topics' nodes participate/draw; rest withheld | all topics |
| `tag` | csv of topic ids | each listed topic takes the next legend colour; its nodes recolour; a legend row appears | no colours, no legend |
| `scope` | one topic id | camera eases to fit that topic's nodes; out-of-scope nodes → `--muted` @ ~0.15 (kept, not hidden); implies `tag` of that topic | camera fits whole graph |
| `highlight` | csv of node ids | ring each; pull their labels forward; dim the rest slightly | nothing highlighted |
| `spotlight` | a `rel` id (from §4.4) | draw the **offset arrow** for every pair in that relationship — parallel and equal because `forceRelations` made them so — and dim everything not involved. The "one consistent step" reveal. | no arrows |
| `label` | string | `aria-label` / `<title>` of the svg | `"ideas in space"` |

`tag`, `scope`, `highlight`, `spotlight` are independent and stack.

### 5.1 Drag

`d3.drag()` on every node (`cursor: grab` / `grabbing`):

- **start** → `simulation.alphaTarget(0.3).restart()`, set `d.fx/d.fy` to pointer.
- **drag** → `d.fx/d.fy` follow the pointer; the dragged node's links and their
  far endpoints go bold (`--primary-strong`), everything else dims to ~0.3.
- **end** → `simulation.alphaTarget(0)`, clear `d.fx/d.fy` — the node **releases
  back** into the layout and the graph re-settles. (Double-click-to-pin is a
  later option.)

This is "drag an idea around to see what it's linked to."

### 5.2 Attribute changes

`attributeChangedCallback` (after `_upgraded`): the node/link **data and settled
positions are not rebuilt** — only forces toggle (`show-links`), the camera tween
runs (`scope`), and layer colours/opacities recompute (`tag` / `highlight` /
`spotlight`). Cheap on every fragment step. `data` changing is the one case that
tears down and rebuilds the simulation.

## 6. Rendering

Shadow-DOM `<svg viewBox="0 0 1600 1000">` (the simulation's coordinate space),
scaling at CSS `width: 100%`. One `<g class="view">` takes the camera transform
from `zoomTo`. Layers, bottom to top:

1. **links** — `<line>` per edge, `--line`, `stroke-width` 1.5, `stroke-opacity`
   0 → 0.55 on `show-links` (staggered, `--motion-ui-duration`).
2. **spotlight arrows** — on `spotlight="<rel>"`: `<line>` + `<marker>` triangle
   in `--primary-strong` from each pair's source to target; a short `--muted`
   caption near the first arrow (`one step = <rel>`). Non-involved nodes/links
   drop to ~0.15. Present only while `spotlight` is set.
4. **nodes** — `<circle r="NODE_R">`. Fill: base `--primary`; a node whose topic
   is in `tag`/`scope` takes that topic's assigned colour; out-of-scope (under
   `scope`) → `--muted` @ 0.15. `--primary-strong` (or colour-strong) stroke.
   `<circle class="pulse">` behind each `highlight` node.
5. **labels** — `<text>` in `--fg`, `text-anchor` middle, dy below the node,
   `font: inherit`. All labels show when the graph is small enough; under
   `scope`, only in-scope + `highlight` labels; a dragged node's neighbourhood
   always labels.
6. **legend** (DOM, not SVG) — an absolutely-positioned `<div>` inside the shadow
   root, built from `.row` + `.chip` (`component-styles.md`): one row per tagged
   topic, a colour swatch + `topic.name`. Hidden when `tag`/`scope` unset.

A `simulation.on('tick', …)` handler updates line endpoints and node
`transform`s. On a settled graph (no re-heat active) there is no ticking — it is
a static frame.

### 6.1 Camera (`zoomTo` / `interpolateZoom`)

```
zoomTo([cx, cy, w]):
  k = 1600 / w
  view group: translate(800 - cx*k, 500 - cy*k) scale(k)   // (or per-item, per recipe)
view = [cx, cy, w]

easeTo(bbox):                       // bbox from in-scope nodes' settled x/y, padded
  target = [bbox.cx, bbox.cy, bbox.w]
  svg.transition().duration(dur)    // dur = cssVar('--motion-hero-duration') || 600
     .tween('zoom', () => { const i = d3.interpolateZoom(view, target); return t => zoomTo(i(t)); })
```

- `scope` set → `easeTo` that topic's padded bbox.
- `scope` absent → `easeTo` the whole graph's bbox.
- Background click → clear scope framing (back to whole-graph), attributes
  re-assert on next change.
- Reduced motion → `duration(0)` (cut, not fly).

### 6.2 `reveal="N"`

Nodes in topics after index N are excluded from the simulation and not drawn;
links with an endpoint among them are withheld. The whole-graph camera bbox uses
only revealed nodes, so the frame grows sensibly as topics come in.

## 7. Determinism, theming, motion, a11y

- **Determinism:** the `forceRelations` lattice (§3.1a) is stable regardless of
  seed — the parallelograms look the same every mount. The loose cloud around it
  is `SEED` + `WARMUP`-determined: recognisably the same shape, not
  pixel-identical, and a drag nudges that slide's instance until re-mount.
  Accepted trade for overlap + drag.
- **Theming:** `readPalette` at render and inside the draw pass so a live
  `[data-theme]` swap re-colours. Palette used: `--bg --fg --muted --line
  --primary --primary-strong` for the graph; the **tag colour ramp** is
  `[--primary, --warning, --success, --danger, --secondary]` (strong hues first,
  the greyish `--secondary` last) assigned in topic order — all exist in `:root`
  and `[data-theme="dark"]` of `src/styles/vars/semantic.css`. Semantic custom
  properties only — no
  primitive, no literal; numeric geometry constants in JS (`NODE_R`,
  `LINK_DIST`, `CHARGE`, viewBox) are fine, as the recipes hard-code theirs.
- **Motion:** camera tween → `--motion-hero-*`; edge/colour fades → `--motion-ui-*`;
  no hard-coded ms. `@media (prefers-reduced-motion: reduce)` in `static styles`
  removes the node pulse; `matchMedia('(prefers-reduced-motion: reduce)').matches`
  → the sim settles synchronously with no visible ticking and the camera cuts.
- **Accessibility:** `<svg role="img">` with `<title>` and `<desc>` (desc names
  the current scope / tags); `aria-label` from `label`. Keyboard control of drag
  is out of scope v1.

## 8. Files

| File | Change |
|---|---|
| `src/components/ideas-map/index.js` | **new** — class, `DATASET`, force sim, drag, camera, legend |
| `src/components/registry.js` | **edit** — one `import './ideas-map/index.js';` line + one `COMPONENTS` entry `'ideas-map': { tag: 'deck-ideas-map', dir: 'ideas-map' }` (per `reference/registry-edit.md`) |
| `slides/03-ideas-in-space.html` | **edit** — keep `<section id="ideas-in-space" data-slug="ideas-in-space">` + `<h2>`; replace the five `TODO` bullets with `<deck-ideas-map label="Ideas in space"></deck-ideas-map>`; narration into `<aside class="notes">` |
| `test/ideas-map.html` | **new** — QUnit smoke test (`scripts/test.js` / `test/*.html` convention) |

Slide file stays Shape 2 from `docs/cheatsheet.md` (section + `<h2>` + tag, no
`<style>`, no behaviour). Never touches other components, `src/styles/**`, or root
`deck.css`.

## 9. Testing

- **`npm start`, slide 3:** overlapping topic clusters, no edges, no legend,
  whole-graph camera; drag a node → its links light up (nothing to light yet
  pre-`show-links`, so drag just moves it).
- **`show-links`:** link force added, edges fade in, related words visibly pull
  together, then settle.
- **`tag="family,places"`:** family and places nodes take the first two ramp
  colours; a two-row legend appears.
- **`scope="family"`:** camera flies (`interpolateZoom`) to fit the family
  cluster; out-of-scope nodes are still visible but muted at ~0.15, so overlap
  reads; background click returns to whole graph.
- **`spotlight="gender"`** draws one arrow per gender pair; the arrows are
  visibly **parallel and the same length** (this is the property that must
  survive `forceRelations` tuning). `spotlight="parent"` arrows are parallel too
  and **perpendicular** to the gender ones. `highlight="king,queen"` rings two
  nodes.
- **drag:** press-drag a node → neighbourhood bolds, rest dims; release → node
  eases back and graph re-settles.
- **`prefers-reduced-motion`:** no ticking animation, camera cuts, no pulse.
- **`[data-theme="dark"]`:** graph + ramp colours track.
- **`test/ideas-map.html` (QUnit):** component upgrades; `DATASET` parses; every
  link + relation-pair endpoint resolves to a node; every node's `topics` resolve
  to real topics; every `rel` has a `RELATION_OFFSETS` entry; after `WARMUP` the
  offset `t − s` for each pair in a relationship matches `Δrel` within ε (the
  parallelogram invariant); two mounts with the same `SEED` produce matching
  settled positions within ε; `tag` assigns distinct ramp colours in order;
  `scope` leaves out-of-scope nodes in the DOM at reduced opacity (not removed).

## 10. Build path

Built with the **`artefact-builder`** skill. Its Read step will:

- confirm `deck-ideas-map` / `ideas-map` is absent from `registry.js` (it is);
- validate this spec's custom-property list against
  `src/styles/vars/semantic.css` — `--bg --fg --muted --line --primary
  --primary-strong --secondary --warning --success --danger` + `--motion-hero-*`
  / `--motion-ui-*`, all present, no primitive invented;
- pick the recipe: **`reference/d3-chart.md`** for the force integration (its
  "layout families" include force) with the `zoomTo` camera block from
  `reference/d3-circle-pack.md`, layered on `reference/component-template.js`,
  shared pieces from `reference/component-styles.md`;
- edit `registry.js` per `reference/registry-edit.md`.

The implementation plan wraps that plus: writing `forceRelations`, authoring the
~40–60-node dataset (topics; nodes with `topics[]`; plain `links`; `relations`
with `pairs`; the `RELATION_OFFSETS` direction map), the slide-3 edit, and
`test/ideas-map.html`. Reading `docs/framework-conventions.md`,
`src/components/README.md`, and `reference/component-styles.md` first is
mandatory.

## 11. Open items for the plan

- `SEED`, `WARMUP` tick count, and the force constants (`LINK_DIST`, `CHARGE`,
  `CLUSTER` strength, `REL` strength, `D`, `NODE_R`) — tune so `forceRelations`
  wins cleanly (parallelograms rigid) while topics still group *and visibly
  overlap*, and the graph fills a 1600×1000 frame at slide size. `REL` too high
  fights clustering into a stiff grid; too low and the steps drift.
- The authored `RELATION_OFFSETS` directions — pick so gender ⟂ parent reads
  clearly and no two relationships share a direction (or the arrows collide).
- The tag colour ramp uses `--warning` / `--danger` as categorical hues, which is
  a stretch of their semantic role. If it reads wrong, add a dedicated
  categorical ramp to `semantic.css` via `skin-builder` before the build.
- `spotlight` — keep in v1 or defer? (It is the lightest of the overlays.)
- Whether slide 6's placement lands in this branch or a follow-up (default:
  follow-up).
- Confirm drag **releases** on drop (current default) vs pins until clicked off.
