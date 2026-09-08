# `<deck-ideas-map>` — slide recipes

Copy-paste tags for each state the map can hold, and which slide each one is
for. Every value below is checked against the **current** `dataset.json`, so
these work as written.

`attributes.md` is the terse one-row-per-attribute cheatsheet; this is the
"what do I actually paste, and where" version.

---

## What this dataset actually contains

You can only point at things that exist. As it stands:

**Topics** (for `tag=` / `scope=`, and the order `reveal=` counts in):
`family` · `animals` · `places` · `grammar` · `nature` · `sciences` · `arts` ·
`food` · `professions` · `technology`

**Relations** (for `spotlight=`), with how many arrows each draws:

| rel | arrows | the step it shows |
|---|---|---|
| `part-of` | 11 | wheat → bread, milk → cheese |
| `produces` | 10 | cow → milk, japan → sushi |
| `gender` | 7 | man → woman, boy → girl |
| `capital-of` | 7 | france → paris, victoria → melbourne |
| `parent` | 6 | son → father, girl → mother |
| `plural` | 2 | mouse → mice |
| `comparative` | 2 | good → better |
| `superlative` | 2 | better → best |
| `symbol` | 2 | copper → Cu, zinc → Zn |

**Contexts** (for `activate=`): `general` · `industry` · `specialist`
(the three-layer cooking build) · `royalty` · `celebrity`

**Modes** (for `mode=`): `star-map` · `labels` · `vectors` · `web` ·
`constellation`

**Controls** (for `controls=`, space-separated): `mode` · `labels` · `links` ·
`vectors` · `starmap` · `zoom`

---

## Recipes

### 1 · The star map — "ideas live in places"

```html
<deck-ideas-map mode="star-map" label="Ideas in space"></deck-ideas-map>
```

Topic captions only, no node labels, no edges. Talk over the regions.

**Use on:** `030-ideas-in-space` *(already in place)*.

---

### 2 · Name every idea

```html
<deck-ideas-map mode="labels" label="Every idea named"></deck-ideas-map>
```

Same frozen layout, every node labelled. The "these are real words, and near
words are near each other" beat.

**Use on:** `050.1-words-are-similar`.

---

### 3 · One relationship, drawn as arrows

```html
<deck-ideas-map mode="labels" spotlight="capital-of" label="Capital of"></deck-ideas-map>
```

Draws that relation's arrows — **parallel and the same length**, because every
step of a rel shares one offset vector. Everything not in a pair drops to ~0.15.
Swap `capital-of` for any rel in the table above.

There is deliberately **no caption** on the arrows — narrate them.

**Use on:** `040.2-words-in-space` (this *is* the word2vec regularity that slide
is about) and `070-word-association-game` after the shouting round.

---

### 4 · The association web

```html
<deck-ideas-map mode="web" label="Everything is linked"></deck-ideas-map>
```

Fades in the edges over the frozen layout — **nothing moves**. Line thickness
carries each link's `weight`: `chef`–`restaurant` (0.9) draws heavy, `chef`–
`pasta` (0.25) draws light. 227 drawn links, mean degree 3.8.

**Use on:** `120-everything-is-linked`.

---

### 5 · Focus one area

```html
<deck-ideas-map mode="labels" scope="food" label="The food cluster"></deck-ideas-map>
```

Camera flies to fit that topic; out-of-scope ideas stay visible but muted, so
the cluster is seen *in context* rather than in isolation.

Softer alternative — lift some topics without moving the camera:

```html
<deck-ideas-map mode="labels" tag="food,professions"></deck-ideas-map>
```

**Use on:** `050.3-more-lay-examples`, or any slide where you want one domain.

---

### 6 · Ring specific ideas

```html
<deck-ideas-map mode="labels" highlight="chef,restaurant,gordon-ramsay"></deck-ideas-map>
```

Rings those nodes and brings their labels forward. Stacks with `scope` / `tag`.

---

### 7 · Build the topics up one at a time

```html
<deck-ideas-map mode="star-map" reveal="4"></deck-ideas-map>
```

Only the first N topics participate. Raise N across slides to grow the map.

**Use on:** `010-overview`, if you want the map to assemble as you introduce it.

---

### 8 · The context layers *(the three-layer build)*

```html
<deck-ideas-map show-links activate="general" constellation></deck-ideas-map>
<deck-ideas-map show-links activate="general,industry" constellation></deck-ideas-map>
<deck-ideas-map show-links activate="general,industry,specialist" constellation></deck-ideas-map>
```

Lights **4 → 8 → 11** ideas, and the attention fan always spreads from `chef` —
so the question never changes, each added layer just lights more of the map.
That is exactly what `170-context-builder` says in words.

You don't need `attention-from=`; `chef` is already the `from` focus for all
three contexts.

**Use on:** `170-context-builder`. See the fragment note below — three tags, not
one tag changed three times.

---

### 9 · The lit constellation

```html
<deck-ideas-map mode="constellation" label="A context, lit up"></deck-ideas-map>
```

Everything falls back to faint stars, one context lights, attention edges fan
between them and a dotted outline joins them.

**Use on:** `160-mental-shift` or `150-prompt-knows-nothing`.

---

### 10 · Let yourself drive it live

```html
<deck-ideas-map mode="star-map" controls="mode labels links vectors zoom"></deck-ideas-map>
```

Adds a small button column: cycle mode, flip labels, toggle the web, step
through relations, zoom in/out. Drop `starmap` from the list unless the slide
also sets `activate` — with nothing activated it just greys the whole map.

**Use on:** any slide you want to improvise over. Already on
`030-ideas-in-space`.

---

## Two things worth knowing before you paste

### Fragments don't change attributes

Nothing wires a Reveal fragment to an attribute change. So a multi-beat slide
needs **one tag per beat**, each its own fragment:

```html
<deck-ideas-map class="fragment" data-fragment-index="1" activate="general" constellation></deck-ideas-map>
<deck-ideas-map class="fragment" data-fragment-index="2" activate="general,industry" constellation></deck-ideas-map>
```

Each instance runs its own settle, but the seed is fixed — so they land on an
identical layout and it reads as one map changing. The alternative is the live
`controls` buttons (recipe 10).

### Making it fill the slide

The map caps itself at `72vh` by default. To fill a slide, give it the height
and lift the cap — it is one custom property, not a rewrite:

```html
<style>
	#your-slug { display: flex !important; flex-direction: column; height: 100%; padding: 0; }
	#your-slug > deck-ideas-map { flex: 1 1 auto; min-height: 0; --ideas-map-max-h: 100%; }
</style>
```

`display: flex !important` is needed because Reveal sets an inline
`display: block` on the current section. Size in **%** of the 1920×1080 slide
box — never `vw`/`vh`, which Reveal's `transform` scales a second time.

Add `data-hide-chrome` to the `<section>` if the deck footer overlaps the map.

---

## What the audience sees you do

These work on every recipe, no attributes needed:

| gesture | what happens |
|---|---|
| **left-click** a dot | camera flies to fit that idea's topic |
| **left-click** empty space | back out to the whole map |
| **right-click** a dot | constellation from that idea — walks the web 3 hops, dimming per hop and by link weight, rest fade to stars *(ctrl+click on macOS)* |
| **right-click** empty space | clear the constellation |
| **drag** a dot | pull it out; it springs back to its settled home |
| **drag** empty space | pan |
| **wheel** | zoom about the pointer |
| **click** a legend row | zoom to that topic |
