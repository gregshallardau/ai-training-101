---
name: slide-builder
description: >-
  Scaffold, edit, insert, reorder, or renumber slide files in slides/ for this
  reveal.js presentation framework. Use when the user says "add a slide", "insert
  a slide after/before X", "new slide about ...", "edit / rewrite / change slide
  X", "add bullets to X", "change X's title", "promote X to HTML", "reorder the
  slides", "renumber the deck", "split this slide into a vertical stack", or "make
  slide N a sub-slide of M". Produces one portable .md or .html file per slide and
  keeps its id/slug and overview-menu link consistent.
---

# slide-builder

**Before anything: read `docs/framework-conventions.md` and `docs/cheatsheet.md`.**

## The one hard rule: compose, never invent classes

A slide is built from exactly three things:

1. **semantic HTML elements** - `<dl>`/`<dt>`/`<dd>` for a glossary, `<table>`
   for a grid, `<strong>` for a term, `<hr>` for a rule, `<blockquote>` for a
   pull-quote, `<h2>`-`<h4>` for headings. The framework styles these already.
2. **the `deck.css` utility classes** - `.text-primary` `.text-muted`
   `.text-center` `.flex-cols` `.flex-rows` `.columns` `.columns-3`
   `.list-compact` `.box` (+ `.border` / `.bar`) `.chip`.
3. **the colour modifiers** - `.primary` `.secondary` `.success` `.danger`
   `.warning`, added after a block class.

That is the **entire** toolkit. You may **NOT** create a bespoke class family -
`.glossary-book` / `.glossary-entry` / `.card-title` / `.step-2` and the like -
**anywhere**:

- not in a per-slide `<style>`,
- not by adding a block to `deck.css`,
- not in `src/`.

A `.glossary-entry` that is just bold text is a `<strong>` (or a `<dt>`). If a
layout you need has no utility, it is one of:

- **a `<dl>` / `<table>` / `<hr>` you forgot exists** - use it;
- **a genuinely missing utility** - STOP, show the user the markup, and say "this
  needs one small utility added to `deck.css` (your call)". Do not add it yourself
  from this skill;
- **a real widget** (needs a library, JS, or is a reusable component) - STOP and
  tell the user to run `artefact-builder` for a `<deck-*>`.

| Rationalisation | Reality |
|---|---|
| "I'll put the classes in `deck.css` - that's the proper place" | `deck.css` is the framework's surface, not yours to extend from slide work. |
| "It's a reusable pattern, it deserves its own classes" | Reusable -> a `<deck-*>` component, or one utility the user approves. Never a family. |
| "A `<style>` block scoped to `#slug` is fine here" | Only for a genuinely one-off inline artefact (shape 3). A glossary is not that. |

## Modes

- **New / structural** - create a slide, insert between slides, reorder, renumber,
  split into a vertical stack.
- **Edit** - change the content of an existing slide: rewrite body, add/remove
  bullets, change the heading, add a scoped artefact, convert `.md` <-> `.html`.

## Inputs

- for a new slide: title / topic, target position ("after `architecture`",
  "position 3", "vertical child of 3", "end"), optional format hint (`.md` /
  `.html`), optional artefact description or existing `<deck-*>` name
- for an edit: which slide (slug, number, or "the one about X") + the change

## Read (detect state)

1. `docs/framework-conventions.md` and `slides/README.md`.
2. `slides/` listing -> parse every `NN(.M)-<slug>.<ext>` into an ordered model.
3. `index.html` - confirm `<!-- @slides -->` is present.
4. `src/components/registry.js` - **only if** the slide will use a `<deck-*>` tag.
   If the tag is not in `COMPONENTS`, stop and tell the user to run
   `artefact-builder` first.
5. **Edit mode:** read the target slide file itself; if the deck has an
   overview/menu slide (e.g. `slides/010-overview.html`), read that too.

## Format heuristic

- prose / bullets / headings only -> `.md`
- scoped layout, a `<deck-*>` tag, or a fully-inlined artefact -> `.html`

## Procedure - new / structural

1. Resolve the target position to a `major`(.`minor`).
   - "insert between" / "before X" / "after X": majors are step-10 with gaps
     left on purpose (see `slides/README.md`) - do **not** renumber the deck.
     Pick a free integer between the neighbours: the midpoint (rounded to the
     nearest free multiple of 10 if one is open), or the neighbour's value +1
     to slot immediately after it.
     - **Gap exhausted** (the neighbours are consecutive integers, e.g. `020`
       and `021` - no integer fits between them): rebalance that local run (or
       the whole deck if it's short) back to round step-10 numbers. Produce an
       explicit **rename list** (`git mv old new`), applied bottom-up so names
       never collide, then insert normally into the restored gaps. This is the
       only case that touches sibling files.
   - "vertical child of N": assign `N.M` with the next free `M` (minors stay
     step 1 - they're appended, not inserted into the middle).
2. Pick the format. Render the body from the slide-file templates in
   `docs/cheatsheet.md` ("Slide files").
   - `.html`: exactly one `<section id="<slug>" data-slug="<slug>">...`.
   - `.md`: raw Markdown, no wrapper (the plugin adds it). Use
     `<!-- .slide: ... -->` only if the slide needs Reveal attributes.
3. **Portability lint** (see below).
4. If an overview/menu slide exists, add one `<a href="#/<slug>">` link to it.
   Otherwise leave navigation alone.
5. Write the new file; apply the rename list.
6. Report: files created, files renamed, and confirm nothing else in the deck
   references the new or moved slides by `id`.

## Procedure - edit

1. Resolve the reference ("slide 7", "the one about vectors") to exactly one file.
   If it is ambiguous, ask.
2. Apply the requested content change to the body. Keep the existing `id` /
   `data-slug` and the filename unchanged unless the user explicitly asks to
   rename the slide.
3. **Format promotion:** if the edit introduces scoped layout, a `<deck-*>` tag,
   or an inline artefact, convert `.md` -> `.html` - wrap the body in
   `<section id="<slug>" data-slug="<slug>">`, carry the heading and content over,
   `git mv` the file to `.html`. (A `.html` slide never needs demoting to `.md`.)
4. **Portability lint** the new body (see below).
5. **Overview sync:** if the slide's visible heading changed and an overview/menu
   slide links this slug, update that link's **text** to match. Do not touch the
   `href` / slug unless the user asked for a rename (that is the structural mode's
   rename list).
6. **Rename requested:** if the user wants a new slug, hand off to the structural
   rename path - new filename, update `id`/`data-slug`, update the overview
   `href`, and check nothing else references the old `id`.
7. Report: file changed (and any `.md`->`.html` move), lint result, whether the
   overview link text was updated.

## Portability lint

Reject or warn on:

- `href="#/<other-slug>"` pointing at another slide (allowed only on the
  non-portable overview slide),
- any `import` inside an inline `<script>`,
- `document.currentScript` in an inline script (null once bundled - use
  `document.getElementById('<slug>')`),
- any `<deck-*>` tag not present in `registry.js`,
- any `var(--...)` that is a tier-1 primitive, or a raw colour / length literal
  (semantic custom properties only),
- any **class not in the toolkit above** - a `class="glossary-entry"` /
  `class="feature-card"` invented for this slide. Reject it: rewrite with
  semantic HTML + utilities, or stop per "The one hard rule".

## Consistency

Prefer the `deck.css` utility classes (`.text-primary`, `.text-muted`,
`.text-center`, `.flex-cols`, `.flex-rows`, `.list-compact`, `.box`) over a
per-slide `<style>`. Never emit a per-slide `<style>` for anything reusable or a
bespoke component definition inside a slide - a non-trivial visual becomes a
`<deck-*>` via `artefact-builder`. Never edit `deck.css`, `src/styles/**`, or components from
this skill - a slide adapts to the framework's surfaces, it does not change them.
Say "CSS custom property" / "CSS variable", never "token", in any comment or note
you add. Slide *content* text may use "token" as the user wrote it.
