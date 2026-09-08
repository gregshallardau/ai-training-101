# TODO — Association Game (hand-built SVG slides)

A build brief for a subagent. Standalone: **no component, no D3, no force
simulation.** Plain inline SVG inside normal Reveal sections, stepped with
Reveal fragments. Do **not** touch `components/ideas-map/` — that artefact is
separate and already done.

## The point of the slide

A relationship between two words is a **vector — a direction and a distance**.
Every pair in a group is joined by the *same* vector, so the arrows come out
visibly parallel and the same length. That is the whole lesson; the layout must
prove it rather than approximate it.

**Therefore the one hard rule:** never eyeball a target position.

```
target = source + V          (V is the group's shared vector)
```

Compute every target by adding the group's `V` to the source. If a reviewer
measures two arrows in a group and they differ, the slide is wrong.

## Coordinate system

Single `viewBox="0 0 1600 900"` per slide, `width="100%"`, `height="auto"`.
Origin top-left, y increases **downward** (so a negative `dy` points up).

Four groups, one per quadrant, each with its own shared vector:

| group | shared vector `V` | reads as | pairs |
|---|---|---|---|
| `gender` | `(200, 0)` | due right | girl→boy, sister→brother |
| `capital` | `(150, -90)` | up-right | France→Paris, Italy→Rome, Victoria→Melbourne, NSW→Sydney |
| `symbol` | `(110, 130)` | down-right | copper→Cu, zinc→Zn |
| `known-for` | `(-140, 120)` | down-left | Japan→sushi, Australia→Bunnings sausage |

The four directions are well separated so no two groups' arrows look alike.

### Source anchors, and the targets they imply

Targets below are already `source + V` — reproduce them by addition, and use
this table only to check your arithmetic.

| group | word | source | → | word | target |
|---|---|---|---|---|---|
| gender | girl | `180, 170` | | boy | `380, 170` |
| gender | sister | `180, 300` | | brother | `380, 300` |
| capital | France | `890, 200` | | Paris | `1040, 110` |
| capital | Italy | `890, 330` | | Rome | `1040, 240` |
| capital | Victoria | `1210, 200` | | Melbourne | `1360, 110` |
| capital | New South Wales | `1210, 330` | | Sydney | `1360, 240` |
| symbol | copper | `200, 560` | | Cu | `310, 690` |
| symbol | zinc | `450, 560` | | Zn | `560, 690` |
| known-for | Japan | `1240, 560` | | sushi | `1100, 680` |
| known-for | Australia | `1500, 560` | | Bunnings sausage | `1360, 680` |

## Drawing each element

- **dot** — `<circle r="10">`, filled with the group colour.
- **label** — `<text>` centred under its dot: `x = dot.x`, `y = dot.y + 34`,
  `text-anchor="middle"`, `font-size="26"`. Labels sit *below* dots so the
  `y=110` row never clips the top edge.
- **arrow** — `<line>` from source dot to target dot, `stroke-width="3"`, with a
  triangular `<marker>` arrowhead. Inset the line ~14px at each end so it starts
  and stops clear of the two circles rather than under them.

Group colours use **semantic custom properties only** — never a raw hex:
`gender` → `var(--success)`, `capital` → `var(--primary)`, `symbol` →
`var(--warning)`, `known-for` → `var(--danger)`. Labels `var(--fg)`, any
supporting text `var(--muted)`.

## Slides to produce

Three sections, following the deck's decimal convention (the game is `070`).
Create them with `node scripts/make-slide.js` rather than hand-numbering —
`slide-builder` owns numbering.

### `070.1` — the pairs, stepped live

The performing slide. You say the first word, the room shouts the second, you
press on to reveal it.

- **fragment 0** (always visible): all ten **source** dots + labels, plus the
  four group headings in `var(--muted)`, small caps.
- **fragments 1–10**: one per pair, in the running order below — each reveals
  that pair's **arrow + target dot + target label** together as one fragment.

Running order (matches how the room warms up — easy, then surprising):
`girl→boy`, `sister→brother`, `France→Paris`, `Italy→Rome`,
`Victoria→Melbourne`, `New South Wales→Sydney`, `copper→Cu`, `zinc→Zn`,
`Japan→sushi`, `Australia→Bunnings sausage`.

Use `class="fragment" data-fragment-index="N"` on a `<g>` wrapping each pair's
three elements, so one press reveals the whole pair.

### `070.2` — "it's the same arrow every time"

Static copy of the finished `070.1` picture, then:

- **fragment 1**: lift one `capital` arrow (say France→Paris) into a translucent
  ghost at `opacity 0.45`, and translate a copy of it onto Italy→Rome, then
  Victoria→Melbourne. It lands exactly on top, because it is the same vector.
- **fragment 2**: caption, centred, `var(--fg)`:
  **"Same direction. Same distance. Every time."**

A CSS `transform: translate()` transition on the ghost `<g>` is enough — this is
the "hand animation" part. Respect `@media (prefers-reduced-motion: reduce)` by
skipping straight to the final position.

### `070.3` — backwards, and the maths

- **fragment 1**: reverse one arrow — `Rome → Italy` — by flipping the marker to
  the other end. Caption: **"? ← Rome"**.
- **fragment 2**: `<code>x + 5 = 7</code>` with the caption
  **"Ideas go both ways. Solve for x."**
- **fragment 3**: the payoff line, large:
  **"It's just maths — a direction, and a distance."**

## Repo conventions to follow

- Section shape: `<section id="<slug>" data-slug="<slug>">…</section>`.
- Reveal scales a **1920×1080** slide box to the window; size in `%` of that
  box. Never `vw`/`vh` — Reveal's `transform` scales them a second time (and
  re-anchors `position: fixed` to the slides element).
- Semantic CSS custom properties only. No raw hex, no primitives.
- Prefer the deck's existing utility classes (`.text-muted`, `.text-center`,
  `.chip`, `.box`) over new CSS. Any SVG-specific rules a slide genuinely needs
  can go in a small `<style>` in that section — that restriction in
  `components/ideas-map/authoring.md` is about the **map component**, and does
  not govern a hand-drawn SVG that belongs to the slide itself.
- Put the speaker script in `<aside class="notes">` — reuse the existing notes
  in `slides/070-word-association-game.html`, which already describe the live
  game and the backwards round.

## Done when

- [ ] Every target position equals its source plus the group vector — checked by
      arithmetic, not by eye.
- [ ] Arrows within a group are provably parallel and equal length.
- [ ] `070.1` steps one pair per press, ten presses total, sources visible from
      the start.
- [ ] No raw colour literals; every colour is a semantic custom property.
- [ ] Nothing under `components/` was modified.
- [ ] `npm run lint:slides` passes.
