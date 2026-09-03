# Design: `<deck-ideas-map>` — the deck's key artifact

**Date:** 2026-09-03
**Status:** in design (rewritten around a force-directed model)
**Component:** `src/components/ideas-map/index.js` → tag `deck-ideas-map`

---

## 1. Purpose

One recurring visual that threads the whole deck: a **map of meaning**, drawn as a
**force-directed graph** of ideas. Its arc across the deck:

1. **Star map** (slide 3, "Ideas in Space") — loose clusters of dim, disconnected
   word-nodes grouped by topic. "Our brain keeps different ideas in different
   places; similar things sit together, and the groups overlap."
2. **Association web** (slide 6, "Word Association Game") — the link force switches
   on and related words wire together and pull closer.
3. **Constellation** (the context slides) — as each layer of context is added, the
   ideas it touches **activate** (brighten, halo) and **attention** edges light up
   between them. A shape emerges from the star field: the lit subgraph *is* what
   the model is attending to. More context → more of the constellation appears.

Along the way, slide attributes also **tag** a topic (legend colour + emphasis)
and **scope** the camera into one topic while the rest stays faintly visible.

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
  clusters (the overlap) and takes the colour of its **first** topic. Empty/
  unknown topic ⇒ `console.warn`, node still placed by link + charge forces alone
  and drawn in `--muted`.
- **Every node is drawn in its topic's colour from the start** (§7 scale) — the
  graph is colour-coded by topic in every state, not only when tagged. `tag` /
  `scope` change *emphasis*, not whether colour is present.
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
  { "rel": "gender", "pairs": [
      ["man","woman"],["king","queen"],["uncle","aunt"],   // family
      ["bull","cow"],["lion","lioness"],["stag","doe"],     // animals
      ["waiter","waitress"]                                 // work
  ]},
  { "rel": "parent", "pairs": [["son","father"],["daughter","mother"],["calf","cow"],["cub","lioness"]] },
  { "rel": "tense",  "pairs": [["walk","walked"],["run","ran"],["go","went"]] },
  { "rel": "capital","pairs": [["france","paris"],["italy","rome"],["japan","tokyo"]] }
]
```

**A relationship is topic-agnostic.** `gender` is *one* step vector that connects
pairs wherever they live — `man→woman` in **family**, `bull→cow` in **animals**,
`waiter→waitress` in **work**. `forceRelations` applies the same Δ to all of
them, so the arrows are parallel across the whole graph regardless of cluster.
That is a teaching beat in itself: "female is female everywhere."

`RELATION_OFFSETS` — one authored 2-D vector per `rel`, in coordinate units
(`D ≈ 90` on the 1600×1000 field). **Any angle, any length** — the only authored
geometry in the whole component:

```js
const RELATION_OFFSETS = {
  gender:  [-D, 0],          // one step left      = male → female
  parent:  [0, -D],          // one step up        = child → parent
  tense:   [D, 0],           // one step right
  capital: [D * 0.7, -D * 0.55],  // a diagonal step
  // …one entry per relationship; pick distinct angles so arrows don't overlap
};
```

- Every `pairs` entry also implicitly acts as a link for `forceLink` and can draw
  as an edge (so `bull–cow` is both a consistent step *and* an association).
- Consistency check at load: a `rel` with no `RELATION_OFFSETS` entry ⇒
  `console.warn`, that relation falls back to plain `forceLink` behaviour.
- Pairs must reference real node ids; unresolved ⇒ `console.warn`, pair skipped.
- If one node sits in two relations pulling it different ways (e.g. `cow` is the
  female of `bull` *and* the parent of `calf`), both forces apply and it settles
  at the vector sum — which is correct: it *is* both.
- Dataset is expected to grow to **~20+ topics / 150+ nodes** over the deck; the
  data shape and the colour scale (§7) must scale to that.

### 4.5 `contexts` — named constellations (the context slides)

```jsonc
"contexts": {
  "customer-email": {
    "from": "question",
    "nodes": ["question", "recipient", "tone", "product", "deadline", "policy"],
    "weights": { "product": 1, "policy": 0.9, "tone": 0.7, "deadline": 0.5, "recipient": 0.4 }
  }
}
```

A context is a **saved activation set**: which nodes light up, an optional `from`
node the attention edges fan out of, and optional per-node `weights` (0–1) that
scale the attention-edge width and the node halo. `activate="customer-email"`
(§5) plays it; `activate` can also take a raw csv of node ids for an ad-hoc
constellation. Unknown node id ⇒ `console.warn`, skipped. Purely visual — no
force change (§7).

## 5. Component API

`class DeckIdeasMap extends DeckElement`, `static tag = 'deck-ideas-map'`.

`static observedAttributes = ['data','show-links','reveal','tag','scope','highlight','spotlight','activate','attention-from','constellation','label']`

| Attribute | Type | Effect | Absent |
|---|---|---|---|
| `data` | JSON string | override built-in `DATASET` | built-in dataset |
| `show-links` | boolean | add the link force, draw edges (staggered fade), re-heat + settle | link force off, no edges — just clusters (slide-3 state) |
| `reveal` | integer N | only the first N topics' nodes participate/draw; rest withheld | all topics |
| `tag` | csv of topic ids | show a legend for these topics and lift them — non-tagged topics dim to ~0.35, node labels for tagged topics come forward. (Colour is always on; this changes emphasis.) | no legend, all topics equal |
| `scope` | one topic id | camera eases to fit that topic's nodes; out-of-scope nodes → `--muted` @ ~0.15 (kept, not hidden — the overlap stays visible); implies `tag` of that topic | camera fits whole graph |
| `highlight` | csv of node ids | ring each; pull their labels forward; dim the rest slightly | nothing highlighted |
| `spotlight` | a `rel` id (from §4.4) | draw the **offset arrow** for every pair in that relationship — parallel and equal because `forceRelations` made them so, and **across every topic the relationship touches** (family, animals, work…) — dim everything not involved | no arrows |
| `activate` | a `contexts` key **or** csv of node ids | light the listed nodes (halo + brighten, staggered), fade every other node to a dim "star" (~0.12); draw the **attention** layer (§6, layer 3) among them; this is the star-map → constellation move | nothing activated — plain star map |
| `attention-from` | one node id | the attention edges fan from this node to the rest of the activated set (overrides the context's `from`); absent ⇒ context `from`, else the activated set is connected as a light mesh | per context / mesh |
| `constellation` | boolean | also draw the "connect-the-dots" outline — a thin polyline through the activated nodes in list order — for the literal constellation look | attention edges only |
| `label` | string | `aria-label` / `<title>` of the svg | `"ideas in space"` |

`tag`, `scope`, `highlight`, `spotlight`, `activate` are independent and stack.
Progressive reveal across fragments = a slide grows its `activate` list step by
step (or swaps to successively larger `contexts` keys).

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
runs (`scope`), and layer colours/opacities/overlays recompute (`tag` /
`highlight` / `spotlight` / `activate`). Cheap on every fragment step. `data`
changing is the one case that tears down and rebuilds the simulation.

### 5.3 `labels` + the live label toggle

| Attribute | Effect |
|---|---|
| `labels` | `none` — no node labels (bare star map, for talking over regions and planting seeds); `topics` — only the topic captions; `all` — every node labelled; `auto` (default) — the §6 layer-5 rules (labels on where the view is legible; in-scope + `highlight` + dragged neighbourhood otherwise) |

`labels` sets the **initial** state. A small **toggle control** rides in a corner
of the component (shadow-DOM `<button class="btn ghost">` from
`component-styles.md`, `Aa` glyph) that flips node labels on/off live during the
talk without needing a fragment — so slide 3 can be walked with labels off, then
switched on in the moment. The toggle's state resets to the `labels` attribute
when the slide is re-shown (idempotent mount). Hidden under
`prefers-reduced-motion`? No — it is a control, not motion; it stays.

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
3. **attention** — on `activate`: for the activated set, either edges **fanning
   from** `attention-from` / the context `from` node to each other activated node,
   or (no `from`) a light mesh among them. Stroke `--primary-strong`, width scaled
   by the node's `weight` (0–1 → 1…4), `stroke-opacity` ~0.8, drawn with a quick
   sweep (`--motion-ui`). If `constellation`, add a thin `--primary-strong`
   polyline through the activated nodes in list order. Activated nodes get a halo
   (`<circle>` blur/soft ring in the node's hue, radius ∝ weight); every
   non-activated node drops to a `--muted` "star" at ~0.12.
4. **nodes** — `<circle r="NODE_R">`. Fill: **always** the node's first-topic
   colour from the categorical scale (§7); under `scope`, out-of-scope nodes →
   `--muted` @ 0.15; under `tag`, non-tagged topics → their colour @ ~0.35; under
   `activate`, non-activated → `--muted` @ ~0.12. Stroke a darkened form of the
   same hue. `<circle class="pulse">` behind each `highlight` node.
5. **labels** — `<text>` in `--fg`, `text-anchor` middle, dy below the node,
   `font: inherit`. Governed by `labels` (§5.3) / the live toggle: `none` → none;
   `topics` → topic captions only; `all` → every node; `auto` → legible-view
   rule, plus in-scope / `highlight` / activated / dragged-neighbourhood always.
6. **controls & legend** (DOM, not SVG) — absolutely-positioned inside the shadow
   root: the label toggle `<button class="btn ghost">` (§5.3) in one corner; the
   legend (`.row` + `.chip` from `component-styles.md`, one row per tagged topic,
   swatch + name) in another, shown only when `tag`/`scope` set.

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
- **`activate` / `labels` are pure overlays** — they never touch the simulation
  or node positions, only opacities, halos, the attention layer, and which
  `<text>` render. So the constellation lights up in exactly the same place every
  time and costs nothing to toggle mid-talk.
- **Theming & the topic colour scale:** `readPalette` at render and inside the
  draw pass so a live `[data-theme]` swap re-colours. Structure colours are
  semantic custom properties: `--bg --fg --muted --line --primary
  --primary-strong` (edges `--line`, spotlight arrows `--primary-strong`, rings
  `--primary-strong`).
  **Topic colours** need to scale past 20 categories, which the semantic layer
  cannot supply. Generate them: resolve `--primary` to HCL, then place N topic
  hues evenly around the wheel at `--primary`'s chroma and lightness
  (`d3.hcl` / `d3.interpolateRainbow`-style), so the scale is anchored on the
  brand colour and re-themes when `--primary` does. This is a **documented,
  deliberate exception** to the "no colour literals" rule — noted here and in
  §11; if it needs to become a named, designer-controlled ramp, that is a
  `skin-builder` job. Node stroke = the same hue darkened; legend swatch = the
  hue itself.
  Numeric geometry constants in JS (`NODE_R`, `LINK_DIST`, `CHARGE`, `D`,
  viewBox) are fine, as the recipes hard-code theirs.
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
| `src/components/ideas-map/index.js` | **new** — class, `DATASET`, force sim + `forceRelations`, drag, camera, attention/activation overlay, label toggle, legend |
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
- **`labels`:** `labels="none"` renders the bare star map (no node labels); the
  corner toggle flips them on/off live and its state survives a re-show back to
  the attribute value.
- **`activate`:** `activate="customer-email"` (a `contexts` key) — those nodes
  halo + brighten, all others fade to ~0.12 stars, attention edges fan from the
  `from` node with widths tracking `weights`; `constellation` adds the
  connect-the-dots polyline. Node positions do **not** move. Growing the
  `activate` list adds nodes to the constellation without disturbing the rest.
- **`show-links`:** link force added, edges fade in, related words visibly pull
  together, then settle.
- **Colour by topic always:** every node is its topic's colour in every frame,
  including bare slide 3. `tag="family,places"` adds a legend and dims the other
  topics to ~0.35; it does not *introduce* colour.
- **`scope="family"`:** camera flies (`interpolateZoom`) to fit the family
  cluster; out-of-scope nodes are still visible but muted at ~0.15, so overlap
  reads; background click returns to whole graph.
- **`spotlight="gender"`** draws one arrow per gender pair — including
  `bull→cow` (animals) and `waiter→waitress` (work), not just family — and every
  arrow is visibly **parallel and the same length** across all those clusters
  (the property that must survive `forceRelations` tuning). `spotlight="parent"`
  arrows are parallel too and at a different angle. `highlight="king,queen"`
  rings two nodes.
- **drag:** press-drag a node → neighbourhood bolds, rest dims; release → node
  eases back and graph re-settles.
- **`prefers-reduced-motion`:** no ticking animation, camera cuts, no pulse.
- **`[data-theme="dark"]`:** graph + ramp colours track.
- **`test/ideas-map.html` (QUnit):** component upgrades; `DATASET` parses; every
  link + relation-pair endpoint resolves to a node; every node's `topics` resolve
  to real topics; every `rel` has a `RELATION_OFFSETS` entry; after `WARMUP` the
  offset `t − s` for each pair in a relationship matches `Δrel` within ε (the
  parallelogram invariant); two mounts with the same `SEED` produce matching
  settled positions within ε; the topic colour scale returns distinct hues for
  20+ topics and re-resolves when `--primary` changes; a `gender` pair in
  `animals` gets the same `Δ` as one in `family`; `scope` leaves out-of-scope
  nodes in the DOM at reduced opacity (not removed); `activate` toggles overlay
  state with **zero** change to node `x`/`y`; `labels="none"` renders no `<text>`
  for nodes and the toggle flips it.

## 10. Build path

Built with the **`artefact-builder`** skill. Its Read step will:

- confirm `deck-ideas-map` / `ideas-map` is absent from `registry.js` (it is);
- validate this spec's custom-property list against
  `src/styles/vars/semantic.css` — `--bg --fg --muted --line --primary
  --primary-strong` + `--motion-hero-*` / `--motion-ui-*`, all present, no
  primitive invented. The topic colour scale (§7) is a generated hue wheel off
  `--primary`, flagged in the spec as a deliberate exception — artefact-builder
  should surface it, not silently "fix" it;
- pick the recipe: **`reference/d3-chart.md`** for the force integration (its
  "layout families" include force) with the `zoomTo` camera block from
  `reference/d3-circle-pack.md`, layered on `reference/component-template.js`,
  shared pieces from `reference/component-styles.md`;
- edit `registry.js` per `reference/registry-edit.md`.

The implementation plan wraps that plus: writing `forceRelations`, the topic
colour scale, the attention/activation overlay and the label toggle; authoring
the dataset (starts ~40–60 nodes / ~8 topics, designed to grow to 20+ topics /
150+ nodes — topics; nodes with `topics[]`; plain `links`; `relations` with
`pairs` spanning topics; `RELATION_OFFSETS`; the `contexts` map for the context
slides); the slide-3 edit; and `test/ideas-map.html`. Reading
`docs/framework-conventions.md`,
`src/components/README.md`, and `reference/component-styles.md` first is
mandatory.

## 11. Open items for the plan

- `SEED`, `WARMUP` tick count, and the force constants (`LINK_DIST`, `CHARGE`,
  `CLUSTER` strength, `REL` strength, `D`, `NODE_R`) — tune so `forceRelations`
  wins cleanly (parallelograms rigid) while topics still group *and visibly
  overlap*, and the graph fills a 1600×1000 frame at slide size. `REL` too high
  fights clustering into a stiff grid; too low and the steps drift.
- The authored `RELATION_OFFSETS` directions — one 2-D vector per relationship,
  **any angle**; pick so no two relationships share a direction (or their arrows
  overlap) and the common ones (gender, parent, plural, tense) sit at clearly
  distinct angles.
- **Topic colour scale** — a generated hue wheel anchored on `--primary` (§7) is
  a deliberate exception to "no colour literals". Confirm it holds up at 20+
  topics in both themes; if a designer needs to hand-pick the palette, formalise
  it as a named categorical ramp in `semantic.css` via `skin-builder`.
- How relationships get authored at scale — a growing `relations` list by hand is
  fine to ~20 relationships; beyond that consider a compact table format.
- `spotlight` — keep in v1 or defer? (It is the lightest of the overlays.)
- **Attention topology** — with no `from` node, is the activated set a full mesh,
  a nearest-neighbour graph, or does every `contexts` entry always name a `from`?
  Default assumed: `from` if given, else light mesh; revisit once a real context
  slide is drafted.
- **`weights` shape** — per-node 0–1 (current) vs per-edge. Per-node is simpler
  and enough for "how strongly is this attended to"; confirm.
- Which slides get `<deck-ideas-map>` and in which state — slide 3 (star map,
  `labels="none"`), slide 6 (`show-links`), the context slides
  (`activate=…` growing), plus tag/scope/spotlight beats. That mapping is a
  slide-work follow-up, not this component build.
- Confirm drag **releases** on drop (current default) vs pins until clicked off.
