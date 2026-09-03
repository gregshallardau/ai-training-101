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
   overview/menu slide (e.g. `slides/01-overview.html`), read that too.

## Format heuristic

- prose / bullets / headings only -> `.md`
- scoped layout, a `<deck-*>` tag, or a fully-inlined artefact -> `.html`

## Procedure - new / structural

1. Resolve the target position to a `major`(.`minor`).
   - "insert between" / "before X": shift the prefix of X and every later sibling
     by +1 (zero-padded, step 1). Produce an explicit **rename list**
     (`git mv old new`), applied bottom-up so names never collide.
   - "vertical child of N": assign `N.M` with the next free `M`.
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
  (semantic custom properties only).

## Consistency

Prefer the `deck.css` utility classes (`.text-primary`, `.text-muted`,
`.text-center`, `.flex-cols`, `.flex-rows`, `.list-compact`, `.box`) over a
per-slide `<style>`. Never emit a per-slide `<style>` for anything reusable or a
bespoke component definition inside a slide - a non-trivial visual becomes a
`<deck-*>` via `artefact-builder`. Never edit `deck.css`, `src/styles/**`, or components from
this skill - a slide adapts to the framework's surfaces, it does not change them.
Say "CSS custom property" / "CSS variable", never "token", in any comment or note
you add. Slide *content* text may use "token" as the user wrote it.
