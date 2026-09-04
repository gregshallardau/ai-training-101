---
name: keyframe-builder
description: >-
  Design and build multi-click "keyframe" reveals inside a single slide -
  content that transforms in place across clicks (a placeholder becomes a
  picture, a question becomes an answer, a before becomes an after) instead of
  new content stacking up below. Use when the user says "keyframe slide",
  "reveal on click", "build this up step by step", "question then answer",
  "before/after slide", "swap in place", "don't have it appear below", or
  describes a slide where each click should change something already on
  screen rather than add something new underneath it.
---

# keyframe-builder

**Before anything: read `docs/framework-conventions.md` section 8 (vertical
stacks, fragments & images) and `docs/cheatsheet.md` ("Layout helpers" and
"Fragments (step-reveal)").**

## The principle

A keyframe reveal is a fixed layout that *changes state* on each click - it is
never a document that *grows* on each click.

1. **Lay out every slot before the first click.** Every element that will ever
   be on screen - including a placeholder like `?` or an empty box - exists in
   the DOM from frame one, positioned with `r-stack` / `r-hstack` / `r-vstack`
   or the `deck.css` flex/grid utilities. Nothing is inserted later; only
   fragments toggle.
2. **A click changes something, it doesn't add something.** Reveal (fade in),
   replace (swap within an `r-stack`), recolour (`highlight-*`), emphasise
   (`grow` / `shrink`), or remove (`fade-out`) - not "append a new paragraph
   below the last one." If a slide needs new real estate to appear, that's a
   vertical sub-slide (section 8), not a fragment.
3. **Pair synchronized changes with a shared `data-fragment-index`.** A `?`
   disappearing exactly as its answer appears is *one* click, one idea, two
   elements moving together - not two separate clicks.
4. **One click, one idea.** Count the fragments and count the beats in the
   spoken talk; they should match.

## The hard rule: compose, never invent

Everything above is built from primitives the framework and Reveal.js already
ship - **never** a new CSS class or a per-slide animation:

- **Layout (fixed, pre-click):** `r-stack` (children share one grid cell -
  the swap-in-place primitive), `r-hstack` / `r-vstack` (row / column, Reveal
  built-ins), `.flex-cols` / `.flex-rows` (deck.css). A plain `→` character
  (styled `.text-muted` if it should recede) is the arrow - there is no arrow
  utility and none is needed.
- **Step effects (on click):** `class="fragment"` and its variants - default
  (fade in), `fade-out`, `fade-up/down/left/right`, `grow`, `shrink`,
  `semi-fade-out`, `strike`, `highlight-red/green/blue`,
  `highlight-current-red/green/blue`. Full list and semantics: framework-conventions.md
  section 8.
- **Ordering:** `data-fragment-index="N"` (zero-based). Same index on two+
  elements = they fire on the same click.

If the desired effect genuinely isn't one of these (e.g. a 3D flip, a custom
easing curve) - **STOP** and tell the user this needs a small addition to
`src/styles/theme/fragments.css` (their call, same as any new `deck.css`
utility). Do not add new fragment CSS from this skill without that
confirmation.

## Recipes

See `reference/recipes.md` for worked HTML: question→answer swap (the
canonical case), sequential build-up in fixed slots, and before/after swap.
Each recipe is composed entirely from the primitives above.

## Procedure

1. Identify which recipe fits (or combine two - e.g. a build-up that ends in a
   swap).
2. Confirm the slide file and position with the user the way `slide-builder`
   would (existing slide to edit, or a new one - if new, hand the resolved
   position to `slide-builder`'s numbering, don't invent a filename scheme
   here).
3. Write the markup using only primitives from "The hard rule" above.
4. **Portability lint** (same as `slide-builder`): no bespoke classes, no
   `var(--...)` primitives, `→`/text only for the arrow, images under
   `public/` referenced root-relatively.
5. Report the fragment count and what each click does, so the user can check
   it against their spoken beats.
